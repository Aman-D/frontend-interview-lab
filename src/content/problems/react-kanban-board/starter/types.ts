// Normalised board state: cards are stored once by id; columns only hold ordered id lists.
export interface Card {
  id: string;
  title: string;
}

export interface Column {
  id: string;
  title: string;
  /** Card ids in display order (top to bottom). */
  cardIds: string[];
  /** Optional work-in-progress limit: the column may hold at most this many cards. */
  limit?: number;
}

export interface Board {
  cards: Record<string, Card>;
  columns: Column[];
}

/** Where a card is: its column and its 0-based index inside that column. */
export interface CardLocation {
  columnId: string;
  index: number;
}
