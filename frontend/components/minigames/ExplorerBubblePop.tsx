'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Trophy, ArrowRight, CircleDot } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuthStore } from '@/stores/useAuthStore';

interface ExplorerBubblePopProps {
  onComplete: (score: number) => void;
  onSkip: () => void;
}

interface Bubble {
  id: number;
  x: number;
  size: number;
  speed: number;
  color: string;
  emoji: string;
  points: number;
}

const BUBBLE_EMOJIS = ['🫧', '🎈', '🔮', '🫧', '✨', '💎'];
const BUBBLE_COLORS = [
  'rgba(255, 107, 87, 0.7)',
  'rgba(123, 75, 255, 0.7)',
  'rgba(255, 201, 60, 0.7)',
  'rgba(52, 211, 153, 0.7)',
  'rgba(244, 114, 182, 0.7)',
];

export default function ExplorerBubblePop({ onComplete, onSkip }: ExplorerBubblePopProps) {
  const { addXP, addStars } = useAuthStore();
  const [timeLeft, setTimeLeft] = useState(20);
  const [score, setScore] = useState(0);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
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
    } catch {}
  }, [addXP, addStars, score]);

  const popBubble = (id: number, pts: number) => {
    setScore((prev) => prev + pts);
    setBubbles((prev) => prev.filter((b) => b.id !== id));
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

  // Bubble spawner
  useEffect(() => {
    if (isGameOver || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setBubbles((prev) => {
        if (prev.length > 7) return prev;
        const newBubble: Bubble = {
          id: Date.now() + Math.random(),
          x: Math.floor(Math.random() * 80) + 10,
          size: Math.floor(Math.random() * 20) + 48,
          speed: Math.random() * 1.5 + 1.2,
          color: BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)],
          emoji: BUBBLE_EMOJIS[Math.floor(Math.random() * BUBBLE_EMOJIS.length)],
          points: 10,
        };
        return [...prev, newBubble];
      });
    }, 700);

    return () => clearInterval(interval);
  }, [isGameOver, timeLeft]);

  return (
    <div className="p-6 rounded-card bg-bg-surface border-2 border-primary text-text-main shadow-card text-center space-y-4 relative overflow-hidden select-none">
      {/* Top Banner */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-2xl bg-primary/20 text-primary font-bold text-xs flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>Bubble Pop Brain Break!</span>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono font-bold text-sm">
          <span className="px-3 py-1 rounded-full bg-bg-app text-primary border border-primary/30 flex items-center gap-1">
            <CircleDot className="w-4 h-4" /> {score} pts
          </span>
          <span className="px-3 py-1 rounded-full bg-bg-elevated text-text-main">
            ⏱ {timeLeft}s
          </span>
        </div>
      </div>

      <p className="text-xs text-text-muted">
        Pop as many floating cosmic bubbles as you can before time runs out! (+50 XP bonus)
      </p>

      {/* Interactive Popping Canvas */}
      <div className="relative h-64 sm:h-72 w-full rounded-card bg-bg-app border border-border-subtle overflow-hidden">
        <AnimatePresence>
          {bubbles.map((b) => (
            <motion.button
              key={b.id}
              initial={{ bottom: '-15%', left: `${b.x}%`, scale: 0.4, opacity: 0 }}
              animate={{ bottom: '110%', opacity: 1, scale: 1 }}
              exit={{ scale: 1.8, opacity: 0 }}
              transition={{ duration: 5 / b.speed, ease: 'easeOut' }}
              onClick={() => popBubble(b.id, b.points)}
              style={{
                left: `${b.x}%`,
                width: `${b.size}px`,
                height: `${b.size}px`,
                backgroundColor: b.color,
              }}
              className="absolute rounded-full border-2 border-white/60 shadow-lg text-xl flex items-center justify-center transform -translate-x-1/2 cursor-pointer hover:scale-125 active:scale-90 transition-transform backdrop-blur-sm"
            >
              <span>{b.emoji}</span>
            </motion.button>
          ))}
        </AnimatePresence>

        {isGameOver && (
          <div className="absolute inset-0 bg-bg-app/90 backdrop-blur-sm flex flex-col items-center justify-center space-y-3 z-20">
            <div className="w-14 h-14 rounded-full bg-primary/20 text-primary border-2 border-primary flex items-center justify-center">
              <Trophy className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-display font-black text-text-main">Awesome Popping!</h3>
            <p className="text-xs text-primary font-mono font-bold">
              You scored {score} points & earned +50 XP + {Math.max(1, Math.floor(score / 20))} Stars!
            </p>
            <button
              type="button"
              onClick={() => onComplete(score)}
              className="px-6 py-2.5 rounded-btn bg-primary text-white font-bold text-xs shadow-md hover:scale-105 transition-all flex items-center gap-1.5"
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
