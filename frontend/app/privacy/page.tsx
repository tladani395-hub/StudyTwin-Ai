'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, Lock, FileCheck, CheckCircle2 } from 'lucide-react';
import AanviLogo from '@/components/brand/AanviLogo';
import Theme3DButton from '@/components/ui/Theme3DButton';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-6">
          <Link href="/" className="flex items-center gap-2">
            <AanviLogo size="md" />
          </Link>
          <div className="flex items-center gap-3">
            <Theme3DButton />
            <Link
              href="/"
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] flex items-center gap-1 font-mono"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back Home</span>
            </Link>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>COPPA & GDPR Compliance Statement</span>
          </div>
          <h1 className="text-3xl font-display font-black text-[var(--text-main)]">
            Privacy Policy & Child Safety Protocol
          </h1>
          <p className="text-xs text-[var(--text-muted)]">Last updated: October 2026</p>
        </div>

        {/* Policy Content */}
        <div className="p-8 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-6 text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-[var(--text-main)]">1. Child Safety & COPPA Verification</h2>
            <p>
              Aanvi takes the safety of minor students seriously. For learners aged 15 and below (Explorer Mode), parental consent is verified before full profile activation. We do not collect or sell minors' personal identifiable information (PII) to third parties.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[var(--text-main)]">2. Local On-Device Processing</h2>
            <p>
              Camera engagement checks and focus tracker algorithms run 100% locally in your browser via client-side WebAssembly and canvas analysis. No live webcam video feeds are ever stored or streamed to external servers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[var(--text-main)]">3. Source-Grounded Tutoring Data</h2>
            <p>
              Course documents (PDFs, slide decks, video transcripts) uploaded by institutions or students are indexed exclusively into private, isolated vector spaces. RAG responses are strictly verified against these documents with zero out-of-syllabus hallucination.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[var(--text-main)]">4. Right to Deletion ("Delete My Data")</h2>
            <p>
              Every user has the absolute right to permanently delete their account, quiz attempts, mastery states, and chat threads instantly via the "Delete My Data" endpoint in Settings.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
