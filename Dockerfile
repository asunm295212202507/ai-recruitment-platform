# Use official Python 3.11 slim image
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for compilation & PostgreSQL driver
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/app/config.py backend/app/
RUN pip install --no-cache-dir \
    fastapi \
    uvicorn[standard] \
    sqlalchemy[asyncio] \
    asyncpg \
    pydantic \
    pydantic-settings \
    python-jose[cryptography] \
    passlib[bcrypt] \
    python-multipart \
    scikit-learn \
    pandas \
    joblib


# Copy backend application source code
COPY backend/ /app/backend/
COPY database/ /app/database/

EXPOSE 8000

ENV PYTHONPATH=/app

CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
