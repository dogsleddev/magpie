'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { addTopicViaMagpie } from '@/lib/actions/topics';

export default function AddTopicDialog({
  subjectId,
  personaName = 'Magpie',
  triggerClassName,
}: {
  subjectId?: string;
  personaName?: string;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [idea, setIdea] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !pending) {
        setOpen(false);
        setError(null);
        setIdea('');
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, pending]);

  function close() {
    if (pending) return;
    setOpen(false);
    setError(null);
    setIdea('');
  }

  function submit() {
    const value = idea.trim();
    if (!value || pending) return;
    setError(null);
    startTransition(async () => {
      try {
        const result = await addTopicViaMagpie(value, subjectId ? { subjectId } : undefined);
        setOpen(false);
        setIdea('');
        router.push(`/topic/${result.topicId}`);
        router.refresh();
      } catch {
        setError('hm, that one slipped away. try again.');
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="md"
        className={triggerClassName ?? 'w-full'}
        onClick={() => setOpen(true)}
      >
        <Plus className="h-4 w-4" strokeWidth={2.5} />
        Add topic
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
          onClick={close}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Add topic"
            className="w-full max-w-md rounded-2xl border border-border bg-bg-card p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h2 className="font-display text-lg font-medium text-text">Add topic</h2>
                <p className="text-xs italic text-text-dim">catch it before it&apos;s gone</p>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="rounded p-1 text-text-dim transition-colors hover:bg-bg-card-2 hover:text-text"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mb-2 text-sm text-text-muted">
              tell {personaName.toLowerCase()} an idea. it files it under the right subject and tags
              it.
            </p>

            <textarea
              autoFocus
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              rows={3}
              placeholder="e.g. high agency"
              className="w-full resize-none rounded border border-border bg-bg-input px-3.5 py-2.5 text-sm text-text placeholder:text-text-dim focus-visible:border-border-strong focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal"
            />

            {error && <p className="mt-2 text-sm text-danger">{error}</p>}

            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={close} disabled={pending}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={submit}
                disabled={pending || !idea.trim()}
              >
                <Sparkles className="h-4 w-4" />
                {pending ? `${personaName} is filing...` : 'Add it'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
