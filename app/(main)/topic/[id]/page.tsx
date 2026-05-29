import { notFound } from 'next/navigation';
import { getTopic } from '@/lib/queries/topics';
import { getSettings } from '@/lib/queries/settings';
import BackLink from '@/components/nav/back-link';
import ModeTabs from '@/components/topic/mode-tabs';

export default async function TopicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [topic, settings] = await Promise.all([getTopic(id), getSettings()]);
  if (!topic) notFound();

  return (
    <div className="flex flex-col gap-4 py-2">
      <BackLink href={`/subject/${topic.subject_id}`} label={topic.subject.name} />

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-bg-card-2 px-2.5 py-0.5 text-xs text-text-muted">
            {topic.subject.name}
          </span>
          {topic.facets.map((facet) => (
            <span
              key={facet.id}
              className="rounded-full bg-bg-card-2 px-2.5 py-0.5 text-xs text-text-dim"
            >
              #{facet.name}
            </span>
          ))}
        </div>
        <h1 className="font-display text-2xl font-medium leading-tight text-text">{topic.title}</h1>
      </div>

      <ModeTabs
        topicId={topic.id}
        personaName={settings.persona_name}
        defaultMode={settings.default_mode}
        thoughts={topic.thoughts}
      />
    </div>
  );
}
