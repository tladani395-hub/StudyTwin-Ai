'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/useAuthStore';
import { useThemeStore } from '@/stores/useThemeStore';

interface AanviLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  variant?: 'mark' | 'full';
  showText?: boolean;
  animated?: boolean;
  className?: string;
}

export default function AanviLogo({
  size = 'md',
  variant,
  showText,
  animated = false,
  className = '',
}: AanviLogoProps) {
  const { mode } = useAuthStore();
  const { palette } = useThemeStore();

  const shouldShowText = showText !== undefined ? showText : variant !== 'mark';

  const isExplorer = mode === 'explorer';
  const sizeMap = {
    sm: { box: 28, text: 'text-base', sub: 'text-[9px]' },
    md: { box: 38, text: 'text-xl', sub: 'text-[10px]' },
    lg: { box: 54, text: 'text-2xl', sub: 'text-xs' },
    xl: { box: 80, text: 'text-4xl', sub: 'text-sm' },
  };

  const box = typeof size === 'number' ? size : (sizeMap[size]?.box || 38);
  const text = typeof size === 'number' ? (size > 48 ? 'text-2xl' : 'text-xl') : (sizeMap[size]?.text || 'text-xl');
  const sub = typeof size === 'number' ? (size > 48 ? 'text-xs' : 'text-[10px]') : (sizeMap[size]?.sub || 'text-[10px]');
  const gradId = typeof size === 'number' ? `num_${size}` : size;

  const primaryColor = 'var(--primary)';
  const secondaryColor = 'var(--secondary)';
  const starColor = 'var(--accent, #FFB800)';

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Aanvi Mascot Mark */}
      <motion.div
        whileHover={animated ? { scale: 1.08, rotate: [0, -3, 3, 0] } : {}}
        transition={{ duration: 0.3 }}
        style={{ width: box, height: box }}
        className="relative flex-shrink-0"
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full filter drop-shadow-[0_0_12px_rgba(255,107,87,0.35)]"
        >
          <defs>
            <linearGradient id={`aanviLogoGrad_${gradId}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--primary)" />
              <stop offset="60%" stopColor="var(--secondary)" />
              <stop offset="100%" stopColor="var(--accent, #FFB800)" />
            </linearGradient>
            <filter id={`logoGlow_${gradId}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="glow" />
              <feComposite in="SourceGraphic" in2="glow" operator="over" />
            </filter>
          </defs>

          {/* Winged Moth-Like Shield Body Fill */}
          <path
            d="M 50 24 C 41 24, 26 32, 20 44 C 15 54, 16 67, 27 76 C 35 82.5, 43 79, 50 71 C 57 79, 65 82.5, 73 76 C 84 67, 85 54, 80 44 C 74 32, 59 24, 50 24 Z"
            fill="var(--bg-card, #1A1132)"
            opacity="0.8"
          />

          {/* Crossing Arrow-Tipped Antennae */}
          {/* Left antenna up-right */}
          <path
            d="M 47 25 C 46 19, 48 15, 53 11.5 L 60 6.5"
            stroke={`url(#aanviLogoGrad_${gradId})`}
            strokeWidth="2.6"
            strokeLinecap="round"
            fill="none"
          />
          <polygon
            points="60,4.5 61.5,8.5 57.5,7"
            fill="var(--primary)"
          />

          {/* Right antenna up-left */}
          <path
            d="M 53 25 C 54 19, 52 15, 47 11.5 L 40 6.5"
            stroke={`url(#aanviLogoGrad_${gradId})`}
            strokeWidth="2.6"
            strokeLinecap="round"
            fill="none"
          />
          <polygon
            points="40,4.5 38.5,8.5 42.5,7"
            fill="var(--secondary)"
          />

          {/* Outer Mascot Body Outline */}
          <path
            d="M 50 24 C 41 24, 26 32, 20 44 C 15 54, 16 67, 27 76 C 35 82.5, 43 79, 50 71 C 57 79, 65 82.5, 73 76 C 84 67, 85 54, 80 44 C 74 32, 59 24, 50 24 Z"
            stroke={`url(#aanviLogoGrad_${gradId})`}
            strokeWidth="4.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            filter={`url(#logoGlow_${gradId})`}
          />

          {/* Soft Pink Cheek Dots */}
          <circle cx="35" cy="52" r="3.8" fill="#FF7597" opacity="0.85" />
          <circle cx="65" cy="52" r="3.8" fill="#FF7597" opacity="0.85" />

          {/* Center Glowing Orange Orb */}
          <circle cx="50" cy="42" r="7.5" fill="#160E26" stroke={`url(#aanviLogoGrad_${gradId})`} strokeWidth="1.8" />
          <circle cx="50" cy="42" r="4.8" fill="var(--accent, #FFB800)" filter={`url(#logoGlow_${gradId})`} />
          <circle cx="52.2" cy="40.2" r="1.4" fill="#FFFFFF" />

          {/* Glowing Smile Line */}
          <path
            d="M 45 54 Q 50 59 55 54"
            stroke="var(--accent, #FFB800)"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />
        </svg>

      </motion.div>

      {/* Typography */}
      {shouldShowText && (
        <div className="flex flex-col">
          <span className={`font-display font-black tracking-tight text-[var(--text-main)] leading-none ${text}`}>
            Aanvi
          </span>
          <span className={`font-mono font-bold tracking-widest text-[var(--primary)] uppercase mt-0.5 ${sub}`}>
            {isExplorer ? 'Explorer World' : 'Focus Studio'}
          </span>
        </div>
      )}
    </div>
  );
}
