'use client';

import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Palette } from 'lucide-react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useAuthStore } from '@/stores/useAuthStore';

interface ColorButtonCSSProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function ColorButtonCSS({ className = '', size = 'md' }: ColorButtonCSSProps) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const { palette, togglePalette, reducedMotion } = useThemeStore();
  const { mode } = useAuthStore();
  const [isPressed, setIsPressed] = useState(false);

  const isExplorer = mode === 'explorer';
  const colorA = isExplorer ? '#FF6B57' : '#0E9F6E'; // Coral / Emerald
  const colorB = isExplorer ? '#7B4BFF' : '#F59E0B'; // Purple / Amber

  const activeColor = palette === 'a' ? colorA : colorB;
  const secondaryColor = palette === 'a' ? colorB : colorA;

  const paletteLabel = isExplorer
    ? palette === 'a'
      ? 'Coral'
      : 'Purple'
    : palette === 'a'
    ? 'Emerald'
    : 'Amber';

  const handleClick = (e: React.MouseEvent) => {
    const rect = buttonRef.current?.getBoundingClientRect();
    const x = rect ? rect.left + rect.width / 2 : e.clientX;
    const y = rect ? rect.top + rect.height / 2 : e.clientY;

    togglePalette(x, y);
  };

  const padClass = size === 'sm' ? 'px-2.5 py-1 text-[10px]' : size === 'lg' ? 'px-4 py-2 text-xs' : 'px-3.5 py-1.5 text-[11px]';

  return (
    <motion.button
      ref={buttonRef}
      type="button"
      aria-label={`Toggle color theme. Currently: ${paletteLabel}`}
      aria-pressed={palette === 'b'}
      title={`CSS 3D Palette Switcher: Active ${paletteLabel}`}
      onClick={handleClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      whileHover={{ scale: reducedMotion ? 1 : 1.05 }}
      whileTap={{ scale: reducedMotion ? 1 : 0.94 }}
      className={`relative group cursor-pointer p-0.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-app)] select-none ${className}`}
      style={{ perspective: 600 }}
    >
      {/* 3D Drop Shadow Base */}
      <div
        className="absolute inset-0 rounded-2xl transition-all duration-200"
        style={{
          background: isPressed ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.45)',
          transform: isPressed ? 'translateY(1px)' : 'translateY(4px)',
          filter: 'blur(2px)',
        }}
      />

      {/* 3D Button Bezel & Body */}
      <div
        className={`relative ${padClass} rounded-2xl flex items-center gap-2 border transition-all duration-150 font-bold`}
        style={{
          background: isPressed
            ? `linear-gradient(180deg, ${activeColor}dd 0%, ${activeColor} 100%)`
            : `linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.05) 40%, rgba(0,0,0,0.2) 100%), ${activeColor}`,
          borderColor: 'rgba(255, 255, 255, 0.4)',
          boxShadow: isPressed
            ? 'inset 0 2px 4px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.2)'
            : `inset 0 1px 1px rgba(255,255,255,0.6), 0 4px 10px ${activeColor}55`,
          transform: isPressed ? 'translateY(3px)' : 'translateY(0px)',
          color: '#FFFFFF',
        }}
      >
        {/* Dual Color Swatch Indicator */}
        <div className="flex items-center -space-x-1">
          <span
            className="w-3.5 h-3.5 rounded-full border border-white/80 shadow-sm transition-transform group-hover:scale-110"
            style={{ backgroundColor: activeColor }}
          />
          <span
            className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-sm opacity-80"
            style={{ backgroundColor: secondaryColor }}
          />
        </div>

        <span className="font-mono tracking-wide uppercase font-black text-white drop-shadow-sm">
          {paletteLabel}
        </span>

        <Palette className="w-3 h-3 text-white/90 group-hover:rotate-45 transition-transform" />
      </div>
    </motion.button>
  );
}
