import { StrictMode } from 'react';
import InfiniteFeed from '../InfiniteFeed';
import { createFakeFeed, installFakeIntersectionObserver, page, postTitles, settle } from './helpers';

const abortError = () => new DOMException('The request was aborted', 'AbortError');

describe('InfiniteFeed — hidden', () => {
  let io: ReturnType<typeof installFakeIntersectionObserver>;
  beforeEach(() => {
    io = installFakeIntersectionObserver();
  });
  afterEach(() => io.restore());

  it('StrictMode: exactly one live request per cursor, and aborted requests never reach the UI', async () => {
    const { fetchPage, calls, live } = createFakeFeed();
    render(
      <StrictMode>
        <InfiniteFeed fetchPage={fetchPage} />
      </StrictMode>,
    );
    expect(live()).toHaveLength(1);
    expect(live()[0].cursor).toBe(null);
    // A discarded request that still resolves (fetch implementations may ignore the signal).
    calls.filter((c) => c.signal.aborted).forEach((c) => c.resolve(page(['stale'], 'stale-cursor')));
    await settle();
    expect(postTitles()).toEqual([]);
    live()[0].resolve(page(['a', 'b'], 'c2'));
    await settle();
    expect(postTitles()).toEqual(['Post a', 'Post b']);

    const before = calls.length;
    io.setIntersecting(true);
    const next = calls.slice(before);
    expect(next.filter((c) => !c.signal.aborted).map((c) => c.cursor)).toEqual(['c2']);
  });

  it('StrictMode: the AbortError of a discarded request is not shown as an error', async () => {
    const { fetchPage, calls, live } = createFakeFeed();
    render(
      <StrictMode>
        <InfiniteFeed fetchPage={fetchPage} label="Strict" />
      </StrictMode>,
    );
    calls.filter((c) => c.signal.aborted).forEach((c) => c.reject(abortError()));
    await settle();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByRole('feed')).toHaveAttribute('aria-busy', 'true');
    live()[0].resolve(page(['a'], null));
    await settle();
    expect(postTitles()).toEqual(['Post a']);
  });

  it('keeps loading while the sentinel stays in view after a short page, and stops once it leaves', async () => {
    const { fetchPage, calls } = createFakeFeed();
    render(<InfiniteFeed fetchPage={fetchPage} />);
    calls[0].resolve(page(['a'], 'c2'));
    await settle();
    io.setIntersecting(true);
    expect(calls.map((c) => c.cursor)).toEqual([null, 'c2']);
    calls[1].resolve(page(['b'], 'c3')); // too short to push the sentinel out of view
    await settle();
    expect(calls.map((c) => c.cursor)).toEqual([null, 'c2', 'c3']);
    io.setIntersecting(false);
    calls[2].resolve(page(['c', 'd', 'e'], 'c4'));
    await settle();
    expect(fetchPage).toHaveBeenCalledTimes(3);
    expect(postTitles()).toEqual(['Post a', 'Post b', 'Post c', 'Post d', 'Post e']);
  });

  it('de-duplicates overlapping pages by id and treats an already-loaded nextCursor as the end', async () => {
    const { fetchPage, calls } = createFakeFeed();
    render(<InfiniteFeed fetchPage={fetchPage} />);
    calls[0].resolve(page(['a', 'b', 'c'], 'c2'));
    await settle();
    fireEvent.click(screen.getByRole('button', { name: /load more/i }));
    calls[1].resolve(page(['c', 'd', 'd', 'e'], 'c2')); // overlap + duplicate + a cursor loop
    await settle();
    expect(postTitles()).toEqual(['Post a', 'Post b', 'Post c', 'Post d', 'Post e']);
    expect(fetchPage).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('status')).toHaveTextContent(/all caught up/i);
    io.burst(1);
    expect(fetchPage).toHaveBeenCalledTimes(2);
  });

  it('aborts in-flight requests and disconnects the observer on unmount', async () => {
    const first = createFakeFeed();
    const view = render(<InfiniteFeed fetchPage={first.fetchPage} />);
    view.unmount();
    expect(first.calls[0].signal.aborted).toBe(true);
    first.calls[0].resolve(page(['late'], 'c2')); // must be ignored, without errors
    await settle();
    expect(screen.queryByText('Post late')).toBeNull();

    const second = createFakeFeed();
    const view2 = render(<InfiniteFeed fetchPage={second.fetchPage} />);
    second.calls[0].resolve(page(['a'], 'c2'));
    await settle();
    expect(io.observedElements()).toHaveLength(1);
    view2.unmount(); // idle: nothing in flight, but the observer must not outlive the feed
    expect(io.observedElements()).toHaveLength(0);

    const third = createFakeFeed();
    const view3 = render(<InfiniteFeed fetchPage={third.fetchPage} />);
    third.calls[0].resolve(page(['a'], 'c2'));
    await settle();
    fireEvent.click(screen.getByRole('button', { name: /load more/i }));
    view3.unmount(); // a later page in flight
    expect(third.calls[1].signal.aborted).toBe(true);
  });

  it('works without IntersectionObserver: Load more is a real, keyboard-reachable button', async () => {
    io.remove();
    const { fetchPage, calls } = createFakeFeed();
    render(<InfiniteFeed fetchPage={fetchPage} />);
    calls[0].resolve(page(['a'], 'c2'));
    await settle();
    const button = screen.getByRole('button', { name: /load more/i });
    expect(button.tagName).toBe('BUTTON');
    button.focus();
    expect(button).toHaveFocus();
    fireEvent.click(button);
    expect(calls[1].cursor).toBe('c2');
    calls[1].resolve(page(['b'], null));
    await settle();
    expect(postTitles()).toEqual(['Post a', 'Post b']);
    expect(screen.getByRole('status')).toHaveTextContent(/all caught up/i);
  });

  it('follows the APG feed pattern: labelled feed, focusable articles, posinset/setsize, aria-busy', async () => {
    const { fetchPage, calls } = createFakeFeed();
    render(<InfiniteFeed fetchPage={fetchPage} label="Latest posts" />);
    const feed = screen.getByRole('feed', { name: 'Latest posts' });
    calls[0].resolve(page(['a', 'b'], 'c2'));
    await settle();
    const articles = within(feed).getAllByRole('article');
    // each article is named by its title (aria-labelledby)
    expect(within(feed).getByRole('article', { name: 'Post a' })).toBe(articles[0]);
    expect(within(feed).getByRole('article', { name: 'Post b' })).toBe(articles[1]);
    expect(articles.map((a: HTMLElement) => a.getAttribute('aria-posinset'))).toEqual(['1', '2']);
    articles.forEach((a: HTMLElement) => {
      expect(a).toHaveAttribute('tabindex', '0');
      expect(a).toHaveAttribute('aria-setsize', '-1'); // total unknown while more pages exist
    });
    fireEvent.click(screen.getByRole('button', { name: /load more/i }));
    expect(feed).toHaveAttribute('aria-busy', 'true');
    calls[1].resolve(page(['c'], null));
    await settle();
    expect(feed).toHaveAttribute('aria-busy', 'false');
    const all = within(feed).getAllByRole('article');
    expect(all.map((a: HTMLElement) => a.getAttribute('aria-setsize'))).toEqual(['3', '3', '3']);
    expect(all[2]).toHaveAttribute('aria-posinset', '3');
  });

  it('Page Down / Page Up move focus between articles', async () => {
    const { fetchPage, calls } = createFakeFeed();
    render(<InfiniteFeed fetchPage={fetchPage} />);
    calls[0].resolve(page(['a', 'b', 'c'], null));
    await settle();
    const articles = screen.getAllByRole('article');
    articles[0].focus();
    fireEvent.keyDown(articles[0], { key: 'PageDown' });
    expect(articles[1]).toHaveFocus();
    fireEvent.keyDown(articles[1], { key: 'PageDown' });
    expect(articles[2]).toHaveFocus();
    fireEvent.keyDown(articles[2], { key: 'PageDown' }); // last one: stays
    expect(articles[2]).toHaveFocus();
    fireEvent.keyDown(articles[2], { key: 'PageUp' });
    expect(articles[1]).toHaveFocus();
  });

  it('a new fetchPage identity does not refetch, and the next page uses the latest function', async () => {
    const first = createFakeFeed();
    const second = createFakeFeed();
    const view = render(<InfiniteFeed fetchPage={first.fetchPage} />);
    first.calls[0].resolve(page(['a'], 'c2'));
    await settle();
    view.rerender(<InfiniteFeed fetchPage={second.fetchPage} />);
    await settle();
    expect(first.fetchPage).toHaveBeenCalledTimes(1);
    expect(second.fetchPage).toHaveBeenCalledTimes(0);
    expect(postTitles()).toEqual(['Post a']);
    fireEvent.click(screen.getByRole('button', { name: /load more/i }));
    expect(second.fetchPage).toHaveBeenCalledTimes(1);
    expect(second.calls[0].cursor).toBe('c2');
  });
});
