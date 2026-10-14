from typing import List, Dict, Any, Tuple


def get_recommendations_and_tier(masteries: List[Dict[str, Any]]) -> Tuple[str, List[str], str]:
    """
    Analyzes student mastery state across topics.
    Returns:
    - recommended_focus: top priority topic to study
    - weak_topics: list of topics requiring review
    - learner_tier: 'beginner' | 'intermediate' | 'mastered'
    """
    if not masteries:
        return "Graph Traversal", ["Graphs", "Trees"], "beginner"

    # Sort ascending by mastery_score
    sorted_m = sorted(masteries, key=lambda x: x.get("mastery_score", 0.5))
    weak_topics = [m["topic_name"] for m in sorted_m if m.get("mastery_score", 0.5) < 0.60]

    recommended_focus = sorted_m[0]["topic_name"] if sorted_m else "Graph Traversal"
    avg_score = sum(m.get("mastery_score", 0.5) for m in masteries) / len(masteries)

    if avg_score < 0.45:
        tier = "beginner"
    elif avg_score < 0.75:
        tier = "intermediate"
    else:
        tier = "mastered"

    return recommended_focus, weak_topics, tier


def adapt_prompt_to_mastery(query: str, topic_mastery: float) -> str:
    """
    Returns system guidance based on the student's mastery level in the queried topic.
    """
    if topic_mastery < 0.40:
        return (
            "LEARNER CONTEXT: The student is a BEGINNER in this concept (Mastery: {pct}%). "
            "Explain from first principles. Start with an intuitive real-world analogy before code. "
            "Break down each step simply, avoid overwhelming terminology, and encourage them.".format(pct=int(topic_mastery*100))
        )
    elif topic_mastery < 0.75:
        return (
            "LEARNER CONTEXT: The student has INTERMEDIATE familiarity with this concept (Mastery: {pct}%). "
            "Focus on algorithmic execution steps, standard implementation patterns, and common pitfalls.".format(pct=int(topic_mastery*100))
        )
    else:
        return (
            "LEARNER CONTEXT: The student has ADVANCED MASTERY in this concept (Mastery: {pct}%). "
            "Do NOT waste time on basic definitions. Jump directly into asymptotic analysis, edge cases, "
            "invariants, optimization trade-offs, and advanced variations.".format(pct=int(topic_mastery*100))
        )
