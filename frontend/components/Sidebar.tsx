'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BotMessageSquare,
  ClipboardCheck,
  Award,
  Network,
  CalendarDays,
  FolderKanban,
  UploadCloud,
  FlaskConical,
  Sparkles
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Source-Grounded Tutor', href: '/tutor', icon: BotMessageSquare, badge: 'Adaptive' },
  { name: 'Adaptive Assessments', href: '/assessment', icon: ClipboardCheck },
  { name: 'Results & Feedback', href: '/results', icon: Award },
  { name: 'Knowledge Map', href: '/knowledge-map', icon: Network },
  { name: 'Study Planner', href: '/study-plan', icon: CalendarDays },
  { name: 'Courses & Material', href: '/courses', icon: FolderKanban },
  { name: 'Multimodal Upload', href: '/upload', icon: UploadCloud },
  { name: 'RAGAS Evaluation', href: '/evaluation', icon: FlaskConical, badge: '94.1%' },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0 hidden lg:flex flex-col justify-between border-r border-border-subtle bg-bg-sidebar p-4 min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        <div className="px-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            Study Workspace
          </p>
        </div>

        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-btn text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-primary text-primary-contrast shadow-sm font-bold'
                    : 'text-text-muted hover:text-text-main hover:bg-bg-surface'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-primary-contrast' : 'text-text-muted group-hover:text-text-main'
                    }`}
                  />
                  <span>{item.name}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-primary-contrast/20 text-primary-contrast'
                        : 'bg-bg-elevated text-text-muted border border-border-subtle'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom info card */}
      <div className="p-4 rounded-card bg-bg-surface border border-border-subtle space-y-2 shadow-card">
        <div className="flex items-center space-x-2 text-xs font-semibold text-primary">
          <Sparkles className="w-4 h-4 text-accent" />
          <span>Learner State: BKT Active</span>
        </div>
        <p className="text-[11px] text-text-muted leading-snug">
          Bayesian Knowledge Tracing dynamically updates your mastery after every quiz & query.
        </p>
      </div>
    </aside>
  );
};

