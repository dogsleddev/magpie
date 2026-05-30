'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

export default function TopicSearch({ defaultValue = '' }: { defaultValue?: string }) {
  const [q, setQ] = useState(defaultValue);
  const router = useRouter();

  function submit(e: FormEvent) {
    e.preventDefault();
    const value = q.trim();
    if (!value) return;
    router.push(`/search?q=${encodeURIComponent(value)}`);
  }

  return (
    <form onSubmit={submit} className="relative" role="search">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-dim" />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search your wiki"
        aria-label="Search your wiki"
        className="h-11 w-full rounded border border-border bg-bg-input pl-9 pr-3 text-sm text-text placeholder:text-text-dim focus-visible:border-border-strong focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal"
      />
    </form>
  );
}
