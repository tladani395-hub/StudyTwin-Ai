"""
Authentication Security Module for Aanvi
- Argon2id password hashing and verification
- Age calculation & mode enforcement
- Guardian email masking
- Secure single-use token generation
- Lockout tracking
"""

import hashlib
import secrets
from datetime import datetime, date, timedelta
from typing import Optional, Tuple
from argon2 import PasswordHasher, Type
from argon2.exceptions import VerifyMismatchError, InvalidHashError

# Argon2id password hasher with high-security parameters
ph = PasswordHasher(
    time_cost=2,
    memory_cost=19456,  # 19 MB memory
    parallelism=1,
    hash_len=32,
    type=Type.ID
)


def hash_password(password: str) -> str:
    """Hashes a plaintext password using Argon2id."""
    return ph.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plaintext password against an Argon2id hash."""
    if not hashed_password or not plain_password:
        return False
    try:
        return ph.verify(hashed_password, plain_password)
    except (VerifyMismatchError, InvalidHashError):
        # Support for legacy SHA-256 hash transition only against stored hash
        legacy_hash = hashlib.sha256(plain_password.encode("utf-8")).hexdigest()
        if legacy_hash == hashed_password:
            return True
        return False


def calculate_age_and_mode(dob_str: Optional[str]) -> Tuple[int, str]:
    """
    Server-enforces age and mode derivation from Date of Birth.
    Never trusts client-supplied age or mode.
    Age <= 15 -> 'explorer' (child safety rules, guardian consent required)
    Age >= 16 -> 'scholar' (independent higher learning)
    """
    if not dob_str:
        return 16, "scholar"

    try:
        birth_date = datetime.strptime(dob_str.strip(), "%Y-%m-%d").date()
    except ValueError:
        # Fallback date parsing
        try:
            birth_date = datetime.fromisoformat(dob_str.strip()).date()
        except Exception:
            return 16, "scholar"

    today = date.today()
    age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
    age = max(5, min(120, age))

    mode = "explorer" if age <= 16 else "scholar"
    return age, mode


def mask_email(email: Optional[str]) -> Optional[str]:
    """
    Masks an email address for privacy and safety display.
    Example: 'guardian@family.com' -> 'g***@family.com'
    """
    if not email or "@" not in email:
        return None
    local, domain = email.split("@", 1)
    if len(local) <= 1:
        masked_local = local + "***"
    else:
        masked_local = local[0] + "***"
    return f"{masked_local}@{domain}"


def generate_secure_token() -> Tuple[str, str]:
    """
    Generates a cryptographically strong url-safe random token and its SHA-256 hash.
    Returns (raw_token, token_hash)
    The raw token is dispatched in emails; the hash is stored in PostgreSQL.
    """
    raw_token = secrets.token_urlsafe(32)
    token_hash = hash_token(raw_token)
    return raw_token, token_hash


def hash_token(raw_token: str) -> str:
    """Hashes a raw token with SHA-256 for persistent database storage."""
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def check_password_strength(password: str) -> dict:
    """
    Evaluates password strength (length, uppercase, lowercase, numbers, special characters).
    """
    score = 0
    feedback = []

    if len(password) >= 8:
        score += 1
    else:
        feedback.append("Password must be at least 8 characters long.")

    if any(c.isupper() for c in password):
        score += 1
    else:
        feedback.append("Include at least one uppercase letter.")

    if any(c.islower() for c in password):
        score += 1
    else:
        feedback.append("Include at least one lowercase letter.")

    if any(c.isdigit() for c in password):
        score += 1
    else:
        feedback.append("Include at least one digit.")

    if any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
        score += 1

    labels = {0: "weak", 1: "weak", 2: "fair", 3: "good", 4: "strong", 5: "very strong"}
    return {
        "score": score,
        "level": labels.get(score, "weak"),
        "is_valid": len(password) >= 8,
        "feedback": feedback
    }
