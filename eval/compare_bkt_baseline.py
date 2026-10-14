import os
import sys
import json
import math
import random
from typing import List, Dict, Tuple
import numpy as np

# Ensure UTF-8 output on Windows consoles
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
from app.learner.mastery import BayesianKnowledgeTracer


def compute_auc(y_true: List[int], y_scores: List[float]) -> float:
    """
    Computes exact Area Under the ROC Curve (AUC) using trapezoidal rule / Mann-Whitney U.
    """
    pairs = list(zip(y_scores, y_true))
    # Sort descending by predicted score
    pairs.sort(key=lambda x: x[0], reverse=True)
    
    n_pos = sum(y_true)
    n_neg = len(y_true) - n_pos
    if n_pos == 0 or n_neg == 0:
        return 0.5

    rank_sum = 0
    for idx, (_, label) in enumerate(pairs):
        if label == 1:
            rank_sum += (len(pairs) - idx)

    u_stat = rank_sum - (n_pos * (n_pos + 1)) / 2.0
    auc = u_stat / (n_pos * n_neg)
    return float(max(0.0, min(1.0, auc)))


def compute_log_loss(y_true: List[int], y_preds: List[float], eps: float = 1e-15) -> float:
    """Computes binary cross entropy / log loss."""
    losses = []
    for y, p in zip(y_true, y_preds):
        p_clipped = max(eps, min(1.0 - eps, p))
        loss = -(y * math.log(p_clipped) + (1 - y) * math.log(1 - p_clipped))
        losses.append(loss)
    return float(np.mean(losses))


def compare_models(num_students: int = 50, seq_len: int = 20):
    print("=" * 70)
    print("📊 LEARNER MODEL BENCHMARK: BKT vs RUNNING AVERAGE BASELINE")
    print("   Dataset: Simulated Student Sequence Benchmark (ASSISTments format)")
    print("=" * 70)

    random.seed(42)
    np.random.seed(42)

    y_true_all = []
    bkt_preds_all = []
    baseline_preds_all = []

    for s_id in range(num_students):
        # Latent student profile
        init_mastery = random.uniform(0.2, 0.7)
        student_bkt = 0.50  # BKT prior

        student_history = []
        running_sum = 0

        for t in range(seq_len):
            # True probability of correct answer
            p_actual_success = init_mastery + (1.0 - init_mastery) * (1.0 - math.exp(-0.15 * t))
            p_actual_success = max(0.1, min(0.95, p_actual_success + random.uniform(-0.05, 0.05)))

            # Next answer prediction BEFORE seeing outcome
            # BKT prediction: P(C) = P(L)(1 - S) + (1 - P(L))G
            # With default G=0.25, S=0.10:
            bkt_pred = (student_bkt * 0.90) + ((1.0 - student_bkt) * 0.25)

            # Running average baseline prediction
            if len(student_history) == 0:
                baseline_pred = 0.50
            else:
                baseline_pred = running_sum / len(student_history)

            # Observe response
            obs = 1 if random.random() < p_actual_success else 0

            y_true_all.append(obs)
            bkt_preds_all.append(bkt_pred)
            baseline_preds_all.append(baseline_pred)

            # Update models AFTER seeing outcome
            student_history.append(obs)
            running_sum += obs
            student_bkt, _ = BayesianKnowledgeTracer.update_mastery(
                prior_mastery=student_bkt,
                is_correct=(obs == 1),
                difficulty="medium"
            )

    # Compute comparative metrics
    auc_bkt = compute_auc(y_true_all, bkt_preds_all)
    auc_base = compute_auc(y_true_all, baseline_preds_all)

    loss_bkt = compute_log_loss(y_true_all, bkt_preds_all)
    loss_base = compute_log_loss(y_true_all, baseline_preds_all)

    print(f"\nResults on {len(y_true_all)} interaction opportunities:")
    print(f"  • Bayesian Knowledge Tracing (BKT): AUC = {auc_bkt:.3f} | LogLoss = {loss_bkt:.3f}")
    print(f"  • Running Average Baseline:         AUC = {auc_base:.3f} | LogLoss = {loss_base:.3f}")
    print(f"  • Delta Improvement:                AUC +{((auc_bkt - auc_base) / auc_base):.1%} | LogLoss -{((loss_base - loss_bkt) / loss_base):.1%}")

    report = {
        "dataset": "Simulated Learner Sequences (ASSISTments Skill-Builder Standard Format)",
        "num_interactions": len(y_true_all),
        "models": {
            "BKT": {
                "auc": round(auc_bkt, 3),
                "log_loss": round(loss_bkt, 3)
            },
            "RunningAverage": {
                "auc": round(auc_base, 3),
                "log_loss": round(loss_base, 3)
            }
        },
        "auc_improvement_pct": round(((auc_bkt - auc_base) / auc_base) * 100, 1)
    }

    results_dir = os.path.join(os.path.dirname(__file__), "results")
    os.makedirs(results_dir, exist_ok=True)
    out_file = os.path.join(results_dir, "bkt_model_comparison.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    return report


if __name__ == "__main__":
    compare_models()
