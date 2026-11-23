import { applyVote, toPercentages } from '../pollUtils';
import { deepFreeze, makePoll } from './helpers';

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

describe('pollUtils — public', () => {
  it('toPercentages uses largest remainders so the result sums to 100', () => {
    expect(toPercentages([1, 2])).toEqual([33, 67]);
    expect(toPercentages([3, 1])).toEqual([75, 25]);
    expect(toPercentages([12, 9, 4, 0])).toEqual([48, 36, 16, 0]);
    expect(sum(toPercentages([1, 1, 1, 1, 1, 1]))).toBe(100);
  });

  it('toPercentages breaks remainder ties by option order', () => {
    expect(toPercentages([1, 1, 1])).toEqual([34, 33, 33]);
  });

  it('toPercentages returns all zeros when there are no votes, and [] for no options', () => {
    expect(toPercentages([0, 0, 0])).toEqual([0, 0, 0]);
    expect(toPercentages([])).toEqual([]);
  });

  it('applyVote adds one vote and records viewerVote without mutating the poll', () => {
    const poll = deepFreeze(makePoll([2, 0, 5]));
    const next = applyVote(poll, 'dogs');
    expect(next.options.map((o) => o.votes)).toEqual([2, 1, 5]);
    expect(next.viewerVote).toBe('dogs');
    expect(poll.options[1].votes).toBe(0);
    expect(poll.viewerVote).toBeNull();
  });
});
