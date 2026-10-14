# Assessment Generation & Verification Pipeline

Aanvi ensures question rigor, mathematical correctness, and pedagogical quality through a 3-tier automated verification pipeline before presenting any question to a student.

---

## 1. Pipeline Stages

```
1. Ingestion Chunk Selection & Bloom Level Targeting
                         │
                         ▼
2. Question Generation (MCQ / Numerical / Short Answer + Misconception Traps)
                         │
                         ▼
3. Verification Tier 1: Independent 2nd LLM Solve
   (Blindly solves the item without seeing the original key; verifies agreement)
                         │
                         ▼
4. Verification Tier 2: SymPy Mathematical Sandbox
   (Parses numerical/algebraic equations, evaluates equivalence deterministically)
                         │
                         ▼
5. Verification Tier 3: Cosine Novelty Deduplication
   (Computes question embedding vs prior pool; discards if similarity > 0.88)
                         │
                         ▼
6. Approved Assessment Item with Source Citation & Misconception Matrix
```

---

## 2. Misconception-Driven Distractor Design

Each distractor option is linked to a documented cognitive misconception:

- **Option A (Correct)**: $O(\log n)$
- **Option B (Misconception - Linear Search)**: $O(n)$ $\rightarrow$ Hint: *"You may be thinking of Linear Search which checks elements one by one."*
- **Option C (Misconception - Sort-First Overhead)**: $O(n \log n)$ $\rightarrow$ Hint: *"Binary Search assumes the array is already sorted; it does not sort the array."*
- **Option D (Misconception - Constant Time Trap)**: $O(1)$ $\rightarrow$ Hint: *"Binary search takes $O(1)$ only in the best case when the target is at the exact midpoint."*

When a student selects a wrong option, the system delivers immediate targeted diagnostic feedback rather than simply saying *"Incorrect"*.
