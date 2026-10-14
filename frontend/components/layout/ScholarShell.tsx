'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import SoundToggleButton from '@/components/ui/SoundToggleButton';
import {
  LayoutDashboard,
  MessageSquare,
  CheckCircle2,
  Network,
  Calendar,
  BookOpen,
  Upload,
  Camera,
  BarChart3,
  Settings,
  Search,
  Sparkles,
  ShieldCheck,
  Flame,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Layers,
  Award,
  LogOut,
  User,
  GraduationCap
} from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import AanviLogo from '@/components/brand/AanviLogo';
import CommandPalette from '@/components/layout/CommandPalette';
import Theme3DButton from '@/components/ui/Theme3DButton';
import CourseSwitcher from '@/components/layout/CourseSwitcher';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';

interface ScholarShellProps {
  children: React.ReactNode;
}

export default function ScholarShell({ children }: ScholarShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, setMode, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const handleSignOut = () => {
    logout();
    router.push('/login');
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Grounded Tutor', href: '/tutor', icon: MessageSquare },
    { label: 'Adaptive Quiz', href: '/assessment', icon: CheckCircle2 },
    { label: 'My Courses', href: '/courses', icon: BookOpen },
    { label: 'Course Galaxy', href: '/knowledge-map', icon: Network },
    { label: 'Spaced Schedule', href: '/study-plan', icon: Calendar },
    { label: 'Flashcards', href: '/flashcards', icon: Layers },
    { label: 'Camera Doubt', href: '/camera-doubt', icon: Camera },
    { label: 'Upload Materials', href: '/upload', icon: Upload },
    { label: 'RAGAS Evaluation', href: '/evaluation', icon: BarChart3 },
    { label: 'Achievements', href: '/achievements', icon: Award },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] flex flex-col md:flex-row antialiased font-sans transition-colors duration-300">
      {/* Command Palette Modal */}
      <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />

      {/* Desktop Sidebar Navigation (Hidden on mobile < 768px for clean responsive viewport) */}
      <aside
        className={`hidden md:flex sticky top-0 h-screen bg-[var(--bg-sidebar)] border-r border-[var(--border-subtle)] flex-col justify-between transition-all duration-300 z-40 shrink-0 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Top Header & Logo */}
        <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 overflow-hidden">
            <AanviLogo size="sm" showText={!collapsed} />
          </Link>
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Search / Command Palette Button */}
        <div className="p-3">
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className={`w-full py-2 px-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--primary)] text-xs flex items-center transition-all ${
              collapsed ? 'justify-center' : 'justify-between'
            }`}
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-[var(--primary)]" />
              {!collapsed && <span>Search commands...</span>}
            </div>
            {!collapsed && (
              <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-surface-elevated)] text-[10px] font-mono text-[var(--text-muted)]">
                ⌘K
              </kbd>
            )}
          </button>
        </div>

        {/* Nav Links */}
        <div className="flex-1 px-3 space-y-1 overflow-y-auto no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[var(--primary)] text-[var(--bg-app)] font-bold shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)]'
                } ${collapsed ? 'justify-center' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </div>

        {/* Bottom User & Mode Controls */}
        <div className="p-3 border-t border-[var(--border-subtle)] space-y-2">
          {!collapsed && (
            <div className="px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                <ShieldCheck className="w-3.5 h-3.5 text-[var(--primary)]" />
                <span>BKT Grounding Health</span>
              </div>
              <span className="font-mono font-bold text-[var(--primary)]">96.4%</span>
            </div>
          )}

          {/* Quick Explorer Switch (Only if not age-locked to Scholar) */}
          {(!user || user.age <= 16) ? (
            <button
              type="button"
              onClick={() => setMode('explorer')}
              className={`w-full py-2 px-3 rounded-xl bg-[#FF6B57]/10 hover:bg-[#FF6B57]/20 border border-[#FF6B57]/30 text-[#FF6B57] text-xs font-bold flex items-center gap-2 transition-all ${
                collapsed ? 'justify-center' : 'justify-between'
              }`}
              title="Switch to Explorer Mode"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" />
                {!collapsed && <span>Explorer Mode (Kids)</span>}
              </div>
              {!collapsed && <span className="text-[10px] font-mono">Switch ➔</span>}
            </button>
          ) : (
            !collapsed && (
              <div className="px-3 py-1.5 rounded-xl bg-bg-app border border-border-subtle text-[11px] text-text-muted flex items-center justify-between opacity-70">
                <span>Scholar Track</span>
                <span className="font-mono text-primary text-[10px]">🔒 Locked (&gt;16)</span>
              </div>
            )
          )}

          {/* User profile info & Sign Out */}
          <div className={`flex items-center justify-between pt-1 ${collapsed ? 'flex-col gap-2' : ''}`}>
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded-full bg-[var(--primary)] text-[var(--bg-app)] flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                {user?.name ? user.name[0] : 'S'}
              </div>
              {!collapsed && (
                <div className="flex flex-col text-left truncate">
                  <span className="text-xs font-bold text-[var(--text-main)] truncate">
                    {user?.name || 'Demo Scholar'}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] truncate font-mono">
                    {user?.grade || 'Grade 11 / Scholar'}
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              title="Sign Out"
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-danger hover:bg-danger/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main App Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Workspace Header (Desktop & Mobile) */}
        <header className="sticky top-0 z-30 bg-[var(--bg-surface)]/90 backdrop-blur-md border-b border-[var(--border-subtle)] px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2">
          {/* Left: Mobile Brand & Course Switcher */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="md:hidden shrink-0">
              <Link href="/dashboard">
                <AanviLogo size="sm" showText={false} />
              </Link>
            </div>
            <CourseSwitcher />
          </div>

          {/* Right Header Controls: Language, 3D Theme, Streak, Profile */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Native Language Switcher */}
            <LanguageSwitcher />

            {/* Always Available Audio Unmute Toggle */}
            <SoundToggleButton />

            {/* 3D Color-Change Push Button */}
            <Theme3DButton />

            {/* Streak Counter (Hidden on mobile) */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-main)]">
              <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>{user?.streak_days || 5}d Streak</span>
            </div>

            {/* Scholar Profile Menu */}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1 rounded-2xl bg-primary/10 hover:bg-primary/20 border border-primary/30 text-text-main transition-all"
                title="Scholar Profile"
              >
                <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs">
                  {user?.name ? user.name[0] : 'S'}
                </div>
                <span className="hidden sm:inline text-xs font-bold text-primary truncate max-w-[90px]">
                  {user?.name || 'Scholar'}
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
                          {user?.name || 'Alex Rivera'}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/15 text-primary font-bold">
                          {user?.grade || 'Grade 11'}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-muted font-mono truncate">{user?.email}</p>
                      <div className="pt-1 flex items-center gap-1.5 text-[10px] text-primary font-semibold">
                        <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                        <span>Scholar Mode (16+) Active</span>
                      </div>
                    </div>

                    <div className="py-1">
                      <Link
                        href="/settings"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-text-muted hover:text-text-main hover:bg-bg-elevated transition-colors"
                      >
                        <Settings className="w-3.5 h-3.5 text-primary" />
                        <span>Settings & Profile</span>
                      </Link>

                      {(!user || user.age <= 16) ? (
                        <button
                          type="button"
                          onClick={() => {
                            setProfileOpen(false);
                            setMode('explorer');
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-text-muted hover:text-text-main hover:bg-bg-elevated transition-colors text-left"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>Switch to Explorer Mode</span>
                        </button>
                      ) : (
                        <div className="px-4 py-2 text-[11px] text-text-muted flex items-center gap-1.5 opacity-70">
                          <span>🔒 Scholar Mode Locked (Age &gt; 16)</span>
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
        </header>

        {/* Mobile Horizontal Navigation Dock (Only visible < md) */}
        <div className="md:hidden border-b border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]/60">
          <nav className="px-2 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold shrink-0 whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-primary text-white font-bold shadow-sm'
                      : 'text-text-muted hover:text-text-main hover:bg-bg-surface'
                  }`}
                >
                  <Icon className="w-3 h-3 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Content View */}
        <main className="flex-1 p-3 sm:p-6 max-w-7xl w-full mx-auto pb-16">
          {children}
        </main>
      </div>
    </div>
  );
}
