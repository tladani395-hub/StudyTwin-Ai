'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ShieldCheck,
  Calendar,
  Mail,
  Lock,
  User,
  GraduationCap,
  Languages,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuthStore, PreferredLanguage } from '@/stores/useAuthStore';
import AanviLogo from '@/components/brand/AanviLogo';
import { API_BASE } from '@/lib/api';
import Theme3DButton from '@/components/ui/Theme3DButton';
import PasswordStrengthMeter from '@/components/auth/PasswordStrengthMeter';

export default function SignUpPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [dob, setDob] = useState('');
  const [hasDobEntered, setHasDobEntered] = useState(false);
  const [age, setAge] = useState<number>(16);
  const [grade, setGrade] = useState('Grade 11');
  const [preferredLang, setPreferredLang] = useState<PreferredLanguage>('English');
  const [guardianEmail, setGuardianEmail] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Server-aligned age calculation whenever DOB changes
  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDob(val);
    if (!val) {
      setHasDobEntered(false);
      return;
    }
    setHasDobEntered(true);
    try {
      const birth = new Date(val);
      const now = new Date();
      let calculatedAge = now.getFullYear() - birth.getFullYear();
      const m = now.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
        calculatedAge--;
      }
      const safeAge = Math.max(5, Math.min(99, calculatedAge));
      setAge(safeAge);
      if (safeAge <= 15) {
        setGrade('School / Grade 8');
      } else {
        setGrade('College / Grade 11');
      }
    } catch {
      // fallback
    }
  };

  const isMinor = age <= 15;
  const inferredMode = !hasDobEntered ? 'neutral' : (isMinor ? 'explorer' : 'scholar');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim() || !email.trim() || !password || !dob) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    if (!termsAccepted) {
      setErrorMsg('Please review and accept the Terms of Service & Privacy Policy.');
      return;
    }

    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    if (isMinor && (!guardianEmail.trim() || !guardianEmail.includes('@'))) {
      setErrorMsg('Parent or Guardian email is strictly required for students aged 15 or younger.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          date_of_birth: dob,
          grade,
          language: preferredLang === 'Hindi' ? 'hi' : (preferredLang === 'Gujarati' ? 'gu' : 'en'),
          preferred_language: preferredLang,
          guardian_email: isMinor ? guardianEmail.trim() : null,
          terms_accepted: termsAccepted,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Sign up failed');
      }

      const authData = await res.json();
      setAuth(authData.user, authData.access_token);
      router.push('/courses');
    } catch (err: any) {
      console.error('Sign up failed:', err);
      const message = err instanceof TypeError
        ? 'Unable to reach the study server. Please check your internet connection.'
        : (err.message || 'Sign up failed. Please check your details and try again.');
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      data-mode={inferredMode}
      className="min-h-screen bg-bg-app text-text-main flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300"
    >
      {/* Top Floating Controls */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <Theme3DButton />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <Link href="/" className="inline-block mb-3">
          <AanviLogo variant="full" size={48} />
        </Link>
        <h2 className="text-2xl sm:text-3xl font-display font-black text-text-main">
          Create Your Study Account
        </h2>
        <p className="mt-1 text-xs text-text-muted">
          Source-grounded tutoring, verified assessments & adaptive learning.
        </p>

        {/* Dynamic Mode Badge */}
        {hasDobEntered && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm shadow-sm"
            style={{
              borderColor: isMinor ? 'rgba(124, 58, 237, 0.3)' : 'rgba(16, 185, 129, 0.3)',
              backgroundColor: isMinor ? 'rgba(124, 58, 237, 0.08)' : 'rgba(16, 185, 129, 0.08)',
              color: isMinor ? '#7C3AED' : '#10B981',
            }}
          >
            {isMinor ? (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Explorer Mode • Age {age} (Child Safety & Guardian Consent Active)</span>
              </>
            ) : (
              <>
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Scholar Mode • Age {age} (Independent Mastery Track)</span>
              </>
            )}
          </motion.div>
        )}
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl relative z-10 px-4 sm:px-0">
        <div className="bg-bg-surface border border-border-subtle py-8 px-6 sm:px-10 shadow-card rounded-card space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-card bg-danger/10 border border-danger/30 text-danger text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-text-main mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-primary" />
                <span>Full Name</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Sharma"
                className="w-full bg-bg-elevated border border-border-subtle rounded-btn px-4 py-3 text-sm text-text-main placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-text-main mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-primary" />
                <span>Email Address</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
                className="w-full bg-bg-elevated border border-border-subtle rounded-btn px-4 py-3 text-sm text-text-main placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Password with Show/Hide & Strength Meter */}
            <div>
              <label className="block text-xs font-semibold text-text-main mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-primary" />
                  <span>Password</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-text-muted hover:text-text-main flex items-center gap-1 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showPassword ? 'Hide' : 'Show'}</span>
                </button>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full bg-bg-elevated border border-border-subtle rounded-btn px-4 py-3 text-sm text-text-main placeholder-text-muted focus:outline-none focus:border-primary transition-colors pr-10"
                />
              </div>
              <PasswordStrengthMeter password={password} />
            </div>

            {/* Date of Birth & Grade Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-text-main mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-accent" />
                  <span>Date of Birth</span>
                </label>
                <input
                  type="date"
                  required
                  value={dob}
                  onChange={handleDobChange}
                  className="w-full bg-bg-elevated border border-border-subtle rounded-btn px-4 py-3 text-sm text-text-main focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-main mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-primary" />
                    <span>Grade / Cohort</span>
                  </span>
                  {hasDobEntered && (
                    <span className="text-[11px] font-mono text-primary">Age: {age}</span>
                  )}
                </label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full bg-bg-elevated border border-border-subtle rounded-btn px-4 py-3 text-sm text-text-main focus:outline-none focus:border-primary transition-colors"
                >
                  {isMinor ? (
                    <>
                      <option value="School / Grade 6">School / Grade 6</option>
                      <option value="School / Grade 7">School / Grade 7</option>
                      <option value="School / Grade 8">School / Grade 8</option>
                      <option value="School / Grade 9">School / Grade 9</option>
                      <option value="School / Grade 10">School / Grade 10</option>
                    </>
                  ) : (
                    <>
                      <option value="College / Grade 11">High School / Grade 11</option>
                      <option value="College / Grade 12">High School / Grade 12</option>
                      <option value="Undergraduate">University / Undergraduate</option>
                      <option value="Postgraduate">University / Postgraduate</option>
                      <option value="Lifelong Scholar">Lifelong Scholar</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* Guardian Email Gate for Minor (Age <= 15) */}
            <AnimatePresence>
              {hasDobEntered && isMinor && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 rounded-card bg-purple-500/10 border border-purple-500/20 space-y-2 overflow-hidden"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-300">
                    <ShieldCheck className="w-4 h-4 text-purple-500 shrink-0" />
                    <span>Parent or Guardian Email (Required for Students ≤ 15)</span>
                  </div>
                  <p className="text-[11px] text-text-muted leading-relaxed">
                    Aanvi strictly enforces COPPA child privacy. We will dispatch a digital consent link to your parent or guardian before unlocking AI tutor chat features.
                  </p>
                  <input
                    type="email"
                    required={isMinor}
                    value={guardianEmail}
                    onChange={(e) => setGuardianEmail(e.target.value)}
                    placeholder="parent.guardian@example.com"
                    className="w-full bg-bg-surface border border-purple-400/40 rounded-btn px-4 py-2.5 text-xs text-text-main focus:outline-none focus:border-purple-500"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Language Preference (English, Hindi, Gujarati) */}
            <div>
              <label className="block text-xs font-semibold text-text-main mb-1.5 flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5 text-secondary" />
                <span>Language / ભાષા / भाषा</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'English', label: 'English', sub: 'Default' },
                  { id: 'Hindi', label: 'हिन्दी', sub: 'Devanagari' },
                  { id: 'Gujarati', label: 'ગુજરાતી', sub: 'Gujarati' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPreferredLang(item.id as PreferredLanguage)}
                    className={`py-2 px-3 rounded-btn border text-center transition-all ${
                      preferredLang === item.id
                        ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                        : 'border-border-subtle bg-bg-elevated text-text-muted hover:border-text-muted'
                    }`}
                  >
                    <div className="text-xs">{item.label}</div>
                    <div className="text-[10px] opacity-70">{item.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Terms of Service & Privacy Checkbox */}
            <div className="pt-2 flex items-start gap-2.5">
              <input
                id="terms"
                type="checkbox"
                required
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-primary focus:ring-primary border-border-subtle cursor-pointer"
              />
              <label htmlFor="terms" className="text-xs text-text-muted cursor-pointer leading-tight">
                I agree to the{' '}
                <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
                  Privacy Policy
                </a>
                .
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-btn bg-primary hover:opacity-95 text-white font-bold text-sm shadow-btn flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Creating Account...</span>
                ) : (
                  <>
                    <span>Begin Learning</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Switch to Login */}
          <div className="text-center pt-2">
            <p className="text-xs text-text-muted">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
