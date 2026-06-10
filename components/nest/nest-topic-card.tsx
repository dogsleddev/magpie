'use client';

import { useRouter } from 'next/navigation';
import type { NestSourceTopic } from '@/lib/nest/types';
import { cn } from '@/lib/utils';

/**
 * The node-detail card both Nest views show when a topic is tapped. The caller
 * owns the positioning (the compact view docks it to the bottom edge, the
 * desktop overlay floats it at the tap point); this owns the card itself.
 */
export default function NestTopicCard({
  topic,
  subjectName,
  facetName,
  onClose,
  className,
  style,
}: {
  topic: NestSourceTopic;
  subjectName?: string;
  facetName: (id: string) => string | undefined;
  onClose: () => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  const router = useRouter();

  return (
    <div
      className={cn(
        'rounded-2xl border border-border-strong bg-bg-card-2/95 p-4 shadow-2xl backdrop-blur',
        className,
      )}
      style={style}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-3 top-3 text-text-dim hover:text-text"
        aria-label="Close"
      >
        ×
      </button>
      <p className="mb-1 text-[11px] uppercase tracking-wide text-text-dim">
        {topic.parentId ? 'Sub-topic' : topic.isGroup ? 'Topic group' : 'Topic'}
        {' · '}
        {subjectName}
      </p>
      <h3 className="mb-3 pr-6 font-display text-lg font-medium leading-tight text-text">
        {topic.title}
      </h3>
      {topic.facetIds.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {topic.facetIds.map((fid) => (
            <span
              key={fid}
              className="rounded-full bg-bg-card px-2 py-0.5 text-[10.5px] text-text-muted"
            >
              {facetName(fid)}
            </span>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => router.push(`/topic/${topic.id}`)}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal hover:underline"
      >
        Open topic →
      </button>
    </div>
  );
}
