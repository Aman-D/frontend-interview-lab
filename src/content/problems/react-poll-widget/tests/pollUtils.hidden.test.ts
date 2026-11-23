import { applyVote, toPercentages } from '../pollUtils';
import { deepFreeze, makePoll } from './helpers';

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

describe('pollUtils — hidden', () => {
  it('distributes several leftover points to the largest remainders, ties by index', () => {
    // 100 / 7 = 14.28… each: seven floors of 14 leave 2 points for the first two options.
    expect(toPercentages([1, 1, 1, 1, 1, 1, 1])).toEqual([15, 15, 14, 14, 14, 14, 14]);
    // Remainders 0.33…, 0.66…, 0: the one leftover point goes to the middle option, not the first.
    expect(toPercentages([1, 2, 0])).toEqual([33, 67, 0]);
    // Remainders 2/6, 4/6, 4/6, 2/6: a larger remainder beats a lower index.
    expect(toPercentages([2, 1, 1, 2])).toEqual([33, 17, 17, 33]);
  });

  it('handles a single option, a sole winner and very lopsided counts', () => {
    expect(toPercentages([5])).toEqual([100]);
    expect(toPercentages([0, 3])).toEqual([0, 100]);
    expect(toPercentages([999999, 1])).toEqual([100, 0]);
    expect(toPercentages([1, 199])).toEqual([1, 99]);
  });

  it('always sums to 100 and stays within one point of the exact share', () => {
    let seed = 42;
    const rand = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
    for (let run = 0; run < 200; run++) {
      const counts = Array.from({ length: 1 + Math.floor(rand() * 8) }, () => Math.floor(rand() * 50));
      const total = sum(counts);
      const result = toPercentages(counts);
      expect(result).toHaveLength(counts.length);
      expect(sum(result)).toBe(total === 0 ? 0 : 100);
      counts.forEach((c, i) => {
        const exact = total === 0 ? 0 : (c * 100) / total;
        expect(Number.isInteger(result[i])).toBe(true);
        expect(Math.abs(result[i] - exact)).toBeLessThan(1);
      });
    }
  });

  it('does not mutate its input', () => {
    const counts = Object.freeze([3, 1, 1]) as readonly number[];
    expect(toPercentages(counts)).toEqual([60, 20, 20]);
    expect([...counts]).toEqual([3, 1, 1]);
  });

  it('applyVote keeps unchanged options by identity and ignores unknown options / repeat votes', () => {
    const poll = deepFreeze(makePoll([1, 1, 1]));
    const next = applyVote(poll, 'birds');
    expect(next).not.toBe(poll);
    expect(next.options).not.toBe(poll.options);
    expect(next.options[0]).toBe(poll.options[0]);
    expect(next.options[1]).toBe(poll.options[1]);
    expect(next.options[2]).not.toBe(poll.options[2]);
    expect(applyVote(poll, 'fish')).toBe(poll);
    const voted = deepFreeze(makePoll([1, 1, 1], 'cats'));
    expect(applyVote(voted, 'dogs')).toBe(voted);
  });
});
