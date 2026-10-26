from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel, EmailStr

class LifecycleEventBase(BaseModel):
    event_type: str
    description: str
    effective_date: Optional[date] = None
    recorded_by: Optional[str] = None

class LifecycleEventCreate(LifecycleEventBase):
    employee_id: int

class LifecycleEventResponse(LifecycleEventBase):
    id: int
    employee_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class EmployeeBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    personal_email: Optional[EmailStr] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    marital_status: Optional[str] = None
    
    department_id: Optional[int] = None
    designation_id: Optional[int] = None
    reporting_manager_id: Optional[int] = None
    
    joining_date: Optional[date] = None
    employment_type: str = "Full-Time"
    status: str = "Active"
    
    location: Optional[str] = "Headquarters"
    address: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None

class EmployeeCreate(EmployeeBase):
    employee_id: Optional[str] = None # Auto-generated if omitted
    create_user_account: bool = True
    user_role: Optional[str] = "Employee"
    user_password: Optional[str] = "Enterprise@2026"

class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    personal_email: Optional[EmailStr] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    marital_status: Optional[str] = None
    
    department_id: Optional[int] = None
    designation_id: Optional[int] = None
    reporting_manager_id: Optional[int] = None
    
    joining_date: Optional[date] = None
    employment_type: Optional[str] = None
    status: Optional[str] = None
    exit_date: Optional[date] = None
    exit_reason: Optional[str] = None
    
    location: Optional[str] = None
    address: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None

class EmployeeResponse(EmployeeBase):
    id: int
    employee_id: str
    user_id: Optional[int] = None
    exit_date: Optional[date] = None
    exit_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    department_name: Optional[str] = None
    designation_title: Optional[str] = None
    reporting_manager_name: Optional[str] = None
    direct_reports_count: int = 0
    lifecycle_events: List[LifecycleEventResponse] = []

    class Config:
        from_attributes = True

class PaginatedEmployeeResponse(BaseModel):
    items: List[EmployeeResponse]
    total: int
    page: int
    page_size: int
    total_pages: int

class OrgChartNode(BaseModel):
    id: int
    employee_id: str
    name: str
    title: str
    department: str
    email: str
    status: str
    children: List["OrgChartNode"] = []

OrgChartNode.model_rebuild()
