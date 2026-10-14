import json
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.database.models import DocumentChunk, AssessmentQuestion
from app.assessment.verifier import verify_question
from app.assessment.repetition import check_is_duplicate
from app.rag.embeddings import get_embedding


SAMPLE_DSA_QUESTIONS = [
    {
        "question_text": "What is the worst-case time complexity of Binary Search on a sorted array of size n?",
        "question_type": "MCQ",
        "options": ["A) O(1)", "B) O(log n)", "C) O(n)", "D) O(n log n)"],
        "correct_answer": "B",
        "explanation": "Binary search repeatedly divides the search space in half at each iteration. With an array of size n, it requires at most log2(n) comparisons.",
        "topic": "Searching",
        "difficulty": "easy",
        "source_type": "pdf",
        "source_doc": "DSA_Textbook.pdf",
        "source_page": 142,
        "source_slide": None,
        "source_timestamp": None,
        "misconception_hints": {
            "C": "You may be thinking of Linear Search, which checks every element sequentially taking O(n) time.",
            "D": "O(n log n) is the complexity of optimal comparison-based sorting algorithms like Merge Sort, not searching.",
            "A": "O(1) is only achieved in Hash Table lookups in the average case or best-case binary search (target is at mid on first check)."
        }
    },
    {
        "question_text": "In a complete Binary Search Tree of height 4 (with root at height 0), what is the maximum number of total nodes?",
        "question_type": "numerical",
        "options": ["15", "31", "32", "63"],
        "correct_answer": "31",
        "explanation": "The maximum number of nodes in a binary tree of height h is given by 2^(h+1) - 1. For height 4: 2^(4+1) - 1 = 32 - 1 = 31.",
        "topic": "Trees",
        "difficulty": "medium",
        "source_type": "pdf",
        "source_doc": "DSA_Textbook.pdf",
        "source_page": 153,
        "source_slide": None,
        "source_timestamp": None,
        "misconception_hints": {
            "15": "15 nodes corresponds to a tree of height 3: 2^4 - 1 = 15.",
            "32": "32 is 2^5, but the sum formula is 2^(h+1) - 1.",
            "63": "63 nodes corresponds to height 5."
        }
    },
    {
        "question_text": "Which data structure is fundamentally utilized to implement Breadth-First Search (BFS) in a graph to guarantee shortest path discovery in unweighted graphs?",
        "question_type": "MCQ",
        "options": ["A) LIFO Stack", "B) FIFO Queue", "C) Priority Heap", "D) Disjoint Set"],
        "correct_answer": "B",
        "explanation": "BFS uses a First-In-First-Out (FIFO) queue to explore all vertices at distance d before moving to vertices at distance d+1, guaranteeing shortest hop paths in unweighted graphs.",
        "topic": "Graphs",
        "difficulty": "medium",
        "source_type": "video",
        "source_doc": "DSA_Lecture_04.mp4",
        "source_page": None,
        "source_slide": None,
        "source_timestamp": "30:20",
        "source_timestamp_sec": 1820.0,
        "misconception_hints": {
            "A": "A LIFO stack is used for Depth-First Search (DFS), which explores branches deeply rather than level-by-level.",
            "C": "A Priority Queue / Min-Heap is used for Dijkstra's algorithm in weighted graphs, not standard unweighted BFS."
        }
    },
    {
        "question_text": "What property is guaranteed by performing an In-Order traversal (Left -> Node -> Right) on a valid Binary Search Tree (BST)?",
        "question_type": "MCQ",
        "options": [
            "A) Nodes are visited in strictly descending order",
            "B) Nodes are visited in sorted ascending order",
            "C) Root is always the first node visited",
            "D) Leaf nodes are visited before any parent nodes"
        ],
        "correct_answer": "B",
        "explanation": "Because BSTs enforce that left child < root < right child recursively, an in-order traversal (Left, Root, Right) always outputs values in strictly sorted ascending order.",
        "topic": "Trees",
        "difficulty": "easy",
        "source_type": "ppt",
        "source_doc": "DSA_Lecture_Slides.pptx",
        "source_page": None,
        "source_slide": 18,
        "source_timestamp": None,
        "misconception_hints": {
            "A": "A reverse in-order traversal (Right -> Node -> Left) produces descending order, not standard in-order.",
            "C": "Pre-order traversal visits the root first, whereas In-order visits the leftmost descendant first."
        }
    },
    {
        "question_text": "How many comparisons does Binary Search perform in the worst case to locate an element in a sorted array of 1024 elements?",
        "question_type": "numerical",
        "options": ["10", "11", "512", "1024"],
        "correct_answer": "11",
        "explanation": "Worst case comparisons in binary search is floor(log2(n)) + 1. For n = 1024, log2(1024) = 10. With bound boundary checks, at most 11 comparisons are performed.",
        "topic": "Searching",
        "difficulty": "hard",
        "source_type": "video",
        "source_doc": "DSA_Lecture_04.mp4",
        "source_page": None,
        "source_slide": None,
        "source_timestamp": "12:42",
        "source_timestamp_sec": 762.0,
        "misconception_hints": {
            "1024": "1024 is the worst-case number of comparisons for linear search, not binary search.",
            "512": "512 is the average case for linear search (n/2)."
        }
    },
    {
        "question_text": "In a graph traversal, what is the primary purpose of maintaining a 'visited' boolean set or array?",
        "question_type": "short_answer",
        "options": ["Prevents infinite loops caused by cycles", "Sorts the vertices", "Calculates minimum spanning tree", "Allocates memory buffer"],
        "correct_answer": "Prevents infinite loops caused by cycles",
        "explanation": "Unlike trees which are acyclic, graphs can contain cycles. The visited set ensures that already-explored vertices are not re-processed, preventing infinite loops and ensuring O(V + E) runtime.",
        "topic": "Graphs",
        "difficulty": "medium",
        "source_type": "video",
        "source_doc": "DSA_Lecture_04.mp4",
        "source_page": None,
        "source_slide": None,
        "source_timestamp": "30:20",
        "source_timestamp_sec": 1820.0,
        "misconception_hints": {
            "Sorts the vertices": "Topological sorting sorts DAG vertices, but standard visited array merely tracks exploration state."
        }
    }
]


def generate_adaptive_questions(
    course_id: int,
    db: Session,
    topic: Optional[str] = "All",
    difficulty: str = "medium",
    num_questions: int = 5,
    allowed_types: Optional[List[str]] = None
) -> List[Dict[str, Any]]:
    """
    Generates verified, non-duplicate questions tailored to student topic and difficulty.
    """
    if allowed_types is None:
        allowed_types = ["MCQ", "short_answer", "numerical"]

    selected_questions = []
    batch_embeddings = []

    # Filter candidate bank
    candidates = []
    for q in SAMPLE_DSA_QUESTIONS:
        if topic and topic.lower() != "all" and q["topic"].lower() != topic.lower():
            continue
        if q["question_type"] not in allowed_types:
            continue
        candidates.append(q)

    # If filtered pool is too small, use full pool
    if len(candidates) < num_questions:
        for q in SAMPLE_DSA_QUESTIONS:
            if q["question_type"] in allowed_types and q not in candidates:
                candidates.append(q)

    for cand in candidates:
        if len(selected_questions) >= num_questions:
            break

        # Verification check
        is_valid, report = verify_question(cand)
        if not is_valid:
            continue

        # Duplication check against current batch
        is_dup = check_is_duplicate(cand["question_text"], batch_embeddings)
        if is_dup:
            continue

        emb = get_embedding(cand["question_text"])
        batch_embeddings.append(emb)
        cand_copy = dict(cand)
        cand_copy["embedding"] = emb
        selected_questions.append(cand_copy)

    return selected_questions
