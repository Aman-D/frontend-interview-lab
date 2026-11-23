import InfiniteFeed from '../InfiniteFeed';
import { createFakeFeed, installFakeIntersectionObserver, page, postTitles, settle } from './helpers';

describe('InfiniteFeed — public', () => {
  let io: ReturnType<typeof installFakeIntersectionObserver>;
  beforeEach(() => {
    io = installFakeIntersectionObserver();
  });
  afterEach(() => io.restore());

  it('loads the first page on mount (cursor null) and renders it inside a busy-aware feed', async () => {
    const { fetchPage, calls } = createFakeFeed();
    render(<InfiniteFeed fetchPage={fetchPage} />);
    expect(fetchPage).toHaveBeenCalledTimes(1);
    expect(calls[0].cursor).toBe(null);
    expect(calls[0].signal instanceof AbortSignal).toBe(true);
    const feed = screen.getByRole('feed', { name: 'Feed' });
    expect(feed).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toHaveTextContent(/loading/i);

    calls[0].resolve(page(['a', 'b', 'c'], 'c2'));
    await settle();
    expect(postTitles()).toEqual(['Post a', 'Post b', 'Post c']);
    expect(feed).toHaveAttribute('aria-busy', 'false');
    expect(screen.getByRole('status')).not.toHaveTextContent(/loading/i);
  });

  it('requests the next cursor when the sentinel intersects, using the rootMargin prop', async () => {
    const { fetchPage, calls } = createFakeFeed();
    render(<InfiniteFeed fetchPage={fetchPage} rootMargin="0px 0px 250px 0px" />);
    calls[0].resolve(page(['a', 'b'], 'c2'));
    await settle();
    expect(io.observedElements()).toHaveLength(1);
    expect(io.active()[0].options.rootMargin).toBe('0px 0px 250px 0px');

    io.setIntersecting(true);
    expect(fetchPage).toHaveBeenCalledTimes(2);
    expect(calls[1].cursor).toBe('c2');
    io.setIntersecting(false); // the user scrolled back up before the page arrived
    calls[1].resolve(page(['c', 'd'], 'c3'));
    await settle();
    expect(postTitles()).toEqual(['Post a', 'Post b', 'Post c', 'Post d']);
    expect(fetchPage).toHaveBeenCalledTimes(2);
  });

  it('never issues a second request while one is in flight (several notifications in one tick)', async () => {
    const { fetchPage, calls } = createFakeFeed();
    render(<InfiniteFeed fetchPage={fetchPage} />);
    calls[0].resolve(page(['a'], 'c2'));
    await settle();
    io.burst(3);
    expect(fetchPage).toHaveBeenCalledTimes(2);
    expect(calls[1].cursor).toBe('c2');
    io.burst(2); // still loading
    expect(fetchPage).toHaveBeenCalledTimes(2);
  });

  it('stops when nextCursor is null: "all caught up", no Load more, nothing observed', async () => {
    const { fetchPage, calls } = createFakeFeed();
    render(<InfiniteFeed fetchPage={fetchPage} />);
    calls[0].resolve(page(['a', 'b'], null));
    await settle();
    expect(screen.getByRole('status')).toHaveTextContent(/all caught up/i);
    expect(screen.queryByRole('button', { name: /load more/i })).toBeNull();
    expect(io.observedElements()).toHaveLength(0);
    io.burst(2);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it('shows an error alert with Retry, which re-requests the same cursor and recovers', async () => {
    const { fetchPage, calls } = createFakeFeed();
    render(<InfiniteFeed fetchPage={fetchPage} />);
    calls[0].resolve(page(['a', 'b'], 'c2'));
    await settle();
    fireEvent.click(screen.getByRole('button', { name: /load more/i }));
    expect(calls[1].cursor).toBe('c2');
    calls[1].reject(new Error('Network down'));
    await settle();
    expect(screen.getByRole('alert')).toHaveTextContent('Network down');
    expect(postTitles()).toEqual(['Post a', 'Post b']);
    expect(screen.getByRole('feed')).toHaveAttribute('aria-busy', 'false');

    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(fetchPage).toHaveBeenCalledTimes(3);
    expect(calls[2].cursor).toBe('c2');
    calls[2].resolve(page(['c'], null));
    await settle();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(postTitles()).toEqual(['Post a', 'Post b', 'Post c']);
  });

  it('shows an empty state when the first page has no items', async () => {
    const { fetchPage, calls } = createFakeFeed();
    render(<InfiniteFeed fetchPage={fetchPage} />);
    calls[0].resolve(page([], null));
    await settle();
    expect(screen.queryAllByRole('article')).toHaveLength(0);
    expect(screen.getByRole('status')).toHaveTextContent(/no posts/i);
    expect(screen.queryByText(/all caught up/i)).toBeNull();
  });
});
