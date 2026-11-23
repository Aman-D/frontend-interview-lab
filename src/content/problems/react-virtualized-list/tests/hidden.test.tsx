import { getScrollTopForIndex, getVisibleRange } from '../virtual';
import { HEIGHT, ROW, activeOption, makeRows, offsetInViewport, optionTexts, renderList, scrollTo } from './helpers';

const base = { viewportHeight: 400, itemHeight: 40, count: 100, overscan: 0 };

describe('getVisibleRange — hidden', () => {
  it('overscan is clamped at both ends and overscan 0 renders exactly the visible rows', () => {
    expect(getVisibleRange({ ...base, scrollTop: 40, overscan: 5 })).toEqual({ start: 0, end: 16 });
    expect(getVisibleRange({ ...base, scrollTop: 3560, overscan: 5 })).toEqual({ start: 84, end: 100 });
    expect(getVisibleRange({ ...base, scrollTop: 1210 })).toEqual({ start: 30, end: 41 });
  });

  it('clamps negative (overscroll) and too-large (stale after shrinking) scrollTop values', () => {
    expect(getVisibleRange({ ...base, scrollTop: -120, overscan: 2 })).toEqual({ start: 0, end: 12 });
    expect(getVisibleRange({ ...base, count: 20, scrollTop: 50000 })).toEqual({ start: 10, end: 20 });
  });

  it('handles content shorter than the viewport and rows that do not divide it evenly', () => {
    expect(getVisibleRange({ ...base, count: 4, scrollTop: 0, overscan: 3 })).toEqual({ start: 0, end: 4 });
    expect(getVisibleRange({ viewportHeight: 100, itemHeight: 30, count: 50, overscan: 0, scrollTop: 0 })).toEqual({ start: 0, end: 4 });
    expect(getVisibleRange({ viewportHeight: 100, itemHeight: 30, count: 50, overscan: 1, scrollTop: 25 })).toEqual({ start: 0, end: 6 });
  });
});

describe('getScrollTopForIndex — hidden', () => {
  const s = { itemHeight: 40, viewportHeight: 400, count: 100, scrollTop: 0 };
  it('start / center / end alignment, clamped to the scrollable range', () => {
    expect(getScrollTopForIndex({ ...s, index: 50, align: 'start' })).toBe(2000);
    expect(getScrollTopForIndex({ ...s, index: 50, align: 'center' })).toBe(1820);
    expect(getScrollTopForIndex({ ...s, index: 50, align: 'end' })).toBe(1640);
    expect(getScrollTopForIndex({ ...s, index: 99, align: 'start' })).toBe(3600);
    expect(getScrollTopForIndex({ ...s, index: 1, align: 'center' })).toBe(0);
    expect(getScrollTopForIndex({ ...s, index: 500, align: 'start' })).toBe(3600);
    expect(getScrollTopForIndex({ ...s, index: -4, align: 'end' })).toBe(0);
  });

  it("'auto' scrolls as little as possible and not at all when the row is fully visible", () => {
    expect(getScrollTopForIndex({ ...s, scrollTop: 400, index: 12, align: 'auto' })).toBe(400);
    expect(getScrollTopForIndex({ ...s, scrollTop: 400, index: 25, align: 'auto' })).toBe(640);
    expect(getScrollTopForIndex({ ...s, scrollTop: 410, index: 10, align: 'auto' })).toBe(400);
  });
});

describe('VirtualList — hidden', () => {
  it('keys rows by item, not by position: DOM nodes survive scrolling and insertions at the top', () => {
    const { list, rerender } = renderList({ items: makeRows(1000) });
    const node12 = screen.getByText('Item 12');
    scrollTo(list, 400); // window moves from 0..12 to 7..22
    expect(screen.getByText('Item 12')).toBe(node12);

    const node10 = screen.getByText('Item 10');
    const items = [{ id: 'new', label: 'Brand new' }, ...makeRows(1000)];
    rerender({ items });
    expect(screen.getByText('Item 10')).toBe(node10);
  });

  it('arrow keys scroll minimally to keep the active row fully visible, clamp at the ends and prevent default', () => {
    const { list } = renderList({ items: makeRows(50) });
    expect(fireEvent.keyDown(list, { key: 'ArrowUp' })).toBe(false); // handled → defaultPrevented
    expect(activeOption(list)).toHaveTextContent('Item 0');
    expect(fireEvent.keyDown(list, { key: 'ArrowUp' })).toBe(false); // stays at 0
    expect(activeOption(list)).toHaveTextContent('Item 0');
    for (let i = 0; i < 9; i++) fireEvent.keyDown(list, { key: 'ArrowDown' });
    expect(activeOption(list)).toHaveTextContent('Item 9');
    expect(list.scrollTop).toBe(0); // row 9 is still fully visible
    fireEvent.keyDown(list, { key: 'ArrowDown' });
    expect(activeOption(list)).toHaveTextContent('Item 10');
    expect(list.scrollTop).toBe(ROW); // one row, not a full page
    expect(offsetInViewport(list, activeOption(list) as HTMLElement)).toBe(HEIGHT - ROW);

    fireEvent.keyDown(list, { key: 'End' });
    fireEvent.keyDown(list, { key: 'ArrowDown' });
    expect(activeOption(list)).toHaveTextContent('Item 49');
    expect(fireEvent.keyDown(list, { key: 'a' })).toBe(true); // unrelated keys are left alone
  });

  it('the active option stays in the DOM after it is scrolled out of the window', () => {
    const { list } = renderList();
    fireEvent.keyDown(list, { key: 'ArrowDown' });
    const id = list.getAttribute('aria-activedescendant') as string;
    scrollTo(list, 4000);
    const active = document.getElementById(id) as HTMLElement;
    expect(active).toBeInTheDocument();
    expect(active).toHaveTextContent('Item 0');
    expect(active).toHaveAttribute('aria-selected', 'true');
    expect(screen.getAllByRole('option').filter((o: HTMLElement) => o.getAttribute('aria-selected') === 'true')).toHaveLength(1);
    fireEvent.keyDown(list, { key: 'ArrowDown' }); // keyboard brings it back into view
    expect(activeOption(list)).toHaveTextContent('Item 1');
    expect(list.scrollTop).toBe(ROW);
  });

  it('scrollToIndex supports center / end alignment and clamps out-of-range indexes', () => {
    const { list, ref } = renderList();
    act(() => ref.current?.scrollToIndex(500, 'center'));
    expect(list.scrollTop).toBe(500 * ROW - (HEIGHT - ROW) / 2);
    expect(screen.getByText('Item 500')).toBeInTheDocument();
    act(() => ref.current?.scrollToIndex(500, 'end'));
    expect(offsetInViewport(list, screen.getByText('Item 500'))).toBe(HEIGHT - ROW);
    act(() => ref.current?.scrollToIndex(20000));
    expect(list.scrollTop).toBe(10000 * ROW - HEIGHT);
    expect(screen.getByText('Item 9999')).toBeInTheDocument();
    act(() => ref.current?.scrollToIndex(-5));
    expect(list.scrollTop).toBe(0);
    expect(screen.getByText('Item 0')).toBeInTheDocument();
  });

  it('survives the list shrinking while scrolled to the bottom, and an empty list', () => {
    const { list, rerender } = renderList();
    fireEvent.keyDown(list, { key: 'End' });
    scrollTo(list, 10000 * ROW - HEIGHT);
    rerender({ items: makeRows(30) });
    expect(list.scrollHeight).toBe(30 * ROW);
    const texts = optionTexts();
    expect(texts).toContain('Item 29');
    expect(texts).toContain('Item 20');
    expect(texts.length).toBeLessThanOrEqual(13);
    expect(activeOption(list)).toHaveTextContent('Item 29'); // active index clamped

    rerender({ items: [] });
    expect(screen.queryAllByRole('option')).toHaveLength(0);
    expect(list.hasAttribute('aria-activedescendant')).toBe(false);
    fireEvent.keyDown(list, { key: 'ArrowDown' });
    expect(screen.queryAllByRole('option')).toHaveLength(0);
  });

  it('respects overscan, height and itemHeight props', () => {
    renderList({ overscan: 0, height: 200, itemHeight: 50, label: 'Small' });
    const list = screen.getByRole('listbox', { name: 'Small' });
    expect(optionTexts()).toEqual(['Item 0', 'Item 1', 'Item 2', 'Item 3']);
    scrollTo(list, 1000); // rows 20..23
    expect(optionTexts()).toEqual(['Item 20', 'Item 21', 'Item 22', 'Item 23']);
    expect(list.scrollHeight).toBe(10000 * 50);
  });

  it('options expose unique ids, posinset/setsize and a single selected option', () => {
    const { list } = renderList({ items: makeRows(200) });
    scrollTo(list, 2000);
    const options = screen.getAllByRole('option') as HTMLElement[];
    const ids = options.map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every(Boolean)).toBe(true);
    const first = options.find((o) => o.textContent === 'Item 47') as HTMLElement;
    expect(first).toHaveAttribute('aria-posinset', '48');
    expect(first).toHaveAttribute('aria-setsize', '200');
    fireEvent.click(first);
    expect(list.getAttribute('aria-activedescendant')).toBe(first.id);
    const selected = options.filter((o) => o.getAttribute('aria-selected') === 'true');
    expect(selected).toHaveLength(1);
    expect(selected[0]).toBe(first);
  });
});
