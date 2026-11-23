import type { OutputQuestion, Research } from '../schema';

/**
 * Track 5 — output prediction. Every snippet is original; BFE.dev quiz titles are cited only as
 * evidence that the topic appears in practice material. Every `expectedOutput` is verified by
 * executing `code` in `questions.test.ts`.
 */

const LAST_VERIFIED = '2026-11-23';

type Ev = { sourceId: string; url: string; originalTitle: string; note?: string };

const bfe = (title: string, url: string): Ev => ({
  sourceId: 'bfe-quiz',
  url,
  originalTitle: title,
  note: 'topic evidence; snippet is original',
});

const doc = (sourceId: string, url: string, originalTitle: string): Ev => ({
  sourceId,
  url,
  originalTitle,
  note: 'No BFE.dev quiz found for this topic; behaviour documented by the official docs. Snippet is original.',
});

function research(evidence: Ev[], researchNotes: string): Research {
  const hasBfe = evidence.some((e) => e.sourceId === 'bfe-quiz');
  return {
    provenance: 'DOCUMENTED_TECHNICAL_EXERCISE',
    frequencyConfidence: hasBfe ? 'MEDIUM_CONFIDENCE' : 'LOW_CONFIDENCE',
    verificationStatus: 'SOURCES_VERIFIED',
    lastVerified: LAST_VERIFIED,
    evidence,
    researchNotes,
  };
}

const NODE_PROMPT = 'What does this script print, in order? (Run as a classic script in Node.js.)';
const REACT_PROMPT =
  'React 18 (createRoot, no StrictMode). `React`, `createRoot`, `act` and `document` are already in scope. What is printed, in order?';

export const OUTPUT_QUESTIONS_DATA: OutputQuestion[] = [
  {
    schemaVersion: 1,
    kind: 'output',
    execution: 'output',
    track: 'output',
    id: 'out-microtask-vs-timeout',
    slug: 'microtask-vs-timeout',
    title: 'Microtasks vs. timers',
    difficulty: 'medium',
    priority: 'P0',
    seniority: ['Senior', 'SDE-2', 'SDE-3'],
    topics: ['event loop', 'microtasks', 'setTimeout', 'queueMicrotask'],
    estimatedMinutes: 4,
    conceptIds: ['event-loop', 'promises'],
    research: research(
      [
        bfe('1. Promise order', 'https://bigfrontend.dev/quiz/1-promise-order'),
        bfe('54. setTimeout(0ms)', 'https://bigfrontend.dev/quiz/setTimeout-0ms'),
      ],
      'Microtask vs. macrotask ordering is the most common output-prediction topic on BFE.dev (several "Promise order" and "setTimeout" quizzes). Behaviour documented by MDN microtask guide.',
    ),
    environment: 'node',
    prompt: NODE_PROMPT,
    code: `console.log('1');
setTimeout(() => {
  console.log('2');
  Promise.resolve().then(() => console.log('3'));
}, 0);
setTimeout(() => console.log('4'), 0);
Promise.resolve().then(() => {
  console.log('5');
  setTimeout(() => console.log('6'), 0);
});
queueMicrotask(() => console.log('7'));
console.log('8');`,
    expectedOutput: ['1', '8', '5', '7', '2', '3', '4', '6'],
    steps: [
      'Synchronous code runs first: logs 1, queues timer T2 and timer T4, queues microtask M5 (the then callback) and microtask M7, then logs 8.',
      'The call stack is empty, so the microtask queue is drained in FIFO order: M5 logs 5 and queues a new timer T6 (behind T2 and T4); M7 logs 7.',
      'Only now does the event loop take the first timer task, T2: it logs 2 and queues microtask M3.',
      'After every task the microtask queue is drained again, so M3 logs 3 before the next timer runs.',
      'Timer T4 runs and logs 4, then timer T6 (queued last) logs 6.',
    ],
    misconceptions: [
      'setTimeout(fn, 0) does not run "immediately" — it waits for the current script and every queued microtask.',
      'Microtasks are not batched until all timers finish: the microtask queue is drained after each individual task, so 3 prints before 4.',
      'queueMicrotask and Promise.then share the same microtask queue; they run in the order they were queued.',
    ],
    followUp: {
      question: 'What happens if a microtask keeps queueing another microtask forever?',
      answer:
        'The microtask queue never empties, so no timer, rendering or input task ever runs again — the page (or Node process) freezes. A recursive setTimeout, by contrast, lets other tasks interleave.',
    },
    docSourceIds: ['mdn-microtask', 'mdn-event-loop', 'mdn-queuemicrotask', 'mdn-settimeout'],
  },
  {
    schemaVersion: 1,
    kind: 'output',
    execution: 'output',
    track: 'output',
    id: 'out-async-await-order',
    slug: 'async-await-order',
    title: 'async/await execution order',
    difficulty: 'medium',
    priority: 'P0',
    seniority: ['Senior', 'SDE-2', 'SDE-3'],
    topics: ['async/await', 'microtasks', 'event loop'],
    estimatedMinutes: 4,
    conceptIds: ['event-loop', 'promises'],
    research: research(
      [
        bfe('50. async await', 'https://bigfrontend.dev/quiz/async-await'),
        bfe('130. async', 'https://bigfrontend.dev/quiz/async'),
      ],
      'BFE.dev has multiple async/await ordering quizzes. Semantics documented by MDN (event loop, microtasks).',
    ),
    environment: 'node',
    prompt: NODE_PROMPT,
    code: `async function first() {
  console.log('first start');
  await second();
  console.log('first end');
}
async function second() {
  console.log('second');
}
console.log('script start');
setTimeout(() => console.log('timeout'), 0);
first();
new Promise((resolve) => {
  console.log('executor');
  resolve();
}).then(() => console.log('then'));
console.log('script end');`,
    expectedOutput: ['script start', 'first start', 'second', 'executor', 'script end', 'first end', 'then', 'timeout'],
    steps: [
      'Logs "script start" and queues the timeout task.',
      'Calling first() runs its body synchronously up to the first await: logs "first start", then calls second(), which also runs synchronously and logs "second".',
      'second() returns an already-fulfilled promise; `await` suspends first() and queues its continuation as a microtask.',
      'The Promise executor runs synchronously (logs "executor") and resolves; .then queues its callback as a microtask behind first()\'s continuation.',
      'Logs "script end". The stack is empty, so microtasks run in order: "first end", then "then".',
      'Finally the timer task runs: "timeout".',
    ],
    misconceptions: [
      'An async function does not start asynchronously — everything before the first await runs synchronously in the caller.',
      'The code after `await` does not run immediately even if the awaited value is already resolved; it is always resumed in a microtask.',
    ],
    followUp: {
      question: 'Would the order change if second() were a plain (non-async) function returning undefined?',
      answer:
        'No. `await undefined` still suspends first() and resumes it in one microtask, which is queued before the .then callback, so "first end" still prints before "then".',
    },
    docSourceIds: ['mdn-event-loop', 'mdn-microtask'],
  },
  {
    schemaVersion: 1,
    kind: 'output',
    execution: 'output',
    track: 'output',
    id: 'out-promise-then-return',
    slug: 'promise-then-return',
    title: 'Returning a promise from then()',
    difficulty: 'hard',
    priority: 'P1',
    seniority: ['SDE-3', 'MTS'],
    topics: ['promises', 'microtasks', 'thenable adoption'],
    estimatedMinutes: 5,
    conceptIds: ['promises', 'event-loop'],
    research: research(
      [
        bfe('47. Promise Order II', 'https://bigfrontend.dev/quiz/promise-order-II'),
        bfe('103. Promise Order III', 'https://bigfrontend.dev/quiz/Promise-Order-III'),
      ],
      'Interleaving of two promise chains when one returns a promise from then() appears in BFE.dev "Promise Order" quizzes. The extra ticks come from the spec\'s PromiseResolveThenableJob; MDN microtask guide covers the queue.',
    ),
    environment: 'node',
    prompt: NODE_PROMPT,
    code: `Promise.resolve()
  .then(() => {
    console.log('a1');
    return Promise.resolve('x');
  })
  .then((v) => console.log('a2 ' + v));

Promise.resolve()
  .then(() => console.log('b1'))
  .then(() => console.log('b2'))
  .then(() => console.log('b3'))
  .then(() => console.log('b4'));`,
    expectedOutput: ['a1', 'b1', 'b2', 'b3', 'a2 x', 'b4'],
    steps: [
      'Both chains start from already-resolved promises, so their first callbacks (a1, b1) are queued as microtasks in source order.',
      'Tick 1: "a1" runs and returns a promise P. "b1" runs and queues b2.',
      'Because the then() callback returned a thenable, the derived promise is not resolved yet. A PromiseResolveThenableJob is queued, which calls P.then(...).',
      'Tick 2: that job runs and subscribes to P (already fulfilled), queueing yet another microtask; "b2" runs and queues b3.',
      'Tick 3: the derived promise is finally fulfilled with "x", queueing the a2 callback; "b3" runs and queues b4.',
      'Tick 4: "a2 x" runs, then "b4".',
    ],
    misconceptions: [
      'Returning Promise.resolve(v) from then() is not equivalent to returning v — adopting a thenable costs two extra microtask ticks.',
      'Two independent chains do not run one after the other; they interleave one step per microtask tick.',
    ],
    followUp: {
      question: 'What would print if the first callback returned the plain string "x" instead?',
      answer: 'a1, b1, a2 x, b2, b3, b4 — a non-thenable return value fulfils the derived promise immediately, so a2 is queued in the next tick.',
    },
    docSourceIds: ['mdn-microtask', 'mdn-event-loop'],
  },
  {
    schemaVersion: 1,
    kind: 'output',
    execution: 'output',
    track: 'output',
    id: 'out-promise-executor-sync',
    slug: 'promise-executor-sync',
    title: 'The Promise executor runs synchronously',
    difficulty: 'easy',
    priority: 'P0',
    seniority: ['Senior', 'SDE-2'],
    topics: ['promises', 'executor', 'settled state'],
    estimatedMinutes: 2,
    conceptIds: ['promises', 'event-loop'],
    research: research(
      [
        bfe('2. Promise executor', 'https://bigfrontend.dev/quiz/2-promise-executor'),
        bfe('18. Promise executor II', 'https://bigfrontend.dev/quiz/Promise-executor-II'),
      ],
      'BFE.dev has four "Promise executor" quizzes. Behaviour documented by MDN (microtasks).',
    ),
    environment: 'node',
    prompt: NODE_PROMPT,
    code: `const p = new Promise((resolve, reject) => {
  console.log('executor start');
  resolve('first');
  resolve('second');
  reject(new Error('ignored'));
  console.log('executor end');
});
p.then((v) => console.log('then: ' + v)).catch(() => console.log('catch'));
console.log('after constructor');`,
    expectedOutput: ['executor start', 'executor end', 'after constructor', 'then: first'],
    steps: [
      'new Promise calls the executor synchronously, so "executor start" prints first.',
      'resolve("first") settles the promise. The later resolve("second") and reject(...) calls are ignored because a promise settles only once.',
      'Calling resolve does not stop the executor — "executor end" still prints.',
      'then() registers a callback; since p is already fulfilled the callback is queued as a microtask. "after constructor" prints synchronously.',
      'The microtask runs: "then: first". The catch handler never runs because nothing rejected.',
    ],
    misconceptions: [
      'resolve() is not a return statement — code after it in the executor still runs.',
      'The last resolve/reject does not "win"; the first one settles the promise and the rest are no-ops.',
    ],
    followUp: {
      question: 'What if the executor throws after calling resolve("first")?',
      answer: 'The throw is swallowed: the promise is already fulfilled, so the exception cannot reject it. The output is unchanged except anything after the throw is skipped.',
    },
    docSourceIds: ['mdn-microtask', 'mdn-event-loop'],
  },
  {
    schemaVersion: 1,
    kind: 'output',
    execution: 'output',
    track: 'output',
    id: 'out-var-hoisting',
    slug: 'var-hoisting',
    title: 'var and function hoisting',
    difficulty: 'easy',
    priority: 'P0',
    seniority: ['Senior', 'SDE-2'],
    topics: ['hoisting', 'var', 'function declarations', 'scope'],
    estimatedMinutes: 3,
    conceptIds: ['hoisting-tdz'],
    research: research(
      [
        bfe('27. Hoisting I', 'https://bigfrontend.dev/quiz/Hoisting-I'),
        bfe('39. var', 'https://bigfrontend.dev/quiz/var'),
      ],
      'BFE.dev has six "Hoisting" quizzes plus a "var" quiz. Behaviour documented by MDN glossary (Hoisting).',
    ),
    environment: 'node',
    prompt: NODE_PROMPT,
    code: `console.log(typeof greet);
console.log(typeof shout);
console.log(count);
var count = 1;
function greet() {
  return 'hi';
}
var shout = function () {
  return 'HI';
};
function run() {
  console.log(count);
  var count = 2;
  console.log(count);
}
run();
console.log(count);`,
    expectedOutput: ['function', 'undefined', 'undefined', 'undefined', '2', '1'],
    steps: [
      'Before any code runs, function declarations are hoisted with their body (greet is a function) and var declarations are hoisted and initialised to undefined (count, shout).',
      'typeof greet is "function"; typeof shout is "undefined" because only the variable, not the function expression assigned to it, is hoisted.',
      'count is logged before its assignment: undefined. Then count = 1.',
      'Inside run(), `var count` is hoisted to the top of the function, shadowing the outer count — so the first log prints undefined, not 1.',
      'After `count = 2` the inner log prints 2.',
      'The outer count was never touched by run(), so the final log prints 1.',
    ],
    misconceptions: [
      'Hoisting does not move assignments — only the declaration is hoisted.',
      'A function expression assigned to var is not callable before the assignment, unlike a function declaration.',
      'The inner log does not see the outer count, because the local var declaration shadows it for the whole function body.',
    ],
    followUp: {
      question: 'What would `shout()` on the first line do?',
      answer: 'Throw TypeError: shout is not a function — shout exists (hoisted var) but its value is still undefined.',
    },
    docSourceIds: ['mdn-hoisting'],
  },
  {
    schemaVersion: 1,
    kind: 'output',
    execution: 'output',
    track: 'output',
    id: 'out-tdz',
    slug: 'temporal-dead-zone',
    title: 'let and the temporal dead zone',
    difficulty: 'medium',
    priority: 'P0',
    seniority: ['Senior', 'SDE-2', 'SDE-3'],
    topics: ['let', 'TDZ', 'hoisting', 'typeof'],
    estimatedMinutes: 3,
    conceptIds: ['hoisting-tdz'],
    research: research(
      [
        bfe('89. let', 'https://bigfrontend.dev/quiz/let'),
        bfe('42. Hoisting V', 'https://bigfrontend.dev/quiz/hoisting-v'),
      ],
      'BFE.dev "let" and later "Hoisting" quizzes cover the TDZ. Documented on MDN (let — temporal dead zone).',
    ),
    environment: 'node',
    prompt: NODE_PROMPT,
    code: `let label = 'outer';
function show() {
  try {
    console.log(label);
  } catch (e) {
    console.log(e.name);
  }
  let label = 'inner';
  console.log(label);
}
show();
console.log(typeof undeclaredThing);
try {
  console.log(typeof later);
} catch (e) {
  console.log(e.name);
}
let later = 1;`,
    expectedOutput: ['ReferenceError', 'inner', 'undefined', 'ReferenceError'],
    steps: [
      'Inside show(), `let label` is hoisted to the top of the function block but left uninitialised — the temporal dead zone (TDZ) lasts until the declaration line executes.',
      'console.log(label) resolves to the inner (uninitialised) binding, not the outer one, so it throws a ReferenceError; the catch logs "ReferenceError".',
      'After the declaration runs, label is "inner".',
      'typeof on a name that is not declared anywhere returns "undefined" without throwing.',
      'typeof on a let binding that is declared but still in its TDZ throws ReferenceError — typeof does not protect you here.',
    ],
    misconceptions: [
      'let/const are hoisted too — that is exactly why the inner declaration shadows the outer label before its line runs.',
      'typeof is not always safe: it throws for variables in their TDZ.',
    ],
    followUp: {
      question: 'Is the TDZ about position in the source or about time?',
      answer:
        'Time. A function declared above `let x` may read x safely as long as it is called after the declaration executed; the TDZ is the period between scope entry and initialisation.',
    },
    docSourceIds: ['mdn-let', 'mdn-hoisting'],
  },
  {
    schemaVersion: 1,
    kind: 'output',
    execution: 'output',
    track: 'output',
    id: 'out-closure-loop-var-let',
    slug: 'closure-loop-var-let',
    title: 'Closures in loops: var vs. let',
    difficulty: 'easy',
    priority: 'P0',
    seniority: ['Senior', 'SDE-2'],
    topics: ['closures', 'var', 'let', 'loops', 'setTimeout'],
    estimatedMinutes: 3,
    conceptIds: ['closures', 'hoisting-tdz', 'event-loop'],
    research: research(
      [
        bfe('99. closure', 'https://bigfrontend.dev/quiz/closure-1'),
        bfe('100. `var` vs `let`', 'https://bigfrontend.dev/quiz/var-vs-let'),
      ],
      'Classic loop-closure question, present as BFE.dev quizzes "closure" and "var vs let". Documented in MDN Closures ("Creating closures in loops").',
    ),
    environment: 'node',
    prompt: NODE_PROMPT,
    code: `const fromVar = [];
for (var i = 0; i < 3; i++) {
  fromVar.push(() => i);
}
const fromLet = [];
for (let j = 0; j < 3; j++) {
  fromLet.push(() => j);
}
console.log(fromVar.map((f) => f()).join(','));
console.log(fromLet.map((f) => f()).join(','));
for (var k = 0; k < 3; k++) {
  setTimeout(() => console.log('k=' + k), 0);
}`,
    expectedOutput: ['3,3,3', '0,1,2', 'k=3', 'k=3', 'k=3'],
    steps: [
      '`var i` is function/script scoped: there is one i shared by all three arrow functions.',
      'The arrows read i when they are called, after the loop ended with i === 3, so they return 3,3,3.',
      'A `let` loop variable gets a fresh binding per iteration (copied from the previous one before the increment), so each arrow closes over its own j: 0,1,2.',
      'The timers capture the single `var k`; by the time they fire (after the synchronous code) k is 3, so each logs "k=3".',
    ],
    misconceptions: [
      'Closures capture variables (bindings), not the value at creation time.',
      'setTimeout(…, 0) does not run during the loop iteration — the loop finishes first.',
    ],
    followUp: {
      question: 'How would you fix the var/setTimeout loop without changing var to let?',
      answer:
        'Create a new scope per iteration, e.g. an IIFE `((n) => setTimeout(() => console.log(n), 0))(k)`, or pass k as the third setTimeout argument: `setTimeout((n) => console.log(n), 0, k)`.',
    },
    docSourceIds: ['mdn-closures', 'mdn-let'],
  },
  {
    schemaVersion: 1,
    kind: 'output',
    execution: 'output',
    track: 'output',
    id: 'out-this-method-extraction',
    slug: 'this-method-extraction',
    title: '`this` after extracting a method',
    difficulty: 'medium',
    priority: 'P0',
    seniority: ['Senior', 'SDE-2', 'SDE-3'],
    topics: ['this', 'bind', 'call', 'strict mode'],
    estimatedMinutes: 3,
    conceptIds: ['this-binding'],
    research: research(
      [
        bfe('19. `this`', 'https://bigfrontend.dev/quiz/this'),
        bfe('41. `this` III', 'https://bigfrontend.dev/quiz/this-III'),
      ],
      'BFE.dev has seven `this` quizzes. Rules documented on MDN (this, Function.prototype.bind).',
    ),
    environment: 'node',
    prompt: NODE_PROMPT,
    code: `'use strict';
const counter = {
  count: 10,
  read() {
    return this === undefined ? 'no this' : this.count;
  },
};
const read = counter.read;
const bound = counter.read.bind({ count: 99 });
const other = { count: 1, read: counter.read };
console.log(counter.read());
console.log(read());
console.log(bound());
console.log(other.read());
console.log(bound.call(counter));`,
    expectedOutput: ['10', 'no this', '99', '1', '99'],
    steps: [
      '`this` for a regular function is decided by how it is called, not where it is defined.',
      'counter.read() is a method call, so this === counter → 10.',
      'read() is a plain call. In strict mode a plain call leaves this undefined → "no this".',
      'bound() uses the object passed to bind → 99.',
      'other.read() is a method call on other → 1, even though the function was originally defined in counter.',
      'call() cannot override a bound function\'s this, so bound.call(counter) still returns 99.',
    ],
    misconceptions: [
      'A method does not "belong" to the object literal it was written in; this is resolved at call time.',
      'call/apply (and a second bind) cannot change the this of an already-bound function.',
      'Without strict mode, a plain call would set this to globalThis instead of undefined.',
    ],
    followUp: {
      question: 'What does passing counter.read as an event-handler or setTimeout callback do to `this`?',
      answer:
        'The callback is invoked as a plain function (or with the event target as this for DOM listeners), so the original object is lost. Use counter.read.bind(counter) or an arrow wrapper `() => counter.read()`.',
    },
    docSourceIds: ['mdn-this'],
  },
  {
    schemaVersion: 1,
    kind: 'output',
    execution: 'output',
    track: 'output',
    id: 'out-arrow-this',
    slug: 'arrow-this',
    title: 'Arrow functions and lexical `this`',
    difficulty: 'medium',
    priority: 'P0',
    seniority: ['Senior', 'SDE-2', 'SDE-3'],
    topics: ['arrow functions', 'this', 'callbacks'],
    estimatedMinutes: 4,
    conceptIds: ['this-binding', 'closures'],
    research: research(
      [
        bfe('6. Arrow Function', 'https://bigfrontend.dev/quiz/6-Arrow-Function'),
        bfe('102. Arrow Function II', 'https://bigfrontend.dev/quiz/Arrow-Function-II'),
      ],
      'BFE.dev "Arrow Function" quizzes focus on lexical this. Documented on MDN (this — arrow functions).',
    ),
    environment: 'node',
    prompt: NODE_PROMPT,
    code: `'use strict';
const team = {
  name: 'core',
  members: ['ana', 'ben'],
  regular() {
    return this.members.map(function (m) {
      return m + '@' + (this ? this.name : 'none');
    });
  },
  arrow() {
    return this.members.map((m) => m + '@' + this.name);
  },
};
console.log(team.regular().join(' '));
console.log(team.arrow().join(' '));
console.log(team.arrow.call({ name: 'guest', members: ['cy'] }).join(' '));
const detached = team.arrow;
try {
  detached();
} catch (e) {
  console.log(e.name);
}`,
    expectedOutput: ['ana@none ben@none', 'ana@core ben@core', 'cy@guest', 'TypeError'],
    steps: [
      'In regular(), the callback passed to map is a regular function called by map without a thisArg, so (in strict mode) its this is undefined → "none".',
      'In arrow(), the callback is an arrow function: it has no own this and uses the this of arrow(), which is team → "core".',
      'team.arrow.call({...}) sets arrow()\'s this to the guest object; the inner arrow inherits it → "cy@guest".',
      'detached() is a plain call, so arrow()\'s this is undefined; reading this.members throws a TypeError.',
    ],
    misconceptions: [
      'An arrow function does not bind this to the object it is written inside — it inherits this from the enclosing function at the time that function runs.',
      'Arrow functions do not "fix" this permanently: if the enclosing method is called with a different this, the arrow sees that.',
    ],
    followUp: {
      question: 'Why is defining an object method itself as an arrow function (`arrow: () => this.name`) usually a bug?',
      answer:
        'The arrow takes this from the surrounding scope where the object literal is evaluated (module or script top level), not from the object, so this.name is not the object\'s name.',
    },
    docSourceIds: ['mdn-this'],
  },
  {
    schemaVersion: 1,
    kind: 'output',
    execution: 'output',
    track: 'output',
    id: 'out-equality-coercion',
    slug: 'equality-coercion',
    title: 'Loose equality and coercion',
    difficulty: 'medium',
    priority: 'P1',
    seniority: ['Senior', 'SDE-2'],
    topics: ['==', 'type coercion', 'ToPrimitive'],
    estimatedMinutes: 4,
    conceptIds: ['coercion-equality'],
    research: research(
      [
        bfe('10. Equal', 'https://bigfrontend.dev/quiz/Equal-1'),
        bfe('8. Implicit Coercion I', 'https://bigfrontend.dev/quiz/Implicit-Conversion-1'),
      ],
      'BFE.dev has several "Equal" and "Implicit Coercion" quizzes. Algorithm documented on MDN (Equality ==).',
    ),
    environment: 'node',
    prompt: NODE_PROMPT,
    code: `console.log(0 == '');
console.log('1' == 1);
console.log(null == undefined);
console.log(null == 0);
console.log([] == false);
console.log([1] == 1);
console.log(NaN == NaN);
console.log('0' == false);
console.log({} == '[object Object]');`,
    expectedOutput: ['true', 'true', 'true', 'false', 'true', 'true', 'false', 'true', 'true'],
    steps: [
      'Number vs. string: the string is converted to a number. "" → 0, so 0 == "" is true; "1" → 1, true.',
      'null and undefined are loosely equal only to each other (and themselves), so null == undefined is true and null == 0 is false — null is not converted to a number here.',
      'A boolean operand is converted to a number first: false → 0. [] is then converted to a primitive: [].toString() is "", which becomes 0, so [] == false is true.',
      '[1] → "1" → 1, so [1] == 1 is true.',
      'NaN is not equal to anything, including itself.',
      '"0" == false → "0" == 0 → 0 == 0 → true.',
      '{} is converted with ToPrimitive → "[object Object]", which equals the string.',
    ],
    misconceptions: [
      'null == 0 is false even though null >= 0 is true — relational operators convert null to 0, but == has a special rule for null/undefined.',
      'Truthiness is not what == checks: [] is truthy, yet [] == false is true.',
    ],
    followUp: {
      question: 'Is there a legitimate use of == in modern code?',
      answer: 'The common accepted idiom is `x == null`, which checks for both null and undefined in one comparison; otherwise prefer ===.',
    },
    docSourceIds: ['mdn-equality'],
  },
  {
    schemaVersion: 1,
    kind: 'output',
    execution: 'output',
    track: 'output',
    id: 'out-object-is',
    slug: 'object-is-sameness',
    title: 'Object.is, NaN and -0',
    difficulty: 'easy',
    priority: 'P1',
    seniority: ['Senior', 'SDE-2'],
    topics: ['Object.is', 'SameValueZero', 'NaN', '-0', 'Set'],
    estimatedMinutes: 3,
    conceptIds: ['coercion-equality', 'referential-equality'],
    research: research(
      [bfe('24. Equality & Sameness', 'https://bigfrontend.dev/quiz/Equality-Sameness')],
      'BFE.dev "Equality & Sameness" quiz covers the same algorithms. Documented on MDN (Object.is, Equality).',
    ),
    environment: 'node',
    prompt: NODE_PROMPT,
    code: `console.log(NaN === NaN);
console.log(Object.is(NaN, NaN));
console.log(0 === -0);
console.log(Object.is(0, -0));
console.log([NaN].includes(NaN));
console.log([NaN].indexOf(NaN));
console.log(new Set([0, -0, NaN, NaN]).size);`,
    expectedOutput: ['false', 'true', 'true', 'false', 'true', '-1', '2'],
    steps: [
      '=== (IsStrictlyEqual) treats NaN as unequal to itself and +0/-0 as equal.',
      'Object.is (SameValue) is the opposite on both edge cases: NaN is the same as NaN, and 0 is not the same as -0.',
      'Array.prototype.includes uses SameValueZero, which finds NaN → true.',
      'Array.prototype.indexOf uses strict equality, so it cannot find NaN → -1.',
      'Set also uses SameValueZero: 0 and -0 collapse into one entry and the two NaNs into another → size 2.',
    ],
    misconceptions: [
      'includes and indexOf do not use the same comparison — only includes can find NaN.',
      'Object.is is not just "=== without coercion"; it differs from === exactly on NaN and ±0.',
    ],
    followUp: {
      question: 'Where does React use Object.is?',
      answer:
        'To decide whether a state update changed anything (bail out if Object.is(old, new)) and to compare hook dependency arrays element by element.',
    },
    docSourceIds: ['mdn-object-is', 'mdn-equality'],
  },
  {
    schemaVersion: 1,
    kind: 'output',
    execution: 'output',
    track: 'output',
    id: 'out-object-reference',
    slug: 'object-reference',
    title: 'Passing objects by reference value',
    difficulty: 'easy',
    priority: 'P1',
    seniority: ['Senior', 'SDE-2'],
    topics: ['references', 'mutation', 'spread', 'shallow copy'],
    estimatedMinutes: 3,
    conceptIds: ['referential-equality'],
    research: research(
      [bfe('64. reference type', 'https://bigfrontend.dev/quiz/reference-type')],
      'BFE.dev "reference type" quiz covers the topic. Shallow copies documented on MDN (structuredClone page discusses deep vs. shallow copies).',
    ),
    environment: 'node',
    prompt: NODE_PROMPT,
    code: `function rename(user) {
  user.name = 'Bea';
  user = { name: 'Cy' };
  user.name = 'Dee';
  return user;
}
const original = { name: 'Al', tags: ['a'] };
const returned = rename(original);
console.log(original.name);
console.log(returned.name);
const shallow = { ...original };
shallow.name = 'Eve';
shallow.tags.push('b');
console.log(original.name + ' ' + original.tags.join(','));
console.log(original.tags === shallow.tags);
console.log({ a: 1 } === { a: 1 });`,
    expectedOutput: ['Bea', 'Dee', 'Bea a,b', 'true', 'false'],
    steps: [
      'rename receives a copy of the reference to original. user.name = "Bea" mutates the shared object.',
      'Reassigning user only changes the local parameter; original is untouched by the next two lines. The function returns the new object named "Dee".',
      'Spread makes a shallow copy: shallow.name is an own property of the new object, so original.name stays "Bea".',
      'tags is copied by reference, so pushing to shallow.tags also changes original.tags → "Bea a,b"; the arrays are the same object (true).',
      'Two separately created object literals are different objects, so === is false even with identical contents.',
    ],
    misconceptions: [
      'JavaScript is not pass-by-reference: reassigning a parameter never affects the caller\'s variable — only mutation of the shared object does.',
      'Object spread is not a deep clone; nested objects and arrays are shared.',
    ],
    followUp: {
      question: 'How would you make a deep copy of original?',
      answer: 'structuredClone(original) (handles nested objects, arrays, Map, Set, Date, cycles; not functions or DOM nodes), or a hand-written recursive copy.',
    },
    docSourceIds: ['mdn-structuredclone', 'mdn-object-is'],
  },
  {
    schemaVersion: 1,
    kind: 'output',
    execution: 'output',
    track: 'output',
    id: 'out-prototype-shadowing',
    slug: 'prototype-shadowing',
    title: 'Prototype lookup and shadowing',
    difficulty: 'medium',
    priority: 'P1',
    seniority: ['Senior', 'SDE-2', 'SDE-3'],
    topics: ['prototype chain', 'shadowing', 'hasOwnProperty', 'in'],
    estimatedMinutes: 4,
    conceptIds: ['prototype-chain', 'this-binding'],
    research: research(
      [
        bfe('48. Prototype', 'https://bigfrontend.dev/quiz/prototype'),
        bfe('53. Prototype 2', 'https://bigfrontend.dev/quiz/prototype2'),
      ],
      'BFE.dev "Prototype" quizzes cover lookup through the chain. Documented on MDN (Inheritance and the prototype chain).',
    ),
    environment: 'node',
    prompt: NODE_PROMPT,
    code: `function Animal(name) {
  this.name = name;
}
Animal.prototype.sound = 'generic';
Animal.prototype.speak = function () {
  return this.name + ' says ' + this.sound;
};
const cat = new Animal('Tom');
const dog = new Animal('Rex');
dog.sound = 'woof';
console.log(cat.speak());
console.log(dog.speak());
Animal.prototype.sound = 'changed';
console.log(cat.speak());
console.log(dog.speak());
delete dog.sound;
console.log(dog.speak());
console.log(cat.hasOwnProperty('sound') + ' ' + ('sound' in cat));`,
    expectedOutput: ['Tom says generic', 'Rex says woof', 'Tom says changed', 'Rex says woof', 'Rex says changed', 'false true'],
    steps: [
      'Both instances get an own name; sound and speak live on Animal.prototype.',
      'dog.sound = "woof" creates an own property on dog that shadows the prototype property; cat has no own sound.',
      'speak runs with this = the instance. cat.sound is found on the prototype ("generic"); dog.sound is its own ("woof").',
      'Changing Animal.prototype.sound is visible to every instance that does not shadow it: cat now reads "changed", dog still reads "woof".',
      'delete dog.sound removes the own property, so the lookup falls through to the prototype again → "changed".',
      'hasOwnProperty checks only own properties (false); `in` walks the prototype chain (true).',
    ],
    misconceptions: [
      'Assigning to an inherited property does not modify the prototype — it creates an own property on the instance.',
      'Instances do not copy prototype values at construction time; lookups are live.',
    ],
    followUp: {
      question: 'What happens if the prototype holds an array and you do cat.list.push(x)?',
      answer:
        'push mutates the shared array found on the prototype (no assignment happens, so no shadowing), so every instance sees the new element — a classic bug with mutable data on prototypes.',
    },
    docSourceIds: ['mdn-prototype'],
  },
  {
    schemaVersion: 1,
    kind: 'output',
    execution: 'output',
    track: 'output',
    id: 'out-finally-return',
    slug: 'finally-return',
    title: 'return inside try/finally',
    difficulty: 'medium',
    priority: 'P1',
    seniority: ['Senior', 'SDE-2', 'SDE-3'],
    topics: ['try/catch/finally', 'return', 'completion values'],
    estimatedMinutes: 3,
    conceptIds: ['exceptions-finally'],
    research: research(
      [
        bfe('88. try...catch', 'https://bigfrontend.dev/quiz/try-catch'),
        bfe('120. try..catch..finally', 'https://bigfrontend.dev/quiz/try-catch-finally'),
      ],
      'BFE.dev has three try/catch/finally quizzes. Behaviour is documented on MDN try...catch ("The finally block" — a return in finally overrides the try/catch completion).',
    ),
    environment: 'node',
    prompt: NODE_PROMPT,
    code: `function a() {
  try { return 'try'; } finally { console.log('a finally'); }
}
function b() {
  try { return 'try'; } finally { return 'finally'; }
}
function c() {
  try { throw new Error('boom'); }
  catch (e) { return 'catch ' + e.message; }
  finally { console.log('c finally'); }
}
function d() {
  let x = 1;
  try { return x; } finally { x = 2; }
}
console.log(a());
console.log(b());
console.log(c());
console.log(d());`,
    expectedOutput: ['a finally', 'try', 'finally', 'c finally', 'catch boom', '1'],
    steps: [
      'a(): `return "try"` evaluates the value, then the finally block runs before the function actually returns — so "a finally" prints before the outer console.log prints "try".',
      'b(): a return inside finally overrides the pending return from try → "finally".',
      'c(): the throw is caught, catch prepares the return value "catch boom", finally logs "c finally", then the value is returned and logged.',
      'd(): the return value (1) was already evaluated when finally reassigns x, so changing x does not change what is returned → 1.',
    ],
    misconceptions: [
      'finally does not run after the caller receives the value — it runs before the function completes.',
      'Mutating a primitive variable in finally does not change an already-computed return value (mutating an object that is returned would be visible, though).',
      'A return in finally silently discards both pending returns and thrown errors.',
    ],
    followUp: {
      question: 'What does `function e() { try { throw new Error("x"); } finally { return "ok"; } }` return?',
      answer: '"ok" — the return in finally replaces the throw completion, so the error is swallowed. Linters flag this (no-unsafe-finally).',
    },
    docSourceIds: ['mdn-try-catch'],
  },
  {
    schemaVersion: 1,
    kind: 'output',
    execution: 'output',
    track: 'output',
    id: 'out-event-bubbling-order',
    slug: 'event-bubbling-order',
    title: 'Capture, target and bubble order',
    difficulty: 'medium',
    priority: 'P0',
    seniority: ['Senior', 'SDE-2', 'SDE-3'],
    topics: ['DOM events', 'capturing', 'bubbling', 'stopPropagation'],
    estimatedMinutes: 4,
    conceptIds: ['event-propagation'],
    research: research(
      [
        doc('mdn-event-bubbling', 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Event_bubbling', 'Event bubbling'),
        doc('mdn-stoppropagation', 'https://developer.mozilla.org/en-US/docs/Web/API/Event/stopPropagation', 'Event: stopPropagation() method'),
      ],
      'Event propagation order is a frequent DOM interview topic but no BFE.dev quiz covers it; behaviour documented on MDN and verified in jsdom.',
    ),
    environment: 'jsdom',
    prompt: 'Browser DOM (document.body starts empty). What is printed, in order?',
    code: `const outer = document.createElement('div');
const inner = document.createElement('button');
outer.appendChild(inner);
document.body.appendChild(outer);
const body = document.body;
body.addEventListener('click', (e) => console.log('body bubble ' + e.target.tagName));
body.addEventListener('click', () => console.log('body capture'), { capture: true });
outer.addEventListener('click', () => console.log('outer bubble'));
outer.addEventListener('click', () => console.log('outer capture'), true);
inner.addEventListener('click', () => console.log('inner capture'), true);
inner.addEventListener('click', () => console.log('inner bubble'));
inner.click();
console.log('--');
outer.addEventListener('click', (e) => e.stopPropagation());
inner.click();`,
    expectedOutput: [
      'body capture',
      'outer capture',
      'inner capture',
      'inner bubble',
      'outer bubble',
      'body bubble BUTTON',
      '--',
      'body capture',
      'outer capture',
      'inner capture',
      'inner bubble',
      'outer bubble',
    ],
    steps: [
      'An event dispatch has three phases: capture (window → … → parent of target), target, and bubble (parent of target → … → window).',
      'Capture phase: listeners registered with capture: true run from the outermost ancestor inward — "body capture", then "outer capture". Registration order across elements does not matter, only tree position.',
      'Target phase on the button: "inner capture" then "inner bubble" (they were registered in that order).',
      'Bubble phase: non-capturing listeners run from the target\'s parent outward — "outer bubble", then "body bubble BUTTON" (e.target is still the button).',
      'click() dispatches synchronously, so "--" prints only after the whole first dispatch.',
      'The second click is identical until outer\'s bubble listeners: both run (stopPropagation does not stop other listeners on the same element), but propagation stops there, so body\'s bubble listener never runs.',
    ],
    misconceptions: [
      'Capturing listeners on ancestors run before any listener on the target, even if they were added later.',
      'stopPropagation() does not cancel remaining listeners on the current element — that is stopImmediatePropagation().',
      'element.click() is not asynchronous; listeners run before click() returns.',
    ],
    followUp: {
      question: 'How does React\'s event system relate to this order?',
      answer:
        'React 17+ attaches one listener per event type to the root container (in both capture and bubble phases) and simulates propagation through the component tree, so onClickCapture/onClick follow the same order relative to each other, while native listeners on ancestors above the root run around them.',
    },
    docSourceIds: ['mdn-event-bubbling', 'mdn-stoppropagation'],
  },
  {
    schemaVersion: 1,
    kind: 'output',
    execution: 'output',
    track: 'output',
    id: 'out-react-batching',
    slug: 'react-batching',
    title: 'State snapshots and batching in a handler',
    difficulty: 'medium',
    priority: 'P0',
    seniority: ['Senior', 'SDE-2', 'SDE-3'],
    topics: ['React', 'useState', 'batching', 'state snapshot'],
    estimatedMinutes: 3,
    conceptIds: ['react-state-batching'],
    research: research(
      [doc('react-queueing', 'https://react.dev/learn/queueing-a-series-of-state-updates', 'Queueing a Series of State Updates')],
      'No BFE.dev React output quiz found; behaviour documented on react.dev and verified with React 18.3.1 in jsdom.',
    ),
    environment: 'react-jsdom',
    prompt: REACT_PROMPT,
    code: `function Counter() {
  const [count, setCount] = React.useState(0);
  console.log('render ' + count);
  const onClick = () => {
    setCount(count + 1);
    setCount(count + 1);
    setCount(count + 1);
    console.log('handler sees ' + count);
  };
  return React.createElement('button', { onClick }, count);
}
const container = document.createElement('div');
const root = createRoot(container);
act(() => root.render(React.createElement(Counter)));
act(() => container.querySelector('button').click());
console.log('text ' + container.textContent);`,
    expectedOutput: ['render 0', 'handler sees 0', 'render 1', 'text 1'],
    steps: [
      'The first act() mounts Counter: "render 0".',
      'The click runs onClick with the count from that render\'s snapshot, which is 0. Each setCount(count + 1) queues "replace with 1".',
      'setState does not update the local variable or re-render synchronously, so the handler logs "handler sees 0".',
      'React batches the three updates into a single re-render after the handler; applying "replace with 1" three times gives 1 → "render 1".',
      'The button text is now "1".',
    ],
    misconceptions: [
      'Three setCount(count + 1) calls do not add 3 — each uses the same snapshot value.',
      'setState is not synchronous: the variable inside the current handler never changes.',
      'Batching does not cause three renders; React 18 renders once per event (and also batches in timeouts and promises with createRoot).',
    ],
    followUp: {
      question: 'How do you make the handler add 3?',
      answer: 'Use updater functions: setCount(c => c + 1) three times. Each updater receives the result of the previous one in the queue.',
    },
    docSourceIds: ['react-queueing'],
  },
  {
    schemaVersion: 1,
    kind: 'output',
    execution: 'output',
    track: 'output',
    id: 'out-react-functional-update',
    slug: 'react-functional-update',
    title: 'Mixing updater functions and values',
    difficulty: 'medium',
    priority: 'P1',
    seniority: ['Senior', 'SDE-2', 'SDE-3'],
    topics: ['React', 'useState', 'updater function', 'update queue'],
    estimatedMinutes: 3,
    conceptIds: ['react-state-batching'],
    research: research(
      [doc('react-queueing', 'https://react.dev/learn/queueing-a-series-of-state-updates', 'Queueing a Series of State Updates')],
      'No BFE.dev React output quiz found; react.dev "Queueing a Series of State Updates" walks through the same queue-processing rules. Verified with React 18.3.1.',
    ),
    environment: 'react-jsdom',
    prompt: REACT_PROMPT,
    code: `function Counter() {
  const [count, setCount] = React.useState(0);
  console.log('render ' + count);
  const onClick = () => {
    setCount((c) => c + 1);
    setCount((c) => c + 1);
    setCount(count + 5);
    setCount((c) => c * 2);
  };
  return React.createElement('button', { onClick }, count);
}
const container = document.createElement('div');
const root = createRoot(container);
act(() => root.render(React.createElement(Counter)));
act(() => container.querySelector('button').click());
console.log('text ' + container.textContent);`,
    expectedOutput: ['render 0', 'render 10', 'text 10'],
    steps: [
      'Mount: "render 0".',
      'The handler queues four updates; nothing re-renders until the handler returns.',
      'During the next render React processes the queue in order starting from 0: c => c + 1 gives 1, c => c + 1 gives 2.',
      'setCount(count + 5) is a plain value computed from the snapshot (0 + 5), so it replaces the state with 5 — discarding the previous 2.',
      'c => c * 2 receives 5 and produces 10. One render: "render 10", and the text is "10".',
    ],
    misconceptions: [
      'A plain value does not add to the queued result — it replaces it.',
      'Updater functions do not run immediately in the handler; they run during the next render, in queue order.',
    ],
    followUp: {
      question: 'Should updater functions have side effects?',
      answer: 'No. They must be pure: React may call them more than once (StrictMode calls them twice in development) and during rendering.',
    },
    docSourceIds: ['react-queueing'],
  },
  {
    schemaVersion: 1,
    kind: 'output',
    execution: 'output',
    track: 'output',
    id: 'out-react-effect-order',
    slug: 'react-effect-order',
    title: 'Effect and cleanup order across parent and child',
    difficulty: 'hard',
    priority: 'P1',
    seniority: ['SDE-2', 'SDE-3', 'MTS'],
    topics: ['React', 'useEffect', 'cleanup', 'render vs. commit'],
    estimatedMinutes: 5,
    conceptIds: ['react-effects'],
    research: research(
      [
        doc('react-sync-effects', 'https://react.dev/learn/synchronizing-with-effects', 'Synchronizing with Effects'),
        doc('react-useeffect', 'https://react.dev/reference/react/useEffect', 'useEffect'),
      ],
      'No BFE.dev React output quiz found; react.dev documents that cleanups run before the next effect and on unmount. The exact parent/child ordering below was verified by executing React 18.3.1 in jsdom.',
    ),
    environment: 'react-jsdom',
    prompt: REACT_PROMPT,
    code: `function Child({ n }) {
  console.log('render child ' + n);
  React.useEffect(() => {
    console.log('child effect ' + n);
    return () => console.log('child cleanup ' + n);
  }, [n]);
  return null;
}
function Parent({ n }) {
  console.log('render parent ' + n);
  React.useEffect(() => {
    console.log('parent effect ' + n);
    return () => console.log('parent cleanup ' + n);
  }, [n]);
  return React.createElement(Child, { n });
}
const root = createRoot(document.createElement('div'));
act(() => root.render(React.createElement(Parent, { n: 1 })));
act(() => root.render(React.createElement(Parent, { n: 2 })));
act(() => root.unmount());`,
    expectedOutput: [
      'render parent 1',
      'render child 1',
      'child effect 1',
      'parent effect 1',
      'render parent 2',
      'render child 2',
      'child cleanup 1',
      'parent cleanup 1',
      'child effect 2',
      'parent effect 2',
      'parent cleanup 2',
      'child cleanup 2',
    ],
    steps: [
      'Rendering goes top-down: parent renders, then child.',
      'After the commit, effects run bottom-up (children before parents), because React completes the child fiber before the parent: "child effect 1", "parent effect 1".',
      'On the update both components re-render top-down again.',
      'Since n changed, both effects must re-run. React first runs all the cleanups from the previous render (child first, then parent), and only then all the new effects (child first, then parent).',
      'On unmount there is no next effect; React runs the remaining cleanups while walking the deleted tree from the top, so the parent\'s cleanup runs before the child\'s.',
    ],
    misconceptions: [
      'The parent\'s effect does not run before the child\'s — on mount and update, child effects run first.',
      'Cleanup and setup are not interleaved per component: all cleanups for the commit run before any new setup.',
      'Unmount cleanup order is not the same as mount order: in React 18 the deleted subtree is cleaned up parent-first.',
    ],
    followUp: {
      question: 'What changes under <StrictMode> in development?',
      answer:
        'On mount React simulates an extra unmount/remount: components render twice and every effect runs setup → cleanup → setup, to surface missing cleanups. Production behaviour is unchanged.',
    },
    docSourceIds: ['react-sync-effects', 'react-useeffect'],
  },
  {
    schemaVersion: 1,
    kind: 'output',
    execution: 'output',
    track: 'output',
    id: 'out-react-key-reset',
    slug: 'react-key-reset',
    title: 'Keys and component identity',
    difficulty: 'medium',
    priority: 'P1',
    seniority: ['Senior', 'SDE-2', 'SDE-3'],
    topics: ['React', 'key', 'reconciliation', 'state reset'],
    estimatedMinutes: 4,
    conceptIds: ['react-reconciliation-keys'],
    research: research(
      [
        doc('react-preserving-state', 'https://react.dev/learn/preserving-and-resetting-state', 'Preserving and Resetting State'),
        doc('react-rendering-lists', 'https://react.dev/learn/rendering-lists', 'Rendering Lists'),
      ],
      'No BFE.dev React output quiz found; react.dev documents that the same component at the same position keeps state and that changing key resets it. Verified with React 18.3.1.',
    ),
    environment: 'react-jsdom',
    prompt: REACT_PROMPT,
    code: `let created = 0;
function Draft({ user }) {
  const [id] = React.useState(() => ++created);
  console.log(user + ' uses draft #' + id);
  return null;
}
const root = createRoot(document.createElement('div'));
const show = (el) => act(() => root.render(el));
show(React.createElement(Draft, { user: 'ana' }));
show(React.createElement(Draft, { user: 'ben' }));
show(React.createElement(Draft, { user: 'ben', key: 'ben' }));
show(React.createElement(Draft, { user: 'cy', key: 'cy' }));
show(React.createElement(Draft, { user: 'cy', key: 'cy' }));`,
    expectedOutput: ['ana uses draft #1', 'ben uses draft #1', 'ben uses draft #2', 'cy uses draft #3', 'cy uses draft #3'],
    steps: [
      'The lazy initializer passed to useState runs only when a component instance is created (mount), so `created` counts instances.',
      'First render mounts Draft → instance #1.',
      'Rendering Draft with a different prop at the same position and with the same (absent) key reuses the instance: state is preserved, still #1 for "ben".',
      'Adding key="ben" changes the element\'s identity (null key → "ben"), so React unmounts the old instance and mounts a new one → #2.',
      'Changing the key to "cy" again remounts → #3.',
      'Rendering with the same key "cy" keeps the instance → still #3.',
    ],
    misconceptions: [
      'Changing props does not reset state; only a change of component type, position or key does.',
      'Going from no key to a key is still a key change and remounts the component.',
      'Keys are not only for lists — a key on a single element is the idiomatic way to reset its state.',
    ],
    followUp: {
      question: 'Why is using the array index as key risky for a list of inputs?',
      answer:
        'When items are inserted or reordered, the index stays with the position, not the item, so React keeps the old instance (and its uncontrolled input state) attached to a different item. Use a stable id.',
    },
    docSourceIds: ['react-preserving-state', 'react-rendering-lists'],
  },
];
