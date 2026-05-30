import Link from 'next/link';
import { getFacetsWithCounts } from '@/lib/queries/facets';
import BackLink from '@/components/nav/back-link';

export default async function FacetsPage() {
  const facets = (await getFacetsWithCounts())
    .filter((f) => f.topic_count > 0)
    .sort((a, b) => b.topic_count - a.topic_count);

  return (
    <div className="flex flex-col gap-4 py-2">
      <BackLink href="/" label="Grid" />
      <div>
        <h1 className="font-display text-2xl font-medium text-text">Facets</h1>
        <p className="text-xs italic text-text-dim">where the connections live</p>
      </div>
      {facets.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {facets.map((facet) => (
            <Link
              key={facet.id}
              href={`/facets/${facet.id}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-bg-card px-3 py-1.5 text-sm text-text-muted transition-colors hover:border-border-strong hover:bg-bg-card-2 hover:text-text"
            >
              <span>#{facet.name}</span>
              <span className="text-xs text-text-dim">{facet.topic_count}</span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-text-muted">No facets yet.</p>
      )}
    </div>
  );
}
