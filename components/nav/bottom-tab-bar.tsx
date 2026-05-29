'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Tags, Compass, BookText } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = {
  key: 'grid' | 'facets' | 'discover' | 'journal';
  label: string;
  icon: typeof LayoutGrid;
};

// Only Grid routes in Phase 1. Facets / Discover / Journal land in later
// phases; rendered as disabled stubs until their routes exist (typedRoutes
// would fail the build on a Link to a non-existent route).
const TABS: Tab[] = [
  { key: 'grid', label: 'Grid', icon: LayoutGrid },
  { key: 'facets', label: 'Facets', icon: Tags },
  { key: 'discover', label: 'Discover', icon: Compass },
  { key: 'journal', label: 'Journal', icon: BookText },
];

export default function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto flex w-full max-w-md items-stretch justify-around border-t border-border bg-bg/90 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isGrid = tab.key === 'grid';
        const active = isGrid && pathname === '/';

        const inner = (
          <span
            className={cn(
              'flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium',
              active ? 'text-teal' : 'text-text-dim',
              !isGrid && 'opacity-40',
            )}
          >
            <Icon className="h-5 w-5" strokeWidth={2} />
            {tab.label}
          </span>
        );

        if (isGrid) {
          return (
            <Link key={tab.key} href="/" className="flex flex-1">
              {inner}
            </Link>
          );
        }

        return (
          <button
            key={tab.key}
            type="button"
            disabled
            aria-disabled
            className="flex flex-1 cursor-not-allowed"
          >
            {inner}
          </button>
        );
      })}
    </nav>
  );
}
