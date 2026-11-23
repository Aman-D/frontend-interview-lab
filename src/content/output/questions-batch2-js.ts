import type { OutputQuestion, Research } from '../schema';

/**
 * Track 5 — output prediction, batch 2 (JavaScript, Node environment). Every snippet is original;
 * BFE.dev quiz titles are cited only as evidence that the topic appears in practice material.
 * Every `expectedOutput` was produced by running the snippet and is re-verified by executing
 * `code` in `questions-batch2-js.test.ts`.
 */

const LAST_VERIFIED = '2026-11-23';

type Ev = {
  sourceId: string;
  url: string;
  originalTitle: string;
  note?: string;
};

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

export const OUTPUT_QUESTIONS_BATCH2_JS: OutputQuestion[] = [
  {
    schemaVersion: 1,
    kind: 'output',
    execution: 'output',
    track: 'output',
    id: 'out-generator-two-way-next',
    slug: 'generator-two-way-next',
    title: 'Two-way generators: what next(value) feeds back',
    difficulty: 'medium',
    priority: 'P1',
    seniority: ['Senior', 'SDE-2', 'SDE-3'],
    topics: ['generators', 'iteration protocol', 'yield'],
    estimatedMinutes: 4,
    conceptIds: ['closures'],
    research: research(
      [
        bfe('71. two-way generator', 'https://bigfrontend.dev/quiz/generator-2-way'),
        bfe('110. yield', 'https://bigfrontend.dev/quiz/yield'),
      ],
      'BFE.dev lists a "two-way generator" quiz and a "yield" quiz. The sources registry has no dedicated MDN generator page; behaviour follows the generator resumption semantics and is verified by execution.',
    ),
    environment: 'node',
    prompt: NODE_PROMPT,
    code: `function* accumulator() {
  let total = 0;
  while (true) {
    const n = yield total;
    if (n === undefined) break;
    total += n;
  }
  return \`done:\${total}\`;
}
const it = accumulator();
console.log(it.next(10).value);
console.log(it.next(5).value);
console.log(it.next(7).value);
const last = it.next();
console.log(\`\${last.value} \${last.done}\`);
const after = it.next(1);
console.log(\`\${after.value} \${after.done}\`);`,
    expectedOutput: ['0', '5', '12', 'done:12 true', 'undefined true'],
    steps: [
      'Calling accumulator() runs no code; it returns a suspended generator object.',
      'The first it.next(10) starts the body, sets total = 0 and pauses at `yield total`, producing 0. The argument 10 is discarded: there is no paused yield yet to receive it.',
      'it.next(5) resumes the paused yield, which now evaluates to 5; total becomes 5 and the loop yields 5.',
      'it.next(7) resumes with 7 → total 12 → yields 12.',
      'it.next() resumes with undefined, the loop breaks and the function returns "done:12" — so value is "done:12" and done is true (the return value is delivered exactly once).',
      'Any later next(1) hits a completed generator: { value: undefined, done: true }; the argument is ignored.',
    ],
    misconceptions: [
      'The value passed to the first next() is not lost by accident of this code — it is always ignored, because no yield expression is waiting for it.',
      'A `return` value is visible through next() with done: true, but for...of and spread ignore it.',
      'A finished generator does not restart; it returns { value: undefined, done: true } forever.',
    ],
    followUp: {
      question: 'How would you make the first value passed by the caller count, without changing the caller?',
      answer:
        'Wrap the generator in a helper that calls next() once immediately ("priming" it) and returns the primed iterator; then the caller\'s first next(10) resumes the first yield and 10 is added. Verified: after priming, next(10).value is 10.',
    },
    docSourceIds: ['mdn-closures'],
  },
  {
    schemaVersion: 1,
    kind: 'output',
    execution: 'output',
    track: 'output',
    id: 'out-generator-return-finally',
    slug: 'generator-return-finally',
    title: 'Generator return() and a yield inside finally',
    difficulty: 'hard',
    priority: 'P2',
    seniority: ['Senior', 'SDE-3', 'MTS'],
    topics: ['generators', 'return()', 'try/finally', 'for...of'],
    estimatedMinutes: 5,
    conceptIds: ['exceptions-finally'],
    research: research(
      [
        bfe('121. Generator return()', 'https://bigfrontend.dev/quiz/generator-return'),
        bfe('119. return in Generator', 'https://bigfrontend.dev/quiz/return-in-generator'),
      ],
      'BFE.dev has "Generator return()" and two "return in Generator" quizzes. finally semantics documented on MDN try...catch; snippet adds the less-known case of a yield inside finally.',
    ),
    environment: 'node',
    prompt: NODE_PROMPT,
    code: `function* resource() {
  try {
    console.log('open');
    yield 'a';
    yield 'b';
    console.log('unreachable');
  } finally {
    console.log('cleanup');
    yield 'from finally';
  }
  console.log('after finally');
}
const g = resource();
console.log(g.next().value);
const r1 = g.return('early');
console.log(\`\${r1.value} \${r1.done}\`);
const r2 = g.next();
console.log(\`\${r2.value} \${r2.done}\`);
for (const x of resource()) {
  console.log(\`loop \${x}\`);
  break;
}`,
    expectedOutput: ['open', 'a', 'cleanup', 'from finally false', 'early true', 'open', 'loop a', 'cleanup'],
    steps: [
      'g.next() starts the body: logs "open" and pauses at `yield \'a\'` → logs a.',
      'g.return(\'early\') injects a return completion at the paused yield. The finally block runs first and logs "cleanup".',
      'The finally block itself contains a yield, so the generator pauses again: return() resolves to { value: "from finally", done: false } — the pending return is postponed, not cancelled.',
      'The next g.next() finishes the finally block, and the postponed return completes: { value: "early", done: true }. "unreachable" and "after finally" never run.',
      'for...of on a fresh generator logs "open", then "loop a". `break` calls the iterator\'s return() automatically, so finally runs and logs "cleanup".',
      'for...of ignores whatever that return() call produced (even the extra yield) — the loop is over, so nothing else prints.',
    ],
    misconceptions: [
      'return() does not skip finally blocks — it behaves like a return statement at the paused yield.',
      'A yield inside finally makes return() report done: false; the generator is not finished yet.',
      'break / early exit in for...of is how resources held by generators get cleaned up; it is not silent.',
    ],
    followUp: {
      question: 'What does g.throw(new Error("x")) do on a generator paused inside try with a catch block?',
      answer:
        "The error is thrown at the paused yield, so the generator's own catch handles it and execution continues to the next yield, whose value throw() returns. If the generator has no catch, the error propagates out of throw() after finally runs.",
    },
    docSourceIds: ['mdn-try-catch'],
  },
  {
    schemaVersion: 1,
    kind: 'output',
    execution: 'output',
    track: 'output',
    id: 'out-return-await-vs-return',
    slug: 'return-await-vs-return',
    title: '`return await` vs `return` inside try/finally',
    difficulty: 'hard',
    priority: 'P0',
    seniority: ['Senior', 'SDE-3', 'MTS'],
    topics: ['async/await', 'try/catch/finally', 'return await', 'microtasks'],
    estimatedMinutes: 5,
    conceptIds: ['promises', 'exceptions-finally', 'event-loop'],
    research: research(
      [
        bfe('131. return await', 'https://bigfrontend.dev/quiz/return-await'),
        bfe('50. async await', 'https://bigfrontend.dev/quiz/async-await'),
      ],
      'BFE.dev has a dedicated "return await" quiz. The snippet combines it with finally timing and with the cross-function ordering of the two results. Ordering verified by execution in Node.',
    ),
    environment: 'node',
    prompt: NODE_PROMPT,
    code: `async function withoutAwait() {
  try {
    return Promise.reject(new Error('A'));
  } catch (e) {
    return 'caught A';
  } finally {
    console.log('finally A');
  }
}
async function withAwait() {
  try {
    return await Promise.reject(new Error('B'));
  } catch (e) {
    return 'caught B';
  } finally {
    console.log('finally B');
  }
}
const report = (p) => p.then((v) => console.log(v), (e) => console.log(\`rejected \${e.message}\`));
report(withoutAwait());
report(withAwait());
console.log('sync');`,
    expectedOutput: ['finally A', 'sync', 'finally B', 'caught B', 'rejected A'],
    steps: [
      'withoutAwait(): `return Promise.reject(...)` hands the rejected promise to the async function\'s result without waiting. Leaving the try block runs finally synchronously → "finally A" prints during the call. catch never sees the rejection.',
      'withAwait(): `await` suspends inside try. Nothing from it prints yet.',
      '"sync" prints, then microtasks run.',
      'withAwait resumes one tick later with a thrown error, which its catch handles: it returns "caught B", finally logs "finally B", and the result promise fulfils with a plain string.',
      'withoutAwait\'s result promise must adopt the returned promise, which costs extra microtask ticks (a resolve-thenable job plus a then). So "caught B" prints before "rejected A", even though withoutAwait was called first.',
    ],
    misconceptions: [
      "`return promise` inside try/catch does not let catch handle that promise's rejection — only `return await promise` does.",
      'finally after a plain `return promise` runs before the promise settles, so it cannot be used to clean up after the async work.',
      'Calling one async function before another does not mean its result settles first; resolution depth decides.',
    ],
    followUp: {
      question: 'Is `return await` ever redundant?',
      answer:
        "Outside a try/catch/finally it does not change the outcome (only stack traces and timing); inside try it changes semantics, which is why linters such as typescript-eslint's return-await rule require it in try/catch.",
    },
    docSourceIds: ['mdn-try-catch', 'mdn-microtask', 'mdn-event-loop'],
  },
  {
    schemaVersion: 1,
    kind: 'output',
    execution: 'output',
    track: 'output',
    id: 'out-await-thenable-ticks',
    slug: 'await-thenable-ticks',
    title: 'Awaiting a thenable vs a native promise',
    difficulty: 'hard',
    priority: 'P1',
    seniority: ['Senior', 'SDE-3', 'MTS'],
    topics: ['async/await', 'thenables', 'microtasks'],
    estimatedMinutes: 5,
    conceptIds: ['event-loop', 'promises'],
    research: research(
      [
        bfe('47. Promise Order II', 'https://bigfrontend.dev/quiz/promise-order-II'),
        bfe('103. Promise Order III', 'https://bigfrontend.dev/quiz/Promise-Order-III'),
      ],
      'BFE.dev has several "Promise order" quizzes; this one targets the extra tick of thenable assimilation, which the first batch did not cover. Verified by execution in Node.',
    ),
    environment: 'node',
    prompt: NODE_PROMPT,
    code: `const thenable = {
  then(resolve) {
    console.log('then called');
    resolve('T');
  },
};
async function a() {
  const v = await thenable;
  console.log(\`a \${v}\`);
}
async function b() {
  const v = await Promise.resolve('P');
  console.log(\`b \${v}\`);
}
a();
b();
Promise.resolve()
  .then(() => console.log('tick 1'))
  .then(() => console.log('tick 2'))
  .then(() => console.log('tick 3'));
console.log('sync');`,
    expectedOutput: ['sync', 'then called', 'b P', 'tick 1', 'a T', 'tick 2', 'tick 3'],
    steps: [
      'a() runs to `await thenable`. A plain object is not a native promise, so await wraps it in a new promise and schedules a job that will call thenable.then(...). Microtask queue: [call then].',
      'b() runs to `await Promise.resolve("P")`. A native promise is awaited directly: its continuation is queued once it is fulfilled — and it already is. Queue: [call then, resume b].',
      'The chain queues "tick 1" (Promise.resolve() is already fulfilled). Queue: [call then, resume b, tick 1]. Then "sync" prints.',
      'Job 1 calls the thenable\'s then → logs "then called" and resolves the wrapper with "T", which queues "resume a" at the back.',
      '"resume b" → "b P"; "tick 1" runs and queues "tick 2"; "resume a" → "a T"; then "tick 2" and "tick 3".',
    ],
    misconceptions: [
      "A thenable's then method is not called synchronously by await — it runs in its own microtask.",
      'await on a thenable costs one extra tick compared to awaiting a native promise, so a later-started await can finish first.',
    ],
    followUp: {
      question: "What if the thenable's then method never calls resolve?",
      answer:
        'The await never resumes: the async function stays suspended forever (no error, no timeout). This is a real hazard with hand-rolled thenables or mocks.',
    },
    docSourceIds: ['mdn-microtask', 'mdn-event-loop'],
  },
  {
    schemaVersion: 1,
    kind: 'output',
    execution: 'output',
    track: 'output',
    id: 'out-race-allsettled-shape',
    slug: 'race-allsettled-shape',
    title: 'Promise.race and Promise.allSettled: who wins and what shape',
    difficulty: 'medium',
    priority: 'P1',
    seniority: ['Senior', 'SDE-2', 'SDE-3'],
    topics: ['Promise.race', 'Promise.allSettled', 'promise combinators'],
    estimatedMinutes: 4,
    conceptIds: ['promise-combinators', 'promises'],
    research: research(
      [
        doc(
          'mdn-promise-all',
          'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all',
          'Promise.all()',
        ),
      ],
      'BFE.dev quizzes cover Promise.all but no race/allSettled quiz was found in the listing; combinator semantics are documented on MDN (the Promise.all page links its siblings). Verified by execution.',
    ),
    environment: 'node',
    prompt: NODE_PROMPT,
    code: `const delay = (ms, v, fail) =>
  new Promise((res, rej) => setTimeout(() => (fail ? rej(new Error(v)) : res(v)), ms));

Promise.race([delay(20, 'slow'), delay(10, 'fast-fail', true), 'plain']).then(
  (v) => console.log(\`race \${v}\`),
  (e) => console.log(\`race error \${e.message}\`),
);
Promise.race([delay(20, 'slow'), delay(10, 'fast-fail', true)]).catch((e) =>
  console.log(\`race2 error \${e.message}\`),
);
Promise.race([]).then(() => console.log('empty race settled'));
Promise.allSettled([delay(20, 'x'), delay(5, 'y', true), 42]).then((results) => {
  for (const r of results) {
    console.log(r.status === 'fulfilled' ? \`ok \${r.value}\` : \`fail \${r.reason.message}\`);
  }
  console.log(Object.keys(results[1]).join(','));
});`,
    expectedOutput: ['race plain', 'race2 error fast-fail', 'ok x', 'fail y', 'ok 42', 'status,reason'],
    steps: [
      'Race 1 includes the plain value "plain". Non-promises are wrapped with Promise.resolve, which is already fulfilled, so it wins in the first microtask turn → "race plain". The later rejection is ignored.',
      'Race 2 has only timers: the 10 ms rejection settles first, so the race rejects → "race2 error fast-fail" at ~10 ms, even though the other entry would have fulfilled.',
      'Promise.race([]) never settles — nothing prints for it.',
      'allSettled waits for every input (the slowest is 20 ms) and never rejects. Results are in input order, not settlement order: ok x, fail y, ok 42.',
      'Each result is an object with status plus either value or reason — the rejected entry\'s keys are "status,reason".',
    ],
    misconceptions: [
      'race does not mean "first to fulfil" — the first to settle wins, rejections included (Promise.any is first-to-fulfil).',
      'allSettled results are not ordered by completion time.',
      'Promise.race([]) does not resolve to undefined; it stays pending forever.',
    ],
    followUp: {
      question: 'How would you build a timeout with Promise.race, and what leaks if you do it naively?',
      answer:
        'Race the work against a promise that rejects after N ms. The naive version leaves the timer running after the work wins (clear it in finally) and does not cancel the losing work — pass an AbortSignal for real cancellation.',
    },
    docSourceIds: ['mdn-promise-all', 'mdn-settimeout'],
  },
  {
    schemaVersion: 1,
    kind: 'output',
    execution: 'output',
    track: 'output',
    id: 'out-promise-finally-override',
    slug: 'promise-finally-override',
    title: 'Promise finally(): pass-through vs override',
    difficulty: 'hard',
    priority: 'P1',
    seniority: ['Senior', 'SDE-3', 'MTS'],
    topics: ['Promise.prototype.finally', 'microtasks', 'error handling'],
    estimatedMinutes: 5,
    conceptIds: ['promises', 'exceptions-finally'],
    research: research(
      [bfe('36. Promise.prototype.finally()', 'https://bigfrontend.dev/quiz/Promise-prototype-finally')],
      'BFE.dev has a Promise.prototype.finally quiz. This snippet adds the override rules and the tick cost of the pass-through. Ordering verified by execution in Node.',
    ),
    environment: 'node',
    prompt: NODE_PROMPT,
    code: `Promise.resolve('value')
  .finally(() => 'ignored')
  .then((v) => console.log(\`1 \${v}\`));
Promise.reject(new Error('orig'))
  .finally(() => console.log('cleanup runs'))
  .catch((e) => console.log(\`2 \${e.message}\`));
Promise.resolve('kept')
  .finally(() => {
    throw new Error('override');
  })
  .then((v) => console.log(\`3 \${v}\`), (e) => console.log(\`3 \${e.message}\`));
Promise.reject(new Error('first'))
  .finally(() => Promise.reject(new Error('second')))
  .catch((e) => console.log(\`4 \${e.message}\`));
Promise.resolve('slow')
  .finally(() => new Promise((r) => setTimeout(() => {
    console.log('waited');
    r('x');
  }, 10)))
  .then((v) => console.log(\`5 \${v}\`));`,
    expectedOutput: ['cleanup runs', '3 override', '1 value', '2 orig', '4 second', 'waited', '5 slow'],
    steps: [
      'All five chains start on already-settled promises, so the five finally callbacks run in the first microtask turn, in order. Only chain 2\'s callback logs: "cleanup runs".',
      'Chain 3\'s callback throws synchronously, so its finally promise rejects immediately with "override" and the next handler runs on the following tick → "3 override" first.',
      'Chains 1, 2 and 4 returned normally (a value, undefined, a promise). finally must wait on that return value and then re-deliver the original outcome, which costs extra ticks → "1 value", then "2 orig".',
      'Chain 4\'s callback returned a rejected promise, which replaces the original rejection → "4 second".',
      'Chain 5\'s callback returned a promise that settles after 10 ms; finally waits for it → "waited", then the original value passes through → "5 slow" (not "x").',
    ],
    misconceptions: [
      'The return value of a finally callback never replaces the value — "ignored" and "x" are discarded.',
      'A finally callback CAN change the outcome, but only by throwing or returning a rejected promise.',
      'finally is not "free": the pass-through path takes more ticks than a then, which reorders logs across chains.',
    ],
    followUp: {
      question: 'Does the finally callback receive the value or the error?',
      answer:
        'No — it is called with no arguments, by design: it is for cleanup that should not depend on the outcome. Verified: arguments.length inside a finally callback is 0.',
    },
    docSourceIds: ['mdn-microtask', 'mdn-try-catch'],
  },
  {
    schemaVersion: 1,
    kind: 'output',
    execution: 'output',
    track: 'output',
    id: 'out-nested-timers-microtasks',
    slug: 'nested-timers-microtasks',
    title: 'Timers scheduled from timers and from microtasks',
    difficulty: 'hard',
    priority: 'P0',
    seniority: ['Senior', 'SDE-3', 'MTS'],
    topics: ['event loop', 'setTimeout', 'microtasks', 'task queue'],
    estimatedMinutes: 5,
    conceptIds: ['event-loop'],
    research: research(
      [
        bfe('81. setTimeout II', 'https://bigfrontend.dev/quiz/setTimeout-2'),
        bfe('86. setTimeout III', 'https://bigfrontend.dev/quiz/setTimeout-III'),
        bfe('128. setTimeout IV', 'https://bigfrontend.dev/quiz/settimeout-iv'),
      ],
      'BFE.dev has four setTimeout quizzes. This one focuses on where newly created timers land relative to existing ones. Verified by execution in Node (timers with the same delay fire in creation order; browsers behave the same for this snippet).',
    ),
    environment: 'node',
    prompt: NODE_PROMPT,
    code: `setTimeout(() => {
  console.log('T1');
  Promise.resolve().then(() => {
    console.log('T1 micro');
    setTimeout(() => console.log('T1 micro -> timer'), 0);
  });
  setTimeout(() => console.log('T1 -> timer'), 0);
}, 0);
setTimeout(() => {
  console.log('T2');
  Promise.resolve()
    .then(() => console.log('T2 micro 1'))
    .then(() => console.log('T2 micro 2'));
}, 0);
Promise.resolve().then(() => {
  setTimeout(() => console.log('micro -> timer'), 0);
});
console.log('sync');`,
    expectedOutput: [
      'sync',
      'T1',
      'T1 micro',
      'T2',
      'T2 micro 1',
      'T2 micro 2',
      'micro -> timer',
      'T1 -> timer',
      'T1 micro -> timer',
    ],
    steps: [
      'Script: queues timers T1 and T2, queues a microtask, logs "sync".',
      'Microtask checkpoint: the microtask schedules timer "micro -> timer". Timer order is now T1, T2, micro -> timer.',
      'T1 runs: logs "T1", queues a microtask, schedules "T1 -> timer" (4th). Before T2 runs, microtasks drain: "T1 micro" logs and schedules "T1 micro -> timer" (5th).',
      'T2 runs: logs "T2"; its whole promise chain drains before the next timer → "T2 micro 1", "T2 micro 2".',
      'Remaining timers fire in creation order: "micro -> timer", "T1 -> timer", "T1 micro -> timer".',
    ],
    misconceptions: [
      'A timer created inside a timer callback does not run before already-queued timers.',
      'A multi-step promise chain started in a timer completes entirely before the next timer — microtasks drain after every task.',
      'Scheduling a timer from a microtask does not make it "earlier" than the timer that created that microtask\'s task.',
    ],
    followUp: {
      question:
        'Inside T2, if queueMicrotask(() => console.log("Q")) were added right after the promise chain, where would "Q" print?',
      answer:
        'Between "T2 micro 1" and "T2 micro 2". The first then callback and Q are both queued while T2 runs; "T2 micro 2" is only queued once "T2 micro 1" has run, so it lands behind Q. Verified by execution.',
    },
    docSourceIds: ['mdn-event-loop', 'mdn-microtask', 'mdn-settimeout'],
  },
  {
    schemaVersion: 1,
    kind: 'output',
    execution: 'output',
    track: 'output',
    id: 'out-proxy-reflect-traps',
    slug: 'proxy-reflect-traps',
    title: 'Proxy get/set/has traps with Reflect',
    difficulty: 'medium',
    priority: 'P1',
    seniority: ['Senior', 'SDE-2', 'SDE-3'],
    topics: ['Proxy', 'Reflect', 'metaprogramming'],
    estimatedMinutes: 4,
    conceptIds: ['prototype-chain', 'referential-equality'],
    research: research(
      [
        bfe('80. Proxy I', 'https://bigfrontend.dev/quiz/proxy-i'),
        bfe('82. Proxy II', 'https://bigfrontend.dev/quiz/Proxy-II'),
      ],
      'BFE.dev has two Proxy quizzes. The sources registry has no MDN Proxy page; the prototype-chain page covers the receiver/lookup model Reflect.get relies on. Verified by execution (classic, non-strict script).',
    ),
    environment: 'node',
    prompt: NODE_PROMPT,
    code: `const target = { name: 'ada', _secret: 42 };
const reads = [];
const p = new Proxy(target, {
  get(t, key, receiver) {
    if (typeof key === 'string' && key.startsWith('_')) return undefined;
    reads.push(String(key));
    return Reflect.get(t, key, receiver);
  },
  set(t, key, value, receiver) {
    if (key === 'age' && typeof value !== 'number') return false;
    return Reflect.set(t, key, value, receiver);
  },
  has(t, key) {
    return !String(key).startsWith('_') && Reflect.has(t, key);
  },
});
console.log(p._secret);
console.log(\`\${'_secret' in p} \${'_secret' in target}\`);
p.age = 'old';
console.log(p.age);
p.age = 36;
console.log(\`\${target.age} \${p === target}\`);
console.log(reads.join('|'));`,
    expectedOutput: ['undefined', 'false true', 'undefined', '36 false', 'age'],
    steps: [
      'p._secret goes through the get trap, which hides underscore keys → undefined (and nothing is recorded).',
      '`in` uses the has trap, not get: the proxy reports false while the target itself still has the key → "false true".',
      'p.age = "old": the set trap returns false. In sloppy-mode scripts a false return is silently ignored (strict mode would throw a TypeError), so nothing is stored.',
      'console.log(p.age) goes through get, records "age", and the target has no age → undefined.',
      'p.age = 36 passes validation; Reflect.set writes to the target. target.age is read directly (no trap) → 36. A proxy is a distinct object, so p === target is false.',
      'Only one read was recorded: "age".',
    ],
    misconceptions: [
      'The `in` operator does not call the get trap — each operation has its own trap (has, ownKeys, deleteProperty...).',
      'Returning false from set does not always throw; it throws only in strict-mode code.',
      'Reading the target directly bypasses every trap; a proxy only guards access that goes through it.',
    ],
    followUp: {
      question: 'Why pass `receiver` to Reflect.get instead of returning t[key]?',
      answer:
        'If the property is a getter (possibly inherited), Reflect.get(t, key, receiver) runs it with `this` = the proxy, so property reads inside the getter also go through the traps; t[key] would run it with `this` = the raw target.',
    },
    docSourceIds: ['mdn-prototype'],
  },
  {
    schemaVersion: 1,
    kind: 'output',
    execution: 'output',
    track: 'output',
    id: 'out-inherited-setter-assignment',
    slug: 'inherited-setter-assignment',
    title: 'Assignment hits an inherited setter',
    difficulty: 'medium',
    priority: 'P1',
    seniority: ['Senior', 'SDE-2', 'SDE-3'],
    topics: ['getters/setters', 'prototype chain', 'property assignment'],
    estimatedMinutes: 4,
    conceptIds: ['prototype-chain', 'this-binding'],
    research: research(
      [
        bfe('58. inherit getter setter', 'https://bigfrontend.dev/quiz/inherit-getter-setter'),
        bfe('59. override setter', 'https://bigfrontend.dev/quiz/override-setter'),
      ],
      'BFE.dev has "inherit getter setter" and "override setter" quizzes. Assignment semantics documented on MDN (prototype chain). Verified by execution (classic script, non-strict).',
    ),
    environment: 'node',
    prompt: NODE_PROMPT,
    code: `const base = {
  _v: 1,
  get v() {
    return this._v * 10;
  },
  set v(x) {
    console.log(\`base setter \${x}\`);
    this._v = x;
  },
};
const child = Object.create(base);
child.v = 5;
console.log(\`\${child.v} \${base.v}\`);
console.log(\`\${Object.hasOwn(child, 'v')} \${Object.hasOwn(child, '_v')}\`);
const getterOnly = Object.create({
  get k() {
    return 'proto';
  },
});
getterOnly.k = 'own';
console.log(getterOnly.k);
Object.defineProperty(getterOnly, 'k', { value: 'defined' });
console.log(\`\${getterOnly.k} \${Object.keys(getterOnly).length}\`);`,
    expectedOutput: ['base setter 5', '50 10', 'false true', 'proto', 'defined 0'],
    steps: [
      'child.v = 5: assignment looks up the chain, finds an accessor named v on base, and calls its setter with this = child. "base setter 5" logs and _v = 5 is created on child — no own v is created.',
      'child.v runs the getter with this = child → 5 * 10 = 50; base.v still uses base._v = 1 → 10.',
      'child has no own v but now has its own _v → "false true".',
      'getterOnly.k = "own": an inherited getter with no setter makes the assignment fail silently in sloppy mode (TypeError in strict mode), so reading still runs the getter → "proto".',
      'Object.defineProperty bypasses the inherited accessor and creates an own data property → "defined". It defaults to enumerable: false, so Object.keys has length 0.',
    ],
    misconceptions: [
      'Assigning to an object does not always create an own property — an inherited setter (or getter-only accessor) intercepts it.',
      '`this` inside an inherited accessor is the object the property was accessed on, not the prototype.',
      'defineProperty is not the same as assignment: it ignores the prototype chain and uses false defaults for the flags.',
    ],
    followUp: {
      question: 'How does a class field `v = 1` in a subclass interact with a setter `set v()` on the parent class?',
      answer:
        'Class fields use define semantics (like Object.defineProperty), so the field creates an own data property on the instance and the parent setter is NOT called — a common bug when migrating from constructor assignments.',
    },
    docSourceIds: ['mdn-prototype', 'mdn-this'],
  },
  {
    schemaVersion: 1,
    kind: 'output',
    execution: 'output',
    track: 'output',
    id: 'out-define-property-flags',
    slug: 'define-property-flags',
    title: 'Non-writable and non-enumerable properties',
    difficulty: 'medium',
    priority: 'P1',
    seniority: ['Senior', 'SDE-2', 'SDE-3'],
    topics: ['Object.defineProperty', 'property descriptors', 'Object.keys', 'spread'],
    estimatedMinutes: 4,
    conceptIds: ['immutable-updates', 'prototype-chain'],
    research: research(
      [
        bfe('57. non-writable', 'https://bigfrontend.dev/quiz/inherit-writable-flag'),
        bfe('126. Object.keys()', 'https://bigfrontend.dev/quiz/object-keys'),
      ],
      'BFE.dev has "non-writable" and "Object.keys()" quizzes. The sources registry has no MDN defineProperty page; behaviour verified by execution (classic, non-strict script).',
    ),
    environment: 'node',
    prompt: NODE_PROMPT,
    code: `const cfg = { a: 1 };
Object.defineProperty(cfg, 'b', { value: 2 });
Object.defineProperty(cfg, 'c', { value: 3, enumerable: true });
cfg.b = 20;
cfg.c = 30;
console.log(\`\${cfg.b} \${cfg.c}\`);
console.log(Object.keys(cfg).join(','));
console.log(JSON.stringify(cfg));
console.log(\`\${'b' in cfg} \${Object.getOwnPropertyNames(cfg).join(',')}\`);
const copy = { ...cfg };
copy.c = 300;
console.log(\`\${copy.c} \${Object.keys(copy).join(',')}\`);
try {
  Object.defineProperty(cfg, 'b', { value: 99 });
} catch (e) {
  console.log(e.name);
}
delete cfg.c;
console.log(cfg.c);`,
    expectedOutput: ['2 3', 'a,c', '{"a":1,"c":3}', 'true a,b,c', '300 a,c', 'TypeError', '3'],
    steps: [
      'defineProperty defaults every omitted flag to false: b is non-writable, non-enumerable, non-configurable; c is enumerable but still non-writable and non-configurable.',
      'Both assignments fail silently (sloppy mode) → "2 3".',
      'Object.keys and JSON.stringify only see enumerable own properties → "a,c" and {"a":1,"c":3}.',
      '`in` and getOwnPropertyNames ignore enumerability → "true a,b,c".',
      'Object spread copies enumerable own properties as ordinary writable data properties, so copy.c can be changed to 300 and b is not copied → "300 a,c".',
      'Redefining non-configurable, non-writable b with a different value throws a TypeError; delete on non-configurable c fails silently → 3.',
    ],
    misconceptions: [
      'defineProperty({ value }) does not create a normal property — its flags default to false, not true.',
      'Spreading an object does not preserve descriptors; it is a way to get a writable copy (and silently drops non-enumerable props).',
      'A failed assignment or delete does not throw in sloppy mode — it only throws in strict mode or modules.',
    ],
    followUp: {
      question: 'How do you copy an object including non-enumerable properties and accessors?',
      answer:
        'Object.defineProperties(Object.create(Object.getPrototypeOf(src)), Object.getOwnPropertyDescriptors(src)) — it preserves flags, getters/setters and the prototype; spread and Object.assign do not.',
    },
    docSourceIds: ['mdn-prototype'],
  },
  {
    schemaVersion: 1,
    kind: 'output',
    execution: 'output',
    track: 'output',
    id: 'out-property-key-order',
    slug: 'property-key-order',
    title: 'Own property key order',
    difficulty: 'medium',
    priority: 'P1',
    seniority: ['Senior', 'SDE-2', 'SDE-3'],
    topics: ['object keys', 'property order', 'symbols', 'Map'],
    estimatedMinutes: 4,
    conceptIds: ['coercion-equality'],
    research: research(
      [bfe('108. property key', 'https://bigfrontend.dev/quiz/property-key')],
      'BFE.dev has a "property key" quiz. Ordering rule (array-index keys ascending, then string keys in insertion order, then symbols) is the OrdinaryOwnPropertyKeys algorithm; Map ordering documented on MDN Map. Verified by execution.',
    ),
    environment: 'node',
    prompt: NODE_PROMPT,
    code: `const obj = {};
obj.b = 1;
obj[10] = 'ten';
obj['2'] = 'two';
obj.a = 2;
obj[Symbol('s')] = 3;
obj['-1'] = 'neg';
obj['01'] = 'zero-one';
obj[1.5] = 'float';
obj[4294967295] = 'big';
obj[1] = 'one';
console.log(Object.keys(obj).join(','));
console.log(Reflect.ownKeys(obj).length);
console.log(JSON.stringify(Object.entries({ z: 0, 3: 0, y: 0, 0: 0 })));
const m = new Map([['b', 1], [10, 2], ['2', 3]]);
console.log([...m.keys()].join(','));`,
    expectedOutput: ['1,2,10,b,a,-1,01,1.5,4294967295', '10', '[["0",0],["3",0],["z",0],["y",0]]', 'b,10,2'],
    steps: [
      'Every non-symbol key is a string: obj[10] stores "10", obj[1.5] stores "1.5".',
      'Keys that are canonical array indices ("1", "2", "10") come first, in ascending numeric order, regardless of when they were added.',
      'All other string keys follow in insertion order: "b", "a", "-1", "01" (not canonical — leading zero), "1.5", and "4294967295".',
      '4294967295 is 2^32 - 1, one past the largest array index (2^32 - 2), so it is an ordinary string key and keeps its insertion position.',
      'Object.keys skips symbols; Reflect.ownKeys includes them → 9 string keys + 1 symbol = 10.',
      'Object.entries uses the same order: "0","3" first, then "z","y". A Map keeps pure insertion order and does not coerce keys: b, 10, 2.',
    ],
    misconceptions: [
      'Objects do not preserve insertion order for every key — integer-like keys are hoisted and sorted.',
      'Not every numeric-looking string is an index: "01", "-1", "1.5" and values >= 2^32 - 1 keep insertion order.',
      'Object.keys / JSON.stringify never include symbol keys.',
    ],
    followUp: {
      question: 'You need to keep user-entered IDs like "10", "2", "b" in the order they were added. What do you use?',
      answer:
        'A Map (or an array of entries). A Map preserves insertion order for every key type and does not stringify keys, whereas a plain object will reorder "2" and "10" ahead of "b".',
    },
    docSourceIds: ['mdn-map'],
  },
  {
    schemaVersion: 1,
    kind: 'output',
    execution: 'output',
    track: 'output',
    id: 'out-json-stringify-edge-cases',
    slug: 'json-stringify-edge-cases',
    title: 'JSON.stringify edge cases',
    difficulty: 'medium',
    priority: 'P0',
    seniority: ['Senior', 'SDE-2', 'SDE-3'],
    topics: ['JSON.stringify', 'toJSON', 'serialization'],
    estimatedMinutes: 5,
    conceptIds: ['coercion-equality'],
    research: research(
      [
        bfe('43. JSON.stringify()', 'https://bigfrontend.dev/quiz/json-stringify'),
        bfe('127. JSON.stringify() II', 'https://bigfrontend.dev/quiz/json-stringify-ii'),
      ],
      'BFE.dev has two JSON.stringify quizzes. The sources registry has no MDN JSON page; MDN Map and structuredClone pages document the contrast with Map/Set and structured cloning. Verified by execution.',
    ),
    environment: 'node',
    prompt: NODE_PROMPT,
    code: `const data = {
  u: undefined,
  f() {},
  s: Symbol('x'),
  n: NaN,
  inf: -Infinity,
  d: new Date(Date.UTC(2024, 0, 2)),
  arr: [undefined, () => 1, NaN, [null, [undefined]]],
  nested: {
    toJSON(key) {
      return \`toJSON(\${key})\`;
    },
  },
  zero: -0,
};
console.log(JSON.stringify(data));
console.log(\`\${JSON.stringify(undefined)} \${typeof JSON.stringify(() => {})}\`);
console.log(JSON.stringify({ a: [1, { b: 2, c: 3 }], c: 4 }, ['a', 'b']));
console.log(JSON.stringify({ map: new Map([[1, 2]]), set: new Set([1]) }));
console.log(JSON.stringify([new Date(NaN)]));`,
    expectedOutput: [
      '{"n":null,"inf":null,"d":"2024-01-02T00:00:00.000Z","arr":[null,null,null,[null,[null]]],"nested":"toJSON(nested)","zero":0}',
      'undefined undefined',
      '{"a":[1,{"b":2}]}',
      '{"map":{},"set":{}}',
      '[null]',
    ],
    steps: [
      'In objects, properties whose value is undefined, a function or a symbol are omitted entirely: u, f and s disappear.',
      'NaN and ±Infinity are not valid JSON numbers, so they become null; -0 becomes 0.',
      'Date has a toJSON method that returns its ISO string; nested.toJSON is called with its own key ("nested") and its return value is serialized.',
      'Inside arrays, undefined / functions / NaN cannot be omitted (that would shift indices), so each becomes null — at every nesting level.',
      'JSON.stringify(undefined) returns undefined (not a string), and so does stringifying a function → "undefined undefined".',
      'An array replacer is an allow-list of keys applied at every depth: a and the nested b survive, c is dropped everywhere.',
      'Map and Set have no enumerable own properties → {}. new Date(NaN).toJSON() returns null → [null].',
    ],
    misconceptions: [
      'undefined is not serialized as null in objects — the key disappears (it only becomes null inside arrays).',
      'JSON.stringify does not always return a string; for undefined, functions and symbols at the top level it returns undefined.',
      'Map/Set data is not serialized automatically; it silently becomes {}.',
    ],
    followUp: {
      question: 'How would you serialize a Map inside an object?',
      answer:
        'Use a replacer: JSON.stringify(obj, (k, v) => (v instanceof Map ? Object.fromEntries(v) : v)) — or [...v] to keep non-string keys — and a matching reviver to rebuild it. Verified: {m: new Map([["a", 1]])} becomes {"m":{"a":1}}.',
    },
    docSourceIds: ['mdn-map', 'mdn-structuredclone'],
  },
  {
    schemaVersion: 1,
    kind: 'output',
    execution: 'output',
    track: 'output',
    id: 'out-parseint-radix-map',
    slug: 'parseint-radix-map',
    title: 'parseInt, map and the radix argument',
    difficulty: 'medium',
    priority: 'P1',
    seniority: ['Senior', 'SDE-2', 'SDE-3'],
    topics: ['parseInt', 'Array.prototype.map', 'radix', 'type conversion'],
    estimatedMinutes: 4,
    conceptIds: ['coercion-equality'],
    research: research(
      [
        bfe('16. parseInt', 'https://bigfrontend.dev/quiz/parseInt'),
        bfe('77. parseInt 2', 'https://bigfrontend.dev/quiz/parseInt-2'),
        bfe('115. parseInt II', 'https://bigfrontend.dev/quiz/parseInt-II'),
      ],
      'BFE.dev has three parseInt quizzes. Snippet uses its own inputs. The sources registry has no MDN parseInt page; MDN equality page covers string-to-number conversion. Verified by execution.',
    ),
    environment: 'node',
    prompt: NODE_PROMPT,
    code: `console.log(['8', '8', '8', '8'].map(parseInt).join(','));
console.log(['0', '11', '12', '20'].map(parseInt).join(','));
console.log(['0', '11', '12', '20'].map(Number).join(','));
console.log(['0', '11', '12', '20'].map((s) => parseInt(s, 10)).join(','));
console.log(parseInt('0x1F'));
console.log(parseInt('0x1F', 10));
console.log(parseInt('12px') + parseFloat('.5em'));
console.log(parseInt(0.0000005));
console.log(parseInt('z', 36));
console.log(parseInt(''));`,
    expectedOutput: ['8,NaN,NaN,NaN', '0,NaN,1,6', '0,11,12,20', '0,11,12,20', '31', '0', '12.5', '5', '35', 'NaN'],
    steps: [
      'map calls its callback with (element, index, array), so parseInt receives the index as the radix: radix 0, 1, 2, 3.',
      'Radix 0 means "auto" (10 here). Radix 1 is invalid → NaN. "8" has no valid digit in base 2 or base 3 → NaN. So 8,NaN,NaN,NaN.',
      'Second list: "0" → 0; "11" radix 1 → NaN; "12" radix 2 parses the leading "1" and stops at "2" → 1; "20" radix 3 → 2*3 = 6.',
      'Number converts the whole string and ignores the index; an arrow fixing radix 10 also works → 0,11,12,20 twice.',
      'Without a radix, a "0x" prefix means hex → 31; with radix 10 parsing stops at "x" → 0.',
      'parseInt / parseFloat stop at the first invalid character → 12 + 0.5 = 12.5.',
      'parseInt(0.0000005) first converts the number to the string "5e-7", then parses "5" → 5. "z" in base 36 → 35. An empty string → NaN.',
    ],
    misconceptions: [
      'map(parseInt) is not the same as map(Number) — the index becomes the radix.',
      'parseInt does not "round" numbers; it stringifies them first, which breaks for exponent notation.',
      'parseInt is not strict: partially numeric strings succeed silently.',
    ],
    followUp: {
      question: 'How do Number("") and parseInt("") differ, and which would you use for validating a form field?',
      answer:
        'Number("") is 0 while parseInt("") is NaN; Number("12px") is NaN while parseInt("12px") is 12. For validation, Number (plus an explicit empty-string check) is stricter because it rejects trailing garbage.',
    },
    docSourceIds: ['mdn-equality'],
  },
  {
    schemaVersion: 1,
    kind: 'output',
    execution: 'output',
    track: 'output',
    id: 'out-sparse-array-holes',
    slug: 'sparse-array-holes',
    title: 'Sparse arrays: holes vs undefined',
    difficulty: 'medium',
    priority: 'P2',
    seniority: ['Senior', 'SDE-2', 'SDE-3'],
    topics: ['arrays', 'sparse arrays', 'forEach', 'map', 'in operator'],
    estimatedMinutes: 4,
    conceptIds: ['coercion-equality'],
    research: research(
      [bfe('55. sparse array', 'https://bigfrontend.dev/quiz/sparse-array')],
      'BFE.dev has a "sparse array" quiz. MDN Array.prototype.sort documents how empty slots are treated by array methods. Verified by execution.',
    ),
    environment: 'node',
    prompt: NODE_PROMPT,
    code: `const arr = [1, , 3];
arr[5] = 6;
console.log(arr.length);
let visits = 0;
arr.forEach(() => visits++);
console.log(visits);
const doubled = arr.map((x) => x * 2);
console.log(\`\${1 in doubled} \${doubled.length} \${doubled[1]}\`);
console.log(\`\${1 in arr} \${arr[1] === undefined}\`);
console.log(JSON.stringify(arr));
console.log(arr.join('-'));
console.log(\`\${Array.from(arr).filter((x) => x === undefined).length} \${arr.includes(undefined)} \${arr.indexOf(undefined)}\`);
console.log(Object.keys(arr).join(','));
const mapped = new Array(3).map((_, i) => i);
const filled = new Array(3).fill().map((_, i) => i);
console.log(\`\${mapped.length} \${0 in mapped} \${filled.join(',')}\`);`,
    expectedOutput: [
      '6',
      '3',
      'false 6 undefined',
      'false true',
      '[1,null,3,null,null,6]',
      '1--3---6',
      '3 true -1',
      '0,2,5',
      '3 false 0,1,2',
    ],
    steps: [
      '[1, , 3] has a hole at index 1; assigning arr[5] extends length to 6 and leaves holes at 1, 3, 4.',
      'forEach skips holes: only indices 0, 2, 5 are visited → 3.',
      'map also skips holes but preserves them in the result: index 1 is still a hole (1 in doubled is false), length is 6, reading it yields undefined.',
      'A hole is "no property": 1 in arr is false, although arr[1] reads as undefined.',
      'JSON.stringify writes holes as null; join treats them as empty strings → "1--3---6".',
      'Newer iteration-based APIs see holes as undefined: Array.from produces three real undefineds, includes(undefined) is true — but the older indexOf skips holes → -1.',
      'new Array(3).map(...) maps nothing (all holes); fill() first turns holes into real undefined values so map works → "3 false 0,1,2".',
    ],
    misconceptions: [
      'A hole is not the same as an element whose value is undefined — `in`, forEach, map and Object.keys tell them apart.',
      'includes and indexOf disagree about holes (and about NaN).',
      'new Array(n).map(fn) does not run fn n times.',
    ],
    followUp: {
      question: 'What is the idiomatic way to build [0, 1, ..., n-1]?',
      answer:
        'Array.from({ length: n }, (_, i) => i) — Array.from iterates by index and calls the mapper for every slot, so there are no holes. Verified for n = 3: 0,1,2.',
    },
    docSourceIds: ['mdn-array-sort', 'mdn-equality'],
  },
  {
    schemaVersion: 1,
    kind: 'output',
    execution: 'output',
    track: 'output',
    id: 'out-default-sort-pitfalls',
    slug: 'default-sort-pitfalls',
    title: 'Default sort and broken comparators',
    difficulty: 'medium',
    priority: 'P0',
    seniority: ['Senior', 'SDE-2', 'SDE-3'],
    topics: ['Array.prototype.sort', 'comparators', 'toSorted', 'mutation'],
    estimatedMinutes: 4,
    conceptIds: ['coercion-equality', 'immutable-updates'],
    research: research(
      [bfe('84. Array.prototype.sort()', 'https://bigfrontend.dev/quiz/Array-prototype-sort')],
      'BFE.dev has an Array.prototype.sort quiz. MDN documents the default string comparison, comparator contract, undefined/hole handling and Intl.Collator. Verified by execution in Node (V8); the boolean-comparator line is implementation-defined.',
    ),
    environment: 'node',
    prompt: NODE_PROMPT,
    code: `const nums = [10, 9, 1, 100, 25, -3];
const same = nums.sort();
console.log(nums.join(','));
console.log(same === nums);
console.log([10, 9, 1, 100, 25, -3].sort((a, b) => a > b).join(','));
console.log([10, 9, 1, 100, 25, -3].sort((a, b) => a - b).join(','));
console.log([undefined, 3, null, 1, , NaN].sort().map(String).join(','));
const base = [5, 1, 4];
const copy = base.toSorted((a, b) => a - b);
console.log(\`\${base.join(',')} \${copy.join(',')}\`);
console.log(['b', 'a', 'B', 'ä', 'A'].sort().join(','));`,
    expectedOutput: [
      '-3,1,10,100,25,9',
      'true',
      '10,9,1,100,25,-3',
      '-3,1,9,10,25,100',
      '1,3,NaN,null,undefined,',
      '5,1,4 1,4,5',
      'A,B,a,b,ä',
    ],
    steps: [
      'With no comparator, elements are converted to strings and compared by UTF-16 code units: "-3" < "1" < "10" < "100" < "25" < "9".',
      'sort mutates and returns the same array → nums is changed, and same === nums is true.',
      'A comparator returning a boolean never returns a negative number, so it is not a consistent comparator and the result is implementation-defined. In V8 this input comes back unchanged: 10,9,1,100,25,-3.',
      'a - b is the correct numeric comparator → -3,1,9,10,25,100.',
      'Default sort: undefined values go to the end (after all strings, including "NaN" and "null"), and holes after them → "1,3,NaN,null,undefined," (the trailing hole joins as empty).',
      'toSorted returns a new array and leaves the original alone → "5,1,4 1,4,5".',
      'Code-unit order puts every uppercase letter before lowercase and "ä" after "z" → A,B,a,b,ä.',
    ],
    misconceptions: [
      '[..].sort() does not sort numbers numerically.',
      'Returning true/false from a comparator "seems to work" on some inputs/engines but is not a valid comparator.',
      'sort is not pure — use toSorted (or copy first) when sorting React state or props.',
    ],
    followUp: {
      question: 'Is Array.prototype.sort stable, and why does it matter for multi-column table sorting?',
      answer:
        'Yes — stability is required since ES2019, so elements that compare equal keep their previous relative order. That lets you sort by a secondary key, then by the primary key. Verified: sorting [{k:1,a},{k:0,b},{k:1,c},{k:0,d}] by k gives b,d,a,c.',
    },
    docSourceIds: ['mdn-array-sort', 'mdn-intl-collator'],
  },
  {
    schemaVersion: 1,
    kind: 'output',
    execution: 'output',
    track: 'output',
    id: 'out-floating-point-tofixed',
    slug: 'floating-point-tofixed',
    title: 'Floating point, EPSILON and toFixed rounding',
    difficulty: 'medium',
    priority: 'P1',
    seniority: ['Senior', 'SDE-2', 'SDE-3'],
    topics: ['floating point', 'Number.EPSILON', 'toFixed', 'Math.round'],
    estimatedMinutes: 4,
    conceptIds: ['coercion-equality'],
    research: research(
      [
        doc(
          'mdn-equality',
          'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Equality',
          'Equality (==)',
        ),
      ],
      'No BFE.dev quiz in the listing clearly targets IEEE-754 rounding; the sources registry has no MDN Number page, so the closest registered official doc (numeric equality) is cited. All values verified by execution.',
    ),
    environment: 'node',
    prompt: NODE_PROMPT,
    code: `console.log(0.1 + 0.2);
console.log(0.1 + 0.2 === 0.3);
console.log(Math.abs(0.1 + 0.2 - 0.3) < Number.EPSILON);
console.log(Math.abs(1000.1 + 1000.2 - 2000.3) < Number.EPSILON);
console.log((1.005).toFixed(2));
console.log((1.25).toFixed(1));
console.log((1.35).toFixed(1));
console.log(typeof (0.5).toFixed(0));
console.log((0.1).toFixed(20));
console.log(0.1 * 3);
console.log(2 ** 53 + 1 === 2 ** 53);
console.log(Math.round(-2.5));`,
    expectedOutput: [
      '0.30000000000000004',
      'false',
      'true',
      'false',
      '1.00',
      '1.3',
      '1.4',
      'string',
      '0.10000000000000000555',
      '0.30000000000000004',
      'true',
      '-2',
    ],
    steps: [
      '0.1 and 0.2 have no exact binary representation; their sum is the double closest to 0.30000000000000004, so === 0.3 is false.',
      'The error (~5.6e-17) is smaller than Number.EPSILON (~2.2e-16) → true. But EPSILON is the gap next to 1; near 2000 the error is far larger, so the same check is false.',
      '1.005 is stored as 1.00499999999999989..., so toFixed(2) rounds down → "1.00".',
      '1.25 is exactly representable and toFixed picks the larger value on a tie → "1.3"; 1.35 is stored slightly above 1.35 → "1.4".',
      'toFixed returns a string; toFixed(20) exposes the stored value 0.10000000000000000555.',
      '0.1 * 3 has the same error as 0.1 + 0.2. 2**53 + 1 cannot be represented and rounds back to 2**53 → true.',
      'Math.round rounds halves toward +Infinity, so Math.round(-2.5) is -2.',
    ],
    misconceptions: [
      'Number.EPSILON is not a universal tolerance — use a relative tolerance scaled by the magnitude of the operands.',
      'toFixed is not "round half up on the decimal you see": it rounds the binary value actually stored.',
      'Math.round is not symmetric for negative halves.',
    ],
    followUp: {
      question: 'How should a checkout page round 1.005 to two decimals?',
      answer:
        'Work in integer minor units (cents) end to end, or format with Intl.NumberFormat, which rounds the shortest decimal representation: Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(1.005) gives "1.01", while Math.round(1.005 * 100) / 100 gives 1 because 1.005 * 100 is 100.49999999999999.',
    },
    docSourceIds: ['mdn-equality', 'mdn-object-is'],
  },
  {
    schemaVersion: 1,
    kind: 'output',
    execution: 'output',
    track: 'output',
    id: 'out-class-private-static-super',
    slug: 'class-private-static-super',
    title: 'Private fields, static members and super calls',
    difficulty: 'hard',
    priority: 'P1',
    seniority: ['Senior', 'SDE-3', 'MTS'],
    topics: ['classes', 'private fields', 'static', 'super', 'inheritance'],
    estimatedMinutes: 6,
    conceptIds: ['prototype-chain', 'this-binding'],
    research: research(
      [bfe('104. Inheritance', 'https://bigfrontend.dev/quiz/Inheritance')],
      'BFE.dev has an "Inheritance" quiz; no quiz in the listing targets #private fields, so the snippet extends class inheritance with private/static brand checks. Verified by execution.',
    ),
    environment: 'node',
    prompt: NODE_PROMPT,
    code: `class Counter {
  static #instances = 0;
  static created() { return this.#instances; }
  #count = 0;
  constructor(start = 0) { this.#count = start; Counter.#instances++; }
  inc() { this.#count++; return this; }
  get value() { return this.#count; }
  describe() { return \`Counter(\${this.#count})\`; }
  static isCounter(o) { return #count in o; }
}
class StepCounter extends Counter {
  #step;
  constructor(step) { super(10); this.#step = step; }
  inc() { for (let i = 0; i < this.#step; i++) super.inc(); return this; }
  describe() { return \`Step:\${super.describe()}\`; }
}
const s = new StepCounter(3).inc();
console.log(\`\${s.value} \${s.describe()}\`);
console.log(Counter.created());
try { StepCounter.created(); } catch (e) { console.log(\`static: \${e.name}\`); }
console.log(\`\${Counter.isCounter(s)} \${Counter.isCounter({ value: 13 })}\`);
console.log(\`\${Object.keys(s).length} \${JSON.stringify(s)}\`);
try { Counter.prototype.describe.call({}); } catch (e) { console.log(e.name); }`,
    expectedOutput: ['13 Step:Counter(13)', '1', 'static: TypeError', 'true false', '0 {}', 'TypeError'],
    steps: [
      "new StepCounter(3): super(10) runs the Counter constructor (installing Counter's #count on the instance, setting it to 10 and incrementing the static counter), then StepCounter's #step is installed and set to 3.",
      'inc() is StepCounter\'s override; super.inc() calls Counter.prototype.inc with the same this, three times → 13. describe() prefixes super.describe() → "13 Step:Counter(13)".',
      'Counter.created() reads this.#instances with this = Counter → 1.',
      'StepCounter.created() inherits the static method, but now this = StepCounter. Static private fields live only on the class that declared them, so the read throws a TypeError.',
      '`#count in o` is a brand check: true for the subclass instance, false for a look-alike object.',
      'Private fields are not properties: Object.keys is empty and JSON.stringify gives {}.',
      'Calling describe with this = {} reads #count on an object without that private field → TypeError.',
    ],
    misconceptions: [
      'Static private fields are not inherited — `this.#x` in a static method breaks when called on a subclass; use the class name instead.',
      'Private fields are not hidden properties; they are invisible to keys, JSON, spread and Proxy forwarding.',
      'super.method() does not change `this`; it only changes where the method lookup starts.',
    ],
    followUp: {
      question: 'What happens if you wrap an instance with private fields in a Proxy and call a method through it?',
      answer:
        'The method runs with this = the proxy, which does not have the private field, so this.#count throws a TypeError ("Cannot read private member ... from an object whose class did not declare it"). Private fields do not tunnel through proxies.',
    },
    docSourceIds: ['mdn-prototype', 'mdn-this'],
  },
  {
    schemaVersion: 1,
    kind: 'output',
    execution: 'output',
    track: 'output',
    id: 'out-structured-clone-limits',
    slug: 'structured-clone-limits',
    title: 'What structuredClone keeps and what it rejects',
    difficulty: 'medium',
    priority: 'P1',
    seniority: ['Senior', 'SDE-2', 'SDE-3'],
    topics: ['structuredClone', 'deep copy', 'Map', 'Set', 'Date'],
    estimatedMinutes: 4,
    conceptIds: ['referential-equality', 'immutable-updates', 'prototype-chain'],
    research: research(
      [bfe('118. structuredClone()', 'https://bigfrontend.dev/quiz/structuredclone')],
      'BFE.dev has a structuredClone quiz. MDN structuredClone documents supported types and DataCloneError. Verified by execution in Node (structuredClone is the same HTML algorithm as in browsers).',
    ),
    environment: 'node',
    prompt: NODE_PROMPT,
    code: `const original = {
  when: new Date(0),
  tags: new Set(['a', 'b']),
  lookup: new Map([['k', { deep: 1 }]]),
  re: /x/gi,
};
original.self = original;
const copy = structuredClone(original);
console.log(\`\${copy.self === copy} \${copy === original}\`);
console.log(\`\${copy.when.getTime()} \${copy.tags.has('b')} \${copy.lookup.get('k').deep}\`);
copy.lookup.get('k').deep = 2;
console.log(original.lookup.get('k').deep);
console.log(copy.re.flags);
class Point {
  constructor() { this.x = 1; }
  get len() { return 5; }
}
const pc = structuredClone(new Point());
console.log(\`\${pc instanceof Point} \${pc.x} \${pc.len}\`);
try { structuredClone({ fn() {} }); } catch (e) { console.log(e.name); }
try { structuredClone({ s: Symbol('x') }); } catch (e) { console.log(e.name); }`,
    expectedOutput: ['true false', '0 true 1', '1', 'gi', 'false 1 undefined', 'DataCloneError', 'DataCloneError'],
    steps: [
      'Cycles are preserved: copy.self points to copy, not to original → "true false".',
      'Date, Set and Map are cloned as real instances with their contents → "0 true 1".',
      'The clone is deep: mutating the object inside the cloned Map leaves the original at 1.',
      'RegExp is supported and keeps its flags → "gi".',
      'Class instances are cloned as plain objects: the prototype (and therefore the getter len) is lost → "false 1 undefined".',
      'Functions and symbols are not cloneable; both throw a DOMException named "DataCloneError".',
    ],
    misconceptions: [
      'structuredClone is not JSON round-tripping: it keeps Date/Map/Set/RegExp and cycles.',
      'It does not preserve prototypes, getters/setters or class identity.',
      'An object containing a method is not cloned "without the method" — the whole call throws.',
    ],
    followUp: {
      question: 'Can you structuredClone an Error?',
      answer:
        'Yes — Error objects are serializable: the clone is an Error of the same built-in type with name and message preserved (verified: cloning new TypeError("m") gives a TypeError with message "m"). Custom properties and subclass prototypes are not kept.',
    },
    docSourceIds: ['mdn-structuredclone', 'mdn-map'],
  },
  {
    schemaVersion: 1,
    kind: 'output',
    execution: 'output',
    track: 'output',
    id: 'out-counter-factory-shared-state',
    slug: 'counter-factory-shared-state',
    title: 'Counter factories and shared closure state',
    difficulty: 'medium',
    priority: 'P0',
    seniority: ['Senior', 'SDE-2', 'SDE-3'],
    topics: ['closures', 'factory functions', 'shared state', 'async callbacks'],
    estimatedMinutes: 4,
    conceptIds: ['closures', 'event-loop', 'referential-equality'],
    research: research(
      [bfe('99. closure', 'https://bigfrontend.dev/quiz/closure-1')],
      'BFE.dev has a "closure" quiz. Unlike the first-batch loop question, this targets per-call closure environments vs. state shared through an outer object, read later by async callbacks. Verified by execution.',
    ),
    environment: 'node',
    prompt: NODE_PROMPT,
    code: `function makeCounter() {
  let count = 0;
  return {
    inc: () => ++count,
    get: () => count,
    reset() { count = 0; },
  };
}
const a = makeCounter();
const b = makeCounter();
a.inc(); a.inc(); b.inc();
console.log(\`\${a.get()} \${b.get()}\`);
const { inc, get } = a;
inc();
console.log(get());
const snapshot = a.get();
setTimeout(() => console.log(\`timer sees \${a.get()}, snapshot \${snapshot}\`), 0);
Promise.resolve().then(() => console.log(\`micro sees \${a.get()}\`));
a.reset();
a.inc();
const shared = { count: 0 };
const makeLeaky = () => () => ++shared.count;
const l1 = makeLeaky(), l2 = makeLeaky();
l1(); l2();
console.log(\`\${l1()} \${shared.count}\`);`,
    expectedOutput: ['2 1', '3', '3 3', 'micro sees 1', 'timer sees 1, snapshot 3'],
    steps: [
      'Each makeCounter() call creates a new `count` binding; a and b close over different ones → "2 1".',
      'Destructured inc/get are arrows (and reset uses no this), so they still work after being detached — they reach count through the closure, not through `this` → 3.',
      'snapshot copies the number 3; the timer and the microtask capture the variable a, not a value.',
      'Synchronously, a.reset() and a.inc() set count to 1.',
      'makeLeaky closures all reference the same outer `shared` object, so l1 and l2 share state: after l1(), l2(), l1() → "3 3".',
      'After the script, the microtask prints the live value "micro sees 1", then the timer prints "timer sees 1, snapshot 3".',
    ],
    misconceptions: [
      'Closures do not capture values; they capture bindings, so async callbacks see the latest value.',
      'Two closures created by the same factory are not automatically isolated — state defined outside the factory is shared by all of them.',
      'Closure-based methods do not depend on `this`, unlike methods that read this.count.',
    ],
    followUp: {
      question:
        'If the factory returned { count: 0, inc() { return ++this.count; } }, what would `const { inc } = a; inc()` do in this classic script?',
      answer:
        "The detached call has this = globalThis in sloppy mode, so it increments globalThis.count (undefined → NaN) and the object stays at 0; in strict mode or a module it throws a TypeError. Verified: inc() returns NaN and the object's count stays 0.",
    },
    docSourceIds: ['mdn-closures', 'mdn-settimeout', 'mdn-microtask'],
  },
  {
    schemaVersion: 1,
    kind: 'output',
    execution: 'output',
    track: 'output',
    id: 'out-nullish-vs-or-falsy',
    slug: 'nullish-vs-or-falsy',
    title: '?? and ?. vs || with falsy values',
    difficulty: 'easy',
    priority: 'P0',
    seniority: ['Senior', 'SDE-2', 'SDE-3'],
    topics: ['nullish coalescing', 'optional chaining', 'logical assignment', 'falsy values'],
    estimatedMinutes: 3,
    conceptIds: ['coercion-equality'],
    research: research(
      [
        bfe('111. falsy', 'https://bigfrontend.dev/quiz/falsy'),
        bfe('9. null and undefined', 'https://bigfrontend.dev/quiz/null-and-undefined'),
      ],
      'BFE.dev has "falsy" and "null and undefined" quizzes. MDN equality documents null/undefined semantics. Verified by execution.',
    ),
    environment: 'node',
    prompt: NODE_PROMPT,
    code: `const settings = { retries: 0, label: '', ratio: NaN, theme: null, nested: { fn: null } };
console.log(settings.retries || 3);
console.log(settings.retries ?? 3);
console.log(\`[\${settings.label || 'default'}] [\${settings.label ?? 'default'}]\`);
console.log(\`\${settings.ratio || 1} \${settings.ratio ?? 1}\`);
console.log(settings.theme ?? 'light');
console.log(\`\${settings.missing?.deep.deeper}\`);
console.log(\`\${settings.nested.fn?.()} \${typeof settings.nested?.fn?.call}\`);
let calls = 0;
const none = null;
none?.[calls++];
console.log(calls);
let count = 0;
count ||= 5;
let zero = 0;
zero ??= 5;
console.log(\`\${count} \${zero}\`);
console.log((null || undefined) ?? 'fallback');`,
    expectedOutput: [
      '3',
      '0',
      '[default] []',
      '1 NaN',
      'light',
      'undefined',
      'undefined undefined',
      '0',
      '5 0',
      'fallback',
    ],
    steps: [
      '|| falls back on any falsy value: 0 → 3. ?? only falls back on null/undefined, so 0 is kept.',
      'The empty string is falsy → "[default]" with ||, kept as "" with ?? → "[]".',
      'NaN is falsy but not nullish → "1 NaN". null ?? "light" → "light".',
      'settings.missing is undefined, so ?. short-circuits the WHOLE chain, including .deep.deeper → undefined, no TypeError.',
      'fn is null: fn?.() returns undefined instead of throwing; nested?.fn?.call stops at fn → "undefined undefined".',
      'none?.[calls++] short-circuits before evaluating the bracket expression, so calls stays 0.',
      '||= assigns because 0 is falsy (→ 5); ??= does not because 0 is not nullish (→ 0). Finally (null || undefined) is undefined, so ?? yields "fallback".',
    ],
    misconceptions: [
      '?? is not a shorter ||; they differ for 0, "", NaN and false.',
      'Optional chaining does not only protect the next property — it short-circuits the rest of the chain, including side effects in later expressions.',
      '?. does not guard against values that exist but are not callable (e.g. a number) — only null/undefined.',
    ],
    followUp: {
      question: 'Why is `a ?? b || c` a SyntaxError?',
      answer:
        'The spec forbids mixing ?? with || or && without parentheses, to avoid ambiguity about precedence. Write (a ?? b) || c or a ?? (b || c). Verified: parsing it throws a SyntaxError.',
    },
    docSourceIds: ['mdn-equality'],
  },
];
