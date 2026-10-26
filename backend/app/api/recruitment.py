from datetime import datetime, date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, RoleEnum
from app.models.department import Department, Designation
from app.models.employee import Employee, LifecycleEvent
from app.models.onboarding import OnboardingTask
from app.models.recruitment import JobRequisition, Candidate, InterviewSchedule
from app.schemas.recruitment import (
    JobRequisitionCreate, JobRequisitionResponse, CandidateCreate, 
    CandidateUpdate, CandidateResponse, InterviewCreate, InterviewResponse,
    ConvertCandidateRequest
)
from app.schemas.employee import EmployeeResponse
from app.api.employees import generate_unique_employee_id, format_employee_response
from app.auth.security import get_password_hash
from app.auth.dependencies import (
    get_current_user, require_roles, log_audit_event
)

router = APIRouter(prefix="/recruitment", tags=["Recruitment & Applicant Tracking"])

def format_requisition_response(req: JobRequisition) -> JobRequisitionResponse:
    dept_name = req.department.name if req.department else "General"
    desig_title = req.designation.title if req.designation else "Staff"
    mgr_name = req.hiring_manager.full_name if req.hiring_manager else None
    rec_name = req.recruiter.full_name if req.recruiter else None

    return JobRequisitionResponse(
        id=req.id,
        title=req.title,
        department_id=req.department_id,
        department_name=dept_name,
        designation_id=req.designation_id,
        designation_title=desig_title,
        openings_count=req.openings_count,
        experience_required=req.experience_required,
        employment_type=req.employment_type,
        location=req.location,
        salary_range=req.salary_range,
        status=req.status,
        job_description=req.job_description,
        hiring_manager_id=req.hiring_manager_id,
        hiring_manager_name=mgr_name,
        recruiter_id=req.recruiter_id,
        recruiter_name=rec_name,
        candidates_count=len(req.candidates) if req.candidates else 0,
        created_at=req.created_at
    )

def format_candidate_response(c: Candidate) -> CandidateResponse:
    job_title = c.job_requisition.title if c.job_requisition else "Unspecified"
    dept_name = c.job_requisition.department.name if c.job_requisition and c.job_requisition.department else "General"

    interviews = [
        InterviewResponse(
            id=i.id,
            candidate_id=i.candidate_id,
            round_name=i.round_name,
            interviewer_name=i.interviewer.full_name if i.interviewer else None,
            scheduled_time=i.scheduled_time,
            meeting_link=i.meeting_link,
            status=i.status,
            scorecard_rating=i.scorecard_rating,
            scorecard_feedback=i.scorecard_feedback,
            created_at=i.created_at
        ) for i in c.interviews
    ]

    return CandidateResponse(
        id=c.id,
        job_requisition_id=c.job_requisition_id,
        job_title=job_title,
        department_name=dept_name,
        full_name=c.full_name,
        email=c.email,
        phone=c.phone,
        current_company=c.current_company,
        current_designation=c.current_designation,
        experience_years=c.experience_years,
        stage=c.stage,
        rating=c.rating,
        converted_employee_id=c.converted_employee_id,
        created_at=c.created_at,
        interviews=interviews
    )

@router.get("/requisitions", response_model=List[JobRequisitionResponse])
def list_requisitions(db: Session = Depends(get_db)):
    requisitions = db.query(JobRequisition).order_by(JobRequisition.created_at.desc()).all()
    return [format_requisition_response(r) for r in requisitions]

@router.post("/requisitions", response_model=JobRequisitionResponse, status_code=status.HTTP_201_CREATED)
def create_requisition(
    data: JobRequisitionCreate,
    current_user: User = Depends(require_roles([RoleEnum.SUPER_ADMIN, RoleEnum.HR_MANAGER, RoleEnum.RECRUITER])),
    db: Session = Depends(get_db)
):
    req = JobRequisition(
        title=data.title,
        department_id=data.department_id,
        designation_id=data.designation_id,
        openings_count=data.openings_count,
        experience_required=data.experience_required,
        employment_type=data.employment_type,
        location=data.location,
        salary_range=data.salary_range,
        status=data.status,
        job_description=data.job_description,
        hiring_manager_id=data.hiring_manager_id,
        recruiter_id=data.recruiter_id or current_user.id
    )
    db.add(req)
    db.commit()
    db.refresh(req)

    log_audit_event(
        db=db,
        actor=current_user,
        action="CREATE",
        entity_type="JOB_REQUISITION",
        entity_id=str(req.id),
        details=f"Opened requisition '{req.title}' ({req.openings_count} openings)"
    )

    return format_requisition_response(req)

@router.get("/candidates", response_model=List[CandidateResponse])
def list_candidates(
    stage: Optional[str] = None,
    job_requisition_id: Optional[int] = None,
    current_user: User = Depends(require_roles([RoleEnum.SUPER_ADMIN, RoleEnum.HR_MANAGER, RoleEnum.RECRUITER, RoleEnum.DEPT_MANAGER])),
    db: Session = Depends(get_db)
):
    query = db.query(Candidate)
    if stage:
        query = query.filter(Candidate.stage == stage)
    if job_requisition_id:
        query = query.filter(Candidate.job_requisition_id == job_requisition_id)

    candidates = query.order_by(Candidate.created_at.desc()).all()
    return [format_candidate_response(c) for c in candidates]

@router.post("/candidates", response_model=CandidateResponse, status_code=status.HTTP_201_CREATED)
def create_candidate(
    data: CandidateCreate,
    current_user: User = Depends(require_roles([RoleEnum.SUPER_ADMIN, RoleEnum.HR_MANAGER, RoleEnum.RECRUITER])),
    db: Session = Depends(get_db)
):
    candidate = Candidate(
        job_requisition_id=data.job_requisition_id,
        full_name=data.full_name,
        email=data.email,
        phone=data.phone,
        current_company=data.current_company,
        current_designation=data.current_designation,
        experience_years=data.experience_years,
        cover_letter=data.cover_letter,
        stage="APPLIED"
    )
    db.add(candidate)
    db.commit()
    db.refresh(candidate)

    log_audit_event(
        db=db,
        actor=current_user,
        action="CREATE",
        entity_type="CANDIDATE",
        entity_id=str(candidate.id),
        details=f"Added candidate {candidate.full_name} for requisition #{data.job_requisition_id}"
    )

    return format_candidate_response(candidate)

@router.put("/candidates/{candidate_id}", response_model=CandidateResponse)
def update_candidate_stage(
    candidate_id: int,
    data: CandidateUpdate,
    current_user: User = Depends(require_roles([RoleEnum.SUPER_ADMIN, RoleEnum.HR_MANAGER, RoleEnum.RECRUITER, RoleEnum.DEPT_MANAGER])),
    db: Session = Depends(get_db)
):
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate record not found")

    old_stage = candidate.stage
    if data.stage:
        candidate.stage = data.stage
    if data.rating is not None:
        candidate.rating = data.rating

    candidate.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(candidate)

    log_audit_event(
        db=db,
        actor=current_user,
        action="UPDATE",
        entity_type="CANDIDATE",
        entity_id=str(candidate.id),
        details=f"Candidate {candidate.full_name} moved from {old_stage} to {candidate.stage}"
    )

    return format_candidate_response(candidate)

@router.post("/interviews", response_model=InterviewResponse)
def schedule_interview(
    data: InterviewCreate,
    current_user: User = Depends(require_roles([RoleEnum.SUPER_ADMIN, RoleEnum.HR_MANAGER, RoleEnum.RECRUITER, RoleEnum.DEPT_MANAGER])),
    db: Session = Depends(get_db)
):
    interview = InterviewSchedule(
        candidate_id=data.candidate_id,
        round_name=data.round_name,
        interviewer_id=data.interviewer_id or current_user.id,
        scheduled_time=data.scheduled_time,
        meeting_link=data.meeting_link or "https://meet.google.com/ent-hrms-eval",
        status="SCHEDULED"
    )
    db.add(interview)
    
    # Move candidate to INTERVIEW stage if in earlier stage
    candidate = db.query(Candidate).filter(Candidate.id == data.candidate_id).first()
    if candidate and candidate.stage in ["APPLIED", "SCREENING"]:
        candidate.stage = "INTERVIEW"

    db.commit()
    db.refresh(interview)

    return InterviewResponse(
        id=interview.id,
        candidate_id=interview.candidate_id,
        round_name=interview.round_name,
        interviewer_name=current_user.full_name,
        scheduled_time=interview.scheduled_time,
        meeting_link=interview.meeting_link,
        status=interview.status,
        created_at=interview.created_at
    )

# --- Connected Business Workflow: Candidate to Onboarding Handover ---

@router.post("/candidates/{candidate_id}/hire", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
def hire_and_onboard_candidate(
    candidate_id: int,
    data: ConvertCandidateRequest,
    current_user: User = Depends(require_roles([RoleEnum.SUPER_ADMIN, RoleEnum.HR_MANAGER, RoleEnum.RECRUITER])),
    db: Session = Depends(get_db)
):
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    if candidate.converted_employee_id:
        raise HTTPException(status_code=400, detail="Candidate has already been converted to an employee.")

    req = candidate.job_requisition

    # Generate employee code
    emp_code = generate_unique_employee_id(db)
    first, *rest = candidate.full_name.split(" ")
    last = " ".join(rest) if rest else "Staff"

    # Provision user account
    user = User(
        email=candidate.email,
        hashed_password=get_password_hash("Enterprise@2026"),
        full_name=candidate.full_name,
        role=RoleEnum.EMPLOYEE.value,
        is_active=True,
        department_id=req.department_id if req else None
    )
    db.add(user)
    db.flush()

    # Create employee profile
    join_dt = date.today()
    new_employee = Employee(
        employee_id=emp_code,
        user_id=user.id,
        first_name=first,
        last_name=last,
        email=candidate.email,
        phone=candidate.phone,
        department_id=req.department_id if req else None,
        designation_id=req.designation_id if req else None,
        joining_date=join_dt,
        employment_type="Full-Time",
        status="Onboarding"
    )
    db.add(new_employee)
    db.flush()

    # Link candidate
    candidate.stage = "HIRED"
    candidate.converted_employee_id = new_employee.id

    # Add JOINED lifecycle event
    lifecycle = LifecycleEvent(
        employee_id=new_employee.id,
        event_type="JOINED",
        description=f"Hired from recruitment requisition '{req.title if req else 'Direct'}'. Initiated onboarding.",
        effective_date=join_dt,
        recorded_by=current_user.full_name
    )
    db.add(lifecycle)

    # Provision default onboarding checklist
    tasks = [
        ("Submit Government Photo ID & Verification", "Submit government-issued identity documents.", "COMPLIANCE", "Employee"),
        ("Sign Employment Agreement & NDA", "Review and electronically sign company policy.", "HR", "Employee"),
        ("Provision Workstation & Credentials", "Configure corporate workstation and email access.", "IT", "IT Administrator"),
        ("First Week Manager 1:1 Orientation", "Welcome briefing with department head.", "MANAGER", "Department Manager"),
    ]
    for title, desc, cat, assigned_role in tasks:
        db.add(OnboardingTask(
            employee_id=new_employee.id,
            title=title,
            description=desc,
            category=cat,
            assigned_role=assigned_role,
            is_completed=False,
            is_offboarding=False
        ))

    db.commit()
    db.refresh(new_employee)

    log_audit_event(
        db=db,
        actor=current_user,
        action="HIRE_CANDIDATE",
        entity_type="EMPLOYEE",
        entity_id=str(new_employee.id),
        details=f"Hired candidate {candidate.full_name} -> Created employee {new_employee.employee_id} and initiated onboarding"
    )

    return format_employee_response(new_employee)
