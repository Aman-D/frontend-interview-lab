import { z } from 'zod';
import type { Question } from '@/content/schema';
import { classifyCodingOutcome, classifyOutputOutcome, interviewReadyEligibility, revisionIntervalDays, shouldNeedRevision } from '@/lib/progress';
import { createTimer, type TimerState } from '@/lib/timer';
import { summarize, type RunResult } from '@/runtime/types';
import type { FileMap } from '@/runtime/types';
import { db, DB_VERSION, uid, type LabDB } from './db';
import type { Attempt, ConceptStatus, FollowUpAnswer, Note, NoteCategory, PracticeMode, ProblemProgress, RunSummary } from './types';

const DAY = 86_400_000;

export function createRepo(database: LabDB = db) {
  async function getActiveAttempt(problemId: string): Promise<Attempt | undefined> {
    return database.attempts.where('[problemId+status]').equals([problemId, 'active']).first();
  }

  async function startAttempt(problemId: string, mode: PracticeMode, timer?: TimerState): Promise<Attempt> {
    const existing = await getActiveAttempt(problemId);
    if (existing) return existing;
    const attempt: Attempt = {
      id: uid(),
      problemId,
      mode,
      status: 'active',
      startedAt: Date.now(),
      activeMs: 0,
      timer: timer ?? createTimer(mode === 'study' ? 'stopwatch' : 'countdown', 45),
      runCount: 0,
      requirementsDone: [],
      hintsRevealed: 0,
      solutionRevealed: false,
    };
    await database.attempts.add(attempt);
    return attempt;
  }

  async function patchAttempt(id: string, patch: Partial<Attempt>) {
    await database.attempts.update(id, patch);
  }

  async function saveDraft(problemId: string, files: FileMap) {
    await database.drafts.put({ problemId, files, updatedAt: Date.now() });
  }

  async function resetDraft(problemId: string) {
    await database.drafts.delete(problemId);
  }

  async function recordRun(attemptId: string, result: RunResult): Promise<RunSummary> {
    const s = summarize(result);
    const run: RunSummary = { at: result.startedAt, status: result.status, ...s };
    await database.transaction('rw', database.attempts, async () => {
      const a = await database.attempts.get(attemptId);
      if (!a) return;
      await database.attempts.update(attemptId, { lastRun: run, runCount: a.runCount + 1 });
    });
    return run;
  }

  async function revealHint(attemptId: string, index: number) {
    const a = await database.attempts.get(attemptId);
    if (!a) return;
    if (index + 1 > a.hintsRevealed) await database.attempts.update(attemptId, { hintsRevealed: index + 1 });
  }

  async function revealSolution(attemptId: string) {
    const a = await database.attempts.get(attemptId);
    if (!a || a.solutionRevealed) return;
    await database.attempts.update(attemptId, { solutionRevealed: true, solutionRevealedAt: Date.now() });
  }

  async function toggleRequirement(attemptId: string, reqId: string, done: boolean) {
    const a = await database.attempts.get(attemptId);
    if (!a) return;
    const set = new Set(a.requirementsDone);
    if (done) set.add(reqId);
    else set.delete(reqId);
    await database.attempts.update(attemptId, { requirementsDone: [...set] });
  }

  async function addActiveTime(attemptId: string, ms: number) {
    const a = await database.attempts.get(attemptId);
    if (!a || a.status !== 'active') return;
    await database.attempts.update(attemptId, { activeMs: a.activeMs + ms });
  }

  async function submitCodingAttempt(
    attemptId: string,
    input: { files: FileMap; confidence: 1 | 2 | 3 | 4 | 5; mistakes: string; nextRevisionAt?: number },
  ): Promise<Attempt | undefined> {
    return database.transaction('rw', database.attempts, database.progress, async () => {
      const a = await database.attempts.get(attemptId);
      if (!a || a.status !== 'active') return a;
      const outcome = classifyCodingOutcome(a);
      const nextRevisionAt = input.nextRevisionAt ?? Date.now() + revisionIntervalDays(input.confidence, outcome) * DAY;
      const done: Attempt = { ...a, status: 'submitted', endedAt: Date.now(), files: input.files, confidence: input.confidence, mistakes: input.mistakes, nextRevisionAt, outcome };
      await database.attempts.put(done);
      await updateProgressAfterSubmit(a.problemId, outcome, input.confidence, nextRevisionAt);
      return done;
    });
  }

  async function submitOutputAttempt(problemId: string, mode: PracticeMode, answer: string, correct: boolean, revealedBeforeAnswer: boolean, startedAt: number): Promise<Attempt> {
    const outcome = classifyOutputOutcome(correct, revealedBeforeAnswer);
    const confidence: 3 | 5 = correct ? 5 : 3;
    const nextRevisionAt = Date.now() + revisionIntervalDays(correct ? 4 : 1, outcome) * DAY;
    const attempt: Attempt = {
      id: uid(),
      problemId,
      mode,
      status: 'submitted',
      startedAt,
      endedAt: Date.now(),
      activeMs: Math.max(0, Date.now() - startedAt),
      timer: createTimer(),
      runCount: 0,
      requirementsDone: [],
      hintsRevealed: 0,
      solutionRevealed: revealedBeforeAnswer,
      answer,
      correct,
      outcome,
      nextRevisionAt,
    };
    await database.transaction('rw', database.attempts, database.progress, async () => {
      await database.attempts.add(attempt);
      await updateProgressAfterSubmit(problemId, outcome, correct ? undefined : confidence, nextRevisionAt);
    });
    return attempt;
  }

  /**
   * Architecture/design questions: MCQs are graded, the written answer is self-assessed against the outline.
   * Outcome: model answer viewed before submitting → assisted; all MCQs right on the first try and ≥ 70% of the
   * outline covered (self-assessed) → independent-tested; MCQs right but less covered → independent; else incorrect.
   */
  async function submitQuizAttempt(
    problemId: string,
    input: { answer: string; mcqCorrect: number; mcqTotal: number; outlineCovered: number; outlineTotal: number; revealedBeforeSubmit: boolean; confidence: 1 | 2 | 3 | 4 | 5; startedAt: number },
  ): Promise<Attempt> {
    const allMcq = input.mcqTotal > 0 && input.mcqCorrect === input.mcqTotal;
    const coverage = input.outlineTotal ? input.outlineCovered / input.outlineTotal : 0;
    const outcome: Attempt['outcome'] = input.revealedBeforeSubmit ? 'assisted' : allMcq && coverage >= 0.7 ? 'independent-tested' : allMcq ? 'independent' : 'incorrect';
    const nextRevisionAt = Date.now() + revisionIntervalDays(input.confidence, outcome) * DAY;
    const attempt: Attempt = {
      id: uid(),
      problemId,
      mode: 'study',
      status: 'submitted',
      startedAt: input.startedAt,
      endedAt: Date.now(),
      activeMs: Math.max(0, Date.now() - input.startedAt),
      timer: createTimer(),
      runCount: 0,
      requirementsDone: [],
      hintsRevealed: 0,
      solutionRevealed: input.revealedBeforeSubmit,
      answer: input.answer,
      correct: allMcq,
      confidence: input.confidence,
      mistakes: `MCQs ${input.mcqCorrect}/${input.mcqTotal} on first try; outline covered ${input.outlineCovered}/${input.outlineTotal} (self-assessed)`,
      outcome,
      nextRevisionAt,
    };
    await database.transaction('rw', database.attempts, database.progress, async () => {
      await database.attempts.add(attempt);
      await updateProgressAfterSubmit(problemId, outcome!, input.confidence, nextRevisionAt);
    });
    return attempt;
  }

  async function updateProgressAfterSubmit(problemId: string, outcome: Attempt['outcome'] & string, confidence: number | undefined, nextRevisionAt: number) {
    const prev = await database.progress.get(problemId);
    const needs = shouldNeedRevision(outcome, confidence);
    const p: ProblemProgress = {
      problemId,
      needsRevision: needs,
      nextRevisionAt: needs ? nextRevisionAt : prev?.nextRevisionAt ?? nextRevisionAt,
      interviewReady: prev?.interviewReady ?? false,
      interviewReadyAt: prev?.interviewReadyAt,
      updatedAt: Date.now(),
    };
    // A later assisted/failed attempt revokes interview-ready.
    if (needs && p.interviewReady) {
      p.interviewReady = false;
      p.interviewReadyAt = undefined;
    }
    await database.progress.put(p);
  }

  async function abandonAttempt(attemptId: string, files?: FileMap) {
    await database.attempts.update(attemptId, { status: 'abandoned', endedAt: Date.now(), files });
  }

  async function setNeedsRevision(problemId: string, needsRevision: boolean, nextRevisionAt?: number) {
    const prev = await database.progress.get(problemId);
    await database.progress.put({
      problemId,
      needsRevision,
      nextRevisionAt: nextRevisionAt ?? prev?.nextRevisionAt ?? Date.now() + DAY,
      interviewReady: needsRevision ? false : prev?.interviewReady ?? false,
      interviewReadyAt: needsRevision ? undefined : prev?.interviewReadyAt,
      updatedAt: Date.now(),
    });
  }

  /** Throws if the evidence does not support it — interview-ready is never set automatically. */
  async function setInterviewReady(question: Question, ready: boolean) {
    if (ready) {
      const attempts = await database.attempts.where('problemId').equals(question.id).toArray();
      const check = interviewReadyEligibility(question, attempts);
      if (!check.eligible) throw new Error(check.reasons.join(' '));
    }
    const prev = await database.progress.get(question.id);
    await database.progress.put({
      problemId: question.id,
      needsRevision: ready ? false : prev?.needsRevision ?? false,
      nextRevisionAt: prev?.nextRevisionAt,
      interviewReady: ready,
      interviewReadyAt: ready ? Date.now() : undefined,
      updatedAt: Date.now(),
    });
  }

  async function saveNote(note: Partial<Note> & { category: NoteCategory; body: string; title: string }): Promise<Note> {
    const now = Date.now();
    const full: Note = { id: note.id ?? uid(), createdAt: note.createdAt ?? now, ...note, updatedAt: now } as Note;
    await database.notes.put(full);
    return full;
  }

  async function deleteNote(id: string) {
    await database.notes.delete(id);
  }

  async function setConceptStatus(conceptId: string, status: ConceptStatus) {
    await database.concepts.put({ conceptId, status, updatedAt: Date.now() });
  }

  async function answerMcq(problemId: string, mcqId: string, selectedOptionId: string, correct: boolean) {
    await database.mcqAnswers.add({ id: uid(), problemId, mcqId, selectedOptionId, correct, at: Date.now() });
  }

  async function saveFollowUp(problemId: string, followUpId: string, patch: Partial<FollowUpAnswer>) {
    const id = `${problemId}:${followUpId}`;
    const prev = await database.followUps.get(id);
    await database.followUps.put({ id, problemId, followUpId, answer: '', revealed: false, ...prev, ...patch, updatedAt: Date.now() });
  }

  return {
    getActiveAttempt, startAttempt, patchAttempt, saveDraft, resetDraft, recordRun, revealHint, revealSolution,
    toggleRequirement, addActiveTime, submitCodingAttempt, submitOutputAttempt, submitQuizAttempt, abandonAttempt, setNeedsRevision,
    setInterviewReady, saveNote, deleteNote, setConceptStatus, answerMcq, saveFollowUp,
    exportAll: () => exportAll(database),
    importAll: (data: unknown, mode: 'merge' | 'replace') => importAll(database, data, mode),
  };
}

export const repo = createRepo();

/* -------------------------- export / import -------------------------- */

export const EXPORT_FORMAT = 'frontend-interview-lab-export';

const ExportFile = z.object({
  format: z.literal(EXPORT_FORMAT),
  dbVersion: z.number().int().positive(),
  exportedAt: z.string(),
  tables: z.object({
    attempts: z.array(z.object({ id: z.string(), problemId: z.string(), status: z.string() }).passthrough()),
    drafts: z.array(z.object({ problemId: z.string(), files: z.record(z.string()) }).passthrough()),
    progress: z.array(z.object({ problemId: z.string() }).passthrough()),
    notes: z.array(z.object({ id: z.string(), body: z.string() }).passthrough()),
    concepts: z.array(z.object({ conceptId: z.string(), status: z.enum(['untested', 'understood', 'needs-revision']) }).passthrough()),
    mcqAnswers: z.array(z.object({ id: z.string() }).passthrough()),
    followUps: z.array(z.object({ id: z.string() }).passthrough()),
  }),
});
export type ExportFile = z.infer<typeof ExportFile>;

async function exportAll(database: LabDB): Promise<ExportFile> {
  const file = {
    format: EXPORT_FORMAT,
    dbVersion: DB_VERSION,
    exportedAt: new Date().toISOString(),
    tables: {
      attempts: await database.attempts.toArray(),
      drafts: await database.drafts.toArray(),
      progress: await database.progress.toArray(),
      notes: await database.notes.toArray(),
      concepts: await database.concepts.toArray(),
      mcqAnswers: await database.mcqAnswers.toArray(),
      followUps: await database.followUps.toArray(),
    },
  };
  return file as unknown as ExportFile;
}

async function importAll(database: LabDB, data: unknown, mode: 'merge' | 'replace'): Promise<{ counts: Record<string, number> }> {
  const parsed = ExportFile.safeParse(data);
  if (!parsed.success) throw new Error(`Not a valid export file: ${parsed.error.issues[0]?.path.join('.')} ${parsed.error.issues[0]?.message}`);
  if (parsed.data.dbVersion > DB_VERSION) throw new Error(`Export was created by a newer version (db v${parsed.data.dbVersion}).`);
  const t = parsed.data.tables;
  const counts: Record<string, number> = {};
  const tables = [database.attempts, database.drafts, database.progress, database.notes, database.concepts, database.mcqAnswers, database.followUps];
  await database.transaction('rw', tables, async () => {
    if (mode === 'replace') for (const tb of tables) await tb.clear();
    for (const [name, rows] of Object.entries(t)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (database as any)[name].bulkPut(rows);
      counts[name] = rows.length;
    }
  });
  return { counts };
}
