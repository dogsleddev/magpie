import { notFound } from 'next/navigation';
import { getSubject } from '@/lib/queries/subjects';
import { getTopicsBySubject } from '@/lib/queries/topics';
import { getSettings } from '@/lib/queries/settings';
import BackLink from '@/components/nav/back-link';
import SubjectTopics from '@/components/subject/subject-topics';
import AddTopicDialog from '@/components/home/add-topic-dialog';

export default async function SubjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [subject, topics, settings] = await Promise.all([
    getSubject(id),
    getTopicsBySubject(id),
    getSettings(),
  ]);
  if (!subject) notFound();

  return (
    <div className="flex flex-col gap-4 py-2">
      <BackLink href="/" label="Grid" />
      <h1 className="font-display text-2xl font-medium text-text">{subject.name}</h1>
      <AddTopicDialog
        subjectId={subject.id}
        personaName={settings.persona_name}
        triggerClassName="w-full"
      />
      <SubjectTopics topics={topics} />
    </div>
  );
}
