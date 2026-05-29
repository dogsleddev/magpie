'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { Thought } from '@/lib/queries/types';

type ModeKey = 'persona' | 'brief' | 'challenge' | 'questions' | 'convo';

const MODE_KEYS: ModeKey[] = ['persona', 'brief', 'challenge', 'questions', 'convo'];

const TAGLINES: Record<Exclude<ModeKey, 'persona'>, string> = {
  brief: 'the primer you needed earlier',
  challenge: "the pushback you didn't see coming",
  questions: 'doors, not dead-ends',
  convo: 'talk it through',
};

export default function ModeTabs({
  personaName,
  defaultMode,
  thoughts,
}: {
  personaName: string;
  defaultMode: string;
  thoughts: Thought[];
}) {
  const initial = (MODE_KEYS as string[]).includes(defaultMode)
    ? (defaultMode as ModeKey)
    : 'persona';
  const [active, setActive] = useState<ModeKey>(initial);

  const tabs: { key: ModeKey; label: string }[] = [
    { key: 'persona', label: personaName },
    { key: 'brief', label: 'Brief' },
    { key: 'challenge', label: 'Challenge' },
    { key: 'questions', label: 'Questions' },
    { key: 'convo', label: 'Convo' },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 overflow-x-auto border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActive(tab.key)}
            className={cn(
              'whitespace-nowrap border-b-2 px-3 py-2 text-sm transition-colors',
              active === tab.key
                ? 'border-teal text-text'
                : 'border-transparent text-text-dim hover:text-text-muted',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {active === 'persona' && <PersonaPanel thoughts={thoughts} />}
      {active !== 'persona' && (
        <ModePlaceholder
          label={tabs.find((t) => t.key === active)?.label ?? ''}
          tagline={TAGLINES[active]}
        />
      )}
    </div>
  );
}

function PersonaPanel({ thoughts }: { thoughts: Thought[] }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs italic text-text-dim">what&apos;s on your mind?</p>
      {thoughts.length === 0 ? (
        <p className="text-sm text-text-muted">
          No thoughts captured yet. Capture arrives in the next build.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {thoughts.map((thought) => (
            <li
              key={thought.id}
              className="rounded-lg border border-border bg-bg-card px-3 py-2 text-sm text-text"
            >
              {thought.content}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ModePlaceholder({ label, tagline }: { label: string; tagline: string }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs italic text-text-dim">{tagline}</p>
      <p className="text-sm text-text-muted">{label} arrives in the next build.</p>
    </div>
  );
}
