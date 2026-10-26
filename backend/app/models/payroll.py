from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, Float, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base

class SalaryStructure(Base):
    __tablename__ = "salary_structures"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), unique=True, nullable=False)
    effective_from = Column(Date, default=date.today, nullable=False)
    ctc_annual = Column(Float, nullable=False)
    
    # Monthly Earnings
    basic_monthly = Column(Float, nullable=False)
    hra_monthly = Column(Float, default=0.0, nullable=False)
    special_allowance_monthly = Column(Float, default=0.0, nullable=False)
    gross_monthly = Column(Float, nullable=False)
    
    # Statutory Deductions (Decimal-safe floats)
    pf_employee = Column(Float, default=0.0, nullable=False) # Provident Fund
    esi_employee = Column(Float, default=0.0, nullable=False) # Employee State Insurance
    professional_tax = Column(Float, default=200.0, nullable=False) # Standard state professional tax
    tds_monthly = Column(Float, default=0.0, nullable=False) # Income tax withholding
    total_deductions_monthly = Column(Float, default=0.0, nullable=False)
    net_monthly = Column(Float, nullable=False)
    
    # Bank Details
    payment_mode = Column(String(50), default="BANK_TRANSFER", nullable=False)
    bank_name = Column(String(100), default="JPMorgan Chase", nullable=True)
    account_number = Column(String(50), default="9876543210", nullable=True)
    ifsc_or_routing = Column(String(50), default="CHASUS33", nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    employee = relationship("Employee", backref="salary_structure")

class PayrollRun(Base):
    __tablename__ = "payroll_runs"

    id = Column(Integer, primary_key=True, index=True)
    month = Column(Integer, nullable=False) # 1 - 12
    year = Column(Integer, nullable=False)
    title = Column(String(100), nullable=False) # e.g. "October 2026 Monthly Payroll"
    status = Column(String(50), default="DRAFT", nullable=False) # DRAFT, PROCESSED, APPROVED, PAID
    processed_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approved_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    total_gross = Column(Float, default=0.0, nullable=False)
    total_deductions = Column(Float, default=0.0, nullable=False)
    total_net = Column(Float, default=0.0, nullable=False)
    employees_count = Column(Integer, default=0, nullable=False)
    
    processed_at = Column(DateTime, nullable=True)
    paid_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("month", "year", name="uq_payroll_month_year"),
    )

    # Relationships
    payslips = relationship("Payslip", back_populates="payroll_run", cascade="all, delete-orphan")
    processor = relationship("User", foreign_keys=[processed_by])
    approver = relationship("User", foreign_keys=[approved_by])

class Payslip(Base):
    __tablename__ = "payslips"

    id = Column(Integer, primary_key=True, index=True)
    payroll_run_id = Column(Integer, ForeignKey("payroll_runs.id", ondelete="CASCADE"), nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    month = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    
    # Working Days telemetry (Derived from Attendance & Leaves)
    total_working_days = Column(Float, default=30.0, nullable=False)
    paid_days = Column(Float, default=30.0, nullable=False)
    loss_of_pay_days = Column(Float, default=0.0, nullable=False)
    
    # Earned Earnings
    basic_earned = Column(Float, nullable=False)
    hra_earned = Column(Float, default=0.0, nullable=False)
    allowances_earned = Column(Float, default=0.0, nullable=False)
    bonus_amount = Column(Float, default=0.0, nullable=False)
    reimbursement_amount = Column(Float, default=0.0, nullable=False)
    gross_pay = Column(Float, nullable=False)
    
    # Deductions
    pf_deduction = Column(Float, default=0.0, nullable=False)
    esi_deduction = Column(Float, default=0.0, nullable=False)
    prof_tax_deduction = Column(Float, default=0.0, nullable=False)
    tds_deduction = Column(Float, default=0.0, nullable=False)
    other_deductions = Column(Float, default=0.0, nullable=False)
    total_deductions = Column(Float, nullable=False)
    
    net_pay = Column(Float, nullable=False)
    status = Column(String(50), default="GENERATED", nullable=False) # GENERATED, RELEASED, PAID
    payment_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("employee_id", "month", "year", name="uq_employee_payslip_month_year"),
    )

    # Relationships
    payroll_run = relationship("PayrollRun", back_populates="payslips")
    employee = relationship("Employee", backref="payslips")

class FullFinalSettlement(Base):
    __tablename__ = "full_final_settlements"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), unique=True, nullable=False)
    exit_date = Column(Date, nullable=False)
    gratuity_amount = Column(Float, default=0.0, nullable=False)
    leave_encashment_amount = Column(Float, default=0.0, nullable=False)
    notice_pay_adjustment = Column(Float, default=0.0, nullable=False)
    pending_reimbursements = Column(Float, default=0.0, nullable=False)
    asset_recovery_deductions = Column(Float, default=0.0, nullable=False)
    net_settlement_payable = Column(Float, nullable=False)
    status = Column(String(50), default="DRAFT", nullable=False) # DRAFT, APPROVED, SETTLED
    remarks = Column(Text, nullable=True)
    settled_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    employee = relationship("Employee", backref="full_final_settlement")
