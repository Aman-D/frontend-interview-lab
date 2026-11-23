import { QUESTION_BY_ID, QUESTIONS } from '@/content';
import type { Attempt, RunSummary } from '@/db/types';
import { createTimer } from './timer';
import { bestOutcome, classifyCodingOutcome, computeStats, deriveStatus, interviewReadyEligibility, isOutputAnswerCorrect, recommendNext, weaknessPractice } from './progress';

const run = (passed: number, total: number, hiddenPassed = passed, hiddenTotal = total, status: RunSummary['status'] = 'completed'): RunSummary => ({
  at: 0, status, passed, total, publicPassed: passed, publicTotal: total, hiddenPassed, hiddenTotal, allPassed: status === 'completed' && passed === total,
});

function attempt(p: Partial<Attempt>): Attempt {
  return { id: Math.random().toString(36), problemId: 'js-debounce', mode: 'study', status: 'submitted', startedAt: 1, activeMs: 0, timer: createTimer(), runCount: 1, requirementsDone: [], hintsRevealed: 0, solutionRevealed: false, ...p };
}

describe('outcome classification', () => {
  it('any hint or solution view makes an attempt assisted, even with passing tests', () => {
    expect(classifyCodingOutcome({ hintsRevealed: 1, solutionRevealed: false, lastRun: run(9, 9) })).toBe('assisted');
    expect(classifyCodingOutcome({ hintsRevealed: 0, solutionRevealed: true, lastRun: run(9, 9) })).toBe('assisted');
  });
  it('independent-tested requires an executed, fully passing run', () => {
    expect(classifyCodingOutcome({ hintsRevealed: 0, solutionRevealed: false, lastRun: run(9, 9) })).toBe('independent-tested');
    expect(classifyCodingOutcome({ hintsRevealed: 0, solutionRevealed: false, lastRun: run(8, 9) })).toBe('independent');
    expect(classifyCodingOutcome({ hintsRevealed: 0, solutionRevealed: false, lastRun: undefined })).toBe('independent');
    expect(classifyCodingOutcome({ hintsRevealed: 0, solutionRevealed: false, lastRun: run(0, 0) })).toBe('independent');
    expect(classifyCodingOutcome({ hintsRevealed: 0, solutionRevealed: false, lastRun: run(9, 9, 9, 9, 'timeout') })).toBe('independent');
  });
  it('bestOutcome ignores active/abandoned attempts', () => {
    expect(bestOutcome([attempt({ status: 'active', outcome: 'independent-tested' }), attempt({ outcome: 'assisted' })])).toBe('assisted');
  });
});

describe('status derivation', () => {
  it('not started / in progress / completed / needs revision', () => {
    expect(deriveStatus([])).toBe('not-started');
    expect(deriveStatus([attempt({ status: 'active' })])).toBe('in-progress');
    expect(deriveStatus([attempt({ outcome: 'independent' })])).toBe('completed');
    expect(deriveStatus([attempt({ outcome: 'independent' })], { problemId: 'x', needsRevision: true, interviewReady: false, updatedAt: 0 })).toBe('needs-revision');
  });
});

describe('interview-ready is never automatic', () => {
  const q = QUESTION_BY_ID['js-debounce'];
  const mustIds = q.kind === 'coding' ? q.spec.requirements.filter((r) => r.level === 'MUST').map((r) => r.id) : [];
  it('passing tests alone is not enough', () => {
    const r = interviewReadyEligibility(q, [attempt({ outcome: 'independent-tested', confidence: 3, requirementsDone: mustIds })]);
    expect(r.eligible).toBe(false);
  });
  it('requires all MUST requirements', () => {
    const r = interviewReadyEligibility(q, [attempt({ outcome: 'independent-tested', confidence: 5, requirementsDone: mustIds.slice(1) })]);
    expect(r.eligible).toBe(false);
  });
  it('assisted attempts never qualify', () => {
    expect(interviewReadyEligibility(q, [attempt({ outcome: 'assisted', confidence: 5, requirementsDone: mustIds })]).eligible).toBe(false);
  });
  it('eligible with an independent, tested, confident, complete attempt', () => {
    expect(interviewReadyEligibility(q, [attempt({ outcome: 'independent-tested', confidence: 4, requirementsDone: mustIds })]).eligible).toBe(true);
  });
});

describe('dashboard stats use recorded activity only', () => {
  it('is all zeros with no activity', () => {
    const s = computeStats(QUESTIONS, [], []);
    expect(s.completed).toBe(0);
    expect(s.independent).toBe(0);
    expect(s.practiceMs).toBe(0);
    expect(s.available).toBe(QUESTIONS.length);
  });
  it('counts outcomes and time', () => {
    const s = computeStats(QUESTIONS, [attempt({ outcome: 'independent-tested', activeMs: 60000 }), attempt({ problemId: 'js-curry', outcome: 'assisted', activeMs: 1000 })], []);
    expect(s.completed).toBe(2);
    expect(s.independentTested).toBe(1);
    expect(s.assisted).toBe(1);
    expect(s.practiceMs).toBe(61000);
  });
});

describe('recommendations and weakness → practice', () => {
  it('due revisions first, then weak-concept questions', () => {
    const recs = recommendNext(QUESTIONS, [attempt({ outcome: 'assisted' })], [{ problemId: 'js-debounce', needsRevision: true, nextRevisionAt: 0, interviewReady: false, updatedAt: 0 }], [{ conceptId: 'abort-controller', status: 'needs-revision', updatedAt: 0 }], 10);
    expect(recs[0].question.id).toBe('js-debounce');
    expect(recs[1].question.conceptIds).toContain('abort-controller');
  });
  it('weaknessPractice lists questions linked to weak concepts', () => {
    const w = weaknessPractice(QUESTIONS, [{ conceptId: 'debouncing', status: 'needs-revision', updatedAt: 0 }], []);
    expect(w[0].questions.map((q) => q.id)).toContain('js-debounce');
  });
});

describe('output answer comparison', () => {
  it('is exact per line but tolerant of whitespace, blank lines and wrapping quotes', () => {
    expect(isOutputAnswerCorrect('  a \n\n"b"\n', ['a', 'b'])).toBe(true);
    expect(isOutputAnswerCorrect('b\na', ['a', 'b'])).toBe(false);
    expect(isOutputAnswerCorrect('a', ['a', 'b'])).toBe(false);
    expect(isOutputAnswerCorrect('1', ['true'])).toBe(false);
  });
});
