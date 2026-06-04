import { getNestGraph } from '@/lib/queries/nest';
import BackLink from '@/components/nav/back-link';
import NestView from '@/components/nest/nest-view';

export default async function NestPage() {
  const source = await getNestGraph();

  return (
    <div className="flex flex-col gap-4 py-2">
      <BackLink href="/app" label="Grid" />
      <div>
        <h1 className="font-display text-2xl font-medium text-text">Nest</h1>
        <p className="text-xs italic text-text-dim">your curiosity as a constellation</p>
      </div>

      {source.topics.length > 0 ? (
        <NestView source={source} />
      ) : (
        <p className="text-sm text-text-muted">
          Your nest is empty. Add a few topics and they will start to connect.
        </p>
      )}
    </div>
  );
}
