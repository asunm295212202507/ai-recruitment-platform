from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import settings
from backend.app.api.v1 import jobs, candidates, matching, audit, analytics, ml, auth, interviews

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    description="Enterprise AI Recruitment Platform API with Explainable Scoring, Audit Logging, and Multi-Tenant RBAC."
)

# Startup Database Table Creation
@app.on_event("startup")
async def startup_db_init():
    from backend.app import models
    from backend.app.database import engine, Base
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("[DB] Database tables initialized/checked successfully.")
    except Exception as e:
        print(f"[DB] [Error] Failed to initialize database: {e}")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Router Registration
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(jobs.router, prefix=f"{settings.API_V1_STR}/jobs", tags=["Jobs & Requisitions"])
app.include_router(candidates.router, prefix=f"{settings.API_V1_STR}/candidates", tags=["Candidates & Resumes"])
app.include_router(matching.router, prefix=f"{settings.API_V1_STR}/matching", tags=["AI Matching & Ranking"])
app.include_router(audit.router, prefix=f"{settings.API_V1_STR}/audit", tags=["Governance & Audit Logs"])
app.include_router(analytics.router, prefix=f"{settings.API_V1_STR}/analytics", tags=["Recruiter Analytics"])
app.include_router(ml.router, prefix=f"{settings.API_V1_STR}/ml", tags=["ML Model Training & Pipelines"])
app.include_router(interviews.router, prefix=f"{settings.API_V1_STR}/interviews", tags=["Interview Invitations"])

@app.get("/")
async def root_health_check():
    return {
        "status": "online",
        "platform": settings.PROJECT_NAME,
        "ai_engine_version": settings.AI_MODEL_VERSION,
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

