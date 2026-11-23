import type { CodingProblem } from '../../schema';
import starter from './starter/solution.js?raw';
import solution from './solution/solution.js?raw';
import publicTests from './tests/public.test.js?raw';
import hiddenTests from './tests/hidden.test.js?raw';

const problem: CodingProblem = {
  schemaVersion: 1,
  kind: 'coding',
  id: 'js-curry',
  slug: 'curry',
  title: 'Implement curry()',
  track: 'javascript',
  execution: 'js',
  difficulty: 'easy',
  priority: 'P1',
  seniority: ['Senior', 'SDE-2'],
  topics: ['functional programming', 'closures', 'function arity', 'partial application'],
  estimatedMinutes: 15,
  conceptIds: ['currying', 'closures', 'this-binding'],
  research: {
    provenance: 'PUBLISHED_PRACTICE_PROBLEM',
    frequencyConfidence: 'MEDIUM_CONFIDENCE',
    verificationStatus: 'PARTIALLY_VERIFIED',
    lastVerified: '2026-11-23',
    evidence: [
      { sourceId: 'bfe-problems', url: 'https://bigfrontend.dev/problem/implement-curry', originalTitle: '1. implement curry()' },
      {
        sourceId: 'bfe-problems',
        url: 'https://bigfrontend.dev/problem/implement-curry-with-placeholder',
        originalTitle: '2. implement curry() with placeholder support',
        note: 'Used only for the placeholder follow-up.',
      },
    ],
    researchNotes:
      'Problem #1 on BFE.dev, with a placeholder variant as #2. Only one independent practice source lists it, so confidence is MEDIUM. Only the listing titles were read; the behaviour specified here (fn.length arity, multiple arguments per call, forwarding extra arguments, reusable partials) is this project\'s own specification.',
  },
  spec: {
    summary: 'Write curry(fn): collect arguments across one or more calls and invoke fn once fn.length arguments have been supplied.',
    description: `Implement \`curry(fn)\`.

The returned function accepts **any number of arguments per call**. While fewer than \`fn.length\` arguments have been collected, it returns a new function that waits for more. As soon as **at least** \`fn.length\` arguments are available, it calls \`fn\` with **all** of them (extra arguments included) and returns the result.

\`\`\`js
const join = (a, b, c) => \`\${a}_\${b}_\${c}\`;
const curried = curry(join);

curried(1, 2, 3); // '1_2_3'
curried(1)(2)(3); // '1_2_3'
curried(1, 2)(3); // '1_2_3'

const withOne = curried(1);  // can be reused
withOne(2)(3);   // '1_2_3'
withOne(8, 9);   // '1_8_9'
\`\`\`

Each partial application must be **independent**: calling \`withOne(2)\` must not change what \`withOne(8, 9)\` sees.`,
    technologies: ['JavaScript', 'closures', 'rest/spread'],
    learningObjectives: [
      'Use closures to accumulate arguments without shared mutable state',
      'Know what Function.prototype.length counts (and what it ignores)',
      'Distinguish currying from partial application',
      'Recognise where currying helps (configuration-first APIs, point-free composition) and where it hurts readability',
    ],
    clarifications: [
      {
        question: 'How do we know how many arguments fn needs?',
        why: 'JavaScript functions are variadic; the only built-in arity hint is fn.length, which stops counting at the first default or rest parameter.',
        defaultAssumption: 'Use fn.length. Functions with default/rest parameters are called as soon as the required ones are present.',
      },
      {
        question: 'Can a single call supply several arguments, or more arguments than needed?',
        why: 'Strict currying is one argument per call; most interview versions (and libraries such as lodash) allow grouping.',
        defaultAssumption: 'Any grouping is allowed. Extra arguments are passed through to fn.',
      },
      {
        question: 'Must `this` be forwarded to fn?',
        why: 'Curried functions are usually free functions; forwarding `this` across several partial calls has unclear semantics.',
        defaultAssumption: 'Not required and not tested. The reference solution forwards the `this` of the final call as a courtesy.',
      },
      {
        question: 'What should calling a partial with zero arguments do?',
        why: 'It is a common accidental call; it should not consume a slot or throw.',
        defaultAssumption: 'Return a function that still needs the same arguments.',
      },
    ],
    scopeDecisions: [
      'No placeholder support (that is BFE.dev problem #2 and a follow-up here).',
      '`this` forwarding is out of scope and not tested.',
      'Arity is fn.length only; no explicit arity parameter.',
    ],
    requirements: [
      { id: 'one-per-call', category: 'functional', level: 'MUST', text: 'curry(fn)(a)(b)(c) calls fn(a, b, c) when fn.length is 3.' },
      { id: 'grouping', category: 'functional', level: 'MUST', text: 'Any grouping of arguments across calls works: (a, b)(c), (a)(b, c), (a, b, c).' },
      { id: 'lazy', category: 'functional', level: 'MUST', text: 'fn is not called until at least fn.length arguments have been collected.' },
      { id: 'reusable-partials', category: 'technical', level: 'MUST', text: 'Partial applications are immutable: reusing a partial with different arguments gives independent results.' },
      { id: 'extra-args', category: 'functional', level: 'MUST', text: 'Arguments beyond fn.length that arrive in the completing call are forwarded to fn.' },
      { id: 'return-value', category: 'functional', level: 'MUST', text: 'The final call returns fn\'s return value unchanged.' },
      { id: 'fn-length', category: 'edge-case', level: 'MUST', text: 'Arity is fn.length, so a zero-arity fn runs on the first call and default/rest parameters are not waited for.' },
      { id: 'empty-call', category: 'edge-case', level: 'SHOULD', text: 'Calling a partial with no arguments returns a function that still expects the same arguments.' },
      { id: 'nullish-args', category: 'edge-case', level: 'MUST', text: 'undefined and null count as supplied arguments.' },
      { id: 'validate', category: 'technical', level: 'SHOULD', text: 'curry throws a TypeError immediately when fn is not a function.' },
      { id: 'no-shared-state', category: 'testing', level: 'SHOULD', text: 'Tests reuse the same partial several times to catch implementations that push into a shared array.' },
    ],
    constraints: ['No libraries.', 'Do not use Function.prototype.bind to accumulate arguments (write the closure yourself).'],
    acceptanceCriteria: [
      'All public tests pass.',
      'All hidden tests pass (zero arity, empty calls, default/rest parameters, return value identity, independent curried functions, nullish arguments, validation).',
    ],
    examples: [
      { title: 'One at a time', input: 'curry((a, b, c) => a + b + c)(1)(2)(3)', output: '6' },
      { title: 'Grouped', input: 'curry((a, b, c) => a + b + c)(1, 2)(3)', output: '6' },
      { title: 'Default parameter', input: 'curry((a, b = 10) => a + b)(1)', output: '11', explanation: 'fn.length is 1 because counting stops at the first default parameter.' },
      { title: 'Extra arguments', input: 'curry(function (a, b) { return arguments.length; })(1)(2, 3)', output: '3' },
    ],
    manualTests: ['In the console, build `const log = curry((level, scope, msg) => `[${level}] ${scope}: ${msg}`)` and create `const warnAuth = log("warn")("auth")`; call it with two different messages.'],
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
    'Read the target arity once with `fn.length`. The whole problem is: "do I have enough arguments yet?"',
    'Write an inner function `curried(...args)`. If `args.length >= arity`, call `fn` with all of them. Otherwise return a function that will call `curried` again with more arguments.',
    'The returned function should combine the arguments it closed over with the new ones: `(...more) => curried(...args, ...more)`. This creates a fresh array each time.',
    'If you push into one array declared in `curry`, reusing a partial (`const p = c(1); p(2)(3); p(4)(5)`) will break. Check that case.',
  ],
  solution: {
    initialApproach:
      'Recursion over a growing argument list. `curried(...args)` either has enough arguments (call fn) or returns a closure that remembers `args` and calls `curried` again with the old and new arguments combined.',
    bruteForce:
      'A version with a single `collected` array in `curry`\'s scope works for the one-shot `c(1)(2)(3)` case but leaks state between uses: a second call chain sees the first chain\'s arguments. It also never resets after fn is called. Mention it to explain why each partial must own its own argument list.',
    optimizedApproach:
      'Keep the argument list immutable. Each partial closes over its own `args` array and builds a new array (`[...args, ...more]`) when called. Partials can then be shared and reused freely, and the curried function itself has no mutable state at all.',
    walkthrough: `1. **Validate** that \`fn\` is a function, so a mistake fails where it was made.
2. **Read the arity once**: \`const arity = fn.length\`.
3. **\`curried(...args)\`**: if \`args.length >= arity\`, call \`fn.apply(this, args)\` and return the result. Passing all of \`args\` forwards any extra arguments.
4. **Otherwise** return \`partial(...more)\`, which calls \`curried\` with \`[...args, ...more]\`.
5. Because \`partial\` captures \`args\` and never changes it, calling the same partial twice with different arguments gives two independent results.
6. A call with no arguments produces \`[...args]\` — the same length — so it simply returns another waiting function.

Using \`function\` expressions (not arrows) keeps the call-site \`this\`, which is why the reference solution forwards the final call's \`this\`. This is not required by the spec.`,
    complexity: 'Each call copies the arguments collected so far, so completing an n-ary function one argument at a time costs O(n²) element copies in total — negligible for realistic arities (n < 10). Memory is O(n) per live partial.',
    edgeCases:
      '- **fn.length is 0** (e.g. `(...args) => {}` or `() => {}`) → the first call invokes fn.\n- **Default parameters** stop the count: `(a, b = 1) => {}` has length 1.\n- **Empty calls** `c(1)()` do not advance and do not throw.\n- **undefined/null arguments** count — only the number of arguments matters, not their values.\n- **Extra arguments** in the completing call are forwarded; arguments in *later* calls are impossible because fn has already run and its return value is returned.\n- **Return values that are functions** are returned as-is; they are not curried again.',
    alternatives:
      '- **Explicit arity**: `curry(fn, arity = fn.length)` supports variadic functions.\n- **`fn.bind(null, ...args)`**: concise accumulation, though `bind` also fixes `this`.\n- **Placeholders**: `curry.placeholder` lets callers skip positions (`c(_, 2)(1)`); fill placeholders from later arguments before counting.\n- **Strict unary currying** (`a => b => c => ...`) as written by hand in functional code — no utility needed.',
    tradeoffs:
      'Currying makes configuration-first APIs pleasant (`const logAuth = log("auth")`) and enables composition, but it hides the real arity from readers and TypeScript types for generic curry are complex. In application code, an explicit wrapper (`const logAuth = (msg) => log("auth", msg)`) is often clearer. fn.length-based currying also breaks silently when someone adds a default parameter.',
    commonMistakes:
      '- Using one shared array for collected arguments, so partials interfere and the curried function only works once.\n- Comparing with `===` instead of `>=`, so a completing call with extra arguments never calls fn.\n- Returning `curried` itself when there are not enough arguments, losing the collected ones.\n- Checking `args[i] !== undefined` to decide whether an argument was supplied.\n- Re-reading `fn.length` inside a wrapper whose own length is 0.',
    testingStrategy:
      'Cover every grouping of a 3-ary function, reuse the same partial with different continuations, check that fn is not called early (spy count), check extra-argument forwarding with `arguments`, and pin down fn.length edge cases (zero arity, default and rest parameters). Note that test mock functions usually report `length === 0`, so wrap them in a real function with the right number of parameters.',
    seniorFollowUps:
      '- Add placeholder support — how does the "enough arguments" check change?\n- Type `curry` in TypeScript for fixed-arity functions. What makes it hard (variadic tuple types, overload explosion)?\n- When would you *not* use currying in a production codebase?\n- How does currying relate to dependency injection and the "configure once, call many times" pattern?',
  },
  followUps: [
    {
      id: 'f1',
      level: 'definition',
      question: 'What is the difference between currying and partial application?',
      expectedConcepts: ['currying transforms an n-ary function into a chain of calls', 'partial application fixes some arguments and returns a function for the rest', 'this curry does both'],
      sourceIds: ['bfe-problems'],
    },
    {
      id: 'f2',
      level: 'mechanism',
      question: 'Why can two partials created from the same curried function be reused independently in your implementation?',
      expectedConcepts: ['each closure captures its own args array', 'new array per call', 'no shared mutable state'],
      sourceIds: ['mdn-closures'],
    },
    {
      id: 'f3',
      level: 'edge-cases',
      question: 'What is fn.length for `(a, b = 2, c) => {}` and `(...args) => {}`, and how does that affect curry?',
      expectedConcepts: ['length counts parameters before the first default', 'rest parameters are not counted', '1 and 0', 'curry calls fn early'],
      sourceIds: ['bfe-problems'],
    },
    {
      id: 'f4',
      level: 'application',
      question: 'Add placeholder support so that `curried(_, 2)(1)` behaves like `fn(1, 2)`.',
      expectedConcepts: ['fill placeholders left to right with new arguments', 'count only non-placeholder arguments among the first arity positions', 'immutable merge'],
      sourceIds: ['bfe-problems'],
    },
    {
      id: 'f5',
      level: 'production',
      question: 'A method is curried with your utility and called as `obj.method(1)(2)`. What is `this` inside the original method, and how would you make the behaviour predictable?',
      expectedConcepts: ['this of the final call', 'partial called as a plain function has undefined this in strict mode', 'bind explicitly', 'avoid currying methods'],
      sourceIds: ['mdn-this'],
    },
    {
      id: 'f6',
      level: 'architecture',
      question: 'Where does a "configure first, call later" style (currying) improve an API design, and where does it hurt? Give one example of each from a frontend codebase.',
      expectedConcepts: ['logger or API client factories', 'event handler factories', 'readability and stack traces', 'type inference cost', 'hidden arity'],
      sourceIds: ['mdn-closures'],
    },
  ],
  mcqs: [
    {
      id: 'm1',
      question: 'With the arity-based curry from this problem, what does this return?',
      code: `const f = curry((a, b = 5, c) => [a, b, c]);
f(1);`,
      options: [
        { id: 'a', text: 'A function waiting for two more arguments', explanation: 'fn.length stops counting at the first parameter with a default, so the arity is 1, not 3.' },
        { id: 'b', text: '[1, 5, undefined]', explanation: 'Correct: fn.length is 1, so the first call already has enough arguments.' },
        { id: 'c', text: '[1, undefined, undefined]', explanation: 'b is omitted, so its default value 5 applies.' },
        { id: 'd', text: 'A TypeError', explanation: 'Nothing here is invalid; default parameters are allowed anywhere.' },
      ],
      correctOptionId: 'b',
      explanation: 'Function.prototype.length counts only the parameters before the first default value (and never the rest parameter). An arity-based curry therefore calls fn after one argument.',
      sourceIds: ['bfe-problems'],
    },
    {
      id: 'm2',
      question: 'An implementation stores collected arguments in one array declared inside curry() and pushes into it on every call. Which test fails first?',
      options: [
        { id: 'a', text: 'curry(join)(1)(2)(3) on a fresh curried function', explanation: 'A single chain on a fresh function works — that is why this bug survives quick manual checks.' },
        { id: 'b', text: 'Reusing a partial: p = c(1); p(2)(3); p(4)(5)', explanation: 'Correct: the second chain still sees the arguments from the first chain.' },
        { id: 'c', text: 'curry(join)(1, 2, 3)', explanation: 'One call with all arguments also works on a fresh function.' },
        { id: 'd', text: 'None; the shared array is fine', explanation: 'A shared array makes every chain after the first see stale arguments.' },
      ],
      correctOptionId: 'b',
      explanation: 'Closures capture variables, not snapshots. A single array shared by every call accumulates arguments from every chain. Each partial must own its own immutable argument list.',
      sourceIds: ['mdn-closures'],
    },
  ],
};

export default problem;
