import type { Question } from '@/content/schema';
import type { QuestionStatus } from './progress';

export interface LibraryFilters {
  search: string;
  tracks: string[];
  difficulties: string[];
  statuses: QuestionStatus[];
  priorities: string[];
  concepts: string[];
}

export type SortKey = 'default' | 'title' | 'difficulty' | 'priority' | 'duration' | 'last-attempted';

export const EMPTY_FILTERS: LibraryFilters = { search: '', tracks: [], difficulties: [], statuses: [], priorities: [], concepts: [] };

const DIFF = { easy: 0, medium: 1, hard: 2 } as const;
const PRIO = { P0: 0, P1: 1, P2: 2 } as const;

export interface QuestionRow {
  question: Question;
  status: QuestionStatus;
  lastAttemptAt?: number;
}

export function matchesSearch(q: Question, search: string): boolean {
  const s = search.trim().toLowerCase();
  if (!s) return true;
  const hay = [q.title, q.id, ...q.topics, ...q.conceptIds, ...q.research.evidence.map((e) => e.originalTitle)].join(' ').toLowerCase();
  return s.split(/\s+/).every((term) => hay.includes(term));
}

export function filterAndSort(rows: QuestionRow[], f: LibraryFilters, sort: SortKey): QuestionRow[] {
  const out = rows.filter(({ question: q, status }) => {
    if (!matchesSearch(q, f.search)) return false;
    if (f.tracks.length && !f.tracks.includes(q.track)) return false;
    if (f.difficulties.length && !f.difficulties.includes(q.difficulty)) return false;
    if (f.priorities.length && !f.priorities.includes(q.priority)) return false;
    if (f.statuses.length && !f.statuses.includes(status)) return false;
    if (f.concepts.length && !f.concepts.some((c) => q.conceptIds.includes(c))) return false;
    return true;
  });
  const cmp: Record<SortKey, (a: QuestionRow, b: QuestionRow) => number> = {
    default: () => 0,
    title: (a, b) => a.question.title.localeCompare(b.question.title),
    difficulty: (a, b) => DIFF[a.question.difficulty] - DIFF[b.question.difficulty],
    priority: (a, b) => PRIO[a.question.priority] - PRIO[b.question.priority],
    duration: (a, b) => a.question.estimatedMinutes - b.question.estimatedMinutes,
    'last-attempted': (a, b) => (b.lastAttemptAt ?? 0) - (a.lastAttemptAt ?? 0),
  };
  return sort === 'default' ? out : [...out].sort(cmp[sort]);
}
