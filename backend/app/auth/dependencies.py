"""
Authentication Dependencies for Aanvi
Strict session enforcement complying with Part E2:
- Rejects unauthenticated requests with 401 Unauthorized
- Eliminates any 'fallback user' (db.query(User).first() or hardcoded IDs)
- Validates sessions against the PostgreSQL `sessions` table
"""

from datetime import datetime
from typing import Optional
from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import User, UserSession
from app.auth.security import hash_token


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    """
    Extracts and validates the current active user from session token.
    Checks Authorization header (Bearer token), X-Session-Token, or aanvi_access_token cookie.
    Raises 401 Unauthorized if no valid active session exists.
    """
    token: Optional[str] = None

    auth_header = request.headers.get("Authorization")
    if auth_header:
        if auth_header.startswith("Bearer "):
            token = auth_header[7:].strip()
        else:
            token = auth_header.strip()

    if not token:
        token = request.headers.get("X-Session-Token")

    if not token:
        token = request.cookies.get("aanvi_access_token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required: No valid session token provided. (Part E2 Auth Enforcement)",
            headers={"WWW-Authenticate": "Bearer"},
        )

    t_hash = hash_token(token)
    session_record = db.query(UserSession).filter(
        UserSession.token_hash == t_hash,
        UserSession.revoked_at.is_(None)
    ).first()

    if not session_record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or revoked session token. (Part E2 Auth Enforcement)",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if session_record.expires_at and session_record.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == session_record.user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account associated with this session is inactive or not found.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


def get_optional_current_user(request: Request, db: Session = Depends(get_db)) -> Optional[User]:
    """Optional user dependency for non-gated public informational endpoints."""
    try:
        return get_current_user(request, db)
    except HTTPException:
        return None
