import Link from 'next/link';
import Wordmark from '@/components/brand/wordmark';

export default function AppBar() {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-bg/80 px-4 py-3 backdrop-blur">
      <Link
        href="/home"
        aria-label="Go home"
        className="rounded transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal"
      >
        <Wordmark />
      </Link>
      <Link
        href="/#join"
        className="shrink-0 rounded-md bg-[var(--text)] px-3.5 py-1.5 text-sm font-medium text-[var(--bg)] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal"
      >
        Join the waitlist
      </Link>
    </header>
  );
}
