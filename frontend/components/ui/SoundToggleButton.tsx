'use client';

import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useThemeStore } from '@/stores/useThemeStore';

interface SoundToggleProps {
  compact?: boolean;
  className?: string;
}

export default function SoundToggleButton({ compact = false, className = '' }: SoundToggleProps) {
  const { sound, toggleSound } = useThemeStore();

  return (
    <button
      type="button"
      onClick={() => toggleSound()}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border-subtle bg-bg-surface hover:bg-bg-elevated text-xs font-semibold transition-all shadow-sm active:scale-95 ${
        sound ? 'text-amber-400 border-amber-400/40 bg-amber-400/10' : 'text-text-muted'
      } ${className}`}
      title={sound ? 'Sound is Unmuted (Click to Mute)' : 'Sound is Muted (Click to Unmute)'}
      aria-label={sound ? 'Mute sound' : 'Unmute sound'}
    >
      {sound ? (
        <>
          <Volume2 className="w-3.5 h-3.5 text-amber-400" />
          {!compact && <span className="font-mono text-[11px] text-text-main">Audio ON</span>}
        </>
      ) : (
        <>
          <VolumeX className="w-3.5 h-3.5 text-text-muted" />
          {!compact && <span className="font-mono text-[11px] text-text-muted">Unmute</span>}
        </>
      )}
    </button>
  );
}
