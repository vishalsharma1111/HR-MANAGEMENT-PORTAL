from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.user import User, RoleEnum
from app.models.department import Department, Designation
from app.models.employee import Employee
from app.schemas.department import (
    DepartmentCreate, DepartmentUpdate, DepartmentResponse,
    DesignationCreate, DesignationResponse
)
from app.auth.dependencies import get_current_user, require_roles, log_audit_event

router = APIRouter(prefix="/departments", tags=["Departments & Designations"])

def format_dept_response(d: Department, db: Session) -> DepartmentResponse:
    emp_count = db.query(Employee).filter(Employee.department_id == d.id).count()
    mgr_name = d.manager.full_name if d.manager else None
    
    designations = [
        DesignationResponse(
            id=des.id,
            title=des.title,
            code=des.code,
            department_id=des.department_id,
            description=des.description,
            level=des.level,
            created_at=des.created_at
        ) for des in d.designations
    ]

    return DepartmentResponse(
        id=d.id,
        name=d.name,
        code=d.code,
        description=d.description,
        manager_id=d.manager_id,
        created_at=d.created_at,
        updated_at=d.updated_at,
        designations=designations,
        employee_count=emp_count,
        manager_name=mgr_name
    )

@router.get("", response_model=List[DepartmentResponse])
def list_departments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    depts = db.query(Department).order_by(Department.name.asc()).all()
    return [format_dept_response(d, db) for d in depts]

@router.post("", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
def create_department(
    dept_data: DepartmentCreate,
    current_user: User = Depends(require_roles([RoleEnum.SUPER_ADMIN, RoleEnum.HR_MANAGER])),
    db: Session = Depends(get_db)
):
    if db.query(Department).filter(Department.name.ilike(dept_data.name)).first():
        raise HTTPException(status_code=400, detail=f"Department '{dept_data.name}' already exists.")
    if db.query(Department).filter(Department.code.ilike(dept_data.code)).first():
        raise HTTPException(status_code=400, detail=f"Department code '{dept_data.code}' is already in use.")

    new_dept = Department(
        name=dept_data.name,
        code=dept_data.code.upper(),
        description=dept_data.description,
        manager_id=dept_data.manager_id
    )
    db.add(new_dept)
    db.commit()
    db.refresh(new_dept)

    log_audit_event(
        db=db,
        actor=current_user,
        action="CREATE",
        entity_type="DEPARTMENT",
        entity_id=str(new_dept.id),
        details=f"Created department {new_dept.name} ({new_dept.code})"
    )

    return format_dept_response(new_dept, db)

@router.put("/{department_id}", response_model=DepartmentResponse)
def update_department(
    department_id: int,
    dept_data: DepartmentUpdate,
    current_user: User = Depends(require_roles([RoleEnum.SUPER_ADMIN, RoleEnum.HR_MANAGER])),
    db: Session = Depends(get_db)
):
    dept = db.query(Department).filter(Department.id == department_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")

    for field, val in dept_data.model_dump(exclude_unset=True).items():
        setattr(dept, field, val)

    db.commit()
    db.refresh(dept)

    log_audit_event(
        db=db,
        actor=current_user,
        action="UPDATE",
        entity_type="DEPARTMENT",
        entity_id=str(dept.id),
        details=f"Updated department {dept.name}"
    )

    return format_dept_response(dept, db)

@router.get("/designations/all", response_model=List[DesignationResponse])
def list_all_designations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    designations = db.query(Designation).order_by(Designation.title.asc()).all()
    return [
        DesignationResponse(
            id=d.id,
            title=d.title,
            code=d.code,
            department_id=d.department_id,
            description=d.description,
            level=d.level,
            created_at=d.created_at
        ) for d in designations
    ]

@router.post("/designations", response_model=DesignationResponse, status_code=status.HTTP_201_CREATED)
def create_designation(
    desig_data: DesignationCreate,
    current_user: User = Depends(require_roles([RoleEnum.SUPER_ADMIN, RoleEnum.HR_MANAGER])),
    db: Session = Depends(get_db)
):
    new_desig = Designation(
        title=desig_data.title,
        code=desig_data.code.upper(),
        department_id=desig_data.department_id,
        description=desig_data.description,
        level=desig_data.level
    )
    db.add(new_desig)
    db.commit()
    db.refresh(new_desig)

    return DesignationResponse(
        id=new_desig.id,
        title=new_desig.title,
        code=new_desig.code,
        department_id=new_desig.department_id,
        description=new_desig.description,
        level=new_desig.level,
        created_at=new_desig.created_at
    )
