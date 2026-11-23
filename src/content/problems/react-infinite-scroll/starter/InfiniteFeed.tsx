import { useEffect, useState } from 'react';
import type { FeedItem, InfiniteFeedProps } from './types';

export default function InfiniteFeed({ fetchPage, label = 'Feed' }: InfiniteFeedProps) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  useEffect(() => {
    fetchPage(null, new AbortController().signal).then((page) => {
      setItems(page.items);
      setNextCursor(page.nextCursor);
    });
  }, [fetchPage]);

  // TODO:
  // - load the next page when a sentinel near the end of the list intersects (IntersectionObserver
  //   with the `rootMargin` prop); never two requests for the same cursor, even if several
  //   notifications arrive before React re-renders, and StrictMode-safe
  // - stop when nextCursor is null ("You're all caught up"); empty state when there are no posts
  // - loading (role="status", aria-busy on the feed) and error (role="alert" + Retry) states
  // - abort the in-flight request on unmount; ignore responses of aborted requests
  // - de-duplicate items by id; keep "Load more" as a fallback (no IntersectionObserver / keyboard)
  // - APG feed pattern: focusable <article>s with aria-labelledby, aria-posinset, aria-setsize
  const loadMore = () => {
    fetchPage(nextCursor, new AbortController().signal).then((page) => {
      setItems([...items, ...page.items]);
      setNextCursor(page.nextCursor);
    });
  };

  return (
    <section className="feed-shell">
      <div role="feed" aria-label={label} className="feed">
        {items.map((item) => (
          <article key={item.id} className="post">
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </article>
        ))}
      </div>
      <div className="feed-footer">
        <button type="button" onClick={loadMore}>
          Load more
        </button>
      </div>
    </section>
  );
}
