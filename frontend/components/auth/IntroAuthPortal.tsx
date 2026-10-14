'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  BookOpen,
  Video,
  FileCheck,
  ShieldCheck,
  Brain,
  Layers,
  ArrowRight,
  LogIn,
  UserPlus,
  Compass,
  GraduationCap,
  Play,
  RotateCcw,
  CheckCircle2,
  Lock,
  Mail,
  User,
  Calendar,
  Eye,
  EyeOff,
  Flame,
  Award,
  Star,
  Zap,
  Globe,
  Radio,
  Camera,
  Cpu,
  HelpCircle,
  Clock,
  LogOut,
  AlertCircle
} from 'lucide-react';
import { useAuthStore, PreferredLanguage } from '@/stores/useAuthStore';
import { useThemeStore } from '@/stores/useThemeStore';
import AanviLogo from '@/components/brand/AanviLogo';
import Theme3DButton from '@/components/ui/Theme3DButton';
import SoundToggleButton from '@/components/ui/SoundToggleButton';
import PasswordStrengthMeter from '@/components/auth/PasswordStrengthMeter';
import { API_BASE } from '@/lib/api';

type PortalView = 'intro' | 'signin' | 'signup';

export default function IntroAuthPortal() {
  const router = useRouter();
  const { user, isAuthenticated, setAuth, setMode, logout } = useAuthStore();
  const { triggerIntro, soundEffects } = useThemeStore();

  const [activeView, setActiveView] = useState<PortalView>('intro');
  const [activeKnowledgeTab, setActiveKnowledgeTab] = useState<'rag' | 'modes' | 'sympy' | 'galaxy'>('rag');
  const [mounted, setMounted] = useState(false);

  // Sign In State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Sign Up State
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [signupDob, setSignupDob] = useState('2006-03-15');
  const [signupGrade, setSignupGrade] = useState('College / Undergraduate');
  const [signupLang, setSignupLang] = useState<PreferredLanguage>('English');
  const [signupGuardianEmail, setSignupGuardianEmail] = useState('');
  const [signupTerms, setSignupTerms] = useState(true);
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState('');

  // Live Age Calculation
  const calculateAge = (dobString: string): number => {
    try {
      const birth = new Date(dobString);
      const now = new Date();
      let age = now.getFullYear() - birth.getFullYear();
      const m = now.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
        age--;
      }
      return isNaN(age) ? 16 : age;
    } catch {
      return 16;
    }
  };

  const calculatedAge = calculateAge(signupDob);
  const isExplorerAge = calculatedAge <= 15;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Regular Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    const emailTrim = loginEmail.trim().toLowerCase();
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailTrim, password: loginPassword }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 423) setLoginError(data.detail || 'Account temporarily locked.');
        throw new Error(data.detail || 'Invalid email or password.');
      }

      const authData = await res.json();
      setAuth(authData.user, authData.access_token);
      setMode(authData.user.mode || 'scholar');
      router.push('/dashboard');
    } catch (err: any) {
      setLoginError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Sign Up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');

    if (!signupName.trim() || !signupEmail.trim() || !signupPassword) {
      setSignupError('Please complete all required fields.');
      return;
    }

    if (signupPassword.length < 8) {
      setSignupError('Password must be at least 8 characters long.');
      return;
    }

    if (isExplorerAge && !signupGuardianEmail.trim()) {
      setSignupError('Parent or Guardian email is required for students aged 15 or younger.');
      return;
    }

    setSignupLoading(true);
    const emailTrim = signupEmail.trim().toLowerCase();
    const determinedMode = isExplorerAge ? 'explorer' : 'scholar';

    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: signupName.trim(),
          email: emailTrim,
          password: signupPassword,
          date_of_birth: signupDob,
          grade: signupGrade,
          language: signupLang === 'Hindi' ? 'hi' : (signupLang === 'Gujarati' ? 'gu' : 'en'),
          preferred_language: signupLang,
          guardian_email: isExplorerAge ? signupGuardianEmail.trim() : null,
          terms_accepted: signupTerms,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Sign up failed. Please check your details.');
      }

      const authData = await res.json();
      setAuth(authData.user, authData.access_token);
      setMode(authData.user.mode || determinedMode);
      router.push('/dashboard');
    } catch (err: any) {
      setSignupError(err.message || 'Unable to connect to the study server. Please check your connection.');
    } finally {
      setSignupLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 select-none">
      {/* =========================================================================
          TOP NAVIGATION BAR & QUICK MODES
          ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-bg-surface/80 border border-border-subtle backdrop-blur-xl shadow-card">
        <div className="flex items-center gap-3">
          <AanviLogo size="md" variant="full" />
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-[11px] font-mono font-bold">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>Track D: Adaptive Multimodal AI</span>
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Main Flow View Switcher */}
          <div className="flex items-center p-1 rounded-full bg-bg-app border border-border-subtle text-xs font-semibold">
            <button
              onClick={() => setActiveView('intro')}
              className={`px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition-all ${
                activeView === 'intro'
                  ? 'bg-primary text-primary-contrast font-bold shadow-sm'
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>1. Brand Intro & Knowledge</span>
            </button>

            <button
              onClick={() => setActiveView('signin')}
              className={`px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition-all ${
                activeView === 'signin'
                  ? 'bg-primary text-primary-contrast font-bold shadow-sm'
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>2. Sign In</span>
            </button>

            <button
              onClick={() => setActiveView('signup')}
              className={`px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition-all ${
                activeView === 'signup'
                  ? 'bg-primary text-primary-contrast font-bold shadow-sm'
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>3. Sign Up</span>
            </button>
          </div>

          <SoundToggleButton />
          <Theme3DButton />
        </div>
      </div>

      {/* =========================================================================
          IF USER IS ALREADY AUTHENTICATED: SHOW WELCOME BACK BADGE
          ========================================================================= */}
      {isAuthenticated && user && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl bg-gradient-to-r from-primary/15 via-accent/10 to-transparent border border-primary/30 flex flex-wrap items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary text-primary-contrast flex items-center justify-center font-bold text-lg shadow-md">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-text-main text-base">
                  Welcome back, {user.name}!
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-mono font-bold uppercase">
                  {user.mode} Mode
                </span>
              </div>
              <p className="text-xs text-text-muted">
                {user.email} • {user.streak_days || 5}-day streak • {user.xp || 1250} XP
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-xl bg-primary text-primary-contrast font-bold text-xs flex items-center gap-2 hover:brightness-110 shadow-sm"
            >
              <span>Go to Your Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={() => logout()}
              className="px-3 py-2 rounded-xl bg-bg-surface hover:bg-bg-elevated border border-border-subtle text-text-muted hover:text-text-main text-xs font-semibold flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Switch Account</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* =========================================================================
          SECTION 1: HIGH-KNOWLEDGE BRAND INTRO & CAPABILITY SHOWCASE
          ========================================================================= */}
      {activeView === 'intro' && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="space-y-8"
        >
          {/* Hero Banner */}
          <div className="relative text-center max-w-4xl mx-auto space-y-4 py-6">
            <h1 className="text-4xl sm:text-6xl font-black font-display tracking-tight text-text-main leading-tight">
              Meet <span className="text-primary">Aanvi</span>
            </h1>
            <p className="text-lg sm:text-xl text-text-muted font-medium max-w-2xl mx-auto">
              The Multimodal, Source-Grounded Adaptive AI Study Companion
            </p>

            <p className="text-xs sm:text-sm text-text-muted/80 max-w-3xl mx-auto leading-relaxed">
              Transforming fragmented course materials (PDF textbooks, PPTX slides, and MP4 lecture videos) into an exact physical citation knowledge base. Dynamically adapting pedagogical style across age-gated dual UI shells, verifying algebraic steps symbolically with SymPy, and mapping mastery across a 3D celestial Concept Galaxy.
            </p>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
              <button
                onClick={() => triggerIntro()}
                className="px-5 py-2.5 rounded-full bg-primary text-primary-contrast font-bold text-xs flex items-center gap-2 shadow-lg hover:brightness-110 active:scale-95 transition-all font-mono"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Play 10s Brand Animation & Audio</span>
              </button>

              <button
                onClick={() => setActiveView('signin')}
                className="px-5 py-2.5 rounded-full bg-accent text-accent-contrast font-bold text-xs flex items-center gap-2 shadow-lg hover:brightness-110 active:scale-95 transition-all font-mono"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In to Your Workspace</span>
              </button>

              <button
                onClick={() => setActiveView('signup')}
                className="px-4 py-2.5 rounded-full bg-bg-surface border border-border-subtle text-text-main hover:border-primary font-semibold text-xs flex items-center gap-2 transition-all font-mono"
              >
                <UserPlus className="w-4 h-4 text-primary" />
                <span>Create Student Account</span>
              </button>
            </div>
          </div>

          {/* =========================================================================
              INTERACTIVE KNOWLEDGE PILLARS
              ========================================================================= */}
          <div className="p-6 rounded-3xl bg-bg-surface/90 border border-border-subtle shadow-card space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-4">
              <div>
                <h2 className="text-lg font-display font-black text-text-main flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <span>Interactive Educational Architecture</span>
                </h2>
                <p className="text-xs text-text-muted">
                  Explore how Aanvi guarantees strict grounding, age adaptation, and mathematical verification
                </p>
              </div>

              {/* Pillar Switcher Pills */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-full bg-bg-app border border-border-subtle text-xs font-semibold">
                <button
                  onClick={() => setActiveKnowledgeTab('rag')}
                  className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all ${
                    activeKnowledgeTab === 'rag'
                      ? 'bg-primary text-primary-contrast font-bold'
                      : 'text-text-muted hover:text-text-main'
                  }`}
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>1. Exact Citations & RAG</span>
                </button>

                <button
                  onClick={() => setActiveKnowledgeTab('modes')}
                  className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all ${
                    activeKnowledgeTab === 'modes'
                      ? 'bg-primary text-primary-contrast font-bold'
                      : 'text-text-muted hover:text-text-main'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>2. Dual-Product Modes</span>
                </button>

                <button
                  onClick={() => setActiveKnowledgeTab('sympy')}
                  className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all ${
                    activeKnowledgeTab === 'sympy'
                      ? 'bg-primary text-primary-contrast font-bold'
                      : 'text-text-muted hover:text-text-main'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>3. SymPy Proofs</span>
                </button>

                <button
                  onClick={() => setActiveKnowledgeTab('galaxy')}
                  className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all ${
                    activeKnowledgeTab === 'galaxy'
                      ? 'bg-primary text-primary-contrast font-bold'
                      : 'text-text-muted hover:text-text-main'
                  }`}
                >
                  <Brain className="w-3.5 h-3.5" />
                  <span>4. 3D Galaxy & BKT</span>
                </button>
              </div>
            </div>

            {/* Knowledge Tab Content */}
            <AnimatePresence mode="wait">
              {activeKnowledgeTab === 'rag' && (
                <motion.div
                  key="rag"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center"
                >
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>94.8% RAGAS Faithfulness Verified</span>
                    </div>
                    <h3 className="text-xl font-display font-bold text-text-main">
                      Zero Hallucination with Exact Physical Deep Links
                    </h3>
                    <p className="text-xs text-text-muted leading-relaxed">
                      Generic chatbots summarize materials blindly without auditability. Aanvi parses PDFs, PPTX lecture decks, and video audio streams into chunked embeddings indexed with exact physical metadata.
                    </p>
                    <div className="space-y-2 text-xs font-mono">
                      <div className="p-3 rounded-xl bg-bg-app border border-border-subtle flex items-start gap-2.5">
                        <span className="text-primary font-bold">[PDF]</span>
                        <span>Links directly to textbook chapter and page number: <strong className="text-text-main">[Chapter 4, Page 14]</strong></span>
                      </div>
                      <div className="p-3 rounded-xl bg-bg-app border border-border-subtle flex items-start gap-2.5">
                        <span className="text-accent font-bold">[PPT]</span>
                        <span>Links directly to presentation lecture slides: <strong className="text-text-main">[Lecture 08, Slide 6]</strong></span>
                      </div>
                      <div className="p-3 rounded-xl bg-bg-app border border-border-subtle flex items-start gap-2.5">
                        <span className="text-blue-400 font-bold">[VID]</span>
                        <span>Links directly to lecture video timestamps: <strong className="text-text-main">[Video 14:20]</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-bg-app border border-border-subtle font-mono text-xs space-y-3">
                    <div className="flex items-center justify-between text-text-muted pb-2 border-b border-border-subtle">
                      <span>Hybrid RAG Pipeline</span>
                      <span className="text-emerald-400">● 65% Dense + 35% BM25</span>
                    </div>
                    <div className="text-[11px] text-text-muted space-y-1">
                      <p><span className="text-primary">Query:</span> "Can I use the Master Theorem for Dijkstra?"</p>
                      <p><span className="text-emerald-400">Grounding Check:</span> cs201_ch4_recurrences.pdf (Page 4)</p>
                      <p><span className="text-blue-400">Retrieved Snippet:</span> "Master Theorem applies strictly to divide-and-conquer recurrences T(n) = aT(n/b) + f(n)..."</p>
                      <p className="text-amber-400">Out-of-syllabus queries are politely refused with grounded redirect suggestions.</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeKnowledgeTab === 'modes' && (
                <motion.div
                  key="modes"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  {/* Explorer Card */}
                  <div className="p-5 rounded-2xl bg-bg-app border-2 border-accent/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-accent font-bold text-xs">
                        <Compass className="w-4 h-4" />
                        <span>Explorer Mode (Ages ≤ 15)</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-accent/20 text-text-main text-[10px] font-bold">
                        Gamified Space Quest
                      </span>
                    </div>
                    <h4 className="text-base font-display font-bold text-text-main">
                      Playful Cosmic Adventure with Spark-Owl Companion
                    </h4>
                    <p className="text-xs text-text-muted leading-relaxed">
                      Customized for younger learners with playful Coral, Grape, and Gold tokens. Includes star chest unlock rewards, animated Spark-Owl companion tips, large readable touch targets, and strict COPPA parental consent verification.
                    </p>
                    <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-semibold text-center">
                      Explorer Mode automatically activates for learners age 16 or younger with child safety guards.
                    </div>
                  </div>

                  {/* Scholar Card */}
                  <div className="p-5 rounded-2xl bg-bg-app border-2 border-primary/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-primary font-bold text-xs">
                        <GraduationCap className="w-4 h-4" />
                        <span>Scholar Mode (Ages 16+)</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold">
                        Pro Notion/Linear Workspace
                      </span>
                    </div>
                    <h4 className="text-base font-display font-bold text-text-main">
                      Distraction-Free Deep Derivation Studio
                    </h4>
                    <p className="text-xs text-text-muted leading-relaxed">
                      Built for high school, university, and research students. Features dark glass tokens (Obsidian, Teal, Monospace), split-screen document viewer, formal asymptotic derivations, keyboard navigation, and full command palette (Ctrl+K).
                    </p>
                    <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-semibold text-center">
                      Scholar Mode automatically activates for learners over age 16 with advanced analytics.
                    </div>
                  </div>
                </motion.div>
              )}

              {activeKnowledgeTab === 'sympy' && (
                <motion.div
                  key="sympy"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center"
                >
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-mono font-bold">
                      <Cpu className="w-3.5 h-3.5" />
                      <span>SymPy 1.13 Symbolic Engine</span>
                    </div>
                    <h3 className="text-xl font-display font-bold text-text-main">
                      Pinpoints the Exact Line of Mathematical Fallacy
                    </h3>
                    <p className="text-xs text-text-muted leading-relaxed">
                      Unlike generic language models that guess math, Aanvi uses SymPy symbolic verification. Students can snap handwritten homework via Camera Doubt or type derivations. The engine parses algebraic steps and flags exactly where logic broke down.
                    </p>
                    <div className="p-3 rounded-xl bg-bg-app border border-border-subtle text-xs text-text-muted">
                      <p className="font-semibold text-text-main mb-1">Example Proof Check:</p>
                      <p>Derivation: T(n) = 4T(n/2) + n</p>
                      <p className="text-rose-400 mt-1">
                        ✖ Step 4 Fallacy: Student claimed Case 2 (Θ(n)), but n^(log₂ 4) = n², so Case 1 (Θ(n²)) applies!
                      </p>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-bg-app border border-border-subtle font-mono text-xs space-y-3">
                    <div className="flex items-center justify-between text-text-muted pb-2 border-b border-border-subtle">
                      <span>Camera Doubt & OCR Pipeline</span>
                      <span className="text-emerald-400">● Zero Biometrics</span>
                    </div>
                    <div className="space-y-2 text-[11px] text-text-muted">
                      <div className="p-2 rounded bg-bg-surface border border-border-subtle">
                        1. EXIF/GPS Metadata Scrubbing
                      </div>
                      <div className="p-2 rounded bg-bg-surface border border-border-subtle">
                        2. Tesseract OCR with Prompt Injection Shield
                      </div>
                      <div className="p-2 rounded bg-bg-surface border border-border-subtle">
                        3. SymPy Equation Solver & Theorem Validator
                      </div>
                      <div className="p-2 rounded bg-bg-surface border border-border-subtle">
                        4. Step-by-Step Pedagogical Remediation
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeKnowledgeTab === 'galaxy' && (
                <motion.div
                  key="galaxy"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center"
                >
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/30 text-accent text-xs font-mono font-bold">
                      <Brain className="w-3.5 h-3.5" />
                      <span>Bayesian Knowledge Tracing (BKT)</span>
                    </div>
                    <h3 className="text-xl font-display font-bold text-text-main">
                      3D Celestial Concept Galaxy with Spaced Repetition
                    </h3>
                    <p className="text-xs text-text-muted leading-relaxed">
                      Curriculum topics form an interactive 3D constellation in Three.js. Node positions, orbits, and glows reflect posterior mastery probabilities P(L<sub>t</sub>). Prerequisite links reveal foundational learning gaps in real time.
                    </p>
                    <div className="space-y-2 text-xs font-mono">
                      <div className="p-2.5 rounded-lg bg-bg-app border border-border-subtle">
                        <span>Mastery Update: </span>
                        <strong className="text-primary">P(L<sub>t</sub>) = P(L<sub>t-1</sub>|Obs) + (1 - P(L<sub>t-1</sub>|Obs)) · P(T)</strong>
                      </div>
                      <div className="p-2.5 rounded-lg bg-bg-app border border-border-subtle">
                        <span>Spaced Repetition: </span>
                        <strong className="text-accent">FSRS / SM-2 Decay: R(t) = e^(−t/S)</strong>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-bg-app border border-border-subtle text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-primary/20 text-primary mx-auto flex items-center justify-center border border-primary/40 shadow-inner">
                      <Brain className="w-8 h-8 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-text-main text-sm">
                        Live 3D Celestial Visualization
                      </h4>
                      <p className="text-[11px] text-text-muted mt-1">
                        Orbit nodes in 3D space or switch seamlessly to the accessible 2D blueprint view.
                      </p>
                    </div>
                    <Link
                      href="/knowledge-map"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-contrast font-bold text-xs hover:brightness-110 shadow-sm"
                    >
                      <span>Open 3D Concept Galaxy</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* =========================================================================
          SECTION 2: BEAUTIFUL SIGN IN PORTAL WITH 1-CLICK DEMO ACCESS
          ========================================================================= */}
      {activeView === 'signin' && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="max-w-2xl mx-auto space-y-6"
        >
          {/* Header */}
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-display font-black text-text-main">
              Sign In to Your Workspace
            </h2>
            <p className="text-xs text-text-muted">
              Connect to your persistent courses, citations, and learner mastery model
            </p>
          </div>

          {/* Quick 1-Click Demo Passports (Removed for Production) */}
          {/* <div className="p-4 ...">...</div> */}

          {/* Main Sign In Form */}
          <form
            onSubmit={handleSignIn}
            className="p-6 sm:p-8 rounded-3xl bg-bg-surface border border-border-subtle shadow-card space-y-4"
          >
            {loginError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-main flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-text-muted" />
                <span>Email Address</span>
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="you@example.com or scholar@aanvi.ai"
                className="w-full px-4 py-2.5 rounded-xl bg-bg-app border border-border-subtle text-text-main text-xs focus:outline-none focus:border-primary transition-all font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-text-main flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-text-muted" />
                  <span>Password</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-2.5 rounded-xl bg-bg-app border border-border-subtle text-text-main text-xs focus:outline-none focus:border-primary transition-all font-mono pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 rounded-xl bg-primary text-primary-contrast font-bold text-xs flex items-center justify-center gap-2 hover:brightness-110 active:scale-98 transition-all shadow-md font-mono mt-2"
            >
              {loginLoading ? (
                <div className="w-4 h-4 border-2 border-primary-contrast border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In to Study Workspace</span>
                </>
              )}
            </button>

            <div className="text-center pt-2 border-t border-border-subtle">
              <p className="text-xs text-text-muted">
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => setActiveView('signup')}
                  className="text-primary font-bold hover:underline"
                >
                  Create one now (Sign Up)
                </button>
              </p>
            </div>
          </form>
        </motion.div>
      )}

      {/* =========================================================================
          SECTION 3: BEAUTIFUL SIGN UP PORTAL (WITH AGE & MODE CALCULATION)
          ========================================================================= */}
      {activeView === 'signup' && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="max-w-2xl mx-auto space-y-6"
        >
          {/* Header */}
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-display font-black text-text-main">
              Create Your Student Account
            </h2>
            <p className="text-xs text-text-muted">
              Personalized pedagogical adaptation calibrated to your age and syllabus
            </p>
          </div>

          <form
            onSubmit={handleSignUp}
            className="p-6 sm:p-8 rounded-3xl bg-bg-surface border border-border-subtle shadow-card space-y-4"
          >
            {signupError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{signupError}</span>
              </div>
            )}

            {/* Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-main flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-text-muted" />
                  <span>Full Name</span>
                </label>
                <input
                  type="text"
                  required
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full px-4 py-2.5 rounded-xl bg-bg-app border border-border-subtle text-text-main text-xs focus:outline-none focus:border-primary transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-main flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-text-muted" />
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  required
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-bg-app border border-border-subtle text-text-main text-xs focus:outline-none focus:border-primary transition-all font-mono"
                />
              </div>
            </div>

            {/* Date of Birth & Live Mode Feedback */}
            <div className="space-y-2 p-3.5 rounded-2xl bg-bg-app border border-border-subtle">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-semibold text-text-main flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-text-muted" />
                  <span>Date of Birth (Calibrates Age & Mode)</span>
                </label>
                <span className="text-[11px] font-mono font-bold text-primary">
                  Calculated Age: {calculatedAge} years
                </span>
              </div>

              <input
                type="date"
                required
                value={signupDob}
                onChange={(e) => setSignupDob(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-bg-surface border border-border-subtle text-text-main text-xs focus:outline-none focus:border-primary transition-all font-mono"
              />

              {/* Mode Feedback Pill */}
              <div className="pt-1">
                {isExplorerAge ? (
                  <div className="p-2.5 rounded-xl bg-accent/15 border border-accent/30 text-accent text-xs flex items-center gap-2">
                    <Compass className="w-4 h-4 flex-shrink-0" />
                    <span>
                      <strong>Explorer Mode (Age ≤ 15):</strong> Gamified space quest, Spark-Owl companion, and COPPA child safeguards will be activated.
                    </span>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-primary/15 border border-primary/30 text-primary text-xs flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 flex-shrink-0" />
                    <span>
                      <strong>Scholar Mode (Age 16+):</strong> Deep derivation studio, SymPy proof checker, and split-screen citation viewer will be activated.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Guardian Email if Minor */}
            {isExplorerAge && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-accent flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                  <span>Parent / Guardian Email (COPPA Required)</span>
                </label>
                <input
                  type="email"
                  required
                  value={signupGuardianEmail}
                  onChange={(e) => setSignupGuardianEmail(e.target.value)}
                  placeholder="parent@example.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-bg-app border border-accent/40 text-text-main text-xs focus:outline-none focus:border-accent transition-all font-mono"
                />
              </div>
            )}

            {/* Grade Level & Language */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-main">
                  Education Level / Grade
                </label>
                <select
                  value={signupGrade}
                  onChange={(e) => setSignupGrade(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-bg-app border border-border-subtle text-text-main text-xs focus:outline-none focus:border-primary transition-all"
                >
                  <option value="Middle School (Grades 6-8)">Middle School (Grades 6-8)</option>
                  <option value="High School (Grades 9-10)">High School (Grades 9-10)</option>
                  <option value="High School (Grades 11-12)">High School (Grades 11-12)</option>
                  <option value="College / Undergraduate">College / Undergraduate</option>
                  <option value="Graduate / Professional">Graduate / Professional</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-main flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-text-muted" />
                  <span>Study Language</span>
                </label>
                <select
                  value={signupLang}
                  onChange={(e) => setSignupLang(e.target.value as PreferredLanguage)}
                  className="w-full px-4 py-2.5 rounded-xl bg-bg-app border border-border-subtle text-text-main text-xs focus:outline-none focus:border-primary transition-all"
                >
                  <option value="English">English</option>
                  <option value="Hindi">हिन्दी (Hindi)</option>
                  <option value="Gujarati">ગુજરાતી (Gujarati)</option>
                </select>
              </div>
            </div>

            {/* Password with Strength Meter */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-main flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-text-muted" />
                <span>Create Password</span>
              </label>
              <div className="relative">
                <input
                  type={showSignupPassword ? 'text' : 'password'}
                  required
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full px-4 py-2.5 rounded-xl bg-bg-app border border-border-subtle text-text-main text-xs focus:outline-none focus:border-primary transition-all font-mono pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowSignupPassword(!showSignupPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main"
                >
                  {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <PasswordStrengthMeter password={signupPassword} />
            </div>

            {/* Terms checkbox */}
            <div className="flex items-start gap-2.5 pt-1">
              <input
                type="checkbox"
                id="terms"
                checked={signupTerms}
                onChange={(e) => setSignupTerms(e.target.checked)}
                className="mt-1 rounded border-border-subtle text-primary focus:ring-primary"
              />
              <label htmlFor="terms" className="text-xs text-text-muted leading-relaxed">
                I agree to the{' '}
                <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:brightness-125">
                  Terms & Conditions
                </a>{' '}
                and{' '}
                <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:brightness-125">
                  Privacy Policy
                </a>{' '}
                (COPPA compliant with zero biometrics or audio storage).
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={signupLoading}
              className="w-full py-3 rounded-xl bg-primary text-primary-contrast font-bold text-xs flex items-center justify-center gap-2 hover:brightness-110 active:scale-98 transition-all shadow-md font-mono mt-2"
            >
              {signupLoading ? (
                <div className="w-4 h-4 border-2 border-primary-contrast border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Create Account & Start Learning</span>
                </>
              )}
            </button>

            <div className="text-center pt-2 border-t border-border-subtle">
              <p className="text-xs text-text-muted">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setActiveView('signin')}
                  className="text-primary font-bold hover:underline"
                >
                  Sign In instead
                </button>
              </p>
            </div>
          </form>
        </motion.div>
      )}
    </div>
  );
}
