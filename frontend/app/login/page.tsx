'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Clock,
  KeyRound,
  ShieldAlert
} from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import AanviLogo from '@/components/brand/AanviLogo';
import { API_BASE } from '@/lib/api';
import Theme3DButton from '@/components/ui/Theme3DButton';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const visualFlavor: 'scholar' = 'scholar';
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLockedOut, setIsLockedOut] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLockedOut(false);
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 423) {
          setIsLockedOut(true);
          throw new Error(data.detail || 'Account temporarily locked due to 5 failed attempts.');
        }
        throw new Error(data.detail || 'Invalid email or password.');
      }

      const authData = await res.json();
      setAuth(authData.user, authData.access_token);

      // Check user enrolled courses to determine routing
      try {
        const enrolledRes = await fetch(
          `${API_BASE}/courses/enrolled?user_id=${encodeURIComponent(authData.user.id)}`
        );
        if (enrolledRes.ok) {
          const enrolledData = await enrolledRes.json();
          if (Array.isArray(enrolledData) && enrolledData.length > 0) {
            localStorage.setItem('aanvi_active_course_id', enrolledData[0].id);
            router.push('/dashboard');
            return;
          }
        }
      } catch (e) {
        console.warn('Enrolled courses check fallback:', e);
      }

      // If 0 enrolled courses, route to /courses to add first course
      router.push('/courses');
    } catch (err: any) {
      console.error('Backend login failed:', err);
      const message = err instanceof TypeError
        ? 'Unable to connect to the study server. Please check your connection and try again.'
        : (err.message || 'Sign in failed. Please check your email and password.');
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      data-mode={visualFlavor}
      className="min-h-screen bg-bg-app text-text-main flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300"
    >
      {/* Top Floating Controls */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <Theme3DButton />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10 px-4 sm:px-0">
        <Link href="/" className="inline-block mb-3">
          <AanviLogo variant="full" size={48} />
        </Link>
        <h2 className="text-2xl sm:text-3xl font-display font-black text-text-main">
          Sign In to Aanvi
        </h2>
        <p className="mt-1 text-xs text-text-muted">
          Source-Grounded AI Study Companion • PostgreSQL Verified
        </p>

        {/* Visual Flavor Switcher (Removed for production - users auto-mode by age) */}
        {/* <div className="mt-4 flex items-center justify-center gap-2">...</div> */}
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-bg-surface border border-border-subtle py-8 px-6 sm:px-10 shadow-card rounded-card space-y-6">
          {/* Prominent Friendly Lockout Alert Banner */}
          {isLockedOut && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-card bg-amber-500/10 border-2 border-amber-500/40 text-amber-600 dark:text-amber-300 space-y-2 text-xs"
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0" />
                <span>Account Temporarily Protected</span>
              </div>
              <p className="leading-relaxed">
                For security, this account is locked after 5 consecutive incorrect password attempts. Please wait 15 minutes before trying again.
              </p>
              <div className="pt-1">
                <Link
                  href={`/forgot-password?email=${encodeURIComponent(email)}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-200 underline"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Reset password immediately</span>
                </Link>
              </div>
            </motion.div>
          )}

          {/* Standard Error Notice */}
          {!isLockedOut && errorMsg && (
            <div className="p-3.5 rounded-card bg-danger/10 border border-danger/30 text-danger text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
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
                placeholder="student@aanvi.ai"
                className="w-full bg-bg-elevated border border-border-subtle rounded-btn px-4 py-3 text-sm text-text-main placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Password with Show Password Toggle */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-text-main flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-primary" />
                  <span>Password</span>
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-text-muted hover:text-text-main flex items-center gap-1 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showPassword ? 'Hide' : 'Show'}</span>
                  </button>
                  <Link
                    href="/forgot-password"
                    className="text-[11px] font-semibold text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-bg-elevated border border-border-subtle rounded-btn px-4 py-3 text-sm text-text-main placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-btn bg-primary hover:opacity-95 text-white font-bold text-sm shadow-btn flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Signing In...</span>
                ) : (
                  <>
                    <span>Enter Companion</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Switch to Sign Up */}
          <div className="text-center pt-2">
            <p className="text-xs text-text-muted">
              Don&apos;t have an account yet?{' '}
              <Link href="/signup" className="font-semibold text-primary hover:underline">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
