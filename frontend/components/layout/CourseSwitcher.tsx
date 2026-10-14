'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Check, ChevronDown, Plus } from 'lucide-react';
import { useCourseStore } from '@/stores/useCourseStore';
import { useAuthStore } from '@/stores/useAuthStore';

interface CourseSwitcherProps {
  compact?: boolean;
}

export default function CourseSwitcher({ compact = false }: CourseSwitcherProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, mode } = useAuthStore();
  const {
    courses,
    activeCourseId,
    activeCourse,
    setActiveCourseId,
    fetchCourses
  } = useCourseStore();

  useEffect(() => {
    const userId = user?.id || (mode === 'explorer' ? 'u-explorer-0002-0000-000000000002' : 'u-scholar-0001-0000-000000000001');
    if (courses.length === 0) {
      fetchCourses(userId);
    }
  }, [user, mode, courses.length, fetchCourses]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentCourse = activeCourse || courses.find((c) => c.id === activeCourseId) || courses[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-2xl bg-bg-surface hover:bg-bg-elevated border border-border-subtle text-text-main text-xs font-semibold transition-all shadow-sm max-w-[120px] sm:max-w-[280px] ${
          open ? 'border-primary ring-2 ring-primary/20' : ''
        }`}
        title="Switch active course"
      >
        <BookOpen className="w-3.5 h-3.5 text-primary shrink-0" />
        <span className="truncate text-left font-display">
          {currentCourse ? currentCourse.title : 'Select Course...'}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-text-muted shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-64 sm:w-72 rounded-card bg-bg-surface border border-border-subtle shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-1.5 border-b border-border-subtle flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted font-bold">
              Enrolled Courses ({courses.length})
            </span>
            <Link
              href="/courses"
              onClick={() => setOpen(false)}
              className="text-[11px] text-primary hover:underline font-semibold"
            >
              All Courses
            </Link>
          </div>

          <div className="max-h-60 overflow-y-auto py-1 divide-y divide-border-subtle/40">
            {courses.map((c) => {
              const isSelected = c.id === (currentCourse ? currentCourse.id : activeCourseId);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setActiveCourseId(c.id);
                    setOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left flex items-center justify-between gap-2 hover:bg-bg-elevated transition-colors ${
                    isSelected ? 'bg-primary/10 font-bold' : ''
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className={`text-xs truncate ${isSelected ? 'text-primary' : 'text-text-main'}`}>
                      {c.title}
                    </p>
                    <span className="text-[10px] font-mono text-text-muted">
                      {c.subject} • {c.bkt_mastery_pct ? `${c.bkt_mastery_pct}% BKT` : 'Active'}
                    </span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="border-t border-border-subtle pt-1.5 px-3">
            <Link
              href="/courses"
              onClick={() => setOpen(false)}
              className="w-full py-1.5 rounded-btn bg-bg-app hover:bg-bg-elevated border border-border-subtle text-text-main text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-primary" />
              <span>Join Class or Add Course</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
