'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ClipboardCheck,
  Sparkles,
  ShieldCheck,
  Filter,
  GraduationCap
} from 'lucide-react';
import { api, AssessmentDetail } from '@/lib/api';
import { Quiz } from '@/components/Quiz';
import { useAuth } from '@/lib/auth-context';

function AssessmentsContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialTopic = searchParams?.get('topic') || 'All';

  const [topic, setTopic] = useState(initialTopic);
  const [difficulty, setDifficulty] = useState('medium');
  const [numQuestions, setNumQuestions] = useState(4);
  const [types, setTypes] = useState<string[]>(['MCQ', 'numerical', 'short_answer']);
  const [isGenerating, setIsGenerating] = useState(false);
  const [assessment, setAssessment] = useState<AssessmentDetail | null>(null);

  const toggleType = (t: string) => {
    if (types.includes(t)) {
      if (types.length > 1) setTypes(types.filter((x) => x !== t));
    } else {
      setTypes([...types, t]);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const data = await api.generateAssessment({
        course_id: 1,
        user_id: 1,
        topic: topic,
        difficulty: difficulty,
        num_questions: numQuestions,
        types: types,
      });
      setAssessment(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-xs font-mono text-text-muted">
          <span className="text-primary font-bold">ASSESSMENT ENGINE</span>
          <span>•</span>
          <span>Source-Grounded Adaptive Testing</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-black text-text-main mt-1">
          Adaptive Diagnostic Quiz
        </h1>
        <p className="text-xs sm:text-sm text-text-muted mt-0.5">
          Generate dynamically parameterized, Bloom-aligned questions from your uploaded textbooks and slides.
        </p>
      </div>

      {!assessment ? (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 sm:p-8 rounded-card bg-bg-surface border border-border-subtle shadow-card space-y-6"
        >
          <div className="border-b border-border-subtle pb-4 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-text-main font-bold">
              <Filter className="w-4 h-4 text-primary" />
              <span>Configure Assessment Parameters</span>
            </div>
            <div className="text-xs font-mono px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/30 font-bold">
              Bloom Level: Application &amp; Analysis
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Topic Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-main block">Topic Domain</label>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-4 py-2.5 rounded-btn bg-bg-app border border-border-subtle text-text-main text-xs font-medium focus:outline-none focus:border-primary"
              >
                <option value="All">All Topics (Full Coverage)</option>
                <option value="Binary Search Trees">Binary Search Trees</option>
                <option value="AVL Trees & Balancing">AVL Trees &amp; Balancing</option>
                <option value="Graph Traversals (BFS/DFS)">Graph Traversals (BFS/DFS)</option>
                <option value="Dynamic Programming">Dynamic Programming</option>
                <option value="Hash Tables & Collisions">Hash Tables &amp; Collisions</option>
              </select>
            </div>

            {/* Difficulty */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-main block">Adaptive Difficulty</label>
              <div className="grid grid-cols-3 gap-2">
                {['easy', 'medium', 'hard'].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    className={`py-2 rounded-btn text-xs font-bold uppercase transition-all ${
                      difficulty === d
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-bg-app text-text-muted hover:text-text-main border border-border-subtle'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Number of Questions */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-main block">
                Number of Questions: <span className="text-primary font-bold">{numQuestions}</span>
              </label>
              <input
                type="range"
                min={2}
                max={10}
                value={numQuestions}
                onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-text-muted">
                <span>2 (Quick Check)</span>
                <span>6 (Standard)</span>
                <span>10 (Comprehensive)</span>
              </div>
            </div>

            {/* Question Formats */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-main block">Included Question Types</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'MCQ', label: 'Multiple Choice' },
                  { id: 'numerical', label: 'Numerical' },
                  { id: 'short_answer', label: 'Short Answer' },
                ].map((t) => {
                  const active = types.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleType(t.id)}
                      className={`px-3 py-1.5 rounded-btn text-xs font-medium transition-colors ${
                        active
                          ? 'bg-primary/20 border border-primary text-primary font-bold'
                          : 'bg-bg-app border border-border-subtle text-text-muted hover:text-text-main'
                      }`}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border-subtle flex flex-wrap items-center justify-between gap-3">
            <div className="text-[11px] text-text-muted space-y-0.5">
              <p>• Cosine similarity &lt; 0.70 prevents question repetition across past sessions</p>
              <p>• Mathematical complexities validated via automated Python sandbox execution</p>
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="px-7 py-3 rounded-btn bg-primary hover:opacity-90 disabled:opacity-40 text-white font-display font-black text-xs uppercase tracking-wider shadow-md transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isGenerating ? 'Generating...' : 'Generate Assessment'}</span>
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <button
              onClick={() => setAssessment(null)}
              className="text-xs text-text-muted hover:text-text-main font-semibold flex items-center gap-1"
            >
              &larr; Configure New Assessment
            </button>
          </div>

          <Quiz
            questions={assessment.questions}
            assessmentId={assessment.id}
          />
        </div>
      )}
    </div>
  );
}

export default function AssessmentsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-text-muted font-mono">Loading Assessments...</div>}>
      <AssessmentsContent />
    </Suspense>
  );
}
