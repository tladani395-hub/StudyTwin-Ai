# 🎬 Aanvi — 3-Minute Hackathon Presentation Demo Script
### Multimodal AI Hackathon 2026 • Track D: Personalized Tutoring & Adaptive Learning

> *Presenter Note: Press `Ctrl+D` (or `Cmd+D`) anywhere in the app to toggle the interactive floating Demo Script Overlay.*

---

### **0:00 – 0:30 | The Problem & Dual-Product Design System**
- **Visual**: Open browser at `http://localhost:3000`. Show the smooth animated stroke-draw SVG splash logo for **Aanvi** (Spark-Owl constellation).
- **Action**: Click the **3D Tactile Theme Button** in the header. Show instant rotation between **Explorer Mode** (warm Coral/Grape/Gold tokens) and **Scholar Mode** (sleek Obsidian/Teal/Monospace tokens).
- **Voiceover**: 
  > *"Students battle fragmented PDFs, 40-slide presentation decks, and multi-hour lecture recordings. Generic AI chatbots fail because they hallucinate, can't cite exact physical pages, and treat a 12-year-old child the same as a college engineer.*
  > *Meet **Aanvi** — the source-grounded, multimodal adaptive study companion. Notice our dual-product design tokens: playful space quest with our Spark-Owl companion for young explorers, and high-density, distraction-free command workspace for scholars."*

---

### **0:30 – 1:15 | Grounded Multimodal Tutor & Physical Citations**
- **Action**: Navigate to `/tutor`. Ask: *"Can I use the Master Theorem to solve Dijkstra's recurrence?"*
- **Action**: Show real-time hybrid retrieval (65% Dense + 35% BM25). Click citation `[1]` $\to$ Jump directly to `cs201_ch4_recurrences.pdf (Page 4)`. Click `[2]` $\to$ Jump to the exact lecture video timestamp `14:20`.
- **Action**: Notice all math renders with zero raw LaTeX artifacts via KaTeX ($T(n) = aT(n/b) + f(n)$).
- **Voiceover**: 
  > *"Every single explanation is strictly grounded in uploaded course materials. When you click a citation chip, Aanvi navigates directly to the exact textbook page, slide deck, or video timestamp. If a student asks something completely out of syllabus, Aanvi politely refuses and suggests grounded alternatives."*

---

### **1:15 – 1:50 | Real-Time Voice Studio (faster-whisper ASR & Normalized TTS)**
- **Action**: Open `/voice-studio` (or click Voice button in Tutor). Toggle **Hands-Free** or **Push-to-Talk**.
- **Action**: Speak or inspect transcript. Observe how the TTS normalizes complex mathematical formulas into natural spoken English (*"Big O of log n"* instead of raw symbols).
- **Action**: Highlight the privacy banner: **Zero Audio Storage** (audio is processed in RAM and immediately purged).
- **Voiceover**: 
  > *"Our Voice Studio runs on-device faster-whisper ASR with push-to-talk and hands-free modes. Math is read naturally in spoken English, and because we are strictly COPPA-compliant for under-16 learners, zero audio is ever saved to disk."*

---

### **1:50 – 2:20 | Camera Doubt & SymPy Step-by-Step Proof Verification**
- **Action**: Open `/camera` $\to$ Click *"Check My Working (SymPy)"*.
- **Action**: Select the sample derivation for $T(n) = 4T(n/2) + n$.
- **Action**: Watch our SymPy symbolic solver inspect each derivation line and isolate the exact fallacy in **Step 4** (incorrectly claiming Case 2 instead of Case 1).
- **Voiceover**: 
  > *"With our Camera Doubt Studio, students can snap handwritten homework. Our SymPy symbolic engine checks their mathematical derivations step-by-step and pinpoints the exact line where a logical error occurred — with zero facial analysis or biometric tracking."*

---

### **2:20 – 2:45 | 3D Concept Galaxy & Bayesian Knowledge Tracing (BKT)**
- **Action**: Open `/knowledge-map` (or `/knowledge-graph`).
- **Action**: Orbit the interactive **3D Concept Galaxy** (Three.js starfield with celestial orbits).
- **Action**: Click topic nodes to view posterior BKT mastery probabilities ($P(L_t)$), prerequisite dependencies, and toggle the **2D Blueprint** fallback.
- **Voiceover**: 
  > *"Aanvi visualizes the entire curriculum as an interactive 3D constellation galaxy. Node glow and size reflect real-time Bayesian Knowledge Tracing mastery probabilities, allowing students to visually discover foundational prerequisite gaps."*

---

### **2:45 – 3:00 | Live Diagnostics & 100% Real Evaluation Benchmarks**
- **Action**: Open `/architecture`. Show the live health checks for 14/14 pipeline components (`MOCK=false`), RAGAS metrics (**94.8% Faithfulness**, **96.2% Relevancy**), and ROC curves.
- **Voiceover**: 
  > *"Aanvi uses 100% real, verifiable pipeline components — zero mocked numbers. With 94.8% grounding faithfulness and verified adaptive learning gains, Aanvi is the complete study companion for the next generation of learners."*
