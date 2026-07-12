import { createClient, requireUser } from '@/lib/supabase/server';

// The 0009 entity tables are not in the generated Database types yet, so these
// use the same narrow cast the other entity reads use.
type Db = { from: (t: string) => any };

export type GlintRow = {
  id: string;
  title: string;
  createdAt: string;
  subject: string | null;
  entities: string[]; // up to 2 hub tags for the row
};

type RawGlint = {
  id: string;
  title: string;
  created_at: string;
  subjects: { name: string } | null;
  topic_entities: { entities: { name: string } | null }[];
};

function toRow(t: RawGlint): GlintRow {
  return {
    id: t.id,
    title: t.title,
    createdAt: t.created_at,
    subject: t.subjects?.name ?? null,
    entities: (t.topic_entities ?? [])
      .map((te) => te.entities?.name)
      .filter((n): n is string => !!n)
      .slice(0, 2),
  };
}

const SELECT = 'id, title, created_at, subjects(name), topic_entities(entities(name))';

/** How many riffable glints the user has. Drives the Library's cold-start default. */
export async function getGlintCount(): Promise<number> {
  const supabase = (await createClient()) as unknown as Db;
  const user = await requireUser();
  const { count } = await supabase
    .from('topics')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_group', false);
  return count ?? 0;
}

/** The Time lens: every glint newest first, with subject and up to 2 hub tags. */
export async function getGlintTimeline(limit = 150): Promise<GlintRow[]> {
  const supabase = (await createClient()) as unknown as Db;
  const user = await requireUser();
  const { data } = await supabase
    .from('topics')
    .select(SELECT)
    .eq('user_id', user.id)
    .eq('is_group', false)
    .order('created_at', { ascending: false })
    .limit(limit);
  return ((data ?? []) as RawGlint[]).map(toRow);
}

/** Search glints by their text or by an entity hub they touch. Newest first. */
export async function searchGlints(query: string): Promise<GlintRow[]> {
  const term = query.trim().replace(/[%_]/g, ' ').trim();
  if (!term) return [];
  const supabase = (await createClient()) as unknown as Db;
  const user = await requireUser();

  // Title matches, and topics linked to any entity whose name matches.
  const [{ data: byTitle }, { data: ents }] = await Promise.all([
    supabase
      .from('topics')
      .select(SELECT)
      .eq('user_id', user.id)
      .eq('is_group', false)
      .ilike('title', `%${term}%`)
      .limit(50),
    supabase.from('entities').select('id').eq('user_id', user.id).ilike('name', `%${term}%`),
  ]);

  const rows = new Map<string, RawGlint>();
  for (const t of (byTitle ?? []) as RawGlint[]) rows.set(t.id, t);

  const entIds = ((ents ?? []) as { id: string }[]).map((e) => e.id);
  if (entIds.length) {
    const { data: links } = await supabase
      .from('topic_entities')
      .select('topic_id')
      .in('entity_id', entIds);
    const topicIds = [
      ...new Set(((links ?? []) as { topic_id: string }[]).map((l) => l.topic_id)),
    ].filter((id) => !rows.has(id));
    if (topicIds.length) {
      const { data: byEntity } = await supabase
        .from('topics')
        .select(SELECT)
        .eq('is_group', false)
        .in('id', topicIds);
      for (const t of (byEntity ?? []) as RawGlint[]) rows.set(t.id, t);
    }
  }

  return [...rows.values()]
    .map(toRow)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 50);
}
