'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import ConvoMode from './convo-mode';
import NotesList from './notes-list';
import type { ThoughtsStore } from './use-thoughts';
import type { ConversationMessage } from '@/lib/queries/types';

/**
 * The last tab, which absorbs the old Thoughts capture. Two views over one shared
 * notes store: Talk (the chat with Maggie, where you can "keep" any line) and
 * Notes (your kept thoughts, quiet and editable). Ordinary chat turns are NOT
 * saved as thoughts, only lines you explicitly keep, so the notes stay curated.
 * Both views stay mounted (hidden, not unmounted) so toggling never drops an
 * in-progress reply or a half-typed message.
 */
export default function MaggieTab({
  topicId,
  personaName,
  store,
  initialMessages,
}: {
  topicId: string;
  personaName: string;
  store: ThoughtsStore;
  initialMessages: ConversationMessage[];
}) {
  const [view, setView] = useState<'talk' | 'notes'>('talk');
  const count = store.thoughts.length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex self-start rounded-lg border border-border bg-bg-input p-0.5">
        {(['talk', 'notes'] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={cn(
              'rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors',
              view === v ? 'bg-teal text-bg' : 'text-text-muted hover:text-text',
            )}
          >
            {v === 'notes' && count > 0 ? `notes · ${count}` : v}
          </button>
        ))}
      </div>

      <div className={view === 'talk' ? '' : 'hidden'}>
        <ConvoMode
          topicId={topicId}
          personaName={personaName}
          initialMessages={initialMessages}
          tagline="talk it through"
          active={view === 'talk'}
          onKeep={(content) => store.add(content).then(Boolean)}
        />
      </div>
      <div className={view === 'notes' ? '' : 'hidden'}>
        <NotesList store={store} />
      </div>
    </div>
  );
}
