import type { Board, Card, CardLocation } from './types';

/** The column and index of `cardId`, or null when no column contains it. */
export function findCard(board: Board, cardId: string): CardLocation | null {
  // TODO
  return null;
}

/**
 * Moves `cardId` so that it ends up at `toIndex` in column `toColumnId`.
 *
 * `toIndex` is the card's FINAL index in the target column (an index into the target list with the
 * card already removed). Clamp it to the valid range, so `Infinity` means "last" and negative means "first".
 *
 * Must be pure: never mutate `board`. Columns that do not change and the `cards` record keep their
 * identity, and a no-op (unknown card or column, same position) returns `board` itself.
 */
export function moveCard(board: Board, cardId: string, toColumnId: string, toIndex: number): Board {
  // TODO
  return board;
}

/**
 * Adds `card` to column `columnId` at `index` (default: the end), without mutating `board`.
 * Returns `board` unchanged if the column does not exist or the id is already used.
 */
export function addCard(board: Board, columnId: string, card: Card, index = Infinity): Board {
  // TODO
  return board;
}

/** Removes the card from `cards` and from its column, without mutating `board`. Unknown id → `board`. */
export function removeCard(board: Board, cardId: string): Board {
  // TODO
  return board;
}

/**
 * OPTIONAL (WIP limits): whether `cardId` may be placed in column `columnId` (`null` = a new card).
 * Moving within the column it is already in is always allowed.
 */
export function canAccept(board: Board, columnId: string, cardId: string | null): boolean {
  return true;
}
