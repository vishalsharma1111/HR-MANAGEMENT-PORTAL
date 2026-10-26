from typing import Optional
from datetime import date, datetime
from pydantic import BaseModel

class OnboardingTaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: str = "HR" # HR, IT, COMPLIANCE, MANAGER, OFFBOARDING
    due_date: Optional[date] = None
    assigned_role: str = "HR Manager"
    is_offboarding: bool = False

class OnboardingTaskCreate(OnboardingTaskBase):
    employee_id: int

class OnboardingTaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    is_completed: Optional[bool] = None
    due_date: Optional[date] = None
    assigned_role: Optional[str] = None

class OnboardingTaskResponse(OnboardingTaskBase):
    id: int
    employee_id: int
    employee_name: Optional[str] = None
    is_completed: bool
    completed_at: Optional[datetime] = None
    completed_by: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class OnboardingSummary(BaseModel):
    total_tasks: int
    completed_tasks: int
    pending_tasks: int
    completion_rate: float
