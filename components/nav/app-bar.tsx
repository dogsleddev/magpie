import Link from 'next/link';
import Wordmark from '@/components/brand/wordmark';

export default function AppBar() {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-bg/80 px-4 py-3 backdrop-blur">
      <Link
        href="/app"
        aria-label="Go to your grid"
        className="rounded transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal"
      >
        <Wordmark />
      </Link>
    </header>
  );
}
