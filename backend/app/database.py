from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from backend.app.config import settings

import os
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

db_url = os.getenv("DATABASE_URL")
if not db_url:
    # Fallback to local SQLite database if no DATABASE_URL environment variable is provided
    db_url = "sqlite+aiosqlite:///./talentai.db"
elif db_url.startswith("postgresql://"):
    # Convert standard PostgreSQL URI to asyncpg-specific URI
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

# Configure connection pool arguments based on database dialect
connect_args = {}
engine_kwargs = {"future": True, "echo": False}

if "sqlite" in db_url:
    # SQLite fallback
    if db_url.startswith("sqlite://"):
        db_url = db_url.replace("sqlite://", "sqlite+aiosqlite://", 1)
    connect_args["check_same_thread"] = False
else:
    # PostgreSQL configuration
    engine_kwargs["pool_size"] = 20
    engine_kwargs["max_overflow"] = 10


engine = create_async_engine(
    db_url,
    connect_args=connect_args,
    **engine_kwargs
)

AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)


Base = declarative_base()

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
