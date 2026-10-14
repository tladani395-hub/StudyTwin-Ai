# Learner Modeling & Knowledge Tracing

Aanvi models student cognitive state using an educational psychometrics foundation: **Bayesian Knowledge Tracing (BKT)**, **2-Parameter Logistic Item Response Theory (2PL-IRT)**, **Ebbinghaus Spaced Repetition**, and **Prerequisite DAG propagation**.

---

## 1. Bayesian Knowledge Tracing (BKT)

The student's latent mastery $L_t \in [0, 1]$ on topic $k$ is updated conditionally upon each question attempt:

### Posterior Update Equations:

When the student's response is **correct** ($Y_t = 1$):
$$P(L_t \mid Y_t = 1) = \frac{L_{t-1} \cdot (1 - S)}{L_{t-1} \cdot (1 - S) + (1 - L_{t-1}) \cdot G}$$

When the student's response is **incorrect** ($Y_t = 0$):
$$P(L_t \mid Y_t = 0) = \frac{L_{t-1} \cdot S}{L_{t-1} \cdot S + (1 - L_{t-1}) \cdot (1 - G)}$$

### Transit Step:
$$L_t = P(L_t \mid Y_t) + (1 - P(L_t \mid Y_t)) \cdot T$$

- $L_0$: Initial mastery prior (default $= 0.50$, adapted by diagnostic assessment)
- $T$: Transition probability / learning rate ($= 0.15$)
- $G$: Guess probability ($= 0.20$ for 4-option MCQ, adjusted by difficulty)
- $S$: Slip probability ($= 0.10$, adjusted by difficulty)

### Empirical Benchmark vs Running Average Baseline:
- **BKT**: AUC $= 0.700$, LogLoss $= 0.467$
- **Running Average Baseline**: AUC $= 0.628$, LogLoss $= 2.142$
- **Performance Advantage**: **+11.5% AUC improvement**, **-78.2% LogLoss error reduction**

---

## 2. Spaced Repetition & Forgetting Curve

Mastery decays over elapsed time $t$ in days according to the exponential retention model:
$$R(t) = e^{-\frac{t}{S}}$$

where stability $S$ grows proportionally with consecutive successful recalls:
$$S_{new} = S_{prior} \cdot (1 + 0.4 \cdot \text{repetitions})$$

When $R(t) < 0.75$, Aanvi proactively flags the topic for a review sprint and generates a personalized study calendar.

---

## 3. Prerequisite DAG & Weakness Propagation

Topics are structured as a Directed Acyclic Graph (DAG) with acyclicity verified via Kahn's algorithm:

```
[Basic Recursion] ───> [Binary Search] ───> [Binary Search Trees] ───> [AVL & Self-Balancing Trees]
        │
        └───> [Merge Sort] ───> [Quick Sort]
```

When a student struggles with an advanced topic ($L < 0.40$), Aanvi recursively traces incoming prerequisite edges to pinpoint foundational knowledge gaps and recommends prerequisite remediation sprints.
