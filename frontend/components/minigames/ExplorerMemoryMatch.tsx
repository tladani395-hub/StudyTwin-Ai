'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Trophy, ArrowRight, Brain } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuthStore } from '@/stores/useAuthStore';

interface ExplorerMemoryMatchProps {
  onComplete: (score: number) => void;
  onSkip: () => void;
}

interface CardItem {
  id: number;
  pairId: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const PAIRS = [
  { pairId: 1, emoji: '🦋' },
  { pairId: 2, emoji: '🚀' },
  { pairId: 3, emoji: '⭐' },
  { pairId: 4, emoji: '🌲' },
];

function generateShuffledCards(): CardItem[] {
  const cards: CardItem[] = [];
  let id = 0;
  PAIRS.forEach((p) => {
    cards.push({ id: id++, pairId: p.pairId, emoji: p.emoji, isFlipped: false, isMatched: false });
    cards.push({ id: id++, pairId: p.pairId, emoji: p.emoji, isFlipped: false, isMatched: false });
  });
  // Shuffle
  return cards.sort(() => Math.random() - 0.5);
}

export default function ExplorerMemoryMatch({ onComplete, onSkip }: ExplorerMemoryMatchProps) {
  const { addXP, addStars } = useAuthStore();
  const [cards, setCards] = useState<CardItem[]>(generateShuffledCards);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [matchesCount, setMatchesCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isGameOver, setIsGameOver] = useState(false);

  const handleFinish = useCallback((won = false) => {
    setIsGameOver(true);
    addXP(won ? 75 : 50);
    addStars(won ? 3 : 1);
    if (won) {
      try {
        confetti({
          particleCount: 60,
          spread: 80,
          origin: { y: 0.5 },
        });
      } catch {}
    }
  }, [addXP, addStars]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) {
      handleFinish(false);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, handleFinish]);

  // Check card matches
  useEffect(() => {
    if (selectedCards.length === 2) {
      const [firstIdx, secondIdx] = selectedCards;
      const first = cards[firstIdx];
      const second = cards[secondIdx];

      if (first.pairId === second.pairId) {
        // Match found!
        setCards((prev) =>
          prev.map((c, i) =>
            i === firstIdx || i === secondIdx ? { ...c, isMatched: true, isFlipped: true } : c
          )
        );
        setMatchesCount((m) => {
          const next = m + 1;
          if (next === PAIRS.length) {
            handleFinish(true);
          }
          return next;
        });
        setSelectedCards([]);
      } else {
        // Not a match, flip back after delay
        const timeout = setTimeout(() => {
          setCards((prev) =>
            prev.map((c, i) =>
              i === firstIdx || i === secondIdx ? { ...c, isFlipped: false } : c
            )
          );
          setSelectedCards([]);
        }, 800);
        return () => clearTimeout(timeout);
      }
    }
  }, [selectedCards, cards, handleFinish]);

  const handleCardClick = (idx: number) => {
    if (selectedCards.length >= 2 || cards[idx].isFlipped || cards[idx].isMatched || isGameOver) {
      return;
    }

    setCards((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, isFlipped: true } : c))
    );
    setSelectedCards((prev) => [...prev, idx]);
  };

  return (
    <div className="p-6 rounded-card bg-bg-surface border-2 border-secondary text-text-main shadow-card text-center space-y-4 relative overflow-hidden select-none">
      {/* Top Banner */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-2xl bg-secondary/20 text-secondary font-bold text-xs flex items-center gap-1.5">
            <Brain className="w-4 h-4 text-secondary" />
            <span>Memory Match Brain Break!</span>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono font-bold text-sm">
          <span className="px-3 py-1 rounded-full bg-bg-app text-secondary border border-secondary/30 flex items-center gap-1">
            ✨ {matchesCount} / {PAIRS.length} Pairs
          </span>
          <span className="px-3 py-1 rounded-full bg-bg-elevated text-text-main">
            ⏱ {timeLeft}s
          </span>
        </div>
      </div>

      <p className="text-xs text-text-muted">
        Find all matching cosmic symbol pairs to power up your mind! (+50 XP bonus)
      </p>

      {/* Memory Cards Grid */}
      <div className="relative p-4 rounded-card bg-bg-app border border-border-subtle overflow-hidden min-h-[240px] flex items-center justify-center">
        <div className="grid grid-cols-4 gap-3 w-full max-w-sm">
          {cards.map((card, idx) => (
            <motion.button
              key={card.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleCardClick(idx)}
              className={`h-20 rounded-2xl border-2 text-2xl font-bold flex items-center justify-center transition-all shadow-md ${
                card.isFlipped || card.isMatched
                  ? 'bg-bg-surface border-secondary text-white'
                  : 'bg-secondary/20 border-secondary/40 text-secondary hover:bg-secondary/30'
              }`}
            >
              {card.isFlipped || card.isMatched ? (
                <span>{card.emoji}</span>
              ) : (
                <span className="text-sm font-mono opacity-60">❓</span>
              )}
            </motion.button>
          ))}
        </div>

        {isGameOver && (
          <div className="absolute inset-0 bg-bg-app/90 backdrop-blur-sm flex flex-col items-center justify-center space-y-3 z-20">
            <div className="w-14 h-14 rounded-full bg-secondary/20 text-secondary border-2 border-secondary flex items-center justify-center">
              <Trophy className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-display font-black text-text-main">
              {matchesCount === PAIRS.length ? 'Perfect Memory Match!' : 'Time is Up!'}
            </h3>
            <p className="text-xs text-secondary font-mono font-bold">
              You matched {matchesCount} pairs & earned +50 XP bonus!
            </p>
            <button
              type="button"
              onClick={() => onComplete(matchesCount * 25)}
              className="px-6 py-2.5 rounded-btn bg-secondary text-white font-bold text-xs shadow-md hover:scale-105 transition-all flex items-center gap-1.5"
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
