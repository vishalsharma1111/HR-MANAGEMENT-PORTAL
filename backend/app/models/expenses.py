from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Float, DateTime, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class ExpenseClaim(Base):
    __tablename__ = "expense_claims"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    category = Column(String(50), default="TRAVEL", nullable=False) # TRAVEL, MEALS, SOFTWARE, HARDWARE, TRAINING, MEDICAL
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="USD", nullable=False)
    receipt_path = Column(String(500), nullable=True)
    expense_date = Column(Date, default=date.today, nullable=False)
    
    # Status: PENDING, APPROVED, REJECTED, REIMBURSED_IN_PAYROLL
    status = Column(String(50), default="PENDING", nullable=False)
    approver_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approver_comments = Column(Text, nullable=True)
    payroll_run_id = Column(Integer, ForeignKey("payroll_runs.id", ondelete="SET NULL"), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    employee = relationship("Employee", backref="expense_claims")
    approver = relationship("User", foreign_keys=[approver_id])

class HelpdeskTicket(Base):
    __tablename__ = "helpdesk_tickets"

    id = Column(Integer, primary_key=True, index=True)
    ticket_number = Column(String(50), unique=True, index=True, nullable=False) # e.g. "TICK-2026-001"
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    category = Column(String(50), default="GENERAL", nullable=False) # PAYROLL, IT_SUPPORT, BENEFITS, WORKPLACE, GENERAL
    priority = Column(String(20), default="MEDIUM", nullable=False) # LOW, MEDIUM, HIGH, URGENT
    subject = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    
    # Status: OPEN, IN_PROGRESS, RESOLVED, CLOSED
    status = Column(String(50), default="OPEN", nullable=False)
    assigned_to_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    resolution_notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    resolved_at = Column(DateTime, nullable=True)

    # Relationships
    employee = relationship("Employee", backref="helpdesk_tickets")
    assigned_agent = relationship("User", foreign_keys=[assigned_to_user_id])

class DocumentRequest(Base):
    __tablename__ = "document_requests"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    document_type = Column(String(100), nullable=False) # EXPERIENCE_LETTER, BONAFIDE_CERTIFICATE, SALARY_CERTIFICATE, VISA_LETTER
    purpose = Column(Text, nullable=False)
    status = Column(String(50), default="PENDING", nullable=False) # PENDING, APPROVED, GENERATED, REJECTED
    generated_document_id = Column(Integer, ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    employee = relationship("Employee", backref="document_requests")
    generated_document = relationship("Document")
