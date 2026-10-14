import os
import math
import hashlib
import json
from typing import List, Dict, Any, Optional
import numpy as np

# Multilingual model metadata
MULTILINGUAL_MODEL_NAME = "intfloat/multilingual-e5-base"
MULTILINGUAL_DIM = 768
MOCK_DIM = 128

_e5_model = None


def get_multilingual_model():
    """Lazy load the multilingual-e5-base model singleton."""
    global _e5_model
    if _e5_model is None:
        from sentence_transformers import SentenceTransformer
        _e5_model = SentenceTransformer(MULTILINGUAL_MODEL_NAME)
    return _e5_model


def hash_text_to_vector(text: str, dim: int = MOCK_DIM) -> List[float]:
    """
    Deterministic semantic hash embedding for fast offline unit testing when EMBEDDER=mock.
    Tokenizes text, hashes n-grams with frequency weighting, and produces an L2-normalized vector.
    """
    words = [w.lower().strip(",.?!;:()[]{}'\"") for w in text.split() if w.strip()]
    if not words:
        return [0.0] * dim

    vector = np.zeros(dim, dtype=np.float32)

    for i, word in enumerate(words):
        if not word:
            continue
        h = int(hashlib.sha256(word.encode("utf-8")).hexdigest(), 16)
        idx = h % dim
        sign = 1.0 if (h // dim) % 2 == 0 else -1.0
        vector[idx] += sign * 1.5

        if i < len(words) - 1:
            next_word = words[i + 1]
            bigram = f"{word}_{next_word}"
            h_bi = int(hashlib.sha256(bigram.encode("utf-8")).hexdigest(), 16)
            idx_bi = h_bi % dim
            sign_bi = 1.0 if (h_bi // dim) % 2 == 0 else -1.0
            vector[idx_bi] += sign_bi * 2.0

        for j in range(len(word) - 2):
            trigram = word[j:j+3]
            h_tri = int(hashlib.md5(trigram.encode("utf-8")).hexdigest(), 16)
            idx_tri = h_tri % dim
            vector[idx_tri] += 0.5

    norm = np.linalg.norm(vector)
    if norm > 0:
        vector = vector / norm

    return vector.tolist()


def get_embedding(text: str, is_query: bool = False) -> List[float]:
    """
    Generate embedding for text.
    - If EMBEDDER=mock: uses deterministic subword hash (128-dim) for unit tests.
    - Otherwise: uses real multilingual model (intfloat/multilingual-e5-base, 768-dim).
    """
    if os.getenv("EMBEDDER", "").lower() == "mock":
        return hash_text_to_vector(text, dim=MOCK_DIM)

    # Real multilingual model (intfloat/multilingual-e5-base)
    try:
        model = get_multilingual_model()
        prefix = "query: " if is_query else "passage: "
        formatted_text = f"{prefix}{text.strip()}"
        emb = model.encode(formatted_text, normalize_embeddings=True)
        return emb.tolist()
    except Exception as exc:
        # Fallback if torch or weights unavailable
        if os.getenv("EMBEDDER_STRICT", "false").lower() == "true":
            raise exc
        return hash_text_to_vector(text, dim=MOCK_DIM)


def get_embedding_model_info() -> Dict[str, Any]:
    """Returns the active embedding model name and vector dimension."""
    if os.getenv("EMBEDDER", "").lower() == "mock":
        return {
            "name": "mock/hash_text_to_vector",
            "dimension": MOCK_DIM,
            "is_real": False
        }
    return {
        "name": MULTILINGUAL_MODEL_NAME,
        "dimension": MULTILINGUAL_DIM,
        "is_real": True
    }


def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """Calculate cosine similarity between two float vectors."""
    if not vec1 or not vec2 or len(vec1) != len(vec2):
        return 0.0
    
    v1 = np.array(vec1, dtype=np.float32)
    v2 = np.array(vec2, dtype=np.float32)

    dot = np.dot(v1, v2)
    norm1 = np.linalg.norm(v1)
    norm2 = np.linalg.norm(v2)

    if norm1 == 0 or norm2 == 0:
        return 0.0

    sim = dot / (norm1 * norm2)
    return float(max(min(sim, 1.0), -1.0))
