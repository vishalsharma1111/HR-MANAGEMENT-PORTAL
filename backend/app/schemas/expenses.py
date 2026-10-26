from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel

class ExpenseClaimCreate(BaseModel):
    title: str
    category: str = "TRAVEL"
    amount: float
    currency: str = "USD"
    expense_date: date = date.today()

class ExpenseClaimReview(BaseModel):
    status: str # APPROVED, REJECTED
    approver_comments: Optional[str] = None

class ExpenseClaimResponse(BaseModel):
    id: int
    employee_id: int
    employee_name: Optional[str] = None
    title: str
    category: str
    amount: float
    currency: str
    receipt_path: Optional[str] = None
    expense_date: date
    status: str
    approver_name: Optional[str] = None
    approver_comments: Optional[str] = None
    payroll_run_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

class TicketCreate(BaseModel):
    category: str = "GENERAL"
    priority: str = "MEDIUM"
    subject: str
    description: str

class TicketUpdate(BaseModel):
    status: Optional[str] = None # OPEN, IN_PROGRESS, RESOLVED, CLOSED
    assigned_to_user_id: Optional[int] = None
    resolution_notes: Optional[str] = None

class TicketResponse(BaseModel):
    id: int
    ticket_number: str
    employee_id: int
    employee_name: Optional[str] = None
    category: str
    priority: str
    subject: str
    description: str
    status: str
    assigned_agent_name: Optional[str] = None
    resolution_notes: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class DocRequestCreate(BaseModel):
    document_type: str # EXPERIENCE_LETTER, BONAFIDE_CERTIFICATE, SALARY_CERTIFICATE, VISA_LETTER
    purpose: str

class DocRequestResponse(BaseModel):
    id: int
    employee_id: int
    employee_name: Optional[str] = None
    document_type: str
    purpose: str
    status: str
    generated_document_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True
