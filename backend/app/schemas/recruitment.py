from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr

class JobRequisitionBase(BaseModel):
    title: str
    department_id: int
    designation_id: Optional[int] = None
    openings_count: int = 1
    experience_required: str = "3-5 Years"
    employment_type: str = "Full-Time"
    location: str = "San Francisco HQ"
    salary_range: Optional[str] = "$140,000 - $175,000"
    status: str = "OPEN"
    job_description: str
    hiring_manager_id: Optional[int] = None
    recruiter_id: Optional[int] = None

class JobRequisitionCreate(JobRequisitionBase):
    pass

class JobRequisitionResponse(JobRequisitionBase):
    id: int
    department_name: Optional[str] = None
    designation_title: Optional[str] = None
    hiring_manager_name: Optional[str] = None
    recruiter_name: Optional[str] = None
    candidates_count: int = 0
    created_at: datetime

    class Config:
        from_attributes = True

class InterviewCreate(BaseModel):
    candidate_id: int
    round_name: str
    interviewer_id: Optional[int] = None
    scheduled_time: datetime
    meeting_link: Optional[str] = None

class InterviewResponse(BaseModel):
    id: int
    candidate_id: int
    round_name: str
    interviewer_name: Optional[str] = None
    scheduled_time: datetime
    meeting_link: Optional[str] = None
    status: str
    scorecard_rating: Optional[int] = None
    scorecard_feedback: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class CandidateCreate(BaseModel):
    job_requisition_id: int
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    current_company: Optional[str] = None
    current_designation: Optional[str] = None
    experience_years: float = 0.0
    cover_letter: Optional[str] = None

class CandidateUpdate(BaseModel):
    stage: Optional[str] = None # APPLIED, SCREENING, INTERVIEW, OFFER, HIRED, REJECTED
    rating: Optional[int] = None # 1 - 5

class CandidateResponse(BaseModel):
    id: int
    job_requisition_id: int
    job_title: Optional[str] = None
    department_name: Optional[str] = None
    full_name: str
    email: str
    phone: Optional[str] = None
    current_company: Optional[str] = None
    current_designation: Optional[str] = None
    experience_years: float
    stage: str
    rating: int
    converted_employee_id: Optional[int] = None
    created_at: datetime
    interviews: List[InterviewResponse] = []

    class Config:
        from_attributes = True

class ConvertCandidateRequest(BaseModel):
    joining_date: Optional[str] = None
    salary_ctc: Optional[float] = None
