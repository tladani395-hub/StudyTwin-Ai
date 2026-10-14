'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from 'lucide-react';

export default function GlobalPageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected client exceptions
    console.error('Unhandled page error:', error);
  }, [error]);

  const isNetworkError =
    error?.message?.toLowerCase().includes('fetch') ||
    error?.message?.toLowerCase().includes('network') ||
    error?.message?.toLowerCase().includes('connection');

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full p-8 rounded-3xl bg-bg-surface border border-border-subtle shadow-card text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-400 flex items-center justify-center mx-auto shadow-inner">
          {isNetworkError ? (
            <AlertTriangle className="w-8 h-8" />
          ) : (
            <ShieldAlert className="w-8 h-8" />
          )}
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-display font-black text-text-main">
            {isNetworkError ? 'Connection Issue' : 'Something Went Wrong'}
          </h2>
          <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
            {isNetworkError
              ? 'Unable to reach the study server. Please check your internet connection and try reloading.'
              : (error?.message || 'An unexpected error occurred while rendering this view.')}
          </p>
          {error?.digest && (
            <p className="text-[10px] font-mono text-text-muted/60">
              Error Ref: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 hover:opacity-90 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>

          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-bg-elevated border border-border-subtle hover:border-primary text-text-main font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <Home className="w-3.5 h-3.5 text-primary" />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
