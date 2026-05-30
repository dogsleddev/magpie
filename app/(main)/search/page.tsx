import { searchTopics } from '@/lib/queries/topics';
import BackLink from '@/components/nav/back-link';
import TopicSearch from '@/components/home/topic-search';
import TopicList from '@/components/topic/topic-list';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? '').trim();
  const results = query ? await searchTopics(query) : [];

  return (
    <div className="flex flex-col gap-4 py-2">
      <BackLink href="/" label="Grid" />
      <TopicSearch defaultValue={query} />
      {query ? (
        results.length > 0 ? (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-text-dim">
              {results.length} {results.length === 1 ? 'result' : 'results'} for &ldquo;{query}
              &rdquo;
            </p>
            <TopicList topics={results} />
          </div>
        ) : (
          <p className="text-sm text-text-muted">No matches for &ldquo;{query}&rdquo;.</p>
        )
      ) : (
        <p className="text-sm text-text-muted">Type something to search your wiki.</p>
      )}
    </div>
  );
}
