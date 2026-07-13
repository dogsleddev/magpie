'use client';

import { useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { ThoughtsStore } from './use-thoughts';

/**
 * The quiet notes view inside the Maggie tab: your kept thoughts as ordered,
 * editable bullets. Capture happens mainly by keeping a line from the chat, but
 * you can jot one directly here too. Shares its list with the chat's "keep"
 * action through the passed-in store, so a kept line shows up immediately.
 */
export default function NotesList({ store }: { store: ThoughtsStore }) {
  const { thoughts, add, edit, remove, error } = store;
  const [input, setInput] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const commit = async () => {
    const value = input;
    setInput('');
    inputRef.current?.focus();
    const saved = await add(value);
    // Restore the text if the save failed (add returns null), so it is not lost.
    if (!saved && value.trim()) setInput((cur) => cur || value);
  };

  const startEdit = (id: string, content: string) => {
    setEditingId(id);
    setEditValue(content);
  };

  const commitEdit = () => {
    const id = editingId;
    if (!id) return;
    setEditingId(null);
    void edit(id, editValue);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commit();
            }
          }}
          placeholder="jot a thought..."
          autoComplete="off"
          aria-label="Add a note"
        />
        <button
          type="button"
          onClick={commit}
          aria-label="Add note"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded border border-border bg-bg-card-2 text-text transition-colors hover:border-border-strong hover:bg-bg-card"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      {thoughts.length === 0 ? (
        <p className="py-2 text-sm text-text-dim">
          Nothing kept yet. Keep a line from the chat, or jot one here.
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {thoughts.map((t) =>
            editingId === t.id ? (
              <li key={t.id}>
                <Input
                  value={editValue}
                  autoFocus
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      commitEdit();
                    }
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      setEditingId(null);
                    }
                  }}
                  aria-label="Edit note"
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
                  onClick={() => startEdit(t.id, t.content)}
                  className="flex-1 text-left text-text"
                >
                  {t.content}
                </button>
                <button
                  type="button"
                  onClick={() => void remove(t.id)}
                  aria-label="Remove note"
                  className="shrink-0 text-text-dim opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  );
}
