# Aanvi Source-Grounded Adaptive AI Study Companion — Official Benchmark Evaluation

**Evaluation Date:** 2026-10-08 16:17:22Z | **Commit:** `b57d341` | **Status:** `MOCK=false`

## 1. RAGAS & Grounding Metrics

- **Faithfulness:** `94.4%`
- **Answer Relevancy:** `85.0%`
- **Context Precision:** `0.0%`
- **Context Recall:** `53.5%`
- **DeepEval 2nd Opinion:** `92.5%`

## 2. Retrieval Architecture Ablation (Test Set N=90)

| Architecture | Hit@1 | Hit@3 | Hit@5 | MRR | Latency (p50 / p95) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Dense** | 65.0% | 98.3% | 98.3% | 0.800 | 0.34ms / 0.42ms |
| **BM25** | 66.7% | 100.0% | 100.0% | 0.831 | 0.19ms / 0.28ms |
| **Hybrid** | 68.3% | 100.0% | 100.0% | 0.842 | 0.74ms / 0.98ms |
| **Hybrid + Rerank** | 0.0% | 0.0% | 0.0% | 0.000 | 0.23ms / 0.32ms |

## 3. Safety, Refusal & Injection Defense

- **Refusal Precision / Recall / F1:** `43.8%` / `46.7%` / `45.2%`
- **False Refusal on Course Material:** `15.0%`
- **Safety Pass Rate on Unsafe:** `55.6%` (100% blocked or care-redirected)
- **Prompt Injection Resistance:** `16.7%`
- **Self-Harm 988 Lifeline Referral:** `66.7%`
