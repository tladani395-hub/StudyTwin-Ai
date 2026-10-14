'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  RotateCw,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Award,
  RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuthStore } from '@/stores/useAuthStore';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';

interface Flashcard {
  id: number;
  topic: string;
  front: string;
  back: string;
  source: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

const SAMPLE_FLASHCARDS: Flashcard[] = [
  {
    id: 1,
    topic: 'Binary Search',
    front: 'What is the required precondition for executing Binary Search on an array?',
    back: 'The array MUST be sorted in monotonic ascending or descending order. Without sorting, divide-and-conquer cannot eliminate half the remaining search space.',
    source: 'DSA_Textbook.pdf (Page 142)',
    difficulty: 'easy',
  },
  {
    id: 2,
    topic: 'Binary Search',
    front: 'Why is mid calculated as `low + (high - low) / 2` instead of `(low + high) / 2`?',
    back: 'To prevent integer overflow in languages like C/C++/Java when `low + high` exceeds the maximum 32-bit signed integer value (2^31 - 1).',
    source: 'DSA_Lecture_04.pptx (Slide 18)',
    difficulty: 'medium',
  },
  {
    id: 3,
    topic: 'Trees & BST',
    front: 'What is the Binary Search Tree (BST) invariant property?',
    back: 'For every node N: all keys in N\'s left subtree are strictly LESS than N.key, and all keys in N\'s right subtree are strictly GREATER than N.key.',
    source: 'DSA_Textbook.pdf (Page 168)',
    difficulty: 'easy',
  },
  {
    id: 4,
    topic: 'Trees & BST',
    front: 'Which tree traversal algorithm produces elements of a BST in strictly sorted order?',
    back: 'In-Order Traversal (Left subtree -> Root node -> Right subtree). Recurrence visits all keys in monotonic ascending order.',
    source: 'DSA_Lecture_04.mp4 (Timestamp 18:20)',
    difficulty: 'medium',
  },
  {
    id: 5,
    topic: 'Graph Theory',
    front: 'How does Breadth-First Search (BFS) guarantee finding the shortest path in unweighted graphs?',
    back: 'BFS explores vertices level-by-level using a FIFO Queue. It visits all vertices at distance d before visiting any vertex at distance d+1.',
    source: 'DSA_Textbook.pdf (Page 210)',
    difficulty: 'hard',
  },
];

export default function FlashcardsPage() {
  const { mode, addXP, addStars } = useAuthStore();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cards, setCards] = useState<Flashcard[]>(SAMPLE_FLASHCARDS);
  const [masteredIds, setMasteredIds] = useState<number[]>([]);

  const card = cards[currentIdx];

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleScoreCard = (quality: 'again' | 'hard' | 'good' | 'easy') => {
    if (quality === 'good' || quality === 'easy') {
      addXP(25);
      if (mode === 'explorer') addStars(1);
      if (!masteredIds.includes(card.id)) {
        setMasteredIds((prev) => [...prev, card.id]);
      }
      try {
        confetti({ particleCount: 20, spread: 50, origin: { y: 0.8 } });
      } catch {}
    }

    setIsFlipped(false);
    if (currentIdx < cards.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      setCurrentIdx(0);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-16 font-sans">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-mono text-[var(--primary)] uppercase font-bold flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            <span>Active Recall • Spaced Repetition</span>
          </span>
          <h1 className="text-2xl font-display font-black text-[var(--text-main)] mt-1">
            Course Concept Flashcards
          </h1>
        </div>

        <div className="text-xs font-mono px-3 py-1 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-muted)]">
          Card <strong>{currentIdx + 1}</strong> of {cards.length}
        </div>
      </div>

      {/* Interactive 3D Flip Card */}
      <div
        className="relative h-80 sm:h-96 w-full cursor-pointer perspective-1000 select-none"
        onClick={handleFlip}
      >
        <motion.div
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.55, ease: 'easeInOut' }}
          style={{ transformStyle: 'preserve-3d' }}
          className="relative w-full h-full"
        >
          {/* FRONT FACE */}
          <div
            style={{ backfaceVisibility: 'hidden' }}
            className="absolute inset-0 p-8 rounded-3xl bg-[var(--bg-surface)] border-2 border-[var(--border-hover)] shadow-2xl flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30">
                {card.topic}
              </span>
              <span className="text-[11px] font-mono text-[var(--text-muted)] flex items-center gap-1">
                <RotateCw className="w-3.5 h-3.5" />
                <span>Tap to flip</span>
              </span>
            </div>

            <div className="text-lg sm:text-xl font-display font-bold text-[var(--text-main)] text-center leading-relaxed">
              <MarkdownRenderer content={card.front} />
            </div>

            <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-mono border-t border-[var(--border-subtle)] pt-3">
              <span>Source: {card.source}</span>
              <span className="capitalize text-[var(--primary)] font-bold">{card.difficulty}</span>
            </div>
          </div>

          {/* BACK FACE */}
          <div
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            className="absolute inset-0 p-8 rounded-3xl bg-[var(--bg-surface-elevated)] border-2 border-[var(--primary)] shadow-2xl flex flex-col justify-between overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Grounded Explanation
              </span>
              <span className="text-[11px] font-mono text-[var(--text-muted)] flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Verified Fact</span>
              </span>
            </div>

            <div className="text-sm sm:text-base text-[var(--text-main)] text-center leading-relaxed font-medium">
              <MarkdownRenderer content={card.back} />
            </div>

            <div className="text-center text-[11px] text-[var(--primary)] font-mono border-t border-[var(--border-subtle)] pt-3">
              Exact Reference: {card.source}
            </div>
          </div>
        </motion.div>
      </div>

      {/* SM-2 Recall Feedback Buttons */}
      <div className="p-4 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-between gap-2 flex-wrap">
        <span className="text-xs font-mono text-[var(--text-muted)] w-full sm:w-auto text-center sm:text-left mb-2 sm:mb-0">
          How well did you know this?
        </span>

        <div className="flex items-center gap-2 mx-auto sm:mx-0">
          <button
            type="button"
            onClick={() => handleScoreCard('again')}
            className="px-4 py-2 rounded-2xl bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 text-xs font-bold transition-all"
          >
            Again (&lt;1d)
          </button>
          <button
            type="button"
            onClick={() => handleScoreCard('hard')}
            className="px-4 py-2 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 text-xs font-bold transition-all"
          >
            Hard (2d)
          </button>
          <button
            type="button"
            onClick={() => handleScoreCard('good')}
            className="px-4 py-2 rounded-2xl bg-[var(--primary)] text-white font-bold text-xs shadow-md transition-all hover:scale-105"
          >
            Good (4d) +25 XP
          </button>
          <button
            type="button"
            onClick={() => handleScoreCard('easy')}
            className="px-4 py-2 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all"
          >
            Easy (7d)
          </button>
        </div>
      </div>
    </div>
  );
}
