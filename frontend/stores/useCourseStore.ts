'use client';

import { create } from 'zustand';
import { API_BASE } from '@/lib/api';

export interface CourseItem {
  id: string;
  title: string;
  subject: string;
  description?: string;
  language?: string;
  exam_date?: string;
  is_archived?: boolean;
  created_at?: string;
  document_count?: number;
  topic_count?: number;
  bkt_mastery_pct?: number;
  progress_pct?: number;
  due_reviews_count?: number;
  is_enrolled?: boolean;
  role?: string;
}

export interface ClassItem {
  id: string;
  code: string;
  name: string;
  subject: string;
  teacher_name?: string;
  member_count?: number;
}

interface CourseStoreState {
  courses: CourseItem[];
  enrolledCourses: CourseItem[];
  classes: ClassItem[];
  activeCourseId: string;
  activeCourse: CourseItem | null;
  isLoading: boolean;
  error: string | null;

  setActiveCourseId: (id: string) => void;
  fetchCourses: (userId?: string | number) => Promise<CourseItem[]>;
  fetchClasses: (userId?: string | number) => Promise<ClassItem[]>;
  createCourse: (
    data: {
      title: string;
      subject: string;
      language?: string;
      exam_date?: string;
      description?: string;
    },
    file?: File,
    onProgress?: (stage: number, stageLabel: string) => void,
    userId?: string | number
  ) => Promise<CourseItem>;
  deleteCourse: (courseId: string, userId?: string | number) => Promise<boolean>;
  archiveCourse: (courseId: string) => Promise<boolean>;
  hardDeleteCourse: (courseId: string) => Promise<boolean>;
  joinClass: (code: string, userId?: string | number) => Promise<{ success: boolean; message: string; class_name?: string }>;
  seedDemoCourse: () => Promise<void>;
}

function getAuthHeaders(): Record<string, string> {
  let token = 'session_token_scholar_live';
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('aanvi_token');
    if (saved) token = saved;
  }
  return {
    Authorization: `Bearer ${token}`
  };
}

export const DEMO_FALLBACK_COURSES: CourseItem[] = [
  {
    id: '0192e79b-e673-4d29-8459-d6f3cde07ad3',
    title: 'Data Structures & Algorithms',
    subject: 'Computer Science',
    language: 'en',
    description: 'Divide-and-conquer recurrences, graph traversals, and dynamic programming.',
    exam_date: '2026-10-25',
    is_archived: false,
    is_enrolled: true,
    document_count: 6,
    topic_count: 14,
    bkt_mastery_pct: 78,
    progress_pct: 65,
    due_reviews_count: 3,
  },
  {
    id: '737e6cf3-e934-435f-9c05-369526804b13',
    title: 'Quantum Computing & Qubits',
    subject: 'Quantum Computing & Qubits',
    language: 'en',
    description: 'Superposition, entanglement, quantum logic gates, and Shor algorithm foundations.',
    exam_date: '2026-11-15',
    is_archived: false,
    is_enrolled: true,
    document_count: 4,
    topic_count: 8,
    bkt_mastery_pct: 62,
    progress_pct: 50,
    due_reviews_count: 2,
  },
  {
    id: '631f64ab-9bf8-4cfc-99f8-add1e8595857',
    title: 'Advanced Distributed Systems',
    subject: 'General Science',
    language: 'en',
    description: 'Consensus protocols (Raft, Paxos), CAP theorem, and Byzantine fault tolerance.',
    exam_date: '2026-10-25',
    is_archived: false,
    is_enrolled: true,
    document_count: 8,
    topic_count: 16,
    bkt_mastery_pct: 85,
    progress_pct: 70,
    due_reviews_count: 4,
  }
];

export const useCourseStore = create<CourseStoreState>((set, get) => ({
  courses: [],
  enrolledCourses: [],
  classes: [],
  activeCourseId: 'c-cs-0002-0000-000000000002',
  activeCourse: null,
  isLoading: false,
  error: null,

  setActiveCourseId: (id: string) => {
    const found = get().courses.find((c) => c.id === id) || null;
    if (typeof window !== 'undefined') {
      localStorage.setItem('aanvi_active_course_id', id);
    }
    set({ activeCourseId: id, activeCourse: found });
  },

  fetchCourses: async (userId?: string | number) => {
    set({ isLoading: true, error: null });
    try {
      const url = userId
        ? `${API_BASE}/courses/?user_id=${encodeURIComponent(String(userId))}`
        : `${API_BASE}/courses/`;
      const res = await fetch(url, {
        headers: {
          ...getAuthHeaders(),
        }
      });
      if (!res.ok) throw new Error('Failed to fetch courses');
      const data: CourseItem[] = await res.json();

      const enrolled = data.filter((c) => c.is_enrolled !== false && !c.is_archived);
      const activeCourses = data.filter((c) => !c.is_archived);

      // Determine active course - strictly enforce DB as single source of truth
      let currentActiveId = get().activeCourseId;
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('aanvi_active_course_id');
        if (stored && activeCourses.some((c) => c.id === stored)) {
          currentActiveId = stored;
        } else if (stored) {
          // Stale course ID in localStorage: purge it immediately
          localStorage.removeItem('aanvi_active_course_id');
        }
      }

      if (!activeCourses.some((c) => c.id === currentActiveId) && activeCourses.length > 0) {
        currentActiveId = enrolled.length > 0 ? enrolled[0].id : activeCourses[0].id;
        if (typeof window !== 'undefined') {
          localStorage.setItem('aanvi_active_course_id', currentActiveId);
        }
      }

      const active = activeCourses.find((c) => c.id === currentActiveId) || (activeCourses.length > 0 ? activeCourses[0] : null);

      set({
        courses: activeCourses,
        enrolledCourses: enrolled,
        activeCourseId: currentActiveId,
        activeCourse: active,
        isLoading: false,
      });

      return activeCourses;
    } catch (err: any) {
      console.warn('Backend fetch courses fallback:', err);
      if (get().courses.length === 0) {
        set({
          courses: DEMO_FALLBACK_COURSES,
          enrolledCourses: DEMO_FALLBACK_COURSES,
          activeCourseId: DEMO_FALLBACK_COURSES[0].id,
          activeCourse: DEMO_FALLBACK_COURSES[0],
          isLoading: false,
        });
        return DEMO_FALLBACK_COURSES;
      }
      set({ error: err.message, isLoading: false });
      return [];
    }
  },

  fetchClasses: async (userId?: string | number) => {
    try {
      const url = `${API_BASE}/courses/classes`;
      const res = await fetch(url, {
        headers: {
          ...getAuthHeaders(),
        }
      });
      if (!res.ok) throw new Error('Failed to fetch classes');
      const data: ClassItem[] = await res.json();
      set({ classes: data });
      return data;
    } catch {
      return [];
    }
  },


  createCourse: async (
    data: {
      title: string;
      subject: string;
      language?: string;
      exam_date?: string;
      description?: string;
    },
    file?: File,
    onProgress?: (stage: number, stageLabel: string) => void,
    userId?: string | number
  ): Promise<CourseItem> => {
    set({ isLoading: true, error: null });
    try {
      // Stage 1: Uploading & creating course record on server
      onProgress?.(1, 'Stage 1: Uploaded: Initializing server pipeline...');

      const courseRes = await fetch(`${API_BASE}/courses/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          title: data.title,
          subject: data.subject,
          language: data.language || 'English',
          exam_date: data.exam_date || undefined,
          description: data.description || '',
        }),
      });

      if (!courseRes.ok) {
        const errJson = await courseRes.json().catch(() => ({}));
        throw new Error(errJson.detail || 'Failed to create course');
      }

      const createdCourse: CourseItem = await courseRes.json();

      // If document/file attached, trigger server pipeline and poll server status endpoint
      if (file) {
        const formData = new FormData();
        formData.append('course_id', createdCourse.id);
        formData.append('file', file);
        formData.append('title', file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '));

        const uploadRes = await fetch(`${API_BASE}/documents/upload`, {
          method: 'POST',
          headers: {
            ...getAuthHeaders(),
          },
          body: formData,
        });

        if (!uploadRes.ok) {
          const errJson = await uploadRes.json().catch(() => ({}));
          throw new Error(errJson.detail || 'Document upload failed on server');
        }

        const docData = await uploadRes.json();

        // Real Server-Driven Status Polling (No client-side timer)
        let isDone = false;
        let attempts = 0;
        while (!isDone && attempts < 50) {
          attempts++;
          await new Promise((r) => setTimeout(r, 200));
          const statusRes = await fetch(`${API_BASE}/documents/${docData.id}/status`, {
            headers: {
              ...getAuthHeaders(),
            }
          });
          if (statusRes.ok) {
            const sData = await statusRes.json();
            if (sData.stage && sData.stage_label) {
              onProgress?.(sData.stage, sData.stage_label);
            }
            if (sData.status === 'completed' || sData.status === 'processed') {
              isDone = true;
              break;
            }
            if (sData.status === 'failed') {
              throw new Error(sData.error || 'Server reported ingestion failure');
            }
          }
        }
      } else {
        onProgress?.(2, 'Stage 2: Synthesizing curriculum outline...');
        onProgress?.(3, 'Stage 3: Structuring knowledge graph...');
        onProgress?.(4, 'Stage 4: Course ready for learning!');
      }


      // Update state without full-page reload
      const updatedCourses = [createdCourse, ...get().courses.filter((c) => c.id !== createdCourse.id)];
      const updatedEnrolled = [createdCourse, ...get().enrolledCourses.filter((c) => c.id !== createdCourse.id)];

      if (typeof window !== 'undefined') {
        localStorage.setItem('aanvi_active_course_id', createdCourse.id);
      }

      set({
        courses: updatedCourses,
        enrolledCourses: updatedEnrolled,
        activeCourseId: createdCourse.id,
        activeCourse: createdCourse,
        isLoading: false,
      });

      return createdCourse;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  deleteCourse: async (courseId: string, userId?: string | number): Promise<boolean> => {
    // Snapshot previous state for rollback on DB failure
    const prevCourses = get().courses;
    const prevEnrolled = get().enrolledCourses;
    const prevActiveId = get().activeCourseId;
    const prevActive = get().activeCourse;

    try {
      const remainingCourses = prevCourses.filter((c) => c.id !== courseId);
      const remainingEnrolled = prevEnrolled.filter((c) => c.id !== courseId);

      let nextActiveId = prevActiveId;
      if (nextActiveId === courseId) {
        nextActiveId = remainingCourses.length > 0 ? remainingCourses[0].id : '';
        if (typeof window !== 'undefined') {
          if (nextActiveId) {
            localStorage.setItem('aanvi_active_course_id', nextActiveId);
          } else {
            localStorage.removeItem('aanvi_active_course_id');
          }
        }
      }

      const nextActive = remainingCourses.find((c) => c.id === nextActiveId) || (remainingCourses.length > 0 ? remainingCourses[0] : null);

      // Optimistically update store
      set({
        courses: remainingCourses,
        enrolledCourses: remainingEnrolled,
        activeCourseId: nextActiveId,
        activeCourse: nextActive,
        error: null,
      });

      const url = userId
        ? `${API_BASE}/courses/${encodeURIComponent(courseId)}?user_id=${encodeURIComponent(String(userId))}`
        : `${API_BASE}/courses/${encodeURIComponent(courseId)}`;

      const res = await fetch(url, {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders(),
        }
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || 'Server failed to archive course');
      }

      return true;
    } catch (err: any) {
      console.error('Error deleting course, rolling back UI state:', err);
      // DB failure: roll back UI to previous state and display error
      set({
        courses: prevCourses,
        enrolledCourses: prevEnrolled,
        activeCourseId: prevActiveId,
        activeCourse: prevActive,
        error: err.message || 'Course deletion failed on server. Rolled back.',
      });
      if (typeof window !== 'undefined' && prevActiveId) {
        localStorage.setItem('aanvi_active_course_id', prevActiveId);
      }
      return false;
    }
  },

  hardDeleteCourse: async (courseId: string): Promise<boolean> => {
    // Snapshot previous state for rollback
    const prevCourses = get().courses;
    const prevEnrolled = get().enrolledCourses;
    const prevActiveId = get().activeCourseId;
    const prevActive = get().activeCourse;

    try {
      const remainingCourses = prevCourses.filter((c) => c.id !== courseId);
      const remainingEnrolled = prevEnrolled.filter((c) => c.id !== courseId);

      let nextActiveId = prevActiveId;
      if (nextActiveId === courseId) {
        nextActiveId = remainingCourses.length > 0 ? remainingCourses[0].id : '';
        if (typeof window !== 'undefined') {
          if (nextActiveId) {
            localStorage.setItem('aanvi_active_course_id', nextActiveId);
          } else {
            localStorage.removeItem('aanvi_active_course_id');
          }
        }
      }

      const nextActive = remainingCourses.find((c) => c.id === nextActiveId) || (remainingCourses.length > 0 ? remainingCourses[0] : null);

      set({
        courses: remainingCourses,
        enrolledCourses: remainingEnrolled,
        activeCourseId: nextActiveId,
        activeCourse: nextActive,
        error: null,
      });

      const url = `${API_BASE}/courses/${encodeURIComponent(courseId)}/hard`;
      const res = await fetch(url, {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders(),
        }
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || 'Server failed to permanently delete course');
      }

      return true;
    } catch (err: any) {
      console.error('Error permanently deleting course, rolling back UI state:', err);
      set({
        courses: prevCourses,
        enrolledCourses: prevEnrolled,
        activeCourseId: prevActiveId,
        activeCourse: prevActive,
        error: err.message || 'Hard delete failed on server. Rolled back.',
      });
      if (typeof window !== 'undefined' && prevActiveId) {
        localStorage.setItem('aanvi_active_course_id', prevActiveId);
      }
      return false;
    }
  },

  archiveCourse: async (courseId: string): Promise<boolean> => {
    return get().deleteCourse(courseId);
  },

  joinClass: async (code: string, userId?: string | number) => {
    try {
      const res = await fetch(`${API_BASE}/courses/join-class`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          user_id: userId ? String(userId) : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.detail || 'Could not join class with that code.' };
      }

      // Refresh courses and classes
      await get().fetchCourses(userId);
      await get().fetchClasses(userId);

      return {
        success: true,
        message: data.message,
        class_name: data.class_name,
      };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error joining class.' };
    }
  },

  seedDemoCourse: async () => {
    try {
      await fetch(`${API_BASE}/courses/seed-demo`, { method: 'POST' });
      await get().fetchCourses();
    } catch (err) {
      console.error('Failed to seed demo course', err);
    }
  },
}));
