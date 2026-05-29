import Wordmark from '@/components/brand/wordmark';

export default function AppBar() {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-bg/80 px-4 py-3 backdrop-blur">
      <Wordmark />
    </header>
  );
}
