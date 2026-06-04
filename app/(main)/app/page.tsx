import Link from 'next/link';
import { ChevronRight, Waypoints } from 'lucide-react';
import { getSubjectsWithCounts } from '@/lib/queries/subjects';
import { getRecentTopics } from '@/lib/queries/topics';
import { getSettings } from '@/lib/queries/settings';
import SubjectList from '@/components/home/subject-list';
import WelcomeHint from '@/components/home/welcome-hint';
import EmptyOnboarding from '@/components/home/empty-onboarding';
import AddTopicDialog from '@/components/home/add-topic-dialog';
import TopicSearch from '@/components/home/topic-search';

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ add?: string }>;
}) {
  const [{ add }, subjects, recent, settings] = await Promise.all([
    searchParams,
    getSubjectsWithCounts(),
    getRecentTopics(6),
    getSettings(),
  ]);

  if (subjects.length === 0) {
    return <EmptyOnboarding />;
  }

  return (
    <div className="flex flex-col gap-6 py-2">
      <div className="flex flex-col gap-3">
        <WelcomeHint />
        <AddTopicDialog personaName={settings.persona_name} defaultOpen={add === '1'} />
        <TopicSearch />
      </div>

      <Link
        href="/nest"
        className="flex items-center gap-3 rounded-xl border border-border bg-bg-card px-4 py-3.5 transition-colors hover:border-border-strong hover:bg-bg-card-2"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-teal/15 text-teal">
          <Waypoints className="h-5 w-5" />
        </span>
        <span className="flex flex-1 flex-col">
          <span className="font-display text-base font-medium text-text">Open your Nest</span>
          <span className="text-[11px] text-text-dim">see your curiosity as a constellation</span>
        </span>
        <ChevronRight className="h-5 w-5 shrink-0 text-text-dim" />
      </Link>

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
