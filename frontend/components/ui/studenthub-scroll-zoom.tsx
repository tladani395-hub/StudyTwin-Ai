'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  BookOpen,
  Code,
  GraduationCap,
  Sparkles,
  FileText,
  Briefcase,
  Layers,
  ArrowDown
} from 'lucide-react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// ── Cinematic Graduation Cap & Knowledge Portal SVG Silhouette ──────────
const STUDENTHUB_MASK_PATH =
  'M60 0L0 32.5L25 46.04V75C25 80 40 95 60 95C80 95 95 80 95 75V46.04L108 39V70H116V34.67L120 32.5L60 0ZM60 12L101.5 32.5L60 53L18.5 32.5L60 12ZM87 73C87 76 75 87 60 87C45 87 33 76 33 73V50.38L60 65L87 50.38V73Z';

const STUDENTHUB_MASK_SVG_URI = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 95" fill="%23000000"><path d="${STUDENTHUB_MASK_PATH}"/></svg>`;

export interface StudentHubScrollZoomProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  outroTitle?: React.ReactNode;
  outroSubtitle?: React.ReactNode;
  videoSrc?: string;
  posterSrc?: string;
  className?: string;
}

export function StudentHubScrollZoom({
  title = (
    <>
      YOUR CAMPUS.{' '}
      <span className="text-primary">
        ONE HUB.
      </span>
    </>
  ),
  subtitle = (
    <>
      EVERYTHING YOU NEED TO <span className="text-primary font-black">LEARN</span>,{' '}
      <span className="text-primary font-black">BUILD</span> AND{' '}
      <span className="text-primary font-black">GROW</span> — IN ONE PLACE.
    </>
  ),
  outroTitle = (
    <>
      YOUR JOURNEY <span className="text-primary">STARTS HERE.</span>
    </>
  ),
  outroSubtitle = (
    <>
      ONE HUB. <span className="text-primary font-black">EVERY RESOURCE</span>. MULTIMODAL SOURCE-GROUNDED AI
      TUTORING, VERIFIED EXAMS, AND REAL-TIME MASTERY TRACKING.
    </>
  ),
  videoSrc = 'https://res.cloudinary.com/dsuwzuaxp/video/upload/cinematic_drone_videos_shew9q.mp4',
  posterSrc = 'https://res.cloudinary.com/dsuwzuaxp/video/upload/cinematic_drone_videos_shew9q.jpg',
  className = '',
}: StudentHubScrollZoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const maskLayerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const badgesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !pinRef.current) return;

    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {});
    }

    const ctx = gsap.context(() => {
      const getInitialSize = () => {
        if (typeof window === 'undefined') return 340;
        if (window.innerWidth < 640) return 240;
        if (window.innerWidth < 1024) return 320;
        return 400;
      };

      const initialSize = getInitialSize();

      if (maskLayerRef.current) {
        maskLayerRef.current.style.setProperty('--maskW', `${initialSize}px`);
        maskLayerRef.current.style.webkitMaskSize = `${initialSize}px`;
        maskLayerRef.current.style.maskSize = `${initialSize}px`;
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: '+=280%',
          scrub: 1.2,
          pin: pinRef.current,
          pinSpacing: true,
          anticipatePin: 1,
          onUpdate: (self) => {
            const progress = self.progress;
            const startSize = getInitialSize();
            const currentSize = startSize + Math.pow(progress, 2.3) * 4800;
            if (maskLayerRef.current) {
              maskLayerRef.current.style.setProperty('--maskW', `${currentSize}px`);
              maskLayerRef.current.style.webkitMaskSize = `${currentSize}px`;
              maskLayerRef.current.style.maskSize = `${currentSize}px`;
            }
          },
        },
      });

      tl.to(
        videoRef.current,
        {
          scale: 1.25,
          ease: 'none',
        },
        0
      );

      // Fade in floating feature badges progressively during zoom
      if (badgesRef.current) {
        tl.fromTo(
          badgesRef.current.children,
          { opacity: 0, y: 30, scale: 0.8 },
          { opacity: 1, y: 0, scale: 1, stagger: 0.1, ease: 'power2.out', duration: 0.5 },
          0.15
        );
        tl.to(
          badgesRef.current.children,
          { opacity: 0, scale: 1.2, stagger: 0.05, ease: 'power2.in', duration: 0.4 },
          0.65
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      className={`w-full bg-bg-app text-text-main selection:bg-primary selection:text-white font-sans ${className}`}
    >
      {/* 1. CINEMATIC INTRO SECTION */}
      <section className="relative w-full min-h-screen bg-bg-app flex flex-col items-center justify-center px-6 md:px-12 lg:px-16 py-16 select-none overflow-hidden">
        <div className="w-full max-w-6xl mx-auto flex flex-col items-center text-center px-2 sm:px-4 z-10 space-y-6">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-mono font-bold uppercase tracking-widest backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Powered University Knowledge Ecosystem</span>
          </div>

          <h1 className="text-[11vw] sm:text-[9vw] md:text-[6.8rem] lg:text-[8rem] font-black uppercase leading-[0.88] tracking-[-0.04em] text-text-main select-none">
            {title}
          </h1>

          <p className="max-w-2xl text-xs sm:text-sm md:text-base uppercase font-bold leading-relaxed tracking-wider text-text-muted">
            {subtitle}
          </p>

          <div className="pt-8 flex flex-col items-center space-y-2 text-primary text-xs font-mono">
            <span className="tracking-widest uppercase text-[11px] opacity-80">Scroll to Dive In</span>
            <ArrowDown className="w-4 h-4 animate-bounce" />
          </div>
        </div>
      </section>

      {/* 2. PURE EMBLUM SCROLL ZOOM PORTAL SECTION */}
      <div
        ref={containerRef}
        className="relative w-full bg-bg-app text-text-main"
        style={{ minHeight: '360vh' }}
      >
        <div
          ref={pinRef}
          className="sticky top-0 w-full h-screen overflow-hidden flex items-center justify-center bg-bg-app select-none relative"
        >
          {/* Futuristic HUD Corners */}
          <div className="absolute top-[16px] left-[16px] z-30 pointer-events-none w-5 h-5 text-primary">
            <svg viewBox="0 0 10 10" fill="none" className="w-full h-full">
              <path d="M10 0V1H1V10H0V0H10Z" fill="currentColor" />
            </svg>
          </div>

          <div className="absolute top-[16px] right-[16px] z-30 pointer-events-none w-5 h-5 text-primary">
            <svg viewBox="0 0 10 10" fill="none" className="w-full h-full">
              <path d="M10 0V10H9V1H0V0H10Z" fill="currentColor" />
            </svg>
          </div>

          <div className="absolute bottom-[16px] left-[16px] z-30 pointer-events-none w-5 h-5 text-primary">
            <svg viewBox="0 0 10 10" fill="none" className="w-full h-full">
              <path d="M0 0L1 0L1 9L10 9L10 10L0 10L0 0Z" fill="currentColor" />
            </svg>
          </div>

          <div className="absolute bottom-[16px] right-[16px] z-30 pointer-events-none w-5 h-5 text-primary">
            <svg viewBox="0 0 10 10" fill="none" className="w-full h-full">
              <path d="M10 10L0 10L0 9L9 9L9 0L10 0L10 10Z" fill="currentColor" />
            </svg>
          </div>

          {/* Floating Feature Badges during Scroll */}
          <div
            ref={badgesRef}
            className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center"
          >
            <div className="absolute top-[22%] left-[12%] px-4 py-2 rounded-btn bg-bg-surface border border-border-subtle text-primary font-mono font-bold text-xs shadow-lg backdrop-blur-md flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span>NOTES & TEXTBOOKS</span>
            </div>

            <div className="absolute top-[26%] right-[14%] px-4 py-2 rounded-btn bg-bg-surface border border-border-subtle text-primary font-mono font-bold text-xs shadow-lg backdrop-blur-md flex items-center gap-2">
              <Code className="w-4 h-4" />
              <span>CODING & PRACTICALS</span>
            </div>

            <div className="absolute bottom-[24%] left-[15%] px-4 py-2 rounded-btn bg-bg-surface border border-border-subtle text-primary font-mono font-bold text-xs shadow-lg backdrop-blur-md flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>PAPERS & EXAMS</span>
            </div>

            <div className="absolute bottom-[22%] right-[12%] px-4 py-2 rounded-btn bg-bg-surface border border-border-subtle text-primary font-mono font-bold text-xs shadow-lg backdrop-blur-md flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              <span>PLACEMENT PREP</span>
            </div>
          </div>

          {/* Pure Academic Portal Mask Video */}
          <div className="absolute inset-0 w-full h-full z-10 flex items-center justify-center">
            <div
              ref={maskLayerRef}
              className="w-full h-full relative overflow-hidden flex items-center justify-center"
              style={{
                WebkitMaskImage: `url('${STUDENTHUB_MASK_SVG_URI}')`,
                maskImage: `url('${STUDENTHUB_MASK_SVG_URI}')`,
                WebkitMaskPosition: '50% 50%',
                maskPosition: '50% 50%',
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
                WebkitMaskSize: 'var(--maskW, 400px)',
                maskSize: 'var(--maskW, 400px)',
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
                preload="auto"
                poster={posterSrc}
                style={{
                  transform: 'scale(1.0)',
                  transformOrigin: '50% 50%',
                }}
              >
                <source src={videoSrc} type="video/mp4" />
                <source
                  src="https://res.cloudinary.com/dsuwzuaxp/video/upload/856381-hd_1920_1080_30fps_gsq11b.mp4"
                  type="video/mp4"
                />
              </video>
            </div>
          </div>
        </div>
      </div>

      {/* 3. CINEMATIC OUTRO SECTION */}
      <footer className="relative z-10 w-full min-h-screen bg-bg-app text-text-main flex flex-col items-center justify-center px-6 md:px-12 lg:px-16 py-16 select-none border-t border-border-subtle">
        <div className="w-full max-w-5xl mx-auto flex flex-col items-center text-center px-2 sm:px-4 z-10 space-y-6">
          <div className="p-3 rounded-btn bg-primary/15 border border-primary/30 text-primary">
            <GraduationCap className="w-8 h-8" />
          </div>

          <h2 className="text-[10vw] sm:text-[8vw] md:text-[6.5rem] lg:text-[7.8rem] font-black uppercase leading-[0.88] tracking-[-0.04em] text-text-main select-none">
            {outroTitle}
          </h2>

          <p className="max-w-2xl text-xs sm:text-sm md:text-base uppercase font-bold leading-relaxed tracking-wider text-text-muted opacity-90">
            {outroSubtitle}
          </p>

          <div className="pt-6">
            <a
              href="/dashboard"
              className="px-8 py-4 rounded-btn bg-primary hover:opacity-90 text-white font-black text-sm uppercase tracking-wider transition-all shadow-md"
            >
              Enter Aanvi Dashboard
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default StudentHubScrollZoom;
