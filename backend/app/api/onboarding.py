from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, RoleEnum
from app.models.onboarding import OnboardingTask
from app.models.employee import Employee
from app.schemas.onboarding import (
    OnboardingTaskCreate, OnboardingTaskUpdate, 
    OnboardingTaskResponse, OnboardingSummary
)
from app.auth.dependencies import get_current_user, require_roles, verify_employee_access, log_audit_event

router = APIRouter(prefix="/onboarding", tags=["Onboarding & Offboarding Lifecycle"])

def format_task_response(t: OnboardingTask) -> OnboardingTaskResponse:
    emp_name = f"{t.employee.first_name} {t.employee.last_name}" if t.employee else "Unknown"
    return OnboardingTaskResponse(
        id=t.id,
        employee_id=t.employee_id,
        employee_name=emp_name,
        title=t.title,
        description=t.description,
        category=t.category,
        is_completed=t.is_completed,
        completed_at=t.completed_at,
        completed_by=t.completed_by,
        due_date=t.due_date,
        assigned_role=t.assigned_role,
        is_offboarding=t.is_offboarding,
        created_at=t.created_at
    )

@router.get("", response_model=List[OnboardingTaskResponse])
def list_tasks(
    employee_id: Optional[int] = None,
    is_offboarding: Optional[bool] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(OnboardingTask)

    if employee_id:
        verify_employee_access(target_employee_id=employee_id, current_user=current_user, db=db)
        query = query.filter(OnboardingTask.employee_id == employee_id)
    else:
        if current_user.role in [RoleEnum.SUPER_ADMIN.value, RoleEnum.HR_MANAGER.value]:
            pass
        elif current_user.role == RoleEnum.DEPT_MANAGER.value:
            if current_user.department_id:
                dept_emp_ids = [e.id for e in db.query(Employee.id).filter(Employee.department_id == current_user.department_id).all()]
                query = query.filter(OnboardingTask.employee_id.in_(dept_emp_ids))
            else:
                query = query.filter(OnboardingTask.id == -1)
        elif current_user.role == RoleEnum.EMPLOYEE.value:
            emp_id = current_user.employee_profile.id if current_user.employee_profile else -1
            query = query.filter(OnboardingTask.employee_id == emp_id)

    if is_offboarding is not None:
        query = query.filter(OnboardingTask.is_offboarding == is_offboarding)

    tasks = query.order_by(OnboardingTask.is_completed.asc(), OnboardingTask.id.asc()).all()
    return [format_task_response(t) for t in tasks]

@router.post("/tasks", response_model=OnboardingTaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    task_data: OnboardingTaskCreate,
    current_user: User = Depends(require_roles([RoleEnum.SUPER_ADMIN, RoleEnum.HR_MANAGER, RoleEnum.DEPT_MANAGER])),
    db: Session = Depends(get_db)
):
    verify_employee_access(target_employee_id=task_data.employee_id, current_user=current_user, db=db)

    task = OnboardingTask(
        employee_id=task_data.employee_id,
        title=task_data.title,
        description=task_data.description,
        category=task_data.category,
        due_date=task_data.due_date,
        assigned_role=task_data.assigned_role,
        is_offboarding=task_data.is_offboarding,
        is_completed=False
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    workflow_name = "offboarding" if task_data.is_offboarding else "onboarding"
    log_audit_event(
        db=db,
        actor=current_user,
        action="CREATE",
        entity_type="ONBOARDING",
        entity_id=str(task.id),
        details=f"Created {workflow_name} task: '{task.title}'"
    )

    return format_task_response(task)

@router.put("/tasks/{task_id}", response_model=OnboardingTaskResponse)
def update_task(
    task_id: int,
    task_update: OnboardingTaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(OnboardingTask).filter(OnboardingTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    verify_employee_access(target_employee_id=task.employee_id, current_user=current_user, db=db)

    for field, val in task_update.model_dump(exclude_unset=True).items():
        setattr(task, field, val)

    if task_update.is_completed is not None:
        if task_update.is_completed:
            task.completed_at = datetime.utcnow()
            task.completed_by = current_user.full_name
        else:
            task.completed_at = None
            task.completed_by = None

    db.commit()
    db.refresh(task)

    log_audit_event(
        db=db,
        actor=current_user,
        action="UPDATE",
        entity_type="ONBOARDING",
        entity_id=str(task.id),
        details=f"Updated task '{task.title}' (Completed: {task.is_completed})"
    )

    return format_task_response(task)

@router.get("/summary", response_model=OnboardingSummary)
def get_onboarding_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(OnboardingTask).filter(OnboardingTask.is_offboarding == False)
    
    if current_user.role == RoleEnum.DEPT_MANAGER.value and current_user.department_id:
        dept_emp_ids = [e.id for e in db.query(Employee.id).filter(Employee.department_id == current_user.department_id).all()]
        query = query.filter(OnboardingTask.employee_id.in_(dept_emp_ids))
    elif current_user.role == RoleEnum.EMPLOYEE.value:
        emp_id = current_user.employee_profile.id if current_user.employee_profile else -1
        query = query.filter(OnboardingTask.employee_id == emp_id)

    total = query.count()
    completed = query.filter(OnboardingTask.is_completed == True).count()
    pending = total - completed
    rate = round((completed / total * 100), 1) if total > 0 else 100.0

    return OnboardingSummary(
        total_tasks=total,
        completed_tasks=completed,
        pending_tasks=pending,
        completion_rate=rate
    )
