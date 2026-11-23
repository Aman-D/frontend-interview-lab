// Test helpers: a controllable fake fetchPage and a fake IntersectionObserver.
import type { FeedItem, Page } from '../types';

export function post(id: string): FeedItem {
  return { id, title: `Post ${id}`, body: `Body of post ${id}` };
}

export function page(ids: string[], nextCursor: string | null): Page {
  return { items: ids.map(post), nextCursor };
}

interface Call {
  cursor: string | null;
  signal: AbortSignal;
  resolve: (page: Page) => void;
  reject: (error: unknown) => void;
}

/** Every call returns a promise that the test settles by hand (`calls[i].resolve(page(...))`). */
export function createFakeFeed() {
  const calls: Call[] = [];
  const fetchPage = fn((cursor: string | null, signal: AbortSignal) => {
    const d = deferred<Page>();
    calls.push({ cursor, signal, resolve: d.resolve, reject: d.reject });
    return d.promise;
  });
  /** Calls whose signal has not been aborted. */
  const live = () => calls.filter((c) => !c.signal.aborted);
  return { fetchPage, calls, live };
}

/** Titles of the rendered articles (the text of each article's heading), in DOM order. */
export function postTitles(): string[] {
  return screen
    .queryAllByRole('article')
    .map((article: HTMLElement) => article.querySelector('h1, h2, h3, h4, h5, h6')?.textContent?.trim() ?? '');
}

/** Settles promise callbacks, React updates and observer notifications. */
export async function settle() {
  await flush();
  await flush();
}

type ObserverCallback = (entries: IntersectionObserverEntry[], observer: unknown) => void;

/**
 * Replaces window.IntersectionObserver with a fake that follows the real delivery rules:
 *  - observe(target) always reports the target's current state once, asynchronously;
 *  - afterwards the callback runs only when the state changes (`setIntersecting`).
 * `burst(n)` delivers n "intersecting" notifications in ONE act() — like several callbacks
 * arriving before React re-renders. Call `restore()` in afterEach.
 */
export function installFakeIntersectionObserver() {
  const original = (window as any).IntersectionObserver;
  let inView = false;

  class FakeIntersectionObserver {
    readonly root = null;
    readonly rootMargin: string;
    readonly thresholds = [0];
    readonly options: IntersectionObserverInit;
    readonly targets = new Map<Element, boolean | undefined>(); // target -> last reported state
    disconnected = false;
    private readonly callback: ObserverCallback;

    constructor(callback: ObserverCallback, options: IntersectionObserverInit = {}) {
      this.callback = callback;
      this.options = options;
      this.rootMargin = options.rootMargin ?? '0px';
      instances.push(this);
    }
    observe(target: Element) {
      if (this.targets.has(target)) return;
      this.targets.set(target, undefined);
      queueMicrotask(() => {
        if (this.disconnected || !this.targets.has(target) || this.targets.get(target) !== undefined) return;
        act(() => this.deliver([target], inView));
      });
    }
    unobserve(target: Element) {
      this.targets.delete(target);
    }
    disconnect() {
      this.targets.clear();
      this.disconnected = true;
    }
    takeRecords() {
      return [];
    }
    deliver(targets: Element[], isIntersecting: boolean) {
      if (!targets.length) return;
      const entries = targets.map((target) => {
        this.targets.set(target, isIntersecting);
        const rect = target.getBoundingClientRect();
        return {
          target,
          isIntersecting,
          intersectionRatio: isIntersecting ? 1 : 0,
          boundingClientRect: rect,
          intersectionRect: rect,
          rootBounds: null,
          time: performance.now(),
        } as unknown as IntersectionObserverEntry;
      });
      this.callback(entries, this);
    }
  }

  const instances: FakeIntersectionObserver[] = [];
  (window as any).IntersectionObserver = FakeIntersectionObserver;
  const active = () => instances.filter((o) => !o.disconnected && o.targets.size > 0);

  return {
    instances,
    active,
    /** Every element currently observed by a connected observer. */
    observedElements: () => active().flatMap((o) => Array.from(o.targets.keys())),
    /** Moves the observed targets into (true) or out of (false) the root + rootMargin. */
    setIntersecting(value: boolean) {
      inView = value;
      act(() => {
        for (const o of active()) {
          o.deliver(Array.from(o.targets.keys()).filter((t) => o.targets.get(t) !== value), value);
        }
      });
    },
    /** n "intersecting" notifications in a single act(), before React can re-render. */
    burst(times: number) {
      inView = true;
      act(() => {
        for (let i = 0; i < times; i++) {
          for (const o of active()) o.deliver(Array.from(o.targets.keys()), true);
        }
      });
    },
    /** Simulates an environment without IntersectionObserver. */
    remove() {
      (window as any).IntersectionObserver = undefined;
    },
    restore() {
      (window as any).IntersectionObserver = original;
    },
  };
}
