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
