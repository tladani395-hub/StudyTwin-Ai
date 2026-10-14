'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  BookOpen,
  Sparkles,
  ArrowRight,
  X,
  GraduationCap,
  Users,
  CheckCircle2,
  Clock,
  Upload,
  Layers,
  Flame,
  Award,
  AlertCircle,
  Hash,
  ShieldCheck,
  Compass,
  Trash2,
  Calendar,
  Globe,
  FileText,
  Video,
  Presentation,
  Check,
  Loader2
} from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useCourseStore, CourseItem, ClassItem } from '@/stores/useCourseStore';
import { computeDaysLeft, formatDaysLeftLabel } from '@/lib/dateUtils';

export default function CoursesPage() {
  const router = useRouter();
  const { user, mode } = useAuthStore();
  const {
    courses,
    classes,
    isLoading,
    fetchCourses,
    fetchClasses,
    joinClass,
    createCourse,
    deleteCourse,
    setActiveCourseId,
    activeCourseId
  } = useCourseStore();

  // Create Course Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newLanguage, setNewLanguage] = useState('English');
  const [newExamDate, setNewExamDate] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ingestion Pipeline Progress (4 Stages)
  const [ingestionStage, setIngestionStage] = useState<number>(0);
  const [ingestionLabel, setIngestionLabel] = useState<string>('');
  const [ingestionError, setIngestionError] = useState<string | null>(null);

  // Delete Course Confirmation State
  const [courseToDelete, setCourseToDelete] = useState<CourseItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Join Class Code State
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [classCode, setClassCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinSuccessMsg, setJoinSuccessMsg] = useState('');
  const [joinErrorMsg, setJoinErrorMsg] = useState('');

  const currentUserId = user?.id || (mode === 'explorer' ? 'u-explorer-0002-0000-000000000002' : 'u-scholar-0001-0000-000000000001');

  useEffect(() => {
    fetchCourses(currentUserId);
    fetchClasses(currentUserId);
  }, [currentUserId, fetchCourses, fetchClasses]);

  const handleOpenCourse = (courseId: string) => {
    setActiveCourseId(courseId);
    router.push('/dashboard');
  };

  const handleCreateCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsSubmitting(true);
    setIngestionStage(1);
    setIngestionLabel('Stage 1: Uploaded: Initializing server pipeline...');
    setIngestionError(null);

    try {
      const created = await createCourse(
        {
          title: newTitle.trim(),
          subject: newSubject.trim() || 'General Science',
          language: newLanguage,
          exam_date: newExamDate || undefined,
          description: newDesc.trim(),
        },
        selectedFile || undefined,
        (stage, label) => {
          setIngestionStage(stage);
          setIngestionLabel(label);
        },
        currentUserId
      );

      // Brief delay to showcase successful completion
      setTimeout(() => {
        setIsCreateOpen(false);
        setIsSubmitting(false);
        setIngestionStage(0);
        setIngestionLabel('');
        setIngestionError(null);
        setNewTitle('');
        setNewSubject('');
        setNewLanguage('English');
        setNewExamDate('');
        setNewDesc('');
        setSelectedFile(null);
      }, 700);
    } catch (err: any) {
      console.error('Failed to create course or process ingestion:', err);
      setIsSubmitting(false);
      setIngestionStage(-1);
      setIngestionError(err?.message || 'Server ingestion error occurred.');
    }
  };


  const confirmDeleteCourse = async () => {
    if (!courseToDelete) return;
    setIsDeleting(true);
    try {
      await deleteCourse(courseToDelete.id, currentUserId);
      setCourseToDelete(null);
    } catch (err) {
      console.error('Failed to delete course:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleJoinClassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classCode.trim()) return;
    setJoinLoading(true);
    setJoinErrorMsg('');
    setJoinSuccessMsg('');

    const res = await joinClass(classCode, currentUserId);

    setJoinLoading(false);
    if (res.success) {
      setJoinSuccessMsg(res.message);
      setClassCode('');
      setTimeout(() => {
        setIsJoinOpen(false);
      }, 1800);
    } else {
      setJoinErrorMsg(res.message);
    }
  };


  const isExplorer = mode === 'explorer';

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 px-2 sm:px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-text-muted">
            <span className="text-primary flex items-center gap-1 font-bold">
              {isExplorer ? <Compass className="w-3.5 h-3.5" /> : <GraduationCap className="w-3.5 h-3.5" />}
              {isExplorer ? 'Explorer World Classes' : 'Curriculum Repository'}
            </span>
            <span>•</span>
            <span className="text-text-muted">
              {courses.length} Active {courses.length === 1 ? 'Course' : 'Courses'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-text-main mt-1">
            My Classes & Courses
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-0.5">
            {isExplorer
              ? 'Explore your gamified school subjects, join teacher cohorts, and track star progress.'
              : 'Manage ingested knowledge bases, view BKT Bayesian mastery, and complete spaced reviews.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setJoinErrorMsg('');
              setJoinSuccessMsg('');
              setIsJoinOpen(true);
            }}
            className="px-3.5 py-2 rounded-btn bg-bg-surface border border-border-subtle hover:bg-bg-elevated text-text-main text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Users className="w-3.5 h-3.5 text-primary" />
            <span>Join a Class</span>
          </button>


          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 rounded-btn bg-primary hover:opacity-90 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Course</span>
          </button>
        </div>
      </div>

      {/* Empty State Banner (0 Enrolled Courses) */}
      {courses.filter((c) => c.is_enrolled).length === 0 && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 sm:p-12 rounded-card bg-bg-surface border-2 border-dashed border-primary/40 text-center space-y-6 shadow-card"
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 text-primary flex items-center justify-center mx-auto shadow-inner">
            <BookOpen className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-xl sm:text-2xl font-display font-black text-text-main">
              Add Your First Course
            </h2>
            <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
              You haven&apos;t enrolled in any courses yet. Get started by adding a course with your syllabus materials or entering your teacher&apos;s class code.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 max-w-md mx-auto">
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-btn bg-primary text-white font-bold text-xs shadow-btn flex items-center justify-center gap-2 hover:opacity-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Course with Ingestion</span>
            </button>

            <button
              type="button"
              onClick={() => setIsJoinOpen(true)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-btn bg-bg-elevated border border-border-subtle hover:border-primary text-text-main font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <Hash className="w-4 h-4 text-primary" />
              <span>Enter Class Code</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* Enrolled Classes Banner */}
      {classes.length > 0 && (
        <div className="p-4 sm:p-5 rounded-card bg-bg-surface border border-border-subtle shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <h3 className="text-xs sm:text-sm font-bold text-text-main font-display">
                Active Cohort Classes ({classes.length})
              </h3>
            </div>
            <span className="text-[10px] font-mono text-text-muted">PostgreSQL Verified</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {classes.map((cl) => (
              <div
                key={cl.id}
                className="p-3 rounded-btn bg-bg-app border border-border-subtle flex items-center justify-between gap-2"
              >
                <div className="overflow-hidden">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                      {cl.code}
                    </span>
                    <span className="text-xs font-bold text-text-main truncate">{cl.name}</span>
                  </div>
                  <p className="text-[10px] text-text-muted mt-1 truncate">
                    Instructor: {cl.teacher_name || 'Faculty Lead'}
                  </p>
                </div>
                <span className="text-[10px] font-mono font-semibold text-text-muted shrink-0">
                  {cl.member_count || 1} {cl.member_count === 1 ? 'member' : 'members'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Course Cards Grid */}
      {courses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {courses.map((course) => {
            const bktPct = course.bkt_mastery_pct || 0;
            const dueCount = course.due_reviews_count || 0;
            const progressPct = course.progress_pct || 0;
            const isActive = course.id === activeCourseId;

            // Calculate days left to exam using shared local date function
            const daysLeft: number | null = course.exam_date ? computeDaysLeft(course.exam_date) : null;

            return (
              <motion.div
                key={course.id}
                whileHover={{ y: -2 }}
                className={`p-5 sm:p-6 rounded-card bg-bg-surface border shadow-card flex flex-col justify-between transition-all ${
                  isActive
                    ? 'ring-2 ring-primary/40 border-primary'
                    : isExplorer
                    ? 'border-[#FF6B57]/30 hover:border-[#FF6B57]'
                    : 'border-border-subtle hover:border-primary'
                }`}
              >
                <div className="space-y-4">
                  {/* Top Header: Badge, Language, Exam chip & Delete button */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-sm ${
                          isExplorer
                            ? 'bg-[#FF6B57]/15 border-[#FF6B57]/30 text-[#FF6B57]'
                            : 'bg-primary/15 border-primary/30 text-primary'
                        }`}
                      >
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-bg-app text-text-muted border border-border-subtle w-fit">
                          {course.subject}
                        </span>
                        {course.language && (
                          <span className="text-[9px] font-mono text-text-muted flex items-center gap-1">
                            <Globe className="w-2.5 h-2.5 text-primary" />
                            <span>{course.language}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Spaced Repetition Due Badge */}
                      {dueCount > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[10px] font-mono font-bold">
                          <Clock className="w-3 h-3" />
                          <span>{dueCount} Review{dueCount > 1 ? 's' : ''} Due</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Caught up</span>
                        </span>
                      )}

                      {/* Delete Course Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCourseToDelete(course);
                        }}
                        title="Archive and remove course"
                        className="p-1.5 rounded-btn text-text-muted hover:text-danger hover:bg-danger/10 border border-transparent hover:border-danger/20 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg sm:text-xl font-display font-black text-text-main">
                        {course.title}
                      </h2>
                      {isActive && (
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/30 text-[9px] font-mono font-bold">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-muted mt-1 leading-relaxed line-clamp-2">
                      {course.description || 'Source-grounded curriculum covering foundational theories and multimodal citations.'}
                    </p>
                  </div>

                  {/* Exam Countdown Chip */}
                  {course.exam_date && (
                    <div className="px-3 py-1.5 rounded-btn bg-bg-app border border-border-subtle flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-1.5 text-text-muted">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        <span>Exam: {course.exam_date}</span>
                      </div>
                      <span className={`font-bold ${daysLeft !== null && daysLeft <= 14 ? 'text-amber-500' : 'text-primary'}`}>
                        {daysLeft !== null ? formatDaysLeftLabel(daysLeft) : 'Scheduled'}
                      </span>
                    </div>
                  )}

                  {/* BKT Mastery & Curriculum Progress Stats */}
                  <div className="p-3.5 rounded-2xl bg-bg-app border border-border-subtle space-y-2.5">
                    {/* BKT Mastery Stat */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-muted font-mono flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-primary" />
                        <span>BKT Mastery (p_know):</span>
                      </span>
                      <span className="font-mono font-bold text-primary text-xs">
                        {bktPct.toFixed(1)}%
                      </span>
                    </div>
                    {/* Progress Bar for BKT */}
                    <div className="w-full h-1.5 bg-bg-surface rounded-full overflow-hidden border border-border-subtle/50">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isExplorer ? 'bg-gradient-to-r from-[#FF6B57] to-[#7B4BFF]' : 'bg-primary'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(5, bktPct))}%` }}
                      />
                    </div>

                    {/* Multimodal Documents & Topics count */}
                    <div className="pt-1 flex items-center justify-between text-[11px] font-mono text-text-muted border-t border-border-subtle/60">
                      <span>{course.document_count || 1} Ingested Docs</span>
                      <span>{course.topic_count || 4} Topics</span>
                      <span>Progress: {progressPct.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-4 mt-4 border-t border-border-subtle flex items-center justify-between gap-3">
                  <Link
                    href={`/upload?course_id=${course.id}`}
                    className="text-xs font-semibold text-text-muted hover:text-primary transition-colors flex items-center gap-1"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Material</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleOpenCourse(course.id)}
                    className="px-4 py-2 rounded-btn bg-primary hover:opacity-90 text-white font-bold text-xs transition-all shadow-sm flex items-center gap-1.5 active:scale-98"
                  >
                    <span>{isActive ? 'Continue Learning' : 'Open Course'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Delete / Archive Confirmation Dialog Modal */}
      <AnimatePresence>
        {courseToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-card bg-bg-surface border border-border-subtle p-6 space-y-5 shadow-2xl"
            >
              <div className="flex items-center gap-3 text-danger">
                <div className="w-10 h-10 rounded-full bg-danger/10 border border-danger/30 flex items-center justify-center">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-display font-bold text-text-main">
                    Archive Course?
                  </h3>
                  <p className="text-xs text-text-muted">
                    This course will be archived and unenrolled.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-btn bg-bg-app border border-border-subtle text-xs space-y-1">
                <span className="font-bold text-text-main block">{courseToDelete.title}</span>
                <span className="text-[11px] text-text-muted font-mono">{courseToDelete.subject} • {courseToDelete.language || 'English'}</span>
              </div>

              <p className="text-xs text-text-muted leading-relaxed">
                Archiving this course will remove it from your Course Switcher, Dashboard, Tutor, and Quiz picker immediately without full page reload.
              </p>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setCourseToDelete(null)}
                  className="px-4 py-2 rounded-btn bg-bg-app text-text-muted text-xs font-semibold hover:bg-bg-elevated border border-border-subtle"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={confirmDeleteCourse}
                  className="px-5 py-2 rounded-btn bg-danger hover:opacity-90 text-white text-xs font-bold shadow-md disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  <span>{isDeleting ? 'Archiving...' : 'Confirm Remove'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Join Class Dialog Modal */}
      <AnimatePresence>
        {isJoinOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-card bg-bg-surface border border-border-subtle p-6 space-y-5 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <h3 className="text-base font-display font-bold text-text-main">
                    Join a Class Cohort
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsJoinOpen(false)}
                  className="text-text-muted hover:text-text-main p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-text-muted leading-relaxed">
                Enter the class code given by your teacher or professor (for example: <strong className="text-text-main font-mono">PHY-2026-X</strong>, <strong className="text-text-main font-mono">AANV88</strong>, or <strong className="text-text-main font-mono">CS-2026-A</strong>).
              </p>

              {joinSuccessMsg && (
                <div className="p-3 rounded-btn bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{joinSuccessMsg}</span>
                </div>
              )}

              {joinErrorMsg && (
                <div className="p-3 rounded-btn bg-danger/10 border border-danger/30 text-danger text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{joinErrorMsg}</span>
                </div>
              )}

              <form onSubmit={handleJoinClassSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-main">Class Code</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={classCode}
                      onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                      placeholder="e.g. PHY-2026-X"
                      className="w-full uppercase font-mono tracking-wider bg-bg-app border border-border-subtle rounded-btn px-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsJoinOpen(false)}
                    className="px-4 py-2 rounded-btn bg-bg-app text-text-muted text-xs font-semibold hover:bg-bg-elevated border border-border-subtle"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={joinLoading || !classCode.trim()}
                    className="px-5 py-2 rounded-btn bg-primary hover:opacity-90 text-white text-xs font-bold shadow-md disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {joinLoading ? 'Joining...' : 'Enroll in Class'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Expanded "Add Course" Modal with 4-Stage Ingestion Pipeline */}
      <AnimatePresence>
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-card bg-bg-surface border border-border-subtle p-6 sm:p-8 space-y-6 shadow-2xl my-8"
            >
              <div className="flex items-center justify-between border-b border-border-subtle pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/30 text-primary flex items-center justify-center">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-lg font-display font-bold text-text-main">Add New Course</h3>
                    <p className="text-xs text-text-muted">Multimodal Ingestion & Concept Discovery</p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsCreateOpen(false)}
                  className="text-text-muted hover:text-text-main p-1 disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 4-Stage Processing Pipeline Visualizer */}
              {isSubmitting && (
                <div className="p-4 rounded-card bg-bg-app border border-border-subtle space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-primary flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Ingestion Pipeline In Progress</span>
                    </span>
                    <span className="text-text-muted">Stage {ingestionStage} of 4</span>
                  </div>

                  {/* 4 Stages Progress Stepper */}
                  <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-mono">
                    {[
                      { step: 1, label: 'Uploaded' },
                      { step: 2, label: 'Extracted' },
                      { step: 3, label: 'Split Units' },
                      { step: 4, label: 'Concepts' },
                    ].map((s) => {
                      const isDone = ingestionStage > s.step;
                      const isCurrent = ingestionStage === s.step;
                      return (
                        <div key={s.step} className="flex flex-col items-center gap-1.5">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                              isDone
                                ? 'bg-emerald-500 text-white'
                                : isCurrent
                                ? 'bg-primary text-white ring-4 ring-primary/20 animate-pulse'
                                : 'bg-bg-surface border border-border-subtle text-text-muted'
                            }`}
                          >
                            {isDone ? <Check className="w-3.5 h-3.5" /> : s.step}
                          </div>
                          <span className={isCurrent ? 'font-bold text-primary' : isDone ? 'text-emerald-500' : 'text-text-muted'}>
                            {s.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-xs text-text-muted text-center italic pt-1">
                    {ingestionLabel || 'Processing multimodal curriculum...'}
                  </p>
                </div>
              )}

              {/* Ingestion Failure Error State */}
              {ingestionError && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-btn text-red-400 text-xs flex items-start gap-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-bold text-red-300">Ingestion Pipeline Failed</p>
                    <p className="text-text-muted">{ingestionError}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleCreateCourseSubmit} className="space-y-4 text-xs sm:text-sm">

                {/* Title */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-text-main flex items-center gap-1">
                    <span>Course Title / Name</span>
                    <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isSubmitting}
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Molecular Genetics & Cell Biology"
                    className="w-full bg-bg-app border border-border-subtle rounded-btn p-3 text-text-main focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Subject & Language Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-text-main">Subject / Discipline</label>
                    <input
                      type="text"
                      disabled={isSubmitting}
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      placeholder="e.g. Biology, Physics, Computer Science"
                      className="w-full bg-bg-app border border-border-subtle rounded-btn p-3 text-text-main focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-text-main">Language of Material</label>
                    <select
                      disabled={isSubmitting}
                      value={newLanguage}
                      onChange={(e) => setNewLanguage(e.target.value)}
                      className="w-full bg-bg-app border border-border-subtle rounded-btn p-3 text-text-main focus:outline-none focus:border-primary font-medium"
                    >
                      <option value="English">English</option>
                      <option value="हिन्दी">हिन्दी (Hindi)</option>
                      <option value="ગુજરાતી">ગુજરાતી (Gujarati)</option>
                    </select>
                  </div>
                </div>

                {/* Optional Exam Date */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-text-main flex items-center justify-between">
                    <span>Optional Exam Date</span>
                    <span className="text-[10px] font-mono text-text-muted">Dynamic Countdown</span>
                  </label>
                  <input
                    type="date"
                    disabled={isSubmitting}
                    value={newExamDate}
                    onChange={(e) => setNewExamDate(e.target.value)}
                    className="w-full bg-bg-app border border-border-subtle rounded-btn p-3 text-text-main focus:outline-none focus:border-primary font-mono text-xs"
                  />
                </div>

                {/* Ingestion File Upload */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-text-main flex items-center justify-between">
                    <span>Course Material (PDF, PPTX, or MP4)</span>
                    <span className="text-[10px] font-mono text-text-muted">Multimodal Grounding</span>
                  </label>
                  <div className="relative border-2 border-dashed border-border-subtle hover:border-primary/60 rounded-btn p-4 text-center bg-bg-app/50 transition-colors">
                    <input
                      type="file"
                      disabled={isSubmitting}
                      accept=".pdf,.ppt,.pptx,.mp4,.mov,.webm"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setSelectedFile(e.target.files[0]);
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <div className="flex flex-col items-center gap-1.5 pointer-events-none">
                      <div className="flex items-center gap-2 text-text-muted">
                        <FileText className="w-4 h-4 text-primary" />
                        <Presentation className="w-4 h-4 text-amber-500" />
                        <Video className="w-4 h-4 text-secondary" />
                      </div>
                      {selectedFile ? (
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-primary truncate max-w-xs">{selectedFile.name}</p>
                          <p className="text-[10px] font-mono text-text-muted">
                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for 4-stage pipeline
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs font-semibold text-text-main">
                            Drag & drop syllabus PDF, slides, or lecture video
                          </p>
                          <p className="text-[10px] text-text-muted">
                            Supports .pdf, .pptx, .mp4 (up to 200MB)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-text-main">Description / Syllabus Overview</label>
                  <textarea
                    rows={2}
                    disabled={isSubmitting}
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Brief overview of course modules and syllabus topics..."
                    className="w-full bg-bg-app border border-border-subtle rounded-btn p-3 text-text-main focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3 border-t border-border-subtle">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setIsCreateOpen(false)}
                    className="px-4 py-2 rounded-btn bg-bg-app text-text-muted text-xs font-semibold hover:bg-bg-elevated border border-border-subtle"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !newTitle.trim()}
                    className="px-5 py-2 rounded-btn bg-primary hover:opacity-90 text-white text-xs font-bold shadow-md disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Processing Pipeline...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create & Ingest Course</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
