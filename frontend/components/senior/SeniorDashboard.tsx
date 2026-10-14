'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Flame,
  Award,
  BookOpen,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  ShieldCheck,
  RotateCcw,
  Play,
  Pause,
  Target,
  ChevronRight,
  Search,
  Zap,
  RefreshCw,
  SlidersHorizontal,
  Bot,
  Layers,
  GraduationCap
} from 'lucide-react';
import { computeDaysLeft, formatDaysLeftLabel } from '@/lib/dateUtils';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { api, DashboardSummaryResponse } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { useThemeStore, playButtonSound } from '@/stores/useThemeStore';
import { useCourseStore } from '@/stores/useCourseStore';

export const SeniorDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { reducedMotion, sound } = useThemeStore();
  const { activeCourseId, courses } = useCourseStore();
  const [data, setData] = useState<DashboardSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTopicCurve, setSelectedTopicCurve] = useState<string>('Binary Trees');

  // Pomodoro Focus Timer State
  const [pomodoroSeconds, setPomodoroSeconds] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState<'focus' | 'break'>('focus');

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const resolvedCourseId = activeCourseId || (courses.length > 0 ? courses[0].id : 'c-bio-0001-0000-000000000001');
      const userId = user?.id || 'u-scholar-0001-0000-000000000001';
      const summary = await api.getDashboardSummary(userId, resolvedCourseId);
      setData(summary);
      if (summary.forgetting_curve && summary.forgetting_curve.length > 0) {
        setSelectedTopicCurve(summary.forgetting_curve[0].topic);
      }
    } catch (err) {
      console.error('Failed to load senior dashboard summary:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [user?.id, activeCourseId]);

  // Pomodoro countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && pomodoroSeconds > 0) {
      interval = setInterval(() => {
        setPomodoroSeconds((prev) => prev - 1);
      }, 1000);
    } else if (pomodoroSeconds === 0) {
      if (sound) playButtonSound(800, 0.2);
      if (timerMode === 'focus') {
        setTimerMode('break');
        setPomodoroSeconds(5 * 60);
      } else {
        setTimerMode('focus');
        setPomodoroSeconds(25 * 60);
      }
      setIsTimerRunning(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, pomodoroSeconds, timerMode, sound]);

  const toggleTimer = () => {
    if (sound) playButtonSound(600);
    setIsTimerRunning(!isTimerRunning);
  };

  const resetTimer = () => {
    if (sound) playButtonSound(500);
    setIsTimerRunning(false);
    setPomodoroSeconds(timerMode === 'focus' ? 25 * 60 : 5 * 60);
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (isLoading && !data) {
    return (
      <div className="space-y-6 max-w-[1600px] mx-auto p-4 animate-pulse">
        <div className="h-16 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)]" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)]" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 h-80 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)]" />
          <div className="lg:col-span-4 h-80 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)]" />
        </div>
      </div>
    );
  }

  const summary = data!;
  const overallPct = Math.round((summary?.overall_mastery || 0.74) * 100);
  const readinessPct = Math.round((summary?.exam?.readiness_score || 0.78) * 100);
  const weeklyGoalPct = Math.round(summary?.weekly_goal?.progress_pct || 68);

  // Active forgetting curve data for chart
  const activeCurve =
    summary.forgetting_curve.find((fc) => fc.topic === selectedTopicCurve) ||
    summary.forgetting_curve[0];

  const curvePoints = activeCurve ? activeCurve.retention_points : [];
  const examDaysLeft = summary.exam?.date ? computeDaysLeft(summary.exam.date) : (summary.exam?.days_left ?? 14);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16 font-sans">
      {/* ── 1. GREETING & EXAM READINESS ROW ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-6 rounded-[var(--radius-box)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-card)]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-muted)]">
            <span className="text-[var(--primary)] font-bold flex items-center gap-1">
              <GraduationCap className="w-4 h-4" /> Scholar Focus Studio
            </span>
            <span>•</span>
            <span className="text-[var(--success)] font-bold">BKT Bayesian Tracking</span>
            {summary.is_demo_data && (
              <span className="px-2 py-0.5 rounded-full bg-[var(--warning)]/15 text-[var(--warning)] border border-[var(--warning)]/30 font-bold text-[10px]">
                Demo Data Active
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-[var(--text-main)] tracking-tight">
            Welcome back, <span className="text-[var(--primary)]">{summary.user_name || 'Scholar'}</span>
          </h1>
          <p className="text-xs text-[var(--text-muted)] flex items-center gap-2 flex-wrap">
            <span>Active Workspace: <strong className="text-[var(--text-main)]">{summary.course_title}</strong></span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 font-mono text-[var(--primary)] font-bold px-2 py-0.5 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/30">
              <Calendar className="w-3 h-3" />
              <span>Target Final Exam: {summary.exam?.date ? `${summary.exam.date} (${formatDaysLeftLabel(examDaysLeft)})` : `${examDaysLeft} days left`}</span>
            </span>
          </p>
        </div>

        {/* Quick Rings & Action Controls */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0 flex-wrap">
          {/* Exam Readiness Pill */}
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] shadow-sm">
            <div className="relative w-8 h-8 flex items-center justify-center">
              <svg className="w-8 h-8 transform -rotate-90">
                <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="3" className="text-[var(--border-subtle)]" fill="transparent" />
                <circle
                  cx="16"
                  cy="16"
                  r="13"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-[var(--primary)] transition-all duration-700"
                  fill="transparent"
                  strokeDasharray={81.68}
                  strokeDashoffset={81.68 - (81.68 * readinessPct) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-[10px] font-mono font-black text-[var(--text-main)]">{readinessPct}%</span>
            </div>
            <div className="text-left">
              <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] block">Exam Readiness</span>
              <span className="text-xs font-bold text-[var(--text-main)]">{summary.exam?.status.replace('_', ' ').toUpperCase()}</span>
            </div>
          </div>

          {/* Weekly Goal Progress */}
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] shadow-sm">
            <div className="relative w-8 h-8 flex items-center justify-center">
              <svg className="w-8 h-8 transform -rotate-90">
                <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="3" className="text-[var(--border-subtle)]" fill="transparent" />
                <circle
                  cx="16"
                  cy="16"
                  r="13"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-[var(--secondary)] transition-all duration-700"
                  fill="transparent"
                  strokeDasharray={81.68}
                  strokeDashoffset={81.68 - (81.68 * weeklyGoalPct) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-[10px] font-mono font-black text-[var(--text-main)]">{weeklyGoalPct}%</span>
            </div>
            <div className="text-left">
              <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] block">Weekly Goal</span>
              <span className="text-xs font-bold text-[var(--text-main)]">{summary.weekly_goal?.completed_questions}/{summary.weekly_goal?.target_questions} Qs</span>
            </div>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={loadDashboard}
            title="Refresh database state"
            className="p-2.5 rounded-2xl bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── 2. TOP METRIC TILES ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tile 1: Overall Mastery */}
        <div className="p-5 rounded-[var(--radius-box)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-card)] space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-medium">
            <span>Overall Mastery (BKT)</span>
            <span className="text-[var(--primary)] font-mono font-bold flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" /> +{Math.round((summary.change_7d || 0.08) * 100)}% 7d
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-display font-black text-[var(--text-main)]">{overallPct}%</span>
            <span className="text-[11px] font-mono text-[var(--primary)] px-2 py-0.5 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/30">
              6 Topics Evaluated
            </span>
          </div>
        </div>

        {/* Tile 2: Study Streak */}
        <div className="p-5 rounded-[var(--radius-box)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-card)] space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-medium">
            <span>Learning Streak</span>
            <span className="text-[var(--warning)] font-mono font-bold flex items-center gap-0.5">
              <Flame className="w-3.5 h-3.5 fill-[var(--warning)]" /> Max: {summary.streak?.longest || 7}d
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-display font-black text-[var(--text-main)]">{summary.streak?.current || 5} Days</span>
            <span className="text-[11px] font-mono text-[var(--text-muted)]">Active Spaced Cycle</span>
          </div>
        </div>

        {/* Tile 3: Spaced Reviews Due */}
        <div className="p-5 rounded-[var(--radius-box)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-card)] space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-medium">
            <span>Spaced Reviews Due</span>
            <span className="text-[var(--danger)] font-mono font-bold">
              {summary.due_reviews?.count || 1} Overdue
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-display font-black text-[var(--text-main)]">{summary.due_reviews?.count || 1}</span>
            <Link
              href="/assessment?mode=review"
              className="text-[11px] font-mono text-[var(--primary)] hover:underline flex items-center gap-1 font-bold"
            >
              <span>Review Now</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Tile 4: XP Level & Total */}
        <div className="p-5 rounded-[var(--radius-box)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-card)] space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-medium">
            <span>Scholar Level</span>
            <span className="text-[var(--primary)] font-mono font-bold">Level {summary.xp?.level || 6}</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-display font-black text-[var(--text-main)]">{summary.xp?.total || 2400} XP</span>
            <span className="text-[11px] font-mono text-[var(--text-muted)]">{summary.xp?.xp_to_next || 100} to L{summary.xp?.level + 1}</span>
          </div>
        </div>
      </div>

      {/* ── 3. BENTO ROW: TOPIC MASTERY & PREREQUISITE ROOT CAUSES ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Topic Mastery Heatmap (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-[var(--radius-box)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-card)] space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
            <div>
              <h2 className="text-base font-display font-bold text-[var(--text-main)]">Topic Mastery Distribution</h2>
              <p className="text-[11px] text-[var(--text-muted)]">Bayesian Knowledge Tracing (P(L) prior vs updated posterior)</p>
            </div>
            <Link href="/knowledge-map" className="text-xs text-[var(--primary)] hover:underline font-semibold flex items-center gap-1 font-mono">
              <span>View DAG</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3 flex-1 justify-center flex flex-col">
            {summary.topic_mastery.map((t) => {
              const pct = Math.round(t.mastery * 100);
              const isWeak = pct < 65;
              const isMastered = pct >= 80;

              return (
                <div key={t.topic_id} className="space-y-1 group">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-[var(--text-main)] flex items-center gap-2">
                      <span>{t.name}</span>
                      <span className="text-[10px] font-mono text-[var(--text-muted)]">({t.attempts} attempts)</span>
                      {isWeak && (
                        <span className="px-2 py-0.2 rounded-full border border-[var(--danger)]/50 text-[var(--danger)] text-[9px] font-mono font-bold bg-[var(--danger)]/10">
                          Needs Focus
                        </span>
                      )}
                      {isMastered && (
                        <span className="px-2 py-0.2 rounded-full border border-[var(--success)]/50 text-[var(--success)] text-[9px] font-mono font-bold bg-[var(--success)]/10">
                          Mastered
                        </span>
                      )}
                    </span>
                    <span className="font-mono font-bold text-[var(--text-main)]">{pct}%</span>
                  </div>

                  <div className="w-full bg-[var(--bg-surface-elevated)] h-2.5 rounded-full overflow-hidden p-0.5 border border-[var(--border-subtle)]">
                    <div
                      style={{ width: `${pct}%` }}
                      className={`h-full rounded-full transition-all duration-700 ${
                        isWeak
                          ? 'bg-[var(--danger)]'
                          : isMastered
                          ? 'bg-[var(--success)]'
                          : 'bg-[var(--primary)]'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
            <span className="text-[var(--text-muted)] font-mono text-[11px]">80%+ threshold counts toward Course Certification</span>
            <Link
              href="/assessment"
              className="px-4 py-2 rounded-[var(--radius)] bg-[var(--primary)] hover:opacity-90 text-[var(--primary-contrast)] font-bold text-xs shadow-sm transition-all"
            >
              Start Diagnostic Quiz ➔
            </Link>
          </div>
        </div>

        {/* Root Cause Prerequisite Blocker Card (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-[var(--radius-box)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-card)] space-y-4 flex flex-col justify-between">
          <div className="border-b border-[var(--border-subtle)] pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[var(--danger)]/10 text-[var(--danger)] flex items-center justify-center border border-[var(--danger)]/30">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h2 className="text-base font-display font-bold text-[var(--text-main)]">Targeted Weakness & Root Cause</h2>
            </div>
            <span className="text-[10px] font-mono text-[var(--danger)] px-2 py-0.5 rounded-full bg-[var(--danger)]/10 border border-[var(--danger)]/30">
              Active Blocker
            </span>
          </div>

          {/* Recommended Remediation details */}
          <div className="p-4 rounded-2xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono uppercase text-[var(--text-muted)]">Target Remediation</span>
                <h3 className="font-bold text-sm text-[var(--text-main)]">{summary.recommended_next?.title}</h3>
              </div>
              <span className="px-2 py-1 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-mono font-bold border border-[var(--primary)]/20">
                Actionable
              </span>
            </div>

            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              {summary.recommended_next?.why}
            </p>

            {summary.recommended_next?.source_doc && (
              <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
                <span className="flex items-center gap-1 text-[var(--primary)]">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{summary.recommended_next.source_doc} • p.{summary.recommended_next.source_page}</span>
                </span>
                <Link
                  href={summary.recommended_next.link}
                  className="text-[var(--primary)] font-bold hover:underline"
                >
                  Inspect Source
                </Link>
              </div>
            )}
          </div>

          <Link
            href={summary.recommended_next?.link || '/tutor'}
            className="w-full py-3 rounded-[var(--radius)] bg-[var(--primary)] hover:opacity-90 text-[var(--primary-contrast)] font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
          >
            <span>Remediate Foundational Concept</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* ── 4. FORGETTING CURVE & 90-DAY ACTIVITY CALENDAR ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Forgetting Curve Interactive Chart (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-[var(--radius-box)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-card)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
            <div>
              <h2 className="text-base font-display font-bold text-[var(--text-main)]">Spaced Repetition Forgetting Curve</h2>
              <p className="text-[11px] text-[var(--text-muted)]">Predicted 14-day memory retrievability R(t) = e^(-t/S)</p>
            </div>

            {/* Topic Selector Dropdown */}
            <select
              value={selectedTopicCurve}
              onChange={(e) => setSelectedTopicCurve(e.target.value)}
              className="bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-xs text-[var(--text-main)] rounded-xl px-3 py-1.5 focus:outline-none focus:border-[var(--primary)] font-mono"
            >
              {summary.forgetting_curve.map((fc) => (
                <option key={fc.topic} value={fc.topic}>
                  {fc.topic} (S: {fc.stability_days}d {fc.is_overdue ? '• Overdue' : ''})
                </option>
              ))}
            </select>
          </div>

          {/* Recharts Area Chart */}
          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={curvePoints}>
                <defs>
                  <linearGradient id="curveGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                <YAxis
                  stroke="var(--text-muted)"
                  fontSize={10}
                  tickLine={false}
                  domain={[0, 1]}
                  tickFormatter={(v) => `${Math.round(v * 100)}%`}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    fontSize: '11px',
                    color: 'var(--text-main)',
                  }}
                  formatter={(val: any) => [`${Math.round(Number(val) * 100)}% Retention`, 'Predicted Memory']}
                />
                <Area
                  type="monotone"
                  dataKey="retention"
                  stroke="var(--primary)"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#curveGlow)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-mono pt-1">
            <span>Selected Stability: {activeCurve?.stability_days || 2.5} days</span>
            <span>Optimal recall trigger threshold: 60%</span>
          </div>
        </div>

        {/* 90-Day Streak Heatmap & Focus Timer (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-[var(--radius-box)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-card)] space-y-4 flex flex-col justify-between">
          <div className="border-b border-[var(--border-subtle)] pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-display font-bold text-[var(--text-main)]">90-Day Study Activity</h2>
              <p className="text-[11px] text-[var(--text-muted)]">GitHub-style diagnostic frequency</p>
            </div>
            <span className="text-xs font-mono text-[var(--warning)] font-bold flex items-center gap-1">
              <Flame className="w-4 h-4 fill-[var(--warning)]" />
              <span>{summary.streak?.current || 5}d Streak</span>
            </span>
          </div>

          {/* 90-Day Matrix Tiles */}
          <div className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto no-scrollbar py-2">
            {summary.streak?.calendar_90d?.map((day, i) => {
              const bg =
                day.intensity === 0
                  ? 'bg-[var(--bg-surface-elevated)] opacity-40'
                  : day.intensity === 1
                  ? 'bg-[var(--primary)] opacity-40'
                  : day.intensity === 2
                  ? 'bg-[var(--primary)] opacity-65'
                  : day.intensity === 3
                  ? 'bg-[var(--primary)] opacity-85'
                  : 'bg-[var(--primary)] opacity-100 shadow-sm';

              return (
                <div
                  key={i}
                  title={`${day.date}: ${day.count} questions solved`}
                  className={`w-2.5 h-2.5 rounded-sm ${bg} transition-transform hover:scale-125`}
                />
              );
            })}
          </div>

          {/* Pomodoro Focus Timer Section */}
          <div className="p-3.5 rounded-2xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-mono">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] block">
                  Pomodoro {timerMode === 'focus' ? 'Focus (25m)' : 'Rest (5m)'}
                </span>
                <span className="text-lg font-mono font-black text-[var(--text-main)]">
                  {formatTimer(pomodoroSeconds)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleTimer}
                className={`p-2 rounded-xl text-white font-bold text-xs shadow-sm transition-all ${
                  isTimerRunning ? 'bg-[var(--danger)]' : 'bg-[var(--primary)]'
                }`}
              >
                {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={resetTimer}
                className="p-2 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--border-subtle)] text-[var(--text-muted)] border border-[var(--border-subtle)] transition-all"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. DATA-DRIVEN INSIGHTS & RECENT ACTIVITY FEED ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Insights & Badges (6 cols) */}
        <div className="lg:col-span-6 p-6 rounded-[var(--radius-box)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-card)] space-y-4">
          <div className="border-b border-[var(--border-subtle)] pb-3 flex items-center justify-between">
            <h2 className="text-base font-display font-bold text-[var(--text-main)]">Data-Driven Insights</h2>
            <span className="text-xs font-mono text-[var(--primary)]">Real Deltas</span>
          </div>

          <div className="space-y-2.5">
            {summary.insights.map((ins) => (
              <div
                key={ins.id}
                className="p-3.5 rounded-2xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] flex items-start justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <span className="font-bold text-xs text-[var(--text-main)] block">{ins.title}</span>
                  <span className="text-xs text-[var(--text-muted)] leading-relaxed block">{ins.message}</span>
                </div>
                {ins.delta && (
                  <span className="px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] font-mono text-[10px] font-bold shrink-0 border border-[var(--primary)]/20">
                    {ins.delta}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Badge shelf snippet */}
          <div className="pt-2 border-t border-[var(--border-subtle)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[var(--text-main)]">Academic Badges</span>
              <span className="text-[11px] font-mono text-[var(--text-muted)]">
                {summary.badges.filter((b) => b.earned).length}/{summary.badges.length} Unlocked
              </span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {summary.badges.map((b) => (
                <div
                  key={b.badge_key}
                  title={`${b.title}: ${b.description}`}
                  className={`p-2.5 rounded-2xl border flex items-center gap-2 shrink-0 ${
                    b.earned
                      ? 'bg-[var(--bg-surface-elevated)] border-[var(--primary)] shadow-sm'
                      : 'bg-[var(--bg-app)] border-[var(--border-subtle)] opacity-45'
                  }`}
                >
                  <span className="text-lg">{b.icon}</span>
                  <div className="text-left">
                    <span className="text-[11px] font-bold text-[var(--text-main)] block truncate max-w-[100px]">{b.title}</span>
                    <span className="text-[9px] font-mono text-[var(--text-muted)]">
                      {b.earned ? 'Earned' : `${Math.round(b.progress_pct)}%`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Real-time Activity Log (6 cols) */}
        <div className="lg:col-span-6 p-6 rounded-[var(--radius-box)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-card)] space-y-4">
          <div className="border-b border-[var(--border-subtle)] pb-3 flex items-center justify-between">
            <h2 className="text-base font-display font-bold text-[var(--text-main)]">Recent Grounded Activity</h2>
            <span className="text-[11px] font-mono text-[var(--text-muted)]">Last 10 Events</span>
          </div>

          <div className="space-y-2 max-h-[340px] overflow-y-auto no-scrollbar">
            {summary.recent_activity.map((act) => (
              <Link
                key={act.id}
                href={act.link}
                className="p-3 rounded-2xl bg-[var(--bg-surface-elevated)] hover:bg-[var(--border-subtle)] border border-[var(--border-subtle)] flex items-center justify-between transition-colors group block"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-bold text-xs">
                    {act.type === 'quiz' ? '📝' : act.type === 'game' ? '🎮' : act.type === 'chat' ? '💬' : '📄'}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[var(--text-main)] block group-hover:text-[var(--primary)] transition-colors">
                      {act.title}
                    </span>
                    {act.subtitle && (
                      <span className="text-[11px] text-[var(--text-muted)] font-mono">{act.subtitle}</span>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0 font-mono">
                  <span className="text-[11px] font-bold text-[var(--primary)] block">+{act.xp_earned} XP</span>
                  <span className="text-[10px] text-[var(--text-muted)]">{act.timestamp}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default SeniorDashboard;
