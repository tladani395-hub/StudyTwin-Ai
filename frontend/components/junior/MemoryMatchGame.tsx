'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Trophy, RotateCcw, CheckCircle2, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';

interface MemoryCard {
  id: number;
  text: string;
  matchId: number;
  type: 'concept' | 'definition';
}

const CARDS_DATA: MemoryCard[] = [
  { id: 1, text: '🔍 Binary Search', matchId: 101, type: 'concept' },
  { id: 101, text: 'Halves search space O(log n)', matchId: 1, type: 'definition' },
  { id: 2, text: '🌲 BST Property', matchId: 102, type: 'concept' },
  { id: 102, text: 'Left < Root < Right', matchId: 2, type: 'definition' },
  { id: 3, text: '🌐 Graph BFS', matchId: 103, type: 'concept' },
  { id: 103, text: 'FIFO Queue Shortest Path', matchId: 3, type: 'definition' },
];

export const MemoryMatchGame: React.FC<{ onComplete: (bonusXp: number) => void }> = ({
  onComplete,
}) => {
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const shuffleCards = () => {
    const shuffled = [...CARDS_DATA].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setIsCompleted(false);
  };

  useEffect(() => {
    shuffleCards();
  }, []);

  const handleCardClick = (card: MemoryCard) => {
    if (flipped.length === 2 || flipped.includes(card.id) || matched.includes(card.id)) return;

    const newFlipped = [...flipped, card.id];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const firstCard = cards.find((c) => c.id === newFlipped[0]);
      const secondCard = cards.find((c) => c.id === newFlipped[1]);

      if (firstCard && secondCard && (firstCard.matchId === secondCard.id || secondCard.matchId === firstCard.id)) {
        // Matched!
        const newMatched = [...matched, firstCard.id, secondCard.id];
        setMatched(newMatched);
        setFlipped([]);

        if (newMatched.length === cards.length) {
          setIsCompleted(true);
          try {
            confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
          } catch (e) {}
          setTimeout(() => onComplete(150), 1200);
        }
      } else {
        // Not matched -> Flip back after delay
        setTimeout(() => {
          setFlipped([]);
        }, 900);
      }
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-950/80 via-purple-950/60 to-slate-900 border-2 border-purple-500/40 shadow-2xl space-y-5 text-center">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-purple-300 font-bold text-xs uppercase tracking-wider">
          <Zap className="w-4 h-4 text-yellow-400 fill-current animate-bounce" />
          <span>Bonus Mini-Game: Algorithm Memory Match</span>
        </div>
        <span className="text-xs font-mono font-bold text-yellow-300 bg-yellow-950/60 px-2.5 py-1 rounded-full border border-yellow-600/50">
          +150 XP Reward
        </span>
      </div>

      <p className="text-xs text-purple-200">
        Match each Computer Science concept with its secret superpower definition!
      </p>

      {/* Grid of cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {cards.map((card) => {
          const isFlipped = flipped.includes(card.id) || matched.includes(card.id);
          const isCardMatched = matched.includes(card.id);

          return (
            <motion.button
              key={card.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => handleCardClick(card)}
              className={`h-24 p-3 rounded-2xl border-2 text-xs font-bold transition-all flex items-center justify-center text-center shadow-lg ${
                isCardMatched
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-emerald-500/20'
                  : isFlipped
                  ? 'bg-purple-600 text-white border-purple-300 shadow-purple-500/30'
                  : 'bg-slate-800/90 border-purple-700/50 text-slate-400 hover:border-purple-400'
              }`}
            >
              {isFlipped ? (
                <span className="leading-snug">{card.text}</span>
              ) : (
                <span className="text-xl">❓</span>
              )}
            </motion.button>
          );
        })}
      </div>

      {isCompleted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-3 bg-emerald-500/20 border border-emerald-400 rounded-xl text-emerald-300 text-xs font-bold flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Awesome! Mini-Game Cleared — Resuming Quiz with +150 XP!</span>
        </motion.div>
      )}
    </div>
  );
};
