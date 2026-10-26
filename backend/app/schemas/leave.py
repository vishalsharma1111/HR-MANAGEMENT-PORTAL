from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel

class LeaveTypeBase(BaseModel):
    name: str
    code: str
    annual_quota: int = 18
    is_carry_forward: bool = True
    max_carry_forward: int = 10
    is_paid: bool = True
    description: Optional[str] = None

class LeaveTypeCreate(LeaveTypeBase):
    pass

class LeaveTypeResponse(LeaveTypeBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class LeaveBalanceResponse(BaseModel):
    id: int
    employee_id: int
    leave_type_id: int
    leave_type_name: str
    leave_type_code: str
    year: int
    allocated: float
    used: float
    pending: float
    remaining: float

    class Config:
        from_attributes = True

class LeaveApplyRequest(BaseModel):
    leave_type_id: int
    start_date: date
    end_date: date
    is_half_day: bool = False
    half_day_session: Optional[str] = None # FIRST_HALF, SECOND_HALF
    reason: str

class LeaveApprovalRequest(BaseModel):
    status: str # APPROVED, REJECTED
    comments: Optional[str] = None

class LeaveApplicationResponse(BaseModel):
    id: int
    employee_id: int
    employee_name: Optional[str] = None
    department_name: Optional[str] = None
    leave_type_id: int
    leave_type_name: str
    leave_type_code: str
    start_date: date
    end_date: date
    is_half_day: bool
    half_day_session: Optional[str] = None
    days_count: float
    reason: str
    status: str
    manager_name: Optional[str] = None
    manager_status: str
    manager_comments: Optional[str] = None
    hr_approver_name: Optional[str] = None
    hr_status: str
    hr_comments: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
