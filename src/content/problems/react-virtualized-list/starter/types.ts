// Public types for the virtualized list. This file is read-only.
import type { Key, ReactNode } from 'react';

export interface RangeInput {
  /** Current vertical scroll offset of the container, in px. */
  scrollTop: number;
  /** Visible height of the container, in px. */
  viewportHeight: number;
  /** Fixed height of every row, in px (> 0). */
  itemHeight: number;
  /** Number of items. */
  count: number;
  /** Extra rows to render above and below the visible ones. */
  overscan: number;
}

/** Half-open range of item indexes to render: start <= i < end. */
export interface Range {
  start: number;
  end: number;
}

/** Where `scrollToIndex` puts the item. 'auto' scrolls as little as possible to make it fully visible. */
export type ScrollAlign = 'start' | 'center' | 'end' | 'auto';

export interface VirtualListHandle {
  scrollToIndex(index: number, align?: ScrollAlign): void;
}

export interface VirtualListProps<T> {
  items: readonly T[];
  /** Fixed row height in px. */
  itemHeight: number;
  /** Height of the scroll container in px. */
  height: number;
  /** Rows rendered beyond each edge of the viewport. Default: 3. */
  overscan?: number;
  /** Content of one row. */
  renderItem: (item: T, index: number) => ReactNode;
  /** Stable key per item. Default: the index (only correct for lists that never reorder). */
  getKey?: (item: T, index: number) => Key;
  /** Accessible name of the listbox. */
  label: string;
}
