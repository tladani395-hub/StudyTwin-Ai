'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Presentation,
  Video,
  Layers,
  Sparkles,
  Bot,
  ClipboardCheck,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  UploadCloud
} from 'lucide-react';
import { api, Citation } from '@/lib/api';
import { SourceModal } from '@/components/SourceModal';

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = Number(params?.id || 1);
  const [data, setData] = useState<any>(null);
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);

  useEffect(() => {
    const loadDetail = async () => {
      const res = await api.getCourseDetail(courseId);
      setData(res);
    };
    loadDetail();
  }, [courseId]);

  if (!data) {
    return <div className="p-8 text-center text-text-muted font-mono">Loading course syllabus and knowledge base...</div>;
  }

  const { course, documents, topics } = data;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Course Header */}
      <div className="p-6 sm:p-8 rounded-card bg-bg-surface border border-border-subtle shadow-card flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/30">
              {course.subject || 'Computer Science'}
            </span>
            <span className="text-xs text-emerald-500 font-mono flex items-center gap-1 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Vector Base Grounded
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main">{course.title}</h1>
          <p className="text-xs sm:text-sm text-text-muted leading-relaxed">{course.description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/tutor?course_id=${course.id}`}
            className="px-5 py-3 rounded-btn bg-primary hover:opacity-90 text-white font-bold text-xs transition-all shadow-md flex items-center gap-2"
          >
            <Bot className="w-4 h-4" />
            <span>Launch Course Tutor</span>
          </Link>

          <Link
            href={`/upload?course_id=${course.id}`}
            className="px-4 py-3 rounded-btn bg-bg-app hover:bg-bg-elevated text-text-main font-semibold text-xs border border-border-subtle transition-colors flex items-center gap-2"
          >
            <UploadCloud className="w-4 h-4 text-primary" />
            <span>Upload Materials</span>
          </Link>
        </div>
      </div>

      {/* Multimodal Documents Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-text-main">Ingested Multimodal Documents</h2>
            <p className="text-xs text-text-muted">PDF textbooks, PPT slides, and video recordings with exact chunk anchors</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {documents.map((doc: any) => {
            const isPdf = doc.source_type === 'pdf';
            const isPpt = doc.source_type === 'ppt';
            const isVideo = doc.source_type === 'video';

            return (
              <div
                key={doc.id}
                className="p-5 rounded-card bg-bg-surface border border-border-subtle flex flex-col justify-between space-y-4 shadow-card"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-btn bg-primary/15 text-primary border border-primary/30">
                      {isPdf && <BookOpen className="w-5 h-5" />}
                      {isPpt && <Presentation className="w-5 h-5" />}
                      {isVideo && <Video className="w-5 h-5" />}
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold">
                      Indexed
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-text-main">{doc.title}</h3>
                    <p className="text-[11px] text-text-muted font-mono mt-0.5">{doc.file_name}</p>
                  </div>

                  <p className="text-xs text-text-muted">
                    {isPdf ? `${doc.num_pages_or_slides || 240} Pages with OCR/Vision` : isPpt ? `${doc.num_pages_or_slides || 35} Slide Frames` : `35:00 Duration (Whisper Audio)`}
                  </p>
                </div>

                <button
                  onClick={() =>
                    setActiveCitation({
                      source_type: doc.source_type,
                      document_title: doc.title,
                      page: isPdf ? 142 : undefined,
                      slide: isPpt ? 18 : undefined,
                      timestamp: isVideo ? '12:42' : undefined,
                      timestamp_sec: isVideo ? 762 : undefined,
                      snippet: isPdf
                        ? 'Binary search repeatedly divides a sorted search space into smaller halves (Page 142)...'
                        : isPpt
                        ? 'Slide 18: Binary Search divide-and-conquer and BST properties...'
                        : 'Video lecture segment at 12:42 explaining low/high pointer bounds...',
                      open_url: isPdf ? '/open/pdf?id=1&page=142' : isPpt ? '/open/slide?id=2&slide=18' : '/video?id=3&t=762',
                    })
                  }
                  className="w-full py-2 rounded-btn bg-bg-app hover:bg-bg-elevated text-primary hover:opacity-90 border border-border-subtle text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Inspect Sample Chunk</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Curriculum Topic Tree */}
      <div className="p-6 rounded-card bg-bg-surface border border-border-subtle space-y-4 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-text-main">Curriculum Topic Structure</h2>
            <p className="text-xs text-text-muted">Prerequisite dependencies identified by multimodal topic extraction</p>
          </div>
          <Link
            href="/dashboard"
            className="text-xs text-primary hover:underline font-semibold"
          >
            Interactive Graph &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {topics.map((t: any) => (
            <div
              key={t.id}
              className="p-4 rounded-btn bg-bg-app border border-border-subtle space-y-2"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-text-main">{t.name}</h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-bg-elevated text-text-muted border border-border-subtle">
                  {t.category}
                </span>
              </div>
              <p className="text-xs text-text-muted">{t.description}</p>
              {t.prerequisites && t.prerequisites.length > 0 && (
                <div className="text-[11px] text-text-muted flex items-center gap-1 pt-1">
                  <span className="font-semibold text-text-main">Prerequisites:</span>
                  <span className="text-primary font-mono">{t.prerequisites.join(', ')}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <SourceModal
        isOpen={Boolean(activeCitation)}
        onClose={() => setActiveCitation(null)}
        citation={activeCitation}
      />
    </div>
  );
}
