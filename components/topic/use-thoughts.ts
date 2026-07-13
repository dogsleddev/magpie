'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { addThought, editThought, removeThought } from '@/lib/actions/thoughts';
import type { Thought } from '@/lib/queries/types';

const isTemp = (id: string) => id.startsWith('temp-');

/**
 * The thoughts (notes) store for a topic, with optimistic add / edit / remove.
 * Lifted out of the old PersonaMode so the merged Maggie tab can share ONE list
 * between the notes view and the "keep this" action in the chat. `add` is the
 * only mutator the chat needs; the notes view uses all three.
 */
export function useThoughts(topicId: string, initial: Thought[]) {
  const [thoughts, setThoughts] = useState<Thought[]>(initial);
  const [error, setError] = useState<string | null>(null);
  // temp ids removed before their insert resolves; the insert undoes itself.
  const cancelledRef = useRef<Set<string>>(new Set());
  // a live mirror so edit/remove can snapshot without stale closures.
  const ref = useRef<Thought[]>(initial);
  useEffect(() => {
    ref.current = thoughts;
  }, [thoughts]);

  const add = useCallback(
    async (raw: string): Promise<Thought | null> => {
      const content = raw.trim();
      if (!content) return null;
      setError(null);

      // Dedup: favoriting/keeping/jotting content already in the list is a no-op
      // that returns the existing note. Repeat clicks, and re-favoriting after a
      // tab switch remounts the button, never write duplicate rows to the shared DB.
      const existing = ref.current.find((t) => t.content.trim() === content);
      if (existing) return existing;

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
          return null;
        }
        setThoughts((prev) => prev.map((t) => (t.id === tempId ? saved : t)));
        return saved;
      } catch {
        cancelledRef.current.delete(tempId);
        setThoughts((prev) => prev.filter((t) => t.id !== tempId));
        setError('Could not save that. Try again.');
        return null;
      }
    },
    [topicId],
  );

  const remove = useCallback(async (id: string) => {
    setError(null);
    if (isTemp(id)) {
      cancelledRef.current.add(id);
      setThoughts((prev) => prev.filter((t) => t.id !== id));
      return;
    }
    const idx = ref.current.findIndex((t) => t.id === id);
    const item = ref.current[idx];
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
      setError('Could not delete that. Try again.');
    }
  }, []);

  const edit = useCallback(
    async (id: string, raw: string) => {
      const trimmed = raw.trim();
      const original = ref.current.find((t) => t.id === id);
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
        setThoughts((prev) =>
          prev.map((t) => (t.id === id ? { ...t, content: original.content } : t)),
        );
        setError('Could not save your edit. Try again.');
      }
    },
    [remove],
  );

  return { thoughts, add, edit, remove, error, setError };
}

export type ThoughtsStore = ReturnType<typeof useThoughts>;
