'use client';

import React, { useState } from 'react';
import CameraDoubtModal from '@/components/camera/CameraDoubtModal';
import { Camera, Mic, Sparkles, Eye, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';

export default function CameraDoubtPage() {
  const { mode } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(true);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 font-sans">
      <div className="p-6 sm:p-8 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-xl text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-[var(--primary)] text-white flex items-center justify-center mx-auto text-3xl shadow-lg">
          📸
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-[var(--text-main)]">
            Multimodal Doubt & Feynman Studio
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-lg mx-auto mt-1">
            Snap photos of textbook equations, diagrams, or slides for instant grounded solving, or explain concepts back for AI mastery scoring.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-8 py-3.5 rounded-2xl bg-[var(--primary)] text-white font-bold text-xs shadow-xl transition-all hover:scale-105 inline-flex items-center gap-2"
        >
          <Camera className="w-4 h-4" />
          <span>Launch Camera & Feynman Studio</span>
        </button>
      </div>

      <CameraDoubtModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        courseId={1}
      />
    </div>
  );
}
