from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. EMP-1001
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), unique=True, nullable=True)
    
    # Personal Info
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(30), nullable=True)
    personal_email = Column(String(255), nullable=True)
    date_of_birth = Column(Date, nullable=True)
    gender = Column(String(20), nullable=True) # Male, Female, Non-Binary, Prefer not to say
    marital_status = Column(String(30), nullable=True) # Single, Married, Divorced, Widowed
    
    # Job Info
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    designation_id = Column(Integer, ForeignKey("designations.id", ondelete="SET NULL"), nullable=True)
    reporting_manager_id = Column(Integer, ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)
    
    joining_date = Column(Date, default=date.today, nullable=False)
    employment_type = Column(String(50), default="Full-Time", nullable=False) # Full-Time, Part-Time, Contract, Intern
    status = Column(String(50), default="Active", nullable=False) # Active, Onboarding, Probation, Notice Period, Terminated, Resigned
    
    exit_date = Column(Date, nullable=True)
    exit_reason = Column(Text, nullable=True)
    
    # Address & Emergency
    location = Column(String(100), default="Headquarters", nullable=True) # New York, London, Bangalore, Remote
    address = Column(Text, nullable=True)
    emergency_contact_name = Column(String(100), nullable=True)
    emergency_contact_phone = Column(String(30), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="employee_profile")
    department = relationship("Department", back_populates="employees")
    designation = relationship("Designation", back_populates="employees")
    
    # Self-referential reporting manager hierarchy
    reporting_manager = relationship("Employee", remote_side=[id], backref="direct_reports")
    
    lifecycle_events = relationship("LifecycleEvent", back_populates="employee", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="employee", cascade="all, delete-orphan")
    onboarding_tasks = relationship("OnboardingTask", back_populates="employee", cascade="all, delete-orphan")
    assets = relationship("Asset", back_populates="assigned_employee")

class LifecycleEvent(Base):
    __tablename__ = "lifecycle_events"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    event_type = Column(String(50), nullable=False) # JOINED, PROMOTION, TRANSFER, STATUS_CHANGE, EXIT_INITIATED, EXITED
    description = Column(Text, nullable=False)
    effective_date = Column(Date, default=date.today, nullable=False)
    recorded_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    employee = relationship("Employee", back_populates="lifecycle_events")
