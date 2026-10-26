from datetime import datetime
from pydantic import BaseModel, EmailStr

class ContactCreate(BaseModel):
    full_name: str
    email: EmailStr
    subject: str
    message: str

class ContactResponse(BaseModel):
    id: int
    full_name: str
    email: str
    subject: str
    message: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
