import type { PollData } from './types';

/**
 * Converts vote counts into whole-number percentages that always add up to exactly 100
 * (or are all 0 when nobody has voted).
 *
 * Use the largest-remainder method: give every option the floor of its exact share, then hand the
 * points that are still missing to the options with the largest fractional remainders. Break remainder
 * ties by option order (lower index first), so the result is deterministic.
 *
 * Examples: [1, 1, 1] → [34, 33, 33]; [1, 2] → [33, 67]; [0, 0] → [0, 0]; [] → [].
 */
export function toPercentages(counts: readonly number[]): number[] {
  // TODO
  return counts.map(() => 0);
}

/** Total number of votes in a poll (derived, never stored separately). */
export function totalVotes(poll: PollData): number {
  return poll.options.reduce((sum, o) => sum + o.votes, 0);
}

/**
 * The optimistic version of `poll` after the viewer votes for `optionId`: that option gains one vote and
 * `viewerVote` is set. Pure: returns a new object and never mutates `poll`; options that do not change keep
 * their identity. An unknown option id, or a poll the viewer has already voted in, returns `poll` unchanged.
 */
export function applyVote(poll: PollData, optionId: string): PollData {
  // TODO
  void optionId;
  return poll;
}
