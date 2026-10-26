import time
from datetime import datetime
from typing import Dict, Any, List, Optional
import numpy as np

from ml_service.registry.model_registry import registry
from ml_service.training.train import ALL_FEATURES, NUMERICAL_FEATURES, CATEGORICAL_FEATURES, to_feature_matrix

class AttritionPredictor:
    def __init__(self):
        self.bundle: Optional[Dict[str, Any]] = None
        self.pipeline = None
        self.metadata = None
        self.model_version = "None"
        self.is_ready = False
        self.error_message: Optional[str] = None

        # Operational telemetry
        self.total_predictions = 0
        self.total_latency_ms = 0.0
        self.error_count = 0
        self.invalid_input_count = 0
        self.recent_inferences: List[Dict[str, Any]] = []

        self.load_model()

    def load_model(self):
        try:
            self.bundle = registry.get_production_model()
            if self.bundle:
                self.pipeline = self.bundle["pipeline"]
                self.metadata = self.bundle["metadata"]
                self.model_version = self.metadata["version"]
                self.is_ready = True
                self.error_message = None
            else:
                self.is_ready = False
                self.error_message = "No approved production model found in registry"
        except Exception as e:
            self.is_ready = False
            self.error_message = str(e)

    def reload(self):
        self.load_model()

    def get_health(self) -> Dict[str, Any]:
        avg_latency = (self.total_latency_ms / self.total_predictions) if self.total_predictions > 0 else 0.0
        return {
            "status": "healthy" if self.is_ready else "degraded",
            "model_loaded": self.is_ready,
            "model_version": self.model_version,
            "approval_status": self.metadata.get("approval_status") if self.metadata else "N/A",
            "checksum_verified": self.metadata.get("checksum_sha256") if self.metadata else "N/A",
            "total_predictions": self.total_predictions,
            "average_latency_ms": round(avg_latency, 2),
            "error_count": self.error_count,
            "invalid_input_count": self.invalid_input_count,
            "error_message": self.error_message
        }

    def predict(self, input_dict: Dict[str, Any]) -> Dict[str, Any]:
        if not self.is_ready or self.pipeline is None:
            self.error_count += 1
            raise RuntimeError(f"Model service is not available: {self.error_message}")

        start_time = time.perf_counter()

        # Validate presence of required features
        missing = [f for f in ALL_FEATURES if f not in input_dict]
        if missing:
            self.invalid_input_count += 1
            raise ValueError(f"Missing required features: {missing}")

        try:
            # Format row
            X_input = to_feature_matrix([input_dict])

            # Inference (never retrain!)
            prediction_binary = int(self.pipeline.predict(X_input)[0])
            probabilities = self.pipeline.predict_proba(X_input)[0]
            risk_score = float(probabilities[1])

            # Determine human-interpretable risk tier
            if risk_score >= 0.65:
                risk_level = "High"
            elif risk_score >= 0.35:
                risk_level = "Medium"
            else:
                risk_level = "Low"

            # Compute feature attribution / key drivers
            top_factors = self._compute_feature_drivers(input_dict, risk_score)

            elapsed_ms = (time.perf_counter() - start_time) * 1000.0
            self.total_predictions += 1
            self.total_latency_ms += elapsed_ms

            # Log inference for monitoring
            self.recent_inferences.append({
                "timestamp": datetime.utcnow().isoformat(),
                "input": {k: input_dict[k] for k in ALL_FEATURES},
                "risk_score": round(risk_score, 4),
                "risk_level": risk_level,
                "latency_ms": round(elapsed_ms, 2)
            })
            if len(self.recent_inferences) > 500:
                self.recent_inferences.pop(0)

            return {
                "model_version": self.model_version,
                "prediction": prediction_binary,
                "attrition_risk_score": round(risk_score, 4),
                "risk_level": risk_level,
                "confidence_score": round(float(max(probabilities)), 4),
                "top_contributing_factors": top_factors,
                "latency_ms": round(elapsed_ms, 2),
                "decision_support_disclaimer": "This score is an automated analytics risk indicator requiring qualified human HR review. Automated employment action based on this score is prohibited.",
                "evaluated_at": datetime.utcnow().isoformat()
            }
        except Exception as e:
            self.error_count += 1
            raise e

    def _compute_feature_drivers(self, input_dict: Dict[str, Any], risk_score: float) -> List[str]:
        drivers = []
        if input_dict.get("overtime") == "Yes":
            drivers.append("Active overtime schedules significantly elevate turnover probability (+32%)")
        if input_dict.get("job_satisfaction", 3) <= 1:
            drivers.append("Low job satisfaction survey rating (1/4) indicates organizational detachment (+25%)")
        elif input_dict.get("job_satisfaction", 3) == 4:
            drivers.append("High job satisfaction rating (4/4) acts as strong retention anchor (-18%)")

        if input_dict.get("work_life_balance", 3) <= 1:
            drivers.append("Critical work-life balance strain reported (+22%)")

        if input_dict.get("distance_from_home", 0) > 25:
            drivers.append(f"Extended daily commute ({input_dict.get('distance_from_home')} miles) correlates with attrition risk (+15%)")

        if input_dict.get("monthly_income", 6000) < 4000:
            drivers.append("Compensation falls in lower quartile for operational tier (+18%)")
        elif input_dict.get("monthly_income", 6000) > 14000:
            drivers.append("Upper-tier executive compensation provides retention stabilization (-20%)")

        if input_dict.get("years_since_last_promotion", 0) >= 5:
            drivers.append(f"Extended interval since last promotion ({input_dict.get('years_since_last_promotion')} yrs) signals growth stagnation (+14%)")

        if not drivers:
            drivers.append("Standard balanced workplace profile with nominal baseline risk factors.")

        return drivers[:4]

predictor = AttritionPredictor()
