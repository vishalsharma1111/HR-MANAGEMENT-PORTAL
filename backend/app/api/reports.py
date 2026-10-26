import csv
import io
from datetime import datetime, date
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.user import User, RoleEnum
from app.models.employee import Employee
from app.models.department import Department
from app.models.attendance import AttendanceRecord
from app.models.leave import LeaveApplication, LeaveType, LeaveBalance
from app.models.payroll import PayrollRun, Payslip
from app.models.recruitment import JobRequisition, Candidate
from app.models.performance import Goal, PerformanceReview, CourseEnrollment
from app.models.expenses import ExpenseClaim, HelpdeskTicket
from app.auth.dependencies import get_current_user, require_roles

router = APIRouter(prefix="/reports", tags=["Enterprise BI Reports & Analytics"])

# 1. Headcount & Attrition Report
@router.get("/headcount")
def get_headcount_report(
    department_id: Optional[int] = None,
    current_user: User = Depends(require_roles([RoleEnum.SUPER_ADMIN, RoleEnum.HR_MANAGER, RoleEnum.DEPT_MANAGER])),
    db: Session = Depends(get_db)
):
    query = db.query(Employee)
    if department_id:
        query = query.filter(Employee.department_id == department_id)

    total = query.count()
    active = query.filter(Employee.status == "Active").count()
    probation = query.filter(Employee.status == "Probation").count()
    onboarding = query.filter(Employee.status == "Onboarding").count()
    exited = query.filter(Employee.status.in_(["Terminated", "Resigned"])).count()
    attrition_rate = round((exited / total * 100), 2) if total > 0 else 0.0

    dept_stats = (
        db.query(Department.name, func.count(Employee.id))
        .outerjoin(Employee, Department.id == Employee.department_id)
        .group_by(Department.id)
        .all()
    )

    return {
        "total_workforce": total,
        "active_employees": active,
        "probation": probation,
        "onboarding": onboarding,
        "exited": exited,
        "attrition_rate_percentage": attrition_rate,
        "by_department": [{"department": name, "count": cnt} for name, cnt in dept_stats]
    }

# 2. Attendance & Absenteeism Report
@router.get("/attendance")
def get_attendance_report(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user: User = Depends(require_roles([RoleEnum.SUPER_ADMIN, RoleEnum.HR_MANAGER, RoleEnum.DEPT_MANAGER])),
    db: Session = Depends(get_db)
):
    query = db.query(AttendanceRecord)
    if start_date:
        query = query.filter(AttendanceRecord.date >= start_date)
    if end_date:
        query = query.filter(AttendanceRecord.date <= end_date)

    total_records = query.count()
    present_records = query.filter(AttendanceRecord.status == "PRESENT").count()
    absent_records = query.filter(AttendanceRecord.status == "ABSENT").count()
    half_day_records = query.filter(AttendanceRecord.status == "HALF_DAY").count()
    leave_records = query.filter(AttendanceRecord.status == "ON_LEAVE").count()
    late_arrivals = query.filter(AttendanceRecord.is_late == True).count()
    total_hours = db.query(func.sum(AttendanceRecord.total_hours)).scalar() or 0.0
    total_ot_hours = db.query(func.sum(AttendanceRecord.overtime_hours)).scalar() or 0.0

    absenteeism_rate = round((absent_records / total_records * 100), 2) if total_records > 0 else 0.0
    present_rate = round((present_records / total_records * 100), 2) if total_records > 0 else 0.0

    return {
        "total_records": total_records,
        "present": present_records,
        "absent": absent_records,
        "half_day": half_day_records,
        "on_leave": leave_records,
        "late_arrivals": late_arrivals,
        "absenteeism_rate_percentage": absenteeism_rate,
        "present_rate": present_rate,
        "cumulative_work_hours": round(total_hours, 1),
        "cumulative_overtime_hours": round(total_ot_hours, 1)
    }

# 3. Leave Utilization Report
@router.get("/leave-utilization")
def get_leave_utilization_report(
    year: Optional[int] = None,
    current_user: User = Depends(require_roles([RoleEnum.SUPER_ADMIN, RoleEnum.HR_MANAGER])),
    db: Session = Depends(get_db)
):
    cur_year = year or datetime.utcnow().year
    balances = db.query(LeaveBalance).filter(LeaveBalance.year == cur_year).all()

    total_allocated = sum(b.allocated for b in balances)
    total_used = sum(b.used for b in balances)
    total_remaining = sum(b.remaining for b in balances)
    utilization_rate = round((total_used / total_allocated * 100), 2) if total_allocated > 0 else 0.0

    by_type = (
        db.query(LeaveType.name, func.sum(LeaveBalance.used), func.sum(LeaveBalance.allocated))
        .join(LeaveBalance, LeaveType.id == LeaveBalance.leave_type_id)
        .filter(LeaveBalance.year == cur_year)
        .group_by(LeaveType.id)
        .all()
    )

    return {
        "year": cur_year,
        "total_allocated_days": total_allocated,
        "total_utilized_days": total_used,
        "total_remaining_days": total_remaining,
        "utilization_rate_percentage": utilization_rate,
        "by_type": [
            {"leave_type": name, "used": u or 0, "allocated": a or 0} for name, u, a in by_type
        ]
    }

# 4. Payroll Summary Report
@router.get("/payroll-summary")
def get_payroll_summary_report(
    year: Optional[int] = None,
    current_user: User = Depends(require_roles([RoleEnum.SUPER_ADMIN, RoleEnum.HR_MANAGER, RoleEnum.PAYROLL_OFFICER])),
    db: Session = Depends(get_db)
):
    cur_year = year or datetime.utcnow().year
    runs = db.query(PayrollRun).filter(PayrollRun.year == cur_year).all()

    total_disbursed = sum(r.total_net for r in runs)
    total_taxes = sum(r.total_deductions for r in runs)
    total_gross = sum(r.total_gross for r in runs)

    return {
        "year": cur_year,
        "payroll_runs_count": len(runs),
        "total_gross_expenditure": round(total_gross, 2),
        "total_statutory_deductions": round(total_taxes, 2),
        "total_net_disbursed": round(total_disbursed, 2),
        "monthly_breakdown": [
            {
                "month": r.month,
                "title": r.title,
                "gross": r.total_gross,
                "deductions": r.total_deductions,
                "net": r.total_net,
                "status": r.status,
                "employees": r.employees_count
            } for r in runs
        ]
    }

# 5. Recruitment Funnel Conversion Report
@router.get("/recruitment-funnel")
def get_recruitment_funnel_report(
    current_user: User = Depends(require_roles([RoleEnum.SUPER_ADMIN, RoleEnum.HR_MANAGER, RoleEnum.RECRUITER])),
    db: Session = Depends(get_db)
):
    stages = ["APPLIED", "SCREENING", "INTERVIEW", "OFFER", "HIRED", "REJECTED"]
    counts = {}
    for st in stages:
        counts[st] = db.query(Candidate).filter(Candidate.stage == st).count()

    total_candidates = sum(counts.values())
    hire_conversion_rate = round((counts["HIRED"] / total_candidates * 100), 2) if total_candidates > 0 else 0.0

    return {
        "total_applications": total_candidates,
        "hired_count": counts["HIRED"],
        "hire_conversion_rate_percentage": hire_conversion_rate,
        "funnel_stages": [{"stage": st, "count": counts[st]} for st in stages]
    }

# 6. CSV Export Endpoints (Real Data Streaming)
@router.get("/export-csv/{report_type}")
def export_report_csv(
    report_type: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    output = io.StringIO()
    writer = csv.writer(output)

    if report_type == "employees":
        writer.writerow(["Employee ID", "First Name", "Last Name", "Email", "Department", "Designation", "Status", "Joining Date"])
        emps = db.query(Employee).all()
        for e in emps:
            dept = e.department.name if e.department else "N/A"
            desig = e.designation.title if e.designation else "N/A"
            writer.writerow([e.employee_id, e.first_name, e.last_name, e.email, dept, desig, e.status, e.joining_date])

    elif report_type == "attendance":
        writer.writerow(["Date", "Employee ID", "Employee Name", "Check In", "Check Out", "Total Hours", "Status", "Late (Mins)"])
        records = db.query(AttendanceRecord).order_by(AttendanceRecord.date.desc()).limit(500).all()
        for r in records:
            emp_name = f"{r.employee.first_name} {r.employee.last_name}" if r.employee else "Unknown"
            emp_id = r.employee.employee_id if r.employee else "N/A"
            writer.writerow([r.date, emp_id, emp_name, r.check_in, r.check_out, r.total_hours, r.status, r.late_minutes])

    elif report_type == "payroll":
        writer.writerow(["Month/Year", "Employee Code", "Employee Name", "Gross Pay", "PF Deduction", "ESI Deduction", "Tax", "Net Pay"])
        slips = db.query(Payslip).order_by(Payslip.year.desc(), Payslip.month.desc()).all()
        for s in slips:
            emp_name = f"{s.employee.first_name} {s.employee.last_name}" if s.employee else "Unknown"
            emp_code = s.employee.employee_id if s.employee else "N/A"
            writer.writerow([f"{s.month}/{s.year}", emp_code, emp_name, s.gross_pay, s.pf_deduction, s.esi_deduction, s.tds_deduction, s.net_pay])

    else:
        raise HTTPException(status_code=400, detail="Invalid report export type. Supported: employees, attendance, payroll")

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=hrms_{report_type}_report.csv"}
    )
