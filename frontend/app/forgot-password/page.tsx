'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Mail,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  KeyRound,
  ShieldCheck
} from 'lucide-react';
import AanviLogo from '@/components/brand/AanviLogo';
import Theme3DButton from '@/components/ui/Theme3DButton';
import { API_BASE } from '@/lib/api';
import PasswordStrengthMeter from '@/components/auth/PasswordStrengthMeter';

function ForgotPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tokenParam = searchParams.get('token') || '';
  const emailParam = searchParams.get('email') || '';

  const [email, setEmail] = useState(emailParam);
  const [token, setToken] = useState(tokenParam);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isResetSuccess, setIsResetSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (tokenParam) {
      setToken(tokenParam);
    }
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [tokenParam, emailParam]);

  // Handle forgot password request (email entry)
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      // Backend always returns 200 with generic anti-probing response
      setIsSubmitted(true);
    } catch (err: any) {
      // Still show positive response to prevent probing
      setIsSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle reset password request (token + new password)
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token.trim(),
          new_password: newPassword,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to reset password. The link may have expired.');
      }

      setIsResetSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  const isResetMode = Boolean(token);

  return (
    <div className="min-h-screen bg-bg-app text-text-main flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans relative">
      <div className="absolute top-6 right-6 z-20">
        <Theme3DButton />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <div className="flex justify-center mb-2">
          <AanviLogo size="lg" />
        </div>
        <h1 className="text-2xl font-display font-black text-text-main">
          {isResetMode ? 'Choose a New Password' : 'Reset Your Password'}
        </h1>
        <p className="text-xs text-text-muted">
          {isResetMode
            ? 'Enter your single-use reset token and choose a strong new password.'
            : 'Enter your registered email address to receive a secure 30-minute recovery link.'}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="p-8 rounded-card bg-bg-surface border border-border-subtle shadow-card space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-card bg-danger/10 border border-danger/30 text-danger text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Reset Password Success */}
          {isResetSuccess ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-text-main">Password Updated!</h3>
              <p className="text-xs text-text-muted leading-relaxed">
                Your password has been securely changed. For safety, all other active browser sessions and devices have been logged out.
              </p>
              <div className="pt-2">
                <Link
                  href="/login"
                  className="w-full inline-flex items-center justify-center py-3 rounded-btn bg-primary hover:opacity-95 text-white font-bold text-xs shadow-btn transition-all"
                >
                  <span>Sign In with New Password</span>
                </Link>
              </div>
            </div>
          ) : isResetMode ? (
            /* 2. Reset Password Form (Token present) */
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-muted">Reset Token</label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-3.5 w-4 h-4 text-text-muted" />
                  <input
                    type="text"
                    required
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Enter reset token"
                    className="w-full bg-bg-elevated border border-border-subtle rounded-btn pl-10 pr-4 py-2.5 text-xs text-text-main focus:outline-none focus:border-primary font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-text-muted">New Password</label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-text-muted hover:text-text-main flex items-center gap-1"
                  >
                    {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showPassword ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-text-muted" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full bg-bg-elevated border border-border-subtle rounded-btn pl-10 pr-4 py-2.5 text-xs text-text-main focus:outline-none focus:border-primary"
                  />
                </div>
                <PasswordStrengthMeter password={newPassword} />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-muted">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-text-muted" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full bg-bg-elevated border border-border-subtle rounded-btn pl-10 pr-4 py-2.5 text-xs text-text-main focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-btn bg-primary hover:opacity-95 text-white font-bold text-xs shadow-btn transition-all disabled:opacity-50"
              >
                {isLoading ? 'Updating Password...' : 'Save New Password & Sign In'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setToken('')}
                  className="text-xs text-text-muted hover:text-text-main flex items-center justify-center gap-1 mx-auto"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Request a different reset email</span>
                </button>
              </div>
            </form>
          ) : isSubmitted ? (
            /* 3. Forgot Password Success (Anti-probing generic message) */
            <div className="text-center space-y-4 py-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-text-main">Check Your Inbox</h3>
              <p className="text-xs text-text-muted leading-relaxed">
                If an account exists for <strong>{email}</strong>, we have dispatched a single-use password recovery link valid for 30 minutes.
              </p>
              <div className="pt-2 flex flex-col gap-2">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-primary hover:underline"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Sign In</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setIsSubmitted(false)}
                  className="text-[11px] text-text-muted hover:underline"
                >
                  Didn&apos;t receive it? Try another address
                </button>
              </div>
            </div>
          ) : (
            /* 4. Request Reset Link Form */
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-muted">Student or Guardian Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-text-muted" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@aanvi.ai"
                    className="w-full bg-bg-elevated border border-border-subtle rounded-btn pl-10 pr-4 py-3 text-xs text-text-main focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-btn bg-primary hover:opacity-95 text-white font-bold text-xs shadow-btn transition-all disabled:opacity-50"
              >
                {isLoading ? 'Checking...' : 'Send Recovery Instructions'}
              </button>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="text-xs text-text-muted hover:text-text-main flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg-app flex items-center justify-center">Loading...</div>}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
