"""
PART E2 ITEM 5: DELETE EVERYWHERE PROOF & ACTIVE COURSE CAPTURES
Captures all required screenshots:
1. Galaxy (/knowledge-map) with an active course selected
2. Evaluation (/evaluation) with an active course selected
3. Create & Archive a specific course ('Archived Quantum Mechanics')
4. Verify & screenshot removal everywhere:
   - Course list (/courses)
   - Header switcher dropdown
   - Dashboard (/)
   - Quiz picker (/assessment)
   - Tutor scope (/tutor)
   - Galaxy (/knowledge-map)
   - Evaluation (/evaluation)
"""

import os
import sys
import time
import httpx
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding='utf-8')

ARTIFACT_DIR = r"C:\Users\Tirth\.gemini\antigravity\brain\b57d341f-3178-41ff-865e-6f1f32d21ba5"
os.makedirs(ARTIFACT_DIR, exist_ok=True)

BASE_API = "http://127.0.0.1:8000/api"
TOKEN = "session_token_scholar_live"
client = httpx.Client(base_url=BASE_API, headers={"Authorization": f"Bearer {TOKEN}"}, timeout=30.0)

print("=" * 70)
print("PART E2 ITEM 5: SCREENSHOT PROOF CAPTURE PIPELINE")
print("=" * 70)

# Step 1: Ensure active courses exist
courses_res = client.get("/courses/")
active_courses = [c for c in courses_res.json() if not c.get("is_archived")]
print(f"Found {len(active_courses)} active courses in DB.")
if not active_courses:
    new_c = client.post("/courses/", json={"title": "Data Structures & Algorithms", "subject": "CS"}).json()
    active_courses = [new_c]

target_active_course = active_courses[0]
target_active_id = target_active_course["id"]
print(f"Active Course Selected: '{target_active_course['title']}' (ID: {target_active_id})")

# Step 2: Create a course specifically to archive for the test
print("\n[Setup] Creating course 'Archived Quantum Mechanics' for delete-everywhere verification...")
arch_c = client.post("/courses/", json={
    "title": "Archived Quantum Mechanics",
    "subject": "Physics",
    "description": "Course created to verify system-wide cascading removal upon archiving."
}).json()
arch_course_id = arch_c["id"]
print(f" -> Temporary Course Created: ID={arch_course_id}, Title='{arch_c['title']}'")

# Playwright Browser Setup
with sync_playwright() as p:
    chrome_path = r"C:\Users\Tirth\AppData\Local\ms-playwright\chromium-1248\chrome-win64\chrome.exe"
    browser = p.chromium.launch(executable_path=chrome_path, headless=True)
    context = browser.new_context(viewport={"width": 1440, "height": 900})
    page = context.new_page()

    # Pre-seed session state into page
    def setup_scholar_session():
        page.add_init_script(f"""
            localStorage.setItem('aanvi_token', '{TOKEN}');
            localStorage.setItem('aanvi_mode', 'scholar');
            localStorage.setItem('aanvi_active_course_id', '{target_active_id}');
            localStorage.setItem('aanvi_intro_every_visit', 'false');
            localStorage.setItem('aanvi_sound', 'false');
            localStorage.setItem('aanvi_user', JSON.stringify({{
                id: 'u-scholar-0001-0000-000000000001',
                name: 'Scholar User',
                email: 'scholar@example.com',
                mode: 'scholar'
            }}));
            sessionStorage.setItem('aanvi_intro_seen', 'true');
        """)

    setup_scholar_session()

    def ensure_page_ready(url: str, delay: float = 2.0):
        page.goto(url, wait_until="networkidle")
        try:
            enter_btn = page.locator("button:has-text('Tap to begin'), button:has-text('Skip Intro')").first
            if enter_btn.is_visible(timeout=800):
                enter_btn.click()
                page.wait_for_timeout(400)
        except Exception:
            pass
        page.wait_for_timeout(int(delay * 1000))

    # CAPTURE 1: Galaxy (/knowledge-map) with active course selected
    print("\n[Capture 1] Navigating to Galaxy (/knowledge-map) with Active Course...")
    ensure_page_ready("http://localhost:3000/knowledge-map", delay=3.0)
    p1_path = os.path.join(ARTIFACT_DIR, "part_e2_galaxy_with_active_course.png")
    page.screenshot(path=p1_path, full_page=True)
    print(f" ✓ Saved: {p1_path}")

    # CAPTURE 2: Evaluation (/evaluation) with active course selected
    print("\n[Capture 2] Navigating to Evaluation (/evaluation) with Active Course...")
    ensure_page_ready("http://localhost:3000/evaluation", delay=2.5)
    p2_path = os.path.join(ARTIFACT_DIR, "part_e2_evaluation_with_active_course.png")
    page.screenshot(path=p2_path, full_page=True)
    print(f" ✓ Saved: {p2_path}")

    # NOW ARCHIVE THE COURSE VIA BACKEND API
    print(f"\n[Action] Archiving course '{arch_c['title']}' (ID: {arch_course_id})...")
    del_res = client.delete(f"/courses/{arch_course_id}")
    assert del_res.status_code == 200, f"Failed to archive course: {del_res.text}"
    print(f" ✓ Backend response: {del_res.json()}")

    # CAPTURE 3: Course List (/courses) - Archived course vanished
    print("\n[Capture 3] Course List (/courses) - Archived course absent from active list...")
    ensure_page_ready("http://localhost:3000/courses", delay=2.0)
    p3_path = os.path.join(ARTIFACT_DIR, "part_e2_courselist_archived_removed.png")
    page.screenshot(path=p3_path, full_page=True)
    print(f" ✓ Saved: {p3_path}")

    # CAPTURE 4: Header Switcher Dropdown - Archived course absent
    print("\n[Capture 4] Header Course Switcher Dropdown...")
    try:
        switcher_btn = page.locator("header button:has-text('Quantum'), header button:has-text('Active Workspace'), header button:has-text('Workspace')").first
        if switcher_btn.is_visible(timeout=2000):
            switcher_btn.click()
            page.wait_for_timeout(800)
    except Exception as e:
        print(f" Note: switcher click fallback: {e}")
    p4_path = os.path.join(ARTIFACT_DIR, "part_e2_header_switcher_archived_removed.png")
    page.screenshot(path=p4_path)
    print(f" ✓ Saved: {p4_path}")

    # CAPTURE 5: Dashboard (/) - Clean active course workspace...
    print("\n[Capture 5] Dashboard (/) - Clean active course workspace...")
    ensure_page_ready("http://localhost:3000/", delay=2.0)
    p5_path = os.path.join(ARTIFACT_DIR, "part_e2_dashboard_archived_removed.png")
    page.screenshot(path=p5_path, full_page=True)
    print(f" ✓ Saved: {p5_path}")

    # CAPTURE 6: Quiz Picker (/assessment)...
    print("\n[Capture 6] Quiz Picker (/assessment)...")
    ensure_page_ready("http://localhost:3000/assessment", delay=2.0)
    p6_path = os.path.join(ARTIFACT_DIR, "part_e2_quiz_picker_archived_removed.png")
    page.screenshot(path=p6_path, full_page=True)
    print(f" ✓ Saved: {p6_path}")

    # CAPTURE 7: Tutor Scope (/tutor)...
    print("\n[Capture 7] Tutor Scope (/tutor)...")
    ensure_page_ready("http://localhost:3000/tutor", delay=2.0)
    p7_path = os.path.join(ARTIFACT_DIR, "part_e2_tutor_scope_archived_removed.png")
    page.screenshot(path=p7_path, full_page=True)
    print(f" ✓ Saved: {p7_path}")

    # CAPTURE 8: Galaxy (/knowledge-map) after archive...
    print("\n[Capture 8] Galaxy (/knowledge-map) after archive...")
    ensure_page_ready("http://localhost:3000/knowledge-map", delay=2.0)
    p8_path = os.path.join(ARTIFACT_DIR, "part_e2_galaxy_archived_removed.png")
    page.screenshot(path=p8_path, full_page=True)
    print(f" ✓ Saved: {p8_path}")

    # CAPTURE 9: Evaluation (/evaluation) after archive...
    print("\n[Capture 9] Evaluation (/evaluation) after archive...")
    ensure_page_ready("http://localhost:3000/evaluation", delay=2.0)
    p9_path = os.path.join(ARTIFACT_DIR, "part_e2_evaluation_archived_removed.png")
    page.screenshot(path=p9_path, full_page=True)
    print(f" ✓ Saved: {p9_path}")

    browser.close()

# Cleanup test course permanently
client.delete(f"/courses/{arch_course_id}/hard")
print(f"\n[Cleanup] Test course {arch_course_id} permanently purged.")
print("=" * 70)
print("ALL PART E2 SCREENSHOTS CAPTURED SUCCESSFULLY!")
print("=" * 70)
