'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Sun, Moon, Volume2, VolumeX, Sparkles, Palette } from 'lucide-react';
import { useThemeStore } from '@/stores/useThemeStore';
import ColorButtonCSS from './ColorButtonCSS';

interface ThemeControlsProps {
  className?: string;
  showLightDark?: boolean;
  showSound?: boolean;
  showIntroButton?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function ThemeControls({
  className = '',
  showLightDark = true,
  showSound = false,
  showIntroButton = true,
  size = 'md',
}: ThemeControlsProps) {
  const [mounted, setMounted] = useState(false);
  const { theme, toggleTheme, sound, toggleSound, replayIntro } = useThemeStore();
  const themeBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleThemeToggle = (e: React.MouseEvent) => {
    const rect = themeBtnRef.current?.getBoundingClientRect();
    const x = rect ? rect.left + rect.width / 2 : e.clientX;
    const y = rect ? rect.top + rect.height / 2 : e.clientY;

    toggleTheme(undefined, x, y);
  };

  const isLight = mounted ? theme === 'light' : false;
  const isSoundOn = mounted ? sound : true;

  const padClass = size === 'sm' ? 'px-2.5 py-1 text-[11px]' : size === 'lg' ? 'px-4 py-2 text-xs' : 'px-3 py-1.5 text-xs';
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5';

  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      {/* 1. Black & White / Light-Dark Toggle Button */}
      {showLightDark && (
        <button
          ref={themeBtnRef}
          type="button"
          onClick={handleThemeToggle}
          aria-label={`Toggle dark/light mode. Currently: ${theme}`}
          title={`Switch to ${isLight ? 'Black / Dark' : 'White / Light'} mode`}
          className={`flex items-center gap-1.5 rounded-2xl border font-bold shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] ${padClass} ${
            isLight
              ? 'bg-white text-gray-900 border-gray-300 hover:bg-gray-100 shadow-md ring-1 ring-black/5'
              : 'bg-[#121614] text-gray-100 border-white/15 hover:bg-[#1B211E] hover:border-white/25'
          }`}
        >
          {isLight ? (
            <>
              <Sun className={`${iconSize} text-amber-500 fill-amber-500`} />
              <span className="font-mono text-[11px] font-extrabold uppercase tracking-wide">Light</span>
            </>
          ) : (
            <>
              <Moon className={`${iconSize} text-purple-400 fill-purple-400`} />
              <span className="font-mono text-[11px] font-extrabold uppercase tracking-wide">Dark</span>
            </>
          )}
        </button>
      )}

      {/* 2. Color Palette Change Button (Real-time reactive CSS 3D button) */}
      <ColorButtonCSS size={size} />

      {/* 3. Replay 3D Intro Button */}
      {showIntroButton && (
        <button
          type="button"
          onClick={() => replayIntro()}
          aria-label="Replay 3D Intro Experience"
          title="Watch 3D Brand Intro Animation & Audio"
          className={`flex items-center gap-1.5 rounded-2xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] hover:border-[var(--primary)] text-[var(--text-main)] transition-all shadow-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--primary)] ${padClass}`}
        >
          <Sparkles className={`${iconSize} text-amber-400`} />
          <span className="hidden sm:inline font-mono text-[11px] font-bold">Intro</span>
        </button>
      )}

      {/* 4. Sound Toggle */}
      {showSound && (
        <button
          type="button"
          onClick={() => toggleSound()}
          aria-label={`Toggle sound effects. Currently: ${isSoundOn ? 'Enabled' : 'Muted'}`}
          title={isSoundOn ? 'Mute audio' : 'Enable audio feedback'}
          className={`p-2 rounded-2xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]`}
        >
          {isSoundOn ? (
            <Volume2 className={`${iconSize} text-amber-400`} />
          ) : (
            <VolumeX className={`${iconSize} text-[var(--text-muted)]`} />
          )}
        </button>
      )}
    </div>
  );
}
