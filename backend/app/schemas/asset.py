from typing import Optional
from datetime import date, datetime
from pydantic import BaseModel

class AssetBase(BaseModel):
    asset_tag: Optional[str] = None # Auto-generated if omitted
    name: str
    category: str = "LAPTOP"
    serial_number: Optional[str] = None
    assigned_to_employee_id: Optional[int] = None
    assigned_date: Optional[date] = None
    return_date: Optional[date] = None
    status: str = "AVAILABLE" # AVAILABLE, ASSIGNED, MAINTENANCE, RETIRED
    notes: Optional[str] = None

class AssetCreate(AssetBase):
    pass

class AssetUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    serial_number: Optional[str] = None
    assigned_to_employee_id: Optional[int] = None
    assigned_date: Optional[date] = None
    return_date: Optional[date] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class AssetResponse(AssetBase):
    id: int
    asset_tag: str
    assigned_employee_name: Optional[str] = None
    assigned_employee_code: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
