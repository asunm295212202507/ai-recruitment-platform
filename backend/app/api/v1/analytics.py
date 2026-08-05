from fastapi import APIRouter, Depends
from backend.app.middleware.auth import get_current_tenant_user, TokenPayload

router = APIRouter()

@router.get("/summary")
async def get_recruiter_analytics_summary(
    current_user: TokenPayload = Depends(get_current_tenant_user)
):
    """Retrieve recruiter conversion pipeline & throughput metrics."""
    return {
        "organization_id": current_user.organization_id,
        "active_jobs_count": 3,
        "total_candidates_screened": 22,
        "average_match_score": 88.4,
        "total_hours_saved_ai": 22.5,
        "pipeline_stages": [
            {"stage": "Applied", "count": 45, "percentage": 100},
            {"stage": "AI Screened", "count": 28, "percentage": 62.2},
            {"stage": "Interviewed", "count": 12, "percentage": 26.6},
            {"stage": "Offered", "count": 4, "percentage": 8.8}
        ],
        "category_distribution": [
            {"category": "Engineering", "count": 14},
            {"category": "Product", "count": 5},
            {"category": "Infrastructure", "count": 3}
        ]
    }
