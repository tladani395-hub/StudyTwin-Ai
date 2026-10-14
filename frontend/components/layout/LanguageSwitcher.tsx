'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Languages, Check, ChevronDown } from 'lucide-react';
import { useAuthStore, PreferredLanguage } from '@/stores/useAuthStore';

interface LanguageSwitcherProps {
  compact?: boolean;
}

export default function LanguageSwitcher({ compact = false }: LanguageSwitcherProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, updateUser } = useAuthStore();

  const currentLang: PreferredLanguage = (user?.preferred_language as PreferredLanguage) || 'English';

  const languages: { code: PreferredLanguage; label: string; native: string }[] = [
    { code: 'English', label: 'English', native: 'English' },
    { code: 'Hindi', label: 'Hindi', native: 'हिन्दी' },
    { code: 'Gujarati', label: 'Gujarati', native: 'ગુજરાતી' },
  ];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectLanguage = (lang: PreferredLanguage) => {
    updateUser({ preferred_language: lang });
    if (typeof window !== 'undefined') {
      localStorage.setItem('aanvi_preferred_lang', lang);
    }
    setOpen(false);
  };

  const activeLangObj = languages.find((l) => l.code === currentLang) || languages[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl bg-bg-surface hover:bg-bg-elevated border border-border-subtle text-text-main text-xs font-semibold transition-all shadow-sm"
        title="Change application language"
      >
        <Languages className="w-3.5 h-3.5 text-primary shrink-0" />
        <span className="font-sans font-bold hidden sm:inline">{activeLangObj.native}</span>
        <span className="font-sans font-bold sm:hidden">{currentLang === 'Hindi' ? 'हि' : currentLang === 'Gujarati' ? 'ગુ' : 'EN'}</span>
        <ChevronDown className={`w-3 h-3 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 rounded-card bg-bg-surface border border-border-subtle shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-1 border-b border-border-subtle">
            <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted font-bold">
              Language / भाषा / ભાષા
            </span>
          </div>

          <div className="py-1">
            {languages.map((l) => {
              const isSelected = l.code === currentLang;
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => handleSelectLanguage(l.code)}
                  className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs transition-colors ${
                    isSelected
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'text-text-main hover:bg-bg-elevated'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-xs">{l.native}</span>
                    <span className="text-[10px] text-text-muted">{l.label}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
