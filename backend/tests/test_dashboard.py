import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.database import SessionLocal, init_db, get_db
from app.database import models
from app.auth.dependencies import get_current_user
from fastapi import Depends, Request

client = TestClient(app)


def override_get_current_user(request: Request, db=Depends(get_db)):
    user_id = request.query_params.get("user_id", "1")
    user = db.query(models.User).filter(models.User.id == str(user_id)).first()
    if not user:
        user = models.User(
            id=str(user_id),
            name=f"Student {user_id}",
            email=f"student_{user_id}@aanvi.ai",
            mode="scholar"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


@pytest.fixture(scope="module", autouse=True)
def setup_database():
    init_db()
    app.dependency_overrides[get_current_user] = override_get_current_user
    yield
    app.dependency_overrides.pop(get_current_user, None)


def test_demo_seed_and_summary_with_history():
    """
    Tests that POST /api/demo/seed populates realistic data, and
    GET /api/dashboard/summary computes real mastery, weak prerequisite chains, and 90-day streak.
    """
    # 1. Seed demo scholar
    seed_res = client.post("/api/demo/seed?user_id=1")
    assert seed_res.status_code == 200
    assert seed_res.json()["status"] == "success"

    # 2. Query Dashboard Summary
    res = client.get("/api/dashboard/summary?user_id=1&course_id=1")
    assert res.status_code == 200
    data = res.json()

    assert data["user_id"] == 1
    assert len(data["user_name"]) > 0
    assert data["overall_mastery"] > 0.0
    assert len(data["topic_mastery"]) >= 6

    # Verify Weak Topics with Root Cause Prerequisite
    assert len(data["weak_topics"]) >= 1
    # Check that Binary Trees or Graph Traversal is weak
    weak_names = [w["topic"] for w in data["weak_topics"]]
    assert "Graph Traversal" in weak_names or "Binary Trees" in weak_names

    # Verify Forgetting Curve & Spaced Schedule
    assert len(data["forgetting_curve"]) >= 1
    assert len(data["forgetting_curve"][0]["retention_points"]) == 15

    # Verify 90-day Streak Calendar
    assert len(data["streak"]["calendar_90d"]) == 90
    assert data["streak"]["current"] >= 1

    # Verify Badges & XP
    assert len(data["badges"]) >= 6
    assert data["xp"]["total"] >= 500

    # Verify Recommended Next Action
    assert data["recommended_next"]["title"] != ""
    assert data["recommended_next"]["why"] != ""


def test_dashboard_summary_empty_student():
    """
    Tests that an empty/new student with no quiz submissions receives valid default response
    without crashing or returning 500 errors.
    """
    # Create fresh empty user ID 999
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.id == 999).first()
        if not user:
            user = models.User(id=999, name="Fresh Student", email="fresh@student.ai", mode="scholar", xp=0, level=1, streak_days=0)
            db.add(user)
            db.commit()
    finally:
        db.close()

    res = client.get("/api/dashboard/summary?user_id=999&course_id=1")
    assert res.status_code == 200
    data = res.json()

    assert data["user_id"] == 999
    assert data["user_name"] == "Fresh Student"
    assert isinstance(data["topic_mastery"], list)
    assert isinstance(data["weak_topics"], list)
    assert len(data["streak"]["calendar_90d"]) == 90


def test_dashboard_map_explorer():
    """
    Tests GET /api/dashboard/map for Explorer Mode island topology.
    """
    # Seed explorer user ID 2
    client.post("/api/demo/seed?user_id=2")

    res = client.get("/api/dashboard/map?user_id=2&course_id=1")
    assert res.status_code == 200
    data = res.json()

    assert data["user_id"] == 2
    assert len(data["islands"]) >= 6
    # Verify island status
    statuses = [isl["status"] for isl in data["islands"]]
    assert "mastered" in statuses or "unlocked" in statuses
    assert len(data["trails"]) >= 1


def test_dashboard_user_isolation():
    """
    Tests that Student A's quiz submissions do not leak into Student B's dashboard.
    """
    # Seed user 1 with high score data
    client.post("/api/demo/seed?user_id=1")

    # Reset user 999 to clean baseline
    client.post("/api/demo/reset?user_id=999")

    res_a = client.get("/api/dashboard/summary?user_id=1&course_id=1").json()
    res_b = client.get("/api/dashboard/summary?user_id=999&course_id=1").json()

    assert res_a["user_id"] == 1
    assert res_b["user_id"] == 999
    assert res_a["xp"]["total"] != res_b["xp"]["total"]
    assert len(res_a["recent_activity"]) != len(res_b["recent_activity"])
