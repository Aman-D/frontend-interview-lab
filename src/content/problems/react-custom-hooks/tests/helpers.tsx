import { useDebouncedValue, usePrevious, useSWRLite, type SWRResponse } from '../hooks';

/** A fetcher whose calls return promises the test settles manually (in any order). */
export function createFetcher<T = string>() {
  const calls: { key: string; resolve: (value: T) => void; reject: (error: unknown) => void }[] = [];
  const fetcher = fn((key: string) => {
    const d = deferred<T>();
    calls.push({ key, resolve: d.resolve, reject: d.reject });
    return d.promise;
  });
  return { fetcher, calls };
}

/** Renders the debounced value and records every value it rendered with. */
export function DebounceProbe({ value, delay, log }: { value: string; delay: number; log?: string[] }) {
  const debounced = useDebouncedValue(value, delay);
  log?.push(debounced);
  return <output data-testid="debounced">{debounced}</output>;
}

/** `log` without consecutive duplicates (re-renders with the same value). */
export function distinct(log: string[]) {
  return log.filter((v, i) => i === 0 || v !== log[i - 1]);
}

export function PreviousProbe({ value, tick }: { value: unknown; tick?: number }) {
  const previous = usePrevious(value);
  return (
    <output data-testid="previous" data-tick={tick}>
      {previous === undefined ? 'undefined' : String(previous)}
    </output>
  );
}

/** Text summary of an SWR result: "loading", "data:…", "error:…" (combined when several apply) or "idle". */
export function formatResult(r: Pick<SWRResponse<unknown>, 'data' | 'error' | 'isLoading'>) {
  const parts: string[] = [];
  if (r.isLoading) parts.push('loading');
  if (r.data !== undefined) parts.push(`data:${String(r.data)}`);
  if (r.error !== undefined) parts.push(`error:${r.error instanceof Error ? r.error.message : String(r.error)}`);
  return parts.join(' ') || 'idle';
}

export function SWRProbe({
  id = 'swr',
  swrKey,
  fetcher,
  onResult,
}: {
  id?: string;
  swrKey: string | null;
  fetcher: (key: string) => Promise<string>;
  onResult?: (r: SWRResponse<string>) => void;
}) {
  const result = useSWRLite(swrKey, fetcher);
  onResult?.(result);
  return <output data-testid={id}>{formatResult(result)}</output>;
}

export const text = (id: string) => (screen.getByTestId(id).textContent || '').trim();
