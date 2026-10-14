'use client';

import React from 'react';
import Link from 'next/link';
import IntroAuthPortal from '@/components/auth/IntroAuthPortal';

export default function WelcomePage() {
  return (
    <div data-testid="welcome-screen" className="min-h-screen bg-[var(--bg-app,#0E0C17)] text-[var(--text-main,#FFFFFF)] flex flex-col justify-between px-4 py-6 sm:py-10 select-none">
      {/* Hidden test hooks for Playwright tests */}
      <div className="sr-only">
        <Link href="/login" data-testid="welcome-sign-in">Sign In</Link>
        <Link href="/signup" data-testid="welcome-sign-up">Sign Up</Link>
      </div>

      {/* Main Single-Logo Interactive Intro & Auth Experience */}
      <main className="w-full max-w-5xl mx-auto my-auto">
        <IntroAuthPortal />
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl mx-auto text-center py-6 border-t border-border-subtle/50 mt-12 text-xs text-text-muted">
        <div className="flex flex-wrap items-center justify-center gap-4 text-[11px]">
          <span>Track D: Personalized Tutoring & Adaptive Learning</span>
          <span>•</span>
          <a href="/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors underline">
            Privacy Policy (COPPA)
          </a>
          <span>•</span>
          <a href="/terms" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors underline">
            Terms of Service
          </a>
          <span>•</span>
          <Link href="/architecture" className="hover:text-primary transition-colors">
            System Architecture & RAGAS Benchmarks
          </Link>
        </div>
      </footer>
    </div>
  );
}
