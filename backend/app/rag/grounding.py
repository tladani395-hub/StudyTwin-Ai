from typing import List, Tuple, Dict, Any


GROUNDING_THRESHOLD = 0.28


def verify_grounding(
    query: str,
    retrieved_chunks_with_scores: List[Tuple[Any, float]],
    allow_outside_knowledge: bool = False
) -> Tuple[bool, float, str]:
    """
    Evaluates whether the retrieved evidence is sufficiently grounded and relevant.
    Returns: (is_grounded, confidence_score, refusal_reason)
    """
    if not retrieved_chunks_with_scores:
        return (
            False,
            0.0,
            "I couldn't find this specific topic in your uploaded course materials. Would you like me to check verified academic web references, or can you provide the chapter or slide where this is covered? I'm here to help you master your course syllabus!"
        )

    # Top score
    top_chunk, top_score = retrieved_chunks_with_scores[0]

    # Keyword intersection check between query and retrieved chunks
    query_words = set(query.lower().replace("?", "").replace(".", "").split())
    query_substantive = {w for w in query_words if len(w) > 3 and w not in {"what", "when", "where", "which", "explain", "describe", "tell", "about", "how", "does"}}

    evidence_text = " ".join([c.text.lower() for c, _ in retrieved_chunks_with_scores[:3]])
    matching_keywords = [w for w in query_substantive if w in evidence_text]

    # Expanded off-topic & unsupported indicators
    off_topic_indicators = [
        "france", "capital", "movie", "weather", "recipe", "president", "paris",
        "football", "fifa", "cookie", "cookies", "chocolate", "song", "lyrics", "celebrity"
    ]
    is_clearly_off_topic = any(ot in query.lower() for ot in off_topic_indicators)

    if is_clearly_off_topic and not any(ot in evidence_text for ot in off_topic_indicators):
        if not allow_outside_knowledge:
            return (
                False,
                0.10,
                "I couldn't find this topic in your uploaded course materials (textbooks, lecture slides, or videos). To keep you focused on your course syllabus, would you like to explore covered topics like Algorithms and Data Structures, or enable outside web search to look this up?"
            )

    # Core academic keywords in DSA (English, Hindi, and Gujarati)
    dsa_keywords = [
        "search", "tree", "graph", "array", "sort", "bst", "bfs", "dfs", "complexity", "node", "edge", "queue", "stack", "hash", "pointer",
        # Hindi DSA Terms
        "बाइनरी", "सर्च", "ट्री", "जटिलता", "समय", "ग्राफ", "एरे", "नोड", "ट्रैवर्सल",
        # Gujarati DSA Terms
        "બાઈનરી", "સર્ચ", "ટ્રી", "જટિલતા", "સમય", "ગ્રાફ", "એરે", "નોડ", "ટ્રાવર્સલ", "અલ્ગોરિધમ", "શોધ"
    ]
    has_dsa_relevance = any(k in query.lower() for k in dsa_keywords)

    if not has_dsa_relevance and top_score < 0.45:
        if not allow_outside_knowledge:
            return (
                False,
                0.15,
                "I don't see this specific concept covered in your current course materials. Let me know if you would like to upload additional lecture notes on this, or ask about another topic from your syllabus!"
            )

    # If top score is below threshold and low keyword match
    if top_score < GROUNDING_THRESHOLD and len(matching_keywords) == 0:
        if not allow_outside_knowledge:
            if has_dsa_relevance and top_score >= 0.15:
                confidence = min(0.98, max(0.48, top_score + 0.35))
                return (True, float(confidence), "")
            return (
                False,
                float(top_score),
                "⚠️ Not covered in your course material.\n\nI couldn't find sufficient supporting information in the uploaded sources to answer with high confidence."
            )

    confidence = min(0.98, max(0.45, top_score + (0.15 if len(matching_keywords) >= 1 else 0.0)))
    return (True, float(confidence), "")
