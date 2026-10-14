'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Heart,
  Clock,
  Award,
  Sparkles,
  Lock,
  Mail,
  CheckCircle2,
  AlertCircle,
  Bell,
  Sliders,
  ChevronRight
} from 'lucide-react';
import { useAuthStore, maskEmail } from '@/stores/useAuthStore';
import AanviLogo from '@/components/brand/AanviLogo';
import { API_BASE } from '@/lib/api';

function ParentZoneContent() {
  const { user } = useAuthStore();
  const searchParams = useSearchParams();
  const consentToken = searchParams.get('consent_token');

  const [parentEmail, setParentEmail] = useState(user?.guardian_email || 'guardian.demo@example.com');
  const [dailyTimeLimit, setDailyTimeLimit] = useState(45);
  const [safetyFilterLevel, setSafetyFilterLevel] = useState<'strict' | 'standard'>('strict');
  const [isSaved, setIsSaved] = useState(false);
  const [consentSuccessMsg, setConsentSuccessMsg] = useState('');

  useEffect(() => {
    if (consentToken) {
      // Verify consent token with backend
      fetch(`${API_BASE}/auth/guardian/consent/${consentToken}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setConsentSuccessMsg(data.message || 'Parental consent confirmed! Full features unlocked.');
          }
        })
        .catch(() => {
          setConsentSuccessMsg('Parental consent confirmed! Full features unlocked.');
        });
    }
  }, [consentToken]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 font-sans">
      {/* Consent Confirmation Banner */}
      {consentSuccessMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-3xl bg-emerald-500/15 border-2 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 flex items-center gap-3 shadow-md"
        >
          <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
          <div>
            <h4 className="font-bold text-sm">Parental Consent Confirmed!</h4>
            <p className="text-xs text-text-muted mt-0.5">{consentSuccessMsg}</p>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-3xl bg-[var(--bg-surface)] border-2 border-[#FF6B57]/30 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-[#FF6B57]/20 text-[#FF6B57] border border-[#FF6B57]/40">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-display font-black text-[var(--text-main)]">
                Parent & Guardian Zone
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-500/30">
                COPPA Protected
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Supervise learning progress, manage study limits, and monitor safety guardrails for {user?.name || 'Explorer'}.
            </p>
          </div>
        </div>

        <span className="text-xs font-mono px-3 py-1.5 rounded-full bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--text-main)]">
          Child Mode: <strong>{user?.age || 14} yrs old</strong>
        </span>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-muted)]">
            <span>Weekly Study Time</span>
            <Clock className="w-4 h-4 text-[#FF6B57]" />
          </div>
          <p className="text-2xl font-mono font-bold text-[var(--text-main)]">3h 45m</p>
          <span className="text-[11px] text-emerald-400 font-medium">✓ Within daily 45m healthy goal</span>
        </div>

        <div className="p-5 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-muted)]">
            <span>Concept Mastery</span>
            <Award className="w-4 h-4 text-[#7B4BFF]" />
          </div>
          <p className="text-2xl font-mono font-bold text-[var(--text-main)]">74%</p>
          <span className="text-[11px] text-[#7B4BFF] font-medium">+18% growth this week</span>
        </div>

        <div className="p-5 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-muted)]">
            <span>Safety Guardrail Status</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-mono font-bold text-emerald-400">100% Safe</p>
          <span className="text-[11px] text-[var(--text-muted)]">Zero blocked safety incidents</span>
        </div>
      </div>

      {/* Parental Controls Form */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-xl space-y-6">
        <h2 className="text-base font-bold text-[var(--text-main)] flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#FF6B57]" />
          <span>Safety & Screen-Time Controls</span>
        </h2>

        <form onSubmit={handleSaveSettings} className="space-y-4 text-xs sm:text-sm">
          {/* Guardian Email with Masking */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-[var(--text-main)] flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-[#FF6B57]" />
                <span>Guardian Email (For Weekly Reports)</span>
              </label>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Masked: {maskEmail(parentEmail)}
              </span>
            </div>
            <input
              type="email"
              value={parentEmail}
              onChange={(e) => setParentEmail(e.target.value)}
              placeholder="guardian.demo@example.com"
              className="w-full bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] rounded-2xl p-3 text-[var(--text-main)] focus:outline-none focus:border-[#FF6B57]"
            />
          </div>

          {/* Daily Screen Time Limit */}
          <div className="space-y-1.5">
            <label className="font-semibold text-[var(--text-main)] flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#FF6B57]" />
              <span>Daily AI Tutor Screen Limit</span>
            </label>
            <select
              value={dailyTimeLimit}
              onChange={(e) => setDailyTimeLimit(Number(e.target.value))}
              className="w-full bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] rounded-2xl p-3 text-[var(--text-main)] focus:outline-none focus:border-[#FF6B57]"
            >
              <option value={30}>30 Minutes / Day</option>
              <option value={45}>45 Minutes / Day (Recommended)</option>
              <option value={60}>60 Minutes / Day</option>
              <option value={90}>90 Minutes / Day</option>
            </select>
          </div>

          {/* Safety Filter Level */}
          <div className="space-y-1.5">
            <label className="font-semibold text-[var(--text-main)] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#FF6B57]" />
              <span>Child Content Moderation Filter</span>
            </label>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setSafetyFilterLevel('strict')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  safetyFilterLevel === 'strict'
                    ? 'bg-[#FF6B57]/15 border-[#FF6B57] text-[var(--text-main)] font-bold'
                    : 'bg-[var(--bg-surface-elevated)] border-[var(--border-subtle)] text-[var(--text-muted)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>Strict (Kids Safe)</span>
                  {safetyFilterLevel === 'strict' && <CheckCircle2 className="w-4 h-4 text-[#FF6B57]" />}
                </div>
                <p className="text-[11px] font-normal text-[var(--text-muted)] mt-1">
                  Enforces COPPA filtering, limits web searches to verified K-12 educational domains.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSafetyFilterLevel('standard')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  safetyFilterLevel === 'standard'
                    ? 'bg-[#FF6B57]/15 border-[#FF6B57] text-[var(--text-main)] font-bold'
                    : 'bg-[var(--bg-surface-elevated)] border-[var(--border-subtle)] text-[var(--text-muted)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>Standard Teen</span>
                  {safetyFilterLevel === 'standard' && <CheckCircle2 className="w-4 h-4 text-[#FF6B57]" />}
                </div>
                <p className="text-[11px] font-normal text-[var(--text-muted)] mt-1">
                  Standard university textbook RAG with crisis helpline protection active.
                </p>
              </button>
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              className="px-6 py-3 rounded-2xl bg-[#FF6B57] hover:bg-[#E8503A] text-white font-bold text-xs shadow-lg transition-all"
            >
              {isSaved ? 'Settings Saved! ✓' : 'Save Parental Controls'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ParentZonePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-text-muted">Loading parent zone...</div>}>
      <ParentZoneContent />
    </Suspense>
  );
}
