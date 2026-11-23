// Mock paged API used by the preview (read-only). It is cursor-based, honours AbortSignal,
// has visible latency, and — on purpose — repeats the last item of the previous page at the
// top of every page, so the feed has to de-duplicate by id.
import type { FeedItem, Page } from './types';

export interface MockFeedOptions {
  total?: number;
  pageSize?: number;
  latencyMs?: number;
  /** How many items of the previous page are repeated at the start of each page. */
  overlap?: number;
  /** Called every time a request starts (the preview shows a request log). */
  onRequest?: (cursor: string | null) => void;
}

export function createMockFeed({ total = 64, pageSize = 8, latencyMs = 700, overlap = 1, onRequest }: MockFeedOptions = {}) {
  const all: FeedItem[] = Array.from({ length: total }, (_, i) => ({
    id: `post-${i + 1}`,
    title: `Post #${i + 1}`,
    body: `Body text for post ${i + 1}. Scroll down (or press "Load more") to fetch the next page.`,
  }));
  let failNext = false;

  function fetchPage(cursor: string | null, signal: AbortSignal): Promise<Page<FeedItem>> {
    onRequest?.(cursor);
    return new Promise((resolve, reject) => {
      if (signal.aborted) {
        reject(new DOMException('The request was aborted', 'AbortError'));
        return;
      }
      const onAbort = () => {
        clearTimeout(timer);
        reject(new DOMException('The request was aborted', 'AbortError'));
      };
      const timer = setTimeout(() => {
        signal.removeEventListener('abort', onAbort);
        if (failNext) {
          failNext = false;
          reject(new Error('The server returned 503 (simulated).'));
          return;
        }
        const start = cursor === null ? 0 : Number(cursor);
        const from = start === 0 ? 0 : Math.max(0, start - overlap);
        const end = Math.min(total, start + pageSize);
        resolve({ items: all.slice(from, end), nextCursor: end < total ? String(end) : null });
      }, latencyMs);
      signal.addEventListener('abort', onAbort, { once: true });
    });
  }

  return {
    fetchPage,
    /** Makes the next request fail once. */
    failNextRequest() {
      failNext = true;
    },
  };
}
