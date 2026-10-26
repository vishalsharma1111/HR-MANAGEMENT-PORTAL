import os
import json
import hashlib
from datetime import datetime
from typing import Dict, Any, List, Optional
import joblib

REGISTRY_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(REGISTRY_DIR, "models")
os.makedirs(MODELS_DIR, exist_ok=True)

def compute_sha256(file_path: str) -> str:
    sha = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(8192):
            sha.update(chunk)
    return sha.hexdigest()

class ModelRegistry:
    def __init__(self, models_dir: str = MODELS_DIR):
        self.models_dir = models_dir
        os.makedirs(self.models_dir, exist_ok=True)

    def register_model(
        self,
        version: str,
        pipeline: Any,
        metrics: Dict[str, Any],
        training_config: Dict[str, Any],
        features: Dict[str, List[str]],
        provenance: Dict[str, Any],
        is_production: bool = False
    ) -> Dict[str, Any]:
        """Save pipeline artifact, compute checksum, and write immutable metadata."""
        version_dir = os.path.join(self.models_dir, version)
        os.makedirs(version_dir, exist_ok=True)

        artifact_filename = "attrition_pipeline.joblib"
        artifact_path = os.path.join(version_dir, artifact_filename)
        
        # Save model pipeline
        joblib.dump(pipeline, artifact_path)
        checksum = compute_sha256(artifact_path)

        metadata = {
            "version": version,
            "artifact_file": artifact_filename,
            "artifact_path": os.path.abspath(artifact_path),
            "checksum_sha256": checksum,
            "model_type": training_config.get("model_type", "Pipeline"),
            "features": features,
            "training_config": training_config,
            "dataset_provenance": provenance,
            "metrics": metrics,
            "created_at": datetime.utcnow().isoformat(),
            "approval_status": "APPROVED" if is_production else "CANDIDATE",
            "is_production": is_production
        }

        # If this model is set as production, demote any existing production models
        if is_production:
            self._demote_existing_production(except_version=version)

        metadata_path = os.path.join(version_dir, "metadata.json")
        with open(metadata_path, "w") as f:
            json.dump(metadata, f, indent=2)

        return metadata

    def _demote_existing_production(self, except_version: str):
        for ver in os.listdir(self.models_dir):
            if ver == except_version:
                continue
            meta_path = os.path.join(self.models_dir, ver, "metadata.json")
            if os.path.isfile(meta_path):
                try:
                    with open(meta_path, "r") as f:
                        meta = json.load(f)
                    if meta.get("is_production", False):
                        meta["is_production"] = False
                        meta["approval_status"] = "ARCHIVED"
                        with open(meta_path, "w") as f:
                            json.dump(meta, f, indent=2)
                except Exception as e:
                    print(f"Error updating metadata for {ver}: {e}")

    def list_models(self) -> List[Dict[str, Any]]:
        models = []
        if not os.path.exists(self.models_dir):
            return models
        for ver in os.listdir(self.models_dir):
            ver_dir = os.path.join(self.models_dir, ver)
            meta_path = os.path.join(ver_dir, "metadata.json")
            if os.path.isdir(ver_dir) and os.path.isfile(meta_path):
                try:
                    with open(meta_path, "r") as f:
                        meta = json.load(f)
                    models.append(meta)
                except Exception:
                    pass
        models.sort(key=lambda m: m.get("created_at", ""), reverse=True)
        return models

    def get_model_metadata(self, version: str) -> Optional[Dict[str, Any]]:
        meta_path = os.path.join(self.models_dir, version, "metadata.json")
        if os.path.isfile(meta_path):
            with open(meta_path, "r") as f:
                return json.load(f)
        return None

    def get_production_model(self) -> Optional[Dict[str, Any]]:
        """Finds current production model, verifies checksum, loads pipeline."""
        models = self.list_models()
        prod_meta = next((m for m in models if m.get("is_production")), None)
        if not prod_meta and models:
            # Fallback to the latest approved model if no explicit prod flag
            prod_meta = models[0]

        if not prod_meta:
            return None

        artifact_path = prod_meta["artifact_path"]
        if not os.path.exists(artifact_path):
            raise FileNotFoundError(f"Model artifact not found at {artifact_path}")

        # Strict checksum validation
        current_checksum = compute_sha256(artifact_path)
        if current_checksum != prod_meta["checksum_sha256"]:
            raise ValueError(
                f"Artifact checksum mismatch for {prod_meta['version']}! "
                f"Expected {prod_meta['checksum_sha256']}, got {current_checksum}"
            )

        pipeline = joblib.load(artifact_path)
        return {
            "metadata": prod_meta,
            "pipeline": pipeline
        }

    def promote_model(self, version: str) -> Dict[str, Any]:
        """Promote a candidate model to production."""
        meta = self.get_model_metadata(version)
        if not meta:
            raise ValueError(f"Model version {version} not found in registry")

        # Demote existing
        self._demote_existing_production(except_version=version)

        meta["is_production"] = True
        meta["approval_status"] = "APPROVED"
        meta["promoted_at"] = datetime.utcnow().isoformat()

        meta_path = os.path.join(self.models_dir, version, "metadata.json")
        with open(meta_path, "w") as f:
            json.dump(meta, f, indent=2)

        return meta

    def rollback_model(self, target_version: str) -> Dict[str, Any]:
        """Rollback production to a previously archived or candidate version."""
        return self.promote_model(target_version)

registry = ModelRegistry()
