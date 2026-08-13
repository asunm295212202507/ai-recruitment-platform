import uuid
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from backend.app.database import get_db
from backend.app.models import User, Organization
from backend.app.middleware.auth import create_access_token, TokenPayload, get_current_tenant_user
from backend.app.config import settings

router = APIRouter()

class UserRegisterSchema(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "recruiter"

class UserLoginSchema(BaseModel):
    email: EmailStr
    password: str

class UserResponseSchema(BaseModel):
    email: str
    displayName: str
    initials: str
    role: str
    token: str

@router.post("/register", response_model=UserResponseSchema)
async def register_user(payload: UserRegisterSchema, db: AsyncSession = Depends(get_db)):
    # 1. Normalize email
    email_clean = payload.email.strip().lower()
    
    # 2. Check if user already exists
    stmt = select(User).where(User.email == email_clean)
    result = await db.execute(stmt)
    existing_user = result.scalars().first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )
    
    # 3. Ensure default organization exists
    default_org_id = uuid.UUID("11111111-1111-1111-1111-111111111111")
    org_stmt = select(Organization).where(Organization.id == default_org_id)
    org_result = await db.execute(org_stmt)
    org = org_result.scalars().first()
    
    if not org:
        org = Organization(
            id=default_org_id,
            name="Acme Enterprise Corp",
            domain="acme-corp.com",
            subscription_plan="enterprise",
            status="active",
            settings={}
        )
        db.add(org)
        await db.flush() # ensure ID is populated/persisted within transaction block

    # 4. Split full name
    name_parts = payload.name.strip().split(" ", 1)
    first_name = name_parts[0]
    last_name = name_parts[1] if len(name_parts) > 1 else ""

    # 5. Create new User
    hashed_pwd = User.hash_password(payload.password)
    new_user = User(
        organization_id=org.id,
        email=email_clean,
        password_hash=hashed_pwd,
        first_name=first_name,
        last_name=last_name,
        is_active=True
    )
    db.add(new_user)
    await db.flush()

    # 6. Generate access token
    # Role mappings or default metadata
    initials = "".join([part[0].upper() for part in [first_name, last_name] if part])
    token_data = {
        "sub": str(new_user.id),
        "org_id": str(org.id),
        "roles": [payload.role]
    }
    access_token = create_access_token(token_data)

    return {
        "email": new_user.email,
        "displayName": payload.name.strip(),
        "initials": initials or new_user.email[0].upper(),
        "role": payload.role,
        "token": access_token
    }

@router.post("/login", response_model=UserResponseSchema)
async def login_user(payload: UserLoginSchema, db: AsyncSession = Depends(get_db)):
    email_clean = payload.email.strip().lower()

    # 1. Fetch user by email
    stmt = select(User).where(User.email == email_clean)
    result = await db.execute(stmt)
    user = result.scalars().first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )

    # 2. Verify password
    if not user.verify_password(payload.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )

    # 3. Load user role (mock fallback role mapping or default roles)
    # The frontend maps role strings. Let's return the standard role the user registered or recruiters role
    role = "recruiter"
    
    initials = "".join([part[0].upper() for part in [user.first_name, user.last_name] if part])
    token_data = {
        "sub": str(user.id),
        "org_id": str(user.organization_id),
        "roles": [role]
    }
    access_token = create_access_token(token_data)

    return {
        "email": user.email,
        "displayName": user.display_name,
        "initials": initials or user.email[0].upper(),
        "role": role,
        "token": access_token
    }

@router.get("/me")
async def get_current_user_profile(
    current_user: TokenPayload = Depends(get_current_tenant_user),
    db: AsyncSession = Depends(get_db)
):
    user_id = uuid.UUID(current_user.user_id)
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User profile not found")
        
    initials = "".join([part[0].upper() for part in [user.first_name, user.last_name] if part])
    return {
        "email": user.email,
        "displayName": user.display_name,
        "initials": initials or user.email[0].upper(),
        "role": current_user.roles[0] if current_user.roles else "recruiter"
    }
