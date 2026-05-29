import { notFound } from 'next/navigation';
import { getSubject } from '@/lib/queries/subjects';
import { getTopicsBySubject } from '@/lib/queries/topics';
import BackLink from '@/components/nav/back-link';
import SubjectTopics from '@/components/subject/subject-topics';

export default async function SubjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [subject, topics] = await Promise.all([getSubject(id), getTopicsBySubject(id)]);
  if (!subject) notFound();

  return (
    <div className="flex flex-col gap-4 py-2">
      <BackLink href="/" label="Grid" />
      <h1 className="font-display text-2xl font-medium text-text">{subject.name}</h1>
      <SubjectTopics topics={topics} />
    </div>
  );
}
