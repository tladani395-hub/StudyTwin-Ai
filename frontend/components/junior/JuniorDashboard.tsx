'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Trophy,
  Flame,
  Zap,
  Star,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  Compass,
  Lock,
  Play,
  Award,
  Gem,
  RefreshCw,
  Gift,
  X,
  Volume2,
  HelpCircle
} from 'lucide-react';
import { api, DashboardMapResponse, DashboardSummaryResponse, ExplorerIsland } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { useThemeStore, playButtonSound } from '@/stores/useThemeStore';
import { useCourseStore } from '@/stores/useCourseStore';
import SparkOwlMascot, { MascotMood } from '@/components/mascot/SparkOwlMascot';

export const JuniorDashboard: React.FC = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const { reducedMotion, sound } = useThemeStore();
  const { activeCourseId, courses } = useCourseStore();

  const [mapData, setMapData] = useState<DashboardMapResponse | null>(null);
  const [summaryData, setSummaryData] = useState<DashboardSummaryResponse | null>(null);
  const [selectedIsland, setSelectedIsland] = useState<ExplorerIsland | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const resolvedCourseId = activeCourseId || (courses.length > 0 ? courses[0].id : 'c-sci-0003-0000-000000000003');
      const userId = user?.id || 'u-explorer-0002-0000-000000000002';
      const [m, s] = await Promise.all([
        api.getDashboardMap(userId, resolvedCourseId),
        api.getDashboardSummary(userId, resolvedCourseId),
      ]);
      setMapData(m);
      setSummaryData(s);
    } catch (err) {
      console.error('Failed to load explorer map data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id, activeCourseId]);

  const handleIslandClick = (island: ExplorerIsland) => {
    if (sound) playButtonSound(island.status === 'locked' ? 350 : 650);
    setSelectedIsland(island);

    if (island.status === 'mastered' && !reducedMotion) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#FF6B57', '#7B4BFF', '#FFC93C'],
      });
    }
  };

  const startIslandQuest = (islandName: string) => {
    if (sound) playButtonSound(750);
    router.push(`/assessment?topic=${encodeURIComponent(islandName)}`);
  };

  if (isLoading && (!mapData || !summaryData)) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto p-4 animate-pulse">
        <div className="h-20 bg-[var(--bg-surface)] rounded-3xl border-3 border-[var(--border-subtle)]" />
        <div className="h-96 bg-[var(--bg-surface)] rounded-3xl border-3 border-[var(--border-subtle)]" />
      </div>
    );
  }

  const map = mapData!;
  const summary = summaryData!;
  const masteredCount = map.islands.filter((i) => i.status === 'mastered').length;

  // Determine mascot mood based on streak and mastered islands
  const mascotMood: MascotMood = (user?.streak_days || 5) >= 5 ? 'happy' : masteredCount >= 2 ? 'proud' : 'excited';

  const mascotSpeech =
    masteredCount >= 3
      ? "You're a legendary explorer! 3 islands conquered! What's our next adventure? 🚀"
      : (user?.streak_days || 5) >= 5
      ? `5-day adventure streak! You're on fire! Keep going to earn the Grand Explorer star! ⭐`
      : `Welcome back, Explorer! Tap any glowing island on your map to explore! 🗺️`;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 font-sans select-none">
      {/* ── 1. EXPLORER MASCOT GREETING BANNER ── */}
      <div className="p-4 sm:p-6 rounded-[var(--radius-box)] bg-[var(--bg-surface)] border-3 border-[var(--border-subtle)] shadow-[var(--shadow-card)] flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden">
        {/* Left Mascot + Dialogue */}
        <div className="flex items-center gap-4">
          <div className="shrink-0">
            <SparkOwlMascot mood={mascotMood} size="md" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[var(--primary)] text-white text-xs font-black uppercase font-display tracking-wider shadow-sm">
                Explorer Level {map.level || 4}
              </span>
              <span className="text-xs font-bold text-[var(--accent)] flex items-center gap-1 font-mono">
                <Flame className="w-4 h-4 fill-[var(--accent)]" /> {user?.streak_days || 5}-Day Streak!
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-display font-black text-[var(--text-main)] mt-1">
              Adventure World: <span className="text-[var(--primary)]">Island Archipelago</span>
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5 font-medium">
              {mascotSpeech}
            </p>
          </div>
        </div>

        {/* Right Stats: Stars Bank & Refresh */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Star Bank */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[var(--accent)]/15 border-2 border-[var(--accent)] text-[var(--accent)] font-black text-sm sm:text-base shadow-sm">
            <Star className="w-5 h-5 fill-[var(--accent)]" />
            <span>{map.total_stars} Stars</span>
          </div>

          {/* Treasure Spaced Repetition Counter */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[var(--secondary)]/15 border-2 border-[var(--secondary)] text-[var(--secondary)] font-bold text-xs sm:text-sm">
            <Gem className="w-4 h-4 text-[var(--secondary)]" />
            <span>Treasure to Polish: {summary.due_reviews?.count || 1}</span>
          </div>

          <button
            type="button"
            onClick={loadData}
            title="Refresh Island Map"
            className="p-2.5 rounded-2xl bg-[var(--bg-surface-elevated)] hover:bg-[var(--border-subtle)] border-2 border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── 2. THE BIG INTERACTIVE ADVENTURE ISLAND MAP (Centerpiece) ── */}
      <div className="relative rounded-[var(--radius-box)] bg-[var(--bg-surface)] border-3 border-[var(--border-subtle)] shadow-[var(--shadow-card)] p-4 sm:p-8 min-h-[460px] sm:min-h-[520px] overflow-hidden flex flex-col justify-between">
        {/* Map Header & Title Tag */}
        <div className="flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-[var(--primary)]" />
            <h2 className="text-base sm:text-lg font-display font-black text-[var(--text-main)]">
              Interactive Archipelago Map
            </h2>
          </div>
          <span className="text-xs font-mono font-bold text-[var(--text-muted)] bg-[var(--bg-surface-elevated)] px-3 py-1 rounded-full border border-[var(--border-subtle)]">
            {masteredCount}/{map.islands.length} Islands Mastered
          </span>
        </div>

        {/* SVG Trail Connector Lines Between Islands */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          {map.trails.map((trail, idx) => {
            const fromIsl = map.islands.find((i) => i.name === trail.from_island);
            const toIsl = map.islands.find((i) => i.name === trail.to_island);
            if (!fromIsl || !toIsl) return null;

            return (
              <line
                key={idx}
                x1={`${fromIsl.x_coord}%`}
                y1={`${fromIsl.y_coord}%`}
                x2={`${toIsl.x_coord}%`}
                y2={`${toIsl.y_coord}%`}
                stroke={trail.completed ? 'var(--primary)' : 'var(--border-subtle)'}
                strokeWidth={trail.completed ? 4 : 3}
                strokeDasharray={trail.completed ? 'none' : '6,6'}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            );
          })}
        </svg>

        {/* Island Nodes Positioned Accurately on the Map */}
        <div className="relative w-full h-[360px] sm:h-[420px] z-10">
          {map.islands.map((island) => {
            const isMastered = island.status === 'mastered';
            const isUnlocked = island.status === 'unlocked';
            const isLocked = island.status === 'locked';

            return (
              <motion.div
                key={island.id}
                style={{
                  left: `${island.x_coord}%`,
                  top: `${island.y_coord}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                whileHover={{ scale: reducedMotion ? 1 : 1.12 }}
                whileTap={{ scale: reducedMotion ? 1 : 0.94 }}
                onClick={() => handleIslandClick(island)}
                className="absolute cursor-pointer flex flex-col items-center group focus:outline-none"
              >
                {/* Floating "YOU ARE HERE" badge on recommended unlocked island */}
                {island.recommended && (
                  <motion.div
                    animate={reducedMotion ? {} : { y: [-3, 3, -3] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute -top-7 px-2.5 py-0.5 rounded-full bg-[var(--primary)] text-white text-[10px] font-black font-display tracking-wider shadow-md whitespace-nowrap flex items-center gap-1 border-2 border-white"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>YOU ARE HERE</span>
                  </motion.div>
                )}

                {/* Island Node Circle / Sticker */}
                <div
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-3xl flex items-center justify-center text-2xl sm:text-3xl transition-all duration-300 shadow-md ${
                    isMastered
                      ? 'bg-gradient-to-br from-amber-400 to-yellow-500 border-3 border-white text-white ring-4 ring-[var(--accent)]/30 scale-105'
                      : isUnlocked
                      ? 'bg-[var(--bg-surface)] border-3 border-[var(--primary)] text-[var(--text-main)] ring-4 ring-[var(--primary)]/20'
                      : 'bg-[var(--bg-surface-elevated)] border-3 border-[var(--border-subtle)] text-[var(--text-muted)] opacity-50'
                  }`}
                >
                  {isLocked ? <Lock className="w-6 h-6 text-[var(--text-muted)]" /> : island.emoji}
                </div>

                {/* Island Name & Stars Sticker */}
                <div className="mt-1.5 px-2.5 py-1 rounded-xl bg-[var(--bg-surface)] border-2 border-[var(--border-subtle)] text-center shadow-sm">
                  <span className="text-[11px] sm:text-xs font-black text-[var(--text-main)] block whitespace-nowrap">
                    {island.name}
                  </span>
                  {/* Star rating */}
                  <div className="flex items-center justify-center gap-0.5 mt-0.5">
                    {[1, 2, 3].map((s) => (
                      <Star
                        key={s}
                        className={`w-3 h-3 ${
                          s <= island.stars
                            ? 'fill-[var(--accent)] text-[var(--accent)]'
                            : 'text-[var(--border-subtle)]'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Map Footer Bar: Big "Next Adventure" Action Button */}
        <div className="pt-3 border-t-2 border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 z-10">
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <span className="w-3 h-3 rounded-full bg-[var(--accent)] inline-block" />
            <span>Mastered Island (3 Stars)</span>
            <span className="w-3 h-3 rounded-full bg-[var(--primary)] inline-block ml-2" />
            <span>Unlocked Quest</span>
          </div>

          <button
            type="button"
            onClick={() => startIslandQuest(summary.recommended_next?.topic_name || 'Binary Trees')}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] hover:opacity-95 text-white font-display font-black text-sm shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Next Adventure: {summary.recommended_next?.title || 'Explore Binary Trees'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── 3. XP PROGRESS, TODAY'S QUEST & REWARD BADGES ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Today's Quest Card */}
        <div className="p-5 rounded-[var(--radius-box)] bg-[var(--bg-surface)] border-3 border-[var(--border-subtle)] shadow-[var(--shadow-card)] space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b-2 border-[var(--border-subtle)] pb-2.5">
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-[var(--primary)]" />
              <h3 className="font-display font-black text-base text-[var(--text-main)]">Today&apos;s Quest</h3>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-[var(--primary)]/15 text-[var(--primary)] font-mono text-[10px] font-bold">
              +50 XP Bonus
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-[var(--text-main)]">
              <span>{summary.xp?.today_quest_title || 'Daily Diagnostic Quest'}</span>
              <span>{summary.xp?.today_quest_progress || 3}/{summary.xp?.today_quest_target || 5} Questions</span>
            </div>
            <div className="w-full h-3.5 rounded-full bg-[var(--bg-surface-elevated)] border-2 border-[var(--border-subtle)] overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] transition-all duration-500"
                style={{ width: `${((summary.xp?.today_quest_progress || 3) / 5) * 100}%` }}
              />
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Answer 2 more questions to complete your quest and claim your daily stars! ⭐
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push('/assessment')}
            className="w-full py-2.5 rounded-xl bg-[var(--bg-surface-elevated)] hover:bg-[var(--border-subtle)] border-2 border-[var(--border-subtle)] text-[var(--text-main)] font-bold text-xs transition-all flex items-center justify-center gap-1.5"
          >
            <span>Continue Quest</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 2: Trophy & Badge Shelf */}
        <div className="p-5 rounded-[var(--radius-box)] bg-[var(--bg-surface)] border-3 border-[var(--border-subtle)] shadow-[var(--shadow-card)] space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b-2 border-[var(--border-subtle)] pb-2.5">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[var(--accent)]" />
              <h3 className="font-display font-black text-base text-[var(--text-main)]">Badge Trophy Shelf</h3>
            </div>
            <span className="text-xs font-mono text-[var(--text-muted)] font-bold">
              {summary.badges.filter((b) => b.earned).length}/{summary.badges.length}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {summary.badges.slice(0, 6).map((b) => (
              <div
                key={b.badge_key}
                title={`${b.title}: ${b.description}`}
                className={`p-2 rounded-2xl border-2 flex flex-col items-center text-center transition-all ${
                  b.earned
                    ? 'bg-[var(--bg-surface-elevated)] border-[var(--primary)] shadow-sm'
                    : 'bg-[var(--bg-app)] border-[var(--border-subtle)] opacity-40'
                }`}
              >
                <span className="text-2xl">{b.icon}</span>
                <span className="text-[10px] font-black text-[var(--text-main)] mt-1 truncate max-w-full">
                  {b.title}
                </span>
              </div>
            ))}
          </div>

          <Link
            href="/achievements"
            className="text-xs font-bold text-[var(--primary)] hover:underline text-center block pt-1"
          >
            View All Achievements ➔
          </Link>
        </div>

        {/* Card 3: Weekly Stars Bar Chart */}
        <div className="p-5 rounded-[var(--radius-box)] bg-[var(--bg-surface)] border-3 border-[var(--border-subtle)] shadow-[var(--shadow-card)] space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b-2 border-[var(--border-subtle)] pb-2.5">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 fill-[var(--accent)] text-[var(--accent)]" />
              <h3 className="font-display font-black text-base text-[var(--text-main)]">Weekly Stars Earned</h3>
            </div>
            <span className="text-xs font-mono text-[var(--accent)] font-bold">+18 This Week</span>
          </div>

          {/* Simple rounded bar chart for days */}
          <div className="flex items-end justify-between gap-1.5 h-28 pt-2">
            {[
              { day: 'Mon', count: 4 },
              { day: 'Tue', count: 3 },
              { day: 'Wed', count: 5 },
              { day: 'Thu', count: 2 },
              { day: 'Fri', count: 4 },
              { day: 'Sat', count: 0 },
              { day: 'Sun', count: 2 },
            ].map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
                <div className="w-full bg-[var(--bg-surface-elevated)] h-20 rounded-2xl overflow-hidden flex flex-col justify-end p-0.5 border border-[var(--border-subtle)]">
                  <div
                    className="w-full rounded-xl bg-[var(--accent)] transition-all duration-500"
                    style={{ height: `${(d.count / 5) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-[var(--text-muted)] font-mono">{d.day}</span>
              </div>
            ))}
          </div>

          <span className="text-[11px] text-[var(--text-muted)] text-center font-medium">
            Keep your streak active every day to unlock the Golden Aanvi Mascot Mark! ✨
          </span>
        </div>
      </div>

      {/* ── 4. ISLAND MODAL / POPUP ON CLICK ── */}
      <AnimatePresence>
        {selectedIsland && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md p-6 rounded-3xl bg-[var(--bg-surface)] border-3 border-[var(--border-subtle)] shadow-2xl space-y-4 relative"
            >
              <button
                type="button"
                onClick={() => setSelectedIsland(null)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-[var(--bg-surface-elevated)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-3xl bg-[var(--bg-surface-elevated)] border-2 border-[var(--border-subtle)] flex items-center justify-center text-3xl shadow-sm">
                  {selectedIsland.emoji}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${
                          s <= selectedIsland.stars
                            ? 'fill-[var(--accent)] text-[var(--accent)]'
                            : 'text-[var(--border-subtle)]'
                        }`}
                      />
                    ))}
                  </div>
                  <h3 className="text-xl font-display font-black text-[var(--text-main)] mt-0.5">
                    {selectedIsland.name}
                  </h3>
                  <span className="text-xs font-mono font-bold text-[var(--primary)] uppercase">
                    Status: {selectedIsland.status}
                  </span>
                </div>
              </div>

              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                {selectedIsland.status === 'locked'
                  ? `This island is locked! You must first master its prerequisite island (${selectedIsland.prerequisites.join(
                      ', '
                    )}) to unlock.`
                  : selectedIsland.status === 'mastered'
                  ? `You have mastered this island with a top score of ${Math.round(
                      selectedIsland.mastery * 100
                    )}%! You can replay anytime to earn extra XP.`
                  : `Explore ${selectedIsland.name} and answer fun questions to earn stars and level up!`}
              </p>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedIsland(null);
                    startIslandQuest(selectedIsland.name);
                  }}
                  disabled={selectedIsland.status === 'locked'}
                  className="flex-1 py-3.5 rounded-2xl bg-[var(--primary)] hover:opacity-90 disabled:opacity-40 text-white font-display font-black text-sm shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>{selectedIsland.status === 'locked' ? 'Locked Island' : 'Play Quest'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedIsland(null)}
                  className="px-5 py-3.5 rounded-2xl bg-[var(--bg-surface-elevated)] border-2 border-[var(--border-subtle)] text-[var(--text-main)] font-bold text-xs"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default JuniorDashboard;
