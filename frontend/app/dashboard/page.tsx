'use client';

import React from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { JuniorDashboard } from '@/components/junior/JuniorDashboard';
import { SeniorDashboard } from '@/components/senior/SeniorDashboard';

export default function DashboardPage() {
  const { mode } = useAuthStore();

  if (mode === 'explorer') {
    return <JuniorDashboard />;
  }

  return <SeniorDashboard />;
}
