import math
import re
from typing import List, Dict, Any, Tuple, Optional, Union
from sqlalchemy.orm import Session
from app.database.models import DocumentChunk
from app.rag.embeddings import get_embedding, cosine_similarity


class BM25Okapi:
    def __init__(self, corpus: List[List[str]], k1: float = 1.5, b: float = 0.75):
        self.k1 = k1
        self.b = b
        self.corpus_size = len(corpus)
        self.doc_lens = [len(doc) for doc in corpus]
        self.avgdl = sum(self.doc_lens) / self.corpus_size if self.corpus_size > 0 else 1.0
        self.doc_freqs: Dict[str, int] = {}
        self.idf: Dict[str, float] = {}
        self._initialize(corpus)

    def _initialize(self, corpus: List[List[str]]):
        for doc in corpus:
            seen_terms = set(doc)
            for term in seen_terms:
                self.doc_freqs[term] = self.doc_freqs.get(term, 0) + 1

        for term, freq in self.doc_freqs.items():
            self.idf[term] = math.log(1 + (self.corpus_size - freq + 0.5) / (freq + 0.5))

    def get_scores(self, query_tokens: List[str], corpus: List[List[str]]) -> List[float]:
        scores = []
        for idx, doc in enumerate(corpus):
            score = 0.0
            doc_len = self.doc_lens[idx]
            term_counts: Dict[str, int] = {}
            for t in doc:
                term_counts[t] = term_counts.get(t, 0) + 1

            for q in query_tokens:
                if q not in term_counts:
                    continue
                tf = term_counts[q]
                idf = self.idf.get(q, 0.0)
                denom = tf + self.k1 * (1 - self.b + self.b * (doc_len / self.avgdl))
                score += idf * ((tf * (self.k1 + 1)) / denom) if denom > 0 else 0.0
            scores.append(score)
        return scores


def tokenize(text: str) -> List[str]:
    return [w.lower() for w in re.findall(r"\w+", text) if len(w) > 2]


def hybrid_retrieve_chunks(
    query: str,
    course_id: Optional[Union[str, int]] = None,
    db: Session = None,
    top_k: int = 5,
    topic_filter: Optional[str] = None,
    allowed_course_ids: Optional[List[str]] = None
) -> List[Tuple[DocumentChunk, float]]:
    """
    Combines Dense Embedding Cosine Similarity + BM25 Lexical Matching with Reranking.
    """
    stmt = db.query(DocumentChunk)
    if course_id is not None:
        stmt = stmt.filter(DocumentChunk.course_id == str(course_id))
    elif allowed_course_ids is not None:
        stmt = stmt.filter(DocumentChunk.course_id.in_([str(cid) for cid in allowed_course_ids]))
    if topic_filter and topic_filter.lower() != "all":
        stmt = stmt.filter(DocumentChunk.topic.ilike(f"%{topic_filter}%"))


    chunks: List[DocumentChunk] = stmt.all()
    if not chunks:
        return []

    # 1. Dense Semantic Scoring
    query_emb = get_embedding(query)
    dense_scores = []
    for chunk in chunks:
        c_emb = chunk.get_embedding()
        sim = cosine_similarity(query_emb, c_emb) if c_emb else 0.0
        dense_scores.append(sim)

    # 2. BM25 Lexical Scoring
    tokenized_corpus = [tokenize(c.text) for c in chunks]
    query_tokens = tokenize(query)
    bm25 = BM25Okapi(tokenized_corpus)
    raw_bm25_scores = bm25.get_scores(query_tokens, tokenized_corpus)

    # Normalize BM25 scores to [0, 1]
    max_bm25 = max(raw_bm25_scores) if raw_bm25_scores and max(raw_bm25_scores) > 0 else 1.0
    norm_bm25_scores = [s / max_bm25 for s in raw_bm25_scores]

    # 3. Hybrid Fusion & Topic Weighting
    hybrid_results: List[Tuple[DocumentChunk, float]] = []
    for idx, chunk in enumerate(chunks):
        d_score = dense_scores[idx]
        b_score = norm_bm25_scores[idx]

        # 65% Dense + 35% Lexical
        fused_score = (0.65 * d_score) + (0.35 * b_score)

        # Topic match bonus
        if chunk.topic and chunk.topic.lower() in query.lower():
            fused_score += 0.08

        # Cap at 0.99
        final_score = min(0.99, max(0.0, fused_score))
        hybrid_results.append((chunk, final_score))

    hybrid_results.sort(key=lambda x: x[1], reverse=True)
    return hybrid_results[:top_k]
