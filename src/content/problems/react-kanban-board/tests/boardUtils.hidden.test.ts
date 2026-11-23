import { addCard, findCard, moveCard, removeCard } from '../boardUtils';
import { deepFreeze, makeBoard } from './helpers';

const ids = (board: ReturnType<typeof makeBoard>, columnId: string) => board.columns.find((c) => c.id === columnId)!.cardIds;
const total = (board: ReturnType<typeof makeBoard>) => board.columns.reduce((n, c) => n + c.cardIds.length, 0);

describe('boardUtils — hidden', () => {
  it('moveCard down by exactly one inside a column, and to the last slot', () => {
    const board = deepFreeze(makeBoard());
    expect(ids(moveCard(board, 'b', 'todo', 2), 'todo')).toEqual(['a', 'c', 'b']);
    expect(ids(moveCard(board, 'a', 'todo', 1), 'todo')).toEqual(['b', 'a', 'c']);
    expect(ids(moveCard(board, 'b', 'todo', 0), 'todo')).toEqual(['b', 'a', 'c']);
  });

  it('moveCard never duplicates or loses cards, whatever the sequence of moves', () => {
    let board = deepFreeze(makeBoard());
    const moves: [string, string, number][] = [['a', 'done', 0], ['e', 'doing', 9], ['d', 'todo', 1], ['a', 'done', 0], ['c', 'done', 1], ['b', 'doing', -1]];
    for (const [card, col, at] of moves) {
      board = deepFreeze(moveCard(board, card, col, at));
      expect(total(board)).toBe(5);
      expect(new Set(board.columns.flatMap((c) => c.cardIds)).size).toBe(5);
    }
    expect(findCard(board, 'c')).toEqual({ columnId: 'done', index: 1 });
  });

  it('addCard appends (or inserts at index) without mutating; duplicate ids and unknown columns are no-ops', () => {
    const board = deepFreeze(makeBoard());
    const next = addCard(board, 'doing', { id: 'f', title: 'Foxtrot' });
    expect(ids(next, 'doing')).toEqual(['d', 'f']);
    expect(next.cards.f).toEqual({ id: 'f', title: 'Foxtrot' });
    expect(board.cards.f).toBeUndefined();
    expect(next.columns[0]).toBe(board.columns[0]);
    expect(ids(addCard(board, 'todo', { id: 'g', title: 'Golf' }, 1), 'todo')).toEqual(['a', 'g', 'b', 'c']);
    expect(addCard(board, 'todo', { id: 'a', title: 'Dup' })).toBe(board);
    expect(addCard(board, 'nope', { id: 'h', title: 'Hotel' })).toBe(board);
  });

  it('removeCard deletes the card from the record and its column only', () => {
    const board = deepFreeze(makeBoard());
    const next = removeCard(board, 'b');
    expect(ids(next, 'todo')).toEqual(['a', 'c']);
    expect('b' in next.cards).toBe(false);
    expect(Object.keys(next.cards).sort()).toEqual(['a', 'c', 'd', 'e']);
    expect(next.columns[1]).toBe(board.columns[1]);
    expect(next.columns[2]).toBe(board.columns[2]);
    expect('b' in board.cards).toBe(true);
    expect(removeCard(board, 'zzz')).toBe(board);
  });
});
