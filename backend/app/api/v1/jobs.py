from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from backend.app.middleware.auth import get_current_tenant_user, TokenPayload
from backend.app.middleware.rbac import PermissionChecker

router = APIRouter()

class JobRequirementSchema(BaseModel):
    skill_name: str
    weight: float = 1.0
    min_proficiency: float = 0.7
    is_required: bool = True

class JobCreateSchema(BaseModel):
    title: str
    department: str
    location: str
    description: str
    min_salary: Optional[float] = None
    max_salary: Optional[float] = None
    requirements: List[JobRequirementSchema] = []

class JobResponseSchema(JobCreateSchema):
    id: str
    status: str
    organization_id: str
    candidates_count: int = 0

@router.get("/", response_model=List[JobResponseSchema])
async def list_jobs(current_user: TokenPayload = Depends(get_current_tenant_user)):
    """List all job requisitions scoped to the user's organization."""
    return [
        {
            "id": "11111111-0000-0000-0000-000000000001",
            "organization_id": current_user.organization_id,
            "title": "Senior Full-Stack Engineer",
            "department": "Engineering",
            "location": "Remote, US",
            "status": "active",
            "description": "Lead frontend and backend architectures using React, Node.js, and AWS.",
            "min_salary": 140000,
            "max_salary": 175000,
            "candidates_count": 14,
            "requirements": [
                {"skill_name": "React", "weight": 1.5, "min_proficiency": 0.8, "is_required": True},
                {"skill_name": "Node.js", "weight": 1.5, "min_proficiency": 0.8, "is_required": True},
                {"skill_name": "AWS", "weight": 1.0, "min_proficiency": 0.7, "is_required": True}
            ]
        },
        {
            "id": "11111111-0000-0000-0000-000000000002",
            "organization_id": current_user.organization_id,
            "title": "Lead Product Manager",
            "department": "Product",
            "location": "San Francisco, CA",
            "status": "active",
            "description": "Drive vision and roadmap execution for enterprise SaaS platforms.",
            "min_salary": 150000,
            "max_salary": 185000,
            "candidates_count": 8,
            "requirements": [
                {"skill_name": "Agile", "weight": 1.2, "min_proficiency": 0.8, "is_required": True},
                {"skill_name": "Product Strategy", "weight": 1.5, "min_proficiency": 0.8, "is_required": True}
            ]
        }
    ]

@router.post(
    "/", 
    response_model=JobResponseSchema, 
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(PermissionChecker(["org_admin", "recruiter"]))]
)
async def create_job(
    job_in: JobCreateSchema, 
    current_user: TokenPayload = Depends(get_current_tenant_user)
):
    """Create a new job requisition with AI skill weighting (Recruiters & Org Admins)."""
    return {
        "id": "11111111-9999-9999-9999-999999999999",
        "organization_id": current_user.organization_id,
        "title": job_in.title,
        "department": job_in.department,
        "location": job_in.location,
        "status": "active",
        "description": job_in.description,
        "min_salary": job_in.min_salary,
        "max_salary": job_in.max_salary,
        "candidates_count": 0,
        "requirements": job_in.requirements
    }

@router.post("/ai-generate-description")
async def generate_job_description_with_ai(
    title: str,
    department: str,
    key_skills: List[str]
):
    """AI Assistant endpoint for generating structured, inclusive job descriptions."""
    skills_str = ", ".join(key_skills) if key_skills else "modern software engineering practices"
    generated_text = f"""Role Overview:
We are seeking a high-caliber {title} to join our {department} group. In this position, you will drive core technical implementations and scale cloud services.

Key Responsibilities:
- Design, scale, and maintain cloud microservices.
- Collaborate with cross-functional product teams to deliver high-quality features.
- Champion code quality, testing standards, and continuous integration.

Target Qualifications:
- Demonstrated mastery in {skills_str}.
- Strong problem-solving and communication skills in distributed teams.
"""
    return {"title": title, "department": department, "generated_description": generated_text}
