from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any, Literal, Union
from datetime import datetime


# User & Auth
class UserProfileSchema(BaseModel):
    id: str
    name: str
    email: str
    age: int = 16
    dob: Optional[str] = None
    grade: Optional[str] = "Grade 11"
    preferred_language: str = "English"
    guardian_email: Optional[str] = None
    guardian_consent: bool = False
    mode: str = "scholar"  # "explorer" or "scholar"
    xp: int = 500
    stars: int = 20
    level: int = 2
    streak_days: int = 5
    child_safety_enabled: bool = False
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class UserSignUpRequest(BaseModel):
    name: Optional[str] = None
    full_name: Optional[str] = None
    email: str
    password: str
    dob: Optional[str] = None
    date_of_birth: Optional[str] = None
    age: Optional[int] = None
    grade: Optional[str] = None
    school_grade: Optional[str] = None
    preferred_language: Optional[str] = "English"
    language: Optional[str] = "en"
    guardian_email: Optional[str] = None
    terms_accepted: bool = False
    mode: Optional[str] = None  # Client-sent mode is ignored/derived server-side


class UserLoginRequest(BaseModel):
    email: str
    password: str


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str


class DeleteAccountRequest(BaseModel):
    confirm_email: str
    password: str


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserProfileSchema


class UserBase(BaseModel):
    name: str = "Aanvi Student"
    email: str = "student@aanvi.ai"


class UserResponse(UserBase):
    id: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# Course
class CourseCreate(BaseModel):
    title: str
    subject: str
    description: Optional[str] = ""
    language: Optional[str] = "English"
    exam_date: Optional[str] = None
    user_id: Optional[str] = None


class GenerateSubjectPathRequest(BaseModel):
    subject_title: str
    target_goal: Optional[str] = "Master core concepts & practical applications"
    grade_level: Optional[str] = "High School / College"
    user_id: Optional[int] = 1
    mode: Optional[str] = "scholar"
    preferred_language: Optional[str] = "English"


class GeneratedTopicItem(BaseModel):
    id: Optional[Union[str, int]] = None
    name: str
    category: str
    description: str
    prerequisites: List[str] = []
    estimated_hours: float = 2.5
    mastery: float = 0.0


class SubjectPathResponse(BaseModel):
    course_id: Union[str, int]
    title: str
    subject: str
    description: str
    ai_research_summary: str
    curriculum_level: str
    topics: List[GeneratedTopicItem]
    prerequisite_dag: Dict[str, List[str]]
    milestones: List[str]
    document_count: int


class CourseResponse(BaseModel):
    id: Union[str, int]
    title: str
    subject: str
    description: Optional[str] = ""
    language: Optional[str] = "English"
    exam_date: Optional[str] = None
    is_archived: Optional[bool] = False
    created_at: Optional[datetime] = None
    document_count: Optional[int] = 0
    topic_count: Optional[int] = 0
    bkt_mastery_pct: Optional[float] = 0.0
    progress_pct: Optional[float] = 0.0
    due_reviews_count: Optional[int] = 0
    is_enrolled: Optional[bool] = True
    role: Optional[str] = "student"
    model_config = ConfigDict(from_attributes=True)


class JoinClassRequest(BaseModel):
    code: str
    user_id: Optional[str] = None


class JoinClassResponse(BaseModel):
    success: bool
    message: str
    class_id: str
    class_name: str
    code: str
    subject: str
    teacher_name: Optional[str] = None


class ClassResponse(BaseModel):
    id: str
    code: str
    name: str
    subject: str
    teacher_name: Optional[str] = None
    member_count: Optional[int] = 1
    created_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


# Document & Ingestion
class DocumentResponse(BaseModel):
    id: Union[str, int]
    course_id: Union[str, int]
    title: str
    file_name: str
    source_type: str
    status: str
    num_pages_or_slides: int
    total_duration_sec: float
    summary: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class Citation(BaseModel):
    source_type: str  # "pdf", "ppt", "video"
    document_title: str
    page: Optional[int] = None
    slide: Optional[int] = None
    timestamp: Optional[str] = None
    timestamp_sec: Optional[float] = None
    snippet: str
    open_url: str


# Tutor & Chat
class WebCitation(BaseModel):
    title: str
    url: str
    snippet: str
    domain: Optional[str] = None


class ChatQueryRequest(BaseModel):
    course_id: Optional[Union[str, int]] = None
    user_id: Optional[Union[str, int]] = None
    query: str
    mode: Optional[str] = "scholar"
    language: Optional[str] = None
    preferred_language: Optional[str] = "en"
    thread_id: Optional[int] = None
    allow_outside_knowledge: bool = False
    all_courses: Optional[bool] = False


class ChatQueryResponse(BaseModel):
    answer: str
    citations: List[Citation] = []
    sources: List[Citation] = []
    is_grounded: bool = True
    confidence_score: float = 0.95
    is_unsupported: bool = False
    refusal_reason: Optional[str] = None
    suggested_followups: List[str] = []
    web_sources: List[Dict[str, Any]] = []
    thread_id: Optional[int] = None
    learner_level_adapted: Optional[str] = "intermediate"
    is_safe: bool = True


TutorQueryRequest = ChatQueryRequest
TutorQueryResponse = ChatQueryResponse


# Assessment
class GenerateAssessmentRequest(BaseModel):
    course_id: Optional[Union[str, int]] = None
    user_id: Optional[Union[str, int]] = None
    topic: Optional[str] = "All"
    difficulty: Optional[str] = "medium"  # easy, medium, hard
    num_questions: Optional[int] = 4
    types: Optional[List[str]] = ["MCQ", "numerical", "short_answer"]


class QuestionSchema(BaseModel):
    id: Union[str, int]
    question_text: str
    options: Optional[List[str]] = None
    question_type: str
    difficulty: str
    topic: str
    target_misconception: Optional[str] = None
    bloom_level: str = "understanding"
    source_citation: Optional[Citation] = None
    verified: bool = True


class AssessmentDetailResponse(BaseModel):
    id: Union[str, int]
    course_id: Union[str, int]
    title: Optional[str] = "Assessment"
    topic: Optional[str] = "All"
    difficulty: Optional[str] = "medium"
    num_questions: Optional[int] = 0
    total_questions: Optional[int] = 0
    questions: List[QuestionSchema] = []
    created_at: Optional[datetime] = None


class SubmitAnswerRequest(BaseModel):
    assessment_id: Union[str, int]
    question_id: Union[str, int]
    user_id: Optional[Union[str, int]] = 1
    user_answer: str
    time_spent_sec: Optional[int] = 15


class AnswerFeedbackResponse(BaseModel):
    is_correct: bool
    correct_answer: str
    explanation: str
    misconception_detected: Optional[str] = None
    misconception: Optional[str] = None
    source_citation: Optional[Citation] = None
    citation: Optional[Citation] = None
    mastery_delta: float
    new_topic_mastery: float
    topic: str


QuestionFeedbackResponse = AnswerFeedbackResponse


# Learner Mastery & Diagnostic
class MasteryItem(BaseModel):
    topic_id: Optional[int] = None
    topic_name: str
    category: str
    mastery_score: float  # 0.0 to 1.0 (e.g., 0.82 = 82%)
    confidence: float
    attempts_count: int
    status: str  # "mastered" (>=0.80), "learning" (0.50-0.79), "weak" (<0.50)


class LearnerProfileResponse(BaseModel):
    user_id: int
    user_name: str
    course_id: int
    overall_mastery: float
    mastery_breakdown: List[MasteryItem]
    recommended_focus: str
    weak_topics: List[str]
    learning_streak_days: int = 4
    total_questions_solved: int = 24


class DiagnosticResultResponse(BaseModel):
    overall_score: float
    topic_scores: Dict[str, float]
    weak_areas: List[str]
    recommended_path: List[str]


# Knowledge Graph
class KnowledgeNode(BaseModel):
    id: str
    label: str
    category: str
    mastery: float
    status: str  # "mastered", "learning", "weak"
    prerequisites: List[str]
    description: Optional[str] = None


class KnowledgeEdge(BaseModel):
    source: str
    target: str
    relation: str = "prerequisite"


class KnowledgeGraphResponse(BaseModel):
    nodes: List[KnowledgeNode]
    edges: List[KnowledgeEdge]


# Study Plan
class GenerateStudyPlanRequest(BaseModel):
    course_id: Union[str, int]
    user_id: Optional[Union[str, int]] = 1
    exam_date: str  # e.g. "2026-10-25"
    available_hours_per_day: float = 2.0


class StudyPlanDay(BaseModel):
    day: int
    date: str
    topic: str
    activity: str
    duration_min: int
    status: str = "pending"
    rationale: str


class StudyPlanResponse(BaseModel):
    id: Union[str, int]
    course_id: Union[str, int]
    exam_date: str
    available_hours_per_day: float
    total_days: int
    days: List[StudyPlanDay]
    estimated_mastery_gain: float


# Settings Schemas
class SettingsResponse(BaseModel):
    palette: str = "a"  # "a" or "b"
    theme: str = "dark"  # "light", "dark", "system"
    sound_on: bool = False
    reduced_motion: bool = False
    updated_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


class SettingsUpdateRequest(BaseModel):
    palette: Optional[Literal["a", "b", "primary", "secondary"]] = None
    theme: Optional[Literal["light", "dark", "system"]] = None
    sound_on: Optional[bool] = None
    sound_enabled: Optional[bool] = None
    reduced_motion: Optional[bool] = None
