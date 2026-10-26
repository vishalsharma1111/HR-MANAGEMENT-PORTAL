from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class JobRequisition(Base):
    __tablename__ = "job_requisitions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False) # e.g. "Senior Distributed Systems Engineer"
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="RESTRICT"), nullable=False)
    designation_id = Column(Integer, ForeignKey("designations.id", ondelete="SET NULL"), nullable=True)
    openings_count = Column(Integer, default=1, nullable=False)
    experience_required = Column(String(50), default="3-5 Years", nullable=False)
    employment_type = Column(String(50), default="Full-Time", nullable=False)
    location = Column(String(100), default="San Francisco HQ", nullable=False)
    salary_range = Column(String(100), default="$140,000 - $175,000", nullable=True)
    status = Column(String(50), default="OPEN", nullable=False) # DRAFT, OPEN, ON_HOLD, CLOSED
    job_description = Column(Text, nullable=False)
    hiring_manager_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    recruiter_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    department = relationship("Department")
    designation = relationship("Designation")
    hiring_manager = relationship("User", foreign_keys=[hiring_manager_id])
    recruiter = relationship("User", foreign_keys=[recruiter_id])
    candidates = relationship("Candidate", back_populates="job_requisition", cascade="all, delete-orphan")

class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
    job_requisition_id = Column(Integer, ForeignKey("job_requisitions.id", ondelete="CASCADE"), nullable=False, index=True)
    full_name = Column(String(150), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    phone = Column(String(30), nullable=True)
    current_company = Column(String(150), nullable=True)
    current_designation = Column(String(150), nullable=True)
    experience_years = Column(Float, default=0.0, nullable=False)
    resume_file_path = Column(String(500), nullable=True)
    cover_letter = Column(Text, nullable=True)
    
    # Stage: APPLIED, SCREENING, INTERVIEW, OFFER, HIRED, REJECTED
    stage = Column(String(50), default="APPLIED", nullable=False)
    rating = Column(Integer, default=0, nullable=False) # 1 - 5 stars
    
    # Connected workflow: When marked HIRED, links to created employee profile!
    converted_employee_id = Column(Integer, ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    job_requisition = relationship("JobRequisition", back_populates="candidates")
    converted_employee = relationship("Employee")
    interviews = relationship("InterviewSchedule", back_populates="candidate", cascade="all, delete-orphan")

class InterviewSchedule(Base):
    __tablename__ = "interview_schedules"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False)
    round_name = Column(String(100), nullable=False) # e.g. "System Architecture & Coding"
    interviewer_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    scheduled_time = Column(DateTime, nullable=False)
    meeting_link = Column(String(500), nullable=True)
    status = Column(String(50), default="SCHEDULED", nullable=False) # SCHEDULED, COMPLETED, CANCELLED
    scorecard_rating = Column(Integer, nullable=True) # 1 - 5
    scorecard_feedback = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    candidate = relationship("Candidate", back_populates="interviews")
    interviewer = relationship("User", foreign_keys=[interviewer_id])
