'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  BookOpen,
  Award,
  Check,
  Clock,
  Flame,
  Gamepad2,
  Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api, Question, QuestionFeedback, Citation } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { SourceModal } from './SourceModal';
import ExplorerStarCatch from '@/components/minigames/ExplorerStarCatch';
import ExplorerBubblePop from '@/components/minigames/ExplorerBubblePop';
import ExplorerMemoryMatch from '@/components/minigames/ExplorerMemoryMatch';
import ScholarTermScramble from '@/components/minigames/ScholarTermScramble';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';

interface QuizProps {
  questions: Question[];
  assessmentId: number | string;
  onFinish?: (finalScore: number) => void;
}

export const Quiz: React.FC<QuizProps> = ({ questions, assessmentId, onFinish }) => {
  const { user, mode, addXP, addStars } = useAuthStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [textInput, setTextInput] = useState<string>('');
  const [feedback, setFeedback] = useState<QuestionFeedback | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);

  // Timer State (60s per question)
  const QUESTION_TIME_LIMIT = 60;
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_LIMIT);
  const [showMiniGame, setShowMiniGame] = useState(false);
  const [miniGameCycleIndex, setMiniGameCycleIndex] = useState(0);
  const [breakTriggeredQuestions, setBreakTriggeredQuestions] = useState<number[]>([]);

  const currentQ = questions[currentIndex];

  const handleSubmit = useCallback(async (forcedAnswer?: string) => {
    const answer = forcedAnswer !== undefined ? forcedAnswer : (currentQ?.question_type === 'short_answer' ? textInput : selectedOption);
    if (!answer?.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const fb = await api.submitAnswer({
        assessment_id: assessmentId,
        question_id: currentQ.id,
        user_id: user?.id || 1,
        user_answer: answer,
        time_spent_sec: QUESTION_TIME_LIMIT - timeLeft,
      });

      setFeedback(fb);
      if (fb.is_correct) {
        setCorrectCount((prev) => prev + 1);
        addXP(25);
        addStars(1);
        try {
          confetti({
            particleCount: 60,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {
          // safe fallback
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  }, [currentQ, textInput, selectedOption, isSubmitting, assessmentId, user?.id, timeLeft, addXP, addStars]);

  // Timer countdown
  useEffect(() => {
    if (feedback || isCompleted || showMiniGame) return;

    if (timeLeft <= 0) {
      const fallbackAns = selectedOption || textInput || (currentQ?.options ? currentQ.options[0] : 'Timeout');
      handleSubmit(fallbackAns);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, feedback, isCompleted, showMiniGame, selectedOption, textInput, currentQ, handleSubmit]);

  const handleNext = () => {
    const currentQNum = currentIndex + 1;

    // Check if we should trigger mid-quiz mini-game break (every 3 questions)
    if (currentQNum % 3 === 0 && !breakTriggeredQuestions.includes(currentQNum) && currentIndex + 1 < questions.length) {
      setBreakTriggeredQuestions((prev) => [...prev, currentQNum]);
      setShowMiniGame(true);
      return;
    }

    setFeedback(null);
    setSelectedOption('');
    setTextInput('');
    setTimeLeft(QUESTION_TIME_LIMIT);

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
      if (onFinish) {
        onFinish(Math.round(((correctCount + (feedback?.is_correct ? 1 : 0)) / questions.length) * 100));
      }
    }
  };

  const resumeAfterMiniGame = () => {
    setShowMiniGame(false);
    setMiniGameCycleIndex((prev) => prev + 1);
    setFeedback(null);
    setSelectedOption('');
    setTextInput('');
    setTimeLeft(QUESTION_TIME_LIMIT);
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  if (!questions || questions.length === 0) {
    return (
      <div className="p-8 text-center bg-bg-surface rounded-card border border-border-subtle text-text-muted">
        No assessment questions generated. Please choose a topic and click Generate.
      </div>
    );
  }

  // Mid-quiz Mini-Game Break Screen (every 3 questions)
  if (showMiniGame) {
    const gamePick = miniGameCycleIndex % 3;
    return (
      <div className="max-w-2xl mx-auto">
        {mode === 'explorer' ? (
          gamePick === 0 ? (
            <ExplorerStarCatch
              onComplete={() => resumeAfterMiniGame()}
              onSkip={() => resumeAfterMiniGame()}
            />
          ) : gamePick === 1 ? (
            <ExplorerBubblePop
              onComplete={() => resumeAfterMiniGame()}
              onSkip={() => resumeAfterMiniGame()}
            />
          ) : (
            <ExplorerMemoryMatch
              onComplete={() => resumeAfterMiniGame()}
              onSkip={() => resumeAfterMiniGame()}
            />
          )
        ) : (
          <ScholarTermScramble
            onComplete={() => resumeAfterMiniGame()}
            onSkip={() => resumeAfterMiniGame()}
          />
        )}
      </div>
    );
  }

  // Completion Screen
  if (isCompleted) {
    const finalPct = Math.round((correctCount / questions.length) * 100);
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-8 rounded-card bg-bg-surface border border-border-subtle text-center space-y-6 shadow-card max-w-xl mx-auto"
      >
        <div className="w-16 h-16 rounded-full bg-primary/15 text-primary border border-primary/30 flex items-center justify-center mx-auto shadow-md">
          <Award className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-display font-bold text-text-main">Assessment Completed!</h2>
          <p className="text-xs text-text-muted">
            Your mastery profile has been dynamically updated via Bayesian Knowledge Tracing.
          </p>
        </div>

        <div className="p-6 rounded-card bg-bg-app border border-border-subtle grid grid-cols-2 gap-4">
          <div>
            <span className="text-xs text-text-muted">Score Achieved</span>
            <p className="text-2xl font-extrabold font-mono text-primary mt-1">{finalPct}%</p>
          </div>
          <div>
            <span className="text-xs text-text-muted">Correct Answers</span>
            <p className="text-2xl font-extrabold font-mono text-text-main mt-1">
              {correctCount} / {questions.length}
            </p>
          </div>
        </div>

        <div className="flex justify-center gap-3">
          <button
            onClick={() => {
              setIsCompleted(false);
              setCurrentIndex(0);
              setCorrectCount(0);
              setFeedback(null);
              setTimeLeft(QUESTION_TIME_LIMIT);
              setBreakTriggeredQuestions([]);
            }}
            className="px-5 py-2.5 rounded-btn bg-bg-elevated border border-border-subtle hover:bg-bg-app text-text-main text-xs font-semibold transition-colors"
          >
            Retake Assessment
          </button>
          <a
            href="/results"
            className="px-6 py-2.5 rounded-btn bg-primary hover:opacity-90 text-white text-xs font-bold transition-all shadow-md"
          >
            View Mastery Delta &amp; Feedback
          </a>
        </div>
      </motion.div>
    );
  }

  // Calculate timer warnings (25% and 10%)
  const isWarning25 = timeLeft <= Math.floor(QUESTION_TIME_LIMIT * 0.25);
  const isWarning10 = timeLeft <= Math.floor(QUESTION_TIME_LIMIT * 0.10);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Quiz Progress & Question Meta */}
      <div className="flex items-center justify-between px-1 gap-2 flex-wrap">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-primary/15 text-primary border border-primary/30">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-bg-surface text-text-muted border border-border-subtle">
            {currentQ.topic} • {currentQ.difficulty.toUpperCase()}
          </span>
        </div>

        {/* TIMER BAR (Rocket Fuel for Explorer vs Circular Ring for Scholar) */}
        <div className="flex items-center gap-3">
          {mode === 'explorer' ? (
            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-btn border-2 font-bold text-xs transition-colors ${
                isWarning10
                  ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse'
                  : isWarning25
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                  : 'bg-accent/15 border-accent/40 text-accent'
              }`}
            >
              <span>🚀 Fuel: {timeLeft}s</span>
              <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ${
                    isWarning10 ? 'bg-red-500' : isWarning25 ? 'bg-amber-400' : 'bg-primary'
                  }`}
                  style={{ width: `${(timeLeft / QUESTION_TIME_LIMIT) * 100}%` }}
                />
              </div>
            </div>
          ) : (
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full border font-mono text-xs transition-colors ${
                isWarning10
                  ? 'bg-red-500/10 border-red-500/40 text-red-400 animate-pulse'
                  : isWarning25
                  ? 'bg-amber-500/10 border-amber-400/30 text-amber-400'
                  : 'bg-bg-surface border-border-subtle text-text-muted'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>⏱ {timeLeft}s</span>
            </div>
          )}

          {/* Verified Badge */}
          <div className="flex items-center space-x-1.5 text-xs text-primary font-mono px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/30 font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verified ✓</span>
          </div>
        </div>
      </div>

      {/* Question Card */}
      <div className="p-6 sm:p-8 rounded-card bg-bg-surface border border-border-subtle shadow-card space-y-6">
        <div className="text-lg sm:text-xl font-display font-semibold text-text-main leading-snug">
          <MarkdownRenderer content={currentQ.question_text} />
        </div>

        {/* Question Options or Input */}
        {!feedback && (
          <div className="space-y-3 pt-2">
            {currentQ.options && currentQ.options.length > 0 ? (
              currentQ.options.map((opt, idx) => {
                const isSelected = selectedOption === opt || selectedOption === opt[0];
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedOption(opt)}
                    className={`w-full text-left p-4 rounded-btn border text-xs sm:text-sm font-medium transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-bg-elevated border-primary text-text-main shadow-md'
                        : 'bg-bg-app border-border-subtle text-text-muted hover:border-primary/40 hover:text-text-main'
                    }`}
                  >
                    <span>{opt}</span>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-primary bg-primary text-white' : 'border-border-subtle'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="space-y-3">
                <textarea
                  rows={3}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Type your mathematical answer or explanation..."
                  className="w-full p-4 rounded-btn bg-bg-app border border-border-subtle text-text-main text-xs sm:text-sm focus:outline-none focus:border-primary"
                />
              </div>
            )}

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={isSubmitting || (!selectedOption && !textInput.trim())}
                className="px-6 py-3 rounded-btn bg-primary hover:opacity-90 disabled:opacity-40 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
              >
                <span>{isSubmitting ? 'Evaluating with Verifier...' : 'Submit Answer'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Post-submission Pedagogical & Misconception Feedback */}
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 rounded-card border space-y-4 ${
              feedback.is_correct
                ? 'bg-emerald-500/10 border-emerald-500/30 text-text-main'
                : 'bg-red-500/10 border-red-500/30 text-text-main'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {feedback.is_correct ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-400" />
                )}
                <span className="font-display font-bold text-base text-text-main">
                  {feedback.is_correct ? 'Correct! Knowledge State Updated' : 'Needs Review — Targeted Misconception Identified'}
                </span>
              </div>

              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/30">
                Mastery Delta: {feedback.is_correct ? '+8%' : '-4%'}
              </span>
            </div>

            {/* Targeted Misconception */}
            {!feedback.is_correct && (feedback.misconception_detected || feedback.misconception) && (
              <div className="p-3.5 rounded-btn bg-bg-surface border border-red-500/30 text-xs text-text-main flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-primary">Diagnosed Misconception:</strong>
                  {feedback.misconception_detected || feedback.misconception}
                </div>
              </div>
            )}

            {/* Pedagogical Explanation */}
            <div className="text-xs text-text-muted leading-relaxed">
              <strong className="text-text-main block mb-1">Source-Grounded Explanation:</strong>
              <MarkdownRenderer content={feedback.explanation} />
            </div>

            {/* Citation Deep Link */}
            {(feedback.citation || feedback.source_citation) && (
              <div className="pt-2 border-t border-border-subtle flex flex-wrap items-center justify-between gap-2 text-xs">
                {(() => {
                  const cit = feedback.citation || feedback.source_citation;
                  if (!cit) return null;
                  return (
                    <button
                      type="button"
                      onClick={() => setActiveCitation(cit)}
                      className="flex items-center gap-1.5 text-primary hover:underline font-mono"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Inspect Physical Source ({cit.document_title || 'Document'} • p.{cit.page || 1})</span>
                    </button>
                  );
                })()}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 rounded-btn bg-primary hover:opacity-90 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                <span>{currentIndex + 1 < questions.length ? 'Next Question' : 'Complete Assessment'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </div>

      <SourceModal
        isOpen={Boolean(activeCitation)}
        onClose={() => setActiveCitation(null)}
        citation={activeCitation}
      />
    </div>
  );
};
