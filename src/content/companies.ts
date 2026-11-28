import { QUESTION_BY_ID } from './index';
import type { Question } from './schema';

/**
 * Company prep sets: groupings of questions that already exist in the bank, by the company you are preparing for.
 * A set only references question ids; it never copies or changes question content.
 *
 * A set says what you are preparing for, not what a company asks. `basis` records where the grouping came from,
 * and the page shows it. Do not describe a set as a verified company question list unless a registered
 * `interview-report` source supports it.
 */
export interface CompanySection {
  title: string;
  /** Study priority within this set (independent of each question's own priority). */
  priority: 'P0' | 'P1' | 'P2';
  /**
   * `reported`: the topic appears in the account the set is based on.
   * `coverage`: added by the lab to round out the topic or the role.
   */
  origin: 'reported' | 'coverage';
  questionIds: string[];
}

export interface CompanySet {
  id: string;
  name: string;
  role: string;
  summary: string;
  /** Where the grouping came from and how much to trust it. Shown on the page. */
  basis: string;
  /** Repo-relative path of a longer prep guide, if there is one. */
  guide?: string;
  sections: CompanySection[];
}

export const COMPANIES: CompanySet[] = [
  {
    id: '314e',
    name: '314e',
    role: 'Senior / Lead Frontend Engineer',
    summary: 'Healthcare tech. Advanced React, JavaScript internals, frontend security, two 45-minute system designs and a rich text editor build.',
    basis:
      'Built from one unpublished, second-hand account of a recent loop (memoization, closures, callbacks, recruitment portal HLD, job listing, rich text editor, security), plus related items the lab added for coverage. It is a prediction for preparation, not a verified list of questions 314e asks.',
    guide: 'docs/prep/314e-senior-frontend.md',
    sections: [
      { title: 'Memoization', priority: 'P0', origin: 'reported', questionIds: ['js-memoize', 'arch-memo-child-still-rerenders', 'out-react-memo-unstable-props'] },
      { title: 'Closures and stale closures', priority: 'P0', origin: 'reported', questionIds: ['arch-stale-closures-hooks', 'out-closure-loop-var-let', 'out-counter-factory-shared-state'] },
      { title: 'Callbacks, promises and async', priority: 'P0', origin: 'reported', questionIds: ['js-promise-all', 'js-concurrency-limit', 'out-microtask-vs-timeout', 'out-async-await-order'] },
      { title: 'Debounce and throttle', priority: 'P0', origin: 'coverage', questionIds: ['js-debounce', 'js-throttle'] },
      { title: 'Recruitment portal (system design)', priority: 'P0', origin: 'reported', questionIds: ['arch-sd-recruitment-portal', 'react-kanban-board', 'react-multi-step-form'] },
      { title: 'Job listing (system design)', priority: 'P0', origin: 'reported', questionIds: ['arch-sd-job-listing', 'arch-search-race-conditions', 'react-autocomplete', 'react-data-table'] },
      { title: 'Rich text editor', priority: 'P0', origin: 'reported', questionIds: ['react-rich-text-editor'] },
      { title: 'Frontend security', priority: 'P0', origin: 'reported', questionIds: ['arch-xss-job-description', 'arch-auth-tokens-csrf', 'arch-csp-rollout', 'arch-secure-resume-upload'] },
      {
        title: 'React rendering and state',
        priority: 'P0',
        origin: 'coverage',
        questionIds: ['arch-render-commit-pipeline', 'arch-state-placement-context', 'arch-react-rerender-diagnosis', 'out-react-batching', 'out-react-effect-order', 'out-react-key-reset'],
      },
      { title: 'Rendering strategy and hydration', priority: 'P1', origin: 'coverage', questionIds: ['arch-rendering-strategy-choice', 'arch-hydration-mismatch-debug'] },
      { title: 'Browser internals and performance', priority: 'P1', origin: 'coverage', questionIds: ['arch-memory-leak-hunt', 'arch-web-worker-offload', 'arch-core-web-vitals-plan', 'arch-code-splitting-strategy', 'react-virtualized-list', 'react-infinite-scroll'] },
    ],
  },
];

export const COMPANY_BY_ID: Record<string, CompanySet> = Object.fromEntries(COMPANIES.map((c) => [c.id, c]));

/** Unique question ids in a set, in section order. */
export function companyQuestionIds(c: CompanySet): string[] {
  return [...new Set(c.sections.flatMap((s) => s.questionIds))];
}

export function companyQuestions(c: CompanySet): Question[] {
  return companyQuestionIds(c).map((id) => QUESTION_BY_ID[id]).filter(Boolean);
}

/** Company sets that include a question (for showing "in prep sets" on a question page). */
export function companiesForQuestion(questionId: string): CompanySet[] {
  return COMPANIES.filter((c) => c.sections.some((s) => s.questionIds.includes(questionId)));
}

export interface CompanyPosition {
  set: CompanySet;
  section?: CompanySection;
  /** 0-based position in the set's order. */
  index: number;
  total: number;
  prev?: Question;
  next?: Question;
}

/**
 * Where a question sits in a company set's order (sections top to bottom), with its neighbours.
 * Undefined when the set does not exist or does not contain the question.
 */
export function companyPosition(setId: string | null | undefined, questionId: string): CompanyPosition | undefined {
  const set = setId ? COMPANY_BY_ID[setId] : undefined;
  if (!set) return undefined;
  const qs = companyQuestions(set);
  const index = qs.findIndex((q) => q.id === questionId);
  if (index < 0) return undefined;
  return {
    set,
    section: set.sections.find((s) => s.questionIds.includes(questionId)),
    index,
    total: qs.length,
    prev: qs[index - 1],
    next: qs[index + 1],
  };
}
