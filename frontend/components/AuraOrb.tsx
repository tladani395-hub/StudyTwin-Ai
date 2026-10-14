'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, Camera, Video, Sparkles, Send, Volume2 } from 'lucide-react';

interface AuraOrbProps {
  onSendMessage?: (msg: string) => void;
  isJunior?: boolean;
}

export const AuraOrb: React.FC<AuraOrbProps> = ({ onSendMessage, isJunior = false }) => {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);

  const promptChips = isJunior
    ? ['Week Summary 📋', 'Next Quest 🚀', 'Explain simply ✨', 'Play Mini-Game 🎮']
    : ['Week Summary', 'Create Study Plan', 'Class Performance', 'Verify Grounding'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    if (onSendMessage) onSendMessage(inputText);
    setInputText('');
  };

  return (
    <div
      className={`p-6 rounded-card border border-border-subtle relative overflow-hidden flex flex-col justify-between space-y-5 shadow-card bg-bg-surface text-text-main`}
    >
      {/* Header */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-btn bg-primary/15 text-primary flex items-center justify-center border border-primary/30">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-main flex items-center gap-1.5">
              Aura AI Companion
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/30 font-bold">
                Source Grounded
              </span>
            </h3>
            <p className="text-[11px] text-text-muted">
              {isJunior ? 'Voice & visual study mascot' : 'Multimodal reasoning & exact citations'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-[10px] font-mono text-emerald-500 font-bold">Active</span>
        </div>
      </div>

      {/* Center 3D Voice Orb Visualization */}
      <div className="relative py-4 flex flex-col items-center justify-center my-auto">
        <div className="relative w-36 h-36 flex items-center justify-center">
          {/* Animated pulsing wave rings */}
          <motion.div
            animate={{ scale: [1, 1.25, 1], opacity: [0.25, 0.5, 0.25] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 rounded-full blur-xl bg-primary/25"
          />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-2 rounded-full border-2 border-dashed border-primary/40"
          />

          {/* Core Orb */}
          <div
            className="relative w-24 h-24 rounded-full flex flex-col items-center justify-center shadow-xl border-2 border-white/40 backdrop-blur-md cursor-pointer group transition-transform hover:scale-105 bg-primary text-white"
            onClick={() => setIsListening(!isListening)}
          >
            <Volume2 className="w-7 h-7 text-white animate-pulse" />
            <span className="text-[9px] font-bold uppercase tracking-wider text-white mt-1">
              {isListening ? 'Listening...' : 'Ask Aura'}
            </span>
          </div>
        </div>

        {/* Media Control Toolbar */}
        <div className="flex items-center gap-3 mt-4 z-10">
          <button
            type="button"
            className="w-10 h-10 rounded-full bg-bg-app border border-border-subtle hover:border-primary text-text-muted hover:text-text-main flex items-center justify-center shadow-sm transition-all"
            title="Scan textbook page"
          >
            <Camera className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsListening(!isListening)}
            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-all ${
              isListening
                ? 'bg-red-500 text-white animate-pulse shadow-red-500/40'
                : 'bg-primary hover:opacity-90 text-white shadow-primary/30'
            }`}
            title="Voice input"
          >
            <Mic className="w-5 h-5 font-bold" />
          </button>

          <button
            type="button"
            className="w-10 h-10 rounded-full bg-bg-app border border-border-subtle hover:border-primary text-text-muted hover:text-text-main flex items-center justify-center shadow-sm transition-all"
            title="Video lecture analysis"
          >
            <Video className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Prompt Chips */}
      <div className="space-y-2 z-10">
        <div className="flex flex-wrap gap-1.5 justify-center">
          {promptChips.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSendMessage && onSendMessage(chip.replace(/[^\w\s]/gi, '').trim())}
              className="px-3 py-1 rounded-full text-xs font-semibold transition-all border bg-bg-app border-border-subtle text-text-muted hover:border-primary hover:text-text-main"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask Aura anything about your course..."
            className="flex-1 bg-bg-app border border-border-subtle rounded-btn px-4 py-2.5 text-xs text-text-main placeholder-text-muted focus:outline-none focus:border-primary"
          />
          <button
            type="submit"
            className="p-2.5 rounded-btn bg-primary hover:opacity-90 text-white font-bold transition-colors shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
