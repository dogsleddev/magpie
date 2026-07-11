import { createClient, requireUser } from '@/lib/supabase/server';

// usage_events is a 0008 (Slice-0) table not yet in the generated Database types.

/**
 * Record a product event (D1/D3/D7 analytics). Best-effort: never throws, so a
 * logging failure can never break the flow it is measuring.
 */
export async function logEvent(event: string, props: Record<string, unknown> = {}): Promise<void> {
  try {
    const supabase = await createClient();
    const user = await requireUser();
    await (supabase as unknown as { from: (t: string) => any })
      .from('usage_events')
      .insert({ user_id: user.id, event, props });
  } catch (e) {
    console.error('[logEvent] failed:', e);
  }
}
