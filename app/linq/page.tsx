export const metadata = { title: 'Magpie × Linq' };

export default function LinqPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center gap-4 bg-bg px-4 py-8">
      <div className="flex w-full max-w-5xl items-center justify-between gap-3">
        <h1 className="font-display text-xl font-semibold tracking-tight text-text">
          Magpie
          <span
            aria-hidden
            className="ml-1 inline-block h-2 w-2 rounded-full bg-teal align-middle"
          />
          <span className="ml-2 font-sans text-sm font-normal text-text-dim">× Linq</span>
        </h1>
        <a
          href="/linq/linq.jpg"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded border border-border px-3 py-1.5 text-sm text-text-muted transition-colors hover:border-border-strong hover:text-text"
        >
          Open full size
        </a>
      </div>

      <p className="w-full max-w-5xl text-sm text-text-dim">
        The iMessage front door: text Magpie at her Linq number and the thought lands in your wiki.
      </p>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/linq/linq.jpg"
        alt="Linq sandbox: an iMessage thread texting Magpie to add a topic, with Magpie's reply"
        className="w-full max-w-5xl rounded-lg border border-border"
      />
    </main>
  );
}
