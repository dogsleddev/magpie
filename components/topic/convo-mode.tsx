'use client';

import { useEffect, useRef, useState } from 'react';
import { BookmarkPlus, Check, Send } from 'lucide-react';
import { saveConvoTurn } from '@/lib/actions/conversations';
import { CONVO_STREAM_ERROR_MARK } from '@/lib/ai/stream-markers';
import type { ConversationMessage } from '@/lib/queries/types';
import { useSpeechToText } from '@/components/mic/use-speech-to-text';
import { useIsIOS } from '@/components/mic/is-ios';
import MicButton from '@/components/mic/mic-button';
import { cn } from '@/lib/utils';

// Shown only if the AI opener call fails; the live opener is fetched per topic.
const FALLBACK_OPENER = "what's your honest take on this one?";

// In-memory opener cache: toggling tabs or reopening a topic in the same session
// reuses the generated opener instead of re-calling the model each time.
const openerCache = new Map<string, string>();

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
  onKeep,
  active = true,
}: {
  topicId: string;
  personaName: string;
  initialMessages: ConversationMessage[];
  tagline: string;
  // When present, each real message gets a "keep" action that pins it to the
  // topic's notes (the merged Maggie tab passes this). Resolves true on save, so
  // the button only flips to "kept" when the write actually landed.
  onKeep?: (content: string) => Promise<boolean>;
  // False while this view is hidden behind the Notes toggle, so we can re-scroll
  // to the latest message when it becomes visible again.
  active?: boolean;
}) {
  const [messages, setMessages] = useState<ConversationMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [kept, setKept] = useState<Set<number>>(new Set());
  const [opener, setOpener] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const micBaseRef = useRef('');
  const abortRef = useRef<AbortController | null>(null);

  // Speech-to-text fills the input; it does not auto-send (you review, then send).
  const {
    supported: micSupported,
    recording: micRecording,
    toggle: micToggle,
    error: micError,
  } = useSpeechToText({
    onTranscript: (spoken) => {
      setInput(micBaseRef.current ? `${micBaseRef.current} ${spoken}` : spoken);
    },
  });

  // On iOS our Web Speech mic is a dead stub, so we hide it and point the user at
  // the keyboard's own dictation mic instead.
  const iosKeyboard = useIsIOS() && !micSupported;

  const handleMic = () => {
    if (!micRecording) micBaseRef.current = input.trim();
    micToggle();
  };

  useEffect(() => {
    if (!active) return; // hidden: scrollHeight is 0, so defer to when we're shown
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, active]);

  // Abort an in-flight reply if the user leaves this view (tab switch / topic change),
  // so the stream stops and a half-finished answer is never persisted.
  useEffect(() => () => abortRef.current?.abort(), []);

  // Fetch the persona's short, personal opener once, only for a fresh (empty) chat.
  useEffect(() => {
    if (initialMessages.length > 0) return;
    const cached = openerCache.get(topicId);
    if (cached) {
      setOpener(cached);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/ai/convo-opener', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topicId }),
        });
        const data = (await res.json().catch(() => ({}))) as { opener?: string };
        const value = data.opener?.trim() || FALLBACK_OPENER;
        if (data.opener?.trim()) openerCache.set(topicId, value);
        if (!cancelled) setOpener(value);
      } catch {
        if (!cancelled) setOpener(FALLBACK_OPENER);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [topicId, initialMessages.length]);

  const send = async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput('');
    if (taRef.current) taRef.current.style.height = 'auto';
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: text },
      { role: 'assistant', content: '' },
    ]);
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch('/api/ai/convo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId, message: text }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        setMessages((prev) =>
          replaceLast(prev, `${personaName.toLowerCase()} hit a snag. try again.`),
        );
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        // Show only the text before any error marker while streaming.
        setMessages((prev) => replaceLast(prev, full.split(CONVO_STREAM_ERROR_MARK)[0]));
      }
      const mark = full.indexOf(CONVO_STREAM_ERROR_MARK);
      if (mark !== -1) {
        const note =
          full.slice(mark + CONVO_STREAM_ERROR_MARK.length).trim() ||
          `${personaName.toLowerCase()} hit a snag. try again.`;
        setMessages((prev) => replaceLast(prev, note));
        return; // error note: shown to the user, never persisted
      }
      full = full.trim();
      setMessages((prev) => replaceLast(prev, full));
      if (full) {
        // Persist in an inner try so a save failure (a network blip, or a
        // concurrent first-turn write) never falls through to the outer catch,
        // which would overwrite the reply the user is already reading.
        try {
          await saveConvoTurn(topicId, text, full);
        } catch {
          // Keep the rendered reply; it just was not saved to the shared thread.
        }
      }
    } catch {
      // Aborted because the user left this view: drop it silently, persist nothing.
      if (controller.signal.aborted) return;
      setMessages((prev) =>
        replaceLast(prev, `${personaName.toLowerCase()} hit a snag. try again.`),
      );
    } finally {
      if (!controller.signal.aborted) setStreaming(false);
    }
  };

  const loadingOpener = messages.length === 0 && opener === null;
  const shown: ConversationMessage[] =
    messages.length === 0 ? [{ role: 'assistant', content: opener ?? '' }] : messages;

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
            !isUser && i === shown.length - 1 && m.content === '' && (streaming || loadingOpener);
          // Keep is offered only inside a real conversation (not on the synthetic
          // opener) and only on a settled, non-empty message.
          const canKeep =
            !!onKeep && messages.length > 0 && !isStreamingPlaceholder && m.content.trim().length > 0;
          return (
            <div key={i} className={cn('flex flex-col gap-0.5', isUser ? 'items-end' : 'items-start')}>
              <div
                className={cn(
                  'max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm',
                  isUser ? 'bg-teal/15 text-text' : 'bg-bg-card-2 text-text',
                )}
              >
                {isStreamingPlaceholder ? <Typing /> : m.content}
              </div>
              {canKeep && (
                <button
                  type="button"
                  onClick={async () => {
                    if (kept.has(i) || !onKeep) return;
                    // Mark kept synchronously so a rapid second click is a no-op
                    // (the guard above), then revert if the save actually failed.
                    setKept((prev) => new Set(prev).add(i));
                    const ok = await onKeep(m.content);
                    if (!ok)
                      setKept((prev) => {
                        const next = new Set(prev);
                        next.delete(i);
                        return next;
                      });
                  }}
                  aria-label="Keep this in your notes"
                  className="inline-flex items-center gap-1 px-1 text-[11px] text-text-dim transition-colors hover:text-teal"
                >
                  {kept.has(i) ? (
                    <>
                      <Check className="h-3 w-3" /> kept
                    </>
                  ) : (
                    <>
                      <BookmarkPlus className="h-3 w-3" /> keep
                    </>
                  )}
                </button>
              )}
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
        {!iosKeyboard && (
          <MicButton supported={micSupported} recording={micRecording} onClick={handleMic} />
        )}
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

      {iosKeyboard ? (
        <p className="text-[11px] text-text-dim">voice on mobile coming soon. type for now.</p>
      ) : (
        micError && <p className="text-[11px] text-text-dim">{micError}</p>
      )}
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
