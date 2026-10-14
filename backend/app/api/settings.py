import json
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Header, Query
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import User, UserSettings, AuditLog
from app.database.schemas import SettingsResponse, SettingsUpdateRequest

router = APIRouter(prefix="/settings", tags=["settings"])


def _canonicalize_palette(pal: Optional[str]) -> Optional[str]:
    if pal is None:
        return None
    if pal in ["a", "primary"]:
        return "a"
    if pal in ["b", "secondary"]:
        return "b"
    raise ValueError(f"Invalid palette: {pal}")


@router.get("", response_model=SettingsResponse)
@router.get("/", response_model=SettingsResponse)
def get_user_settings(
    user_id: Optional[int] = Query(default=None),
    x_user_id: Optional[str] = Header(default=None, alias="X-User-ID"),
    db: Session = Depends(get_db)
):
    # Determine effective user id
    effective_user_id = user_id
    if effective_user_id is None and x_user_id:
        try:
            effective_user_id = int(x_user_id)
        except ValueError:
            pass
    if effective_user_id is None:
        effective_user_id = 1

    user = db.query(User).filter(User.id == effective_user_id).first()
    if not user:
        # If user doesn't exist, create demo user
        user = User(
            id=effective_user_id,
            name="Aanvi Student",
            email=f"student_{effective_user_id}@aanvi.ai",
            age=16,
            mode="scholar"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    settings = db.query(UserSettings).filter(UserSettings.user_id == effective_user_id).first()
    if not settings:
        settings = UserSettings(
            user_id=effective_user_id,
            palette="a",
            theme="dark",
            sound_on=False,
            reduced_motion=False,
            updated_at=datetime.utcnow()
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)

    # Normalize palette to "a" or "b"
    pal = "a" if settings.palette in ["a", "primary"] else "b"
    theme = settings.theme if settings.theme in ["light", "dark", "system"] else "dark"

    return SettingsResponse(
        palette=pal,
        theme=theme,
        sound_on=bool(settings.sound_on),
        reduced_motion=bool(settings.reduced_motion),
        updated_at=settings.updated_at
    )


@router.patch("", response_model=SettingsResponse)
@router.patch("/", response_model=SettingsResponse)
@router.put("", response_model=SettingsResponse)
@router.put("/", response_model=SettingsResponse)
@router.post("", response_model=SettingsResponse)
@router.post("/", response_model=SettingsResponse)
def update_user_settings(
    req: SettingsUpdateRequest,
    user_id: Optional[int] = Query(default=None),
    x_user_id: Optional[str] = Header(default=None, alias="X-User-ID"),
    db: Session = Depends(get_db)
):
    # Determine effective user id
    effective_user_id = user_id
    if effective_user_id is None and x_user_id:
        try:
            effective_user_id = int(x_user_id)
        except ValueError:
            pass
    if effective_user_id is None:
        effective_user_id = 1

    user = db.query(User).filter(User.id == effective_user_id).first()
    if not user:
        user = User(
            id=effective_user_id,
            name="Aanvi Student",
            email=f"student_{effective_user_id}@aanvi.ai",
            age=16,
            mode="scholar"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    settings = db.query(UserSettings).filter(UserSettings.user_id == effective_user_id).first()
    if not settings:
        settings = UserSettings(
            user_id=effective_user_id,
            palette="a",
            theme="dark",
            sound_on=False,
            reduced_motion=False,
            updated_at=datetime.utcnow()
        )
        db.add(settings)
        db.flush()

    changes = {}

    if req.palette is not None:
        canon_pal = _canonicalize_palette(req.palette)
        settings.palette = canon_pal
        changes["palette"] = canon_pal

    if req.theme is not None:
        settings.theme = req.theme
        changes["theme"] = req.theme

    # Support both sound_on and sound_enabled
    sound_val = req.sound_on if req.sound_on is not None else req.sound_enabled
    if sound_val is not None:
        settings.sound_on = sound_val
        changes["sound_on"] = sound_val

    if req.reduced_motion is not None:
        settings.reduced_motion = req.reduced_motion
        changes["reduced_motion"] = req.reduced_motion

    settings.updated_at = datetime.utcnow()

    # Write AuditLog row
    audit = AuditLog(
        user_id=effective_user_id,
        action="settings_update",
        details_json=json.dumps({
            "changes": changes,
            "timestamp": settings.updated_at.isoformat()
        }),
        created_at=datetime.utcnow()
    )
    db.add(audit)

    db.commit()
    db.refresh(settings)

    pal = "a" if settings.palette in ["a", "primary"] else "b"
    theme = settings.theme if settings.theme in ["light", "dark", "system"] else "dark"

    return SettingsResponse(
        palette=pal,
        theme=theme,
        sound_on=bool(settings.sound_on),
        reduced_motion=bool(settings.reduced_motion),
        updated_at=settings.updated_at
    )
