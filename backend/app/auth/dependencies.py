from typing import List, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth.security import decode_access_token
from app.models.user import User, RoleEnum
from app.models.employee import Employee
from app.models.audit import AuditLog

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id: Optional[str] = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token identity payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account no longer exists",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been deactivated. Please contact HR Administrator.",
        )
        
    return user

def require_roles(allowed_roles: List[RoleEnum]):
    """
    Role-Based Access Control dependency factory.
    Enforces authorization at the endpoint level.
    """
    allowed_values = [r.value if isinstance(r, RoleEnum) else r for r in allowed_roles]

    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        # Super Admin has overarching access to all standard portals
        if current_user.role == RoleEnum.SUPER_ADMIN.value:
            return current_user
            
        if current_user.role not in allowed_values:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(allowed_values)}. Your role: {current_user.role}",
            )
        return current_user

    return role_checker

def verify_employee_access(
    target_employee_id: int,
    current_user: User,
    db: Session
) -> Employee:
    """
    Enforces department-level & privacy access control:
    - Super Admin & HR Manager can access all employees
    - Department Manager can access only employees within their assigned department
    - Regular Employee can only access their own profile
    - Recruiter can view employee profiles but not sensitive private records (e.g. salary/payslips)
    - IT Admin can view employee profile for asset assignment
    """
    target = db.query(Employee).filter(Employee.id == target_employee_id).first()
    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee record not found (ID: {target_employee_id})"
        )

    # Super Admin & HR Manager have global access
    if current_user.role in [RoleEnum.SUPER_ADMIN.value, RoleEnum.HR_MANAGER.value]:
        return target

    # Self access
    if current_user.employee_profile and current_user.employee_profile.id == target.id:
        return target

    # Department Manager access
    if current_user.role == RoleEnum.DEPT_MANAGER.value:
        if current_user.department_id and target.department_id == current_user.department_id:
            return target
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Department Managers can only access employees within their assigned department."
        )

    # Recruiter & IT Admin view access
    if current_user.role in [RoleEnum.RECRUITER.value, RoleEnum.IT_ADMIN.value]:
        return target

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Unauthorized: You do not have permission to view or modify this employee record."
    )

def log_audit_event(
    db: Session,
    actor: Optional[User],
    action: str,
    entity_type: str,
    entity_id: Optional[str] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = None
):
    """
    Creates an immutable audit log entry for enterprise governance and compliance.
    """
    audit = AuditLog(
        actor_id=actor.id if actor else None,
        actor_email=actor.email if actor else "SYSTEM",
        actor_role=actor.role if actor else "SYSTEM",
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id) if entity_id else None,
        details=details,
        ip_address=ip_address
    )
    db.add(audit)
    db.commit()
