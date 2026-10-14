'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Presentation, Video, Play, ExternalLink, Sparkles, CheckCircle2 } from 'lucide-react';
import { Citation } from '@/lib/api';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';

interface SourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  citation: Citation | null;
}

export const SourceModal: React.FC<SourceModalProps> = ({ isOpen, onClose, citation }) => {
  if (!isOpen || !citation) return null;

  const isPdf = citation.source_type === 'pdf';
  const isPpt = citation.source_type === 'ppt';
  const isVideo = citation.source_type === 'video';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-2xl bg-surface border border-surface-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-surface-card/60">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-xl ${
                isPdf ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                isPpt ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              }`}>
                {isPdf && <BookOpen className="w-5 h-5" />}
                {isPpt && <Presentation className="w-5 h-5" />}
                {isVideo && <Video className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-300 border border-primary-500/30">
                    {isPdf ? `PDF Page ${citation.page || 142}` : isPpt ? `Slide ${citation.slide || 18}` : `Video @ ${citation.timestamp || '12:42'}`}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Source-Grounded Anchor
                  </span>
                </div>
                <h3 className="text-base font-semibold text-white truncate max-w-md mt-0.5">
                  {citation.document_title}
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto space-y-5 text-sm">
            {isVideo && (
              <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 aspect-video flex flex-col justify-between p-4 group">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1 font-mono text-cyan-400 bg-cyan-950/60 px-2 py-1 rounded border border-cyan-800">
                    <Play className="w-3 h-3 fill-current" /> Seeking: {citation.timestamp || '12:42'} (762s)
                  </span>
                  <span className="bg-slate-900/80 px-2 py-1 rounded">1080p Lecture Capture</span>
                </div>

                <div className="flex flex-col items-center justify-center my-auto text-center space-y-2">
                  <div className="w-14 h-14 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform shadow-lg shadow-cyan-500/20 cursor-pointer">
                    <Play className="w-6 h-6 fill-current ml-0.5" />
                  </div>
                  <p className="text-xs text-slate-300 font-medium">Click to Play from exact anchor timestamp</p>
                </div>

                {/* Simulated Timeline bar */}
                <div className="space-y-1">
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden relative">
                    <div className="bg-gradient-to-r from-primary-500 to-cyan-400 h-full w-[36%]" />
                    <div className="absolute top-0 left-[36%] w-2.5 h-2.5 -mt-0.5 -ml-1 rounded-full bg-white shadow" />
                  </div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-500">
                    <span>12:42</span>
                    <span>35:00</span>
                  </div>
                </div>
              </div>
            )}

            {isPpt && (
              <div className="relative rounded-xl bg-slate-950 border border-amber-500/30 p-5 space-y-3">
                <div className="flex justify-between items-center text-xs text-amber-300 font-semibold border-b border-slate-800 pb-2">
                  <span>Slide Deck Frame #{citation.slide || 18}</span>
                  <span className="text-slate-400">Instructor Presentation Deck</span>
                </div>
                <div className="space-y-2 text-slate-200">
                  <h4 className="font-semibold text-amber-200 text-sm">Key Topic: Binary Search & Tree Properties</h4>
                  <ul className="list-disc list-inside space-y-1 text-xs text-slate-300">
                    <li>Requires monotonically sorted input keys</li>
                    <li>$T(n) = T(n/2) + O(1) \implies O(\log n)$ worst case</li>
                    <li>In-Order BST Traversal yields direct sorted array isomorphism</li>
                  </ul>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-primary-400" />
                <span>Extracted Grounding Content & Diagram Transcription</span>
              </div>
              <div className="p-4 rounded-xl bg-surface-card border border-surface-border text-slate-300 leading-relaxed font-sans text-xs sm:text-sm">
                <MarkdownRenderer content={citation.snippet} />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-primary-950/40 border border-primary-800/40 flex items-center justify-between text-xs">
              <span className="text-primary-200">
                Direct Deep Link URI: <code className="text-cyan-300 font-mono">{citation.open_url}</code>
              </span>
              <span className="text-slate-400 font-mono text-[11px]">20% Grounding Verification</span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end px-6 py-3 border-t border-surface-border bg-surface-card/40">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-medium text-xs transition-colors shadow-lg shadow-primary-600/20"
            >
              Close Source Viewer
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
