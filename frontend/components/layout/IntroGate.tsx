'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { TopNav } from './TopNav';

// Dynamically import StudyTwinScrollZoom with SSR disabled to prevent hydration mismatch with GSAP
const StudyTwinScrollZoom = dynamic(
  () => import('@/components/ui/studytwin-scroll-zoom').then((mod) => mod.StudyTwinScrollZoom),
  { ssr: false }
);

interface IntroGateProps {
  children: React.ReactNode;
}

export const IntroGate: React.FC<IntroGateProps> = ({ children }) => {
  const [introSeen, setIntroSeen] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const seen = sessionStorage.getItem('st_intro_seen');
      if (seen === 'true') {
        setIntroSeen(true);
      } else {
        setIntroSeen(false);
      }
    } catch (e) {
      setIntroSeen(false);
    }
  }, []);

  const handleEnter = () => {
    try {
      sessionStorage.setItem('st_intro_seen', 'true');
    } catch (e) {}
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
    setIntroSeen(true);
  };

  if (introSeen === null) {
    return <div className="min-h-screen bg-bg-app" />;
  }

  if (!introSeen) {
    return (
      <div className="w-full min-h-screen bg-bg-app">
        <StudyTwinScrollZoom onEnter={handleEnter} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg-app text-text-main selection:bg-primary selection:text-white">
      <TopNav />
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
};
