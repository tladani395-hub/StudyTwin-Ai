'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import IntroAuthPortal from '@/components/auth/IntroAuthPortal';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#05040a] text-white flex flex-col justify-center px-4 py-8 select-none" />
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-app,#0E0C17)] text-[var(--text-main,#FFFFFF)] flex flex-col justify-center px-4 py-8 sm:py-12 select-none">
      {/* Strict Landing: Intro & Authentication Portal ONLY (No further pages/distractions behind or below) */}
      <main className="w-full max-w-5xl mx-auto my-auto">
        <IntroAuthPortal />
      </main>
    </div>
  );
}
