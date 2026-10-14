'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Award, ArrowUpRight, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface MasteryCardProps {
  topicName: string;
  category?: string;
  masteryScore: number;
  confidence?: number;
  attemptsCount?: number;
  onPracticeClick?: () => void;
}

export const MasteryCard: React.FC<MasteryCardProps> = ({
  topicName,
  category = "Core Concept",
  masteryScore,
  confidence = 0.85,
  attemptsCount = 10,
  onPracticeClick
}) => {
  const pct = Math.round(masteryScore * 100);
  const isMastered = pct >= 80;
  const isLearning = pct >= 50 && pct < 80;
  const isWeak = pct < 50;

  const statusColor = isMastered
    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
    : isLearning
    ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
    : 'text-rose-400 bg-rose-500/10 border-rose-500/30';

  const barColor = isMastered
    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
    : isLearning
    ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
    : 'bg-gradient-to-r from-rose-500 to-red-400';

  return (
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="p-5 rounded-2xl bg-surface-card/70 border border-surface-border backdrop-blur-md relative overflow-hidden group shadow-lg shadow-black/20"
    >
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            {category}
          </span>
          <h3 className="text-base font-bold text-white mt-0.5 group-hover:text-primary-300 transition-colors">
            {topicName}
          </h3>
        </div>

        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${statusColor}`}>
          {isMastered && <CheckCircle2 className="w-3 h-3" />}
          {isLearning && <TrendingUp className="w-3 h-3" />}
          {isWeak && <AlertTriangle className="w-3 h-3" />}
          {isMastered ? 'Mastered' : isLearning ? 'Learning' : 'Weak Focus'}
        </span>
      </div>

      {/* Progress Metric */}
      <div className="mt-4 space-y-2">
        <div className="flex justify-between items-baseline text-xs">
          <span className="text-slate-400">Mastery Trace</span>
          <span className="text-sm font-extrabold font-mono text-white">{pct}%</span>
        </div>

        <div className="w-full bg-slate-800/80 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`h-full rounded-full ${barColor}`}
          />
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-4 pt-3 border-t border-slate-800/70 flex items-center justify-between text-[11px] text-slate-400">
        <span>{attemptsCount} practice attempts</span>
        <Link
          href={`/assessment?topic=${encodeURIComponent(topicName)}`}
          className="flex items-center gap-1 text-primary-400 hover:text-primary-300 font-semibold transition-colors"
        >
          <span>Practice</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </motion.div>
  );
};
