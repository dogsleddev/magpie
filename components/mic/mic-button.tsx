'use client';

import { Mic } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MicButton({
  supported,
  recording,
  onClick,
  className,
}: {
  supported: boolean;
  recording: boolean;
  onClick: () => void;
  className?: string;
}) {
  if (!supported) {
    return (
      <button
        type="button"
        disabled
        aria-disabled
        title="Voice input needs Chrome or Edge"
        aria-label="Voice input is not available in this browser"
        className={cn(
          'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded border border-border text-text-dim opacity-40',
          className,
        )}
      >
        <Mic className="h-5 w-5" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={recording}
      aria-label={recording ? 'Stop voice input' : 'Start voice input'}
      className={cn(
        'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded border transition-colors',
        recording
          ? 'animate-pulse border-teal bg-teal/15 text-teal'
          : 'border-border text-text-muted hover:border-border-strong hover:text-text',
        className,
      )}
    >
      <Mic className="h-5 w-5" />
    </button>
  );
}
