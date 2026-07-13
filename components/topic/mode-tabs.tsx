'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import TextMode from '@/components/topic/text-mode';
import MaggieTab from '@/components/topic/maggie-tab';
import { useThoughts } from '@/components/topic/use-thoughts';
import type { ConversationMessage, Thought } from '@/lib/queries/types';

// The merged topic interface (Slice 4): it opens on Brief. Brief/Challenge/
// Questions are AI takes you can favorite or dismiss; the persona-named tab is
// last and holds the chat plus your kept notes (it absorbed the old Thoughts tab).
type ModeKey = 'brief' | 'challenge' | 'questions' | 'maggie';

const MODE_KEYS: ModeKey[] = ['brief', 'challenge', 'questions', 'maggie'];

const TAGLINES: Record<'brief' | 'challenge' | 'questions', string> = {
  brief: 'the primer you needed earlier',
  challenge: "the pushback you didn't see coming",
  questions: 'doors, not dead-ends',
};

export default function ModeTabs({
  topicId,
  personaName,
  defaultMode,
  thoughts,
  conversationMessages,
}: {
  topicId: string;
  personaName: string;
  defaultMode: string;
  thoughts: Thought[];
  conversationMessages: ConversationMessage[];
}) {
  // Land on Brief unless the user has explicitly chosen one of the new tabs; old
  // stored defaults ("persona", "thoughts") fall through to Brief.
  const initial = (MODE_KEYS as string[]).includes(defaultMode)
    ? (defaultMode as ModeKey)
    : 'brief';
  const [active, setActive] = useState<ModeKey>(initial);

  // One notes store for the whole topic interface, lifted here so a Favorite from
  // Brief/Challenge/Questions and a "keep" from the Maggie chat land in the same
  // live list (it persists across tab switches because this component stays mounted).
  const notes = useThoughts(topicId, thoughts);
  const favorite = async (content: string) => !!(await notes.add(content));

  const tabs: { key: ModeKey; label: string }[] = [
    { key: 'brief', label: 'Brief' },
    { key: 'challenge', label: 'Challenge' },
    { key: 'questions', label: 'Questions' },
    { key: 'maggie', label: personaName },
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
              tab.key === 'maggie' && 'ml-auto',
              active === tab.key
                ? 'border-teal text-text'
                : 'border-transparent text-text-dim hover:text-text-muted',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {active === 'brief' && (
        <TextMode
          key={`brief-${topicId}`}
          topicId={topicId}
          mode="brief"
          tagline={TAGLINES.brief}
          personaName={personaName}
          onFavorite={favorite}
        />
      )}
      {active === 'challenge' && (
        <TextMode
          key={`challenge-${topicId}`}
          topicId={topicId}
          mode="challenge"
          tagline={TAGLINES.challenge}
          personaName={personaName}
          onFavorite={favorite}
        />
      )}
      {active === 'questions' && (
        <TextMode
          key={`questions-${topicId}`}
          topicId={topicId}
          mode="questions"
          tagline={TAGLINES.questions}
          personaName={personaName}
          onFavorite={favorite}
        />
      )}
      {active === 'maggie' && (
        <MaggieTab
          key={`maggie-${topicId}`}
          topicId={topicId}
          personaName={personaName}
          store={notes}
          initialMessages={conversationMessages}
        />
      )}
    </div>
  );
}
