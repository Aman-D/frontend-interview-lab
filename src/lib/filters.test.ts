import { QUESTIONS } from '@/content';
import { EMPTY_FILTERS, filterAndSort, type QuestionRow } from './filters';

const rows: QuestionRow[] = QUESTIONS.map((q, i) => ({ question: q, status: i === 0 ? 'completed' : 'not-started', lastAttemptAt: i === 1 ? 100 : undefined }));

describe('library filtering', () => {
  it('returns everything with empty filters', () => {
    expect(filterAndSort(rows, EMPTY_FILTERS, 'default')).toHaveLength(rows.length);
  });
  it('searches title, topics, concepts and source titles (all terms must match)', () => {
    expect(filterAndSort(rows, { ...EMPTY_FILTERS, search: 'debounce' }, 'default').map((r) => r.question.id)).toContain('js-debounce');
    expect(filterAndSort(rows, { ...EMPTY_FILTERS, search: 'Typeahead' }, 'default').map((r) => r.question.id)).toEqual(['react-autocomplete']);
    expect(filterAndSort(rows, { ...EMPTY_FILTERS, search: 'debounce zzzz' }, 'default')).toHaveLength(0);
  });
  it('filters by category, difficulty, priority, status and concept together', () => {
    const r = filterAndSort(rows, { ...EMPTY_FILTERS, tracks: ['react'], difficulties: ['medium'], priorities: ['P0'] }, 'default');
    expect(r.every((x) => x.question.track === 'react' && x.question.difficulty === 'medium' && x.question.priority === 'P0')).toBe(true);
    expect(r.length).toBeGreaterThan(0);
    expect(filterAndSort(rows, { ...EMPTY_FILTERS, statuses: ['completed'] }, 'default')).toHaveLength(1);
    expect(filterAndSort(rows, { ...EMPTY_FILTERS, concepts: ['tree-aria-pattern'] }, 'default').map((x) => x.question.id)).toContain('react-file-explorer');
  });
  it('sorts', () => {
    const byDuration = filterAndSort(rows, EMPTY_FILTERS, 'duration').map((r) => r.question.estimatedMinutes);
    expect(byDuration).toEqual([...byDuration].sort((a, b) => a - b));
    expect(filterAndSort(rows, EMPTY_FILTERS, 'last-attempted')[0].lastAttemptAt).toBe(100);
  });
});
