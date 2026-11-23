import type { Range, RangeInput, ScrollAlign } from './types';

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/**
 * Which rows must be rendered for the given scroll position?
 * Returns the half-open range [start, end) of the visible rows plus `overscan` rows on each side,
 * clamped to [0, count]. Must handle partial rows, the very bottom, count 0 and out-of-range scrollTop.
 */
export function getVisibleRange({ scrollTop, viewportHeight, itemHeight, count, overscan }: RangeInput): Range {
  if (count <= 0 || itemHeight <= 0) return { start: 0, end: 0 };
  const viewport = Math.max(0, viewportHeight);
  // Rubber-band overscroll can report negative values; a list that just shrank can report a stale,
  // too-large value. Clamp to the scrollable range first.
  const maxScrollTop = Math.max(0, count * itemHeight - viewport);
  const top = clamp(scrollTop, 0, maxScrollTop);
  const extra = Math.max(0, Math.floor(overscan));

  const firstVisible = Math.floor(top / itemHeight); // row containing the top edge
  const endVisible = Math.ceil((top + viewport) / itemHeight); // exclusive: first row entirely below

  return {
    start: clamp(firstVisible - extra, 0, count),
    end: clamp(endVisible + extra, 0, count),
  };
}

/**
 * The scrollTop that shows item `index` with the given alignment, clamped to [0, maxScrollTop].
 * 'auto' returns `scrollTop` unchanged when the item is already fully visible.
 */
export function getScrollTopForIndex({
  index,
  align,
  itemHeight,
  viewportHeight,
  count,
  scrollTop,
}: {
  index: number;
  align: ScrollAlign;
  itemHeight: number;
  viewportHeight: number;
  count: number;
  scrollTop: number;
}): number {
  if (count <= 0) return 0;
  const i = clamp(Math.trunc(index), 0, count - 1);
  const maxScrollTop = Math.max(0, count * itemHeight - viewportHeight);
  const itemTop = i * itemHeight;
  const itemBottom = itemTop + itemHeight;
  let target: number;
  switch (align) {
    case 'start':
      target = itemTop;
      break;
    case 'end':
      target = itemBottom - viewportHeight;
      break;
    case 'center':
      target = itemTop - (viewportHeight - itemHeight) / 2;
      break;
    default: // 'auto': minimal movement
      if (itemTop < scrollTop) target = itemTop;
      else if (itemBottom > scrollTop + viewportHeight) target = itemBottom - viewportHeight;
      else target = scrollTop;
  }
  return clamp(target, 0, maxScrollTop);
}
