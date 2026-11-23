import type { Board } from '../types';

/** Fresh fixture for every test: three columns, five cards. */
export function makeBoard(): Board {
  return {
    cards: {
      a: { id: 'a', title: 'Alpha' },
      b: { id: 'b', title: 'Bravo' },
      c: { id: 'c', title: 'Charlie' },
      d: { id: 'd', title: 'Delta' },
      e: { id: 'e', title: 'Echo' },
    },
    columns: [
      { id: 'todo', title: 'To do', cardIds: ['a', 'b', 'c'] },
      { id: 'doing', title: 'In progress', cardIds: ['d'] },
      { id: 'done', title: 'Done', cardIds: ['e'] },
    ],
  };
}

/** Recursively freezes a value so any mutation throws in strict-mode code. */
export function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const v of Object.values(value as Record<string, unknown>)) deepFreeze(v);
  }
  return value;
}

/** A column is a <section> labelled by its heading, i.e. role "region" named after the column. */
export const column = (name: string) => screen.getByRole('region', { name });

/** A card's focusable drag handle: role="button" whose name is exactly the card title. */
export const handle = (title: string) => screen.getByRole('button', { name: title });

/** Card titles in a column, in DOM order (read from each card's role="button" handle). */
export const titlesIn = (name: string) => Array.from(column(name).querySelectorAll('li [role="button"]')).map((el) => (el.textContent ?? '').trim());

export const countIn = (name: string) => (within(column(name)).getByTestId('column-count').textContent ?? '').trim();

export const status = () => screen.getByRole('status');

/** Dispatches keydown on the element; returns false when the handler called preventDefault(). */
export function press(el: Element, key: string) {
  return fireEvent.keyDown(el, { key });
}

/** Focuses a card's handle and presses Space on it. */
export function pickUp(title: string) {
  const h = handle(title);
  h.focus();
  press(h, ' ');
}

/** Presses a key on whatever element currently has focus. */
export function pressOnFocused(key: string) {
  return press(document.activeElement as Element, key);
}
