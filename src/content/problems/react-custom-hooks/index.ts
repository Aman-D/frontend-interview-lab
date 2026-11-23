import type { CodingProblem } from '../../schema';
import starterHooks from './starter/hooks.ts?raw';
import app from './starter/App.tsx?raw';
import api from './starter/api.ts?raw';
import styles from './starter/styles.css?raw';
import solutionHooks from './solution/hooks.ts?raw';
import helpers from './tests/helpers.tsx?raw';
import publicTests from './tests/public.test.tsx?raw';
import hiddenTests from './tests/hidden.test.tsx?raw';

const shared = { '/App.tsx': app, '/api.ts': api, '/styles.css': styles };

const problem: CodingProblem = {
  schemaVersion: 1,
  kind: 'coding',
  id: 'react-custom-hooks',
  slug: 'custom-hooks',
  title: 'Custom Hooks: useDebounce, usePrevious, useSWR-lite',
  track: 'react',
  execution: 'react',
  difficulty: 'hard',
  priority: 'P1',
  seniority: ['Senior', 'SDE-2', 'SDE-3', 'MTS'],
  topics: ['custom hooks', 'effect cleanup', 'refs', 'useSyncExternalStore', 'stale-while-revalidate', 'request deduplication', 'race conditions'],
  estimatedMinutes: 60,
  conceptIds: ['react-effects', 'debouncing', 'fake-timers', 'closures', 'observer-pattern', 'race-conditions', 'referential-equality', 'async-ui-states', 'promises'],
  research: {
    provenance: 'PUBLISHED_PRACTICE_PROBLEM',
    frequencyConfidence: 'MEDIUM_CONFIDENCE',
    verificationStatus: 'SOURCES_VERIFIED',
    lastVerified: '2026-11-23',
    evidence: [
      { sourceId: 'bfe-react', url: 'https://bigfrontend.dev/react/useDebounce', originalTitle: '8. useDebounce()', note: 'Listed in the BFE.dev React problem list.' },
      { sourceId: 'bfe-react', url: 'https://bigfrontend.dev/react/usePrevious', originalTitle: '5. usePrevious()', note: 'Listed in the BFE.dev React problem list.' },
      { sourceId: 'bfe-react', url: 'https://bigfrontend.dev/react/useSWR-1', originalTitle: '4. useSWR() I', note: 'Listed in the BFE.dev React problem list.' },
    ],
    researchNotes:
      'One practice platform lists all three hooks as separate exercises (titles only were collected; no statements, solutions or tests were read or reused), hence MEDIUM confidence. This problem bundles them into one 60-minute exercise because together they cover the three hook building blocks interviewers probe: effect cleanup (debounce), refs vs render purity (previous), and an external store with subscriptions (SWR). The SWR part is deliberately "lite": a shared cache, deduplication while in flight, stale-while-revalidate on mount/key change, stale-key safety and mutate. Focus/reconnect revalidation, dedupe windows, retries and cache eviction are follow-ups. Statement, code and tests are original to this project.',
  },
  spec: {
    summary: 'Implement three production-grade custom hooks — a debounced value, the previous committed value, and a tiny stale-while-revalidate data hook with a shared, deduplicated cache.',
    description: `Implement three hooks in **hooks.ts** (React 18, no libraries).

### \`useDebouncedValue(value, delay)\`
Returns \`value\` once it has stopped changing for \`delay\` ms (trailing edge). The first render returns the initial value immediately; each change restarts the wait; changing \`delay\` restarts it too; no timer survives an unmount.

### \`usePrevious(value)\`
Returns the value from the **previous committed render** (\`undefined\` on the first render). A re-render with an unchanged value therefore returns that same value. It must be correct under \`<StrictMode>\`, which renders twice in development.

### \`useSWRLite(key, fetcher)\` → \`{ data, error, isLoading, mutate }\`
- A **module-level cache** keyed by \`key\` and shared by every component using that key: when data arrives, all of them update.
- **Stale-while-revalidate**: on mount and on every key change, return the cached data (if any) immediately and refetch in the background.
- **Deduplication**: while a request for a key is in flight, other mounts/revalidations for that key reuse it (one fetcher call).
- **Stale keys**: after \`key\` changes, a late response for the previous key must never appear (it may still fill the cache for that key).
- \`key === null\` means "don't fetch": \`data\` is undefined and \`isLoading\` is false.
- A new \`fetcher\` identity alone (inline arrow) does not refetch.
- \`error\` holds the last failure; previous \`data\` is kept (stale) when a revalidation fails.
- \`mutate()\` revalidates (deduplicated) and resolves with the fresh data. \`mutate(data)\` writes \`data\` into the shared cache **without** fetching; a response to a request that started **before** that write must not overwrite it.
- Export \`__resetSWRCache()\` so tests can isolate themselves (tests in one file share module state).

\`App.tsx\` and \`api.ts\` are read-only: the preview searches a mock API with two panels sharing one key (watch the console for request counts).`,
    technologies: ['React 18', 'TypeScript', 'useEffect / useRef / useSyncExternalStore', 'Promises'],
    learningObjectives: [
      'Use effect cleanup to cancel timers on change and unmount',
      'Explain when reading a ref during render is safe (written only after commit) and when it is not',
      'Build an external store with subscriptions and read it with useSyncExternalStore',
      'Deduplicate in-flight requests and make stale responses impossible by keying state by request key',
      'Order a local mutation against in-flight requests (version / timestamp check)',
    ],
    clarifications: [
      { question: 'useDebouncedValue: leading or trailing? Should the first render wait?', why: 'Leading-edge debounce or an initial wait change what the first paint shows and how tests are written.', defaultAssumption: 'Trailing only; the initial value is returned immediately.' },
      { question: 'usePrevious: previous render, or previous different value?', why: 'They differ when the component re-renders for another reason: "previous render" then returns the current value; "previous distinct value" keeps the older one.', defaultAssumption: 'Previous committed render (the classic ref + effect hook). The distinct-value variant is discussed as an alternative.' },
      { question: 'useSWRLite: how long does deduplication last — only while in flight, or a time window?', why: 'Real SWR deduplicates within a 2 s window; a pure in-flight rule is simpler and deterministic.', defaultAssumption: 'Only while a request is in flight; every mount or key change after that revalidates in the background.' },
      { question: 'What does mutate(data) do — local write only, or write and revalidate?', why: 'SWR revalidates after mutate(data) by default; a local-only write is easier to reason about in an interview.', defaultAssumption: 'mutate(data) is a local write to the shared cache; mutate() with no arguments revalidates.' },
      { question: 'Is the cache bounded? Is it cleared on logout?', why: 'An unbounded module-level Map leaks across navigation and across users on a shared device.', defaultAssumption: 'Unbounded for the exercise, with __resetSWRCache() for tests; eviction and per-user scoping are follow-ups.' },
    ],
    scopeDecisions: [
      'No focus/reconnect revalidation, polling, retries with backoff or dedupe time window.',
      'No cache eviction/GC; entries live for the page lifetime (reset via __resetSWRCache()).',
      'No Suspense mode, no SSR fallback data and no keepPreviousData option.',
      'Keys are strings (no array/object keys or serialisation).',
      'Requests are not aborted (the fetcher takes only the key); correctness comes from keying state by request key and versioning.',
    ],
    requirements: [
      { id: 'debounce-trailing', category: 'functional', level: 'MUST', text: '`useDebouncedValue` returns the initial value immediately and later only the last value of a burst, `delay` ms after the last change.' },
      { id: 'debounce-cleanup', category: 'technical', level: 'MUST', text: 'Each change (or `delay` change) cancels the previous timer; unmount leaves no pending timer; re-renders with an unchanged value do not restart the wait.' },
      { id: 'previous-committed', category: 'functional', level: 'MUST', text: '`usePrevious` returns `undefined` on the first render and the previous committed render\'s value afterwards (same value on an unrelated re-render).' },
      { id: 'previous-strict', category: 'edge-case', level: 'MUST', text: '`usePrevious` is correct under StrictMode double rendering (the ref is written after commit, not during render).' },
      { id: 'swr-basic', category: 'functional', level: 'MUST', text: '`useSWRLite` is loading on the first render, calls `fetcher(key)` and then exposes `data`; failures expose `error`.' },
      { id: 'swr-null-key', category: 'edge-case', level: 'MUST', text: '`key === null` does not fetch, has no data and is not loading.' },
      { id: 'swr-shared-cache', category: 'technical', level: 'MUST', text: 'A module-level cache is shared by all components using the same key; a response updates all of them.' },
      { id: 'swr-dedupe', category: 'performance', level: 'MUST', text: 'Concurrent uses of a key (same commit, later mounts, StrictMode double effects, repeated `mutate()`) share one in-flight request.' },
      { id: 'swr-swr', category: 'functional', level: 'MUST', text: 'On remount or switching back to a key, cached data is shown immediately (no loading state) and revalidated in the background.' },
      { id: 'swr-stale-key', category: 'technical', level: 'MUST', text: 'After `key` changes, the previous key\'s data or late response never appears; a new key with no cache is loading.' },
      { id: 'swr-stale-error', category: 'edge-case', level: 'SHOULD', text: 'A failed revalidation keeps the previous data and sets `error`; a successful one clears `error`.' },
      { id: 'swr-mutate', category: 'functional', level: 'MUST', text: '`mutate()` revalidates and resolves with the fresh data; `mutate(data)` updates every subscriber without fetching.' },
      { id: 'swr-mutate-race', category: 'edge-case', level: 'SHOULD', text: 'A response to a request that started before `mutate(data)` does not overwrite the local write.' },
      { id: 'swr-fetcher-identity', category: 'technical', level: 'SHOULD', text: 'A new `fetcher` identity alone does not trigger a refetch.' },
      { id: 'swr-reset', category: 'testing', level: 'MUST', text: 'Export `__resetSWRCache()` that clears the cache, so tests in one file are isolated.' },
      { id: 'tests', category: 'testing', level: 'SHOULD', text: 'Hooks are tested through small harness components with fake timers and manually settled promises.' },
    ],
    constraints: ['React 18 only (no React 19 `use`, no libraries such as SWR or TanStack Query).', 'Keep the exported names and signatures in hooks.ts.', 'No reading or writing refs during render except in usePrevious\'s read (explain why it is safe).'],
    acceptanceCriteria: [
      'All public tests pass (debounce burst + unmount, usePrevious sequence, SWR loading → data, null key, concurrent dedupe, stale key).',
      'All hidden tests pass (debounce delay change and unrelated re-renders, usePrevious under StrictMode and local state, cached remount, key switching, later-mount + StrictMode dedupe, stale data on error, mutate(data) vs in-flight response, mutate() dedupe, fetcher identity, cache reset).',
      'Manual: in the preview, two panels with the same query cause one request in the console.',
    ],
    examples: [
      { title: 'Debounce burst', input: 'value a → b (t=0) → c (t=200), delay 300', output: 'renders a until t=500, then c; b is never returned' },
      { title: 'usePrevious', input: 'renders with 1, 2, 3, 3', output: 'undefined, 1, 2, 3' },
      { title: 'Stale key', input: 'key /user/1 (pending) → /user/2; /user/2 resolves "Grace", then /user/1 resolves "Ada"', output: 'data stays "Grace"', explanation: 'State is read from the cache entry of the current key, so a response for /user/1 only fills /user/1\'s entry.' },
      { title: 'Local write vs in-flight request', input: 'mutate() starts request #2; mutate("2 (local)"); request #2 resolves "1 (old server)"', output: 'data stays "2 (local)"', explanation: 'The entry\'s version changed after request #2 started.' },
    ],
    manualTests: [
      'Type quickly in the preview: the debounced query (and the request log) only changes after you pause.',
      'Watch "previous committed" lag one committed render behind the debounced query.',
      'With both panels mounted, one request per query appears in the console.',
      'Uncheck and re-check the second panel: it shows cached results immediately, then revalidates.',
      'Search "error" to see the error state; use Reverse locally (mutate(data)) and Revalidate (mutate()).',
    ],
  },
  files: {
    entry: '/App.tsx',
    starter: { ...shared, '/hooks.ts': starterHooks },
    solution: { ...shared, '/hooks.ts': solutionHooks },
    readonly: ['/App.tsx', '/api.ts'],
    support: {},
  },
  tests: [
    { path: '/tests/helpers.tsx', visibility: 'public', kind: 'runtime', source: helpers },
    { path: '/tests/public.test.tsx', visibility: 'public', kind: 'runtime', source: publicTests },
    { path: '/tests/hidden.test.tsx', visibility: 'hidden', kind: 'runtime', source: hiddenTests },
  ],
  hints: [
    '`useDebouncedValue`: `useState(value)` plus an effect on `[value, delay]` that sets a timer to copy `value` into state; the cleanup clears the timer. The cleanup runs before the next effect and on unmount, which gives you both "restart" and "no leak".',
    '`usePrevious`: `useRef()`, write `ref.current = value` in an effect with no dependency array, and return `ref.current` from render. Do not assign the ref during render: StrictMode renders twice and the second render would see the value you just wrote.',
    '`useSWRLite` store: `Map<key, { state, listeners, inflight }>` at module level. `state` is an immutable object replaced on every change; `write()` replaces it and calls every listener. Read it with `useSyncExternalStore(subscribe, getSnapshot)` where both are memoised on `key` — then a response for an old key can only change the old key\'s entry.',
    'Revalidation: in an effect on `[key]` call `revalidate(key, fetcherRef.current)`, which returns the existing `inflight` promise if there is one, else starts the fetch and clears `inflight` when it settles. For `mutate(data)`, bump a per-entry `version`; a request remembers the version it started with and drops its result if the version has changed.',
  ],
  solution: {
    initialApproach: 'Treat each hook as a small piece of lifecycle: the debounce is an effect whose cleanup cancels the previous timer; usePrevious is a ref written after commit; useSWRLite is an external store (a module-level Map with subscriptions) that components read through useSyncExternalStore, with revalidation triggered by an effect keyed on `key`.',
    bruteForce: 'A naive useSWR keeps `data` in useState and does `fetcher(key).then(setData)` in an effect. It refetches in every component (no sharing, no dedupe), shows the previous key\'s data while loading the new one, lets a late response for an old key overwrite the new one, and loses everything on unmount. Patching it with "ignore if key changed" flags fixes one bug at a time; moving the state into a keyed store removes the whole class.',
    optimizedApproach: `**useDebouncedValue** — state + effect on \`[value, delay]\`: \`setTimeout(() => setDebounced(value), delay)\`, cleanup \`clearTimeout\`. The effect only re-runs when the value or delay changes, so unrelated re-renders do not restart the wait.

**usePrevious** — \`ref.current\` is assigned in an effect (after commit) and read during render. Discarded renders never run effects, so the ref always holds the last *committed* value, which is exactly the contract.

**useSWRLite** — a store:
- \`cache: Map<string, Entry>\`, \`Entry = { state: { data, error, isValidating }, listeners, inflight: { promise, version } | null, version }\`.
- \`write(entry, patch)\` replaces \`state\` (new object → useSyncExternalStore sees a change) and notifies listeners.
- \`revalidate(key, fetcher)\` returns the in-flight promise if it started at the current version (**dedupe**); otherwise calls the fetcher, marks \`isValidating\`, and on settle writes \`data\`/\`error\` **unless the version changed** (a local \`mutate(data)\` happened).
- The hook subscribes with \`useSyncExternalStore(subscribe, getSnapshot)\`, both memoised on \`key\`, so it always reads the **current key's** entry: stale-key bugs become impossible rather than guarded against.
- An effect on \`[key]\` (not on \`fetcher\`) calls \`revalidate\` with the latest fetcher from a ref: cached data renders first, the refresh happens in the background (**stale-while-revalidate**).
- \`isLoading = key !== null && data === undefined && (isValidating || error === undefined)\` — true on the very first render (before the effect starts the request), false after an error without retry.`,
    walkthrough: `1. **Debounce**: the first render returns \`useState(value)\`'s initial value. Changing \`value\` re-runs the effect: React first runs the previous cleanup (clearing the old timer), then schedules a new one. When the timer fires, \`setDebounced(value)\` uses the value captured by that effect's closure — the latest one.
2. **usePrevious**: render 1 reads \`undefined\` and the effect stores 1; render 2 reads 1 and the effect stores 2. Under StrictMode both renders of an update read the same ref (effects have not run yet), and the effect stores the committed value once.
3. **Cache entry**: \`entryFor(key)\` lazily creates \`{ state: EMPTY, listeners: new Set(), inflight: null, version: 0 }\`. \`EMPTY\` is a frozen shared object, so \`getSnapshot\` is stable for unknown keys.
4. **Subscribe**: adds the listener to the key's entry and returns an unsubscribe. Because \`subscribe\` changes with \`key\`, React re-subscribes when the key changes and reads the new entry's snapshot synchronously in the same render.
5. **Revalidate**: \`new Promise(r => r(fetcher(key)))\` calls the fetcher synchronously and converts a synchronous throw into a rejection. Both outcomes are handled inside the chain, so the shared promise always resolves (data or undefined) and never produces an unhandled rejection.
6. **Settling**: clear \`inflight\` if it is still ours; if \`entry.version\` moved on, only update \`isValidating\`; otherwise write \`{ data, error: undefined }\` or \`{ error }\` (keeping stale data).
7. **mutate**: no arguments → \`revalidate\` (deduplicated, returns the promise); with an argument → \`version++\` and write the data for every subscriber. \`args.length\` distinguishes \`mutate()\` from \`mutate(undefined)\`.
8. **__resetSWRCache**: \`cache.clear()\`; requests still in flight write into their detached entries, which nobody reads.`,
    complexity: 'Debounce and usePrevious are O(1) per render. For SWR, reading a snapshot is O(1); a write notifies the k subscribers of that key, O(k). Memory is O(number of keys ever used) because the cache is unbounded — production versions need eviction (LRU or GC of entries with no subscribers after a TTL).',
    edgeCases: '- Value changes back to the current debounced value before the delay → the timer sets the same value; React bails out.\n- `delay` changes mid-wait → the wait restarts with the new delay.\n- Inline object/array values for useDebouncedValue have a new identity each render → the timer restarts on every render; memoise the value or debounce a primitive.\n- usePrevious with `undefined` as a real value is indistinguishable from "first render" — return a sentinel or `{ hasPrevious, value }` if that matters.\n- SWR: StrictMode mounts effects twice → deduplicated to one request.\n- Two components with the same key mount in one commit → the second effect finds the first in-flight request.\n- Fetcher throws synchronously → becomes `error`.\n- A fetcher that resolves `undefined` is indistinguishable from "no data" (isLoading stays true) — document that fetchers must resolve a value.\n- `mutate()` on a null key → resolves undefined, does nothing.\n- Switching to `null` → idle; switching back → cached data at once.',
    alternatives: '- **usePrevious via state** (React docs\' "storing information from previous renders"): keep `[prev, setPrev]` and `[last, setLast]`; when `value !== last`, call both setters during render. Pure (no ref reads), but it tracks the previous *distinct* value and costs an extra render.\n- **Reading refs during render** is discouraged by the React docs because it makes output depend on something React does not track; it is acceptable here only because the ref is never written during render and its value is a pure function of commit history. The React Compiler\'s lint rules still flag it — the state-based variant is compiler-friendly.\n- **useState + useEffect store** instead of useSyncExternalStore: works, but you must handle subscribe-after-render gaps and tearing yourself; uSES is the API React provides for external stores (and is concurrent-safe).\n- **AbortController** per request: cancels network work when nobody needs it any more (no subscribers), but with deduplication you can only abort when the *last* subscriber leaves.\n- **Real libraries**: SWR / TanStack Query add dedupe windows, focus/reconnect revalidation, retries with backoff, GC, optimistic mutations with rollback and Suspense integration. React 19\'s `use(promise)` with a cache is another route for Suspense-based data.',
    tradeoffs: '- In-flight-only dedupe is deterministic but a list of 20 rows mounting one after another may still revalidate often; a time window (SWR\'s 2 s) trades freshness for fewer requests.\n- Revalidate-on-mount keeps data fresh but costs requests; per-key `staleTime` (TanStack Query) avoids refetching data known to be fresh.\n- Local-only `mutate(data)` is predictable; write-and-revalidate is safer when the server may transform the data.\n- A global module cache is simple and shared, but leaks across users/tests — a provider-scoped cache (context) is more flexible (SSR, tests, multi-tenant).\n- Keeping stale data on error favours availability; some UIs must hide stale data (e.g. permissions changed).',
    commonMistakes: '- Debounce: creating a new debounced function every render, or forgetting the cleanup so every keystroke eventually fires.\n- Debounce: depending on an inline object so the timer restarts forever.\n- usePrevious: assigning `ref.current = value` during render — wrong under StrictMode/concurrent rendering.\n- SWR: storing `data` in useState per component (no sharing; stale key overwrites).\n- SWR: putting `fetcher` in the effect deps, refetching on every render when callers pass an inline arrow.\n- SWR: mutating the cached state object in place — useSyncExternalStore compares snapshots by identity and will not re-render (or will loop if getSnapshot returns a new object every call).\n- SWR: returning a fresh `{}` from getSnapshot each call ("The result of getSnapshot should be cached" infinite loop).\n- SWR: forgetting that a request started before a local write can resolve after it.\n- Not resetting module state between tests, so tests pass or fail depending on order.',
    testingStrategy: 'Test hooks through tiny harness components that render the hook\'s output as text (and record renders when order matters), never by calling hooks outside components. Use fake timers to step debounce boundaries exactly (299 ms vs 300 ms) and `timers.pendingCount()` to prove cleanup. Use a fetcher that returns manually settled promises so responses can be delivered out of order. Render in `<StrictMode>` to expose render-phase side effects (usePrevious) and double effects (dedupe). Reset the module cache in `beforeEach` because test files share module state.',
    seniorFollowUps: '- Add revalidate-on-focus/reconnect: where do the window listeners live (once per store, not per component) and how do you avoid stampedes?\n- Add a dedupe window and `staleTime`; how do you test them with fake timers?\n- Cache GC: evict entries with zero subscribers after N minutes; LRU cap; clear on logout.\n- Optimistic `mutate(data, { rollbackOnError })` with a server call — how does the version check generalise?\n- SSR: `getServerSnapshot`, hydrating the cache with fallback data, avoiding cross-request cache sharing on the server.\n- Suspense mode: throw the in-flight promise (or React 19 `use`) — what changes for error handling and dedupe?\n- usePrevious under the React Compiler: why the lint rule flags ref reads in render, and the state-based alternative.',
  },
  followUps: [
    { id: 'f1', level: 'definition', question: 'What is stale-while-revalidate in a client data hook, and what does the user see on a remount?', expectedConcepts: ['serve cached data immediately', 'refetch in the background', 'update when fresh data arrives', 'no loading flash'], sourceIds: ['bfe-react'] },
    { id: 'f2', level: 'mechanism', question: 'Walk through when the debounce effect\'s cleanup runs for value changes a → b → c and an unmount. Why does the timer callback set the latest value?', expectedConcepts: ['cleanup before the next effect', 'cleanup on unmount', 'closure captures that effect run\'s value', 'dependency array [value, delay]'], sourceIds: ['react-sync-effects', 'mdn-debounce'] },
    { id: 'f3', level: 'application', question: 'The React docs say not to read refs during render. Why is usePrevious\'s ref read acceptable, and what alternative avoids it?', expectedConcepts: ['ref written only after commit', 'discarded renders do not run effects', 'StrictMode double render reads the same value', 'state-based previous-distinct-value pattern', 'compiler lint rule'], sourceIds: ['react-refs', 'react-custom-hooks'] },
    { id: 'f4', level: 'edge-cases', question: 'Why must getSnapshot return the same object between changes, and what happens if it returns `{ ...state }`?', expectedConcepts: ['comparison by Object.is', 'immutable snapshots replaced on write', 'infinite re-render / "getSnapshot should be cached" warning', 'tearing in concurrent rendering'], sourceIds: ['react-usesyncexternalstore'] },
    { id: 'f5', level: 'production', question: 'Your module-level cache works in the browser. What breaks with SSR and with a user logging out on a shared device?', expectedConcepts: ['server module state shared across requests', 'per-request cache / provider', 'getServerSnapshot and hydration', 'clear or scope cache per user', 'bounded memory'], sourceIds: ['react-usesyncexternalstore'] },
    { id: 'f6', level: 'architecture', question: 'Evolve useSWRLite into a data layer for a large app: revalidation policies, mutations with rollback, GC and devtools. What is the API?', expectedConcepts: ['provider-scoped cache', 'staleTime / dedupe window', 'focus and reconnect revalidation', 'optimistic mutations with versioning', 'GC of unused entries', 'observer pattern'], sourceIds: ['react-custom-hooks', 'react-usesyncexternalstore'] },
  ],
  mcqs: [
    {
      id: 'm1',
      question: 'This usePrevious is rendered inside <StrictMode> (development) and the prop changes from "x" to "y". What does it return in the committed render?',
      code: `function usePrevious(value) {
  const ref = useRef();
  const prev = ref.current;
  ref.current = value; // written during render
  return prev;
}`,
      options: [
        { id: 'a', text: '"x"', explanation: 'That is what the first of the two renders returns, but StrictMode renders again and that second result is the one committed.' },
        { id: 'b', text: '"y" — the second render reads the value the first render just wrote', explanation: 'Correct — writing a ref during render is a side effect, and double rendering exposes it. Writing it in an effect fixes this.' },
        { id: 'c', text: 'undefined', explanation: 'The ref is preserved across renders of a mounted component; it is not reset.' },
        { id: 'd', text: 'It throws an error in StrictMode', explanation: 'React does not throw for ref writes; it just makes the bug visible.' },
      ],
      correctOptionId: 'b',
      explanation: 'Rendering must be pure. StrictMode calls the component twice to surface impure renders; a ref assigned during render leaks the first call\'s write into the second.',
      sourceIds: ['react-refs'],
    },
    {
      id: 'm2',
      question: 'A component calls `useSyncExternalStore(subscribe, () => ({ ...store.state }))`. What happens?',
      options: [
        { id: 'a', text: 'It works, just with an extra allocation', explanation: 'React compares snapshots with Object.is, so a new object every call looks like a change every time.' },
        { id: 'b', text: 'React re-renders endlessly / warns that the result of getSnapshot should be cached', explanation: 'Correct — getSnapshot must return the same value until the store actually changes.' },
        { id: 'c', text: 'The component never updates when the store changes', explanation: 'The opposite problem: mutating the snapshot in place would cause missed updates.' },
        { id: 'd', text: 'It only fails during server rendering', explanation: 'The issue occurs on the client; server rendering additionally needs getServerSnapshot.' },
      ],
      correctOptionId: 'b',
      explanation: 'Keep the snapshot immutable and replace it on write, so identity changes exactly when data changes.',
      sourceIds: ['react-usesyncexternalstore'],
    },
    {
      id: 'm3',
      question: 'Components A and B mount in the same commit with key "/me". Request deduplication is implemented by storing the in-flight promise per key. How many times is the fetcher called, and why?',
      options: [
        { id: 'a', text: 'Twice — each component has its own effect', explanation: 'Each effect runs, but the second finds the promise the first stored and reuses it.' },
        { id: 'b', text: 'Once — the first effect stores the in-flight promise synchronously; the second effect reuses it', explanation: 'Correct — effects run one after another in the same flush, and the in-flight entry is set before the first returns.' },
        { id: 'c', text: 'Zero until one of them re-renders', explanation: 'The effect runs after the mount commit; no re-render is needed.' },
        { id: 'd', text: 'It depends on which component renders faster', explanation: 'Effects for one commit run in a deterministic order.' },
      ],
      correctOptionId: 'b',
      explanation: 'Deduplication works because the in-flight promise is recorded synchronously when the request starts, before any other effect in the same commit runs.',
      sourceIds: ['react-sync-effects'],
    },
  ],
};

export default problem;
