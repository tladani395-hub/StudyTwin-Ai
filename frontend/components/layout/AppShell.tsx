'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { useThemeStore } from '@/stores/useThemeStore';
import ExplorerShell from '@/components/layout/ExplorerShell';
import ScholarShell from '@/components/layout/ScholarShell';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const { mode } = useAuthStore();
  const { theme } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Apply data-mode and data-theme to HTML root
    document.documentElement.setAttribute('data-mode', mode);
    document.documentElement.setAttribute('data-theme', theme);
  }, [mode, theme]);

  const { isAuthenticated } = useAuthStore();

  // Auth and legal document routes don't use the standard dashboard shells (open as full clean pages)
  const isStandaloneRoute =
    pathname === '/terms' ||
    pathname === '/privacy' ||
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/intro' ||
    pathname === '/welcome' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password' ||
    (pathname === '/' && !isAuthenticated);
  if (isStandaloneRoute) {
    return (
      <div className="min-h-screen">
        {children}
      </div>
    );
  }

  return (
    <>
      {mode === 'explorer' ? (
        <ExplorerShell>{children}</ExplorerShell>
      ) : (
        <ScholarShell>{children}</ScholarShell>
      )}
    </>
  );
}
