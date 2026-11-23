import type { Board, Card, CardLocation } from './types';

/** The column and index of `cardId`, or null when no column contains it. O(total cards). */
export function findCard(board: Board, cardId: string): CardLocation | null {
  for (const column of board.columns) {
    const index = column.cardIds.indexOf(cardId);
    if (index !== -1) return { columnId: column.id, index };
  }
  return null;
}

/**
 * Moves `cardId` so that it ends up at `toIndex` in column `toColumnId`.
 *
 * `toIndex` is the card's FINAL index in the target column, i.e. an index into the target list
 * with the card already removed. It is clamped to the valid range, so `Infinity` means "last".
 *
 * Pure and structurally shared: the input is never mutated, untouched columns and the `cards`
 * record keep their identity, and a no-op (unknown card/column, same position) returns `board`.
 */
export function moveCard(board: Board, cardId: string, toColumnId: string, toIndex: number): Board {
  const from = findCard(board, cardId);
  const target = board.columns.find((c) => c.id === toColumnId);
  if (!from || !target) return board;

  const sameColumn = from.columnId === toColumnId;
  // Within the same column the list shrinks by one once the card is taken out.
  const maxIndex = sameColumn ? target.cardIds.length - 1 : target.cardIds.length;
  const wanted = Number.isNaN(toIndex) ? maxIndex : Math.trunc(toIndex);
  const index = Math.max(0, Math.min(wanted, maxIndex));
  if (sameColumn && index === from.index) return board;

  const columns = board.columns.map((column) => {
    const isSource = column.id === from.columnId;
    const isTarget = column.id === toColumnId;
    if (!isSource && !isTarget) return column; // structural sharing
    const cardIds = column.cardIds.slice();
    if (isSource) cardIds.splice(from.index, 1); // remove first...
    if (isTarget) cardIds.splice(index, 0, cardId); // ...then insert at the final index
    return { ...column, cardIds };
  });
  return { ...board, columns };
}

/**
 * Adds `card` to column `columnId` at `index` (default: the end).
 * Returns `board` unchanged if the column does not exist or the id is already used.
 */
export function addCard(board: Board, columnId: string, card: Card, index = Infinity): Board {
  if (Object.prototype.hasOwnProperty.call(board.cards, card.id)) return board;
  const target = board.columns.find((c) => c.id === columnId);
  if (!target) return board;
  const at = Math.max(0, Math.min(Math.trunc(index), target.cardIds.length));
  return {
    cards: { ...board.cards, [card.id]: card },
    columns: board.columns.map((column) => {
      if (column !== target) return column;
      const cardIds = column.cardIds.slice();
      cardIds.splice(at, 0, card.id);
      return { ...column, cardIds };
    }),
  };
}

/** Removes the card from `cards` and from its column. Returns `board` unchanged if it does not exist. */
export function removeCard(board: Board, cardId: string): Board {
  const from = findCard(board, cardId);
  if (!from && !Object.prototype.hasOwnProperty.call(board.cards, cardId)) return board;
  const cards = { ...board.cards };
  delete cards[cardId]; // deleting from our own fresh copy is fine
  return {
    cards,
    columns: board.columns.map((column) => (column.id === from?.columnId ? { ...column, cardIds: column.cardIds.filter((id) => id !== cardId) } : column)),
  };
}

/**
 * (Optional — WIP limits.) Whether `cardId` may be placed in column `columnId`.
 * Moving within the column it is already in is always allowed.
 */
export function canAccept(board: Board, columnId: string, cardId: string | null): boolean {
  const column = board.columns.find((c) => c.id === columnId);
  if (!column) return false;
  if (cardId !== null && column.cardIds.includes(cardId)) return true;
  return column.limit === undefined || column.cardIds.length < column.limit;
}
