from typing import Optional
from datetime import datetime
from pydantic import BaseModel

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
