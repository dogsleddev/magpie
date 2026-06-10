'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Tags, Shuffle, Waypoints } from 'lucide-react';
import { rediscover } from '@/lib/actions/topics';
import { cn } from '@/lib/utils';

type Tab = {
  key: 'grid' | 'facets' | 'nest' | 'rediscover';
  label: string;
  icon: typeof LayoutGrid;
};

// Grid, Facets, and Nest route. Rediscover spins to a random topic (server action).
const TABS: Tab[] = [
  { key: 'grid', label: 'Grid', icon: LayoutGrid },
  { key: 'facets', label: 'Facets', icon: Tags },
  { key: 'nest', label: 'Nest', icon: Waypoints },
  { key: 'rediscover', label: 'Rediscover', icon: Shuffle },
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
          (tab.key === 'grid' && pathname === '/app') ||
          (tab.key === 'facets' && pathname.startsWith('/facets')) ||
          (tab.key === 'nest' && pathname.startsWith('/nest'));

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

        if (tab.key === 'grid') {
          return (
            <Link key={tab.key} href="/app" className="flex flex-1">
              {inner}
            </Link>
          );
        }

        if (tab.key === 'facets') {
          return (
            <Link key={tab.key} href="/facets" className="flex flex-1">
              {inner}
            </Link>
          );
        }

        if (tab.key === 'nest') {
          return (
            <Link key={tab.key} href="/nest" className="flex flex-1">
              {inner}
            </Link>
          );
        }

        // Rediscover: spin to a random topic in the wiki.
        return (
          <form key={tab.key} action={rediscover} className="flex flex-1">
            <button type="submit" className="flex w-full">
              {inner}
            </button>
          </form>
        );
      })}
    </nav>
  );
}
