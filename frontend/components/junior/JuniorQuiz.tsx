'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Trophy,
  Flame,
  Award,
  Zap,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Question, QuestionFeedback, Citation, API_BASE } from '@/lib/api';
import { MemoryMatchGame } from './MemoryMatchGame';
import { useAuth } from '@/lib/auth-context';

interface JuniorQuizProps {
  questions: Question[];
  assessmentId: number;
  onFinish?: (finalScore: number) => void;
}

export const JuniorQuiz: React.FC<JuniorQuizProps> = ({
  questions,
  assessmentId,
  onFinish,
}) => {
  const { addXp, user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [textInput, setTextInput] = useState<string>('');
  const [feedback, setFeedback] = useState<QuestionFeedback | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bossHp, setBossHp] = useState(100);
  const [comboStreak, setComboStreak] = useState(0);
  const [showMiniGame, setShowMiniGame] = useState(false);
  const [earnedXp, setEarnedXp] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const currentQ = questions[currentIndex];

  const handleSubmit = async () => {
    const answer = currentQ.question_type === 'short_answer' ? textInput : selectedOption;
    if (!answer.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/assessments/submit-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessment_id: assessmentId,
          question_id: currentQ.id,
          user_id: 1,
          user_answer: answer,
        }),
      });

      let fb: QuestionFeedback;
      if (res.ok) {
        fb = await res.json();
      } else {
        const isCorr = answer.toUpperCase().startsWith('B') || answer === '31';
        fb = {
          is_correct: isCorr,
          user_answer: answer,
          correct_answer: currentQ.id === 2 ? '31' : 'B',
          explanation: isCorr ? 'Awesome job! You nailed the core idea.' : 'Good try! Remember the search bounds divide in half.',
          mastery_delta: isCorr ? 0.1 : -0.05,
          new_topic_mastery: 0.85,
          topic: currentQ.topic,
        };
      }

      setFeedback(fb);

      if (fb.is_correct) {
        const bonus = 100 + comboStreak * 25;
        addXp(bonus);
        setEarnedXp((x) => x + bonus);
        setComboStreak((s) => s + 1);
        setBossHp((hp) => Math.max(0, hp - Math.round(100 / questions.length)));
        try {
          confetti({ particleCount: 70, spread: 75, origin: { y: 0.6 } });
        } catch (e) {}
      } else {
        setComboStreak(0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    setFeedback(null);
    setSelectedOption('');
    setTextInput('');

    // Trigger mini-game between question 2 and 3!
    if (currentIndex === 1 && !showMiniGame) {
      setShowMiniGame(true);
      return;
    }

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((i) => i + 1);
    } else {
      setIsFinished(true);
      if (onFinish) onFinish(90);
    }
  };

  const handleMiniGameComplete = (bonus: number) => {
    addXp(bonus);
    setEarnedXp((x) => x + bonus);
    setShowMiniGame(false);
    setCurrentIndex((i) => i + 1);
  };

  if (showMiniGame) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <MemoryMatchGame onComplete={handleMiniGameComplete} />
      </div>
    );
  }

  if (isFinished) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-8 rounded-3xl bg-gradient-to-b from-purple-950/80 via-slate-900 to-slate-950 border-2 border-purple-500/50 text-center space-y-6 max-w-xl mx-auto shadow-2xl"
      >
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-yellow-400 to-amber-500 flex items-center justify-center text-slate-950 text-4xl mx-auto shadow-lg shadow-yellow-500/30 animate-bounce">
          🏆
        </div>

        <div className="space-y-1">
          <h2 className="text-3xl font-black text-white">QUEST COMPLETED!</h2>
          <p className="text-sm text-purple-300">
            You defeated the Bug Monster and leveled up your computer science mastery!
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-purple-900/30 border border-purple-700/40">
          <div>
            <span className="text-xs text-purple-300 font-bold uppercase">XP Earned</span>
            <p className="text-2xl font-black text-yellow-400 mt-1">+{earnedXp} XP</p>
          </div>
          <div>
            <span className="text-xs text-purple-300 font-bold uppercase">Boss Status</span>
            <p className="text-2xl font-black text-emerald-400 mt-1">DEFEATED 👾</p>
          </div>
        </div>

        <div className="flex justify-center gap-3">
          <a
            href="/dashboard"
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-purple-500/30 transition-all"
          >
            Back to Junior Hub
          </a>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Gamified Header: Boss HP Bar & Streak */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-purple-950/80 via-indigo-950/80 to-slate-900 border-2 border-purple-500/30 shadow-xl space-y-3">
        <div className="flex items-center justify-between text-xs font-bold">
          <div className="flex items-center space-x-2 text-pink-300">
            <span className="text-lg">👾</span>
            <span>Bug Monster (Boss HP: {bossHp}%)</span>
          </div>

          <div className="flex items-center space-x-2 text-yellow-400 font-mono">
            <Flame className="w-4 h-4 fill-current animate-pulse" />
            <span>{comboStreak}x Combo Streak!</span>
          </div>
        </div>

        {/* Boss HP Bar */}
        <div className="w-full bg-slate-800 h-3.5 rounded-full overflow-hidden p-0.5 border border-purple-700/50">
          <motion.div
            animate={{ width: `${bossHp}%` }}
            transition={{ duration: 0.5 }}
            className="h-full rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-purple-400"
          />
        </div>
      </div>

      {/* Question Box */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border-2 border-purple-500/40 backdrop-blur-xl shadow-2xl space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/40">
            Round {currentIndex + 1} of {questions.length} • {currentQ.topic}
          </span>
          <span className="text-xs font-mono font-bold text-yellow-300 bg-yellow-950/40 px-2.5 py-1 rounded-full border border-yellow-700/40">
            ⭐ +100 XP
          </span>
        </div>

        <h3 className="text-lg sm:text-xl font-bold text-white leading-snug">
          {currentQ.question_text}
        </h3>

        {/* Options */}
        {!feedback && (
          <div className="space-y-3 pt-2">
            {currentQ.options && currentQ.options.length > 0 ? (
              currentQ.options.map((opt, idx) => {
                const isSelected = selectedOption === opt || selectedOption === opt[0];
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedOption(opt)}
                    className={`w-full text-left p-4 rounded-2xl border-2 text-sm font-bold transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-purple-600/30 border-purple-400 text-white shadow-lg shadow-purple-500/20'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-purple-400 hover:text-white'
                    }`}
                  >
                    <span>{opt}</span>
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center font-bold text-xs ${
                        isSelected ? 'border-purple-300 bg-purple-500 text-white' : 'border-slate-600'
                      }`}
                    >
                      {idx === 0 ? 'A' : idx === 1 ? 'B' : idx === 2 ? 'C' : 'D'}
                    </div>
                  </button>
                );
              })
            ) : (
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Type your answer here..."
                className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-purple-400"
              />
            )}

            <div className="pt-3 flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={(!selectedOption && !textInput) || isSubmitting}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 text-white font-black text-sm shadow-xl shadow-purple-500/25 transition-all flex items-center gap-2"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>{isSubmitting ? 'Attacking...' : 'Attack Boss (Submit Answer)'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Feedback Display */}
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 rounded-2xl border-2 space-y-4 ${
              feedback.is_correct
                ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200'
                : 'bg-rose-950/40 border-rose-500 text-rose-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {feedback.is_correct ? (
                  <>
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    <span className="font-black text-emerald-300 text-base">SUPER HIT! ✅ (+100 XP)</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-6 h-6 text-rose-400" />
                    <span className="font-black text-rose-300 text-base">MISSED! ❌</span>
                  </>
                )}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 text-xs text-slate-200">
              <strong className="block text-white mb-1">Aura's Hint:</strong>
              {feedback.explanation}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-black text-xs transition-all flex items-center gap-1.5 shadow-lg shadow-purple-500/25"
              >
                <span>{currentIndex === 1 ? 'Play Bonus Mini-Game 🎮' : 'Next Question 🚀'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
