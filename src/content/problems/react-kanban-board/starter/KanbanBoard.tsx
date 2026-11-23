import { useState } from 'react';
import type { Board } from './types';

export interface KanbanBoardProps {
  /** Seeds the board's internal state (uncontrolled). */
  initialBoard: Board;
  /** Called with the new board after every committed change: drop, add, delete, menu move. */
  onChange?: (board: Board) => void;
  /** Accessible name of the whole board. */
  label?: string;
}

// TODO: build the board. See the problem statement for the exact contract. In short:
// - each column: <section aria-labelledby> → heading, count (data-testid="column-count"), card list, add input + "Add card" button
// - each card: a focusable handle (role="button", name = card title, aria-pressed while picked up),
//   a "Move <title>" button that opens Move up / Move down / Move to <column> actions, a "Delete <title>" button
// - pointer drag (Pointer Events or HTML DnD — your choice)
// - keyboard: Space/Enter picks up, arrows move, Space/Enter drops, Escape cancels; focus stays on the card
// - one role="status" live region announcing every step
// - use the pure helpers from boardUtils.ts for every change, and call onChange after committed changes
export default function KanbanBoard({ initialBoard, label = 'Kanban board' }: KanbanBoardProps) {
  const [board] = useState(initialBoard);

  // Enter in the input and the "Add card" button should both add a card.
  // (Don't rely on <form> submission: the sandboxed preview blocks it.)
  function onAdd(columnId: string) {
    // TODO
    void columnId;
  }

  return (
    <div className="kanban" role="group" aria-label={label}>
      {board.columns.map((column) => (
        <section key={column.id} className="kanban__column">
          <div className="kanban__header">
            <h2>{column.title}</h2>
          </div>
          <ul className="kanban__list">
            {column.cardIds.map((cardId) => (
              <li key={cardId} className="kanban__card">
                <div className="kanban__handle">{board.cards[cardId].title}</div>
              </li>
            ))}
          </ul>
          <div className="kanban__add">
            <input aria-label={`New card in ${column.title}`} placeholder="Card title" />
            <button type="button" onClick={() => onAdd(column.id)}>
              Add card
            </button>
          </div>
        </section>
      ))}
    </div>
  );
}
