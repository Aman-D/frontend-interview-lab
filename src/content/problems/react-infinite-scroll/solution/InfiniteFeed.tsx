import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { FeedItem, InfiniteFeedProps } from './types';

type Status = 'loading' | 'idle' | 'error' | 'done';

interface FeedState {
  items: FeedItem[];
  status: Status;
  error: string | null;
}

const DEFAULT_ROOT_MARGIN = '0px 0px 400px 0px';

/** Appends `incoming` to `prev`, skipping ids that are already present (pages may overlap). */
function appendUnique(prev: FeedItem[], incoming: FeedItem[]): FeedItem[] {
  const seen = new Set(prev.map((item) => item.id));
  const added: FeedItem[] = [];
  for (const item of incoming) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    added.push(item);
  }
  return added.length ? [...prev, ...added] : prev;
}

function messageOf(error: unknown) {
  return error instanceof Error && error.message ? error.message : 'Something went wrong.';
}

export default function InfiniteFeed({ fetchPage, label = 'Feed', rootMargin = DEFAULT_ROOT_MARGIN }: InfiniteFeedProps) {
  const [state, setState] = useState<FeedState>({ items: [], status: 'loading', error: null });
  const baseId = useId();

  // Bookkeeping that must be correct *synchronously*, before React re-renders. Two observer
  // callbacks (or a click and a callback) can arrive in the same tick; state would still be stale.
  const fetchRef = useRef(fetchPage); // latest fetchPage without re-running effects
  const cursorRef = useRef<string | null>(null); // cursor of the next page to request
  const doneRef = useRef(false);
  const loadedCursorsRef = useRef(new Set<string | null>());
  const inFlightRef = useRef<AbortController | null>(null); // the single live request, if any
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchRef.current = fetchPage;
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (inFlightRef.current || doneRef.current) return; // one live request at a time
    const cursor = cursorRef.current;
    const controller = new AbortController();
    inFlightRef.current = controller;
    setState((s) => (s.status === 'loading' ? s : { ...s, status: 'loading', error: null }));

    let request: Promise<{ items: FeedItem[]; nextCursor: string | null }>;
    try {
      request = Promise.resolve(fetchRef.current(cursor, controller.signal));
    } catch (error) {
      request = Promise.reject(error);
    }

    request.then(
      (page) => {
        // Aborted (unmount / StrictMode) or superseded: this response must not touch state.
        if (inFlightRef.current !== controller) return;
        inFlightRef.current = null;
        loadedCursorsRef.current.add(cursor);
        const next = page.nextCursor;
        // A cursor we have already loaded would loop forever — treat it as the end.
        const done = next === null || loadedCursorsRef.current.has(next);
        cursorRef.current = next;
        doneRef.current = done;
        setState((s) => ({ items: appendUnique(s.items, page.items ?? []), status: done ? 'done' : 'idle', error: null }));
      },
      (error) => {
        if (inFlightRef.current !== controller) return; // includes our own AbortErrors
        inFlightRef.current = null;
        setState((s) => ({ ...s, status: 'error', error: messageOf(error) }));
      },
    );
  }, []);

  // First page on mount. The cleanup aborts the live request and releases the lock, so the
  // StrictMode mount → unmount → mount cycle ends with exactly one live request.
  useEffect(() => {
    loadMore();
    return () => {
      inFlightRef.current?.abort();
      inFlightRef.current = null;
    };
  }, [loadMore]);

  // The sentinel exists only while idle, so every finished page mounts a fresh one and a fresh
  // observer. IntersectionObserver always reports the initial state of a newly observed target,
  // so if the sentinel is still in range after a short page, the next page loads by itself.
  const showSentinel = state.status === 'idle';
  useEffect(() => {
    const el = sentinelRef.current;
    if (!showSentinel || !el || typeof window.IntersectionObserver !== 'function') return;
    const observer = new window.IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadMore();
      },
      { rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [showSentinel, rootMargin, loadMore]);

  // APG feed pattern: Page Down / Page Up move focus between articles.
  const onFeedKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'PageDown' && event.key !== 'PageUp') return;
    const current = (event.target as HTMLElement).closest('article');
    const articles = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(':scope > article'));
    const index = current ? articles.indexOf(current) : -1;
    if (index === -1) return;
    const target = articles[event.key === 'PageDown' ? index + 1 : index - 1];
    if (!target) return;
    event.preventDefault();
    target.focus();
  };

  const { items, status, error } = state;
  const done = status === 'done';
  let statusText = '';
  if (status === 'loading') statusText = items.length ? 'Loading more posts…' : 'Loading posts…';
  else if (done) statusText = items.length ? "You're all caught up." : 'No posts yet.';

  return (
    <section className="feed-shell">
      <div role="feed" aria-label={label} aria-busy={status === 'loading'} className="feed" onKeyDown={onFeedKeyDown}>
        {items.map((item, index) => (
          <article
            key={item.id}
            className="post"
            tabIndex={0}
            aria-posinset={index + 1}
            aria-setsize={done ? items.length : -1}
            aria-labelledby={`${baseId}-t-${index}`}
            aria-describedby={`${baseId}-b-${index}`}
          >
            <h3 id={`${baseId}-t-${index}`}>{item.title}</h3>
            <p id={`${baseId}-b-${index}`}>{item.body}</p>
          </article>
        ))}
      </div>

      <div className="feed-footer">
        <p role="status" aria-live="polite">{statusText}</p>
        {status === 'error' && (
          <div role="alert" className="feed-error">
            <p>Couldn't load posts: {error}</p>
          </div>
        )}
        {status === 'error' && (
          <button type="button" onClick={loadMore}>Retry</button>
        )}
        {status === 'idle' && (
          <button type="button" onClick={loadMore}>Load more</button>
        )}
        {showSentinel && <div ref={sentinelRef} className="feed-sentinel" aria-hidden="true" data-testid="feed-sentinel" />}
      </div>
    </section>
  );
}
