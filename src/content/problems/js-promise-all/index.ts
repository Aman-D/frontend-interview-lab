import type { CodingProblem } from '../../schema';
import starter from './starter/solution.js?raw';
import solution from './solution/solution.js?raw';
import publicTests from './tests/public.test.js?raw';
import hiddenTests from './tests/hidden.test.js?raw';

const problem: CodingProblem = {
  schemaVersion: 1,
  kind: 'coding',
  id: 'js-promise-all',
  slug: 'promise-all',
  title: 'Implement Promise.all()',
  track: 'javascript',
  execution: 'js',
  difficulty: 'medium',
  priority: 'P0',
  seniority: ['Senior', 'SDE-2', 'SDE-3'],
  topics: ['promises', 'iterables', 'microtasks', 'concurrency'],
  estimatedMinutes: 20,
  conceptIds: ['promises', 'promise-combinators', 'event-loop', 'closures'],
  research: {
    provenance: 'PUBLISHED_PRACTICE_PROBLEM',
    frequencyConfidence: 'HIGH_CONFIDENCE',
    verificationStatus: 'SOURCES_VERIFIED',
    lastVerified: '2026-11-23',
    evidence: [
      { sourceId: 'bfe-problems', url: 'https://bigfrontend.dev/problem/implement-Promise-all', originalTitle: '32. implement `Promise.all()`' },
      {
        sourceId: 'fih-js',
        url: 'https://www.frontendinterviewhandbook.com/coding/javascript-utility-function',
        originalTitle: 'Promise.all',
        note: 'Named both in the "basic examples" list and in "Where to practice".',
      },
    ],
    researchNotes:
      'Listed independently by BFE.dev and the Front End Interview Handbook, which places it among the basic (~10–15 minute) utility questions. The native semantics used for the tests (input order, non-promise values, empty input, first rejection wins, any iterable, thenables, rejection instead of a synchronous throw for bad input) were checked against MDN\'s Promise.all() reference.',
  },
  spec: {
    summary: 'Write promiseAll(iterable): wait for every input to fulfil and return their values in input order, or reject with the first rejection.',
    description: `Implement \`promiseAll(iterable)\` so that it behaves like the native \`Promise.all()\`.

- It returns a **Promise**.
- When every item has fulfilled, that promise fulfils with an **array of the values in input order** — not in the order they happened to settle.
- Items do not have to be promises: plain values and *thenables* (any object with a \`then\` method) are allowed.
- As soon as **any** item rejects, the returned promise rejects with that reason. Later outcomes are ignored.
- The input can be **any iterable** (array, \`Set\`, generator…), and an empty iterable fulfils with \`[]\`.
- Bad input (e.g. a number) must produce a **rejected promise**, not a synchronous exception.

\`\`\`js
const [user, settings] = await promiseAll([fetchUser(id), fetchSettings(id)]);

await promiseAll([1, Promise.resolve(2)]); // [1, 2]
await promiseAll([]);                      // []
await promiseAll([ok, Promise.reject(err)]); // throws err
\`\`\`

Do not call the built-in \`Promise.all\` (or \`allSettled\`/\`any\`/\`race\`). Using \`new Promise\`, \`Promise.resolve\` and \`.then\` is fine.`,
    technologies: ['JavaScript', 'Promises', 'Iteration protocol'],
    learningObjectives: [
      'Coordinate many asynchronous results with a counter held in a closure',
      'Preserve input order by writing into indexed slots',
      'Normalise values and thenables with Promise.resolve()',
      'Explain why a settled promise ignores later resolve/reject calls',
      'Explain when promise callbacks run relative to synchronous code (microtasks)',
    ],
    clarifications: [
      {
        question: 'Should the results be in input order or settle order?',
        why: 'Callers destructure the result (`const [a, b] = ...`), so order is part of the contract.',
        defaultAssumption: 'Input order, always.',
      },
      {
        question: 'What should happen when one item rejects — wait for the rest, or fail fast?',
        why: 'Fail-fast is Promise.all; "wait for everything and report each outcome" is Promise.allSettled.',
        defaultAssumption: 'Fail fast with the first rejection reason. The other operations are not cancelled (promises cannot be cancelled); their results are simply ignored.',
      },
      {
        question: 'Can items be plain values or thenables, and can the input be something other than an array?',
        why: 'The native API accepts any iterable and adopts thenables; implementations that check `instanceof Promise` or use `.length` break on these.',
        defaultAssumption: 'Any iterable; any value; thenables are adopted.',
      },
      {
        question: 'How should invalid input be reported?',
        why: 'An async API that sometimes throws synchronously forces callers to handle errors in two places.',
        defaultAssumption: 'Return a rejected promise with a TypeError.',
      },
    ],
    scopeDecisions: [
      'No concurrency limit — every input is already running when it is passed in (a concurrency-limited runner is a follow-up).',
      'No cancellation of the remaining inputs after a rejection.',
      'Subclassing (`MyPromise.all` using `this` as the constructor) is out of scope; always return a native Promise.',
      'Iterator closing (calling `return()` on the iterator when iteration throws) is not tested.',
    ],
    requirements: [
      { id: 'returns-promise', category: 'functional', level: 'MUST', text: 'promiseAll always returns a Promise.' },
      { id: 'input-order', category: 'functional', level: 'MUST', text: 'The fulfilment value is an array whose i-th element is the value of the i-th input, regardless of settle order.' },
      { id: 'plain-values', category: 'functional', level: 'MUST', text: 'Non-promise values appear in the result unchanged (same reference for objects).' },
      { id: 'empty-input', category: 'edge-case', level: 'MUST', text: 'An empty iterable fulfils with an empty array.' },
      { id: 'fail-fast', category: 'functional', level: 'MUST', text: 'The first rejection rejects the result with that exact reason; later fulfilments or rejections have no effect.' },
      { id: 'wait-for-all', category: 'functional', level: 'MUST', text: 'The result stays pending until every input has fulfilled.' },
      { id: 'any-iterable', category: 'technical', level: 'MUST', text: 'Works with any iterable (Set, generator, …), iterating it exactly once and synchronously.' },
      { id: 'thenables', category: 'technical', level: 'MUST', text: 'Thenables are adopted (their then method decides the outcome, including a then that throws).' },
      { id: 'async-settlement', category: 'technical', level: 'MUST', text: 'Callbacks attached to the result never run synchronously, even when all values are plain.' },
      { id: 'non-iterable', category: 'edge-case', level: 'MUST', text: 'A non-iterable argument (number, undefined, …) produces a promise rejected with a TypeError; nothing is thrown synchronously.' },
      { id: 'linear', category: 'performance', level: 'SHOULD', text: 'O(n) total work and one callback pair per input; no polling or repeated scans of the result array.' },
      { id: 'deferred-tests', category: 'testing', level: 'SHOULD', text: 'Tests control settle order explicitly with deferred promises instead of real delays.' },
    ],
    constraints: ['Do not use Promise.all, Promise.allSettled, Promise.any or Promise.race.', 'No libraries.'],
    acceptanceCriteria: [
      'All public tests pass.',
      'All hidden tests pass (any iterable, thenables, waits for all, asynchronous settlement, first rejection, non-iterable input, input snapshot).',
    ],
    examples: [
      { title: 'Out-of-order settlement', input: 'promiseAll([p1, p2]) where p2 fulfils with "b" before p1 fulfils with "a"', output: '["a", "b"]', explanation: 'Results are placed by input index, not by arrival time.' },
      { title: 'Mixed values', input: 'promiseAll([1, Promise.resolve(2), { then: (r) => r(3) }])', output: '[1, 2, 3]' },
      { title: 'Rejection', input: 'promiseAll([slow, Promise.reject(err)])', output: 'rejects with err', explanation: 'Does not wait for `slow`.' },
      { title: 'Empty', input: 'promiseAll(new Set())', output: '[]' },
    ],
    manualTests: [
      'In the browser console, compare `await promiseAll(x)` with `await Promise.all(x)` for arrays, Sets, generators, strings and an empty array.',
      'Pass promises created with setTimeout of different delays and check the order of the result.',
    ],
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
    'Start with `return new Promise((resolve, reject) => { ... })`. Everything else happens inside the executor, and a throw there automatically becomes a rejection.',
    'You need two pieces of state: a results array and a count of inputs that have not fulfilled yet. Resolve when the count reaches zero — and remember the case where it starts at zero.',
    'Each callback must know *which slot* it fills. Capture the index in a block-scoped variable for every item instead of using `results.push`.',
    'Wrap every item with `Promise.resolve(item)` before calling `.then`. That one call handles plain values, native promises and thenables. Use `for...of` so any iterable works.',
  ],
  solution: {
    initialApproach:
      'Create the outer promise, walk the iterable once, and attach a fulfil/reject pair to each item. Each fulfilment writes its value into the slot for that item\'s index and decrements a counter; when the counter reaches zero, resolve with the array. Any rejection calls the outer reject directly.',
    bruteForce:
      'Awaiting each item in a loop (`for (const p of items) results.push(await p)`) gives the right values for the happy path but reports a rejection late: if item 3 rejects while item 1 is still pending, the caller only hears about it after item 1 finishes. It also leaves later rejections without a handler, which shows up as unhandled-rejection noise.',
    optimizedApproach:
      'One pass over the iterable and one `.then(onFulfilled, reject)` per item. `Promise.resolve(item)` normalises values and thenables. The index is captured per iteration so out-of-order fulfilments land in the right slot. The counter is compared to zero after the loop to handle empty input. Because a promise can only settle once, the first rejection wins and every later call to resolve or reject does nothing — no extra "done" flag is needed.',
    walkthrough: `1. **Outer promise.** \`new Promise((resolve, reject) => ...)\`. A throw inside the executor rejects the promise — the validation below relies on this.
2. **Validate.** If \`iterable\` is null/undefined or has no \`Symbol.iterator\` method, throw a \`TypeError\`. The caller sees a rejected promise, matching the native behaviour.
3. **State.** \`results\` (array), \`remaining\` (inputs still pending) and \`index\` (next slot).
4. **Iterate with \`for...of\`.** This uses the iteration protocol, so arrays, Sets, Maps, strings and generators all work. For each item, \`const position = index++\` gives the callback its own slot (block scope = a fresh binding per iteration).
5. **Normalise.** \`Promise.resolve(item)\` returns native promises unchanged, wraps plain values, and adopts thenables by calling their \`then\`.
6. **Fulfil.** Store \`results[position] = value\`, decrement \`remaining\`, and resolve when it hits zero.
7. **Reject.** Pass the outer \`reject\` directly. Only the first call has any effect.
8. **Empty input.** After the loop, if \`remaining === 0\` nothing was iterated, so resolve with \`[]\` immediately.

Because iteration happens synchronously inside the executor, items added to an array *after* the call are not seen — the same snapshot behaviour as the native version.`,
    complexity: 'O(n) time and O(n) extra space for the results array; one reaction (then-callback pair) per input. The total wait is the slowest input (on success) or the first rejection.',
    edgeCases:
      '- **Empty iterable** → fulfils with `[]` (the counter never moves, so it is checked after the loop).\n- **Plain values only** → still settles asynchronously, because `.then` callbacks are microtasks.\n- **Thenable whose `then` throws** → `Promise.resolve` turns the throw into a rejection.\n- **Multiple rejections** → only the first one is observed; promises settle once.\n- **Holes / sparse slots**: if values arrive out of order, `results` is temporarily sparse; it is complete by the time it is resolved.\n- **Non-iterable** (`42`, `undefined`, plain object) → rejected promise with a TypeError, not a synchronous throw.\n- **Generators** can only be consumed once, so the implementation must not call `Array.from` and then iterate again.',
    alternatives:
      '- **`async` function + `for await`**: simpler to read but serialises the *observation* of results and delays rejection detection — not equivalent.\n- **Build on `allSettled`**: wait for every outcome, then throw the first rejection — wrong for fail-fast.\n- **`Array.from(iterable).map(...)`**: fine, as long as the iterable is consumed only once; it uses an extra array.\n- **Spec-faithful version**: look up `this.resolve` once (`C.resolve`) so subclasses work, and close the iterator if iteration throws.',
    tradeoffs:
      'Fail-fast gives the fastest error signal but throws away partial results and cannot cancel the remaining work. When partial success is useful (e.g. a dashboard with independent widgets), `allSettled` is the better tool. When you need to *stop* the remaining requests, pair the combinator with an `AbortController` shared by all of them.',
    commonMistakes:
      '- Using `results.push(value)` — produces settle order, not input order.\n- Using `var i` in a `for` loop so every callback sees the last index.\n- Resolving when `results.length === n`: assigning `results[2]` first makes `length` 3 while slots 0 and 1 are still empty.\n- Forgetting the empty-input case, so the promise never settles.\n- Checking `item instanceof Promise` instead of using `Promise.resolve`, which breaks thenables.\n- Reading `iterable.length` or indexing `iterable[i]`, which breaks Sets and generators.\n- Throwing synchronously for invalid input instead of rejecting.',
    testingStrategy:
      'Use deferred promises (`{ promise, resolve, reject }`) to settle inputs in a chosen order inside the test, which makes ordering and fail-fast behaviour deterministic without timers. Cover: order, plain values, empty input, first rejection, Set/generator, thenables (including one whose then throws), "still pending until the last one", asynchronous settlement (assert synchronously, then flush the microtask queue), non-iterable input, and that mutating the input array after the call has no effect.',
    seniorFollowUps:
      '- Implement `allSettled`, `any` (with `AggregateError`) and `race` — what changes in each?\n- Add a concurrency limit: run at most N task *functions* at a time while keeping input order.\n- How would you cancel the remaining requests when one fails? (Shared `AbortController`; `Promise.all` itself cannot cancel.)\n- What is the memory profile of `Promise.all` over 100 000 promises, and how would you batch it?',
  },
  followUps: [
    {
      id: 'f1',
      level: 'definition',
      question: 'What is the difference between Promise.all, Promise.allSettled, Promise.any and Promise.race?',
      expectedConcepts: ['all: every fulfils or first rejection', 'allSettled: never rejects, reports each outcome', 'any: first fulfilment or AggregateError', 'race: first settlement of any kind'],
      sourceIds: ['mdn-promise-all'],
    },
    {
      id: 'f2',
      level: 'mechanism',
      question: 'Why does your implementation not need a "done" flag to ignore rejections after the first one?',
      expectedConcepts: ['a promise settles exactly once', 'later resolve/reject calls are no-ops', 'resolving functions are idempotent'],
      sourceIds: ['mdn-promise-all'],
    },
    {
      id: 'f3',
      level: 'mechanism',
      question: 'promiseAll([1, 2]).then(log) is called and then console.log("sync") runs. Which line prints first, and why?',
      expectedConcepts: ['then callbacks are microtasks', 'microtasks run after the current script finishes', '"sync" prints first'],
      sourceIds: ['mdn-microtask', 'mdn-event-loop'],
    },
    {
      id: 'f4',
      level: 'application',
      question: 'Extend the function so it accepts task functions and runs at most N of them at the same time, still returning results in input order.',
      expectedConcepts: ['worker pool / queue', 'start next task when one settles', 'index-based result slots', 'fail-fast vs collect errors'],
      sourceIds: ['bfe-problems'],
    },
    {
      id: 'f5',
      level: 'production',
      question: 'One of five parallel fetches fails and Promise.all rejects. What happens to the other four requests, and how do you stop them?',
      expectedConcepts: ['they keep running', 'results are ignored', 'shared AbortController', 'abort in catch'],
      sourceIds: ['mdn-abortcontroller'],
    },
    {
      id: 'f6',
      level: 'architecture',
      question: 'A page loads six independent widgets with Promise.all and shows a spinner until all are done. What are the UX and resilience problems, and how would you restructure it?',
      expectedConcepts: ['slowest request blocks everything', 'one failure blanks the page', 'per-widget loading/error states', 'allSettled or independent requests', 'timeouts'],
      sourceIds: ['mdn-promise-all'],
    },
  ],
  mcqs: [
    {
      id: 'm1',
      question: 'What does this log?',
      code: `const slow = new Promise((r) => setTimeout(() => r('slow'), 100));
const fast = Promise.resolve('fast');
Promise.all([slow, fast, 'plain']).then((v) => console.log(v));`,
      options: [
        { id: 'a', text: "['fast', 'plain', 'slow']", explanation: 'That is settle order. Promise.all places each value by its input index.' },
        { id: 'b', text: "['slow', 'fast', 'plain']", explanation: 'Correct: the result follows input order, and the plain string is passed through.' },
        { id: 'c', text: "['slow', 'fast']", explanation: 'Plain values are not dropped; they are treated as already-fulfilled promises.' },
        { id: 'd', text: 'It rejects because "plain" is not a promise', explanation: 'Any value is accepted; it is wrapped with Promise.resolve.' },
      ],
      correctOptionId: 'b',
      explanation: 'Promise.all fulfils with values in the same order as the input iterable, regardless of which input settles first. Non-promise values are included as-is.',
      sourceIds: ['mdn-promise-all'],
    },
    {
      id: 'm2',
      question: 'An implementation resolves when `results.length === inputCount`, assigning `results[i] = value` as values arrive. What goes wrong?',
      options: [
        { id: 'a', text: 'Nothing — length always equals the number of assigned values', explanation: 'Array length is one more than the highest index, not the number of assigned elements.' },
        { id: 'b', text: 'It can resolve too early with empty slots when the last input settles first', explanation: 'Correct: assigning results[n - 1] first sets length to n while earlier slots are still empty.' },
        { id: 'c', text: 'It never resolves for inputs that settle in order', explanation: 'In-order settlement works; the bug appears with out-of-order settlement.' },
        { id: 'd', text: 'It throws a RangeError for sparse arrays', explanation: 'Sparse arrays are legal in JavaScript; there is no error, just the wrong result.' },
      ],
      correctOptionId: 'b',
      explanation: 'Use a separate counter of pending inputs. `length` reflects the highest index written, so it reaches the target as soon as the last slot is filled.',
      sourceIds: ['mdn-promise-all'],
    },
    {
      id: 'm3',
      question: 'Which statement about `Promise.all([])` is true?',
      options: [
        { id: 'a', text: 'It never settles', explanation: 'That is the classic bug in hand-written versions that only resolve from inside a then-callback.' },
        { id: 'b', text: 'It rejects with a TypeError', explanation: 'An empty iterable is valid input.' },
        { id: 'c', text: 'It fulfils with an empty array', explanation: 'Correct: there is nothing to wait for, so it fulfils with [].' },
        { id: 'd', text: 'It returns an empty array synchronously', explanation: 'It always returns a promise, never the array itself.' },
      ],
      correctOptionId: 'c',
      explanation: 'With no inputs, the returned promise is fulfilled with an empty array. Hand-written versions must check for this case explicitly.',
      sourceIds: ['mdn-promise-all'],
    },
  ],
};

export default problem;
