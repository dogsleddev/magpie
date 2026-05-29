import type { Tables } from '@/lib/supabase/types';

export type Subject = Tables<'subjects'>;
export type Topic = Tables<'topics'>;
export type Facet = Tables<'facets'>;
export type Thought = Tables<'thoughts'>;
export type Conversation = Tables<'conversations'>;
export type DiscoverItem = Tables<'discover_items'>;
export type UserSettings = Tables<'user_settings'>;

export type SubjectWithCount = Subject & { topic_count: number };
export type FacetWithCount = Facet & { topic_count: number };

export type TopicWithFacets = Topic & { facets: Facet[] };
export type TopicWithSubjectAndFacets = Topic & {
  subject: Subject;
  facets: Facet[];
};
export type TopicFull = Topic & {
  subject: Subject;
  facets: Facet[];
  thoughts: Thought[];
};
export type TopicWithThoughts = Topic & { thoughts: Thought[] };

export type ConversationMessage = { role: 'user' | 'assistant'; content: string };

export type CreateTopicInput = {
  title: string;
  subjectId: string;
  facetIds?: string[];
  isGroup?: boolean;
  parentTopicId?: string | null;
};
