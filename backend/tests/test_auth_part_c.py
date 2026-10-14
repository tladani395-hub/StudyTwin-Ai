"""
Part C Authentication Test Suite
Tests:
- signup under 16 vs 16+ (explorer with guardian email vs scholar)
- tampered mode is rejected (mode strictly derived from DOB on server)
- wrong password lockout (lockout after 5 consecutive failures)
- full reset flow (forgot password -> token -> reset -> login with new password)
- expired token fails
- used token fails
- session is revoked after reset
"""

import os
import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database.database import get_db, Base
from app.database.models import User, UserSession, PasswordResetToken, AuthEvent
from app.auth.security import hash_password, generate_secure_token, hash_token
from app.services.email_service import get_sent_emails, clear_sent_emails

TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql://studytwin:studytwin_password@127.0.0.1:5432/studytwin_test_db"
)

engine = create_engine(TEST_DATABASE_URL, pool_pre_ping=True)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    clear_sent_emails()
    session = TestingSessionLocal()
    # Clean up test user records
    session.query(AuthEvent).delete()
    session.query(UserSession).delete()
    session.query(PasswordResetToken).delete()
    session.query(User).filter(User.email.like("%@test-aanvi.ai")).delete()
    session.commit()
    session.close()

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    yield
    app.dependency_overrides.clear()


@pytest.fixture
def client():
    return TestClient(app)


def test_signup_under_16_requires_guardian_email_and_assigns_explorer(client):
    """Under 16 (DOB 2013-04-10, age ~13): fails without guardian email, succeeds with it in Explorer mode."""
    # 1. Missing guardian email -> fails with 422
    payload_no_guardian = {
        "full_name": "Young Explorer",
        "email": "young.explorer@test-aanvi.ai",
        "password": "SecurePassword123!",
        "date_of_birth": "2013-04-10",
        "terms_accepted": True
    }
    res = client.post("/api/auth/signup", json=payload_no_guardian)
    assert res.status_code == 422
    assert "guardian" in res.json()["detail"].lower()

    # 2. With guardian email -> succeeds as Explorer
    payload_valid = {
        "full_name": "Young Explorer",
        "email": "young.explorer@test-aanvi.ai",
        "password": "SecurePassword123!",
        "date_of_birth": "2013-04-10",
        "guardian_email": "guardian.parent@test-aanvi.ai",
        "terms_accepted": True
    }
    res_ok = client.post("/api/auth/signup", json=payload_valid)
    assert res_ok.status_code == 200
    data = res_ok.json()
    assert data["user"]["mode"] == "explorer"
    assert data["user"]["age"] <= 15
    assert data["user"]["child_safety_enabled"] is True
    assert data["user"]["guardian_email"].startswith("g***@")

    # Consent email sent
    emails = get_sent_emails()
    assert len(emails) >= 1
    assert "guardian.parent@test-aanvi.ai" in emails[0]["to"]


def test_signup_16_plus_assigns_scholar_mode_without_guardian(client):
    """16+ (DOB 2004-02-20, age ~22): succeeds without guardian email in Scholar mode."""
    payload = {
        "full_name": "Adult Scholar",
        "email": "adult.scholar@test-aanvi.ai",
        "password": "StrongPassword999!",
        "date_of_birth": "2004-02-20",
        "terms_accepted": True
    }
    res = client.post("/api/auth/signup", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["user"]["mode"] == "scholar"
    assert data["user"]["age"] >= 16
    assert data["user"]["child_safety_enabled"] is False


def test_tampered_mode_is_rejected_and_server_enforces_dob_mode(client):
    """Client attempts to override mode to 'scholar' for a 12-year-old; server strictly enforces Explorer."""
    tampered_payload = {
        "full_name": "Sneaky Student",
        "email": "sneaky@test-aanvi.ai",
        "password": "Password777!",
        "date_of_birth": "2014-06-15",
        "mode": "scholar",  # TAMPERED: attempting to bypass child safety
        "guardian_email": "parent.sneaky@test-aanvi.ai",
        "terms_accepted": True
    }
    res = client.post("/api/auth/signup", json=tampered_payload)
    assert res.status_code == 200
    data = res.json()
    # Server strictly overrides client tampering based on DOB
    assert data["user"]["mode"] == "explorer"

    # Verify directly in PostgreSQL
    db = TestingSessionLocal()
    user_in_db = db.query(User).filter(User.email == "sneaky@test-aanvi.ai").first()
    assert user_in_db.mode == "explorer"
    assert user_in_db.age_group == "explorer"
    db.close()


def test_wrong_password_lockout_after_five_failures(client):
    """5 consecutive wrong password attempts triggers temporary lockout."""
    # 1. Create user
    signup_payload = {
        "full_name": "Lockout Target",
        "email": "lockout@test-aanvi.ai",
        "password": "CorrectPassword123!",
        "date_of_birth": "2002-01-01",
        "terms_accepted": True
    }
    client.post("/api/auth/signup", json=signup_payload)

    login_fail_payload = {
        "email": "lockout@test-aanvi.ai",
        "password": "WrongPasswordBad!"
    }

    # 4 failed attempts: return 401
    for attempt in range(1, 5):
        res = client.post("/api/auth/login", json=login_fail_payload)
        assert res.status_code == 401
        assert f"{5 - attempt} attempt(s) remaining" in res.json()["detail"]

    # 5th failed attempt: triggers 423 Locked
    res_5 = client.post("/api/auth/login", json=login_fail_payload)
    assert res_5.status_code == 423
    assert "temporarily locked" in res_5.json()["detail"].lower()

    # Even with correct password, account is locked
    res_locked = client.post("/api/auth/login", json={
        "email": "lockout@test-aanvi.ai",
        "password": "CorrectPassword123!"
    })
    assert res_locked.status_code == 423
    assert "temporarily locked" in res_locked.json()["detail"].lower()


def test_full_reset_flow(client):
    """Forgot password -> single-use token in DB -> password reset -> login with new password."""
    # 1. Sign up user
    client.post("/api/auth/signup", json={
        "full_name": "Reset User",
        "email": "reset.user@test-aanvi.ai",
        "password": "OldPassword123!",
        "date_of_birth": "2001-05-15",
        "terms_accepted": True
    })

    # 2. Request forgot password
    forgot_res = client.post("/api/auth/forgot-password", json={"email": "reset.user@test-aanvi.ai"})
    assert forgot_res.status_code == 200
    assert forgot_res.json()["success"] is True

    # Check email outbox for reset token
    emails = get_sent_emails()
    assert len(emails) >= 1
    reset_email = [e for e in emails if "reset.user@test-aanvi.ai" in e["to"]][0]
    assert "Reset Your Aanvi Password" in reset_email["subject"]

    # Retrieve raw token from outbox / DB
    db = TestingSessionLocal()
    user = db.query(User).filter(User.email == "reset.user@test-aanvi.ai").first()
    token_entry = db.query(PasswordResetToken).filter(PasswordResetToken.user_id == user.id).first()
    assert token_entry is not None
    assert token_entry.used_at is None
    db.close()

    # Extract raw token from reset link in email content
    import re
    match = re.search(r"token=([A-Za-z0-9_-]+)", reset_email["content"])
    assert match is not None
    raw_token = match.group(1)

    # 3. Reset password
    reset_res = client.post("/api/auth/reset-password", json={
        "token": raw_token,
        "new_password": "BrandNewPassword999!"
    })
    assert reset_res.status_code == 200
    assert reset_res.json()["success"] is True

    # 4. Old password fails
    fail_res = client.post("/api/auth/login", json={
        "email": "reset.user@test-aanvi.ai",
        "password": "OldPassword123!"
    })
    assert fail_res.status_code == 401

    # 5. New password succeeds
    success_res = client.post("/api/auth/login", json={
        "email": "reset.user@test-aanvi.ai",
        "password": "BrandNewPassword999!"
    })
    assert success_res.status_code == 200


def test_expired_token_fails(client):
    """Password reset token with expires_at in the past fails with 400."""
    db = TestingSessionLocal()
    user = User(
        email="expired.token@test-aanvi.ai",
        password_hash=hash_password("Pass1234!"),
        full_name="Expired User",
        date_of_birth="2000-01-01"
    )
    db.add(user)
    db.flush()

    raw_token, token_hash = generate_secure_token()
    expired_token = PasswordResetToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=datetime.utcnow() - timedelta(minutes=5)  # EXPIRED
    )
    db.add(expired_token)
    db.commit()
    db.close()

    res = client.post("/api/auth/reset-password", json={
        "token": raw_token,
        "new_password": "NewSecretPassword123!"
    })
    assert res.status_code == 400
    assert "expired" in res.json()["detail"].lower()


def test_used_token_fails(client):
    """Submitting an already-used reset token fails with 400."""
    db = TestingSessionLocal()
    user = User(
        email="used.token@test-aanvi.ai",
        password_hash=hash_password("Pass1234!"),
        full_name="Used User",
        date_of_birth="2000-01-01"
    )
    db.add(user)
    db.flush()

    raw_token, token_hash = generate_secure_token()
    used_token = PasswordResetToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=datetime.utcnow() + timedelta(minutes=20),
        used_at=datetime.utcnow() - timedelta(minutes=1)  # ALREADY USED
    )
    db.add(used_token)
    db.commit()
    db.close()

    res = client.post("/api/auth/reset-password", json={
        "token": raw_token,
        "new_password": "NewSecretPassword123!"
    })
    assert res.status_code == 400
    assert "already been used" in res.json()["detail"].lower()


def test_session_is_revoked_after_reset(client):
    """Active sessions prior to password reset have revoked_at timestamp set."""
    # 1. Sign up and login
    signup_res = client.post("/api/auth/signup", json={
        "full_name": "Revoke Tester",
        "email": "revoke.tester@test-aanvi.ai",
        "password": "OriginalPassword1!",
        "date_of_birth": "2000-01-01",
        "terms_accepted": True
    })
    user_id = signup_res.json()["user"]["id"]

    db = TestingSessionLocal()
    active_sessions_before = db.query(UserSession).filter(
        UserSession.user_id == user_id,
        UserSession.revoked_at.is_(None)
    ).all()
    assert len(active_sessions_before) >= 1
    db.close()

    # 2. Trigger forgot password & reset
    client.post("/api/auth/forgot-password", json={"email": "revoke.tester@test-aanvi.ai"})
    emails = get_sent_emails()
    reset_email = [e for e in emails if "revoke.tester@test-aanvi.ai" in e["to"]][0]
    import re
    raw_token = re.search(r"token=([A-Za-z0-9_-]+)", reset_email["content"]).group(1)

    client.post("/api/auth/reset-password", json={
        "token": raw_token,
        "new_password": "ChangedPassword99!"
    })

    # 3. Verify all prior sessions are now revoked
    db = TestingSessionLocal()
    unrevoked_sessions = db.query(UserSession).filter(
        UserSession.user_id == user_id,
        UserSession.revoked_at.is_(None)
    ).all()
    assert len(unrevoked_sessions) == 0

    revoked_sessions = db.query(UserSession).filter(
        UserSession.user_id == user_id,
        UserSession.revoked_at.is_not(None)
    ).all()
    assert len(revoked_sessions) >= 1
    db.close()
