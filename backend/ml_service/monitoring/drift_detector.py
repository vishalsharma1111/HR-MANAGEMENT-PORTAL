import os
import csv
from typing import Dict, Any, List
import numpy as np

from ml_service.training.train import NUMERICAL_FEATURES, CATEGORICAL_FEATURES, DATA_DIR

class DriftDetector:
    def __init__(self):
        self.baseline_stats: Dict[str, Any] = {}
        self._compute_baseline()

    def _compute_baseline(self):
        train_csv = os.path.join(DATA_DIR, "hr_attrition_train.csv")
        if not os.path.exists(train_csv):
            return

        num_values = {f: [] for f in NUMERICAL_FEATURES}
        cat_values = {f: {} for f in CATEGORICAL_FEATURES}

        with open(train_csv, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            count = 0
            for row in reader:
                count += 1
                for nf in NUMERICAL_FEATURES:
                    num_values[nf].append(float(row[nf]))
                for cf in CATEGORICAL_FEATURES:
                    val = row[cf]
                    cat_values[cf][val] = cat_values[cf].get(val, 0) + 1

        self.baseline_stats = {
            "sample_count": count,
            "numerical": {
                f: {
                    "mean": round(float(np.mean(num_values[f])), 2),
                    "std": round(float(np.std(num_values[f])), 2),
                    "min": round(float(np.min(num_values[f])), 2),
                    "max": round(float(np.max(num_values[f])), 2)
                } for f in NUMERICAL_FEATURES
            },
            "categorical": {
                cf: {
                    k: round(v / count, 4) for k, v in cat_values[cf].items()
                } for cf in CATEGORICAL_FEATURES
            }
        }

    def analyze_drift(self, recent_inferences: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Compare live inference feature distribution with documented training baseline.
        Distinguishes input distribution drift from ground-truth performance degradation.
        """
        if not recent_inferences:
            return {
                "inferences_analyzed": 0,
                "drift_status": "INSUFFICIENT_DATA",
                "message": "At least 5 live predictions required to compute statistical distribution drift.",
                "feature_drift_reports": []
            }

        live_samples = [inf["input"] for inf in recent_inferences]
        n_live = len(live_samples)

        drift_reports = []
        drift_count = 0

        # 1. Numerical drift check
        for nf in NUMERICAL_FEATURES:
            base_stat = self.baseline_stats["numerical"].get(nf)
            if not base_stat:
                continue

            vals = [float(s[nf]) for s in live_samples if nf in s]
            if not vals:
                continue

            live_mean = float(np.mean(vals))
            base_mean = base_stat["mean"]
            base_std = base_stat["std"] if base_stat["std"] > 0 else 1.0

            z_diff = abs(live_mean - base_mean) / base_std
            pct_change = abs(live_mean - base_mean) / (abs(base_mean) + 1e-5) * 100.0

            # Significant drift flag if mean shifted by more than 1.5 standard deviations or 25%
            has_drift = z_diff > 1.5 or pct_change > 25.0
            if has_drift:
                drift_count += 1

            drift_reports.append({
                "feature": nf,
                "type": "numerical",
                "baseline_mean": base_mean,
                "live_mean": round(live_mean, 2),
                "pct_change": round(pct_change, 1),
                "z_score_deviation": round(z_diff, 2),
                "has_drift": has_drift
            })

        # 2. Categorical drift check (e.g. Overtime proportion shift)
        if "overtime" in self.baseline_stats.get("categorical", {}):
            ot_base = self.baseline_stats["categorical"]["overtime"].get("Yes", 0.28)
            ot_live = sum(1 for s in live_samples if s.get("overtime") == "Yes") / n_live
            ot_diff = abs(ot_live - ot_base)
            has_ot_drift = ot_diff > 0.15
            if has_ot_drift:
                drift_count += 1

            drift_reports.append({
                "feature": "overtime_proportion",
                "type": "categorical",
                "baseline_mean": round(ot_base * 100, 1),
                "live_mean": round(ot_live * 100, 1),
                "pct_change": round((ot_diff / ot_base) * 100, 1),
                "z_score_deviation": round(ot_diff, 2),
                "has_drift": has_ot_drift
            })

        overall_status = "DRIFT_DETECTED" if drift_count >= 2 else "STABLE"

        return {
            "inferences_analyzed": n_live,
            "drift_status": overall_status,
            "drifted_features_count": drift_count,
            "interpretation": (
                "Input feature distributions have shifted significantly compared to training baseline. "
                "Consider retraining candidate model if production distribution remains altered."
                if overall_status == "DRIFT_DETECTED"
                else "Feature distributions align within acceptable variance bounds of baseline training data."
            ),
            "performance_degradation_note": "Input drift reflects shifts in incoming telemetry. Model performance degradation (accuracy drop) can only be confirmed once actual employee turnover labels mature.",
            "feature_drift_reports": drift_reports
        }

drift_detector = DriftDetector()
