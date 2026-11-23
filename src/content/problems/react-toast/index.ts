import type { CodingProblem } from '../../schema';
import starterProvider from './starter/ToastProvider.tsx?raw';
import types from './starter/types.ts?raw';
import app from './starter/App.tsx?raw';
import styles from './starter/styles.css?raw';
import solutionProvider from './solution/ToastProvider.tsx?raw';
import helpers from './tests/helpers.tsx?raw';
import publicTests from './tests/public.test.tsx?raw';
import hiddenTests from './tests/hidden.test.tsx?raw';

const shared = { '/App.tsx': app, '/types.ts': types, '/styles.css': styles };

const problem: CodingProblem = {
  schemaVersion: 1,
  kind: 'coding',
  id: 'react-toast',
  slug: 'toast-notifications',
  title: 'Toast Notification System',
  track: 'react',
  execution: 'react',
  difficulty: 'medium',
  priority: 'P0',
  seniority: ['Senior', 'SDE-2', 'SDE-3', 'MTS'],
  topics: ['context API design', 'timers', 'pause/resume', 'queueing', 'ARIA live regions', 'stable callbacks', 'effect cleanup'],
  estimatedMinutes: 60,
  conceptIds: ['react-context', 'react-effects', 'fake-timers', 'closures', 'referential-equality', 'react-state-batching', 'immutable-updates', 'react-reconciliation-keys', 'focus-management'],
  research: {
    provenance: 'PUBLISHED_PRACTICE_PROBLEM',
    frequencyConfidence: 'HIGH_CONFIDENCE',
    verificationStatus: 'SOURCES_VERIFIED',
    lastVerified: '2026-11-23',
    evidence: [
      { sourceId: 'fg-mc', url: 'https://www.frontendgeek.com/frontend-interview/machine-coding-interview', originalTitle: 'Toast Notification', note: 'Listed under "Component machine coding".' },
      { sourceId: 'alla-components', url: 'https://allahabadi.dev/frontend-system-design/components/', originalTitle: 'Design a Toast / Notification System', note: 'Question 14 in the component design list (framed as system design; used as supporting evidence).' },
    ],
    researchNotes:
      'Two independent sources list a toast/notification system: one as machine coding, one as component system design. Both give titles only; the behaviour specified here (imperative API through context, auto-dismiss with pause/resume on hover and focus, a bounded visible stack with a FIFO queue, live-region announcements, unmount safety and stable callbacks) is the senior machine-coding scope, informed by react.dev guidance on context/effects and MDN on live regions. Animations, positioning options, swipe-to-dismiss, action buttons, deduplication and cross-tab sync are follow-ups.',
  },
  spec: {
    summary: 'Build a context-based toast system with auto-dismiss, pause-on-hover/focus with remaining-time resume, a bounded queue and accessible live-region announcements.',
    description: `Implement \`ToastProvider\` and \`useToast\` in **ToastProvider.tsx**. The public types live in the read-only **types.ts**:

\`\`\`ts
const { show, dismiss } = useToast();
const id = show('Profile saved', { type: 'success', duration: 4000 });
dismiss(id);

<ToastProvider max={3} defaultDuration={4000}>{app}</ToastProvider>
\`\`\`

Requirements:

1. **show(message, { type, duration })** adds a toast and returns a unique string id. \`type\` defaults to \`'info'\`, \`duration\` to the provider's \`defaultDuration\` (4000 ms). \`duration: 0\` or \`Infinity\` means **sticky** (no timer at all).
2. Toasts **auto-dismiss** after \`duration\` ms. Each toast has a close button whose accessible name contains "Dismiss"; \`dismiss(id)\` removes a visible or queued toast and ignores unknown ids.
3. **Pause on hover or focus**: while the pointer is over a toast *or* focus is inside it, its timer is paused. When both have left, it resumes with the **remaining** time, not the full duration. Pauses can happen any number of times.
4. At most **\`max\`** toasts (default 3) are visible. Extra toasts wait in a **FIFO queue** and appear when space frees; a queued toast's timer starts only when it becomes visible. Visible toasts are ordered **newest first**.
5. **Accessibility**: a polite live region (\`role="status"\`, \`aria-live="polite"\`) is rendered by the provider **before** any toast exists, and non-error toasts are inserted into it. **Error** toasts are announced assertively with \`role="alert"\` and are not inside the polite region. The viewport is a landmark labelled "Notifications".
6. **Robustness**: every timer is cleared when toasts or the provider unmount. \`useToast()\` outside a provider **throws** an error that mentions \`ToastProvider\`. \`show\` and \`dismiss\` keep the **same identity** across renders, and components that only call \`useToast()\` do not re-render when the toast list changes.

Each toast's root element must carry a \`data-toast\` attribute (tests use it to find the toast that contains a message). \`App.tsx\` and \`types.ts\` are read-only.`,
    technologies: ['React 18', 'TypeScript', 'React Context', 'setTimeout', 'ARIA live regions'],
    learningObjectives: [
      'Design an imperative API (show/dismiss) on top of declarative state via context',
      'Implement pause/resume timers that track remaining time across many cycles',
      'Use effect cleanup to make timers unmount-safe',
      'Keep context values referentially stable so consumers do not re-render',
      'Announce dynamic content correctly with polite and assertive live regions',
    ],
    clarifications: [
      { question: 'How is a toast triggered — a component, a hook, or a global function callable outside React?', why: 'A hook needs the provider in the tree; a global function needs an external store. It changes the whole architecture.', defaultAssumption: 'A `useToast()` hook returning `{ show, dismiss }` from a `<ToastProvider>`; a module-level API is a follow-up.' },
      { question: 'How many toasts can be on screen, and what happens to extras?', why: 'Unbounded stacks cover the page; dropping toasts loses information.', defaultAssumption: '`max` visible (default 3); extras wait in a FIFO queue and their timers start only when shown.' },
      { question: 'Which order — newest on top or oldest on top?', why: 'Affects layout and what a user sees first when several toasts arrive.', defaultAssumption: 'Newest first within the stack; errors are pinned in their own stack above other toasts.' },
      { question: 'Should timers pause on hover and keyboard focus? What happens on resume?', why: 'WCAG timing guidance: users must be able to read or act on content. Restarting the full duration on every hover is a different product decision.', defaultAssumption: 'Pause on hover or focus-within; resume with the remaining time.' },
      { question: 'How should screen readers be told about toasts, and are errors more urgent?', why: 'Live-region politeness decides whether announcements interrupt the user.', defaultAssumption: 'Polite `role="status"` region for normal toasts, `role="alert"` for errors.' },
    ],
    scopeDecisions: [
      'Toasts contain a plain-text message and a close button; action buttons ("Undo") are a follow-up.',
      'Bottom-right viewport only; no animations beyond a CSS entrance (respecting prefers-reduced-motion).',
      'No deduplication: showing the same message twice creates two toasts with different ids.',
      'Error toasts are grouped in their own stack above the polite region so that they are never inside it; ordering is newest-first within each stack.',
    ],
    requirements: [
      { id: 'show-returns-id', category: 'functional', level: 'MUST', text: '`show()` adds a toast and returns a unique string id; type defaults to info and duration to `defaultDuration` (4000 ms).' },
      { id: 'auto-dismiss', category: 'functional', level: 'MUST', text: 'A toast disappears exactly `duration` ms after it becomes visible.' },
      { id: 'sticky', category: 'edge-case', level: 'MUST', text: '`duration` 0 or Infinity makes a toast sticky; no timer is scheduled (setTimeout must never receive Infinity).' },
      { id: 'close', category: 'functional', level: 'MUST', text: 'Each toast has a close button (accessible name contains "Dismiss"); `dismiss(id)` removes visible or queued toasts and ignores unknown ids.' },
      { id: 'pause-resume', category: 'functional', level: 'MUST', text: 'Hover or focus inside a toast pauses its timer; leaving resumes with the remaining time, across any number of cycles.' },
      { id: 'hover-and-focus', category: 'edge-case', level: 'SHOULD', text: 'The toast stays paused until BOTH pointer and focus have left; moving focus inside the toast does not resume it.' },
      { id: 'max-queue', category: 'functional', level: 'MUST', text: 'At most `max` toasts are visible; extras queue FIFO and their timers start only when they become visible.' },
      { id: 'order', category: 'functional', level: 'SHOULD', text: 'Visible toasts are rendered newest first.' },
      { id: 'live-region', category: 'accessibility', level: 'MUST', text: 'A persistent role="status" aria-live="polite" region exists before the first toast and contains non-error toasts (aria-atomic="false").' },
      { id: 'alert', category: 'accessibility', level: 'MUST', text: 'Error toasts use role="alert" and are not inside the polite region.' },
      { id: 'landmark', category: 'accessibility', level: 'SHOULD', text: 'The toast viewport is a labelled region ("Notifications") and the close button is keyboard reachable.' },
      { id: 'unmount-safety', category: 'technical', level: 'MUST', text: 'All timers are cleared when a toast or the provider unmounts; nothing fires afterwards.' },
      { id: 'provider-guard', category: 'technical', level: 'MUST', text: '`useToast()` outside a provider throws an error that names ToastProvider.' },
      { id: 'stable-api', category: 'performance', level: 'MUST', text: '`show` and `dismiss` have stable identities; the context value is memoised so consumers do not re-render when toasts change.' },
      { id: 'immutable-state', category: 'technical', level: 'SHOULD', text: 'State updates use functional updaters and never mutate the toast array (e.g. no in-place `reverse()`).' },
      { id: 'fake-timer-tests', category: 'testing', level: 'SHOULD', text: 'Timing behaviour is tested with fake timers at exact boundaries (duration - 1 and duration).' },
    ],
    constraints: ['React function components and hooks only.', 'No third-party libraries.', 'Do not change the types in types.ts.'],
    acceptanceCriteria: [
      'All public tests pass (live region + show, auto-dismiss, close button, error alert, hover pause/resume, provider guard).',
      'All hidden tests pass (focus pause, repeated pause cycles, sticky toasts, max/queue timing, batched show calls + newest-first order, programmatic dismiss, unmount cleanup, stable API).',
      'Manual: with a screen reader, a success toast is announced politely and an error toast interrupts.',
    ],
    examples: [
      { title: 'Remaining time', input: 'show("Hi", { duration: 4000 }); wait 3000; hover; wait 10 000; leave', output: 'the toast disappears 1000 ms after leaving', explanation: '3000 ms had elapsed, so 1000 ms remained when the pause started.' },
      { title: 'Queue', input: 'max=2; show A (1 s), B (sticky), C (1 s)', output: 't=0: A, B visible; t=1 s: A gone, C appears; t=2 s: C gone', explanation: 'C\'s timer starts when it becomes visible, not when show() was called.' },
      { title: 'Sticky', input: 'show("Upload failed", { type: "error", duration: Infinity })', output: 'role="alert" toast that stays until dismissed; no timer scheduled' },
    ],
    manualTests: [
      'Click "Success" five times quickly: three toasts show, the rest appear as earlier ones expire.',
      'Hover a toast for 10 s, leave, and check it only stays for the time it had left.',
      'Tab to a toast\'s close button: the toast must not disappear while focused; Enter dismisses it.',
      'Click "Error (sticky)" and confirm it never auto-dismisses.',
      'With VoiceOver/NVDA, confirm success toasts are read after the current speech and errors interrupt.',
    ],
  },
  files: {
    entry: '/App.tsx',
    starter: { ...shared, '/ToastProvider.tsx': starterProvider },
    solution: { ...shared, '/ToastProvider.tsx': solutionProvider },
    readonly: ['/App.tsx', '/types.ts'],
    support: {},
  },
  tests: [
    { path: '/tests/helpers.tsx', visibility: 'public', kind: 'runtime', source: helpers },
    { path: '/tests/public.test.tsx', visibility: 'public', kind: 'runtime', source: publicTests },
    { path: '/tests/hidden.test.tsx', visibility: 'hidden', kind: 'runtime', source: hiddenTests },
  ],
  hints: [
    'Split responsibilities: the provider owns an array of toast records (oldest first) and exposes `{ show, dismiss }` through context; a `ToastItem` component owns ONE toast\'s timer. The first `max` records are visible, the rest are the queue.',
    'Make `show`/`dismiss` stable with `useCallback(..., [])` and functional updates (`setToasts(prev => ...)`), generate ids from a ref counter, then `useMemo` the `{ show, dismiss }` object. Throw in `useToast` when the context value is `null`.',
    'Timer per toast: keep `remaining` in a ref. An effect that depends on `paused` records `startedAt = Date.now()` and calls `setTimeout(dismiss, remaining.current)`; its cleanup clears the timer and subtracts the elapsed time. Pausing, resuming and unmounting are then all handled by the same cleanup.',
    '`paused = hovered || focused`. Use onMouseEnter/onMouseLeave and onFocus/onBlur (React\'s focus events bubble); in onBlur ignore focus moving to another element inside the same toast (`currentTarget.contains(relatedTarget)`). Render the `role="status"` region unconditionally so it exists before the first toast.',
  ],
  solution: {
    initialApproach: 'Keep the list of toasts declaratively in a provider and expose an imperative, referentially stable API through context. Push each toast\'s lifecycle (timer, pause state) down into its own component so that mounting, pausing and unmounting map directly onto effect setup and cleanup.',
    bruteForce: 'A common first version calls `setTimeout(() => remove(id), duration)` inside `show()`. It works for the happy path, but the timer cannot be paused, it starts while the toast is still queued, it keeps running (and calls setState) after the provider unmounts, and `show` is recreated every render because it closes over the current `toasts` array (`setToasts([...toasts, t])`) — which also loses toasts when two are shown in the same tick.',
    optimizedApproach: `**Provider (state + API)**
- \`toasts: ToastRecord[]\` in creation order. \`visible = toasts.slice(0, max).reverse()\` (newest first, copy before reversing); everything after index \`max\` is the queue. When a visible toast is removed, the next queued one simply falls into the slice — no separate queue structure.
- \`show\` and \`dismiss\` use **functional updates**, so they don't close over \`toasts\` and can be \`useCallback(…, [])\`. Ids come from \`useId()\` + a ref counter (unique across providers). The latest \`defaultDuration\` is read from a ref.
- The context value is \`useMemo(() => ({ show, dismiss }))\`. Because the toast list is **not** in context, a component that only calls \`useToast()\` never re-renders when toasts change.

**ToastItem (timer)**
- \`remaining\` ref starts at \`duration\`. \`paused = hovered || focused\`.
- \`useEffect(() => { if (sticky || paused) return; start = Date.now(); t = setTimeout(() => onDismiss(id), remaining.current); return () => { clearTimeout(t); remaining.current -= Date.now() - start; }; }, [paused, sticky, id, onDismiss])\`.
- The cleanup runs on pause, on unmount and before any re-run, so one code path handles pause/resume bookkeeping and unmount safety. Queued toasts aren't mounted, so their timers naturally start on appearance.
- Sticky (\`0\`, \`Infinity\`, negative) never schedules a timer — passing \`Infinity\` to \`setTimeout\` overflows the 32-bit delay and fires almost immediately.

**Accessibility**
- \`<section aria-label="Notifications">\` contains (1) a stack for error toasts, each message with \`role="alert"\`, and (2) a **persistent** \`role="status" aria-live="polite" aria-atomic="false"\` stack for everything else. Live regions must exist before content is inserted to be announced reliably; \`role="status"\` implies \`aria-atomic="true"\`, which would re-read every toast on each change, hence the override.
- Focus inside a toast (e.g. on the close button) pauses it, so keyboard users get as much time as mouse users.`,
    walkthrough: `1. \`show("Saved", { type: "success" })\`: increment the counter, build \`{ id, message, type, duration }\`, \`setToasts(prev => [...prev, toast])\`, return the id synchronously.
2. Render: slice the first \`max\` records, reverse a copy, split into errors and others, render a \`ToastItem\` keyed by id in the right stack. Keys are ids, so a toast keeps its state (and its \`remaining\` ref) when others are added or removed.
3. \`ToastItem\` mounts → effect starts a timer for \`remaining.current\`.
4. \`mouseenter\` → \`hovered = true\` → \`paused\` flips → React runs the previous cleanup: clear the timer, \`remaining -= elapsed\`. The new effect run returns early because paused.
5. \`mouseleave\` (and not focused) → \`paused = false\` → new effect run starts a timer for the remaining time.
6. Timer fires → \`dismiss(id)\` → the record is filtered out (same array returned for unknown ids, so React bails out) → the item unmounts → its cleanup clears the already-fired timer harmlessly. If a toast was queued, it is now inside the slice, mounts, and starts its own full-duration timer.
7. Provider unmounts → every \`ToastItem\` cleanup clears its timer, so no callback or setState runs later.
8. \`useToast()\` reads the context; \`null\` means no provider → throw a descriptive error.`,
    complexity: '`show` and `dismiss` are O(n) in the number of stored toasts (array copy/filter), which is tiny in practice. Each render slices O(max). Each visible toast owns exactly one pending timer at most; queued toasts own none, so pending timers ≤ max.',
    edgeCases: `- \`duration: 0\`, \`Infinity\`, negative → sticky, no timer.
- Hover and focus overlap → paused until both end; focus moving between the message and the close button doesn't resume.
- Many pause/resume cycles → remaining time is decremented each time (never reset to the full duration).
- Dismissing a queued toast before it is ever visible → removed, never shown.
- \`dismiss\` with an unknown id → no-op and no re-render (same array returned).
- Two \`show\` calls in the same event → both kept, thanks to functional updates.
- Toast removed while hovered → \`mouseleave\` never fires, but the component is gone, so no stale paused state lingers.
- Provider unmount with pending timers → all cleared.
- Two providers on a page → ids are prefixed with \`useId()\` so they never collide.`,
    alternatives: `- **Timers in the provider** (a \`Map<id, { timer, remaining, startedAt }>\` in a ref): avoids a component per toast, but you must re-implement mount/unmount bookkeeping and remember to clear the whole map on unmount.
- **External store + \`useSyncExternalStore\`**: \`toast.show()\` callable from anywhere (fetch interceptors, Redux middleware, non-React code); the viewport subscribes to the store. This is how many popular toast libraries work.
- **Reducer** (\`useReducer\` with ADD/REMOVE actions): clearer state transitions when you add update/replace, dedupe or "promise toasts".
- **CSS animation-based timing** (an animation on the toast, paused with \`animation-play-state: paused\` on hover, dismissed on \`animationend\`): elegant and gives a progress bar for free, but couples logic to CSS and is awkward with prefers-reduced-motion and tests.
- **A single global live-region "announcer"** that receives text separately from the visual toasts: maximum control over what is read, at the cost of duplicating content.`,
    tradeoffs: `- **Per-toast component vs central timer map**: the component approach leans on React's lifecycle for correctness; the map is more explicit and easier to pause globally (e.g. pause all when the window loses focus).
- **Newest-first vs oldest-first**: newest-first surfaces the latest event; oldest-first keeps existing toasts from moving under the pointer (less layout shift while the user is hovering).
- **Splitting errors into their own stack** keeps the polite region free of assertive content, at the cost of a strict global chronological order.
- **\`role="alert"\` for errors** guarantees prompt announcement but interrupts the user — reserve it for genuinely important, time-sensitive messages.
- **Queueing vs dropping**: a queue never loses information but may show stale toasts long after the event; some products cap the queue or collapse duplicates.`,
    commonMistakes: `- Resuming with the full \`duration\` instead of the remaining time.
- Scheduling \`setTimeout(fn, Infinity)\` for sticky toasts — it fires almost immediately in real browsers.
- Starting the timer in \`show()\`, so queued toasts expire before anyone sees them.
- Not clearing timers on unmount (callbacks and setState after unmount, leaks in tests).
- \`setToasts([...toasts, t])\` inside \`show\`: stale closure, unstable callback, lost toasts when called twice in one tick.
- Putting the toast array in the same context as the API, so every consumer re-renders on every toast.
- Calling \`toasts.reverse()\` during render — mutates state in place.
- Creating the \`role="status"\` region together with the first toast, so the first announcement is often missed.
- Pausing only on hover, leaving keyboard users with a disappearing close button.
- Default context value \`{ show: () => {} }\` instead of \`null\` + throw: missing providers fail silently.`,
    testingStrategy: 'Use fake timers and assert both sides of every boundary (`duration - 1` still visible, `duration` gone). Drive the API through a small consumer component and wrap `show`/`dismiss` calls in `act`. Cover remaining-time maths with several pause cycles, hover + focus overlap, queue timing (a queued toast must live its full duration after appearing), sticky toasts via `timers.pendingCount() === 0`, unmount cleanup via the pending-timer count, and the stable API by counting consumer renders. Query accessibility contracts directly: `getByRole("status")` exists before any toast and is the same element afterwards, errors are `getByRole("alert")` and not inside the status region.',
    seniorFollowUps: `- Make \`toast.show()\` callable outside React (an external store with \`useSyncExternalStore\`); how do you handle SSR and multiple roots?
- Add \`toast.promise(p, { loading, success, error })\` that updates a toast in place — what does \`update(id, patch)\` do to timers?
- Pause all toasts when the tab is hidden (\`visibilitychange\`) or the window loses focus.
- Deduplicate identical messages (show a counter instead) and rate-limit floods from a failing poller.
- Action toasts ("Undo"): they must be reachable by keyboard before they vanish — WCAG 2.2.1 Timing Adjustable; consider a landmark + hotkey (F8) to jump to notifications.
- Animations: exit transitions mean a toast stays mounted after dismissal — how do you model "leaving" state and keep \`max\` accounting correct?`,
  },
  followUps: [
    { id: 'f1', level: 'definition', question: 'What is an ARIA live region, and how do `role="status"` and `role="alert"` differ?', expectedConcepts: ['region whose changes are announced without focus moving', 'status = polite, atomic', 'alert = assertive, interrupts', 'use alert sparingly'], sourceIds: ['mdn-live-regions'] },
    { id: 'f2', level: 'mechanism', question: 'Walk through exactly what happens to the timer when a user hovers a toast after 3 s of a 4 s duration, leaves, then the provider unmounts 500 ms later.', expectedConcepts: ['effect cleanup on dependency change', 'remaining = 1000', 'new timer for remaining time', 'cleanup on unmount clears the timer'], sourceIds: ['react-sync-effects', 'react-useeffect'] },
    { id: 'f3', level: 'application', question: 'Every component that calls `useToast()` re-renders whenever a toast appears. Why, and how do you fix it?', expectedConcepts: ['context value identity changes', 'useMemo / useCallback', 'split state and API contexts', 'functional updates remove dependencies'], sourceIds: ['react-context'] },
    { id: 'f4', level: 'edge-cases', question: 'A sticky toast passes `duration: Infinity` straight to `setTimeout`. What happens in a real browser, and why might your fake-timer tests not notice?', expectedConcepts: ['delay converted to 32-bit signed int', 'overflow → fires almost immediately', 'fake timers may treat Infinity as "never"', 'assert no timer is scheduled instead'], sourceIds: ['mdn-settimeout', 'tl-fake-timers'] },
    { id: 'f5', level: 'production', question: 'An API outage makes a poller emit an error toast every second. How do you keep the UI and screen-reader experience usable?', expectedConcepts: ['deduplicate by key with a counter', 'rate limiting', 'cap the queue', 'avoid flooding assertive announcements', 'single persistent banner instead'], sourceIds: ['mdn-live-regions'] },
    { id: 'f6', level: 'architecture', question: 'Design a notification system for a large app: toasts must be triggerable from non-React code (HTTP interceptors), multiple micro-frontends, and persisted "inbox" notifications. What are the layers?', expectedConcepts: ['external store / event bus', 'useSyncExternalStore subscription', 'single viewport per page', 'separation of transient toasts and persistent inbox', 'type-safe event contract'], sourceIds: ['react-context'] },
  ],
  mcqs: [
    {
      id: 'm1',
      question: 'A toast has `duration: 5000`. The user hovers it at t=2000 ms and leaves at t=9000 ms. With correct pause/resume, when does it disappear?',
      options: [
        { id: 'a', text: 't = 5000 ms', explanation: 'That ignores the pause entirely.' },
        { id: 'b', text: 't = 12000 ms', explanation: 'Correct — 2000 ms elapsed before the pause, so 3000 ms remain after leaving at 9000 ms.' },
        { id: 'c', text: 't = 14000 ms', explanation: 'That restarts the full duration on resume — the common bug this question targets.' },
        { id: 'd', text: 'Never — hovering cancels the timer', explanation: 'Pausing is not cancelling; the toast resumes when the pointer leaves.' },
      ],
      correctOptionId: 'b',
      explanation: 'Track remaining time: on pause subtract the elapsed time since the timer started; on resume schedule only what is left.',
      sourceIds: ['mdn-settimeout'],
    },
    {
      id: 'm2',
      question: 'Why should the polite live region for toasts be rendered by the provider before any toast exists, instead of rendering `<div role="status">` together with each toast?',
      options: [
        { id: 'a', text: 'Screen readers watch regions already in the DOM; content inserted together with a new region is often not announced', explanation: 'Correct — assistive tech tracks changes inside existing live regions; a region that appears with its content may be missed.' },
        { id: 'b', text: 'React cannot render role attributes conditionally', explanation: 'It can; this is about assistive-technology behaviour.' },
        { id: 'c', text: 'role="status" is only valid on the document root', explanation: 'status can be used on any element.' },
        { id: 'd', text: 'It makes the toasts render faster', explanation: 'Performance is not the reason.' },
      ],
      correctOptionId: 'a',
      explanation: 'Live regions should be present (ideally empty) before updates happen; then additions to them are announced. MDN recommends ensuring the region is in the DOM before content changes.',
      sourceIds: ['mdn-live-regions'],
    },
    {
      id: 'm3',
      question: 'Inside a provider, `const show = (msg) => setToasts([...toasts, make(msg)])` is passed through context as `{ show }`. Which problem does NOT apply?',
      options: [
        { id: 'a', text: 'Calling show twice in the same event handler keeps only the second toast', explanation: 'This does apply: both calls read the same stale `toasts` array.' },
        { id: 'b', text: 'Every useToast() consumer re-renders whenever the provider re-renders', explanation: 'This does apply: a new `{ show }` object is created every render.' },
        { id: 'c', text: 'An effect with `[show]` as a dependency re-runs on every provider render', explanation: 'This does apply: `show` is a new function every render.' },
        { id: 'd', text: 'The toast array is mutated in place', explanation: 'Correct — spreading into a new array is an immutable update; the problems are stale closures and unstable identity, not mutation.' },
      ],
      correctOptionId: 'd',
      explanation: 'Use a functional update (`setToasts(prev => [...prev, t])`) so `show` needs no dependencies, wrap it in useCallback, and memoise the context value.',
      sourceIds: ['react-context', 'react-queueing'],
    },
  ],
};

export default problem;
