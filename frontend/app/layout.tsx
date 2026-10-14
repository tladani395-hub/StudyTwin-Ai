import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import './globals.css';
import 'katex/dist/katex.min.css';
import { AuthProvider } from '@/lib/auth-context';
import AppShell from '@/components/layout/AppShell';

import SplashScreen from '@/components/brand/SplashScreen';
import OfflineBanner from '@/components/ui/OfflineBanner';

import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from 'next/font/google';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Aanvi — Source-Grounded Adaptive AI Study Companion',
  description:
    'Source-grounded multimodal AI study companion with exact citations, BKT mastery tracking, and age-gated Explorer & Scholar modes.',
  icons: {
    icon: '/brand/favicon.svg',
    shortcut: '/brand/favicon.svg',
    apple: '/brand/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-mode="scholar"
      data-theme="dark"
      data-palette="a"
      className={`${plusJakartaSans.variable} ${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <meta name="theme-color" content="#121614" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var storedUser = localStorage.getItem('aanvi_user');
                var storedMode = storedUser ? JSON.parse(storedUser).mode : localStorage.getItem('aanvi_mode') || 'scholar';
                var storedTheme = localStorage.getItem('aanvi_theme') || 'dark';
                if (storedTheme === 'system') {
                  storedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                }
                var rawPal = localStorage.getItem('aanvi_palette');
                var storedPalette = (rawPal === 'b' || rawPal === 'secondary') ? 'b' : 'a';
                document.documentElement.setAttribute('data-mode', storedMode);
                document.documentElement.setAttribute('data-theme', storedTheme);
                document.documentElement.setAttribute('data-palette', storedPalette);
                if (storedTheme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body
        className="antialiased min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] selection:bg-[var(--primary)] selection:text-[var(--primary-contrast)] transition-colors duration-200"
        suppressHydrationWarning
      >
        <AuthProvider>
          <OfflineBanner />
          <SplashScreen />
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}

