import json
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database import models
from app.services.dashboard_cache import invalidate_dashboard_cache

router = APIRouter(prefix="/api/demo", tags=["demo"])


@router.post("/seed")
def seed_demo_data(
    user_id: int = Query(1, description="User ID to seed: 1 for Scholar, 2 for Explorer"),
    db: Session = Depends(get_db)
):
    """
    Seeds rich, realistic database records for the demo accounts so dashboards are never empty.
    Includes:
    - 6+ quiz attempts across 3 weeks with improving trends
    - BKT mastery states with one weak topic rooted in a weak prerequisite
    - 1 overdue Spaced Repetition review item
    - XP events, badges, streak days, chat threads, and mini-game history.
    """
    now = datetime.utcnow()

    # 1. Ensure User Exists
    user = db.query(models.User).filter(models.User.id == str(user_id)).first()
    is_explorer = user_id == 2 or (user and user.mode == "explorer")

    if not user:
        user = models.User(
            id=str(user_id),
            name="Demo Explorer" if is_explorer else "Demo Scholar",
            email="explorer@aanvi.ai" if is_explorer else "scholar@aanvi.ai",
            age=14 if is_explorer else 17,
            grade="Grade 8" if is_explorer else "Grade 12 / College",
            mode="explorer" if is_explorer else "scholar"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        user.mode = "explorer" if is_explorer else "scholar"
        db.commit()

    # 2. Ensure Course Exists
    course = db.query(models.Course).filter(models.Course.id == 1).first()
    if not course:
        course = models.Course(
            id=1,
            user_id=str(user.id),
            title="Data Structures & Algorithms",
            subject="Computer Science",
            description="Foundational data structures, algorithmic complexity, recursion, and graph theory."
        )
        db.add(course)
        db.commit()
        db.refresh(course)

    # 3. Ensure Topics Exist with Prerequisite Chains
    topic_defs = [
        {"id": 1, "name": "Arrays & Hashing", "category": "Linear", "prereqs": [], "order": 1, "mastery_scholar": 0.88, "mastery_explorer": 0.85},
        {"id": 2, "name": "Binary Search", "category": "Linear", "prereqs": ["Arrays & Hashing"], "order": 2, "mastery_scholar": 0.82, "mastery_explorer": 0.78},
        {"id": 3, "name": "Linked Lists", "category": "Linear", "prereqs": ["Arrays & Hashing"], "order": 3, "mastery_scholar": 0.74, "mastery_explorer": 0.70},
        {"id": 4, "name": "Binary Trees", "category": "Hierarchical", "prereqs": ["Linked Lists"], "order": 4, "mastery_scholar": 0.54, "mastery_explorer": 0.52},  # Weak Topic!
        {"id": 5, "name": "Graph Traversal", "category": "Network", "prereqs": ["Binary Trees"], "order": 5, "mastery_scholar": 0.42, "mastery_explorer": 0.38},    # Weak Topic rooted in Binary Trees!
        {"id": 6, "name": "Dynamic Programming", "category": "Advanced", "prereqs": ["Binary Trees", "Graph Traversal"], "order": 6, "mastery_scholar": 0.30, "mastery_explorer": 0.25},
    ]

    for t_def in topic_defs:
        t = db.query(models.Topic).filter(
            (models.Topic.name == t_def["name"]) | (models.Topic.id == t_def["id"])
        ).first()
        if not t:
            t = models.Topic(
                course_id=1,
                name=t_def["name"],
                category=t_def["category"],
                prerequisites_json=json.dumps(t_def["prereqs"]),
                order_index=t_def["order"]
            )
            db.add(t)
        else:
            t.name = t_def["name"]
            t.category = t_def["category"]
            t.prerequisites_json = json.dumps(t_def["prereqs"])
            t.order_index = t_def["order"]
    db.commit()

    # 4. Seed Learner Mastery States (BKT Values)
    for t_def in topic_defs:
        m_score = t_def["mastery_explorer"] if is_explorer else t_def["mastery_scholar"]
        mastery = db.query(models.LearnerMastery).filter(
            models.LearnerMastery.user_id == user_id,
            models.LearnerMastery.course_id == 1,
            models.LearnerMastery.topic_name == t_def["name"]
        ).first()

        t_obj = db.query(models.Topic).filter(
            models.Topic.name == t_def["name"], models.Topic.course_id == 1
        ).first()
        t_id = t_obj.id if t_obj else None

        if not mastery:
            mastery = models.LearnerMastery(
                user_id=user_id,
                course_id=1,
                topic_id=t_id,
                topic_name=t_def["name"],
                mastery_score=m_score,
                confidence=0.85 if m_score > 0.70 else 0.55,
                attempts_count=8 if m_score > 0.70 else 4,
                correct_count=7 if m_score > 0.70 else 2,
                last_updated=now - timedelta(days=t_def["order"])
            )
            db.add(mastery)
        else:
            mastery.mastery_score = m_score
            mastery.attempts_count = 8 if m_score > 0.70 else 4
            mastery.correct_count = 7 if m_score > 0.70 else 2
            mastery.last_updated = now - timedelta(days=t_def["order"])
    db.commit()

    # 5. Seed Spaced Repetition Review Schedule
    # Item 1: Binary Search (Due in 3 days)
    # Item 2: Binary Trees (OVERDUE by 1 day)
    # Item 3: Arrays & Hashing (Due in 6 days)
    db.query(models.ReviewSchedule).filter(models.ReviewSchedule.user_id == user_id).delete()

    review_items = [
        {"topic": "Binary Search", "stability": 6.5, "next_days": 3},
        {"topic": "Binary Trees", "stability": 2.5, "next_days": -1},  # OVERDUE!
        {"topic": "Arrays & Hashing", "stability": 12.0, "next_days": 6},
    ]

    for r_def in review_items:
        r = models.ReviewSchedule(
            user_id=user_id,
            course_id=1,
            topic_name=r_def["topic"],
            stability=r_def["stability"],
            difficulty="medium",
            last_review_date=now - timedelta(days=abs(r_def["next_days"]) + 3),
            next_review_date=now + timedelta(days=r_def["next_days"]),
            retrievability=0.88 if r_def["next_days"] > 0 else 0.62
        )
        db.add(r)
    db.commit()

    # 6. Seed Assessment & Historical Submissions (3 Weeks)
    db.query(models.AssessmentSubmission).filter(models.AssessmentSubmission.user_id == user_id).delete()
    db.query(models.Assessment).filter(models.Assessment.user_id == user_id).delete()

    # Create 3 Assessment Quizzes
    for i in range(3):
        days_ago = (3 - i) * 6
        assessment = models.Assessment(
            user_id=user_id,
            course_id=1,
            title=f"Adaptive Diagnostic #{i+1}",
            topic="Data Structures & Algorithms",
            difficulty="medium",
            total_questions=3,
            score=80.0 if i > 0 else 60.0,
            completed=True,
            created_at=now - timedelta(days=days_ago)
        )
        db.add(assessment)
        db.commit()
        db.refresh(assessment)

        # Questions & Submissions
        for q_idx in range(3):
            q_days_ago = days_ago - q_idx
            q_topic = topic_defs[(i * 2 + q_idx) % len(topic_defs)]["name"]
            is_correct = (q_idx != 2) or (i == 2)

            q_obj = models.AssessmentQuestion(
                assessment_id=assessment.id,
                question_text=f"What is the average time complexity of searching in a balanced {q_topic}?",
                question_type="MCQ",
                options_json=json.dumps(["O(1)", "O(log n)", "O(n)", "O(n log n)"]),
                correct_answer="O(log n)" if "Tree" in q_topic or "Search" in q_topic else "O(1)",
                explanation=f"A balanced {q_topic} halves the search space at each step, yielding O(log n) performance.",
                topic=q_topic,
                difficulty="medium",
                source_type="pdf",
                source_doc=f"{q_topic} Core Textbook",
                source_page=12 + q_idx * 4,
                verified=True
            )
            db.add(q_obj)
            db.commit()
            db.refresh(q_obj)

            sub = models.AssessmentSubmission(
                assessment_id=assessment.id,
                question_id=q_obj.id,
                user_id=user_id,
                user_answer="O(log n)" if is_correct else "O(n)",
                is_correct=is_correct,
                time_spent_sec=32.5,
                mastery_delta=0.08 if is_correct else -0.04,
                feedback="Correct! Knowledge state updated." if is_correct else "Review recurrence relation.",
                misconception=None if is_correct else "Confused worst-case skewed tree with balanced tree height.",
                created_at=now - timedelta(days=q_days_ago)
            )
            db.add(sub)
    db.commit()

    # 7. Seed Streak & XP Events
    db.query(models.Streak).filter(models.Streak.user_id == user_id).delete()
    streak = models.Streak(
        user_id=user_id,
        current_streak=5,
        max_streak=7,
        last_activity_date=now
    )
    db.add(streak)

    db.query(models.XPEvent).filter(models.XPEvent.user_id == user_id).delete()
    xp_list = [
        {"type": "course_completion", "amount": 2000, "desc": "Foundational Placement XP", "days": 10},
        {"type": "quiz_answer", "amount": 25, "desc": "Correct answer on Binary Search", "days": 0},
        {"type": "game_play", "amount": 50, "desc": "Completed Star Catch Game", "days": 1},
        {"type": "chat_session", "amount": 15, "desc": "Grounded Tutor clarification", "days": 2},
        {"type": "quiz_answer", "amount": 25, "desc": "Correct answer on Arrays & Hashing", "days": 3},
        {"type": "spaced_review", "amount": 40, "desc": "Completed Spaced Review session", "days": 4},
    ]
    for xp_item in xp_list:
        xp_ev = models.XPEvent(
            user_id=user_id,
            event_type=xp_item["type"],
            amount=xp_item["amount"],
            description=xp_item["desc"],
            created_at=now - timedelta(days=xp_item["days"])
        )
        db.add(xp_ev)
    db.commit()

    # 8. Seed Badges
    badges_to_seed = [
        {"key": "first_steps", "title": "First Steps", "icon": "🌱", "days": 18},
        {"key": "quiz_master", "title": "Quiz Master", "icon": "🎯", "days": 8},
        {"key": "streak_warrior", "title": "Streak Champion", "icon": "🔥", "days": 1},
    ]
    for b in badges_to_seed:
        badge = db.query(models.Badge).filter(models.Badge.key == b["key"]).first()
        if not badge:
            badge = models.Badge(
                key=b["key"],
                title=b["title"],
                description=b["title"],
                icon=b["icon"]
            )
            db.add(badge)
            db.commit()
            db.refresh(badge)
        ub = db.query(models.UserBadge).filter(
            models.UserBadge.user_id == str(user_id),
            models.UserBadge.badge_id == badge.id
        ).first()
        if not ub:
            ub = models.UserBadge(
                user_id=str(user_id),
                badge_id=badge.id,
                awarded_at=now - timedelta(days=b["days"])
            )
            db.add(ub)
    db.commit()

    # 9. Seed Mini-Games History
    db.query(models.GamePlay).filter(models.GamePlay.user_id == user_id).delete()
    game_list = [
        {"type": "bubble_pop", "score": 120, "xp": 50, "stars": 2, "days": 0},
        {"type": "memory_match", "score": 95, "xp": 50, "stars": 2, "days": 2},
        {"type": "star_catch", "score": 150, "xp": 50, "stars": 3, "days": 4},
    ]
    for gm in game_list:
        gp = models.GamePlay(
            user_id=user_id,
            game_type=gm["type"],
            score=gm["score"],
            xp_earned=gm["xp"],
            stars_earned=gm["stars"],
            played_at=now - timedelta(days=gm["days"])
        )
        db.add(gp)
    db.commit()

    # Invalidate Cache
    invalidate_dashboard_cache(user_id)

    return {
        "status": "success",
        "message": f"Demo data seeded successfully for User {user_id} ({'Explorer' if is_explorer else 'Scholar'})",
        "user_id": user_id,
        "mode": "explorer" if is_explorer else "scholar",
        "total_xp": user.xp,
        "streak_days": 5
    }


@router.post("/reset")
def reset_demo_data(
    user_id: int = Query(1, description="User ID to reset"),
    db: Session = Depends(get_db)
):
    """
    Clears test attempts and returns student to a fresh baseline.
    """
    db.query(models.AssessmentSubmission).filter(models.AssessmentSubmission.user_id == user_id).delete()
    db.query(models.Assessment).filter(models.Assessment.user_id == user_id).delete()
    db.query(models.ReviewSchedule).filter(models.ReviewSchedule.user_id == user_id).delete()
    db.query(models.GamePlay).filter(models.GamePlay.user_id == user_id).delete()
    db.query(models.XPEvent).filter(models.XPEvent.user_id == user_id).delete()
    db.query(models.UserBadge).filter(models.UserBadge.user_id == str(user_id)).delete()

    # Reset masteries to 0.50
    masteries = db.query(models.LearnerMastery).filter(models.LearnerMastery.user_id == user_id).all()
    for m in masteries:
        m.mastery_score = 0.50
        m.attempts_count = 0
        m.correct_count = 0

    db.query(models.StreakDay).filter(models.StreakDay.user_id == str(user_id)).delete()

    user = db.query(models.User).filter(models.User.id == str(user_id)).first()
    if not user:
        user = models.User(
            id=str(user_id),
            name=f"Fresh Student {user_id}",
            email=f"fresh{user_id}@aanvi.ai",
            age=18 if user_id % 2 != 0 else 12,
            mode="scholar" if user_id % 2 != 0 else "explorer",
            xp=0
        )
        db.add(user)
    else:
        user.xp = 0

    db.commit()
    invalidate_dashboard_cache(user_id)

    return {
        "status": "success",
        "message": f"Demo data reset to clean baseline for User {user_id}",
        "user_id": user_id
    }
