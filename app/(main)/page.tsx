import { Plus, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="flex flex-col gap-8 py-4">
      <div className="flex gap-3">
        {/* Add Topic ships in Phase 7, Convo Roulette in Phase 3. Disabled
            until topics exist, per the build plan. */}
        <Button variant="primary" size="md" className="flex-1" disabled>
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Add topic
        </Button>
        <Button variant="secondary" size="md" className="flex-1" disabled>
          <Shuffle className="h-4 w-4" strokeWidth={2.5} />
          Convo Roulette
        </Button>
      </div>

      <div className="mt-12 flex flex-col items-center text-center">
        <h2 className="font-display text-2xl font-medium text-text">Your nest is empty.</h2>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-text-muted">
          The topics you collect will land here.
        </p>
      </div>
    </div>
  );
}
