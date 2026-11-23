import type { CodingProblem } from '../../schema';
import starter from './starter/solution.js?raw';
import solution from './solution/solution.js?raw';
import publicTests from './tests/public.test.js?raw';
import hiddenTests from './tests/hidden.test.js?raw';

const problem: CodingProblem = {
  schemaVersion: 1,
  kind: 'coding',
  id: 'js-debounce',
  slug: 'debounce',
  title: 'Implement debounce()',
  track: 'javascript',
  execution: 'js',
  difficulty: 'easy',
  priority: 'P0',
  seniority: ['Senior', 'SDE-2', 'SDE-3'],
  topics: ['timers', 'closures', 'this binding', 'rate limiting'],
  estimatedMinutes: 15,
  conceptIds: ['debouncing', 'closures', 'this-binding', 'event-loop', 'fake-timers'],
  research: {
    provenance: 'PUBLISHED_PRACTICE_PROBLEM',
    frequencyConfidence: 'HIGH_CONFIDENCE',
    verificationStatus: 'SOURCES_VERIFIED',
    lastVerified: '2026-11-23',
    evidence: [
      { sourceId: 'bfe-problems', url: 'https://bigfrontend.dev/problem/implement-basic-debounce', originalTitle: '6. implement basic debounce()' },
      { sourceId: 'bfe-problems', url: 'https://bigfrontend.dev/problem/implement-debounce-with-leading-and-trailing-option', originalTitle: '7. implement debounce() with leading & trailing option', note: 'Used for the leading-edge follow-up.' },
      { sourceId: 'fih-js', url: 'https://www.frontendinterviewhandbook.com/coding/javascript-utility-function', originalTitle: 'Debounce', note: 'Listed under "Where to practice"; the page also names debounce() as one of the most famous utility-function questions.' },
    ],
    researchNotes:
      'Listed independently by BFE.dev and the Front End Interview Handbook. The handbook suggests ~10–15 minutes for basic utility questions. This version adds cancel() because it is the most common production need; flush() appears only in the reference solution and follow-ups.',
  },
  spec: {
    summary: 'Write debounce(fn, wait): collapse a burst of calls into a single trailing call with the latest arguments.',
    description: `Implement \`debounce(fn, wait)\`.

The returned function delays invoking \`fn\` until \`wait\` milliseconds have passed **since the last call**. Every new call restarts the timer. When \`fn\` finally runs it receives the **arguments and \`this\` of the most recent call**.

The debounced function must also expose \`cancel()\`, which discards a pending invocation.

\`\`\`js
const save = debounce((text) => api.save(text), 300);
input.addEventListener('input', (e) => save(e.target.value));
// typing "abc" quickly → api.save('abc') once, 300ms after the last keystroke
\`\`\``,
    technologies: ['JavaScript', 'setTimeout', 'closures'],
    learningObjectives: [
      'Hold per-instance state in a closure',
      'Forward `this` and arguments correctly',
      'Reason about timer ordering with a fake clock',
      'Explain debounce vs throttle and leading vs trailing edges',
    ],
    clarifications: [
      { question: 'Leading edge, trailing edge, or both?', why: 'Changes when the first call fires — e.g. a button should react immediately (leading) while search-as-you-type waits (trailing).', defaultAssumption: 'Trailing edge only.' },
      { question: 'Which arguments are used when fn finally runs?', why: 'First-call vs last-call arguments produce different behaviour for inputs.', defaultAssumption: 'The arguments of the last call.' },
      { question: 'Should the debounced function return a value?', why: 'A delayed call cannot return its result synchronously; returning a Promise is a different API.', defaultAssumption: 'Returns undefined.' },
      { question: 'Do we need cancel() / flush()?', why: 'Components must cancel pending work on unmount; flush() is needed for "save before navigating away".', defaultAssumption: 'cancel() is required, flush() is optional.' },
    ],
    scopeDecisions: ['No maxWait option.', 'No leading-edge option (covered in follow-ups).', 'Timers are the global setTimeout/clearTimeout.'],
    requirements: [
      { id: 'no-sync-call', category: 'functional', level: 'MUST', text: 'Calling the debounced function never invokes fn synchronously.' },
      { id: 'trailing-call', category: 'functional', level: 'MUST', text: 'fn runs exactly once, `wait` ms after the last call in a burst.' },
      { id: 'last-args', category: 'functional', level: 'MUST', text: 'fn receives the arguments of the most recent call.' },
      { id: 'this-forwarding', category: 'technical', level: 'MUST', text: '`this` inside fn is the `this` of the most recent call.' },
      { id: 'cancel', category: 'functional', level: 'MUST', text: 'debounced.cancel() discards a pending invocation; later calls work normally.' },
      { id: 'independent-instances', category: 'technical', level: 'MUST', text: 'Two debounced functions never share timer state.' },
      { id: 'wait-zero', category: 'edge-case', level: 'SHOULD', text: 'wait = 0 still defers to a macrotask.' },
      { id: 'flush', category: 'functional', level: 'OPTIONAL', text: 'debounced.flush() immediately invokes a pending call and returns its result.' },
      { id: 'memory', category: 'performance', level: 'SHOULD', text: 'References to the last arguments are released after invocation or cancel.' },
      { id: 'fake-timer-tests', category: 'testing', level: 'SHOULD', text: 'Tests use a fake clock instead of real waiting.' },
    ],
    constraints: ['No libraries (no lodash).', 'O(1) work per call.'],
    acceptanceCriteria: ['All public tests pass.', 'All hidden tests pass (this, separate bursts, cancel, wait = 0, independence).'],
    examples: [
      { title: 'Burst', input: 'd("a") at t=0, d("b") at t=50, wait = 100', output: 'fn("b") at t=150', explanation: 'The second call restarts the 100 ms timer.' },
      { title: 'Two bursts', input: 'd(1) at t=0, d(2) at t=200, wait = 100', output: 'fn(1) at t=100, fn(2) at t=300' },
    ],
    manualTests: ['Wire it to an <input> in a scratch page and confirm only one log line appears after you stop typing.'],
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
    'You need state that survives between calls of the returned function but is private to it. Where can a variable live so that each debounce() call gets its own copy?',
    'Store the timer id. On every call: clear the previous timer, then schedule a new one.',
    'Use a regular `function` (not an arrow) for the returned function so you can capture `this`, and save the latest `this`/arguments in the closure.',
    'cancel() = clearTimeout + reset the stored state. Attach it as a property of the returned function.',
  ],
  solution: {
    initialApproach: 'Keep a timer id in a closure. Every call clears the old timer and schedules a new one, so the callback only survives if no call happens for `wait` ms.',
    bruteForce: 'Recording a timestamp per call and polling with setInterval works but wastes CPU and makes timing depend on the polling interval — mention it only to reject it.',
    optimizedApproach: 'One timer per debounced instance. Store `lastArgs`/`lastThis` on each call; the timer callback invokes `fn.apply(lastThis, lastArgs)` and then releases the references. `cancel()` clears the timer and state; `flush()` runs the pending call immediately.',
    walkthrough: `1. **Validate** \`fn\` — failing fast beats a confusing error 300 ms later.
2. **Closure state**: \`timerId\`, \`lastArgs\`, \`lastThis\` live in \`debounce\`'s scope, so each debounced function has its own.
3. **\`debounced(...args)\`** is a \`function\` expression so \`this\` is the caller's receiver (an arrow function would capture \`debounce\`'s \`this\`).
4. Each call **overwrites** \`lastArgs/lastThis\`, then \`clearTimeout(timerId)\` and schedules \`invoke\` again — this is the "restart the timer" step.
5. **\`invoke\`** copies the saved args/context, resets state *before* calling \`fn\` (so a re-entrant call from inside \`fn\` schedules correctly), and calls \`fn.apply\`.
6. **\`cancel\`** clears the timer and nulls the references so large arguments (events, DOM nodes) can be garbage-collected.
7. **\`flush\`** is a no-op without a pending call; otherwise it clears the timer and invokes synchronously.`,
    complexity: 'Each call is O(1) time. Memory is O(1) per debounced function plus the retained arguments of the pending call.',
    edgeCases: '- `wait = 0` still defers to the timer queue — it is not synchronous.\n- `fn` throwing inside the timer surfaces as an uncaught error; state is already reset, so the next burst still works.\n- Re-entrant calls from inside `fn` schedule a new timer because state is reset before invoking.\n- Calling `cancel()` with nothing pending is a no-op.',
    alternatives: '- **Leading edge** (`{ leading: true }`): invoke on the first call, then ignore until quiet for `wait` ms.\n- **maxWait**: guarantee an invocation at least every N ms during a continuous burst (this is how lodash builds `throttle` on top of `debounce`).\n- **Promise-returning debounce**: resolve every caller in a burst with the single result.\n- **requestAnimationFrame** batching for visual updates instead of a fixed wait.',
    tradeoffs: 'Debounce minimises calls but adds latency equal to `wait` after the user stops; throttle bounds latency but makes more calls. For search-as-you-type, debounce + aborting stale requests is the usual combination: debounce reduces load, abort guarantees correctness.',
    commonMistakes: '- Using an arrow function for the returned function, which loses the caller\'s `this`.\n- Declaring `timerId` at module level, so all debounced functions share one timer.\n- Calling `fn` with the *first* call\'s arguments.\n- Forgetting `clearTimeout`, which produces one call per input instead of one per burst.\n- Writing tests with real timers and `await sleep()`, which makes them slow and flaky.',
    testingStrategy: 'Use a fake clock and assert the call count at the boundaries (`wait - 1` and `wait`). Cover argument and `this` forwarding, separate bursts, `cancel`, `wait = 0` and independence between instances. In React, also test that cancel runs on unmount.',
    seniorFollowUps: '- Implement `leading`/`trailing` options and define what happens when both are true and only one call occurs.\n- How do you debounce inside a React component without recreating the debounced function on every render? (`useMemo`/`useRef` + cleanup on unmount.)\n- Why can debouncing alone not prevent out-of-order search results? (Network latency varies — you still need AbortController or response sequencing.)\n- Tab backgrounding throttles timers in browsers: how does that affect a debounced autosave?',
  },
  followUps: [
    { id: 'f1', level: 'definition', question: 'In one sentence each, define debounce and throttle.', expectedConcepts: ['debounce waits for quiet period', 'throttle limits to at most once per interval'], sourceIds: ['mdn-debounce'] },
    { id: 'f2', level: 'mechanism', question: 'Why must the returned function be a regular function rather than an arrow function?', expectedConcepts: ['arrow functions capture lexical this', 'call-site this', 'fn.apply(lastThis, args)'], sourceIds: ['mdn-this'] },
    { id: 'f3', level: 'application', question: 'Add a `leading` option. What should happen when leading and trailing are both true and the function is called exactly once?', expectedConcepts: ['invoke on first call', 'trailing call only if called again during wait', 'avoid double invocation'], sourceIds: ['bfe-problems'] },
    { id: 'f4', level: 'edge-cases', question: 'A debounced autosave is pending and the user closes the tab. What can you do?', expectedConcepts: ['flush on pagehide/visibilitychange', 'navigator.sendBeacon', 'timers do not run after unload'], sourceIds: ['mdn-settimeout'] },
    { id: 'f5', level: 'production', question: 'How would you use debounce inside a React component correctly?', expectedConcepts: ['stable instance via useMemo/useRef', 'cancel in effect cleanup', 'read latest props via ref'], sourceIds: ['react-sync-effects'] },
    { id: 'f6', level: 'architecture', question: 'Debounce reduced request volume for search, but users still see wrong results occasionally. Why, and what is the full fix?', expectedConcepts: ['out-of-order responses', 'AbortController', 'ignore stale responses by request id'], sourceIds: ['mdn-abortcontroller'] },
  ],
  mcqs: [
    {
      id: 'm1',
      question: 'A debounced function (wait = 100 ms) is called at t = 0, 40, 80 and 300. How many times does the original function run by t = 500?',
      options: [
        { id: 'a', text: '1', explanation: 'The call at t = 300 starts a new burst, so there is a second invocation at t = 400.' },
        { id: 'b', text: '2', explanation: 'Correct: one at t = 180 (100 ms after t = 80) and one at t = 400.' },
        { id: 'c', text: '4', explanation: 'That would be no debouncing at all.' },
        { id: 'd', text: '3', explanation: 'Calls at 0/40/80 are within 100 ms of each other and collapse into one.' },
      ],
      correctOptionId: 'b',
      explanation: 'Each call restarts the timer. 0→40→80 is one burst (fires at 180); 300 is a new burst (fires at 400).',
      sourceIds: ['mdn-debounce'],
    },
    {
      id: 'm2',
      question: 'What does `setTimeout(fn, 0)` guarantee?',
      options: [
        { id: 'a', text: 'fn runs synchronously after the current statement', explanation: 'setTimeout always queues a task; it never runs synchronously.' },
        { id: 'b', text: 'fn runs before any pending Promise callbacks', explanation: 'Promise reactions are microtasks and run before the next task.' },
        { id: 'c', text: 'fn runs in a later task, after the current script and its microtasks', explanation: 'Correct.' },
        { id: 'd', text: 'fn runs exactly 0 ms later', explanation: 'Delays are minimums; browsers can clamp nested timers to ≥ 4 ms and throttle background tabs.' },
      ],
      correctOptionId: 'c',
      explanation: 'Timers schedule a task. The current call stack finishes and microtasks drain first; delay values are minimums, not guarantees.',
      sourceIds: ['mdn-settimeout', 'mdn-microtask'],
    },
  ],
};

export default problem;
