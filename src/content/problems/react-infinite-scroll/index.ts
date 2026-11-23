import type { CodingProblem } from '../../schema';
import starterFeed from './starter/InfiniteFeed.tsx?raw';
import types from './starter/types.ts?raw';
import api from './starter/api.ts?raw';
import app from './starter/App.tsx?raw';
import styles from './starter/styles.css?raw';
import solutionFeed from './solution/InfiniteFeed.tsx?raw';
import helpers from './tests/helpers.ts?raw';
import publicTests from './tests/public.test.tsx?raw';
import hiddenTests from './tests/hidden.test.tsx?raw';

const shared = { '/App.tsx': app, '/types.ts': types, '/api.ts': api, '/styles.css': styles };

const problem: CodingProblem = {
  schemaVersion: 1,
  kind: 'coding',
  id: 'react-infinite-scroll',
  slug: 'infinite-scroll-feed',
  title: 'Infinite Scroll Feed',
  track: 'react',
  execution: 'react',
  difficulty: 'medium',
  priority: 'P0',
  seniority: ['Senior', 'SDE-2', 'SDE-3', 'MTS'],
  topics: ['IntersectionObserver', 'cursor pagination', 'request de-duplication', 'AbortController', 'StrictMode', 'async UI states', 'APG feed pattern'],
  estimatedMinutes: 60,
  conceptIds: ['observer-pattern', 'abort-controller', 'race-conditions', 'async-ui-states', 'react-effects', 'closures', 'aria-live-regions', 'keyboard-navigation', 'focus-management', 'react-reconciliation-keys', 'immutable-updates'],
  research: {
    provenance: 'PUBLISHED_PRACTICE_PROBLEM',
    frequencyConfidence: 'MEDIUM_CONFIDENCE',
    verificationStatus: 'SOURCES_VERIFIED',
    lastVerified: '2026-11-23',
    evidence: [
      { sourceId: 'fg-mc', url: 'https://www.frontendgeek.com/frontend-interview/machine-coding-interview', originalTitle: 'Infinite Scroll', note: 'Listed first under "Component machine coding" (the same list also names "Pagination").' },
    ],
    researchNotes:
      'One curated machine-coding hub lists "Infinite Scroll" by title only; nothing beyond the title was used. Confidence is MEDIUM because only a single source names it, although the underlying skills (IntersectionObserver, cursor pagination, cancellation) are well documented. The 60-minute scope chosen here is the part that separates senior answers: a single-flight loader that is safe against duplicate observer notifications and the StrictMode mount/unmount/mount cycle, re-arming the observer after short pages, cancellation on unmount, de-duplication of overlapping pages, explicit loading/error/empty/end states and the WAI-ARIA feed pattern (informed by MDN on IntersectionObserver and AbortController, and the APG feed pattern). Virtualising the loaded items, scroll restoration on back navigation, bidirectional loading and pull-to-refresh are discussed as follow-ups, not built.',
  },
  spec: {
    summary: 'Build a cursor-paginated feed that loads pages as a sentinel nears the viewport, never double-fetches a cursor, cancels on unmount, de-duplicates items and follows the APG feed pattern.',
    description: `Implement the default export of **InfiniteFeed.tsx**. The types are in the read-only **types.ts**:

\`\`\`ts
type FetchPage = (cursor: string | null, signal: AbortSignal) => Promise<{ items: FeedItem[]; nextCursor: string | null }>;

<InfiniteFeed fetchPage={fetchPage} label="Latest posts" rootMargin="0px 0px 400px 0px" />
\`\`\`

Requirements:

1. **First page on mount.** Call \`fetchPage(null, signal)\` once when the feed mounts, then render each item as an \`<article>\` (title + body).
2. **Load on approach.** Render a sentinel element after the last item and watch it with an **IntersectionObserver** created inside an effect (pass the \`rootMargin\` prop; default \`"0px 0px 400px 0px"\`). When it intersects, request \`nextCursor\`. If the sentinel is *still* in range after a short page arrives, keep loading without waiting for another scroll.
3. **Single flight.** Never have two live requests at once, even if several observer notifications (or a notification and a click) arrive before React re-renders. Under \`<StrictMode>\` the mount → unmount → mount cycle must end with exactly **one** live request for the first page.
4. **End of feed.** When \`nextCursor\` is \`null\` show **"You're all caught up"**, stop observing and never request again. A \`nextCursor\` that was already loaded is treated as the end too (protects against a server loop).
5. **States.** While loading, a \`role="status"\` element says "Loading…" and the feed has \`aria-busy="true"\`. On failure show a \`role="alert"\` with the error message and a **Retry** button that re-requests the *same* cursor; existing items stay. An empty first page (\`[]\`, \`null\`) shows **"No posts yet"**.
6. **Cancellation.** Abort the in-flight request on unmount; responses (or AbortErrors) of aborted requests must never change the UI. A new \`fetchPage\` identity must not refetch anything — the next page simply uses the latest function.
7. **De-duplication.** Pages may overlap; render each id once (first occurrence wins).
8. **Fallback + a11y.** When idle, show a **Load more** \`<button>\` (keyboard users, and environments without \`IntersectionObserver\`, where the component must not crash). Follow the APG feed pattern: \`role="feed"\` labelled by \`label\` (default "Feed"); each article is focusable (\`tabIndex={0}\`), named by its title via \`aria-labelledby\`, and has \`aria-posinset\` (1-based) and \`aria-setsize\` (\`-1\` while more pages may exist, the total once the end is reached). **Page Down / Page Up** move focus to the next / previous article.

The preview uses a mock API with 700 ms latency that repeats one post per page and can be told to fail. \`App.tsx\`, \`api.ts\` and \`types.ts\` are read-only.`,
    technologies: ['React 18', 'TypeScript', 'IntersectionObserver', 'AbortController', 'WAI-ARIA feed pattern'],
    learningObjectives: [
      'Build a single-flight async loader whose guard lives in refs, not in render state',
      'Use IntersectionObserver correctly: create it in an effect, re-arm it, disconnect it, and know when it does (not) call back',
      'Make data fetching in effects StrictMode-safe with abort-and-release cleanup',
      'Model loading / idle / error / empty / end states explicitly and keep them accessible',
      'Apply the WAI-ARIA feed pattern (aria-busy, posinset/setsize, Page Up/Down) and decide when pagination is the better UX',
    ],
    clarifications: [
      { question: 'Is the API cursor-based or offset/page-number based?', why: 'Offset pagination shifts when items are inserted at the top (duplicates or gaps); cursors are stable. It also decides what "the same request" means for de-duplication.', defaultAssumption: 'Opaque string cursors; `null` requests the first page and a `null` nextCursor means the end. Pages may still overlap, so items are de-duplicated by id.' },
      { question: 'What is the scroll container — the window or an inner scrolling element?', why: 'IntersectionObserver needs the right `root`; an inner scroller with `root: null` observes against the viewport and fires at the wrong time.', defaultAssumption: 'The page (viewport) scrolls, so `root` is null and only `rootMargin` is configurable.' },
      { question: 'What should happen when a page fails — retry automatically or wait for the user?', why: 'Automatic retries on every intersection can hammer a failing server; silent failure looks like the end of the feed.', defaultAssumption: 'Stop and show an alert with a Retry button that re-requests the same cursor; keep already-loaded items. Backoff is a follow-up.' },
      { question: 'Must it work without IntersectionObserver and for keyboard users?', why: 'Keyboard users may never reach a footer that keeps moving; older/embedded browsers or tests may lack the API.', defaultAssumption: 'Always render a real "Load more" button while idle, and feature-detect `window.IntersectionObserver`.' },
      { question: 'Should a new `fetchPage` (e.g. a different filter) reset the feed?', why: 'Resetting on identity changes refetches on every parent render when callers pass inline functions.', defaultAssumption: 'No — the latest `fetchPage` is used for the next request. To reset, the parent changes `key` (the preview does this for "Reset feed").' },
    ],
    scopeDecisions: [
      'Loaded items are not virtualised; with thousands of posts you would combine this with a windowed list (see the Virtualized List problem).',
      'Only forward loading; no "new posts" banner, bidirectional loading or pull-to-refresh.',
      'Scroll restoration after back navigation is discussed, not implemented.',
      'Items render as title + body; a render prop for custom cards is a follow-up.',
      'No automatic retry/backoff: errors wait for the user to press Retry.',
    ],
    requirements: [
      { id: 'first-page', category: 'functional', level: 'MUST', text: 'On mount, request the first page with `fetchPage(null, signal)` and render items as `<article>` elements in order.' },
      { id: 'sentinel-observer', category: 'functional', level: 'MUST', text: 'An IntersectionObserver (created in an effect, using the `rootMargin` prop) watches a sentinel after the last item and requests `nextCursor` when it intersects.' },
      { id: 'single-flight', category: 'technical', level: 'MUST', text: 'At most one live request at a time; repeated notifications in the same tick, clicks during loading and StrictMode double effects never produce a second live request for a cursor.', acceptance: 'Three observer notifications in one act() → one request.' },
      { id: 'stop-at-end', category: 'functional', level: 'MUST', text: 'When `nextCursor` is null: show "You\'re all caught up", stop observing, hide Load more and never request again.' },
      { id: 'states', category: 'functional', level: 'MUST', text: 'Loading (role="status" text + aria-busy), error (role="alert" with the message + Retry re-requesting the same cursor, items kept) and empty ("No posts yet") states.' },
      { id: 'abort-on-unmount', category: 'technical', level: 'MUST', text: 'The in-flight request is aborted on unmount and its result or AbortError is ignored; the observer is disconnected.' },
      { id: 'refill-viewport', category: 'edge-case', level: 'SHOULD', text: 'If the sentinel is still in range after a short page, the next page loads without another scroll (re-arm the observer per page).' },
      { id: 'dedupe', category: 'edge-case', level: 'MUST', text: 'Items are de-duplicated by id across and within pages (first occurrence wins), so React keys stay unique.' },
      { id: 'cursor-loop', category: 'edge-case', level: 'SHOULD', text: 'A `nextCursor` that has already been loaded is treated as the end of the feed instead of looping.' },
      { id: 'latest-fetch', category: 'technical', level: 'SHOULD', text: 'A new `fetchPage` identity neither refetches nor resets; the next request uses the latest function (latest-ref pattern).' },
      { id: 'load-more-fallback', category: 'accessibility', level: 'MUST', text: 'A real "Load more" `<button>` is available while idle; without IntersectionObserver the feed still works through it.' },
      { id: 'feed-pattern', category: 'accessibility', level: 'MUST', text: 'role="feed" with an accessible name and aria-busy; focusable articles named via aria-labelledby with aria-posinset and aria-setsize (-1 until the total is known).' },
      { id: 'page-keys', category: 'accessibility', level: 'SHOULD', text: 'Page Down / Page Up move focus to the next / previous article.' },
      { id: 'feed-exit-keys', category: 'accessibility', level: 'OPTIONAL', text: 'Ctrl+End / Ctrl+Home move focus to the first focusable element after / before the feed (APG).' },
      { id: 'no-scroll-listener', category: 'performance', level: 'SHOULD', text: 'No scroll event listeners or layout reads per scroll frame; visibility comes from IntersectionObserver.' },
      { id: 'deterministic-tests', category: 'testing', level: 'SHOULD', text: 'Tests replace IntersectionObserver with a controllable fake and settle fetches with deferred promises; nothing depends on real layout or timing.' },
    ],
    constraints: ['React function components and hooks only.', 'No third-party libraries.', 'Do not change types.ts, api.ts or App.tsx.', 'Create the IntersectionObserver inside an effect (tests install a fake on `window`).'],
    acceptanceCriteria: [
      'All public tests pass (first page + aria-busy, sentinel + rootMargin, single flight, end of feed, error + Retry, empty state).',
      'All hidden tests pass (StrictMode, refilling a short viewport, de-duplication + cursor loop, unmount abort/disconnect, no-IntersectionObserver fallback, feed ARIA, Page Up/Down, new fetchPage identity).',
      'Manual: in the preview, scrolling quickly never logs the same cursor twice, and every post number appears exactly once.',
    ],
    examples: [
      { title: 'Overlapping pages', input: 'page 1: [a, b, c] next "c2"; page 2: [c, d] next null', output: 'articles a, b, c, d; "You\'re all caught up"', explanation: '"c" is rendered once; aria-setsize becomes 4.' },
      { title: 'Duplicate triggers', input: 'sentinel reports "intersecting" three times before React re-renders', output: 'one request for "c2"', explanation: 'The guard is a ref set synchronously when the request starts, not a `loading` state value.' },
      { title: 'Short page', input: 'page 2 has one item; sentinel still 200px below the viewport bottom (inside rootMargin)', output: 'page 3 is requested immediately', explanation: 'A newly observed target always gets an initial notification, so re-observing after each page refills the screen.' },
    ],
    manualTests: [
      'Scroll steadily: the request log shows each cursor once and the "Loading more posts…" text appears near the bottom.',
      'Click "Fail next request", then scroll: an alert with Retry appears; Retry loads the same page.',
      'Scroll to the end: "You\'re all caught up" appears and no further requests are logged.',
      'Tab into the feed and press Page Down repeatedly: focus moves article by article.',
      'Click "Reset feed" while a page is loading: the old request is aborted (no stale posts appear).',
      'With a screen reader, check that the feed and article positions ("3 of 8") are announced.',
    ],
  },
  files: {
    entry: '/App.tsx',
    starter: { ...shared, '/InfiniteFeed.tsx': starterFeed },
    solution: { ...shared, '/InfiniteFeed.tsx': solutionFeed },
    readonly: ['/App.tsx', '/types.ts', '/api.ts'],
    support: {},
  },
  tests: [
    { path: '/tests/helpers.ts', visibility: 'public', kind: 'runtime', source: helpers },
    { path: '/tests/public.test.tsx', visibility: 'public', kind: 'runtime', source: publicTests },
    { path: '/tests/hidden.test.tsx', visibility: 'hidden', kind: 'runtime', source: hiddenTests },
  ],
  hints: [
    'Model the feed as `{ items, status: "loading" | "idle" | "error" | "done", error }` in state, plus refs for things that must be correct synchronously: the next cursor, whether the end was reached, and the AbortController of the live request.',
    'Write one `loadMore()` (useCallback with no dependencies) that returns early if a request is live or the feed is done, otherwise stores a new AbortController in a ref *before* calling `fetchPage`. When the promise settles, ignore it unless the ref still holds that controller. A `loading` state check is not enough: two observer callbacks in one tick both see the old state.',
    'Mount effect: `loadMore(); return () => { inFlight.current?.abort(); inFlight.current = null; }`. Releasing the lock in cleanup is what makes StrictMode work: the first request is aborted, the second effect run starts the live one. Read `fetchPage` from a ref so its identity is not an effect dependency.',
    'Render the sentinel only while `status === "idle"` and create the observer in an effect that depends on that flag: every finished page re-observes a fresh sentinel, and IntersectionObserver reports the initial state of a new target — that refills short screens. Disconnect in cleanup, feature-detect `window.IntersectionObserver`, keep a Load more button, and put aria-busy / posinset / setsize on the feed and articles.',
  ],
  solution: {
    initialApproach: 'Treat the feed as a small state machine (loading → idle → loading … → done, with error as a detour) driven by one function, `loadMore()`, that every trigger calls: the mount effect, the observer, the Load more button and Retry. Correctness comes from making `loadMore` idempotent while a request is live, and from making every async result prove it is still current before it touches state.',
    bruteForce: 'The common first version keeps `loading` in state, attaches a `scroll` listener that checks `scrollTop + innerHeight >= scrollHeight - 200`, and calls `fetch(page + 1)` with `setItems([...items, ...data])`. It fires many requests per scroll gesture (the `loading` flag is stale until the next render), forces layout on every scroll event, never cancels, loses pages through the stale `items` closure, double-fetches under StrictMode, renders duplicate keys when pages overlap, and keeps polling after the last page.',
    optimizedApproach: `**State and refs**
- Render state: \`{ items, status, error }\`. Mutable truth that callbacks need *now*: \`cursorRef\` (next cursor), \`doneRef\`, \`loadedCursorsRef\` (Set), \`inFlightRef\` (the live AbortController or null), and \`fetchRef\` (latest \`fetchPage\`).

**Single-flight loader**
- \`loadMore = useCallback(() => { if (inFlightRef.current || doneRef.current) return; const c = new AbortController(); inFlightRef.current = c; … fetchRef.current(cursor, c.signal).then(onPage, onError) }, [])\`.
- Each settle handler starts with \`if (inFlightRef.current !== c) return\` — this single identity check covers aborts on unmount, StrictMode's discarded first request and AbortError rejections, so no error flashes after cancellation.
- On success: mark the cursor loaded, set \`done = next === null || loaded.has(next)\`, merge items with a functional update that skips seen ids.

**Mount + StrictMode**
- \`useEffect(() => { loadMore(); return () => { inFlightRef.current?.abort(); inFlightRef.current = null; }; }, [loadMore])\`. In StrictMode React runs setup → cleanup → setup: the first request is aborted, the lock is released, the second setup issues the one live request. Forgetting to release the lock leaves the feed stuck in "Loading…" in development only — a classic bug.

**Observer**
- Sentinel rendered only while \`status === "idle"\`; the observer effect depends on that flag and \`rootMargin\`. While loading there is nothing to observe; after each page a fresh sentinel is observed and IntersectionObserver delivers its *initial* state, so a short page that leaves the sentinel in range triggers the next load immediately — without scroll listeners or stale "was visible" flags.
- Feature-detect \`window.IntersectionObserver\`; the Load more button is always there when idle.

**Accessibility (APG feed)**
- \`role="feed"\` + \`aria-label\` + \`aria-busy\` during loads (assistive tech waits for the batch instead of announcing a half-rendered list). Articles: \`tabIndex=0\`, \`aria-labelledby\` → title, \`aria-describedby\` → body, \`aria-posinset\` and \`aria-setsize\` (-1 = unknown until the end). Page Down/Up move focus between articles. Loading/end text lives in a persistent \`role="status"\`; failures use \`role="alert"\`.`,
    walkthrough: `1. Mount: state is \`loading\`; the mount effect calls \`loadMore()\` → controller A stored, \`fetchPage(null, A.signal)\`.
2. (StrictMode only) cleanup aborts A and clears the lock; setup runs again → controller B, \`fetchPage(null, B.signal)\`. A's AbortError arrives later and fails the identity check.
3. B resolves \`{ items: [a, b, c], nextCursor: "c2" }\`: lock cleared, \`null\` marked loaded, cursor = "c2", state → idle with three articles.
4. Idle renders the sentinel; the observer effect observes it. The browser reports the initial state (say, not intersecting).
5. The user scrolls; the sentinel enters \`rootMargin\` → callback → \`loadMore()\` → controller C for "c2"; status → loading, the sentinel unmounts and its observer disconnects. Any extra callbacks in that tick hit the lock.
6. C resolves \`[c, d]\` with \`nextCursor: null\`: "c" is skipped, "d" appended, \`done = true\`, status → done. No sentinel, no button, aria-setsize = 4, status text "You're all caught up".
7. If C had rejected: lock cleared, status → error, alert + Retry. Retry calls the same \`loadMore()\`, which re-requests "c2" because the cursor only advances on success.
8. Unmount at any point: cleanup aborts the live controller; its settle handler sees a different (null) ref and does nothing.`,
    complexity: 'Each page merge is O(n + k) for n loaded items and k incoming (a Set of seen ids is rebuilt from `prev` inside the updater; keep a persistent Set only outside updaters if n gets large). Rendering is O(n) per commit — fine for hundreds of posts; beyond a few thousand, virtualise. Memory grows with loaded items. One observer and at most one request exist at any time.',
    edgeCases: `- Several observer notifications (or a notification + click) before re-render → one request (ref lock).
- StrictMode setup → cleanup → setup → one live request; the aborted one is ignored whether it resolves or rejects.
- Short pages that leave the sentinel in range → keep loading (fresh observation per page).
- \`nextCursor\` null on the first page with no items → "No posts yet", not "caught up".
- Overlapping or internally duplicated items → first occurrence wins.
- Server returns a cursor that was already loaded → end of feed instead of an infinite loop.
- \`fetchPage\` throws synchronously → treated like a rejection (error state).
- Error mid-feed → items kept, Retry re-requests the same cursor.
- Unmount mid-request or while idle → abort + disconnect, no state updates afterwards.
- No IntersectionObserver → no crash; Load more still works.`,
    alternatives: `- **Scroll listener + geometry check**: works everywhere but runs on every scroll frame and forces layout (\`scrollHeight\`), hurting INP; needs throttling and still has the duplicate-trigger problem.
- **A persistent observer + "is visible" ref**: re-check visibility after each page in an effect. Simpler observer code, but the ref is stale until the browser's next (asynchronous) notification, so it can over-fetch one page after content pushed the sentinel away.
- **\`useReducer\`** with actions REQUEST / SUCCESS / FAILURE: makes the state machine explicit and testable; the lock and cursor can live in the reducer state if you also guard against double dispatch.
- **Data libraries** (TanStack Query's \`useInfiniteQuery\`, SWR Infinite): caching, de-duplication of in-flight requests, refetch and back-navigation restoration out of the box; in an interview you should still be able to explain what they do.
- **Explicit pagination or a Load more button only**: often the better product choice (see trade-offs).`,
    tradeoffs: `- **Infinite scroll vs pagination**: infinite scroll suits browsing/discovery feeds; pagination wins for goal-oriented lists (search results, admin tables) where users compare, bookmark, share a URL, reach the footer or come back to "page 3". Infinite scroll also makes the footer unreachable and is harder for keyboard and screen-reader users — hence the Load more button.
- **rootMargin size**: bigger prefetch distance hides latency but fetches pages users never see (data cost on mobile); smaller saves requests but shows spinners.
- **Unmounting the sentinel while loading**: guarantees a fresh initial observation per page; costs one observer per page (negligible).
- **Keeping everything in the DOM**: simple and accessible (find-in-page, screen-reader browse mode) but memory and style/layout cost grow; virtualisation fixes that and breaks find-in-page.
- **Scroll anchoring**: browsers keep the viewport stable when content is inserted *above* (CSS \`overflow-anchor\`); appending below needs nothing, but a "new posts" insertion at the top relies on it.`,
    commonMistakes: `- Guarding with \`if (loading) return\` where \`loading\` is state — stale inside observer callbacks and between two notifications in the same tick.
- Not releasing the lock in the effect cleanup → StrictMode dev builds stay "Loading…" forever.
- Aborting but still applying the result (no "is this still the current request?" check), or showing an error for the AbortError.
- \`useEffect(load, [fetchPage])\` with an inline \`fetchPage\` → refetches the first page on every parent render.
- \`setItems([...items, ...page.items])\` from a stale closure, or mutating a "seen ids" Set inside a state updater (StrictMode double-invokes updaters and the second call drops everything).
- Creating the observer at module scope or in render, never disconnecting it, or observing a node that has been replaced.
- Expecting the observer to call back again while the sentinel stays visible — it only reports changes (plus the initial state).
- Using offset pagination and index keys; overlapping pages then produce duplicate-key warnings and reused DOM.
- Retrying automatically on every intersection after an error.
- Forgetting \`aria-busy\`, focusable articles or any non-scroll way to load more.`,
    testingStrategy: 'Replace `window.IntersectionObserver` with a fake that follows the real delivery rules (initial notification on observe, then only on changes) and exposes `setIntersecting(bool)` plus `burst(n)` for several notifications inside one `act()`. Make `fetchPage` a mock returning deferred promises so each test decides when and how a page settles, then `await flush()`. Assert on requests (count, cursor, `signal.aborted`) and on roles: `feed` with aria-busy, `article` posinset/setsize, `status`, `alert`, the Load more button. Cover StrictMode by rendering inside `<StrictMode>` and counting *live* (non-aborted) calls. Mutation-test the guard (remove the ref check), the cleanup (no abort / no disconnect) and the end condition. Real-layout tests (an actual scroll container with real IntersectionObserver) belong in an e2e suite, since real callbacks are asynchronous and not act-wrapped.',
    seniorFollowUps: `- Restore the scroll position and loaded pages after navigating to a post and back (cache pages by cursor, \`history.scrollRestoration = "manual"\`, restore after the list renders).
- Thousands of posts: combine with windowing; how do aria-setsize/posinset and find-in-page behave then?
- Bidirectional feeds (chat history): loading *above* the viewport and keeping position with scroll anchoring or manual compensation.
- "N new posts" banner when the head of the feed changes, without jumping the reader.
- Retry with exponential backoff + jitter, and offline handling with \`navigator.onLine\` / \`online\` events.
- Prefetch the next page during idle time and cancel it if the user navigates away.`,
  },
  followUps: [
    { id: 'f1', level: 'definition', question: 'What does IntersectionObserver report, and what do `root`, `rootMargin` and `threshold` control?', expectedConcepts: ['asynchronous callback when the intersection crosses a threshold', 'initial notification on observe', 'root = viewport or a scrolling ancestor', 'rootMargin grows/shrinks the root box to prefetch early', 'threshold list of ratios'], sourceIds: ['mdn-intersection-observer'] },
    { id: 'f2', level: 'mechanism', question: 'Under StrictMode in development, walk through what happens to your first-page request, and why the feed does not end up with two copies of page 1.', expectedConcepts: ['setup → cleanup → setup', 'cleanup aborts and releases the lock', 'second setup issues the live request', 'stale result fails the identity check', 'same behaviour as a real fast remount'], sourceIds: ['react-sync-effects', 'mdn-abortcontroller'] },
    { id: 'f3', level: 'application', question: 'Two observer callbacks arrive in the same frame and both call `loadMore()`. Why does `if (loading) return` not prevent a duplicate request, and what does?', expectedConcepts: ['state is a snapshot until re-render', 'closures capture the old value', 'ref set synchronously before fetching', 'single-flight / in-flight map keyed by cursor'], sourceIds: ['react-useeffect', 'react-queueing'] },
    { id: 'f4', level: 'edge-cases', question: 'The first page only fills half the screen. Why might a naive implementation never load page 2, and how do you fix it without a scroll listener?', expectedConcepts: ['observer fires only on changes', 'sentinel stays intersecting', 're-observe a fresh target per page (initial notification)', 'or check geometry after commit', 'avoid over-fetching'], sourceIds: ['mdn-intersection-observer'] },
    { id: 'f5', level: 'production', question: 'Product asks for infinite scroll on search results. What concerns would you raise, and what would you build instead or in addition?', expectedConcepts: ['unreachable footer', 'no shareable position / page URL', 'back-button restoration', 'keyboard and screen-reader users', 'Load more or pagination', 'APG feed pattern'], sourceIds: ['apg-feed', 'mdn-overflow-anchor'] },
    { id: 'f6', level: 'architecture', question: 'Design the data layer for a social feed used on several screens: caching pages, restoring scroll after navigation, real-time new posts and very long sessions.', expectedConcepts: ['normalised cache keyed by id', 'pages keyed by cursor', 'scroll restoration + scroll anchoring', 'windowing for long sessions', 'new-posts buffer instead of auto-insert', 'request de-duplication and cancellation'], sourceIds: ['apg-feed', 'mdn-overflow-anchor', 'webdev-virtualize'] },
  ],
  mcqs: [
    {
      id: 'm1',
      question: 'An IntersectionObserver watches a sentinel. The first page is short, so the sentinel is intersecting when the page renders and stays intersecting while page 2 loads and renders. Assuming one persistent observer, how many times does the callback report `isIntersecting: true`?',
      options: [
        { id: 'a', text: 'Once — the initial notification after observe(); nothing more while it stays intersecting', explanation: 'Correct — notifications happen on observe() and when the intersection crosses a threshold, not continuously while it remains visible.' },
        { id: 'b', text: 'Once per animation frame while it is visible', explanation: 'That is how a polling/rAF loop behaves, not IntersectionObserver.' },
        { id: 'c', text: 'Once per page that renders, because the DOM changed', explanation: 'DOM changes alone do not trigger a callback; only threshold crossings do.' },
        { id: 'd', text: 'Never — the target must first leave the root', explanation: 'A newly observed target always gets an initial notification.' },
      ],
      correctOptionId: 'a',
      explanation: 'This is why a feed can stall after a short page: no new notification arrives. Re-observing a fresh sentinel after each page (or re-checking geometry) fixes it.',
      sourceIds: ['mdn-intersection-observer'],
    },
    {
      id: 'm2',
      question: 'Which cleanup makes a "fetch first page on mount" effect correct under StrictMode and on real unmounts?',
      code: `const inFlight = useRef<AbortController | null>(null);
useEffect(() => {
  loadMore(); // returns early if inFlight.current is set
  return /* ??? */;
}, [loadMore]);`,
      options: [
        { id: 'a', text: '`() => {}` — StrictMode double effects only happen in development, so ignore them', explanation: 'The second setup is blocked by the lock and the first request is never cancelled; real unmounts leak the request.' },
        { id: 'b', text: '`() => inFlight.current?.abort()`', explanation: 'Close, but the lock stays set, so the second setup returns early and the feed waits forever for an aborted request.' },
        { id: 'c', text: '`() => { inFlight.current?.abort(); inFlight.current = null; }` and ignore results whose controller is no longer current', explanation: 'Correct — cancel, release the lock, and let stale results fail the identity check.' },
        { id: 'd', text: 'Use a module-level `let started = false` so the effect only fetches once per page load', explanation: 'That breaks remounts (a second feed instance or navigating back never loads) and leaks state across tests.' },
      ],
      correctOptionId: 'c',
      explanation: 'React expects effects to be symmetric: cleanup undoes setup. For fetching that means abort + release, plus ignoring late results.',
      sourceIds: ['react-sync-effects', 'mdn-abortcontroller'],
    },
    {
      id: 'm3',
      question: 'In the APG feed pattern, what is the purpose of `aria-busy="true"` on the feed while a page is being added?',
      options: [
        { id: 'a', text: 'It tells assistive technology that the feed is updating, so it can defer processing changes until the batch is complete', explanation: 'Correct — set it before inserting/removing articles and clear it when done.' },
        { id: 'b', text: 'It disables pointer events on the feed', explanation: 'ARIA attributes do not change behaviour; they only expose semantics.' },
        { id: 'c', text: 'It announces "busy" assertively like role="alert"', explanation: 'aria-busy is not a live-region announcement.' },
        { id: 'd', text: 'It is required on every article to mark which ones are new', explanation: 'aria-busy belongs on the container being updated.' },
      ],
      correctOptionId: 'a',
      explanation: 'The feed pattern combines aria-busy during loads with focusable articles that carry aria-posinset/aria-setsize (-1 when the total is unknown).',
      sourceIds: ['apg-feed'],
    },
  ],
};

export default problem;
