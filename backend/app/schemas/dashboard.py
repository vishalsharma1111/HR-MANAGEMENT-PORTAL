from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class AnnouncementBase(BaseModel):
    title: str
    content: str
    priority: str = "NORMAL"
    is_pinned: bool = False
    author_name: Optional[str] = "HR Administration"
    department_target: Optional[str] = "ALL"

class AnnouncementCreate(AnnouncementBase):
    pass

class AnnouncementResponse(AnnouncementBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class AuditLogResponse(BaseModel):
    id: int
    actor_id: Optional[int] = None
    actor_email: Optional[str] = None
    actor_role: Optional[str] = None
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    details: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class MetricItem(BaseModel):
    name: str
    value: int
    change: Optional[str] = None
    trend: Optional[str] = None

class DepartmentDistributionItem(BaseModel):
    department: str
    count: int

class StatusDistributionItem(BaseModel):
    status: str
    count: int

class DashboardStatsResponse(BaseModel):
    total_employees: int
    active_employees: int
    probation_employees: int
    onboarding_employees: int
    total_departments: int
    open_tasks: int
    onboarding_completion_rate: float
    department_distribution: list[DepartmentDistributionItem]
    status_distribution: list[StatusDistributionItem]
    recent_activity: list[AuditLogResponse]
    announcements: list[AnnouncementResponse]
