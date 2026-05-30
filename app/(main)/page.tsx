import { Plus, Shuffle } from 'lucide-react';
import { getSubjectsWithCounts } from '@/lib/queries/subjects';
import { convoRoulette } from '@/lib/actions/convo-roulette';
import { Button } from '@/components/ui/button';
import SubjectList from '@/components/home/subject-list';
import WelcomeHint from '@/components/home/welcome-hint';
import EmptyOnboarding from '@/components/home/empty-onboarding';

export default async function HomePage() {
  const subjects = await getSubjectsWithCounts();

  if (subjects.length === 0) {
    return <EmptyOnboarding />;
  }

  const hasTopics = subjects.some((s) => s.topic_count > 0);

  return (
    <div className="flex flex-col gap-6 py-2">
      <div className="flex gap-3">
        <Button variant="outline" size="md" className="flex-1" disabled>
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Add topic
        </Button>
        <form action={convoRoulette} className="flex-1">
          <Button
            type="submit"
            variant="secondary"
            size="md"
            className="w-full"
            disabled={!hasTopics}
          >
            <Shuffle className="h-4 w-4" strokeWidth={2.5} />
            Convo Roulette
          </Button>
        </form>
      </div>

      <WelcomeHint />

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="font-display text-lg font-medium text-text">Subjects</h2>
          <p className="text-xs italic text-text-dim">the buckets you care about</p>
        </div>
        <SubjectList subjects={subjects} />
      </section>
    </div>
  );
}
