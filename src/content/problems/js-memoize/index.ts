import type { CodingProblem } from '../../schema';
import starter from './starter/solution.js?raw';
import solution from './solution/solution.js?raw';
import publicTests from './tests/public.test.js?raw';
import hiddenTests from './tests/hidden.test.js?raw';

const problem: CodingProblem = {
  schemaVersion: 1,
  kind: 'coding',
  id: 'js-memoize',
  slug: 'memoize',
  title: 'Implement memoize() with a resolver and async eviction',
  track: 'javascript',
  execution: 'js',
  difficulty: 'medium',
  priority: 'P0',
  seniority: ['Senior', 'SDE-2', 'SDE-3'],
  topics: ['memoization', 'closures', 'Map', 'cache keys', 'promises', 'this binding'],
  estimatedMinutes: 20,
  conceptIds: ['memoization', 'closures', 'referential-equality', 'this-binding', 'promises'],
  research: {
    provenance: 'PUBLISHED_PRACTICE_PROBLEM',
    frequencyConfidence: 'MEDIUM_CONFIDENCE',
    verificationStatus: 'SOURCES_VERIFIED',
    lastVerified: '2026-11-26',
    evidence: [
      { sourceId: 'bfe-problems', url: 'https://bigfrontend.dev/problem/implement-general-memoization-function', originalTitle: '14. Implement a general memoization function - `memo()`' },
      { sourceId: 'bfe-problems', url: 'https://bigfrontend.dev/problem/implement-memoizeOne', originalTitle: '122. implement memoizeOne()', note: 'Used for the "single-entry cache" follow-up.' },
    ],
    researchNotes:
      'Listed on BFE.dev (two variants). Only one platform lists it, so frequency is MEDIUM_CONFIDENCE. Memoization was also named in a referral contact\'s recollection of a senior frontend loop (October 2026); that is an unpublished, unverifiable account and is not used as evidence. The async-eviction requirement is this lab\'s addition, because "a failed request stays cached forever" is the most common production bug with memoized fetchers.',
  },
  spec: {
    summary: 'Write memoize(fn, resolver?): cache results by key, forward `this`, expose the cache, and never cache failures.',
    description: `Implement \`memoize(fn, resolver?)\`.

- The returned function caches \`fn\`'s result per **cache key**. By default the key is the **first argument** (like lodash). If \`resolver\` is passed, the key is \`resolver.apply(this, args)\`.
- \`fn\` and \`resolver\` are called with the caller's \`this\`.
- The memoized function exposes \`.cache\` (a \`Map\`) and \`.clear()\`.
- If \`fn\` **throws**, nothing is cached.
- If \`fn\` returns a **promise**, concurrent callers share it; if it **rejects**, the entry is evicted so the next call retries.

\`\`\`js
const getUser = memoize((id) => fetch('/api/users/' + id).then((r) => r.json()));
getUser(7); getUser(7); // one request, both callers get the same promise
const area = memoize((w, h) => w * h, (w, h) => w + 'x' + h);
\`\`\``,
    technologies: ['JavaScript', 'Map', 'closures', 'Promises'],
    learningObjectives: [
      'Keep a private cache in a closure',
      'Choose cache keys deliberately (identity vs value, multi-argument keys)',
      'Distinguish "not cached" from "cached undefined"',
      'Explain when memoization costs more than it saves',
    ],
    clarifications: [
      { question: 'What is the cache key for multiple arguments?', why: 'Serialising all arguments is slow and breaks for objects/functions; using the first argument is cheap but surprising.', defaultAssumption: 'First argument by default; callers pass a resolver for multi-argument keys.' },
      { question: 'Should object arguments be compared by value or by reference?', why: 'Deep comparison is O(n) per call and can be slower than recomputing.', defaultAssumption: 'By reference (Map / SameValueZero).' },
      { question: 'Is the cache bounded?', why: 'An unbounded cache keyed by user input is a memory leak.', defaultAssumption: 'Unbounded for this exercise; eviction policies are a follow-up.' },
      { question: 'What happens with async functions that fail?', why: 'Caching a rejected promise makes a transient network error permanent.', defaultAssumption: 'Share in-flight promises; evict on rejection.' },
    ],
    scopeDecisions: ['No TTL or LRU eviction (follow-up).', 'No WeakMap mode (follow-up).', 'The cache is a plain Map exposed for inspection.'],
    requirements: [
      { id: 'cache-hit', category: 'functional', level: 'MUST', text: 'Repeated calls with the same key call fn once and return the cached result.' },
      { id: 'default-key', category: 'functional', level: 'MUST', text: 'Without a resolver, the first argument is the key.' },
      { id: 'resolver', category: 'functional', level: 'MUST', text: 'With a resolver, its return value (called with this and all arguments) is the key.' },
      { id: 'this-forwarding', category: 'technical', level: 'MUST', text: 'fn receives the caller\'s `this`.' },
      { id: 'cache-api', category: 'functional', level: 'MUST', text: '`.cache` is a Map and `.clear()` empties it.' },
      { id: 'falsy-results', category: 'edge-case', level: 'MUST', text: 'undefined, null, 0 and "" results are cached (use has, not truthiness).' },
      { id: 'no-cache-on-throw', category: 'edge-case', level: 'MUST', text: 'A throwing call caches nothing.' },
      { id: 'promise-dedupe', category: 'functional', level: 'SHOULD', text: 'Concurrent calls with the same key share one in-flight promise.' },
      { id: 'promise-evict', category: 'edge-case', level: 'SHOULD', text: 'A rejected promise is evicted so a later call retries.' },
      { id: 'nan-key', category: 'edge-case', level: 'SHOULD', text: 'NaN works as a key.' },
      { id: 'bounded-cache', category: 'performance', level: 'OPTIONAL', text: 'Optional maxSize with least-recently-used eviction.' },
    ],
    constraints: ['No libraries.', 'O(1) average work per call excluding fn and resolver.'],
    acceptanceCriteria: ['All public tests pass.', 'All hidden tests pass (falsy results, identity keys, NaN, throw, promise sharing and eviction, resolver `this`).'],
    examples: [
      { title: 'Default key', input: 'm(1, 2) then m(1, 100), fn = (a, b) => a + b', output: '3, 3', explanation: 'Both calls have key 1.' },
      { title: 'Resolver', input: 'resolver = (a, b) => a + "|" + b', output: 'm(1, 2) = 3, m(1, 100) = 101' },
    ],
    manualTests: ['Memoize a fake fetcher that rejects on the first call and confirm the second call retries.'],
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
    'Create the Map inside memoize so every memoized function has its own cache.',
    'Compute the key first: resolver ? resolver.apply(this, args) : args[0]. The returned function must be a regular function to see `this`.',
    'Check cache.has(key), not cache.get(key) — undefined is a valid result.',
    'Only call cache.set after fn returns: if fn throws, the line never runs.',
    'For promises, attach a rejection handler that deletes the entry — but only if the entry is still that same promise.',
  ],
  solution: {
    initialApproach: 'Keep a Map in the closure. On each call compute the key, return the cached value on a hit, otherwise call fn, store the result and return it.',
    bruteForce: 'Keying by JSON.stringify(args) "works" for primitives but is O(size of arguments) per call, collides for values like undefined vs null in arrays, and throws on circular objects. Mention it only to explain why a resolver is safer.',
    optimizedApproach: 'A Map keyed by the first argument (or by the resolver\'s result) gives O(1) average lookups and SameValueZero semantics (NaN works, objects by identity). Store the result only after fn returns so exceptions are never cached. For thenables, store the promise immediately (so concurrent callers share it) and evict it on rejection.',
    walkthrough: `1. Validate inputs so mistakes fail at definition time.
2. \`const cache = new Map()\` lives in memoize's scope — one cache per memoized function.
3. \`memoized\` is a \`function\` expression so \`this\` is the caller's receiver, which is forwarded to both resolver and fn with \`apply\`.
4. \`cache.has(key)\` distinguishes "never computed" from "computed undefined".
5. \`fn.apply(this, args)\` runs before \`cache.set\`; a throw skips the set.
6. If the result is a thenable, \`result.then(undefined, evict)\` deletes the entry on rejection. The identity check \`cache.get(key) === result\` prevents deleting a newer entry stored after \`clear()\`.
7. \`.cache\` and \`.clear\` are attached as properties.`,
    complexity: 'O(1) average time per call plus the cost of fn/resolver on a miss. Memory grows with the number of distinct keys — unbounded unless you add eviction.',
    edgeCases: '- Results of undefined/null/0.\n- NaN keys (Map uses SameValueZero).\n- Object keys compare by identity — two equal-looking objects are two entries.\n- fn throwing: nothing cached.\n- Promise rejection after clear(): the identity check avoids deleting an unrelated newer entry.',
    alternatives: '- **memoizeOne**: cache only the last arguments (what React\'s useMemo does per component) — O(1) memory, good for selectors.\n- **WeakMap keyed by object**: entries disappear when the key object is garbage-collected.\n- **LRU with maxSize**: a Map iterates in insertion order, so delete + set moves a key to the end and `cache.keys().next()` is the oldest.\n- **TTL**: store `{ value, expiresAt }` for data that goes stale.',
    tradeoffs: 'Memoization trades memory for CPU. It only pays off when fn is expensive relative to computing the key, inputs repeat, and fn is pure. An unbounded cache keyed by user input (search terms, ids) grows forever; in a long-lived SPA that is a memory leak.',
    commonMistakes: '- Using `if (cache.get(key))`, which recomputes falsy results.\n- Using an arrow function for memoized, losing `this`.\n- JSON.stringify keys on objects with functions, undefined or cycles.\n- Caching rejected promises permanently.\n- Memoizing impure functions (Date.now(), Math.random(), reads of mutable globals).',
    testingStrategy: 'Use a spy for fn and assert call counts. Cover cache hit/miss, default vs resolver keys, `this`, falsy results, identity keys, NaN, throwing, concurrent promise sharing and rejection eviction (await the rejection, flush, then assert the entry is gone).',
    seniorFollowUps: '- Add maxSize with LRU eviction using Map insertion order.\n- When would you use a WeakMap cache, and why can a WeakMap not be iterated or sized?\n- How is this different from React.useMemo (single entry, per component instance, may be discarded)?\n- How does TanStack Query\'s cache relate to memoizing a fetcher (staleTime, invalidation, dedupe)?',
  },
  followUps: [
    { id: 'f1', level: 'definition', question: 'What is memoization and what property must the function have for it to be safe?', expectedConcepts: ['cache results by input', 'pure / referentially transparent function', 'same input same output'], sourceIds: ['bfe-problems'] },
    { id: 'f2', level: 'mechanism', question: 'Why does memoize use a Map rather than a plain object for the cache?', expectedConcepts: ['any value as key', 'SameValueZero (NaN)', 'object identity keys', 'no prototype collisions'], sourceIds: ['mdn-map'] },
    { id: 'f3', level: 'application', question: 'Implement memoizeOne. Where does React use the same idea?', expectedConcepts: ['cache only last args', 'compare args with Object.is', 'useMemo caches one value per component'], sourceIds: ['bfe-problems', 'react-memo'] },
    { id: 'f4', level: 'edge-cases', question: 'Your memoized getUser cached a 500 error for a user forever. Fix it without losing request dedupe.', expectedConcepts: ['store in-flight promise', 'evict on rejection', 'identity check before delete'], sourceIds: ['mdn-promise-all'] },
    { id: 'f5', level: 'production', question: 'A memoized search function in a long-lived dashboard slowly grows memory. Diagnose and fix.', expectedConcepts: ['unbounded cache', 'heap snapshot shows Map growth', 'LRU/TTL', 'WeakMap for object keys'], sourceIds: ['chrome-memory-problems'] },
    { id: 'f6', level: 'architecture', question: 'When does memoization make performance worse?', expectedConcepts: ['key computation costlier than fn', 'low hit rate', 'memory pressure / GC', 'stale results for impure fn'], sourceIds: ['react-usecallback'] },
  ],
  mcqs: [
    {
      id: 'm1',
      question: 'A memoized function returns `undefined` for key "a". The implementation checks `if (cache.get(key)) return cache.get(key)`. What happens on the second call with "a"?',
      options: [
        { id: 'a', text: 'Returns the cached undefined without calling fn', explanation: 'cache.get returns undefined, which is falsy, so the branch is skipped.' },
        { id: 'b', text: 'Calls fn again, because the falsy cached value looks like a miss', explanation: 'Correct — use cache.has(key) to tell a miss from a cached falsy value.' },
        { id: 'c', text: 'Throws, because Map cannot store undefined', explanation: 'Map stores undefined values fine.' },
        { id: 'd', text: 'Returns null', explanation: 'Nothing converts undefined to null here.' },
      ],
      correctOptionId: 'b',
      explanation: 'Map.get cannot distinguish "missing" from "stored undefined"; Map.has can.',
      sourceIds: ['mdn-map'],
    },
    {
      id: 'm2',
      question: 'With the default key (first argument), `m({ id: 1 })` is called twice with two separately created but identical objects. How many times does fn run?',
      options: [
        { id: 'a', text: 'Once — the objects are structurally equal', explanation: 'Map keys compare by identity, not structure.' },
        { id: 'b', text: 'Twice — each object is a different key', explanation: 'Correct — this is referential equality, the same rule React.memo uses for props.' },
        { id: 'c', text: 'Zero — objects cannot be Map keys', explanation: 'Any value, including objects, can be a Map key.' },
        { id: 'd', text: 'It depends on JSON.stringify', explanation: 'Map does not serialise keys.' },
      ],
      correctOptionId: 'b',
      explanation: 'Map uses SameValueZero; two distinct objects are never equal keys. Use a resolver to build a value-based key when needed.',
      sourceIds: ['mdn-map', 'mdn-object-is'],
    },
    {
      id: 'm3',
      question: 'Which function is the worst candidate for memoization?',
      options: [
        { id: 'a', text: 'A pure function parsing a large markdown string, called repeatedly with the same string', explanation: 'Expensive, pure, repeating inputs — a good candidate.' },
        { id: 'b', text: 'A function returning `items.filter(i => i.price < Date.now() % 100)`', explanation: 'Correct — it is impure (depends on time), so a cached result is wrong.' },
        { id: 'c', text: 'A recursive Fibonacci function', explanation: 'Classic memoization win: overlapping subproblems.' },
        { id: 'd', text: 'A fetcher for user profiles by id with request dedupe', explanation: 'Reasonable with eviction on failure and invalidation.' },
      ],
      correctOptionId: 'b',
      explanation: 'Memoization assumes the same input always produces the same output. Impure functions return stale results when cached.',
      sourceIds: ['bfe-problems'],
    },
  ],
};

export default problem;
