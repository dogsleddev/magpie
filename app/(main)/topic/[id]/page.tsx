import { notFound } from 'next/navigation';
import { getTopic } from '@/lib/queries/topics';
import { getSettings } from '@/lib/queries/settings';
import { getConversation } from '@/lib/queries/conversations';
import { getSubjectsWithCounts } from '@/lib/queries/subjects';
import { getFacetsWithCounts } from '@/lib/queries/facets';
import BackLink from '@/components/nav/back-link';
import ModeTabs from '@/components/topic/mode-tabs';
import TopicMetaEditor from '@/components/topic/topic-meta-editor';
import DeleteTopic from '@/components/topic/delete-topic';
import type { ConversationMessage } from '@/lib/queries/types';

export default async function TopicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [topic, settings, conversation, subjects, facets] = await Promise.all([
    getTopic(id),
    getSettings(),
    getConversation(id),
    getSubjectsWithCounts(),
    getFacetsWithCounts(),
  ]);
  if (!topic) notFound();

  const conversationMessages = (conversation?.messages ?? []) as unknown as ConversationMessage[];

  return (
    <div className="flex flex-col gap-4 py-2">
      <BackLink href={`/subject/${topic.subject_id}`} label={topic.subject.name} />

      <div className="flex flex-col gap-2">
        <TopicMetaEditor
          topicId={topic.id}
          subjectId={topic.subject_id}
          initialFacets={topic.facets.map((f) => ({ name: f.name, id: f.id }))}
          subjects={subjects.map((s) => ({ id: s.id, name: s.name }))}
          allFacets={facets.map((f) => f.name)}
        />
        <h1 className="font-display text-2xl font-medium leading-tight text-text">{topic.title}</h1>
      </div>

      <ModeTabs
        topicId={topic.id}
        personaName={settings.persona_name}
        defaultMode={settings.default_mode}
        thoughts={topic.thoughts}
        conversationMessages={conversationMessages}
      />

      <div className="mt-4 flex justify-center pt-2">
        <DeleteTopic topicId={topic.id} subjectId={topic.subject_id} />
      </div>
    </div>
  );
}
