from datetime import datetime, date, time
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, Time, Float, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base

class Shift(Base):
    __tablename__ = "shifts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False) # e.g. "Standard General Shift"
    start_time = Column(Time, default=time(9, 0), nullable=False) # 09:00:00
    end_time = Column(Time, default=time(18, 0), nullable=False)   # 18:00:00
    grace_period_mins = Column(Integer, default=15, nullable=False) # 15 mins grace before marked late
    work_hours = Column(Float, default=8.0, nullable=False) # Expected working hours
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(Date, default=date.today, nullable=False, index=True)
    check_in = Column(DateTime, nullable=True)
    check_out = Column(DateTime, nullable=True)
    total_hours = Column(Float, default=0.0, nullable=False)
    status = Column(String(50), default="PRESENT", nullable=False) # PRESENT, ABSENT, HALF_DAY, ON_LEAVE, HOLIDAY, WEEKEND
    is_late = Column(Boolean, default=False, nullable=False)
    late_minutes = Column(Integer, default=0, nullable=False)
    overtime_hours = Column(Float, default=0.0, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("employee_id", "date", name="uq_employee_attendance_date"),
    )

    # Relationships
    employee = relationship("Employee", backref="attendance_records")
    corrections = relationship("AttendanceCorrection", back_populates="attendance_record", cascade="all, delete-orphan")

class AttendanceCorrection(Base):
    __tablename__ = "attendance_corrections"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    attendance_record_id = Column(Integer, ForeignKey("attendance_records.id", ondelete="CASCADE"), nullable=True)
    date = Column(Date, nullable=False)
    requested_check_in = Column(DateTime, nullable=True)
    requested_check_out = Column(DateTime, nullable=True)
    reason = Column(Text, nullable=False)
    status = Column(String(50), default="PENDING", nullable=False) # PENDING, APPROVED, REJECTED
    reviewer_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    review_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    reviewed_at = Column(DateTime, nullable=True)

    # Relationships
    employee = relationship("Employee", backref="attendance_corrections")
    attendance_record = relationship("AttendanceRecord", back_populates="corrections")
    reviewer = relationship("User", foreign_keys=[reviewer_id])

class HolidayCalendar(Base):
    __tablename__ = "holiday_calendar"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    date = Column(Date, unique=True, nullable=False, index=True)
    holiday_type = Column(String(50), default="NATIONAL", nullable=False) # NATIONAL, REGIONAL, OPTIONAL
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class Timesheet(Base):
    __tablename__ = "timesheets"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    week_start_date = Column(Date, nullable=False)
    week_end_date = Column(Date, nullable=False)
    total_hours = Column(Float, default=0.0, nullable=False)
    status = Column(String(50), default="SUBMITTED", nullable=False) # DRAFT, SUBMITTED, APPROVED, REJECTED
    reviewer_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    review_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    employee = relationship("Employee", backref="timesheets")
    reviewer = relationship("User", foreign_keys=[reviewer_id])
    entries = relationship("TimesheetEntry", back_populates="timesheet", cascade="all, delete-orphan")

class TimesheetEntry(Base):
    __tablename__ = "timesheet_entries"

    id = Column(Integer, primary_key=True, index=True)
    timesheet_id = Column(Integer, ForeignKey("timesheets.id", ondelete="CASCADE"), nullable=False)
    project_name = Column(String(150), nullable=False)
    task_description = Column(Text, nullable=False)
    date = Column(Date, nullable=False)
    hours = Column(Float, nullable=False)

    # Relationships
    timesheet = relationship("Timesheet", back_populates="entries")
