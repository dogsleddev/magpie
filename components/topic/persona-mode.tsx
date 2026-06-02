'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Pause, Play, Plus, RotateCcw, Sparkles, X } from 'lucide-react';
import { addThought, editThought, removeThought } from '@/lib/actions/thoughts';
import type { Thought } from '@/lib/queries/types';
import type { OrganizeOutput } from '@/lib/ai/prompts';
import { useSpeechToText } from '@/components/mic/use-speech-to-text';
import MicButton from '@/components/mic/mic-button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

const isTemp = (id: string) => id.startsWith('temp-');

export default function PersonaMode({
  topicId,
  initialThoughts,
}: {
  topicId: string;
  initialThoughts: Thought[];
}) {
  const [thoughts, setThoughts] = useState<Thought[]>(initialThoughts);
  const [input, setInput] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [organizing, setOrganizing] = useState(false);
  const [organizeResult, setOrganizeResult] = useState<OrganizeOutput | null>(null);
  const [organizeError, setOrganizeError] = useState<string | null>(null);

  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  // temp ids removed before their insert resolves; the insert undoes itself.
  const cancelledRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  const commit = useCallback(
    async (raw: string) => {
      const content = raw.trim();
      if (!content) return;
      setError(null);
      setInput('');
      inputRef.current?.focus();

      const tempId = `temp-${crypto.randomUUID()}`;
      setThoughts((prev) => [
        ...prev,
        { id: tempId, content, topic_id: topicId, user_id: '', position: prev.length, created_at: null },
      ]);

      try {
        const saved = await addThought(topicId, content);
        if (cancelledRef.current.has(tempId)) {
          cancelledRef.current.delete(tempId);
          await removeThought(saved.id).catch(() => {});
          return;
        }
        setThoughts((prev) => prev.map((t) => (t.id === tempId ? saved : t)));
      } catch {
        cancelledRef.current.delete(tempId);
        setThoughts((prev) => prev.filter((t) => t.id !== tempId));
        setInput((cur) => cur || content);
        setError('Could not save that thought. Try again.');
      }
    },
    [topicId],
  );

  // Mic appends to whatever is already typed (snapshotted as base on start),
  // and commits the full field value, not just the spoken part.
  const baseRef = useRef('');
  const liveRef = useRef('');
  const { supported, recording, toggle } = useSpeechToText({
    onTranscript: (spoken) => {
      const next = baseRef.current ? `${baseRef.current} ${spoken}` : spoken;
      liveRef.current = next;
      setInput(next);
    },
    onStop: () => {
      const text = liveRef.current.trim();
      liveRef.current = '';
      baseRef.current = '';
      if (text) void commit(text);
    },
  });

  const handleMic = () => {
    if (!recording) {
      baseRef.current = input.trim();
      liveRef.current = input.trim();
    }
    toggle();
  };

  const startEdit = (t: Thought) => {
    setEditingId(t.id);
    setEditValue(t.content);
  };

  const commitEdit = async () => {
    const id = editingId;
    if (!id) return;
    setEditingId(null);
    const trimmed = editValue.trim();
    const original = thoughts.find((t) => t.id === id);
    if (!original) return;

    if (!trimmed) {
      await remove(id);
      return;
    }
    if (trimmed === original.content) return;

    setThoughts((prev) => prev.map((t) => (t.id === id ? { ...t, content: trimmed } : t)));
    if (isTemp(id)) return; // in-flight insert; local update is enough for now
    try {
      await editThought(id, trimmed);
    } catch {
      setThoughts((prev) => prev.map((t) => (t.id === id ? { ...t, content: original.content } : t)));
      setError('Could not save your edit. Try again.');
    }
  };

  const remove = async (id: string) => {
    setError(null);
    if (isTemp(id)) {
      cancelledRef.current.add(id);
      setThoughts((prev) => prev.filter((t) => t.id !== id));
      return;
    }
    const idx = thoughts.findIndex((t) => t.id === id);
    const item = thoughts[idx];
    setThoughts((prev) => prev.filter((t) => t.id !== id));
    try {
      await removeThought(id);
    } catch {
      if (item) {
        setThoughts((prev) => {
          const next = [...prev];
          next.splice(Math.min(idx, next.length), 0, item);
          return next;
        });
      }
      setError('Could not delete that thought. Try again.');
    }
  };

  const organize = async () => {
    setOrganizing(true);
    setOrganizeError(null);
    try {
      const res = await fetch('/api/ai/organize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId }),
      });
      const data = (await res.json()) as { result?: OrganizeOutput; error?: string };
      if (!res.ok || !data.result) {
        setOrganizeError(data.error ?? 'Organize failed. Try again.');
        return;
      }
      setOrganizeResult(data.result);
    } catch {
      setOrganizeError('Organize failed. Try again.');
    } finally {
      setOrganizing(false);
    }
  };

  const count = thoughts.length;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs italic text-text-dim">what&apos;s on your mind?</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setRunning((r) => !r)}
            aria-label={running ? 'Pause riff timer' : 'Start riff timer'}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs tabular-nums transition-colors',
              running
                ? 'border-teal/40 bg-teal/10 text-teal'
                : 'border-border text-text-muted hover:border-border-strong hover:text-text',
            )}
          >
            {running ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            <span>{formatTime(elapsed)}</span>
          </button>
          {elapsed > 0 && (
            <button
              type="button"
              onClick={() => {
                setRunning(false);
                setElapsed(0);
              }}
              aria-label="Reset riff timer"
              className="rounded-full p-1 text-text-dim transition-colors hover:text-text"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <span className="text-xs text-text-dim">
          {count} thought{count === 1 ? '' : 's'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void commit(input);
            }
          }}
          placeholder="What's on your mind?"
          autoComplete="off"
          aria-label="Capture a thought"
        />
        <MicButton supported={supported} recording={recording} onClick={handleMic} />
        <button
          type="button"
          onClick={() => void commit(input)}
          aria-label="Add thought"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded border border-border bg-bg-card-2 text-text transition-colors hover:border-border-strong hover:bg-bg-card"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      {count === 0 ? (
        <p className="py-2 text-sm text-text-dim">Catch thoughts as they come, edit later.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {thoughts.map((t) =>
            editingId === t.id ? (
              <li key={t.id}>
                <Input
                  value={editValue}
                  autoFocus
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => void commitEdit()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      void commitEdit();
                    }
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      setEditingId(null);
                    }
                  }}
                  aria-label="Edit thought"
                />
              </li>
            ) : (
              <li
                key={t.id}
                className="group flex items-start gap-2 rounded-lg border border-border bg-bg-card px-3 py-2 text-sm"
              >
                <span className="select-none pt-0.5 text-teal">·</span>
                <button
                  type="button"
                  onClick={() => startEdit(t)}
                  className="flex-1 text-left text-text"
                >
                  {t.content}
                </button>
                <button
                  type="button"
                  onClick={() => void remove(t.id)}
                  aria-label="Remove thought"
                  className="shrink-0 text-text-dim opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ),
          )}
        </ul>
      )}

      {count >= 3 && (
        <div className="flex items-center justify-end border-t border-border pt-3">
          <button
            type="button"
            onClick={() => void organize()}
            disabled={organizing}
            className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium text-purple transition-colors hover:bg-purple/10 disabled:opacity-50"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{organizing ? 'Organizing...' : 'Organize with AI'}</span>
          </button>
        </div>
      )}

      {organizeError && <p className="text-xs text-danger">{organizeError}</p>}

      {organizeResult && (
        <div className="rounded-lg border border-purple/20 bg-purple/[0.06] px-3.5 py-3 text-sm leading-relaxed">
          <OrganizeSection title="Insights" items={organizeResult.insights} />
          <OrganizeSection title="Counter-arguments" items={organizeResult.counters} />
          <OrganizeSection title="Follow-ups" items={organizeResult.followups} />
          <OrganizeSection title="Topics to learn more about" items={organizeResult.learn_more} />
        </div>
      )}
    </div>
  );
}

function OrganizeSection({ title, items }: { title: string; items: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="mb-2.5 last:mb-0">
      <h4 className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-purple">{title}</h4>
      <ul className="flex flex-col gap-1">
        {items.map((item, i) => (
          <li
            key={i}
            className="relative pl-3 text-text-muted before:absolute before:left-1 before:text-purple before:content-['·']"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
