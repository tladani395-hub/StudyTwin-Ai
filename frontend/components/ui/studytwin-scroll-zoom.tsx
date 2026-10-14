'use client';

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowDown, ArrowRight, BookOpen, GraduationCap, Sparkles } from 'lucide-react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// ── Aanvi Emblem SVG (Open Book with Graduation Cap in 121x90 viewBox) ──────────
const STUDYTWIN_EMBLEM_PATH =
  'M60.5 2L15 22L60.5 42L106 22L60.5 2ZM60.5 12L90 22L60.5 32L31 22L60.5 12ZM35 34V46C35 52 46 58 60.5 58C75 58 86 52 86 46V34L60.5 44L35 34ZM10 52C26 50 48 53 58 58V86C48 81 26 78 10 80V52ZM111 52C95 50 73 53 63 58V86C73 81 95 78 111 80V52Z';

const STUDYTWIN_MASK_SVG_URI = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 121 90" fill="%23000000"><path d="${STUDYTWIN_EMBLEM_PATH}"/></svg>`;

export interface StudyTwinScrollZoomProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  outroTitle?: React.ReactNode;
  outroSubtitle?: React.ReactNode;
  videoSrc?: string;
  posterSrc?: string;
  onEnter?: () => void;
  className?: string;
}

export function StudyTwinScrollZoom({
  title,
  subtitle,
  outroTitle,
  outroSubtitle,
  videoSrc = 'https://res.cloudinary.com/dsuwzuaxp/video/upload/cinematic_drone_videos_shew9q.mp4',
  posterSrc = 'https://res.cloudinary.com/dsuwzuaxp/video/upload/cinematic_drone_videos_shew9q.jpg',
  onEnter,
  className = '',
}: StudyTwinScrollZoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const maskLayerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
    }
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) return;
    if (!containerRef.current || !pinRef.current) return;

    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {});
    }

    const ctx = gsap.context(() => {
      const getInitialSize = () => {
        if (typeof window === 'undefined') return 340;
        if (window.innerWidth < 640) return 260;
        if (window.innerWidth < 1024) return 340;
        return 420;
      };

      const initialSize = getInitialSize();

      if (maskLayerRef.current) {
        maskLayerRef.current.style.setProperty('--maskW', `${initialSize}px`);
        maskLayerRef.current.style.webkitMaskSize = `${initialSize}px`;
        maskLayerRef.current.style.maskSize = `${initialSize}px`;
      }

      const isMobile = window.innerWidth < 768;
      const scrollEnd = isMobile ? '+=200%' : '+=360%';

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: scrollEnd,
          scrub: 1.2,
          pin: pinRef.current,
          pinSpacing: true,
          anticipatePin: 1,
          onUpdate: (self) => {
            const progress = self.progress;
            const startSize = getInitialSize();
            const currentSize = startSize + Math.pow(progress, 2.3) * 4500;
            if (maskLayerRef.current) {
              maskLayerRef.current.style.setProperty('--maskW', `${currentSize}px`);
              maskLayerRef.current.style.webkitMaskSize = `${currentSize}px`;
              maskLayerRef.current.style.maskSize = `${currentSize}px`;
            }
          },
        },
      });

      // Video scale 1 -> 1.22
      tl.to(
        videoRef.current,
        {
          scale: 1.22,
          ease: 'none',
        },
        0
      );

      // Fade in 5 floating mono labels in sequence: PDFS · SLIDES · LECTURES · QUIZZES · MASTERY
      if (labelsRef.current) {
        const labels = labelsRef.current.children;
        Array.from(labels).forEach((label, i) => {
          const startAt = 0.12 + i * 0.14;
          tl.fromTo(
            label,
            { opacity: 0, y: 24, scale: 0.85 },
            { opacity: 1, y: 0, scale: 1, duration: 0.18, ease: 'power2.out' },
            startAt
          );
          tl.to(
            label,
            { opacity: 0, y: -16, scale: 1.1, duration: 0.14, ease: 'power2.in' },
            startAt + 0.22
          );
        });
      }
    }, containerRef);

    return () => {
      ctx.revert();
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, [onEnter, prefersReducedMotion]);

  // Reduced motion static hero view
  if (prefersReducedMotion) {
    return (
      <div className="min-h-screen bg-bg-app text-text-main flex flex-col items-center justify-center p-8 text-center space-y-8">
        <span className="font-mono text-xs text-primary tracking-widest uppercase">
          AI-POWERED ADAPTIVE LEARNING
        </span>
        <h1 className="text-4xl sm:text-6xl font-display font-black text-text-main">
          STUDY SMARTER. <br />
          <span className="text-primary">NOT HARDER.</span>
        </h1>
        <p className="text-text-muted max-w-xl text-sm sm:text-base">
          YOUR PDFs, SLIDES AND LECTURES — ONE TUTOR THAT NEVER GUESSES.
        </p>
        <button
          onClick={onEnter}
          className="px-8 py-3.5 rounded-btn bg-primary text-white font-bold text-sm shadow-md transition-all flex items-center gap-2"
        >
          <span>Enter Aanvi</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className={`w-full bg-bg-app text-text-main font-sans ${className}`}>
      {/* Top right Skip Intro button */}
      <div className="fixed top-6 right-6 z-50">
        <button
          onClick={onEnter}
          className="px-4 py-2 rounded-btn bg-bg-surface/80 hover:bg-bg-surface border border-border-subtle text-primary text-xs font-mono font-bold tracking-wider backdrop-blur-md transition-all shadow-lg hover:border-primary/40 flex items-center gap-1.5"
        >
          <span>Skip intro</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── 1. HERO SECTION ── */}
      <section className="relative w-full min-h-[100dvh] bg-bg-app flex flex-col items-center justify-center px-6 md:px-12 py-16 select-none overflow-hidden">
        <div className="w-full max-w-5xl mx-auto flex flex-col items-center text-center z-10 space-y-6">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-mono font-bold uppercase tracking-widest backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-POWERED ADAPTIVE LEARNING</span>
          </div>

          <h1 className="text-[12vw] sm:text-[9vw] md:text-[6.5rem] lg:text-[7.8rem] font-display font-black uppercase leading-[0.88] tracking-[-0.04em] text-text-main">
            {title || (
              <>
                STUDY SMARTER. <br />
                <span className="text-primary">
                  NOT HARDER.
                </span>
              </>
            )}
          </h1>

          <p className="max-w-2xl text-xs sm:text-sm md:text-base font-medium leading-relaxed tracking-wider text-text-muted uppercase">
            {subtitle || 'YOUR PDFs, SLIDES AND LECTURES — ONE TUTOR THAT NEVER GUESSES.'}
          </p>

          <div className="pt-8 flex flex-col items-center space-y-2 text-primary text-xs font-mono">
            <span className="tracking-widest uppercase text-[11px] opacity-80">SCROLL TO DIVE IN</span>
            <ArrowDown className="w-4 h-4 animate-bounce" />
          </div>
        </div>
      </section>

      {/* ── 2. PINNED ZOOM (360vh) ── */}
      <div
        ref={containerRef}
        className="relative w-full bg-bg-app text-text-main"
        style={{ minHeight: '360vh' }}
      >
        <div
          ref={pinRef}
          className="sticky top-0 w-full h-[100dvh] overflow-hidden flex items-center justify-center bg-bg-app select-none relative"
        >
          {/* Four Small Corner Brackets */}
          <div className="absolute top-[10px] left-[10px] z-30 pointer-events-none w-5 h-5 text-primary">
            <svg viewBox="0 0 10 10" fill="none" className="w-full h-full">
              <path d="M10 0V1H1V10H0V0H10Z" fill="currentColor" />
            </svg>
          </div>
          <div className="absolute top-[10px] right-[10px] z-30 pointer-events-none w-5 h-5 text-primary">
            <svg viewBox="0 0 10 10" fill="none" className="w-full h-full">
              <path d="M10 0V10H9V1H0V0H10Z" fill="currentColor" />
            </svg>
          </div>
          <div className="absolute bottom-[10px] left-[10px] z-30 pointer-events-none w-5 h-5 text-primary">
            <svg viewBox="0 0 10 10" fill="none" className="w-full h-full">
              <path d="M0 0L1 0L1 9L10 9L10 10L0 10L0 0Z" fill="currentColor" />
            </svg>
          </div>
          <div className="absolute bottom-[10px] right-[10px] z-30 pointer-events-none w-5 h-5 text-primary">
            <svg viewBox="0 0 10 10" fill="none" className="w-full h-full">
              <path d="M10 10L0 10L0 9L9 9L9 0L10 0L10 10Z" fill="currentColor" />
            </svg>
          </div>

          {/* Five Floating Mono Labels: PDFS · SLIDES · LECTURES · QUIZZES · MASTERY */}
          <div
            ref={labelsRef}
            className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center"
          >
            <div className="absolute top-[20%] left-[10%] px-4 py-2 rounded-full bg-bg-surface border border-border-subtle text-primary font-mono font-bold text-xs shadow-lg backdrop-blur-md flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span>PDFS</span>
            </div>

            <div className="absolute top-[22%] right-[12%] px-4 py-2 rounded-full bg-bg-surface border border-border-subtle text-primary font-mono font-bold text-xs shadow-lg backdrop-blur-md flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span>SLIDES</span>
            </div>

            <div className="absolute top-[48%] left-[8%] px-4 py-2 rounded-full bg-bg-surface border border-border-subtle text-primary font-mono font-bold text-xs shadow-lg backdrop-blur-md flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span>LECTURES</span>
            </div>

            <div className="absolute bottom-[22%] right-[10%] px-4 py-2 rounded-full bg-bg-surface border border-border-subtle text-primary font-mono font-bold text-xs shadow-lg backdrop-blur-md flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span>QUIZZES</span>
            </div>

            <div className="absolute bottom-[20%] left-[14%] px-4 py-2 rounded-full bg-bg-surface border border-border-subtle text-primary font-mono font-bold text-xs shadow-lg backdrop-blur-md flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span>MASTERY</span>
            </div>
          </div>

          {/* Mask Layer with Video */}
          <div className="absolute inset-0 w-full h-full z-10 flex items-center justify-center">
            <div
              ref={maskLayerRef}
              className="w-full h-full relative overflow-hidden flex items-center justify-center"
              style={{
                WebkitMaskImage: `url('${STUDYTWIN_MASK_SVG_URI}')`,
                maskImage: `url('${STUDENT_MASK_SVG_URI(STUDYTWIN_EMBLEM_PATH)}')`,
                WebkitMaskPosition: '50% 50%',
                maskPosition: '50% 50%',
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
                WebkitMaskSize: 'var(--maskW, 340px)',
                maskSize: 'var(--maskW, 340px)',
                transition: 'mask-size 0.04s linear, -webkit-mask-size 0.04s linear',
              }}
            >
              <video
                ref={videoRef}
                className="w-full h-full object-cover will-change-transform bg-black"
                loop
                muted
                playsInline
                autoPlay
                preload="metadata"
                poster={posterSrc}
                style={{
                  transform: 'scale(1.0)',
                  transformOrigin: '50% 50%',
                }}
              >
                <source src="/videos/studytwin-hero.mp4" type="video/mp4" />
                <source src={videoSrc} type="video/mp4" />
              </video>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. OUTRO SECTION ── */}
      <footer className="relative z-10 w-full min-h-[100dvh] bg-bg-app text-text-main flex flex-col items-center justify-center px-6 md:px-12 py-16 select-none border-t border-border-subtle">
        <div className="w-full max-w-5xl mx-auto flex flex-col items-center text-center z-10 space-y-6">
          <div className="p-3.5 rounded-full bg-primary/15 border border-primary/30 text-primary">
            <GraduationCap className="w-8 h-8" />
          </div>

          <h2 className="text-[10vw] sm:text-[8vw] md:text-[6.5rem] lg:text-[7.5rem] font-display font-black uppercase leading-[0.88] tracking-[-0.04em] text-text-main">
            {outroTitle || (
              <>
                ONE TUTOR. <br />
                <span className="text-primary">
                  EVERY SOURCE.
                </span>
              </>
            )}
          </h2>

          <p className="max-w-2xl text-xs sm:text-sm md:text-base font-mono font-bold leading-relaxed tracking-widest text-text-muted uppercase">
            {outroSubtitle || 'EXACT PAGE. EXACT SLIDE. EXACT TIMESTAMP.'}
          </p>

          <div className="pt-6">
            <button
              onClick={onEnter}
              className="px-9 py-4 rounded-btn bg-primary hover:opacity-90 text-white font-display font-black text-sm uppercase tracking-wider transition-all shadow-md flex items-center gap-2"
            >
              <span>Enter Aanvi &rarr;</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

function STUDENT_MASK_SVG_URI(path: string) {
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 121 90" fill="%23000000"><path d="${path}"/></svg>`;
}

export default StudyTwinScrollZoom;
