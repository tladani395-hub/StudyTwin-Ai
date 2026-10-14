import httpx
import time

client = httpx.Client(base_url="http://127.0.0.1:8000/api", headers={"Authorization": "Bearer session_token_scholar_live"})
c = client.post("/courses/", json={"title": "Test Debug Course", "subject": "CS"}).json()
course_id = c["id"]

with open("scratch/hindi_dsa_textbook.pdf", "rb") as f:
    up = client.post("/documents/upload", data={"course_id": course_id}, files={"file": ("hindi.pdf", f, "application/pdf")}).json()

doc_id = up["id"]
print(f"Uploaded doc_id={doc_id}, initial status={up.get('status')}")

for i in range(20):
    time.sleep(0.3)
    s = client.get(f"/documents/{doc_id}/status").json()
    print(f"Poll {i}: status='{s.get('status')}', stage={s.get('stage')}, error='{s.get('error')}'")
    if s.get("status") in ["completed", "failed"]:
        break

client.delete(f"/courses/{course_id}/hard")
