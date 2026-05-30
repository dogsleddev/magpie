'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import PersonaMode from '@/components/topic/persona-mode';
import TextMode from '@/components/topic/text-mode';
import ConvoMode from '@/components/topic/convo-mode';
import type { ConversationMessage, Thought } from '@/lib/queries/types';

type ModeKey = 'persona' | 'brief' | 'challenge' | 'questions' | 'convo';

const MODE_KEYS: ModeKey[] = ['persona', 'brief', 'challenge', 'questions', 'convo'];

const TAGLINES: Record<Exclude<ModeKey, 'persona'>, string> = {
  brief: 'the primer you needed earlier',
  challenge: "the pushback you didn't see coming",
  questions: 'doors, not dead-ends',
  convo: 'talk it through',
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

      {active === 'persona' && (
        <PersonaMode key={topicId} topicId={topicId} initialThoughts={thoughts} />
      )}
      {active === 'brief' && (
        <TextMode
          key={`brief-${topicId}`}
          topicId={topicId}
          mode="brief"
          tagline={TAGLINES.brief}
          personaName={personaName}
        />
      )}
      {active === 'challenge' && (
        <TextMode
          key={`challenge-${topicId}`}
          topicId={topicId}
          mode="challenge"
          tagline={TAGLINES.challenge}
          personaName={personaName}
        />
      )}
      {active === 'questions' && (
        <TextMode
          key={`questions-${topicId}`}
          topicId={topicId}
          mode="questions"
          tagline={TAGLINES.questions}
          personaName={personaName}
        />
      )}
      {active === 'convo' && (
        <ConvoMode
          key={`convo-${topicId}`}
          topicId={topicId}
          personaName={personaName}
          initialMessages={conversationMessages}
          tagline={TAGLINES.convo}
        />
      )}
    </div>
  );
}
