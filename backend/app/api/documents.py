import os
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.config import settings
from app.models.user import User, RoleEnum
from app.models.document import Document
from app.models.employee import Employee
from app.schemas.document import DocumentResponse
from app.auth.dependencies import get_current_user, require_roles, verify_employee_access, log_audit_event

router = APIRouter(prefix="/documents", tags=["Document Vault & Policies"])

def format_doc_response(doc: Document) -> DocumentResponse:
    emp_name = f"{doc.employee.first_name} {doc.employee.last_name}" if doc.employee else None
    return DocumentResponse(
        id=doc.id,
        employee_id=doc.employee_id,
        employee_name=emp_name,
        title=doc.title,
        category=doc.category,
        file_name=doc.file_name,
        file_path=doc.file_path,
        file_size=doc.file_size,
        mime_type=doc.mime_type,
        is_company_policy=doc.is_company_policy,
        uploaded_by=doc.uploaded_by,
        created_at=doc.created_at
    )

@router.get("", response_model=List[DocumentResponse])
def list_documents(
    employee_id: Optional[int] = None,
    category: Optional[str] = None,
    policies_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Document)

    if policies_only:
        query = query.filter(Document.is_company_policy == True)
    elif employee_id:
        # Check permissions for this employee
        verify_employee_access(target_employee_id=employee_id, current_user=current_user, db=db)
        query = query.filter(Document.employee_id == employee_id)
    else:
        # Global list
        if current_user.role in [RoleEnum.SUPER_ADMIN.value, RoleEnum.HR_MANAGER.value]:
            pass # can view all
        elif current_user.role == RoleEnum.DEPT_MANAGER.value:
            # only their department employees + company policies
            if current_user.department_id:
                dept_emp_ids = [e.id for e in db.query(Employee.id).filter(Employee.department_id == current_user.department_id).all()]
                query = query.filter((Document.employee_id.in_(dept_emp_ids)) | (Document.is_company_policy == True))
            else:
                query = query.filter(Document.is_company_policy == True)
        elif current_user.role == RoleEnum.EMPLOYEE.value:
            # only self documents + company policies
            emp_id = current_user.employee_profile.id if current_user.employee_profile else -1
            query = query.filter((Document.employee_id == emp_id) | (Document.is_company_policy == True))
        else:
            # IT Admin / Recruiter: policies + permitted non-confidential docs
            query = query.filter(Document.is_company_policy == True)

    if category:
        query = query.filter(Document.category == category)

    docs = query.order_by(Document.created_at.desc()).all()
    return [format_doc_response(d) for d in docs]

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    title: str = Form(...),
    category: str = Form("OTHER"),
    employee_id: Optional[int] = Form(None),
    is_company_policy: bool = Form(False),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Validation
    if is_company_policy and current_user.role not in [RoleEnum.SUPER_ADMIN.value, RoleEnum.HR_MANAGER.value]:
        raise HTTPException(status_code=403, detail="Only HR Admins can publish company-wide policy documents.")

    if employee_id:
        verify_employee_access(target_employee_id=employee_id, current_user=current_user, db=db)

    # Save physical file
    safe_filename = f"{int(datetime.utcnow().timestamp())}_{file.filename.replace(' ', '_')}"
    destination_path = os.path.join(settings.UPLOAD_DIR, safe_filename)

    with open(destination_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(destination_path)

    new_doc = Document(
        title=title,
        category=category,
        employee_id=employee_id if not is_company_policy else None,
        file_name=file.filename,
        file_path=destination_path,
        file_size=file_size,
        mime_type=file.content_type or "application/octet-stream",
        is_company_policy=is_company_policy,
        uploaded_by=current_user.full_name
    )
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)

    log_audit_event(
        db=db,
        actor=current_user,
        action="DOCUMENT_UPLOAD",
        entity_type="DOCUMENT",
        entity_id=str(new_doc.id),
        details=f"Uploaded '{new_doc.title}' ({new_doc.file_name})"
    )

    return format_doc_response(new_doc)

@router.get("/{document_id}/download")
def download_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if not doc.is_company_policy and doc.employee_id:
        verify_employee_access(target_employee_id=doc.employee_id, current_user=current_user, db=db)

    if not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="Underlying file not found on storage server")

    return FileResponse(
        path=doc.file_path,
        filename=doc.file_name,
        media_type=doc.mime_type
    )

@router.delete("/{document_id}")
def delete_document(
    document_id: int,
    current_user: User = Depends(require_roles([RoleEnum.SUPER_ADMIN, RoleEnum.HR_MANAGER])),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except Exception:
            pass

    db.delete(doc)
    db.commit()

    log_audit_event(
        db=db,
        actor=current_user,
        action="DELETE",
        entity_type="DOCUMENT",
        entity_id=str(document_id),
        details=f"Deleted document '{doc.title}'"
    )

    return {"message": "Document deleted successfully."}
