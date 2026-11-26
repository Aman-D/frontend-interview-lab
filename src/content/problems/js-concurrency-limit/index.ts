import type { CodingProblem } from '../../schema';
import starter from './starter/solution.js?raw';
import solution from './solution/solution.js?raw';
import publicTests from './tests/public.test.js?raw';
import hiddenTests from './tests/hidden.test.js?raw';

const problem: CodingProblem = {
  schemaVersion: 1,
  kind: 'coding',
  id: 'js-concurrency-limit',
  slug: 'promise-concurrency-limit',
  title: 'Run async tasks with a concurrency limit',
  track: 'javascript',
  execution: 'js',
  difficulty: 'medium',
  priority: 'P0',
  seniority: ['Senior', 'SDE-2', 'SDE-3', 'MTS'],
  topics: ['promises', 'concurrency', 'async scheduling', 'Promise.all', 'uploads', 'rate limits'],
  estimatedMinutes: 25,
  conceptIds: ['promises', 'promise-combinators', 'event-loop', 'closures'],
  research: {
    provenance: 'PUBLISHED_PRACTICE_PROBLEM',
    frequencyConfidence: 'MEDIUM_CONFIDENCE',
    verificationStatus: 'SOURCES_VERIFIED',
    lastVerified: '2026-11-26',
    evidence: [
      { sourceId: 'bfe-problems', url: 'https://bigfrontend.dev/problem/throttle-Promises', originalTitle: '92. throttle Promises', note: 'Same task: run promise-returning functions with a maximum number in flight.' },
      { sourceId: 'bfe-problems', url: 'https://bigfrontend.dev/problem/implement-async-helper-parallel', originalTitle: '30. implement async helper - `parallel()`', note: 'Related unlimited-parallel variant.' },
    ],
    researchNotes:
      'Catalog row 22. Listed on BFE.dev; only one platform, so MEDIUM_CONFIDENCE. The API shape (array of task functions → ordered results, fail-fast) mirrors Promise.all so the solution can be compared with the lab\'s Promise.all problem. Realistic uses: uploading many resume files, bulk-moving candidates between pipeline stages, or prefetching pages under a server rate limit.',
  },
  spec: {
    summary: 'Write runWithConcurrency(tasks, limit): run promise-returning functions with at most `limit` in flight, resolve results in input order, fail fast.',
    description: `Implement \`runWithConcurrency(tasks, limit)\`.

- \`tasks\` is an array of **functions**; each returns a value or a promise. A task must not start until there is a free slot.
- At most \`limit\` tasks are running at once. When one settles, start the next immediately.
- Resolve with all results **in input order** (like \`Promise.all\`).
- On the first rejection (or synchronous throw), reject with that reason and **start no further tasks**. Already-running tasks are not cancelled.
- An empty array resolves to \`[]\`. A \`limit\` that is not a positive integer rejects with a \`RangeError\`.

\`\`\`js
const uploads = files.map((file) => () => uploadResume(file));
const urls = await runWithConcurrency(uploads, 3); // never more than 3 uploads at once
\`\`\``,
    technologies: ['JavaScript', 'Promises'],
    learningObjectives: [
      'Understand why tasks must be functions (a promise is already running)',
      'Implement a worker-slot scheduler with closures',
      'Preserve input order independently of completion order',
      'Define failure semantics explicitly (fail-fast vs settle-all)',
    ],
    clarifications: [
      { question: 'Are tasks promises or functions returning promises?', why: 'A promise has already started; to limit concurrency you must control when work begins.', defaultAssumption: 'Functions.' },
      { question: 'Result order: input or completion?', why: 'Callers usually zip results back to inputs.', defaultAssumption: 'Input order.' },
      { question: 'What happens on failure?', why: 'Fail-fast (Promise.all) vs collect everything (Promise.allSettled) are both valid.', defaultAssumption: 'Fail fast and stop launching new tasks.' },
      { question: 'Should running tasks be cancelled on failure?', why: 'Promises cannot be cancelled; you would need AbortSignal support.', defaultAssumption: 'No — they finish, results are ignored.' },
    ],
    scopeDecisions: ['No AbortSignal support (follow-up).', 'No retries (follow-up).', 'No priority ordering.'],
    requirements: [
      { id: 'limit', category: 'functional', level: 'MUST', text: 'No more than `limit` tasks run at the same time.' },
      { id: 'lazy-start', category: 'functional', level: 'MUST', text: 'A task is not called until a slot is free.' },
      { id: 'refill', category: 'functional', level: 'MUST', text: 'When a task settles, the next one starts without waiting for the others.' },
      { id: 'order', category: 'functional', level: 'MUST', text: 'Results are in input order.' },
      { id: 'fail-fast', category: 'functional', level: 'MUST', text: 'The first rejection rejects the result.' },
      { id: 'stop-after-failure', category: 'edge-case', level: 'MUST', text: 'No new tasks start after a rejection.' },
      { id: 'empty', category: 'edge-case', level: 'MUST', text: 'An empty array resolves to [].' },
      { id: 'sync-throw', category: 'edge-case', level: 'SHOULD', text: 'A synchronous throw in a task becomes a rejection.' },
      { id: 'plain-values', category: 'edge-case', level: 'SHOULD', text: 'Tasks returning plain values work.' },
      { id: 'invalid-limit', category: 'edge-case', level: 'SHOULD', text: 'An invalid limit rejects with RangeError.' },
      { id: 'abort', category: 'functional', level: 'OPTIONAL', text: 'Accept an AbortSignal that stops launching and is passed to tasks.' },
    ],
    constraints: ['No libraries (no p-limit).', 'Do not start all tasks and then wait — that defeats the limit.'],
    acceptanceCriteria: ['All public tests pass.', 'All hidden tests pass (peak concurrency, plain values, sync throw, stop after failure, limit 1, invalid limit, lazy start).'],
    examples: [
      { title: 'Refill', input: '4 tasks, limit 2; task 1 finishes first', output: 'starts: 0, 1, then 2 (after 1), then 3 (after 0)' },
      { title: 'Order', input: 'tasks finish c, a, b', output: "['a', 'b', 'c']" },
    ],
    manualTests: ['Wrap fetch calls to a slow endpoint and confirm in the Network panel that at most N requests are in flight.'],
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
    'Keep a `nextIndex` counter in a closure. A "launch" function takes the next index, runs that task and, when it settles, launches again.',
    'Start `min(limit, tasks.length)` launches at the beginning — each one is a worker slot.',
    'Write each result to results[index] so order does not depend on completion.',
    'Count completions; resolve when completed === tasks.length. Wrap the call in `new Promise((res) => res(task()))` to catch synchronous throws.',
    'Keep a `failed` flag so launchNext stops after the first rejection.',
  ],
  solution: {
    initialApproach: 'Split tasks into chunks of `limit` and `await Promise.all(chunk)` one chunk at a time. It respects the limit but wastes slots: one slow task in a chunk blocks the next chunk from starting.',
    bruteForce: 'Calling every task up front and passing the promises to Promise.all ignores the limit completely — all requests are in flight at once.',
    optimizedApproach: 'A slot-based scheduler: start `limit` "workers"; each worker takes the next index, runs it, stores the result at that index and immediately pulls the next index when done. Concurrency stays at exactly `limit` until the queue drains, and order is preserved by index.',
    walkthrough: `1. Validate \`limit\` and copy \`tasks\` to an array; handle empty input.
2. \`nextIndex\` is shared by all workers through the closure, so no index is run twice. JavaScript is single-threaded, so \`nextIndex++\` cannot race.
3. \`new Promise((res) => res(list[index]()))\` calls the task synchronously, adopts a returned promise, wraps plain values, and converts a synchronous throw into a rejection.
4. On fulfilment store \`results[index]\`, bump \`completed\`, then resolve when everything is done or launch the next task.
5. On rejection set \`failed\` so \`launchNext\` becomes a no-op, and reject once.
6. Start \`Math.min(limit, list.length)\` launches.`,
    complexity: 'O(n) total scheduling work for n tasks; O(n) memory for results. Wall-clock time ≈ the best you can do with `limit` slots.',
    edgeCases: '- Empty input.\n- limit > tasks.length.\n- Synchronous throws and plain values.\n- Rejection while other tasks are running: they finish but are ignored.\n- Later rejections after the first are swallowed (the outer promise is already settled).',
    alternatives: '- **Chunked Promise.all** (simpler, slower).\n- **Settle-all variant**: return `{ status, value | reason }` objects like Promise.allSettled.\n- **Async queue / p-limit style**: `const limit = pLimit(3); limit(() => task())` for tasks that arrive over time.\n- **Async iterator pool**: N workers each `for await` over a shared iterator.',
    tradeoffs: 'Fail-fast gives quick feedback but leaves running work orphaned; settle-all is better for bulk operations where the user wants a per-item report ("8 of 10 resumes uploaded"). Higher limits finish sooner until you hit the browser\'s per-host connection limit (6 on HTTP/1.1) or the server\'s rate limit.',
    commonMistakes: '- Accepting promises instead of functions (work already started).\n- Pushing results in completion order.\n- Waiting for a whole batch before starting the next task.\n- Resolving when the last *started* task finishes rather than when all have finished.\n- Forgetting to stop launching after a failure.',
    testingStrategy: 'Use deferreds to control when each task settles and record start order. Assert the initial start count, refill on settle, result order, peak concurrency with a counter, fail-fast, no launches after failure, sync throws and invalid limits.',
    seniorFollowUps: '- Add AbortSignal support and pass the signal to each task so running fetches are cancelled on failure.\n- Add retries with exponential backoff for 429/503.\n- Return per-item results (allSettled) for a bulk "move candidates" action and show partial failures in the UI.\n- How does HTTP/2 multiplexing change the right limit?',
  },
  followUps: [
    { id: 'f1', level: 'definition', question: 'Why must tasks be functions rather than promises?', expectedConcepts: ['promise represents work already started', 'deferring the call controls concurrency'], sourceIds: ['mdn-promise-all'] },
    { id: 'f2', level: 'mechanism', question: 'Why is a shared nextIndex counter safe without locks?', expectedConcepts: ['single-threaded event loop', 'callbacks run to completion', 'no preemption between read and increment'], sourceIds: ['mdn-event-loop'] },
    { id: 'f3', level: 'application', question: 'Change it to return per-item results instead of failing fast.', expectedConcepts: ['allSettled shape', '{status, value/reason}', 'never reject'], sourceIds: ['mdn-promise-all'] },
    { id: 'f4', level: 'edge-cases', question: 'A task fails while two others are mid-upload. What happens to them, and how would you cancel them?', expectedConcepts: ['promises not cancellable', 'AbortController signal passed to tasks', 'ignore late results'], sourceIds: ['mdn-abortcontroller'] },
    { id: 'f5', level: 'production', question: 'A recruiter bulk-moves 200 candidates. How do you pick the limit and report progress?', expectedConcepts: ['server rate limits', 'browser connection limits', 'progress counter', 'retry with backoff', 'partial failure UI'], sourceIds: ['bfe-problems'] },
  ],
  mcqs: [
    {
      id: 'm1',
      question: '10 tasks each take 1 s except task 0, which takes 5 s. limit = 2. How long does chunked `Promise.all` (chunks of 2) take, versus a slot-based pool?',
      options: [
        { id: 'a', text: 'Both about 5 s', explanation: 'Chunking blocks the next chunk until the 5 s task finishes, and 9 s of other work cannot fit in one slot in 5 s.' },
        { id: 'b', text: 'Chunked ≈ 9 s; pool ≈ 7 s', explanation: 'Correct — see the explanation for the timeline.' },
        { id: 'c', text: 'Chunked ≈ 7 s; pool ≈ 9 s', explanation: 'Reversed: the pool never waits for a whole chunk.' },
        { id: 'd', text: 'Both about 10 s', explanation: 'Both run two tasks at once for most of the time.' },
      ],
      correctOptionId: 'b',
      explanation: 'Chunked: the first chunk waits for task 0 (5 s), then 4 more chunks of 1 s → 9 s. Pool: slot A runs task 0 for 5 s while slot B runs tasks 1–5; at 5 s both slots share tasks 6–9 (2 s) → 7 s. A free slot never idles in the pool.',
      sourceIds: ['bfe-problems'],
    },
    {
      id: 'm2',
      question: 'What does `new Promise((res) => res(task()))` give you that `task().then(...)` does not?',
      options: [
        { id: 'a', text: 'It runs the task in a Web Worker', explanation: 'Nothing here leaves the main thread.' },
        { id: 'b', text: 'A synchronous throw becomes a rejection, and plain return values are wrapped', explanation: 'Correct — the executor catches throws, and resolve adopts promises or wraps values.' },
        { id: 'c', text: 'It delays the task to the next macrotask', explanation: 'The executor runs synchronously.' },
        { id: 'd', text: 'It makes the task cancellable', explanation: 'Promises are not cancellable.' },
      ],
      correctOptionId: 'b',
      explanation: '`task().then` fails with a TypeError on plain values and lets synchronous throws escape; the Promise constructor normalises both.',
      sourceIds: ['mdn-promise-all'],
    },
    {
      id: 'm3',
      question: 'Task 1 rejects while task 0 is still running. In the reference solution, what happens to task 0?',
      options: [
        { id: 'a', text: 'It is cancelled automatically', explanation: 'Promises cannot be cancelled.' },
        { id: 'b', text: 'It keeps running; its result is ignored and no further tasks start', explanation: 'Correct.' },
        { id: 'c', text: 'Its later rejection causes an unhandled rejection error', explanation: 'The solution attaches a rejection handler to every task, so no unhandled rejection is reported.' },
        { id: 'd', text: 'The outer promise is replaced with task 0\'s result', explanation: 'A settled promise cannot change state.' },
      ],
      correctOptionId: 'b',
      explanation: 'Fail-fast semantics: the outer promise rejects once; running work finishes on its own unless you add AbortSignal support.',
      sourceIds: ['mdn-promise-all', 'mdn-abortcontroller'],
    },
  ],
};

export default problem;
