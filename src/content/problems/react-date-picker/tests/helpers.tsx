/** The day cell for an ISO date in the open calendar. Throws if it is not rendered. */
export function cell(iso: string): HTMLElement {
  const el = document.querySelector<HTMLElement>(`[role="grid"] [data-date="${iso}"]`);
  if (!el) throw new Error(`No day cell with data-date="${iso}" is rendered`);
  return el;
}

/** ISO dates of all day cells currently rendered, in DOM order. */
export const renderedDates = () => Array.from(document.querySelectorAll('[role="grid"] [data-date]')).map((el) => el.getAttribute('data-date'));

export const input = (name = 'Start date') => screen.getByRole('textbox', { name });

export const calendarButton = () => screen.getByRole('button', { name: /^(choose|change) date/i });

export function openCalendar() {
  const button = calendarButton();
  button.focus();
  fireEvent.click(button);
}

export const dialog = () => screen.getByRole('dialog');

/** The grid's accessible name (the month/year heading). */
export const gridName = () => {
  const grid = screen.getByRole('grid');
  const id = grid.getAttribute('aria-labelledby');
  return ((id && document.getElementById(id)?.textContent) || grid.getAttribute('aria-label') || '').trim();
};

/** keydown on the focused element; returns false when the handler called preventDefault(). */
export function press(key: string, init: Record<string, unknown> = {}) {
  return fireEvent.keyDown(document.activeElement as Element, { key, ...init });
}

export const focusedDate = () => (document.activeElement as HTMLElement | null)?.getAttribute('data-date') ?? null;

/** Types into the input and leaves it (commit on blur). */
export function typeDate(value: string, name = 'Start date') {
  const el = input(name);
  el.focus();
  fireEvent.change(el, { target: { value } });
  fireEvent.blur(el);
}

/** Every ISO date of a month, for comparisons. */
export function isoMonth(year: number, month: number, days: number) {
  return Array.from({ length: days }, (_, i) => `${year}-${String(month).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`);
}
