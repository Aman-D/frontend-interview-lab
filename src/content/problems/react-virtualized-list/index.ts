import type { CodingProblem } from '../../schema';
import starterList from './starter/VirtualList.tsx?raw';
import starterVirtual from './starter/virtual.ts?raw';
import types from './starter/types.ts?raw';
import app from './starter/App.tsx?raw';
import styles from './starter/styles.css?raw';
import solutionList from './solution/VirtualList.tsx?raw';
import solutionVirtual from './solution/virtual.ts?raw';
import helpers from './tests/helpers.tsx?raw';
import virtualTests from './tests/virtual.test.ts?raw';
import publicTests from './tests/public.test.tsx?raw';
import hiddenTests from './tests/hidden.test.tsx?raw';

const shared = { '/App.tsx': app, '/types.ts': types, '/styles.css': styles };

const problem: CodingProblem = {
  schemaVersion: 1,
  kind: 'coding',
  id: 'react-virtualized-list',
  slug: 'virtualized-list',
  title: 'Virtualized List',
  track: 'react',
  execution: 'react',
  difficulty: 'hard',
  priority: 'P1',
  seniority: ['Senior', 'SDE-2', 'SDE-3', 'MTS'],
  topics: ['windowing', 'scroll math', 'overscan', 'stable keys', 'imperative handles', 'listbox a11y', 'aria-activedescendant', 'rendering performance'],
  estimatedMinutes: 60,
  conceptIds: ['react-reconciliation-keys', 'keyboard-navigation', 'focus-management', 'derived-state', 'react-effects', 'referential-equality'],
  research: {
    provenance: 'PUBLISHED_PRACTICE_PROBLEM',
    frequencyConfidence: 'MEDIUM_CONFIDENCE',
    verificationStatus: 'SOURCES_VERIFIED',
    lastVerified: '2026-11-23',
    evidence: [
      { sourceId: 'alla-components', url: 'https://allahabadi.dev/frontend-system-design/components/', originalTitle: 'Design a Virtualized List', note: 'Question 07 in the component design list (framed as component system design; used as supporting evidence).' },
    ],
    researchNotes:
      'One component-design list names "Design a Virtualized List"; only the title was used. It is framed as system design, so confidence for a machine-coding round is MEDIUM. The 60-minute coding scope chosen here is the fixed-height core an interviewer can verify: a pure, boundary-tested range function, a spacer-based scroll container, stable keys, an imperative scrollToIndex with alignment, and an accessible listbox whose active option is always rendered (informed by web.dev on windowing and INP and MDN on aria-activedescendant and ResizeObserver). Variable/measured heights, horizontal and grid virtualisation, sticky headers and reverse (chat) lists are follow-ups to discuss, not build.',
  },
  spec: {
    summary: 'Render 10,000 fixed-height rows by mounting only the visible window plus overscan, with a pure range helper, stable keys, scrollToIndex and keyboard-accessible listbox semantics.',
    description: `Implement **virtual.ts** (pure helpers) and **VirtualList.tsx**. The types are in the read-only **types.ts**:

\`\`\`ts
getVisibleRange({ scrollTop, viewportHeight, itemHeight, count, overscan }) // → { start, end }  (end exclusive)
getScrollTopForIndex({ index, align, itemHeight, viewportHeight, count, scrollTop }) // → number

<VirtualList ref={listRef} items={rows} itemHeight={40} height={400} overscan={3}
  label="Transactions" getKey={(r) => r.id} renderItem={(row, i) => row.name} />
listRef.current.scrollToIndex(500, 'center');
\`\`\`

Requirements:

1. **Range maths.** \`getVisibleRange\` returns the rows intersecting the viewport (partially visible rows included, the row that starts exactly at the bottom edge excluded) plus \`overscan\` rows on each side, clamped to \`[0, count]\`. Negative or too-large \`scrollTop\` values are clamped to the scrollable range; \`count === 0\` gives \`{ start: 0, end: 0 }\`.
2. **Windowed rendering.** A scroll container of \`height\` px contains an inner spacer of \`count * itemHeight\` px; only rows in the range are mounted, each positioned at \`index * itemHeight\` (absolute \`top\` or \`translateY\`). The range is recomputed on \`scroll\`.
3. **Stable keys.** Rows are keyed with \`getKey(item, index)\` (default: index) — never by their position inside the window, so a row's DOM node survives scrolling and insertions above it.
4. **scrollToIndex(index, align = 'start')** via \`ref\`, with \`'start' | 'center' | 'end' | 'auto'\` (auto = minimal scroll; no scroll if fully visible). Out-of-range indexes are clamped. The new window must render **immediately** (don't wait for the asynchronous scroll event).
5. **Keyboard + ARIA.** The container is \`role="listbox"\` with \`aria-label\` and \`tabIndex={0}\`; rows are \`role="option"\` with a unique \`id\`, \`aria-posinset\` (1-based) and \`aria-setsize\` (= count, because most options are not in the DOM). ArrowDown/ArrowUp (from no active row: the first row), Home and End move an **active** option exposed through \`aria-activedescendant\` with \`aria-selected="true"\`; handled keys call \`preventDefault\`; the active row is scrolled minimally into view and **stays in the DOM** even after mouse-scrolling it away. Clicking a row makes it active.
6. **Robustness.** If \`items\` shrinks (e.g. while scrolled to the bottom) nothing crashes, the window shows the new last rows and the active index is clamped; an empty list renders no options.

The preview renders 10,000 rows with "scroll to row" controls and a toggle that shrinks the list. \`App.tsx\` and \`types.ts\` are read-only. Variable row heights are an optional follow-up.`,
    technologies: ['React 18', 'TypeScript', 'forwardRef / useImperativeHandle', 'useLayoutEffect', 'WAI-ARIA listbox', 'aria-activedescendant'],
    learningObjectives: [
      'Derive a render window from scroll position with correct boundary maths (floor/ceil, half-open ranges, clamping)',
      'Separate pure calculations from React so they can be unit-tested at the boundaries',
      'Understand why keys must identify items, not window slots',
      'Expose an imperative API (scrollToIndex) without fighting React rendering',
      'Keep a virtualised widget accessible: activedescendant targets that exist, posinset/setsize, keyboard scrolling',
    ],
    clarifications: [
      { question: 'Are row heights fixed and known up front?', why: 'Fixed heights allow O(1) maths; variable heights need measurement, caching and a prefix-sum/binary-search index.', defaultAssumption: 'Fixed `itemHeight` for every row; variable heights are discussed as a follow-up.' },
      { question: 'Does the list scroll inside its own container or with the page?', why: 'Window scrolling needs the list\'s offset in the page and window scroll events; a container keeps the maths local.', defaultAssumption: 'An inner container of `height` px that owns its scrollbar.' },
      { question: 'Do rows need keyboard interaction and selection semantics?', why: 'It decides the ARIA pattern (listbox vs plain list vs grid) and whether focus moves into rows or stays on the container.', defaultAssumption: 'Single-select listbox: focus stays on the container, the active option is referenced with aria-activedescendant and selection follows the active row.' },
      { question: 'How many items, and can they change while scrolled?', why: 'Very large counts hit browser maximum element heights; shrinking while scrolled exposes stale-range bugs.', defaultAssumption: 'Up to ~100k rows (spacer below browser limits); items may be replaced at any time.' },
      { question: 'Is find-in-page (Ctrl+F) or full screen-reader browsing of all rows required?', why: 'Virtualisation removes off-screen rows from the DOM, which breaks both.', defaultAssumption: 'Not required; setsize/posinset communicate the total, and search would be an in-app filter.' },
    ],
    scopeDecisions: [
      'Fixed row height only; ResizeObserver-based measuring is a follow-up.',
      'Vertical lists only; no grids, sticky headers or horizontal virtualisation.',
      'No scroll throttling with requestAnimationFrame: the range is recomputed per scroll event but React only re-renders when the range actually changes.',
      'The viewport height is read from the container (`clientHeight`), falling back to the `height` prop, so borders are accounted for.',
      'Selection follows the active row (single-select); multi-select is out of scope.',
    ],
    requirements: [
      { id: 'range-helper', category: 'functional', level: 'MUST', text: '`getVisibleRange` returns the half-open range of visible rows (partial rows included) plus overscan, clamped to [0, count].', acceptance: 'scrollTop 10, 400px viewport, 40px rows → { start: 0, end: 11 }.' },
      { id: 'range-clamp', category: 'edge-case', level: 'MUST', text: 'Negative scrollTop, scrollTop beyond the max, count 0 and content shorter than the viewport are handled.' },
      { id: 'window-only', category: 'performance', level: 'MUST', text: 'Only rows in the range (plus the active row) are mounted; 10,000 items render 13 options at the top with overscan 3.' },
      { id: 'spacer', category: 'technical', level: 'MUST', text: 'An inner element of `count * itemHeight` px gives the scrollbar its real size; rows are positioned at `index * itemHeight`.' },
      { id: 'on-scroll', category: 'functional', level: 'MUST', text: 'The range is recomputed from the container\'s real scrollTop on scroll; at the bottom the last row sits flush with the bottom edge.' },
      { id: 'bail-out', category: 'performance', level: 'SHOULD', text: 'Scroll events that do not change the range do not change state (return the previous range object).' },
      { id: 'stable-keys', category: 'technical', level: 'MUST', text: 'Rows are keyed by `getKey(item, index)`, never by window slot; DOM nodes persist across scrolling and insertions.' },
      { id: 'scroll-to-index', category: 'functional', level: 'MUST', text: '`scrollToIndex(i, align)` via ref with start (default) / center / end / auto, clamped, and renders the new window synchronously.' },
      { id: 'listbox-aria', category: 'accessibility', level: 'MUST', text: 'role="listbox" (labelled, tabIndex 0) with role="option" rows carrying unique ids, aria-posinset and aria-setsize = count.' },
      { id: 'keyboard', category: 'accessibility', level: 'MUST', text: 'ArrowUp/ArrowDown/Home/End move the active option (aria-activedescendant + aria-selected), clamp at the ends and preventDefault.' },
      { id: 'keep-in-view', category: 'accessibility', level: 'MUST', text: 'Keyboard movement scrolls minimally so the active row is fully visible.' },
      { id: 'active-rendered', category: 'accessibility', level: 'SHOULD', text: 'The active option stays mounted even when scrolled out of the window, so aria-activedescendant never points at a missing element.' },
      { id: 'shrink-safe', category: 'edge-case', level: 'MUST', text: 'Shrinking `items` while scrolled never renders undefined items; the active index is clamped and an empty list renders no options.' },
      { id: 'page-keys', category: 'accessibility', level: 'OPTIONAL', text: 'PageUp/PageDown move the active option by one viewport of rows.' },
      { id: 'variable-heights', category: 'technical', level: 'OPTIONAL', text: 'Support measured, variable row heights (ResizeObserver + prefix sums + binary search for the first visible row).' },
      { id: 'boundary-tests', category: 'testing', level: 'SHOULD', text: 'The range helper is unit-tested at the top, bottom, partial rows, aligned rows, count 0 and with overscan clamping; component tests use real scrollTop and layout.' },
    ],
    constraints: ['React function components and hooks only.', 'No virtualisation libraries.', 'Do not change types.ts or App.tsx.', 'Keep `getVisibleRange` and `getScrollTopForIndex` pure (no DOM access).'],
    acceptanceCriteria: [
      'All public tests pass (range helper boundaries; window size, spacer and aria-setsize; scrolling; bottom alignment; keyboard; scrollToIndex).',
      'All hidden tests pass (overscan/clamping, scrollTop helper alignments, stable keys, minimal keyboard scrolling + preventDefault, active row kept mounted, center/end/clamped scrollToIndex, shrinking/empty lists, props, ARIA details).',
      'Manual: scrolling the 10,000-row preview stays smooth and the DOM never holds more than ~20 rows.',
    ],
    examples: [
      { title: 'Partial rows', input: 'scrollTop 10, viewport 400, itemHeight 40, overscan 0', output: '{ start: 0, end: 11 }', explanation: 'Row 0 is partly hidden at the top and row 10 partly visible at the bottom: floor for the start, ceil for the end.' },
      { title: 'Bottom', input: 'count 100, scrollTop 3600 (max), overscan 3', output: '{ start: 87, end: 100 }', explanation: 'The overscan below is clamped to count.' },
      { title: 'Minimal keyboard scroll', input: 'active row 9 (fully visible), press ArrowDown', output: 'scrollTop 0 → 40', explanation: 'Row 10 occupies 400–440 px, so the list scrolls just enough for its bottom edge to be visible.' },
    ],
    manualTests: [
      'Drag the scrollbar from top to bottom: rows appear without blank gaps; the DevTools Elements panel shows ~16 option elements at any time.',
      'Type 5000, choose center, press "Scroll to row": row 5000 is centred.',
      'Click the list and hold ArrowDown: the active row stays visible; End/Home jump to the ends.',
      'Activate a row, scroll it away with the mouse wheel, press ArrowDown: the list scrolls back to the next row.',
      'Scroll to the bottom and press "Shrink to 25 rows": the last rows of the short list are shown, nothing crashes.',
      'With a screen reader, focus the list and arrow through: each row is announced with its position, e.g. "Row 12, 12 of 10000".',
    ],
  },
  files: {
    entry: '/App.tsx',
    starter: { ...shared, '/VirtualList.tsx': starterList, '/virtual.ts': starterVirtual },
    solution: { ...shared, '/VirtualList.tsx': solutionList, '/virtual.ts': solutionVirtual },
    readonly: ['/App.tsx', '/types.ts'],
    support: {},
  },
  tests: [
    { path: '/tests/helpers.tsx', visibility: 'public', kind: 'runtime', source: helpers },
    { path: '/tests/virtual.test.ts', visibility: 'public', kind: 'runtime', source: virtualTests },
    { path: '/tests/public.test.tsx', visibility: 'public', kind: 'runtime', source: publicTests },
    { path: '/tests/hidden.test.tsx', visibility: 'hidden', kind: 'runtime', source: hiddenTests },
  ],
  hints: [
    'Start with the pure helper. First visible row = `Math.floor(scrollTop / itemHeight)`; end (exclusive) = `Math.ceil((scrollTop + viewportHeight) / itemHeight)`. Clamp scrollTop to `[0, max(0, count * itemHeight - viewportHeight)]` first, then subtract/add overscan and clamp both to `[0, count]`.',
    'Structure: outer `div` (height, overflow-y auto, position relative) → inner spacer (`height: count * itemHeight`, position relative) → only the windowed rows, each `position: absolute; top: 0; transform: translateY(index * itemHeight px)`. Key them with `getKey(item, index)` using the absolute index, never the slot inside the window.',
    'Keep `range` in state and write `syncRange()` that reads `el.scrollTop`/`el.clientHeight`, computes the range and calls `setRange(prev => same ? prev : next)`. Call it from `onScroll`, from a `useLayoutEffect` on [count, itemHeight, height, overscan], and right after setting `el.scrollTop` in `scrollToIndex` — programmatic scrolling fires its scroll event asynchronously.',
    'Keyboard: keep `active` in state and clamp it in render (`Math.min(active, count - 1)`). On Arrow/Home/End: preventDefault, set active, `scrollToIndex(next, "auto")`. Always render the active row even if it is outside the range, and point `aria-activedescendant` at its id. Clamp the rendered range to `count` in render because `range` can be stale for one render after `items` shrinks.',
  ],
  solution: {
    initialApproach: 'The browser only needs to *believe* the list is 400,000 px tall: a spacer element provides the scroll height, and a handful of absolutely positioned rows are placed where the user is looking. Everything else is arithmetic, so put that arithmetic in pure functions, test their boundaries, and keep the React layer thin: read the real scroll position, compute a range, render it.',
    bruteForce: 'Render all 10,000 rows with `items.map`. It is correct and accessible, but the initial render creates ~30k DOM nodes, style/layout cost grows with every row, memory goes up, and any re-render (e.g. changing the active row) reconciles all of them — long tasks that hurt INP. A naive "virtual" version often renders `items.slice(start, end).map((item, i) => <Row key={i} />)`, which reuses the wrong DOM nodes as the window moves.',
    optimizedApproach: `**Pure layer (virtual.ts)**
- \`getVisibleRange\`: clamp scrollTop to \`[0, maxScrollTop]\`, \`first = floor(top / h)\`, \`endVisible = ceil((top + viewport) / h)\` (exclusive, so a row starting exactly at the bottom edge is not included), then \`[max(0, first - overscan), min(count, endVisible + overscan))\`.
- \`getScrollTopForIndex\`: start = \`i*h\`, end = \`(i+1)*h - viewport\`, center = \`i*h - (viewport - h)/2\`, auto = start if above, end if below, unchanged if fully visible; clamp to \`[0, maxScrollTop]\` and clamp the index.

**React layer (VirtualList.tsx)**
- \`range\` in state; \`syncRange()\` reads \`el.scrollTop\` and \`el.clientHeight\` and calls \`setRange(prev => equal ? prev : next)\` — returning the same object lets React bail out, so most scroll events never re-render.
- \`useLayoutEffect(syncRange, [syncRange])\` recomputes before paint when count/height/overscan change (and picks up the browser's clamped scrollTop after a shrink).
- \`scrollToIndex\` sets \`el.scrollTop\` and calls \`syncRange()\` immediately: the scroll event for programmatic scrolling is dispatched later, which would otherwise leave a blank viewport for a frame and an \`aria-activedescendant\` pointing at nothing.
- Rows: \`key={getKey(item, index)}\`, \`transform: translateY(index*h)\` (compositor-friendly), \`role="option"\`, \`aria-posinset\`, \`aria-setsize={count}\`.

**Keyboard and a11y**
- The listbox keeps DOM focus; \`active\` is state clamped in render (derived, no syncing effect). Keys compute the next index, \`preventDefault\` (otherwise the container also scrolls natively), set active and \`scrollToIndex(next, 'auto')\`.
- The active row is appended to the rendered indexes when outside the window, so \`aria-activedescendant\` is always valid even after wheel scrolling.
- Defensive clamping in render (\`end = min(range.end, count)\`) prevents \`renderItem(undefined)\` during the one render between an \`items\` shrink and the layout effect.`,
    walkthrough: `1. Mount: initial range from scrollTop 0 and the \`height\` prop → \`{ 0, 13 }\`; 13 options render inside a 400,000 px spacer. The layout effect re-reads the real \`clientHeight\` (borders) and bails out if nothing changed.
2. The user scrolls to 4,010 px: \`onScroll\` → \`syncRange\` → \`first = 100\`, \`endVisible = ceil(4410/40) = 111\` → \`{ 97, 114 }\` → re-render. Rows 97–113 keep their keys; those still in the window keep their DOM nodes, new ones mount, old ones unmount.
3. Scrolling 5 px further keeps the same range → \`setRange\` returns \`prev\` → no re-render.
4. ArrowDown with no active row: active 0, \`scrollToIndex(0, 'auto')\` computes the target, sets \`el.scrollTop = 0\` and syncs the range in the same event, so the commit already contains row 0 and \`aria-activedescendant\` resolves.
5. Wheel away from the active row: the range moves, but row 0 is appended to the rendered indexes, so the reference stays valid. ArrowDown → active 1 → 'auto' sees the row above the viewport and scrolls to its top.
6. \`scrollToIndex(500, 'center')\` through the ref → \`20000 - 180 = 19820\`.
7. \`items\` shrinks to 30 while at the bottom: the render clamps the stale range to 30 (only the clamped active row renders), the browser clamps scrollTop to 800, the layout effect reads it and renders rows 17–29 before paint.`,
    complexity: 'Range computation is O(1). Each render is O(visible + 2·overscan) — about 16 rows here regardless of count. The items array itself is O(n) memory (it is the caller\'s data); the DOM is O(window). With variable heights, an offset index (prefix sums) is O(n) to build and O(log n) per lookup via binary search; updates after a measurement are O(n) with a flat array or O(log n) with a Fenwick tree.',
    edgeCases: `- Partial rows at the top and bottom → floor/ceil; a row starting exactly at the bottom edge is excluded.
- Bottom of the list → end clamped to count, last row flush with the bottom edge.
- Negative scrollTop (iOS rubber banding) and stale scrollTop after shrinking → clamped.
- Content shorter than the viewport → everything renders, maxScrollTop = 0.
- \`count === 0\` → no options, keyboard is a no-op, no aria-activedescendant.
- Active row scrolled out of the window → still rendered.
- Items shrink below the active index → active clamped in render.
- Container borders/padding → use \`clientHeight\`, not the \`height\` prop, for the viewport.
- Fractional scroll positions on zoomed / high-DPI screens → floor/ceil still produce a covering range.
- Huge counts → spacer heights beyond the browser's maximum element height (tens of millions of px) need scaling; out of scope.`,
    alternatives: `- **Top/bottom padding spacers** instead of absolute rows: render \`<div style={{height: start*h}}/>\`, the rows in normal flow, then a bottom spacer. Rows can use normal layout (no absolute positioning), and variable heights are easier to measure; but changing the spacer heights forces layout on every range change.
- **Translate a single inner block** by \`start*h\` and render rows in normal flow inside it — one transform per range change.
- **CSS \`content-visibility: auto\`** with \`contain-intrinsic-size\`: the browser skips rendering work for off-screen rows while keeping them in the DOM (find-in-page and a11y still work), but React still creates every element — it reduces rendering cost, not DOM size or reconciliation.
- **Libraries** (react-window, TanStack Virtual): battle-tested measuring, horizontal/grid support and scroll anchoring; know their API and what they do internally.
- **Pagination or infinite loading** when users don't need to scroll through everything.`,
    tradeoffs: `- **Overscan**: more rows hide blank flashes during fast scrolling but cost render time per range change; 2–5 rows is typical, sometimes more in the scroll direction.
- **Re-render per scroll event vs rAF throttling**: the bail-out keeps renders to range changes; rAF batching reduces work further but adds a frame of latency and complicates tests.
- **translateY vs top**: transforms avoid layout of siblings and can be composited; \`top\` is simpler to read in DevTools. Both are fine for fixed heights.
- **Virtualisation vs accessibility/find-in-page**: off-screen rows don't exist, so Ctrl+F, screen-reader browse mode and "select all" only see the window; setsize/posinset and an in-app search mitigate this.
- **aria-activedescendant vs roving tabindex**: activedescendant keeps DOM focus on the container, so rows can be unmounted freely (as long as the active one stays); roving tabindex would move focus into rows and lose it whenever the focused row unmounts.`,
    commonMistakes: `- Keys by window slot (\`key={i}\` inside the sliced map) → DOM and component state jump between items as you scroll.
- Off-by-one at the bottom: using \`floor\` for the end (misses a partly visible row) or \`floor + 1\` (renders an extra one when aligned), or forgetting to clamp \`end\` to \`count\`.
- No spacer, so the scrollbar is the size of the window and you can never reach row 9,999.
- Only setting \`el.scrollTop\` in scrollToIndex and waiting for the scroll event → one frame (or one test assertion) with the old window.
- Reading the range from state during a render after \`items\` shrank → \`renderItem(undefined)\` crash.
- \`aria-activedescendant\` pointing at an id that is no longer in the DOM.
- Forgetting \`preventDefault\` for arrow keys, so the container scrolls twice.
- Calling \`setRange({ ...next })\` on every scroll event → a full re-render per pixel.
- Using \`height\` for the viewport while CSS adds borders → end alignment off by a few pixels.
- Measuring with \`getBoundingClientRect\` on every row in render (layout thrash).`,
    testingStrategy: 'Unit-test the pure helpers at the boundaries: top, partial rows, exactly aligned rows, bottom, count 0, content shorter than the viewport, negative and stale scrollTop, overscan clamping, and every scroll alignment. Component tests run in a real browser iframe, so render a 400 px container with 40 px rows, set `el.scrollTop` and dispatch `scroll`, then assert on roles (options, aria-setsize/posinset, aria-activedescendant) and real geometry (`getBoundingClientRect` offsets prove rows are positioned correctly with any technique). Prove key stability by checking DOM node identity (`toBe`) across scrolling and a prepend. Mutation-test: off-by-one in the range, rendering everything, slot keys, missing sync after programmatic scroll, missing preventDefault, no clamping on shrink.',
    seniorFollowUps: `- Variable heights: estimate, measure rendered rows with ResizeObserver, store sizes in a cache, keep a prefix-sum offset array, binary-search the first row whose bottom exceeds scrollTop, and correct scrollTop when rows above the viewport change size.
- Reverse lists (chat) and prepending history without the viewport jumping (scroll anchoring / manual compensation).
- Grids and two-dimensional virtualisation (rows × columns), sticky headers and sticky first columns.
- Window scrolling instead of a container (offsetTop of the list, \`scroll\` on window, \`scrollMargin\`).
- Lists beyond the browser's maximum element height: scale factors or chunked spacers.
- Combine with infinite loading: placeholders for unloaded ranges and fetching by visible range.`,
  },
  followUps: [
    { id: 'f1', level: 'definition', question: 'What is list virtualisation (windowing), and which costs does it reduce compared with rendering every row?', expectedConcepts: ['only visible rows + overscan mounted', 'spacer provides scroll height', 'fewer DOM nodes, less style/layout/memory', 'smaller reconciliation work', 'better INP'], sourceIds: ['webdev-virtualize', 'webdev-inp'] },
    { id: 'f2', level: 'mechanism', question: 'Derive the visible range for scrollTop = 4010, viewport = 400, itemHeight = 40, overscan = 3, count = 10,000. Why floor for the start and ceil for the end?', expectedConcepts: ['first = floor(4010/40) = 100', 'end = ceil(4410/40) = 111 (exclusive)', 'overscan → [97, 114)', 'partial rows at both edges', 'clamp to [0, count]'], sourceIds: ['webdev-virtualize'] },
    { id: 'f3', level: 'application', question: 'Each row contains an uncontrolled checkbox. After scrolling, ticked boxes appear on the wrong rows. What is wrong and how do you fix it?', expectedConcepts: ['key by window slot reuses DOM', 'key by item id', 'state should live in data, not in unmounted rows', 'rows unmount when scrolled away'], sourceIds: ['react-rendering-lists'] },
    { id: 'f4', level: 'edge-cases', question: 'A screen-reader user arrows through the list, then scrolls with the mouse wheel. What can break with aria-activedescendant in a virtual list, and how do you prevent it?', expectedConcepts: ['active option unmounted', 'activedescendant must reference an existing element', 'always render the active row', 'aria-setsize / aria-posinset for the total', 'focus stays on the container'], sourceIds: ['mdn-aria-activedescendant'] },
    { id: 'f5', level: 'production', question: 'Rows now contain wrapped text of unknown height. How do you change the design?', expectedConcepts: ['estimated size', 'measure with ResizeObserver', 'size cache keyed by item id', 'prefix sums + binary search', 'scroll position correction when rows above resize'], sourceIds: ['mdn-resize-observer'] },
    { id: 'f6', level: 'architecture', question: 'Design a reusable virtualisation layer for a design system that powers lists, tables, grids and chat views. What is the API and what stays headless?', expectedConcepts: ['headless hook returning virtual items + total size', 'measurement strategy pluggable', 'scrollToIndex / alignment API', 'horizontal + vertical axes', 'scroll anchoring for prepends', 'a11y contract left to the consumer (roles, activedescendant)'], sourceIds: ['webdev-virtualize', 'mdn-resize-observer', 'webdev-inp'] },
  ],
  mcqs: [
    {
      id: 'm1',
      question: 'Rows are 40px tall in a 400px viewport (overscan 0). Which `end` (exclusive) is correct for scrollTop = 400?',
      code: `const first = Math.floor(scrollTop / itemHeight); // 10
const end = /* ??? */;`,
      options: [
        { id: 'a', text: 'Math.floor((scrollTop + viewportHeight) / itemHeight) → 20', explanation: 'Correct here, but floor fails for partial rows: at scrollTop 410 it gives 20 and misses row 20, which is partly visible.' },
        { id: 'b', text: 'Math.ceil((scrollTop + viewportHeight) / itemHeight) → 20', explanation: 'Correct — 20 at the aligned position (row 20 starts exactly at the bottom edge) and 21 at scrollTop 410, where row 20 is partly visible.' },
        { id: 'c', text: 'Math.floor((scrollTop + viewportHeight) / itemHeight) + 1 → 21', explanation: 'Renders an extra, invisible row whenever the scroll position is row-aligned (and can exceed count at the bottom).' },
        { id: 'd', text: 'first + viewportHeight / itemHeight → 20', explanation: 'Ignores the partial row when scrollTop is not a multiple of the row height.' },
      ],
      correctOptionId: 'b',
      explanation: 'The window must cover [scrollTop, scrollTop + viewport). With a half-open range, `ceil` of the bottom edge is exactly the first row that starts at or below it. Then add overscan and clamp to count.',
      sourceIds: ['webdev-virtualize'],
    },
    {
      id: 'm2',
      question: 'Why does `scrollToIndex` call the range update itself right after `el.scrollTop = target`, instead of relying on the `onScroll` handler?',
      options: [
        { id: 'a', text: 'Setting scrollTop never fires a scroll event', explanation: 'It does fire one — just not synchronously.' },
        { id: 'b', text: 'The scroll event for a programmatic scroll is dispatched asynchronously, so until then the old window would be rendered (blank area, invalid aria-activedescendant)', explanation: 'Correct — updating the range in the same task keeps the DOM consistent with the new scroll position immediately.' },
        { id: 'c', text: 'React ignores scroll events on elements with tabIndex', explanation: 'React handles scroll events on any element.' },
        { id: 'd', text: 'To avoid a memory leak', explanation: 'There is no leak involved.' },
      ],
      correctOptionId: 'b',
      explanation: 'Browsers queue the scroll event to run with the next rendering steps. Computing the range immediately avoids a frame with the wrong rows and makes the behaviour testable synchronously.',
      sourceIds: ['webdev-inp', 'mdn-aria-activedescendant'],
    },
    {
      id: 'm3',
      question: 'Which keying strategy keeps each row\'s DOM node attached to the same item as the window moves?',
      code: `items.slice(start, end).map((item, i) => <Row key={/* ??? */} item={item} />)`,
      options: [
        { id: 'a', text: 'key={i}', explanation: 'That is the slot inside the window: after scrolling one row, slot 0 shows a different item and React reuses its node and state.' },
        { id: 'b', text: 'key={start + i}', explanation: 'Stable while scrolling, but breaks when items are inserted or removed above, because indexes shift.' },
        { id: 'c', text: 'key={item.id}', explanation: 'Correct — the key identifies the item itself, so scrolling and insertions keep node/state with the right item.' },
        { id: 'd', text: 'key={Math.random()}', explanation: 'Remounts every row on every render, destroying state and wasting work.' },
      ],
      correctOptionId: 'c',
      explanation: 'Keys tell React which element is which between renders. In a windowed list, positions change constantly, so only an item identity is stable.',
      sourceIds: ['react-rendering-lists'],
    },
  ],
};

export default problem;
