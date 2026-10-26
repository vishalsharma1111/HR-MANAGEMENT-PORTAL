from datetime import datetime, date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, RoleEnum
from app.models.employee import Employee
from app.models.expenses import ExpenseClaim, HelpdeskTicket, DocumentRequest
from app.models.document import Document
from app.schemas.expenses import (
    ExpenseClaimCreate, ExpenseClaimResponse, ExpenseClaimReview,
    TicketCreate, TicketResponse, TicketUpdate, DocRequestCreate, DocRequestResponse
)
from app.auth.dependencies import (
    get_current_user, require_roles, verify_employee_access, log_audit_event
)

router = APIRouter(prefix="/expenses", tags=["Expenses, Helpdesk & Self-Service"])

def format_claim_response(c: ExpenseClaim) -> ExpenseClaimResponse:
    emp_name = f"{c.employee.first_name} {c.employee.last_name}" if c.employee else "Unknown"
    appr_name = c.approver.full_name if c.approver else None

    return ExpenseClaimResponse(
        id=c.id,
        employee_id=c.employee_id,
        employee_name=emp_name,
        title=c.title,
        category=c.category,
        amount=c.amount,
        currency=c.currency,
        receipt_path=c.receipt_path,
        expense_date=c.expense_date,
        status=c.status,
        approver_name=appr_name,
        approver_comments=c.approver_comments,
        payroll_run_id=c.payroll_run_id,
        created_at=c.created_at
    )

@router.get("/claims", response_model=List[ExpenseClaimResponse])
def list_expense_claims(
    employee_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(ExpenseClaim)

    if current_user.role == RoleEnum.EMPLOYEE.value:
        emp_id = current_user.employee_profile.id if current_user.employee_profile else -1
        query = query.filter(ExpenseClaim.employee_id == emp_id)
    elif employee_id:
        verify_employee_access(employee_id, current_user, db)
        query = query.filter(ExpenseClaim.employee_id == employee_id)
    elif current_user.role == RoleEnum.DEPT_MANAGER.value and current_user.department_id:
        dept_emp_ids = [e.id for e in db.query(Employee.id).filter(Employee.department_id == current_user.department_id).all()]
        query = query.filter(ExpenseClaim.employee_id.in_(dept_emp_ids))

    if status_filter:
        query = query.filter(ExpenseClaim.status == status_filter)

    claims = query.order_by(ExpenseClaim.created_at.desc()).all()
    return [format_claim_response(c) for c in claims]

@router.post("/claims", response_model=ExpenseClaimResponse, status_code=status.HTTP_201_CREATED)
def submit_expense_claim(
    data: ExpenseClaimCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.employee_profile:
        raise HTTPException(status_code=400, detail="Account is not associated with an employee profile.")

    claim = ExpenseClaim(
        employee_id=current_user.employee_profile.id,
        title=data.title,
        category=data.category,
        amount=data.amount,
        currency=data.currency,
        expense_date=data.expense_date,
        status="PENDING"
    )
    db.add(claim)
    db.commit()
    db.refresh(claim)

    log_audit_event(
        db=db,
        actor=current_user,
        action="CREATE",
        entity_type="EXPENSE_CLAIM",
        entity_id=str(claim.id),
        details=f"Submitted expense claim '{claim.title}' for {claim.currency} {claim.amount}"
    )

    return format_claim_response(claim)

@router.put("/claims/{claim_id}/review", response_model=ExpenseClaimResponse)
def review_expense_claim(
    claim_id: int,
    data: ExpenseClaimReview,
    current_user: User = Depends(require_roles([RoleEnum.SUPER_ADMIN, RoleEnum.HR_MANAGER, RoleEnum.DEPT_MANAGER, RoleEnum.PAYROLL_OFFICER])),
    db: Session = Depends(get_db)
):
    claim = db.query(ExpenseClaim).filter(ExpenseClaim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Expense claim not found.")

    claim.status = data.status
    claim.approver_id = current_user.id
    claim.approver_comments = data.approver_comments
    claim.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(claim)

    log_audit_event(
        db=db,
        actor=current_user,
        action="UPDATE",
        entity_type="EXPENSE_CLAIM",
        entity_id=str(claim.id),
        details=f"Expense claim #{claim.id} marked {data.status} by {current_user.full_name}"
    )

    return format_claim_response(claim)

# --- Helpdesk Tickets ---

@router.get("/tickets", response_model=List[TicketResponse])
def list_tickets(
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(HelpdeskTicket)

    if current_user.role == RoleEnum.EMPLOYEE.value:
        emp_id = current_user.employee_profile.id if current_user.employee_profile else -1
        query = query.filter(HelpdeskTicket.employee_id == emp_id)

    if status_filter:
        query = query.filter(HelpdeskTicket.status == status_filter)

    tickets = query.order_by(HelpdeskTicket.created_at.desc()).all()
    results = []
    for t in tickets:
        emp_name = f"{t.employee.first_name} {t.employee.last_name}" if t.employee else "Unknown"
        agent_name = t.assigned_agent.full_name if t.assigned_agent else None
        results.append(TicketResponse(
            id=t.id,
            ticket_number=t.ticket_number,
            employee_id=t.employee_id,
            employee_name=emp_name,
            category=t.category,
            priority=t.priority,
            subject=t.subject,
            description=t.description,
            status=t.status,
            assigned_agent_name=agent_name,
            resolution_notes=t.resolution_notes,
            created_at=t.created_at,
            resolved_at=t.resolved_at
        ))
    return results

@router.post("/tickets", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
def create_ticket(
    data: TicketCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.employee_profile:
        raise HTTPException(status_code=400, detail="Account is not associated with an employee profile.")

    count = db.query(HelpdeskTicket).count() + 1
    t_num = f"TICK-{datetime.utcnow().year}-{count:04d}"

    ticket = HelpdeskTicket(
        ticket_number=t_num,
        employee_id=current_user.employee_profile.id,
        category=data.category,
        priority=data.priority,
        subject=data.subject,
        description=data.description,
        status="OPEN"
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    return TicketResponse(
        id=ticket.id,
        ticket_number=ticket.ticket_number,
        employee_id=ticket.employee_id,
        employee_name=current_user.full_name,
        category=ticket.category,
        priority=ticket.priority,
        subject=ticket.subject,
        description=ticket.description,
        status=ticket.status,
        created_at=ticket.created_at
    )

@router.put("/tickets/{ticket_id}", response_model=TicketResponse)
def update_ticket(
    ticket_id: int,
    data: TicketUpdate,
    current_user: User = Depends(require_roles([RoleEnum.SUPER_ADMIN, RoleEnum.HR_MANAGER, RoleEnum.IT_ADMIN])),
    db: Session = Depends(get_db)
):
    ticket = db.query(HelpdeskTicket).filter(HelpdeskTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if data.status:
        ticket.status = data.status
        if data.status == "RESOLVED":
            ticket.resolved_at = datetime.utcnow()
    if data.assigned_to_user_id:
        ticket.assigned_to_user_id = data.assigned_to_user_id
    if data.resolution_notes:
        ticket.resolution_notes = data.resolution_notes

    db.commit()
    db.refresh(ticket)

    emp_name = f"{ticket.employee.first_name} {ticket.employee.last_name}" if ticket.employee else "Unknown"
    agent_name = ticket.assigned_agent.full_name if ticket.assigned_agent else None
    return TicketResponse(
        id=ticket.id,
        ticket_number=ticket.ticket_number,
        employee_id=ticket.employee_id,
        employee_name=emp_name,
        category=ticket.category,
        priority=ticket.priority,
        subject=ticket.subject,
        description=ticket.description,
        status=ticket.status,
        assigned_agent_name=agent_name,
        resolution_notes=ticket.resolution_notes,
        created_at=ticket.created_at,
        resolved_at=ticket.resolved_at
    )

# --- Employment Letter & Document Requests ---

@router.get("/letters", response_model=List[DocRequestResponse])
def list_document_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(DocumentRequest)
    if current_user.role == RoleEnum.EMPLOYEE.value:
        emp_id = current_user.employee_profile.id if current_user.employee_profile else -1
        query = query.filter(DocumentRequest.employee_id == emp_id)

    reqs = query.order_by(DocumentRequest.created_at.desc()).all()
    results = []
    for r in reqs:
        emp_name = f"{r.employee.first_name} {r.employee.last_name}" if r.employee else "Unknown"
        results.append(DocRequestResponse(
            id=r.id,
            employee_id=r.employee_id,
            employee_name=emp_name,
            document_type=r.document_type,
            purpose=r.purpose,
            status=r.status,
            generated_document_id=r.generated_document_id,
            created_at=r.created_at
        ))
    return results

@router.post("/letters", response_model=DocRequestResponse)
def request_document_letter(
    data: DocRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.employee_profile:
        raise HTTPException(status_code=400, detail="Account is not associated with an employee profile.")

    req = DocumentRequest(
        employee_id=current_user.employee_profile.id,
        document_type=data.document_type,
        purpose=data.purpose,
        status="PENDING"
    )
    db.add(req)
    db.commit()
    db.refresh(req)

    return DocRequestResponse(
        id=req.id,
        employee_id=req.employee_id,
        employee_name=current_user.full_name,
        document_type=req.document_type,
        purpose=req.purpose,
        status=req.status,
        created_at=req.created_at
    )
