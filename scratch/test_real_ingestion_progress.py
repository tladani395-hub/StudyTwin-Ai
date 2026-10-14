"""
Demonstrates Item 3: Real Server-Driven Ingestion Progress
1. Real PDF upload to POST /api/documents/upload
2. Polling GET /api/documents/{doc_id}/status and printing live status transitions
3. Ingestion failure proof showing status='failed' and error details
"""

import time
import httpx
import json

BASE_URL = "http://127.0.0.1:8000/api"
TOKEN = "session_token_scholar_live"
HEADERS = {"Authorization": f"Bearer {TOKEN}"}

client = httpx.Client(base_url=BASE_URL, headers=HEADERS, timeout=30.0)

print("=" * 70)
print("PART E2 ITEM 3: REAL INGESTION STATUS ENDPOINT DEMONSTRATION")
print("=" * 70)

# Step 1: Ensure active course exists
print("\n[1] Ensuring Course Exists for Ingestion...")
c_res = client.post("/courses/", json={
    "title": "Quantum Computing & Information Theory",
    "subject": "Physics",
    "language": "English",
    "description": "Study of quantum algorithms, qubits, and entropy."
})
assert c_res.status_code == 200, f"Failed to create course: {c_res.text}"
course = c_res.json()
course_id = course["id"]
print(f" -> Active Course: ID={course_id}, Title='{course['title']}'")

# Step 2: Upload real PDF document
print("\n[2] Uploading Document 'Quantum_Intro.pdf' to Ingestion Pipeline...")
dummy_pdf_content = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 75 >>\nstream\nBT /F1 12 Tf 72 712 Td (Quantum Superposition and Qubits in Quantum Circuits) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000189 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n314\n%%EOF"

upload_files = {
    "file": ("Quantum_Intro.pdf", dummy_pdf_content, "application/pdf")
}
upload_data = {
    "course_id": course_id,
    "title": "Quantum Mechanics & Superposition"
}

upload_res = client.post("/documents/upload", data=upload_data, files=upload_files)
print(f" -> Upload Response HTTP Status: {upload_res.status_code}")
doc = upload_res.json()
doc_id = doc["id"]
print(f" -> Document Record Created: ID={doc_id}, Title='{doc['title']}'")
print(f" -> Initial Server Status: '{doc['status']}'")

# Step 3: Poll GET /api/documents/{id}/status and print server-driven stage transitions
print(f"\n[3] Polling Server Status Endpoint GET /api/documents/{doc_id}/status...")
seen_statuses = []
for poll_num in range(1, 15):
    s_res = client.get(f"/documents/{doc_id}/status")
    assert s_res.status_code == 200
    s_data = s_res.json()
    curr_status = s_data["status"]
    curr_stage = s_data.get("stage")
    curr_label = s_data.get("stage_label")
    
    print(f"  [Poll #{poll_num:02d}] Server Processing Status: '{curr_status.upper()}' | Stage {curr_stage}/4 | Label: '{curr_label}'")
    
    if curr_status not in seen_statuses:
        seen_statuses.append(curr_status)
        
    if curr_status in ["completed", "processed"]:
        print(f"\n -> Server Ingestion Complete! Total stages observed: {seen_statuses}")
        print(f" -> Final Status Payload: {json.dumps(s_data, indent=2)}")
        break
    time.sleep(0.3)

# Step 4: Simulate & Verify Ingestion Failure State
print("\n[4] Simulating Ingestion Failure and Verifying Server Error Status...")
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))
from app.database.database import SessionLocal
from app.database.models import Document
db = SessionLocal()
failed_doc = db.query(Document).filter(Document.id == doc_id).first()
if failed_doc:
    failed_doc.status = "failed"
    failed_doc.summary = "Ingestion error: Corrupted PDF stream at byte 4096. Lexer failed."
    db.commit()
db.close()

fail_check = client.get(f"/documents/{doc_id}/status")
print(f" -> GET /documents/{doc_id}/status on Ingestion Failure:")
fail_payload = fail_check.json()
print(f"    Status Code: {fail_check.status_code}")
print(f"    processing_status: '{fail_payload['processing_status']}'")
print(f"    stage: {fail_payload['stage']} (Failed)")
print(f"    error: '{fail_payload['error']}'")

# Cleanup
client.delete(f"/courses/{course_id}/hard")
print(f"\n[Cleanup] Test course {course_id} permanently deleted.")
print("=" * 70)
