from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any, Union
from datetime import datetime


class TopicMasteryItem(BaseModel):
    topic_id: Union[str, int]
    name: str
    category: str = "Core"
    mastery: float = 0.5  # 0.0 to 1.0
    attempts: int = 0
    correct_count: int = 0
    last_practiced: Optional[str] = None
    trend: str = "neutral"  # "up", "down", "neutral"
    unlocked: bool = True
    model_config = ConfigDict(from_attributes=True)


class WeakTopicItem(BaseModel):
    topic_id: Optional[Union[str, int]] = None
    topic: str
    mastery: float
    root_cause_prerequisite: Optional[str] = None
    root_cause_mastery: Optional[float] = None
    source_doc: Optional[str] = "Data Structures Textbook"
    source_page: Optional[int] = 1


class ForgettingCurveDayPoint(BaseModel):
    day: int
    date: str
    retention: float


class TopicForgettingCurve(BaseModel):
    topic: str
    stability_days: float
    next_review_date: str
    days_until_due: int
    is_overdue: bool
    retention_points: List[ForgettingCurveDayPoint]


class DueReviewItem(BaseModel):
    id: Union[str, int]
    topic: str
    stability: float
    due_date: str
    days_overdue: int
    priority: str  # "high", "medium", "low"


class DueReviewsSummary(BaseModel):
    count: int
    items: List[DueReviewItem]


class ExamReadinessSummary(BaseModel):
    exam_title: str = "Midterm Examination"
    date: str
    days_left: int
    readiness_score: float  # 0.0 to 1.0
    status: str  # "on_track", "needs_focus", "critical"
    focus_recommendation: str


class StreakDayItem(BaseModel):
    date: str  # "YYYY-MM-DD"
    count: int  # questions answered or minutes studied
    intensity: int  # 0 to 4 for github-style heatmap


class StreakSummary(BaseModel):
    current: int
    longest: int
    calendar_90d: List[StreakDayItem]


class WeeklyGoalSummary(BaseModel):
    target_questions: int = 50
    completed_questions: int = 34
    target_days: int = 5
    completed_days: int = 4
    progress_pct: float = 68.0


class XPSummary(BaseModel):
    total: int
    level: int
    progress_pct: float
    xp_to_next: int
    today_quest_title: str = "Daily Mastery Quest"
    today_quest_progress: int = 3
    today_quest_target: int = 5
    today_quest_done: bool = False


class BadgeSummary(BaseModel):
    badge_key: str
    title: str
    description: str
    icon: str
    earned: bool
    progress_pct: float
    unlocked_at: Optional[str] = None


class RecentActivityItem(BaseModel):
    id: Union[str, int]
    type: str  # "quiz", "chat", "game", "upload", "doubt"
    title: str
    subtitle: Optional[str] = None
    score: Optional[float] = None
    xp_earned: int = 25
    timestamp: str
    link: str = "/assessments"


class RecommendedNextAction(BaseModel):
    action_type: str  # "practice_weak_prereq", "spaced_review", "next_island", "diagnostic"
    title: str
    subtitle: str
    why: str
    link: str
    topic_name: Optional[str] = None
    source_doc: Optional[str] = None
    source_page: Optional[int] = None


class InsightCard(BaseModel):
    id: str
    title: str
    message: str
    delta: Optional[str] = None
    trend: str = "up"  # "up", "down", "tip"
    topic: Optional[str] = None


class DashboardSummaryResponse(BaseModel):
    user_id: Union[str, int]
    user_name: str
    mode: str
    course_id: Union[str, int]
    course_title: str
    overall_mastery: float
    change_7d: float
    topic_mastery: List[TopicMasteryItem]
    weak_topics: List[WeakTopicItem]
    forgetting_curve: List[TopicForgettingCurve]
    due_reviews: DueReviewsSummary
    exam: ExamReadinessSummary
    streak: StreakSummary
    weekly_goal: WeeklyGoalSummary
    xp: XPSummary
    badges: List[BadgeSummary]
    recent_activity: List[RecentActivityItem]
    recommended_next: RecommendedNextAction
    insights: List[InsightCard]
    is_demo_data: bool = False
    cached_at: Optional[str] = None


# Explorer Map Schemas
class ExplorerIsland(BaseModel):
    id: Union[str, int]
    name: str
    category: str
    emoji: str
    status: str  # "locked", "unlocked", "mastered"
    mastery: float
    stars: int
    total_stars: int = 3
    prerequisites: List[str] = []
    x_coord: float  # Percent position on map (10% to 90%)
    y_coord: float
    recommended: bool = False


class ExplorerTrail(BaseModel):
    from_island: str
    to_island: str
    completed: bool


class DashboardMapResponse(BaseModel):
    user_id: Union[str, int]
    user_name: str
    current_island: str
    total_stars: int
    xp: int
    level: int
    islands: List[ExplorerIsland]
    trails: List[ExplorerTrail]
    is_demo_data: bool = False
