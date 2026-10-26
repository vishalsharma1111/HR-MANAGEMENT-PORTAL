from datetime import date, datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, RoleEnum
from app.models.asset import Asset
from app.models.employee import Employee
from app.schemas.asset import AssetCreate, AssetUpdate, AssetResponse
from app.auth.dependencies import get_current_user, require_roles, log_audit_event

router = APIRouter(prefix="/assets", tags=["Asset Tracking & Inventory"])

def format_asset_response(a: Asset) -> AssetResponse:
    emp_name = f"{a.assigned_employee.first_name} {a.assigned_employee.last_name}" if a.assigned_employee else None
    emp_code = a.assigned_employee.employee_id if a.assigned_employee else None
    return AssetResponse(
        id=a.id,
        asset_tag=a.asset_tag,
        name=a.name,
        category=a.category,
        serial_number=a.serial_number,
        assigned_to_employee_id=a.assigned_to_employee_id,
        assigned_employee_name=emp_name,
        assigned_employee_code=emp_code,
        assigned_date=a.assigned_date,
        return_date=a.return_date,
        status=a.status,
        notes=a.notes,
        created_at=a.created_at,
        updated_at=a.updated_at
    )

def generate_asset_tag(db: Session) -> str:
    count = db.query(Asset).count() + 1
    tag = f"AST-{datetime.utcnow().year}-{count:04d}"
    while db.query(Asset).filter(Asset.asset_tag == tag).first():
        count += 1
        tag = f"AST-{datetime.utcnow().year}-{count:04d}"
    return tag

@router.get("", response_model=List[AssetResponse])
def list_assets(
    employee_id: Optional[int] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Asset)

    # Employee role can only see assets assigned to them
    if current_user.role == RoleEnum.EMPLOYEE.value:
        emp_id = current_user.employee_profile.id if current_user.employee_profile else -1
        query = query.filter(Asset.assigned_to_employee_id == emp_id)
    elif employee_id:
        query = query.filter(Asset.assigned_to_employee_id == employee_id)

    if category:
        query = query.filter(Asset.category == category)
    if status:
        query = query.filter(Asset.status == status)

    assets = query.order_by(Asset.id.desc()).all()
    return [format_asset_response(a) for a in assets]

@router.post("", response_model=AssetResponse, status_code=status.HTTP_201_CREATED)
def create_asset(
    asset_data: AssetCreate,
    current_user: User = Depends(require_roles([RoleEnum.SUPER_ADMIN, RoleEnum.IT_ADMIN, RoleEnum.HR_MANAGER])),
    db: Session = Depends(get_db)
):
    tag = asset_data.asset_tag or generate_asset_tag(db)
    if db.query(Asset).filter(Asset.asset_tag == tag).first():
        raise HTTPException(status_code=400, detail=f"Asset tag '{tag}' is already registered.")

    new_asset = Asset(
        asset_tag=tag,
        name=asset_data.name,
        category=asset_data.category,
        serial_number=asset_data.serial_number,
        assigned_to_employee_id=asset_data.assigned_to_employee_id,
        assigned_date=asset_data.assigned_date if asset_data.assigned_to_employee_id else None,
        status="ASSIGNED" if asset_data.assigned_to_employee_id else asset_data.status,
        notes=asset_data.notes
    )
    db.add(new_asset)
    db.commit()
    db.refresh(new_asset)

    log_audit_event(
        db=db,
        actor=current_user,
        action="CREATE",
        entity_type="ASSET",
        entity_id=str(new_asset.id),
        details=f"Created asset '{new_asset.name}' ({new_asset.asset_tag})"
    )

    return format_asset_response(new_asset)

@router.put("/{asset_id}", response_model=AssetResponse)
def update_asset(
    asset_id: int,
    asset_data: AssetUpdate,
    current_user: User = Depends(require_roles([RoleEnum.SUPER_ADMIN, RoleEnum.IT_ADMIN, RoleEnum.HR_MANAGER])),
    db: Session = Depends(get_db)
):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset record not found")

    for field, val in asset_data.model_dump(exclude_unset=True).items():
        setattr(asset, field, val)

    if asset_data.assigned_to_employee_id is not None:
        if asset_data.assigned_to_employee_id > 0:
            asset.status = "ASSIGNED"
            asset.assigned_date = asset_data.assigned_date or date.today()
            asset.return_date = None
        else:
            asset.assigned_to_employee_id = None
            asset.status = "AVAILABLE"
            asset.return_date = date.today()

    asset.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(asset)

    log_audit_event(
        db=db,
        actor=current_user,
        action="UPDATE",
        entity_type="ASSET",
        entity_id=str(asset.id),
        details=f"Updated asset {asset.asset_tag} (Status: {asset.status})"
    )

    return format_asset_response(asset)
