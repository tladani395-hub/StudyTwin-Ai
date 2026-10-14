import pytest
import os
import sys

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app
from app.database.database import SessionLocal, init_db
from app.database.models import User, UserSettings, AuditLog

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    init_db()


def test_settings_defaults():
    # Fetch settings for a new user
    user_id = 991
    response = client.get(f"/api/settings?user_id={user_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["palette"] == "a"
    assert data["theme"] == "dark"
    assert data["sound_on"] is False
    assert data["reduced_motion"] is False


def test_settings_valid_update():
    user_id = 992
    update_payload = {
        "palette": "b",
        "theme": "light",
        "sound_on": True,
        "reduced_motion": True
    }
    response = client.patch(f"/api/settings?user_id={user_id}", json=update_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["palette"] == "b"
    assert data["theme"] == "light"
    assert data["sound_on"] is True
    assert data["reduced_motion"] is True

    # Check persistence by fetching again
    get_res = client.get(f"/api/settings?user_id={user_id}")
    assert get_res.status_code == 200
    get_data = get_res.json()
    assert get_data["palette"] == "b"
    assert get_data["theme"] == "light"

    # Check audit log written
    db = SessionLocal()
    audit = db.query(AuditLog).filter(AuditLog.user_id == user_id, AuditLog.action == "settings_update").first()
    assert audit is not None
    assert "palette" in audit.details_json
    db.close()


def test_settings_invalid_value_rejected():
    user_id = 993
    # Invalid palette
    bad_payload = {"palette": "neon_blue_invalid"}
    response = client.patch(f"/api/settings?user_id={user_id}", json=bad_payload)
    assert response.status_code == 422  # Pydantic validation rejection

    # Invalid theme
    bad_theme_payload = {"theme": "cyberpunk_invalid"}
    res2 = client.patch(f"/api/settings?user_id={user_id}", json=bad_theme_payload)
    assert res2.status_code == 422


def test_user_settings_isolation():
    user1 = 994
    user2 = 995

    # Set user1 to palette a, theme dark
    client.patch(f"/api/settings?user_id={user1}", json={"palette": "a", "theme": "dark"})

    # Set user2 to palette b, theme light
    client.patch(f"/api/settings?user_id={user2}", json={"palette": "b", "theme": "light"})

    # Verify user1 retains their settings
    res1 = client.get(f"/api/settings?user_id={user1}").json()
    assert res1["palette"] == "a"
    assert res1["theme"] == "dark"

    # Verify user2 retains their settings
    res2 = client.get(f"/api/settings?user_id={user2}").json()
    assert res2["palette"] == "b"
    assert res2["theme"] == "light"
