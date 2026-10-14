'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useAuthStore, UserProfile as StoreUserProfile } from '@/stores/useAuthStore';
import { useThemeStore } from '@/stores/useThemeStore';

export type AgeGroup = 'junior' | 'senior';

export interface UserProfile {
  name: string;
  email: string;
  age: number;
  ageGroup: AgeGroup;
  xp: number;
  level: number;
  coins: number;
  streak: number;
  badges: string[];
}

interface AuthContextType {
  user: UserProfile;
  isLoggedIn: boolean;
  isJunior: boolean;
  isSenior: boolean;
  login: (name: string, email: string, age: number) => void;
  signup: (name: string, email: string, age: number) => void;
  logout: () => void;
  setAge: (age: number) => void;
  addXp: (amount: number) => void;
  toggleAgeGroup: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: storeUser, isAuthenticated, setAuth, setMode, updateUser, addXP, logout: storeLogout, hydrateAuth } = useAuthStore();
  const { hydrateTheme } = useThemeStore();

  useEffect(() => {
    hydrateAuth();
    hydrateTheme();
  }, [hydrateAuth, hydrateTheme]);

  const userAge = storeUser?.age || 16;
  const isJunior = storeUser?.mode === 'explorer' || userAge <= 15;
  const isSenior = !isJunior;

  const user: UserProfile = {
    name: storeUser?.name || 'Guest',
    email: storeUser?.email || '',
    age: userAge,
    ageGroup: isJunior ? 'junior' : 'senior',
    xp: storeUser?.xp || 0,
    level: storeUser?.level || 1,
    coins: (storeUser?.stars || 0) * 10,
    streak: storeUser?.streak_days || 0,
    badges: storeUser ? ['⚡ Fast Thinker', '🌲 Tree Master', '🔍 Binary Sleuth', '✨ Starlight Scholar'] : [],
  };

  const login = (_name: string, _email: string, _age: number) => {
    console.warn('Direct AuthContext.login is deprecated. Please authenticate via /login.');
  };

  const signup = (_name: string, _email: string, _age: number) => {
    console.warn('Direct AuthContext.signup is deprecated. Please register via /signup.');
  };

  const logout = () => {
    storeLogout();
  };

  const setAge = (age: number) => {
    const isMinor = age <= 15;
    updateUser({
      age,
      mode: isMinor ? 'explorer' : 'scholar',
      child_safety_enabled: isMinor,
    });
  };

  const toggleAgeGroup = () => {
    const nextMode = storeUser?.mode === 'explorer' ? 'scholar' : 'explorer';
    setMode(nextMode);
  };

  const addXp = (amount: number) => {
    addXP(amount);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: isAuthenticated,
        isJunior,
        isSenior,
        login,
        signup,
        logout,
        setAge,
        addXp,
        toggleAgeGroup,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    // Return a safe fallback for SSR resilience
    return {
      user: {
        name: 'Demo Scholar',
        email: 'demo.scholar@example.com',
        age: 16,
        ageGroup: 'senior' as const,
        xp: 1250,
        level: 4,
        coins: 480,
        streak: 5,
        badges: ['✨ Starlight Scholar'],
      },
      isLoggedIn: true,
      isJunior: false,
      isSenior: true,
      login: () => {},
      signup: () => {},
      logout: () => {},
      setAge: () => {},
      addXp: () => {},
      toggleAgeGroup: () => {},
    };
  }
  return context;
};
