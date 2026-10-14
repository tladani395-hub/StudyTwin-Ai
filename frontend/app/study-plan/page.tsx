'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  Circle,
  Sparkles,
  ArrowRight,
  GraduationCap,
  Calendar
} from 'lucide-react';
import Link from 'next/link';
import { api, StudyPlan } from '@/lib/api';

export default function StudyPlanPage() {
  const [examDate, setExamDate] = useState('2026-10-25');
  const [hoursPerDay, setHoursPerDay] = useState(2.0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const [completedDays, setCompletedDays] = useState<number[]>([1]);

  const loadPlan = useCallback(async () => {
    setIsGenerating(true);
    try {
      const plan = await api.generateStudyPlan({
        course_id: 1,
        user_id: 1,
        exam_date: examDate,
        available_hours_per_day: hoursPerDay,
      });
      setStudyPlan(plan);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  }, [examDate, hoursPerDay]);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  const toggleDayComplete = (dayNum: number) => {
    if (completedDays.includes(dayNum)) {
      setCompletedDays(completedDays.filter((d) => d !== dayNum));
    } else {
      setCompletedDays([...completedDays, dayNum]);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-xs font-mono text-text-muted">
          <span className="text-primary flex items-center gap-1 font-bold">
            <CalendarDays className="w-3.5 h-3.5" /> Adaptive Schedule Generator
          </span>
          <span>•</span>
          <span className="text-secondary font-semibold">Spaced Repetition Optimized</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-black text-text-main mt-1">
          Adaptive Study Planner
        </h1>
        <p className="text-xs sm:text-sm text-text-muted mt-0.5">
          Calculates spaced repetition drills and prioritized weak topic remediation before your exam deadline.
        </p>
      </div>

      {/* Configuration Card */}
      <div className="p-6 sm:p-8 rounded-card bg-bg-surface border border-border-subtle shadow-card space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
          <div className="space-y-2">
            <label className="font-semibold text-text-main flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-primary" />
              <span>Target Exam Date</span>
            </label>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full bg-bg-app border border-border-subtle rounded-btn p-3 text-text-main focus:outline-none focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="font-semibold text-text-main flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-primary" />
              <span>Available Time / Day</span>
            </label>
            <select
              value={hoursPerDay}
              onChange={(e) => setHoursPerDay(Number(e.target.value))}
              className="w-full bg-bg-app border border-border-subtle rounded-btn p-3 text-text-main focus:outline-none focus:border-primary"
            >
              <option value={1.0}>1.0 Hour (Sprint)</option>
              <option value={1.5}>1.5 Hours</option>
              <option value={2.0}>2.0 Hours (Recommended)</option>
              <option value={3.0}>3.0 Hours (Deep Dive)</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={loadPlan}
              disabled={isGenerating}
              className="w-full py-3.5 rounded-btn bg-primary hover:opacity-90 disabled:opacity-40 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isGenerating ? 'Recalculating...' : 'Regenerate Study Plan'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Plan Details & Day Checklist */}
      {studyPlan && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-card bg-bg-surface border border-border-subtle shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-full bg-primary/15 text-primary border border-primary/30">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-text-muted font-mono">Estimated Mastery Boost</span>
                <p className="text-sm font-bold text-text-main">
                  +22% Mastery Gain by Exam Date ({examDate})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <a
                href={api.getCalendarIcsUrl(1, 1)}
                download="aanvi_study_schedule.ics"
                className="px-4 py-2 rounded-btn bg-primary/10 hover:bg-primary/20 text-primary text-xs font-mono font-bold border border-primary/30 flex items-center gap-1.5 transition-all"
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Export .ICS Calendar</span>
              </a>

              <div className="text-xs font-mono text-text-muted">
                Completed: <span className="text-primary font-bold">{completedDays.length}</span> / {studyPlan.days.length} Days
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {studyPlan.days.map((day) => {
              const isDone = completedDays.includes(day.day);
              return (
                <motion.div
                  key={day.day}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-5 rounded-card border transition-all flex flex-wrap items-center justify-between gap-4 ${
                    isDone
                      ? 'bg-bg-app/60 border-border-subtle opacity-70'
                      : 'bg-bg-surface border-border-subtle shadow-card'
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <button
                      type="button"
                      onClick={() => toggleDayComplete(day.day)}
                      className={`mt-1 p-1 rounded-full border transition-colors ${
                        isDone
                          ? 'bg-primary text-white border-primary'
                          : 'border-border-subtle hover:border-primary text-text-muted'
                      }`}
                    >
                      {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                    </button>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded-full bg-bg-app text-text-main border border-border-subtle">
                          Day {day.day}
                        </span>
                        <span className="text-xs text-text-muted font-mono">{day.date}</span>
                        <span className="text-xs text-primary font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {day.duration_min} min
                        </span>
                      </div>

                      <h3
                        className={`text-sm font-bold mt-1.5 ${
                          isDone ? 'line-through text-text-muted' : 'text-text-main'
                        }`}
                      >
                        {day.topic}
                      </h3>
                      <p className="text-xs text-text-muted mt-0.5">{day.activity}</p>
                      <p className="text-[11px] text-primary mt-1 font-mono">
                        Rationale: {day.rationale}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/tutor?query=Let's study ${encodeURIComponent(day.topic)}`}
                    className="px-4 py-2 rounded-btn bg-bg-app hover:bg-bg-elevated text-xs font-semibold text-text-main border border-border-subtle transition-colors flex items-center gap-1.5"
                  >
                    <span>Start Session</span>
                    <ArrowRight className="w-3.5 h-3.5 text-primary" />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
