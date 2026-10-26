from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, Float, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base

class PerformanceCycle(Base):
    __tablename__ = "performance_cycles"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), nullable=False) # e.g. "FY 2026 Annual Performance Review"
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(String(50), default="ACTIVE", nullable=False) # ACTIVE, CLOSED
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    goals = relationship("Goal", back_populates="cycle")
    reviews = relationship("PerformanceReview", back_populates="cycle")

class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    cycle_id = Column(Integer, ForeignKey("performance_cycles.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(50), default="INDIVIDUAL", nullable=False) # INDIVIDUAL, TEAM, COMPANY
    weightage = Column(Integer, default=20, nullable=False) # percentage (e.g. 25%)
    progress = Column(Integer, default=0, nullable=False) # 0 - 100%
    target_metric = Column(String(100), nullable=True) # e.g. "Deploy 99.99% SLA Auth Gateway"
    status = Column(String(50), default="ON_TRACK", nullable=False) # ON_TRACK, AT_RISK, BEHIND, COMPLETED
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    employee = relationship("Employee", backref="goals")
    cycle = relationship("PerformanceCycle", back_populates="goals")

class PerformanceReview(Base):
    __tablename__ = "performance_reviews"

    id = Column(Integer, primary_key=True, index=True)
    cycle_id = Column(Integer, ForeignKey("performance_cycles.id", ondelete="CASCADE"), nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    reviewer_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    self_rating = Column(Float, default=0.0, nullable=False) # 1 - 5 scale
    self_comments = Column(Text, nullable=True)
    manager_rating = Column(Float, default=0.0, nullable=False) # 1 - 5 scale
    manager_comments = Column(Text, nullable=True)
    final_rating = Column(Float, default=0.0, nullable=False)
    
    status = Column(String(50), default="DRAFT", nullable=False) # DRAFT, SUBMITTED_BY_EMPLOYEE, REVIEWED_BY_MANAGER, COMPLETED
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("cycle_id", "employee_id", name="uq_cycle_employee_review"),
    )

    # Relationships
    cycle = relationship("PerformanceCycle", back_populates="reviews")
    employee = relationship("Employee", backref="performance_reviews")
    reviewer = relationship("User", foreign_keys=[reviewer_id])

class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    code = Column(String(50), unique=True, nullable=False) # e.g. "SEC-101"
    category = Column(String(50), default="TECHNICAL", nullable=False) # TECHNICAL, COMPLIANCE, LEADERSHIP, SOFT_SKILLS
    description = Column(Text, nullable=False)
    duration_hours = Column(Float, default=4.0, nullable=False)
    instructor = Column(String(100), default="Enterprise Learning Academy", nullable=False)
    is_mandatory = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    enrollments = relationship("CourseEnrollment", back_populates="course", cascade="all, delete-orphan")

class CourseEnrollment(Base):
    __tablename__ = "course_enrollments"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    enrolled_date = Column(Date, default=date.today, nullable=False)
    completion_date = Column(Date, nullable=True)
    status = Column(String(50), default="IN_PROGRESS", nullable=False) # ENROLLED, IN_PROGRESS, COMPLETED
    score = Column(Float, nullable=True) # 0 - 100%
    certificate_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("course_id", "employee_id", name="uq_course_employee_enrollment"),
    )

    # Relationships
    course = relationship("Course", back_populates="enrollments")
    employee = relationship("Employee", backref="course_enrollments")

class EmployeeSkill(Base):
    __tablename__ = "employee_skills"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    skill_name = Column(String(100), nullable=False)
    proficiency_level = Column(String(50), default="INTERMEDIATE", nullable=False) # BEGINNER, INTERMEDIATE, ADVANCED, EXPERT
    endorsed_by_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("employee_id", "skill_name", name="uq_employee_skill"),
    )

    # Relationships
    employee = relationship("Employee", backref="skills")

class PeerRecognition(Base):
    __tablename__ = "peer_recognitions"

    id = Column(Integer, primary_key=True, index=True)
    giver_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    badge = Column(String(50), nullable=False) # Customer Hero, Innovator, Team Player, Problem Solver
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    giver = relationship("User", foreign_keys=[giver_id])
    receiver = relationship("Employee", foreign_keys=[receiver_id])
