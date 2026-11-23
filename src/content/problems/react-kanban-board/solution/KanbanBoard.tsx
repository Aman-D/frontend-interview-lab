import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { addCard, canAccept, findCard, moveCard, removeCard } from './boardUtils';
import type { Board } from './types';

export interface KanbanBoardProps {
  /** Seeds the board's internal state (uncontrolled). */
  initialBoard: Board;
  /** Called with the new board after every committed change: drop, add, delete, menu move. */
  onChange?: (board: Board) => void;
  /** Accessible name of the whole board. */
  label?: string;
}

/** An in-progress move. `preview` is the board as it will look if the move is dropped right now. */
interface Drag {
  cardId: string;
  mode: 'keyboard' | 'pointer';
  preview: Board;
}

interface PointerSession {
  cardId: string;
  pointerId: number;
  startX: number;
  startY: number;
}

type FocusTarget = { kind: 'card'; id: string } | { kind: 'input'; columnId: string } | { kind: 'menu-button'; id: string };

const DRAG_THRESHOLD_PX = 5;

function position(board: Board, cardId: string): string {
  const loc = findCard(board, cardId);
  if (!loc) return '';
  const column = board.columns.find((c) => c.id === loc.columnId)!;
  return `position ${loc.index + 1} of ${column.cardIds.length} in ${column.title}`;
}

export default function KanbanBoard({ initialBoard, onChange, label = 'Kanban board' }: KanbanBoardProps) {
  const [board, setBoard] = useState(initialBoard);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [pointer, setPointer] = useState<PointerSession | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');

  const uid = useId();
  const instructionsId = `${uid}-instructions`;
  const rootRef = useRef<HTMLDivElement>(null);
  const handleRefs = useRef(new Map<string, HTMLElement>());
  const inputRefs = useRef(new Map<string, HTMLInputElement>());
  const menuButtonRefs = useRef(new Map<string, HTMLButtonElement>());
  const pendingFocus = useRef<FocusTarget | null>(null);
  const nextId = useRef(1);

  // Latest values for the window-level pointer listeners (they are registered once per drag).
  const latest = useRef({ board, drag, onChange });
  useLayoutEffect(() => {
    latest.current = { board, drag, onChange };
  });

  // What is on screen: the preview while something is being moved, otherwise the committed board.
  const shown = drag?.preview ?? board;

  // Moving a card into another <ul> remounts its <li> (keys are only compared among siblings),
  // so focus has to be put back explicitly after the DOM has been updated.
  useLayoutEffect(() => {
    const target = pendingFocus.current;
    if (!target) return;
    pendingFocus.current = null;
    const el =
      target.kind === 'card' ? handleRefs.current.get(target.id) : target.kind === 'input' ? inputRefs.current.get(target.columnId) : menuButtonRefs.current.get(target.id);
    el?.focus();
  });

  function commit(next: Board) {
    if (next === board) return;
    setBoard(next);
    onChange?.(next);
  }

  const titleOf = (b: Board, id: string) => b.cards[id]?.title ?? '';

  /* ---------------- keyboard move ---------------- */

  function pickUp(cardId: string) {
    setMenuFor(null);
    setDrag({ cardId, mode: 'keyboard', preview: board });
    setMessage(`Picked up ${titleOf(board, cardId)}. ${capitalise(position(board, cardId))}. Use the arrow keys to move, Space to drop, Escape to cancel.`);
  }

  function drop(d: Drag) {
    setDrag(null);
    const before = findCard(board, d.cardId);
    const after = findCard(d.preview, d.cardId);
    // Only one card moves, so "same location" means "same board": don't report a change.
    if (before && after && (before.columnId !== after.columnId || before.index !== after.index)) commit(d.preview);
    pendingFocus.current = { kind: 'card', id: d.cardId };
    setMessage(`Dropped ${titleOf(d.preview, d.cardId)} at ${position(d.preview, d.cardId)}.`);
  }

  function cancel(d: Drag) {
    setDrag(null);
    pendingFocus.current = { kind: 'card', id: d.cardId };
    setMessage(`Move cancelled. ${titleOf(board, d.cardId)} returned to ${position(board, d.cardId)}.`);
  }

  function step(d: Drag, key: string) {
    const loc = findCard(d.preview, d.cardId);
    if (!loc) return;
    const columnIndex = d.preview.columns.findIndex((c) => c.id === loc.columnId);
    let next = d.preview;
    if (key === 'ArrowUp') next = moveCard(d.preview, d.cardId, loc.columnId, loc.index - 1);
    else if (key === 'ArrowDown') next = moveCard(d.preview, d.cardId, loc.columnId, loc.index + 1);
    else {
      const target = d.preview.columns[columnIndex + (key === 'ArrowRight' ? 1 : -1)];
      if (!target) return; // already in the first / last column
      if (!canAccept(d.preview, target.id, d.cardId)) {
        setMessage(`${target.title} is full (limit ${target.limit}).`);
        return;
      }
      next = moveCard(d.preview, d.cardId, target.id, loc.index); // keep the row, clamped to the target length
    }
    if (next === d.preview) return; // at an edge: nothing changes, nothing to announce
    setDrag({ ...d, preview: next });
    pendingFocus.current = { kind: 'card', id: d.cardId };
    setMessage(`${titleOf(next, d.cardId)}: ${position(next, d.cardId)}.`);
  }

  function onHandleKeyDown(e: KeyboardEvent<HTMLElement>, cardId: string) {
    const key = e.key;
    if (!drag) {
      if (key === ' ' || key === 'Enter') {
        e.preventDefault();
        pickUp(cardId);
      }
      return;
    }
    if (drag.cardId !== cardId || drag.mode !== 'keyboard') return;
    if (key === ' ' || key === 'Enter') {
      e.preventDefault();
      drop(drag);
    } else if (key === 'Escape') {
      e.preventDefault();
      cancel(drag);
    } else if (key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight') {
      e.preventDefault(); // don't scroll the page
      step(drag, key);
    } else if (key === 'Tab') {
      cancel(drag); // leaving the card abandons the move; Tab itself still moves focus
      pendingFocus.current = null;
    }
  }

  /* ---------------- pointer drag ---------------- */

  function onHandlePointerDown(e: ReactPointerEvent<HTMLElement>, cardId: string) {
    if (e.button !== 0 || drag || pointer) return;
    setMenuFor(null);
    setPointer({ cardId, pointerId: e.pointerId, startX: e.clientX, startY: e.clientY });
  }

  /** The column and final index under the pointer, from the real layout. */
  function dropTargetAt(x: number, y: number, cardId: string) {
    const hit = document.elementFromPoint(x, y);
    const columnEl = hit?.closest<HTMLElement>('[data-column-id]');
    if (!columnEl || !rootRef.current?.contains(columnEl)) return null;
    const items = Array.from(columnEl.querySelectorAll<HTMLElement>('[data-card-id]')).filter((el) => el.dataset.cardId !== cardId);
    let index = 0;
    for (const item of items) {
      const r = item.getBoundingClientRect();
      if (y > r.top + r.height / 2) index++;
    }
    return { columnId: columnEl.dataset.columnId!, index };
  }

  // Listeners live on window, not on the card: the card's element is replaced when it moves into
  // another column, which would drop pointer capture and any element-level listeners mid-drag.
  useEffect(() => {
    if (!pointer) return;
    let active = false;
    const { cardId } = pointer;

    function onMove(ev: PointerEvent) {
      if (ev.pointerId !== pointer!.pointerId) return;
      if (!active) {
        if (Math.hypot(ev.clientX - pointer!.startX, ev.clientY - pointer!.startY) < DRAG_THRESHOLD_PX) return;
        active = true;
        const b = latest.current.board;
        setDrag({ cardId, mode: 'pointer', preview: b });
        setMessage(`Picked up ${titleOf(b, cardId)}.`);
      }
      ev.preventDefault();
      const target = dropTargetAt(ev.clientX, ev.clientY, cardId);
      if (!target) return;
      setDrag((d) => {
        if (!d || !canAccept(d.preview, target.columnId, cardId)) return d;
        const next = moveCard(d.preview, cardId, target.columnId, target.index);
        return next === d.preview ? d : { ...d, preview: next };
      });
    }
    function end(commitMove: boolean) {
      const d = latest.current.drag;
      if (active && d) {
        setDrag(null);
        const before = findCard(latest.current.board, cardId);
        const after = findCard(d.preview, cardId);
        if (commitMove && before && after && (before.columnId !== after.columnId || before.index !== after.index)) {
          setBoard(d.preview);
          latest.current.onChange?.(d.preview);
          setMessage(`Dropped ${titleOf(d.preview, cardId)} at ${position(d.preview, cardId)}.`);
        } else {
          setMessage(commitMove ? `Dropped ${titleOf(d.preview, cardId)}. Position unchanged.` : 'Move cancelled.');
        }
      }
      pendingFocus.current = { kind: 'card', id: cardId }; // the <li> may have been remounted
      setPointer(null);
    }
    const onUp = (ev: PointerEvent) => ev.pointerId === pointer.pointerId && end(true);
    const onCancel = (ev: PointerEvent) => ev.pointerId === pointer.pointerId && end(false);
    const onKey = (ev: globalThis.KeyboardEvent) => ev.key === 'Escape' && end(false);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one listener set per pointer session
  }, [pointer]);

  /* ---------------- non-drag path: Move menu ---------------- */

  function moveFromMenu(cardId: string, toColumnId: string, toIndex: number) {
    const next = moveCard(board, cardId, toColumnId, toIndex);
    setMenuFor(null);
    pendingFocus.current = { kind: 'card', id: cardId };
    if (next === board) return;
    commit(next);
    setMessage(`Moved ${titleOf(next, cardId)} to ${position(next, cardId)}.`);
  }

  /* ---------------- add / delete ---------------- */

  // Not a <form>: the sandboxed preview blocks form submission, so Enter and the button call this directly.
  function onAdd(columnId: string) {
    const title = (drafts[columnId] ?? '').trim();
    if (!title || !canAccept(board, columnId, null)) return;
    setDrag(null); // never let a stale preview overwrite the new card on drop
    let id: string;
    do id = `card-${nextId.current++}`;
    while (Object.prototype.hasOwnProperty.call(board.cards, id));
    commit(addCard(board, columnId, { id, title }));
    setDrafts((d) => ({ ...d, [columnId]: '' }));
    const column = board.columns.find((c) => c.id === columnId)!;
    setMessage(`Added ${title} to ${column.title}.`);
  }

  function onDelete(cardId: string) {
    const loc = findCard(board, cardId);
    if (!loc) return;
    const column = board.columns.find((c) => c.id === loc.columnId)!;
    const title = titleOf(board, cardId);
    setDrag(null);
    setMenuFor(null);
    commit(removeCard(board, cardId));
    // Focus the card that takes its place, else the one above, else the column's input.
    const neighbour = column.cardIds[loc.index + 1] ?? column.cardIds[loc.index - 1];
    pendingFocus.current = neighbour ? { kind: 'card', id: neighbour } : { kind: 'input', columnId: column.id };
    setMessage(`Deleted ${title}.`);
  }

  /* ---------------- render ---------------- */

  return (
    <div className="kanban" ref={rootRef} role="group" aria-label={label}>
      <p id={instructionsId} hidden>
        Press Space or Enter to pick up a card. While moving, use the arrow keys to change its position, Space or Enter to drop, and Escape to cancel.
      </p>
      {shown.columns.map((column, columnIndex) => {
        const headingId = `${uid}-col-${column.id}`;
        const full = column.limit !== undefined && column.cardIds.length >= column.limit;
        return (
          <section key={column.id} className="kanban__column" aria-labelledby={headingId} data-column-id={column.id} data-full={full}>
            <div className="kanban__header">
              <h2 id={headingId}>{column.title}</h2>
              <span className="kanban__count" data-testid="column-count" aria-label={column.limit === undefined ? `${column.cardIds.length} cards` : `${column.cardIds.length} of ${column.limit} cards`}>
                {column.limit === undefined ? column.cardIds.length : `${column.cardIds.length} / ${column.limit}`}
              </span>
            </div>
            <ul className="kanban__list">
              {column.cardIds.map((cardId, index) => {
                const card = shown.cards[cardId];
                const grabbed = drag?.cardId === cardId;
                const menuOpen = menuFor === cardId;
                const menuId = `${uid}-menu-${cardId}`;
                return (
                  <li key={cardId} className="kanban__card" data-card-id={cardId} data-dragging={grabbed}>
                    <div
                      role="button"
                      tabIndex={0}
                      className="kanban__handle"
                      aria-roledescription="draggable card"
                      aria-describedby={instructionsId}
                      aria-pressed={grabbed}
                      ref={(el) => {
                        if (el) handleRefs.current.set(cardId, el);
                        else handleRefs.current.delete(cardId);
                      }}
                      onKeyDown={(e) => onHandleKeyDown(e, cardId)}
                      onPointerDown={(e) => onHandlePointerDown(e, cardId)}
                    >
                      {card.title}
                    </div>
                    <button
                      type="button"
                      aria-label={`Move ${card.title}`}
                      aria-expanded={menuOpen}
                      aria-controls={menuOpen ? menuId : undefined}
                      disabled={drag !== null}
                      ref={(el) => {
                        if (el) menuButtonRefs.current.set(cardId, el);
                        else menuButtonRefs.current.delete(cardId);
                      }}
                      onClick={() => setMenuFor(menuOpen ? null : cardId)}
                    >
                      Move
                    </button>
                    <button type="button" aria-label={`Delete ${card.title}`} onClick={() => onDelete(cardId)}>
                      ×
                    </button>
                    {menuOpen && (
                      <div
                        id={menuId}
                        className="kanban__menu"
                        role="group"
                        aria-label={`Move options for ${card.title}`}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setMenuFor(null);
                            pendingFocus.current = { kind: 'menu-button', id: cardId };
                          }
                        }}
                      >
                        <button type="button" disabled={index === 0} onClick={() => moveFromMenu(cardId, column.id, index - 1)}>
                          Move up
                        </button>
                        <button type="button" disabled={index === column.cardIds.length - 1} onClick={() => moveFromMenu(cardId, column.id, index + 1)}>
                          Move down
                        </button>
                        {shown.columns.map((other, otherIndex) =>
                          otherIndex === columnIndex ? null : (
                            <button key={other.id} type="button" disabled={!canAccept(shown, other.id, cardId)} onClick={() => moveFromMenu(cardId, other.id, Infinity)}>
                              Move to {other.title}
                            </button>
                          ),
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
            <div className="kanban__add">
              <input
                aria-label={`New card in ${column.title}`}
                placeholder="Card title"
                value={drafts[column.id] ?? ''}
                disabled={full}
                ref={(el) => {
                  if (el) inputRefs.current.set(column.id, el);
                  else inputRefs.current.delete(column.id);
                }}
                onChange={(e) => setDrafts((d) => ({ ...d, [column.id]: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onAdd(column.id);
                  }
                }}
              />
              <button type="button" disabled={full} onClick={() => onAdd(column.id)}>
                Add card
              </button>
            </div>
          </section>
        );
      })}
      <div role="status" aria-live="polite" className="visually-hidden">
        {message}
      </div>
    </div>
  );
}

function capitalise(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
