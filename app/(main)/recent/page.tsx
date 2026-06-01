import { getRecentTopics } from '@/lib/queries/topics';
import { getSubjectsWithCounts } from '@/lib/queries/subjects';
import { getFacetsWithCounts } from '@/lib/queries/facets';
import BackLink from '@/components/nav/back-link';
import RecentIdeasList from '@/components/recent/recent-ideas-list';

export default async function RecentPage() {
  const [topics, subjects, facets] = await Promise.all([
    getRecentTopics(100),
    getSubjectsWithCounts(),
    getFacetsWithCounts(),
  ]);

  return (
    <div className="flex flex-col gap-4 py-2">
      <BackLink href="/app" label="Grid" />
      <h1 className="font-display text-2xl font-medium text-text">Recent Ideas</h1>
      <RecentIdeasList
        topics={topics}
        subjects={subjects.map((s) => ({ id: s.id, name: s.name }))}
        allFacets={facets.map((f) => f.name)}
      />
    </div>
  );
}
