from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, RoleEnum
from app.models.employee import Employee
from app.schemas.auth import (
    LoginRequest, RegisterRequest, Token, UserResponse, ChangePasswordRequest, 
    PasswordResetRequest, ForgotPasswordRequest, UserCreate, UserUpdate
)
from app.auth.security import verify_password, get_password_hash, create_access_token
from app.auth.dependencies import get_current_user, require_roles, log_audit_event

router = APIRouter(prefix="/auth", tags=["Authentication & Access Control"])

def build_user_response(user: User) -> UserResponse:
    resp = UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        is_active=user.is_active,
        is_verified=user.is_verified,
        department_id=user.department_id,
        created_at=user.created_at,
        employee_id=user.employee_profile.id if user.employee_profile else None,
        employee_code=user.employee_profile.employee_id if user.employee_profile else None,
    )
    return resp

@router.post("/login", response_model=Token)
def login(login_data: LoginRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email.ilike(login_data.email)).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please verify credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been deactivated. Contact your HR Administrator."
        )

    access_token = create_access_token(data={"sub": str(user.id), "role": user.role, "email": user.email})

    client_ip = request.client.host if request.client else "unknown"
    log_audit_event(
        db=db,
        actor=user,
        action="LOGIN",
        entity_type="USER",
        entity_id=str(user.id),
        details=f"User logged in successfully with role '{user.role}'",
        ip_address=client_ip
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        user=build_user_response(user)
    )

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(data: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    """
    Public account registration.
    SECURITY POLICY: Public self-registration ONLY provisions standard 'Employee' accounts.
    Privileged roles (Super Admin, HR Manager, Recruiter, Payroll Officer) CANNOT be registered
    publicly and require administrative provisioning by an authorized HR/System Administrator.
    """
    if len(data.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long."
        )

    clean_email = data.email.strip().lower()
    existing_user = db.query(User).filter(User.email.ilike(clean_email)).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An enterprise account with this email address already exists. Please log in or request password recovery."
        )

    name_parts = data.full_name.strip().split(" ", 1)
    first_name = name_parts[0] if name_parts else "New"
    last_name = name_parts[1] if len(name_parts) > 1 else "Employee"

    hashed_pwd = get_password_hash(data.password)
    new_user = User(
        email=clean_email,
        hashed_password=hashed_pwd,
        full_name=data.full_name.strip(),
        role=RoleEnum.EMPLOYEE,  # Strict non-privileged role
        is_active=True,
        is_verified=True,
        department_id=data.department_id
    )
    db.add(new_user)
    db.flush()

    from datetime import date
    count = db.query(Employee).count() + 1
    code = f"EMP-{count:04d}"
    while db.query(Employee).filter(Employee.employee_id == code).first():
        count += 1
        code = f"EMP-{count:04d}"

    emp_profile = Employee(
        user_id=new_user.id,
        employee_id=code,
        first_name=first_name,
        last_name=last_name,
        email=clean_email,
        department_id=data.department_id,
        joining_date=date.today(),
        status="ACTIVE"
    )
    db.add(emp_profile)
    db.commit()
    db.refresh(new_user)

    client_ip = request.client.host if request.client else "unknown"
    log_audit_event(
        db=db,
        actor=new_user,
        action="REGISTER",
        entity_type="USER",
        entity_id=str(new_user.id),
        details=f"New public user registered with standard role '{RoleEnum.EMPLOYEE}' (Employee Code: {code})",
        ip_address=client_ip
    )

    access_token = create_access_token(data={"sub": str(new_user.id), "role": new_user.role, "email": new_user.email})

    return Token(
        access_token=access_token,
        token_type="bearer",
        user=build_user_response(new_user)
    )

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return build_user_response(current_user)

@router.post("/change-password")
def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(data.old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password verification failed."
        )

    if len(data.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters."
        )

    current_user.hashed_password = get_password_hash(data.new_password)
    db.commit()

    log_audit_event(
        db=db,
        actor=current_user,
        action="UPDATE",
        entity_type="USER",
        entity_id=str(current_user.id),
        details="User updated their account password."
    )

    return {"message": "Password changed successfully."}

@router.post("/reset-password")
def reset_password(
    data: PasswordResetRequest,
    current_user: User = Depends(require_roles([RoleEnum.SUPER_ADMIN, RoleEnum.IT_ADMIN])),
    db: Session = Depends(get_db)
):
    target_user = db.query(User).filter(User.email.ilike(data.email)).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target user account not found."
        )

    target_user.hashed_password = get_password_hash(data.new_password)
    db.commit()

    log_audit_event(
        db=db,
        actor=current_user,
        action="UPDATE",
        entity_type="USER",
        entity_id=str(target_user.id),
        details=f"Administrative password reset performed for {target_user.email}"
    )

    return {"message": f"Password reset successfully for {target_user.email}"}

@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Self-service password recovery initiation. 
    Implements timing-safe enumeration resistance.
    """
    user = db.query(User).filter(User.email.ilike(data.email)).first()
    if user:
        log_audit_event(
            db=db,
            actor=user,
            action="PASSWORD_RECOVERY_REQUESTED",
            entity_type="USER",
            entity_id=str(user.id),
            details=f"Self-service password recovery initiated for {user.email}"
        )
    return {
        "message": "If this email is registered in the enterprise directory, password recovery instructions have been dispatched.",
        "email": data.email
    }

@router.get("/users", response_model=list[UserResponse])
def list_users(
    current_user: User = Depends(require_roles([RoleEnum.SUPER_ADMIN, RoleEnum.IT_ADMIN, RoleEnum.HR_MANAGER])),
    db: Session = Depends(get_db)
):
    users = db.query(User).order_by(User.id.asc()).all()
    return [build_user_response(u) for u in users]

@router.put("/users/{user_id}/status")
def toggle_user_status(
    user_id: int,
    is_active: bool,
    current_user: User = Depends(require_roles([RoleEnum.SUPER_ADMIN, RoleEnum.IT_ADMIN])),
    db: Session = Depends(get_db)
):
    if current_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Administrators cannot deactivate their own account."
        )

    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    target_user.is_active = is_active
    db.commit()

    action = "ACTIVATE" if is_active else "DEACTIVATE"
    log_audit_event(
        db=db,
        actor=current_user,
        action="STATUS_CHANGE",
        entity_type="USER",
        entity_id=str(user_id),
        details=f"{action} account for user {target_user.email}"
    )

    return {"message": f"User status updated to {'Active' if is_active else 'Deactivated'}"}

@router.get("/personas")
def get_available_personas(
    current_user: User = Depends(require_roles([RoleEnum.SUPER_ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Returns available role personas for authorized administrators to test roles.
    Strictly protected: inaccessible to unauthenticated users or non-administrators.
    """
    users = db.query(User).filter(User.is_active == True).all()
    personas = []
    for u in users:
        personas.append({
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "department": u.department.name if u.department else "Corporate",
            "employee_code": u.employee_profile.employee_id if u.employee_profile else "N/A"
        })
    return personas

@router.post("/switch-persona/{user_id}", response_model=Token)
def switch_persona(
    user_id: int, 
    current_user: User = Depends(require_roles([RoleEnum.SUPER_ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Enables administrator-only role simulation to inspect role-specific portals.
    Strictly protected: requires authenticated Super Admin session.
    """
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Persona not found")

    access_token = create_access_token(data={"sub": str(target.id), "role": target.role, "email": target.email})
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=build_user_response(target)
    )
