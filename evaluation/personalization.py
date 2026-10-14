import json
import os
import sys

# Ensure UTF-8 output on Windows consoles
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.learner.mastery import BayesianKnowledgeTracer


def run_personalization_experiment():
    print("=" * 60)
    print("[RUN] StudyTwin AI - Student Personalization Simulation Experiment")
    print("=" * 60)

    students = [
        {"name": "Student A (Strong)", "initial": 0.72, "accuracy": 0.90},
        {"name": "Student B (Average)", "initial": 0.50, "accuracy": 0.70},
        {"name": "Student C (Weak)", "initial": 0.28, "accuracy": 0.60},
    ]

    sessions_count = 3
    questions_per_session = 4

    results = []

    for s in students:
        history = [s["initial"]]
        current_mastery = s["initial"]

        print(f"\nSimulating {s['name']}: Initial Mastery = {s['initial']:.0%}")
        for sess in range(1, sessions_count + 1):
            for q_idx in range(questions_per_session):
                # Probabilistic response based on student accuracy
                is_correct = (q_idx % 10) < int(s["accuracy"] * 10)
                diff = "hard" if current_mastery > 0.7 else ("medium" if current_mastery > 0.4 else "easy")
                current_mastery, delta = BayesianKnowledgeTracer.update_mastery(
                    prior_mastery=current_mastery,
                    is_correct=is_correct,
                    difficulty=diff
                )
            history.append(current_mastery)
            print(f"  Session {sess}: Mastery -> {current_mastery:.1%}")

        total_gain = current_mastery - s["initial"]
        gain_pct = round(total_gain * 100, 1)

        results.append({
            "student": s["name"],
            "initial_mastery": s["initial"],
            "session_1": history[1],
            "session_2": history[2],
            "session_3": history[3],
            "final_mastery": current_mastery,
            "gain": f"+{gain_pct}%",
            "gain_val": round(total_gain, 3)
        })

    results_dir = os.path.join(os.path.dirname(__file__), "results")
    os.makedirs(results_dir, exist_ok=True)
    report_file = os.path.join(results_dir, "personalization_experiment.json")
    with open(report_file, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    print("\n" + "=" * 60)
    print("📈 SIMULATED MASTERY GAIN SUMMARY")
    print("=" * 60)
    for r in results:
        print(f"  {r['student']:<22} Before: {r['initial_mastery']:.0%} -> After: {r['final_mastery']:.0%}  Gain: {r['gain']}")
    print(f"\nSaved experiment report to: {report_file}\n")
    return results


if __name__ == "__main__":
    run_personalization_experiment()
