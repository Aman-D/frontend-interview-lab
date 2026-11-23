// Test helpers. Image sources are tiny data URIs; no test waits for an image to load.
export function makeImages(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    src: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="4" height="3"><title>${i + 1}</title></svg>`)}`,
    alt: `Photo ${i + 1}`,
  }));
}

/**
 * Replaces window.matchMedia with a controllable fake. Call `restoreMatchMedia()` in afterEach.
 * `setReducedMotion(true)` flips the preference and notifies "change" listeners, like the OS setting would.
 */
const realMatchMedia = window.matchMedia;
export function stubMatchMedia(initialReduce: boolean) {
  let reduce = initialReduce;
  const listeners = new Set<(e: { matches: boolean; media: string }) => void>();
  window.matchMedia = ((query: string) => {
    const isReduceQuery = /prefers-reduced-motion:\s*reduce/.test(query);
    const mql = {
      media: query,
      get matches() {
        return isReduceQuery ? reduce : false;
      },
      onchange: null,
      addEventListener: (_type: string, cb: (e: { matches: boolean; media: string }) => void) => listeners.add(cb),
      removeEventListener: (_type: string, cb: (e: { matches: boolean; media: string }) => void) => listeners.delete(cb),
      addListener: (cb: (e: { matches: boolean; media: string }) => void) => listeners.add(cb),
      removeListener: (cb: (e: { matches: boolean; media: string }) => void) => listeners.delete(cb),
      dispatchEvent: () => false,
    };
    return mql as unknown as MediaQueryList;
  }) as typeof window.matchMedia;
  return {
    listenerCount: () => listeners.size,
    setReducedMotion(value: boolean) {
      reduce = value;
      act(() => {
        listeners.forEach((cb) => cb({ matches: value, media: '(prefers-reduced-motion: reduce)' }));
      });
    },
  };
}

export function restoreMatchMedia() {
  window.matchMedia = realMatchMedia;
}

/** The slide currently exposed to assistive technology (hidden slides are excluded by role queries). */
export function currentSlide(): HTMLElement {
  const slides = screen.getAllByRole('group').filter((el: HTMLElement) => el.getAttribute('aria-roledescription') === 'slide');
  expect(slides).toHaveLength(1);
  return slides[0];
}
