from datetime import datetime, date, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.database import get_db
from app.models.user import User, RoleEnum
from app.models.employee import Employee
from app.models.leave import LeaveType, LeaveBalance, LeaveApplication
from app.models.attendance import AttendanceRecord
from app.schemas.leave import (
    LeaveTypeCreate, LeaveTypeResponse, LeaveBalanceResponse,
    LeaveApplyRequest, LeaveApprovalRequest, LeaveApplicationResponse
)
from app.auth.dependencies import (
    get_current_user, require_roles, verify_employee_access, log_audit_event
)

router = APIRouter(prefix="/leave", tags=["Leave & Absence Management"])

def format_application_response(app: LeaveApplication) -> LeaveApplicationResponse:
    emp_name = f"{app.employee.first_name} {app.employee.last_name}" if app.employee else "Unknown"
    dept_name = app.employee.department.name if app.employee and app.employee.department else "General"
    mgr_name = app.manager.full_name if app.manager else None
    hr_name = app.hr_approver.full_name if app.hr_approver else None

    return LeaveApplicationResponse(
        id=app.id,
        employee_id=app.employee_id,
        employee_name=emp_name,
        department_name=dept_name,
        leave_type_id=app.leave_type_id,
        leave_type_name=app.leave_type.name,
        leave_type_code=app.leave_type.code,
        start_date=app.start_date,
        end_date=app.end_date,
        is_half_day=app.is_half_day,
        half_day_session=app.half_day_session,
        days_count=app.days_count,
        reason=app.reason,
        status=app.status,
        manager_name=mgr_name,
        manager_status=app.manager_status,
        manager_comments=app.manager_comments,
        hr_approver_name=hr_name,
        hr_status=app.hr_status,
        hr_comments=app.hr_comments,
        created_at=app.created_at,
        updated_at=app.updated_at
    )

@router.get("/types", response_model=List[LeaveTypeResponse])
def list_leave_types(db: Session = Depends(get_db)):
    return db.query(LeaveType).all()

@router.post("/types", response_model=LeaveTypeResponse, status_code=status.HTTP_201_CREATED)
def create_leave_type(
    data: LeaveTypeCreate,
    current_user: User = Depends(require_roles([RoleEnum.SUPER_ADMIN, RoleEnum.HR_MANAGER])),
    db: Session = Depends(get_db)
):
    if db.query(LeaveType).filter(LeaveType.code == data.code).first():
        raise HTTPException(status_code=400, detail=f"Leave type code '{data.code}' already exists.")

    lt = LeaveType(
        name=data.name,
        code=data.code.upper(),
        annual_quota=data.annual_quota,
        is_carry_forward=data.is_carry_forward,
        max_carry_forward=data.max_carry_forward,
        is_paid=data.is_paid,
        description=data.description
    )
    db.add(lt)
    db.commit()
    db.refresh(lt)
    return lt

@router.get("/balances", response_model=List[LeaveBalanceResponse])
def get_leave_balances(
    employee_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_id = employee_id
    if current_user.role == RoleEnum.EMPLOYEE.value or not target_id:
        target_id = current_user.employee_profile.id if current_user.employee_profile else -1
    else:
        verify_employee_access(target_id, current_user, db)

    year = datetime.utcnow().year
    balances = db.query(LeaveBalance).filter(
        LeaveBalance.employee_id == target_id,
        LeaveBalance.year == year
    ).all()

    # If no balances exist yet, auto-provision default balances from LeaveType table
    if not balances and target_id > 0:
        all_types = db.query(LeaveType).all()
        for lt in all_types:
            bal = LeaveBalance(
                employee_id=target_id,
                leave_type_id=lt.id,
                year=year,
                allocated=float(lt.annual_quota),
                used=0.0,
                pending=0.0,
                remaining=float(lt.annual_quota)
            )
            db.add(bal)
        db.commit()
        balances = db.query(LeaveBalance).filter(
            LeaveBalance.employee_id == target_id,
            LeaveBalance.year == year
        ).all()

    return [
        LeaveBalanceResponse(
            id=b.id,
            employee_id=b.employee_id,
            leave_type_id=b.leave_type_id,
            leave_type_name=b.leave_type.name,
            leave_type_code=b.leave_type.code,
            year=b.year,
            allocated=b.allocated,
            used=b.used,
            pending=b.pending,
            remaining=b.remaining
        ) for b in balances
    ]

@router.post("/apply", response_model=LeaveApplicationResponse, status_code=status.HTTP_201_CREATED)
def apply_leave(
    data: LeaveApplyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.employee_profile:
        raise HTTPException(status_code=400, detail="Account is not associated with an active employee profile.")

    emp_id = current_user.employee_profile.id

    if data.end_date < data.start_date:
        raise HTTPException(status_code=400, detail="Invalid date range: End date cannot be before start date.")

    # Calculate days count
    if data.is_half_day:
        if data.start_date != data.end_date:
            raise HTTPException(status_code=400, detail="Half day leaves must be within a single date.")
        days_count = 0.5
    else:
        days_count = float((data.end_date - data.start_date).days + 1)

    # Overlap validation: check if overlapping with an existing pending or approved leave
    overlap = db.query(LeaveApplication).filter(
        LeaveApplication.employee_id == emp_id,
        LeaveApplication.status.in_(["PENDING_MANAGER", "PENDING_HR", "APPROVED"]),
        or_(
            and_(LeaveApplication.start_date <= data.start_date, LeaveApplication.end_date >= data.start_date),
            and_(LeaveApplication.start_date <= data.end_date, LeaveApplication.end_date >= data.end_date),
            and_(LeaveApplication.start_date >= data.start_date, LeaveApplication.end_date <= data.end_date)
        )
    ).first()

    if overlap:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Overlap detected: You already have a {overlap.status} leave application for this date period ({overlap.start_date} to {overlap.end_date})."
        )

    # Balance check
    year = data.start_date.year
    bal = db.query(LeaveBalance).filter(
        LeaveBalance.employee_id == emp_id,
        LeaveBalance.leave_type_id == data.leave_type_id,
        LeaveBalance.year == year
    ).first()

    if bal and bal.remaining < days_count:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient leave balance: Requested {days_count} days, but only {bal.remaining} days remaining."
        )

    # Safe transactional reservation
    if bal:
        bal.pending += days_count
        bal.remaining -= days_count

    application = LeaveApplication(
        employee_id=emp_id,
        leave_type_id=data.leave_type_id,
        start_date=data.start_date,
        end_date=data.end_date,
        is_half_day=data.is_half_day,
        half_day_session=data.half_day_session,
        days_count=days_count,
        reason=data.reason,
        status="PENDING_MANAGER"
    )
    db.add(application)
    db.commit()
    db.refresh(application)

    log_audit_event(
        db=db,
        actor=current_user,
        action="APPLY_LEAVE",
        entity_type="LEAVE_APPLICATION",
        entity_id=str(application.id),
        details=f"Applied for {days_count} days {application.leave_type.name} from {data.start_date} to {data.end_date}"
    )

    return format_application_response(application)

@router.get("/applications", response_model=List[LeaveApplicationResponse])
def list_applications(
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(LeaveApplication)

    if current_user.role == RoleEnum.EMPLOYEE.value:
        emp_id = current_user.employee_profile.id if current_user.employee_profile else -1
        query = query.filter(LeaveApplication.employee_id == emp_id)
    elif current_user.role == RoleEnum.DEPT_MANAGER.value and current_user.department_id:
        dept_emp_ids = [e.id for e in db.query(Employee.id).filter(Employee.department_id == current_user.department_id).all()]
        query = query.filter(LeaveApplication.employee_id.in_(dept_emp_ids))

    if status_filter:
        query = query.filter(LeaveApplication.status == status_filter)

    apps = query.order_by(LeaveApplication.created_at.desc()).all()
    return [format_application_response(a) for a in apps]

@router.put("/applications/{application_id}/review", response_model=LeaveApplicationResponse)
def review_application(
    application_id: int,
    data: LeaveApprovalRequest,
    current_user: User = Depends(require_roles([RoleEnum.SUPER_ADMIN, RoleEnum.HR_MANAGER, RoleEnum.DEPT_MANAGER])),
    db: Session = Depends(get_db)
):
    app = db.query(LeaveApplication).filter(LeaveApplication.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Leave application not found.")

    if app.status in ["APPROVED", "REJECTED", "CANCELLED"]:
        raise HTTPException(status_code=400, detail=f"Application is already finalized with status: {app.status}")

    year = app.start_date.year
    bal = db.query(LeaveBalance).filter(
        LeaveBalance.employee_id == app.employee_id,
        LeaveBalance.leave_type_id == app.leave_type_id,
        LeaveBalance.year == year
    ).first()

    if data.status == "APPROVED":
        # Final approval: update balance
        if bal:
            bal.pending = max(0.0, bal.pending - app.days_count)
            bal.used += app.days_count

        app.status = "APPROVED"
        app.manager_id = current_user.id
        app.manager_status = "APPROVED"
        app.manager_comments = data.comments or "Approved"

        # Connected Business Workflow: Sync with Attendance records!
        # Automatically mark attendance for the leave span as ON_LEAVE
        cur_date = app.start_date
        while cur_date <= app.end_date:
            rec = db.query(AttendanceRecord).filter(
                AttendanceRecord.employee_id == app.employee_id,
                AttendanceRecord.date == cur_date
            ).first()

            if not rec:
                rec = AttendanceRecord(
                    employee_id=app.employee_id,
                    date=cur_date,
                    status="ON_LEAVE",
                    notes=f"Approved Leave: {app.leave_type.name}"
                )
                db.add(rec)
            else:
                rec.status = "ON_LEAVE"
                rec.notes = (rec.notes or "") + f" [Approved Leave: {app.leave_type.name}]"

            cur_date += timedelta(days=1)

    elif data.status == "REJECTED":
        # Rollback balance reservation
        if bal:
            bal.pending = max(0.0, bal.pending - app.days_count)
            bal.remaining += app.days_count

        app.status = "REJECTED"
        app.manager_id = current_user.id
        app.manager_status = "REJECTED"
        app.manager_comments = data.comments or "Rejected"

    db.commit()
    db.refresh(app)

    log_audit_event(
        db=db,
        actor=current_user,
        action="REVIEW_LEAVE",
        entity_type="LEAVE_APPLICATION",
        entity_id=str(app.id),
        details=f"Leave application #{app.id} marked {data.status} by {current_user.full_name}"
    )

    return format_application_response(app)
