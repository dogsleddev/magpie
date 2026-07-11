import { createClient, requireUser } from '@/lib/supabase/server';

// activity_days and user_settings.timezone are 0008 (Slice-0) additions that are
// not yet in the generated Database types, so the calls below use a narrow cast.
// Regenerate lib/supabase/types.ts once a DB connection is available and drop them.

const DEFAULT_TZ = 'America/Los_Angeles';
const DAY_MS = 86400000;

/** The user's local calendar date (YYYY-MM-DD) in their timezone. */
function localDate(tz: string, at: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD.
  return at.toLocaleDateString('en-CA', { timeZone: tz });
}

/** A plain YYYY-MM-DD date as an integer day number (UTC midnight based). */
function ordinal(dateStr: string): number {
  return Math.floor(Date.parse(`${dateStr}T00:00:00Z`) / DAY_MS);
}

function fromOrdinal(n: number): string {
  return new Date(n * DAY_MS).toISOString().slice(0, 10);
}

/** Read the user's saved timezone, defaulting to PST when unset. */
export async function getUserTimezone(): Promise<string> {
  const supabase = await createClient();
  const user = await requireUser();
  const { data } = await (supabase as unknown as {
    from: (t: string) => any;
  })
    .from('user_settings')
    .select('timezone')
    .eq('user_id', user.id)
    .maybeSingle();
  return data?.timezone || DEFAULT_TZ;
}

/** Mark today (the user's local date) as an active day. Idempotent per day. */
export async function markTodayActive(tz: string): Promise<void> {
  const supabase = await createClient();
  const user = await requireUser();
  const today = localDate(tz);
  const { error } = await (supabase as unknown as { from: (t: string) => any })
    .from('activity_days')
    .upsert(
      { user_id: user.id, activity_date: today, covered_by: 'glint' },
      { onConflict: 'user_id,activity_date', ignoreDuplicates: true },
    );
  if (error) throw error;
}

export type Streak = { current: number; longest: number; today: boolean };

/**
 * Current and longest streak, derived from the contiguous run of active dates.
 * The current streak still stands if today is not yet covered but yesterday is
 * (you have not missed until the day ends). Longest is the max consecutive run.
 */
export async function getStreak(tz: string): Promise<Streak> {
  const supabase = await createClient();
  const user = await requireUser();
  const { data } = await (supabase as unknown as { from: (t: string) => any })
    .from('activity_days')
    .select('activity_date')
    .eq('user_id', user.id);

  const dates = new Set<string>(
    ((data ?? []) as { activity_date: string }[]).map((r) => r.activity_date),
  );
  if (dates.size === 0) return { current: 0, longest: 0, today: false };

  const today = localDate(tz);
  const yesterday = fromOrdinal(ordinal(today) - 1);
  const start = dates.has(today) ? today : dates.has(yesterday) ? yesterday : null;

  let current = 0;
  if (start) {
    let o = ordinal(start);
    while (dates.has(fromOrdinal(o))) {
      current++;
      o--;
    }
  }

  const ords = [...dates].map(ordinal).sort((a, b) => a - b);
  let longest = 0;
  let run = 0;
  let prev: number | null = null;
  for (const o of ords) {
    run = prev !== null && o === prev + 1 ? run + 1 : 1;
    prev = o;
    if (run > longest) longest = run;
  }

  return { current, longest, today: dates.has(today) };
}
