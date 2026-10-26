from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.contact import ContactSubmission
from app.models.user import User, RoleEnum
from app.schemas.contact import ContactCreate, ContactResponse
from app.auth.dependencies import log_audit_event, require_roles

router = APIRouter(prefix="/contact", tags=["Public Contact Submissions"])

@router.post("", response_model=ContactResponse, status_code=status.HTTP_201_CREATED)
def submit_contact_form(data: ContactCreate, db: Session = Depends(get_db)):
    if len(data.full_name.strip()) < 2:
        raise HTTPException(status_code=400, detail="Please enter a valid full name (minimum 2 characters).")
    if len(data.subject.strip()) < 3:
        raise HTTPException(status_code=400, detail="Please provide a descriptive subject (minimum 3 characters).")
    if len(data.message.strip()) < 10:
        raise HTTPException(status_code=400, detail="Message content must be at least 10 characters long.")

    submission = ContactSubmission(
        full_name=data.full_name.strip(),
        email=data.email.strip().lower(),
        subject=data.subject.strip(),
        message=data.message.strip(),
        status="NEW"
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)

    log_audit_event(
        db=db,
        actor=None,
        action="CONTACT_FORM_SUBMISSION",
        entity_type="CONTACT",
        entity_id=str(submission.id),
        details=f"Inquiry received from {submission.full_name} ({submission.email}): {submission.subject}"
    )

    return submission

@router.get("/submissions", response_model=list[ContactResponse])
def list_contact_submissions(
    current_user: User = Depends(require_roles([RoleEnum.SUPER_ADMIN, RoleEnum.HR_MANAGER, RoleEnum.IT_ADMIN])),
    db: Session = Depends(get_db)
):
    """Administrative access to public contact inquiries."""
    return db.query(ContactSubmission).order_by(ContactSubmission.created_at.desc()).all()
