'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [reconnected, setReconnected] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOffline = () => {
      setIsOffline(true);
      setReconnected(false);
    };

    const handleOnline = () => {
      setIsOffline(false);
      setReconnected(true);
      const timer = setTimeout(() => setReconnected(false), 4000);
      return () => clearTimeout(timer);
    };

    // Initial check
    if (!navigator.onLine) {
      setIsOffline(true);
    }

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const handleCheckConnection = async () => {
    setIsChecking(true);
    try {
      // Simple ping check
      const res = await fetch('/api/health', { method: 'HEAD', cache: 'no-store' }).catch(() => null);
      if (res || navigator.onLine) {
        setIsOffline(false);
        setReconnected(true);
        setTimeout(() => setReconnected(false), 4000);
      }
    } finally {
      setIsChecking(false);
    }
  };

  if (!isOffline && !reconnected) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-[9999] max-w-md w-[92%] sm:w-auto px-4 py-2.5 rounded-full border shadow-2xl backdrop-blur-xl flex items-center gap-3 transition-all duration-300 text-xs font-semibold ${
        isOffline
          ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
          : 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
      }`}
    >
      {isOffline ? (
        <>
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse flex-shrink-0" />
          <WifiOff className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span className="truncate">You are offline. Reconnecting to study servers...</span>
          <button
            type="button"
            onClick={handleCheckConnection}
            disabled={isChecking}
            className="ml-auto px-2.5 py-1 rounded-full bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-100 text-[11px] font-bold flex items-center gap-1 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin' : ''}`} />
            <span>Retry</span>
          </button>
        </>
      ) : (
        <>
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>Connection restored. Back online!</span>
        </>
      )}
    </div>
  );
}
