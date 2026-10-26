import calendar
from datetime import datetime, date, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.user import User, RoleEnum
from app.models.employee import Employee
from app.models.attendance import AttendanceRecord
from app.models.leave import LeaveApplication
from app.models.payroll import SalaryStructure, PayrollRun, Payslip, FullFinalSettlement
from app.models.expenses import ExpenseClaim
from app.schemas.payroll import (
    SalaryStructureCreate, SalaryStructureResponse, PayrollRunCreate,
    PayrollRunResponse, PayslipResponse, SettlementCreate, SettlementResponse
)
from app.auth.dependencies import (
    get_current_user, require_roles, verify_employee_access, log_audit_event
)

router = APIRouter(prefix="/payroll", tags=["Payroll & Compensation"])

def format_payslip_response(p: Payslip) -> PayslipResponse:
    emp_name = f"{p.employee.first_name} {p.employee.last_name}" if p.employee else "Unknown"
    emp_code = p.employee.employee_id if p.employee else "N/A"
    dept_name = p.employee.department.name if p.employee and p.employee.department else "General"
    desig_name = p.employee.designation.title if p.employee and p.employee.designation else "Staff"

    return PayslipResponse(
        id=p.id,
        payroll_run_id=p.payroll_run_id,
        employee_id=p.employee_id,
        employee_name=emp_name,
        employee_code=emp_code,
        department_name=dept_name,
        designation_title=desig_name,
        month=p.month,
        year=p.year,
        total_working_days=p.total_working_days,
        paid_days=p.paid_days,
        loss_of_pay_days=p.loss_of_pay_days,
        basic_earned=p.basic_earned,
        hra_earned=p.hra_earned,
        allowances_earned=p.allowances_earned,
        bonus_amount=p.bonus_amount,
        reimbursement_amount=p.reimbursement_amount,
        gross_pay=p.gross_pay,
        pf_deduction=p.pf_deduction,
        esi_deduction=p.esi_deduction,
        prof_tax_deduction=p.prof_tax_deduction,
        tds_deduction=p.tds_deduction,
        other_deductions=p.other_deductions,
        total_deductions=p.total_deductions,
        net_pay=p.net_pay,
        status=p.status,
        payment_date=p.payment_date,
        created_at=p.created_at
    )

@router.get("/structures", response_model=List[SalaryStructureResponse])
def list_salary_structures(
    current_user: User = Depends(require_roles([RoleEnum.SUPER_ADMIN, RoleEnum.HR_MANAGER, RoleEnum.PAYROLL_OFFICER])),
    db: Session = Depends(get_db)
):
    structures = db.query(SalaryStructure).all()
    results = []
    for s in structures:
        emp_name = f"{s.employee.first_name} {s.employee.last_name}" if s.employee else "Unknown"
        results.append(SalaryStructureResponse(
            id=s.id,
            employee_id=s.employee_id,
            employee_name=emp_name,
            ctc_annual=s.ctc_annual,
            basic_monthly=s.basic_monthly,
            hra_monthly=s.hra_monthly,
            special_allowance_monthly=s.special_allowance_monthly,
            gross_monthly=s.gross_monthly,
            pf_employee=s.pf_employee,
            esi_employee=s.esi_employee,
            professional_tax=s.professional_tax,
            tds_monthly=s.tds_monthly,
            total_deductions_monthly=s.total_deductions_monthly,
            net_monthly=s.net_monthly,
            payment_mode=s.payment_mode,
            bank_name=s.bank_name,
            account_number=s.account_number,
            ifsc_or_routing=s.ifsc_or_routing,
            is_active=s.is_active,
            created_at=s.created_at
        ))
    return results

@router.post("/structures", response_model=SalaryStructureResponse, status_code=status.HTTP_201_CREATED)
def set_salary_structure(
    data: SalaryStructureCreate,
    current_user: User = Depends(require_roles([RoleEnum.SUPER_ADMIN, RoleEnum.HR_MANAGER, RoleEnum.PAYROLL_OFFICER])),
    db: Session = Depends(get_db)
):
    gross_monthly = round(data.basic_monthly + data.hra_monthly + data.special_allowance_monthly, 2)
    total_deductions = round(data.pf_employee + data.esi_employee + data.professional_tax + data.tds_monthly, 2)
    net_monthly = round(gross_monthly - total_deductions, 2)

    structure = db.query(SalaryStructure).filter(SalaryStructure.employee_id == data.employee_id).first()
    if not structure:
        structure = SalaryStructure(employee_id=data.employee_id)
        db.add(structure)

    structure.ctc_annual = data.ctc_annual
    structure.basic_monthly = data.basic_monthly
    structure.hra_monthly = data.hra_monthly
    structure.special_allowance_monthly = data.special_allowance_monthly
    structure.gross_monthly = gross_monthly
    structure.pf_employee = data.pf_employee
    structure.esi_employee = data.esi_employee
    structure.professional_tax = data.professional_tax
    structure.tds_monthly = data.tds_monthly
    structure.total_deductions_monthly = total_deductions
    structure.net_monthly = net_monthly
    structure.payment_mode = data.payment_mode
    structure.bank_name = data.bank_name
    structure.account_number = data.account_number
    structure.ifsc_or_routing = data.ifsc_or_routing
    structure.is_active = True

    db.commit()
    db.refresh(structure)

    log_audit_event(
        db=db,
        actor=current_user,
        action="UPDATE",
        entity_type="SALARY_STRUCTURE",
        entity_id=str(structure.id),
        details=f"Configured compensation for employee #{data.employee_id}: Net ${net_monthly}/mo (Gross ${gross_monthly})"
    )

    emp_name = f"{structure.employee.first_name} {structure.employee.last_name}" if structure.employee else "Unknown"
    return SalaryStructureResponse(
        id=structure.id,
        employee_id=structure.employee_id,
        employee_name=emp_name,
        ctc_annual=structure.ctc_annual,
        basic_monthly=structure.basic_monthly,
        hra_monthly=structure.hra_monthly,
        special_allowance_monthly=structure.special_allowance_monthly,
        gross_monthly=structure.gross_monthly,
        pf_employee=structure.pf_employee,
        esi_employee=structure.esi_employee,
        professional_tax=structure.professional_tax,
        tds_monthly=structure.tds_monthly,
        total_deductions_monthly=structure.total_deductions_monthly,
        net_monthly=structure.net_monthly,
        payment_mode=structure.payment_mode,
        bank_name=structure.bank_name,
        account_number=structure.account_number,
        ifsc_or_routing=structure.ifsc_or_routing,
        is_active=structure.is_active,
        created_at=structure.created_at
    )

# --- Monthly Payroll Run Processing ---

@router.post("/runs", response_model=PayrollRunResponse, status_code=status.HTTP_201_CREATED)
def process_monthly_payroll(
    data: PayrollRunCreate,
    current_user: User = Depends(require_roles([RoleEnum.SUPER_ADMIN, RoleEnum.HR_MANAGER, RoleEnum.PAYROLL_OFFICER])),
    db: Session = Depends(get_db)
):
    # Prevent duplicate runs
    existing = db.query(PayrollRun).filter(
        PayrollRun.month == data.month,
        PayrollRun.year == data.year
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Payroll for {calendar.month_name[data.month]} {data.year} has already been created (Status: {existing.status})."
        )

    # Days in month
    _, num_days = calendar.monthrange(data.year, data.month)
    start_date = date(data.year, data.month, 1)
    end_date = date(data.year, data.month, num_days)

    run_title = data.title or f"{calendar.month_name[data.month]} {data.year} Monthly Payroll"
    payroll_run = PayrollRun(
        month=data.month,
        year=data.year,
        title=run_title,
        status="PROCESSED",
        processed_by=current_user.id,
        processed_at=datetime.utcnow()
    )
    db.add(payroll_run)
    db.flush()

    # Query all active employees with a salary structure
    active_employees = db.query(Employee).filter(Employee.status.in_(["Active", "Probation", "Onboarding"])).all()
    
    total_gross_run = 0.0
    total_deductions_run = 0.0
    total_net_run = 0.0
    emp_count = 0

    for emp in active_employees:
        sal = db.query(SalaryStructure).filter(SalaryStructure.employee_id == emp.id, SalaryStructure.is_active == True).first()
        if not sal:
            continue

        # Connected Business Workflow: Aggregate unauthorized absences for Loss of Pay (LOP)
        unauthorized_absences = db.query(AttendanceRecord).filter(
            AttendanceRecord.employee_id == emp.id,
            AttendanceRecord.date >= start_date,
            AttendanceRecord.date <= end_date,
            AttendanceRecord.status == "ABSENT"
        ).count()

        lop_days = float(unauthorized_absences)
        total_days = float(num_days)
        paid_days = max(0.0, total_days - lop_days)
        prorate_ratio = (paid_days / total_days) if total_days > 0 else 1.0

        # Prorated earnings
        basic_earned = round(sal.basic_monthly * prorate_ratio, 2)
        hra_earned = round(sal.hra_monthly * prorate_ratio, 2)
        allowance_earned = round(sal.special_allowance_monthly * prorate_ratio, 2)

        # Check approved expense claims eligible for reimbursement
        approved_expenses = db.query(ExpenseClaim).filter(
            ExpenseClaim.employee_id == emp.id,
            ExpenseClaim.status == "APPROVED",
            ExpenseClaim.payroll_run_id == None
        ).all()
        reimbursement_sum = round(sum(e.amount for e in approved_expenses), 2)
        for exp in approved_expenses:
            exp.status = "REIMBURSED_IN_PAYROLL"
            exp.payroll_run_id = payroll_run.id

        gross_pay = round(basic_earned + hra_earned + allowance_earned + reimbursement_sum, 2)

        # Deductions
        pf_ded = round(sal.pf_employee * prorate_ratio, 2)
        esi_ded = round(sal.esi_employee * prorate_ratio, 2)
        pt_ded = sal.professional_tax
        tds_ded = sal.tds_monthly
        total_ded = round(pf_ded + esi_ded + pt_ded + tds_ded, 2)

        net_pay = round(gross_pay - total_ded, 2)

        payslip = Payslip(
            payroll_run_id=payroll_run.id,
            employee_id=emp.id,
            month=data.month,
            year=data.year,
            total_working_days=total_days,
            paid_days=paid_days,
            loss_of_pay_days=lop_days,
            basic_earned=basic_earned,
            hra_earned=hra_earned,
            allowances_earned=allowance_earned,
            bonus_amount=0.0,
            reimbursement_amount=reimbursement_sum,
            gross_pay=gross_pay,
            pf_deduction=pf_ded,
            esi_deduction=esi_ded,
            prof_tax_deduction=pt_ded,
            tds_deduction=tds_ded,
            other_deductions=0.0,
            total_deductions=total_ded,
            net_pay=net_pay,
            status="GENERATED",
            payment_date=end_date
        )
        db.add(payslip)

        total_gross_run += gross_pay
        total_deductions_run += total_ded
        total_net_run += net_pay
        emp_count += 1

    payroll_run.total_gross = round(total_gross_run, 2)
    payroll_run.total_deductions = round(total_deductions_run, 2)
    payroll_run.total_net = round(total_net_run, 2)
    payroll_run.employees_count = emp_count

    db.commit()
    db.refresh(payroll_run)

    log_audit_event(
        db=db,
        actor=current_user,
        action="CREATE",
        entity_type="PAYROLL_RUN",
        entity_id=str(payroll_run.id),
        details=f"Processed payroll for {run_title} ({emp_count} employees, Total Net: ${payroll_run.total_net})"
    )

    payslips_resp = [format_payslip_response(p) for p in payroll_run.payslips]
    return PayrollRunResponse(
        id=payroll_run.id,
        month=payroll_run.month,
        year=payroll_run.year,
        title=payroll_run.title,
        status=payroll_run.status,
        processed_by_name=current_user.full_name,
        total_gross=payroll_run.total_gross,
        total_deductions=payroll_run.total_deductions,
        total_net=payroll_run.total_net,
        employees_count=payroll_run.employees_count,
        processed_at=payroll_run.processed_at,
        created_at=payroll_run.created_at,
        payslips=payslips_resp
    )

@router.get("/runs", response_model=List[PayrollRunResponse])
def list_payroll_runs(
    current_user: User = Depends(require_roles([RoleEnum.SUPER_ADMIN, RoleEnum.HR_MANAGER, RoleEnum.PAYROLL_OFFICER])),
    db: Session = Depends(get_db)
):
    runs = db.query(PayrollRun).order_by(PayrollRun.year.desc(), PayrollRun.month.desc()).all()
    results = []
    for r in runs:
        results.append(PayrollRunResponse(
            id=r.id,
            month=r.month,
            year=r.year,
            title=r.title,
            status=r.status,
            processed_by_name=r.processor.full_name if r.processor else None,
            approved_by_name=r.approver.full_name if r.approver else None,
            total_gross=r.total_gross,
            total_deductions=r.total_deductions,
            total_net=r.total_net,
            employees_count=r.employees_count,
            processed_at=r.processed_at,
            paid_at=r.paid_at,
            created_at=r.created_at,
            payslips=[format_payslip_response(p) for p in r.payslips]
        ))
    return results

@router.get("/runs/{run_id}/payslips", response_model=List[PayslipResponse])
def get_run_payslips(
    run_id: int,
    current_user: User = Depends(require_roles([RoleEnum.SUPER_ADMIN, RoleEnum.HR_MANAGER, RoleEnum.PAYROLL_OFFICER])),
    db: Session = Depends(get_db)
):
    run = db.query(PayrollRun).filter(PayrollRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Payroll run not found")
    return [format_payslip_response(p) for p in run.payslips]

@router.put("/runs/{run_id}/approve", response_model=PayrollRunResponse)
def approve_payroll_run(
    run_id: int,
    current_user: User = Depends(require_roles([RoleEnum.SUPER_ADMIN, RoleEnum.PAYROLL_OFFICER])),
    db: Session = Depends(get_db)
):
    run = db.query(PayrollRun).filter(PayrollRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Payroll run not found")

    run.status = "PAID"
    run.approved_by = current_user.id
    run.paid_at = datetime.utcnow()

    for p in run.payslips:
        p.status = "PAID"

    db.commit()
    db.refresh(run)

    log_audit_event(
        db=db,
        actor=current_user,
        action="APPROVE",
        entity_type="PAYROLL_RUN",
        entity_id=str(run.id),
        details=f"Approved and disbursed payroll run '{run.title}' (Total: ${run.total_net})"
    )

    return PayrollRunResponse(
        id=run.id,
        month=run.month,
        year=run.year,
        title=run.title,
        status=run.status,
        processed_by_name=run.processor.full_name if run.processor else None,
        approved_by_name=current_user.full_name,
        total_gross=run.total_gross,
        total_deductions=run.total_deductions,
        total_net=run.total_net,
        employees_count=run.employees_count,
        processed_at=run.processed_at,
        paid_at=run.paid_at,
        created_at=run.created_at,
        payslips=[format_payslip_response(p) for p in run.payslips]
    )

@router.get("/payslips", response_model=List[PayslipResponse])
def list_payslips(
    employee_id: Optional[int] = None,
    month: Optional[int] = None,
    year: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Payslip)

    if current_user.role == RoleEnum.EMPLOYEE.value:
        emp_id = current_user.employee_profile.id if current_user.employee_profile else -1
        query = query.filter(Payslip.employee_id == emp_id)
    elif employee_id:
        verify_employee_access(employee_id, current_user, db)
        query = query.filter(Payslip.employee_id == employee_id)

    if month:
        query = query.filter(Payslip.month == month)
    if year:
        query = query.filter(Payslip.year == year)

    payslips = query.order_by(Payslip.year.desc(), Payslip.month.desc()).all()
    return [format_payslip_response(p) for p in payslips]

@router.get("/payslips/{payslip_id}", response_model=PayslipResponse)
def get_payslip_detail(
    payslip_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    payslip = db.query(Payslip).filter(Payslip.id == payslip_id).first()
    if not payslip:
        raise HTTPException(status_code=404, detail="Payslip record not found")

    verify_employee_access(payslip.employee_id, current_user, db)
    return format_payslip_response(payslip)

# --- Full & Final Settlement ---

@router.post("/settlement", response_model=SettlementResponse, status_code=status.HTTP_201_CREATED)
def create_full_and_final_settlement(
    data: SettlementCreate,
    current_user: User = Depends(require_roles([RoleEnum.SUPER_ADMIN, RoleEnum.HR_MANAGER, RoleEnum.PAYROLL_OFFICER])),
    db: Session = Depends(get_db)
):
    emp = db.query(Employee).filter(Employee.id == data.employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    existing = db.query(FullFinalSettlement).filter(FullFinalSettlement.employee_id == data.employee_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="A settlement calculation already exists for this employee.")

    net_payable = round(
        data.gratuity_amount + data.leave_encashment_amount + data.pending_reimbursements + data.notice_pay_adjustment - data.asset_recovery_deductions,
        2
    )

    settlement = FullFinalSettlement(
        employee_id=data.employee_id,
        exit_date=data.exit_date,
        gratuity_amount=data.gratuity_amount,
        leave_encashment_amount=data.leave_encashment_amount,
        notice_pay_adjustment=data.notice_pay_adjustment,
        pending_reimbursements=data.pending_reimbursements,
        asset_recovery_deductions=data.asset_recovery_deductions,
        net_settlement_payable=net_payable,
        status="APPROVED",
        remarks=data.remarks,
        settled_at=datetime.utcnow()
    )
    db.add(settlement)
    db.commit()
    db.refresh(settlement)

    log_audit_event(
        db=db,
        actor=current_user,
        action="CREATE",
        entity_type="FULL_FINAL_SETTLEMENT",
        entity_id=str(settlement.id),
        details=f"Calculated F&F settlement for {emp.first_name} {emp.last_name}: Net Payable ${net_payable}"
    )

    return SettlementResponse(
        id=settlement.id,
        employee_id=settlement.employee_id,
        employee_name=f"{emp.first_name} {emp.last_name}",
        employee_code=emp.employee_id,
        exit_date=settlement.exit_date,
        gratuity_amount=settlement.gratuity_amount,
        leave_encashment_amount=settlement.leave_encashment_amount,
        notice_pay_adjustment=settlement.notice_pay_adjustment,
        pending_reimbursements=settlement.pending_reimbursements,
        asset_recovery_deductions=settlement.asset_recovery_deductions,
        net_settlement_payable=settlement.net_settlement_payable,
        status=settlement.status,
        remarks=settlement.remarks,
        settled_at=settlement.settled_at,
        created_at=settlement.created_at
    )
