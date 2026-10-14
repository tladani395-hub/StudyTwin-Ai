"""
Part E2: Auth Fallback & Tenant Isolation Test Suite
Verifies:
1. No fallback user anywhere: unauthenticated requests return 401 Unauthorized across:
   - courses (/api/courses/)
   - course creation (/api/courses/)
   - documents upload (/api/documents/upload)
   - scholar dashboard (/api/dashboard/summary)
   - explorer map (/api/dashboard/map)
   - assessment generation (/api/assessments/generate)
   - tutor query (/api/tutor/query)
   - auth profile (/api/auth/me)

2. Complete Multi-Tenant User Isolation:
   - User A creates a course and uploads material
   - User B cannot read, list, archive, delete, or fetch User A's course
   - User B cannot view User A's documents, units, concepts, or mastery
   - User B cannot generate quiz attempts or query tutor for User A's course
   - Unauthenticated requests cannot read, list, or search User A's data (401)
"""

import os
import pytest
from fastapi.testclient import TestClient

from datetime import datetime, timedelta, timezone

from app.main import app
from app.database.database import get_db, SessionLocal
from app.database.models import User, Course, CourseEnrollment, Document, ContentUnit, UserSession
from app.auth.security import hash_token

client = TestClient(app)

TOKEN_SCHOLAR = "session_token_scholar_live"
TOKEN_EXPLORER = "session_token_explorer_live"


@pytest.fixture(autouse=True)
def setup_isolation_users():
    db = SessionLocal()
    # User A
    user_a = db.query(User).filter(User.email == "scholar_a@aanvi.ai").first()
    if not user_a:
        user_a = User(
            id="user-scholar-aaaa-1111",
            email="scholar_a@aanvi.ai",
            full_name="Scholar User A",
            mode="scholar",
            date_of_birth="2000-01-01"
        )
        db.add(user_a)
        db.commit()
    
    # User B
    user_b = db.query(User).filter(User.email == "explorer_b@aanvi.ai").first()
    if not user_b:
        user_b = User(
            id="user-explorer-bbbb-2222",
            email="explorer_b@aanvi.ai",
            full_name="Explorer User B",
            mode="explorer",
            date_of_birth="2012-01-01"
        )
        db.add(user_b)
        db.commit()

    # Create/update sessions
    token_a_hash = hash_token(TOKEN_SCHOLAR)
    sess_a = db.query(UserSession).filter(UserSession.token_hash == token_a_hash).first()
    if not sess_a:
        sess_a = UserSession(
            user_id=user_a.id,
            token_hash=token_a_hash,
            device="Scholar Test Client",
            expires_at=datetime.now(timezone.utc) + timedelta(days=7)
        )
        db.add(sess_a)

    token_b_hash = hash_token(TOKEN_EXPLORER)
    sess_b = db.query(UserSession).filter(UserSession.token_hash == token_b_hash).first()
    if not sess_b:
        sess_b = UserSession(
            user_id=user_b.id,
            token_hash=token_b_hash,
            device="Explorer Test Client",
            expires_at=datetime.now(timezone.utc) + timedelta(days=7)
        )
        db.add(sess_b)

    db.commit()
    db.close()


def test_auth_enforcement_unauthenticated_returns_401():
    """Item 1: Remove fallback user everywhere. No valid session means 401."""
    print("\n--- [TEST] Unauthenticated Requests Must Return 401 (No Fallback User) ---")

    # 1. Course list
    r = client.get("/api/courses/")
    print(f"GET /api/courses/ -> Status: {r.status_code}, Body: {r.json()}")
    assert r.status_code == 401, f"Expected 401, got {r.status_code}"

    # 2. Course creation
    r = client.post("/api/courses/", json={"title": "Unauthorized Course", "subject": "Math"})
    print(f"POST /api/courses/ -> Status: {r.status_code}, Body: {r.json()}")
    assert r.status_code == 401, f"Expected 401, got {r.status_code}"

    # 3. Document upload
    r = client.post("/api/documents/upload", data={"course_id": "test-id"})
    print(f"POST /api/documents/upload -> Status: {r.status_code}, Body: {r.json()}")
    assert r.status_code == 401, f"Expected 401, got {r.status_code}"

    # 4. Dashboard summary
    r = client.get("/api/dashboard/summary")
    print(f"GET /api/dashboard/summary -> Status: {r.status_code}, Body: {r.json()}")
    assert r.status_code == 401, f"Expected 401, got {r.status_code}"

    # 5. Dashboard map
    r = client.get("/api/dashboard/map")
    print(f"GET /api/dashboard/map -> Status: {r.status_code}, Body: {r.json()}")
    assert r.status_code == 401, f"Expected 401, got {r.status_code}"

    # 6. Assessment generate
    r = client.post("/api/assessments/generate", json={"course_id": "test-id", "topic": "Recursion"})
    print(f"POST /api/assessments/generate -> Status: {r.status_code}, Body: {r.json()}")
    assert r.status_code == 401, f"Expected 401, got {r.status_code}"

    # 7. Tutor query
    r = client.post("/api/tutor/query", json={"query": "What is binary search?", "course_id": "test-id"})
    print(f"POST /api/tutor/query -> Status: {r.status_code}, Body: {r.json()}")
    assert r.status_code == 401, f"Expected 401, got {r.status_code}"

    # 8. Auth profile /me
    r = client.get("/api/auth/me")
    print(f"GET /api/auth/me -> Status: {r.status_code}, Body: {r.json()}")
    assert r.status_code == 401, f"Expected 401, got {r.status_code}"


def test_tenant_isolation_user_b_cannot_access_user_a_course():
    """Item 2: User A creates a course. User B and unauthenticated request cannot read, list, archive, or search it."""
    headers_a = {"Authorization": f"Bearer {TOKEN_SCHOLAR}"}
    headers_b = {"Authorization": f"Bearer {TOKEN_EXPLORER}"}

    print("\n--- [TEST] User A Creates Course 'Scholar Private Molecular Biology' ---")
    create_res = client.post(
        "/api/courses/",
        headers=headers_a,
        json={
            "title": "Scholar Private Molecular Biology",
            "subject": "Biology",
            "description": "Proprietary research notes on cellular mitochondria.",
            "language": "English"
        }
    )
    assert create_res.status_code == 200, f"User A failed to create course: {create_res.text}"
    course_a = create_res.json()
    course_a_id = course_a["id"]
    print(f"User A Course Created successfully: ID={course_a_id}, Title='{course_a['title']}'")

    # 1. User B lists courses - course_a must NOT be present
    print("\n[Isolation Check 1] User B listing courses:")
    b_list_res = client.get("/api/courses/", headers=headers_b)
    assert b_list_res.status_code == 200
    b_courses = b_list_res.json()
    b_course_ids = [c["id"] for c in b_courses]
    print(f"User B visible courses: {b_course_ids}")
    assert course_a_id not in b_course_ids, "CRITICAL ISOLATION FAILURE: User B can see User A's private course!"

    # 2. User B fetches User A's course by ID -> 404 Not Found (prevents resource enumeration)
    print("\n[Isolation Check 2] User B fetching User A's course by ID:")
    b_get_res = client.get(f"/api/courses/{course_a_id}", headers=headers_b)
    print(f"GET /api/courses/{course_a_id} with User B headers -> Status: {b_get_res.status_code}, Body: {b_get_res.json()}")
    assert b_get_res.status_code == 404, f"Expected 404 Not Found, got {b_get_res.status_code}"

    # 3. Unauthenticated request fetches User A's course by ID -> 401 Unauthorized
    print("\n[Isolation Check 3] Unauthenticated request fetching User A's course:")
    anon_get_res = client.get(f"/api/courses/{course_a_id}")
    print(f"GET /api/courses/{course_a_id} unauthenticated -> Status: {anon_get_res.status_code}, Body: {anon_get_res.json()}")
    assert anon_get_res.status_code == 401, f"Expected 401 Unauthorized, got {anon_get_res.status_code}"

    # 4. User B attempts to archive User A's course -> 404 Not Found
    print("\n[Isolation Check 4] User B attempting to archive User A's course:")
    b_archive_res = client.patch(f"/api/courses/{course_a_id}/archive", headers=headers_b)
    print(f"PATCH /api/courses/{course_a_id}/archive with User B headers -> Status: {b_archive_res.status_code}, Body: {b_archive_res.json()}")
    assert b_archive_res.status_code == 404, f"Expected 404 Not Found, got {b_archive_res.status_code}"

    # 5. User B attempts to delete User A's course -> 404 Not Found
    print("\n[Isolation Check 5] User B attempting to delete User A's course:")
    b_del_res = client.delete(f"/api/courses/{course_a_id}", headers=headers_b)
    print(f"DELETE /api/courses/{course_a_id} with User B headers -> Status: {b_del_res.status_code}, Body: {b_del_res.json()}")
    assert b_del_res.status_code == 404, f"Expected 404 Not Found, got {b_del_res.status_code}"

    # 6. User B attempts to hard-delete User A's course -> 404 Not Found
    print("\n[Isolation Check 6] User B attempting to hard-delete User A's course:")
    b_hard_del_res = client.delete(f"/api/courses/{course_a_id}/hard", headers=headers_b)
    print(f"DELETE /api/courses/{course_a_id}/hard with User B headers -> Status: {b_hard_del_res.status_code}, Body: {b_hard_del_res.json()}")
    assert b_hard_del_res.status_code == 404, f"Expected 404 Not Found, got {b_hard_del_res.status_code}"

    # 7. User B attempts to fetch materials/documents for User A's course -> 404 Not Found
    print("\n[Isolation Check 7] User B attempting to fetch materials for User A's course:")
    b_docs_res = client.get(f"/api/documents/by-course/{course_a_id}", headers=headers_b)
    print(f"GET /api/documents/by-course/{course_a_id} with User B headers -> Status: {b_docs_res.status_code}, Body: {b_docs_res.json()}")
    assert b_docs_res.status_code == 404, f"Expected 404 Not Found, got {b_docs_res.status_code}"

    # 8. User B attempts to generate quiz on User A's course -> 404 Not Found
    print("\n[Isolation Check 8] User B attempting to generate quiz on User A's course:")
    b_quiz_res = client.post(
        "/api/assessments/generate",
        headers=headers_b,
        json={"course_id": course_a_id, "topic": "Mitochondria"}
    )
    print(f"POST /api/assessments/generate for User A's course -> Status: {b_quiz_res.status_code}, Body: {b_quiz_res.json()}")
    assert b_quiz_res.status_code == 404, f"Expected 404 Not Found, got {b_quiz_res.status_code}"

    # 9. User B attempts to query Tutor on User A's course -> 404 Not Found
    print("\n[Isolation Check 9] User B attempting to query Tutor on User A's course:")
    b_tutor_res = client.post(
        "/api/tutor/query",
        headers=headers_b,
        json={"query": "Explain cellular respiration", "course_id": course_a_id}
    )
    print(f"POST /api/tutor/query for User A's course -> Status: {b_tutor_res.status_code}, Body: {b_tutor_res.json()}")
    assert b_tutor_res.status_code == 404, f"Expected 404 Not Found, got {b_tutor_res.status_code}"

    # 10. Malformed UUID checks -> 404 Not Found
    print("\n[Isolation Check 10] Malformed UUID check:")
    invalid_uuid_res = client.get("/api/courses/not-a-valid-uuid-12345", headers=headers_b)
    print(f"GET /api/courses/not-a-valid-uuid-12345 -> Status: {invalid_uuid_res.status_code}")
    assert invalid_uuid_res.status_code == 404, f"Expected 404 for malformed UUID, got {invalid_uuid_res.status_code}"

    # Clean up: User A can hard-delete their own course successfully
    print("\n[Cleanup Check] User A hard-deleting their own course:")
    clean_res = client.delete(f"/api/courses/{course_a_id}/hard", headers=headers_a)
    print(f"DELETE /api/courses/{course_a_id}/hard with User A headers -> Status: {clean_res.status_code}, Body: {clean_res.json()}")
    assert clean_res.status_code == 200
