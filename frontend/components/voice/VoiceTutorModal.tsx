'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Sparkles,
  RefreshCw,
  Languages,
  Radio,
  BookOpen,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { api, TutorResponse } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import AanviLogo from '@/components/brand/AanviLogo';

interface VoiceTutorModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId?: number;
  onSelectCitation?: (url: string) => void;
}

type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

export default function VoiceTutorModal({
  isOpen,
  onClose,
  courseId = 1,
  onSelectCitation,
}: VoiceTutorModalProps) {
  const { mode, user, addXP, addStars } = useAuthStore();
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState<TutorResponse | null>(null);
  const [language, setLanguage] = useState<'English' | 'Hindi' | 'Gujarati'>('English');
  const [isMuted, setIsMuted] = useState(false);
  const [recognitionSupported, setRecognitionSupported] = useState(true);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Initialize Speech Recognition & Synthesis
  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const reco = new SpeechRecognition();
        reco.continuous = false;
        reco.interimResults = true;
        reco.lang = language === 'Hindi' ? 'hi-IN' : language === 'Gujarati' ? 'gu-IN' : 'en-US';

        reco.onstart = () => {
          setVoiceState('listening');
        };

        reco.onresult = (event: any) => {
          let interimTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              const finalQuery = event.results[i][0].transcript;
              setTranscript(finalQuery);
              handleProcessVoiceQuery(finalQuery);
            } else {
              interimTranscript += event.results[i][0].transcript;
              setTranscript(interimTranscript);
            }
          }
        };

        reco.onerror = (e: any) => {
          console.warn('Speech recognition error:', e.error);
          setVoiceState('idle');
        };

        reco.onend = () => {
          if (voiceState === 'listening') {
            setVoiceState('idle');
          }
        };

        recognitionRef.current = reco;
      } else {
        setRecognitionSupported(false);
      }
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // safe ignore
        }
      }
    };
  }, [language]);

  // Handle Query Execution
  const handleProcessVoiceQuery = async (queryText: string) => {
    if (!queryText.trim()) return;

    // Barge-in: cancel any currently speaking audio
    if (synthRef.current) {
      synthRef.current.cancel();
    }

    setVoiceState('processing');

    try {
      const resp = await api.queryTutor({
        course_id: courseId,
        user_id: user?.id || 1,
        query: queryText,
        language: language,
        mode: mode,
      });

      setAiResponse(resp);
      setVoiceState('speaking');
      addXP(15);
      if (mode === 'explorer') addStars(1);

      // Speak response
      if (!isMuted && synthRef.current) {
        const cleanSpeechText = resp.answer
          .replace(/\[\d+\]/g, '') // remove citation numbers
          .replace(/[*#_`$]/g, '') // remove markdown/math symbols
          .replace(/https?:\/\/\S+/g, '');

        const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
        utterance.lang = language === 'Hindi' ? 'hi-IN' : language === 'Gujarati' ? 'gu-IN' : 'en-US';
        utterance.rate = mode === 'explorer' ? 0.95 : 1.05;
        utterance.pitch = mode === 'explorer' ? 1.15 : 1.0;

        utterance.onend = () => {
          setVoiceState('idle');
        };

        utterance.onerror = () => {
          setVoiceState('idle');
        };

        synthRef.current.speak(utterance);
      } else {
        setVoiceState('idle');
      }
    } catch (e) {
      console.error(e);
      setVoiceState('idle');
    }
  };

  const startListening = () => {
    // Barge-in interruption
    if (synthRef.current) {
      synthRef.current.cancel();
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setTranscript('');
      } catch (e) {
        // restart if already active
        try {
          recognitionRef.current.stop();
          recognitionRef.current.start();
        } catch {
          simulateDemoVoice();
        }
      }
    } else {
      simulateDemoVoice();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // safe ignore
      }
    }
    if (voiceState === 'listening') {
      setVoiceState('idle');
    }
  };

  const simulateDemoVoice = () => {
    const demoQuery =
      mode === 'explorer'
        ? 'How does Binary Search work in our game?'
        : 'Explain the asymptotic proof and recurrence for Binary Search';
    setTranscript(demoQuery);
    handleProcessVoiceQuery(demoQuery);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        className="w-full max-w-2xl rounded-card border border-border-subtle bg-bg-surface text-text-main shadow-card overflow-hidden relative flex flex-col"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-card bg-primary/20 text-primary border border-primary/40 flex items-center justify-center">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-main flex items-center gap-2">
                <span>{mode === 'explorer' ? 'Aanvi Voice Companion' : 'Aanvi Voice Study Studio'}</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-success/20 text-success border border-success/30">
                  Live VAD
                </span>
              </h3>
              <p className="text-xs text-text-muted">
                Speak naturally • Instant citations • Real-time voice synthesis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <div className="flex items-center bg-bg-elevated rounded-full p-1 border border-border-subtle text-xs">
              {(['English', 'Hindi', 'Gujarati'] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLanguage(l)}
                  className={`px-2.5 py-1 rounded-full font-medium transition-all ${
                    language === l
                      ? 'bg-primary text-primary-contrast font-bold'
                      : 'text-text-muted hover:text-text-main'
                  }`}
                >
                  {l === 'Hindi' ? 'हिंदी' : l === 'Gujarati' ? 'ગુજરાતી' : l}
                </button>
              ))}
            </div>

            {/* Mute toggle */}
            <button
              type="button"
              onClick={() => {
                setIsMuted(!isMuted);
                if (!isMuted && synthRef.current) synthRef.current.cancel();
              }}
              className="p-2 rounded-full bg-bg-elevated hover:bg-border-subtle text-text-muted border border-border-subtle"
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-danger" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={() => {
                if (synthRef.current) synthRef.current.cancel();
                onClose();
              }}
              className="p-2 rounded-full bg-bg-elevated hover:bg-border-subtle text-text-muted"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center Waveform Visualizer & Mascot */}
        <div className="p-8 flex flex-col items-center justify-center text-center relative min-h-[220px]">
          {/* Animated Glowing Orb / Mascot */}
          <div className="relative mb-6">
            <motion.div
              animate={{
                scale:
                  voiceState === 'listening'
                    ? [1, 1.25, 1.05, 1.3, 1]
                    : voiceState === 'speaking'
                    ? [1, 1.15, 1.05, 1.2, 1]
                    : voiceState === 'processing'
                    ? [1, 1.1, 1]
                    : [1, 1.03, 1],
              }}
              transition={{ repeat: Infinity, duration: voiceState === 'listening' ? 1.5 : 2 }}
              className="w-28 h-28 rounded-full flex items-center justify-center border-4 border-primary relative z-10 bg-primary text-primary-contrast shadow-md"
            >
              {mode === 'explorer' ? (
                <div className="w-16 h-16 flex items-center justify-center animate-bounce">
                  <AanviLogo size="lg" variant="mark" />
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  {[40, 75, 100, 60, 85, 45].map((h, idx) => (
                    <motion.div
                      key={idx}
                      animate={{
                        height:
                          voiceState === 'listening' || voiceState === 'speaking'
                            ? [8, h * 0.4, 12, h * 0.35, 8]
                            : 8,
                      }}
                      transition={{ repeat: Infinity, duration: 0.8 + idx * 0.1 }}
                      className="w-1.5 bg-primary-contrast rounded-full"
                    />
                  ))}
                </div>
              )}
            </motion.div>

            {/* Ripple rings */}
            {(voiceState === 'listening' || voiceState === 'speaking') && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0.8 }}
                animate={{ scale: 1.8, opacity: 0 }}
                transition={{ repeat: Infinity, duration: 1.6, ease: 'easeOut' }}
                className="absolute inset-0 rounded-full border-2 border-primary"
              />
            )}
          </div>

          {/* Status badge */}
          <span
            className={`text-xs font-mono font-bold px-4 py-1 rounded-full uppercase tracking-wider ${
              voiceState === 'listening'
                ? 'bg-accent text-text-main animate-pulse'
                : voiceState === 'processing'
                ? 'bg-secondary/20 text-secondary border border-secondary/40'
                : voiceState === 'speaking'
                ? 'bg-primary/20 text-primary border border-primary/40'
                : 'bg-bg-elevated text-text-muted'
            }`}
          >
            {voiceState === 'listening' && 'Listening to you...'}
            {voiceState === 'processing' && 'Synthesizing with Source Citations...'}
            {voiceState === 'speaking' && 'Speaking (Tap mic or speak to interrupt)...'}
            {voiceState === 'idle' && 'Tap the Microphone to Speak'}
          </span>

          {/* Live Transcript / Prompt */}
          <div className="mt-4 max-w-md w-full px-4 py-2.5 rounded-card bg-bg-elevated border border-border-subtle min-h-[44px] flex items-center justify-center">
            <p className="text-xs sm:text-sm text-text-main font-medium italic">
              {transcript ? `"${transcript}"` : 'Try saying: "Explain binary search" or "What is a tree traversal?"'}
            </p>
          </div>
        </div>

        {/* AI Answer & Source Citations Preview */}
        {aiResponse && (
          <div className="p-5 bg-bg-elevated border-t border-border-subtle max-h-52 overflow-y-auto space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-text-muted flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                <span>Grounded AI Tutor Answer</span>
              </span>
              <span className="text-[10px] font-mono text-success bg-success/10 px-2 py-0.5 rounded-full border border-success/20">
                Confidence {Math.round(aiResponse.confidence_score * 100)}%
              </span>
            </div>

            <p className="text-xs sm:text-sm text-text-main leading-relaxed whitespace-pre-line">
              {aiResponse.answer}
            </p>

            {/* Citations */}
            {aiResponse.sources && aiResponse.sources.length > 0 && (
              <div className="pt-2 flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-mono text-text-muted">Citations:</span>
                {aiResponse.sources.map((src, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      if (onSelectCitation) onSelectCitation(src.open_url);
                    }}
                    className="px-2.5 py-1 rounded-btn bg-bg-surface hover:bg-border-subtle text-[11px] font-mono text-primary border border-primary/30 flex items-center gap-1"
                  >
                    <BookOpen className="w-3 h-3" />
                    <span>
                      [{i + 1}] {src.source_type.toUpperCase()} {src.page ? `p.${src.page}` : src.slide ? `s.${src.slide}` : src.timestamp}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bottom Action Controls */}
        <div className="p-5 border-t border-border-subtle bg-bg-surface flex items-center justify-between">
          <button
            type="button"
            onClick={simulateDemoVoice}
            className="text-xs text-text-muted hover:text-text-main flex items-center gap-1.5 px-3 py-1.5 rounded-btn bg-bg-elevated hover:bg-border-subtle transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sample Question</span>
          </button>

          <div className="flex items-center gap-3">
            {voiceState === 'listening' ? (
              <button
                type="button"
                onClick={stopListening}
                className="px-6 py-2.5 rounded-btn bg-danger hover:bg-danger/80 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all animate-pulse"
              >
                <MicOff className="w-4 h-4" />
                <span>Stop Listening</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={startListening}
                className="px-7 py-3 rounded-btn font-bold text-xs flex items-center gap-2 shadow-md bg-primary hover:bg-primary-hover text-primary-contrast transition-all"
              >
                <Mic className="w-4 h-4" />
                <span>Start Talking</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
