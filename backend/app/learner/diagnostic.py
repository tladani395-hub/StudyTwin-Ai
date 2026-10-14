from typing import Dict, List, Any
from app.database.schemas import DiagnosticResultResponse


def evaluate_diagnostic_results(answers: List[Dict[str, Any]]) -> DiagnosticResultResponse:
    """
    Evaluates cold-start diagnostic answers and initializes per-topic mastery scores.
    """
    topic_totals: Dict[str, int] = {}
    topic_correct: Dict[str, int] = {}

    for item in answers:
        topic = item.get("topic", "General")
        is_correct = bool(item.get("is_correct", False))

        topic_totals[topic] = topic_totals.get(topic, 0) + 1
        if is_correct:
            topic_correct[topic] = topic_correct.get(topic, 0) + 1

    topic_scores: Dict[str, float] = {}
    for topic, total in topic_totals.items():
        correct = topic_correct.get(topic, 0)
        # Bayesian prior blend for diagnostic
        raw_pct = (correct / total) if total > 0 else 0.50
        blended = round(0.50 * 0.3 + raw_pct * 0.7, 2)
        topic_scores[topic] = blended

    # If default topics not in diagnostic, assign reasonable initial values
    default_fallbacks = {"Arrays": 0.82, "Searching": 0.76, "Trees": 0.51, "Graphs": 0.29}
    for def_top, def_val in default_fallbacks.items():
        if def_top not in topic_scores:
            topic_scores[def_top] = def_val

    overall_score = round(sum(topic_scores.values()) / len(topic_scores), 2)

    # Sort topics by score ascending to identify weak areas
    sorted_topics = sorted(topic_scores.items(), key=lambda x: x[1])
    weak_areas = [top for top, score in sorted_topics if score < 0.60]

    # Generate sequential remediation path
    recommended_path = []
    if "Graphs" in weak_areas or topic_scores.get("Graphs", 0.5) < 0.60:
        recommended_path.extend(["1. Graph Traversal Basics", "2. Breadth-First Search (Queue)", "3. Depth-First Search (Stack Recursion)"])
    if "Trees" in weak_areas or topic_scores.get("Trees", 0.5) < 0.60:
        recommended_path.extend(["4. Binary Search Tree Invariants", "5. BST In-Order Traversal"])
    if not recommended_path:
        recommended_path = ["1. Advanced Dynamic Programming", "2. Graph Shortest Path (Dijkstra)"]

    return DiagnosticResultResponse(
        overall_score=overall_score,
        topic_scores=topic_scores,
        weak_areas=weak_areas if weak_areas else ["Graphs"],
        recommended_path=recommended_path
    )
