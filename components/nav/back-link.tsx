import Link from 'next/link';
import type { Route } from 'next';
import { ChevronLeft } from 'lucide-react';

// Accepts a plain string so callers can pass dynamic hrefs (e.g.
// `/subject/${id}`) without fighting typedRoutes through a wrapper prop.
export default function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href as Route}
      className="inline-flex items-center gap-1 text-sm text-text-muted transition-colors hover:text-text"
    >
      <ChevronLeft className="h-4 w-4" />
      {label}
    </Link>
  );
}
