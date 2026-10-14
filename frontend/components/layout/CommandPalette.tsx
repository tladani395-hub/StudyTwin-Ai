'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  MessageSquare,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Calendar,
  Network,
  Upload,
  BarChart3,
  Settings,
  Camera,
  Moon,
  Sun,
  X
} from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useThemeStore } from '@/stores/useThemeStore';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const router = useRouter();
  const { user, mode, setMode } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles toggle
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    { id: 'tutor', title: 'Ask Grounded Tutor', desc: 'Open tutor chat with citation links', icon: MessageSquare, href: '/tutor', cat: 'Navigation' },
    { id: 'assess', title: 'Start Adaptive Quiz', desc: 'Verified questions with sandbox validation', icon: CheckCircle2, href: '/assessment', cat: 'Navigation' },
    { id: 'dashboard', title: 'Interactive Learning Dashboard', desc: 'Mastery map & learning analytics', icon: Network, href: '/dashboard', cat: 'Navigation' },
    { id: 'plan', title: 'Adaptive Study Plan', desc: 'Spaced repetition schedule before exam', icon: Calendar, href: '/study-plan', cat: 'Navigation' },
    { id: 'upload', title: 'Upload Course Materials', desc: 'Ingest PDF, Slides or Video lecture', icon: Upload, href: '/upload', cat: 'Navigation' },
    { id: 'eval', title: 'RAGAS Evaluation Hub', desc: 'Faithfulness, precision & recall metrics', icon: BarChart3, href: '/evaluation', cat: 'Navigation' },
    { id: 'settings', title: 'Settings & Privacy', desc: 'Preferences, child safety & API keys', icon: Settings, href: '/settings', cat: 'Navigation' },
    { id: 'theme', title: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`, desc: 'Toggle visual theme', icon: theme === 'dark' ? Sun : Moon, action: toggleTheme, cat: 'Preferences' },
    ...((!user || (user.age !== undefined && user.age <= 16 && mode !== 'scholar') || (user.age !== undefined && user.age > 16 && mode !== 'explorer')) ? [] : [
      { id: 'mode', title: `Switch to ${mode === 'scholar' ? 'Explorer Mode (Kids)' : 'Scholar Mode (Pro)'}`, desc: 'Toggle age experience mode', icon: Sparkles, action: () => setMode(mode === 'scholar' ? 'explorer' : 'scholar'), cat: 'Preferences' }
    ]),
  ];

  const filtered = actions.filter((a) =>
    a.title.toLowerCase().includes(query.toLowerCase()) ||
    a.desc.toLowerCase().includes(query.toLowerCase()) ||
    a.cat.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (item: typeof actions[0]) => {
    onClose();
    if (item.href) router.push(item.href);
    if (item.action) item.action();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          className="w-full max-w-xl rounded-card bg-bg-surface border border-border-subtle shadow-2xl overflow-hidden text-text-main"
        >
          {/* Search Input */}
          <div className="flex items-center px-4 py-3.5 border-b border-border-subtle gap-3">
            <Search className="w-5 h-5 text-primary shrink-0" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a command or search (e.g. 'Tutor', 'Quiz', 'Theme')..."
              className="w-full bg-transparent border-none outline-none text-sm text-text-main placeholder-text-muted"
            />
            <button
              onClick={onClose}
              className="p-1 rounded-md text-text-muted hover:text-text-main hover:bg-bg-elevated transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Results List */}
          <div className="max-h-80 overflow-y-auto p-2 space-y-1">
            {filtered.length === 0 ? (
              <div className="py-8 text-center text-xs text-text-muted">
                No matching commands found.
              </div>
            ) : (
              filtered.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className="w-full text-left px-3.5 py-2.5 rounded-btn hover:bg-bg-elevated flex items-center justify-between group transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-bg-app text-primary border border-border-subtle group-hover:border-primary transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-text-main group-hover:text-primary transition-colors">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-text-muted">
                          {item.desc}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-bg-app text-text-muted">
                      {item.cat}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Shortcuts */}
          <div className="px-4 py-2 border-t border-border-subtle bg-bg-app flex items-center justify-between text-[11px] text-text-muted font-mono">
            <div className="flex items-center gap-3">
              <span>↑↓ Navigate</span>
              <span>↵ Select</span>
              <span>ESC Close</span>
            </div>
            <span className="text-primary font-bold">Aanvi Command Engine</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
