'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Play, RotateCcw, ArrowRight, Volume2, LayoutDashboard, Sparkles } from 'lucide-react';
import SplashScreen from '@/components/brand/SplashScreen';
import AanviLogo from '@/components/brand/AanviLogo';
import { useThemeStore } from '@/stores/useThemeStore';

export default function IntroPage() {
  const { sound, toggleSound, replayIntro } = useThemeStore();
  const [isPlaying, setIsPlaying] = useState(true);

  const handleStartIntro = () => {
    setIsPlaying(false);
    setTimeout(() => {
      replayIntro();
      setIsPlaying(true);
    }, 50);
  };

  return (
    <div className="relative min-h-screen bg-[var(--bg-app,#05040a)] text-[var(--text-main,#ffffff)] flex flex-col items-center justify-center p-6 select-none overflow-hidden">
      {/* Cinematic 3D Splash Screen */}
      {isPlaying && (
        <SplashScreen
          forcePlay={true}
          onComplete={() => setIsPlaying(false)}
        />
      )}

      {/* Ambient Backdrop */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(14,159,110,0.15),transparent_70%)] pointer-events-none" />

      {/* Replay & Showcase Hub Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 max-w-lg w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-3xl p-8 shadow-2xl backdrop-blur-2xl text-center space-y-6"
      >
        <div className="flex justify-center">
          <AanviLogo variant="full" size="lg" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/25 text-[var(--primary)] text-xs font-mono font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Interactive 3D Experience</span>
          </div>
          <h1 className="text-3xl font-black font-display text-[var(--text-main)]">
            Aanvi Brand Intro
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
            10-Second Cinematic Multimodal Particle Portal, Constellation Geometry, Audio Synthesis, and Door Opening.
          </p>
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={handleStartIntro}
            className="w-full py-3 px-4 rounded-2xl bg-[var(--primary)] hover:opacity-90 text-[var(--primary-contrast,#ffffff)] font-bold font-mono text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Play 3D Intro</span>
          </button>

          <button
            type="button"
            onClick={() => toggleSound()}
            className="w-full py-3 px-4 rounded-2xl bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-surface)] text-[var(--text-main)] border border-[var(--border-subtle)] font-semibold font-mono text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <Volume2 className={`w-4 h-4 ${sound ? 'text-amber-400' : 'text-[var(--text-muted)]'}`} />
            <span>Sound: {sound ? 'On' : 'Muted'}</span>
          </button>
        </div>

        {/* Navigation Quick Links */}
        <div className="flex items-center justify-center gap-4 pt-4 border-t border-[var(--border-subtle)] text-xs text-[var(--text-muted)] font-mono">
          <Link
            href="/dashboard"
            className="hover:text-[var(--primary)] flex items-center gap-1 transition-colors"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>
          <span>•</span>
          <Link
            href="/login"
            className="hover:text-[var(--primary)] flex items-center gap-1 transition-colors"
          >
            <span>Sign In</span>
          </Link>
          <span>•</span>
          <Link
            href="/"
            className="hover:text-[var(--primary)] flex items-center gap-1 transition-colors"
          >
            <span>Home</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
