import Link from 'next/link';
import { ChevronRight, Shuffle } from 'lucide-react';
import { getSubjectsWithCounts } from '@/lib/queries/subjects';
import { getRecentTopics } from '@/lib/queries/topics';
import { getSettings } from '@/lib/queries/settings';
import { convoRoulette } from '@/lib/actions/convo-roulette';
import { Button } from '@/components/ui/button';
import SubjectList from '@/components/home/subject-list';
import WelcomeHint from '@/components/home/welcome-hint';
import EmptyOnboarding from '@/components/home/empty-onboarding';
import AddTopicDialog from '@/components/home/add-topic-dialog';
import TopicSearch from '@/components/home/topic-search';

export default async function HomePage() {
  const [subjects, recent, settings] = await Promise.all([
    getSubjectsWithCounts(),
    getRecentTopics(6),
    getSettings(),
  ]);

  if (subjects.length === 0) {
    return <EmptyOnboarding />;
  }

  const hasTopics = subjects.some((s) => s.topic_count > 0);

  return (
    <div className="flex flex-col gap-6 py-2">
      <div className="flex flex-col gap-3">
        <div className="flex gap-3">
          <AddTopicDialog personaName={settings.persona_name} triggerClassName="flex-1" />
          <form action={convoRoulette} className="flex-1">
            <Button
              type="submit"
              variant="secondary"
              size="md"
              className="w-full"
              disabled={!hasTopics}
            >
              <Shuffle className="h-4 w-4" strokeWidth={2.5} />
              Remember this topic?
            </Button>
          </form>
        </div>
        <TopicSearch />
      </div>

      <WelcomeHint />

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="font-display text-lg font-medium text-text">Subjects</h2>
          <p className="text-xs italic text-text-dim">the buckets you care about</p>
        </div>
        <SubjectList subjects={subjects} />
      </section>

      {recent.length > 0 && (
        <section className="flex flex-col gap-3">
          <Link
            href="/recent"
            className="flex items-center justify-between text-text transition-colors hover:text-teal"
          >
            <h2 className="font-display text-lg font-medium">Recent Ideas</h2>
            <ChevronRight className="h-5 w-5 text-text-dim" />
          </Link>
          <ul className="flex flex-col gap-2">
            {recent.map((topic) => (
              <li key={topic.id}>
                <Link
                  href={`/topic/${topic.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-bg-card px-4 py-3 transition-colors hover:border-border-strong hover:bg-bg-card-2"
                >
                  <span className="flex flex-col">
                    <span className="text-sm font-medium text-text">{topic.title}</span>
                    <span className="text-[11px] text-text-dim">{topic.subject?.name}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-text-dim" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
