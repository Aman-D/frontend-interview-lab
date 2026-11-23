import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import { QUESTIONS } from '@/content';
import { db } from '@/db/db';
import type { Attempt, ProblemProgress } from '@/db/types';
import { deriveStatus, groupBy, type QuestionStatus } from '@/lib/progress';
import type { QuestionRow } from '@/lib/filters';

const EMPTY: never[] = [];

export function useAllAttempts(): Attempt[] | undefined {
  return useLiveQuery(() => db.attempts.toArray(), []);
}

export function useAttempts(problemId: string): Attempt[] | undefined {
  return useLiveQuery(() => db.attempts.where('problemId').equals(problemId).sortBy('startedAt'), [problemId]);
}

export function useAllProgress(): ProblemProgress[] | undefined {
  return useLiveQuery(() => db.progress.toArray(), []);
}

export function useProgress(problemId: string) {
  return useLiveQuery(() => db.progress.get(problemId), [problemId]);
}

export function useConceptStates() {
  return useLiveQuery(() => db.concepts.toArray(), []);
}

/** Library rows with status derived from recorded activity only. */
export function useQuestionRows(): { rows: QuestionRow[]; loading: boolean; statusOf: (id: string) => QuestionStatus } {
  const attempts = useAllAttempts();
  const progress = useAllProgress();
  return useMemo(() => {
    const byProblem = groupBy(attempts ?? EMPTY, (a) => a.problemId);
    const pMap = new Map((progress ?? EMPTY).map((p) => [p.problemId, p]));
    const statusOf = (id: string) => deriveStatus(byProblem.get(id) ?? [], pMap.get(id));
    const rows = QUESTIONS.map((q) => {
      const as = byProblem.get(q.id) ?? [];
      return { question: q, status: statusOf(q.id), lastAttemptAt: as.length ? Math.max(...as.map((a) => a.endedAt ?? a.startedAt)) : undefined };
    });
    return { rows, loading: attempts === undefined || progress === undefined, statusOf };
  }, [attempts, progress]);
}
