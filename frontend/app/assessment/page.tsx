'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ClipboardCheck,
  Sparkles,
  ShieldCheck,
  Filter,
  GraduationCap,
  BookOpen,
  Calendar,
  Layers,
  ArrowRight,
  ChevronDown
} from 'lucide-react';
import { api, AssessmentDetail } from '@/lib/api';
import { Quiz } from '@/components/Quiz';
import { useAuthStore } from '@/stores/useAuthStore';
import { useCourseStore } from '@/stores/useCourseStore';

function AssessmentContent() {
  const { user } = useAuthStore();
  const searchParams = useSearchParams();
  const initialTopic = searchParams.get('topic') || 'All';

  const { courses, activeCourseId, setActiveCourseId, fetchCourses } = useCourseStore();

  const [selectedCourseId, setSelectedCourseId] = useState<string>(activeCourseId);
  const [topic, setTopic] = useState(initialTopic);
  const [difficulty, setDifficulty] = useState('medium');
  const [numQuestions, setNumQuestions] = useState(4);
  const [types, setTypes] = useState<string[]>(['MCQ', 'numerical', 'short_answer']);
  const [isGenerating, setIsGenerating] = useState(false);
  const [assessment, setAssessment] = useState<AssessmentDetail | null>(null);
  const [courseTopics, setCourseTopics] = useState<string[]>([]);

  // Keep selectedCourseId in sync with store
  useEffect(() => {
    if (activeCourseId) {
      setSelectedCourseId(activeCourseId);
    } else if (courses.length > 0) {
      setSelectedCourseId(courses[0].id);
    }
  }, [activeCourseId, courses]);

  // Load enrolled courses if empty
  useEffect(() => {
    if (courses.length === 0) {
      const uId = user?.id || 'u-scholar-0001-0000-000000000001';
      fetchCourses(uId);
    }
  }, [courses.length, user, fetchCourses]);

  // Dynamically load topics whenever selected course changes
  useEffect(() => {
    let isMounted = true;
    const loadTopicsForCourse = async () => {
      if (!selectedCourseId) return;

      try {
        const detail = await api.getCourseDetail(selectedCourseId);
        if (detail && detail.topics && detail.topics.length > 0) {
          if (isMounted) {
            setCourseTopics(detail.topics.map((t: any) => t.name));
            return;
          }
        }
      } catch (err) {
        // Fallback to topic heuristic
      }

      const activeC = courses.find((c) => c.id === selectedCourseId);
      const subject = (activeC?.subject || '').toLowerCase();
      const title = (activeC?.title || '').toLowerCase();

      if (subject.includes('bio') || title.includes('bio')) {
        if (isMounted) setCourseTopics(['Cell Structure & Organelles', 'Mitosis & Cell Cycle', 'Meiosis', 'DNA Replication', 'Mendelian Genetics']);
      } else if (subject.includes('phys') || title.includes('phys') || title.includes('adventures')) {
        if (isMounted) setCourseTopics(["Newton's Laws of Motion", 'Work, Energy & Power', 'Wave Oscillations', 'Thermodynamic Systems']);
      } else {
        if (isMounted) setCourseTopics(['Arrays & Sorting', 'Binary Search Invariant', 'Tree Structures & BST', 'Graph Traversals BFS/DFS']);
      }
    };

    loadTopicsForCourse();
    return () => {
      isMounted = false;
    };
  }, [selectedCourseId, courses]);

  const toggleType = (t: string) => {
    if (types.includes(t)) {
      if (types.length > 1) setTypes(types.filter((x) => x !== t));
    } else {
      setTypes([...types, t]);
    }
  };

  const handleCourseChange = (newCourseId: string) => {
    setSelectedCourseId(newCourseId);
    setActiveCourseId(newCourseId);
    setTopic('All');
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const currentC = courses.find((c) => c.id === selectedCourseId);
      const data = await api.generateAssessment({
        course_id: selectedCourseId || 1,
        user_id: user?.id || 'u-scholar-0001-0000-000000000001',
        topic: topic,
        difficulty: difficulty,
        num_questions: numQuestions,
        types: types,
      });

      // Augment title with scoped course name
      if (data && currentC) {
        data.title = `Adaptive Quiz: ${currentC.title} (${topic})`;
      }
      setAssessment(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-xs font-mono text-text-muted">
          <span className="text-primary flex items-center gap-1 font-bold">
            <GraduationCap className="w-3.5 h-3.5" /> Adaptive Assessment Engine
          </span>
          <span>•</span>
          <span className="text-secondary font-semibold">Anti-Duplication Threshold: 0.70</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-black text-text-main mt-1">
          Verified Course Assessments
        </h1>
        <p className="text-xs sm:text-sm text-text-muted mt-0.5">
          Generate verified quizzes tailored to your course curriculum with Bayesian knowledge tracing and sandbox numerical validation.
        </p>
      </div>

      {!assessment ? (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 sm:p-8 rounded-card bg-bg-surface border border-border-subtle shadow-card space-y-6"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-border-subtle pb-4">
            <h2 className="text-base font-display font-bold text-text-main flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary" />
              Configure Assessment Parameters
            </h2>
            <div className="flex items-center space-x-1.5 text-xs text-primary font-mono px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/30 font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Dual Model + Sandbox Verified</span>
            </div>
          </div>

          {/* COURSE PICKER (Top Level) */}
          <div className="p-4 rounded-card bg-bg-app border border-border-subtle space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-text-main flex items-center gap-1.5 uppercase font-mono tracking-wider">
                <BookOpen className="w-4 h-4 text-primary" />
                <span>Target Course Scope</span>
              </label>
              {selectedCourse && (
                <span className="text-[11px] font-mono text-primary font-bold px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                  {selectedCourse.subject}
                </span>
              )}
            </div>

            <div className="relative">
              <select
                value={selectedCourseId}
                onChange={(e) => handleCourseChange(e.target.value)}
                className="w-full bg-bg-surface border border-border-subtle rounded-btn px-4 py-3 text-sm font-display font-bold text-text-main focus:outline-none focus:border-primary appearance-none cursor-pointer"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} — {c.subject} ({c.bkt_mastery_pct ? `${c.bkt_mastery_pct}% BKT` : 'Enrolled'})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-text-muted absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <p className="text-[11px] text-text-muted">
              Quizzes and topic recommendations dynamically adapt to the selected course curriculum.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs sm:text-sm">
            {/* Dynamic Topic Selector */}
            <div className="space-y-2">
              <label className="font-semibold text-text-main flex items-center justify-between">
                <span>Target Curriculum Topic</span>
                <span className="text-[10px] font-mono text-text-muted">
                  {courseTopics.length} Concepts Available
                </span>
              </label>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full bg-bg-app border border-border-subtle rounded-btn p-3 text-text-main focus:outline-none focus:border-primary font-medium"
              >
                <option value="All">All Topics (Comprehensive Course Review)</option>
                {courseTopics.map((tName) => (
                  <option key={tName} value={tName}>
                    {tName}
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty Calibration */}
            <div className="space-y-2">
              <label className="font-semibold text-text-main">Difficulty Calibration</label>
              <div className="grid grid-cols-3 gap-2">
                {['easy', 'medium', 'hard'].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    className={`py-2.5 rounded-btn border text-xs font-bold uppercase transition-all ${
                      difficulty === d
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-bg-app border-border-subtle text-text-muted hover:text-text-main hover:border-primary/40'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Question Types checkboxes */}
            <div className="space-y-2">
              <label className="font-semibold text-text-main">Question Modalities</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'MCQ', label: 'Multiple Choice (MCQ)' },
                  { key: 'numerical', label: 'Numerical / Complexity' },
                  { key: 'short_answer', label: 'Short Concept' },
                ].map((item) => {
                  const isChecked = types.includes(item.key);
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => toggleType(item.key)}
                      className={`px-3 py-2 rounded-btn border text-xs font-semibold transition-all ${
                        isChecked
                          ? 'bg-primary/15 border-primary text-primary font-bold'
                          : 'bg-bg-app border-border-subtle text-text-muted hover:text-text-main'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Count */}
            <div className="space-y-2">
              <label className="font-semibold text-text-main">Number of Questions</label>
              <div className="flex items-center space-x-3">
                {[3, 4, 5, 8].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setNumQuestions(n)}
                    className={`flex-1 py-2 rounded-btn border font-mono text-xs font-bold transition-all ${
                      numQuestions === n
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-bg-app border-border-subtle text-text-muted hover:text-text-main'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="px-6 py-3 rounded-btn bg-primary hover:opacity-90 text-white font-bold text-xs sm:text-sm shadow-btn transition-all flex items-center gap-2 active:scale-98 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-white" />
              <span>{isGenerating ? 'Generating Calibrated Quiz...' : `Generate ${selectedCourse ? selectedCourse.title : 'Course'} Quiz`}</span>
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-bg-surface p-4 rounded-card border border-border-subtle">
            <div className="flex items-center gap-2 text-xs font-mono text-text-muted">
              <span>Scope: <strong className="text-text-main">{selectedCourse?.title}</strong></span>
              <span>•</span>
              <span>Topic: <strong className="text-primary">{topic}</strong></span>
            </div>
            <button
              onClick={() => setAssessment(null)}
              className="px-3 py-1.5 rounded-btn bg-bg-app hover:bg-bg-elevated border border-border-subtle text-text-main text-xs font-semibold"
            >
              Configure Another Quiz
            </button>
          </div>

          <Quiz
            questions={assessment.questions}
            assessmentId={assessment.id}
            onFinish={() => {
              // Quiz completed callback
            }}
          />
        </div>
      )}
    </div>
  );
}

export default function AssessmentPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-text-muted font-mono">Loading Aanvi Assessments...</div>}>
      <AssessmentContent />
    </Suspense>
  );
}
