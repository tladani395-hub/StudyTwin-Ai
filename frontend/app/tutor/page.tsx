'use client';

import React, { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Chat } from '@/components/Chat';
import { SplitScreenRAG } from '@/components/SplitScreenRAG';
import { AuraOrb } from '@/components/AuraOrb';
import { Sparkles, Columns, MessageSquare, Radio } from 'lucide-react';

function TutorContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('query') || '';
  const [activeView, setActiveView] = useState<'split' | 'orb' | 'chat'>('split');

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto pb-12">
      {/* Top View Selector Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-card bg-bg-surface border border-border-subtle shadow-card">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center border border-primary/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-display font-bold text-text-main flex items-center gap-2">
              Aanvi Source-Grounded Tutor
            </h2>
            <p className="text-[11px] text-text-muted">
              Interactive split-screen document studio with exact page, slide, and timestamp citation anchors
            </p>
          </div>
        </div>

        {/* View switcher pill tabs */}
        <div className="flex items-center space-x-1.5 p-1 rounded-full bg-bg-app border border-border-subtle text-xs font-semibold">
          <button
            onClick={() => setActiveView('split')}
            className={`px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition-all ${
              activeView === 'split'
                ? 'bg-primary text-white font-bold shadow-md'
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Split-Screen Studio</span>
          </button>

          <button
            onClick={() => setActiveView('orb')}
            className={`px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition-all ${
              activeView === 'orb'
                ? 'bg-primary text-white font-bold shadow-md'
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Voice & Orb Mode</span>
          </button>

          <button
            onClick={() => setActiveView('chat')}
            className={`px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition-all ${
              activeView === 'chat'
                ? 'bg-primary text-white font-bold shadow-md'
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Focus Chat</span>
          </button>
        </div>
      </div>

      {/* Main Active Tutoring View */}
      {activeView === 'split' && (
        <SplitScreenRAG initialQuery={initialQuery} />
      )}

      {activeView === 'orb' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1">
            <AuraOrb />
          </div>
          <div className="lg:col-span-2 h-[640px]">
            <Chat initialQuery={initialQuery} />
          </div>
        </div>
      )}

      {activeView === 'chat' && (
        <div className="h-[calc(100vh-12rem)] max-w-5xl mx-auto flex flex-col">
          <Chat initialQuery={initialQuery} />
        </div>
      )}
    </div>
  );
}

export default function TutorPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-text-muted font-mono">Loading Aanvi AI Tutor...</div>}>
      <TutorContent />
    </Suspense>
  );
}
