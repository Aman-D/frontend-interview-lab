// Implement the three hooks below. You may import anything from 'react' (React 18).

/* ------------------------------------------------------------------ */
/* useDebouncedValue                                                   */
/* ------------------------------------------------------------------ */

/**
 * Returns `value`, but only after it has stopped changing for `delay` ms (trailing edge).
 * - The first render returns the initial value immediately.
 * - Every change restarts the wait; only the last value of a burst is returned.
 * - No timer may survive an unmount.
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  // TODO
  void delay;
  return value;
}

/* ------------------------------------------------------------------ */
/* usePrevious                                                         */
/* ------------------------------------------------------------------ */

/**
 * The value this hook received in the previous COMMITTED render; `undefined` on the first render.
 * (A re-render with the same value therefore returns that same value.)
 * Must also be correct under <StrictMode>, which renders every component twice in development.
 */
export function usePrevious<T>(value: T): T | undefined {
  // TODO
  void value;
  return undefined;
}

/* ------------------------------------------------------------------ */
/* useSWRLite                                                          */
/* ------------------------------------------------------------------ */

export type Fetcher<T> = (key: string) => Promise<T>;

export interface SWRResponse<T> {
  data: T | undefined;
  error: unknown;
  /** True while there is no data for the key yet and a request is (about to be) running. */
  isLoading: boolean;
  /** `mutate()` revalidates; `mutate(data)` writes `data` into the shared cache without fetching. */
  mutate: (...args: [] | [data: T]) => Promise<T | undefined>;
}

/**
 * A tiny stale-while-revalidate data hook.
 * - A module-level cache, shared by every component that uses the same key.
 * - Cached data is returned immediately; the key is still refetched in the background on mount/key change.
 * - Concurrent requests for the same key are deduplicated (one fetcher call while one is in flight).
 * - When `key` changes, a late response for the previous key must never show up.
 * - `key === null` means "don't fetch".
 * - A new `fetcher` identity alone must not refetch.
 * - `mutate(data)` updates every component using the key; a request that started before it must not overwrite it.
 */
export function useSWRLite<T>(key: string | null, fetcher: Fetcher<T>): SWRResponse<T> {
  // TODO
  void key;
  void fetcher;
  return { data: undefined, error: undefined, isLoading: false, mutate: async () => undefined };
}

/** Test helper: forget every cached key. Tests in one file share module state, so they call this in beforeEach. */
export function __resetSWRCache() {
  // TODO
}
