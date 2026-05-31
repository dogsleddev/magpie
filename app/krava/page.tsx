export const metadata = { title: 'Magpie · Krava × Linq' };

const DECK_URL = 'https://www.magpie.wiki/krava/deck.pptx';
const EMBED_URL = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(DECK_URL)}`;

export default function KravaDeckPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center gap-4 bg-bg px-4 py-6">
      <div className="flex w-full max-w-5xl items-center justify-between gap-3">
        <h1 className="font-display text-xl font-semibold tracking-tight text-text">
          Magpie
          <span
            aria-hidden
            className="ml-1 inline-block h-2 w-2 rounded-full bg-teal align-middle"
          />
          <span className="ml-2 font-sans text-sm font-normal text-text-dim">Krava × Linq</span>
        </h1>
        <a
          href="/krava/deck.pptx"
          download
          className="shrink-0 rounded border border-border px-3 py-1.5 text-sm text-text-muted transition-colors hover:border-border-strong hover:text-text"
        >
          Download deck
        </a>
      </div>

      <div className="aspect-video w-full max-w-5xl overflow-hidden rounded-lg border border-border bg-bg-card">
        <iframe
          src={EMBED_URL}
          className="h-full w-full"
          allowFullScreen
          title="Magpie · Krava × Linq hackathon deck"
        />
      </div>

      <p className="text-xs text-text-dim">
        If the embedded viewer does not load, use Download deck above.
      </p>
    </main>
  );
}
