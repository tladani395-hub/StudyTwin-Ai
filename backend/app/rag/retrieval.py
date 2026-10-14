from typing import List, Tuple, Optional
from sqlalchemy.orm import Session
from app.database.models import DocumentChunk
from app.rag.embeddings import get_embedding, cosine_similarity


def retrieve_relevant_chunks(
    query: str,
    course_id: int,
    db: Session,
    top_k: int = 5,
    topic_filter: Optional[str] = None
) -> List[Tuple[DocumentChunk, float]]:
    """
    Retrieves top_k most relevant document chunks from PostgreSQL / SQLite via pgvector/cosine similarity.
    Applies topic-aware reranking and exact term matching boosts.
    """
    query_emb = get_embedding(query)
    
    # Query all chunks for this course
    query_stmt = db.query(DocumentChunk).filter(DocumentChunk.course_id == course_id)
    if topic_filter and topic_filter.lower() != "all":
        query_stmt = query_stmt.filter(DocumentChunk.title.ilike(f"%{topic_filter}%"))
    
    chunks = query_stmt.all()
    if not chunks:
        return []

    scored_chunks: List[Tuple[DocumentChunk, float]] = []
    query_lower = query.lower()
    query_terms = [t for t in query_lower.split() if len(t) > 2]

    for chunk in chunks:
        chunk_emb = chunk.get_embedding()
        sim_score = cosine_similarity(query_emb, chunk_emb) if chunk_emb else 0.0

        # Term match boost
        chunk_text_lower = chunk.text.lower()
        keyword_hits = sum(1 for term in query_terms if term in chunk_text_lower)
        keyword_boost = min(0.25, keyword_hits * 0.05)

        # Topic match boost
        topic_boost = 0.1 if chunk.topic and chunk.topic.lower() in query_lower else 0.0

        final_score = min(0.99, sim_score + keyword_boost + topic_boost)
        scored_chunks.append((chunk, final_score))

    # Sort descending by final score
    scored_chunks.sort(key=lambda x: x[1], reverse=True)
    return scored_chunks[:top_k]
