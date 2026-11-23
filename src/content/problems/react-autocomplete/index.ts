import type { CodingProblem } from '../../schema';
import starterAutocomplete from './starter/Autocomplete.tsx?raw';
import starterApp from './starter/App.tsx?raw';
import api from './starter/api.ts?raw';
import styles from './starter/styles.css?raw';
import solutionAutocomplete from './solution/Autocomplete.tsx?raw';
import helpers from './tests/helpers.ts?raw';
import publicTests from './tests/public.test.tsx?raw';
import hiddenTests from './tests/hidden.test.tsx?raw';

const shared = { '/App.tsx': starterApp, '/api.ts': api, '/styles.css': styles };

const problem: CodingProblem = {
  schemaVersion: 1,
  kind: 'coding',
  id: 'react-autocomplete',
  slug: 'autocomplete',
  title: 'Autocomplete / Typeahead',
  track: 'react',
  execution: 'react',
  difficulty: 'medium',
  priority: 'P0',
  seniority: ['Senior', 'SDE-2', 'SDE-3', 'MTS'],
  topics: ['debouncing', 'race conditions', 'AbortController', 'combobox a11y', 'keyboard navigation', 'async UI states'],
  estimatedMinutes: 60,
  conceptIds: ['debouncing', 'abort-controller', 'race-conditions', 'async-ui-states', 'combobox-aria', 'keyboard-navigation', 'react-effects', 'focus-management'],
  research: {
    provenance: 'PUBLISHED_PRACTICE_PROBLEM',
    frequencyConfidence: 'HIGH_CONFIDENCE',
    verificationStatus: 'SOURCES_VERIFIED',
    lastVerified: '2026-11-23',
    evidence: [
      { sourceId: 'fih-sd-ui', url: 'https://www.frontendinterviewhandbook.com/front-end-system-design/ui-components', originalTitle: 'Autocomplete', note: 'Listed as a UI component system-design example.' },
      { sourceId: 'alla-components', url: 'https://allahabadi.dev/frontend-system-design/components/', originalTitle: 'Design an Autocomplete', note: 'Question 01 in the component design list.' },
      { sourceId: 'fg-mc', url: 'https://www.frontendgeek.com/frontend-interview/machine-coding-interview', originalTitle: 'Auto Complete Search | Typeahead Search', note: 'Listed under "Component machine coding" (vanilla JS and React).' },
    ],
    researchNotes:
      'Three independent sources list autocomplete; two frame it as system design and one as machine coding. This problem is the 60-minute machine-coding subset: debounced fetching, stale-response handling, async states and the WAI-ARIA combobox keyboard model. Caching, highlighting and virtualisation are follow-ups.',
  },
  spec: {
    summary: 'Build a debounced, race-condition-safe, keyboard-accessible autocomplete component in React.',
    description: `Implement \`<Autocomplete />\` in **Autocomplete.tsx**.

The component receives \`fetchSuggestions(query, signal)\` and must:

1. **Debounce** typing (default 300 ms) and request suggestions for the **latest** trimmed query only.
2. **Never show stale results.** Responses can arrive out of order; cancel superseded requests through the \`AbortSignal\` and ignore anything that is not the latest.
3. Render **loading**, **empty** ("No results"), **error** and **results** states.
4. Follow the **WAI-ARIA combobox** pattern: \`role="combobox"\` input that keeps DOM focus, a \`role="listbox"\` popup, \`aria-expanded\`, \`aria-controls\`, and \`aria-activedescendant\` for the highlighted option.
5. Support **ArrowDown / ArrowUp** (wrapping), **Enter** to select, **Escape** to close, and **mouse click** to select.

\`App.tsx\` wires the component to a mock API (\`api.ts\`) with random latency — type quickly in the preview to see race conditions in action. \`api.ts\` and \`App.tsx\` are read-only.`,
    technologies: ['React 18', 'TypeScript', 'AbortController', 'WAI-ARIA combobox'],
    learningObjectives: [
      'Model async UI state explicitly (idle/loading/success/error)',
      'Prevent stale responses with effect cleanup + AbortController',
      'Implement the combobox keyboard model with aria-activedescendant',
      'Keep effects stable when parents pass inline callbacks',
    ],
    clarifications: [
      { question: 'Where do suggestions come from, and can I change that API?', why: 'Decides whether caching, cancellation and error handling live in the component or a data layer.', defaultAssumption: 'An injected async function `fetchSuggestions(query, signal)`; the component does not know about URLs.' },
      { question: 'How fast do results need to appear, and how expensive is the backend?', why: 'Drives the debounce delay and whether to add a client cache.', defaultAssumption: '300 ms debounce, no cache in v1 (follow-up).' },
      { question: 'What should happen when the user selects a suggestion?', why: 'Selection could navigate, fill the input, or add a chip (multi-select).', defaultAssumption: 'Fill the input, close the list, call onSelect(value), and do not search for the selected value.' },
      { question: 'Minimum query length? What about whitespace?', why: 'Avoids requests for one-character or blank queries.', defaultAssumption: 'Trim the query; search when length ≥ minChars (default 1).' },
      { question: 'Which keyboard interactions and screen readers must be supported?', why: 'Determines the ARIA pattern and focus strategy.', defaultAssumption: 'WAI-ARIA APG combobox with listbox popup, focus stays in the input.' },
    ],
    scopeDecisions: [
      'Single selection only (multi-select is a separate problem).',
      'No client-side cache, match highlighting or virtualisation in the core task.',
      'Suggestions are plain strings and are assumed unique.',
    ],
    requirements: [
      { id: 'debounce', category: 'functional', level: 'MUST', text: 'Typing is debounced; only the latest trimmed query is requested after `debounceMs`.' },
      { id: 'min-chars', category: 'functional', level: 'MUST', text: 'Queries shorter than `minChars` do not trigger a request and close the list.' },
      { id: 'states', category: 'functional', level: 'MUST', text: 'Loading, empty ("No results"), error (role="alert") and results states are rendered.' },
      { id: 'select', category: 'functional', level: 'MUST', text: 'Enter on a highlighted option or a click selects it: input value updates, list closes, onSelect fires.' },
      { id: 'no-search-on-select', category: 'functional', level: 'SHOULD', text: 'Selecting a suggestion does not trigger a new search for that value.' },
      { id: 'stale', category: 'technical', level: 'MUST', text: 'Out-of-order responses never overwrite newer results.' },
      { id: 'abort', category: 'technical', level: 'MUST', text: 'Superseded and unmounted requests are aborted through the AbortSignal.' },
      { id: 'abort-not-error', category: 'edge-case', level: 'MUST', text: 'An AbortError caused by our own cancellation is not shown as an error.' },
      { id: 'stable-callbacks', category: 'technical', level: 'SHOULD', text: 'A new `fetchSuggestions` identity on every parent render does not restart the search.' },
      { id: 'combobox-roles', category: 'accessibility', level: 'MUST', text: 'Input has role="combobox", a visible label, aria-expanded, aria-controls and aria-autocomplete="list"; popup has role="listbox" with role="option" children.' },
      { id: 'activedescendant', category: 'accessibility', level: 'MUST', text: 'DOM focus stays on the input; the highlighted option is referenced by aria-activedescendant and marked aria-selected.' },
      { id: 'keyboard', category: 'accessibility', level: 'MUST', text: 'ArrowDown/ArrowUp move (and wrap), Enter selects, Escape closes.' },
      { id: 'live-region', category: 'accessibility', level: 'SHOULD', text: 'Loading/empty status is announced through a polite live region.' },
      { id: 'blur-close', category: 'edge-case', level: 'SHOULD', text: 'Blurring the input closes the list, but clicking an option still selects it.' },
      { id: 'cache', category: 'performance', level: 'OPTIONAL', text: 'Cache results per query (bounded LRU) to avoid repeat requests.' },
      { id: 'tests', category: 'testing', level: 'SHOULD', text: 'Race conditions are tested deterministically (manually resolved promises + fake timers).' },
    ],
    constraints: ['React function components and hooks only.', 'No third-party libraries.', 'Do not change the component props.'],
    acceptanceCriteria: [
      'All public tests pass (labelled combobox, debounce, loading → results, empty state, keyboard selection).',
      'All hidden tests pass (stale responses, abort vs error, aria-activedescendant, wrapping, minChars, click selection, unmount abort).',
      'Manual: screen-reader announces the highlighted option while focus stays in the input.',
    ],
    examples: [
      { title: 'Out-of-order responses', input: 'type "a" → request A; type "ap" → request B; B resolves, then A resolves', output: 'Only B\'s results are shown; A\'s signal is aborted', explanation: 'The effect for "a" is cleaned up when the query changes.' },
      { title: 'Keyboard', input: 'results [apple, apricot]; ArrowDown, ArrowDown, Enter', output: 'input = "apricot", onSelect("apricot"), list closed' },
    ],
    manualTests: [
      'Type quickly in the preview ("a", "ap", "apr") and confirm results always match the current text.',
      'Type "error" to see the error state.',
      'Use only the keyboard: Tab into the input, type, ArrowDown, Enter.',
      'With a screen reader (VoiceOver/NVDA), confirm the highlighted option is announced.',
    ],
  },
  files: {
    entry: '/App.tsx',
    starter: { ...shared, '/Autocomplete.tsx': starterAutocomplete },
    solution: { ...shared, '/Autocomplete.tsx': solutionAutocomplete },
    readonly: ['/App.tsx', '/api.ts'],
    support: {},
  },
  tests: [
    { path: '/tests/helpers.ts', visibility: 'public', kind: 'runtime', source: helpers },
    { path: '/tests/public.test.tsx', visibility: 'public', kind: 'runtime', source: publicTests },
    { path: '/tests/hidden.test.tsx', visibility: 'hidden', kind: 'runtime', source: hiddenTests },
  ],
  hints: [
    'Split the problem: (1) a `query` state, (2) an effect that reacts to `query`, (3) rendering + keyboard. Get (1) and (2) right first.',
    'Debounce inside the effect: `setTimeout` in the effect body, `clearTimeout` in the cleanup. Every keystroke re-runs the effect, so the cleanup cancels the previous timer for free.',
    'Create an `AbortController` per effect run and call `abort()` in the same cleanup. In the `.then`, return early if `controller.signal.aborted` — that single check fixes both stale responses and post-unmount updates.',
    'Track `activeIndex` in state. The input keeps focus; set `aria-activedescendant` to the active option\'s id (use `useId()` for unique ids). Prevent the option\'s `mousedown` default so the input does not blur before `click`.',
  ],
  solution: {
    initialApproach: 'Hold `query` in state and derive everything from one effect keyed on the query: debounce with a timer, fetch with an AbortController, and let React\'s effect cleanup cancel both when the query changes or the component unmounts.',
    bruteForce: 'Calling `fetchSuggestions` directly in `onChange` with a module-level debounce works for the happy path but leaks: responses arrive out of order, the UI flickers between old and new results, and late responses update an unmounted component. It also makes cancellation and testing awkward.',
    optimizedApproach: `**One effect owns the request lifecycle.**

- \`useEffect(..., [query, debounceMs, minChars])\` schedules a timer; the cleanup clears it **and** aborts the controller.
- Results are applied only if \`!controller.signal.aborted\`, so an older response can never overwrite a newer one, and an AbortError from our own cancel is not treated as a failure.
- Callbacks from props are read through refs (\`fetchRef\`, \`onSelectRef\`) so a parent passing an inline function doesn't restart the search on every render.
- UI state is explicit: \`status\` ∈ idle | loading | success | error, plus \`items\`, \`open\`, \`active\`.
- Accessibility follows the APG combobox: focus stays in the input, \`aria-activedescendant\` points to the highlighted option, \`aria-selected\` marks it, the listbox is \`hidden\` when closed, and a polite \`role="status"\` region announces loading/empty.`,
    walkthrough: `1. **State**: \`query\`, \`items\`, \`status\`, \`open\`, \`active\` (−1 = nothing highlighted).
2. **Ids**: \`useId()\` builds unique ids for the input, listbox and each option, so several autocompletes can coexist on one page.
3. **Latest-callback refs**: an effect without deps copies \`fetchSuggestions\`/\`onSelect\` into refs after every render; the search effect reads \`fetchRef.current\` and so doesn't depend on callback identity.
4. **Search effect**:
   - If \`skipNextSearch\` is set (the query changed because of a selection) clear the flag and return.
   - Trim; if shorter than \`minChars\`, reset to idle and close.
   - Otherwise create an \`AbortController\` and a timer. When the timer fires: set loading, open, call \`fetchRef.current(q, signal)\`.
   - On success/failure: **return early if aborted**. Otherwise set items/success or error.
   - **Cleanup** clears the timer and aborts — this runs before the next effect (new keystroke) and on unmount.
5. **select(value)**: set the skip flag only if the value differs from the query (otherwise the effect would not re-run and the flag would swallow the next keystroke), update the query, close and call \`onSelect\`.
6. **Keyboard**: ArrowDown/ArrowUp change \`active\` with modulo wrapping and \`preventDefault\` (so the caret doesn't jump); Enter selects only if an option is highlighted; Escape closes.
7. **Rendering**: \`aria-expanded\` reflects whether the listbox is actually visible. Options use \`onMouseDown={e => e.preventDefault()}\` so focus stays in the input and the \`blur\` handler doesn't close the list before \`click\` runs.`,
    complexity: 'Each keystroke does O(1) work plus a re-render of at most the visible options (O(k)). At most one request is in flight at a time; aborted requests are released. Memory is O(k) for the current suggestions.',
    edgeCases: '- Response for an old query arriving last → ignored (aborted check).\n- AbortError rejection → ignored, not an error state.\n- Unmount while a request is in flight → aborted, no state update after unmount.\n- Selecting a value equal to the current query → no skip flag, so the next keystroke still searches.\n- Whitespace-only query → treated as empty.\n- Empty results → "No results" in the live region, listbox hidden, aria-expanded=false.\n- Duplicate suggestion strings would collide as React keys — clarify uniqueness or key by index+value.',
    alternatives: '- **Request sequence numbers** instead of AbortController: tag each request with an incrementing id and ignore responses whose id is not the latest. Works when the API cannot be cancelled, but the server still does the work.\n- **Data-fetching libraries** (TanStack Query, SWR) keyed by query provide caching, deduplication and cancellation.\n- **`useDeferredValue`** defers rendering of expensive result lists but does not debounce network requests.\n- **Native `<datalist>`**: zero JS, but little control over styling, async loading or announcements.',
    tradeoffs: '- Longer debounce = fewer requests but more perceived latency; 150–300 ms is a common compromise.\n- Abort saves server/bandwidth work only if the backend honours cancellation; the client-side correctness comes from ignoring stale responses either way.\n- `aria-activedescendant` keeps typing uninterrupted (focus never leaves the input) but requires correct id management; moving real focus into the list (roving tabindex) is simpler for some screen readers but breaks typing flow.',
    commonMistakes: '- Using a debounced function recreated on every render (debounce does nothing).\n- Forgetting the cleanup, so every keystroke eventually fires a request.\n- Rendering whichever response arrives last.\n- Showing an error banner for AbortError.\n- Moving DOM focus to options and losing the caret.\n- Closing the list on blur and losing the click (fix: preventDefault on mousedown).\n- Hard-coded ids that break with two instances on the page.',
    testingStrategy: 'Inject the API so tests control resolution order with manually-resolved promises; use fake timers to step through the debounce deterministically; query by role and accessible name (combobox, listbox, option, status, alert) as Testing Library recommends; assert aria-activedescendant points at an element that exists. Cover: debounce boundary, stale responses, abort vs error, unmount, minChars, keyboard wrap, click selection.',
    seniorFollowUps: '- Add an LRU cache keyed by normalised query; how do you invalidate it?\n- Results lists of 10 000 items: virtualise the listbox while keeping aria-activedescendant valid (the active option must be rendered).\n- Highlight the matched substring without `dangerouslySetInnerHTML` (XSS).\n- Server-side: rate limiting, typo tolerance, prefix indexes; client-side: prefetch popular queries.\n- How do you measure quality? Time-to-first-result, abandonment, selection rate; how would INP be affected by rendering large result sets?',
  },
  followUps: [
    { id: 'f1', level: 'definition', question: 'What is a race condition in the context of a search input?', expectedConcepts: ['responses can arrive out of order', 'last response written wins', 'UI shows results for an older query'], sourceIds: [] },
    { id: 'f2', level: 'mechanism', question: 'Walk through exactly when the effect cleanup runs as the user types "a", "ap" and then unmounts the component.', expectedConcepts: ['cleanup before next effect', 'cleanup on unmount', 'clearTimeout + abort'], sourceIds: ['react-sync-effects', 'react-useeffect'] },
    { id: 'f3', level: 'application', question: 'The backend cannot be cancelled. How do you still guarantee correct results?', expectedConcepts: ['request id / sequence number', 'ignore stale responses', 'abort is an optimisation, ignoring is correctness'], sourceIds: ['mdn-abortcontroller'] },
    { id: 'f4', level: 'edge-cases', question: 'Why does clicking an option sometimes do nothing in naive implementations, and how do you fix it?', expectedConcepts: ['blur fires before click', 'list unmounts on blur', 'preventDefault on mousedown'], sourceIds: [] },
    { id: 'f5', level: 'production', question: 'How would you add caching, and what are the invalidation and memory risks?', expectedConcepts: ['LRU keyed by normalised query', 'TTL', 'per-user data', 'bounded size'], sourceIds: [] },
    { id: 'f6', level: 'architecture', question: 'Design the autocomplete as a reusable headless component for a design system. What is the API?', expectedConcepts: ['headless hook returning prop getters', 'controlled vs uncontrolled value', 'render props / slots', 'ARIA handled by the library'], sourceIds: ['apg-combobox'] },
  ],
  mcqs: [
    {
      id: 'm1',
      question: 'With `aria-activedescendant`, where is DOM focus while the user arrows through options?',
      options: [
        { id: 'a', text: 'On each option, moved with element.focus()', explanation: 'That is the roving-tabindex technique, not aria-activedescendant.' },
        { id: 'b', text: 'On the combobox input; the attribute tells assistive tech which option is active', explanation: 'Correct — focus never leaves the input, so typing continues to work.' },
        { id: 'c', text: 'On the listbox container', explanation: 'In the combobox pattern with a listbox popup, the input (combobox) keeps focus.' },
        { id: 'd', text: 'Nowhere — focus is removed while navigating', explanation: 'Removing focus would break keyboard interaction entirely.' },
      ],
      correctOptionId: 'b',
      explanation: 'aria-activedescendant lets a focused composite widget (the combobox) identify the currently active descendant without moving DOM focus.',
      sourceIds: ['mdn-aria-activedescendant', 'apg-combobox'],
    },
    {
      id: 'm2',
      question: 'Request A ("a") is sent, then request B ("ap"). B resolves at 200 ms, A at 600 ms. The component sets state in every `.then`. What does the user see at 700 ms?',
      options: [
        { id: 'a', text: 'Results for "ap"', explanation: 'Only if stale responses are ignored or aborted — this naive component does not.' },
        { id: 'b', text: 'Results for "a"', explanation: 'Correct — the last response to arrive wins, even though it is for an older query.' },
        { id: 'c', text: 'Both result sets merged', explanation: 'Each setState replaces the list.' },
        { id: 'd', text: 'An error', explanation: 'Nothing failed; the ordering is simply wrong.' },
      ],
      correctOptionId: 'b',
      explanation: 'Without cancellation or a "latest request" check, whichever promise settles last overwrites state.',
      sourceIds: ['react-sync-effects'],
    },
    {
      id: 'm3',
      question: 'What happens to a pending `fetch(url, { signal })` when `controller.abort()` is called?',
      options: [
        { id: 'a', text: 'It resolves with an empty Response', explanation: 'Abort does not resolve the promise.' },
        { id: 'b', text: 'It rejects with a DOMException whose name is "AbortError"', explanation: 'Correct (unless abort() is given a custom reason).' },
        { id: 'c', text: 'Nothing — abort only works before the request is sent', explanation: 'Abort works during the request and while reading the body.' },
        { id: 'd', text: 'It throws synchronously from abort()', explanation: 'abort() does not throw; the fetch promise rejects.' },
      ],
      correctOptionId: 'b',
      explanation: 'Aborting rejects the fetch promise with an AbortError DOMException by default, which UIs should usually treat as "not an error".',
      sourceIds: ['mdn-abortcontroller'],
    },
  ],
};

export default problem;
