from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class DocumentResponse(BaseModel):
    id: int
    employee_id: Optional[int] = None
    employee_name: Optional[str] = None
    title: str
    category: str
    file_name: str
    file_path: str
    file_size: int
    mime_type: str
    is_company_policy: bool
    uploaded_by: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class DocumentCreate(BaseModel):
    title: str
    category: str = "OTHER"
    employee_id: Optional[int] = None
    is_company_policy: bool = False
