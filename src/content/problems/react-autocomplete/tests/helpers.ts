// Test helper: a controllable fake API. Each call returns a promise you resolve manually,
// so tests can deliver responses in any order.
export function createFakeApi(options: { rejectOnAbort?: boolean } = {}) {
  const calls: { query: string; signal: AbortSignal; resolve: (v: string[]) => void; reject: (e: unknown) => void }[] = [];
  const api = fn((query: string, signal: AbortSignal) => {
    const d = deferred();
    calls.push({ query, signal, resolve: d.resolve, reject: d.reject });
    if (options.rejectOnAbort) {
      signal.addEventListener('abort', () => d.reject(new DOMException('Aborted', 'AbortError')));
    }
    return d.promise as Promise<string[]>;
  });
  return { api, calls };
}

export function type(input: HTMLElement, value: string) {
  fireEvent.change(input, { target: { value } });
}
