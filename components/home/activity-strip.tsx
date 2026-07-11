import type { ActivityDay } from '@/lib/queries/activity';

/**
 * A small GitHub-style strip of the last N days: a teal dot for each day a glint
 * was caught, an empty one otherwise. Server-rendered; refreshes after a catch
 * via the revalidatePath in captureGlint.
 */
export default function ActivityStrip({ days }: { days: ActivityDay[] }) {
  if (days.length === 0) return null;
  return (
    <div>
      <div className="mb-1.5 text-xs text-muted-foreground">last {days.length} days</div>
      <div className="flex gap-1">
        {days.map((d) => (
          <div
            key={d.date}
            title={d.date}
            aria-label={d.active ? `${d.date}: caught a glint` : `${d.date}: no glint`}
            className={
              d.active
                ? 'h-4 w-4 rounded-sm border border-[var(--teal)] bg-[var(--teal)]'
                : 'h-4 w-4 rounded-sm border border-border bg-transparent opacity-70'
            }
          />
        ))}
      </div>
    </div>
  );
}
