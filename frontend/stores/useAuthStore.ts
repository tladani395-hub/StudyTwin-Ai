'use client';

import { create } from 'zustand';

export type UserMode = 'explorer' | 'scholar';
export type PreferredLanguage = 'English' | 'Hindi' | 'Gujarati';

export interface UserProfile {
  id: string | number;
  name: string;
  email: string;
  age: number;
  dob?: string;
  grade?: string;
  preferred_language: PreferredLanguage;
  guardian_email?: string;
  guardian_consent: boolean;
  mode: UserMode;
  xp: number;
  stars: number;
  level: number;
  streak_days: number;
  child_safety_enabled: boolean;
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  mode: UserMode;
  setAuth: (user: UserProfile, token: string) => void;
  setMode: (mode: UserMode) => void;
  updateUser: (partial: Partial<UserProfile>) => void;
  addXP: (amount: number) => void;
  addStars: (amount: number) => void;
  logout: () => void;
  hydrateAuth: () => void;
}

// Utility to mask email for COPPA and privacy compliance
export function maskEmail(email?: string): string {
  if (!email || !email.includes('@')) return 'g***@example.com';
  const [userPart, domain] = email.split('@');
  if (userPart.length <= 2) return `${userPart[0]}***@${domain}`;
  return `${userPart[0]}***${userPart[userPart.length - 1]}@${domain}`;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  mode: 'scholar',

  hydrateAuth: () => {
    if (typeof window === 'undefined') return;
    try {
      const savedUser = localStorage.getItem('aanvi_user');
      const savedToken = localStorage.getItem('aanvi_token');
      if (savedUser && savedToken) {
        const parsed = JSON.parse(savedUser);
        if (parsed) {
          // Strictly enforce age <= 16 as explorer, age > 16 as scholar
          const determinedMode: UserMode = parsed.age !== undefined
            ? (parsed.age <= 16 ? 'explorer' : 'scholar')
            : (parsed.mode || 'scholar');
          parsed.mode = determinedMode;
          set({
            user: parsed,
            token: savedToken,
            isAuthenticated: true,
            mode: determinedMode,
          });
          return;
        }
      } else {
        // Clear any orphan or unauthenticated partial state
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          mode: 'scholar',
        });
      }
    } catch {
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        mode: 'scholar',
      });
    }
  },

  setAuth: (user, token) =>
    set(() => {
      // Strictly lock mode by age: age <= 16 -> explorer, age > 16 -> scholar
      const determinedMode: UserMode = user.age !== undefined
        ? (user.age <= 16 ? 'explorer' : 'scholar')
        : (user.mode || 'scholar');
      user.mode = determinedMode;

      if (typeof window !== 'undefined') {
        localStorage.setItem('aanvi_token', token);
        localStorage.setItem('aanvi_user', JSON.stringify(user));
        localStorage.setItem('aanvi_mode', determinedMode);
        document.documentElement.setAttribute('data-mode', determinedMode);
      }
      return {
        user,
        token,
        isAuthenticated: true,
        mode: determinedMode,
      };
    }),

  setMode: (mode) =>
    set((state) => {
      // Strictly enforce mode based on age: age <= 16 locked to explorer, age > 16 locked to scholar
      if (state.user && state.user.age !== undefined) {
        if (state.user.age <= 16 && mode === 'scholar') {
          console.warn('Strict Mode Lock: Student age <= 16 is permanently locked to Explorer Mode');
          return state;
        }
        if (state.user.age > 16 && mode === 'explorer') {
          console.warn('Strict Mode Lock: Student age > 16 is permanently locked to Scholar Mode');
          return state;
        }
      }

      const updatedUser = state.user ? { ...state.user, mode } : null;
      if (typeof window !== 'undefined') {
        if (updatedUser) localStorage.setItem('aanvi_user', JSON.stringify(updatedUser));
        localStorage.setItem('aanvi_mode', mode);
        document.documentElement.setAttribute('data-mode', mode);
      }
      return { mode, user: updatedUser };
    }),

  updateUser: (partial) =>
    set((state) => {
      if (!state.user) return state;
      const updatedUser = { ...state.user, ...partial };
      if (typeof window !== 'undefined') {
        localStorage.setItem('aanvi_user', JSON.stringify(updatedUser));
      }
      return {
        user: updatedUser,
        mode: partial.mode || state.mode,
      };
    }),

  addXP: (amount) =>
    set((state) => {
      if (!state.user) return state;
      const newXP = state.user.xp + amount;
      const newLevel = Math.floor(newXP / 500) + 1;
      const updatedUser = { ...state.user, xp: newXP, level: newLevel };
      return { user: updatedUser };
    }),

  addStars: (amount) =>
    set((state) => {
      if (!state.user) return state;
      const updatedUser = { ...state.user, stars: state.user.stars + amount };
      return { user: updatedUser };
    }),

  logout: () =>
    set(() => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('aanvi_token');
        localStorage.removeItem('aanvi_user');
      }
      return {
        user: null,
        token: null,
        isAuthenticated: false,
        mode: 'scholar',
      };
    }),
}));
