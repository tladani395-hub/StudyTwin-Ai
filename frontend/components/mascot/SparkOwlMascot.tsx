'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, MessageCircle, X } from 'lucide-react';
import confetti from 'canvas-confetti';

export type MascotMood =
  | 'idle'
  | 'happy'
  | 'excited'
  | 'thinking'
  | 'sleepy'
  | 'proud'
  | 'sad_encouraging'
  | 'celebrating';

interface SparkOwlMascotProps {
  mood?: MascotMood;
  speechText?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSpeech?: boolean;
  onMascotClick?: () => void;
  className?: string;
}

export default function SparkOwlMascot({
  mood = 'idle',
  speechText = "Hi! I'm Aanvi, your AI learning buddy! Let's explore together! ✨",
  size = 'md',
  showSpeech = true,
  onMascotClick,
  className = '',
}: SparkOwlMascotProps) {
  const [bubbleOpen, setBubbleOpen] = useState(showSpeech);
  const [currentMood, setCurrentMood] = useState<MascotMood>(mood);

  useEffect(() => {
    setCurrentMood(mood);
  }, [mood]);

  const sizeDimensions = {
    sm: 'w-14 h-14',
    md: 'w-20 h-20',
    lg: 'w-28 h-28',
    xl: 'w-36 h-36',
  }[size];

  const handleMascotClick = () => {
    setCurrentMood('celebrating');
    try {
      confetti({
        particleCount: 30,
        spread: 70,
        origin: { y: 0.8 },
        colors: ['#FF6B57', '#7B4BFF', '#FFB800'],
      });
    } catch {}

    if (onMascotClick) {
      onMascotClick();
    }

    setTimeout(() => {
      setCurrentMood('idle');
    }, 2200);
  };

  // Get animation and eye style per mood
  const getMoodAnimation = () => {
    switch (currentMood) {
      case 'excited':
      case 'celebrating':
        return {
          y: [0, -14, 0, -10, 0],
          rotate: [0, -6, 6, -4, 0],
          scale: [1, 1.08, 1, 1.05, 1],
          transition: { duration: 0.7, repeat: Infinity, ease: 'easeInOut' },
        };
      case 'happy':
      case 'proud':
        return {
          y: [0, -6, 0],
          rotate: [0, 3, -3, 0],
          transition: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' },
        };
      case 'thinking':
        return {
          rotate: [0, 10, 0, -4, 0],
          y: [0, -3, 0],
          transition: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' },
        };
      case 'sleepy':
        return {
          rotate: [0, 5, 0],
          scale: [1, 0.96, 1],
          transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
        };
      case 'sad_encouraging':
        return {
          y: [0, 3, 0],
          rotate: [-3, 3, -3],
          transition: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
        };
      default: // idle
        return {
          y: [0, -5, 0],
          transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
        };
    }
  };

  return (
    <div className={`relative flex items-center gap-3 select-none ${className}`}>
      {/* Interactive Mascot Avatar */}
      <motion.div
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        onClick={handleMascotClick}
        className={`relative ${sizeDimensions} cursor-pointer flex-shrink-0`}
        title="Tap Aanvi for a cheer!"
      >
        {/* Glow halo */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-[#FF6B57]/40 to-[#7B4BFF]/40 filter blur-lg animate-pulse" />

        <motion.div
          animate={getMoodAnimation()}
          className="relative w-full h-full p-1.5 rounded-3xl bg-gradient-to-b from-[#2A1D44] to-[#1E1530] border-2 border-[#FF6B57] shadow-xl flex items-center justify-center overflow-hidden"
        >
          {/* Authentic Aanvi Winged Mascot Mark from /brand */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentMood === 'happy' || currentMood === 'celebrating' || currentMood === 'proud' ? '/brand/aanvi-logo-happy.svg' : '/brand/aanvi-mark.svg'}
            alt="Aanvi Mascot Mark"
            className="w-full h-full object-contain filter drop-shadow(0 2px 8px rgba(255,107,87,0.3))"
          />
        </motion.div>
      </motion.div>

      {/* Comic Speech Bubble */}
      <AnimatePresence>
        {bubbleOpen && speechText && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: -10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: -10 }}
            className="relative p-3.5 rounded-2xl bg-[#FFF8EC] dark:bg-[#2A1D44] border-2 border-[#FF6B57] text-[#2D1B4E] dark:text-white text-xs sm:text-sm font-semibold shadow-lg max-w-xs sm:max-w-sm"
          >
            {/* Bubble Tail */}
            <div className="absolute left-0 top-1/2 -translate-x-2 -translate-y-1/2 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-[#FF6B57]" />

            <div className="flex items-start justify-between gap-2">
              <p className="leading-snug">{speechText}</p>
              <button
                type="button"
                onClick={() => setBubbleOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
