// Public types for the feed. This file is read-only.

export interface FeedItem {
  /** Unique, stable id. Pages may overlap, so the same id can arrive twice. */
  id: string;
  title: string;
  body: string;
}

export interface Page<T extends FeedItem = FeedItem> {
  items: T[];
  /** Cursor for the next page, or `null` when there is nothing more to load. */
  nextCursor: string | null;
}

/**
 * Fetches one page. The first page is requested with `cursor === null`.
 * Pass `signal` to fetch() so a request can be cancelled; an aborted request rejects with an AbortError.
 */
export type FetchPage<T extends FeedItem = FeedItem> = (cursor: string | null, signal: AbortSignal) => Promise<Page<T>>;

export interface InfiniteFeedProps {
  fetchPage: FetchPage;
  /** Accessible name of the feed. Default: "Feed". */
  label?: string;
  /** IntersectionObserver rootMargin for the sentinel. Default: "0px 0px 400px 0px" (start loading 400px early). */
  rootMargin?: string;
}
