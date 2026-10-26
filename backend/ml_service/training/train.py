import os
import csv
import json
import numpy as np
from typing import Dict, Any, Tuple, List

from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_score, StratifiedKFold
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix
)

# Relative / local import for registry
import sys
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from registry.model_registry import registry

DATA_DIR = os.path.join(BASE_DIR, "dataset", "data")

NUMERICAL_FEATURES = [
    "age",
    "monthly_income",
    "distance_from_home",
    "education_level",
    "environment_satisfaction",
    "job_satisfaction",
    "work_life_balance",
    "performance_rating",
    "total_working_years",
    "years_at_company",
    "years_in_current_role",
    "years_since_last_promotion",
    "years_with_curr_manager",
    "num_companies_worked",
    "stock_option_level",
    "training_times_last_year"
]

CATEGORICAL_FEATURES = [
    "department",
    "job_role",
    "overtime"
]

ALL_FEATURES = NUMERICAL_FEATURES + CATEGORICAL_FEATURES
NUMERICAL_INDICES = list(range(len(NUMERICAL_FEATURES)))
CATEGORICAL_INDICES = list(range(len(NUMERICAL_FEATURES), len(ALL_FEATURES)))

TARGET_COLUMN = "attrition"

def to_feature_matrix(records: List[Dict[str, Any]]) -> np.ndarray:
    return np.array([[row[col] for col in ALL_FEATURES] for row in records], dtype=object)

def load_csv_data(filepath: str) -> Tuple[np.ndarray, np.ndarray]:
    records = []
    labels = []
    with open(filepath, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            parsed = {}
            for k, v in row.items():
                if k == TARGET_COLUMN:
                    labels.append(int(v))
                elif k in NUMERICAL_FEATURES:
                    parsed[k] = float(v)
                else:
                    parsed[k] = v
            records.append(parsed)
    return to_feature_matrix(records), np.array(labels)

def train_and_evaluate(version: str = "v1.0.0", is_production: bool = True) -> Dict[str, Any]:
    train_path = os.path.join(DATA_DIR, "hr_attrition_train.csv")
    test_path = os.path.join(DATA_DIR, "hr_attrition_test.csv")

    if not os.path.exists(train_path) or not os.path.exists(test_path):
        from dataset.generator import save_splits
        save_splits()

    X_train, y_train = load_csv_data(train_path)
    X_test, y_test = load_csv_data(test_path)

    print(f"\n=================================================================")
    print(f"       TRAINING ATTRITION MODEL ({version})")
    print(f"=================================================================")
    print(f"Train samples: {len(X_train)} | Positive class: {int(np.sum(y_train))} ({np.mean(y_train):.1%})")
    print(f"Test samples:  {len(X_test)}  | Positive class: {int(np.sum(y_test))} ({np.mean(y_test):.1%})")

    # Majority class baseline (predict all 0 since ~86% are non-attrited)
    majority_class = 0
    y_pred_baseline = np.full_like(y_test, majority_class)
    baseline_acc = float(accuracy_score(y_test, y_pred_baseline))
    print(f"\nMajority Class Baseline Accuracy: {baseline_acc:.4f} (All predicted {majority_class})")

    # Preprocessing pipeline using column indices
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), NUMERICAL_INDICES),
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), CATEGORICAL_INDICES)
        ]
    )

    # 1. Candidate Model: Logistic Regression
    lr_pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("classifier", LogisticRegression(max_iter=1000, class_weight="balanced", random_state=42))
    ])

    # 2. Candidate Model: Random Forest Classifier
    rf_pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("classifier", RandomForestClassifier(n_estimators=100, max_depth=6, min_samples_split=5, class_weight="balanced", random_state=42))
    ])

    # 5-fold cross validation on train
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    lr_cv_scores = cross_val_score(lr_pipeline, X_train, y_train, cv=cv, scoring="roc_auc")
    rf_cv_scores = cross_val_score(rf_pipeline, X_train, y_train, cv=cv, scoring="roc_auc")

    print(f"Cross-Validation ROC-AUC:")
    print(f"  - Logistic Regression: {np.mean(lr_cv_scores):.4f} (+/- {np.std(lr_cv_scores):.4f})")
    print(f"  - Random Forest:       {np.mean(rf_cv_scores):.4f} (+/- {np.std(rf_cv_scores):.4f})")

    # Fit on training set
    lr_pipeline.fit(X_train, y_train)
    rf_pipeline.fit(X_train, y_train)

    # Evaluate on Holdout Test Set
    def evaluate_pipeline(pipeline, name: str) -> Dict[str, Any]:
        y_pred = pipeline.predict(X_test)
        y_proba = pipeline.predict_proba(X_test)[:, 1]
        cm = confusion_matrix(y_test, y_pred).tolist()

        acc = float(accuracy_score(y_test, y_pred))
        prec = float(precision_score(y_test, y_pred, zero_division=0))
        rec = float(recall_score(y_test, y_pred, zero_division=0))
        f1 = float(f1_score(y_test, y_pred, zero_division=0))
        auc = float(roc_auc_score(y_test, y_proba))

        print(f"\n{name} Holdout Test Performance:")
        print(f"  - Accuracy:         {acc:.4f} (vs baseline: {baseline_acc:.4f})")
        print(f"  - Precision:        {prec:.4f}")
        print(f"  - Recall:           {rec:.4f}")
        print(f"  - F1 Score:         {f1:.4f}")
        print(f"  - ROC-AUC:          {auc:.4f}")
        print(f"  - Confusion Matrix: TN={cm[0][0]}, FP={cm[0][1]}, FN={cm[1][0]}, TP={cm[1][1]}")

        return {
            "accuracy": round(acc, 4),
            "majority_class_baseline_accuracy": round(baseline_acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "roc_auc": round(auc, 4),
            "confusion_matrix": cm
        }

    lr_metrics = evaluate_pipeline(lr_pipeline, "Logistic Regression")
    rf_metrics = evaluate_pipeline(rf_pipeline, "Random Forest")

    # Compare models: select higher ROC-AUC / F1
    if rf_metrics["roc_auc"] >= lr_metrics["roc_auc"]:
        chosen_pipeline = rf_pipeline
        chosen_name = "RandomForestClassifier"
        chosen_metrics = rf_metrics
        config = {
            "model_type": chosen_name,
            "n_estimators": 100,
            "max_depth": 6,
            "min_samples_split": 5,
            "class_weight": "balanced",
            "random_state": 42,
            "cv_roc_auc_mean": round(float(np.mean(rf_cv_scores)), 4)
        }
    else:
        chosen_pipeline = lr_pipeline
        chosen_name = "LogisticRegression"
        chosen_metrics = lr_metrics
        config = {
            "model_type": chosen_name,
            "max_iter": 1000,
            "class_weight": "balanced",
            "random_state": 42,
            "cv_roc_auc_mean": round(float(np.mean(lr_cv_scores)), 4)
        }

    print(f"\nSelected Champion Model: {chosen_name}")

    # Register artifact
    provenance = {
        "dataset_name": "HR-ATTRITION-BENCHMARK-v1",
        "provenance_doc": "dataset/provenance.md",
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "class_balance_train": round(float(np.mean(y_train)), 4),
        "class_balance_test": round(float(np.mean(y_test)), 4),
        "pii_excluded": True,
        "features_count": len(NUMERICAL_FEATURES) + len(CATEGORICAL_FEATURES)
    }

    features = {
        "numerical": NUMERICAL_FEATURES,
        "categorical": CATEGORICAL_FEATURES
    }

    meta = registry.register_model(
        version=version,
        pipeline=chosen_pipeline,
        metrics=chosen_metrics,
        training_config=config,
        features=features,
        provenance=provenance,
        is_production=is_production
    )

    print(f"\nModel registered successfully as {version} (Production: {is_production})")
    print(f"Artifact checksum (SHA-256): {meta['checksum_sha256']}")
    print(f"Artifact path: {meta['artifact_path']}")

    return meta

if __name__ == "__main__":
    train_and_evaluate(version="v1.0.0", is_production=True)
