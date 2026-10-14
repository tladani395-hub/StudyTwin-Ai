import json
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import Course, Assessment, AssessmentQuestion, AssessmentSubmission, LearnerMastery, Document, CourseEnrollment, User
from app.database.schemas import (
    GenerateAssessmentRequest, AssessmentDetailResponse, QuestionSchema,
    SubmitAnswerRequest, QuestionFeedbackResponse, Citation
)
from app.assessment.generator import generate_adaptive_questions
from app.learner.mastery import BayesianKnowledgeTracer
from app.rag.citations import format_citation
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/assessments", tags=["assessments"])


@router.post("/generate", response_model=AssessmentDetailResponse)
def create_assessment(req: GenerateAssessmentRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not hasattr(current_user, "id"):
        user_id_cand = getattr(req, "user_id", None)
        if user_id_cand:
            current_user = db.query(User).filter(User.id == str(user_id_cand)).first()
        if not current_user:
            current_user = db.query(User).first()

    course = None
    if req.course_id:
        try:
            uuid.UUID(str(req.course_id).strip())
        except (ValueError, AttributeError):
            raise HTTPException(status_code=404, detail="Course not found")
        course = db.query(Course).filter(Course.id == str(req.course_id)).first()
    if not course:
        enr = db.query(CourseEnrollment).filter(CourseEnrollment.user_id == current_user.id).first()
        if enr:
            course = db.query(Course).filter(Course.id == enr.course_id, Course.is_archived.isnot(True)).first()
        if not course:
            course = db.query(Course).filter(Course.user_id == current_user.id, Course.is_archived.isnot(True)).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    is_enrolled = db.query(CourseEnrollment).filter(
        CourseEnrollment.course_id == str(course.id),
        CourseEnrollment.user_id == current_user.id
    ).first() is not None

    if course.user_id != current_user.id and not is_enrolled:
        raise HTTPException(status_code=404, detail="Course not found")

    questions_data = generate_adaptive_questions(
        course_id=str(course.id),
        db=db,
        topic=req.topic,
        difficulty=req.difficulty,
        num_questions=req.num_questions,
        allowed_types=req.types
    )

    assessment = Assessment(
        user_id=current_user.id,
        course_id=str(course.id),
        title=f"Adaptive Assessment: {req.topic or 'All Topics'} ({req.difficulty.capitalize()})",
        topic=req.topic,
        difficulty=req.difficulty,
        total_questions=len(questions_data),
        completed=False
    )

    db.add(assessment)
    db.commit()
    db.refresh(assessment)

    question_schemas: List[QuestionSchema] = []
    for qd in questions_data:
        q_record = AssessmentQuestion(
            assessment_id=assessment.id,
            question_text=qd["question_text"],
            question_type=qd["question_type"],
            options_json=json.dumps(qd.get("options", [])),
            correct_answer=qd["correct_answer"],
            explanation=qd["explanation"],
            topic=qd["topic"],
            difficulty=qd["difficulty"],
            source_type=qd.get("source_type", "pdf"),
            source_doc=qd.get("source_doc", "Course Material"),
            source_page=qd.get("source_page"),
            source_slide=qd.get("source_slide"),
            source_timestamp=qd.get("source_timestamp"),
            source_timestamp_sec=qd.get("source_timestamp_sec"),
            question_embedding_json=json.dumps(qd.get("embedding", [])),
            verified=True,
            misconception_hints_json=json.dumps(qd.get("misconception_hints", {}))
        )
        db.add(q_record)
        db.commit()
        db.refresh(q_record)

        citation = format_citation({
            "source_type": qd.get("source_type", "pdf"),
            "document": qd.get("source_doc", "Course Material"),
            "page": qd.get("source_page"),
            "slide": qd.get("source_slide"),
            "timestamp_start": qd.get("source_timestamp"),
            "timestamp_sec": qd.get("source_timestamp_sec"),
            "text": qd["explanation"]
        }, doc_id=1)

        question_schemas.append(QuestionSchema(
            id=q_record.id,
            question_text=q_record.question_text,
            question_type=q_record.question_type,
            options=json.loads(q_record.options_json or "[]"),
            topic=q_record.topic,
            difficulty=q_record.difficulty,
            source_citation=citation,
            verified=q_record.verified
        ))

    return AssessmentDetailResponse(
        id=assessment.id,
        course_id=assessment.course_id,
        title=assessment.title,
        topic=assessment.topic,
        difficulty=assessment.difficulty,
        total_questions=assessment.total_questions,
        questions=question_schemas
    )


@router.get("/{assessment_id}", response_model=AssessmentDetailResponse)
def get_assessment(assessment_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    if assessment.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Assessment not found")

    questions = db.query(AssessmentQuestion).filter(AssessmentQuestion.assessment_id == assessment_id).all()
    q_schemas = []
    for q in questions:
        citation = format_citation({
            "source_type": q.source_type,
            "document": q.source_doc,
            "page": q.source_page,
            "slide": q.source_slide,
            "timestamp_start": q.source_timestamp,
            "timestamp_sec": q.source_timestamp_sec,
            "text": q.explanation
        }, doc_id=1)

        q_schemas.append(QuestionSchema(
            id=q.id,
            question_text=q.question_text,
            question_type=q.question_type,
            options=json.loads(q.options_json or "[]"),
            topic=q.topic,
            difficulty=q.difficulty,
            source_citation=citation,
            verified=q.verified
        ))

    return AssessmentDetailResponse(
        id=assessment.id,
        course_id=assessment.course_id,
        title=assessment.title,
        topic=assessment.topic,
        difficulty=assessment.difficulty,
        total_questions=assessment.total_questions,
        questions=q_schemas
    )


@router.post("/submit-answer", response_model=QuestionFeedbackResponse)
@router.post("/{assessment_id}/answer", response_model=QuestionFeedbackResponse)
def submit_answer(req: SubmitAnswerRequest, assessment_id: Optional[int] = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not hasattr(current_user, "id"):
        user_id_cand = getattr(req, "user_id", None)
        if user_id_cand:
            current_user = db.query(User).filter(User.id == str(user_id_cand)).first()
        if not current_user:
            current_user = db.query(User).first()

    if assessment_id:
        req.assessment_id = assessment_id
    question = db.query(AssessmentQuestion).filter(AssessmentQuestion.id == req.question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    assessment = db.query(Assessment).filter(Assessment.id == req.assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    if assessment.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Assessment not found")

    course_id = assessment.course_id

    # Evaluate answer correctness
    user_clean = req.user_answer.strip().upper()
    correct_clean = question.correct_answer.strip().upper()

    is_correct = (user_clean == correct_clean)
    if not is_correct and question.options_json:
        # Check if user picked an option letter matching option text
        opts = json.loads(question.options_json)
        for opt in opts:
            if opt.strip().upper().startswith(user_clean) and correct_clean in opt.strip().upper():
                is_correct = True
                break

    # Look up misconception hint
    misconception_text = None
    if not is_correct and question.misconception_hints_json:
        hints = json.loads(question.misconception_hints_json)
        # Try matching user choice letter or substring
        for k, v in hints.items():
            if k.upper() in user_clean or user_clean in k.upper():
                misconception_text = v
                break
        if not misconception_text:
            misconception_text = f"You selected '{req.user_answer}', but '{question.correct_answer}' is the optimal correct answer."

    # Update Learner Mastery via Bayesian Knowledge Tracing
    mastery_rec = db.query(LearnerMastery).filter(
        LearnerMastery.user_id == current_user.id,
        LearnerMastery.course_id == course_id,
        LearnerMastery.topic_name == question.topic
    ).first()

    prior_score = mastery_rec.mastery_score if mastery_rec else 0.50
    new_mastery, delta = BayesianKnowledgeTracer.update_mastery(
        prior_mastery=prior_score,
        is_correct=is_correct,
        difficulty=question.difficulty
    )

    if mastery_rec:
        mastery_rec.mastery_score = new_mastery
        mastery_rec.attempts_count += 1
        if is_correct:
            mastery_rec.correct_count += 1
    else:
        mastery_rec = LearnerMastery(
            user_id=current_user.id,
            course_id=course_id,
            topic_name=question.topic,
            mastery_score=new_mastery,
            attempts_count=1,
            correct_count=1 if is_correct else 0
        )
        db.add(mastery_rec)
    db.commit()

    # Log submission
    submission = AssessmentSubmission(
        assessment_id=req.assessment_id,
        course_id=course_id,
        question_id=req.question_id,
        user_id=current_user.id,
        user_answer=req.user_answer,
        is_correct=is_correct,
        time_spent_sec=req.time_spent_sec or 15.0,
        mastery_delta=delta,
        feedback=question.explanation,
        misconception=misconception_text
    )
    db.add(submission)
    db.commit()


    citation = format_citation({
        "source_type": question.source_type,
        "document": question.source_doc,
        "page": question.source_page,
        "slide": question.source_slide,
        "timestamp_start": question.source_timestamp,
        "timestamp_sec": question.source_timestamp_sec,
        "text": question.explanation
    }, doc_id=1)

    return QuestionFeedbackResponse(
        is_correct=is_correct,
        user_answer=req.user_answer,
        correct_answer=question.correct_answer,
        explanation=question.explanation,
        misconception=misconception_text,
        source_citation=citation,
        mastery_delta=delta,
        new_topic_mastery=new_mastery,
        topic=question.topic
    )
