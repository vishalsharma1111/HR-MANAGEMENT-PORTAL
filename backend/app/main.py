import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import engine, Base
from app.seed_data import seed_database

# Import routers
from app.api import (
    auth,
    employees,
    departments,
    documents,
    onboarding,
    assets,
    announcements,
    audit,
    dashboard,
    # Phase 2
    attendance,
    leave,
    payroll,
    recruitment,
    performance,
    expenses,
    reports,
    # Phase 3
    ml,
    ai_assistant,
    # Public & Communications
    contact
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure database tables are created and initial seed data is loaded (unless in test mode)
    if os.getenv("TESTING") != "1":
        Base.metadata.create_all(bind=engine)
        seed_database()
    yield
    # Shutdown

app = FastAPI(
    title="Enterprise HRMS Core API",
    description="Enterprise-grade Human Resource Management System (Phase 1 & Phase 2 Operations)",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Uploads directory for secure local storage delivery
if os.path.exists(settings.UPLOAD_DIR):
    app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include Routers with /api prefix
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(employees.router, prefix=settings.API_V1_PREFIX)
app.include_router(departments.router, prefix=settings.API_V1_PREFIX)
app.include_router(documents.router, prefix=settings.API_V1_PREFIX)
app.include_router(onboarding.router, prefix=settings.API_V1_PREFIX)
app.include_router(assets.router, prefix=settings.API_V1_PREFIX)
app.include_router(announcements.router, prefix=settings.API_V1_PREFIX)
app.include_router(audit.router, prefix=settings.API_V1_PREFIX)
app.include_router(dashboard.router, prefix=settings.API_V1_PREFIX)

# Phase 2 Routers
app.include_router(attendance.router, prefix=settings.API_V1_PREFIX)
app.include_router(leave.router, prefix=settings.API_V1_PREFIX)
app.include_router(payroll.router, prefix=settings.API_V1_PREFIX)
app.include_router(recruitment.router, prefix=settings.API_V1_PREFIX)
app.include_router(performance.router, prefix=settings.API_V1_PREFIX)
app.include_router(expenses.router, prefix=settings.API_V1_PREFIX)
app.include_router(reports.router, prefix=settings.API_V1_PREFIX)

# Phase 3 Routers: Machine Learning & AI HR Assistant
app.include_router(ml.router, prefix=settings.API_V1_PREFIX)
app.include_router(ai_assistant.router, prefix=settings.API_V1_PREFIX)
app.include_router(contact.router, prefix=settings.API_V1_PREFIX)

@app.get("/health")
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Enterprise HRMS API",
        "version": "4.0.0",
        "phase": "Phase 4: Full System Verification & Production Deployment"
    }

@app.get("/")
def root():
    return {
        "message": "Welcome to Enterprise HRMS API (Phase 3)",
        "documentation": "/api/docs",
        "health": "/api/health"
    }
