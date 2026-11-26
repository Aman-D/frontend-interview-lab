import type { CodingProblem } from '../../schema';
import starter from './starter/solution.js?raw';
import solution from './solution/solution.js?raw';
import publicTests from './tests/public.test.js?raw';
import hiddenTests from './tests/hidden.test.js?raw';

const problem: CodingProblem = {
  schemaVersion: 1,
  kind: 'coding',
  id: 'js-throttle',
  slug: 'throttle',
  title: 'Implement throttle() with leading + trailing calls and cancel()',
  track: 'javascript',
  execution: 'js',
  difficulty: 'medium',
  priority: 'P0',
  seniority: ['Senior', 'SDE-2', 'SDE-3'],
  topics: ['timers', 'closures', 'rate limiting', 'this binding', 'scroll and resize handlers'],
  estimatedMinutes: 20,
  conceptIds: ['throttling', 'debouncing', 'closures', 'this-binding', 'fake-timers'],
  research: {
    provenance: 'PUBLISHED_PRACTICE_PROBLEM',
    frequencyConfidence: 'HIGH_CONFIDENCE',
    verificationStatus: 'SOURCES_VERIFIED',
    lastVerified: '2026-11-26',
    evidence: [
      { sourceId: 'bfe-problems', url: 'https://bigfrontend.dev/problem/implement-basic-throttle', originalTitle: '4. implement basic throttle()' },
      { sourceId: 'bfe-problems', url: 'https://bigfrontend.dev/problem/implement-throttle-with-leading-and-trailing-option', originalTitle: '5. implement throttle() with leading & trailing option', note: 'Used for the options follow-up.' },
      { sourceId: 'fih-js', url: 'https://www.frontendinterviewhandbook.com/coding/javascript-utility-function', originalTitle: 'throttle()', note: 'Named alongside debounce() as a basic utility-function question.' },
    ],
    researchNotes:
      'Listed independently by BFE.dev and the Front End Interview Handbook (catalog row 3). This version fixes the behaviour to leading + trailing (lodash defaults) and requires cancel(), because "implement debounce and throttle with cancellation" is how the question is usually extended for senior roles.',
  },
  spec: {
    summary: 'Write throttle(fn, wait): run at most once per window, immediately on the first call and once more at the end of a busy window with the latest arguments.',
    description: `Implement \`throttle(fn, wait)\`.

- **Leading edge**: if no window is open, call \`fn\` immediately and open a \`wait\` ms window.
- **During the window** calls are not executed; only the **latest** arguments and \`this\` are remembered.
- **Trailing edge**: when the window ends, if any call happened during it, call \`fn\` once with the latest arguments — and that call **opens a new window**.
- \`throttled.cancel()\` drops a pending trailing call and closes the window.

\`\`\`js
const onScroll = throttle(() => updateStickyHeader(window.scrollY), 100);
window.addEventListener('scroll', onScroll, { passive: true });
\`\`\``,
    technologies: ['JavaScript', 'setTimeout', 'closures'],
    learningObjectives: [
      'Model a throttle as a small state machine (idle → window open → pending trailing)',
      'Forward the latest `this` and arguments',
      'Explain throttle vs debounce and when to choose requestAnimationFrame instead',
    ],
    clarifications: [
      { question: 'Leading, trailing or both?', why: 'Leading gives instant feedback; trailing guarantees the final state is processed (e.g. last scroll position).', defaultAssumption: 'Both (the lodash default).' },
      { question: 'Which arguments does the trailing call use?', why: 'For scroll/resize only the latest state matters.', defaultAssumption: 'The latest call during the window.' },
      { question: 'Does the trailing call start a new window?', why: 'Without it, a call right after the trailing call runs immediately, so fn can run twice within `wait`.', defaultAssumption: 'Yes.' },
      { question: 'Is cancel() required?', why: 'Components must drop pending work on unmount.', defaultAssumption: 'Yes.' },
    ],
    scopeDecisions: ['No { leading, trailing } options (follow-up).', 'No flush().', 'Timers are the global setTimeout/clearTimeout.'],
    requirements: [
      { id: 'leading', category: 'functional', level: 'MUST', text: 'The first call in an idle state runs fn synchronously.' },
      { id: 'at-most-once', category: 'functional', level: 'MUST', text: 'fn never runs more than once per `wait` ms window.' },
      { id: 'trailing', category: 'functional', level: 'MUST', text: 'Calls during a window produce exactly one trailing call at its end, with the latest arguments.' },
      { id: 'no-extra-trailing', category: 'edge-case', level: 'MUST', text: 'A single call produces no trailing call.' },
      { id: 'trailing-opens-window', category: 'technical', level: 'MUST', text: 'The trailing call opens a new window.' },
      { id: 'this-forwarding', category: 'technical', level: 'MUST', text: 'fn receives the `this` of the call whose arguments it uses.' },
      { id: 'cancel', category: 'functional', level: 'MUST', text: 'cancel() drops the pending call and resets to idle.' },
      { id: 'independent', category: 'technical', level: 'MUST', text: 'Throttled functions do not share state.' },
      { id: 'no-leftover-timers', category: 'performance', level: 'SHOULD', text: 'No timer remains after a quiet window.' },
      { id: 'options', category: 'functional', level: 'OPTIONAL', text: 'Support { leading: false } and { trailing: false }.' },
    ],
    constraints: ['No libraries.', 'O(1) work per call.'],
    acceptanceCriteria: ['All public tests pass.', 'All hidden tests pass (continuous stream, new window after trailing, this, cancel, independence, no leftover timers).'],
    examples: [
      { title: 'Busy window', input: 't(1)@0, t(2)@30, t(3)@60, wait = 100', output: 'fn(1)@0, fn(3)@100' },
      { title: 'Quiet', input: 't(1)@0, t(2)@150, wait = 100', output: 'fn(1)@0, fn(2)@150' },
    ],
    manualTests: ['Throttle a scroll handler that logs scrollY and confirm the final position is always logged.'],
  },
  files: {
    entry: '/solution.js',
    starter: { '/solution.js': starter },
    solution: { '/solution.js': solution },
    readonly: [],
    support: {},
  },
  tests: [
    { path: '/tests/public.test.js', visibility: 'public', kind: 'runtime', source: publicTests },
    { path: '/tests/hidden.test.js', visibility: 'hidden', kind: 'runtime', source: hiddenTests },
  ],
  hints: [
    'You need two pieces of state: "is a window open?" (a timer id) and "the latest call made during the window" (args + this).',
    'If no window is open: start the timer, then call fn. Otherwise just overwrite the pending args/this.',
    'When the timer fires: if there are pending args, call fn with them and start another window; else mark the window closed.',
    'cancel() = clearTimeout + reset both pieces of state.',
  ],
  solution: {
    initialApproach: 'A timestamp check (`if (now - last >= wait) call`) gives leading-only throttling — simple, but the last call in a burst is lost, so a scroll handler can miss the final position.',
    bruteForce: 'Queueing every call and draining one per interval with setInterval is not throttling: it delays work without dropping it, so a burst of 1,000 scroll events takes 100 seconds to drain.',
    optimizedApproach: 'A timer marks an open window. Calls while it is open only overwrite pendingArgs/pendingThis. When it fires, run one trailing call with the latest values and reopen the window; if nothing is pending, close it. This gives leading + trailing behaviour with one timer and O(1) work per call.',
    walkthrough: `1. \`timerId === null\` means idle. The first call opens the window (\`startWindow\`) **before** calling fn, so a re-entrant call inside fn is treated as "during the window".
2. While open, calls store the latest \`args\`/\`this\` — earlier ones are discarded.
3. \`endWindow\`: with pending args, clear them, open a new window and call fn; without, set \`timerId = null\`.
4. Reopening on the trailing call enforces "at most once per wait" — otherwise a call right after the trailing call would run immediately.
5. \`cancel\` clears the timer and pending state, returning to idle.`,
    complexity: 'O(1) time per call, O(1) memory per throttled function plus the latest arguments.',
    edgeCases: '- A single call: only the leading call.\n- fn throwing on the leading call: the window is already open, so throttling still holds.\n- cancel() when idle: no-op.\n- Background tabs: browsers throttle timers, so the trailing call may arrive late.',
    alternatives: '- **requestAnimationFrame throttling** for visual updates: at most once per frame, aligned with paint.\n- **lodash.throttle** is implemented as debounce with `maxWait = wait`.\n- **IntersectionObserver / ResizeObserver** often remove the need to throttle scroll/resize handlers at all.',
    tradeoffs: 'Throttle bounds latency (the user sees updates every `wait` ms during activity) but does more work than debounce. Debounce does the least work but shows nothing until the user stops. Use throttle for continuous feedback (scroll position, drag, progress), debounce for "act once the user is done" (search, autosave).',
    commonMistakes: '- Losing the final call (leading-only timestamp approach).\n- Using the first call\'s arguments for the trailing call.\n- Not reopening the window after the trailing call.\n- Arrow function for the returned function (loses `this`).\n- Module-level timer shared between instances.',
    testingStrategy: 'Fake timers. Assert call counts at window boundaries (wait - 1 and wait), the trailing arguments, that a call right after the trailing call is throttled, `this` forwarding, cancel, and that no timers are pending after a quiet window.',
    seniorFollowUps: '- Add `{ leading, trailing }` options. What does `{ leading: false, trailing: false }` mean?\n- Why is rAF better than throttle(16) for animations?\n- How would you throttle inside a React component (stable instance, cancel on unmount, latest props via ref)?\n- Throttle vs debounce for an autosave in a rich text editor?',
  },
  followUps: [
    { id: 'f1', level: 'definition', question: 'Explain throttle vs debounce with one real UI example each.', expectedConcepts: ['throttle at most once per interval', 'debounce after quiet period', 'scroll vs search input'], sourceIds: ['mdn-debounce'] },
    { id: 'f2', level: 'mechanism', question: 'Why must the trailing call open a new window?', expectedConcepts: ['otherwise two calls within wait', 'at-most-once guarantee'], sourceIds: ['bfe-problems'] },
    { id: 'f3', level: 'application', question: 'Add leading/trailing options. Walk through { leading: false } for a single call.', expectedConcepts: ['no immediate call', 'trailing call at wait', 'timer still needed'], sourceIds: ['bfe-problems'] },
    { id: 'f4', level: 'edge-cases', question: 'A throttled scroll handler sometimes shows the wrong final position. Why?', expectedConcepts: ['leading-only implementation drops last event', 'trailing call needed'], sourceIds: ['bfe-problems'] },
    { id: 'f5', level: 'production', question: 'When would you choose requestAnimationFrame or IntersectionObserver over throttle?', expectedConcepts: ['rAF aligns with paint', 'observers avoid scroll listeners', 'passive listeners'], sourceIds: ['mdn-intersection-observer'] },
  ],
  mcqs: [
    {
      id: 'm1',
      question: 'throttle(fn, 100) with leading + trailing. Calls at t = 0, 20, 40 and 250. When does fn run?',
      options: [
        { id: 'a', text: '0, 100, 250', explanation: 'Correct: leading at 0, trailing (args of t=40) at 100 which opens a window until 200, then 250 is a fresh leading call.' },
        { id: 'b', text: '0 and 250 only', explanation: 'That is leading-only; the calls at 20/40 should produce a trailing call.' },
        { id: 'c', text: '140 and 350', explanation: 'That is debounce behaviour.' },
        { id: 'd', text: '0, 20, 40, 250', explanation: 'That is no throttling at all.' },
      ],
      correctOptionId: 'a',
      explanation: 'Leading call immediately; calls inside the window collapse into one trailing call at the end of the window.',
      sourceIds: ['bfe-problems'],
    },
    {
      id: 'm2',
      question: 'Which handler is the best fit for debounce rather than throttle?',
      options: [
        { id: 'a', text: 'Updating a progress bar while the user drags a slider', explanation: 'Needs continuous feedback — throttle or rAF.' },
        { id: 'b', text: 'Fetching search suggestions after the user stops typing', explanation: 'Correct — only the final input matters.' },
        { id: 'c', text: 'Showing a "back to top" button based on scroll position', explanation: 'Continuous state — throttle or IntersectionObserver.' },
        { id: 'd', text: 'Tracking mouse position for a tooltip', explanation: 'Continuous — rAF/throttle.' },
      ],
      correctOptionId: 'b',
      explanation: 'Debounce waits for a quiet period; throttle guarantees regular updates during activity.',
      sourceIds: ['mdn-debounce'],
    },
    {
      id: 'm3',
      question: 'Why does the reference solution start the timer before calling fn on the leading edge?',
      options: [
        { id: 'a', text: 'setTimeout must be called before any function', explanation: 'There is no such rule.' },
        { id: 'b', text: 'So a call made from inside fn (or after fn throws) is treated as inside the window', explanation: 'Correct — the window is open before user code runs.' },
        { id: 'c', text: 'It makes fn run asynchronously', explanation: 'fn still runs synchronously.' },
        { id: 'd', text: 'It is required for `this` forwarding', explanation: '`this` is forwarded with apply regardless of order.' },
      ],
      correctOptionId: 'b',
      explanation: 'Updating state before invoking user code keeps the invariant even when fn re-enters or throws.',
      sourceIds: ['mdn-settimeout'],
    },
  ],
};

export default problem;
