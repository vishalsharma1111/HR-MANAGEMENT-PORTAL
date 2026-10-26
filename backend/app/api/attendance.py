from datetime import datetime, date, time, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, func

from app.database import get_db
from app.models.user import User, RoleEnum
from app.models.employee import Employee
from app.models.attendance import (
    Shift, AttendanceRecord, AttendanceCorrection, HolidayCalendar, 
    Timesheet, TimesheetEntry
)
from app.schemas.attendance import (
    CheckInOutRequest, AttendanceRecordResponse, AttendanceCorrectionCreate,
    AttendanceCorrectionReview, AttendanceCorrectionResponse, ShiftCreate, 
    ShiftResponse, HolidayCreate, HolidayResponse, TimesheetCreate, 
    TimesheetResponse, AttendanceSummaryResponse
)
from app.auth.dependencies import (
    get_current_user, require_roles, verify_employee_access, log_audit_event
)

router = APIRouter(prefix="/attendance", tags=["Attendance & Workforce Management"])

def format_attendance_response(rec: AttendanceRecord) -> AttendanceRecordResponse:
    emp_name = f"{rec.employee.first_name} {rec.employee.last_name}" if rec.employee else "Unknown"
    return AttendanceRecordResponse(
        id=rec.id,
        employee_id=rec.employee_id,
        employee_name=emp_name,
        date=rec.date,
        check_in=rec.check_in,
        check_out=rec.check_out,
        total_hours=rec.total_hours,
        status=rec.status,
        is_late=rec.is_late,
        late_minutes=rec.late_minutes,
        overtime_hours=rec.overtime_hours,
        notes=rec.notes,
        created_at=rec.created_at,
        updated_at=rec.updated_at
    )

@router.get("/today", response_model=Optional[AttendanceRecordResponse])
def get_today_attendance(
    employee_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_id = employee_id if employee_id is not None else (current_user.employee_profile.id if current_user.employee_profile else None)
    if not target_id:
        return None
    emp = verify_employee_access(target_id, current_user, db)
    record = db.query(AttendanceRecord).filter(
        AttendanceRecord.employee_id == emp.id,
        AttendanceRecord.date == date.today()
    ).first()
    if not record:
        return None
    return format_attendance_response(record)

@router.post("/check-in", response_model=AttendanceRecordResponse)
def check_in(
    data: CheckInOutRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify access: employees can only check in for themselves unless Admin
    target_id = data.employee_id if data.employee_id is not None else (current_user.employee_profile.id if current_user.employee_profile else None)
    if not target_id:
        raise HTTPException(status_code=400, detail="Account is not associated with an employee profile.")
    emp = verify_employee_access(target_id, current_user, db)
    today = date.today()
    now = datetime.utcnow()

    record = db.query(AttendanceRecord).filter(
        AttendanceRecord.employee_id == emp.id,
        AttendanceRecord.date == today
    ).first()

    if record:
        if record.check_in is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Duplicate punch prevented: You have already checked in for today."
            )
    else:
        record = AttendanceRecord(
            employee_id=emp.id,
            date=today,
            status="PRESENT"
        )
        db.add(record)

    record.check_in = now
    
    # Calculate late arrival based on shift start (default 9:00 AM + 15m grace)
    shift = db.query(Shift).filter(Shift.is_active == True).first()
    expected_start = shift.start_time if shift else time(9, 0)
    grace = shift.grace_period_mins if shift else 15
    
    current_time = now.time()
    cutoff_time = time(expected_start.hour, expected_start.minute + grace)
    
    if current_time > cutoff_time:
        record.is_late = True
        diff_mins = (now.hour * 60 + now.minute) - (expected_start.hour * 60 + expected_start.minute)
        record.late_minutes = max(0, diff_mins)

    if data.notes:
        record.notes = (record.notes or "") + f" [Check-in Note: {data.notes}]"

    db.commit()
    db.refresh(record)

    log_audit_event(
        db=db,
        actor=current_user,
        action="CHECK_IN",
        entity_type="ATTENDANCE",
        entity_id=str(record.id),
        details=f"Employee {emp.employee_id} checked in at {now.strftime('%H:%M:%S')}"
    )

    return format_attendance_response(record)

@router.post("/check-out", response_model=AttendanceRecordResponse)
def check_out(
    data: CheckInOutRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_id = data.employee_id if data.employee_id is not None else (current_user.employee_profile.id if current_user.employee_profile else None)
    if not target_id:
        raise HTTPException(status_code=400, detail="Account is not associated with an employee profile.")
    emp = verify_employee_access(target_id, current_user, db)
    today = date.today()
    now = datetime.utcnow()

    record = db.query(AttendanceRecord).filter(
        AttendanceRecord.employee_id == emp.id,
        AttendanceRecord.date == today
    ).first()

    if not record or record.check_in is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid state transition: Cannot check out without an active check-in for today."
        )

    if record.check_out is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Duplicate punch prevented: You have already checked out for today."
        )

    record.check_out = now
    duration = (now - record.check_in).total_seconds() / 3600.0
    record.total_hours = round(duration, 2)

    # Overtime calculation (hours over 8.0)
    if record.total_hours > 8.0:
        record.overtime_hours = round(record.total_hours - 8.0, 2)

    if record.total_hours < 4.0:
        record.status = "HALF_DAY"

    if data.notes:
        record.notes = (record.notes or "") + f" [Check-out Note: {data.notes}]"

    db.commit()
    db.refresh(record)

    log_audit_event(
        db=db,
        actor=current_user,
        action="CHECK_OUT",
        entity_type="ATTENDANCE",
        entity_id=str(record.id),
        details=f"Employee {emp.employee_id} checked out. Total duration: {record.total_hours}h"
    )

    return format_attendance_response(record)

@router.get("/history", response_model=List[AttendanceRecordResponse])
def get_attendance_history(
    employee_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(AttendanceRecord)

    if employee_id:
        verify_employee_access(employee_id, current_user, db)
        query = query.filter(AttendanceRecord.employee_id == employee_id)
    else:
        if current_user.role == RoleEnum.DEPT_MANAGER.value and current_user.department_id:
            dept_emp_ids = [e.id for e in db.query(Employee.id).filter(Employee.department_id == current_user.department_id).all()]
            query = query.filter(AttendanceRecord.employee_id.in_(dept_emp_ids))
        elif current_user.role == RoleEnum.EMPLOYEE.value:
            emp_id = current_user.employee_profile.id if current_user.employee_profile else -1
            query = query.filter(AttendanceRecord.employee_id == emp_id)

    if start_date:
        query = query.filter(AttendanceRecord.date >= start_date)
    if end_date:
        query = query.filter(AttendanceRecord.date <= end_date)
    if status_filter:
        query = query.filter(AttendanceRecord.status == status_filter)

    records = query.order_by(AttendanceRecord.date.desc()).limit(200).all()
    return [format_attendance_response(r) for r in records]

@router.get("/summary", response_model=AttendanceSummaryResponse)
def get_attendance_summary(
    employee_id: Optional[int] = None,
    month: Optional[int] = None,
    year: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_emp_id = employee_id
    if current_user.role == RoleEnum.EMPLOYEE.value or not target_emp_id:
        target_emp_id = current_user.employee_profile.id if current_user.employee_profile else 1

    query = db.query(AttendanceRecord).filter(AttendanceRecord.employee_id == target_emp_id)

    cur_year = year or datetime.utcnow().year
    cur_month = month or datetime.utcnow().month
    
    # Filter by month/year
    start_of_month = date(cur_year, cur_month, 1)
    if cur_month == 12:
        end_of_month = date(cur_year + 1, 1, 1) - timedelta(days=1)
    else:
        end_of_month = date(cur_year, cur_month + 1, 1) - timedelta(days=1)

    query = query.filter(AttendanceRecord.date >= start_of_month, AttendanceRecord.date <= end_of_month)
    records = query.all()

    total_days = len(records)
    present_days = sum(1 for r in records if r.status in ["PRESENT", "HALF_DAY"])
    absent_days = sum(1 for r in records if r.status == "ABSENT")
    leave_days = sum(1 for r in records if r.status == "ON_LEAVE")
    late_days = sum(1 for r in records if r.is_late)
    total_hours = sum(r.total_hours for r in records)
    ot_hours = sum(r.overtime_hours for r in records)
    avg_hours = round(total_hours / present_days, 1) if present_days > 0 else 0.0

    return AttendanceSummaryResponse(
        total_days=total_days,
        present_days=present_days,
        absent_days=absent_days,
        late_days=late_days,
        leave_days=leave_days,
        total_work_hours=round(total_hours, 1),
        average_hours_per_day=avg_hours,
        overtime_hours=round(ot_hours, 1)
    )

# --- Attendance Correction Workflow ---

@router.post("/corrections", response_model=AttendanceCorrectionResponse, status_code=status.HTTP_201_CREATED)
def request_attendance_correction(
    data: AttendanceCorrectionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.employee_profile:
        raise HTTPException(status_code=400, detail="User account is not linked to an employee profile.")

    emp_id = current_user.employee_profile.id
    existing_record = db.query(AttendanceRecord).filter(
        AttendanceRecord.employee_id == emp_id,
        AttendanceRecord.date == data.date
    ).first()

    correction = AttendanceCorrection(
        employee_id=emp_id,
        attendance_record_id=existing_record.id if existing_record else None,
        date=data.date,
        requested_check_in=data.requested_check_in,
        requested_check_out=data.requested_check_out,
        reason=data.reason,
        status="PENDING"
    )
    db.add(correction)
    db.commit()
    db.refresh(correction)

    log_audit_event(
        db=db,
        actor=current_user,
        action="CREATE",
        entity_type="ATTENDANCE_CORRECTION",
        entity_id=str(correction.id),
        details=f"Correction requested for date {data.date}: {data.reason}"
    )

    return AttendanceCorrectionResponse(
        id=correction.id,
        employee_id=correction.employee_id,
        employee_name=f"{current_user.employee_profile.first_name} {current_user.employee_profile.last_name}",
        attendance_record_id=correction.attendance_record_id,
        date=correction.date,
        requested_check_in=correction.requested_check_in,
        requested_check_out=correction.requested_check_out,
        reason=correction.reason,
        status=correction.status,
        created_at=correction.created_at
    )

@router.get("/corrections", response_model=List[AttendanceCorrectionResponse])
def list_corrections(
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(AttendanceCorrection)

    if current_user.role == RoleEnum.EMPLOYEE.value:
        emp_id = current_user.employee_profile.id if current_user.employee_profile else -1
        query = query.filter(AttendanceCorrection.employee_id == emp_id)
    elif current_user.role == RoleEnum.DEPT_MANAGER.value and current_user.department_id:
        dept_emp_ids = [e.id for e in db.query(Employee.id).filter(Employee.department_id == current_user.department_id).all()]
        query = query.filter(AttendanceCorrection.employee_id.in_(dept_emp_ids))

    if status_filter:
        query = query.filter(AttendanceCorrection.status == status_filter)

    items = query.order_by(AttendanceCorrection.created_at.desc()).all()
    return [
        AttendanceCorrectionResponse(
            id=c.id,
            employee_id=c.employee_id,
            employee_name=f"{c.employee.first_name} {c.employee.last_name}" if c.employee else "Unknown",
            attendance_record_id=c.attendance_record_id,
            date=c.date,
            requested_check_in=c.requested_check_in,
            requested_check_out=c.requested_check_out,
            reason=c.reason,
            status=c.status,
            reviewer_id=c.reviewer_id,
            reviewer_name=c.reviewer.full_name if c.reviewer else None,
            review_notes=c.review_notes,
            created_at=c.created_at,
            reviewed_at=c.reviewed_at
        ) for c in items
    ]

@router.put("/corrections/{correction_id}/review", response_model=AttendanceCorrectionResponse)
def review_correction(
    correction_id: int,
    data: AttendanceCorrectionReview,
    current_user: User = Depends(require_roles([RoleEnum.SUPER_ADMIN, RoleEnum.HR_MANAGER, RoleEnum.DEPT_MANAGER])),
    db: Session = Depends(get_db)
):
    correction = db.query(AttendanceCorrection).filter(AttendanceCorrection.id == correction_id).first()
    if not correction:
        raise HTTPException(status_code=404, detail="Correction request not found")

    correction.status = data.status
    correction.reviewer_id = current_user.id
    correction.review_notes = data.review_notes
    correction.reviewed_at = datetime.utcnow()

    # Integrated Workflow: If APPROVED, directly update the target AttendanceRecord!
    if data.status == "APPROVED":
        record = db.query(AttendanceRecord).filter(
            AttendanceRecord.employee_id == correction.employee_id,
            AttendanceRecord.date == correction.date
        ).first()

        if not record:
            record = AttendanceRecord(
                employee_id=correction.employee_id,
                date=correction.date,
                status="PRESENT"
            )
            db.add(record)

        if correction.requested_check_in:
            record.check_in = correction.requested_check_in
            record.is_late = False
            record.late_minutes = 0
        if correction.requested_check_out:
            record.check_out = correction.requested_check_out

        if record.check_in and record.check_out:
            duration = (record.check_out - record.check_in).total_seconds() / 3600.0
            record.total_hours = round(duration, 2)
            record.status = "PRESENT" if record.total_hours >= 4.0 else "HALF_DAY"

        record.notes = (record.notes or "") + f" [Corrected & Approved by {current_user.full_name}]"
        correction.attendance_record_id = record.id

    db.commit()
    db.refresh(correction)

    log_audit_event(
        db=db,
        actor=current_user,
        action="UPDATE",
        entity_type="ATTENDANCE_CORRECTION",
        entity_id=str(correction.id),
        details=f"Correction {data.status} for Employee #{correction.employee_id} on {correction.date}"
    )

    return AttendanceCorrectionResponse(
        id=correction.id,
        employee_id=correction.employee_id,
        employee_name=f"{correction.employee.first_name} {correction.employee.last_name}" if correction.employee else "Unknown",
        attendance_record_id=correction.attendance_record_id,
        date=correction.date,
        requested_check_in=correction.requested_check_in,
        requested_check_out=correction.requested_check_out,
        reason=correction.reason,
        status=correction.status,
        reviewer_id=correction.reviewer_id,
        reviewer_name=current_user.full_name,
        review_notes=correction.review_notes,
        created_at=correction.created_at,
        reviewed_at=correction.reviewed_at
    )

# --- Holiday Calendar & Shift Endpoints ---

@router.get("/holidays", response_model=List[HolidayResponse])
def list_holidays(db: Session = Depends(get_db)):
    return db.query(HolidayCalendar).order_by(HolidayCalendar.date.asc()).all()

@router.post("/holidays", response_model=HolidayResponse)
def add_holiday(
    data: HolidayCreate,
    current_user: User = Depends(require_roles([RoleEnum.SUPER_ADMIN, RoleEnum.HR_MANAGER])),
    db: Session = Depends(get_db)
):
    existing = db.query(HolidayCalendar).filter(HolidayCalendar.date == data.date).first()
    if existing:
        raise HTTPException(status_code=400, detail="A holiday is already scheduled on this date.")

    holiday = HolidayCalendar(
        name=data.name,
        date=data.date,
        holiday_type=data.holiday_type,
        description=data.description
    )
    db.add(holiday)
    db.commit()
    db.refresh(holiday)
    return holiday

@router.get("/shifts", response_model=List[ShiftResponse])
def list_shifts(db: Session = Depends(get_db)):
    return db.query(Shift).all()

# --- Timesheets Submission & Approval ---

@router.get("/timesheets", response_model=List[TimesheetResponse])
def list_timesheets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Timesheet)
    if current_user.role == RoleEnum.EMPLOYEE.value:
        emp_id = current_user.employee_profile.id if current_user.employee_profile else -1
        query = query.filter(Timesheet.employee_id == emp_id)
    elif current_user.role == RoleEnum.DEPT_MANAGER.value and current_user.department_id:
        dept_emp_ids = [e.id for e in db.query(Employee.id).filter(Employee.department_id == current_user.department_id).all()]
        query = query.filter(Timesheet.employee_id.in_(dept_emp_ids))

    sheets = query.order_by(Timesheet.week_start_date.desc()).all()
    results = []
    for s in sheets:
        emp_name = f"{s.employee.first_name} {s.employee.last_name}" if s.employee else "Unknown"
        rev_name = s.reviewer.full_name if s.reviewer else None
        results.append(TimesheetResponse(
            id=s.id,
            employee_id=s.employee_id,
            employee_name=emp_name,
            week_start_date=s.week_start_date,
            week_end_date=s.week_end_date,
            total_hours=s.total_hours,
            status=s.status,
            reviewer_name=rev_name,
            review_notes=s.review_notes,
            created_at=s.created_at,
            entries=[TimesheetEntryBase(
                project_name=e.project_name,
                task_description=e.task_description,
                date=e.date,
                hours=e.hours
            ) for e in s.entries]
        ))
    return results

@router.post("/timesheets", response_model=TimesheetResponse)
def submit_timesheet(
    data: TimesheetCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.employee_profile:
        raise HTTPException(status_code=400, detail="User account is not linked to an employee profile.")

    total_hrs = sum(e.hours for e in data.entries)
    ts = Timesheet(
        employee_id=current_user.employee_profile.id,
        week_start_date=data.week_start_date,
        week_end_date=data.week_end_date,
        total_hours=total_hrs,
        status="SUBMITTED"
    )
    db.add(ts)
    db.flush()

    for e in data.entries:
        entry = TimesheetEntry(
            timesheet_id=ts.id,
            project_name=e.project_name,
            task_description=e.task_description,
            date=e.date,
            hours=e.hours
        )
        db.add(entry)

    db.commit()
    db.refresh(ts)

    return TimesheetResponse(
        id=ts.id,
        employee_id=ts.employee_id,
        employee_name=current_user.full_name,
        week_start_date=ts.week_start_date,
        week_end_date=ts.week_end_date,
        total_hours=ts.total_hours,
        status=ts.status,
        created_at=ts.created_at,
        entries=[TimesheetEntryBase(
            project_name=en.project_name,
            task_description=en.task_description,
            date=en.date,
            hours=en.hours
        ) for en in ts.entries]
    )
