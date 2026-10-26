from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

class DesignationBase(BaseModel):
    title: str
    code: str
    department_id: int
    description: Optional[str] = None
    level: Optional[str] = "Mid-Level"

class DesignationCreate(DesignationBase):
    pass

class DesignationResponse(DesignationBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class DepartmentBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    manager_id: Optional[int] = None

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    manager_id: Optional[int] = None

class DepartmentResponse(DepartmentBase):
    id: int
    created_at: datetime
    updated_at: datetime
    designations: List[DesignationResponse] = []
    employee_count: int = 0
    manager_name: Optional[str] = None

    class Config:
        from_attributes = True
