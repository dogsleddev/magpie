'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Tags, Library, Waypoints, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = {
  key: 'today' | 'grid' | 'facets' | 'nest' | 'library';
  label: string;
  icon: typeof LayoutGrid;
  href: Route;
};

// Today (the glint loop), Grid, Facets, Nest, and Library. Library replaced the
// old random Rediscover tab (the spin lives on as the dice inside the Library).
const TABS: Tab[] = [
  { key: 'today', label: 'Today', icon: Sparkles, href: '/home' },
  { key: 'grid', label: 'Grid', icon: LayoutGrid, href: '/app' },
  { key: 'facets', label: 'Facets', icon: Tags, href: '/facets' },
  { key: 'nest', label: 'Nest', icon: Waypoints, href: '/nest' },
  { key: 'library', label: 'Library', icon: Library, href: '/library' as Route },
];

// 'app' is the standard phone-frame bar. 'overlay' is a floating pill for the
// full-bleed desktop Nest, matching its docked-panel styling.
export default function BottomTabBar({ variant = 'app' }: { variant?: 'app' | 'overlay' }) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        'flex items-stretch justify-around',
        variant === 'app' &&
          'fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-md border-t border-border bg-bg/90 pb-[env(safe-area-inset-bottom)] backdrop-blur',
        variant === 'overlay' &&
          'fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 z-30 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 rounded-2xl border border-border bg-bg-card/85 shadow-2xl backdrop-blur',
      )}
    >
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const active =
          (tab.key === 'today' && pathname === '/home') ||
          (tab.key === 'grid' && pathname === '/app') ||
          (tab.key === 'facets' && pathname.startsWith('/facets')) ||
          (tab.key === 'nest' && pathname.startsWith('/nest')) ||
          (tab.key === 'library' && pathname.startsWith('/library'));

        const inner = (
          <span
            className={cn(
              'flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium',
              active ? 'text-teal' : 'text-text-dim',
            )}
          >
            <Icon className="h-5 w-5" strokeWidth={2} />
            {tab.label}
          </span>
        );

        return (
          <Link key={tab.key} href={tab.href} className="flex flex-1">
            {inner}
          </Link>
        );
      })}
    </nav>
  );
}
