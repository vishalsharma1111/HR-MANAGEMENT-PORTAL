from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel

class SalaryStructureCreate(BaseModel):
    employee_id: int
    ctc_annual: float
    basic_monthly: float
    hra_monthly: float = 0.0
    special_allowance_monthly: float = 0.0
    pf_employee: float = 0.0
    esi_employee: float = 0.0
    professional_tax: float = 200.0
    tds_monthly: float = 0.0
    payment_mode: str = "BANK_TRANSFER"
    bank_name: Optional[str] = "JPMorgan Chase"
    account_number: Optional[str] = "9876543210"
    ifsc_or_routing: Optional[str] = "CHASUS33"

class SalaryStructureResponse(BaseModel):
    id: int
    employee_id: int
    employee_name: Optional[str] = None
    ctc_annual: float
    basic_monthly: float
    hra_monthly: float
    special_allowance_monthly: float
    gross_monthly: float
    pf_employee: float
    esi_employee: float
    professional_tax: float
    tds_monthly: float
    total_deductions_monthly: float
    net_monthly: float
    payment_mode: str
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    ifsc_or_routing: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class PayrollRunCreate(BaseModel):
    month: int
    year: int
    title: Optional[str] = None

class PayslipResponse(BaseModel):
    id: int
    payroll_run_id: int
    employee_id: int
    employee_name: Optional[str] = None
    employee_code: Optional[str] = None
    department_name: Optional[str] = None
    designation_title: Optional[str] = None
    month: int
    year: int
    total_working_days: float
    paid_days: float
    loss_of_pay_days: float
    basic_earned: float
    hra_earned: float
    allowances_earned: float
    bonus_amount: float
    reimbursement_amount: float
    gross_pay: float
    pf_deduction: float
    esi_deduction: float
    prof_tax_deduction: float
    tds_deduction: float
    other_deductions: float
    total_deductions: float
    net_pay: float
    status: str
    payment_date: Optional[date] = None
    created_at: datetime

    class Config:
        from_attributes = True

class PayrollRunResponse(BaseModel):
    id: int
    month: int
    year: int
    title: str
    status: str
    processed_by_name: Optional[str] = None
    approved_by_name: Optional[str] = None
    total_gross: float
    total_deductions: float
    total_net: float
    employees_count: int
    processed_at: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    created_at: datetime
    payslips: List[PayslipResponse] = []

    class Config:
        from_attributes = True

class SettlementCreate(BaseModel):
    employee_id: int
    exit_date: date
    gratuity_amount: float = 0.0
    leave_encashment_amount: float = 0.0
    notice_pay_adjustment: float = 0.0
    pending_reimbursements: float = 0.0
    asset_recovery_deductions: float = 0.0
    remarks: Optional[str] = None

class SettlementResponse(BaseModel):
    id: int
    employee_id: int
    employee_name: Optional[str] = None
    employee_code: Optional[str] = None
    exit_date: date
    gratuity_amount: float
    leave_encashment_amount: float
    notice_pay_adjustment: float
    pending_reimbursements: float
    asset_recovery_deductions: float
    net_settlement_payable: float
    status: str
    remarks: Optional[str] = None
    settled_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True
