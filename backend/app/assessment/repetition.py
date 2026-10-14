from typing import List
from app.rag.embeddings import get_embedding, cosine_similarity

SIMILARITY_REPETITION_THRESHOLD = 0.70


def check_is_duplicate(
    new_question_text: str,
    existing_question_embeddings: List[List[float]]
) -> bool:
    """
    Checks if a newly generated question is semantically identical/repeated compared to previous questions.
    Returns True if duplicate (similarity >= threshold), False if novel.
    """
    if not existing_question_embeddings:
        return False

    new_emb = get_embedding(new_question_text)
    for existing_emb in existing_question_embeddings:
        if not existing_emb:
            continue
        sim = cosine_similarity(new_emb, existing_emb)
        if sim >= SIMILARITY_REPETITION_THRESHOLD:
            return True

    return False
