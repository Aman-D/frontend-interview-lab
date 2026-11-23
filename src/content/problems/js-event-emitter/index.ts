import type { CodingProblem } from '../../schema';
import starter from './starter/solution.js?raw';
import solution from './solution/solution.js?raw';
import publicTests from './tests/public.test.js?raw';
import hiddenTests from './tests/hidden.test.js?raw';

const problem: CodingProblem = {
  schemaVersion: 1,
  kind: 'coding',
  id: 'js-event-emitter',
  slug: 'event-emitter',
  title: 'Create an Event Emitter',
  track: 'javascript',
  execution: 'js',
  difficulty: 'medium',
  priority: 'P0',
  seniority: ['Senior', 'SDE-2', 'SDE-3'],
  topics: ['observer pattern', 'classes', 'closures', 're-entrancy'],
  estimatedMinutes: 25,
  conceptIds: ['observer-pattern', 'closures', 'referential-equality'],
  research: {
    provenance: 'PUBLISHED_PRACTICE_PROBLEM',
    frequencyConfidence: 'HIGH_CONFIDENCE',
    verificationStatus: 'SOURCES_VERIFIED',
    lastVerified: '2026-11-23',
    evidence: [
      { sourceId: 'bfe-problems', url: 'https://bigfrontend.dev/problem/create-an-Event-Emitter', originalTitle: '16. create an Event Emitter' },
      {
        sourceId: 'fih-js',
        url: 'https://www.frontendinterviewhandbook.com/coding/javascript-utility-function',
        originalTitle: 'Event Emitter',
        note: 'Listed under "Where to practice"; the same page lists "Observer pattern" among basic examples.',
      },
    ],
    researchNotes:
      'Listed independently by BFE.dev and the Front End Interview Handbook. Only the titles were read. The API used here (on returns an unsubscribe function, once, off, emit returning a boolean, listenerCount) and the snapshot/once semantics are this project\'s own specification; the snapshot and "remove most recent match" rules are modelled on how Node.js documents its EventEmitter.',
  },
  spec: {
    summary: 'Build a synchronous EventEmitter class with on/once/off/emit that behaves correctly when listeners are added or removed while an event is being emitted.',
    description: `Implement \`class EventEmitter\` with:

| Method | Behaviour |
|---|---|
| \`on(eventName, listener)\` | Subscribe. **Returns an unsubscribe function** that removes exactly this subscription. |
| \`once(eventName, listener)\` | Like \`on\`, but the subscription is removed the first time it fires. Also returns an unsubscribe function. |
| \`off(eventName, listener)\` | Remove **one** subscription of \`listener\` (the most recently added one). Unknown names/listeners are ignored. |
| \`emit(eventName, ...args)\` | Call the listeners **synchronously, in subscription order**, with \`args\`. Returns \`true\` if there was at least one listener, otherwise \`false\`. |
| \`listenerCount(eventName)\` | Number of active subscriptions for that event. |

The tricky part is **changing the listener list while \`emit\` is running**:

- A listener that unsubscribes itself (or another listener) during \`emit\` must **not** cause the next listener to be skipped. The listeners that were registered when \`emit\` started are the ones that run.
- A listener added during \`emit\` runs from the **next** \`emit\` on.
- A \`once\` listener is removed **before** it is invoked, so if it calls \`emit\` for the same event, it does not run again.

\`\`\`js
const bus = new EventEmitter();
const stop = bus.on('message', (text) => console.log(text));
bus.emit('message', 'hi'); // logs "hi", returns true
stop();
bus.emit('message', 'hi'); // returns false
\`\`\``,
    technologies: ['JavaScript', 'classes', 'Map', 'closures'],
    learningObjectives: [
      'Implement the observer (publish/subscribe) pattern',
      'Return disposer functions instead of requiring callers to keep references',
      'Reason about mutation of a collection while iterating it',
      'Handle duplicate subscriptions with per-subscription identity instead of function identity',
    ],
    clarifications: [
      {
        question: 'Is emit synchronous?',
        why: 'Synchronous emit makes ordering and error propagation predictable; asynchronous emit decouples listeners from the emitter but changes every test.',
        defaultAssumption: 'Synchronous. A listener that throws stops the emit and the error reaches the emit caller.',
      },
      {
        question: 'What happens if the same function is subscribed twice?',
        why: 'Storing listeners in a Set silently de-duplicates; some APIs (DOM addEventListener) do that, others (Node) do not.',
        defaultAssumption: 'It is called twice. Each returned unsubscribe function removes only its own subscription; off() removes the most recently added one.',
      },
      {
        question: 'If listeners change during emit, which listeners run?',
        why: 'Mutating an array while looping over it by index skips elements — a real production bug.',
        defaultAssumption: 'Exactly the listeners that were registered when emit started (a snapshot).',
      },
      {
        question: 'What does emit return?',
        why: 'Callers sometimes need to know whether anyone handled an event (e.g. an unhandled "error" event).',
        defaultAssumption: 'true when at least one listener was registered, false otherwise.',
      },
    ],
    scopeDecisions: [
      'No wildcard events, namespaces or priorities.',
      'No special "error" event handling (Node throws when "error" has no listener).',
      'No max-listener warnings.',
      'Listeners are called with the emitter as `this`, but this is not tested.',
    ],
    requirements: [
      { id: 'on-emit', category: 'functional', level: 'MUST', text: 'emit calls every listener for that event synchronously with the emitted arguments.' },
      { id: 'order', category: 'functional', level: 'MUST', text: 'Listeners run in subscription order.' },
      { id: 'unsubscribe-fn', category: 'functional', level: 'MUST', text: 'on() and once() return a function that removes that subscription; calling it again is a no-op.' },
      { id: 'off', category: 'functional', level: 'MUST', text: 'off(eventName, listener) removes one matching subscription (on or once); unknown names or listeners are ignored.' },
      { id: 'once', category: 'functional', level: 'MUST', text: 'A once() listener runs at most once.' },
      { id: 'emit-return', category: 'functional', level: 'MUST', text: 'emit returns true if the event had at least one listener, else false.' },
      { id: 'duplicates', category: 'edge-case', level: 'MUST', text: 'Subscribing the same function twice creates two independent subscriptions.' },
      { id: 'snapshot', category: 'edge-case', level: 'MUST', text: 'Listeners removed during emit do not cause others to be skipped; listeners added during emit are not called by that emit.' },
      { id: 'once-reentrancy', category: 'edge-case', level: 'MUST', text: 'A once() listener is removed before it is invoked, so re-entrant emits and throws cannot call it twice.' },
      { id: 'isolation', category: 'technical', level: 'MUST', text: 'Instances share no state, and event names such as "constructor" or "toString" behave like any other name.' },
      { id: 'cleanup', category: 'performance', level: 'SHOULD', text: 'Empty listener lists are deleted so long-lived emitters do not accumulate keys.' },
      { id: 'reentrancy-tests', category: 'testing', level: 'SHOULD', text: 'Tests cover listeners that modify the subscription list while emit is running.' },
    ],
    constraints: ['No libraries.', 'O(k) emit for k listeners on that event.'],
    acceptanceCriteria: [
      'All public tests pass.',
      'All hidden tests pass (duplicates, removal during emit, addition during emit, once re-entrancy, once + off, isolation, no-op off).',
    ],
    examples: [
      { title: 'Unsubscribe', input: 'const stop = e.on("a", f); stop(); e.emit("a")', output: 'false; f not called' },
      { title: 'Duplicate subscription', input: 'e.on("a", f); e.on("a", f); e.emit("a")', output: 'f called twice' },
      { title: 'Removal during emit', input: 'listeners [A (unsubscribes itself), B]; e.emit("x")', output: 'A then B are both called', explanation: 'An index-based loop over the live array would skip B.' },
    ],
    manualTests: ['Wire two listeners to the same event in the console, unsubscribe one from inside the other, and check both emits.'],
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
    'Use a `Map` from event name to an array of subscriptions. A plain object works but `"constructor"` and `"toString"` already exist on it through the prototype.',
    'Store each subscription as its own object, e.g. `{ listener, once }`. The unsubscribe function returned by `on` can then remove *that object*, which works even when the same function is subscribed twice.',
    'In `emit`, loop over a copy (`list.slice()`). Removing from the live array during a `for (let i...)` loop shifts later elements left and skips one.',
    'For `once`, remove the subscription before you call the listener, not after.',
  ],
  solution: {
    initialApproach:
      'A Map from event name to an array of listener functions: `on` pushes, `off` splices, `emit` loops. This passes the basic cases, then breaks on duplicates (which subscription does the unsubscribe function remove?) and on listeners that change the array during emit.',
    optimizedApproach:
      'Store a record object per subscription (`{ listener, once }`). The unsubscribe function closes over the record, so it removes exactly one subscription and is idempotent (`indexOf` returns -1 the second time). `emit` iterates a snapshot (`slice()`), so mutations during the emit cannot skip or add listeners. `once` records are removed before their listener is called. Empty arrays are deleted from the Map.',
    walkthrough: `1. **Storage**: a private \`Map<eventName, record[]>\`. Using a Map keeps names like \`"__proto__"\` and \`"constructor"\` safe.
2. **\`#add(name, listener, once)\`** creates \`{ listener, once }\`, appends it, and returns \`() => this.#removeRecord(name, record)\`.
3. **\`on\` / \`once\`** call \`#add\` with the right flag.
4. **\`off(name, listener)\`** scans from the end and removes the most recently added record whose \`listener\` matches — one subscription only.
5. **\`#removeRecord\`** finds the record by identity (\`indexOf\`), splices it out if present, and deletes the Map entry when the array becomes empty.
6. **\`emit(name, ...args)\`** returns \`false\` when there are no records. Otherwise it iterates \`records.slice()\`; for \`once\` records it removes them first, then calls \`listener.apply(this, args)\`. Returns \`true\`.

The two decisions that make the edge cases work are *identity per subscription* (records, not functions) and *iterate a snapshot*.`,
    complexity: 'on/once: O(1). off and unsubscribe: O(k) for k listeners on that event (indexOf + splice). emit: O(k) plus an O(k) copy for the snapshot. Memory: O(total subscriptions).',
    edgeCases:
      '- **Same function twice** → two records; each disposer removes its own.\n- **Disposer called twice** → second call finds nothing (no-op), so it cannot remove somebody else\'s subscription.\n- **Self-unsubscribe during emit** → snapshot keeps later listeners.\n- **Subscribe during emit** → not in the snapshot; runs next time.\n- **once + re-entrant emit** → removed first, so it cannot run twice.\n- **Listener throws** → emit stops and rethrows; a once record has already been removed.\n- **"constructor" / "toString" event names** → fine with a Map; a plain object would find inherited properties.',
    alternatives:
      '- **Set per event**: O(1) removal, but de-duplicates identical functions and loses per-subscription identity unless you store wrapper objects.\n- **once via wrapper function** (`const wrapper = (...a) => { off(); fn(...a) }`): common, but `off(name, fn)` then needs to know about the wrapper (Node stores it as `wrapper.listener`).\n- **Copy-on-write**: replace the array on every subscribe/unsubscribe instead of copying on every emit — better when emits are frequent and changes are rare.\n- **EventTarget + CustomEvent**: built-in in browsers, but de-duplicates listeners and needs `event.detail` for payloads.',
    tradeoffs:
      'Copying on every emit costs O(k) allocation; copy-on-write moves that cost to subscribe/unsubscribe. For UI events (few listeners, many emits) copy-on-write is usually better; for short-lived buses either is fine. Synchronous emit keeps ordering simple but lets one slow or throwing listener affect the emitter; isolating listeners (try/catch per listener, report errors) is safer for plugin systems.',
    commonMistakes:
      '- Looping by index over the live array while listeners unsubscribe → skipped listeners.\n- Implementing unsubscribe as `off(name, fn)` → with duplicates it removes the wrong subscription, and calling it twice removes a second subscription.\n- Removing a once listener *after* calling it → infinite recursion on re-entrant emit.\n- Using `{}` for storage → `"constructor"` resolves to Object\'s constructor.\n- Leaving empty arrays behind for every event name ever used.',
    testingStrategy:
      'Start with the contract (args, order, return value, unsubscribe, off, once), then test mutations during emit: self-unsubscribe, subscribe during emit, once with re-entrant emit. Use spies with call counts. Add duplicate-subscription and idempotent-disposer cases, and isolation between instances and prototype-like names.',
    seniorFollowUps:
      '- How would you make emit asynchronous and what would change for error handling?\n- Design a typed emitter in TypeScript where wrong event names or payloads are compile errors.\n- How do you prevent memory leaks when components subscribe to a global bus? (Disposers in cleanup, WeakRef, AbortSignal-based subscriptions.)\n- Compare this to the DOM EventTarget: capture/bubble, `{ once, signal }` options, and listener de-duplication.',
  },
  followUps: [
    {
      id: 'f1',
      level: 'definition',
      question: 'What is the observer pattern, and how does an event emitter implement it?',
      expectedConcepts: ['subject keeps a list of observers', 'observers are notified on change', 'loose coupling', 'subscribe/unsubscribe'],
      sourceIds: ['fih-js'],
    },
    {
      id: 'f2',
      level: 'mechanism',
      question: 'Why does removing a listener during emit skip the next listener when you loop by index over the live array?',
      expectedConcepts: ['splice shifts later elements left', 'index increments past the shifted element', 'iterate a snapshot or copy-on-write'],
      sourceIds: ['bfe-problems'],
    },
    {
      id: 'f3',
      level: 'edge-cases',
      question: 'The same function is subscribed twice and you call the first unsubscribe function twice. What should happen and how does your design guarantee it?',
      expectedConcepts: ['one subscription remains', 'per-subscription record identity', 'idempotent disposer'],
      sourceIds: ['bfe-problems'],
    },
    {
      id: 'f4',
      level: 'application',
      question: 'Add support for `on(name, listener, { signal })` so subscriptions are removed when an AbortSignal aborts.',
      expectedConcepts: ['signal.addEventListener("abort", unsubscribe, { once: true })', 'already-aborted signal', 'matches DOM addEventListener options'],
      sourceIds: ['mdn-abortcontroller'],
    },
    {
      id: 'f5',
      level: 'production',
      question: 'A React component subscribes to a global emitter in useEffect. What goes wrong if it forgets to unsubscribe, and what does the correct effect look like?',
      expectedConcepts: ['memory leak', 'stale closures calling setState after unmount', 'return the disposer from the effect', 'StrictMode double-invocation'],
      sourceIds: ['react-sync-effects'],
    },
    {
      id: 'f6',
      level: 'architecture',
      question: 'When would you choose an app-wide event bus over passing callbacks or using a state store, and what are the risks?',
      expectedConcepts: ['decoupled cross-cutting events', 'hard to trace data flow', 'ordering and re-entrancy', 'typing event names and payloads', 'testing'],
      sourceIds: ['fih-js'],
    },
  ],
  mcqs: [
    {
      id: 'm1',
      question: 'With an emitter that loops `for (let i = 0; i < list.length; i++) list[i]()` over its live array, listeners [A, B, C] are registered and A removes itself when called. Which listeners run on the first emit?',
      options: [
        { id: 'a', text: 'A, B, C', explanation: 'That is the snapshot behaviour you want, but the live-array loop does not provide it.' },
        { id: 'b', text: 'A, C', explanation: 'Correct: removing A shifts B to index 0, and the loop continues at index 1, which is now C.' },
        { id: 'c', text: 'A only', explanation: 'The loop continues; it just skips one element.' },
        { id: 'd', text: 'A, B', explanation: 'B is the listener that gets skipped, not C.' },
      ],
      correctOptionId: 'b',
      explanation: 'splice() shifts later elements one position left. The loop counter has already moved past index 0, so the element that moved into it (B) is never visited. Iterating a copy fixes this.',
      sourceIds: ['bfe-problems'],
    },
    {
      id: 'm2',
      question: 'Why is a Map safer than a plain object (`{}`) for storing listeners by event name?',
      options: [
        { id: 'a', text: 'Maps are always faster for every operation', explanation: 'Performance is not the main reason and is not universally true.' },
        { id: 'b', text: 'Plain objects inherit keys such as "constructor" from Object.prototype, so lookups can return values you never stored', explanation: 'Correct: `{}["constructor"]` is the Object function. A Map only contains the keys you set.' },
        { id: 'c', text: 'Plain objects cannot have string keys with spaces', explanation: 'Any string can be an object key.' },
        { id: 'd', text: 'Maps keep functions alive less long', explanation: 'Both hold strong references to their values.' },
      ],
      correctOptionId: 'b',
      explanation: 'A Map has no inherited keys, accepts any key type, and has a cheap `size`. With `{}` you would need `Object.create(null)` or hasOwnProperty checks.',
      sourceIds: ['mdn-map'],
    },
  ],
};

export default problem;
