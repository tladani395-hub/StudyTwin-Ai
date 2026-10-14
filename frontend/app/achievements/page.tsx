'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Award,
  Star,
  Flame,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Trophy,
  Zap,
  BookOpen
} from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';

interface BadgeItem {
  id: string;
  title: string;
  desc: string;
  icon: string;
  unlocked: boolean;
  xpReward: number;
}

const BADGES_LIST: BadgeItem[] = [
  { id: 'first_query', title: 'First Spark', desc: 'Asked your first question to the Grounded Tutor', icon: '✨', unlocked: true, xpReward: 50 },
  { id: 'quiz_ace', title: 'Quiz Master', desc: 'Scored 100% on any Adaptive Quiz', icon: '🎯', unlocked: true, xpReward: 100 },
  { id: 'streak_5', title: '5-Day Comet', desc: 'Maintained a 5-day consecutive study streak', icon: '🔥', unlocked: true, xpReward: 150 },
  { id: 'feynman_champ', title: 'Feynman Scholar', desc: 'Achieved an Intuitive Master score in Explain-It-Back mode', icon: '🦋', unlocked: true, xpReward: 120 },
  { id: 'camera_snap', title: 'OCR Explorer', desc: 'Snapped a textbook formula using Camera Doubt Solver', icon: '📸', unlocked: true, xpReward: 75 },
  { id: 'mastery_85', title: 'Algorithm Knight', desc: 'Reached 85%+ mastery in Binary Search and Trees', icon: '⚔️', unlocked: false, xpReward: 200 },
  { id: 'streak_14', title: 'Supernova Streak', desc: 'Achieve a 14-day study streak', icon: '🪐', unlocked: false, xpReward: 300 },
  { id: 'all_mastery', title: 'Curriculum Conqueror', desc: 'Attain 100% mastery across all curriculum modules', icon: '👑', unlocked: false, xpReward: 500 },
];

export default function AchievementsPage() {
  const { user, mode } = useAuthStore();

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 font-sans">
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-xl flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-[var(--primary)] text-white flex items-center justify-center text-3xl shadow-lg">
            🏆
          </div>
          <div>
            <span className="text-xs font-mono text-[var(--primary)] uppercase font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Learner Passport & Badges</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-display font-black text-[var(--text-main)] mt-0.5">
              Achievements & Quests
            </h1>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Level {user?.level || 4} • {user?.xp || 1250} Total XP • {user?.stars || 48} Stars Earned
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-center">
            <span className="text-lg font-mono font-bold text-amber-400 flex items-center justify-center gap-1">
              <Flame className="w-4 h-4 fill-amber-400" />
              <span>{user?.streak_days || 5}d</span>
            </span>
            <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Streak</span>
          </div>

          <div className="px-4 py-2 rounded-2xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-center">
            <span className="text-lg font-mono font-bold text-[var(--primary)] flex items-center justify-center gap-1">
              <Star className="w-4 h-4 fill-[var(--primary)]" />
              <span>{user?.stars || 48}</span>
            </span>
            <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Stars</span>
          </div>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-[var(--text-main)] flex items-center gap-2">
          <Award className="w-4 h-4 text-[var(--primary)]" />
          <span>Unlocked Badges & Honors</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {BADGES_LIST.map((b) => (
            <motion.div
              key={b.id}
              whileHover={{ scale: 1.03 }}
              className={`p-5 rounded-3xl border transition-all flex flex-col justify-between ${
                b.unlocked
                  ? 'bg-[var(--bg-surface)] border-[var(--border-hover)] shadow-lg'
                  : 'bg-[var(--bg-surface)]/40 border-[var(--border-subtle)] opacity-50'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl">{b.icon}</span>
                {b.unlocked ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-500/30">
                    Unlocked ✓
                  </span>
                ) : (
                  <span className="p-1 rounded-full bg-white/5 text-slate-400">
                    <Lock className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-bold text-[var(--text-main)]">{b.title}</h3>
                <p className="text-[11px] text-[var(--text-muted)] leading-snug">{b.desc}</p>
              </div>

              <div className="mt-4 pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] font-mono text-[var(--primary)]">
                <span>Reward:</span>
                <span className="font-bold">+{b.xpReward} XP</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
