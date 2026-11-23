import type { Question } from '@/content/schema';
import type { Attempt, ConceptState, Outcome, ProblemProgress } from '@/db/types';

export type QuestionStatus = 'not-started' | 'in-progress' | 'completed' | 'needs-revision';

export const STATUS_LABEL: Record<QuestionStatus, string> = {
  'not-started': 'Not started',
  'in-progress': 'In progress',
  completed: 'Completed',
  'needs-revision': 'Needs revision',
};

export const OUTCOME_LABEL: Record<Outcome, string> = {
  assisted: 'Completed with help',
  independent: 'Independently solved',
  'independent-tested': 'Independently solved & tested',
  incorrect: 'Incorrect',
};

const OUTCOME_RANK: Record<Outcome, number> = { incorrect: 0, assisted: 1, independent: 2, 'independent-tested': 3 };

/**
 * Classifies a finished coding attempt. Any hint or solution view makes it "assisted" — an assisted
 * attempt is never counted as independently solved. "independent-tested" additionally requires that
 * the last automated run actually executed and passed every test (public + hidden).
 */
export function classifyCodingOutcome(a: Pick<Attempt, 'hintsRevealed' | 'solutionRevealed' | 'lastRun'>): Outcome {
  if (a.solutionRevealed || a.hintsRevealed > 0) return 'assisted';
  if (a.lastRun && a.lastRun.status === 'completed' && a.lastRun.allPassed && a.lastRun.total > 0 && a.lastRun.hiddenTotal === a.lastRun.hiddenPassed) {
    return 'independent-tested';
  }
  return 'independent';
}

/** Output prediction: correct + no reveal before answering = independent-tested (the answer is checked against an executed result). */
export function classifyOutputOutcome(correct: boolean, revealedBeforeAnswer: boolean): Outcome {
  if (revealedBeforeAnswer) return 'assisted';
  return correct ? 'independent-tested' : 'incorrect';
}

export function bestOutcome(attempts: Attempt[]): Outcome | undefined {
  let best: Outcome | undefined;
  for (const a of attempts) {
    if (a.status !== 'submitted' || !a.outcome) continue;
    if (!best || OUTCOME_RANK[a.outcome] > OUTCOME_RANK[best]) best = a.outcome;
  }
  return best;
}

export function deriveStatus(attempts: Attempt[], progress?: ProblemProgress): QuestionStatus {
  if (!attempts.length) return 'not-started';
  if (progress?.needsRevision) return 'needs-revision';
  if (attempts.some((a) => a.status === 'submitted')) return 'completed';
  return 'in-progress';
}

/** Spaced-revision interval by self-assessed confidence (1–5). */
export function revisionIntervalDays(confidence: number | undefined, outcome: Outcome | undefined): number {
  if (outcome === 'incorrect' || outcome === 'assisted') return confidence && confidence >= 4 ? 3 : 1;
  switch (confidence) {
    case 1: return 1;
    case 2: return 2;
    case 3: return 4;
    case 4: return 7;
    case 5: return 14;
    default: return 3;
  }
}

/** Whether a submission should put the question into the revision queue. */
export function shouldNeedRevision(outcome: Outcome, confidence?: number): boolean {
  return outcome !== 'independent-tested' || (confidence !== undefined && confidence <= 2);
}

export interface ReadinessCheck {
  eligible: boolean;
  reasons: string[];
}

/**
 * Interview-ready is never automatic. The user may only mark it when an attempt exists that was
 * independent, fully tested, covered every MUST requirement and was self-rated ≥ 4.
 */
export function interviewReadyEligibility(question: Question, attempts: Attempt[]): ReadinessCheck {
  const mustIds = question.kind === 'coding' ? question.spec.requirements.filter((r) => r.level === 'MUST').map((r) => r.id) : [];
  const submitted = attempts.filter((a) => a.status === 'submitted');
  const qualifying = submitted.filter(
    (a) => a.outcome === 'independent-tested' && (a.confidence ?? 0) >= 4 && mustIds.every((id) => a.requirementsDone.includes(id)),
  );
  if (qualifying.length) return { eligible: true, reasons: [] };
  const reasons: string[] = [];
  if (!submitted.some((a) => a.outcome === 'independent-tested')) reasons.push('Needs an attempt solved without hints or solution, with all tests passing.');
  if (!submitted.some((a) => (a.confidence ?? 0) >= 4)) reasons.push('Needs a self-assessed confidence of 4 or 5.');
  if (mustIds.length && !submitted.some((a) => mustIds.every((id) => a.requirementsDone.includes(id)))) reasons.push('Needs every MUST requirement checked off in the attempt.');
  if (!reasons.length) reasons.push('No single attempt meets all criteria at once.');
  return { eligible: false, reasons };
}

export interface DashboardStats {
  available: number;
  completed: number;
  independent: number;
  independentTested: number;
  assisted: number;
  needsRevision: number;
  interviewReady: number;
  practiceMs: number;
  byTrack: Record<string, { total: number; completed: number; independentTested: number }>;
}

export function computeStats(questions: Question[], attempts: Attempt[], progress: ProblemProgress[]): DashboardStats {
  const byProblem = groupBy(attempts, (a) => a.problemId);
  const progressMap = new Map(progress.map((p) => [p.problemId, p]));
  const stats: DashboardStats = { available: questions.length, completed: 0, independent: 0, independentTested: 0, assisted: 0, needsRevision: 0, interviewReady: 0, practiceMs: 0, byTrack: {} };
  for (const a of attempts) stats.practiceMs += a.activeMs;
  for (const q of questions) {
    const t = (stats.byTrack[q.track] ??= { total: 0, completed: 0, independentTested: 0 });
    t.total++;
    const as = byProblem.get(q.id) ?? [];
    const p = progressMap.get(q.id);
    const status = deriveStatus(as, p);
    const best = bestOutcome(as);
    if (as.some((a) => a.status === 'submitted')) {
      stats.completed++;
      t.completed++;
    }
    if (best === 'independent' || best === 'independent-tested') stats.independent++;
    if (best === 'independent-tested') {
      stats.independentTested++;
      t.independentTested++;
    }
    if (best === 'assisted') stats.assisted++;
    if (status === 'needs-revision') stats.needsRevision++;
    if (p?.interviewReady) stats.interviewReady++;
  }
  return stats;
}

export interface Recommendation {
  question: Question;
  reason: string;
}

const PRIORITY_RANK = { P0: 0, P1: 1, P2: 2 } as const;

/** Deterministic recommendations from recorded activity only. */
export function recommendNext(
  questions: Question[],
  attempts: Attempt[],
  progress: ProblemProgress[],
  conceptStates: ConceptState[],
  now: number,
  limit = 5,
): Recommendation[] {
  const byProblem = groupBy(attempts, (a) => a.problemId);
  const progressMap = new Map(progress.map((p) => [p.problemId, p]));
  const weak = new Set(conceptStates.filter((c) => c.status === 'needs-revision').map((c) => c.conceptId));
  const out: Recommendation[] = [];
  const seen = new Set<string>();
  const push = (q: Question, reason: string) => {
    if (seen.has(q.id) || out.length >= limit) return;
    seen.add(q.id);
    out.push({ question: q, reason });
  };
  // 1. Revisions that are due
  for (const q of questions) {
    const p = progressMap.get(q.id);
    if (p?.needsRevision && p.nextRevisionAt !== undefined && p.nextRevisionAt <= now) push(q, 'Revision is due');
  }
  // 2. Unfinished attempts
  for (const q of questions) if ((byProblem.get(q.id) ?? []).some((a) => a.status === 'active')) push(q, 'You have an attempt in progress');
  // 3. Not-started questions that practise a weak concept
  for (const q of questions) if (!byProblem.has(q.id) && q.conceptIds.some((c) => weak.has(c))) push(q, 'Practises a concept you marked "needs revision"');
  // 4. Highest-priority not-started questions
  const notStarted = questions.filter((q) => !byProblem.has(q.id)).sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
  for (const q of notStarted) push(q, `${q.priority} question you have not attempted`);
  return out;
}

/** Weakness → Practice: questions linked to concepts marked "needs revision", least-mastered first. */
export function weaknessPractice(questions: Question[], conceptStates: ConceptState[], attempts: Attempt[]): { conceptId: string; questions: Question[] }[] {
  const byProblem = groupBy(attempts, (a) => a.problemId);
  return conceptStates
    .filter((c) => c.status === 'needs-revision')
    .map((c) => ({
      conceptId: c.conceptId,
      questions: questions
        .filter((q) => q.conceptIds.includes(c.conceptId))
        .sort((a, b) => rank(bestOutcome(byProblem.get(a.id) ?? [])) - rank(bestOutcome(byProblem.get(b.id) ?? []))),
    }));
  function rank(o: Outcome | undefined) {
    return o ? OUTCOME_RANK[o] + 1 : 0;
  }
}

/** Concepts with evidence of understanding, used to gate the "Understood" status. */
export function conceptEvidence(
  conceptId: string,
  questions: Question[],
  attempts: Attempt[],
  mcqCorrectProblemIds: Set<string>,
  solidFollowUpProblemIds: Set<string>,
): string[] {
  const linked = questions.filter((q) => q.conceptIds.includes(conceptId)).map((q) => q.id);
  const evidence: string[] = [];
  for (const id of linked) {
    if (attempts.some((a) => a.problemId === id && a.status === 'submitted' && a.outcome === 'independent-tested')) evidence.push(`solved ${id} independently`);
    if (mcqCorrectProblemIds.has(id)) evidence.push(`answered an MCQ on ${id} correctly`);
    if (solidFollowUpProblemIds.has(id)) evidence.push(`rated a follow-up on ${id} as solid`);
  }
  return evidence;
}

export function groupBy<T, K>(items: T[], key: (t: T) => K): Map<K, T[]> {
  const m = new Map<K, T[]>();
  for (const it of items) {
    const k = key(it);
    const arr = m.get(k);
    if (arr) arr.push(it);
    else m.set(k, [it]);
  }
  return m;
}

/** Normalises an output-prediction answer for comparison: trims lines, drops blank lines and quotes around whole lines. */
export function normalizeOutput(text: string): string[] {
  return text
    .split('\n')
    .map((l) => l.trim().replace(/^["'`](.*)["'`]$/, '$1'))
    .filter((l) => l.length > 0);
}

export function isOutputAnswerCorrect(answer: string, expected: string[]): boolean {
  const a = normalizeOutput(answer);
  const e = expected.map((l) => l.trim());
  return a.length === e.length && a.every((l, i) => l === e[i]);
}
