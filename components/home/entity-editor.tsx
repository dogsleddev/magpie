'use client';

import { useState, useTransition } from 'react';
import {
  addTopicEntity,
  removeTopicEntity,
  suggestEntities,
  type EntityChip,
} from '@/lib/actions/entities';

/**
 * The editable "about" line on a caught glint: Maggie's extracted entity hubs as
 * teal chips, each with an "x" to drop it, plus "+ add" to link another. Optimistic:
 * the chip list updates instantly and reverts if the server action fails. Dropping
 * a chip removes it from this glint only; the hub itself survives.
 */
export default function EntityEditor({
  topicId,
  initial,
}: {
  topicId: string;
  initial: EntityChip[];
}) {
  const [entities, setEntities] = useState<EntityChip[]>(initial);
  const [adding, setAdding] = useState(false);
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [suggestions, setSuggestions] = useState<EntityChip[]>([]);
  const [suggestionsLoaded, setSuggestionsLoaded] = useState(false);
  const [, startTransition] = useTransition();

  // Lazy-load the user's existing hubs the first time the add field opens, to
  // feed a reuse typeahead (reuse beats proliferation). It is progressive
  // enhancement: the input works identically if this never resolves.
  function openAdd() {
    setAdding(true);
    if (suggestionsLoaded) return;
    setSuggestionsLoaded(true);
    startTransition(async () => {
      try {
        setSuggestions(await suggestEntities());
      } catch {
        // the typeahead is a nicety, not required for adding
      }
    });
  }

  function remove(id: string) {
    const prev = entities;
    setEntities((es) => es.filter((e) => e.id !== id));
    startTransition(async () => {
      try {
        await removeTopicEntity(topicId, id);
      } catch {
        setEntities(prev);
      }
    });
  }

  function add(e: React.FormEvent) {
    e.preventDefault();
    const name = value.trim();
    if (!name || busy) return;
    setValue('');
    setAdding(false);
    setBusy(true);
    const tempId = `tmp:${name}`;
    setEntities((es) =>
      es.some((x) => x.name.toLowerCase() === name.toLowerCase())
        ? es
        : [...es, { id: tempId, name: name.toLowerCase() }],
    );
    startTransition(async () => {
      try {
        const hub = await addTopicEntity(topicId, name);
        setEntities((es) => {
          const withoutTemp = es.filter((x) => x.id !== tempId);
          return withoutTemp.some((x) => x.id === hub.id) ? withoutTemp : [...withoutTemp, hub];
        });
      } catch {
        setEntities((es) => es.filter((x) => x.id !== tempId));
      } finally {
        setBusy(false);
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs text-muted-foreground">about</span>
      {entities.map((e) => (
        <span
          key={e.id}
          className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs text-teal"
        >
          {e.name}
          <button
            type="button"
            onClick={() => remove(e.id)}
            aria-label={`Remove ${e.name}`}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            ×
          </button>
        </span>
      ))}
      {adding ? (
        <form onSubmit={add}>
          <input
            autoFocus
            value={value}
            onChange={(ev) => setValue(ev.target.value)}
            onBlur={() => !value.trim() && setAdding(false)}
            placeholder="add..."
            aria-label="Add an entity"
            list={`entity-suggest-${topicId}`}
            className="w-24 rounded-full border border-input bg-transparent px-2 py-0.5 text-xs outline-none focus:ring-1 focus:ring-ring"
          />
          <datalist id={`entity-suggest-${topicId}`}>
            {suggestions
              .filter((s) => !entities.some((e) => e.name.toLowerCase() === s.name.toLowerCase()))
              .map((s) => (
                <option key={s.id} value={s.name} />
              ))}
          </datalist>
        </form>
      ) : (
        <button
          type="button"
          onClick={openAdd}
          className="rounded-full border border-dashed px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          + add
        </button>
      )}
    </div>
  );
}
