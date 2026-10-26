from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth.dependencies import get_current_user, require_roles
from app.models.user import User, RoleEnum
from ml_service.inference.predictor import predictor
from ml_service.registry.model_registry import registry
from ml_service.monitoring.drift_detector import drift_detector
from ml_service.training.train import train_and_evaluate

router = APIRouter(prefix="/ml", tags=["Machine Learning & Analytics"])

class AttritionPredictionRequest(BaseModel):
    age: float = Field(..., ge=18, le=80, description="Age in years")
    department: str = Field(..., description="Organizational Department")
    job_role: str = Field(..., description="Job Title / Role")
    monthly_income: float = Field(..., ge=500.0, le=100000.0, description="Monthly gross income in USD")
    distance_from_home: float = Field(..., ge=1, le=150, description="Commute distance in miles")
    education_level: int = Field(3, ge=1, le=5, description="1: High School to 5: Doctorate")
    environment_satisfaction: int = Field(3, ge=1, le=4, description="1: Low to 4: Very High")
    job_satisfaction: int = Field(3, ge=1, le=4, description="1: Low to 4: Very High")
    work_life_balance: int = Field(3, ge=1, le=4, description="1: Bad to 4: Best")
    performance_rating: int = Field(3, ge=1, le=4, description="Most recent performance rating")
    overtime: str = Field("No", pattern="^(Yes|No)$", description="Yes or No")
    total_working_years: float = Field(..., ge=0, le=60, description="Total professional working tenure")
    years_at_company: float = Field(..., ge=0, le=50, description="Tenure with enterprise")
    years_in_current_role: float = Field(..., ge=0, le=40, description="Tenure in role")
    years_since_last_promotion: float = Field(0, ge=0, le=30, description="Years since last promotion")
    years_with_curr_manager: float = Field(..., ge=0, le=40, description="Tenure with supervisor")
    num_companies_worked: int = Field(1, ge=0, le=20, description="Previous employers count")
    stock_option_level: int = Field(0, ge=0, le=3, description="Stock option grant level 0-3")
    training_times_last_year: int = Field(2, ge=0, le=20, description="Training courses attended")

class RetrainRequest(BaseModel):
    version: str = Field(..., pattern=r"^v\d+\.\d+\.\d+$", description="Semantic version e.g. v1.1.0")
    auto_promote: bool = Field(False, description="Automatically promote to production if evaluation beats champion")

@router.get("/model/health")
def get_model_health():
    """Operational health, latency telemetry, and model load status."""
    return predictor.get_health()

@router.get("/model/metadata")
def get_model_metadata():
    """Retrieve full metadata, schema, and checksum of current production model."""
    if not predictor.is_ready or not predictor.metadata:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model service is currently unavailable or uninitialized"
        )
    return predictor.metadata

@router.get("/models")
def list_registered_models(current_user: User = Depends(get_current_user)):
    """List all registered candidate, approved, and archived model versions."""
    return registry.list_models()

@router.post("/predict/attrition")
def predict_employee_attrition(
    request: AttritionPredictionRequest,
    current_user: User = Depends(require_roles([
        RoleEnum.SUPER_ADMIN.value,
        RoleEnum.HR_MANAGER.value,
        RoleEnum.DEPT_MANAGER.value
    ]))
):
    """
    Accepts validated employee operational indicators and returns attrition risk scoring,
    confidence probability, and top contributing factors.
    Requires HR Manager, Dept Manager, or Super Admin authorization.
    """
    try:
        input_data = request.model_dump()
        result = predictor.predict(input_data)
        return result
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(ve))
    except RuntimeError as re:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(re))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Inference error: {str(e)}")

@router.get("/monitoring/drift")
def get_drift_analysis(
    current_user: User = Depends(require_roles([RoleEnum.SUPER_ADMIN.value, RoleEnum.HR_MANAGER.value]))
):
    """
    Evaluates live prediction telemetry against training baseline to detect feature distribution drift.
    Distinguishes input drift from ground-truth performance degradation.
    """
    return drift_detector.analyze_drift(predictor.recent_inferences)

@router.post("/retrain")
def retrain_attrition_model(
    request: RetrainRequest,
    current_user: User = Depends(require_roles([RoleEnum.SUPER_ADMIN.value, RoleEnum.HR_MANAGER.value]))
):
    """
    Execute controlled, repeatable retraining pipeline.
    Validates data, computes holdout metrics, establishes baseline, and registers versioned artifact.
    """
    try:
        meta = train_and_evaluate(version=request.version, is_production=request.auto_promote)
        if request.auto_promote:
            predictor.reload()
        return {
            "status": "success",
            "message": f"Retraining completed and registered as {request.version}",
            "metadata": meta
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Retraining failed: {str(e)}")

@router.post("/models/{version}/promote")
def promote_model_to_production(
    version: str,
    current_user: User = Depends(require_roles([RoleEnum.SUPER_ADMIN.value, RoleEnum.HR_MANAGER.value]))
):
    """Promote a candidate model version to active production status."""
    try:
        meta = registry.promote_model(version)
        predictor.reload()
        return {
            "status": "promoted",
            "message": f"Model {version} successfully promoted to Production",
            "metadata": meta
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/models/{version}/rollback")
def rollback_model_version(
    version: str,
    current_user: User = Depends(require_roles([RoleEnum.SUPER_ADMIN.value, RoleEnum.HR_MANAGER.value]))
):
    """Roll back active production model to a verified previous version."""
    try:
        meta = registry.rollback_model(version)
        predictor.reload()
        return {
            "status": "rolled_back",
            "message": f"Production model successfully rolled back to {version}",
            "metadata": meta
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
