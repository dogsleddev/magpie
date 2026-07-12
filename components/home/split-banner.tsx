'use client';

import { useState, useTransition } from 'react';
import { splitGlint } from '@/lib/actions/glints';

/**
 * When Maggie reads a caught glint as a few distinct curiosities, this offers to
 * split it. Default is "keep as one" (it dismisses). "split into N" opens an
 * editable preview of the proposed glints (drop any, edit any), then "catch all"
 * files each as its own glint and removes the combined original. One catch stays
 * one streak tick. onSplitDone hands the created glints back to the caught card.
 */
export default function SplitBanner({
  topicId,
  splits,
  onSplitDone,
}: {
  topicId: string;
  splits: string[];
  onSplitDone: (created: { id: string; title: string }[]) => void;
}) {
  const [dismissed, setDismissed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [rows, setRows] = useState<string[]>(splits);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  if (dismissed) return null;

  const kept = rows.map((r) => r.trim()).filter(Boolean);

  function catchAll() {
    if (kept.length < 2 || busy) return;
    setBusy(true);
    startTransition(async () => {
      try {
        const created = await splitGlint(topicId, kept);
        onSplitDone(created);
      } catch {
        setBusy(false);
      }
    });
  }

  return (
    <div className="rounded-lg border border-[color:var(--purple-soft)] bg-[rgba(127,119,221,0.10)] p-3 text-xs">
      {!editing ? (
        <div className="flex flex-col gap-2">
          <span className="text-[color:var(--purple)]">
            looks like you caught a few things here.
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="rounded-full border border-[color:var(--purple-soft)] px-3 py-1 text-muted-foreground"
            >
              keep as one
            </button>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-full bg-[color:var(--purple-soft)] px-3 py-1 font-medium text-white"
            >
              split into {splits.length}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((r, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={r}
                onChange={(e) => setRows((rs) => rs.map((x, j) => (j === i ? e.target.value : x)))}
                aria-label={`Glint ${i + 1}`}
                className="flex-1 rounded border border-input bg-transparent px-2 py-1 outline-none focus:ring-1 focus:ring-ring"
              />
              <button
                type="button"
                onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}
                aria-label="Drop this one"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                ×
              </button>
            </div>
          ))}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              disabled={busy || kept.length < 2}
              onClick={catchAll}
              className="rounded-full bg-[color:var(--purple-soft)] px-3 py-1 font-medium text-white disabled:opacity-50"
            >
              {busy ? 'catching...' : `catch all ${kept.length}`}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-full border border-[color:var(--purple-soft)] px-3 py-1 text-muted-foreground"
            >
              cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
