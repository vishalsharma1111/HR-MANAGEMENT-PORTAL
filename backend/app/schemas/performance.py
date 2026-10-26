from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel

class CycleCreate(BaseModel):
    title: str
    start_date: date
    end_date: date
    status: str = "ACTIVE"

class CycleResponse(CycleCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class GoalCreate(BaseModel):
    cycle_id: int
    title: str
    description: Optional[str] = None
    category: str = "INDIVIDUAL"
    weightage: int = 25
    target_metric: Optional[str] = None

class GoalUpdate(BaseModel):
    progress: Optional[int] = None
    status: Optional[str] = None # ON_TRACK, AT_RISK, BEHIND, COMPLETED

class GoalResponse(BaseModel):
    id: int
    employee_id: int
    employee_name: Optional[str] = None
    cycle_id: int
    cycle_title: Optional[str] = None
    title: str
    description: Optional[str] = None
    category: str
    weightage: int
    progress: int
    target_metric: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class ReviewSubmitRequest(BaseModel):
    self_rating: Optional[float] = None
    self_comments: Optional[str] = None
    manager_rating: Optional[float] = None
    manager_comments: Optional[str] = None
    status: Optional[str] = None

class ReviewResponse(BaseModel):
    id: int
    cycle_id: int
    cycle_title: Optional[str] = None
    employee_id: int
    employee_name: Optional[str] = None
    reviewer_name: Optional[str] = None
    self_rating: float
    self_comments: Optional[str] = None
    manager_rating: float
    manager_comments: Optional[str] = None
    final_rating: float
    status: str
    updated_at: datetime

    class Config:
        from_attributes = True

class CourseCreate(BaseModel):
    title: str
    code: str
    category: str = "TECHNICAL"
    description: str
    duration_hours: float = 4.0
    instructor: str = "Enterprise Learning Academy"
    is_mandatory: bool = False

class CourseResponse(CourseCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class EnrollmentResponse(BaseModel):
    id: int
    course_id: int
    course_title: str
    course_code: str
    category: str
    duration_hours: float
    employee_id: int
    enrolled_date: date
    completion_date: Optional[date] = None
    status: str
    score: Optional[float] = None
    certificate_url: Optional[str] = None

    class Config:
        from_attributes = True

class SkillCreate(BaseModel):
    skill_name: str
    proficiency_level: str = "INTERMEDIATE"

class SkillResponse(BaseModel):
    id: int
    employee_id: int
    skill_name: str
    proficiency_level: str
    endorsed_by_count: int

    class Config:
        from_attributes = True

class RecognitionCreate(BaseModel):
    receiver_id: int
    badge: str
    message: str

class RecognitionResponse(BaseModel):
    id: int
    giver_name: str
    receiver_name: str
    badge: str
    message: str
    created_at: datetime

    class Config:
        from_attributes = True
