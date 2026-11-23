import type { Range, RangeInput, ScrollAlign } from './types';

/**
 * Which rows must be rendered for the given scroll position?
 * Returns the half-open range [start, end) of the visible rows plus `overscan` rows on each side,
 * clamped to [0, count]. Must handle partial rows, the very bottom, count 0 and out-of-range scrollTop.
 */
export function getVisibleRange({ count }: RangeInput): Range {
  // TODO: compute the first and last visible rows from scrollTop / viewportHeight / itemHeight,
  // then add overscan and clamp.
  return { start: 0, end: count };
}

/**
 * The scrollTop that shows item `index` with the given alignment, clamped to [0, maxScrollTop].
 * 'auto' returns `scrollTop` unchanged when the item is already fully visible.
 */
export function getScrollTopForIndex(input: {
  index: number;
  align: ScrollAlign;
  itemHeight: number;
  viewportHeight: number;
  count: number;
  scrollTop: number;
}): number {
  // TODO: support 'start' | 'center' | 'end' | 'auto' and clamp.
  return input.index * input.itemHeight;
}
