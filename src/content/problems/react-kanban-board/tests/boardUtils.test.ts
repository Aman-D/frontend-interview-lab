import { findCard, moveCard } from '../boardUtils';
import { deepFreeze, makeBoard } from './helpers';

const ids = (board: ReturnType<typeof makeBoard>, columnId: string) => board.columns.find((c) => c.id === columnId)!.cardIds;

describe('boardUtils — public', () => {
  it('findCard returns the column and index, or null', () => {
    const board = makeBoard();
    expect(findCard(board, 'c')).toEqual({ columnId: 'todo', index: 2 });
    expect(findCard(board, 'e')).toEqual({ columnId: 'done', index: 0 });
    expect(findCard(board, 'zzz')).toBeNull();
  });

  it('moveCard moves a card to another column at the given index without mutating the input', () => {
    const board = deepFreeze(makeBoard());
    const snapshot = JSON.stringify(board);
    const next = moveCard(board, 'b', 'doing', 0);
    expect(ids(next, 'todo')).toEqual(['a', 'c']);
    expect(ids(next, 'doing')).toEqual(['b', 'd']);
    expect(ids(next, 'done')).toEqual(['e']);
    expect(JSON.stringify(board)).toBe(snapshot);
  });

  it('moveCard within one column treats toIndex as the FINAL index (moving down and up)', () => {
    const board = deepFreeze(makeBoard());
    expect(ids(moveCard(board, 'a', 'todo', 2), 'todo')).toEqual(['b', 'c', 'a']);
    expect(ids(moveCard(board, 'a', 'todo', 1), 'todo')).toEqual(['b', 'a', 'c']);
    expect(ids(moveCard(board, 'c', 'todo', 0), 'todo')).toEqual(['c', 'a', 'b']);
  });

  it('moveCard clamps the index: Infinity means last, negative means first, empty columns work', () => {
    const board = deepFreeze(makeBoard());
    expect(ids(moveCard(board, 'a', 'done', Infinity), 'done')).toEqual(['e', 'a']);
    expect(ids(moveCard(board, 'e', 'todo', -3), 'todo')).toEqual(['e', 'a', 'b', 'c']);
    expect(ids(moveCard(board, 'a', 'todo', 99), 'todo')).toEqual(['b', 'c', 'a']);
    const emptied = moveCard(board, 'e', 'todo', 0);
    expect(ids(emptied, 'done')).toEqual([]);
    expect(ids(moveCard(emptied, 'b', 'done', 5), 'done')).toEqual(['b']);
  });

  it('moveCard shares untouched parts and returns the same board for no-ops', () => {
    const board = deepFreeze(makeBoard());
    const next = moveCard(board, 'a', 'doing', 1);
    expect(next).not.toBe(board);
    expect(next.cards).toBe(board.cards); // moving never changes card data
    expect(next.columns[2]).toBe(board.columns[2]); // "Done" is untouched
    expect(next.columns[0]).not.toBe(board.columns[0]);
    expect(moveCard(board, 'b', 'todo', 1)).toBe(board); // already there
    expect(moveCard(board, 'nope', 'todo', 0)).toBe(board);
    expect(moveCard(board, 'a', 'nope', 0)).toBe(board);
  });
});
