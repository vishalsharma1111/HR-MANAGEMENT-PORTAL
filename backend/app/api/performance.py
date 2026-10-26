from datetime import datetime, date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, RoleEnum
from app.models.employee import Employee
from app.models.performance import (
    PerformanceCycle, Goal, PerformanceReview, Course, CourseEnrollment,
    EmployeeSkill, PeerRecognition
)
from app.schemas.performance import (
    CycleCreate, CycleResponse, GoalCreate, GoalUpdate, GoalResponse,
    ReviewSubmitRequest, ReviewResponse, CourseCreate, CourseResponse,
    EnrollmentResponse, SkillCreate, SkillResponse, RecognitionCreate,
    RecognitionResponse
)
from app.auth.dependencies import (
    get_current_user, require_roles, verify_employee_access, log_audit_event
)

router = APIRouter(prefix="/performance", tags=["Performance & Learning Hub"])

# --- Review Cycles & Goals / OKRs ---

@router.get("/cycles", response_model=List[CycleResponse])
def list_cycles(db: Session = Depends(get_db)):
    return db.query(PerformanceCycle).order_by(PerformanceCycle.created_at.desc()).all()

@router.post("/cycles", response_model=CycleResponse, status_code=status.HTTP_201_CREATED)
def create_cycle(
    data: CycleCreate,
    current_user: User = Depends(require_roles([RoleEnum.SUPER_ADMIN, RoleEnum.HR_MANAGER])),
    db: Session = Depends(get_db)
):
    cycle = PerformanceCycle(
        title=data.title,
        start_date=data.start_date,
        end_date=data.end_date,
        status=data.status
    )
    db.add(cycle)
    db.commit()
    db.refresh(cycle)
    return cycle

@router.get("/goals", response_model=List[GoalResponse])
def list_goals(
    employee_id: Optional[int] = None,
    cycle_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Goal)

    if current_user.role == RoleEnum.EMPLOYEE.value:
        emp_id = current_user.employee_profile.id if current_user.employee_profile else -1
        query = query.filter(Goal.employee_id == emp_id)
    elif employee_id:
        verify_employee_access(employee_id, current_user, db)
        query = query.filter(Goal.employee_id == employee_id)

    if cycle_id:
        query = query.filter(Goal.cycle_id == cycle_id)

    goals = query.order_by(Goal.created_at.desc()).all()
    return [
        GoalResponse(
            id=g.id,
            employee_id=g.employee_id,
            employee_name=f"{g.employee.first_name} {g.employee.last_name}" if g.employee else None,
            cycle_id=g.cycle_id,
            cycle_title=g.cycle.title if g.cycle else None,
            title=g.title,
            description=g.description,
            category=g.category,
            weightage=g.weightage,
            progress=g.progress,
            target_metric=g.target_metric,
            status=g.status,
            created_at=g.created_at
        ) for g in goals
    ]

@router.post("/goals", response_model=GoalResponse, status_code=status.HTTP_201_CREATED)
def create_goal(
    data: GoalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.employee_profile:
        raise HTTPException(status_code=400, detail="User account is not linked to an employee profile.")

    goal = Goal(
        employee_id=current_user.employee_profile.id,
        cycle_id=data.cycle_id,
        title=data.title,
        description=data.description,
        category=data.category,
        weightage=data.weightage,
        progress=0,
        target_metric=data.target_metric,
        status="ON_TRACK"
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)

    return GoalResponse(
        id=goal.id,
        employee_id=goal.employee_id,
        employee_name=current_user.full_name,
        cycle_id=goal.cycle_id,
        cycle_title=goal.cycle.title if goal.cycle else None,
        title=goal.title,
        description=goal.description,
        category=goal.category,
        weightage=goal.weightage,
        progress=goal.progress,
        target_metric=goal.target_metric,
        status=goal.status,
        created_at=goal.created_at
    )

@router.put("/goals/{goal_id}", response_model=GoalResponse)
def update_goal_progress(
    goal_id: int,
    data: GoalUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    verify_employee_access(goal.employee_id, current_user, db)

    if data.progress is not None:
        goal.progress = max(0, min(100, data.progress))
        if goal.progress == 100:
            goal.status = "COMPLETED"
    if data.status:
        goal.status = data.status

    goal.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(goal)

    return GoalResponse(
        id=goal.id,
        employee_id=goal.employee_id,
        employee_name=f"{goal.employee.first_name} {goal.employee.last_name}" if goal.employee else None,
        cycle_id=goal.cycle_id,
        cycle_title=goal.cycle.title if goal.cycle else None,
        title=goal.title,
        description=goal.description,
        category=goal.category,
        weightage=goal.weightage,
        progress=goal.progress,
        target_metric=goal.target_metric,
        status=goal.status,
        created_at=goal.created_at
    )

# --- Reviews (Self & Manager 1-5 Scale) ---

@router.get("/reviews", response_model=List[ReviewResponse])
def list_reviews(
    cycle_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(PerformanceReview)

    if current_user.role == RoleEnum.EMPLOYEE.value:
        emp_id = current_user.employee_profile.id if current_user.employee_profile else -1
        query = query.filter(PerformanceReview.employee_id == emp_id)
    elif current_user.role == RoleEnum.DEPT_MANAGER.value and current_user.department_id:
        dept_emp_ids = [e.id for e in db.query(Employee.id).filter(Employee.department_id == current_user.department_id).all()]
        query = query.filter(PerformanceReview.employee_id.in_(dept_emp_ids))

    if cycle_id:
        query = query.filter(PerformanceReview.cycle_id == cycle_id)

    reviews = query.all()
    return [
        ReviewResponse(
            id=r.id,
            cycle_id=r.cycle_id,
            cycle_title=r.cycle.title if r.cycle else None,
            employee_id=r.employee_id,
            employee_name=f"{r.employee.first_name} {r.employee.last_name}" if r.employee else None,
            reviewer_name=r.reviewer.full_name if r.reviewer else None,
            self_rating=r.self_rating,
            self_comments=r.self_comments,
            manager_rating=r.manager_rating,
            manager_comments=r.manager_comments,
            final_rating=r.final_rating,
            status=r.status,
            updated_at=r.updated_at
        ) for r in reviews
    ]

@router.put("/reviews/{review_id}/submit", response_model=ReviewResponse)
def submit_review(
    review_id: int,
    data: ReviewSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    review = db.query(PerformanceReview).filter(PerformanceReview.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    is_self = current_user.employee_profile and current_user.employee_profile.id == review.employee_id
    is_manager = current_user.role in [RoleEnum.SUPER_ADMIN.value, RoleEnum.HR_MANAGER.value, RoleEnum.DEPT_MANAGER.value]

    if is_self:
        if data.self_rating is not None:
            review.self_rating = data.self_rating
        if data.self_comments is not None:
            review.self_comments = data.self_comments
        review.status = "SUBMITTED_BY_EMPLOYEE"

    if is_manager and not is_self:
        review.reviewer_id = current_user.id
        if data.manager_rating is not None:
            review.manager_rating = data.manager_rating
        if data.manager_comments is not None:
            review.manager_comments = data.manager_comments
        review.final_rating = review.manager_rating
        review.status = "COMPLETED"

    review.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(review)

    return ReviewResponse(
        id=review.id,
        cycle_id=review.cycle_id,
        cycle_title=review.cycle.title if review.cycle else None,
        employee_id=review.employee_id,
        employee_name=f"{review.employee.first_name} {review.employee.last_name}" if review.employee else None,
        reviewer_name=review.reviewer.full_name if review.reviewer else None,
        self_rating=review.self_rating,
        self_comments=review.self_comments,
        manager_rating=review.manager_rating,
        manager_comments=review.manager_comments,
        final_rating=review.final_rating,
        status=review.status,
        updated_at=review.updated_at
    )

# --- Learning Catalog, Skills & Peer Recognition ---

@router.get("/courses", response_model=List[CourseResponse])
def list_courses(db: Session = Depends(get_db)):
    return db.query(Course).all()

@router.post("/courses/{course_id}/enroll", response_model=EnrollmentResponse)
def enroll_course(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.employee_profile:
        raise HTTPException(status_code=400, detail="Account is not linked to an employee profile.")

    emp_id = current_user.employee_profile.id
    enrollment = db.query(CourseEnrollment).filter(
        CourseEnrollment.course_id == course_id,
        CourseEnrollment.employee_id == emp_id
    ).first()

    if not enrollment:
        enrollment = CourseEnrollment(
            course_id=course_id,
            employee_id=emp_id,
            status="IN_PROGRESS"
        )
        db.add(enrollment)
        db.commit()
        db.refresh(enrollment)

    course = enrollment.course
    return EnrollmentResponse(
        id=enrollment.id,
        course_id=course.id,
        course_title=course.title,
        course_code=course.code,
        category=course.category,
        duration_hours=course.duration_hours,
        employee_id=enrollment.employee_id,
        enrolled_date=enrollment.enrolled_date,
        completion_date=enrollment.completion_date,
        status=enrollment.status,
        score=enrollment.score,
        certificate_url=enrollment.certificate_url
    )

@router.get("/recognitions", response_model=List[RecognitionResponse])
def list_recognitions(db: Session = Depends(get_db)):
    recs = db.query(PeerRecognition).order_by(PeerRecognition.created_at.desc()).limit(30).all()
    return [
        RecognitionResponse(
            id=r.id,
            giver_name=r.giver.full_name,
            receiver_name=f"{r.receiver.first_name} {r.receiver.last_name}",
            badge=r.badge,
            message=r.message,
            created_at=r.created_at
        ) for r in recs
    ]

@router.post("/recognitions", response_model=RecognitionResponse, status_code=status.HTTP_201_CREATED)
def give_recognition(
    data: RecognitionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rec = PeerRecognition(
        giver_id=current_user.id,
        receiver_id=data.receiver_id,
        badge=data.badge,
        message=data.message
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)

    return RecognitionResponse(
        id=rec.id,
        giver_name=current_user.full_name,
        receiver_name=f"{rec.receiver.first_name} {rec.receiver.last_name}",
        badge=rec.badge,
        message=rec.message,
        created_at=rec.created_at
    )
