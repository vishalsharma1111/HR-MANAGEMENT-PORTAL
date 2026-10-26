import math
from datetime import date, datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, func

from app.database import get_db
from app.models.user import User, RoleEnum
from app.models.employee import Employee, LifecycleEvent
from app.models.department import Department, Designation
from app.models.onboarding import OnboardingTask
from app.schemas.employee import (
    EmployeeCreate, EmployeeUpdate, EmployeeResponse, 
    PaginatedEmployeeResponse, OrgChartNode, LifecycleEventCreate, LifecycleEventResponse
)
from app.auth.dependencies import (
    get_current_user, require_roles, verify_employee_access, log_audit_event
)
from app.auth.security import get_password_hash

router = APIRouter(prefix="/employees", tags=["Core HR & Employees"])

def format_employee_response(emp: Employee) -> EmployeeResponse:
    dept_name = emp.department.name if emp.department else None
    desig_title = emp.designation.title if emp.designation else None
    manager_name = f"{emp.reporting_manager.first_name} {emp.reporting_manager.last_name}" if emp.reporting_manager else None
    direct_reports_count = len(emp.direct_reports) if hasattr(emp, "direct_reports") and emp.direct_reports else 0
    
    events = [
        LifecycleEventResponse(
            id=ev.id,
            employee_id=ev.employee_id,
            event_type=ev.event_type,
            description=ev.description,
            effective_date=ev.effective_date,
            recorded_by=ev.recorded_by,
            created_at=ev.created_at
        ) for ev in sorted(emp.lifecycle_events, key=lambda x: x.created_at, reverse=True)
    ]

    return EmployeeResponse(
        id=emp.id,
        employee_id=emp.employee_id,
        user_id=emp.user_id,
        first_name=emp.first_name,
        last_name=emp.last_name,
        email=emp.email,
        phone=emp.phone,
        personal_email=emp.personal_email,
        date_of_birth=emp.date_of_birth,
        gender=emp.gender,
        marital_status=emp.marital_status,
        department_id=emp.department_id,
        designation_id=emp.designation_id,
        reporting_manager_id=emp.reporting_manager_id,
        joining_date=emp.joining_date,
        employment_type=emp.employment_type,
        status=emp.status,
        exit_date=emp.exit_date,
        exit_reason=emp.exit_reason,
        location=emp.location,
        address=emp.address,
        emergency_contact_name=emp.emergency_contact_name,
        emergency_contact_phone=emp.emergency_contact_phone,
        created_at=emp.created_at,
        updated_at=emp.updated_at,
        department_name=dept_name,
        designation_title=desig_title,
        reporting_manager_name=manager_name,
        direct_reports_count=direct_reports_count,
        lifecycle_events=events
    )

def generate_unique_employee_id(db: Session) -> str:
    count = db.query(Employee).count() + 1
    code = f"EMP-{count:04d}"
    while db.query(Employee).filter(Employee.employee_id == code).first():
        count += 1
        code = f"EMP-{count:04d}"
    return code

@router.get("", response_model=PaginatedEmployeeResponse)
def list_employees(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    department_id: Optional[int] = None,
    designation_id: Optional[int] = None,
    status: Optional[str] = None,
    employment_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Employee)

    # Department Manager restriction: can only view employees in their own department
    if current_user.role == RoleEnum.DEPT_MANAGER.value:
        if current_user.department_id:
            query = query.filter(Employee.department_id == current_user.department_id)
        else:
            query = query.filter(Employee.id == (current_user.employee_profile.id if current_user.employee_profile else -1))
    elif current_user.role == RoleEnum.EMPLOYEE.value:
        # Regular employee only sees themselves in directory list
        if current_user.employee_profile:
            query = query.filter(Employee.id == current_user.employee_profile.id)
        else:
            query = query.filter(Employee.id == -1)

    # Search filter
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                Employee.first_name.ilike(search_filter),
                Employee.last_name.ilike(search_filter),
                Employee.email.ilike(search_filter),
                Employee.employee_id.ilike(search_filter)
            )
        )

    if department_id:
        query = query.filter(Employee.department_id == department_id)
    if designation_id:
        query = query.filter(Employee.designation_id == designation_id)
    if status:
        query = query.filter(Employee.status == status)
    if employment_type:
        query = query.filter(Employee.employment_type == employment_type)

    total = query.count()
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    employees = query.order_by(Employee.id.asc()).offset((page - 1) * page_size).limit(page_size).all()
    items = [format_employee_response(e) for e in employees]

    return PaginatedEmployeeResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.post("", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
def create_employee(
    emp_data: EmployeeCreate,
    current_user: User = Depends(require_roles([RoleEnum.SUPER_ADMIN, RoleEnum.HR_MANAGER, RoleEnum.RECRUITER])),
    db: Session = Depends(get_db)
):
    # Check duplicate email
    if db.query(Employee).filter(Employee.email.ilike(emp_data.email)).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"An employee with email '{emp_data.email}' already exists."
        )

    # Generate or validate unique employee code
    emp_code = emp_data.employee_id.strip() if emp_data.employee_id else generate_unique_employee_id(db)
    if db.query(Employee).filter(Employee.employee_id == emp_code).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Employee ID code '{emp_code}' is already assigned. It must be unique."
        )

    # Create linked user account if requested
    user_id = None
    if emp_data.create_user_account:
        existing_user = db.query(User).filter(User.email.ilike(emp_data.email)).first()
        if existing_user:
            user_id = existing_user.id
        else:
            new_user = User(
                email=emp_data.email,
                hashed_password=get_password_hash(emp_data.user_password or "Enterprise@2026"),
                full_name=f"{emp_data.first_name} {emp_data.last_name}",
                role=emp_data.user_role or RoleEnum.EMPLOYEE.value,
                is_active=True,
                department_id=emp_data.department_id
            )
            db.add(new_user)
            db.flush()
            user_id = new_user.id

    new_employee = Employee(
        employee_id=emp_code,
        user_id=user_id,
        first_name=emp_data.first_name,
        last_name=emp_data.last_name,
        email=emp_data.email,
        phone=emp_data.phone,
        personal_email=emp_data.personal_email,
        date_of_birth=emp_data.date_of_birth,
        gender=emp_data.gender,
        marital_status=emp_data.marital_status,
        department_id=emp_data.department_id,
        designation_id=emp_data.designation_id,
        reporting_manager_id=emp_data.reporting_manager_id,
        joining_date=emp_data.joining_date or date.today(),
        employment_type=emp_data.employment_type,
        status=emp_data.status,
        location=emp_data.location,
        address=emp_data.address,
        emergency_contact_name=emp_data.emergency_contact_name,
        emergency_contact_phone=emp_data.emergency_contact_phone
    )
    db.add(new_employee)
    db.flush()

    # Record initial lifecycle event
    lifecycle_joined = LifecycleEvent(
        employee_id=new_employee.id,
        event_type="JOINED",
        description=f"Joined organization as {emp_data.employment_type} employee.",
        effective_date=new_employee.joining_date,
        recorded_by=current_user.full_name
    )
    db.add(lifecycle_joined)

    # Automatically provision default onboarding checklist
    default_tasks = [
        ("Submit Government Photo ID & Verification", "Submit government-issued national identity card or passport.", "COMPLIANCE", "Employee"),
        ("Sign Employment Agreement & NDA", "Review and electronically sign company terms and confidentiality policy.", "HR", "Employee"),
        ("IT Hardware & Workstation Setup", "Assign enterprise laptop, security token, and peripherals.", "IT", "IT Administrator"),
        ("Corporate Email & Single Sign-On Access", "Configure Google Workspace/Active Directory and VPN credentials.", "IT", "IT Administrator"),
        ("Department & Team Orientation", "Schedule 1:1 welcome session with reporting manager.", "MANAGER", "Department Manager"),
        ("Benefits Enrollment & Direct Deposit", "Configure payroll bank details and health insurance coverage.", "HR", "HR Manager"),
    ]

    for title, desc, cat, assigned_role in default_tasks:
        task = OnboardingTask(
            employee_id=new_employee.id,
            title=title,
            description=desc,
            category=cat,
            assigned_role=assigned_role,
            is_completed=False,
            is_offboarding=False
        )
        db.add(task)

    db.commit()
    db.refresh(new_employee)

    log_audit_event(
        db=db,
        actor=current_user,
        action="CREATE",
        entity_type="EMPLOYEE",
        entity_id=str(new_employee.id),
        details=f"Created employee {new_employee.first_name} {new_employee.last_name} ({new_employee.employee_id})"
    )

    return format_employee_response(new_employee)

@router.get("/{employee_id}", response_model=EmployeeResponse)
def get_employee_detail(
    employee_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    emp = verify_employee_access(target_employee_id=employee_id, current_user=current_user, db=db)
    return format_employee_response(emp)

@router.put("/{employee_id}", response_model=EmployeeResponse)
def update_employee(
    employee_id: int,
    update_data: EmployeeUpdate,
    current_user: User = Depends(require_roles([RoleEnum.SUPER_ADMIN, RoleEnum.HR_MANAGER, RoleEnum.DEPT_MANAGER])),
    db: Session = Depends(get_db)
):
    emp = verify_employee_access(target_employee_id=employee_id, current_user=current_user, db=db)

    # Department manager can only update basic contact info or notes, not designation/status/department
    if current_user.role == RoleEnum.DEPT_MANAGER.value and (
        update_data.department_id is not None or 
        update_data.status is not None or 
        update_data.designation_id is not None
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Department Managers cannot modify department, designation, or employment status directly. Contact HR."
        )

    old_status = emp.status
    fields_updated = []

    for field, val in update_data.model_dump(exclude_unset=True).items():
        if getattr(emp, field) != val:
            fields_updated.append(field)
            setattr(emp, field, val)

    # If status changed to Terminated / Resigned, trigger offboarding checklist & lifecycle event
    if update_data.status and update_data.status != old_status:
        lifecycle_event = LifecycleEvent(
            employee_id=emp.id,
            event_type="STATUS_CHANGE",
            description=f"Employment status updated from {old_status} to {update_data.status}. Reason: {update_data.exit_reason or 'Status change'}",
            effective_date=update_data.exit_date or date.today(),
            recorded_by=current_user.full_name
        )
        db.add(lifecycle_event)

        if update_data.status in ["Terminated", "Resigned", "Notice Period"]:
            offboarding_tasks = [
                ("Conduct HR Exit Interview", "Complete confidential exit interview feedback form.", "HR", "HR Manager"),
                ("Asset & Equipment Return", "Collect laptop, security badges, monitors, and company tokens.", "IT", "IT Administrator"),
                ("Revoke Cloud & System Access", "Deactivate enterprise accounts, email, and VPN authorization.", "IT", "IT Administrator"),
                ("Final Settlement & Clearance", "Compute accrued leave balance and finalize payroll clearance.", "HR", "Payroll Officer"),
            ]
            for title, desc, cat, assigned_role in offboarding_tasks:
                task = OnboardingTask(
                    employee_id=emp.id,
                    title=title,
                    description=desc,
                    category=cat,
                    assigned_role=assigned_role,
                    is_completed=False,
                    is_offboarding=True
                )
                db.add(task)

    emp.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(emp)

    log_audit_event(
        db=db,
        actor=current_user,
        action="UPDATE",
        entity_type="EMPLOYEE",
        entity_id=str(emp.id),
        details=f"Updated employee fields: {', '.join(fields_updated)}"
    )

    return format_employee_response(emp)

@router.delete("/{employee_id}")
def deactivate_employee(
    employee_id: int,
    current_user: User = Depends(require_roles([RoleEnum.SUPER_ADMIN, RoleEnum.HR_MANAGER])),
    db: Session = Depends(get_db)
):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    emp.status = "Terminated"
    emp.exit_date = date.today()
    emp.exit_reason = f"Deactivated by {current_user.full_name}"

    if emp.user:
        emp.user.is_active = False

    lifecycle = LifecycleEvent(
        employee_id=emp.id,
        event_type="EXITED",
        description=f"Employee deactivated and record archived by {current_user.full_name}",
        effective_date=date.today(),
        recorded_by=current_user.full_name
    )
    db.add(lifecycle)
    db.commit()

    log_audit_event(
        db=db,
        actor=current_user,
        action="STATUS_CHANGE",
        entity_type="EMPLOYEE",
        entity_id=str(emp.id),
        details=f"Deactivated employee {emp.first_name} {emp.last_name}"
    )

    return {"message": f"Employee {emp.first_name} {emp.last_name} deactivated successfully."}

@router.get("/organization/org-chart", response_model=List[OrgChartNode])
def get_organization_chart(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Builds the hierarchical org tree starting from top leadership down to individual contributors.
    """
    all_employees = db.query(Employee).filter(Employee.status.in_(["Active", "Probation", "Onboarding"])).all()
    
    # Map employees by ID
    emp_map = {}
    for e in all_employees:
        emp_map[e.id] = {
            "id": e.id,
            "employee_id": e.employee_id,
            "name": f"{e.first_name} {e.last_name}",
            "title": e.designation.title if e.designation else "Staff",
            "department": e.department.name if e.department else "General",
            "email": e.email,
            "status": e.status,
            "manager_id": e.reporting_manager_id,
            "children": []
        }

    root_nodes = []
    for emp_id, node in emp_map.items():
        mgr_id = node["manager_id"]
        if mgr_id and mgr_id in emp_map and mgr_id != emp_id:
            emp_map[mgr_id]["children"].append(node)
        else:
            root_nodes.append(node)

    def to_pydantic(item) -> OrgChartNode:
        return OrgChartNode(
            id=item["id"],
            employee_id=item["employee_id"],
            name=item["name"],
            title=item["title"],
            department=item["department"],
            email=item["email"],
            status=item["status"],
            children=[to_pydantic(c) for c in item["children"]]
        )

    return [to_pydantic(r) for r in root_nodes]
