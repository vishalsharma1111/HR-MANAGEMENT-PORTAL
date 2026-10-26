from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, Float, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base

class LeaveType(Base):
    __tablename__ = "leave_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False) # e.g. "Earned / Paid Leave"
    code = Column(String(20), unique=True, nullable=False) # e.g. "PL", "CL", "SL", "ML"
    annual_quota = Column(Integer, default=18, nullable=False)
    is_carry_forward = Column(Boolean, default=True, nullable=False)
    max_carry_forward = Column(Integer, default=10, nullable=False)
    is_paid = Column(Boolean, default=True, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    balances = relationship("LeaveBalance", back_populates="leave_type", cascade="all, delete-orphan")
    applications = relationship("LeaveApplication", back_populates="leave_type")

class LeaveBalance(Base):
    __tablename__ = "leave_balances"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    leave_type_id = Column(Integer, ForeignKey("leave_types.id", ondelete="CASCADE"), nullable=False)
    year = Column(Integer, default=datetime.utcnow().year, nullable=False)
    allocated = Column(Float, default=18.0, nullable=False)
    used = Column(Float, default=0.0, nullable=False)
    pending = Column(Float, default=0.0, nullable=False)
    remaining = Column(Float, default=18.0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("employee_id", "leave_type_id", "year", name="uq_employee_leave_type_year"),
    )

    # Relationships
    employee = relationship("Employee", backref="leave_balances")
    leave_type = relationship("LeaveType", back_populates="balances")

class LeaveApplication(Base):
    __tablename__ = "leave_applications"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    leave_type_id = Column(Integer, ForeignKey("leave_types.id", ondelete="RESTRICT"), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    is_half_day = Column(Boolean, default=False, nullable=False)
    half_day_session = Column(String(20), nullable=True) # FIRST_HALF, SECOND_HALF
    days_count = Column(Float, default=1.0, nullable=False)
    reason = Column(Text, nullable=False)
    
    # Workflow Status: PENDING_MANAGER, PENDING_HR, APPROVED, REJECTED, CANCELLED
    status = Column(String(50), default="PENDING_MANAGER", nullable=False)
    
    # Manager approval tier
    manager_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    manager_status = Column(String(50), default="PENDING", nullable=False) # PENDING, APPROVED, REJECTED
    manager_comments = Column(Text, nullable=True)
    
    # HR approval tier
    hr_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    hr_status = Column(String(50), default="PENDING", nullable=False)
    hr_comments = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    employee = relationship("Employee", backref="leave_applications")
    leave_type = relationship("LeaveType", back_populates="applications")
    manager = relationship("User", foreign_keys=[manager_id])
    hr_approver = relationship("User", foreign_keys=[hr_id])
