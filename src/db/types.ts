import type { TimerState } from '@/lib/timer';
import type { FileMap, RunStatus } from '@/runtime/types';

export type PracticeMode = 'study' | 'interview' | 'revision';

/**
 * - assisted: a hint or the solution was viewed during the attempt
 * - independent: no help, but tests were not all passing (or never run)
 * - independent-tested: no help AND the last automated run passed every public + hidden test
 * - incorrect: output-prediction answer was wrong
 */
export type Outcome = 'assisted' | 'independent' | 'independent-tested' | 'incorrect';

export interface RunSummary {
  at: number;
  status: RunStatus;
  passed: number;
  total: number;
  publicPassed: number;
  publicTotal: number;
  hiddenPassed: number;
  hiddenTotal: number;
  allPassed: boolean;
}

export interface Attempt {
  id: string;
  problemId: string;
  mode: PracticeMode;
  status: 'active' | 'submitted' | 'abandoned';
  startedAt: number;
  endedAt?: number;
  /** Time the workspace was open and visible during this attempt. */
  activeMs: number;
  timer: TimerState;
  files?: FileMap;
  lastRun?: RunSummary;
  runCount: number;
  requirementsDone: string[];
  hintsRevealed: number;
  solutionRevealed: boolean;
  solutionRevealedAt?: number;
  confidence?: 1 | 2 | 3 | 4 | 5;
  mistakes?: string;
  nextRevisionAt?: number;
  outcome?: Outcome;
  /** Output-prediction only. */
  answer?: string;
  correct?: boolean;
}

export interface Draft {
  problemId: string;
  files: FileMap;
  updatedAt: number;
}

export interface ProblemProgress {
  problemId: string;
  needsRevision: boolean;
  nextRevisionAt?: number;
  interviewReady: boolean;
  interviewReadyAt?: number;
  updatedAt: number;
}

export type NoteCategory = 'explanation' | 'mistake' | 'insight' | 'interview-feedback' | 'revision-reminder';
export const NOTE_CATEGORIES: { id: NoteCategory; label: string }[] = [
  { id: 'explanation', label: 'My explanation' },
  { id: 'mistake', label: 'Mistake' },
  { id: 'insight', label: 'Important insight' },
  { id: 'interview-feedback', label: 'Interview feedback' },
  { id: 'revision-reminder', label: 'Revision reminder' },
];

export interface Note {
  id: string;
  problemId?: string;
  conceptId?: string;
  attemptId?: string;
  category: NoteCategory;
  title: string;
  body: string;
  createdAt: number;
  updatedAt: number;
  reminderAt?: number;
}

export type ConceptStatus = 'untested' | 'understood' | 'needs-revision';
export interface ConceptState {
  conceptId: string;
  status: ConceptStatus;
  updatedAt: number;
}

export interface McqAnswer {
  id: string;
  problemId: string;
  mcqId: string;
  selectedOptionId: string;
  correct: boolean;
  at: number;
}

export interface FollowUpAnswer {
  id: string; // `${problemId}:${followUpId}`
  problemId: string;
  followUpId: string;
  answer: string;
  selfRating?: 'missed' | 'partial' | 'solid';
  revealed: boolean;
  updatedAt: number;
}

export interface KV {
  key: string;
  value: unknown;
}
