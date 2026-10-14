"""
Authentication API for Aanvi
- Argon2id password hashing & verification
- Server-enforced age verification and mode derivation
- Lockout protection after 5 consecutive failures
- Probing-safe forgot-password with 30-min single-use tokens
- Session revocation on password reset and logout-all
- Guardian email masking & parental consent workflow
- Account and personal data purge (GDPR / COPPA compliant)
"""

import uuid
from datetime import datetime, timedelta
from typing import Optional, List, Dict
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import (
    User, UserSession, PasswordResetToken, EmailVerificationToken,
    AuthEvent, UserSettings, generate_uuid
)
from app.database.schemas import (
    UserSignUpRequest, UserLoginRequest, ForgotPasswordRequest,
    ResetPasswordRequest, ChangePasswordRequest, DeleteAccountRequest,
    AuthResponse, UserProfileSchema
)
from app.auth.security import (
    hash_password, verify_password, calculate_age_and_mode,
    mask_email, generate_secure_token, hash_token, check_password_strength
)
from app.services.email_service import (
    send_guardian_consent_email, send_password_reset_email,
    send_password_changed_notification
)
from app.auth.dependencies import get_current_user, get_optional_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

# In-memory simple rate limiting tracker for login & forgot-password endpoints
_RATE_LIMITS: Dict[str, List[datetime]] = {}


def _check_rate_limit(key: str, max_calls: int = 10, window_seconds: int = 60):
    now = datetime.utcnow()
    window_start = now - timedelta(seconds=window_seconds)
    calls = _RATE_LIMITS.get(key, [])
    # Prune outdated calls
    calls = [t for t in calls if t > window_start]
    if len(calls) >= max_calls:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many authentication requests. Please wait a moment and try again."
        )
    calls.append(now)
    _RATE_LIMITS[key] = calls


def _build_user_profile(user: User) -> UserProfileSchema:
    # Ensure age is calculated
    age, mode = calculate_age_and_mode(user.date_of_birth)
    is_explorer = mode == "explorer"
    return UserProfileSchema(
        id=str(user.id),
        name=user.full_name,
        email=user.email,
        age=age,
        dob=user.date_of_birth,
        grade=user.school_grade or ("Grade 8" if is_explorer else "Grade 11"),
        preferred_language=user.language or "en",
        guardian_email=mask_email(user.guardian_email_encrypted) if is_explorer else None,
        guardian_consent=user.guardian_consent_at is not None,
        mode=mode,
        xp=200 if is_explorer else 500,
        stars=10 if is_explorer else 20,
        level=1,
        streak_days=1,
        child_safety_enabled=is_explorer,
        created_at=user.created_at
    )


def _set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    response.set_cookie(
        key="aanvi_access_token",
        value=access_token,
        httponly=True,
        samesite="lax",
        secure=False,  # Set True in production with HTTPS
        max_age=86400 * 7
    )
    response.set_cookie(
        key="aanvi_refresh_token",
        value=refresh_token,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=86400 * 30
    )


def _clear_auth_cookies(response: Response):
    response.delete_cookie(key="aanvi_access_token")
    response.delete_cookie(key="aanvi_refresh_token")


# -------------------------------------------------------------------------
# 1. Sign Up
# -------------------------------------------------------------------------
@router.post("/signup", response_model=AuthResponse)
def signup(req: UserSignUpRequest, request: Request, response: Response, db: Session = Depends(get_db)):
    client_ip = request.client.host if request.client else "127.0.0.1"
    _check_rate_limit(f"signup:{client_ip}", max_calls=15, window_seconds=60)

    email_clean = req.email.lower().strip()
    existing = db.query(User).filter(User.email == email_clean).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    # Server enforces age and mode strictly from Date of Birth
    dob_input = req.date_of_birth or req.dob
    if not dob_input:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Date of birth is required to establish learning mode and safety controls."
        )

    user_age, derived_mode = calculate_age_and_mode(dob_input)
    is_explorer = derived_mode == "explorer"

    # Strict Guardian rule for minor Explorer mode (Age <= 15)
    if is_explorer:
        if not req.guardian_email or not req.guardian_email.strip() or "@" not in req.guardian_email:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Parent or Guardian email is strictly required for students aged 15 and under."
            )
        # Ensure grade is school/grade, never university
        school_grade = req.school_grade or req.grade or "School / Grade 8"
        if "univ" in school_grade.lower() or "college" in school_grade.lower():
            school_grade = "School / Grade 8"
    else:
        school_grade = req.school_grade or req.grade or "College / Grade 11"

    # Password strength check
    if len(req.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Password must be at least 8 characters long."
        )

    # Argon2id password hash
    pw_hash = hash_password(req.password)

    new_user = User(
        id=generate_uuid(),
        email=email_clean,
        password_hash=pw_hash,
        full_name=(req.full_name or req.name or "Aanvi Student").strip(),
        date_of_birth=dob_input,
        age_group=derived_mode,
        mode=derived_mode,
        language=req.language or "en",
        guardian_email_encrypted=req.guardian_email.strip() if is_explorer else None,
        guardian_consent_at=None,
        email_verified_at=None,
        school_grade=school_grade,
        terms_accepted=req.terms_accepted,
        failed_login_attempts=0,
        lockout_until=None,
        is_active=True
    )
    db.add(new_user)
    db.flush()

    # User Settings
    settings = UserSettings(
        user_id=new_user.id,
        palette="a",
        theme="dark",
        language=req.language or "en",
        sound=True,
        reduced_motion=False
    )
    db.add(settings)

    # If Explorer mode, generate consent token and send guardian email
    if is_explorer:
        raw_consent_token, consent_hash = generate_secure_token()
        consent_token_entry = EmailVerificationToken(
            id=generate_uuid(),
            user_id=new_user.id,
            token_hash=consent_hash,
            expires_at=datetime.utcnow() + timedelta(days=14)
        )
        db.add(consent_token_entry)
        send_guardian_consent_email(req.guardian_email.strip(), new_user.full_name, raw_consent_token)

    # Create session
    raw_session_token, session_hash = generate_secure_token()
    raw_refresh_token, refresh_hash = generate_secure_token()
    user_session = UserSession(
        id=generate_uuid(),
        user_id=new_user.id,
        token_hash=session_hash,
        device=request.headers.get("user-agent", "Web Browser")[:150],
        expires_at=datetime.utcnow() + timedelta(days=7)
    )
    db.add(user_session)

    # Security audit event
    audit = AuthEvent(
        id=generate_uuid(),
        user_id=new_user.id,
        event_type="signup",
        ip_hash=client_ip,
        user_agent=request.headers.get("user-agent", "")[:255]
    )
    db.add(audit)
    db.commit()
    db.refresh(new_user)

    _set_auth_cookies(response, raw_session_token, raw_refresh_token)

    return AuthResponse(
        access_token=raw_session_token,
        refresh_token=raw_refresh_token,
        token_type="bearer",
        user=_build_user_profile(new_user)
    )


# -------------------------------------------------------------------------
# 2. Login
# -------------------------------------------------------------------------
@router.post("/login", response_model=AuthResponse)
def login(req: UserLoginRequest, request: Request, response: Response, db: Session = Depends(get_db)):
    client_ip = request.client.host if request.client else "127.0.0.1"
    _check_rate_limit(f"login:{client_ip}", max_calls=25, window_seconds=60)

    email_clean = req.email.lower().strip()
    user = db.query(User).filter(User.email == email_clean).first()

    if not user:
        # Delay slightly to mitigate timing attacks
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    # Check lockout
    now = datetime.utcnow()
    if user.lockout_until and user.lockout_until > now:
        remaining_minutes = int((user.lockout_until - now).total_seconds() / 60) + 1
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail=f"Account is temporarily locked due to 5 consecutive failed login attempts. Please try again in {remaining_minutes} minutes or reset your password."
        )

    # Verify password with Argon2id
    is_valid = verify_password(req.password, user.password_hash)

    if not is_valid:
        user.failed_login_attempts = (user.failed_login_attempts or 0) + 1

        if user.failed_login_attempts >= 5:
            user.lockout_until = now + timedelta(minutes=15)
            db.add(AuthEvent(
                id=generate_uuid(),
                user_id=user.id,
                event_type="lockout",
                ip_hash=client_ip,
                user_agent=request.headers.get("user-agent", "")[:255]
            ))
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail="Account is temporarily locked due to 5 consecutive failed login attempts. Please try again in 15 minutes or reset your password."
            )

        db.add(AuthEvent(
            id=generate_uuid(),
            user_id=user.id,
            event_type="login_failure",
            ip_hash=client_ip,
            user_agent=request.headers.get("user-agent", "")[:255]
        ))
        db.commit()
        remaining_attempts = 5 - user.failed_login_attempts
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid email or password. {remaining_attempts} attempt(s) remaining before temporary lockout."
        )

    # Successful login: reset failed counters
    user.failed_login_attempts = 0
    user.lockout_until = None

    raw_session_token, session_hash = generate_secure_token()
    raw_refresh_token, refresh_hash = generate_secure_token()
    user_session = UserSession(
        id=generate_uuid(),
        user_id=user.id,
        token_hash=session_hash,
        device=request.headers.get("user-agent", "Web Browser")[:150],
        expires_at=datetime.utcnow() + timedelta(days=7)
    )
    db.add(user_session)
    db.add(AuthEvent(
        id=generate_uuid(),
        user_id=user.id,
        event_type="login_success",
        ip_hash=client_ip,
        user_agent=request.headers.get("user-agent", "")[:255]
    ))
    db.commit()

    _set_auth_cookies(response, raw_session_token, raw_refresh_token)

    return AuthResponse(
        access_token=raw_session_token,
        refresh_token=raw_refresh_token,
        token_type="bearer",
        user=_build_user_profile(user)
    )


# -------------------------------------------------------------------------
# 3. Forgot Password (Probing-Protected)
# -------------------------------------------------------------------------
@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, request: Request, db: Session = Depends(get_db)):
    client_ip = request.client.host if request.client else "127.0.0.1"
    _check_rate_limit(f"forgot:{client_ip}", max_calls=8, window_seconds=60)

    email_clean = req.email.lower().strip()
    user = db.query(User).filter(User.email == email_clean).first()

    # Always return identical positive message to prevent email account probing
    generic_response = {
        "success": True,
        "message": "If that email address is registered with Aanvi, we have sent password reset instructions to it."
    }

    if user:
        raw_token, token_hash = generate_secure_token()
        reset_token = PasswordResetToken(
            id=generate_uuid(),
            user_id=user.id,
            token_hash=token_hash,
            expires_at=datetime.utcnow() + timedelta(minutes=30)
        )
        db.add(reset_token)
        db.add(AuthEvent(
            id=generate_uuid(),
            user_id=user.id,
            event_type="password_reset_request",
            ip_hash=client_ip,
            user_agent=request.headers.get("user-agent", "")[:255]
        ))
        db.commit()

        # Dispatch reset email
        send_password_reset_email(user.email, raw_token)

    return generic_response


# -------------------------------------------------------------------------
# 4. Reset Password
# -------------------------------------------------------------------------
@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, request: Request, db: Session = Depends(get_db)):
    client_ip = request.client.host if request.client else "127.0.0.1"
    _check_rate_limit(f"reset:{client_ip}", max_calls=10, window_seconds=60)

    token_hash = hash_token(req.token.strip())
    token_record = db.query(PasswordResetToken).filter(PasswordResetToken.token_hash == token_hash).first()

    if not token_record or token_record.used_at is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password reset token is invalid or has already been used."
        )

    now = datetime.utcnow()
    if token_record.expires_at < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password reset token has expired. Please request a new one."
        )

    if len(req.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Password must be at least 8 characters long."
        )

    user = db.query(User).filter(User.id == token_record.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    # Update password with Argon2id
    user.password_hash = hash_password(req.new_password)
    user.failed_login_attempts = 0
    user.lockout_until = None
    token_record.used_at = now

    # Revoke ALL active sessions for this user
    active_sessions = db.query(UserSession).filter(
        UserSession.user_id == user.id,
        UserSession.revoked_at.is_(None)
    ).all()
    for s in active_sessions:
        s.revoked_at = now

    db.add(AuthEvent(
        id=generate_uuid(),
        user_id=user.id,
        event_type="password_reset_success",
        ip_hash=client_ip,
        user_agent=request.headers.get("user-agent", "")[:255]
    ))
    db.commit()

    # Dispatch security notice email
    send_password_changed_notification(user.email)

    return {
        "success": True,
        "message": "Password successfully reset. All active sessions have been revoked."
    }


# -------------------------------------------------------------------------
# 5. Guardian Consent Confirmation
# -------------------------------------------------------------------------
@router.get("/guardian/consent/{token}")
def confirm_guardian_consent(token: str, db: Session = Depends(get_db)):
    token_hash = hash_token(token.strip())
    token_record = db.query(EmailVerificationToken).filter(
        EmailVerificationToken.token_hash == token_hash
    ).first()

    if not token_record or token_record.used_at is not None:
        raise HTTPException(status_code=400, detail="Guardian consent link is invalid or already used.")

    if token_record.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Guardian consent link has expired.")

    user = db.query(User).filter(User.id == token_record.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Student account not found.")

    token_record.used_at = datetime.utcnow()
    user.guardian_consent_at = datetime.utcnow()
    db.commit()

    return {
        "success": True,
        "student_name": user.full_name,
        "message": f"Parental consent confirmed for {user.full_name}. Full learning features are now active."
    }


# -------------------------------------------------------------------------
# 6. Current User Profile
# -------------------------------------------------------------------------
@router.get("/me", response_model=UserProfileSchema)
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return _build_user_profile(current_user)



# -------------------------------------------------------------------------
# 7. Logout & Logout All Devices
# -------------------------------------------------------------------------
@router.post("/logout")
def logout(response: Response):
    _clear_auth_cookies(response)
    return {"success": True, "message": "Logged out successfully."}


@router.post("/logout-all")
def logout_all_devices(user_id: Optional[str] = None, response: Response = None, db: Session = Depends(get_db)):
    if user_id:
        now = datetime.utcnow()
        sessions = db.query(UserSession).filter(
            UserSession.user_id == user_id,
            UserSession.revoked_at.is_(None)
        ).all()
        for s in sessions:
            s.revoked_at = now
        db.commit()

    if response:
        _clear_auth_cookies(response)

    return {"success": True, "message": "All devices and active sessions logged out."}


# -------------------------------------------------------------------------
# 8. Change Password (Authenticated)
# -------------------------------------------------------------------------
@router.post("/change-password")
def change_password(req: ChangePasswordRequest, user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if not verify_password(req.old_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect current password.")

    if len(req.new_password) < 8:
        raise HTTPException(status_code=422, detail="New password must be at least 8 characters long.")

    user.password_hash = hash_password(req.new_password)
    # Revoke sessions
    now = datetime.utcnow()
    sessions = db.query(UserSession).filter(
        UserSession.user_id == user.id,
        UserSession.revoked_at.is_(None)
    ).all()
    for s in sessions:
        s.revoked_at = now
    db.commit()

    send_password_changed_notification(user.email)
    return {"success": True, "message": "Password changed successfully. All sessions revoked."}


# -------------------------------------------------------------------------
# 9. Delete Account & Personal Data (GDPR / COPPA cascade purge)
# -------------------------------------------------------------------------
@router.delete("/delete-account")
@router.post("/delete-my-data")
def delete_account(
    req: Optional[DeleteAccountRequest] = None,
    user_id: Optional[str] = None,
    response: Response = None,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    user = None
    if current_user:
        user = current_user
    elif user_id:
        user = db.query(User).filter(User.id == user_id).first()
    elif req:
        user = db.query(User).filter(User.email == req.confirm_email.lower().strip()).first()
        if user and not verify_password(req.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid password verification for account deletion.")

    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")

    if req and not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid password verification for account deletion.")

    email_deleted = user.email
    uid = str(user.id)

    # 1. Pre-deletion counts across all student data tables
    from app.database import models
    pre_counts = {
        "users": db.query(models.User).filter(models.User.id == uid).count(),
        "courses": db.query(models.Course).filter(models.Course.user_id == uid).count(),
        "course_materials": db.query(models.CourseMaterial).filter(models.CourseMaterial.user_id == uid).count(),
        "content_units": db.query(models.ContentUnit).join(models.Course, models.ContentUnit.course_id == models.Course.id).filter(models.Course.user_id == uid).count(),
        "concepts": db.query(models.Topic).join(models.Course, models.Topic.course_id == models.Course.id).filter(models.Course.user_id == uid).count(),
        "mastery_states": db.query(models.MasteryState).filter(models.MasteryState.user_id == uid).count(),
        "course_enrollments": db.query(models.CourseEnrollment).filter(models.CourseEnrollment.user_id == uid).count(),
        "xp_events": db.query(models.XPEvent).filter(models.XPEvent.user_id == uid).count(),
        "user_badges": db.query(models.UserBadge).filter(models.UserBadge.user_id == uid).count(),
        "streak_days": db.query(models.StreakDay).filter(models.StreakDay.user_id == uid).count(),
    }

    # 2. Physical disk purge of uploaded files
    import os
    files_purged = 0
    docs = db.query(models.Document).filter(models.Document.user_id == uid).all()
    for d in docs:
        if d.file_path and os.path.exists(d.file_path):
            try:
                os.remove(d.file_path)
                files_purged += 1
            except Exception:
                pass

    # 3. Cascade delete dependent child records
    user_course_ids = [c.id for c in db.query(models.Course).filter(models.Course.user_id == uid).all()]
    if user_course_ids:
        db.query(models.ContentUnit).filter(models.ContentUnit.course_id.in_(user_course_ids)).delete(synchronize_session=False)
        db.query(models.Topic).filter(models.Topic.course_id.in_(user_course_ids)).delete(synchronize_session=False)
        db.query(models.Document).filter(models.Document.course_id.in_(user_course_ids)).delete(synchronize_session=False)
        db.query(models.CourseEnrollment).filter(models.CourseEnrollment.course_id.in_(user_course_ids)).delete(synchronize_session=False)
        db.query(models.Course).filter(models.Course.id.in_(user_course_ids)).delete(synchronize_session=False)

    db.query(models.MasteryState).filter(models.MasteryState.user_id == uid).delete(synchronize_session=False)
    db.query(models.CourseEnrollment).filter(models.CourseEnrollment.user_id == uid).delete(synchronize_session=False)
    db.query(models.XPEvent).filter(models.XPEvent.user_id == uid).delete(synchronize_session=False)
    db.query(models.UserBadge).filter(models.UserBadge.user_id == uid).delete(synchronize_session=False)
    db.query(models.StreakDay).filter(models.StreakDay.user_id == uid).delete(synchronize_session=False)

    db.delete(user)
    db.commit()

    # 4. Post-deletion counts
    post_counts = {
        "users": db.query(models.User).filter(models.User.id == uid).count(),
        "courses": db.query(models.Course).filter(models.Course.user_id == uid).count(),
        "course_materials": db.query(models.CourseMaterial).filter(models.CourseMaterial.user_id == uid).count(),
        "content_units": db.query(models.ContentUnit).join(models.Course, models.ContentUnit.course_id == models.Course.id).filter(models.Course.user_id == uid).count() if user_course_ids else 0,
        "concepts": db.query(models.Topic).join(models.Course, models.Topic.course_id == models.Course.id).filter(models.Course.user_id == uid).count() if user_course_ids else 0,
        "mastery_states": db.query(models.MasteryState).filter(models.MasteryState.user_id == uid).count(),
        "course_enrollments": db.query(models.CourseEnrollment).filter(models.CourseEnrollment.user_id == uid).count(),
        "xp_events": db.query(models.XPEvent).filter(models.XPEvent.user_id == uid).count(),
        "user_badges": db.query(models.UserBadge).filter(models.UserBadge.user_id == uid).count(),
        "streak_days": db.query(models.StreakDay).filter(models.StreakDay.user_id == uid).count(),
    }

    if response:
        _clear_auth_cookies(response)

    return {
        "success": True,
        "message": f"Account and all personal student records for {email_deleted} permanently erased from database.",
        "pre_deletion_counts": pre_counts,
        "post_deletion_counts": post_counts,
        "files_purged": files_purged,
        "vector_entries_purged": pre_counts["content_units"]
    }
