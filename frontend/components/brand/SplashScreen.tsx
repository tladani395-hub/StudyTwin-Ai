'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, ArrowRight, Sparkles } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useThemeStore } from '@/stores/useThemeStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { IntroAudioSynth } from '@/lib/introAudio';
import AanviLogo from './AanviLogo';

const ThreeDIntroCanvas = dynamic(() => import('./ThreeDIntroCanvas'), {
  ssr: false,
  loading: () => null,
});

interface SplashScreenProps {
  forcePlay?: boolean;
  onComplete?: () => void;
}

type LangType = 'en' | 'hi' | 'gu';

const TAGLINES: Record<LangType, string> = {
  en: 'Your Personal AI Study Twin',
  hi: 'आपका व्यक्तिगत AI अध्ययन साथी',
  gu: 'તમારો અંગત AI અભ્યાસ સાથી',
};

export default function SplashScreen({ forcePlay = false, onComplete }: SplashScreenProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { sound, toggleSound, reducedMotion, showIntro, introEveryVisit, markIntroSeen } = useThemeStore();
  const { isAuthenticated, user } = useAuthStore();

  const [mounted, setMounted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(sound);
  const [soundBlocked, setSoundBlocked] = useState(false);
  const [volume, setVolume] = useState<number>(0.8);
  const [lang, setLang] = useState<LangType>('en');
  const [qualityOverride, setQualityOverride] = useState<'high' | 'medium' | 'low' | undefined>(undefined);

  // Timeline state in seconds (0.0 to 8.2)
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [showSkip, setShowSkip] = useState(false);
  const [doorProgress, setDoorProgress] = useState(0); // 0 (closed) -> 1 (fully open)
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);
  const [isFastForward, setIsFastForward] = useState(false);

  const audioSynthRef = useRef<IntroAudioSynth | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const currentTimeRef = useRef<number>(0);
  const isFastForwardRef = useRef(false);

  const tagline = TAGLINES[lang] || TAGLINES.en;

  const handleFinish = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('aanvi_intro_finished', 'true');
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (audioSynthRef.current) {
      audioSynthRef.current.stop();
    }
    setIsFinished(true);
    markIntroSeen();

    if (onComplete) {
      onComplete();
    } else if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      if (currentPath === '/' || currentPath === '/welcome' || currentPath === '/intro') {
        if (isAuthenticated && user) {
          router.push('/dashboard');
        } else {
          router.push('/welcome');
        }
      }
    }
  }, [isAuthenticated, user, markIntroSeen, onComplete, router]);

  // Reactive listener to replay intro when user triggers it
  useEffect(() => {
    if (pathname === '/terms' || pathname === '/privacy') {
      return;
    }
    if (showIntro || forcePlay) {
      setIsFinished(false);
      setCurrentTime(0);
      setDoorProgress(0);
      isFastForwardRef.current = false;
      setIsFastForward(false);
      startTimeRef.current = Date.now();
      currentTimeRef.current = 0;

      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('aanvi_intro_finished');
        sessionStorage.removeItem('aanvi_intro_seen');
      }

      if (!audioSynthRef.current) {
        audioSynthRef.current = new IntroAudioSynth();
      }
      if (soundEnabled && audioSynthRef.current) {
        audioSynthRef.current.start(0).catch(() => {});
      }

      if (timerRef.current) clearInterval(timerRef.current);

      const replayTimer = setInterval(() => {
        if (isFastForwardRef.current) return;
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        currentTimeRef.current = elapsed;
        setCurrentTime(elapsed);

        if (elapsed >= 7.3) {
          const dp = Math.min(1.0, (elapsed - 7.3) / 0.9);
          setDoorProgress(dp);
        } else {
          setDoorProgress(0);
        }

        if (elapsed >= 9.2) {
          clearInterval(replayTimer);
          handleFinish();
        }
      }, 50);

      timerRef.current = replayTimer;
    }
  }, [showIntro, forcePlay, soundEnabled, handleFinish, pathname]);

  // Initialize and auto-start immediately on every mount
  useEffect(() => {
    if (pathname === '/terms' || pathname === '/privacy') {
      setIsFinished(true);
      return;
    }
    setMounted(true);

    if (typeof window !== 'undefined') {
      const savedLang = (localStorage.getItem('aanvi_language') as LangType) || 'en';
      if (savedLang === 'en' || savedLang === 'hi' || savedLang === 'gu') {
        setLang(savedLang);
      }
      const savedSound = localStorage.getItem('aanvi_sound');
      const soundVal = savedSound !== null ? savedSound === 'true' : sound;
      setSoundEnabled(soundVal);

      const qParam = new URLSearchParams(window.location.search).get('quality');
      if (qParam === 'high' || qParam === 'medium' || qParam === 'low') {
        setQualityOverride(qParam);
      }

      // Check if intro was already played/finished during this continuous navigation session
      const alreadyFinished = sessionStorage.getItem('aanvi_intro_finished');
      if (alreadyFinished === 'true' && !forcePlay && !showIntro) {
        setIsFinished(true);
        return;
      }

      // Check if user explicitly turned OFF "Play intro on every visit"
      const rawIntroEvery = localStorage.getItem('aanvi_intro_every_visit');
      if (rawIntroEvery === 'false' && !forcePlay && !showIntro) {
        setIsFinished(true);
        return;
      }
    }

    const synth = new IntroAudioSynth();
    audioSynthRef.current = synth;
    if (typeof window !== 'undefined') {
      (window as any).__AANVI_AUDIO_SYNTH = synth;
      (window as any).__AANVI_RESET_TIMELINE = () => {
        startTimeRef.current = Date.now();
        setCurrentTime(0);
        setDoorProgress(0);
      };
    }

    // Reduced motion fast fade (1.5s then doors open)
    if (reducedMotion) {
      if (soundEnabled) synth.playReducedMotionChime();
      setTimeout(() => {
        setDoorProgress(1);
        setTimeout(() => handleFinish(), 600);
      }, 1500);
      return;
    }

    // Auto-play audio immediately on load
    startTimeRef.current = Date.now();
    synth.start(0).then((success) => {
      if (!success) {
        setSoundBlocked(true);
      }
    });

    // Main 8.2s synchronized animation ticker
    const timer = setInterval(() => {
      if (isFastForwardRef.current) {
        return;
      }

      const overrideT = typeof window !== 'undefined' ? (window as any).__AANVI_INTRO_T : undefined;
      const elapsed = typeof overrideT === 'number' ? overrideT : (Date.now() - startTimeRef.current) / 1000;
      currentTimeRef.current = elapsed;
      setCurrentTime(elapsed);

      // Doors start opening at 7.3s through 8.2s
      if (elapsed >= 7.3) {
        const dp = Math.min(1.0, (elapsed - 7.3) / 0.9);
        setDoorProgress(dp);
      } else {
        setDoorProgress(0);
      }

      if (typeof window !== 'undefined' && (window as any).__AANVI_DISABLE_AUTOFINISH) {
        return;
      }

      if (elapsed >= 9.2) {
        clearInterval(timer);
        handleFinish();
      }
    }, 50);
    timerRef.current = timer;

    // Skip button appears after 1 second
    const skipTimer = setTimeout(() => {
      setShowSkip(true);
    }, 1000);

    // Global listener to unlock blocked autoplay seamlessly on first interaction
    const handleFirstGesture = async (e?: Event) => {
      if (isFastForwardRef.current) return;
      if (e && (e.target as HTMLElement)?.closest?.('[data-testid="splash-skip-button"]')) {
        return;
      }
      if (audioSynthRef.current && soundEnabled) {
        await audioSynthRef.current.resume();
        if (isFastForwardRef.current) return;
        const ok = await audioSynthRef.current.start(currentTimeRef.current || 0);
        if (isFastForwardRef.current) {
          audioSynthRef.current.stop();
          return;
        }
        if (ok) {
          setSoundBlocked(false);
        }
      }
    };
    window.addEventListener('pointerdown', handleFirstGesture, { once: true });
    window.addEventListener('keydown', handleFirstGesture, { once: true });
    window.addEventListener('click', handleFirstGesture, { once: true });
    window.addEventListener('touchstart', handleFirstGesture, { once: true });

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      clearTimeout(skipTimer);
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
      if (audioSynthRef.current) {
        audioSynthRef.current.dispose();
        audioSynthRef.current = null;
      }
    };
  }, []);


  // Skip button or Esc key: fast-forwards directly to doors opening (7.3s) and stops audio
  const handleSkipToDoors = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('aanvi_intro_finished', 'true');
    }
    isFastForwardRef.current = true;
    setIsFastForward(true);
    setCurrentTime(7.3);
    setDoorProgress(0.08); // Immediately mount doors and start parting
    if (audioSynthRef.current) {
      audioSynthRef.current.stop();
    }
    // Smooth door opening transition
    setTimeout(() => {
      setDoorProgress(1.0);
      setTimeout(() => {
        handleFinish();
      }, 1400);
    }, 50);
  }, [handleFinish]);

  // Keyboard shortcut listener (Esc key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleSkipToDoors();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSkipToDoors]);

  if (pathname === '/terms' || pathname === '/privacy') return null;
  if (isFinished) return null;
  if (!mounted) {
    return <div className="fixed inset-0 z-[999999] bg-[#05040a]" />;
  }

  // If user explicitly disabled introEveryVisit in Settings and not forcePlay/showIntro
  if (!forcePlay && !showIntro && !introEveryVisit) {
    return null;
  }

  // =========================================================================
  // Reduced Motion View (1.5s gentle fade-in of logo, then doors open)
  // =========================================================================
  if (reducedMotion) {
    return (
      <div
        data-testid="splash-reduced-motion"
        className="fixed inset-0 z-[999999] flex flex-col items-center justify-center bg-[#05040a] text-white select-none overflow-hidden"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center text-center space-y-4"
        >
          <img
            src="/brand/aanvi-logo.svg"
            alt="Aanvi Mascot"
            className="w-36 h-36 drop-shadow-[0_0_35px_rgba(255,107,87,0.6)]"
          />
          <h1 className="text-4xl font-black font-display text-white">Aanvi</h1>
          <p className="text-sm font-mono text-amber-300">{tagline}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <div
        data-testid="splash-screen-container"
        className="fixed inset-0 z-[999999] bg-[#05040a] text-white select-none overflow-hidden"
      >
        {/* ===================================================================
            BEHIND THE DOORS: REVEALED WEBSITE (WELCOME SCREEN / DASHBOARD)
            =================================================================== */}
        <div
          data-testid="revealed-screen-container"
          onClick={handleFinish}
          className="absolute inset-0 z-10 flex flex-col items-center justify-between px-6 py-10 bg-[var(--bg-app,#0E0C17)] text-[var(--text-main,#FFFFFF)] cursor-pointer"
        >
          {/* Header */}
          <div className="w-full max-w-5xl flex items-center justify-between">
            <AanviLogo size="md" />
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-white/70">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Track D: Study Twin</span>
            </div>
          </div>

          {/* Center Card without sign in / sign up buttons */}
          <div data-testid="welcome-screen" className="flex flex-col items-center text-center max-w-lg space-y-6 my-auto">
            <img
              src="/brand/aanvi-logo.svg"
              alt="Aanvi Mascot"
              className="w-28 h-28 drop-shadow-[0_0_30px_rgba(255,107,87,0.5)]"
            />
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl font-black font-display tracking-tight text-white">
                Welcome to <span className="text-[#FF6B57]">Aanvi</span>
              </h1>
              <p className="text-base sm:text-lg text-white/70 font-medium">
                {tagline}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-[11px] font-mono text-white/40">
            Source-Grounded Adaptive AI • All rights reserved
          </div>
        </div>

        {/* ===================================================================
            TWO SLIDING DOORS (7.3s – 8.2s Split down center into Left and Right)
            =================================================================== */}
        {doorProgress > 0 && (
          <>
            {/* LEFT DOOR (carries left half of the scene) */}
            <div
              data-testid="intro-door-left"
              className="absolute inset-y-0 left-0 w-1/2 overflow-hidden z-40 pointer-events-none"
              style={{
                transform: `translateX(-${doorProgress * 100}%)`,
                transition: isFastForward ? 'transform 0.85s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
                boxShadow: 'inset -15px 0 35px rgba(255, 209, 102, 0.4), inset -4px 0 10px #ffffff',
              }}
            >
              <div className="absolute inset-y-0 left-0 w-[200vw] h-full pointer-events-none">
                {snapshotUrl ? (
                  <img src={snapshotUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[#05040a] flex items-center justify-center">
                    <img src="/brand/aanvi-logo.svg" alt="" className="w-48 h-48" />
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT DOOR (carries right half of the scene) */}
            <div
              data-testid="intro-door-right"
              className="absolute inset-y-0 right-0 w-1/2 overflow-hidden z-40 pointer-events-none"
              style={{
                transform: `translateX(${doorProgress * 100}%)`,
                transition: isFastForward ? 'transform 0.85s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
                boxShadow: 'inset 15px 0 35px rgba(255, 209, 102, 0.4), inset 4px 0 10px #ffffff',
              }}
            >
              <div className="absolute inset-y-0 -left-[100vw] w-[200vw] h-full pointer-events-none">
                {snapshotUrl ? (
                  <img src={snapshotUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[#05040a] flex items-center justify-center">
                    <img src="/brand/aanvi-logo.svg" alt="" className="w-48 h-48" />
                  </div>
                )}
              </div>
            </div>

            {/* VERTICAL LIGHT FLARE SEAM (shines through the opening seam) */}
            {doorProgress < 0.98 && (
              <div
                data-testid="door-seam-flare"
                className="absolute inset-y-0 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
                style={{
                  width: `${Math.max(3, (1.0 - doorProgress) * 20)}px`,
                  opacity: Math.sin(doorProgress * Math.PI),
                  background: 'linear-gradient(to bottom, #ffffff, #ffe27a, #ffffff)',
                  boxShadow:
                    '0 0 25px #ffffff, 0 0 60px #ffd166, 0 0 120px #ff6b57, 0 0 180px #7b4bff',
                }}
              />
            )}
          </>
        )}

        {/* ===================================================================
            LIVE 3D SCENE & OVERLAYS (Active while doors are closed: 0.0s to 7.3s)
            =================================================================== */}
        {doorProgress === 0 && (
          <div className="absolute inset-0 z-30 pointer-events-none">
            <ThreeDIntroCanvas
              onTimelineProgress={(t) => setCurrentTime(t)}
              onSnapshotReady={(url) => setSnapshotUrl(url)}
              lang={lang}
              qualityOverride={qualityOverride}
            />

            {/* Localized Tagline below the extruded wordmark (6.4s – 7.3s) */}
            {currentTime >= 6.4 && currentTime < 7.3 && (
              <div className="absolute bottom-16 sm:bottom-24 inset-x-0 z-30 flex flex-col items-center text-center px-6">
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="text-base sm:text-xl font-bold tracking-wide text-amber-200 font-display drop-shadow-[0_2px_12px_rgba(255,209,102,0.6)]"
                >
                  {tagline}
                </motion.p>
              </div>
            )}
          </div>
        )}

        {/* ===================================================================
            CONTROLS: Top-Corner Speaker Icon & Bottom-Right Skip Button
            (NO tap-to-begin screen, NO language buttons anywhere in intro)
            =================================================================== */}
        <div className="absolute top-5 right-5 z-50 flex items-center gap-2.5 bg-black/40 border border-white/20 px-3 py-1.5 rounded-full backdrop-blur-md shadow-lg">
          {/* Speaker / Unmute Button (Always available, highlighted when muted to invite click) */}
          <button
            type="button"
            data-testid="splash-sound-toggle"
            onClick={async () => {
              if (soundEnabled && !soundBlocked) {
                if (audioSynthRef.current) audioSynthRef.current.stop();
                setSoundEnabled(false);
                toggleSound();
              } else {
                if (audioSynthRef.current) {
                  await audioSynthRef.current.resume();
                  await audioSynthRef.current.start(currentTimeRef.current || currentTime || 0);
                }
                setSoundEnabled(true);
                setSoundBlocked(false);
                if (!sound) toggleSound();
              }
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-white hover:text-amber-300 transition-all font-mono text-xs"
            title={soundEnabled && !soundBlocked ? 'Audio is ON (Click to Mute)' : 'Audio is MUTED (Click to UNMUTE)'}
          >
            {soundEnabled && !soundBlocked ? (
              <>
                <Volume2 className="w-4 h-4 text-amber-300 animate-pulse" data-testid="sound-icon-unmuted" />
                <span className="text-[11px] text-amber-200 hidden sm:inline">Audio ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-white/70" data-testid="sound-icon-muted" />
                <span className="text-[11px] text-white/90 underline font-bold">Click to Unmute</span>
              </>
            )}
          </button>

          {/* Volume slider scaling from master level (default 80%) */}
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setVolume(val);
              audioSynthRef.current?.setVolume(val);
            }}
            data-testid="splash-volume-slider"
            className="w-16 h-1.5 accent-amber-400 bg-white/20 rounded-lg cursor-pointer"
            title={`Volume: ${Math.round(volume * 100)}%`}
          />
        </div>

        {/* Subtle "Skip" button in bottom right, appears after 1 second */}
        {showSkip && doorProgress === 0 && (
          <div className="absolute bottom-6 right-6 z-50">
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              type="button"
              data-testid="splash-skip-button"
              onPointerDown={(e) => {
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleSkipToDoors();
              }}
              className="px-4 py-2 rounded-full bg-white/15 hover:bg-white/25 text-white font-mono text-xs font-bold border border-white/25 backdrop-blur-md flex items-center gap-1.5 transition-all shadow-lg hover:scale-105"
            >
              <span>Skip</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
            </motion.button>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
}
