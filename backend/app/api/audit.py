from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, RoleEnum
from app.models.audit import AuditLog
from app.schemas.dashboard import AuditLogResponse
from app.auth.dependencies import require_roles

router = APIRouter(prefix="/audit", tags=["Security & Compliance Audit Logs"])

@router.get("", response_model=List[AuditLogResponse])
def list_audit_logs(
    limit: int = Query(50, ge=1, le=500),
    entity_type: Optional[str] = None,
    current_user: User = Depends(require_roles([RoleEnum.SUPER_ADMIN, RoleEnum.HR_MANAGER, RoleEnum.IT_ADMIN])),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)

    logs = query.order_by(AuditLog.created_at.desc()).limit(limit).all()
    return logs
