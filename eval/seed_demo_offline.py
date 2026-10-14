import os
import sys
import json
from datetime import datetime, timedelta

# Ensure UTF-8 output on Windows console
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Add backend directory to sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.database.database import engine, SessionLocal, init_db, Base
from app.database.models import (
    User, UserProfile, UserSettings, Course, Document, DocumentChunk,
    Topic, LearnerMastery, ReviewSchedule, Misconception, Assessment,
    AssessmentQuestion, AssessmentSubmission, GamePlay, XPEvent, Badge,
    Streak, ChatThread, ChatMessage, VoiceSession, CameraUpload
)

from app.rag.embeddings import get_embedding

def seed_offline_demo():
    print("=" * 60)
    print("🌱 SEEDING OFFLINE DEMO ENVIRONMENT FOR AANVI")
    print("=" * 60)

    # Initialize tables
    init_db()
    db = SessionLocal()

    try:
        # Clear existing demo data to ensure a clean idempotent state
        print("Cleaning existing demo state...")
        db.query(AssessmentSubmission).delete()
        db.query(AssessmentQuestion).delete()
        db.query(Assessment).delete()
        db.query(ChatMessage).delete()
        db.query(ChatThread).delete()
        db.query(VoiceSession).delete()
        db.query(CameraUpload).delete()
        db.query(GamePlay).delete()
        db.query(XPEvent).delete()
        db.query(Badge).delete()
        db.query(Streak).delete()
        db.query(ReviewSchedule).delete()
        db.query(Misconception).delete()
        db.query(LearnerMastery).delete()
        db.query(DocumentChunk).delete()
        db.query(Document).delete()
        db.query(Topic).delete()
        db.query(Course).delete()
        db.query(UserProfile).delete()
        db.query(UserSettings).delete()
        db.query(User).delete()
        db.commit()

        # 1. Create Demo Course
        course = Course(
            id=1,
            title="Data Structures & Algorithms",
            subject="Computer Science",
            description="Comprehensive course on foundational data structures, tree hierarchies, recurrence relations, and graph algorithms."
        )
        db.add(course)
        db.commit()
        print("Created Course: Data Structures & Algorithms")

        # 2. Create Topics / Knowledge Graph Nodes
        topics_data = [
            {"id": 1, "name": "Arrays", "category": "Linear", "prereqs": [], "desc": "Contiguous memory blocks and sorting."},
            {"id": 2, "name": "Searching", "category": "Linear", "prereqs": ["Arrays"], "desc": "Linear search O(n) and Binary search O(log n) over sorted spaces."},
            {"id": 3, "name": "Trees", "category": "Hierarchical", "prereqs": ["Arrays", "Searching"], "desc": "Binary trees, BST invariants, and traversals."},
            {"id": 4, "name": "Graphs", "category": "Network", "prereqs": ["Trees"], "desc": "BFS, DFS, and Dijkstra shortest path graph algorithms."},
            {"id": 5, "name": "Divide & Conquer", "category": "Core Paradigm", "prereqs": [], "desc": "Decomposing problems into subproblems and combining solutions."},
            {"id": 6, "name": "Master Theorem", "category": "Complexity", "prereqs": ["Divide & Conquer"], "desc": "Asymptotic analysis for divide-and-conquer recurrences T(n) = aT(n/b) + f(n)."},
            {"id": 7, "name": "Binary Search Trees", "category": "Data Structures", "prereqs": ["Searching"], "desc": "Hierarchical node structure maintaining binary search invariant."},
            {"id": 8, "name": "Priority Queues & Heaps", "category": "Data Structures", "prereqs": ["Binary Search Trees"], "desc": "Complete binary trees satisfying min/max heap property with O(log n) operations."},
            {"id": 9, "name": "Dijkstra Shortest Path", "category": "Graph Algorithms", "prereqs": ["Priority Queues & Heaps"], "desc": "Greedy single-source shortest path algorithm on weighted graphs."}
        ]

        topic_objs = {}
        for td in topics_data:
            t = Topic(
                id=td["id"],
                course_id=1,
                name=td["name"],
                category=td["category"],
                prerequisites_json=json.dumps(td["prereqs"]),
                description=td["desc"],
                order_index=td["id"]
            )
            db.add(t)
            topic_objs[td["name"]] = t
        db.commit()
        print(f"Created {len(topics_data)} Knowledge Graph Topics.")

        # 3. Create Documents (PDF, Slide Deck, Video)
        doc_pdf = Document(
            id=1,
            course_id=1,
            title="DSA Comprehensive Textbook (4th Edition)",
            file_name="DSA_Textbook.pdf",
            file_path="/data/courses/cs201/DSA_Textbook.pdf",
            source_type="pdf",
            status="processed",
            num_pages_or_slides=240,
            summary="Standard reference textbook covering asymptotic complexity, array structures, binary search trees, and graph algorithms."
        )
        doc_slides = Document(
            id=2,
            course_id=1,
            title="DSA Lecture 04 & 05 Slide Deck",
            file_name="DSA_Lecture_Slides.pptx",
            file_path="/data/courses/cs201/DSA_Lecture_Slides.pptx",
            source_type="ppt",
            status="processed",
            num_pages_or_slides=35,
            summary="Visual slides detailing array representation of heaps, binary search, and priority queue applications."
        )
        doc_video = Document(
            id=3,
            course_id=1,
            title="DSA Lecture 04 — Searching, Trees & Graphs",
            file_name="DSA_Lecture_04.mp4",
            file_path="/data/courses/cs201/DSA_Lecture_04.mp4",
            source_type="video",
            status="processed",
            total_duration_sec=2520.0,
            summary="Professor lecture explaining Binary Search, Dijkstra's relaxation step, non-negative edge constraints, and graph traversals."
        )
        db.add_all([doc_pdf, doc_slides, doc_video])
        db.commit()
        print("Created 3 Multi-modal Course Documents (PDF, Slides, Video).")

        # 4. Create Document Chunks with Citations, Real Embeddings and Math
        chunks_data = [
            # PDF Chunk 1: Binary Search (Page 142)
            {
                "doc_id": 1, "source_type": "pdf", "page": 142, "slide": None,
                "ts_start": None, "ts_end": None, "ts_sec": None,
                "topic": "Searching",
                "text": "Binary search repeatedly divides a sorted search space into smaller halves. Given a sorted array A and target value x, compare x with the middle element. If x < A[mid], search the left half; if x > A[mid], search the right half. The worst-case recurrence is T(n) = T(n/2) + O(1), leading to a tight bound of O(log n) time complexity."
            },
            # PDF Chunk 2: Binary Search Tree (Page 153)
            {
                "doc_id": 1, "source_type": "pdf", "page": 153, "slide": None,
                "ts_start": None, "ts_end": None, "ts_sec": None,
                "topic": "Trees",
                "text": "A Binary Search Tree (BST) is an ordered node-based binary tree data structure. For every node N, every node in N's left subtree satisfies key < N.key, and every node in N's right subtree satisfies key > N.key.\n\n[Diagram Analysis: Binary Search Tree]\nVisual structure: Root node contains key 50. Left subtree contains keys {25, 10, 35} (all < 50), and right subtree contains keys {75, 60, 90} (all > 50). In-order traversal yields sorted order: [10, 25, 35, 50, 60, 75, 90]. Subtree height is 3, satisfying BST search invariant O(log n)."
            },
            # PDF Chunk 3: Master Theorem (Page 4)
            {
                "doc_id": 1, "source_type": "pdf", "page": 4, "slide": None,
                "ts_start": None, "ts_end": None, "ts_sec": None,
                "topic": "Master Theorem",
                "text": "The Master Theorem solves recurrences of the form $T(n) = aT(n/b) + f(n)$ where $a \\ge 1$ and $b > 1$. In Case 2, if $f(n) = \\Theta(n^{\\log_b a} \\log^k n)$ for $k \\ge 0$, then $T(n) = \\Theta(n^{\\log_b a} \\log^{k+1} n)$. For standard Merge Sort with $T(n) = 2T(n/2) + \\Theta(n)$, $a=2, b=2, k=0$, resulting in $T(n) = \\Theta(n \\log n)$."
            },
            # PDF Chunk 4: Divide & Conquer (Page 7)
            {
                "doc_id": 1, "source_type": "pdf", "page": 7, "slide": None,
                "ts_start": None, "ts_end": None, "ts_sec": None,
                "topic": "Divide & Conquer",
                "text": "Divide and Conquer partitions a problem of size $n$ into $a$ subproblems of size $n/b$. The base case handles $n \\le c$ in constant time $\\Theta(1)$. The combination step merges subproblem answers in time $f(n)$."
            },
            # PPT Chunk 1: Slide 18 Binary Search & BST
            {
                "doc_id": 2, "source_type": "ppt", "page": None, "slide": 18,
                "ts_start": None, "ts_end": None, "ts_sec": None,
                "topic": "Searching",
                "text": "Slide 18: Binary Search Key Properties\n- Requirement: Input array MUST be sorted\n- Comparison operator: Three-way comparison (less, equal, greater)\n- Recurrence: T(n) = T(n/2) + c\n- Space Complexity: O(1) iterative, O(log n) recursive call stack\n- In-Order Traversal of BST reproduces sorted array output directly."
            },
            # PPT Chunk 2: Slide 6 BST Properties
            {
                "doc_id": 2, "source_type": "ppt", "page": None, "slide": 6,
                "ts_start": None, "ts_end": None, "ts_sec": None,
                "topic": "Binary Search Trees",
                "text": "BST Property: For every node $x$, keys in left subtree are strictly $\\le x.key$, and keys in right subtree are $> x.key$. In-order traversal visits nodes in non-decreasing sorted order in $\\Theta(n)$ time."
            },
            # PPT Chunk 3: Slide 14 Priority Queues & Heaps
            {
                "doc_id": 2, "source_type": "ppt", "page": None, "slide": 14,
                "ts_start": None, "ts_end": None, "ts_sec": None,
                "topic": "Priority Queues & Heaps",
                "text": "A Min-Heap is stored in a 1-indexed array. For index $i$, Left Child is $2i$, Right Child is $2i+1$, and Parent is $\\lfloor i/2 \\rfloor$. Sift-down restores heap order in $O(\\log n)$ time, and Build-Heap executes in linear $O(n)$ time."
            },
            # Video Chunk 1: 12:42–13:18 Binary Search
            {
                "doc_id": 3, "source_type": "video", "page": None, "slide": None,
                "ts_start": "12:42", "ts_end": "13:18", "ts_sec": 762.0,
                "topic": "Searching",
                "text": "Binary search works by maintaining low and high bounds on a sorted array. At each iteration, we calculate mid = low + (high - low) / 2 and eliminate half of the remaining elements. Thus the runtime is strictly O(log n) compared to linear search which takes O(n)."
            },
            # Video Chunk 2: 14:20–16:45 Dijkstra
            {
                "doc_id": 3, "source_type": "video", "page": None, "slide": None,
                "ts_start": "14:20", "ts_end": "16:45", "ts_sec": 860.0,
                "topic": "Dijkstra Shortest Path",
                "text": "Dijkstra's Algorithm maintains tentative distances $d[v]$. At each step, extract vertex $u$ with minimum $d[u]$ from the Priority Queue, then relax each neighbor $v$: if $d[u] + w(u,v) < d[v]$, update $d[v] = d[u] + w(u,v)$ and decrease key in the heap. Note: Dijkstra fails on negative edge weights!"
            },
            # Video Chunk 3: 30:20–32:00 Graph BFS / DFS
            {
                "doc_id": 3, "source_type": "video", "page": None, "slide": None,
                "ts_start": "30:20", "ts_end": "32:00", "ts_sec": 1820.0,
                "topic": "Graphs",
                "text": "Graph traversals differ from tree traversals because graphs can contain cycles. Breadth-First Search (BFS) uses a FIFO queue to discover shortest paths in unweighted graphs level by level. Depth-First Search (DFS) uses a recursion call stack (LIFO) exploring as deep as possible along each branch before backtracking."
            }
        ]

        for i, c in enumerate(chunks_data, start=1):
            chunk = DocumentChunk(
                id=i,
                document_id=c["doc_id"],
                course_id=1,
                text=c["text"],
                source_type=c["source_type"],
                page=c["page"],
                slide=c["slide"],
                timestamp_start=c["ts_start"],
                timestamp_end=c["ts_end"],
                timestamp_sec=c["ts_sec"],
                topic=c["topic"],
                concept=c["topic"]
            )
            emb = get_embedding(c["text"])
            chunk.set_embedding(emb)
            db.add(chunk)
        db.commit()
        print(f"Created {len(chunks_data)} Document Chunks with LaTeX, Real Embeddings and Source Citations.")

        # 5. Create 2 Simulated Students (Scholar + Explorer)
        # Student 1: Scholar (Age 17, Scholar Dark, High XP)
        user_scholar = User(
            id=1,
            name="Aarav Sharma",
            email="scholar@aanvi.ai",
            age=17,
            grade="Grade 12",
            preferred_language="English",
            mode="scholar",
            xp=1450,
            stars=42,
            level=4,
            streak_days=7,
            child_safety_enabled=False
        )
        profile_scholar = UserProfile(
            user_id=1,
            age=17,
            grade="Grade 12",
            mode="scholar",
            bio="Focusing on competitive programming and asymptotic analysis."
        )
        settings_scholar = UserSettings(
            user_id=1,
            palette="a",
            theme="dark",
            sound_on=True,
            reduced_motion=False
        )
        streak_scholar = Streak(
            user_id=1,
            current_streak=7,
            max_streak=14,
            last_activity_date=datetime.utcnow()
        )

        # Student 2: Explorer (Age 12, Explorer Light, High Engagement)
        user_explorer = User(
            id=2,
            name="Maya Patel",
            email="explorer@aanvi.ai",
            age=12,
            grade="Grade 7",
            preferred_language="English",
            mode="explorer",
            xp=820,
            stars=35,
            level=3,
            streak_days=5,
            child_safety_enabled=True,
            guardian_email="parent.patel@gmail.com",
            guardian_consent=True
        )
        profile_explorer = UserProfile(
            user_id=2,
            age=12,
            grade="Grade 7",
            mode="explorer",
            bio="Loves visual puzzles, space themes, and quick break mini-games!"
        )
        settings_explorer = UserSettings(
            user_id=2,
            palette="a",
            theme="light",
            sound_on=True,
            reduced_motion=False
        )
        streak_explorer = Streak(
            user_id=2,
            current_streak=5,
            max_streak=9,
            last_activity_date=datetime.utcnow()
        )

        db.add_all([
            user_scholar, profile_scholar, settings_scholar, streak_scholar,
            user_explorer, profile_explorer, settings_explorer, streak_explorer
        ])
        db.commit()
        print("Created 2 Demo Users: Scholar (Aarav, 17) & Explorer (Maya, 12).")

        # 6. Seed BKT Masteries
        scholar_masteries = [
            ("Divide & Conquer", 0.92, 12, 11),
            ("Master Theorem", 0.88, 15, 13),
            ("Binary Search Trees", 0.95, 10, 10),
            ("Priority Queues & Heaps", 0.84, 9, 8),
            ("Dijkstra Shortest Path", 0.74, 8, 6)
        ]
        for top_name, score, att, corr in scholar_masteries:
            t = topic_objs.get(top_name)
            m = LearnerMastery(
                user_id=1,
                course_id=1,
                topic_id=t.id if t else None,
                topic_name=top_name,
                mastery_score=score,
                confidence=0.90,
                attempts_count=att,
                correct_count=corr
            )
            db.add(m)

        explorer_masteries = [
            ("Divide & Conquer", 0.78, 8, 6),
            ("Master Theorem", 0.45, 6, 3),
            ("Binary Search Trees", 0.70, 7, 5),
            ("Priority Queues & Heaps", 0.52, 5, 3),
            ("Dijkstra Shortest Path", 0.38, 4, 2)
        ]
        for top_name, score, att, corr in explorer_masteries:
            t = topic_objs.get(top_name)
            m = LearnerMastery(
                user_id=2,
                course_id=1,
                topic_id=t.id if t else None,
                topic_name=top_name,
                mastery_score=score,
                confidence=0.75,
                attempts_count=att,
                correct_count=corr
            )
            db.add(m)
        db.commit()
        print("Seeded BKT Mastery scores for both users.")

        # 7. Create 20 Assessment Questions with Citations & Explanations
        questions_pool = [
            # Topic 1: Divide & Conquer
            {
                "topic": "Divide & Conquer", "type": "MCQ", "difficulty": "easy",
                "question": "What are the three core steps in the Divide and Conquer algorithmic paradigm?",
                "options": ["Divide, Conquer, and Combine", "Search, Sort, and Index", "Hash, Map, and Reduce", "Branch, Bound, and Prune"],
                "answer": "Divide, Conquer, and Combine",
                "explanation": "Divide breaks the problem into subproblems; Conquer solves subproblems recursively; Combine merges subproblem solutions to solve the original instance.",
                "doc": "Chapter 4: Recurrences & Divide-and-Conquer", "page": 7, "slide": None, "ts": None, "src_type": "pdf"
            },
            {
                "topic": "Divide & Conquer", "type": "MCQ", "difficulty": "medium",
                "question": "In standard Merge Sort on an array of size $n$, what is the asymptotic runtime of the Merge step?",
                "options": ["$\\Theta(n)$", "$\\Theta(\\log n)$", "$\\Theta(n^2)$", "$\\Theta(1)$"],
                "answer": "$\\Theta(n)$",
                "explanation": "Merging two sorted subarrays of total size $n$ requires linearly comparing heads of arrays, taking exactly $\\Theta(n)$ operations.",
                "doc": "Chapter 4: Recurrences & Divide-and-Conquer", "page": 7, "slide": None, "ts": None, "src_type": "pdf"
            },
            {
                "topic": "Divide & Conquer", "type": "MCQ", "difficulty": "medium",
                "question": "What is the worst-case time complexity of standard Quicksort when the pivot is always the maximum element?",
                "options": ["$\\Theta(n^2)$", "$\\Theta(n \\log n)$", "$\\Theta(n)$", "$\\Theta(\\log n)$"],
                "answer": "$\\Theta(n^2)$",
                "explanation": "When the pivot is maximally unbalanced, the recursion depth is $n$ with partition cost $\\Theta(n)$, summing to $\\sum i = \\Theta(n^2)$.",
                "doc": "Chapter 4: Recurrences & Divide-and-Conquer", "page": 8, "slide": None, "ts": None, "src_type": "pdf"
            },
            {
                "topic": "Divide & Conquer", "type": "MCQ", "difficulty": "hard",
                "question": "Strassen's algorithm multiplies two $n \\times n$ matrices using how many recursive submatrix multiplications?",
                "options": ["7", "8", "6", "4"],
                "answer": "7",
                "explanation": "Strassen uses 7 multiplications instead of standard 8, yielding recurrence $T(n) = 7T(n/2) + \\Theta(n^2)$ with complexity $\\approx O(n^{2.807})$.",
                "doc": "Chapter 4: Recurrences & Divide-and-Conquer", "page": 10, "slide": None, "ts": None, "src_type": "pdf"
            },

            # Topic 2: Master Theorem
            {
                "topic": "Master Theorem", "type": "MCQ", "difficulty": "easy",
                "question": "What is the asymptotic bound for the recurrence $T(n) = 4T(n/2) + \\Theta(n)$ according to the Master Theorem?",
                "options": ["$\\Theta(n^2)$", "$\\Theta(n \\log n)$", "$\\Theta(n)$", "$\\Theta(n^{\\log_2 3})$"],
                "answer": "$\\Theta(n^2)$",
                "explanation": "Here $a=4, b=2$, so $\\log_b a = \\log_2 4 = 2$. Since $f(n) = \\Theta(n) = O(n^{2-\\epsilon})$ with $\\epsilon=1$, Master Theorem Case 1 yields $T(n) = \\Theta(n^2)$.",
                "doc": "Chapter 4: Recurrences & Divide-and-Conquer", "page": 4, "slide": None, "ts": None, "src_type": "pdf"
            },
            {
                "topic": "Master Theorem", "type": "MCQ", "difficulty": "medium",
                "question": "For the recurrence $T(n) = 2T(n/2) + \\Theta(n)$, which Master Theorem case applies and what is the resulting time complexity?",
                "options": ["Case 2: $\\Theta(n \\log n)$", "Case 1: $\\Theta(n^2)$", "Case 3: $\\Theta(n)$", "Case 2: $\\Theta(n \\log^2 n)$"],
                "answer": "Case 2: $\\Theta(n \\log n)$",
                "explanation": "$a=2, b=2 \\implies \\log_b a = 1$. Since $f(n) = \\Theta(n^1)$, this is Case 2 with $k=0$, resulting in $T(n) = \\Theta(n \\log n)$.",
                "doc": "Chapter 4: Recurrences & Divide-and-Conquer", "page": 4, "slide": None, "ts": None, "src_type": "pdf"
            },
            {
                "topic": "Master Theorem", "type": "MCQ", "difficulty": "medium",
                "question": "Why does the standard Master Theorem fail to apply to $T(n) = 2T(n/2) + n \\log n$?",
                "options": ["$f(n)$ is asymptotically larger than $n^{\\log_b a}$ by a logarithmic factor, not polynomial $n^\\epsilon$", "The coefficient $a < 1$", "The subproblem size $b \\le 1$", "$f(n)$ is negative"],
                "answer": "$f(n)$ is asymptotically larger than $n^{\\log_b a}$ by a logarithmic factor, not polynomial $n^\\epsilon$",
                "explanation": "Extended Master Theorem covers $n \\log^k n$, but standard Master Theorem requires a polynomial gap $n^\\epsilon$ for Case 3.",
                "doc": "Chapter 4: Recurrences & Divide-and-Conquer", "page": 5, "slide": None, "ts": None, "src_type": "pdf"
            },
            {
                "topic": "Master Theorem", "type": "MCQ", "difficulty": "hard",
                "question": "What is the solution for $T(n) = 3T(n/4) + n \\log n$ using Master Theorem Case 3?",
                "options": ["$\\Theta(n \\log n)$", "$\\Theta(n^{\\log_4 3})$", "$\\Theta(n^2)$", "$\\Theta(\\log^2 n)$"],
                "answer": "$\\Theta(n \\log n)$",
                "explanation": "$\\log_4 3 \\approx 0.793$. $f(n) = n \\log n = \\Omega(n^{0.793 + \\epsilon})$ with regularity $3(n/4 \\log(n/4)) \\le (3/4) n \\log n$, so Case 3 gives $\\Theta(n \\log n)$.",
                "doc": "Chapter 4: Recurrences & Divide-and-Conquer", "page": 5, "slide": None, "ts": None, "src_type": "pdf"
            },

            # Topic 3: Binary Search Trees
            {
                "topic": "Binary Search Trees", "type": "MCQ", "difficulty": "easy",
                "question": "Which tree traversal visits elements of a Binary Search Tree in sorted ascending order?",
                "options": ["In-order traversal", "Pre-order traversal", "Post-order traversal", "Level-order traversal"],
                "answer": "In-order traversal",
                "explanation": "In-order traversal recursively visits the Left Subtree, Root Node, and Right Subtree, preserving key ordering.",
                "doc": "Lecture 08: Binary Trees, Heaps & Priority Queues", "page": None, "slide": 6, "ts": None, "src_type": "ppt"
            },
            {
                "topic": "Binary Search Trees", "type": "MCQ", "difficulty": "medium",
                "question": "In an unbalanced BST with $n$ nodes, what is the worst-case search time complexity?",
                "options": ["$\\Theta(n)$", "$\\Theta(\\log n)$", "$\\Theta(1)$", "$\\Theta(n \\log n)$"],
                "answer": "$\\Theta(n)$",
                "explanation": "If keys are inserted in sorted order, the BST degenerates into a linear linked list of height $n$, making search $\\Theta(n)$.",
                "doc": "Lecture 08: Binary Trees, Heaps & Priority Queues", "page": None, "slide": 7, "ts": None, "src_type": "ppt"
            },
            {
                "topic": "Binary Search Trees", "type": "MCQ", "difficulty": "medium",
                "question": "What balance condition is strictly enforced in an AVL Tree?",
                "options": ["Balance factor $\\in \\{-1, 0, +1\\}$ for every node", "All leaves are at exact same depth", "Every node has exactly 2 children", "Height is always $\\le \\log_2 n$"],
                "answer": "Balance factor $\\in \\{-1, 0, +1\\}$ for every node",
                "explanation": "AVL trees require $|\\text{height}(left) - \\text{height}(right)| \\le 1$ for all nodes, guaranteeing $O(\\log n)$ height.",
                "doc": "Lecture 08: Binary Trees, Heaps & Priority Queues", "page": None, "slide": 9, "ts": None, "src_type": "ppt"
            },
            {
                "topic": "Binary Search Trees", "type": "MCQ", "difficulty": "hard",
                "question": "When deleting a node with two children in a BST, which node replaces it?",
                "options": ["In-order successor (minimum of right subtree) or in-order predecessor", "Rightmost leaf of left subtree only", "Direct parent node", "Left child directly"],
                "answer": "In-order successor (minimum of right subtree) or in-order predecessor",
                "explanation": "The in-order successor has at most one child and maintains the BST ordering when copied to the deleted node's slot.",
                "doc": "Lecture 08: Binary Trees, Heaps & Priority Queues", "page": None, "slide": 8, "ts": None, "src_type": "ppt"
            },

            # Topic 4: Priority Queues & Heaps
            {
                "topic": "Priority Queues & Heaps", "type": "MCQ", "difficulty": "easy",
                "question": "In a 1-indexed binary heap array, at which index is the left child of node $i$ located?",
                "options": ["$2i$", "$2i + 1$", "$i/2$", "$i + 2$"],
                "answer": "$2i$",
                "explanation": "In 1-indexed complete binary trees, left child is $2i$, right child is $2i+1$, and parent is $\\lfloor i/2 \\rfloor$.",
                "doc": "Lecture 08: Binary Trees, Heaps & Priority Queues", "page": None, "slide": 14, "ts": None, "src_type": "ppt"
            },
            {
                "topic": "Priority Queues & Heaps", "type": "MCQ", "difficulty": "medium",
                "question": "What is the time complexity of the Build-Heap algorithm on an unsorted array of $n$ items?",
                "options": ["$O(n)$", "$O(n \\log n)$", "$O(\\log n)$", "$O(n^2)$"],
                "answer": "$O(n)$",
                "explanation": "Bottom-up sift-down takes time proportional to height, bounded by $\\sum_{h=0}^{\\log n} \\frac{n}{2^{h+1}} O(h) = O(n)$.",
                "doc": "Lecture 08: Binary Trees, Heaps & Priority Queues", "page": None, "slide": 16, "ts": None, "src_type": "ppt"
            },
            {
                "topic": "Priority Queues & Heaps", "type": "MCQ", "difficulty": "medium",
                "question": "What is the time complexity to extract the minimum element and restore the min-heap property?",
                "options": ["$O(\\log n)$", "$O(1)$", "$O(n)$", "$O(n \\log n)$"],
                "answer": "$O(\\log n)$",
                "explanation": "Extracting root takes $O(1)$, moving last element to root takes $O(1)$, and sift-down takes $O(\\log n)$.",
                "doc": "Lecture 08: Binary Trees, Heaps & Priority Queues", "page": None, "slide": 15, "ts": None, "src_type": "ppt"
            },
            {
                "topic": "Priority Queues & Heaps", "type": "MCQ", "difficulty": "hard",
                "question": "A $d$-ary heap generalizes binary heaps. What is the time complexity of Extract-Min in a $d$-ary heap?",
                "options": ["$O(d \\log_d n)$", "$O(\\log_d n)$", "$O(d^2 \\log n)$", "$O(n/d)$"],
                "answer": "$O(d \\log_d n)$",
                "explanation": "Height is $\\log_d n$, but each level requires comparing $d$ children to find the minimum child during sift-down.",
                "doc": "Lecture 08: Binary Trees, Heaps & Priority Queues", "page": None, "slide": 20, "ts": None, "src_type": "ppt"
            },

            # Topic 5: Dijkstra Shortest Path
            {
                "topic": "Dijkstra Shortest Path", "type": "MCQ", "difficulty": "easy",
                "question": "Under what condition does Dijkstra's shortest path algorithm fail to produce the correct result?",
                "options": ["When edges have negative weights", "When the graph contains directed cycles", "When the graph is disconnected", "When edge weights are fractional"],
                "answer": "When edges have negative weights",
                "explanation": "Dijkstra relies on greedy subproblem optimality: once a node is settled, its distance is finalized. Negative edges violate this invariant.",
                "doc": "Lecture 14: Dijkstra's Algorithm & Greedy Graphs", "page": None, "slide": None, "ts": "14:20", "src_type": "video"
            },
            {
                "topic": "Dijkstra Shortest Path", "type": "MCQ", "difficulty": "medium",
                "question": "What is the running time of Dijkstra's algorithm implemented with a Min-Heap / Priority Queue?",
                "options": ["$O((V + E) \\log V)$", "$O(V^2)$", "$O(V E)$", "$O(V \\log E)$"],
                "answer": "$O((V + E) \\log V)$",
                "explanation": "$V$ Extract-Min operations take $O(V \\log V)$ and $E$ Decrease-Key operations take $O(E \\log V)$, summing to $O((V+E)\\log V)$.",
                "doc": "Lecture 14: Dijkstra's Algorithm & Greedy Graphs", "page": None, "slide": None, "ts": "15:45", "src_type": "video"
            },
            {
                "topic": "Dijkstra Shortest Path", "type": "MCQ", "difficulty": "medium",
                "question": "In Dijkstra's relaxation step for edge $(u,v)$ with weight $w(u,v)$, when is $d[v]$ updated?",
                "options": ["If $d[u] + w(u,v) < d[v]$", "If $d[u] + d[v] < w(u,v)$", "If $w(u,v) < d[v]$", "If $d[v] + w(u,v) < d[u]$"],
                "answer": "If $d[u] + w(u,v) < d[v]$",
                "explanation": "Relaxation tests whether passing through vertex $u$ yields a shorter path to $v$ than the current known distance $d[v]$.",
                "doc": "Lecture 14: Dijkstra's Algorithm & Greedy Graphs", "page": None, "slide": None, "ts": "15:10", "src_type": "video"
            },
            {
                "topic": "Dijkstra Shortest Path", "type": "MCQ", "difficulty": "hard",
                "question": "Using a Fibonacci Heap, what is the theoretical asymptotic time complexity of Dijkstra's algorithm?",
                "options": ["$O(E + V \\log V)$", "$O(V + E \\log V)$", "$O(E \\log V)$", "$O(V^2)$"],
                "answer": "$O(E + V \\log V)$",
                "explanation": "Fibonacci heaps achieve $O(1)$ amortized Decrease-Key and $O(\\log V)$ Extract-Min, giving $O(E + V \\log V)$.",
                "doc": "Lecture 14: Dijkstra's Algorithm & Greedy Graphs", "page": None, "slide": None, "ts": "16:30", "src_type": "video"
            }
        ]

        # Create an assessment container
        demo_assessment = Assessment(
            id=1,
            user_id=1,
            course_id=1,
            title="Comprehensive CS 201 Midterm Benchmark",
            topic="Core Algorithms & Data Structures",
            difficulty="mixed",
            total_questions=len(questions_pool),
            score=100.0,
            completed=True
        )
        db.add(demo_assessment)
        db.commit()

        for idx, q in enumerate(questions_pool, start=1):
            aq = AssessmentQuestion(
                id=idx,
                assessment_id=1,
                question_text=q["question"],
                question_type=q["type"],
                options_json=json.dumps(q["options"]),
                correct_answer=q["answer"],
                explanation=q["explanation"],
                topic=q["topic"],
                difficulty=q["difficulty"],
                source_type=q["src_type"],
                source_doc=q["doc"],
                source_page=q["page"],
                source_slide=q["slide"],
                source_timestamp=q["ts"],
                verified=True
            )
            db.add(aq)
        db.commit()
        print(f"Created {len(questions_pool)} Verified Assessment Questions with Multimodal Citations.")

        # 8. Create Chat Threads with Grounded Citations
        chat_thread = ChatThread(
            id=1,
            user_id=1,
            course_id=1,
            title="Master Theorem vs Dijkstra Analysis"
        )
        db.add(chat_thread)
        db.commit()

        msg1 = ChatMessage(
            id=1,
            thread_id=1,
            role="user",
            content="Can I use the Master Theorem to solve Dijkstra's recurrence?",
            is_grounded=True,
            confidence_score=1.0,
            is_safe=True
        )
        msg2 = ChatMessage(
            id=2,
            thread_id=1,
            role="assistant",
            content="No, the Master Theorem cannot be directly applied to Dijkstra's algorithm. \n\n**1. Why Master Theorem Doesn't Apply:**\nThe Master Theorem specifically solves divide-and-conquer recurrences of the algebraic form:\n$$T(n) = aT(n/b) + f(n)$$\nDijkstra's algorithm is not a divide-and-conquer algorithm; it is a **greedy graph traversal** algorithm that iteratively relaxes edges [Lecture 14: Dijkstra's Algorithm & Greedy Graphs, 14:20].\n\n**2. Dijkstra's Actual Complexity:**\nWhen using a binary min-heap, Dijkstra's running time is:\n$$O((V + E) \\log V)$$\nwhere $V$ is the number of vertices and $E$ is the number of edges [Lecture 14, 15:45]. Each vertex is extracted once ($O(V \\log V)$) and each edge may trigger a decrease-key operation ($O(E \\log V)$).",
            citations_json=json.dumps([
                {"doc_title": "Lecture 14: Dijkstra's Algorithm & Greedy Graphs", "source_type": "video", "timestamp": "14:20", "text": "Dijkstra's Algorithm is a greedy single-source shortest path algorithm."},
                {"doc_title": "Lecture 14: Dijkstra's Algorithm & Greedy Graphs", "source_type": "video", "timestamp": "15:45", "text": "Extract-Min takes O(V log V) and Decrease-Key takes O(E log V)."}
            ]),
            is_grounded=True,
            confidence_score=0.98,
            is_safe=True
        )
        db.add_all([msg1, msg2])
        db.commit()
        print("Created Grounded Chat Thread with Source Citations.")

        # 9. Create Badges and Mini-Game Plays
        badges_data = [
            (1, "streak_7", "7-Day Consistent Streak", "🔥"),
            (1, "master_theorem_pro", "Recurrence Solver Pro", "⚡"),
            (1, "graph_voyager", "Dijkstra Pathfinder", "🗺️"),
            (2, "bubble_popper", "Bubble Pop Master", "🫧"),
            (2, "star_catcher", "Star Constellation Hunter", "⭐")
        ]
        for uid, key, title, icon in badges_data:
            b = Badge(user_id=uid, badge_key=key, title=title, icon=icon)
            db.add(b)

        game_plays = [
            (2, "bubble_pop", 120, 50, 2),
            (2, "memory_match", 240, 80, 3),
            (2, "star_catch", 310, 100, 4)
        ]
        for uid, gtype, score, xp, stars in game_plays:
            gp = GamePlay(user_id=uid, game_type=gtype, score=score, xp_earned=xp, stars_earned=stars)
            db.add(gp)
        db.commit()
        print("Created Badges and Mini-Game records.")

        print("=" * 60)
        print("✅ OFFLINE DEMO SEEDING COMPLETED SUCCESSFULLY!")
        print("   - 1 Complete Course (CS 201)")
        print("   - 3 Multimodal Documents (PDF, Slides, Video)")
        print("   - 5 Topics with Prerequisite Graph")
        print("   - 2 Pre-configured Users (Scholar & Explorer)")
        print("   - 20 Grounded Exam Questions with Citations")
        print("   - BKT Mastery Profiles & Chat History Ready")
        print("=" * 60)

    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding offline demo: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_offline_demo()
