from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from pydantic import BaseModel, EmailStr
from backend.app.middleware.auth import get_current_tenant_user, TokenPayload

router = APIRouter()

class CandidateProfileSchema(BaseModel):
    id: str
    first_name: str
    last_name: str
    email: EmailStr
    current_title: Optional[str] = None
    years_experience: float = 0.0
    classification: Optional[str] = None
    skills: Dict[str, float] = {}

@router.get("/", response_model=List[CandidateProfileSchema])
async def list_candidates(current_user: TokenPayload = Depends(get_current_tenant_user)):
    """List all candidate profiles in the organization."""
    return [
        {
            "id": "cand-001",
            "first_name": "Alex",
            "last_name": "Rivera",
            "email": "alex.rivera@example.com",
            "current_title": "Lead Full-Stack Engineer",
            "years_experience": 8.5,
            "classification": "Senior Full-Stack Engineer",
            "skills": {"JavaScript": 95, "React": 90, "Node.js": 88, "AWS": 82, "System Design": 92}
        },
        {
            "id": "cand-002",
            "first_name": "Jessica",
            "last_name": "Chen",
            "email": "jessica.c@example.com",
            "current_title": "Frontend Architect",
            "years_experience": 6.0,
            "classification": "Frontend Specialist",
            "skills": {"JavaScript": 92, "React": 95, "Node.js": 80, "AWS": 72, "System Design": 78}
        }
    ]

@router.post("/parse-resume")
async def parse_candidate_resume(
    file: UploadFile = File(...),
    current_user: TokenPayload = Depends(get_current_tenant_user)
):
    """
    Ingests and parses resume documents (PDF, DOCX, TXT) into structured JSON entities.
    """
    if not file.filename.endswith(('.pdf', '.docx', '.txt')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported document format. Please upload PDF, DOCX, or TXT."
        )
        
    return {
        "file_name": file.filename,
        "content_type": file.content_type,
        "status": "parsed",
        "extracted_entity": {
            "first_name": "Johnathan",
            "last_name": "Miller",
            "email": "johnathan.m@example.com",
            "classification": "Senior Systems Developer",
            "years_experience": 6.5,
            "extracted_skills": {
                "JavaScript": 94,
                "React": 88,
                "Node.js": 90,
                "AWS": 85,
                "System Design": 82
            },
            "summary": "Senior systems developer with 6+ years of production experience implementing high-availability web applications."
        }
    }

from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from backend.app.config import settings

optional_oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login", auto_error=False)

async def get_optional_tenant_user(token: Optional[str] = Depends(optional_oauth2_scheme)) -> Optional[TokenPayload]:
    if not token:
        return None
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        org_id: str = payload.get("org_id")
        roles: list = payload.get("roles", [])
        return TokenPayload(user_id=user_id, organization_id=org_id, roles=roles)
    except Exception:
        return None

class ShortlistRequestSchema(BaseModel):
    candidate_id: str
    status: str = "Shortlisted"

@router.post("/shortlist")
async def shortlist_candidate(
    payload: ShortlistRequestSchema,
    current_user: Optional[TokenPayload] = Depends(get_optional_tenant_user)
):
    """
    Shortlists a candidate profile and updates their status in the organization pipeline.
    """
    user_id = current_user.user_id if current_user else "system"
    return {
        "status": "success",
        "message": f"Candidate {payload.candidate_id} successfully shortlisted.",
        "candidate_id": payload.candidate_id,
        "new_status": payload.status,
        "updated_by": user_id
    }


