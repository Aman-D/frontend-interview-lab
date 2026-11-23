import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

/* ------------------------------------------------------------------ */
/* useDebouncedValue                                                   */
/* ------------------------------------------------------------------ */

/**
 * Returns `value`, but only after it has stopped changing for `delay` ms (trailing edge).
 * The first render returns the initial value immediately.
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    // Every change of `value` (or `delay`) re-runs the effect; the cleanup cancels the previous timer,
    // so only the last value in a burst is committed. The same cleanup runs on unmount.
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/* ------------------------------------------------------------------ */
/* usePrevious                                                         */
/* ------------------------------------------------------------------ */

/**
 * The value this hook received in the previous COMMITTED render (undefined on the first render).
 *
 * The ref is written only in an effect — after React has committed the render — and read during
 * render. A render that React throws away (StrictMode's double render, an interrupted concurrent
 * render) never runs the effect, so the ref always holds the last committed value.
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

/* ------------------------------------------------------------------ */
/* useSWRLite                                                          */
/* ------------------------------------------------------------------ */

export type Fetcher<T> = (key: string) => Promise<T>;

export interface SWRResponse<T> {
  data: T | undefined;
  error: unknown;
  isLoading: boolean;
  /** `mutate()` revalidates; `mutate(data)` writes `data` into the shared cache without fetching. */
  mutate: (...args: [] | [data: T]) => Promise<T | undefined>;
}

interface CacheState {
  data: unknown;
  error: unknown;
  isValidating: boolean;
}

interface Entry {
  /** Immutable snapshot: replaced (never mutated) on every change, so useSyncExternalStore can compare by identity. */
  state: CacheState;
  listeners: Set<() => void>;
  /** The request in flight, tagged with the entry version it started at. */
  inflight: { promise: Promise<unknown>; version: number } | null;
  /** Bumped by mutate(data): responses to requests started before a local write are stale. */
  version: number;
}

const EMPTY: CacheState = Object.freeze({ data: undefined, error: undefined, isValidating: false });
const cache = new Map<string, Entry>();

function entryFor(key: string): Entry {
  let entry = cache.get(key);
  if (!entry) {
    entry = { state: EMPTY, listeners: new Set(), inflight: null, version: 0 };
    cache.set(key, entry);
  }
  return entry;
}

function write(entry: Entry, patch: Partial<CacheState>) {
  entry.state = { ...entry.state, ...patch };
  entry.listeners.forEach((notify) => notify());
}

function revalidate(key: string, fetcher: Fetcher<unknown>): Promise<unknown> {
  const entry = entryFor(key);
  // Deduplicate: everyone asking for this key while a (still relevant) request is in flight shares it.
  if (entry.inflight && entry.inflight.version === entry.version) return entry.inflight.promise;

  const version = entry.version;
  const settle = (patch: Partial<CacheState>) => {
    if (entry.inflight?.promise === promise) entry.inflight = null;
    if (entry.version !== version) {
      // mutate(data) happened after this request started: its response must not overwrite the local write.
      write(entry, { isValidating: entry.inflight !== null });
      return;
    }
    write(entry, { ...patch, isValidating: entry.inflight !== null });
  };
  // `new Promise(resolve => resolve(fetcher(key)))` calls the fetcher synchronously and turns a synchronous
  // throw into a rejection. Both branches are handled, so the shared promise never rejects.
  const promise: Promise<unknown> = new Promise((resolve) => resolve(fetcher(key))).then(
    (data) => {
      settle({ data, error: undefined });
      return data;
    },
    (error: unknown) => {
      settle({ error }); // keep the stale data: stale-while-revalidate
      return undefined;
    },
  );
  entry.inflight = { promise, version };
  write(entry, { isValidating: true });
  return promise;
}

/** Test helper: forget every cached key. Requests still in flight write into detached entries. */
export function __resetSWRCache() {
  cache.clear();
}

const noopUnsubscribe = () => {};

export function useSWRLite<T>(key: string | null, fetcher: Fetcher<T>): SWRResponse<T> {
  // The key identifies the resource; a new fetcher identity (inline arrow) must not refetch.
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (key === null) return noopUnsubscribe;
      const entry = entryFor(key);
      entry.listeners.add(onStoreChange);
      return () => {
        entry.listeners.delete(onStoreChange);
      };
    },
    [key],
  );
  // Reads the entry for the CURRENT key, so a late response for a previous key can never show up here.
  const getSnapshot = useCallback(() => (key === null ? EMPTY : (cache.get(key)?.state ?? EMPTY)), [key]);
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    if (key === null) return;
    // Stale-while-revalidate: cached data (if any) is already on screen; refresh it in the background.
    void revalidate(key, fetcherRef.current as Fetcher<unknown>);
  }, [key]);

  const mutate = useCallback(
    (...args: [] | [data: T]): Promise<T | undefined> => {
      if (key === null) return Promise.resolve(undefined);
      if (args.length === 0) return revalidate(key, fetcherRef.current as Fetcher<unknown>) as Promise<T | undefined>;
      const entry = entryFor(key);
      entry.version += 1; // invalidates responses of requests that started before this write
      write(entry, { data: args[0], error: undefined, isValidating: false });
      return Promise.resolve(args[0]);
    },
    [key],
  );

  const data = state.data as T | undefined;
  return {
    data,
    error: state.error,
    // No data yet and either a request is running or none has finished (first render before the effect).
    isLoading: key !== null && data === undefined && (state.isValidating || state.error === undefined),
    mutate,
  };
}
