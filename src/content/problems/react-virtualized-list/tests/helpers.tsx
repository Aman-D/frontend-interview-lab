import { createRef } from 'react';
import VirtualList from '../VirtualList';
import type { VirtualListHandle, VirtualListProps } from '../types';

export interface Row {
  id: string;
  label: string;
}

export function makeRows(count: number, prefix = 'Item'): Row[] {
  return Array.from({ length: count }, (_, i) => ({ id: `id-${i}`, label: `${prefix} ${i}` }));
}

export const ROW = 40;
export const HEIGHT = 400;

/** Renders a 400px-high list of 40px rows (10 fit exactly) with overscan 3 unless overridden. */
export function renderList(props: Partial<VirtualListProps<Row>> = {}) {
  const ref = createRef<VirtualListHandle>();
  const all: VirtualListProps<Row> = {
    items: makeRows(10000),
    itemHeight: ROW,
    height: HEIGHT,
    overscan: 3,
    label: 'Rows',
    renderItem: (row) => row.label,
    getKey: (row) => row.id,
    ...props,
  };
  const utils = render(<VirtualList ref={ref} {...all} />);
  const list = screen.getByRole('listbox', { name: all.label }) as HTMLElement;
  const rerender = (next: Partial<VirtualListProps<Row>>) => utils.rerender(<VirtualList ref={ref} {...all} {...next} />);
  return { ...utils, ref, list, rerender };
}

/** Real scrolling: set the container's scrollTop, then dispatch the scroll event React listens to. */
export function scrollTo(list: HTMLElement, top: number) {
  list.scrollTop = top;
  fireEvent.scroll(list);
}

/** Text of every rendered option, in DOM order. */
export function optionTexts(): string[] {
  return screen.queryAllByRole('option').map((o: HTMLElement) => (o.textContent ?? '').trim());
}

/** Rendered options sorted by their on-screen position (the active row may be appended out of order). */
export function optionsByPosition(): HTMLElement[] {
  return (screen.queryAllByRole('option') as HTMLElement[])
    .slice()
    .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
}

/** Distance in px between an option's top edge and the list's top edge (after scrolling). */
export function offsetInViewport(list: HTMLElement, option: HTMLElement) {
  return Math.round(option.getBoundingClientRect().top - list.getBoundingClientRect().top - list.clientTop);
}

export function activeOption(list: HTMLElement): HTMLElement | null {
  const id = list.getAttribute('aria-activedescendant');
  return id ? document.getElementById(id) : null;
}
