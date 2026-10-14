'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  MessageCircle,
  Star,
  Sparkles,
  Rocket,
  Camera,
  Volume2,
  VolumeX,
  Settings,
  ShieldCheck,
  Flame,
  Award,
  Layers,
  LogOut,
  ChevronDown,
  User,
  GraduationCap
} from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useThemeStore } from '@/stores/useThemeStore';
import AanviLogo from '@/components/brand/AanviLogo';
import SparkOwlMascot from '@/components/mascot/SparkOwlMascot';
import Theme3DButton from '@/components/ui/Theme3DButton';
import CourseSwitcher from '@/components/layout/CourseSwitcher';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';

interface ExplorerShellProps {
  children: React.ReactNode;
}

export default function ExplorerShell({ children }: ExplorerShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, setMode, logout } = useAuthStore();
  const { soundEffects, toggleSoundEffects } = useThemeStore();
  const [mounted, setMounted] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const handleSignOut = () => {
    logout();
    router.push('/login');
  };

  useEffect(() => {
    setMounted(true);
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { label: 'Adventure Map', href: '/dashboard', icon: Compass },
    { label: 'Spark Tutor', href: '/tutor', icon: MessageCircle },
    { label: 'Star Quiz', href: '/assessment', icon: Star },
    { label: 'My Courses', href: '/courses', icon: GraduationCap },
    { label: 'Space Galaxy', href: '/knowledge-map', icon: Rocket },
    { label: 'Camera Doubt', href: '/camera-doubt', icon: Camera },
    { label: 'Flashcards', href: '/flashcards', icon: Layers },
    { label: 'Parent Zone', href: '/parent-zone', icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] transition-colors duration-300 flex flex-col font-sans select-none">
      {/* Unified Playful Top Exploration Header */}
      <header className="sticky top-0 z-50 bg-[var(--bg-surface)] border-b-2 border-[var(--border-subtle)] shadow-md">
        {/* Row 1: Brand Logo, Course Switcher, Language Switcher, Stats & Profile */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex items-center justify-between gap-2 sm:gap-3">
          {/* Logo & Course Switcher */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link href="/dashboard" className="flex items-center gap-1.5 group shrink-0">
              <AanviLogo size="sm" />
            </Link>

            {/* Course Switcher Dropdown */}
            <CourseSwitcher />
          </div>

          {/* Center Stats (Hidden on small mobile to prevent overflow) */}
          <div className="hidden lg:flex items-center gap-2.5 shrink-0">
            {/* Stars Bank */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-2xl bg-[#FFB800]/15 border-2 border-[#FFB800] text-[#FFB800] font-bold text-xs shadow-sm"
            >
              <Star className="w-3.5 h-3.5 fill-[#FFB800] text-[#FFB800]" />
              <span>{user?.stars || 48} Stars</span>
            </motion.div>

            {/* Level & XP */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-2xl bg-[#7B4BFF]/15 border-2 border-[#7B4BFF] text-[#7B4BFF] text-xs font-bold">
              <Award className="w-3.5 h-3.5" />
              <span>Level {user?.level || 4}</span>
            </div>

            {/* Streak */}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-2xl bg-[#FF6B57]/15 border-2 border-[#FF6B57] text-[#FF6B57] font-bold text-xs">
              <Flame className="w-3.5 h-3.5 fill-[#FF6B57]" />
              <span>{user?.streak_days || 5}d</span>
            </div>
          </div>

          {/* Right Controls: Language, 3D Theme, Sound, Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Native Language Switcher */}
            <LanguageSwitcher />

            {/* 3D Color-Change Push Button */}
            <Theme3DButton />

            {/* Sound Toggle (Always visible) */}
            <button
              type="button"
              onClick={toggleSoundEffects}
              title={soundEffects ? 'Audio is ON (Click to Mute)' : 'Audio is MUTED (Click to UNMUTE)'}
              className="p-1.5 rounded-2xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all shadow-sm"
            >
              {mounted && !soundEffects ? (
                <VolumeX className="w-4 h-4 text-[var(--text-muted)]" />
              ) : (
                <Volume2 className="w-4 h-4 text-[#FFB800]" />
              )}
            </button>

            {/* Explorer Profile Dropdown Menu */}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1 rounded-2xl bg-[#FF6B57]/10 hover:bg-[#FF6B57]/20 border border-[#FF6B57]/30 text-text-main transition-all"
                title="Profile & Parent Zone"
              >
                <div className="w-6 h-6 rounded-full bg-[#FF6B57] text-white flex items-center justify-center font-bold text-xs">
                  {user?.name ? user.name[0] : 'E'}
                </div>
                <span className="hidden sm:inline text-xs font-bold text-[#FF6B57] truncate max-w-[90px]">
                  {user?.name || 'Explorer'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute right-0 mt-2 w-60 rounded-card bg-bg-surface border border-border-subtle shadow-2xl py-2 z-50 text-xs"
                  >
                    <div className="px-4 py-2 border-b border-border-subtle space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-text-main text-sm truncate">
                          {user?.name || 'Explorer Student'}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FF6B57]/15 text-[#FF6B57] font-bold">
                          {user?.grade || 'Grade 8'}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-muted font-mono truncate">{user?.email}</p>
                      <div className="pt-1 flex items-center gap-2 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                        <span>COPPA Safe Mode Active</span>
                      </div>
                    </div>

                    <div className="py-1">
                      {/* Parent Zone Shortcut */}
                      <Link
                        href="/parent-zone"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-text-main hover:bg-[#FF6B57]/10 hover:text-[#FF6B57] transition-colors font-bold"
                      >
                        <ShieldCheck className="w-4 h-4 text-[#FF6B57]" />
                        <span>Parent Zone & Consent</span>
                      </Link>

                      {/* Age-Gated Mode Switcher */}
                      {(!user || user.age > 16) ? (
                        <button
                          type="button"
                          onClick={() => {
                            setProfileOpen(false);
                            setMode('scholar');
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-text-muted hover:text-text-main hover:bg-bg-elevated transition-colors text-left"
                        >
                          <Sparkles className="w-4 h-4 text-primary" />
                          <span>Switch to Scholar UI (16+)</span>
                        </button>
                      ) : (
                        <div className="px-4 py-2 text-[11px] text-text-muted flex items-center gap-1.5 opacity-70">
                          <span>🔒 Explorer Mode Locked (Age ≤ 16)</span>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-border-subtle pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setProfileOpen(false);
                          handleSignOut();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-danger hover:bg-danger/10 transition-colors text-left font-semibold"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Log out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Row 2: Smooth Horizontal Scrolling Navigation Dock */}
        <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]/50">
          <nav className="max-w-7xl mx-auto px-2 sm:px-6 py-1.5 flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar scroll-smooth">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 whitespace-nowrap select-none ${
                    isActive
                      ? 'bg-gradient-to-r from-[#FF6B57] to-[#7B4BFF] text-white shadow-md border-2 border-white/60 font-black'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] border-2 border-transparent'
                  }`}
                >
                  <Icon className="w-3.5 sm:w-4 h-3.5 sm:h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 pb-20 sm:pb-24">
        {children}
      </main>

      {/* Floating Aanvi Mascot Helper (Bottom Right) */}
      <div className="fixed bottom-4 right-4 z-40 pointer-events-auto">
        <SparkOwlMascot
          mood="happy"
          speechText="You're doing great! Click any island on your map to explore next! ✨"
          size="md"
        />
      </div>
    </div>
  );
}
