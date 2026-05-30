'use client';

import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

type Mode = 'brief' | 'challenge' | 'questions';

export default function TextMode({
  topicId,
  mode,
  tagline,
  personaName,
}: {
  topicId: string;
  mode: Mode;
  tagline: string;
  personaName: string;
}) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (reroll: boolean) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/ai/${mode}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topicId, reroll }),
        });
        const data = (await res.json()) as { content?: string; error?: string };
        if (!res.ok || !data.content) {
          setError(data.error ?? 'Something went wrong. Try again.');
          return;
        }
        setContent(data.content);
      } catch {
        setError('Something went wrong. Try again.');
      } finally {
        setLoading(false);
      }
    },
    [mode, topicId],
  );

  useEffect(() => {
    void load(false);
  }, [load]);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs italic text-text-dim">{tagline}</p>
      <div className="rounded-lg border border-border bg-bg-card p-4">
        {loading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-text-dim">
            <Spinner />
            <span>asking {personaName.toLowerCase()}...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-danger">{error}</p>
            <RerollButton label="Try again" onClick={() => void load(true)} />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="text-sm leading-relaxed text-text">
              <AIContent text={content ?? ''} />
            </div>
            <div className="flex justify-end border-t border-border pt-3">
              <RerollButton label="Reroll" onClick={() => void load(true)} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-teal" />
  );
}

function RerollButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium text-text-muted transition-colors hover:bg-bg-card-2 hover:text-text"
    >
      <RefreshCw className="h-3.5 w-3.5" />
      <span>{label}</span>
    </button>
  );
}

/**
 * Renders Maggie's text output: numbered lists become an ordered list, a leading
 * *Tag.* (Challenge) becomes an emphasized lead, everything else paragraphizes.
 */
function AIContent({ text }: { text: string }) {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const lines = trimmed
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const numbered = lines.length >= 2 && lines.every((l) => /^\d+[.)]\s/.test(l));
  if (numbered) {
    return (
      <ol className="flex list-none flex-col gap-2">
        {lines.map((l, i) => (
          <li key={i} className="flex gap-2">
            <span className="shrink-0 text-teal">{i + 1}.</span>
            <span>{l.replace(/^\d+[.)]\s*/, '')}</span>
          </li>
        ))}
      </ol>
    );
  }

  const paragraphs = trimmed
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  return (
    <div className="flex flex-col gap-2">
      {paragraphs.map((p, i) => {
        const tag = p.match(/^\*([^*\n]+)\*\s*([\s\S]*)$/);
        if (tag) {
          return (
            <p key={i} className="whitespace-pre-wrap">
              <span className="font-semibold uppercase tracking-wide text-purple">{tag[1]}</span>
              {tag[2] ? ` ${tag[2]}` : ''}
            </p>
          );
        }
        return (
          <p key={i} className="whitespace-pre-wrap">
            {p}
          </p>
        );
      })}
    </div>
  );
}
