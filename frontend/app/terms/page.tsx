'use client';

import React from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft } from 'lucide-react';
import AanviLogo from '@/components/brand/AanviLogo';
import Theme3DButton from '@/components/ui/Theme3DButton';

export default function TermsPage() {
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
          <div className="flex items-center gap-2 text-[var(--primary)] font-mono text-xs font-bold">
            <FileText className="w-4 h-4" />
            <span>Terms of Service Agreement</span>
          </div>
          <h1 className="text-3xl font-display font-black text-[var(--text-main)]">
            Aanvi Terms of Service
          </h1>
          <p className="text-xs text-[var(--text-muted)]">Effective Date: October 2026</p>
        </div>

        {/* Terms Content */}
        <div className="p-8 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-6 text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-[var(--text-main)]">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Aanvi, you agree to be bound by these Terms of Service. If you are under 16 years of age, your parent or legal guardian must review and authorize your account registration.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[var(--text-main)]">2. Educational Use Only</h2>
            <p>
              Aanvi is designed to facilitate student learning, conceptual mastery, and active recall based on ingested course materials. It is not a tool for academic dishonesty or real-time exam cheating.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[var(--text-main)]">3. Content Safety Guardrails</h2>
            <p>
              Users must not input harmful, violent, abusive, or self-harm-related queries. System safety guardrails will refuse non-educational queries and offer crisis support resources where appropriate.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
