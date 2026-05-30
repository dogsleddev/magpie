'use client';

import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { saveAssistantMessage } from '@/lib/actions/conversations';
import type { ConversationMessage } from '@/lib/queries/types';
import { cn } from '@/lib/utils';

const OPENER = "hey, what's pulling you on this one?";

function replaceLast(list: ConversationMessage[], content: string): ConversationMessage[] {
  const next = [...list];
  next[next.length - 1] = { role: 'assistant', content };
  return next;
}

export default function ConvoMode({
  topicId,
  personaName,
  initialMessages,
  tagline,
}: {
  topicId: string;
  personaName: string;
  initialMessages: ConversationMessage[];
  tagline: string;
}) {
  const [messages, setMessages] = useState<ConversationMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput('');
    if (taRef.current) taRef.current.style.height = 'auto';
    setMessages((prev) => [...prev, { role: 'user', content: text }, { role: 'assistant', content: '' }]);
    setStreaming(true);

    try {
      const res = await fetch('/api/ai/convo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId, message: text }),
      });
      if (!res.ok || !res.body) {
        setMessages((prev) => replaceLast(prev, `${personaName.toLowerCase()} hit a snag. try again.`));
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setMessages((prev) => replaceLast(prev, full));
      }
      full = full.trim();
      setMessages((prev) => replaceLast(prev, full));
      if (full) await saveAssistantMessage(topicId, full);
    } catch {
      setMessages((prev) => replaceLast(prev, `${personaName.toLowerCase()} hit a snag. try again.`));
    } finally {
      setStreaming(false);
    }
  };

  const shown: ConversationMessage[] =
    messages.length === 0 ? [{ role: 'assistant', content: OPENER }] : messages;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs italic text-text-dim">{tagline}</p>

      <div
        ref={scrollRef}
        className="flex max-h-[55vh] min-h-[180px] flex-col gap-2 overflow-y-auto rounded-lg border border-border bg-bg-card p-3"
      >
        {shown.map((m, i) => {
          const isUser = m.role === 'user';
          const isStreamingPlaceholder =
            streaming && !isUser && i === shown.length - 1 && m.content === '';
          return (
            <div
              key={i}
              className={cn(
                'max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm',
                isUser
                  ? 'self-end bg-teal/15 text-text'
                  : 'self-start bg-bg-card-2 text-text',
              )}
            >
              {isStreamingPlaceholder ? <Typing /> : m.content}
            </div>
          );
        })}
      </div>

      <div className="flex items-end gap-2">
        <textarea
          ref={taRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = 'auto';
            el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          rows={1}
          placeholder={`Reply to ${personaName}...`}
          aria-label={`Message ${personaName}`}
          className="flex max-h-[120px] w-full resize-none rounded border border-border bg-bg-input px-3.5 py-2.5 text-sm text-text transition-colors placeholder:text-text-dim focus-visible:border-border-strong focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal"
        />
        <button
          type="button"
          onClick={() => void send()}
          disabled={streaming || !input.trim()}
          aria-label="Send"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded bg-teal text-bg transition-opacity hover:bg-teal/90 disabled:opacity-40"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

function Typing() {
  return (
    <span className="inline-flex items-center gap-1 py-1">
      <Dot delay="0ms" />
      <Dot delay="150ms" />
      <Dot delay="300ms" />
    </span>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-muted"
      style={{ animationDelay: delay }}
    />
  );
}
