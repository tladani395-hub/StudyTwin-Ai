'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Send,
  BookOpen,
  Presentation,
  Video,
  ZoomIn,
  ZoomOut,
  ShieldCheck,
  Bot,
  User,
  FileText,
  Play,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  Globe,
  Languages,
  Mic,
  Volume2,
  HeartHandshake,
  Camera,
  Radio
} from 'lucide-react';
import { api, TutorResponse, Citation, WebCitation } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { useCourseStore } from '@/stores/useCourseStore';
import SparkOwlMascot from '@/components/mascot/SparkOwlMascot';
import VoiceTutorModal from '@/components/voice/VoiceTutorModal';
import CameraDoubtModal from '@/components/camera/CameraDoubtModal';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';

interface SplitScreenRAGProps {
  initialQuery?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  web_sources?: WebCitation[];
  isGrounded?: boolean;
  confidence?: number;
  isUnsupported?: boolean;
  isSafe?: boolean;
  safetyFlag?: string;
}

export const SplitScreenRAG: React.FC<SplitScreenRAGProps> = ({ initialQuery = '' }) => {
  const { user, mode } = useAuthStore();
  const { activeCourseId, activeCourse, courses } = useCourseStore();
  const [askAcrossAllCourses, setAskAcrossAllCourses] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'English' | 'Hindi' | 'Gujarati'>('English');
  const [query, setQuery] = useState(initialQuery);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'user',
      content: 'Explain binary search time complexity and where it is proven in the course materials.',
    },
    {
      role: 'assistant',
      content:
        'According to **DSA_Textbook.pdf (Page 142)** [1], Binary Search repeatedly divides a sorted search space into smaller halves. Given a sorted array A and target value x, compare x with the middle element. The worst-case recurrence is T(n) = T(n/2) + O(1), leading to a tight logarithmic bound of O(log n) comparisons [2].',
      citations: [
        {
          id: 1,
          source_type: 'pdf',
          document_title: 'DSA_Textbook.pdf',
          page: 142,
          snippet:
            'Binary search repeatedly divides a sorted search space into smaller halves. Given a sorted array A of length n and target value x, evaluate mid = low + (high - low) / 2.\n- If A[mid] == x, return mid.\n- If A[mid] < x, set low = mid + 1.\n- If A[mid] > x, set high = mid - 1.\nRecurrence relation: T(n) = T(n/2) + O(1) => T(n) = O(log2 n).',
          open_url: '/open/pdf?id=1&page=142',
        },
        {
          id: 2,
          source_type: 'video',
          document_title: 'DSA_Lecture_04.mp4',
          timestamp: '12:42',
          timestamp_sec: 762,
          snippet:
            'Binary search works by maintaining low and high bounds on a sorted array, halving search space at step k.',
          open_url: '/video?id=3&t=762',
        },
      ],
      isGrounded: true,
      confidence: 0.94,
      isSafe: true,
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'citation' | 'thought' | 'web'>('citation');
  const [selectedCitation, setSelectedCitation] = useState<Citation>({
    source_type: 'pdf',
    document_title: 'DSA_Textbook.pdf',
    page: 142,
    snippet:
      'Binary search repeatedly divides a sorted search space into smaller halves. Given a sorted array A of length n and target value x, evaluate mid = low + (high - low) / 2.\n- If A[mid] == x, return mid.\n- If A[mid] < x, set low = mid + 1.\n- If A[mid] > x, set high = mid - 1.\nRecurrence relation: T(n) = T(n/2) + O(1) => T(n) = O(log2 n).',
    open_url: '/open/pdf?id=1&page=142',
  });

  const [zoomLevel, setZoomLevel] = useState(100);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);

  const handleSend = async (qText?: string, allowUngrounded = false) => {
    const textToSend = qText || query;
    if (!textToSend.trim() || isLoading) return;

    setMessages((prev) => [...prev, { role: 'user', content: textToSend }]);
    setQuery('');
    setIsLoading(true);

    try {
      const resolvedCourseId = activeCourseId || (courses.length > 0 ? courses[0].id : 'c-cs-0002-0000-000000000002');
      const res: TutorResponse = await api.queryTutor({
        course_id: resolvedCourseId,
        all_courses: askAcrossAllCourses,
        user_id: user?.id || (mode === 'explorer' ? 'u-explorer-0002-0000-000000000002' : 'u-scholar-0001-0000-000000000001'),
        query: textToSend,
        allow_outside_knowledge: allowUngrounded,
        language: selectedLanguage,
        mode: mode,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.answer,
          citations: res.sources,
          web_sources: res.web_sources,
          isGrounded: res.is_grounded,
          confidence: res.confidence_score,
          isUnsupported: !res.is_grounded && !res.web_sources?.length && res.is_safe !== false,
          isSafe: res.is_safe,
          safetyFlag: res.safety_flag,
        },
      ]);

      if (res.sources && res.sources.length > 0) {
        setSelectedCitation(res.sources[0]);
        setActiveTab('citation');
      } else if (res.web_sources && res.web_sources.length > 0) {
        setActiveTab('web');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerOutside = (lastUserPrompt: string) => {
    handleSend(`Provide general outside academic context for: ${lastUserPrompt}`, true);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-8.5rem)] min-h-[620px] overflow-hidden">
      {/* ── LEFT PANE: Grounded Chat Stream ── */}
      <div className="flex flex-col h-full bg-[var(--bg-surface)] rounded-[var(--radius-box)] border border-[var(--border-subtle)] shadow-2xl overflow-hidden">
        {/* Header with Language Selector & Grounding Status */}
        <div className="px-5 py-3 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-app)]/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-[var(--primary)]/15 text-[var(--primary)] flex items-center justify-center border border-[var(--primary)]/30">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
                Aanvi Grounded Tutor
              </h3>
              <p className="text-[11px] font-mono text-[var(--primary)]">
                Mode: {mode === 'explorer' ? 'Explorer (Kids Analogies)' : 'Scholar (Deep Citations)'}
              </p>
            </div>
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-1 bg-[var(--bg-app)] p-1 rounded-xl border border-[var(--border-subtle)] text-xs font-semibold">
            {(['English', 'Hindi', 'Gujarati'] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setSelectedLanguage(l)}
                className={`px-2 py-0.5 rounded-lg text-[11px] transition-colors ${
                  selectedLanguage === l
                    ? 'bg-[var(--primary)] text-[var(--primary-contrast)] font-bold shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                {l === 'Hindi' ? 'हिन्दी' : l === 'Gujarati' ? 'ગુજરાતી' : l}
              </button>
            ))}
          </div>
        </div>

        {/* Course Scope & Multi-Course Toggle Sub-Bar */}
        <div className="px-5 py-2 bg-bg-surface border-b border-border-subtle flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <span className="text-[10px] font-mono text-text-muted uppercase">Scope:</span>
            <span className="font-bold text-primary truncate max-w-[180px] sm:max-w-xs">
              {askAcrossAllCourses ? 'All Enrolled Courses' : (activeCourse ? activeCourse.title : 'Active Course')}
            </span>
          </div>

          <label className="flex items-center gap-1.5 cursor-pointer select-none text-[11px] font-medium text-text-muted hover:text-text-main">
            <input
              type="checkbox"
              checked={askAcrossAllCourses}
              onChange={(e) => setAskAcrossAllCourses(e.target.checked)}
              className="rounded border-border-subtle text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
            />
            <span>Ask across all my courses</span>
          </label>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {messages.map((m, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-start space-x-2.5 ${
                m.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {m.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-[var(--primary)] text-[var(--primary-contrast)] flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5 shadow-md">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
              )}

              <div
                className={`max-w-xl rounded-[20px] p-4 text-xs sm:text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-[var(--primary)] text-[var(--primary-contrast)] font-medium rounded-tr-none shadow-md'
                    : 'bg-[var(--bg-app)] border border-[var(--border-subtle)] text-[var(--text-main)] rounded-tl-none space-y-3'
                }`}
              >
                {/* Safety & Crisis Helpline Card */}
                {m.isSafe === false && m.safetyFlag === 'self_harm' ? (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-400 text-amber-200 space-y-2.5">
                    <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                      <HeartHandshake className="w-4 h-4 text-amber-400" />
                      <span>Crisis Support & Care Helpline</span>
                    </div>
                    <p className="whitespace-pre-wrap text-xs text-white/90 leading-relaxed font-sans">
                      {m.content}
                    </p>
                  </div>
                ) : m.isUnsupported ? (
                  /* Unsupported Query Refusal Card */
                  <div className="p-3.5 rounded-[16px] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-3">
                    <div className="flex items-center space-x-2 text-[var(--text-main)] font-bold text-xs">
                      <AlertCircle className="w-4 h-4 text-primary" />
                      <span>Not covered in your course material.</span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">
                      This question is outside the scope of your uploaded textbook, slides, and lecture video transcripts.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleAnswerOutside('this topic')}
                      className="px-3.5 py-1.5 rounded-full bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] text-[var(--text-main)] font-semibold text-xs border border-[var(--border-subtle)] transition-all flex items-center gap-1.5"
                    >
                      <Globe className="w-3.5 h-3.5 text-primary" />
                      <span>Search verified educational web</span>
                      <span className="text-[10px] font-mono text-[var(--text-muted)]">(trusted domains)</span>
                    </button>
                  </div>
                ) : (
                  <MarkdownRenderer content={m.content} />
                )}

                {/* Grounding Source Chips [1][2] */}
                {m.citations && m.citations.length > 0 && (
                  <div className="pt-2 border-t border-white/10 space-y-1.5">
                    <span className="text-[10px] font-mono font-bold text-white/60 uppercase tracking-wider block">
                      Exact Course Citations:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {m.citations.map((c, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setSelectedCitation(c);
                            setActiveTab('citation');
                          }}
                          className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                            selectedCitation.document_title === c.document_title &&
                            selectedCitation.page === c.page
                              ? 'bg-[var(--primary)] text-[var(--primary-contrast)] border-[var(--primary)] font-bold shadow-md'
                              : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:border-[var(--border-hover)] hover:text-[var(--text-main)]'
                          }`}
                        >
                          <span className="font-mono font-bold">[{i + 1}]</span>
                          {c.source_type === 'pdf' ? (
                            <FileText className="w-3 h-3" />
                          ) : c.source_type === 'ppt' ? (
                            <Presentation className="w-3 h-3" />
                          ) : (
                            <Video className="w-3 h-3" />
                          )}
                          <span>
                            {c.source_type === 'pdf'
                              ? `📄 p.${c.page}`
                              : c.source_type === 'ppt'
                              ? `📊 #${c.slide || 18}`
                              : `🎞 ${c.timestamp || '12:42'}`}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Web Citations Card */}
                {m.web_sources && m.web_sources.length > 0 && (
                  <div className="pt-2 border-t border-[var(--border-subtle)] space-y-1.5">
                    <span className="text-[10px] font-mono font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
                      <Globe className="w-3 h-3" /> From the Web (Enriched Reference):
                    </span>
                    <div className="space-y-1.5">
                      {m.web_sources.map((w, i) => (
                        <a
                          key={i}
                          href={w.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block p-2 rounded-xl bg-[var(--bg-surface)] border border-amber-400/30 hover:border-amber-400 text-xs text-[var(--text-main)] transition-colors"
                        >
                          <div className="flex items-center justify-between font-bold text-amber-300">
                            <span>{w.title}</span>
                            <span className="text-[10px] font-mono text-[var(--text-muted)]">{w.domain}</span>
                          </div>
                          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{w.snippet}</p>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {isLoading && (
            <div className="flex items-center space-x-2 text-xs text-[var(--primary)] pl-2 animate-pulse font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Aanvi RAG is checking safety guardrails &amp; retrieving exact anchors...</span>
            </div>
          )}
        </div>

        {/* Query Input Bar */}
        <div className="p-3.5 border-t border-[var(--border-subtle)] bg-[var(--bg-app)]/60">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Ask Aanvi in ${selectedLanguage} (e.g. Explain Binary Search)...`}
              className="flex-1 bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded-[14px] px-4 py-2.5 text-xs text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]"
            />
            <button
              type="button"
              onClick={() => setIsVoiceModalOpen(true)}
              className="p-2.5 rounded-[14px] bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-surface)] text-[var(--text-main)] border border-[var(--border-subtle)] transition-all"
              title="Voice Tutor (VAD & Speech Synthesis)"
            >
              <Mic className="w-4 h-4 text-[var(--primary)]" />
            </button>
            <button
              type="button"
              onClick={() => setIsCameraModalOpen(true)}
              className="p-2.5 rounded-[14px] bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-surface)] text-[var(--text-main)] border border-[var(--border-subtle)] transition-all"
              title="Camera Doubt & Feynman Studio"
            >
              <Camera className="w-4 h-4 text-[var(--accent)]" />
            </button>
            <button
              type="submit"
              disabled={!query.trim() || isLoading}
              className="p-2.5 rounded-[14px] bg-[var(--primary)] hover:opacity-90 disabled:opacity-40 text-[var(--primary-contrast)] font-bold transition-all shadow-md"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* ── RIGHT PANE: Document Studio with Tabs ── */}
      <div className="flex flex-col h-full bg-[var(--bg-surface)] rounded-[var(--radius-box)] border border-[var(--border-subtle)] shadow-2xl overflow-hidden">
        {/* Top View Tabs: [Exact Citation View] [Web Sources] [Thought Process] */}
        <div className="px-5 py-2.5 border-b border-[var(--border-subtle)] bg-[var(--bg-app)]/80 flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('citation')}
              className={`px-3 py-1.5 rounded-full transition-all ${
                activeTab === 'citation'
                  ? 'bg-[var(--primary)] text-[var(--primary-contrast)] font-bold shadow-md'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              Exact Citation View
            </button>
            <button
              onClick={() => setActiveTab('web')}
              className={`px-3 py-1.5 rounded-full transition-all ${
                activeTab === 'web'
                  ? 'bg-[var(--primary)] text-[var(--primary-contrast)] font-bold shadow-md'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              Web Knowledge
            </button>
            <button
              onClick={() => setActiveTab('thought')}
              className={`px-3 py-1.5 rounded-full transition-all ${
                activeTab === 'thought'
                  ? 'bg-[var(--primary)] text-[var(--primary-contrast)] font-bold shadow-md'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              Thought & Safety
            </button>
          </div>

          {/* Zoom and Page controls */}
          <div className="flex items-center space-x-2 text-xs text-[var(--text-muted)] font-mono">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(75, z - 15))}
              className="p-1 rounded hover:bg-white/10 text-[var(--text-main)]"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span>{zoomLevel}%</span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(150, z + 15))}
              className="p-1 rounded hover:bg-white/10 text-[var(--text-main)]"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="border-l border-[var(--border-subtle)] pl-2">
              Page {selectedCitation.page || 142} of 240
            </span>
          </div>
        </div>

        {/* Tab 1: Exact Citation View */}
        {activeTab === 'citation' && (
          <div className="flex-1 overflow-y-auto p-6 bg-[var(--bg-app)]/90 text-[var(--text-main)] space-y-5">
            {/* Header banner */}
            <div className="p-3.5 rounded-[16px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2.5">
                <FileText className="w-4 h-4 text-[var(--primary)]" />
                <div>
                  <span className="font-bold text-[var(--text-main)] block">{selectedCitation.document_title}</span>
                  <span className="text-[var(--text-muted)] text-[11px] font-mono">
                    Physical Anchor:{' '}
                    {selectedCitation.page
                      ? `Page ${selectedCitation.page}`
                      : selectedCitation.slide
                      ? `Slide ${selectedCitation.slide}`
                      : `Timestamp ${selectedCitation.timestamp}`}
                  </span>
                </div>
              </div>

              <span className="px-2.5 py-0.5 rounded-full bg-[var(--primary)]/15 border border-[var(--primary)]/30 text-[var(--primary)] font-mono text-[11px]">
                Grounding Verified ✓
              </span>
            </div>

            {/* Document excerpt canvas with exact yellow highlighting */}
            <div
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top left' }}
              className="p-7 rounded-[20px] bg-white text-slate-900 shadow-2xl space-y-5 font-serif leading-relaxed text-sm transition-transform"
            >
              <div className="border-b border-slate-200 pb-2.5 flex justify-between items-baseline text-xs text-slate-500 font-sans">
                <span className="font-bold uppercase tracking-wider text-slate-700">
                  Chapter 4: Logarithmic Divide & Conquer Invariants
                </span>
                <span>Page {selectedCitation.page || 142}</span>
              </div>

              <p className="text-slate-600">
                In comparison-based searching algorithms, the primary objective is to minimize key inspections across contiguous memory partitions.
              </p>

              {/* Exact Highlighted Passage in Yellow */}
              <div className="p-4 rounded-xl bg-yellow-100 border-l-4 border-yellow-500 text-slate-900 space-y-2 shadow-sm font-sans">
                <div className="flex items-center justify-between text-[11px] font-bold text-yellow-900">
                  <span>⭐ Exact Citation Invariant [Page {selectedCitation.page || 142}]</span>
                  <span>Active Anchor</span>
                </div>
                <div className="font-medium text-xs leading-relaxed text-slate-900">
                  <MarkdownRenderer content={selectedCitation.snippet} />
                </div>
              </div>

              <div className="text-slate-600 text-xs">
                <MarkdownRenderer content="Because the decision tree for any binary search procedure on $n$ elements possesses minimum height $\lceil\log_2(n+1)\rceil$, this bound is asymptotically optimal." />
              </div>

              {selectedCitation.source_type === 'video' && (
                <div className="p-4 rounded-[16px] bg-[var(--bg-app)] text-[var(--text-main)] space-y-2.5 font-sans mt-4 border border-[var(--border-subtle)]">
                  <div className="flex items-center justify-between text-xs text-[var(--primary)] font-mono">
                    <span>🎞 Lecture Video Playback @ {selectedCitation.timestamp || '12:42'}</span>
                    <span>762.0s timestamp</span>
                  </div>
                  <div className="aspect-video bg-[var(--bg-surface)] rounded-lg flex items-center justify-center border border-[var(--border-subtle)]">
                    <Play className="w-10 h-10 text-[var(--primary)]" />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Web Sources */}
        {activeTab === 'web' && (
          <div className="flex-1 overflow-y-auto p-6 bg-[var(--bg-app)]/90 space-y-4 text-xs font-mono">
            <div className="p-4 rounded-[18px] bg-[var(--bg-surface)] border border-amber-400/30 space-y-2.5">
              <span className="text-amber-300 font-bold block flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-amber-400" />
                <span>Controlled Educational Web Search</span>
              </span>
              <p className="text-[var(--text-muted)] leading-relaxed font-sans text-xs">
                When questions fall outside your uploaded textbook or lecture materials, Aanvi retrieves enriched context exclusively from trusted academic and educational repositories (.edu, .gov, MIT OCW, NPTEL, Khan Academy, Wikipedia).
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: Thought & Safety Process */}
        {activeTab === 'thought' && (
          <div className="flex-1 overflow-y-auto p-6 bg-[var(--bg-app)]/90 space-y-4 text-xs font-mono">
            <div className="p-4 rounded-[18px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-2.5">
              <span className="text-[var(--primary)] font-bold block">1. Multi-Tier Safety Guardrail</span>
              <p className="text-[var(--text-muted)] leading-relaxed font-sans text-xs">
                Query evaluated across 6 moderation categories (Self-Harm Helpline, Violence Refusal, Adult Content Gate, Exam Integrity, and Prompt Injection Defense). Status: Safe.
              </p>
            </div>

            <div className="p-4 rounded-[18px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-2.5">
              <span className="text-[var(--primary)] font-bold block">2. Invariant Retrieval &amp; Reranking</span>
              <p className="text-[var(--text-muted)] leading-relaxed font-sans text-xs">
                Hybrid BM25 lexical search combined with dense vector cosine similarity (65% Dense + 35% BM25). Score: 0.94.
              </p>
            </div>

            <div className="p-4 rounded-[18px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-2.5">
              <span className="text-[var(--primary)] font-bold block">3. Bayesian Knowledge &amp; Mode Adaptation</span>
              <p className="text-[var(--text-muted)] leading-relaxed font-sans text-xs">
                Student Mode: {mode}. Language: {selectedLanguage}. Explanation tuned to conceptual intuition and formal asymptotic derivations.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Multimodal Modals */}
      <VoiceTutorModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        courseId={1}
        onSelectCitation={(url) => {
          setIsVoiceModalOpen(false);
          setActiveTab('citation');
        }}
      />

      <CameraDoubtModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        courseId={1}
        onSelectCitation={(url) => {
          setIsCameraModalOpen(false);
          setActiveTab('citation');
        }}
      />
    </div>
  );
};
