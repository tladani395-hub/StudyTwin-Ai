'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, Flame, BookOpen, GraduationCap, Gamepad2, User, LogOut } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import AanviLogo from '@/components/brand/AanviLogo';
import Theme3DButton from '@/components/ui/Theme3DButton';
import SoundToggleButton from '@/components/ui/SoundToggleButton';

export const Navbar: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const { user, mode, setMode } = useAuthStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isExplorer = mounted && mode === 'explorer';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border-subtle bg-bg-surface/90 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 sm:px-8 max-w-7xl mx-auto">
        {/* Brand */}
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-3 group">
            <AanviLogo size="sm" />
          </Link>

          {/* Quick Badges */}
          <div className="hidden lg:flex items-center space-x-2 pl-4 border-l border-border-subtle">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/30 text-xs font-semibold flex items-center gap-1.5 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span>Track D: Adaptive AI</span>
            </span>
          </div>
        </div>

        {/* Right side stats & Mode Switcher */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Always Available Audio Unmute Toggle */}
          <SoundToggleButton />

          {/* 3D Color Push Button */}
          <Theme3DButton />

          {/* Mode Pill (Strictly Age-Locked when student is authenticated) */}
          {user?.age !== undefined ? (
            <div
              className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full border border-border-subtle bg-bg-elevated text-text-main text-xs font-bold shadow-sm"
              title={`Mode strictly locked based on verified student age (${user.age} yrs)`}
            >
              {user.age <= 16 ? (
                <>
                  <Gamepad2 className="w-3.5 h-3.5 text-accent" />
                  <span>Explorer (Age ≤ 16)</span>
                  <span className="text-[10px] text-accent/80 font-mono">🔒 Locked</span>
                </>
              ) : (
                <>
                  <GraduationCap className="w-3.5 h-3.5 text-primary" />
                  <span>Scholar (Age &gt; 16)</span>
                  <span className="text-[10px] text-primary/80 font-mono">🔒 Locked</span>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={() => setMode(isExplorer ? 'scholar' : 'explorer')}
              className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full border border-border-subtle bg-bg-elevated text-text-main text-xs font-bold transition-all shadow-sm hover:border-primary"
              title="Toggle between Explorer (Age <= 16) and Scholar (Age > 16) mode"
            >
              {isExplorer ? <Gamepad2 className="w-3.5 h-3.5 text-accent" /> : <GraduationCap className="w-3.5 h-3.5 text-primary" />}
              <span>{isExplorer ? '🎮 Explorer (Age ≤ 16)' : '🚀 Scholar (Age > 16)'}</span>
              <span className="text-[10px] text-text-muted underline ml-0.5 font-mono">Switch</span>
            </button>
          )}

          {/* Streak indicator */}
          <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-bg-elevated border border-border-subtle text-text-main text-xs font-semibold">
            <Flame className="w-3.5 h-3.5 fill-accent text-accent" />
            <span>{user?.streak_days || 5}d Streak</span>
          </div>

          {/* User Profile */}
          {user ? (
            <div className="flex items-center space-x-2.5 pl-2">
              <Link href="/dashboard" className="hidden md:flex flex-col text-right">
                <span className="text-xs font-semibold text-text-main">{user.name}</span>
                <span className="text-[10px] font-mono text-primary">
                  {isExplorer ? `Level ${user.level} Adventurer` : 'Mastery: 74%'}
                </span>
              </Link>
              <Link
                href="/dashboard"
                className="w-9 h-9 rounded-full bg-primary text-primary-contrast flex items-center justify-center text-xs font-bold shadow-sm font-mono"
              >
                {user.name ? user.name[0] : 'S'}
              </Link>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-4 py-1.5 rounded-btn bg-primary hover:bg-primary-hover text-primary-contrast font-bold text-xs shadow-sm"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

