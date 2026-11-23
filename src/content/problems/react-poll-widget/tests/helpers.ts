import type { PollData } from '../types';

/** A fresh poll fixture. `votes` gives the counts for cats, dogs, birds (in that order). */
export function makePoll(votes: [number, number, number] = [1, 1, 1], viewerVote: string | null = null): PollData {
  return {
    id: 'pets',
    question: 'Which pet is best?',
    viewerVote,
    options: [
      { id: 'cats', label: 'Cats', votes: votes[0] },
      { id: 'dogs', label: 'Dogs', votes: votes[1] },
      { id: 'birds', label: 'Birds', votes: votes[2] },
    ],
  };
}

/**
 * A controllable fake API: every call returns a promise that the test settles manually,
 * so loading, pending, success and failure can be stepped through deterministically.
 */
export function createFakeApi() {
  const loads: { pollId: string; signal: AbortSignal; resolve: (p: PollData) => void; reject: (e: unknown) => void }[] = [];
  const votes: { pollId: string; optionId: string; resolve: (p: PollData) => void; reject: (e: unknown) => void }[] = [];
  const getPoll = fn((pollId: string, signal: AbortSignal) => {
    const d = deferred<PollData>();
    loads.push({ pollId, signal, resolve: d.resolve, reject: d.reject });
    return d.promise;
  });
  const vote = fn((pollId: string, optionId: string) => {
    const d = deferred<PollData>();
    votes.push({ pollId, optionId, resolve: d.resolve, reject: d.reject });
    return d.promise;
  });
  return { api: { getPoll, vote }, getPoll, vote, loads, votes };
}

/** Text of each row in the results list, whitespace-normalised. */
export function resultRows(): string[] {
  const list = screen.getByRole('list', { name: 'Results' });
  return within(list)
    .getAllByRole('listitem')
    .map((li: HTMLElement) => (li.textContent || '').replace(/\s+/g, ' ').trim());
}

/** The percentage shown in each results row, in option order. */
export function shownPercentages(): number[] {
  return resultRows().map((row) => {
    const m = row.match(/(\d+)%/);
    if (!m) throw new Error(`No percentage in results row "${row}"`);
    return Number(m[1]);
  });
}

/** Recursively freezes a value so any mutation throws in strict-mode code. */
export function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const v of Object.values(value as Record<string, unknown>)) deepFreeze(v);
  }
  return value;
}
