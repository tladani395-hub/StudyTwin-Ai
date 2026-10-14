'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Award,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertCircle,
  BookOpen,
  ArrowRight,
  Sparkles,
  Bot
} from 'lucide-react';

export default function ResultsPage() {
  const resultItems = [
    {
      question: "What is the worst-case time complexity of Binary Search on a sorted array of size n?",
      isCorrect: true,
      yourAnswer: "B) O(log n)",
      correctAnswer: "B) O(log n)",
      explanation: "Binary search repeatedly divides the search space in half, resulting in at most log2(n) comparisons.",
      topic: "Searching",
      delta: "+8%",
      source: "DSA_Textbook.pdf — Page 142",
    },
    {
      question: "In a complete Binary Search Tree of height 4, what is the maximum number of total nodes?",
      isCorrect: true,
      yourAnswer: "31",
      correctAnswer: "31",
      explanation: "Maximum nodes = 2^(h+1) - 1 = 2^5 - 1 = 31.",
      topic: "Trees",
      delta: "+10%",
      source: "DSA_Textbook.pdf — Page 153",
    },
    {
      question: "Which data structure is fundamentally utilized to implement Breadth-First Search (BFS)?",
      isCorrect: false,
      yourAnswer: "A) LIFO Stack",
      correctAnswer: "B) FIFO Queue",
      misconception: "You confused BFS with DFS. A LIFO stack is used for Depth-First Search, while BFS requires a FIFO queue for shortest paths.",
      explanation: "BFS explores level-by-level using a FIFO queue to guarantee shortest path discovery in unweighted graphs.",
      topic: "Graphs",
      delta: "-4%",
      source: "DSA_Lecture_04.mp4 — 30:20",
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-text-muted">
            <span className="text-primary flex items-center gap-1 font-bold">
              <Award className="w-3.5 h-3.5" /> Assessment Results & Feedback
            </span>
            <span>•</span>
            <span className="text-secondary font-semibold">BKT State Persisted</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-text-main mt-1">
            Performance & Misconception Review
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-0.5">
            Detailed breakdown of submitted answers, misconception analysis, and Bayesian mastery trajectory.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="px-4 py-2 rounded-btn bg-bg-surface hover:bg-bg-elevated text-text-main text-xs font-semibold border border-border-subtle transition-colors flex items-center gap-1.5"
        >
          <span>Back to Dashboard</span>
          <ArrowRight className="w-3.5 h-3.5 text-primary" />
        </Link>
      </div>

      {/* Summary Score Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 sm:p-8 rounded-card bg-bg-surface border border-border-subtle shadow-card grid grid-cols-1 sm:grid-cols-3 gap-4 text-center"
      >
        <div className="p-4 rounded-btn bg-bg-app border border-border-subtle">
          <span className="text-xs text-text-muted uppercase tracking-wider font-semibold">
            Score Achieved
          </span>
          <p className="text-3xl font-display font-black text-text-main mt-1">67%</p>
          <span className="text-[11px] font-mono text-text-muted">2 of 3 correct</span>
        </div>

        <div className="p-4 rounded-btn bg-bg-app border border-border-subtle">
          <span className="text-xs text-text-muted uppercase tracking-wider font-semibold">
            Bayesian Mastery Gain
          </span>
          <p className="text-3xl font-display font-black text-primary mt-1">+14%</p>
          <span className="text-[11px] font-mono text-text-muted">Across 2 topics</span>
        </div>

        <div className="p-4 rounded-btn bg-bg-app border border-border-subtle">
          <span className="text-xs text-text-muted uppercase tracking-wider font-semibold">
            Primary Remediation Focus
          </span>
          <p className="text-base font-bold text-text-main mt-2">Graph Traversal (BFS)</p>
          <span className="text-[11px] font-mono text-primary">Review FIFO queue mechanics</span>
        </div>
      </motion.div>

      {/* Item-by-item analysis */}
      <div className="space-y-4">
        <h2 className="text-lg font-display font-bold text-text-main">Itemized Answer & Misconception Review</h2>

        <div className="space-y-4">
          {resultItems.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              className={`p-6 rounded-card border space-y-4 shadow-card ${
                item.isCorrect
                  ? 'bg-bg-surface border-border-subtle'
                  : 'bg-bg-surface border-primary/40'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start space-x-3">
                  {item.isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="text-[11px] font-mono font-bold text-text-muted uppercase">
                      Question {idx + 1} • {item.topic}
                    </span>
                    <h3 className="text-sm font-semibold text-text-main mt-0.5">{item.question}</h3>
                  </div>
                </div>

                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/30 whitespace-nowrap">
                  Mastery: {item.delta}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                <div className="p-3 rounded-btn bg-bg-app border border-border-subtle">
                  <span className="text-text-muted block text-[10px]">Your Answer:</span>
                  <span className="font-semibold text-text-main">
                    {item.yourAnswer}
                  </span>
                </div>
                <div className="p-3 rounded-btn bg-bg-app border border-border-subtle">
                  <span className="text-text-muted block text-[10px]">Correct Answer:</span>
                  <span className="text-primary font-semibold">{item.correctAnswer}</span>
                </div>
              </div>

              {item.misconception && (
                <div className="p-3.5 rounded-btn bg-bg-app border border-primary/30 text-xs text-text-main flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-primary">Targeted Misconception Analysis:</strong>
                    {item.misconception}
                  </div>
                </div>
              )}

              <div className="p-3.5 rounded-btn bg-bg-app border border-border-subtle text-xs text-text-muted">
                <strong className="text-text-main block mb-1">Pedagogical Explanation:</strong>
                {item.explanation}
              </div>

              <div className="pt-2 flex items-center justify-between text-xs text-text-muted">
                <span className="flex items-center gap-1.5 text-primary font-mono">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Grounding Source: {item.source}</span>
                </span>

                <Link
                  href={`/tutor?query=Explain%20${encodeURIComponent(item.topic)}`}
                  className="px-3 py-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-full transition-colors flex items-center gap-1 font-semibold"
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>Ask Tutor</span>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
