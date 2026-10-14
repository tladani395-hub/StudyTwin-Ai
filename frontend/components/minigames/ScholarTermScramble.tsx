'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Brain, CheckCircle2, Lightbulb, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuthStore } from '@/stores/useAuthStore';

interface ScholarTermScrambleProps {
  onComplete: (score: number) => void;
  onSkip: () => void;
}

const PUZZLES = [
  { term: 'INVARIANT', scramble: 'TIARNAVNI', hint: 'A condition that remains true throughout an algorithm.' },
  { term: 'RECURSION', scramble: 'CRSNREOUI', hint: 'A function that calls itself with a base case.' },
  { term: 'TRAVERSAL', scramble: 'RTSAERLAV', hint: 'Visiting all vertices or nodes in a data structure.' },
  { term: 'ASYMPTOTIC', scramble: 'PTMTYASICO', hint: 'Behavior of functions as input approaches infinity.' },
  { term: 'LOGARITHMIC', scramble: 'GMLRHITCOAI', hint: 'O(log n) time complexity growth rate.' },
];

export default function ScholarTermScramble({ onComplete, onSkip }: ScholarTermScrambleProps) {
  const { addXP } = useAuthStore();
  const [puzzleIdx, setPuzzleIdx] = useState(0);
  const [inputVal, setInputVal] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);

  const currentPuzzle = PUZZLES[puzzleIdx];

  const handleComplete = useCallback(() => {
    addXP(isCorrect ? 75 : 50);
    onComplete(isCorrect ? 100 : 50);
  }, [isCorrect, onComplete, addXP]);

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal.trim().toUpperCase() === currentPuzzle.term.toUpperCase()) {
      setIsCorrect(true);
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {
        // safe fallback
      }
      setTimeout(() => {
        handleComplete();
      }, 1200);
    }
  };

  useEffect(() => {
    if (timeLeft <= 0) {
      handleComplete();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, handleComplete]);

  return (
    <div className="p-6 rounded-card bg-bg-surface border border-primary/40 text-text-main shadow-card space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-btn bg-primary/10 text-primary border border-primary/30">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-text-main">CS Term Scramble (Brain Break)</h4>
            <span className="text-[11px] font-mono text-text-muted">Quiz timer paused • +50 XP bonus</span>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full bg-bg-app border border-border-subtle text-xs font-mono text-primary font-bold">
          ⏱ {timeLeft}s
        </span>
      </div>

      <div className="p-5 rounded-card bg-bg-app border border-border-subtle text-center space-y-3">
        <span className="text-xs font-mono text-text-muted uppercase tracking-wider">Unscramble the term:</span>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {currentPuzzle.scramble.split('').map((char, i) => (
            <span
              key={i}
              className="w-9 h-9 rounded-btn bg-bg-surface border border-border-subtle text-primary font-mono font-black text-base flex items-center justify-center shadow-sm"
            >
              {char}
            </span>
          ))}
        </div>

        {showHint ? (
          <p className="text-xs text-primary font-medium">
            💡 Hint: {currentPuzzle.hint}
          </p>
        ) : (
          <button
            type="button"
            onClick={() => setShowHint(true)}
            className="text-[11px] text-text-muted hover:text-text-main flex items-center justify-center gap-1 mx-auto"
          >
            <Lightbulb className="w-3 h-3 text-amber-500" />
            <span>Show Hint</span>
          </button>
        )}
      </div>

      <form onSubmit={handleCheck} className="flex gap-2">
        <input
          type="text"
          autoFocus
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value.toUpperCase())}
          placeholder="Type unscrambled term..."
          className="flex-1 bg-bg-app border border-border-subtle rounded-btn px-4 py-2.5 text-xs text-text-main uppercase tracking-wider font-mono focus:outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={!inputVal.trim() || isCorrect}
          className="px-5 py-2.5 rounded-btn bg-primary text-white font-bold text-xs hover:opacity-90 transition-all shadow-md disabled:opacity-40"
        >
          {isCorrect ? 'Correct! ✓' : 'Submit'}
        </button>
      </form>

      <div className="flex items-center justify-between pt-1 text-xs">
        <button
          type="button"
          onClick={() => {
            setPuzzleIdx((p) => (p + 1) % PUZZLES.length);
            setInputVal('');
            setShowHint(false);
          }}
          className="text-text-muted hover:text-text-main flex items-center gap-1"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>New Puzzle</span>
        </button>

        <button
          type="button"
          onClick={onSkip}
          className="font-bold text-text-muted hover:text-text-main transition-colors"
        >
          Skip Break ➔
        </button>
      </div>
    </div>
  );
}
