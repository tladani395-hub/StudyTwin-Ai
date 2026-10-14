import math
from datetime import datetime, timedelta
from typing import Dict, List, Any, Tuple


class SpacedRepetitionEngine:
    """
    FSRS / SM-2 Spaced Repetition and Forgetting Curve calculator.
    Models memory stability, retrievability decay, and optimal review schedules.
    """

    @staticmethod
    def calculate_retrievability(elapsed_days: float, stability: float = 5.0) -> float:
        """
        Calculates memory retrievability R(t) = e^(-t / S).
        Returns a float between 0.0 and 1.0 (e.g., 0.85 = 85% recall probability).
        """
        if stability <= 0:
            stability = 1.0
        retrievability = math.exp(-float(elapsed_days) / float(stability))
        return round(max(0.01, min(1.0, retrievability)), 3)

    @staticmethod
    def update_stability(current_stability: float, is_correct: bool, difficulty: str = "medium") -> Tuple[float, int]:
        """
        Updates memory stability (in days) after testing.
        Returns: (new_stability, recommended_interval_days)
        """
        diff_multiplier = {
            "easy": 1.4,
            "medium": 1.1,
            "hard": 0.85,
            "adaptive": 1.1
        }.get(difficulty.lower(), 1.1)

        if is_correct:
            new_stability = max(1.0, current_stability * (1.6 * diff_multiplier))
        else:
            # Forgetting penalty
            new_stability = max(1.0, current_stability * 0.4)

        new_stability = round(new_stability, 2)
        interval_days = max(1, int(round(new_stability)))
        return new_stability, interval_days

    @staticmethod
    def propagate_prerequisite_weakness(
        topic_masteries: Dict[str, float],
        prerequisite_chains: Dict[str, List[str]]
    ) -> List[Dict[str, Any]]:
        """
        Identifies root causes: if a prerequisite has low mastery (< 0.50),
        flags it as the upstream root cause of weakness in dependent topics.
        """
        remediation_diagnostics = []

        for topic, score in topic_masteries.items():
            prereqs = prerequisite_chains.get(topic, [])
            weak_prereqs = [p for p in prereqs if topic_masteries.get(p, 0.5) < 0.50]

            if weak_prereqs:
                remediation_diagnostics.append({
                    "topic": topic,
                    "current_mastery": score,
                    "status": "blocked_by_prerequisite",
                    "root_cause_topics": weak_prereqs,
                    "recommendation": f"Review {', '.join(weak_prereqs)} before attempting advanced {topic} problems."
                })
            elif score < 0.50:
                remediation_diagnostics.append({
                    "topic": topic,
                    "current_mastery": score,
                    "status": "topic_remediation_needed",
                    "root_cause_topics": [topic],
                    "recommendation": f"Practice foundational drills on {topic}."
                })

        return remediation_diagnostics
