import { HEIGHT, ROW, activeOption, offsetInViewport, optionTexts, renderList, scrollTo } from './helpers';

describe('VirtualList — public', () => {
  it('renders only the visible window plus overscan inside a full-height scroll area', () => {
    const { list } = renderList();
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(13); // 10 visible + 3 overscan below
    expect(optionTexts()[0]).toBe('Item 0');
    expect(optionTexts()[12]).toBe('Item 12');
    expect(list.scrollHeight).toBe(10000 * ROW);
    expect(list.clientHeight).toBe(HEIGHT);
    expect(options[3]).toHaveAttribute('aria-setsize', '10000');
    expect(options[3]).toHaveAttribute('aria-posinset', '4');
  });

  it('recomputes the window on scroll and positions rows at index * itemHeight', () => {
    const { list } = renderList();
    scrollTo(list, 4000); // row 100 at the top edge
    expect(optionTexts()).toEqual(Array.from({ length: 16 }, (_, i) => `Item ${97 + i}`));
    expect(offsetInViewport(list, screen.getByText('Item 100'))).toBe(0);
    expect(offsetInViewport(list, screen.getByText('Item 109'))).toBe(9 * ROW);
    expect(screen.queryByText('Item 0')).toBeNull();
  });

  it('renders the last rows at the very bottom with no blank space', () => {
    const { list } = renderList();
    scrollTo(list, 10000 * ROW - HEIGHT);
    const texts = optionTexts();
    expect(texts).toHaveLength(13);
    expect(texts[texts.length - 1]).toBe('Item 9999');
    expect(offsetInViewport(list, screen.getByText('Item 9999'))).toBe(HEIGHT - ROW);
  });

  it('is a focusable listbox; ArrowDown/End/Home move the active option and keep it rendered', () => {
    const { list } = renderList();
    expect(list).toHaveAttribute('tabindex', '0');
    fireEvent.keyDown(list, { key: 'ArrowDown' });
    let active = activeOption(list) as HTMLElement;
    expect(active).toHaveTextContent('Item 0');
    expect(active).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(list, { key: 'ArrowDown' });
    expect(activeOption(list)).toHaveTextContent('Item 1');

    fireEvent.keyDown(list, { key: 'End' });
    active = activeOption(list) as HTMLElement;
    expect(active).toHaveTextContent('Item 9999');
    expect(list.scrollTop).toBe(10000 * ROW - HEIGHT);

    fireEvent.keyDown(list, { key: 'Home' });
    expect(activeOption(list)).toHaveTextContent('Item 0');
    expect(list.scrollTop).toBe(0);
  });

  it('scrollToIndex(i) through the ref scrolls the row to the top and renders it immediately', () => {
    const { list, ref } = renderList();
    act(() => ref.current?.scrollToIndex(500));
    expect(list.scrollTop).toBe(500 * ROW);
    expect(offsetInViewport(list, screen.getByText('Item 500'))).toBe(0);
  });
});
