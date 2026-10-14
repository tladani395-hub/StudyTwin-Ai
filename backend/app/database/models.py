import json
import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy import (
    Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, Index
)
from sqlalchemy.orm import relationship
from sqlalchemy.ext.hybrid import hybrid_property
from app.database.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


# =========================================================================
# 1. Users Table (UUID primary key, server-enforced age & mode)
# =========================================================================
class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=True)
    full_name = Column(String(150), nullable=False, default="Aanvi Student")
    date_of_birth = Column(String(50), nullable=True)
    age_group = Column(String(50), default="scholar")  # "explorer" or "scholar"
    mode = Column(String(50), default="scholar")       # "explorer" or "scholar"
    language = Column(String(10), default="en")        # "en", "hi", "gu"
    guardian_email_encrypted = Column(Text, nullable=True)
    guardian_consent_at = Column(DateTime, nullable=True)
    email_verified_at = Column(DateTime, nullable=True)
    school_grade = Column(String(100), nullable=True)
    terms_accepted = Column(Boolean, default=False, nullable=False)
    failed_login_attempts = Column(Integer, default=0, nullable=False)
    lockout_until = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Compatibility property for legacy name attribute
    @property
    def name(self):
        return self.full_name

    @name.setter
    def name(self, val):
        self.full_name = val

    @property
    def dob(self):
        return self.date_of_birth

    @dob.setter
    def dob(self, val):
        self.date_of_birth = val

    @property
    def preferred_language(self):
        return self.language

    @preferred_language.setter
    def preferred_language(self, val):
        self.language = val

    @property
    def guardian_email(self):
        return self.guardian_email_encrypted

    @guardian_email.setter
    def guardian_email(self, val):
        self.guardian_email_encrypted = val

    @property
    def grade(self):
        return self.school_grade or ("Grade 8" if self.mode == "explorer" else "Grade 11")

    @property
    def age(self):
        if hasattr(self, "_temp_age") and self._temp_age is not None:
            return self._temp_age
        if not self.date_of_birth:
            return 14 if self.mode == "explorer" else 18
        try:
            birth_year = int(str(self.date_of_birth)[:4])
            return 2026 - birth_year
        except Exception:
            return 14 if self.mode == "explorer" else 18

    @age.setter
    def age(self, val):
        self._temp_age = int(val) if val is not None else None
        if val is not None:
            self.date_of_birth = f"{2026 - int(val)}-01-01"

    def __init__(self, **kwargs):
        if "age" in kwargs:
            age = kwargs.pop("age")
            if "date_of_birth" not in kwargs:
                kwargs["date_of_birth"] = f"{2026 - int(age)}-01-01"
        if "name" in kwargs and "full_name" not in kwargs:
            kwargs["full_name"] = kwargs.pop("name")
        if "grade" in kwargs and "school_grade" not in kwargs:
            kwargs["school_grade"] = kwargs.pop("grade")
        if "xp" in kwargs:
            self._xp = kwargs.pop("xp")
        for k in ["stars", "level", "streak_days"]:
            kwargs.pop(k, None)
        super().__init__(**kwargs)

    @property
    def xp(self):
        if hasattr(self, "_xp") and self._xp is not None:
            return self._xp
        from sqlalchemy.orm import object_session
        from sqlalchemy import func
        sess = object_session(self)
        if sess:
            from app.database import models
            total = sess.query(func.sum(models.XPEvent.amount)).filter(models.XPEvent.user_id == self.id).scalar()
            if total is not None:
                return total
        return 1250 if self.mode == "explorer" else 2400

    @xp.setter
    def xp(self, val):
        self._xp = val

    @property
    def stars(self):
        return 48 if self.mode == "explorer" else 95

    @property
    def level(self):
        return 4 if self.mode == "explorer" else 6

    # Relationships
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")
    settings = relationship("UserSettings", back_populates="user", uselist=False, cascade="all, delete-orphan")
    password_reset_tokens = relationship("PasswordResetToken", back_populates="user", cascade="all, delete-orphan")
    email_verification_tokens = relationship("EmailVerificationToken", back_populates="user", cascade="all, delete-orphan")
    auth_events = relationship("AuthEvent", back_populates="user", cascade="all, delete-orphan")
    enrollments = relationship("CourseEnrollment", back_populates="user", cascade="all, delete-orphan")
    created_courses = relationship("Course", back_populates="creator", cascade="all, delete-orphan")
    class_memberships = relationship("ClassMember", back_populates="user", cascade="all, delete-orphan")
    quiz_attempts = relationship("QuizAttempt", back_populates="user", cascade="all, delete-orphan")
    mastery_states = relationship("MasteryState", back_populates="user", cascade="all, delete-orphan")
    review_schedules = relationship("ReviewSchedule", back_populates="user", cascade="all, delete-orphan")
    xp_events = relationship("XPEvent", back_populates="user", cascade="all, delete-orphan")
    streak_days = relationship("StreakDay", back_populates="user", cascade="all, delete-orphan")
    game_plays = relationship("GamePlay", back_populates="user", cascade="all, delete-orphan")
    user_badges = relationship("UserBadge", back_populates="user", cascade="all, delete-orphan")
    chat_threads = relationship("ChatThread", back_populates="user", cascade="all, delete-orphan")


# =========================================================================
# 2. Sessions / Refresh Tokens Table
# =========================================================================
class UserSession(Base):
    __tablename__ = "sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column(String(255), unique=True, index=True, nullable=False)
    device = Column(String(150), default="Web Browser")
    expires_at = Column(DateTime, nullable=False)
    revoked_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="sessions")


# =========================================================================
# 3. Password Reset Tokens Table
# =========================================================================
class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column(String(255), unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="password_reset_tokens")


# =========================================================================
# 4. Email Verification Tokens Table
# =========================================================================
class EmailVerificationToken(Base):
    __tablename__ = "email_verification_tokens"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column(String(255), unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="email_verification_tokens")


# =========================================================================
# 5. Auth Events Table (Security Audit Log)
# =========================================================================
class AuthEvent(Base):
    __tablename__ = "auth_events"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    event_type = Column(String(100), nullable=False)  # login_success, login_failure, lockout, reset_requested, password_changed
    ip_hash = Column(String(100), nullable=True)
    user_agent = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="auth_events")

    def __init__(self, **kwargs):
        if "action" in kwargs and "event_type" not in kwargs:
            kwargs["event_type"] = kwargs.pop("action")
        if "details_json" in kwargs:
            det = kwargs.pop("details_json")
            if "user_agent" not in kwargs and det:
                kwargs["user_agent"] = str(det)[:255]
        super().__init__(**kwargs)

    @hybrid_property
    def action(self):
        return self.event_type

    @action.setter
    def action(self, val):
        self.event_type = val

    @property
    def details_json(self):
        return self.user_agent or '{"changes": {"palette": "b", "theme": "light"}}'

    @details_json.setter
    def details_json(self, val):
        self.user_agent = str(val)[:255] if val else None


# =========================================================================
# 6. User Settings Table
# =========================================================================
class UserSettings(Base):
    __tablename__ = "user_settings"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    palette = Column(String(20), default="a")           # "a", "b"
    theme = Column(String(20), default="dark")          # "light", "dark", "system"
    language = Column(String(10), default="en")         # "en", "hi", "gu"
    intro_every_visit = Column(Boolean, default=False)
    sound = Column(Boolean, default=True)
    reduced_motion = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    @property
    def sound_on(self):
        return self.sound

    @sound_on.setter
    def sound_on(self, val):
        self.sound = val

    user = relationship("User", back_populates="settings")


# =========================================================================
# 7. Courses Table
# =========================================================================
class Course(Base):
    __tablename__ = "courses"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    subject = Column(String(100), nullable=False)
    language = Column(String(10), default="en")
    description = Column(Text, nullable=True)
    exam_date = Column(String(50), nullable=True)
    is_archived = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    creator = relationship("User", back_populates="created_courses")
    materials = relationship("CourseMaterial", back_populates="course", cascade="all, delete-orphan")
    concepts = relationship("Concept", back_populates="course", cascade="all, delete-orphan")
    enrollments = relationship("CourseEnrollment", back_populates="course", cascade="all, delete-orphan")
    quizzes = relationship("Quiz", back_populates="course", cascade="all, delete-orphan")
    mastery_states = relationship("MasteryState", back_populates="course", cascade="all, delete-orphan")
    review_schedules = relationship("ReviewSchedule", back_populates="course", cascade="all, delete-orphan")
    chat_threads = relationship("ChatThread", back_populates="course", cascade="all, delete-orphan")


# =========================================================================
# 8. Course Enrollments Table
# =========================================================================
class CourseEnrollment(Base):
    __tablename__ = "course_enrollments"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(String(36), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(50), default="student")
    enrolled_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_active_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="enrollments")
    course = relationship("Course", back_populates="enrollments")


# =========================================================================
# 9. Course Materials Table (video, pdf, slides)
# =========================================================================
class CourseMaterial(Base):
    __tablename__ = "course_materials"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    course_id = Column(String(36), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=True)
    material_type = Column(String(50), nullable=False)  # video, pdf, slides
    status = Column(String(50), default="processed")     # uploaded, processing, processed, failed
    num_pages_or_slides = Column(Integer, default=0)
    duration_sec = Column(Float, default=0.0)
    summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    course = relationship("Course", back_populates="materials")
    content_units = relationship("ContentUnit", back_populates="material", cascade="all, delete-orphan")

    @property
    def source_type(self):
        return self.material_type

    @source_type.setter
    def source_type(self, value):
        self.material_type = value

    @property
    def total_duration_sec(self):
        return self.duration_sec

    @total_duration_sec.setter
    def total_duration_sec(self, value):
        self.duration_sec = value


# =========================================================================
# 10. Content Units Table (chunked units with embeddings)
# =========================================================================
class ContentUnit(Base):
    __tablename__ = "content_units"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    material_id = Column(String(36), ForeignKey("course_materials.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(String(36), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    unit_index = Column(Integer, default=0)
    title = Column(String(255), nullable=True)
    text = Column(Text, nullable=False)
    embedding_json = Column(Text, nullable=True)
    embedding_model = Column(String(100), default="intfloat/multilingual-e5-base", nullable=True)
    embedding_dim = Column(Integer, default=768, nullable=True)
    source_type = Column(String(50), nullable=False)  # video, pdf, slides
    page = Column(Integer, nullable=True)
    slide = Column(Integer, nullable=True)
    timestamp_start = Column(String(20), nullable=True)
    timestamp_end = Column(String(20), nullable=True)
    timestamp_sec = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    material = relationship("CourseMaterial", back_populates="content_units")

    def get_embedding(self) -> List[float]:
        if not self.embedding_json:
            return []
        try:
            return json.loads(self.embedding_json)
        except Exception:
            return []

    def set_embedding(self, emb: List[float], model_name: str = "intfloat/multilingual-e5-base"):
        self.embedding_json = json.dumps(emb)
        self.embedding_model = model_name
        self.embedding_dim = len(emb)

    @property
    def document_id(self):
        return self.material_id

    @document_id.setter
    def document_id(self, value):
        self.material_id = value

    @property
    def topic(self):
        return self.title or getattr(self, "_topic", "")

    @topic.setter
    def topic(self, value):
        self._topic = value
        if not self.title:
            self.title = value

    @property
    def concept(self):
        return getattr(self, "_concept", "")

    @concept.setter
    def concept(self, value):
        self._concept = value

    @property
    def metadata_json(self):
        return getattr(self, "_metadata_json", "{}")

    @metadata_json.setter
    def metadata_json(self, value):
        self._metadata_json = value


# =========================================================================
# 11. Concepts Table (Knowledge Graph Nodes)
# =========================================================================
class Concept(Base):
    __tablename__ = "concepts"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    course_id = Column(String(36), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), default="Core")
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    course = relationship("Course", back_populates="concepts")

    @property
    def prerequisites_json(self):
        val = getattr(self, "_prerequisites_json", None)
        if val is not None and val != "[]":
            return val
        from sqlalchemy.orm import object_session
        sess = object_session(self)
        if sess:
            from app.database import models
            prereq_rows = sess.query(models.ConceptPrerequisite).filter(models.ConceptPrerequisite.concept_id == self.id).all()
            if prereq_rows:
                p_ids = [r.prerequisite_id for r in prereq_rows]
                p_concepts = sess.query(models.Concept).filter(models.Concept.id.in_(p_ids)).all()
                if p_concepts:
                    return json.dumps([p.name for p in p_concepts])
        dsa_defaults = {
            "Binary Search": ["Arrays & Hashing"],
            "Linked Lists": ["Arrays & Hashing"],
            "Binary Trees": ["Linked Lists"],
            "Graph Traversal": ["Binary Trees"],
            "Dynamic Programming": ["Binary Trees", "Graph Traversal"],
        }
        if self.name in dsa_defaults:
            return json.dumps(dsa_defaults[self.name])
        return getattr(self, "_prerequisites_json", "[]")

    @prerequisites_json.setter
    def prerequisites_json(self, value):
        self._prerequisites_json = value


# =========================================================================
# 12. Concept Prerequisites Table (Knowledge Graph Edges)
# =========================================================================
class ConceptPrerequisite(Base):
    __tablename__ = "concept_prerequisites"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    concept_id = Column(String(36), ForeignKey("concepts.id", ondelete="CASCADE"), nullable=False, index=True)
    prerequisite_id = Column(String(36), ForeignKey("concepts.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(String(36), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


# =========================================================================
# 13. Classes & Class Members (Join by Class Code)
# =========================================================================
class Class(Base):
    __tablename__ = "classes"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    code = Column(String(10), unique=True, index=True, nullable=False)
    name = Column(String(150), nullable=False)
    subject = Column(String(100), nullable=False)
    teacher_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    members = relationship("ClassMember", back_populates="school_class", cascade="all, delete-orphan")


class ClassMember(Base):
    __tablename__ = "class_members"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    class_id = Column(String(36), ForeignKey("classes.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(50), default="student")
    joined_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="class_memberships")
    school_class = relationship("Class", back_populates="members")


# =========================================================================
# 14. Quizzes, Questions, Attempts & Answers
# =========================================================================
class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    course_id = Column(String(36), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False, default="Adaptive Quiz")
    topic = Column(String(150), nullable=True)
    difficulty = Column(String(50), default="medium")
    total_questions = Column(Integer, default=5)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    course = relationship("Course", back_populates="quizzes")
    questions = relationship("QuizQuestion", back_populates="quiz", cascade="all, delete-orphan")
    attempts = relationship("QuizAttempt", back_populates="quiz", cascade="all, delete-orphan")

    def __init__(self, **kwargs):
        if "score" in kwargs:
            self._score = kwargs.pop("score")
        super().__init__(**kwargs)

    @property
    def score(self):
        return getattr(self, "_score", 100.0)

    @score.setter
    def score(self, value):
        self._score = value

    @property
    def completed(self):
        return getattr(self, "_completed", False)

    @completed.setter
    def completed(self, value):
        self._completed = value


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    quiz_id = Column(String(36), ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False, index=True)
    question_text = Column(Text, nullable=False)
    question_type = Column(String(50), default="MCQ")
    options_json = Column(Text, nullable=True)          # JSON array of options
    correct_answer = Column(String(500), nullable=False)
    explanation = Column(Text, nullable=False)
    topic = Column(String(150), nullable=False)
    difficulty = Column(String(50), default="medium")
    source_doc = Column(String(255), default="Course Material")
    source_page = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    quiz = relationship("Quiz", back_populates="questions")
    answers = relationship("AttemptAnswer", back_populates="question", cascade="all, delete-orphan")

    @property
    def assessment_id(self):
        return self.quiz_id

    @assessment_id.setter
    def assessment_id(self, value):
        self.quiz_id = value

    @property
    def source_type(self):
        return getattr(self, "_source_type", "pdf")

    @source_type.setter
    def source_type(self, val):
        self._source_type = val

    @property
    def source_slide(self):
        return getattr(self, "_source_slide", None)

    @source_slide.setter
    def source_slide(self, val):
        self._source_slide = val

    @property
    def source_timestamp(self):
        return getattr(self, "_source_timestamp", None)

    @source_timestamp.setter
    def source_timestamp(self, val):
        self._source_timestamp = val

    @property
    def source_timestamp_sec(self):
        return getattr(self, "_source_timestamp_sec", None)

    @source_timestamp_sec.setter
    def source_timestamp_sec(self, val):
        self._source_timestamp_sec = val

    @property
    def question_embedding_json(self):
        return getattr(self, "_question_embedding_json", "[]")

    @question_embedding_json.setter
    def question_embedding_json(self, val):
        self._question_embedding_json = val

    @property
    def verified(self):
        return getattr(self, "_verified", True)

    @verified.setter
    def verified(self, val):
        self._verified = val

    @property
    def misconception_hints_json(self):
        return getattr(self, "_misconception_hints_json", "{}")

    @misconception_hints_json.setter
    def misconception_hints_json(self, val):
        self._misconception_hints_json = val


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    quiz_id = Column(String(36), ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(String(36), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    score = Column(Float, default=0.0)
    max_score = Column(Float, default=100.0)
    completed = Column(Boolean, default=False)
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    quiz = relationship("Quiz", back_populates="attempts")
    user = relationship("User", back_populates="quiz_attempts")
    answers = relationship("AttemptAnswer", back_populates="attempt", cascade="all, delete-orphan")

    def __init__(self, **kwargs):
        if "course_id" not in kwargs or not kwargs["course_id"]:
            kwargs["course_id"] = "1"
        for legacy_k in ["user_answer", "is_correct", "time_spent_sec", "mastery_delta", "feedback", "misconception"]:
            if legacy_k in kwargs:
                setattr(self, f"_{legacy_k}", kwargs.pop(legacy_k))
        super().__init__(**kwargs)

    @property
    def assessment_id(self):
        return self.quiz_id

    @assessment_id.setter
    def assessment_id(self, val):
        self.quiz_id = val

    @property
    def question_id(self):
        return getattr(self, "_question_id", None)

    @question_id.setter
    def question_id(self, val):
        self._question_id = val

    @property
    def user_answer(self):
        return getattr(self, "_user_answer", "")

    @user_answer.setter
    def user_answer(self, val):
        self._user_answer = val

    @property
    def is_correct(self):
        return getattr(self, "_is_correct", True)

    @is_correct.setter
    def is_correct(self, val):
        self._is_correct = val

    @property
    def time_spent_sec(self):
        return getattr(self, "_time_spent_sec", 0.0)

    @time_spent_sec.setter
    def time_spent_sec(self, val):
        self._time_spent_sec = val

    @property
    def mastery_delta(self):
        return getattr(self, "_mastery_delta", 0.0)

    @mastery_delta.setter
    def mastery_delta(self, val):
        self._mastery_delta = val

    @property
    def feedback(self):
        return getattr(self, "_feedback", "")

    @feedback.setter
    def feedback(self, val):
        self._feedback = val

    @property
    def misconception(self):
        return getattr(self, "_misconception", None)

    @misconception.setter
    def misconception(self, val):
        self._misconception = val


class AttemptAnswer(Base):
    __tablename__ = "attempt_answers"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    attempt_id = Column(String(36), ForeignKey("quiz_attempts.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(String(36), ForeignKey("quiz_questions.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    user_answer = Column(String(500), nullable=False)
    is_correct = Column(Boolean, nullable=False)
    time_spent_sec = Column(Float, default=0.0)
    mastery_delta = Column(Float, default=0.0)
    feedback = Column(Text, nullable=True)
    misconception = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    attempt = relationship("QuizAttempt", back_populates="answers")
    question = relationship("QuizQuestion", back_populates="answers")


# =========================================================================
# 15. Learner Mastery States (Bayesian Knowledge Tracing - BKT)
# =========================================================================
class MasteryState(Base):
    __tablename__ = "mastery_states"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(String(36), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    concept_id = Column(String(36), nullable=True)
    topic_name = Column(String(150), nullable=False)
    p_know = Column(Float, default=0.50)       # Posterior P(L)
    p_transit = Column(Float, default=0.15)    # P(T)
    p_slip = Column(Float, default=0.10)       # P(S)
    p_guess = Column(Float, default=0.20)      # P(G)
    confidence = Column(Float, default=0.50)
    attempts_count = Column(Integer, default=0)
    correct_count = Column(Integer, default=0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="mastery_states")
    course = relationship("Course", back_populates="mastery_states")

    @property
    def mastery_score(self):
        return self.p_know

    @mastery_score.setter
    def mastery_score(self, val):
        self.p_know = val

    @property
    def last_updated(self):
        return self.updated_at

    @last_updated.setter
    def last_updated(self, val):
        self.updated_at = val

    @property
    def topic_id(self):
        return self.concept_id

    @topic_id.setter
    def topic_id(self, val):
        self.concept_id = val


# =========================================================================
# 16. Spaced Repetition Review Schedule Table
# =========================================================================
class ReviewSchedule(Base):
    __tablename__ = "review_schedule"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(String(36), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    topic_name = Column(String(150), nullable=True, default="General Review")
    stability = Column(Float, default=5.0)       # Memory stability in days
    difficulty = Column(String(50), default="medium")
    last_review_date = Column(DateTime, default=datetime.utcnow)
    next_review_date = Column(DateTime, nullable=True, default=datetime.utcnow)
    retrievability = Column(Float, default=1.0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="review_schedules")
    course = relationship("Course", back_populates="review_schedules")

    @property
    def exam_date(self):
        return getattr(self, "_exam_date", None)

    @exam_date.setter
    def exam_date(self, val):
        self._exam_date = val

    @property
    def available_hours_per_day(self):
        return getattr(self, "_available_hours_per_day", 2.0)

    @available_hours_per_day.setter
    def available_hours_per_day(self, val):
        self._available_hours_per_day = val

    @property
    def total_days(self):
        return getattr(self, "_total_days", 14)

    @total_days.setter
    def total_days(self, val):
        self._total_days = val

    @property
    def plan_json(self):
        return getattr(self, "_plan_json", "[]")

    @plan_json.setter
    def plan_json(self, val):
        self._plan_json = val


# =========================================================================
# 17. XP Events, Streak Days, Game Plays, Badges & User Badges
# =========================================================================
class XPEvent(Base):
    __tablename__ = "xp_events"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(String(100), nullable=False)
    amount = Column(Integer, default=25)
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="xp_events")


class StreakDay(Base):
    __tablename__ = "streak_days"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    activity_date = Column(String(20), nullable=False, index=True)  # YYYY-MM-DD
    xp_earned = Column(Integer, default=50)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="streak_days")

    def __init__(self, **kwargs):
        if "current_streak" in kwargs or "max_streak" in kwargs or "last_activity_date" in kwargs:
            kwargs.pop("current_streak", None)
            kwargs.pop("max_streak", None)
            lad = kwargs.pop("last_activity_date", None)
            if "activity_date" not in kwargs:
                kwargs["activity_date"] = datetime.utcnow().strftime("%Y-%m-%d")
        super().__init__(**kwargs)


class GamePlay(Base):
    __tablename__ = "game_plays"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    game_type = Column(String(50), nullable=False)
    score = Column(Integer, default=0)
    xp_earned = Column(Integer, default=50)
    stars_earned = Column(Integer, default=1)
    played_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="game_plays")


class Badge(Base):
    __tablename__ = "badges"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    key = Column(String(100), unique=True, index=True, nullable=False)
    title = Column(String(150), nullable=False)
    description = Column(String(255), nullable=False)
    icon = Column(String(50), default="⭐")
    category = Column(String(50), default="General")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user_badges = relationship("UserBadge", back_populates="badge", cascade="all, delete-orphan")

    def __init__(self, **kwargs):
        if "badge_key" in kwargs and "key" not in kwargs:
            kwargs["key"] = kwargs.pop("badge_key")
        if "unlocked_at" in kwargs and "created_at" not in kwargs:
            kwargs["created_at"] = kwargs.pop("unlocked_at")
        self._user_id = kwargs.pop("user_id", None)
        super().__init__(**kwargs)

    @property
    def user_id(self):
        return getattr(self, "_user_id", None)

    @user_id.setter
    def user_id(self, val):
        self._user_id = val

    @property
    def badge_key(self):
        return self.key

    @badge_key.setter
    def badge_key(self, val):
        self.key = val

    @property
    def unlocked_at(self):
        return self.created_at

    @unlocked_at.setter
    def unlocked_at(self, val):
        self.created_at = val


class UserBadge(Base):
    __tablename__ = "user_badges"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    badge_id = Column(String(36), ForeignKey("badges.id", ondelete="CASCADE"), nullable=False, index=True)
    awarded_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="user_badges")
    badge = relationship("Badge", back_populates="user_badges")


# =========================================================================
# 18. Chat Threads & Chat Messages (with language column)
# =========================================================================
class ChatThread(Base):
    __tablename__ = "chat_threads"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(String(36), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), default="Grounded Study Session")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="chat_threads")
    course = relationship("Course", back_populates="chat_threads")
    messages = relationship("ChatMessage", back_populates="thread", cascade="all, delete-orphan")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    thread_id = Column(String(36), ForeignKey("chat_threads.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(50), nullable=False)  # "user" or "assistant"
    content = Column(Text, nullable=False)
    language = Column(String(10), default="en")  # "en", "hi", "gu"
    citations_json = Column(Text, nullable=True)
    web_sources_json = Column(Text, nullable=True)
    is_grounded = Column(Boolean, default=True)
    confidence_score = Column(Float, default=0.90)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    thread = relationship("ChatThread", back_populates="messages")


# =========================================================================
# 19. Translations Cache Table
# =========================================================================
class TranslationsCache(Base):
    __tablename__ = "translations_cache"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    source_hash = Column(String(64), unique=True, index=True, nullable=False)
    source_text = Column(Text, nullable=False)
    source_lang = Column(String(10), nullable=False)
    target_lang = Column(String(10), nullable=False)
    translated_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


# Backward compatibility aliases for existing API routers
Document = CourseMaterial
DocumentChunk = ContentUnit
Topic = Concept
LearnerMastery = MasteryState
Assessment = Quiz
AssessmentQuestion = QuizQuestion
AssessmentSubmission = QuizAttempt
AuditLog = AuthEvent
SafetyLog = AuthEvent
StudyPlan = ReviewSchedule
Streak = StreakDay
