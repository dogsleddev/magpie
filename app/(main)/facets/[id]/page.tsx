import { notFound } from 'next/navigation';
import { getFacet } from '@/lib/queries/facets';
import { getTopicsByFacet } from '@/lib/queries/topics';
import BackLink from '@/components/nav/back-link';
import TopicList from '@/components/topic/topic-list';

export default async function FacetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [facet, topics] = await Promise.all([getFacet(id), getTopicsByFacet(id)]);
  if (!facet) notFound();

  return (
    <div className="flex flex-col gap-4 py-2">
      <BackLink href="/facets" label="Facets" />
      <div>
        <h1 className="font-display text-2xl font-medium text-text">#{facet.name}</h1>
        <p className="text-xs italic text-text-dim">where the connections live</p>
      </div>
      {topics.length > 0 ? (
        <TopicList topics={topics} />
      ) : (
        <p className="text-sm text-text-muted">No topics with this facet yet.</p>
      )}
    </div>
  );
}
