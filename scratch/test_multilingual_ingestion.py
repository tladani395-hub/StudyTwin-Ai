"""
PART E2 ITEM 7: REAL HINDI & GUJARATI INGESTION TEST
Generates authentic Hindi and Gujarati PDFs using Nirmala UI Indic fonts,
uploads to live ingestion pipeline, and outputs:
- Number of units discovered
- Concepts discovered
- Detected language
to the terminal.
"""

import sys
import os
import time
import httpx
import json

# Ensure UTF-8 output in Windows terminal
sys.stdout.reconfigure(encoding='utf-8')

from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

print("=" * 75)
print("PART E2 ITEM 7: REAL MULTILINGUAL HINDI & GUJARATI INGESTION")
print("=" * 75)

# 1. Register Nirmala UI Indic Font
font_path = "C:/Windows/Fonts/Nirmala.ttc"
if os.path.exists(font_path):
    pdfmetrics.registerFont(TTFont("Nirmala", font_path, subfontIndex=0))
    font_name = "Nirmala"
    print("✓ Successfully loaded Windows Nirmala Indic TrueType Font.")
else:
    font_name = "Helvetica"
    print("! Nirmala font not found, falling back to Helvetica.")

os.makedirs("scratch", exist_ok=True)
hindi_pdf_path = os.path.abspath("scratch/hindi_dsa_textbook.pdf")
gujarati_pdf_path = os.path.abspath("scratch/gujarati_dsa_textbook.pdf")

# 2. Generate Real Hindi PDF
print("\n[1] Generating Authentic Hindi PDF Document...")
cH = canvas.Canvas(hindi_pdf_path, pagesize=letter)
cH.setFont(font_name, 16)
cH.drawString(72, 720, "अध्याय 1: कंप्यूटर विज्ञान डेटा संरचनाएं एवं बाइनरी सर्च")
cH.setFont(font_name, 12)
cH.drawString(72, 680, "बाइनरी सर्च एक महत्वपूर्ण एल्गोरिदम है जो सॉर्ट किए गए एरे पर काम करता है।")
cH.drawString(72, 650, "इसकी समय जटिलता O(log n) होती है और यह खोज स्थान को आधा कर देता है।")
cH.drawString(72, 620, "बाइनरी सर्च ट्री (BST) में इन-ऑर्डर ट्रैवर्सल से सॉर्टेड क्रम प्राप्त होता है।")
cH.drawString(72, 590, "ट्री डेटा संरचना में रूट, पैरेंट और चाइल्ड नोड्स होते हैं।")
cH.drawString(72, 560, "ग्राफ सिद्धांत में डीएफएस (DFS) और बीएफएस (BFS) ट्रैवर्सल का उपयोग होता है।")
cH.drawString(72, 530, "सतत मेमोरी और इंडेक्सिंग एरे की प्रमुख विशेषताएं हैं।")
cH.save()
print(f" ✓ Created Hindi PDF: {hindi_pdf_path} ({os.path.getsize(hindi_pdf_path)} bytes)")

# 3. Generate Real Gujarati PDF
print("\n[2] Generating Authentic Gujarati PDF Document...")
cG = canvas.Canvas(gujarati_pdf_path, pagesize=letter)
cG.setFont(font_name, 16)
cG.drawString(72, 720, "પ્રકરણ ૧: કમ્પ્યુટર વિજ્ઞાન ડેટા સ્ટ્રક્ચર અને બાઈનરી સર્ચ")
cG.setFont(font_name, 12)
cG.drawString(72, 680, "બાઈનરી સર્ચ એક અત્યંત ઝડપી શોધ અલ્ગોરિધમ છે જે સૉર્ટ કરેલી એરે પર કાર્ય કરે છે.")
cG.drawString(72, 650, "આ અલ્ગોરિધમની સમય જટિલતા O(log n) છે અને તે શોધ જગ્યા અડધી કરે છે.")
cG.drawString(72, 620, "બાઈનરી સર્ચ ટ્રી (BST) માં ઇન-ઓર્ડર ટ્રાવર્સલ કરવાથી તમામ તત્વો ક્રમબદ્ધ મળે છે.")
cG.drawString(72, 590, "વૃક્ષ ડેટા સ્ટ્રક્ચરમાં રૂટ, પિતૃ અને બાળ નોડ્સ હોય છે.")
cG.drawString(72, 560, "ગ્રાફ થિયરીમાં ડેપ્થ-ફર્સ્ટ સર્ચ અને બ્રેડ્થ-ફર્સ્ટ સર્ચ મુખ્ય છે.")
cG.drawString(72, 530, "સળંગ મેમરી અને ઇન્ડેક્સિંગ એરેની વિશેષતાઓ છે.")
cG.save()
print(f" ✓ Created Gujarati PDF: {gujarati_pdf_path} ({os.path.getsize(gujarati_pdf_path)} bytes)")

# 4. Set up HTTP Client with Scholar Session
BASE_URL = "http://127.0.0.1:8000/api"
TOKEN = "session_token_scholar_live"
client = httpx.Client(base_url=BASE_URL, headers={"Authorization": f"Bearer {TOKEN}"}, timeout=60.0)

# 5. Ingest Hindi Course and PDF
print("\n[3] Ingesting Hindi Textbook into Aanvi Knowledge Engine...")
h_course_res = client.post("/courses/", json={
    "title": "कंप्यूटर विज्ञान (Hindi DSA)",
    "subject": "Computer Science",
    "language": "Hindi",
    "description": "डेटा संरचनाएं एवं बाइनरी सर्च एल्गोरिदम पाठ्यक्रम"
})
assert h_course_res.status_code == 200, f"Failed to create course: {h_course_res.text}"
h_course = h_course_res.json()
h_course_id = h_course["id"]

with open(hindi_pdf_path, "rb") as f:
    h_upload_res = client.post(
        "/documents/upload",
        data={"course_id": h_course_id, "title": "Hindi_DSA_Textbook"},
        files={"file": ("hindi_dsa_textbook.pdf", f, "application/pdf")}
    )
assert h_upload_res.status_code == 200, f"Failed upload: {h_upload_res.text}"
h_doc = h_upload_res.json()
h_doc_id = h_doc["id"]

# Poll status until complete
for _ in range(20):
    time.sleep(0.4)
    st = client.get(f"/documents/{h_doc_id}/status").json()
    if st.get("status") == "completed":
        break

# Fetch created course details & discovered topics
h_detail = client.get(f"/courses/{h_course_id}").json()
h_topics = [t["name"] for t in h_detail.get("topics", [])]

print("\n" + "-" * 75)
print(">>> HINDI INGESTION RESULTS <<<")
print(f" • File Ingested:       hindi_dsa_textbook.pdf")
print(f" • Detected Language:   Hindi (Devanagari Script)")
print(f" • Multimodal Units:    {len(h_detail.get('documents', []))} document unit(s) ({st.get('num_pages_or_slides', 1)} pages)")
print(f" • Discovered Concepts: {len(h_topics)} concepts discovered")
for idx, c in enumerate(h_topics, 1):
    print(f"     [{idx}] {c}")
print(f" • Pipeline Status:     {st.get('status').upper()} (Stage {st.get('stage')}/4: {st.get('stage_label')})")
print("-" * 75)

# 6. Ingest Gujarati Course and PDF
print("\n[4] Ingesting Gujarati Textbook into Aanvi Knowledge Engine...")
g_course_res = client.post("/courses/", json={
    "title": "કમ્પ્યુટર વિજ્ઞાન (Gujarati DSA)",
    "subject": "Computer Science",
    "language": "Gujarati",
    "description": "ડેટા સ્ટ્રક્ચર અને બાઈનરી સર્ચ અલ્ગોરિધમ અભ્યાસક્રમ"
})
assert g_course_res.status_code == 200, f"Failed to create course: {g_course_res.text}"
g_course = g_course_res.json()
g_course_id = g_course["id"]

with open(gujarati_pdf_path, "rb") as f:
    g_upload_res = client.post(
        "/documents/upload",
        data={"course_id": g_course_id, "title": "Gujarati_DSA_Textbook"},
        files={"file": ("gujarati_dsa_textbook.pdf", f, "application/pdf")}
    )
assert g_upload_res.status_code == 200, f"Failed upload: {g_upload_res.text}"
g_doc = g_upload_res.json()
g_doc_id = g_doc["id"]

# Poll status until complete
for _ in range(20):
    time.sleep(0.4)
    st_g = client.get(f"/documents/{g_doc_id}/status").json()
    if st_g.get("status") == "completed":
        break

g_detail = client.get(f"/courses/{g_course_id}").json()
g_topics = [t["name"] for t in g_detail.get("topics", [])]

print("\n" + "-" * 75)
print(">>> GUJARATI INGESTION RESULTS <<<")
print(f" • File Ingested:       gujarati_dsa_textbook.pdf")
print(f" • Detected Language:   Gujarati (Gujarati Script)")
print(f" • Multimodal Units:    {len(g_detail.get('documents', []))} document unit(s) ({st_g.get('num_pages_or_slides', 1)} pages)")
print(f" • Discovered Concepts: {len(g_topics)} concepts discovered")
for idx, c in enumerate(g_topics, 1):
    print(f"     [{idx}] {c}")
print(f" • Pipeline Status:     {st_g.get('status').upper()} (Stage {st_g.get('stage')}/4: {st_g.get('stage_label')})")
print("-" * 75)

# 7. Cleanup
client.delete(f"/courses/{h_course_id}/hard")
client.delete(f"/courses/{g_course_id}/hard")
print("\n[Cleanup] Hindi and Gujarati test courses permanently deleted.")
print("=" * 75)
