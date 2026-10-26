from typing import Optional, List
from datetime import date, datetime, time
from pydantic import BaseModel

class ShiftBase(BaseModel):
    name: str
    start_time: time
    end_time: time
    grace_period_mins: int = 15
    work_hours: float = 8.0
    is_active: bool = True

class ShiftCreate(ShiftBase):
    pass

class ShiftResponse(ShiftBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class CheckInOutRequest(BaseModel):
    employee_id: Optional[int] = None
    notes: Optional[str] = None

class AttendanceRecordResponse(BaseModel):
    id: int
    employee_id: int
    employee_name: Optional[str] = None
    date: date
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    total_hours: float
    status: str
    is_late: bool
    late_minutes: int
    overtime_hours: float
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AttendanceCorrectionCreate(BaseModel):
    date: date
    requested_check_in: Optional[datetime] = None
    requested_check_out: Optional[datetime] = None
    reason: str

class AttendanceCorrectionReview(BaseModel):
    status: str # APPROVED, REJECTED
    review_notes: Optional[str] = None

class AttendanceCorrectionResponse(BaseModel):
    id: int
    employee_id: int
    employee_name: Optional[str] = None
    attendance_record_id: Optional[int] = None
    date: date
    requested_check_in: Optional[datetime] = None
    requested_check_out: Optional[datetime] = None
    reason: str
    status: str
    reviewer_id: Optional[int] = None
    reviewer_name: Optional[str] = None
    review_notes: Optional[str] = None
    created_at: datetime
    reviewed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class HolidayCreate(BaseModel):
    name: str
    date: date
    holiday_type: str = "NATIONAL"
    description: Optional[str] = None

class HolidayResponse(HolidayCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class TimesheetEntryBase(BaseModel):
    project_name: str
    task_description: str
    date: date
    hours: float

class TimesheetEntryResponse(TimesheetEntryBase):
    id: int

    class Config:
        from_attributes = True

class TimesheetCreate(BaseModel):
    week_start_date: date
    week_end_date: date
    entries: List[TimesheetEntryBase]

class TimesheetResponse(BaseModel):
    id: int
    employee_id: int
    employee_name: Optional[str] = None
    week_start_date: date
    week_end_date: date
    total_hours: float
    status: str
    reviewer_name: Optional[str] = None
    review_notes: Optional[str] = None
    created_at: datetime
    entries: List[TimesheetEntryResponse] = []

    class Config:
        from_attributes = True

class AttendanceSummaryResponse(BaseModel):
    total_days: int
    present_days: int
    absent_days: int
    late_days: int
    leave_days: int
    total_work_hours: float
    average_hours_per_day: float
    overtime_hours: float
