'use client';

import { create } from 'zustand';
import { api } from '@/lib/api';

export type AppTheme = 'light' | 'dark' | 'system';
export type AppPalette = 'a' | 'b' | 'primary' | 'secondary';

interface ThemeState {
  theme: AppTheme;
  palette: 'a' | 'b';
  sound: boolean;
  soundEffects: boolean; // Alias for backward compatibility
  reducedMotion: boolean;
  voiceTutorAutoSpeak: boolean;
  introEveryVisit: boolean;
  introPlayed: boolean;
  showIntro: boolean;
  updatedAt: string | null;
  isSyncing: boolean;

  setTheme: (theme: AppTheme, userId?: number | any, originX?: number, originY?: number) => void;
  toggleTheme: (userId?: number | any, originX?: number, originY?: number) => void;
  setPalette: (palette: AppPalette, userId?: number | any, originX?: number, originY?: number) => void;
  togglePalette: (originX?: number | any, originY?: number, userId?: number | any) => void;
  toggleSound: (userId?: number | any) => void;
  toggleSoundEffects: (userId?: number | any) => void; // Alias
  setReducedMotion: (enabled: boolean, userId?: number | any) => void;
  setIntroEveryVisit: (enabled: boolean, userId?: number | any) => void;
  toggleVoiceTutorAutoSpeak: () => void;
  triggerIntro: () => void;
  replayIntro: () => void;
  markIntroSeen: () => void;
  hydrateTheme: () => void;
  syncWithDB: (userId?: number | any) => Promise<void>;
  resetToDefaults: (userId?: number | any) => Promise<void>;
}

// Debounce timer for API sync
let patchDebounceTimer: NodeJS.Timeout | null = null;

// Helper to play subtle physical button sound via Web Audio API
export function playButtonSound(pitch = 520, duration = 0.05) {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(pitch * 0.7, ctx.currentTime + duration);

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {}
}

function resolveSystemTheme(theme: AppTheme): 'light' | 'dark' {
  if (theme === 'system' && typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme === 'light' ? 'light' : 'dark';
}

function applyDomAttributes(theme: AppTheme, palette: 'a' | 'b') {
  if (typeof window === 'undefined') return;
  const resolved = resolveSystemTheme(theme);
  document.documentElement.setAttribute('data-theme', resolved);
  document.documentElement.setAttribute('data-palette', palette);
  if (resolved === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

// Executes View Transitions API or CSS ripple fallback
function executeThemeTransition(
  applyFn: () => void,
  originX?: number,
  originY?: number,
  reducedMotion = false
) {
  if (typeof window === 'undefined') {
    applyFn();
    return;
  }

  // If reduced motion is requested or coordinates not provided, apply immediately
  if (reducedMotion) {
    applyFn();
    return;
  }

  // Modern View Transitions API with circular clip reveal
  const doc = document as any;
  if (typeof doc.startViewTransition === 'function' && originX !== undefined && originY !== undefined) {
    const transition = doc.startViewTransition(() => {
      applyFn();
    });

    transition.ready.then(() => {
      const maxRadius = Math.hypot(
        Math.max(originX, window.innerWidth - originX),
        Math.max(originY, window.innerHeight - originY)
      );

      doc.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${originX}px ${originY}px)`,
            `circle(${maxRadius}px at ${originX}px ${originY}px)`,
          ],
        },
        {
          duration: 450,
          easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
          pseudoElement: '::view-transition-new(root)',
        }
      );
    }).catch(() => {
      applyFn();
    });
    return;
  }

  // DOM ripple fallback if View Transitions API is not available
  if (originX !== undefined && originY !== undefined) {
    const ripple = document.createElement('div');
    ripple.className = 'color-ripple';
    ripple.style.left = `${originX}px`;
    ripple.style.top = `${originY}px`;
    ripple.style.width = '120px';
    ripple.style.height = '120px';
    ripple.style.marginLeft = '-60px';
    ripple.style.marginTop = '-60px';
    document.body.appendChild(ripple);
    setTimeout(() => ripple.remove(), 700);
  }

  applyFn();
}

export const useThemeStore = create<ThemeState>((set, get) => {
  const debouncedSyncToApi = (userId = 1, rollbackState: Partial<ThemeState>) => {
    if (patchDebounceTimer) clearTimeout(patchDebounceTimer);
    patchDebounceTimer = setTimeout(async () => {
      try {
        set({ isSyncing: true });
        const res = await api.updateSettings({
          palette: get().palette,
          theme: get().theme,
          sound_on: get().sound,
          reduced_motion: get().reducedMotion,
        }, userId);
        set({ updatedAt: res.updated_at || new Date().toISOString(), isSyncing: false });
      } catch (err) {
        console.error("Theme API PATCH failed, rolling back", err);
        set({ ...rollbackState, isSyncing: false });
        if (typeof window !== 'undefined') {
          applyDomAttributes(rollbackState.theme || get().theme, rollbackState.palette || get().palette);
        }
      }
    }, 400);
  };

  return {
    theme: 'dark',
    palette: 'a',
    sound: true,
    soundEffects: true,
    reducedMotion: false,
    introEveryVisit: true,
    voiceTutorAutoSpeak: true,
    introPlayed: false,
    showIntro: false,
    updatedAt: null,
    isSyncing: false,

    hydrateTheme: () => {
      if (typeof window === 'undefined') return;
      try {
        let thm: AppTheme = 'dark';
        let pal: 'a' | 'b' = 'a';
        let snd = true;
        let redMotion = false;

        const savedTheme = localStorage.getItem('aanvi_theme') as AppTheme;
        if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') {
          thm = savedTheme;
        }
        const savedPal = localStorage.getItem('aanvi_palette');
        if (savedPal === 'b' || savedPal === 'secondary') {
          pal = 'b';
        }
        const rawSound = localStorage.getItem('aanvi_sound');
        snd = rawSound !== null ? rawSound === 'true' : true;
        redMotion = localStorage.getItem('aanvi_reduced_motion') === 'true' ||
          window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const rawIntroEvery = localStorage.getItem('aanvi_intro_every_visit');
        const introEvery = rawIntroEvery !== null ? rawIntroEvery === 'true' : true;

        applyDomAttributes(thm, pal);

        set({
          theme: thm,
          palette: pal,
          sound: snd,
          soundEffects: snd,
          reducedMotion: redMotion,
          introEveryVisit: introEvery,
        });

        // Live listener for system dark/light changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleSystemChange = () => {
          const currentTheme = get().theme;
          if (currentTheme === 'system') {
            applyDomAttributes('system', get().palette);
          }
        };
        try {
          mediaQuery.addEventListener('change', handleSystemChange);
        } catch {
          mediaQuery.addListener(handleSystemChange);
        }
      } catch {}
    },

    setTheme: (theme, userId = 1, originX, originY) => {
      const prevTheme = get().theme;
      if (get().sound) playButtonSound(580);

      executeThemeTransition(() => {
        if (typeof window !== 'undefined') {
          applyDomAttributes(theme, get().palette);
          localStorage.setItem('aanvi_theme', theme);
        }
      }, originX, originY, get().reducedMotion);

      set({ theme });
      debouncedSyncToApi(userId, { theme: prevTheme });
    },

    toggleTheme: (userId = 1, originX, originY) => {
      const current = get().theme;
      const next: AppTheme = current === 'dark' ? 'light' : 'dark';
      get().setTheme(next, userId, originX, originY);
    },

    setPalette: (palInput, userId = 1, originX, originY) => {
      const prevPalette = get().palette;
      const palette: 'a' | 'b' = (palInput === 'b' || palInput === 'secondary') ? 'b' : 'a';

      if (get().sound) playButtonSound(palette === 'a' ? 520 : 650);

      executeThemeTransition(() => {
        if (typeof window !== 'undefined') {
          applyDomAttributes(get().theme, palette);
          localStorage.setItem('aanvi_palette', palette);
        }
      }, originX, originY, get().reducedMotion);

      set({ palette });
      debouncedSyncToApi(userId, { palette: prevPalette });
    },

    togglePalette: (originX, originY, userId = 1) => {
      const current = get().palette;
      const nextPalette: 'a' | 'b' = current === 'a' ? 'b' : 'a';
      const prevPalette = current;

      if (get().sound) playButtonSound(nextPalette === 'a' ? 520 : 650);

      executeThemeTransition(() => {
        if (typeof window !== 'undefined') {
          applyDomAttributes(get().theme, nextPalette);
          localStorage.setItem('aanvi_palette', nextPalette);
        }
      }, originX, originY, get().reducedMotion);

      set({ palette: nextPalette });
      debouncedSyncToApi(userId, { palette: prevPalette });
    },

    toggleSound: (userId = 1) => {
      const nextSound = !get().sound;
      if (typeof window !== 'undefined') {
        localStorage.setItem('aanvi_sound', String(nextSound));
        if (nextSound) playButtonSound(700);
      }
      set({ sound: nextSound, soundEffects: nextSound });
      debouncedSyncToApi(userId, { sound: nextSound, soundEffects: nextSound });
    },

    toggleSoundEffects: (userId = 1) => {
      get().toggleSound(userId);
    },

    setReducedMotion: (reducedMotion, userId = 1) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('aanvi_reduced_motion', String(reducedMotion));
      }
      set({ reducedMotion });
      debouncedSyncToApi(userId, { reducedMotion: !reducedMotion });
    },

    setIntroEveryVisit: (enabled, userId = 1) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('aanvi_intro_every_visit', String(enabled));
      }
      set({ introEveryVisit: enabled });
      debouncedSyncToApi(userId, { introEveryVisit: !enabled });
    },

    toggleVoiceTutorAutoSpeak: () =>
      set((state) => ({ voiceTutorAutoSpeak: !state.voiceTutorAutoSpeak })),

    triggerIntro: () => {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('aanvi_intro_seen');
        sessionStorage.removeItem('aanvi_intro_finished');
        localStorage.removeItem('aanvi_intro_finished');
      }
      set({ introPlayed: false, showIntro: true });
    },

    replayIntro: () => {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('aanvi_intro_seen');
        sessionStorage.removeItem('aanvi_intro_finished');
        localStorage.removeItem('aanvi_intro_finished');
      }
      set({ introPlayed: false, showIntro: true });
    },

    markIntroSeen: () => {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('aanvi_intro_seen', 'true');
      }
      set({ introPlayed: true, showIntro: false });
    },

    syncWithDB: async (userId = 1) => {
      try {
        set({ isSyncing: true });
        const dbSettings = await api.getSettings(userId);
        if (dbSettings) {
          const pal: 'a' | 'b' = dbSettings.palette === 'b' ? 'b' : 'a';
          const thm: AppTheme = (dbSettings.theme === 'light' || dbSettings.theme === 'dark' || dbSettings.theme === 'system')
            ? dbSettings.theme
            : 'dark';

          if (typeof window !== 'undefined') {
            applyDomAttributes(thm, pal);
            localStorage.setItem('aanvi_theme', thm);
            localStorage.setItem('aanvi_palette', pal);
            localStorage.setItem('aanvi_sound', String(dbSettings.sound_on));
            localStorage.setItem('aanvi_reduced_motion', String(dbSettings.reduced_motion));
          }

          set({
            palette: pal,
            theme: thm,
            sound: Boolean(dbSettings.sound_on),
            soundEffects: Boolean(dbSettings.sound_on),
            reducedMotion: Boolean(dbSettings.reduced_motion),
            updatedAt: dbSettings.updated_at || new Date().toISOString(),
            isSyncing: false,
          });
        }
      } catch (err) {
        console.warn("DB settings sync error:", err);
        set({ isSyncing: false });
      }
    },

    resetToDefaults: async (userId = 1) => {
      if (typeof window !== 'undefined') {
        applyDomAttributes('dark', 'a');
        localStorage.setItem('aanvi_theme', 'dark');
        localStorage.setItem('aanvi_palette', 'a');
        localStorage.setItem('aanvi_sound', 'false');
        localStorage.setItem('aanvi_reduced_motion', 'false');
      }
      set({
        palette: 'a',
        theme: 'dark',
        sound: false,
        soundEffects: false,
        reducedMotion: false,
      });
      debouncedSyncToApi(userId, {});
    },
  };
});
