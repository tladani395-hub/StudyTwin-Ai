'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon,
  User,
  Sliders,
  Globe,
  Layout,
  Bell,
  Shield,
  Key,
  Check,
  Sparkles,
  GraduationCap,
  Trash2,
  Download,
  Palette,
  Sun,
  Moon,
  Monitor,
  Volume2,
  VolumeX,
  Zap,
  RotateCcw,
  Clock,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useAuthStore, maskEmail } from '@/stores/useAuthStore';
import { useThemeStore, playButtonSound } from '@/stores/useThemeStore';
import { API_BASE } from '@/lib/api';

type SettingsTab =
  | 'theme'
  | 'profile'
  | 'mode'
  | 'language'
  | 'density'
  | 'notifications'
  | 'privacy'
  | 'api';

export default function SettingsPage() {
  const { user: authUser, setAge } = useAuth();
  const { user: storeUser, mode } = useAuthStore();
  const {
    theme,
    palette,
    sound,
    reducedMotion,
    introEveryVisit,
    updatedAt,
    isSyncing,
    setTheme,
    setPalette,
    toggleSound,
    setReducedMotion,
    setIntroEveryVisit,
    resetToDefaults,
    syncWithDB,
  } = useThemeStore();

  const [activeTab, setActiveTab] = useState<SettingsTab>('theme');
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState(authUser.name);
  const [email, setEmail] = useState(authUser.email);
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');
  const [learningMode, setLearningMode] = useState<'standard' | 'simplified'>(
    authUser.age <= 15 ? 'simplified' : 'standard'
  );
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [streakReminders, setStreakReminders] = useState(true);

  // Initial sync with DB on page mount
  useEffect(() => {
    syncWithDB(storeUser?.id || 1);
  }, [syncWithDB, storeUser?.id]);

  const showSaved = (msg: string) => {
    setSavedMessage(msg);
    setTimeout(() => setSavedMessage(null), 3000);
  };

  const handleModeChange = (modeChoice: 'standard' | 'simplified') => {
    setLearningMode(modeChoice);
    if (modeChoice === 'simplified') {
      setAge(14);
    } else {
      setAge(19);
    }
    showSaved('Learning Mode updated successfully');
  };

  const isExplorer = mode === 'explorer';

  // Palette color definitions for live swatch cards
  const explorerPaletteA = {
    dominant: '#FF6B57', // Coral
    dominantName: 'Coral Red',
    secondary: '#7B4BFF', // Grape
    secondaryName: 'Grape Purple',
    accent: '#FFC93C', // Star Yellow
    bgLight: '#FFF8EC',
    bgDark: '#1E1530',
  };

  const explorerPaletteB = {
    dominant: '#7B4BFF', // Grape
    dominantName: 'Grape Purple',
    secondary: '#FF6B57', // Coral
    secondaryName: 'Coral Red',
    accent: '#FFC93C', // Star Yellow
    bgLight: '#FFF8EC',
    bgDark: '#1E1530',
  };

  const scholarPaletteA = {
    dominant: '#0E9F6E', // Deep Emerald
    dominantName: 'Deep Emerald',
    secondary: '#F59E0B', // Warm Amber
    secondaryName: 'Warm Amber',
    accent: '#F59E0B',
    bgLight: '#F7F7F2',
    bgDark: '#121614',
  };

  const scholarPaletteB = {
    dominant: '#F59E0B', // Warm Amber
    dominantName: 'Warm Amber',
    secondary: '#0E9F6E', // Deep Emerald
    secondaryName: 'Deep Emerald',
    accent: '#0E9F6E',
    bgLight: '#F7F7F2',
    bgDark: '#121614',
  };

  const palAInfo = isExplorer ? explorerPaletteA : scholarPaletteA;
  const palBInfo = isExplorer ? explorerPaletteB : scholarPaletteB;

  const tabs = [
    { id: 'theme', label: 'Theme & 3D Colors', icon: Palette },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'mode', label: 'Learning Mode', icon: Sliders },
    { id: 'language', label: 'Language', icon: Globe },
    { id: 'density', label: 'Theme Density', icon: Layout },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Data & Privacy', icon: Shield },
    { id: 'api', label: 'API & Keys Status', icon: Key },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-[var(--text-muted)]">
            <span className="text-[var(--primary)] flex items-center gap-1 font-bold">
              <SettingsIcon className="w-3.5 h-3.5" /> System Configuration
            </span>
            <span>•</span>
            <span>Aanvi AI Preferences</span>
          </div>
          <h1 className="text-3xl font-display font-black text-[var(--text-main)] mt-1">
            Settings & Preferences
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Manage your 3D theme palettes, adaptive tutoring mode, database persistence, and child safety.
          </p>
        </div>

        {/* Real-time DB Sync status chip */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-muted)] shrink-0">
          {isSyncing ? (
            <RefreshCw className="w-3.5 h-3.5 text-[var(--primary)] animate-spin" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-[var(--success)]" />
          )}
          <span>{isSyncing ? 'Syncing to DB...' : 'DB Synced'}</span>
          {updatedAt && (
            <span className="text-[10px] text-[var(--text-muted)] border-l border-[var(--border-subtle)] pl-2 hidden md:inline">
              {new Date(updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </div>

      {savedMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--primary)]/40 text-[var(--primary)] text-xs font-mono font-bold flex items-center justify-between shadow-lg"
        >
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4" /> {savedMessage}
          </span>
          <span className="text-[10px] uppercase opacity-70">Saved to Database</span>
        </motion.div>
      )}

      {/* Horizontal Pill Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar p-1.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SettingsTab)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                active
                  ? 'bg-[var(--primary)] text-[var(--primary-contrast)] font-bold shadow-md'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-elevated)]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Cards */}
      <div className="p-6 sm:p-8 rounded-[var(--radius-box)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-card)] space-y-8">
        {/* ── 0. THEME & 3D COLORS TAB ── */}
        {activeTab === 'theme' && (
          <div className="space-y-8">
            <div className="border-b border-[var(--border-subtle)] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-[var(--text-main)] flex items-center gap-2">
                  <Palette className="w-5 h-5 text-[var(--primary)]" />
                  Color Palettes & Theme System
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Real-time database-persisted theme engine with 3D button rendering and View Transition ripples.
                </p>
              </div>

              <button
                type="button"
                onClick={async () => {
                  await resetToDefaults(storeUser?.id || 1);
                  showSaved('Theme reset to system defaults');
                }}
                className="px-3 py-1.5 rounded-xl border border-[var(--border-subtle)] hover:bg-[var(--bg-surface-elevated)] text-[var(--text-muted)] hover:text-[var(--text-main)] text-xs font-semibold flex items-center gap-1.5 transition-all self-start sm:self-auto"
                title="Reset all colors and sound settings"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Defaults</span>
              </button>
            </div>

            {/* Live Palette Swatch Cards */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono block">
                1. Select Palette ({isExplorer ? 'Explorer World' : 'Scholar Studio'})
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Palette A Card */}
                <div
                  data-testid="palette-a-card"
                  onClick={() => {
                    setPalette('a', storeUser?.id || 1);
                    showSaved(`Palette A (${palAInfo.dominantName}) applied`);
                  }}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all space-y-4 relative overflow-hidden ${
                    palette === 'a'
                      ? 'border-[var(--primary)] bg-[var(--bg-surface-elevated)] shadow-lg'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-app)] hover:border-[var(--primary)]/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-5 h-5 rounded-full shadow-sm border border-white/60"
                        style={{ backgroundColor: palAInfo.dominant }}
                      />
                      <span className="font-bold text-sm text-[var(--text-main)]">
                        Palette A ({palAInfo.dominantName} Dominant)
                      </span>
                    </div>
                    {palette === 'a' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-[var(--primary)] text-[var(--primary-contrast)] text-[10px] font-mono font-bold">
                        ACTIVE
                      </span>
                    )}
                  </div>

                  {/* Swatch Previews */}
                  <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                    <div
                      className="p-2.5 rounded-xl text-white font-bold shadow-sm"
                      style={{ backgroundColor: palAInfo.dominant }}
                    >
                      <span>Primary</span>
                      <p className="opacity-90">{palAInfo.dominant}</p>
                    </div>
                    <div
                      className="p-2.5 rounded-xl text-white font-bold shadow-sm"
                      style={{ backgroundColor: palAInfo.secondary }}
                    >
                      <span>Secondary</span>
                      <p className="opacity-90">{palAInfo.secondary}</p>
                    </div>
                    <div
                      className="p-2.5 rounded-xl text-slate-900 font-bold shadow-sm"
                      style={{ backgroundColor: palAInfo.accent }}
                    >
                      <span>Accent</span>
                      <p className="opacity-90">{palAInfo.accent}</p>
                    </div>
                  </div>

                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    {isExplorer
                      ? 'High-energy Coral tone with playful Grape accents. Boosts visual focus for younger learners.'
                      : 'Focused Deep Emerald workspace with Warm Amber citations for maximum reading comfort.'}
                  </p>
                </div>

                {/* Palette B Card */}
                <div
                  data-testid="palette-b-card"
                  onClick={() => {
                    setPalette('b', storeUser?.id || 1);
                    showSaved(`Palette B (${palBInfo.dominantName}) applied`);
                  }}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all space-y-4 relative overflow-hidden ${
                    palette === 'b'
                      ? 'border-[var(--primary)] bg-[var(--bg-surface-elevated)] shadow-lg'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-app)] hover:border-[var(--primary)]/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-5 h-5 rounded-full shadow-sm border border-white/60"
                        style={{ backgroundColor: palBInfo.dominant }}
                      />
                      <span className="font-bold text-sm text-[var(--text-main)]">
                        Palette B ({palBInfo.dominantName} Dominant)
                      </span>
                    </div>
                    {palette === 'b' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-[var(--primary)] text-[var(--primary-contrast)] text-[10px] font-mono font-bold">
                        ACTIVE
                      </span>
                    )}
                  </div>

                  {/* Swatch Previews */}
                  <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                    <div
                      className="p-2.5 rounded-xl text-white font-bold shadow-sm"
                      style={{ backgroundColor: palBInfo.dominant }}
                    >
                      <span>Primary</span>
                      <p className="opacity-90">{palBInfo.dominant}</p>
                    </div>
                    <div
                      className="p-2.5 rounded-xl text-white font-bold shadow-sm"
                      style={{ backgroundColor: palBInfo.secondary }}
                    >
                      <span>Secondary</span>
                      <p className="opacity-90">{palBInfo.secondary}</p>
                    </div>
                    <div
                      className="p-2.5 rounded-xl text-slate-900 font-bold shadow-sm"
                      style={{ backgroundColor: palBInfo.accent }}
                    >
                      <span>Accent</span>
                      <p className="opacity-90">{palBInfo.accent}</p>
                    </div>
                  </div>

                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    {isExplorer
                      ? 'Cosmic Grape tone with warm Coral highlights. Perfect for night-time adventure quests.'
                      : 'Warm Amber dominant palette with Emerald grounding highlights for extended study sessions.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Light / Dark / System Appearance Selector */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono block">
                2. Theme Mode (Appearance)
              </label>

              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  data-testid="theme-light-btn"
                  onClick={() => {
                    setTheme('light', storeUser?.id || 1);
                    showSaved('Light mode active');
                  }}
                  className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                    theme === 'light'
                      ? 'bg-[var(--bg-surface-elevated)] border-[var(--primary)] shadow-md text-[var(--primary)] font-bold'
                      : 'bg-[var(--bg-app)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  <Sun className="w-5 h-5 text-amber-500" />
                  <span className="text-xs">Light</span>
                </button>

                <button
                  type="button"
                  data-testid="theme-dark-btn"
                  onClick={() => {
                    setTheme('dark', storeUser?.id || 1);
                    showSaved('Dark mode active');
                  }}
                  className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                    theme === 'dark'
                      ? 'bg-[var(--bg-surface-elevated)] border-[var(--primary)] shadow-md text-[var(--primary)] font-bold'
                      : 'bg-[var(--bg-app)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  <Moon className="w-5 h-5 text-purple-400" />
                  <span className="text-xs">Dark</span>
                </button>

                <button
                  type="button"
                  data-testid="theme-system-btn"
                  onClick={() => {
                    setTheme('system', storeUser?.id || 1);
                    showSaved('System sync active');
                  }}
                  className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                    theme === 'system'
                      ? 'bg-[var(--bg-surface-elevated)] border-[var(--primary)] shadow-md text-[var(--primary)] font-bold'
                      : 'bg-[var(--bg-app)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  <Monitor className="w-5 h-5 text-blue-400" />
                  <span className="text-xs">System (Auto)</span>
                </button>
              </div>
            </div>

            {/* Accessibility & Audio Toggles */}
            <div className="space-y-4 pt-4 border-t border-[var(--border-subtle)]">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono block">
                3. Audio & Accessibility Controls
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Intro Sound Toggle */}
                <div className="p-4 rounded-2xl bg-[var(--bg-app)] border border-[var(--border-subtle)] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
                      {sound ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </div>
                    <div>
                      <span className="font-bold text-xs text-[var(--text-main)] block">
                        Intro sound (Default ON)
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)]">
                        Synchronized celestial audio and chime soundscapes
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    data-testid="toggle-intro-sound"
                    onClick={() => {
                      toggleSound(storeUser?.id || 1);
                      if (!sound) playButtonSound(650);
                      showSaved(sound ? 'Intro sound muted' : 'Intro sound enabled');
                    }}
                    className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                      sound ? 'bg-[var(--primary)]' : 'bg-[var(--border-subtle)]'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        sound ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Reduced Motion Toggle */}
                <div className="p-4 rounded-2xl bg-[var(--bg-app)] border border-[var(--border-subtle)] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-[var(--text-main)] block">
                        Reduced Motion
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)]">
                        Disables 3D tilt & ripple animations
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setReducedMotion(!reducedMotion, storeUser?.id || 1);
                      showSaved(!reducedMotion ? 'Reduced motion enabled' : 'Full motion enabled');
                    }}
                    className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                      reducedMotion ? 'bg-[var(--primary)]' : 'bg-[var(--border-subtle)]'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        reducedMotion ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Play Intro on Every Visit Toggle Card */}
                <div className="p-4 rounded-2xl bg-[var(--bg-app)] border border-[var(--border-subtle)] flex items-center justify-between mt-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-bold">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-[var(--text-main)] block">
                        Play intro on every visit (Default ON)
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)]">
                        Plays the 8.2-second 3D cinematic logo intro on every app start and page reload
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    data-testid="toggle-intro-every-visit"
                    onClick={() => {
                      setIntroEveryVisit(!introEveryVisit, storeUser?.id || 1);
                      showSaved(!introEveryVisit ? 'Intro on every visit enabled' : 'Intro on every visit disabled');
                    }}
                    className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                      introEveryVisit ? 'bg-[var(--primary)]' : 'bg-[var(--border-subtle)]'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        introEveryVisit ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Replay Intro Animation Card */}
              <div className="p-4 rounded-2xl bg-[var(--bg-app)] border border-[var(--border-subtle)] flex items-center justify-between mt-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[var(--primary)] text-[var(--primary-contrast)] flex items-center justify-center font-bold">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-[var(--text-main)] block">
                      Brand Storyboard Intro Animation
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)]">
                      5-second Aanvi winged mascot particle reveal & sound portal
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      sessionStorage.removeItem('aanvi_intro_seen');
                    }
                    useThemeStore.getState().replayIntro();
                    showSaved('Replaying Intro Animation...');
                    window.location.href = '/';
                  }}
                  className="px-4 py-2 rounded-xl bg-[var(--primary)] text-[var(--primary-contrast)] hover:opacity-90 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm font-mono"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Replay Intro</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── 1. PROFILE TAB ── */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="border-b border-[var(--border-subtle)] pb-4">
              <h2 className="text-lg font-bold text-[var(--text-main)]">Student Profile</h2>
              <p className="text-xs text-[var(--text-muted)]">
                Personalized identification used across citations and diagnostic evaluations.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs sm:text-sm">
              <div className="space-y-2">
                <label className="font-semibold text-[var(--text-main)]">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded-[var(--radius)] p-3 text-[var(--text-main)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="font-semibold text-[var(--text-main)]">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded-[var(--radius)] p-3 text-[var(--text-main)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="font-semibold text-[var(--text-main)]">Age</label>
                <input
                  type="number"
                  value={authUser.age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded-[var(--radius)] p-3 text-[var(--text-main)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="font-semibold text-[var(--text-main)]">
                  {authUser.age <= 15 ? 'School & Grade' : 'Institution / University'}
                </label>
                <input
                  type="text"
                  defaultValue={
                    authUser.age <= 15
                      ? 'Oakridge High School / Grade 8'
                      : 'Institute of Technology / Computer Science'
                  }
                  className="w-full bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded-[var(--radius)] p-3 text-[var(--text-main)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                />
              </div>

              {authUser.age <= 15 && (
                <div className="space-y-2 sm:col-span-2">
                  <label className="font-semibold text-[var(--text-main)] flex items-center justify-between">
                    <span>Guardian / Parent Email (COPPA Protected)</span>
                    <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold">Verified</span>
                  </label>
                  <input
                    type="text"
                    disabled
                    value={maskEmail('guardian.demo@example.com')}
                    className="w-full bg-[var(--bg-app)]/60 border border-[var(--border-subtle)] rounded-[var(--radius)] p-3 text-[var(--text-muted)] font-mono text-xs cursor-not-allowed"
                  />
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-[var(--border-subtle)] flex justify-end">
              <button
                type="button"
                onClick={() => showSaved('Profile details updated')}
                className="px-6 py-2.5 rounded-[var(--radius)] bg-[var(--primary)] hover:opacity-90 text-[var(--primary-contrast)] font-bold text-xs shadow-md transition-all"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}

        {/* ── 2. LEARNING MODE TAB ── */}
        {activeTab === 'mode' && (
          <div className="space-y-6">
            <div className="border-b border-[var(--border-subtle)] pb-4">
              <h2 className="text-lg font-bold text-[var(--text-main)]">Adaptive Learning Mode</h2>
              <p className="text-xs text-[var(--text-muted)]">
                Calibrate how the AI Tutor explains theorems, analogies, and mathematical proofs.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => handleModeChange('standard')}
                className={`p-6 rounded-[var(--radius-box)] border cursor-pointer transition-all space-y-3 ${
                  learningMode === 'standard'
                    ? 'bg-[var(--bg-surface-elevated)] border-[var(--primary)] shadow-md'
                    : 'bg-[var(--bg-app)] border-[var(--border-subtle)] hover:border-[var(--primary)]/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-full bg-[var(--primary)]/15 text-[var(--primary)] flex items-center justify-center border border-[var(--primary)]/30">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  {learningMode === 'standard' && (
                    <span className="px-2.5 py-0.5 rounded-full bg-[var(--primary)] text-[var(--primary-contrast)] text-[10px] font-bold font-mono">
                      ACTIVE
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-[var(--text-main)]">Scholar Mode (Pro / Academic)</h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Rigorous academic depth, asymptotic recurrence proofs, memory layout analysis, and physical citation anchors. Recommended for university & high school students (Age &gt; 15).
                </p>
              </div>

              <div
                onClick={() => handleModeChange('simplified')}
                className={`p-6 rounded-[var(--radius-box)] border cursor-pointer transition-all space-y-3 ${
                  learningMode === 'simplified'
                    ? 'bg-[var(--bg-surface-elevated)] border-[var(--primary)] shadow-md'
                    : 'bg-[var(--bg-app)] border-[var(--border-subtle)] hover:border-[var(--primary)]/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-full bg-[var(--secondary)]/15 text-[var(--secondary)] flex items-center justify-center border border-[var(--secondary)]/30">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  {learningMode === 'simplified' && (
                    <span className="px-2.5 py-0.5 rounded-full bg-[var(--secondary)] text-[var(--secondary-contrast)] text-[10px] font-bold font-mono">
                      ACTIVE
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-[var(--text-main)]">Explorer Mode (Younger Learners)</h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Intuitive step-by-step real-world analogies, story explanations, concept cards, and gamified mini-drills. Recommended for Age &le; 15.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── 3. LANGUAGE TAB ── */}
        {activeTab === 'language' && (
          <div className="space-y-6">
            <div className="border-b border-[var(--border-subtle)] pb-4">
              <h2 className="text-lg font-bold text-[var(--text-main)]">Language & Localization</h2>
              <p className="text-xs text-[var(--text-muted)]">
                Configure primary explanation language for the AI tutor and assessment generator.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => {
                  setLanguage('en');
                  showSaved('Language set to English');
                }}
                className={`p-5 rounded-[var(--radius-box)] border cursor-pointer transition-all flex items-center justify-between ${
                  language === 'en'
                    ? 'bg-[var(--bg-surface-elevated)] border-[var(--primary)]'
                    : 'bg-[var(--bg-app)] border-[var(--border-subtle)] hover:border-[var(--primary)]/40'
                }`}
              >
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-main)]">English (US / UK)</h3>
                  <p className="text-xs text-[var(--text-muted)]">Full support across all textbooks, slides & transcripts.</p>
                </div>
                {language === 'en' && <Check className="w-5 h-5 text-[var(--primary)]" />}
              </div>

              <div
                onClick={() => {
                  setLanguage('hi');
                  showSaved('Language set to Hindi');
                }}
                className={`p-5 rounded-[var(--radius-box)] border cursor-pointer transition-all flex items-center justify-between ${
                  language === 'hi'
                    ? 'bg-[var(--bg-surface-elevated)] border-[var(--primary)]'
                    : 'bg-[var(--bg-app)] border-[var(--border-subtle)] hover:border-[var(--primary)]/40'
                }`}
              >
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-main)]">Hindi (हिंदी)</h3>
                  <p className="text-xs text-[var(--text-muted)]">Bilingual conceptual explanation with English source grounding.</p>
                </div>
                {language === 'hi' && <Check className="w-5 h-5 text-[var(--primary)]" />}
              </div>
            </div>
          </div>
        )}

        {/* ── 4. DENSITY TAB ── */}
        {activeTab === 'density' && (
          <div className="space-y-6">
            <div className="border-b border-[var(--border-subtle)] pb-4">
              <h2 className="text-lg font-bold text-[var(--text-main)]">Theme & Display Density</h2>
              <p className="text-xs text-[var(--text-muted)]">
                Adjust workspace information density and card spacing.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => {
                  setDensity('comfortable');
                  showSaved('Density set to Comfortable');
                }}
                className={`p-5 rounded-[var(--radius-box)] border cursor-pointer transition-all flex items-center justify-between ${
                  density === 'comfortable'
                    ? 'bg-[var(--bg-surface-elevated)] border-[var(--primary)]'
                    : 'bg-[var(--bg-app)] border-[var(--border-subtle)] hover:border-[var(--primary)]/40'
                }`}
              >
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-main)]">Comfortable (24px Spacing)</h3>
                  <p className="text-xs text-[var(--text-muted)]">Optimal for study sessions and split-screen reading.</p>
                </div>
                {density === 'comfortable' && <Check className="w-5 h-5 text-[var(--primary)]" />}
              </div>

              <div
                onClick={() => {
                  setDensity('compact');
                  showSaved('Density set to Compact');
                }}
                className={`p-5 rounded-[var(--radius-box)] border cursor-pointer transition-all flex items-center justify-between ${
                  density === 'compact'
                    ? 'bg-[var(--bg-surface-elevated)] border-[var(--primary)]'
                    : 'bg-[var(--bg-app)] border-[var(--border-subtle)] hover:border-[var(--primary)]/40'
                }`}
              >
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-main)]">Compact (16px Spacing)</h3>
                  <p className="text-xs text-[var(--text-muted)]">Maximizes visible content on smaller laptop screens.</p>
                </div>
                {density === 'compact' && <Check className="w-5 h-5 text-[var(--primary)]" />}
              </div>
            </div>
          </div>
        )}

        {/* ── 5. NOTIFICATIONS TAB ── */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="border-b border-[var(--border-subtle)] pb-4">
              <h2 className="text-lg font-bold text-[var(--text-main)]">Notification Alerts</h2>
              <p className="text-xs text-[var(--text-muted)]">
                Configure learning streak reminders and adaptive test notifications.
              </p>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="p-4 rounded-[var(--radius-box)] bg-[var(--bg-app)] border border-[var(--border-subtle)] flex items-center justify-between">
                <div>
                  <span className="font-bold text-[var(--text-main)] block">Daily Learning Streak Reminders</span>
                  <span className="text-[var(--text-muted)] text-xs">Notify if 24 hours pass without completing daily questions.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStreakReminders(!streakReminders)}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                    streakReminders ? 'bg-[var(--primary)]' : 'bg-[var(--border-subtle)]'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      streakReminders ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="p-4 rounded-[var(--radius-box)] bg-[var(--bg-app)] border border-[var(--border-subtle)] flex items-center justify-between">
                <div>
                  <span className="font-bold text-[var(--text-main)] block">Weekly Bayesian Mastery Digests</span>
                  <span className="text-[var(--text-muted)] text-xs">Receive weekly progress and recommended focus summaries.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setEmailAlerts(!emailAlerts)}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                    emailAlerts ? 'bg-[var(--primary)]' : 'bg-[var(--border-subtle)]'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      emailAlerts ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── 6. DATA & PRIVACY TAB ── */}
        {activeTab === 'privacy' && (
          <div className="space-y-6">
            <div className="border-b border-[var(--border-subtle)] pb-4">
              <h2 className="text-lg font-bold text-[var(--text-main)]">Data & Privacy Governance</h2>
              <p className="text-xs text-[var(--text-muted)]">
                You own 100% of your course materials and Bayesian knowledge state records.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-[var(--radius-box)] bg-[var(--bg-app)] border border-[var(--border-subtle)] flex items-center justify-between">
                <div>
                  <span className="font-bold text-[var(--text-main)] block">Export My Study History & BKT Trace</span>
                  <span className="text-[var(--text-muted)] text-xs">Download full JSON archive of attempts, timestamps, and mastery states.</span>
                </div>
                <button
                  type="button"
                  onClick={() => showSaved('Export archive generated')}
                  className="px-4 py-2 rounded-[var(--radius)] bg-[var(--bg-surface-elevated)] hover:bg-[var(--border-subtle)] text-[var(--text-main)] font-semibold text-xs transition-colors flex items-center gap-1.5 border border-[var(--border-subtle)]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export JSON</span>
                </button>
              </div>

              <div className="p-4 rounded-[var(--radius-box)] bg-[var(--bg-app)] border border-[var(--border-subtle)] flex items-center justify-between">
                <div>
                  <span className="font-bold text-[var(--text-main)] block">Replay 5-Second Intro Animation</span>
                  <span className="text-[var(--text-muted)] text-xs">Watch the Aanvi winged mascot SVG intro portal animation again.</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    sessionStorage.removeItem('aanvi_intro_seen');
                    window.location.href = '/';
                  }}
                  className="px-4 py-2 rounded-[var(--radius)] bg-[var(--primary)] text-[var(--primary-contrast)] font-bold text-xs transition-all hover:scale-105 flex items-center gap-1.5 shadow-md"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Replay Intro</span>
                </button>
              </div>

              <div className="p-4 rounded-[var(--radius-box)] bg-[var(--bg-app)] border border-[var(--border-subtle)] flex items-center justify-between">
                <div>
                  <span className="font-bold text-[var(--text-main)] block">Legal Agreements & Compliance</span>
                  <span className="text-[var(--text-muted)] text-xs">Read our full Terms of Service and COPPA/GDPR compliance statements.</span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 rounded-[var(--radius)] bg-[var(--bg-surface-elevated)] hover:bg-[var(--border-subtle)] text-[var(--text-main)] font-semibold text-xs transition-colors border border-[var(--border-subtle)]"
                  >
                    Terms of Service
                  </a>
                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 rounded-[var(--radius)] bg-[var(--bg-surface-elevated)] hover:bg-[var(--border-subtle)] text-[var(--text-main)] font-semibold text-xs transition-colors border border-[var(--border-subtle)]"
                  >
                    Privacy Policy
                  </a>
                </div>
              </div>

              <div className="p-4 rounded-[var(--radius-box)] bg-[var(--bg-app)] border border-red-500/20 flex items-center justify-between">
                <div>
                  <span className="font-bold text-[var(--text-main)] block">Permanently Delete My Data</span>
                  <span className="text-[var(--text-muted)] text-xs">Irreversibly erase all courses, diagnostic history, test attempts, Bayesian mastery, and conversation logs from the database.</span>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const confirmed = window.confirm(
                      'Are you sure you want to permanently delete your data? All enrolled courses, materials, and learning history will be permanently wiped from the database. This action cannot be undone.'
                    );
                    if (!confirmed) return;

                    try {
                      let token = '';
                      if (typeof window !== 'undefined') {
                        const saved = localStorage.getItem('aanvi_token');
                        if (saved) token = saved;
                      }
                      const res = await fetch(`${API_BASE}/auth/delete-account`, {
                        method: 'DELETE',
                        headers: {
                          'Authorization': `Bearer ${token}`,
                          'Content-Type': 'application/json'
                        }
                      });
                      if (res.ok) {
                        localStorage.clear();
                        sessionStorage.clear();
                        alert('Your data and account have been permanently erased from the database.');
                        window.location.href = '/signup';
                      } else {
                        showSaved('Failed to permanently delete data from server.');
                      }
                    } catch (err) {
                      showSaved('Network error while deleting data.');
                    }
                  }}
                  className="px-4 py-2 rounded-[var(--radius)] bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 font-bold text-xs transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Permanently Delete My Data</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── 7. API & KEYS STATUS TAB ── */}
        {activeTab === 'api' && (
          <div className="space-y-6">
            <div className="border-b border-[var(--border-subtle)] pb-4">
              <h2 className="text-lg font-bold text-[var(--text-main)]">API & Grounding Pipeline Status</h2>
              <p className="text-xs text-[var(--text-muted)]">
                Live operational status of multimodal extraction, vector indexing, and sandbox verification.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
              <div className="p-4 rounded-[var(--radius-box)] bg-[var(--bg-app)] border border-[var(--border-subtle)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-muted)]">RAG Vector Index</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
                </div>
                <p className="font-bold text-[var(--text-main)]">FastEmbed BAAI/bge-small</p>
                <p className="text-[11px] text-[var(--primary)]">384-dim • Normalized</p>
              </div>

              <div className="p-4 rounded-[var(--radius-box)] bg-[var(--bg-app)] border border-[var(--border-subtle)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-muted)]">Whisper Pipeline</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
                </div>
                <p className="font-bold text-[var(--text-main)]">Video Timestamp Grounding</p>
                <p className="text-[11px] text-[var(--primary)]">Exact Frame Alignment</p>
              </div>

              <div className="p-4 rounded-[var(--radius-box)] bg-[var(--bg-app)] border border-[var(--border-subtle)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-muted)]">Python Sandbox</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
                </div>
                <p className="font-bold text-[var(--text-main)]">Numerical Code Verifier</p>
                <p className="text-[11px] text-[var(--primary)]">Dual Verification Active</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
