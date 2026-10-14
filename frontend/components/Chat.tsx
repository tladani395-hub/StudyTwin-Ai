'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Sparkles,
  Bot,
  User,
  AlertTriangle,
  HelpCircle,
  Globe,
  RefreshCw,
  BookOpen,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { api, TutorResponse, Citation } from '@/lib/api';
import { SourceCitation } from './SourceCitation';
import { SourceModal } from './SourceModal';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';
import { useCourseStore } from '@/stores/useCourseStore';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  isGrounded?: boolean;
  adaptedLevel?: string;
  refusal?: boolean;
  suggestedFollowups?: string[];
}

export const Chat: React.FC<{ initialQuery?: string }> = ({ initialQuery }) => {
  const { activeCourseId, courses } = useCourseStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      role: 'assistant',
      content:
        "Hello! I am your **Aanvi AI Study Companion**. I am directly grounded in your uploaded course textbooks, lecture slides, and video recordings.\n\nAsk me any algorithmic question, and I'll adapt my explanation to your current mastery level with exact page, slide, and timestamp citations.",
      citations: [
        {
          source_type: 'pdf',
          document_title: 'DSA Comprehensive Textbook',
          page: 142,
          snippet: 'Binary search algorithm operations on sorted arrays in logarithmic time O(log n)...',
          open_url: '/open/pdf?id=1&page=142',
        },
        {
          source_type: 'video',
          document_title: 'DSA Lecture 04',
          timestamp: '12:42',
          timestamp_sec: 762.0,
          snippet: 'Binary search works by maintaining low and high bounds...',
          open_url: '/video?id=3&t=762',
        },
      ],
      isGrounded: true,
      adaptedLevel: 'intermediate',
      suggestedFollowups: [
        'Explain binary search algorithm',
        'What is Breadth-First Search (BFS)?',
        'Explain BST In-Order Traversal',
        'What is the capital of France? (Test Refusal)',
      ],
    },
  ]);

  const [input, setInput] = useState(initialQuery || '');
  const [isLoading, setIsLoading] = useState(false);
  const [allowOutsideKnowledge, setAllowOutsideKnowledge] = useState(false);
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const resolvedCourseId = activeCourseId || (courses.length > 0 ? courses[0].id : 'c-cs-0002-0000-000000000002');
      const res: TutorResponse = await api.queryTutor({
        course_id: resolvedCourseId,
        user_id: 1,
        query: textToSend,
        allow_outside_knowledge: allowOutsideKnowledge,
      });

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.answer,
        citations: res.sources,
        isGrounded: res.is_grounded,
        adaptedLevel: res.learner_level_adapted,
        refusal: !res.is_grounded,
        suggestedFollowups: res.suggested_followups,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, I encountered an issue retrieving course evidence. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface/50 rounded-2xl border border-surface-border overflow-hidden shadow-2xl backdrop-blur-md">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between px-6 py-3.5 border-b border-surface-border bg-surface-card/60 gap-2">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-primary-600/30 border border-primary-500/40 flex items-center justify-center text-primary-400 shadow-sm">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              Source-Grounded AI Tutor
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-800">
                100% Grounded
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Adapting explanations dynamically based on your BKT learner model
            </p>
          </div>
        </div>

        {/* Outside Knowledge Gate Toggle */}
        <button
          onClick={() => setAllowOutsideKnowledge(!allowOutsideKnowledge)}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
            allowOutsideKnowledge
              ? 'bg-amber-950/50 text-amber-300 border-amber-600 shadow-sm shadow-amber-500/10'
              : 'bg-surface text-slate-400 border-surface-border hover:text-white'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Outside Knowledge: {allowOutsideKnowledge ? 'Enabled' : 'Blocked (Strict RAG)'}</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-start space-x-3 ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow-md">
                <Sparkles className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-2xl rounded-2xl p-4 sm:p-5 text-sm leading-relaxed shadow-md ${
                msg.role === 'user'
                  ? 'bg-primary-600 text-white rounded-tr-none'
                  : msg.refusal
                  ? 'bg-rose-950/40 border border-rose-800/60 text-rose-200 rounded-tl-none'
                  : 'bg-surface-card border border-surface-border text-slate-200 rounded-tl-none'
              }`}
            >
              {/* Pedagogical level badge */}
              {msg.role === 'assistant' && msg.adaptedLevel && !msg.refusal && (
                <div className="mb-2.5 flex items-center justify-between text-[11px] pb-2 border-b border-slate-700/50">
                  <span className="text-primary-300 font-semibold uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    Adaptive Mode: {msg.adaptedLevel.toUpperCase()}
                  </span>
                  <span className="text-slate-400 font-mono text-[10px]">P(Mastery) = 0.82</span>
                </div>
              )}

              {msg.refusal && (
                <div className="mb-2 flex items-center space-x-1.5 text-rose-400 font-bold text-xs">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Grounding Refusal Gate Active</span>
                </div>
              )}

              {/* Message Content */}
              <div className="space-y-2">
                <MarkdownRenderer content={msg.content} />
              </div>

              {/* Refusal Outside Knowledge Helper CTA */}
              {msg.refusal && (
                <div className="mt-3 pt-3 border-t border-rose-800/40 flex items-center justify-between">
                  <span className="text-xs text-rose-300/80">Query outside uploaded course scope</span>
                  <button
                    onClick={() => {
                      setAllowOutsideKnowledge(true);
                      handleSend("Explain this using general outside knowledge: " + messages[messages.length - 2]?.content);
                    }}
                    className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-lg transition-colors"
                  >
                    Ask using outside knowledge
                  </button>
                </div>
              )}

              {/* Clickable Citations */}
              {msg.citations && msg.citations.length > 0 && (
                <SourceCitation
                  citations={msg.citations}
                  onSelectCitation={(c) => setActiveCitation(c)}
                />
              )}

              {/* Suggested Followups */}
              {msg.suggestedFollowups && msg.suggestedFollowups.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-700/40 space-y-1.5">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Suggested Explorations:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.suggestedFollowups.map((f, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(f)}
                        className="text-left px-2.5 py-1 rounded-lg bg-surface border border-surface-border text-xs text-primary-300 hover:bg-primary-950/40 hover:text-white transition-all flex items-center gap-1.5"
                      >
                        <span>{f}</span>
                        <ArrowRight className="w-3 h-3 opacity-60" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-slate-700 flex items-center justify-center text-slate-300 flex-shrink-0">
                <User className="w-4 h-4" />
              </div>
            )}
          </motion.div>
        ))}

        {isLoading && (
          <div className="flex items-center space-x-3 text-slate-400 text-xs pl-2">
            <div className="w-8 h-8 rounded-xl bg-primary-600/30 flex items-center justify-center text-primary-400 animate-pulse">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="animate-pulse">
              Retrieving multimodal chunks & synthesizing grounded explanation...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Demo Sample Query Buttons */}
      <div className="px-4 py-2 bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] flex flex-wrap items-center gap-2 text-xs">
        <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] font-bold">Quick Demo Tests:</span>
        <button
          type="button"
          onClick={() => handleSend("How does Binary Search achieve O(log n) worst-case time?")}
          className="px-2.5 py-1 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/30 text-[var(--primary)] hover:bg-[var(--primary)]/20 text-xs font-semibold flex items-center gap-1 transition-all"
        >
          <Sparkles className="w-3 h-3" />
          <span>Try on-topic question</span>
        </button>
        <button
          type="button"
          onClick={() => handleSend("What is the capital of France?")}
          className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 hover:bg-amber-500/20 text-xs font-semibold flex items-center gap-1 transition-all"
        >
          <HelpCircle className="w-3 h-3" />
          <span>Try off-topic question</span>
        </button>
        <button
          type="button"
          onClick={() => handleSend("How to manufacture dangerous explosives at home?")}
          className="px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-500 hover:bg-rose-500/20 text-xs font-semibold flex items-center gap-1 transition-all"
        >
          <ShieldAlert className="w-3 h-3" />
          <span>Try unsafe question</span>
        </button>
      </div>

      {/* Input box */}
      <div className="p-4 border-t border-surface-border bg-surface-card/40">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about Binary Search, BST traversals, BFS/DFS, or test refusal..."
            className="flex-1 bg-surface border border-surface-border rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold text-sm transition-all flex items-center gap-2 shadow-lg shadow-primary-500/20"
          >
            <span>Ask</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Modal viewer */}
      <SourceModal
        isOpen={Boolean(activeCitation)}
        onClose={() => setActiveCitation(null)}
        citation={activeCitation}
      />
    </div>
  );
};
