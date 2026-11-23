import type { PollData } from './types';

/**
 * Converts vote counts into whole-number percentages that always add up to exactly 100
 * (or are all 0 when nobody has voted), using the largest-remainder (Hamilton) method:
 *
 * 1. give every option the floor of its exact share,
 * 2. hand the points that are still missing to the options with the largest fractional remainders,
 * 3. break remainder ties by option order (lower index first), so the result is deterministic.
 *
 * Integer arithmetic only: `count * 100 / total` is split into quotient and remainder with `Math.floor`
 * and `%`, so there is no floating-point comparison of remainders.
 */
export function toPercentages(counts: readonly number[]): number[] {
  const total = counts.reduce((sum, c) => sum + c, 0);
  if (total === 0) return counts.map(() => 0);

  const parts = counts.map((count, index) => ({
    index,
    floor: Math.floor((count * 100) / total),
    remainder: (count * 100) % total,
  }));
  let missing = 100 - parts.reduce((sum, p) => sum + p.floor, 0);

  const result = parts.map((p) => p.floor);
  // Stable order: larger remainder first, then lower index.
  const byRemainder = [...parts].sort((a, b) => b.remainder - a.remainder || a.index - b.index);
  for (const part of byRemainder) {
    if (missing === 0) break;
    result[part.index] += 1;
    missing -= 1;
  }
  return result;
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
  if (poll.viewerVote !== null) return poll;
  if (!poll.options.some((o) => o.id === optionId)) return poll;
  return {
    ...poll,
    viewerVote: optionId,
    options: poll.options.map((o) => (o.id === optionId ? { ...o, votes: o.votes + 1 } : o)),
  };
}
