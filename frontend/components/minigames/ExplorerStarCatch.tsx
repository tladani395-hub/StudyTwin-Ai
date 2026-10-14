'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Star, Trophy, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuthStore } from '@/stores/useAuthStore';

interface ExplorerStarCatchProps {
  onComplete: (score: number) => void;
  onSkip: () => void;
}

interface FallingStar {
  id: number;
  x: number;
  speed: number;
  color: string;
  icon: string;
  points: number;
}

const STAR_ICONS = ['⭐', '🌟', '✨', '💫', '💎', '🪐'];
const STAR_COLORS = ['#FFD700', '#FF9F1C', '#FF6B57', '#7B4BFF', '#4ADE80'];

export default function ExplorerStarCatch({ onComplete, onSkip }: ExplorerStarCatchProps) {
  const { addXP, addStars } = useAuthStore();
  const [timeLeft, setTimeLeft] = useState(20);
  const [score, setScore] = useState(0);
  const [stars, setStars] = useState<FallingStar[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);

  const handleFinish = useCallback(() => {
    setIsGameOver(true);
    addXP(50);
    addStars(Math.max(1, Math.floor(score / 20)));
    try {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.5 },
      });
    } catch {
      // safe fallback
    }
  }, [addXP, addStars, score]);

  const popStar = (id: number, pts: number) => {
    setScore((prev) => prev + pts);
    setStars((prev) => prev.filter((s) => s.id !== id));
  };

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) {
      handleFinish();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, handleFinish]);

  // Star spawner
  useEffect(() => {
    if (isGameOver || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setStars((prev) => {
        if (prev.length > 8) return prev;
        const newStar: FallingStar = {
          id: Date.now() + Math.random(),
          x: Math.floor(Math.random() * 85) + 5,
          speed: Math.random() * 1.5 + 1.2,
          color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
          icon: STAR_ICONS[Math.floor(Math.random() * STAR_ICONS.length)],
          points: 10,
        };
        return [...prev, newStar];
      });
    }, 800);

    return () => clearInterval(interval);
  }, [isGameOver, timeLeft]);

  return (
    <div className="p-6 rounded-card bg-bg-surface border-2 border-accent text-text-main shadow-card text-center space-y-4 relative overflow-hidden select-none">
      {/* Top Banner */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-2xl bg-accent/20 text-accent font-bold text-xs flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-accent" />
            <span>Star Catch Brain Break!</span>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono font-bold text-sm">
          <span className="px-3 py-1 rounded-full bg-bg-app text-accent border border-accent/30 flex items-center gap-1">
            <Star className="w-4 h-4 fill-accent" /> {score} pts
          </span>
          <span className="px-3 py-1 rounded-full bg-bg-elevated text-text-main">
            ⏱ {timeLeft}s
          </span>
        </div>
      </div>

      <p className="text-xs text-text-muted">
        Catch as many falling starlight crystals as you can before time is up! (+50 XP bonus)
      </p>

      {/* Interactive Catching Canvas */}
      <div className="relative h-64 sm:h-72 w-full rounded-card bg-bg-app border border-border-subtle overflow-hidden">
        <AnimatePresence>
          {stars.map((st) => (
            <motion.button
              key={st.id}
              initial={{ top: '-10%', left: `${st.x}%`, scale: 0.5, opacity: 0 }}
              animate={{ top: '105%', opacity: 1, scale: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 4 / st.speed, ease: 'linear' }}
              onClick={() => popStar(st.id, st.points)}
              style={{ left: `${st.x}%`, borderColor: st.color }}
              className="absolute p-2.5 rounded-full bg-bg-surface/80 hover:bg-bg-surface backdrop-blur-md border-2 shadow-lg text-lg transform -translate-x-1/2 cursor-pointer hover:scale-125 transition-transform"
            >
              <span>{st.icon}</span>
            </motion.button>
          ))}
        </AnimatePresence>

        {isGameOver && (
          <div className="absolute inset-0 bg-bg-app/90 backdrop-blur-sm flex flex-col items-center justify-center space-y-3 z-20">
            <div className="w-14 h-14 rounded-full bg-accent/20 text-accent border-2 border-accent flex items-center justify-center">
              <Trophy className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-display font-black text-text-main">Great Catching!</h3>
            <p className="text-xs text-accent font-mono font-bold">
              You scored {score} points & earned +50 XP + {Math.max(1, Math.floor(score / 20))} Stars!
            </p>
            <button
              type="button"
              onClick={() => onComplete(score)}
              className="px-6 py-2.5 rounded-btn bg-accent text-slate-900 font-bold text-xs shadow-md hover:scale-105 transition-all flex items-center gap-1.5"
            >
              <span>Continue Quiz</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      {!isGameOver && (
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] font-mono text-text-muted">Quiz timer is safely paused.</span>
          <button
            type="button"
            onClick={onSkip}
            className="text-xs font-bold text-text-muted hover:text-text-main transition-colors"
          >
            Skip Break ➔
          </button>
        </div>
      )}
    </div>
  );
}
