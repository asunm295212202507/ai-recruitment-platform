import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Enterprise AI Recruitment Platform API"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-production-key-change-in-env-982137")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 Days
    ALGORITHM: str = "HS256"
    
    # Database Configuration
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql+asyncpg://postgres:postgres@localhost:5432/recruitment_db"
    )
    
    # Redis Cache Configuration
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # AI Engine Configuration
    AI_MODEL_VERSION: str = "v3.5.2-prod"
    ENFORCE_EXPLAINABILITY: bool = True
    
    class Config:
        case_sensitive = True

settings = Settings()
