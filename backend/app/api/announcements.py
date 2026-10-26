from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, RoleEnum
from app.models.announcement import Announcement
from app.schemas.announcement import AnnouncementCreate, AnnouncementResponse
from app.auth.dependencies import get_current_user, require_roles, log_audit_event

router = APIRouter(prefix="/announcements", tags=["Announcements & Company News"])

@router.get("", response_model=List[AnnouncementResponse])
def list_announcements(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    announcements = db.query(Announcement).order_by(
        Announcement.is_pinned.desc(),
        Announcement.created_at.desc()
    ).all()
    return announcements

@router.post("", response_model=AnnouncementResponse, status_code=status.HTTP_201_CREATED)
def create_announcement(
    data: AnnouncementCreate,
    current_user: User = Depends(require_roles([RoleEnum.SUPER_ADMIN, RoleEnum.HR_MANAGER])),
    db: Session = Depends(get_db)
):
    item = Announcement(
        title=data.title,
        content=data.content,
        priority=data.priority,
        is_pinned=data.is_pinned,
        author_name=current_user.full_name,
        department_target=data.department_target or "ALL"
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    log_audit_event(
        db=db,
        actor=current_user,
        action="CREATE",
        entity_type="ANNOUNCEMENT",
        entity_id=str(item.id),
        details=f"Published announcement '{item.title}'"
    )

    return item
