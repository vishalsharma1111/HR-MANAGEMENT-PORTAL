from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr

class Token(BaseModel):
    access_token: str
    token_type: str
    user: "UserResponse"

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
    exp: Optional[int] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    department_id: Optional[int] = None

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class PasswordResetRequest(BaseModel):
    email: EmailStr
    new_password: str

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str
    department_id: Optional[int] = None

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    department_id: Optional[int] = None

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    is_verified: bool
    department_id: Optional[int] = None
    created_at: datetime
    employee_id: Optional[int] = None
    employee_code: Optional[str] = None

    class Config:
        from_attributes = True

Token.model_rebuild()
