"""
Configuration and Environment Security Module for Aanvi / StudyTwin AI
Strictly validates production environment variables and security constraints.
"""

import os
import sys
from typing import List
from dotenv import load_dotenv

# Load local .env if present
load_dotenv()

ENV = os.getenv("ENVIRONMENT", os.getenv("ENV", "development")).lower()
IS_PRODUCTION = ENV in ("production", "prod")

# Database Configuration
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://studytwin:studytwin_password@172.17.43.201:5432/studytwin_db"
)
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)

TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql://studytwin:studytwin_password@localhost:5432/studytwin_test_db"
)

# AI Models & Keys
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("LLM_API_KEY") or ""
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "intfloat/multilingual-e5-base")
REPETITION_THRESHOLD = float(os.getenv("REPETITION_THRESHOLD", "0.70"))

# Allowed Origins (CORS)
ALLOWED_ORIGINS_RAW = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
ALLOWED_ORIGINS: List[str] = [origin.strip() for origin in ALLOWED_ORIGINS_RAW.split(",") if origin.strip()]


def validate_production_environment() -> None:
    """
    Strictly validates production environment variables.
    Raises RuntimeError if critical security rules are violated.
    """
    if not IS_PRODUCTION:
        return

    errors = []

    # 1. Database URL Validation
    if not DATABASE_URL:
        errors.append("DATABASE_URL is not configured for production.")
    elif DATABASE_URL.startswith("sqlite"):
        errors.append("SQLite is strictly prohibited in production. A PostgreSQL connection is required.")
    elif "your_secure_password" in DATABASE_URL or "studytwin_password" in DATABASE_URL:
        errors.append("Default or placeholder database password detected in production DATABASE_URL.")

    # 2. AI Model API Key Validation
    if not GEMINI_API_KEY:
        errors.append("GEMINI_API_KEY or LLM_API_KEY must be provided in production.")
    elif GEMINI_API_KEY.startswith("YOUR_") or "ROTATED" in GEMINI_API_KEY:
        errors.append("Placeholder AI API key detected in production environment.")

    # 3. CORS Allowed Origins Validation
    if "*" in ALLOWED_ORIGINS:
        errors.append("Wildcard '*' in ALLOWED_ORIGINS is prohibited in production when credentials are enabled.")
    if all("localhost" in origin or "127.0.0.1" in origin for origin in ALLOWED_ORIGINS):
        errors.append("Production ALLOWED_ORIGINS only contains localhost. Set your production frontend domain.")

    if errors:
        error_msg = "\n".join([f"  - {e}" for e in errors])
        raise RuntimeError(
            f"\n[SECURITY ALERT] Production environment validation failed:\n{error_msg}\n"
            f"Please update your production environment variables before starting the server."
        )


# Export configurations
__all__ = [
    "ENV",
    "IS_PRODUCTION",
    "DATABASE_URL",
    "TEST_DATABASE_URL",
    "GEMINI_API_KEY",
    "EMBEDDING_MODEL",
    "REPETITION_THRESHOLD",
    "ALLOWED_ORIGINS",
    "validate_production_environment",
]
