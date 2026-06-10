'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteTopicById } from '@/lib/actions/topics';

/**
 * Quiet delete control for the topic page. Sits dimmed at the very bottom so it
 * stays in the background; a tap reveals an inline confirm before it removes the
 * topic and returns to the subject.
 */
export default function DeleteTopic({
  topicId,
  subjectId,
  isGroup = false,
}: {
  topicId: string;
  subjectId: string;
  isGroup?: boolean;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();

  function remove() {
    setError(false);
    startTransition(async () => {
      try {
        await deleteTopicById(topicId);
        router.push(`/subject/${subjectId}`);
      } catch {
        setError(true);
        setConfirming(false);
      }
    });
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-[11px] text-text-dim/50 transition-colors hover:text-danger"
      >
        {error ? "couldn't delete, try again" : isGroup ? 'delete collection' : 'delete topic'}
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-2.5 text-[11px] text-text-dim">
      {isGroup ? 'delete this collection and every sub-topic in it?' : 'delete this topic?'}
      <button
        type="button"
        onClick={remove}
        disabled={pending}
        className="font-medium text-danger transition-opacity hover:underline disabled:opacity-50"
      >
        {pending ? 'deleting...' : 'yes, delete'}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        disabled={pending}
        className="transition-colors hover:text-text-muted"
      >
        cancel
      </button>
    </span>
  );
}
