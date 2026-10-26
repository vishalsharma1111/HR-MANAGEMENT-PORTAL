from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class OnboardingTask(Base):
    __tablename__ = "onboarding_tasks"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(50), default="HR", nullable=False) # HR, IT, COMPLIANCE, MANAGER, OFFBOARDING
    is_completed = Column(Boolean, default=False, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    completed_by = Column(String(100), nullable=True)
    due_date = Column(Date, nullable=True)
    assigned_role = Column(String(50), default="HR Manager", nullable=False)
    is_offboarding = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    employee = relationship("Employee", back_populates="onboarding_tasks")
