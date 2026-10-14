import os
import pytest
from sqlalchemy import text
from app.database.database import get_test_engine
from sqlalchemy.orm import sessionmaker
from app.database.models import (
    User, Course, CourseEnrollment, CourseMaterial, Quiz,
    QuizAttempt, MasteryState, ReviewSchedule, ChatThread,
    ChatMessage, UserSettings
)
from app.database.query_layer import (
    get_user_courses, get_user_course, get_user_materials,
    get_user_quizzes, get_user_quiz_attempts, get_user_attempt,
    get_user_mastery_states, get_user_review_schedules,
    get_user_chat_threads, get_user_chat_messages, get_user_settings,
    AccessDeniedException
)

TestSession = sessionmaker(autocommit=False, autoflush=False)


@pytest.fixture(scope="module")
def db_session():
    engine = get_test_engine()
    TestSession.configure(bind=engine)
    session = TestSession()

    # Clean test tables
    tables_to_truncate = [
        "chat_messages", "chat_threads", "attempt_answers", "quiz_attempts",
        "quiz_questions", "quizzes", "mastery_states", "review_schedule",
        "content_units", "course_materials", "course_enrollments", "courses",
        "user_settings", "users"
    ]
    if engine.dialect.name == "sqlite":
        for t in tables_to_truncate:
            try:
                session.execute(text(f"DELETE FROM {t};"))
            except Exception:
                pass
    else:
        session.execute(text(f"TRUNCATE TABLE {', '.join(tables_to_truncate)} CASCADE;"))
    session.commit()

    # Seed User A (Scholar)
    user_a = User(
        id="user-a-scholar-1111",
        email="user_a@test.com",
        full_name="User A Scholar",
        mode="scholar",
        language="en"
    )
    # Seed User B (Explorer)
    user_b = User(
        id="user-b-explorer-2222",
        email="user_b@test.com",
        full_name="User B Explorer",
        mode="explorer",
        language="en"
    )
    session.add_all([user_a, user_b])
    session.commit()

    # Settings for both
    set_a = UserSettings(user_id=user_a.id, sound=True, palette="a")
    set_b = UserSettings(user_id=user_b.id, sound=False, palette="b")
    session.add_all([set_a, set_b])

    # Course owned by User A
    course_a = Course(
        id="course-a-1111",
        user_id=user_a.id,
        title="Scholar Private Biology",
        subject="Biology"
    )
    # Course owned by User B
    course_b = Course(
        id="course-b-2222",
        user_id=user_b.id,
        title="Explorer Private Science",
        subject="Science"
    )
    session.add_all([course_a, course_b])
    session.commit()

    # Materials
    mat_a = CourseMaterial(
        id="mat-a-1111",
        course_id=course_a.id,
        user_id=user_a.id,
        title="User A Cellular Mitosis PDF",
        file_name="mitosis_a.pdf",
        material_type="pdf"
    )
    mat_b = CourseMaterial(
        id="mat-b-2222",
        course_id=course_b.id,
        user_id=user_b.id,
        title="User B Simple Machines Slides",
        file_name="machines_b.pptx",
        material_type="slides"
    )
    session.add_all([mat_a, mat_b])

    # Quizzes
    quiz_b = Quiz(
        id="quiz-b-2222",
        course_id=course_b.id,
        user_id=user_b.id,
        title="Explorer Private Quiz",
        topic="Forces"
    )
    session.add(quiz_b)
    session.commit()

    attempt_b = QuizAttempt(
        id="attempt-b-2222",
        quiz_id=quiz_b.id,
        user_id=user_b.id,
        course_id=course_b.id,
        score=95.0
    )
    session.add(attempt_b)

    # Mastery
    ms_b = MasteryState(
        user_id=user_b.id,
        course_id=course_b.id,
        topic_name="Friction",
        p_know=0.88
    )
    session.add(ms_b)

    # Chat Thread & Message for User B
    thread_b = ChatThread(
        id="thread-b-2222",
        user_id=user_b.id,
        course_id=course_b.id,
        title="Private Discussion User B"
    )
    session.add(thread_b)
    session.commit()

    msg_b = ChatMessage(
        id="msg-b-2222",
        thread_id=thread_b.id,
        user_id=user_b.id,
        role="assistant",
        content="Confidential study notes for User B only."
    )
    session.add(msg_b)
    session.commit()

    yield session

    session.close()


def test_user_a_cannot_read_user_b_courses(db_session):
    """User A cannot view User B's courses in course listing"""
    user_a_courses = get_user_courses(db_session, user_id="user-a-scholar-1111")
    course_ids = [c.id for c in user_a_courses]
    assert "course-a-1111" in course_ids
    assert "course-b-2222" not in course_ids, "User A must NOT see User B's course"


def test_user_a_cannot_fetch_user_b_course_by_id(db_session):
    """User A fetching User B's course by ID returns None"""
    course = get_user_course(db_session, user_id="user-a-scholar-1111", course_id="course-b-2222")
    assert course is None, "Direct lookup of User B's course must return None for User A"


def test_user_a_cannot_access_user_b_course_materials(db_session):
    """User A requesting materials for User B's course raises AccessDeniedException"""
    with pytest.raises(AccessDeniedException):
        get_user_materials(db_session, user_id="user-a-scholar-1111", course_id="course-b-2222")


def test_user_a_cannot_read_user_b_quiz_attempts(db_session):
    """User A querying attempts returns empty list for User B's attempt"""
    user_a_attempts = get_user_quiz_attempts(db_session, user_id="user-a-scholar-1111")
    attempt_ids = [a.id for a in user_a_attempts]
    assert "attempt-b-2222" not in attempt_ids, "User A must NOT see User B's quiz attempts"

    # Direct ID query with User A's context returns None
    attempt = get_user_attempt(db_session, user_id="user-a-scholar-1111", attempt_id="attempt-b-2222")
    assert attempt is None, "Direct attempt lookup for User B's attempt must return None for User A"


def test_user_a_cannot_read_user_b_mastery_states(db_session):
    """User A cannot read User B's BKT mastery scores"""
    masteries = get_user_mastery_states(db_session, user_id="user-a-scholar-1111")
    assert len(masteries) == 0, "User A has no mastery states yet; must NOT see User B's"


def test_user_a_cannot_read_user_b_chat_threads_or_messages(db_session):
    """User A cannot list or read messages in User B's private chat thread"""
    threads = get_user_chat_threads(db_session, user_id="user-a-scholar-1111")
    assert len(threads) == 0

    with pytest.raises(AccessDeniedException):
        get_user_chat_messages(db_session, user_id="user-a-scholar-1111", thread_id="thread-b-2222")


def test_user_a_cannot_read_user_b_settings(db_session):
    """User A settings lookup returns only User A's settings"""
    settings_a = get_user_settings(db_session, user_id="user-a-scholar-1111")
    assert settings_a is not None
    assert settings_a.user_id == "user-a-scholar-1111"
    assert settings_a.sound is True
    assert settings_a.palette == "a"
