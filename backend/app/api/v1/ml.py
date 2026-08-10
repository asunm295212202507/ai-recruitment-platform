from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Dict, Any, Optional
from backend.app.middleware.auth import get_current_tenant_user, TokenPayload
from backend.app.middleware.rbac import PermissionChecker
from ml_pipeline.generate_dataset import generate_recruitment_dataset
from ml_pipeline.train_model import train_recruitment_models
from ml_pipeline.evaluate_bias import evaluate_model_fairness

router = APIRouter()

class RetrainRequestSchema(BaseModel):
    num_samples: int = 1000
    seed: int = 42

@router.post(
    "/generate-dataset",
    dependencies=[Depends(PermissionChecker(["org_admin", "recruiter"]))]
)
async def generate_dataset_endpoint(request: RetrainRequestSchema):
    """Generates synthetic recruitment training dataset."""
    dataset_path = generate_recruitment_dataset(num_samples=request.num_samples, seed=request.seed)
    return {
        "status": "success",
        "message": f"Generated dataset with {request.num_samples} samples.",
        "dataset_path": dataset_path
    }

@router.post(
    "/train",
    dependencies=[Depends(PermissionChecker(["org_admin"]))]
)
async def train_models_endpoint(request: RetrainRequestSchema):
    """Triggers ML model training pipeline for classification, matching, and salary predictions (Org Admin)."""
    # 1. Generate fresh dataset
    generate_recruitment_dataset(num_samples=request.num_samples, seed=request.seed)
    
    # 2. Train ML models
    metrics = train_recruitment_models()
    
    # 3. Evaluate fairness
    fairness = evaluate_model_fairness()
    
    return {
        "status": "success",
        "message": "AI recruitment models successfully trained and updated.",
        "training_metrics": metrics,
        "fairness_audit": fairness
    }

@router.get("/metrics")
async def get_model_metrics():
    """Retrieves current model metrics and evaluation reports."""
    metrics = train_recruitment_models()
    fairness = evaluate_model_fairness()
    return {
        "training_metrics": metrics,
        "fairness_audit": fairness
    }
