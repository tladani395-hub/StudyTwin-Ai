import sys
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.database import init_db, SessionLocal
from app.database.models import Course
from app.api import auth, courses, documents, tutor, assessments, learner, analytics, settings, dashboard, demo, health, evaluation, voice, camera

from app.config import ALLOWED_ORIGINS, validate_production_environment

app = FastAPI(
    title="StudyTwin AI API",
    description="Multimodal Source-Grounded AI Study Companion Backend",
    version="1.0.0"
)

# CORS middleware for Next.js frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi import Request
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    return JSONResponse(
        status_code=503,
        content={"detail": "Database service temporarily unavailable. Please retry shortly."},
        headers={"Retry-After": "5"}
    )

# Include Routers
app.include_router(auth.router, prefix="/api")
app.include_router(courses.router, prefix="/api")
app.include_router(documents.router, prefix="/api")
app.include_router(tutor.router, prefix="/api")
app.include_router(assessments.router, prefix="/api")
app.include_router(learner.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(settings.router, prefix="/api")
app.include_router(health.router, prefix="/api")
app.include_router(evaluation.router, prefix="/api")
app.include_router(voice.router, prefix="/api")
app.include_router(camera.router, prefix="/api")
app.include_router(dashboard.router)
if os.getenv("ALLOW_DEV_DEMO", "false").lower() == "true":
    app.include_router(demo.router)


@app.on_event("startup")
def on_startup():
    validate_production_environment()
    init_db()


@app.get("/")
def root():
    return {
        "status": "online",
        "service": "StudyTwin AI API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "StudyTwin AI Backend"}
