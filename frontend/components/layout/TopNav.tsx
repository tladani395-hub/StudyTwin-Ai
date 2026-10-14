'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  MessagesSquare,
  ClipboardCheck,
  BarChart3,
  Network,
  CalendarDays,
  BookOpen,
  UploadCloud,
  FlaskConical,
  Settings,
  Search,
  Bell,
  Flame,
  User,
  LogOut,
  GraduationCap,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import Theme3DButton from '@/components/ui/Theme3DButton';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Tutor', href: '/tutor', icon: MessagesSquare },
  { name: 'Assessments', href: '/assessments', icon: ClipboardCheck },
  { name: 'Results', href: '/results', icon: BarChart3 },
  { name: 'Study Plan', href: '/study-plan', icon: CalendarDays },
  { name: 'Courses', href: '/courses', icon: BookOpen },
  { name: 'Upload', href: '/upload', icon: UploadCloud },
  { name: 'Evaluation', href: '/evaluation', icon: FlaskConical },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const TopNav: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close avatar dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isItemActive = (href: string) => {
    if (href === '/dashboard' && (pathname === '/' || pathname === '/dashboard')) {
      return true;
    }
    if (href === '/assessments' && (pathname === '/assessments' || pathname === '/assessment')) {
      return true;
    }
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-40 w-full h-16 bg-bg-surface/90 backdrop-blur-md border-b border-border-subtle select-none">
      <div className="w-full max-w-[1600px] h-full mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
        {/* Left: Brand Logo & Title */}
        <Link
          href="/dashboard"
          className="flex items-center space-x-2.5 flex-shrink-0 group py-1"
          aria-label="Aanvi AI Home"
        >
          <div className="w-9 h-9 rounded-full bg-primary/15 border border-primary/30 text-primary flex items-center justify-center transition-all group-hover:scale-105 shadow-sm">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-black text-base text-text-main tracking-tight leading-none flex items-center gap-1">
              Aanvi <span className="text-primary">AI</span>
            </span>
            <span className="text-[10px] font-mono font-semibold text-text-muted tracking-wider uppercase leading-tight">
              Source-Grounded
            </span>
          </div>
        </Link>

        {/* Center: Horizontal Scrollable Nav Pills */}
        <nav
          className="flex-1 flex items-center space-x-1.5 overflow-x-auto no-scrollbar scroll-smooth px-2 max-w-4xl"
          aria-label="Main Navigation"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                  active
                    ? 'bg-primary text-white font-bold shadow-md scale-[1.02]'
                    : 'text-text-muted hover:text-text-main hover:bg-bg-elevated'
                }`}
              >
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span className={`${active ? 'inline' : 'hidden md:inline'}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Right: Quick Tools, Streak & Avatar Menu */}
        <div className="flex items-center space-x-2.5 flex-shrink-0">
          {/* Quick Search */}
          <button
            type="button"
            onClick={() => router.push('/tutor')}
            className="p-2 rounded-full text-text-muted hover:text-text-main hover:bg-bg-elevated transition-colors"
            title="Search knowledge base"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              type="button"
              className="p-2 rounded-full text-text-muted hover:text-text-main hover:bg-bg-elevated transition-colors relative"
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary shadow-sm" />
            </button>
          </div>

          {/* 3D Theme & Palette Switcher */}
          <Theme3DButton />

          {/* Streak Chip */}
          <div
            className="hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-bg-app border border-border-subtle text-text-main text-xs font-mono font-bold"
            title="Active learning streak"
          >
            <Flame className="w-3.5 h-3.5 text-accent" />
            <span>{user.streak || 5}-day</span>
          </div>

          {/* User Avatar Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center space-x-1.5 p-1 rounded-full hover:bg-bg-elevated transition-all border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary"
              aria-expanded={userMenuOpen}
              aria-label="User profile menu"
            >
              <div className="w-7 h-7 rounded-full bg-primary text-white font-display font-black text-xs flex items-center justify-center shadow-sm">
                {user.name ? user.name[0].toUpperCase() : 'T'}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-text-muted hidden sm:block" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-card bg-bg-surface border border-border-subtle shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2.5 border-b border-border-subtle">
                  <p className="text-xs font-bold text-text-main leading-none">{user.name}</p>
                  <p className="text-[11px] text-text-muted font-mono mt-1 truncate">{user.email}</p>
                  <div className="mt-2 inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-mono border border-primary/20">
                    <Sparkles className="w-3 h-3" />
                    <span>Level {user.level} Scholar</span>
                  </div>
                </div>

                <div className="py-1">
                  <Link
                    href="/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center space-x-2.5 px-4 py-2 text-xs text-text-muted hover:text-text-main hover:bg-bg-elevated transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-primary" />
                    <span>Profile</span>
                  </Link>

                  <Link
                    href="/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center space-x-2.5 px-4 py-2 text-xs text-text-muted hover:text-text-main hover:bg-bg-elevated transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5 text-primary" />
                    <span>Learning Mode & Settings</span>
                  </Link>
                </div>

                <div className="border-t border-border-subtle pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      logout();
                      router.push('/login');
                    }}
                    className="w-full flex items-center space-x-2.5 px-4 py-2 text-xs text-text-muted hover:text-text-main hover:bg-bg-elevated transition-colors text-left"
                  >
                    <LogOut className="w-3.5 h-3.5 text-text-muted" />
                    <span>Log out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
