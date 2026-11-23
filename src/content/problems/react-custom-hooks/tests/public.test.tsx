import { __resetSWRCache } from '../hooks';
import { DebounceProbe, PreviousProbe, SWRProbe, createFetcher, distinct, text } from './helpers';

describe('useDebouncedValue — public', () => {
  beforeEach(() => timers.useFake());

  it('returns the initial value at once, then only the last value of a burst after the delay', () => {
    const log: string[] = [];
    const view = render(<DebounceProbe value="a" delay={300} log={log} />);
    expect(text('debounced')).toBe('a');
    view.rerender(<DebounceProbe value="b" delay={300} log={log} />);
    timers.advance(200);
    view.rerender(<DebounceProbe value="c" delay={300} log={log} />);
    timers.advance(299); // 499 ms after "b", but only 299 ms after "c": the wait restarted
    expect(text('debounced')).toBe('a');
    timers.advance(1);
    expect(text('debounced')).toBe('c');
    expect(distinct(log)).toEqual(['a', 'c']);
  });

  it('leaves no timer behind after unmount', () => {
    const view = render(<DebounceProbe value="a" delay={300} />);
    view.rerender(<DebounceProbe value="b" delay={300} />);
    expect(timers.pendingCount()).toBeGreaterThan(0);
    view.unmount();
    expect(timers.pendingCount()).toBe(0);
  });
});

describe('usePrevious — public', () => {
  it('is undefined on the first render, then the previous render\'s value', () => {
    const view = render(<PreviousProbe value={1} />);
    expect(text('previous')).toBe('undefined');
    view.rerender(<PreviousProbe value={2} />);
    expect(text('previous')).toBe('1');
    view.rerender(<PreviousProbe value={3} />);
    expect(text('previous')).toBe('2');
    // A re-render with the same value: the previous render's value is that same value.
    view.rerender(<PreviousProbe value={3} />);
    expect(text('previous')).toBe('3');
  });
});

describe('useSWRLite — public', () => {
  beforeEach(() => __resetSWRCache());

  it('is loading, calls the fetcher once with the key, then shows the data', async () => {
    const { fetcher, calls } = createFetcher();
    const seen: boolean[] = [];
    render(<SWRProbe swrKey="/user/1" fetcher={fetcher} onResult={(r) => seen.push(r.isLoading)} />);
    expect(seen[0]).toBe(true); // already loading on the very first render (no "idle" flash)
    expect(text('swr')).toBe('loading');
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledWith('/user/1');
    calls[0].resolve('Ada');
    await flush();
    expect(text('swr')).toBe('data:Ada');
  });

  it('does not fetch (and is not loading) when the key is null', async () => {
    const { fetcher } = createFetcher();
    render(<SWRProbe swrKey={null} fetcher={fetcher} />);
    await flush();
    expect(fetcher).toHaveBeenCalledTimes(0);
    expect(text('swr')).toBe('idle');
  });

  it('deduplicates concurrent requests for the same key and shares the result', async () => {
    const { fetcher, calls } = createFetcher();
    render(
      <>
        <SWRProbe id="a" swrKey="/user/1" fetcher={fetcher} />
        <SWRProbe id="b" swrKey="/user/1" fetcher={fetcher} />
      </>,
    );
    expect(fetcher).toHaveBeenCalledTimes(1);
    calls[0].resolve('Ada');
    await flush();
    expect(text('a')).toBe('data:Ada');
    expect(text('b')).toBe('data:Ada');
  });

  it('never shows a late response for a previous key', async () => {
    const { fetcher, calls } = createFetcher();
    const view = render(<SWRProbe swrKey="/user/1" fetcher={fetcher} />);
    view.rerender(<SWRProbe swrKey="/user/2" fetcher={fetcher} />);
    expect(calls.map((c) => c.key)).toEqual(['/user/1', '/user/2']);
    calls[1].resolve('Grace');
    await flush();
    calls[0].resolve('Ada');
    await flush();
    expect(text('swr')).toBe('data:Grace');
  });
});
