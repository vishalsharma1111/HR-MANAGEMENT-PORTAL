from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.user import User, RoleEnum
from app.models.employee import Employee
from app.models.department import Department
from app.models.onboarding import OnboardingTask
from app.models.audit import AuditLog
from app.models.announcement import Announcement
from app.schemas.dashboard import (
    DashboardStatsResponse, DepartmentDistributionItem, 
    StatusDistributionItem, AuditLogResponse, AnnouncementResponse
)
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Enterprise Analytics & Dashboard"])

@router.get("/metrics", response_model=DashboardStatsResponse)
def get_dashboard_metrics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    emp_query = db.query(Employee)

    # Department manager sees metrics for their department
    if current_user.role == RoleEnum.DEPT_MANAGER.value and current_user.department_id:
        emp_query = emp_query.filter(Employee.department_id == current_user.department_id)

    total_emps = emp_query.count()
    active_emps = emp_query.filter(Employee.status == "Active").count()
    probation_emps = emp_query.filter(Employee.status == "Probation").count()
    onboarding_emps = emp_query.filter(Employee.status == "Onboarding").count()
    total_depts = db.query(Department).count()

    # Onboarding tasks
    task_query = db.query(OnboardingTask).filter(OnboardingTask.is_offboarding == False)
    if current_user.role == RoleEnum.DEPT_MANAGER.value and current_user.department_id:
        dept_emp_ids = [e.id for e in db.query(Employee.id).filter(Employee.department_id == current_user.department_id).all()]
        task_query = task_query.filter(OnboardingTask.employee_id.in_(dept_emp_ids))
    elif current_user.role == RoleEnum.EMPLOYEE.value:
        emp_id = current_user.employee_profile.id if current_user.employee_profile else -1
        task_query = task_query.filter(OnboardingTask.employee_id == emp_id)

    total_tasks = task_query.count()
    completed_tasks = task_query.filter(OnboardingTask.is_completed == True).count()
    open_tasks = total_tasks - completed_tasks
    rate = round((completed_tasks / total_tasks * 100), 1) if total_tasks > 0 else 100.0

    # Department Distribution
    dept_distribution = []
    dept_counts = (
        db.query(Department.name, func.count(Employee.id))
        .outerjoin(Employee, Department.id == Employee.department_id)
        .group_by(Department.id)
        .all()
    )
    for name, cnt in dept_counts:
        dept_distribution.append(DepartmentDistributionItem(department=name, count=cnt))

    # Status Distribution
    status_distribution = []
    status_counts = (
        emp_query.with_entities(Employee.status, func.count(Employee.id))
        .group_by(Employee.status)
        .all()
    )
    for st, cnt in status_counts:
        status_distribution.append(StatusDistributionItem(status=st, count=cnt))

    # Recent Audit Activity
    audit_query = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(8).all()
    recent_activity = [
        AuditLogResponse(
            id=a.id,
            actor_id=a.actor_id,
            actor_email=a.actor_email,
            actor_role=a.actor_role,
            action=a.action,
            entity_type=a.entity_type,
            entity_id=a.entity_id,
            details=a.details,
            ip_address=a.ip_address,
            created_at=a.created_at
        ) for a in audit_query
    ]

    # Announcements
    announcements = db.query(Announcement).order_by(
        Announcement.is_pinned.desc(),
        Announcement.created_at.desc()
    ).limit(5).all()

    ann_list = [
        AnnouncementResponse(
            id=an.id,
            title=an.title,
            content=an.content,
            priority=an.priority,
            is_pinned=an.is_pinned,
            author_name=an.author_name,
            department_target=an.department_target,
            created_at=an.created_at
        ) for an in announcements
    ]

    return DashboardStatsResponse(
        total_employees=total_emps,
        active_employees=active_emps,
        probation_employees=probation_emps,
        onboarding_employees=onboarding_emps,
        total_departments=total_depts,
        open_tasks=open_tasks,
        onboarding_completion_rate=rate,
        department_distribution=dept_distribution,
        status_distribution=status_distribution,
        recent_activity=recent_activity,
        announcements=ann_list
    )
