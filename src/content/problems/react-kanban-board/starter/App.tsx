import { useState } from 'react';
import KanbanBoard from './KanbanBoard';
import { initialBoard } from './data';
import type { Board } from './types';
import './styles.css';

export default function App() {
  const [changes, setChanges] = useState(0);
  const [last, setLast] = useState<Board | null>(null);
  return (
    <main className="app">
      <h1>Sprint board</h1>
      <p className="hint">
        Drag a card with the mouse or a finger, or focus a card and press Space, move it with the arrow keys, then press Space to drop
        (Escape cancels). The "Move" button offers the same moves without dragging.
      </p>
      <KanbanBoard
        label="Sprint board"
        initialBoard={initialBoard}
        onChange={(board) => {
          setChanges((n) => n + 1);
          setLast(board);
        }}
      />
      <p className="hint">
        Committed changes: {changes}
        {last ? ` · columns: ${last.columns.map((c) => `${c.title} (${c.cardIds.length})`).join(', ')}` : ''}
      </p>
    </main>
  );
}
