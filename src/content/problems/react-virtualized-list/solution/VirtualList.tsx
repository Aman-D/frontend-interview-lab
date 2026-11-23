import { forwardRef, useCallback, useId, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent, ReactElement, Ref } from 'react';
import type { Range, ScrollAlign, VirtualListHandle, VirtualListProps } from './types';
import { getScrollTopForIndex, getVisibleRange } from './virtual';

function VirtualListInner<T>(props: VirtualListProps<T>, ref: Ref<VirtualListHandle>) {
  const { items, itemHeight, height, overscan = 3, renderItem, getKey = (_item: T, index: number) => index, label } = props;
  const count = items.length;
  const listRef = useRef<HTMLDivElement>(null);
  const baseId = useId();
  const optionId = (index: number) => `${baseId}-option-${index}`;

  const [range, setRange] = useState<Range>(() =>
    getVisibleRange({ scrollTop: 0, viewportHeight: height, itemHeight, count, overscan }),
  );
  const [active, setActive] = useState(-1);
  // Derived, not synced: if the list shrinks, the active index is clamped during render.
  const activeIndex = Math.min(active, count - 1);

  /** Reads the real scroll position and viewport size and updates the range only if it changed. */
  const syncRange = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const next = getVisibleRange({ scrollTop: el.scrollTop, viewportHeight: el.clientHeight || height, itemHeight, count, overscan });
    setRange((prev) => (prev.start === next.start && prev.end === next.end ? prev : next));
  }, [height, itemHeight, count, overscan]);

  // Before paint whenever the inputs change (the browser may also have clamped scrollTop after a shrink).
  useLayoutEffect(() => {
    syncRange();
  }, [syncRange]);

  const scrollToIndex = useCallback(
    (index: number, align: ScrollAlign = 'start') => {
      const el = listRef.current;
      if (!el || count === 0) return;
      el.scrollTop = getScrollTopForIndex({
        index,
        align,
        itemHeight,
        viewportHeight: el.clientHeight || height,
        count,
        scrollTop: el.scrollTop,
      });
      // The scroll event arrives asynchronously; render the new window now.
      syncRange();
    },
    [count, height, itemHeight, syncRange],
  );

  useImperativeHandle(ref, () => ({ scrollToIndex }), [scrollToIndex]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (count === 0) return;
    const pageSize = Math.max(1, Math.floor((listRef.current?.clientHeight || height) / itemHeight));
    const from = activeIndex;
    let next: number;
    switch (event.key) {
      case 'ArrowDown':
        next = from < 0 ? 0 : Math.min(count - 1, from + 1);
        break;
      case 'ArrowUp':
        next = from < 0 ? 0 : Math.max(0, from - 1);
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = count - 1;
        break;
      case 'PageDown':
        next = Math.min(count - 1, Math.max(0, from) + pageSize);
        break;
      case 'PageUp':
        next = Math.max(0, from - pageSize);
        break;
      default:
        return;
    }
    event.preventDefault(); // the container must not also scroll natively
    setActive(next);
    scrollToIndex(next, 'auto');
  };

  // Clamp in render too: after `items` shrinks, `range` is stale until the layout effect runs.
  const end = Math.min(range.end, count);
  const start = Math.min(range.start, end);
  const indexes: number[] = [];
  for (let i = start; i < end; i++) indexes.push(i);
  // aria-activedescendant must point at an element that exists, even when it is scrolled away.
  if (activeIndex >= 0 && (activeIndex < start || activeIndex >= end)) indexes.push(activeIndex);

  return (
    <div
      ref={listRef}
      role="listbox"
      aria-label={label}
      tabIndex={0}
      aria-activedescendant={activeIndex >= 0 ? optionId(activeIndex) : undefined}
      className="vlist"
      style={{ height, overflowY: 'auto', position: 'relative' }}
      onScroll={syncRange}
      onKeyDown={onKeyDown}
    >
      <div role="presentation" style={{ height: count * itemHeight, position: 'relative' }}>
        {indexes.map((index) => {
          const item = items[index];
          return (
            <div
              key={getKey(item, index)}
              id={optionId(index)}
              role="option"
              aria-selected={index === activeIndex}
              aria-setsize={count}
              aria-posinset={index + 1}
              className="vlist__row"
              onClick={() => setActive(index)}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, height: itemHeight, transform: `translateY(${index * itemHeight}px)` }}
            >
              {renderItem(item, index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const VirtualList = forwardRef(VirtualListInner) as <T>(
  props: VirtualListProps<T> & { ref?: Ref<VirtualListHandle> },
) => ReactElement | null;

export default VirtualList;
