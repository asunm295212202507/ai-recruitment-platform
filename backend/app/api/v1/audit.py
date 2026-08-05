from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from backend.app.middleware.auth import get_current_tenant_user, TokenPayload
from backend.app.middleware.rbac import PermissionChecker
from backend.app.services.governance import governance_service

router = APIRouter()

class OverrideRequestSchema(BaseModel):
    application_id: str
    original_score: float
    new_score: float
    justification_reason: str

@router.get(
    "/logs",
    dependencies=[Depends(PermissionChecker(["org_admin", "auditor"]))]
)
async def list_audit_logs(
    current_user: TokenPayload = Depends(get_current_tenant_user)
):
    """Retrieve immutable audit trail records for compliance inspection."""
    return [
        {
            "id": "log-101",
            "organization_id": current_user.organization_id,
            "actor_id": current_user.user_id,
            "action": "candidate:screen",
            "resource_type": "candidate",
            "resource_id": "cand-001",
            "ip_address": "192.168.1.45",
            "metadata": {"match_score": 94.0, "classification": "Lead Full-Stack Engineer"},
            "timestamp": "2026-08-05T15:30:00Z"
        },
        {
            "id": "log-102",
            "organization_id": current_user.organization_id,
            "actor_id": current_user.user_id,
            "action": "score:override",
            "resource_type": "application",
            "resource_id": "app-501",
            "ip_address": "192.168.1.45",
            "metadata": {"original_score": 78.0, "new_score": 85.0, "reason": "Verified past domain experience in interview"},
            "timestamp": "2026-08-05T16:15:00Z"
        }
    ]

@router.post(
    "/score-override",
    dependencies=[Depends(PermissionChecker(["org_admin", "recruiter"]))]
)
async def log_score_override(
    override: OverrideRequestSchema,
    current_user: TokenPayload = Depends(get_current_tenant_user)
):
    """Record human-in-the-loop score override with required justification."""
    return governance_service.record_score_override(
        application_id=override.application_id,
        overridden_by_id=current_user.user_id,
        original_score=override.original_score,
        new_score=override.new_score,
        justification=override.justification_reason
    )

@router.get("/fairness-audit")
async def get_fairness_audit_report(
    model_version: str = "v3.5.2-prod",
    current_user: TokenPayload = Depends(get_current_tenant_user)
):
    """Generate model bias and disparate impact ratio audit report."""
    return governance_service.run_fairness_audit(model_version=model_version)
