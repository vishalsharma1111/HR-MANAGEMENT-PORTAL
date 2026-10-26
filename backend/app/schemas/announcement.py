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
