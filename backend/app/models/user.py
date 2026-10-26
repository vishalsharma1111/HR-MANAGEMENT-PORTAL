import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.database import Base

class RoleEnum(str, enum.Enum):
    SUPER_ADMIN = "Super Admin"          # Super Admin / HR Admin
    HR_MANAGER = "HR Manager"            # HR Operations Manager
    DEPT_MANAGER = "Department Manager"  # Line Manager / Dept Head
    EMPLOYEE = "Employee"                # Regular Employee (Self-service)
    RECRUITER = "Recruiter"              # Talent Acquisition Specialist
    PAYROLL_OFFICER = "Payroll Officer"  # Payroll / Finance Officer
    IT_ADMIN = "IT Administrator"        # IT & System Admin

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default=RoleEnum.EMPLOYEE.value)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=True, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    department = relationship("Department", foreign_keys=[department_id])
    employee_profile = relationship("Employee", back_populates="user", uselist=False)
