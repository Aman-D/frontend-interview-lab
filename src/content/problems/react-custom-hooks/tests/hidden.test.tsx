import { StrictMode, useState } from 'react';
import { __resetSWRCache, usePrevious, type SWRResponse } from '../hooks';
import { DebounceProbe, PreviousProbe, SWRProbe, createFetcher, distinct, text } from './helpers';

describe('useDebouncedValue — hidden', () => {
  beforeEach(() => timers.useFake());

  it('restarts the wait when the delay changes, and handles several separate bursts', () => {
    const log: string[] = [];
    const view = render(<DebounceProbe value="a" delay={300} log={log} />);
    view.rerender(<DebounceProbe value="b" delay={300} log={log} />);
    timers.advance(250);
    view.rerender(<DebounceProbe value="b" delay={1000} log={log} />);
    timers.advance(999);
    expect(text('debounced')).toBe('a');
    timers.advance(1);
    expect(text('debounced')).toBe('b');
    // A second burst, after things settled.
    view.rerender(<DebounceProbe value="c" delay={1000} log={log} />);
    timers.advance(500);
    view.rerender(<DebounceProbe value="d" delay={1000} log={log} />);
    timers.advance(1000);
    expect(text('debounced')).toBe('d');
    expect(distinct(log)).toEqual(['a', 'b', 'd']);
    expect(timers.pendingCount()).toBe(0);
  });

  it('does not schedule a timer per render: re-renders with the same value do not restart the wait', () => {
    const view = render(<DebounceProbe value="a" delay={300} />);
    view.rerender(<DebounceProbe value="b" delay={300} />);
    timers.advance(200);
    view.rerender(<DebounceProbe value="b" delay={300} />); // unrelated re-render
    timers.advance(100);
    expect(text('debounced')).toBe('b');
    expect(timers.pendingCount()).toBe(0);
  });
});

describe('usePrevious — hidden', () => {
  it('reports the previous COMMITTED value under StrictMode double rendering', () => {
    const view = render(
      <StrictMode>
        <PreviousProbe value="x" />
      </StrictMode>,
    );
    expect(text('previous')).toBe('undefined');
    view.rerender(
      <StrictMode>
        <PreviousProbe value="y" />
      </StrictMode>,
    );
    expect(text('previous')).toBe('x');
    view.rerender(
      <StrictMode>
        <PreviousProbe value="z" />
      </StrictMode>,
    );
    expect(text('previous')).toBe('y');
  });

  it('follows renders caused by local state and keeps object identity', () => {
    const seen: unknown[] = [];
    const first = { n: 1 };
    const second = { n: 2 };
    let setValue: (v: { n: number }) => void = () => {};
    function Local() {
      const [value, set] = useState(first);
      setValue = set;
      const previous = usePrevious(value);
      seen.push(previous);
      return null;
    }
    render(<Local />);
    act(() => setValue(second));
    expect(seen[0]).toBeUndefined();
    expect(seen[seen.length - 1]).toBe(first);
    act(() => setValue(first));
    expect(seen[seen.length - 1]).toBe(second);
  });
});

describe('useSWRLite — hidden', () => {
  beforeEach(() => __resetSWRCache());

  it('serves cached data immediately on remount and revalidates in the background', async () => {
    const { fetcher, calls } = createFetcher();
    const first = render(<SWRProbe swrKey="/todos" fetcher={fetcher} />);
    calls[0].resolve('v1');
    await flush();
    first.unmount();

    render(<SWRProbe swrKey="/todos" fetcher={fetcher} />);
    expect(text('swr')).toBe('data:v1'); // no loading flash: stale data first
    expect(fetcher).toHaveBeenCalledTimes(2); // ...while revalidating
    calls[1].resolve('v2');
    await flush();
    expect(text('swr')).toBe('data:v2');
  });

  it('switching keys shows no data from the old key, and switching back shows its cache at once', async () => {
    const { fetcher, calls } = createFetcher();
    const view = render(<SWRProbe swrKey="/a" fetcher={fetcher} />);
    calls[0].resolve('A');
    await flush();
    view.rerender(<SWRProbe swrKey="/b" fetcher={fetcher} />);
    expect(text('swr')).toBe('loading');
    calls[1].resolve('B');
    await flush();
    expect(text('swr')).toBe('data:B');
    view.rerender(<SWRProbe swrKey="/a" fetcher={fetcher} />);
    expect(text('swr')).toBe('data:A');
    view.rerender(<SWRProbe swrKey={null} fetcher={fetcher} />);
    expect(text('swr')).toBe('idle');
  });

  it('deduplicates a later mount while the request is in flight, and StrictMode double effects', async () => {
    const { fetcher, calls } = createFetcher();
    render(
      <StrictMode>
        <SWRProbe id="a" swrKey="/me" fetcher={fetcher} />
      </StrictMode>,
    );
    expect(fetcher).toHaveBeenCalledTimes(1);
    render(<SWRProbe id="b" swrKey="/me" fetcher={fetcher} />);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(text('b')).toBe('loading');
    calls[0].resolve('Me');
    await flush();
    expect(text('a')).toBe('data:Me');
    expect(text('b')).toBe('data:Me');
  });

  it('keeps stale data on a failed revalidation; mutate() retries and clears the error', async () => {
    const { fetcher, calls } = createFetcher();
    let latest: SWRResponse<string> | undefined;
    const first = render(<SWRProbe swrKey="/feed" fetcher={fetcher} />);
    calls[0].reject(new Error('down'));
    await flush();
    expect(text('swr')).toBe('error:down');
    first.unmount();

    // Error with no data: a retry through mutate() succeeds.
    render(<SWRProbe swrKey="/feed" fetcher={fetcher} onResult={(r) => (latest = r)} />);
    calls[1].resolve('items');
    await flush();
    expect(text('swr')).toBe('data:items');

    // Revalidation fails: the stale data stays, next to the error.
    act(() => {
      void latest!.mutate();
    });
    calls[2].reject(new Error('flaky'));
    await flush();
    expect(text('swr')).toBe('data:items error:flaky');
    act(() => {
      void latest!.mutate();
    });
    calls[3].resolve('fresh');
    await flush();
    expect(text('swr')).toBe('data:fresh');
    expect(fetcher).toHaveBeenCalledTimes(4);
  });

  it('mutate(data) updates every component using the key without fetching, and beats an older in-flight response', async () => {
    const { fetcher, calls } = createFetcher();
    let latest: SWRResponse<string> | undefined;
    render(
      <>
        <SWRProbe id="a" swrKey="/count" fetcher={fetcher} onResult={(r) => (latest = r)} />
        <SWRProbe id="b" swrKey="/count" fetcher={fetcher} />
      </>,
    );
    calls[0].resolve('1');
    await flush();

    act(() => {
      void latest!.mutate();
    }); // background revalidation in flight (request #2)
    expect(fetcher).toHaveBeenCalledTimes(2);
    act(() => {
      void latest!.mutate('2 (local)');
    });
    expect(text('a')).toBe('data:2 (local)');
    expect(text('b')).toBe('data:2 (local)');
    expect(fetcher).toHaveBeenCalledTimes(2);

    calls[1].resolve('1 (old server)'); // started before the local write: must be ignored
    await flush();
    expect(text('a')).toBe('data:2 (local)');
    expect(text('b')).toBe('data:2 (local)');
  });

  it('mutate() deduplicates while a revalidation is in flight and resolves with the fresh data', async () => {
    const { fetcher, calls } = createFetcher();
    let latest: SWRResponse<string> | undefined;
    render(<SWRProbe swrKey="/x" fetcher={fetcher} onResult={(r) => (latest = r)} />);
    calls[0].resolve('one');
    await flush();
    let p1: Promise<string | undefined> | undefined;
    let p2: Promise<string | undefined> | undefined;
    act(() => {
      p1 = latest!.mutate();
      p2 = latest!.mutate();
    });
    expect(fetcher).toHaveBeenCalledTimes(2);
    calls[1].resolve('two');
    await flush();
    expect(await p1).toBe('two');
    expect(await p2).toBe('two');
    expect(text('swr')).toBe('data:two');
  });

  it('a new fetcher identity does not refetch, and __resetSWRCache() forgets cached keys', async () => {
    const { fetcher, calls } = createFetcher();
    const view = render(<SWRProbe swrKey="/k" fetcher={(k) => fetcher(k)} />);
    calls[0].resolve('cached');
    await flush();
    // Nothing is in flight now, so a refetch here could not hide behind deduplication.
    view.rerender(<SWRProbe swrKey="/k" fetcher={(k) => fetcher(k)} />);
    view.rerender(<SWRProbe swrKey="/k" fetcher={(k) => fetcher(k)} />);
    await flush();
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(text('swr')).toBe('data:cached');
    view.unmount();

    __resetSWRCache();
    render(<SWRProbe swrKey="/k" fetcher={fetcher} />);
    expect(text('swr')).toBe('loading');
  });
});
