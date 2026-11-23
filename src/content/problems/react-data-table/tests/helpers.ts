import type { Column } from '../types';

export interface Person {
  id: number;
  name: string;
  team: string;
  tickets: number;
  city: string | null;
}

// 12 rows → 3 pages of 5. Tickets include 3/9/10/100 (numeric vs string order) and a
// three-way tie at 45 (ids 4, 6, 11) for stability checks. Two cities are null.
export const people: Person[] = [
  { id: 1, name: 'Mira', team: 'Design', tickets: 12, city: 'Lisbon' },
  { id: 2, name: 'arjun', team: 'Engineering', tickets: 100, city: 'Pune' },
  { id: 3, name: 'Zoe', team: 'Engineering', tickets: 9, city: 'Berlin' },
  { id: 4, name: 'Bilal', team: 'Sales', tickets: 45, city: null },
  { id: 5, name: 'Chen', team: 'Support', tickets: 10, city: 'Taipei' },
  { id: 6, name: 'Ines', team: 'Engineering', tickets: 45, city: 'Porto' },
  { id: 7, name: 'Kofi', team: 'Design', tickets: 3, city: 'Accra' },
  { id: 8, name: 'Lena', team: 'Sales', tickets: 27, city: 'Berlin' },
  { id: 9, name: 'Omar', team: 'Support', tickets: 64, city: 'Cairo' },
  { id: 10, name: 'Priya', team: 'Engineering', tickets: 18, city: null },
  { id: 11, name: 'Diego', team: 'Design', tickets: 45, city: 'Bogotá' },
  { id: 12, name: 'Hana', team: 'Sales', tickets: 31, city: 'Osaka' },
];

export const columns: Column<Person>[] = [
  { key: 'id', header: 'ID' },
  { key: 'name', header: 'Name', sortable: true },
  { key: 'team', header: 'Team', sortable: true },
  { key: 'tickets', header: 'Tickets', sortable: true },
  { key: 'city', header: 'City', sortable: true, render: (p) => p.city ?? '—' },
];

/** Data rows (inside <tbody>) of the only table on the page. */
export function bodyRows(): HTMLTableRowElement[] {
  return Array.from(screen.getByRole('table').querySelectorAll('tbody tr'));
}

/** Text of the Name cell (2nd column) of every visible data row. */
export function names(): string[] {
  return bodyRows().map((r) => (r.cells[1]?.textContent ?? '').trim());
}

export function header(name: string): HTMLElement {
  return screen.getByRole('columnheader', { name });
}

export function sortButton(name: string): HTMLElement {
  return within(header(name)).getByRole('button', { name });
}

/** aria-sort of a header, treating a missing attribute as "none". */
export function ariaSort(name: string): string {
  return header(name).getAttribute('aria-sort') ?? 'none';
}

export function filterTo(text: string) {
  fireEvent.change(screen.getByRole('searchbox', { name: 'Filter' }), { target: { value: text } });
}
