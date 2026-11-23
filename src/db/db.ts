import Dexie, { type Table } from 'dexie';
import type { Attempt, ConceptState, Draft, FollowUpAnswer, KV, McqAnswer, Note, ProblemProgress } from './types';

/** Bump with a new `.version()` block when the stores change. */
export const DB_VERSION = 1;
export const DB_NAME = 'frontend-interview-lab';

export class LabDB extends Dexie {
  attempts!: Table<Attempt, string>;
  drafts!: Table<Draft, string>;
  progress!: Table<ProblemProgress, string>;
  notes!: Table<Note, string>;
  concepts!: Table<ConceptState, string>;
  mcqAnswers!: Table<McqAnswer, string>;
  followUps!: Table<FollowUpAnswer, string>;
  kv!: Table<KV, string>;

  constructor(name = DB_NAME) {
    super(name);
    this.version(DB_VERSION).stores({
      attempts: 'id, problemId, status, startedAt, [problemId+status]',
      drafts: 'problemId, updatedAt',
      progress: 'problemId, needsRevision, nextRevisionAt',
      notes: 'id, problemId, conceptId, attemptId, category, updatedAt, reminderAt',
      concepts: 'conceptId, status',
      mcqAnswers: 'id, problemId, mcqId, at',
      followUps: 'id, problemId',
      kv: 'key',
    });
  }
}

export const db = new LabDB();

export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
