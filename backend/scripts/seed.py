import os
import sys
import uuid
from datetime import datetime, timedelta
import hashlib
from dotenv import load_dotenv

# Add backend directory to sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

load_dotenv(os.path.join(BASE_DIR, ".env"))

from sqlalchemy import text
from app.database.database import SessionLocal, engine
from app.database.models import (
    User, UserSession, UserSettings, Course, CourseEnrollment, CourseMaterial,
    ContentUnit, Concept, ConceptPrerequisite, Class, ClassMember,
    Quiz, QuizQuestion, QuizAttempt, AttemptAnswer, MasteryState,
    ReviewSchedule, XPEvent, StreakDay, GamePlay, Badge, UserBadge,
    ChatThread, ChatMessage, TranslationsCache, AuthEvent
)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode('utf-8')).hexdigest()


def seed_database():
    db = SessionLocal()
    print("Beginning comprehensive PostgreSQL data seed...")

    try:
        # 1. Clean existing seed data cleanly in order of FK dependencies
        tables_to_truncate = [
            "attempt_answers", "quiz_attempts", "quiz_questions", "quizzes",
            "concept_prerequisites", "content_units", "course_materials", "concepts",
            "course_enrollments", "chat_messages", "chat_threads",
            "mastery_states", "review_schedule", "xp_events", "streak_days",
            "game_plays", "user_badges", "badges", "class_members", "classes",
            "courses", "sessions", "password_reset_tokens", "email_verification_tokens",
            "auth_events", "user_settings", "translations_cache", "users"
        ]
        db.execute(text(f"TRUNCATE TABLE {', '.join(tables_to_truncate)} CASCADE;"))
        db.commit()
        print("Truncated existing tables.")

        # 2. Users: Demo Scholar (age 20) & Demo Explorer (age 12)
        scholar_id = "u-scholar-0001-0000-000000000001"
        explorer_id = "u-explorer-0002-0000-000000000002"

        scholar_user = User(
            id=scholar_id,
            email="scholar@aanvi.ai",
            password_hash=hash_token("ScholarPass123!"),
            full_name="Alex Rivera",
            date_of_birth="2006-03-15",  # Age 20 -> Scholar
            age_group="scholar",
            mode="scholar",
            language="en",
            guardian_email_encrypted=None,
            guardian_consent_at=None,
            email_verified_at=datetime.utcnow() - timedelta(days=60),
            is_active=True,
            created_at=datetime.utcnow() - timedelta(days=60),
            updated_at=datetime.utcnow()
        )

        explorer_user = User(
            id=explorer_id,
            email="explorer@aanvi.ai",
            password_hash=hash_token("ExplorerPass123!"),
            full_name="Maya Patel",
            date_of_birth="2014-06-20",  # Age 12 -> Explorer (under 16)
            age_group="explorer",
            mode="explorer",
            language="en",
            guardian_email_encrypted="parent.patel@gmail.com",
            guardian_consent_at=datetime.utcnow() - timedelta(days=30),
            email_verified_at=datetime.utcnow() - timedelta(days=30),
            is_active=True,
            created_at=datetime.utcnow() - timedelta(days=30),
            updated_at=datetime.utcnow()
        )
        db.add_all([scholar_user, explorer_user])
        db.commit()

        # 3. User Settings
        settings_scholar = UserSettings(
            user_id=scholar_id,
            palette="a",
            theme="dark",
            language="en",
            intro_every_visit=True,
            sound=True,
            reduced_motion=False,
            created_at=datetime.utcnow()
        )
        settings_explorer = UserSettings(
            user_id=explorer_id,
            palette="b",
            theme="dark",
            language="en",
            intro_every_visit=True,
            sound=True,
            reduced_motion=False,
            created_at=datetime.utcnow()
        )
        db.add_all([settings_scholar, settings_explorer])

        # 4. Sessions
        session_scholar = UserSession(
            user_id=scholar_id,
            token_hash=hash_token("session_token_scholar_live"),
            device="Chrome on Windows Desktop",
            expires_at=datetime.utcnow() + timedelta(days=30),
            created_at=datetime.utcnow()
        )
        session_explorer = UserSession(
            user_id=explorer_id,
            token_hash=hash_token("session_token_explorer_live"),
            device="Safari on iPad Tablet",
            expires_at=datetime.utcnow() + timedelta(days=30),
            created_at=datetime.utcnow()
        )
        db.add_all([session_scholar, session_explorer])

        # 5. Auth Events
        auth_ev1 = AuthEvent(
            user_id=scholar_id,
            event_type="login_success",
            ip_hash=hash_token("127.0.0.1"),
            user_agent="Mozilla/5.0 Windows",
            created_at=datetime.utcnow() - timedelta(hours=2)
        )
        auth_ev2 = AuthEvent(
            user_id=explorer_id,
            event_type="login_success",
            ip_hash=hash_token("127.0.0.1"),
            user_agent="Mozilla/5.0 iPad",
            created_at=datetime.utcnow() - timedelta(hours=1)
        )
        db.add_all([auth_ev1, auth_ev2])
        db.commit()

        # 6. Courses
        course_bio_id = "c-bio-0001-0000-000000000001"
        course_cs_id = "c-cs-0002-0000-000000000002"
        course_sci_id = "c-sci-0003-0000-000000000003"

        course_bio = Course(
            id=course_bio_id,
            user_id=scholar_id,
            title="Cellular Biology & Genetics",
            subject="Biology",
            language="en",
            description="Cell structure, mitosis, meiosis, DNA replication, and Mendelian inheritance.",
            exam_date="2026-11-20",
            created_at=datetime.utcnow() - timedelta(days=20)
        )
        course_cs = Course(
            id=course_cs_id,
            user_id=scholar_id,
            title="Data Structures & Graph Algorithms",
            subject="Computer Science",
            language="en",
            description="Arrays, Linked Lists, Trees, DAGs, Topological Sorting, and Shortest Path Algorithms.",
            exam_date="2026-12-05",
            created_at=datetime.utcnow() - timedelta(days=15)
        )
        course_sci = Course(
            id=course_sci_id,
            user_id=explorer_id,
            title="Adventures in Physical Science",
            subject="Science",
            language="en",
            description="Forces, energy, planetary motion, light, and sound for middle school explorers.",
            exam_date="2026-11-15",
            created_at=datetime.utcnow() - timedelta(days=10)
        )
        db.add_all([course_bio, course_cs, course_sci])
        db.commit()

        # 7. Course Enrollments
        enr1 = CourseEnrollment(user_id=scholar_id, course_id=course_bio_id, role="student", enrolled_at=datetime.utcnow() - timedelta(days=20))
        enr2 = CourseEnrollment(user_id=scholar_id, course_id=course_cs_id, role="student", enrolled_at=datetime.utcnow() - timedelta(days=15))
        enr3 = CourseEnrollment(user_id=explorer_id, course_id=course_sci_id, role="student", enrolled_at=datetime.utcnow() - timedelta(days=10))
        db.add_all([enr1, enr2, enr3])

        # 8. Course Materials (video, pdf, slides)
        mat_pdf = CourseMaterial(
            id="mat-pdf-0001",
            course_id=course_bio_id,
            user_id=scholar_id,
            title="Campbell Biology Chapter 12: Cell Cycle",
            file_name="cell_cycle_ch12.pdf",
            file_path="/uploads/cell_cycle_ch12.pdf",
            material_type="pdf",
            status="processed",
            num_pages_or_slides=28,
            summary="Comprehensive breakdown of cell division, G1, S, G2 phases, mitotic spindle checkpoints, and cytokinesis."
        )
        mat_video = CourseMaterial(
            id="mat-vid-0002",
            course_id=course_cs_id,
            user_id=scholar_id,
            title="Lecture 4: Directed Acyclic Graphs & Topological Sort",
            file_name="lecture4_dags.mp4",
            file_path="/uploads/lecture4_dags.mp4",
            material_type="video",
            status="processed",
            duration_sec=3140.0,
            summary="Video lecture discussing DAG definitions, cycle detection via DFS, Kahn's algorithm, and topological ordering."
        )
        mat_slides = CourseMaterial(
            id="mat-sld-0003",
            course_id=course_sci_id,
            user_id=explorer_id,
            title="Fun with Forces & Simple Machines",
            file_name="forces_machines.pptx",
            file_path="/uploads/forces_machines.pptx",
            material_type="slides",
            status="processed",
            num_pages_or_slides=18,
            summary="Visual slide deck explaining Newton's 3 laws, friction, levers, and pulleys with colorful real-world diagrams."
        )
        db.add_all([mat_pdf, mat_video, mat_slides])
        db.commit()

        # 9. Content Units
        cu1 = ContentUnit(
            material_id=mat_pdf.id,
            course_id=course_bio_id,
            unit_index=1,
            title="Mitosis Phases & Chromosome Segregation",
            text="During Prophase, chromatin condenses into distinct chromosomes. Spindle fibers attach to kinetochores during Prometaphase, aligning chromosomes at the Metaphase plate.",
            embedding_json="[0.021, -0.043, 0.089, 0.124]",
            source_type="pdf",
            page=14
        )
        cu2 = ContentUnit(
            material_id=mat_video.id,
            course_id=course_cs_id,
            unit_index=1,
            title="Cycle Detection in Prerequisite DAGs",
            text="A directed graph contains a cycle if and only if a depth-first search yields a back edge to an ancestor in the active recursion stack.",
            embedding_json="[-0.015, 0.062, 0.108, -0.045]",
            source_type="video",
            timestamp_start="14:20",
            timestamp_end="18:45",
            timestamp_sec=860.0
        )
        db.add_all([cu1, cu2])

        # 10. Concepts & Prerequisites
        conc_mitosis = Concept(id="conc-001", course_id=course_bio_id, name="Mitosis", description="Nuclear division in eukaryotic somatic cells.", category="Cell Biology", order_index=1)
        conc_meiosis = Concept(id="conc-002", course_id=course_bio_id, name="Meiosis", description="Two-round division producing four haploid gametes.", category="Cell Biology", order_index=2)
        conc_dag = Concept(id="conc-003", course_id=course_cs_id, name="Directed Acyclic Graphs", description="Graphs with directed edges and no directed cycles.", category="Graphs", order_index=1)
        conc_toposort = Concept(id="conc-004", course_id=course_cs_id, name="Topological Sort", description="Linear ordering of vertices in a DAG.", category="Graphs", order_index=2)
        db.add_all([conc_mitosis, conc_meiosis, conc_dag, conc_toposort])
        db.commit()

        prereq = ConceptPrerequisite(
            concept_id=conc_toposort.id,
            prerequisite_id=conc_dag.id,
            course_id=course_cs_id
        )
        db.add(prereq)

        # 11. Classes & Class Members
        school_class = Class(
            code="AANV88",
            name="Advanced Biology Honors Fall 2026",
            subject="Biology",
            teacher_id=scholar_id
        )
        db.add(school_class)
        db.commit()

        class_member = ClassMember(
            class_id=school_class.id,
            user_id=explorer_id,
            role="student"
        )
        db.add(class_member)

        # 12. Quizzes, Questions, Attempts, Answers
        quiz1 = Quiz(
            id="quiz-001",
            course_id=course_bio_id,
            user_id=scholar_id,
            title="Cell Cycle & Mitosis Checkpoint Mastery",
            topic="Mitosis",
            difficulty="medium",
            total_questions=3
        )
        db.add(quiz1)
        db.commit()

        qq1 = QuizQuestion(
            quiz_id=quiz1.id,
            question_text="During which phase of mitosis do sister chromatids separate toward opposite poles?",
            question_type="MCQ",
            options_json='["Prophase", "Metaphase", "Anaphase", "Telophase"]',
            correct_answer="Anaphase",
            explanation="During Anaphase, cohesin proteins are cleaved by separase, allowing sister chromatids to be pulled apart.",
            topic="Mitosis",
            difficulty="medium",
            source_doc="Campbell Biology Chapter 12",
            source_page=16
        )
        db.add(qq1)
        db.commit()

        qa1 = QuizAttempt(
            id="attempt-001",
            quiz_id=quiz1.id,
            user_id=scholar_id,
            course_id=course_bio_id,
            score=100.0,
            max_score=100.0,
            completed=True,
            started_at=datetime.utcnow() - timedelta(hours=3),
            completed_at=datetime.utcnow() - timedelta(hours=3, minutes=-5)
        )
        db.add(qa1)
        db.commit()

        ans1 = AttemptAnswer(
            attempt_id=qa1.id,
            question_id=qq1.id,
            user_id=scholar_id,
            user_answer="Anaphase",
            is_correct=True,
            time_spent_sec=14.5,
            mastery_delta=0.18,
            feedback="Spot-on! Cohesin cleavage enables simultaneous sister chromatid segregation."
        )
        db.add(ans1)

        # 13. Mastery States (BKT priors)
        ms1 = MasteryState(
            user_id=scholar_id,
            course_id=course_bio_id,
            concept_id=conc_mitosis.id,
            topic_name="Mitosis",
            p_know=0.88,
            confidence=0.92,
            attempts_count=6,
            correct_count=5
        )
        ms2 = MasteryState(
            user_id=scholar_id,
            course_id=course_cs_id,
            concept_id=conc_toposort.id,
            topic_name="Topological Sort",
            p_know=0.74,
            confidence=0.85,
            attempts_count=4,
            correct_count=3
        )
        ms3 = MasteryState(
            user_id=explorer_id,
            course_id=course_sci_id,
            topic_name="Newton's Laws",
            p_know=0.91,
            confidence=0.95,
            attempts_count=8,
            correct_count=8
        )
        db.add_all([ms1, ms2, ms3])

        # 14. Review Schedule (FSRS/Spaced Repetition)
        rs1 = ReviewSchedule(
            user_id=scholar_id,
            course_id=course_bio_id,
            topic_name="Mitosis",
            stability=7.5,
            difficulty="medium",
            last_review_date=datetime.utcnow() - timedelta(days=2),
            next_review_date=datetime.utcnow() + timedelta(days=5),
            retrievability=0.94
        )
        rs2 = ReviewSchedule(
            user_id=scholar_id,
            course_id=course_cs_id,
            topic_name="Topological Sort",
            stability=4.0,
            difficulty="hard",
            last_review_date=datetime.utcnow() - timedelta(days=1),
            next_review_date=datetime.utcnow() + timedelta(days=3),
            retrievability=0.87
        )
        db.add_all([rs1, rs2])

        # 15. XP Events, Streak Days, Game Plays
        xp1 = XPEvent(user_id=scholar_id, event_type="quiz_answer", amount=50, description="Completed Mitosis Assessment")
        xp2 = XPEvent(user_id=scholar_id, event_type="voice_query", amount=25, description="Audio query on topological sorting")
        xp3 = XPEvent(user_id=explorer_id, event_type="game_play", amount=60, description="Star Catch Level 3")
        db.add_all([xp1, xp2, xp3])

        today_str = datetime.utcnow().strftime("%Y-%m-%d")
        yest_str = (datetime.utcnow() - timedelta(days=1)).strftime("%Y-%m-%d")
        st1 = StreakDay(user_id=scholar_id, activity_date=today_str, xp_earned=75)
        st2 = StreakDay(user_id=scholar_id, activity_date=yest_str, xp_earned=120)
        st3 = StreakDay(user_id=explorer_id, activity_date=today_str, xp_earned=60)
        db.add_all([st1, st2, st3])

        gp1 = GamePlay(user_id=explorer_id, game_type="star_catch", score=480, xp_earned=60, stars_earned=3)
        db.add(gp1)

        # 16. Badges & User Badges
        b1 = Badge(key="quick_starter", title="Quick Starter", description="Completed first study session within 24 hours", icon="🚀", category="Milestone")
        b2 = Badge(key="mastery_streak", title="7-Day Streak Master", description="Maintained active study streak for 7 consecutive days", icon="🔥", category="Consistency")
        b3 = Badge(key="citation_sleuth", title="Citation Sleuth", description="Inspected 10 verified grounding source citations", icon="🔍", category="Accuracy")
        db.add_all([b1, b2, b3])
        db.commit()

        ub1 = UserBadge(user_id=scholar_id, badge_id=b1.id)
        ub2 = UserBadge(user_id=scholar_id, badge_id=b2.id)
        ub3 = UserBadge(user_id=explorer_id, badge_id=b1.id)
        db.add_all([ub1, ub2, ub3])

        # 17. Chat Threads & Messages (English, Hindi, Gujarati)
        th_en = ChatThread(user_id=scholar_id, course_id=course_bio_id, title="Mitosis Checkpoints Discussion")
        th_hi = ChatThread(user_id=scholar_id, course_id=course_cs_id, title="शीर्षवैज्ञानिक क्रमबद्धता (Topological Sort)")
        th_gu = ChatThread(user_id=explorer_id, course_id=course_sci_id, title="બળ અને ગતિના નિયમો (Forces & Motion)")
        db.add_all([th_en, th_hi, th_gu])
        db.commit()

        msg_en = ChatMessage(
            thread_id=th_en.id,
            user_id=scholar_id,
            role="assistant",
            content="The spindle assembly checkpoint (SAC) prevents anaphase onset until all kinetochores are properly attached to spindle microtubules.",
            language="en",
            citations_json='[{"doc": "cell_cycle_ch12.pdf", "page": 16, "excerpt": "M-checkpoint confirms kinetochore tension."}]',
            is_grounded=True
        )
        msg_hi = ChatMessage(
            thread_id=th_hi.id,
            user_id=scholar_id,
            role="assistant",
            content="शीर्षवैज्ञानिक क्रमबद्धता (Topological Sort) केवल निर्देशित अचक्रीय ग्राफ (DAG) में ही संभव है, क्योंकि चक्र उपस्थित होने पर कोई वैध क्रम नहीं बन सकता।",
            language="hi",
            citations_json='[{"doc": "lecture4_dags.mp4", "timestamp": "14:20", "excerpt": "Cycle prevents topological ordering."}]',
            is_grounded=True
        )
        msg_gu = ChatMessage(
            thread_id=th_gu.id,
            user_id=explorer_id,
            role="assistant",
            content="ન્યૂટનનો પહેલો નિયમ (Newton's First Law) જણાવે છે કે જ્યાં સુધી કોઈ બાહ્ય બળ ન લાગે ત્યાં સુધી પદાર્થ પોતાની સ્થિર અથવા નિયમિત ગતિ ચાલુ રાખે છે.",
            language="gu",
            citations_json='[{"doc": "forces_machines.pptx", "slide": 4, "excerpt": "Inertia maintains constant velocity."}]',
            is_grounded=True
        )
        db.add_all([msg_en, msg_hi, msg_gu])

        # 18. Translations Cache (en, hi, gu)
        def cache_entry(text_en, lang, trans):
            h = hashlib.sha256(f"{text_en}_{lang}".encode('utf-8')).hexdigest()
            return TranslationsCache(
                source_hash=h,
                source_text=text_en,
                source_lang="en",
                target_lang=lang,
                translated_text=trans
            )

        tc1 = cache_entry("Source-Grounded Adaptive AI Study Companion", "hi", "सटीक स्रोतों पर आधारित अनुकूली AI अध्ययन साथी")
        tc2 = cache_entry("Source-Grounded Adaptive AI Study Companion", "gu", "ચોક્કસ સ્રોતો આધારિત અનુકૂલનશીલ AI અભ્યાસ સાથી")
        tc3 = cache_entry("Tap to begin", "hi", "शुरू करने के लिए टैप करें")
        tc4 = cache_entry("Tap to begin", "gu", "શરૂ કરવા માટે ટેપ કરો")
        db.add_all([tc1, tc2, tc3, tc4])

        db.commit()
        print("Data seed completed successfully!")

    except Exception as e:
        db.rollback()
        print(f"Error during data seed: {e}")
        raise e
    finally:
        db.close()


def print_table_counts():
    db = SessionLocal()
    print("\n==================================================")
    print("      POSTGRESQL SEED ROW COUNTS PER TABLE        ")
    print("==================================================")
    tables = [
        "users", "user_settings", "sessions", "auth_events", "courses",
        "course_enrollments", "course_materials", "content_units", "concepts",
        "concept_prerequisites", "classes", "class_members", "quizzes",
        "quiz_questions", "quiz_attempts", "attempt_answers", "mastery_states",
        "review_schedule", "xp_events", "streak_days", "game_plays", "badges",
        "user_badges", "chat_threads", "chat_messages", "translations_cache"
    ]
    total_rows = 0
    for tbl in tables:
        count = db.execute(text(f"SELECT COUNT(*) FROM {tbl};")).scalar()
        print(f"  {tbl:<28} : {count:>4} rows")
        total_rows += count
    print("--------------------------------------------------")
    print(f"  {'TOTAL ROWS SEEDED':<28} : {total_rows:>4} rows")
    print("==================================================\n")
    db.close()


if __name__ == '__main__':
    seed_database()
    print_table_counts()
