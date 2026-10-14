"""
Query Layer with Mandatory Multi-Tenant User Isolation
Every student data access function strictly enforces user_id filtering.
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from app.database.models import (
    User, Course, CourseEnrollment, CourseMaterial, ContentUnit,
    Quiz, QuizAttempt, AttemptAnswer, MasteryState, ReviewSchedule,
    ChatThread, ChatMessage, UserSettings, XPEvent, StreakDay, GamePlay
)


class AccessDeniedException(Exception):
    """Raised when a user attempts to access rows belonging to another user."""
    pass


# 1. Course & Material Queries
def get_user_courses(db: Session, user_id: str) -> List[Course]:
    """Retrieve courses owned by or enrolled by user_id."""
    return (
        db.query(Course)
        .outerjoin(CourseEnrollment, CourseEnrollment.course_id == Course.id)
        .filter(
            (Course.user_id == user_id) | (CourseEnrollment.user_id == user_id),
            Course.is_archived == False
        )
        .distinct()
        .all()
    )


def get_user_course(db: Session, user_id: str, course_id: str) -> Optional[Course]:
    """Retrieve specific course only if user_id owns or is enrolled in it."""
    course = (
        db.query(Course)
        .outerjoin(CourseEnrollment, CourseEnrollment.course_id == Course.id)
        .filter(
            Course.id == course_id,
            (Course.user_id == user_id) | (CourseEnrollment.user_id == user_id)
        )
        .first()
    )
    return course


def get_user_materials(db: Session, user_id: str, course_id: str) -> List[CourseMaterial]:
    """Retrieve course materials only after verifying user_id has access to the course."""
    course = get_user_course(db, user_id, course_id)
    if not course:
        raise AccessDeniedException(f"User {user_id} does not have access to course {course_id}")
    return db.query(CourseMaterial).filter(CourseMaterial.course_id == course_id).all()


# 2. Quiz & Attempt Queries
def get_user_quizzes(db: Session, user_id: str, course_id: Optional[str] = None) -> List[Quiz]:
    """Retrieve quizzes within user's courses."""
    query = db.query(Quiz).join(Course, Course.id == Quiz.course_id).filter(
        (Course.user_id == user_id) | (Quiz.user_id == user_id)
    )
    if course_id:
        query = query.filter(Quiz.course_id == course_id)
    return query.all()


def get_user_quiz_attempts(db: Session, user_id: str, quiz_id: Optional[str] = None) -> List[QuizAttempt]:
    """Retrieve attempts strictly belonging to user_id."""
    query = db.query(QuizAttempt).filter(QuizAttempt.user_id == user_id)
    if quiz_id:
        query = query.filter(QuizAttempt.quiz_id == quiz_id)
    return query.all()


def get_user_attempt(db: Session, user_id: str, attempt_id: str) -> Optional[QuizAttempt]:
    """Retrieve specific attempt strictly verifying user_id ownership."""
    return db.query(QuizAttempt).filter(
        QuizAttempt.id == attempt_id,
        QuizAttempt.user_id == user_id
    ).first()


# 3. Mastery & Spaced Repetition Queries
def get_user_mastery_states(db: Session, user_id: str, course_id: Optional[str] = None) -> List[MasteryState]:
    """Retrieve BKT mastery states strictly for user_id."""
    query = db.query(MasteryState).filter(MasteryState.user_id == user_id)
    if course_id:
        query = query.filter(MasteryState.course_id == course_id)
    return query.all()


def get_user_review_schedules(db: Session, user_id: str, course_id: Optional[str] = None) -> List[ReviewSchedule]:
    """Retrieve spaced repetition review items strictly for user_id."""
    query = db.query(ReviewSchedule).filter(ReviewSchedule.user_id == user_id)
    if course_id:
        query = query.filter(ReviewSchedule.course_id == course_id)
    return query.all()


# 4. Chat Threads & Messages Queries
def get_user_chat_threads(db: Session, user_id: str, course_id: Optional[str] = None) -> List[ChatThread]:
    """Retrieve chat threads strictly belonging to user_id."""
    query = db.query(ChatThread).filter(ChatThread.user_id == user_id)
    if course_id:
        query = query.filter(ChatThread.course_id == course_id)
    return query.all()


def get_user_chat_messages(db: Session, user_id: str, thread_id: str) -> List[ChatMessage]:
    """Retrieve chat messages only if thread belongs to user_id."""
    thread = db.query(ChatThread).filter(
        ChatThread.id == thread_id,
        ChatThread.user_id == user_id
    ).first()
    if not thread:
        raise AccessDeniedException(f"User {user_id} does not have access to thread {thread_id}")
    return db.query(ChatMessage).filter(ChatMessage.thread_id == thread_id).order_by(ChatMessage.created_at.asc()).all()


# 5. User Settings & Activity Queries
def get_user_settings(db: Session, user_id: str) -> Optional[UserSettings]:
    """Retrieve settings strictly for user_id."""
    return db.query(UserSettings).filter(UserSettings.user_id == user_id).first()


def get_user_xp_events(db: Session, user_id: str) -> List[XPEvent]:
    """Retrieve XP events strictly for user_id."""
    return db.query(XPEvent).filter(XPEvent.user_id == user_id).order_by(XPEvent.created_at.desc()).all()


def get_user_streak_days(db: Session, user_id: str) -> List[StreakDay]:
    """Retrieve streak activity days strictly for user_id."""
    return db.query(StreakDay).filter(StreakDay.user_id == user_id).order_by(StreakDay.activity_date.desc()).all()
