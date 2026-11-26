import { A11Y_BATCH2_CONCEPTS } from './concepts-a11y-batch2';
import { NEXTJS_RENDERING_CONCEPTS } from './concepts-nextjs-rendering';
import { REACT19_PERF_CONCEPTS } from './concepts-react19-perf';
import { REACT_BATCH2_CONCEPTS } from './concepts-react-batch2';
import { SECURITY_BROWSER_CONCEPTS } from './concepts-security-browser';
import type { Concept } from './schema';

/**
 * Concept knowledge base. Original explanations, checked against the official
 * documentation referenced by `docSourceIds` (see ./sources.ts).
 * Code fences use `~~~` so the markdown can live inside template literals.
 */
export const CONCEPTS: Concept[] = [
  // ───────────────────────────── JavaScript fundamentals ─────────────────────────────
  {
    id: 'closures',
    title: 'Closures',
    area: 'JavaScript',
    summary: 'A function keeps live access to the variable bindings of the scope it was created in, even after that scope has returned.',
    definition: `A **closure** is the combination of a function object and a reference to the lexical environment in which it was defined. Variables are resolved by where the function is *written*, not where it is *called*.`,
    whyItExists: `JavaScript has first-class functions: they are passed as callbacks, returned from factories and stored on objects. Without closures, a callback scheduled by \`setTimeout\` or an event listener could not see the variables that were in scope when it was created. Closures are also the language's original encapsulation mechanism (module pattern, private state) before \`#private\` fields existed.`,
    mechanism: `Every function object stores an internal \`[[Environment]]\` slot pointing at the Environment Record active when it was created. Calling the function creates a new record whose *outer* reference is that saved environment, so identifier lookup walks: local record → defining scope → … → global.

Key consequences:

- Closures capture **bindings, not values**. If the outer variable is reassigned later, the closure sees the new value.
- \`let\`/\`const\` in a \`for\` head create a **fresh binding per iteration**; \`var\` creates one function-scoped binding shared by all iterations.
- A captured environment stays reachable (not garbage-collected) as long as any closure referencing it is reachable. Engines may optimise away unreferenced variables, but you should not rely on that.`,
    example: `A search box creates a \`debounce\`d handler once per mount. The timer id lives in the closure, so every keystroke clears the *same* pending timer. If the handler is accidentally recreated on every render, each render gets a new closure with its own timer and debouncing silently stops working.`,
    codeWalkthrough: `~~~js
function makeCounter() {
  let count = 0;
  return {
    inc: () => ++count,
    get: () => count,
  };
}
const a = makeCounter();
const b = makeCounter();
a.inc(); a.inc();
console.log(a.get(), b.get()); // 2 0

for (var i = 0; i < 3; i++) setTimeout(() => console.log('var', i));
for (let j = 0; j < 3; j++) setTimeout(() => console.log('let', j));
~~~

1. Each \`makeCounter()\` call creates a new environment with its own \`count\`; \`a\` and \`b\` do not share state.
2. \`inc\` and \`get\` close over the *same* binding, so writes through one are visible through the other.
3. The \`var\` loop logs \`3 3 3\`: one binding, read after the loop finished.
4. The \`let\` loop logs \`0 1 2\`: the spec copies the binding into a new environment for each iteration.`,
    misconceptions: [
      'Closures copy the values of outer variables at creation time — they hold a reference to the binding, so later reassignment is visible.',
      'Only functions returned from other functions are closures — every function closes over its defining scope, including callbacks defined inline.',
      'Closures are inherently a memory leak — they only retain what stays reachable; the leak is the long-lived reference (listener, cache, timer) that keeps the closure alive.',
    ],
    failureCases: [
      'A React `useEffect` with a `setInterval` and an empty dependency array reads a stale `count` forever because the interval callback closed over the first render\'s value.',
      'An event listener registered in a component closes over a large data structure and is never removed, keeping the detached DOM subtree and the data in memory.',
      'Legacy code using `var` in a loop attaches click handlers that all act on the last item.',
    ],
    productionImplications: `In React every render produces new closures over that render's props and state ("snapshot" semantics). Stale closures are the root cause of most interval, subscription and async-callback bugs; fix them with functional updates, correct effect dependencies, or a ref that holds the latest value. When profiling memory, look for closures retained by global listeners, caches and timers.`,
    docSourceIds: ['mdn-closures'],
    interviewQuestions: [
      'What exactly does a closure capture — a value or a binding? Show code that proves it.',
      'Why does a `for (var …)` loop with `setTimeout` print the same number, and what does `let` change at the spec level?',
      'Explain a stale closure in a React effect and three ways to fix it.',
      'Implement a `once(fn)` helper and explain where its state lives.',
    ],
    related: ['this-binding', 'hoisting-tdz', 'currying', 'debouncing', 'react-effects'],
  },
  {
    id: 'this-binding',
    title: 'this binding',
    area: 'JavaScript',
    summary: 'For ordinary functions `this` is decided by how the function is called; arrow functions take `this` from the enclosing scope.',
    definition: `\`this\` is an implicit binding resolved per call. For non-arrow functions it depends on the **call site**; for arrow functions it is **lexical** — the \`this\` of the surrounding scope at definition time.`,
    whyItExists: `It lets one function object act as a method on many receivers (shared prototype methods, mixins, \`Array.prototype.map.call(nodeList, …)\`) without being re-created per object.`,
    mechanism: `Resolution rules for a non-arrow function, in precedence order:

1. **\`new F()\`** — \`this\` is the freshly created object (overrides even a \`bind\`-bound \`this\`).
2. **Explicit** — \`f.call(obj)\`, \`f.apply(obj)\`, or a function returned by \`f.bind(obj)\` (binding is permanent; re-binding has no effect).
3. **Implicit** — \`obj.f()\`: the base of the member expression becomes \`this\`.
4. **Default** — plain \`f()\`: \`undefined\` in strict mode (all modules and class bodies), \`globalThis\` in sloppy scripts.

Arrow functions have no own \`this\`; \`call\`/\`apply\`/\`bind\` cannot change it. DOM listeners added with \`addEventListener\` receive the element (\`event.currentTarget\`) as \`this\` when they are ordinary functions.`,
    example: `A class-based component passes \`this.handleClick\` as a callback. When the button calls it, the call is a plain function call, so \`this\` is \`undefined\` (class bodies are strict) and \`this.setState\` throws. Binding in the constructor or using an arrow class field fixes it.`,
    codeWalkthrough: `~~~js
'use strict';
const user = {
  name: 'Ada',
  greet() { return this?.name; },
  greetArrow: () => typeof this,
};
const detached = user.greet;
console.log(user.greet());          // 'Ada'
console.log(detached());            // undefined
console.log(user.greet.call({ name: 'Bo' })); // 'Bo'
const bound = user.greet.bind(user);
console.log(bound.call({ name: 'Cy' }));      // 'Ada'
~~~

1. \`user.greet()\` is an implicit call: base object \`user\` becomes \`this\`.
2. \`detached()\` is a default call in strict mode, so \`this\` is \`undefined\`.
3. \`call\` explicitly supplies the receiver.
4. A bound function ignores later \`call\` receivers.
5. \`greetArrow\` takes \`this\` from module/script scope, never from \`user\`.`,
    misconceptions: [
      '`this` refers to the object the function was defined in — for ordinary functions it is the call-site receiver.',
      'Arrow functions bind `this` to the object literal they are written in — object literals do not create a `this` scope.',
      '`bind` can be overridden by `call` — a bound function\'s `this` is fixed (only `new` ignores it).',
    ],
    failureCases: [
      'Passing `obj.method` to `setTimeout` or an array method loses the receiver and throws `Cannot read properties of undefined`.',
      'Defining an object method as an arrow function so `this` is the module scope, returning `undefined` fields.',
      'Calling `removeEventListener(type, this.handler.bind(this))` — `bind` returns a new function each time, so the original listener is never removed.',
    ],
    productionImplications: `Prefer closures or arrow class fields for callbacks, and store bound references once if you must add/remove listeners. Lint rules such as "no invalid this" catch many cases, and TypeScript's \`this\` parameter typing can make receivers explicit in library code.`,
    docSourceIds: ['mdn-this'],
    interviewQuestions: [
      'List the rules that decide `this` and their precedence.',
      'What does `new` do to a function that was previously bound with `bind`?',
      'Why do arrow functions make poor prototype methods but good callbacks?',
      'Implement `Function.prototype.bind` (including partial arguments).',
    ],
    related: ['closures', 'prototype-chain', 'event-delegation'],
  },
  {
    id: 'hoisting-tdz',
    title: 'Hoisting & the temporal dead zone',
    area: 'JavaScript',
    summary: 'Declarations are registered before code runs; `var` is initialised to `undefined`, while `let`/`const`/`class` stay uninitialised (TDZ) until their declaration executes.',
    definition: `**Hoisting** is the observable effect of the engine instantiating all declarations of a scope before executing it. The **temporal dead zone** is the period between entering a scope and evaluating a \`let\`/\`const\`/\`class\` declaration, during which accessing the binding throws a \`ReferenceError\`.`,
    whyItExists: `Function declarations being usable before their textual position enables mutual recursion and top-down file organisation. The TDZ was introduced with ES2015 so block-scoped bindings fail loudly instead of silently reading \`undefined\`, and so \`const\` can never be observed in two different states.`,
    mechanism: `When a scope is entered (declaration instantiation):

- **Function declarations**: binding created *and* initialised with the function object.
- **\`var\`**: binding created in the function/global scope and initialised to \`undefined\`.
- **\`let\` / \`const\` / \`class\`**: binding created in the block scope but left **uninitialised**. Any read or write before the declaration is evaluated throws \`ReferenceError\` — even \`typeof x\`.
- **\`import\`** bindings are created during module linking, before any module code runs.

The TDZ is *temporal*, not positional: a function that references a \`let\` declared later is fine as long as it is *called* after the declaration has run.`,
    example: `A module exports \`const config = buildConfig()\`, but a circular import causes another module to read \`config\` during its own evaluation, before this module finished. The result is \`ReferenceError: Cannot access 'config' before initialization\` at startup — a TDZ error caused by import cycles.`,
    codeWalkthrough: `~~~js
console.log(typeof hoistedFn); // 'function'
console.log(v);                // undefined
try { console.log(l); } catch (e) { console.log(e.name); } // ReferenceError

function hoistedFn() {}
var v = 1;
let l = 2;

function later() { return z; }
const z = 3;
console.log(later()); // 3 — called after initialisation
~~~

1. \`hoistedFn\` is fully initialised at scope entry.
2. \`v\` exists but holds \`undefined\` until the assignment runs.
3. \`l\` exists (it shadows any outer \`l\`) but is in the TDZ, so access throws.
4. \`later\` mentions \`z\` before its declaration, but runs after it — no error.`,
    misconceptions: [
      '`let` and `const` are not hoisted — they are hoisted (they shadow outer bindings from the start of the block) but uninitialised.',
      '`typeof` is always safe — `typeof` on a TDZ binding throws; it is only safe for undeclared identifiers.',
      'Hoisting physically moves code to the top — nothing moves; bindings are created during declaration instantiation.',
    ],
    failureCases: [
      'Circular ES module imports throw a TDZ `ReferenceError` in production bundles where evaluation order differs from dev.',
      'A `switch` with `let` declarations in different `case` clauses shares one block, causing TDZ or redeclaration errors.',
      'A class used before its declaration in the same module (e.g. in a static initialiser of another class) throws, unlike a function declaration.',
    ],
    productionImplications: `Bundlers preserve TDZ semantics, so import cycles that "worked" by luck can break when chunks are reordered. Prefer \`const\` by default, avoid module-level side effects that depend on cycle order, and treat \`Cannot access 'X' before initialization\` as a dependency-graph smell.`,
    docSourceIds: ['mdn-hoisting', 'mdn-let'],
    interviewQuestions: [
      'What is hoisted for `var`, `let`, `const`, `class` and function declarations, and what is the initial state of each?',
      'Why does `typeof x` throw for a `let x` declared later in the block?',
      'Show a case where code mentioning a `const` before its declaration does not throw.',
      'How can circular imports surface as TDZ errors?',
    ],
    related: ['closures', 'this-binding'],
  },
  {
    id: 'coercion-equality',
    title: 'Type coercion & equality algorithms',
    area: 'JavaScript',
    summary: 'JavaScript has four equality algorithms — `==`, `===`, SameValueZero and `Object.is` — that differ on coercion, `NaN` and signed zero.',
    definition: `**Coercion** is implicit conversion of a value to another type (ToPrimitive, ToNumber, ToString, ToBoolean). **Loose equality** (\`==\`) coerces operands; **strict equality** (\`===\`) never does; **SameValueZero** (used by \`includes\`, \`Map\`, \`Set\`) treats \`NaN\` as equal to itself; **SameValue** (\`Object.is\`) additionally distinguishes \`+0\` from \`-0\`.`,
    whyItExists: `Early JavaScript optimised for forgiving form handling, where everything arrives as strings. Coercion lets \`"5" * 2\` work. The stricter algorithms were added because the loose rules are hard to reason about and IEEE-754 \`NaN !== NaN\` breaks collections.`,
    mechanism: `Abbreviated \`IsLooselyEqual(x, y)\`:

1. Same type → compare like \`===\`.
2. \`null == undefined\` is \`true\`; neither equals anything else (so \`null == 0\` is \`false\`).
3. Number vs string → string converted with ToNumber.
4. Boolean on either side → converted to a number first (\`true\` → 1).
5. Object vs primitive → object converted with **ToPrimitive** (\`Symbol.toPrimitive\`, else \`valueOf\`/\`toString\`), then compare again.
6. BigInt vs number/string compares mathematical values.

| | \`===\` | SameValueZero | \`Object.is\` |
|---|---|---|---|
| \`NaN, NaN\` | false | true | true |
| \`0, -0\` | true | true | false |

Objects are compared by reference in all four algorithms.`,
    example: `A filter checks \`if (value == false)\` to detect "empty". It is true for \`0\`, \`""\`, \`"0"\` and \`[]\`, but false for \`null\` and \`undefined\` — so the null case slips through and renders \`"null"\` in the UI.`,
    codeWalkthrough: `~~~js
[] == false;        // true:  [] -> '' -> 0, false -> 0
[0] == false;       // true:  [0] -> '0' -> 0
null == 0;          // false: null only loosely equals undefined
NaN === NaN;        // false
[NaN].includes(NaN);   // true  (SameValueZero)
[NaN].indexOf(NaN);    // -1    (strict equality)
Object.is(NaN, NaN);   // true
Object.is(0, -0);      // false
new Set([0, -0]).size; // 1     (SameValueZero)
~~~

1. Booleans are converted to numbers before comparing, which explains the two surprising \`true\` results.
2. \`null\`/\`undefined\` are special-cased and never coerced to \`0\`.
3. \`includes\` and \`indexOf\` use different algorithms, hence different answers for \`NaN\`.
4. React compares state and dependencies with \`Object.is\`.`,
    misconceptions: [
      '`==` converts both sides to strings — it prefers numbers; strings are converted only when needed for the comparison.',
      '`Object.is` is the same as `===` — it differs for `NaN` and for `+0`/`-0`.',
      '`null == 0` is true because null is falsy — it is false; truthiness (ToBoolean) is not used by `==`.',
    ],
    failureCases: [
      'Using `indexOf(NaN)` to detect a value in a parsed numeric column always returns -1.',
      '`if (id == 0)` treats an empty-string id from a form as 0 and selects the wrong record.',
      'Sorting/grouping by `-0` vs `0` produces separate buckets when keyed with `Object.is`-based logic but not with `Map`.',
    ],
    productionImplications: `Use \`===\` everywhere except the idiomatic \`x == null\` (null-or-undefined check). Normalise form input explicitly (\`Number(value)\`, \`Number.isNaN\`). Remember React bails out of renders by \`Object.is\`, so \`NaN\` state does not loop, but \`-0\` → \`0\` triggers an update.`,
    docSourceIds: ['mdn-equality', 'mdn-object-is'],
    interviewQuestions: [
      'Walk through how `[] == ![]` evaluates.',
      'Name the four equality algorithms and which APIs use each.',
      'Why is `x == null` considered acceptable while other `==` uses are not?',
      'How does `Symbol.toPrimitive` affect `==` and `+`?',
    ],
    related: ['referential-equality', 'prototype-chain'],
  },
  {
    id: 'prototype-chain',
    title: 'Prototype chain & inheritance',
    area: 'JavaScript',
    summary: 'Every object has an internal `[[Prototype]]` link; property reads that miss on the object walk this chain until they find the key or reach `null`.',
    definition: `The **prototype chain** is the linked list formed by each object's \`[[Prototype]]\` (exposed via \`Object.getPrototypeOf\`). JavaScript inheritance — including \`class\` syntax — is delegation along this chain.`,
    whyItExists: `It lets many objects share one copy of methods (memory efficiency) and allows behaviour to be added at runtime by changing a shared prototype. It is a simpler model than class-based inheritance that still supports it as a pattern.`,
    mechanism: `- **Lookup (\`[[Get]]\`)**: check own properties; if absent, repeat on the prototype; stop at \`null\` and return \`undefined\`.
- **Assignment (\`[[Set]]\`)**: normally creates/updates an *own* property, shadowing the inherited one. Exceptions: if an inherited property is an accessor, its setter runs; if it is a non-writable data property, the assignment fails (throws in strict mode).
- \`F.prototype\` is the object assigned as \`[[Prototype]]\` of instances created with \`new F()\` — it is **not** \`F\`'s own prototype (that is \`Function.prototype\`).
- \`class B extends A\` sets \`B.prototype.[[Prototype]] = A.prototype\` *and* \`B.[[Prototype]] = A\` (so statics are inherited).
- \`Object.create(proto)\` creates an object with an explicit prototype; \`Object.create(null)\` creates one with no chain at all (useful for dictionaries).
- \`instanceof\` walks the left operand's chain looking for \`Right.prototype\` (customisable with \`Symbol.hasInstance\`).`,
    example: `A dictionary of user-supplied keys built from \`{}\` reports \`"constructor" in dict === true\` and can be polluted by a key of \`"__proto__"\`. Using a \`Map\` or \`Object.create(null)\` avoids inherited keys.`,
    codeWalkthrough: `~~~js
class Animal { speak() { return 'generic'; } }
class Dog extends Animal { speak() { return 'woof'; } }
const d = new Dog();

Object.getPrototypeOf(d) === Dog.prototype;              // true
Object.getPrototypeOf(Dog.prototype) === Animal.prototype; // true
Object.getPrototypeOf(Dog) === Animal;                   // true (statics)
d.hasOwnProperty('speak');                               // false
Object.hasOwn(Dog.prototype, 'speak');                   // true
d.speak = () => 'own';  // shadows, does not modify Dog.prototype
~~~

1. Instances delegate to \`Dog.prototype\`, which delegates to \`Animal.prototype\`.
2. \`extends\` also links the constructors, which is how static methods are inherited.
3. Methods live on the prototype, not the instance.
4. Assigning on the instance shadows the prototype's method for that instance only.`,
    misconceptions: [
      '`F.prototype` is the prototype of `F` — it is the prototype given to instances; `F` itself inherits from `Function.prototype`.',
      'Classes introduce a different inheritance model — they are syntax over the same prototype delegation (with stricter semantics like TDZ and mandatory `new`).',
      'Assigning to an inherited property modifies the prototype — it creates an own property unless a setter or non-writable property intercepts it.',
    ],
    failureCases: [
      'Prototype pollution: a deep-merge utility copies a `__proto__` key from JSON input onto `Object.prototype`, injecting properties into every object.',
      '`for…in` over an object iterates enumerable inherited properties added by a polyfill, producing extra form fields.',
      '`instanceof` fails across iframes/realms because each realm has its own `Array.prototype`; `Array.isArray` is required.',
    ],
    productionImplications: `Use \`Object.hasOwn\` and \`Map\` for untrusted keys, block \`__proto__\`/\`constructor\`/\`prototype\` in merge utilities, and avoid modifying built-in prototypes. Deep prototype chains are fast in modern engines, but changing an object's prototype after creation (\`Object.setPrototypeOf\`) deoptimises it.`,
    docSourceIds: ['mdn-prototype'],
    interviewQuestions: [
      'Explain the difference between `__proto__`, `Object.getPrototypeOf(obj)` and `F.prototype`.',
      'What happens when you assign to a property that exists only on the prototype?',
      'Implement `myInstanceOf(obj, Ctor)` and `Object.create` without using them.',
      'What is prototype pollution and how do you defend against it?',
    ],
    related: ['this-binding', 'coercion-equality', 'referential-equality'],
  },
  {
    id: 'exceptions-finally',
    title: 'try/catch/finally control flow',
    area: 'JavaScript',
    summary: '`finally` always runs when leaving a `try` (return, throw, break, continue), and a completion produced in `finally` overrides the one from `try`/`catch`.',
    definition: `\`try…catch…finally\` handles synchronous exceptions and, with \`await\`, promise rejections inside async functions. The \`finally\` block executes on every exit path from the \`try\`/\`catch\` blocks.`,
    whyItExists: `It guarantees cleanup — releasing locks, resetting loading flags, closing resources — regardless of how a block exits, without duplicating the cleanup on every branch.`,
    mechanism: `The spec models blocks as producing **completion records** (normal, return, throw, break, continue).

1. Run \`try\`. If it completes with *throw* and there is a \`catch\`, run \`catch\` with the thrown value.
2. Run \`finally\`. If \`finally\` completes **normally**, the earlier completion is restored — the pending \`return\` value or exception continues.
3. If \`finally\` itself completes abruptly (\`return\`, \`throw\`, \`break\`), that completion **replaces** the earlier one — a pending exception is silently discarded.

The \`return\` expression in \`try\` is evaluated *before* \`finally\` runs; mutating a returned object in \`finally\` is visible, reassigning the variable is not.

Async boundaries: \`try\` only sees exceptions thrown synchronously within it, or rejections that are \`await\`ed within it. \`return promise\` (without \`await\`) inside \`try\` lets the rejection escape the \`catch\`.`,
    example: `A form submit handler sets \`isSubmitting = true\`, \`await\`s the request, and resets the flag in \`finally\`. If the code is \`return api.save(data)\` without \`await\`, \`finally\` runs immediately — before the request settles — and the button re-enables mid-request.`,
    codeWalkthrough: `~~~js
function f() {
  try { return 'try'; }
  finally { console.log('cleanup'); }
}
function g() {
  try { throw new Error('boom'); }
  finally { return 'swallowed'; } // discards the error
}
async function load(api) {
  try {
    return await api.get();       // rejection caught below
  } catch (e) {
    return { error: e };
  }
}
~~~

1. \`f()\` logs \`cleanup\` and then returns \`'try'\`: the return completion survives a normally completing \`finally\`.
2. \`g()\` returns \`'swallowed'\`; the error disappears — a common lint rule (\`no-unsafe-finally\`) forbids this.
3. In \`load\`, \`return await\` keeps the rejection inside the \`try\`; plain \`return api.get()\` would bypass the \`catch\`.`,
    misconceptions: [
      '`finally` does not run if `try` returns — it always runs before the function actually returns.',
      'A surrounding `try/catch` catches errors thrown in `setTimeout` or event callbacks scheduled inside it — those run in a later task with a different stack.',
      '`return await` is always redundant — inside `try` it changes which handler catches the rejection.',
    ],
    failureCases: [
      'A `return` inside `finally` swallows a network error, so monitoring never sees the failure.',
      'Loading spinner never stops because cleanup was placed after `await` in the `try` block instead of in `finally`.',
      'An error thrown from a promise callback escapes a synchronous `try` and becomes an `unhandledrejection`.',
    ],
    productionImplications: `Use \`finally\` (or \`Promise.prototype.finally\`) for state resets, never return or throw from it. Wrap errors with \`new Error(msg, { cause })\` to keep the original stack. Make sure every async entry point (event handler, effect) has a catch path, and report \`unhandledrejection\` globally.`,
    docSourceIds: ['mdn-try-catch', 'mdn-promise-all'],
    interviewQuestions: [
      'What does a function return if both `try` and `finally` contain `return` statements?',
      'Why can `return promise` inside `try` skip the `catch`?',
      'How do you ensure a loading flag resets on every exit path in an async handler?',
      'Can `try/catch` catch an error thrown in a `setTimeout` callback? Why not?',
    ],
    related: ['promises', 'async-ui-states', 'event-loop'],
  },
  {
    id: 'referential-equality',
    title: 'Object references & referential equality',
    area: 'JavaScript',
    summary: 'Objects, arrays and functions are compared by identity, so two structurally identical values are not equal unless they are the same reference.',
    definition: `Variables holding objects hold a **reference** to a heap value. \`===\`, \`Object.is\`, \`Map\`/\`Set\` keys and React dependency arrays all compare objects by **identity**, never by structure.`,
    whyItExists: `Identity comparison is O(1) and well-defined even for cyclic or mutable data. Deep comparison is expensive, ambiguous (prototype? non-enumerable keys? order?) and can be invalidated by mutation at any time.`,
    mechanism: `- Assignment and argument passing copy the reference ("call by sharing"); mutating through any alias is visible through all.
- Every evaluation of an object literal, array literal, arrow function or \`.bind\` creates a **new** identity.
- React uses \`Object.is\` to decide whether state changed (bail-out), whether effect/memo dependencies changed, and \`React.memo\` shallow-compares props key by key with \`Object.is\`.
- Immutable update patterns exploit this: if a sub-tree is unchanged its reference is reused, so identity checks become cheap "did anything change?" checks.`,
    example: `A parent renders \`<Chart options={{ animate: true }} />\`. \`Chart\` is wrapped in \`React.memo\` and has \`useEffect(() => init(options), [options])\`. Because the literal creates a new object every render, the memo never hits and the chart re-initialises on every parent render.`,
    codeWalkthrough: `~~~js
const a = { x: 1 };
const b = { x: 1 };
const c = a;
a === b;          // false — different identities
a === c;          // true  — same reference
c.x = 2;
a.x;              // 2     — mutation visible via alias

const cache = new Map();
cache.set({ id: 1 }, 'v');
cache.get({ id: 1 }); // undefined — new key object
~~~

1. Structural equality is irrelevant to \`===\`.
2. \`c\` is an alias, so mutation through it changes \`a\`.
3. Object keys in a \`Map\` are matched by identity; use a stable key (\`id\`) or the same object.`,
    misconceptions: [
      'JavaScript passes objects by reference — it passes references by value; reassigning a parameter does not affect the caller.',
      '`Object.freeze` makes data deeply immutable — it is shallow.',
      '`useMemo` everywhere fixes identity problems — it only helps if every dependency is itself stable.',
    ],
    failureCases: [
      'An effect depending on an inline object or function runs every render and refetches in a loop when it also sets state.',
      'Mutating an array in place and calling `setItems(items)` — same reference, so React bails out and the UI does not update.',
      'A context provider value `{ user, logout }` created inline re-renders every consumer on each provider render.',
    ],
    productionImplications: `Design props and context values to be referentially stable (hoist constants, \`useMemo\`/\`useCallback\` for values consumed by memoised children or effects). Prefer primitive dependencies (\`options.id\`) over objects. Never mutate state in place; return new references for changed paths only.`,
    docSourceIds: ['mdn-object-is', 'react-updating-objects'],
    interviewQuestions: [
      'Why does `[] === []` return false while `Object.is(NaN, NaN)` returns true?',
      'How does React decide whether a `useEffect` should re-run?',
      'Explain "pass by sharing" with an example where reassignment and mutation behave differently.',
      'When is `useCallback` actually useful, and when is it noise?',
    ],
    related: ['immutable-updates', 'coercion-equality', 'react-effects', 'react-state-batching'],
  },
  {
    id: 'currying',
    title: 'Currying & partial application',
    area: 'JavaScript',
    summary: 'Currying turns an n-ary function into a chain of unary (or fewer-argument) calls that accumulate arguments in closures until enough are supplied.',
    definition: `**Currying** transforms \`f(a, b, c)\` into \`f(a)(b)(c)\`. **Partial application** fixes some arguments and returns a function of the rest (\`f.bind(null, a)\`). JavaScript "curry" utilities are usually a hybrid: they accept any number of arguments per call until \`fn.length\` are collected.`,
    whyItExists: `It enables point-free composition and configuration-first APIs — e.g. \`const logError = log('error')\` — and lets generic helpers (\`map\`, \`filter\`) receive pre-configured callbacks.`,
    mechanism: `A generic \`curry\` returns a function that closes over the arguments collected so far. On each call it concatenates new arguments; if the total reaches the target arity it invokes the original function, otherwise it returns another collector. Arity is typically read from \`fn.length\`, which counts parameters **before** the first default value or rest parameter — so \`(a, b = 1) => …\` has length 1 and \`(...args) => …\` has length 0.

Each partially applied function must have its **own** argument list; sharing one mutable array between branches is a classic bug.`,
    example: `An analytics module exposes \`track(category)(action)(payload)\`. A feature creates \`const trackCart = track('cart')\` once and reuses it in many handlers, keeping call sites short and consistent.`,
    codeWalkthrough: `~~~js
function curry(fn, arity = fn.length) {
  return function curried(...args) {
    if (args.length >= arity) return fn.apply(this, args);
    return (...more) => curried.apply(this, [...args, ...more]);
  };
}
const add3 = curry((a, b, c) => a + b + c);
add3(1)(2)(3);   // 6
add3(1, 2)(3);   // 6
const add1 = add3(1);
add1(10)(10);    // 21
add1(20)(20);    // 41 — branches are independent
~~~

1. \`curried\` checks whether enough arguments have arrived.
2. Each intermediate call creates a new array (\`[...args, ...more]\`) — no shared mutation, so \`add1\` can be reused.
3. \`this\` is forwarded so curried methods still work.
4. An explicit \`arity\` parameter handles functions with defaults or rest parameters.`,
    misconceptions: [
      'Currying and partial application are the same thing — currying produces a chain of single-argument functions; partial application fixes some arguments once.',
      '`fn.length` is the total number of parameters — it stops at the first default or rest parameter.',
      'Curried functions are slower in any meaningful way — the overhead is extra closures, rarely relevant outside hot loops.',
    ],
    failureCases: [
      'A curry implementation pushes into a shared `args` array, so reusing a partially applied function accumulates arguments from previous calls.',
      'Currying a function with a default parameter invokes it too early because `fn.length` under-reports the arity.',
      'Losing `this` when currying an object method because the implementation uses arrow functions at the top level.',
    ],
    productionImplications: `Use currying where it improves call-site readability (configuration-first factories, selector builders); avoid deep currying in public APIs because stack traces and TypeScript inference get harder. Typing variadic curry needs recursive conditional types.`,
    docSourceIds: ['mdn-closures'],
    interviewQuestions: [
      'Implement `curry(fn)` supporting multiple arguments per call.',
      'Extend it to support placeholders like `curry.placeholder`.',
      'How would you type a generic `curry` in TypeScript?',
      'What does `fn.length` return for default and rest parameters?',
    ],
    related: ['closures', 'this-binding', 'generics'],
  },
  {
    id: 'observer-pattern',
    title: 'Observer / pub-sub pattern',
    area: 'JavaScript',
    summary: 'A subject keeps a list of subscribers and notifies them on change; subscribe returns an unsubscribe function so consumers control their lifetime.',
    definition: `The **observer pattern** decouples a producer of events (subject, store, event emitter) from consumers (listeners). Consumers register a callback; the subject calls every registered callback when something happens.`,
    whyItExists: `It lets independent parts of an app react to shared state or events without direct dependencies — DOM \`EventTarget\`, Redux/Zustand stores, WebSocket feeds and React's \`useSyncExternalStore\` all rely on it.`,
    mechanism: `Core pieces: a collection of listeners (usually a \`Set\` for O(1) add/remove and dedupe), \`subscribe(listener)\` that returns an \`unsubscribe\` closure, and \`emit(payload)\`.

Subtle behaviours a senior implementation handles:

- **Mutation during emit**: \`Set\` iteration visits entries added during iteration and skips entries removed before being reached. Iterate over a **snapshot** (\`[...listeners]\`) for predictable semantics.
- **Error isolation**: one throwing listener should not prevent others from running (catch and report, or rethrow after the loop).
- **Re-entrancy**: a listener that emits again can cause recursion; queue nested emits if ordering matters.
- **Lifetime**: every subscribe must be paired with an unsubscribe (effect cleanup, \`AbortSignal\`).`,
    example: `A notification store exposes \`subscribe\`/\`getSnapshot\`. A React toast component uses \`useSyncExternalStore(store.subscribe, store.getSnapshot)\`, and the store's unsubscribe is called automatically when the component unmounts.`,
    codeWalkthrough: `~~~js
function createEmitter() {
  const listeners = new Set();
  return {
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    emit(payload) {
      for (const fn of [...listeners]) {
        try { fn(payload); }
        catch (err) { queueMicrotask(() => { throw err; }); }
      }
    },
  };
}
~~~

1. A \`Set\` prevents registering the same function twice.
2. The returned closure is the only handle needed for cleanup.
3. \`[...listeners]\` snapshots the list, so unsubscribing or subscribing inside a listener does not affect the current emit.
4. Errors are rethrown asynchronously so they reach global error reporting without stopping other listeners.`,
    misconceptions: [
      'Observers are notified asynchronously — basic emitters (and DOM `dispatchEvent`) call listeners synchronously.',
      'Using a `Set` makes iteration safe against mutation — `Set` iteration still observes additions made during the loop.',
      'Unsubscribing is optional because listeners are garbage-collected — the subject keeps them reachable.',
    ],
    failureCases: [
      'A component subscribes in `useEffect` without returning the unsubscribe; each remount adds another listener and handlers fire multiple times.',
      'A listener that unsubscribes itself during emit causes the next listener to be skipped with array-splice implementations.',
      'One listener throws and all later listeners never run, leaving parts of the UI out of sync.',
    ],
    productionImplications: `Prefer \`useSyncExternalStore\` for subscribing React to external stores (it avoids tearing in concurrent rendering). Always expose a cleanup handle, snapshot listener lists, isolate listener errors, and consider \`AbortSignal\` support (\`addEventListener(..., { signal })\`) for bulk cleanup.`,
    docSourceIds: ['mdn-addeventlistener', 'mdn-map'],
    interviewQuestions: [
      'Implement an EventEmitter with `on`, `off`, `once` and `emit`.',
      'What should happen if a listener unsubscribes another listener during emit?',
      'How would you integrate a custom store with React without tearing?',
      'How do you prevent one faulty listener from breaking the others?',
    ],
    related: ['closures', 'react-effects', 'abort-controller', 'event-delegation'],
  },
  // ───────────────────────────── Async ─────────────────────────────
  {
    id: 'event-loop',
    title: 'Event loop, tasks & microtasks',
    area: 'Async',
    summary: 'The browser runs one task at a time, drains the entire microtask queue after each task, and only then may render.',
    definition: `The **event loop** is the HTML-defined processing model that schedules JavaScript on a single thread. Work is queued as **tasks** (timers, input events, message events, network callbacks) or **microtasks** (promise reactions, \`queueMicrotask\`, \`MutationObserver\` callbacks).`,
    whyItExists: `The DOM is not thread-safe, so script execution, event dispatch and rendering are serialised on the main thread. Microtasks were added so that work like promise reactions can run "as soon as the current script finishes" without waiting behind other tasks or a render.`,
    mechanism: `Simplified loop iteration (HTML standard):

1. Pick the oldest runnable **task** from one of the task queues (the browser may prioritise between queues, e.g. input over timers) and run it to completion.
2. **Perform a microtask checkpoint**: run microtasks until the queue is empty — including microtasks queued *by* microtasks.
3. If it is time to update the rendering: run \`requestAnimationFrame\` callbacks, recalc style, layout, paint.
4. Repeat.

Consequences: \`setTimeout(fn, 0)\` is a task and always runs **after** all currently queued microtasks; a microtask that keeps queuing microtasks starves rendering and input; a long task delays both. Nested timers are clamped to ≥4 ms after 5 levels, and background tabs throttle timers further. Every \`await\` continuation is a microtask.`,
    example: `A component sets loading UI, then does a CPU-heavy sort synchronously in the same click handler. Because rendering only happens between tasks, the spinner never appears — the browser cannot paint until the handler returns.`,
    codeWalkthrough: `~~~js
console.log('1 sync');
setTimeout(() => console.log('5 task'), 0);
Promise.resolve().then(() => {
  console.log('3 microtask');
  queueMicrotask(() => console.log('4 nested microtask'));
});
(async () => {
  console.log('2 async fn body (sync)');
})();
~~~

Output: \`1 sync\`, \`2 async fn body (sync)\`, \`3 microtask\`, \`4 nested microtask\`, \`5 task\`.

1. Synchronous code, including the body of an async function up to its first \`await\`, runs first.
2. After the script task finishes, the microtask checkpoint runs \`3\`, and also \`4\` because it was queued during the checkpoint.
3. The timer callback is a separate task, so it runs last even with delay \`0\`.`,
    misconceptions: [
      '`setTimeout(fn, 0)` runs immediately after the current line — it is a task that waits for the current task and all microtasks.',
      'Microtasks interleave with tasks one at a time — the whole microtask queue is drained after each task.',
      'Promises make code run in parallel — reactions still run on the same thread, just later.',
      'The browser renders after every task — rendering opportunities are typically aligned with the display refresh, and may be skipped.',
    ],
    failureCases: [
      'A recursive `Promise.resolve().then(loop)` poller freezes the tab because rendering and input never get a turn.',
      'A long synchronous JSON parse inside an input handler causes poor INP (interaction to next paint).',
      'Tests assume a `setTimeout(0)` callback has run after `await Promise.resolve()`; it has not.',
    ],
    productionImplications: `Break long work into chunks that yield to the event loop (a \`setTimeout\`/\`scheduler.yield()\`-based yield, not a microtask) to keep interactions responsive. Use \`requestAnimationFrame\` for visual updates and Web Workers for CPU-heavy work. When debugging ordering, classify each callback as sync, microtask or task.`,
    docSourceIds: ['mdn-event-loop', 'mdn-microtask', 'mdn-settimeout'],
    interviewQuestions: [
      'Predict the output ordering of a snippet mixing sync logs, promises, `queueMicrotask`, `setTimeout` and `async/await`.',
      'Why can microtasks starve rendering while tasks cannot?',
      'Where do `requestAnimationFrame` callbacks fit in the loop?',
      'How would you split a 500 ms computation so the page stays responsive?',
    ],
    related: ['promises', 'debouncing', 'fake-timers', 'react-state-batching'],
  },
  {
    id: 'promises',
    title: 'Promises',
    area: 'Async',
    summary: 'A promise is a one-shot, immutable-once-settled placeholder for an async result whose `then` callbacks always run as microtasks.',
    definition: `A **Promise** is an object in one of three states — *pending*, *fulfilled* or *rejected* — that transitions at most once. \`then\`/\`catch\`/\`finally\` register reactions and always return a **new** promise, enabling chaining.`,
    whyItExists: `Callbacks compose poorly (pyramid of doom, inconsistent sync/async invocation, error propagation by hand). Promises standardise async results: errors propagate down the chain, reactions are always asynchronous ("Zalgo"-free), and \`async/await\` is built on them.`,
    mechanism: `- The **executor** passed to \`new Promise\` runs **synchronously**; throwing inside it rejects the promise.
- \`resolve(x)\` with a non-thenable fulfils; with a thenable (another promise) it **adopts** that thenable's eventual state, which costs extra microtask ticks.
- Once settled, later \`resolve\`/\`reject\` calls are ignored.
- Each \`then(onFulfilled, onRejected)\` reaction is queued as a microtask when the promise settles (or immediately if already settled). The returned promise resolves with the handler's return value or rejects with what it throws.
- A rejection with no handler attached by the end of the microtask checkpoint fires \`unhandledrejection\`.
- \`await v\` is roughly \`Promise.resolve(v).then(continuation)\`.`,
    example: `A save button calls \`api.save().then(showToast).catch(reportError)\`. If \`showToast\` throws, the \`catch\` also handles that error, because \`catch\` is attached to the promise returned by \`then\` — not to the original request.`,
    codeWalkthrough: `~~~js
const p = new Promise((resolve) => {
  console.log('executor');   // runs synchronously
  resolve(1);
  resolve(2);                // ignored
});
p.then((v) => { console.log('then', v); return v * 2; })
 .then((v) => { throw new Error('bad ' + v); })
 .catch((e) => console.log(e.message))
 .finally(() => console.log('done'));
console.log('sync end');
~~~

Output: \`executor\`, \`sync end\`, \`then 1\`, \`bad 2\`, \`done\`.

1. The executor runs before \`new Promise\` returns.
2. The second \`resolve\` has no effect.
3. Returning a value fulfils the next promise; throwing rejects it.
4. \`finally\` receives no argument and passes through the previous outcome unless it throws.`,
    misconceptions: [
      'The executor runs asynchronously — it runs synchronously; only reactions are deferred.',
      '`then(a, b)` is equivalent to `then(a).catch(b)` — with the two-argument form, `b` does not catch errors thrown by `a`.',
      'Promises can be cancelled — a promise has no cancel API; cancellation is modelled with `AbortSignal` at the operation level.',
    ],
    failureCases: [
      'Forgetting to `return` a promise inside `then` breaks the chain, so errors from the inner request are unhandled and ordering is lost.',
      'Wrapping an already-promise-returning API in `new Promise` (the "explicit construction antipattern") swallows rejections thrown before `resolve`.',
      'An `async` event handler with no `try/catch` produces unhandled rejections that never reach the UI error state.',
    ],
    productionImplications: `Always return or await promises, attach a terminal error handler at entry points, and listen for \`unhandledrejection\` in monitoring. Understand that promise reactions are microtasks — a long chain of already-resolved promises still blocks rendering until it finishes.`,
    docSourceIds: ['mdn-microtask', 'mdn-promise-all'],
    interviewQuestions: [
      'Implement a minimal Promise with `then` chaining and thenable adoption.',
      'What is the difference between `then(a, b)` and `then(a).catch(b)`?',
      'Why does resolving with another promise take extra ticks?',
      'When is `unhandledrejection` fired?',
    ],
    related: ['event-loop', 'promise-combinators', 'exceptions-finally', 'abort-controller'],
  },
  {
    id: 'promise-combinators',
    title: 'Promise combinators',
    area: 'Async',
    summary: '`Promise.all`, `allSettled`, `race` and `any` combine many promises with different short-circuit and failure semantics.',
    definition: `Static methods that take an iterable and return one promise:

| Method | Fulfils when | Rejects when | Empty iterable |
|---|---|---|---|
| \`all\` | all fulfil (values in input order) | first rejection | fulfils with \`[]\` |
| \`allSettled\` | all settle (\`{status, value \\| reason}\`) | never (except iteration errors) | fulfils with \`[]\` |
| \`race\` | first to settle fulfils | first to settle rejects | stays pending forever |
| \`any\` | first fulfilment | all reject → \`AggregateError\` with \`.errors\` | rejects with \`AggregateError\` |`,
    whyItExists: `Coordinating concurrent work is common: load several resources in parallel, take the fastest mirror, show partial results. Combinators provide well-defined semantics instead of hand-rolled counters.`,
    mechanism: `Each element is passed through \`Promise.resolve\` (so plain values and thenables work), then a reaction is attached. \`all\` keeps a results array indexed by **input position** and a remaining counter; when the counter reaches zero it resolves. The first rejection rejects the combined promise, but the **other operations keep running** — combinators do not cancel. \`any\` mirrors this with an errors array and rejects with \`AggregateError\` only when all inputs reject.`,
    example: `A dashboard loads user, permissions and feature flags with \`Promise.all\`. If feature flags are optional, using \`allSettled\` lets the page render with defaults instead of failing entirely when that one endpoint is down.`,
    codeWalkthrough: `~~~js
function promiseAll(iterable) {
  return new Promise((resolve, reject) => {
    const items = Array.from(iterable);
    const results = new Array(items.length);
    let remaining = items.length;
    if (remaining === 0) return resolve(results);
    items.forEach((item, i) => {
      Promise.resolve(item).then((value) => {
        results[i] = value;
        if (--remaining === 0) resolve(results);
      }, reject);
    });
  });
}
~~~

1. \`Array.from\` supports any iterable, not only arrays.
2. Results are written by **index**, so output order matches input order regardless of completion order.
3. Empty input resolves immediately with \`[]\`.
4. \`reject\` is passed directly; later rejections are ignored because a promise settles only once.`,
    misconceptions: [
      '`Promise.all` cancels the remaining operations on failure — they keep running; you need `AbortController` to stop them.',
      '`Promise.race` is the same as `Promise.any` — `race` settles with the first settlement, including rejection.',
      '`Promise.all` results are in completion order — they are in input order.',
      '`Promise.any` rejects with the last error — it rejects with an `AggregateError` containing all errors.',
    ],
    failureCases: [
      'A timeout implemented with `Promise.race` leaves the slow request running and its later `then` still updates state.',
      '`Promise.race([])` used with a dynamically empty list hangs forever.',
      'Firing 500 requests via `Promise.all(ids.map(fetch))` overwhelms the server; a concurrency limiter was needed.',
    ],
    productionImplications: `Pick the combinator that matches the product requirement (all-or-nothing vs. partial results vs. fastest). Pair timeouts with \`AbortSignal.timeout()\` or \`AbortSignal.any()\` so losing operations are actually cancelled, and bound concurrency for large fan-outs.`,
    docSourceIds: ['mdn-promise-all', 'mdn-abortcontroller'],
    interviewQuestions: [
      'Implement `Promise.all` and `Promise.allSettled` from scratch.',
      'What does `Promise.any` reject with, and when?',
      'Implement a `promisePool(tasks, limit)` concurrency limiter.',
      'Why is `Promise.race` an incomplete timeout solution?',
    ],
    related: ['promises', 'abort-controller', 'race-conditions'],
  },
  {
    id: 'debouncing',
    title: 'Debounce & throttle',
    area: 'Performance',
    summary: 'Debounce delays a call until input has been quiet for N ms; throttle allows at most one call per N ms window.',
    definition: `**Debounce**: collapse a burst of calls into one, executed after \`wait\` ms with no new calls (trailing), or at the start of the burst (leading). **Throttle**: execute at most once per \`wait\` ms, regardless of how many calls arrive, typically with leading and trailing invocations.`,
    whyItExists: `High-frequency events — \`input\`, \`scroll\`, \`resize\`, \`pointermove\` — can fire dozens of times per second. Running expensive work (network requests, layout reads, re-renders) on each event wastes resources and causes jank or API rate-limit errors.`,
    mechanism: `Both are closures over timer state.

- **Debounce (trailing)**: each call clears the pending timer and schedules a new one with the latest arguments and \`this\`. Only the last call of a burst fires.
- **Leading debounce**: fire immediately if no timer is pending, then ignore calls until \`wait\` ms of silence.
- **Throttle**: record the last execution time; if \`now - last >= wait\` run immediately, otherwise remember the latest arguments and schedule a trailing call for the remaining time.

Production-grade versions expose \`cancel()\` and \`flush()\`, and sometimes \`maxWait\` (a debounce that is guaranteed to run at least every \`maxWait\` ms — effectively a throttle).`,
    example: `A typeahead debounces search requests by 300 ms so typing "react" sends one request instead of five. A scroll-linked "back to top" button throttles its visibility check to every 100 ms so it still updates while the user scrolls.`,
    codeWalkthrough: `~~~js
function debounce(fn, wait) {
  let timer;
  function debounced(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      fn.apply(this, args);
    }, wait);
  }
  debounced.cancel = () => { clearTimeout(timer); timer = undefined; };
  return debounced;
}
~~~

1. \`timer\` lives in the closure and is shared by all calls to the same \`debounced\` instance.
2. \`clearTimeout\` + \`setTimeout\` restarts the quiet period on every call.
3. The arrow function inside \`setTimeout\` keeps the caller's \`this\` and the latest \`args\`.
4. \`cancel\` lets callers drop a pending call — essential on component unmount.`,
    misconceptions: [
      'Debounce and throttle are interchangeable — debounce may never fire during continuous input; throttle guarantees periodic execution.',
      'Debouncing a fetch prevents out-of-order responses — it reduces requests but responses can still arrive out of order.',
      'Creating `debounce(fn)` inside a React render is fine — a new instance per render means a new timer per render, so nothing is debounced.',
    ],
    failureCases: [
      'A debounced autosave is not flushed on page unload or unmount, losing the user\'s last edits.',
      'A debounced handler reads `event.target.value` after React or the browser has reused/changed the target; capture the value synchronously.',
      'A debounced callback created with `useCallback` but depending on changing state is recreated each keystroke, resetting the timer state.',
    ],
    productionImplications: `In React, create the debounced function once (\`useMemo\`/\`useRef\`) and call it with a ref to the latest callback; cancel on unmount. Combine with request cancellation or latest-request tracking. Prefer \`requestAnimationFrame\` throttling for purely visual updates.`,
    docSourceIds: ['mdn-debounce', 'mdn-settimeout'],
    interviewQuestions: [
      'Implement debounce with `leading`, `trailing`, `cancel` and `flush`.',
      'Implement throttle that guarantees a trailing call with the latest arguments.',
      'When would you choose throttle over debounce for a search box?',
      'How do you use a debounced function correctly inside a React component?',
    ],
    related: ['closures', 'event-loop', 'race-conditions', 'fake-timers'],
  },
  {
    id: 'abort-controller',
    title: 'Cancelling async work with AbortController',
    area: 'Async',
    summary: '`AbortController` creates an `AbortSignal` that APIs like `fetch` observe; calling `abort()` signals cancellation and rejects pending operations.',
    definition: `\`AbortController\` is a DOM API with a \`signal\` property (\`AbortSignal\`) and an \`abort(reason?)\` method. Abortable operations accept the signal and stop work when it fires its \`abort\` event.`,
    whyItExists: `Promises have no built-in cancellation. UIs constantly start work that becomes irrelevant — the user types another query, navigates away or closes a dialog. A standard signal object lets cancellation flow through \`fetch\`, event listeners, streams and your own code.`,
    mechanism: `- \`controller.abort(reason)\` sets \`signal.aborted = true\`, sets \`signal.reason\` (default: a \`DOMException\` named \`'AbortError'\`), and dispatches \`abort\` on the signal. Calling it again is a no-op.
- \`fetch(url, { signal })\` rejects with the signal's reason — by default the \`AbortError\` \`DOMException\` — whether aborted before the request, during it, or while reading the body.
- \`signal.throwIfAborted()\` throws the reason; useful at checkpoints in custom async code.
- \`AbortSignal.timeout(ms)\` returns a signal that aborts with a \`'TimeoutError'\` \`DOMException\`; \`AbortSignal.any([s1, s2])\` aborts when any input does.
- \`addEventListener(type, fn, { signal })\` removes the listener on abort — handy for bulk cleanup.
- A controller is single-use: create a new one per operation.`,
    example: `In a React effect that fetches search results, the cleanup calls \`controller.abort()\`. When the query changes, the previous request is cancelled at the network level and its rejection is ignored because \`err.name === 'AbortError'\`.`,
    codeWalkthrough: `~~~js
useEffect(() => {
  const controller = new AbortController();
  setStatus('loading');
  fetch('/api/search?q=' + encodeURIComponent(query), { signal: controller.signal })
    .then((r) => r.json())
    .then((data) => { setResults(data); setStatus('success'); })
    .catch((err) => {
      if (err.name === 'AbortError') return; // expected cancellation
      setStatus('error');
    });
  return () => controller.abort();
}, [query]);
~~~

1. One controller per effect run — controllers cannot be reset.
2. The signal is passed into \`fetch\`; aborting also cancels reading the body in \`r.json()\`.
3. Abort errors are filtered so cancellation is not shown as a failure.
4. React runs the cleanup before the next effect and on unmount, so only the latest request can update state.`,
    misconceptions: [
      'Aborting resolves the fetch with an empty response — it rejects (by default with a `DOMException` named `AbortError`).',
      '`abort()` stops the server from processing the request — it only cancels the client side; the server may have already acted.',
      'You can reuse a controller after aborting — once aborted, its signal stays aborted forever.',
    ],
    failureCases: [
      'A shared module-level controller is aborted once, so every later request using its signal fails immediately.',
      'Abort errors are reported to monitoring as failures, flooding dashboards with noise.',
      'A custom async function ignores the signal, so cancelling the UI still leaves an expensive loop running.',
    ],
    productionImplications: `Thread \`signal\` through your data layer (fetch wrappers, retries, polling loops). Treat \`AbortError\` as a non-error, and remember that for mutations (POST/PUT) cancellation does not mean the server did not apply the change — design for idempotency.`,
    docSourceIds: ['mdn-abortcontroller'],
    interviewQuestions: [
      'What does `fetch` do when its signal is aborted, and what value does it reject with?',
      'How do you implement a request timeout that also cancels the request?',
      'How would you make your own async utility abortable?',
      'Why is aborting a POST request not a rollback?',
    ],
    related: ['race-conditions', 'react-effects', 'promise-combinators', 'async-ui-states'],
  },
  {
    id: 'race-conditions',
    title: 'Stale responses & async race conditions in UIs',
    area: 'Async',
    summary: 'When multiple async requests overlap, responses can arrive out of order, so the UI must ensure only the latest relevant response is applied.',
    definition: `A **UI race condition** occurs when the outcome depends on the timing of async operations: e.g. request A (older) resolves after request B (newer) and overwrites B's correct data with stale data.`,
    whyItExists: `Network latency is variable and caches, retries and server load reorder responses. Any UI that issues requests in response to changing input — typeahead, pagination, tab switching, route params — must decide which response "wins".`,
    mechanism: `Three standard strategies:

1. **Ignore stale results** — keep an \`ignore\` flag (React effect cleanup sets it) or a monotonically increasing request id; apply a response only if it is still current.
2. **Cancel** — abort the previous request with \`AbortController\` so its promise rejects with \`AbortError\`. Saves bandwidth, and also prevents stale application.
3. **Serialise / queue** — for mutations, chain operations so they apply in order, or use optimistic updates with server versioning.

Note: cancellation alone may not be enough if work continues after the fetch (e.g. a second await); the "is this still the latest?" check must happen right before committing state.`,
    example: `A user types "rea" then "react". The request for "rea" is slower and returns last, so the list shows results for "rea" while the input says "react". With an \`ignore\` flag in the effect cleanup, the "rea" response is discarded.`,
    codeWalkthrough: `~~~js
useEffect(() => {
  let ignore = false;
  searchApi(query).then((results) => {
    if (!ignore) setResults(results);
  });
  return () => { ignore = true; };
}, [query]);

// Outside React: latest-request id
let latest = 0;
async function load(q) {
  const id = ++latest;
  const data = await searchApi(q);
  if (id === latest) render(data);
}
~~~

1. Each effect run has its own \`ignore\` binding captured by the \`then\` closure.
2. When \`query\` changes, React runs the cleanup for the previous run, marking its response stale.
3. The id pattern works anywhere: only the response whose id still equals \`latest\` is rendered.
4. Combine with \`AbortController\` to also cancel the network request.`,
    misconceptions: [
      'Debouncing eliminates race conditions — it reduces the number of requests but overlapping requests can still resolve out of order.',
      'JavaScript is single-threaded so races cannot happen — interleaving of async continuations is enough to cause them.',
      '`Promise.race` solves stale responses — it picks the fastest, not the latest.',
    ],
    failureCases: [
      'Switching quickly between product tabs shows the previous product\'s details because its slower response arrived last.',
      'A pagination component shows page 2 data with page 3 highlighted after rapid clicks.',
      'Two concurrent "toggle favourite" requests complete in reverse order and leave the server in the wrong state.',
    ],
    productionImplications: `Data libraries (React Query, SWR, RTK Query) key requests by parameters and discard stale results — understand that mechanism before hand-rolling fetching. For mutations, use idempotent APIs, request ordering, or version checks; for reads, prefer cancel + ignore.`,
    docSourceIds: ['react-sync-effects', 'mdn-abortcontroller'],
    interviewQuestions: [
      'How do you prevent an older response from overwriting a newer one in a typeahead?',
      'Compare the ignore-flag, request-id and AbortController approaches.',
      'Do Strict Mode double effects interact with these patterns? How?',
      'How do you handle races for mutations, not just reads?',
    ],
    related: ['abort-controller', 'react-effects', 'debouncing', 'async-ui-states', 'closures'],
  },
  {
    id: 'async-ui-states',
    title: 'Loading, empty, error & success states',
    area: 'React',
    summary: 'Every async view should model its states explicitly — idle, loading, success (with or without data), and error — instead of juggling independent booleans.',
    definition: `**Async UI state modelling** represents the lifecycle of a request as a finite set of mutually exclusive states, usually a discriminated union, and renders a deliberate UI for each: skeleton/spinner, empty state, error with retry, and data.`,
    whyItExists: `Independent flags (\`isLoading\`, \`error\`, \`data\`) allow impossible combinations — loading *and* error, or success with stale error — that produce flickering, contradictory UIs. Explicit states make the UI predictable and testable.`,
    mechanism: `A common model:

~~~ts
type State<T> =
  | { status: 'idle' }
  | { status: 'loading'; previous?: T }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error; previous?: T };
~~~

Transitions happen in one place (reducer or effect): \`loading\` on start, \`success\`/\`error\` on settle, ignoring stale or aborted responses. **Empty** is usually a rendering decision on \`success\` (\`data.length === 0\`), not a separate network state. Keeping \`previous\` data while refetching avoids blanking the screen.

Accessibility: announce status changes via a live region (\`role="status"\` for loading/result counts, \`role="alert"\` for errors), and keep focus stable when content swaps.`,
    example: `A search results panel shows a skeleton on first load, keeps old results dimmed while a new query loads, shows "No results for 'xyz'" for empty success, and an inline error with a Retry button that re-issues the last query.`,
    codeWalkthrough: `~~~tsx
function Results({ state, onRetry }: { state: State<Item[]>; onRetry(): void }) {
  switch (state.status) {
    case 'idle':    return null;
    case 'loading': return <Skeleton aria-busy="true" />;
    case 'error':   return (
      <div role="alert">
        Could not load results. <button onClick={onRetry}>Retry</button>
      </div>);
    case 'success':
      return state.data.length === 0
        ? <p role="status">No results</p>
        : <List items={state.data} />;
  }
}
~~~

1. \`switch\` on the discriminant narrows \`state\`, so \`state.data\` is only accessible in \`success\`.
2. Empty is derived from success, not stored separately.
3. Errors use \`role="alert"\` so screen readers announce them; retry is a real button.
4. With \`noFallthroughCasesInSwitch\` and exhaustive types, adding a new status forces this component to handle it.`,
    misconceptions: [
      'A spinner is a sufficient loading state — skeletons, preserved stale data, and delayed spinners (to avoid flashes) often give a better experience.',
      'Empty results are an error — they are a successful response that needs its own UI.',
      'An `error` flag can be left set when a new request starts — stale errors next to fresh data confuse users.',
    ],
    failureCases: [
      'A list shows "No results" for a split second before data arrives because initial state was `[]` with no loading state.',
      'After a failed request and a successful retry, the error banner remains because `error` was never cleared.',
      'A spinner flashes for 50 ms on every fast request, causing visual noise and layout shift.',
    ],
    productionImplications: `Model states with a discriminated union or reducer, test each state explicitly, and design them with product/UX up front. Consider React Suspense/error boundaries or a data library for consistency, and always handle cancellation so aborted requests do not flip state to \`error\`.`,
    docSourceIds: ['react-sync-effects', 'ts-narrowing'],
    interviewQuestions: [
      'How would you model async state to make impossible states unrepresentable?',
      'How do you keep previous results visible while refetching?',
      'How should loading and error states be announced to assistive technology?',
      'How do you avoid spinner flashes on fast networks?',
    ],
    related: ['discriminated-unions', 'race-conditions', 'abort-controller', 'react-effects'],
  },
  // ───────────────────────────── DOM & Accessibility ─────────────────────────────
  {
    id: 'event-propagation',
    title: 'Event propagation: capture, target, bubble',
    area: 'DOM & Browser',
    summary: 'A dispatched DOM event travels from the window down to the target (capture), fires at the target, then travels back up (bubble) if it bubbles.',
    definition: `**Event propagation** is the path an event takes through the DOM. The propagation path is computed once at dispatch time from the target's ancestors, and listeners run in three phases: **capturing**, **at target**, **bubbling**.`,
    whyItExists: `It lets ancestors observe or intercept events from descendants — enabling delegation, global shortcuts, click-outside detection and analytics — without attaching listeners to every node.`,
    mechanism: `1. **Path**: computed at dispatch from target to window (including shadow-root retargeting). Moving nodes during dispatch does not change it.
2. **Capture**: listeners registered with \`{ capture: true }\` run from \`window\` down to the target's parent.
3. **Target**: listeners on the target itself run; current browsers run its capturing listeners before non-capturing ones.
4. **Bubble**: if \`event.bubbles\`, non-capture listeners run from the parent up to \`window\`.

Control: \`stopPropagation()\` stops further nodes (other listeners on the *current* node still run); \`stopImmediatePropagation()\` also skips remaining listeners on the current node; \`preventDefault()\` cancels the default action (if \`cancelable\`) and is **independent** of propagation. \`event.target\` is the originating node; \`event.currentTarget\` is the node whose listener is running. Some events do not bubble (\`focus\`, \`blur\`, \`mouseenter\`, \`mouseleave\`); use \`focusin\`/\`focusout\` for delegation.`,
    example: `A dropdown closes on "click outside" with a \`document\` listener. A nested component calls \`stopPropagation()\` on its clicks, so the document listener never sees them and two dropdowns stay open at once. Registering the outside-click listener in the capture phase or checking \`event.composedPath()\` avoids depending on bubbling.`,
    codeWalkthrough: `~~~js
const log = (label) => (e) => console.log(label, e.eventPhase);
document.body.addEventListener('click', log('body capture'), { capture: true });
document.body.addEventListener('click', log('body bubble'));
button.addEventListener('click', log('button'));
button.addEventListener('click', (e) => e.stopPropagation());
button.click();
// body capture 1, button 2  (body bubble never runs)
~~~

1. \`eventPhase\` is 1 (capturing), 2 (at target) or 3 (bubbling).
2. The capture listener on \`body\` runs first, before the event reaches the button.
3. Both button listeners run — \`stopPropagation\` does not affect listeners on the same node.
4. The bubble listener on \`body\` is skipped.`,
    misconceptions: [
      '`stopPropagation` prevents the default action — that is `preventDefault`; they are independent.',
      'All events bubble — `focus`, `blur`, `mouseenter`, `mouseleave` and others do not.',
      '`event.target` is the element the listener is attached to — that is `currentTarget`.',
      'React synthetic events propagate through the real DOM tree only — React propagates through the React tree, including across portals.',
    ],
    failureCases: [
      'A modal\'s `stopPropagation` breaks analytics and click-outside handlers registered on `document`.',
      'A delegated `focus` listener never fires because `focus` does not bubble.',
      'A React portal\'s click bubbles to a parent `onClick` in the React tree even though the DOM parent differs, toggling the parent unexpectedly.',
    ],
    productionImplications: `Avoid \`stopPropagation\` as a general-purpose fix; prefer checking \`event.target\`/\`composedPath()\`. Use capture listeners for global behaviours that must not be blocked, \`passive: true\` for scroll/touch listeners, and remember React 17+ attaches its listeners at the root container.`,
    docSourceIds: ['mdn-event-bubbling', 'mdn-addeventlistener', 'mdn-stoppropagation'],
    interviewQuestions: [
      'Describe the three propagation phases and how to listen in each.',
      'What is the difference between `stopPropagation`, `stopImmediatePropagation` and `preventDefault`?',
      'How would you implement click-outside detection robustly?',
      'How do React portals affect event propagation?',
    ],
    related: ['event-delegation', 'focus-management', 'keyboard-navigation'],
  },
  {
    id: 'event-delegation',
    title: 'Event delegation',
    area: 'DOM & Browser',
    summary: 'Attach one listener to a common ancestor and use `event.target` to determine which descendant the event came from.',
    definition: `**Event delegation** relies on bubbling: instead of a listener per item, a single listener on a container inspects \`event.target\` (usually via \`closest()\`) to find the logical item that was interacted with.`,
    whyItExists: `Lists can have thousands of rows and change constantly. Per-item listeners cost memory, must be added/removed as items change, and are easy to leak. Delegation handles dynamic children automatically with one listener.`,
    mechanism: `1. The user clicks an inner node (e.g. an \`<svg>\` icon inside a button inside a row).
2. The event bubbles to the container's listener.
3. The handler calls \`event.target.closest('[data-action]')\` to find the nearest actionable ancestor.
4. It verifies the match is inside the container (\`container.contains(match)\`), because \`closest\` can walk past the container.
5. It reads data attributes (\`data-id\`, \`data-action\`) to decide what to do.

Non-bubbling events need their bubbling counterparts (\`focusin\`/\`focusout\`) or a capture listener. React itself uses delegation: since React 17 it attaches listeners to the root container, not \`document\`.`,
    example: `A todo list rendered with vanilla DOM has delete and toggle buttons in each row. One \`click\` listener on the \`<ul>\` handles both by reading \`data-action\` and \`data-id\`, so newly added todos work without extra wiring.`,
    codeWalkthrough: `~~~js
list.addEventListener('click', (event) => {
  const el = event.target instanceof Element
    ? event.target.closest('[data-action]')
    : null;
  if (!el || !list.contains(el)) return;
  const id = el.closest('li')?.dataset.id;
  if (el.dataset.action === 'delete') removeTodo(id);
  if (el.dataset.action === 'toggle') toggleTodo(id);
});
~~~

1. \`event.target\` may be a text node or SVG child; guarding with \`instanceof Element\` keeps \`closest\` safe.
2. \`closest\` walks up from the clicked node to the actionable element.
3. \`list.contains\` rejects matches found *outside* the container.
4. Actions are declared in markup, keeping the handler generic.`,
    misconceptions: [
      'Delegation means checking `event.target.matches(selector)` — the target is often a descendant of the element you care about; use `closest`.',
      'Delegation works for every event — non-bubbling events like `focus` require `focusin` or capture.',
      'Delegation is always faster — the handler runs for every event in the container; it trades listener count for per-event work.',
    ],
    failureCases: [
      'Clicking the icon inside a button does nothing because the handler compared `event.target` to the button.',
      'A nested container with the same `data-action` attributes triggers the outer handler for inner widgets.',
      'A child calls `stopPropagation`, silently disabling the delegated handler.',
    ],
    productionImplications: `Use delegation for large or dynamic lists in vanilla code and for cross-cutting concerns (analytics, link interception). Keep handlers small and scoped, and make sure delegated targets are still real interactive elements (buttons/links) for keyboard and screen reader access.`,
    docSourceIds: ['mdn-event-bubbling'],
    interviewQuestions: [
      'Implement delegation for a list where buttons contain icons.',
      'Why do you need `container.contains(match)` after `closest`?',
      'How do you delegate focus events?',
      'How does React use delegation internally and what changed in React 17?',
    ],
    related: ['event-propagation', 'this-binding', 'observer-pattern'],
  },
  {
    id: 'focus-management',
    title: 'Focus management',
    area: 'Accessibility',
    summary: 'Deliberately controlling where keyboard focus goes when UI appears, disappears or changes, so keyboard and screen reader users never lose their place.',
    definition: `**Focus management** is moving, containing and restoring DOM focus programmatically in response to UI changes: opening a dialog, deleting the focused item, route changes, or validation errors.`,
    whyItExists: `Keyboard and assistive-technology users operate from the focused element. If the focused element is removed, focus falls back to \`<body>\` and the user must start tabbing from the top. Visual users get context from layout; non-visual users need focus to carry it.`,
    mechanism: `Building blocks:

- **Focusability**: native controls are focusable; \`tabindex="0"\` adds an element to the tab order; \`tabindex="-1"\` makes it focusable by script only; positive \`tabindex\` values reorder the tab sequence and should be avoided.
- \`element.focus({ preventScroll })\` moves focus; \`document.activeElement\` reads it; \`focusin\`/\`focusout\` bubble.
- **Dialogs**: on open, move focus into the dialog (first field or the dialog itself); keep Tab inside (native \`<dialog>\` with \`showModal()\` or \`inert\` on the background); on close, **restore** focus to the invoking element.
- **Removal**: when deleting the focused item, move focus to a logical neighbour (next item, previous item, or the list heading).
- \`:focus-visible\` shows focus rings for keyboard users without showing them on mouse clicks.

In React, focus moves happen in effects or event handlers via refs, after the target exists in the DOM.`,
    example: `A user deletes a row in an editable table using the row's Delete button. The row unmounts, and without intervention focus jumps to \`<body>\`. The fix moves focus to the next row's Delete button (or the previous one if it was the last row).`,
    codeWalkthrough: `~~~tsx
function useRestoreFocus(open: boolean) {
  const returnTo = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!open) return;
    returnTo.current = document.activeElement as HTMLElement | null;
    return () => returnTo.current?.focus();
  }, [open]);
}
~~~

1. When the dialog opens, remember the element that had focus (the trigger).
2. The cleanup runs when \`open\` becomes false or the component unmounts.
3. Focus is restored to the trigger so the user continues where they were.
4. Pair this with moving focus *into* the dialog on open and containing it while open.`,
    misconceptions: [
      'Adding `tabindex="0"` to a div makes it accessible — it also needs a role, name and keyboard handling.',
      'Removing `outline` is fine if there is a hover style — keyboard users need a visible focus indicator.',
      'Positive `tabindex` values are a good way to fix tab order — they create a separate tab sequence that is hard to maintain; fix DOM order instead.',
    ],
    failureCases: [
      'Closing a modal leaves focus on `<body>`, so the next Tab jumps to the top of the page.',
      'A client-side route change keeps focus on the clicked link that no longer exists, and screen readers announce nothing.',
      'Form validation shows errors but leaves focus on the submit button, so screen reader users do not know what failed.',
    ],
    productionImplications: `Treat focus as application state: define where focus goes for each open/close/delete/navigate transition and test it with the keyboard and Testing Library (\`expect(el).toHaveFocus()\`). Prefer native \`<dialog>\` and \`inert\` over hand-rolled traps.`,
    docSourceIds: ['apg-tabs', 'apg-combobox', 'mdn-aria-activedescendant'],
    interviewQuestions: [
      'Where should focus go when a modal opens and closes?',
      'What happens to focus when the focused element is removed from the DOM, and how do you handle it?',
      'Explain the difference between `tabindex="0"`, `"-1"` and positive values.',
      'How do you handle focus after client-side navigation?',
    ],
    related: ['keyboard-navigation', 'combobox-aria', 'disclosure-accordion-aria', 'react-effects'],
  },
  {
    id: 'keyboard-navigation',
    title: 'Keyboard interaction & roving focus',
    area: 'Accessibility',
    summary: 'Composite widgets expose a single Tab stop and use arrow keys to move among their items, implemented with roving tabindex or aria-activedescendant.',
    definition: `**Keyboard navigation** in composite widgets (tabs, toolbars, menus, listboxes, trees, grids) follows the APG convention: **Tab** moves into and out of the widget; **arrow keys**, **Home**/**End** (and often type-ahead) move between items within it. **Roving tabindex** is the technique of giving exactly one item \`tabindex="0"\` and all others \`tabindex="-1"\`.`,
    whyItExists: `If every tab, menu item or tree node were a Tab stop, keyboard users would need dozens of key presses to get past one widget. Arrow-key navigation matches native platform controls and screen reader expectations.`,
    mechanism: `Roving tabindex:

1. Track the active index in state.
2. Render \`tabIndex={i === active ? 0 : -1}\`.
3. On \`keydown\` (ArrowRight/Down → next, ArrowLeft/Up → previous, Home → first, End → last), update the index and call \`.focus()\` on the new item (via refs).
4. Because only one item is in the tab sequence, Tab leaves the widget, and returning with Shift+Tab lands on the last active item.

Alternative: **aria-activedescendant** keeps DOM focus on a container/input and points to the active item's \`id\`; used when focus must stay in a text input (combobox).

Details: call \`preventDefault()\` on handled arrow keys to stop page scrolling; skip disabled items or keep them focusable per pattern; decide whether to wrap at the ends; tabs may use automatic or manual activation.`,
    example: `A toolbar with Bold/Italic/Underline buttons has one Tab stop. Arrow keys move between the buttons, Home/End jump to the ends, and Tab moves on to the editor.`,
    codeWalkthrough: `~~~tsx
function onKeyDown(e: React.KeyboardEvent) {
  const last = items.length - 1;
  const next =
    e.key === 'ArrowRight' ? (active === last ? 0 : active + 1) :
    e.key === 'ArrowLeft'  ? (active === 0 ? last : active - 1) :
    e.key === 'Home' ? 0 :
    e.key === 'End'  ? last : null;
  if (next === null) return;
  e.preventDefault();
  setActive(next);
  refs.current[next]?.focus();
}
// <button role="tab" tabIndex={i === active ? 0 : -1} ... />
~~~

1. Only handled keys call \`preventDefault\`; Tab passes through untouched.
2. Arrow keys wrap around (a design choice the APG allows for tabs).
3. State update and \`.focus()\` keep the tabindex and actual focus in sync.
4. The rendering rule ensures one Tab stop.`,
    misconceptions: [
      'Every interactive element inside a widget should be reachable with Tab — composite widgets should expose one Tab stop.',
      'Roving tabindex and `aria-activedescendant` are interchangeable everywhere — `aria-activedescendant` is needed when DOM focus must remain on an input.',
      'Handling `onClick` on a div is enough for keyboard users — Enter/Space handling and focusability must be added (or use a `<button>`).',
    ],
    failureCases: [
      'Arrow keys in a listbox also scroll the page because `preventDefault` was not called.',
      'The `tabindex` state is updated but `.focus()` is not called, so the visual highlight and real focus diverge.',
      'After items are filtered, the active index points past the end and no item has `tabindex="0"`, making the widget unreachable by Tab.',
    ],
    productionImplications: `Follow the APG keyboard tables for each pattern, clamp the active index when items change, and test with a keyboard and a screen reader. Testing Library's \`user.keyboard('{ArrowRight}')\` plus \`toHaveFocus\` assertions catch most regressions.`,
    docSourceIds: ['apg-tabs', 'apg-treeview'],
    interviewQuestions: [
      'Implement roving tabindex for a tab list.',
      'When would you use aria-activedescendant instead?',
      'What is the difference between automatic and manual activation in tabs?',
      'How do you keep the active index valid when items change?',
    ],
    related: ['focus-management', 'combobox-aria', 'tree-aria-pattern', 'event-propagation'],
  },
  {
    id: 'combobox-aria',
    title: 'Combobox pattern & aria-activedescendant',
    area: 'Accessibility',
    summary: 'An editable input controls a popup listbox; the highlighted option is conveyed with `aria-activedescendant` while DOM focus stays in the input.',
    definition: `A **combobox** is an input with an associated popup (usually a \`listbox\`) that helps set its value. In ARIA 1.2 the \`role="combobox"\` goes on the \`<input>\` itself, which references the popup with \`aria-controls\`.`,
    whyItExists: `Autocomplete, typeahead and select-with-search are among the most common UI controls and among the most frequently inaccessible. The pattern lets users keep typing while navigating suggestions, and lets screen readers announce the highlighted option.`,
    mechanism: `Key attributes:

- Input: \`role="combobox"\`, \`aria-expanded\` (popup visible?), \`aria-controls\` (listbox id), \`aria-autocomplete\` (\`list\`, \`both\`, \`inline\` or \`none\`), and \`aria-activedescendant\` = id of the highlighted option (or removed when none).
- Popup: \`role="listbox"\` with \`role="option"\` children, each with a unique \`id\`; the highlighted/selected option has \`aria-selected="true"\`.

Keyboard (APG): **Down Arrow** opens the popup / moves to the next option; **Up Arrow** moves to the previous; **Enter** accepts the highlighted option; **Escape** closes the popup (and may clear the input if already closed); **Alt+Down** opens without moving highlight.

**Why activedescendant**: DOM focus never leaves the input, so typing and caret movement continue to work; assistive technology treats the referenced option as the active element and announces it. The referenced element must exist in the DOM and be a descendant/owned element of the controlled popup.`,
    example: `A city picker filters options as the user types. Down Arrow highlights "Berlin" — the input keeps focus and the caret, \`aria-activedescendant="city-opt-3"\` makes the screen reader announce "Berlin, 3 of 12", and Enter commits it.`,
    codeWalkthrough: `~~~tsx
<input
  role="combobox"
  aria-expanded={open}
  aria-controls="city-listbox"
  aria-autocomplete="list"
  aria-activedescendant={open && active >= 0 ? optionId(active) : undefined}
  value={text}
  onChange={(e) => { setText(e.target.value); setOpen(true); setActive(-1); }}
  onKeyDown={onKeyDown}
/>
{open && (
  <ul role="listbox" id="city-listbox">
    {matches.map((c, i) => (
      <li key={c.id} id={optionId(i)} role="option" aria-selected={i === active}
          onMouseDown={(e) => e.preventDefault()} onClick={() => choose(c)}>
        {c.name}
      </li>
    ))}
  </ul>
)}
~~~

1. \`aria-expanded\` and \`aria-controls\` describe the popup relationship.
2. \`aria-activedescendant\` is removed when nothing is highlighted, rather than pointing to a missing id.
3. Typing resets the highlight because the option list changed.
4. \`onMouseDown\` + \`preventDefault\` stops the input from blurring before the click registers.`,
    misconceptions: [
      '`aria-activedescendant` moves DOM focus to the option — DOM focus stays on the input; only the accessibility tree\'s active element changes.',
      'The combobox role belongs on a wrapper div — in ARIA 1.2 it goes on the input element.',
      'Options can be rendered lazily without ids — the referenced option must be in the DOM with a matching id.',
    ],
    failureCases: [
      'Moving real focus to each option on Arrow keys breaks typing and caret placement.',
      'Filtering leaves `aria-activedescendant` pointing at an id that no longer exists, so screen readers announce nothing.',
      'The listbox closes on input `blur` before the option `click` fires, so mouse selection never works.',
    ],
    productionImplications: `Use a well-tested component library where possible; if building one, follow the APG keyboard table exactly, announce result counts with a polite live region, debounce and cancel lookups, and keep ids stable and unique (React \`useId\`).`,
    docSourceIds: ['apg-combobox', 'mdn-aria-activedescendant'],
    interviewQuestions: [
      'Which ARIA attributes does a combobox input need and what does each communicate?',
      'Why use `aria-activedescendant` instead of moving focus to options?',
      'How do you prevent the popup from closing before an option click is handled?',
      'How do you handle async suggestions and announce results?',
    ],
    related: ['keyboard-navigation', 'focus-management', 'debouncing', 'race-conditions'],
  },
  {
    id: 'tree-aria-pattern',
    title: 'ARIA tree view pattern',
    area: 'Accessibility',
    summary: 'A hierarchical list (`role="tree"`) whose parent nodes expand and collapse, navigated with arrow keys and exposing level, expansion and selection state.',
    definition: `The **tree view** pattern presents nested items (file explorers, nav trees) as \`role="tree"\` containing \`role="treeitem"\` elements; child items are grouped in \`role="group"\` containers. Parent items carry \`aria-expanded\`.`,
    whyItExists: `Nested \`<ul>\` lists with click handlers are not navigable efficiently by keyboard and do not convey hierarchy or expansion state to screen readers. The tree role tells assistive technology to announce level, position and expanded state, and enables standard keyboard behaviour.`,
    mechanism: `Structure:

- \`role="tree"\` with an accessible name; \`aria-multiselectable\` if applicable.
- Each node: \`role="treeitem"\`; parent nodes have \`aria-expanded="true|false"\` (end nodes have none); selection via \`aria-selected\` or \`aria-checked\`.
- Children wrapped in \`role="group"\`. If the DOM does not express nesting (e.g. a virtualised flat list), provide \`aria-level\`, \`aria-setsize\`, \`aria-posinset\`.

Keyboard (APG): **Down/Up** move to the next/previous *visible* node; **Right** on a closed parent opens it, on an open parent moves to its first child, on an end node does nothing; **Left** on an open parent closes it, on a child moves to its parent; **Home/End** go to the first/last visible node; **Enter** activates; type-ahead moves to the next node starting with the typed character; \`*\` (optional) expands all siblings.

Focus uses roving tabindex (one node with \`tabindex="0"\`) or \`aria-activedescendant\` on the tree.`,
    example: `A file explorer: focus on the closed "src" folder; Right opens it; Right again moves to "components"; Left returns to "src"; Left again collapses it.`,
    codeWalkthrough: `~~~tsx
function visibleNodes(nodes: Node[], expanded: Set<string>, level = 1): Flat[] {
  return nodes.flatMap((n) => [
    { node: n, level },
    ...(n.children && expanded.has(n.id)
      ? visibleNodes(n.children, expanded, level + 1)
      : []),
  ]);
}
// ArrowDown: index + 1 in visibleNodes(...)
// ArrowLeft on child: find nearest previous item with level - 1
~~~

1. Keyboard navigation operates on the **flattened list of visible nodes**, recomputed from the tree and the expanded set.
2. Collapsed subtrees are excluded, so Up/Down skip hidden children.
3. \`level\` supports both \`aria-level\` and "move to parent" logic.
4. Expansion state lives in a \`Set\` of ids, independent from the data.`,
    misconceptions: [
      'Any nested list of links should be `role="tree"` — site navigation is usually better as nested lists of links; tree implies application-style keyboard behaviour.',
      'End nodes should have `aria-expanded="false"` — that would announce them as collapsible; omit it.',
      'Tab moves between tree items — the tree is one Tab stop; arrows navigate within.',
    ],
    failureCases: [
      'Arrow Down enters collapsed (hidden) children because navigation iterated the full data tree instead of visible nodes.',
      'Collapsing a parent while a descendant has focus leaves focus on a hidden element.',
      'Virtualised tree omits `aria-level`/`aria-setsize`/`aria-posinset`, so screen readers announce wrong positions.',
    ],
    productionImplications: `Separate data (tree), view state (expanded/selected ids) and derived visible list. Move focus to the collapsing parent when a focused descendant is hidden. For large trees, virtualise the flattened list and provide explicit level/position attributes.`,
    docSourceIds: ['apg-treeview'],
    interviewQuestions: [
      'Describe the Right and Left arrow behaviours in an APG tree.',
      'How do you compute the next focusable node when some subtrees are collapsed?',
      'Which attributes are required when a tree is virtualised?',
      'When is a tree role inappropriate for navigation?',
    ],
    related: ['recursive-tree-traversal', 'keyboard-navigation', 'focus-management', 'disclosure-accordion-aria'],
  },
  {
    id: 'disclosure-accordion-aria',
    title: 'Disclosure & accordion pattern',
    area: 'Accessibility',
    summary: 'A disclosure is a button that shows/hides content and reports state with `aria-expanded`; an accordion is a stack of disclosures whose buttons sit inside headings.',
    definition: `A **disclosure** toggles the visibility of a section with a \`<button aria-expanded aria-controls>\`. An **accordion** is a vertically stacked set of such sections, where each header is a button wrapped in a heading element of the appropriate level.`,
    whyItExists: `Progressive disclosure reduces visual clutter (FAQs, settings, filters). Using a real button with \`aria-expanded\` makes the toggle operable by keyboard and tells screen readers whether content is shown.`,
    mechanism: `Accordion structure (APG):

- Each header: \`<h3><button aria-expanded="false" aria-controls="panel-1" id="hdr-1">Title</button></h3>\`.
- Panel: content container with \`id="panel-1"\`; optionally \`role="region"\` + \`aria-labelledby="hdr-1"\` (avoid regions when there are many panels to prevent landmark noise).
- Hidden panels use \`hidden\` (or are unmounted) so their content is out of the accessibility tree and tab order.

Keyboard: **Enter/Space** toggle (free with a native \`<button>\`); Tab moves through headers and any focusable content in open panels. Arrow/Home/End navigation between headers is optional.

Behaviour choices: single-open vs multi-open; whether the open panel can be collapsed. Native \`<details>/<summary>\` provides a disclosure with built-in semantics; \`<details name="group">\` gives exclusive (accordion-like) behaviour in supporting browsers.`,
    example: `An FAQ list renders each question as an \`<h3>\` containing a button. Clicking or pressing Enter toggles \`aria-expanded\` and the answer's \`hidden\` attribute; screen readers announce "How do refunds work?, button, collapsed".`,
    codeWalkthrough: `~~~tsx
function Section({ id, title, children }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <h3>
        <button
          id={id + '-hdr'}
          aria-expanded={open}
          aria-controls={id + '-panel'}
          onClick={() => setOpen((o) => !o)}
        >{title}</button>
      </h3>
      <div id={id + '-panel'} role="region" aria-labelledby={id + '-hdr'} hidden={!open}>
        {children}
      </div>
    </>
  );
}
~~~

1. A native \`<button>\` provides focusability and Enter/Space activation.
2. The heading wrapper gives users heading navigation across sections.
3. \`aria-expanded\` reflects state; \`aria-controls\` links to the panel.
4. \`hidden\` removes collapsed content from the accessibility tree and tab order.`,
    misconceptions: [
      'Putting `aria-expanded` on the panel is correct — it belongs on the controlling button.',
      'Hiding the panel with `opacity: 0` or height 0 is enough — focusable content remains reachable unless it is `hidden`/`display: none`/`inert`.',
      'Accordions require arrow-key navigation — it is optional in the APG.',
    ],
    failureCases: [
      'Header implemented as a clickable `<div>` — unreachable by keyboard and announced as plain text.',
      'Collapsed panels animated to `height: 0` still contain tabbable links, so keyboard focus disappears into invisible content.',
      'Wrapping the button with a heading but nesting the heading inside the button produces invalid, confusingly announced markup.',
    ],
    productionImplications: `Prefer \`<details>/<summary>\` for simple disclosures; use the button+heading pattern when you need controlled state or custom animation. Combine CSS transitions with \`inert\` or \`hidden\` at the end of the animation, and make sure find-in-page/deep links can still open the relevant panel.`,
    docSourceIds: ['apg-accordion', 'mdn-details'],
    interviewQuestions: [
      'What markup and ARIA does an accessible accordion header need?',
      'When should panels have `role="region"`?',
      'How do you animate collapse without leaving focusable content reachable?',
      'Compare a custom accordion with `<details>`.',
    ],
    related: ['focus-management', 'keyboard-navigation', 'tree-aria-pattern'],
  },
  // ───────────────────────────── React ─────────────────────────────
  {
    id: 'react-state-batching',
    title: 'State updates, batching & queues',
    area: 'React',
    summary: '`setState` enqueues an update rather than mutating the current value; React 18 with `createRoot` batches updates from any context into a single re-render.',
    definition: `Calling a state setter **schedules** a re-render with a queued update. State within a render is a **snapshot**: the variable does not change until the next render. **Batching** groups multiple queued updates so the component renders once.`,
    whyItExists: `Rendering after every individual \`setState\` would waste work and could expose half-updated UI (e.g. new \`items\` with old \`selectedId\`). Queuing and batching make updates consistent and cheap.`,
    mechanism: `- Each \`useState\` hook has an **update queue**. \`setX(value)\` enqueues "replace with value"; \`setX(fn)\` enqueues an **updater** function.
- During the next render, React processes the queue in order: a value replaces the pending state; an updater receives the pending state and returns the next one.
- **Automatic batching (React 18+ with \`createRoot\`)**: updates are batched regardless of origin — React event handlers, \`setTimeout\`, promises, native event listeners. With the legacy \`ReactDOM.render\` root, only updates inside React event handlers were batched.
- \`flushSync(() => setX(…))\` forces a synchronous render when you must read the DOM immediately after an update.
- If the computed next state is \`Object.is\`-equal to the current state, React can bail out of re-rendering children.`,
    example: `A "+3" button calls \`setCount(count + 1)\` three times and the count only increases by 1. Each call reads the same snapshot \`count\`; switching to \`setCount(c => c + 1)\` queues three updaters and yields +3.`,
    codeWalkthrough: `~~~tsx
function Counter() {
  const [count, setCount] = useState(0);
  async function onClick() {
    setCount(count + 1);      // queue: replace with 1
    setCount((c) => c + 1);   // queue: updater -> 2
    setCount(count + 10);     // queue: replace with 10
    console.log(count);       // 0 — snapshot
    await fetch('/ping');
    setCount((c) => c * 2);   // batched with any other updates in this tick
  }
  return <button onClick={onClick}>{count}</button>;
}
~~~

1. Values and updaters are applied in enqueue order: \`0 → 1 → 2 → 10\`.
2. \`console.log(count)\` prints the render's snapshot, not the queued value.
3. One render shows \`10\`.
4. After the \`await\`, the update is still batched under \`createRoot\` (then renders \`20\`); under the legacy root it would render synchronously.`,
    misconceptions: [
      'React only batches inside event handlers — with `createRoot` (React 18+) it batches updates from timeouts, promises and native listeners too.',
      '`setState` is asynchronous like a promise — it is not awaitable; it enqueues an update and the value is visible in the next render.',
      'Updater functions run immediately — they run during the next render when the queue is processed.',
    ],
    failureCases: [
      'A counter incremented in a loop with `setCount(count + 1)` only increments once.',
      'Code reads a DOM measurement right after `setState` and gets the old layout; it needed `flushSync` or a layout effect.',
      'An updater function performs side effects (API calls) that run twice in Strict Mode development.',
    ],
    productionImplications: `Use updater functions whenever the next state depends on the previous one, keep updaters pure, and derive values during render instead of syncing them into state. When upgrading to React 18, check code that relied on synchronous re-renders outside event handlers.`,
    docSourceIds: ['react-queueing'],
    interviewQuestions: [
      'Why does calling `setCount(count + 1)` three times only add one?',
      'What changed about batching between legacy `ReactDOM.render` and `createRoot`?',
      'When would you use `flushSync`?',
      'Walk through how React processes a mixed queue of values and updater functions.',
    ],
    related: ['react-effects', 'closures', 'referential-equality', 'immutable-updates'],
  },
  {
    id: 'react-effects',
    title: 'Effects, dependencies & cleanup',
    area: 'React',
    summary: 'Effects synchronise a component with an external system after commit; React re-runs them when dependencies change, running the previous cleanup first.',
    definition: `\`useEffect(setup, deps)\` runs \`setup\` after React commits a render. \`setup\` may return a **cleanup** function. Dependencies are compared with \`Object.is\` to decide whether to re-run.`,
    whyItExists: `Rendering must be pure, but components need to connect to things outside React — subscriptions, timers, network, imperative widgets, document title. Effects give those side effects a lifecycle tied to the component's props/state.`,
    mechanism: `Lifecycle for one effect:

1. **Mount**: after commit (typically after paint), run \`setup\`.
2. **Update**: after a commit where any dependency changed (\`!Object.is(prev, next)\`), run the **previous cleanup** with the old props/state, then the new \`setup\`.
3. **Unmount**: run the last cleanup.

Dependency forms: no array → every render; \`[]\` → mount only; \`[a, b]\` → when \`a\` or \`b\` changes.

In development **Strict Mode**, React runs an extra setup → cleanup cycle on mount to reveal missing cleanups. \`useLayoutEffect\` runs synchronously after DOM mutation and before paint — use it only for measurements that must happen before the user sees the frame.

Each effect closes over the props and state of the render it was created in; the dependency list must include every reactive value it uses (the lint rule enforces this).`,
    example: `A chat room component connects in an effect keyed on \`roomId\`. Switching rooms runs the cleanup (disconnect from the old room) before connecting to the new one; leaving the page disconnects on unmount.`,
    codeWalkthrough: `~~~tsx
function ChatRoom({ roomId }: { roomId: string }) {
  useEffect(() => {
    const conn = createConnection(roomId);
    conn.connect();
    return () => conn.disconnect();
  }, [roomId]);
  return <h1>Welcome to {roomId}</h1>;
}
~~~

1. The effect depends only on \`roomId\`; re-renders for other reasons do not reconnect.
2. On \`roomId\` change, React disconnects the old connection (its cleanup captured the old \`conn\`) before creating the new one.
3. On unmount, the last connection is closed.
4. In Strict Mode dev you will see connect → disconnect → connect, which is harmless when cleanup is correct.`,
    misconceptions: [
      'Cleanup only runs on unmount — it also runs before every re-run of the effect.',
      'An empty dependency array is a safe way to "run once" — if the effect uses reactive values it reads stale data; omitting deps hides bugs.',
      'Effects are for transforming data for rendering — derive it during render or with `useMemo` instead.',
      'Strict Mode double-invocation happens in production — it is a development-only check.',
    ],
    failureCases: [
      'An effect sets state that is also a dependency without a guard, causing an infinite render loop.',
      'An object/function dependency created during render changes every time, so a subscription reconnects on every keystroke.',
      'A fetch effect without cleanup applies a response after unmount or after the props changed (stale data).',
    ],
    productionImplications: `Use effects only for external synchronisation; derive state during render, handle user-triggered work in event handlers, and use a data library for fetching where possible. Every effect that subscribes, schedules or fetches needs symmetric cleanup.`,
    docSourceIds: ['react-sync-effects', 'react-useeffect'],
    interviewQuestions: [
      'When exactly does an effect\'s cleanup run?',
      'Why does React run effects twice in development Strict Mode?',
      'How do you avoid an effect re-running when it depends on a callback prop?',
      'When would you use `useLayoutEffect` instead of `useEffect`?',
    ],
    related: ['race-conditions', 'abort-controller', 'closures', 'referential-equality', 'react-state-batching'],
  },
  {
    id: 'react-reconciliation-keys',
    title: 'Reconciliation, component identity & keys',
    area: 'React',
    summary: 'React preserves a component\'s state while the same component type renders at the same position in the tree; keys define that position within lists.',
    definition: `**Reconciliation** is React comparing the new element tree with the previous one to decide which fibers (and DOM nodes) to keep, update, move or recreate. **Identity** is determined by element **type** + **position** (+ \`key\`).`,
    whyItExists: `A general tree diff is O(n³). React uses heuristics — different type means a different subtree; keys identify children among siblings — to get O(n) reconciliation that is correct for UI updates.`,
    mechanism: `- **Same type, same position** → reuse the fiber: state is preserved, props are updated.
- **Different type** at a position (\`<div>\` → \`<section>\`, \`<A>\` → \`<B>\`) → unmount the old subtree (state lost, effects cleaned up), mount the new one.
- **Lists**: children are matched by \`key\` among siblings. Without keys (or with index keys), matching is by index, so inserting at the top shifts identity of every item.
- **Changing a \`key\`** on a component forces a remount — a deliberate way to reset state.
- Components defined *inside* another component's render body are a new function (new type) on every render, so their subtree remounts each time.
- Keys must be unique among siblings and stable across renders; they are not passed as props.`,
    example: `A todo list uses array index as key and each row has an uncontrolled \`<input>\`. Deleting the first todo shifts indexes, so the text typed in row 2 now appears to belong to row 1. Using \`todo.id\` as key fixes it.`,
    codeWalkthrough: `~~~tsx
// Reset form state when switching users:
<ProfileForm key={user.id} user={user} />

// Bug: identity changes every render
function Parent() {
  function Row(props: RowProps) { return <input {...props} />; } // new type each render
  return <Row />;
}

// Lists: stable keys from data
{items.map((item) => <Item key={item.id} item={item} />)}
~~~

1. Changing \`key\` remounts \`ProfileForm\` so it starts with fresh local state for the new user.
2. \`Row\` is re-created on each render of \`Parent\`, so React sees a new type and remounts it — losing focus and input state.
3. Data ids as keys keep each \`Item\`'s state attached to the right record across reorders.`,
    misconceptions: [
      'Keys are a performance hint only — they determine identity and therefore which state belongs to which item.',
      'Index keys are always wrong — they are fine for static lists that never reorder, insert or delete.',
      'State lives in the component function — it lives in React\'s tree at that position; the same component at a different position has separate state.',
    ],
    failureCases: [
      'Index keys on a sortable list cause checkboxes/inputs to stay at the same position while data moves.',
      'Using `Math.random()` as key remounts every row on every render, killing performance and focus.',
      'Conditionally wrapping a component in a `<div>` changes its position, resetting its state unexpectedly.',
    ],
    productionImplications: `Use stable ids from data as keys, use \`key\` intentionally to reset state, never declare components inside components, and keep the tree shape stable across conditional branches when state must be preserved.`,
    docSourceIds: ['react-preserving-state', 'react-rendering-lists'],
    interviewQuestions: [
      'How does React decide whether to preserve or reset a component\'s state?',
      'Why are index keys problematic, and when are they acceptable?',
      'How can you reset a component\'s state when a prop changes?',
      'What happens when a component is defined inside another component?',
    ],
    related: ['react-state-batching', 'immutable-updates', 'referential-equality'],
  },
  {
    id: 'immutable-updates',
    title: 'Immutable updates & structural sharing',
    area: 'Data structures',
    summary: 'Produce a new object for each changed path and reuse references for unchanged subtrees, so change detection is a cheap reference comparison.',
    definition: `An **immutable update** never mutates existing data; it creates new objects/arrays for every node on the path from the root to the change. **Structural sharing** means unchanged branches are reused by reference in the new version.`,
    whyItExists: `React, Redux and memoisation rely on reference comparison to detect changes. Mutating in place keeps the same reference, so updates are missed, and history (undo, time-travel debugging) is corrupted.`,
    mechanism: `- Objects: \`{ ...obj, key: newValue }\` — a **shallow** copy; nested objects are still shared.
- Arrays: \`map\`, \`filter\`, \`concat\`, \`slice\`, spread; ES2023 adds non-mutating \`toSorted\`, \`toReversed\`, \`toSpliced\`, \`with\`. Avoid \`push\`, \`splice\`, \`sort\`, \`reverse\` on state.
- Nested update: copy every level along the path (path copying); siblings keep their references.
- \`structuredClone\` does a deep copy (supports Map/Set/Date/cycles, throws \`DataCloneError\` for functions and DOM nodes) — correct but defeats structural sharing and memoisation.
- \`Object.freeze\` is shallow; libraries like Immer use proxies to let you write "mutating" code that produces structurally shared results.`,
    example: `A kanban board moves a card between columns. Only the two affected column arrays and the board object get new references; the other ten columns keep theirs, so their memoised components skip re-rendering.`,
    codeWalkthrough: `~~~ts
type Board = { columns: Record<string, { id: string; cards: string[] }> };

function moveCard(board: Board, from: string, to: string, card: string): Board {
  return {
    ...board,
    columns: {
      ...board.columns,
      [from]: { ...board.columns[from], cards: board.columns[from].cards.filter((c) => c !== card) },
      [to]:   { ...board.columns[to],   cards: [...board.columns[to].cards, card] },
    },
  };
}
~~~

1. A new root and a new \`columns\` map are created because something under them changed.
2. Only \`from\` and \`to\` columns are copied; other columns are shared by reference.
3. \`filter\` and spread create new arrays without touching the originals.
4. \`next.columns.x === prev.columns.x\` is \`true\` for untouched columns, enabling cheap memoisation.`,
    misconceptions: [
      'Spread makes a deep copy — it is shallow; nested objects are shared.',
      'Deep cloning state on every update is the safe default — it breaks memoisation and costs O(n).',
      '`const` makes an object immutable — it only prevents rebinding the variable.',
    ],
    failureCases: [
      '`state.items.push(x); setState(state)` — same reference, React bails out and nothing re-renders.',
      'A shallow copy of a nested form object is mutated at depth, also changing the previous state used by undo history.',
      '`items.sort()` inside render mutates props passed from the parent, causing inconsistent order elsewhere.',
    ],
    productionImplications: `Keep state normalised and shallow to reduce path-copying, use Immer for deep updates, and enable Strict Mode / freeze in development to catch accidental mutation. Measure before deep-cloning large structures.`,
    docSourceIds: ['react-updating-objects', 'mdn-structuredclone'],
    interviewQuestions: [
      'Write an immutable update for a deeply nested property.',
      'What is structural sharing and why does it matter for memoisation?',
      'When would you use `structuredClone`, and what can it not clone?',
      'How does Immer let you write mutating syntax safely?',
    ],
    related: ['referential-equality', 'recursive-tree-traversal', 'react-state-batching', 'react-reconciliation-keys'],
  },
  {
    id: 'recursive-tree-traversal',
    title: 'Recursive tree traversal & transformation',
    area: 'Data structures',
    summary: 'Process hierarchical data (DOM, file trees, nested comments, menus) by handling a node and recursing into its children, or iteratively with an explicit stack/queue.',
    definition: `**Tree traversal** visits every node of a hierarchy. **Depth-first** (pre-order: node before children; post-order: children before node) is naturally recursive; **breadth-first** visits level by level with a queue. **Transformation** returns a new tree (map/filter/update) rather than mutating.`,
    whyItExists: `Frontend data is full of trees: DOM, JSON configs, folder structures, nested categories, comment threads. Rendering, searching, filtering, flattening and immutable updates over them all reduce to traversal.`,
    mechanism: `- **Recursive DFS**: base case (leaf / no children), recursive case (map over children). Call-stack depth equals tree depth; very deep trees (tens of thousands of levels) can throw \`RangeError: Maximum call stack size exceeded\`.
- **Iterative DFS**: explicit stack array — push root, pop, process, push children in reverse to keep order.
- **BFS**: queue (use an index pointer instead of \`shift()\` for O(1) dequeues).
- **Filter with ancestors**: keep a node if it matches *or* any descendant matches (post-order decision).
- **Immutable update by id**: return the same node reference when nothing changed in its subtree (structural sharing).
- **Graphs with cycles**: track visited nodes with a \`Set\`/\`WeakSet\`.`,
    example: `A file explorer search: show files whose names match "test" and keep their ancestor folders so the hierarchy stays visible, auto-expanding those folders.`,
    codeWalkthrough: `~~~ts
type TreeNode = { id: string; name: string; children?: TreeNode[] };

function filterTree(node: TreeNode, match: (n: TreeNode) => boolean): TreeNode | null {
  const kids = (node.children ?? [])
    .map((c) => filterTree(c, match))
    .filter((c): c is TreeNode => c !== null);
  if (match(node) || kids.length > 0) {
    return node.children ? { ...node, children: kids } : node;
  }
  return null;
}

function updateById(node: TreeNode, id: string, fn: (n: TreeNode) => TreeNode): TreeNode {
  if (node.id === id) return fn(node);
  if (!node.children) return node;
  const next = node.children.map((c) => updateById(c, id, fn));
  return next.some((c, i) => c !== node.children![i]) ? { ...node, children: next } : node;
}
~~~

1. \`filterTree\` is post-order: it decides about a node after seeing its filtered children.
2. A type-guard \`filter\` removes \`null\`s while keeping types precise.
3. \`updateById\` returns the original reference when no child changed — unchanged subtrees are shared.
4. Both functions never mutate the input.`,
    misconceptions: [
      'Recursion is always slower than iteration — in practice the difference is small; stack depth is the real constraint.',
      'BFS with `array.shift()` is O(n) overall — each `shift` is O(n), so use a head index.',
      'Filtering a tree means filtering each level independently — matching descendants must keep their ancestors.',
    ],
    failureCases: [
      'Deeply nested generated JSON causes a stack overflow in a recursive renderer.',
      'A tree update helper always copies every node, so all memoised tree rows re-render on any change.',
      'Data with back-references (parent pointers) causes infinite recursion without a visited set.',
    ],
    productionImplications: `Normalise large trees (\`byId\` + \`childIds\`) for O(1) updates, use iterative traversal for unbounded depth, preserve references for unchanged subtrees, and virtualise rendering of the flattened visible list for big trees.`,
    docSourceIds: ['apg-treeview', 'mdn-structuredclone'],
    interviewQuestions: [
      'Implement a function that filters a tree but keeps ancestors of matching nodes.',
      'Convert a recursive traversal to an iterative one. Why might you need to?',
      'How do you immutably update a node by id while preserving unchanged references?',
      'Flatten a nested comment tree into a list with depth information.',
    ],
    related: ['tree-aria-pattern', 'immutable-updates', 'referential-equality', 'generics'],
  },
  // ───────────────────────────── TypeScript ─────────────────────────────
  {
    id: 'generics',
    title: 'Generics',
    area: 'TypeScript',
    summary: 'Type parameters let a function, type or component express a relationship between input and output types instead of erasing them to `any`/`unknown`.',
    definition: `**Generics** are type-level parameters (\`<T>\`) that are filled in at each use site, usually by **inference** from arguments. **Constraints** (\`T extends Shape\`) restrict what can be passed and make members of \`Shape\` available inside the body.`,
    whyItExists: `Reusable code (collections, data fetching hooks, list components, utility functions) must work for many types while preserving the precise type for callers. Without generics you choose between duplication and losing type information.`,
    mechanism: `- **Inference**: TypeScript infers type arguments from argument types at the call site (candidates are unified; literals are widened unless the context or a \`const\` type parameter (TS 5.0) preserves them).
- **Constraints**: \`<T extends { id: string }>\`; \`<K extends keyof T>\` ties one parameter to another so \`obj[key]\` is typed \`T[K]\`.
- **Defaults**: \`<T = unknown>\`.
- **Erasure**: generics exist only at compile time; there is no runtime \`T\`.
- **Assignability inside the body**: a value of type \`T\` is only known to satisfy its constraint; you cannot return \`{ id: '1' }\` as \`T\` because \`T\` might be a subtype with more properties.
- **Rule of thumb**: a type parameter should relate at least two positions (input↔output, or two inputs); if it appears once, use the constraint type directly.`,
    example: `A \`useFetch<T>(url, parse: (raw: unknown) => T)\` hook returns \`{ data: T | undefined }\`. Callers get precise types from the parser they pass, and the hook never needs to know the response shape.`,
    codeWalkthrough: `~~~ts
function getProp<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
const user = { id: 1, name: 'Ada' };
const n = getProp(user, 'name'); // string
// getProp(user, 'age');          // error: '"age"' not assignable to '"id" | "name"'

function groupBy<T, K extends PropertyKey>(items: T[], keyOf: (item: T) => K): Record<K, T[]> {
  const out = {} as Record<K, T[]>;
  for (const item of items) (out[keyOf(item)] ??= []).push(item);
  return out;
}
~~~

1. \`K extends keyof T\` links the key to the object type, so the return type is the exact property type.
2. Invalid keys are compile errors with helpful messages.
3. \`groupBy\` infers \`T\` from \`items\` and \`K\` from the callback's return type.
4. The single \`as\` assertion is localised to the empty-object initialisation.`,
    misconceptions: [
      'Generics are runtime parameters — they are erased; you cannot branch on `T` at runtime.',
      '`<T extends string>` means T is `string` — T can be any subtype, e.g. a literal union.',
      'More type parameters means better typing — unnecessary parameters hurt inference and readability.',
    ],
    failureCases: [
      'A generic function returns `{} as T`, so callers trust properties that do not exist at runtime.',
      'A generic React list component loses item types because `T` was defaulted to `any` instead of inferred from `items`.',
      'Inference widens a literal config (`"primary"` → `string`), breaking a discriminated union downstream.',
    ],
    productionImplications: `Design APIs so inference works from the first argument, use constraints instead of assertions, and reach for \`satisfies\`, \`as const\` or \`const\` type parameters to keep literal types. Prefer \`unknown\` + validation at I/O boundaries rather than generics that pretend to know response shapes.`,
    docSourceIds: ['ts-generics', 'ts-keyof'],
    interviewQuestions: [
      'Type a `pick(obj, keys)` function so the return type contains only the picked keys.',
      'Why can\'t you return a literal object as `T` inside a generic function?',
      'How do you write a generic React component with props inferred from `items`?',
      'What does a `const` type parameter change?',
    ],
    related: ['mapped-types-keyof', 'conditional-types-infer', 'discriminated-unions', 'currying'],
  },
  {
    id: 'conditional-types-infer',
    title: 'Conditional types & infer',
    area: 'TypeScript',
    summary: '`T extends U ? X : Y` selects a type based on assignability, distributes over unions when `T` is a naked type parameter, and can capture parts of a type with `infer`.',
    definition: `A **conditional type** chooses between two types depending on whether the checked type is assignable to an extends-type. \`infer X\` inside the extends clause introduces a type variable that TypeScript solves by pattern matching.`,
    whyItExists: `They allow type-level computation: unwrapping promises and arrays, extracting function parameters/return types, filtering unions. Built-in utilities — \`ReturnType\`, \`Parameters\`, \`Awaited\`, \`Exclude\`, \`Extract\`, \`NonNullable\` — are conditional types.`,
    mechanism: `- **Evaluation**: if \`T\` is concrete, the branch is resolved immediately; if it depends on an unresolved type parameter, evaluation is **deferred** until instantiation.
- **Distribution**: when the checked type is a *naked* type parameter and is instantiated with a union, the conditional is applied to each member and the results are unioned: \`Exclude<'a' | 'b', 'a'>\` = \`'b'\`. \`never\` is the empty union, so it distributes to \`never\`.
- **Disabling distribution**: wrap both sides in a tuple, \`[T] extends [U] ? …\`.
- **infer**: \`T extends Promise<infer V> ? V : T\`. Multiple candidates in co-variant positions union; in contra-variant positions (parameters) they intersect. Since TS 4.7 you can constrain: \`infer S extends string\`.
- Inferring from an overloaded function uses the **last** signature.
- Conditional types can be recursive (e.g. deep \`Awaited\`), subject to instantiation depth limits.`,
    example: `An API client maps each endpoint function to its resolved data type with \`Awaited<ReturnType<typeof endpoints[K]>>\`, so components get typed data without restating response types.`,
    codeWalkthrough: `~~~ts
type ElementOf<T> = T extends readonly (infer E)[] ? E : never;
type A = ElementOf<string[] | number[]>;   // string | number (distributes)

type IsString<T> = T extends string ? true : false;
type B = IsString<'a' | 1>;               // boolean (true | false)
type IsStringStrict<T> = [T] extends [string] ? true : false;
type C = IsStringStrict<'a' | 1>;         // false
type D = IsString<never>;                 // never

type FirstArg<F> = F extends (first: infer P, ...rest: any[]) => any ? P : never;
type E = FirstArg<(id: number, opts?: object) => void>; // number
~~~

1. \`infer E\` captures the array element type; the union input distributes.
2. Distribution turns one question into two, producing \`true | false\`.
3. The tuple wrapper checks the union as a whole.
4. \`never\` distributes to \`never\`, a frequent surprise in "IsNever" helpers.
5. \`infer\` works in parameter positions too.`,
    misconceptions: [
      'Conditional types always distribute — only when the checked type is a naked type parameter.',
      '`T extends never ? A : B` detects never — with a naked `T` it yields `never`; use `[T] extends [never]`.',
      '`extends` in a conditional means class inheritance — it means assignability.',
    ],
    failureCases: [
      'An `IsNever<T>` helper returns `never` instead of `true`, silently breaking an exhaustive type test.',
      'A utility unexpectedly distributes over `boolean` (which is `true | false`), producing a union where a single type was expected.',
      'Deeply recursive conditional types hit "Type instantiation is excessively deep and possibly infinite" in large codebases.',
    ],
    productionImplications: `Use the built-in utilities first, keep custom conditional types small and tested with type-level assertions, and be aware that heavy recursive types slow down the compiler and editor.`,
    docSourceIds: ['ts-conditional', 'ts-utility'],
    interviewQuestions: [
      'Implement `MyReturnType`, `MyAwaited` and `MyExclude`.',
      'What is a distributive conditional type and how do you prevent distribution?',
      'Why does `IsString<boolean>` produce `false` while `IsString<"a" | 1>` produces `boolean`?',
      'How does `infer` behave with overloaded functions?',
    ],
    related: ['generics', 'mapped-types-keyof', 'discriminated-unions'],
  },
  {
    id: 'mapped-types-keyof',
    title: 'keyof, indexed access & mapped types',
    area: 'TypeScript',
    summary: '`keyof` produces the union of an object type\'s keys, `T[K]` looks up property types, and mapped types build new object types by iterating over keys.',
    definition: `- \`keyof T\`: union of the known keys of \`T\` (string, number and symbol literal types).
- **Indexed access** \`T[K]\`: the type of property \`K\` on \`T\`; \`T[number]\` gives an array/tuple's element type.
- **Mapped type** \`{ [K in Keys]: Type }\`: creates an object type with one property per key in a union.`,
    whyItExists: `They let you derive types from other types — \`Partial\`, \`Readonly\`, \`Pick\`, \`Record\`, form-state types, event-handler maps — so derived shapes stay in sync with a single source of truth.`,
    mechanism: `- \`keyof\` on a type with a string index signature yields \`string | number\` (numeric keys are valid string keys in JS).
- **Homomorphic mapped types** (\`[K in keyof T]\`) preserve \`readonly\` and \`?\` modifiers from \`T\`, and when \`T\` is an array/tuple they produce an array/tuple.
- **Modifiers**: \`+readonly\`/\`-readonly\`, \`+?\`/\`-?\` add or remove (\`Required<T>\` uses \`-?\`).
- **Key remapping** (TS 4.1): \`[K in keyof T as NewKey]\`; mapping a key to \`never\` filters it out. Combine with template literal types to rename keys (see the \`Getters\` example below).
- Indexing with a union distributes: \`T['a' | 'b']\` = \`T['a'] | T['b']\`.`,
    example: `A settings form derives \`Errors = { [K in keyof Settings]?: string }\` and \`Touched = { [K in keyof Settings]: boolean }\` from the \`Settings\` type, so adding a field updates validation types automatically.`,
    codeWalkthrough: `~~~ts
type Settings = { theme: 'light' | 'dark'; fontSize: number; readonly userId: string };

type Mutable<T> = { -readonly [K in keyof T]: T[K] };
type Getters<T> = {
  [K in keyof T as \`get\${Capitalize<K & string>}\`]: () => T[K];
};
type OnlyNumbers<T> = { [K in keyof T as T[K] extends number ? K : never]: T[K] };

type G = Getters<Settings>;   // { getTheme(): 'light' | 'dark'; getFontSize(): number; getUserId(): string }
type N = OnlyNumbers<Settings>; // { fontSize: number }
type V = Settings[keyof Settings]; // 'light' | 'dark' | number | string
~~~

1. \`-readonly\` removes the modifier that homomorphic mapping would otherwise copy.
2. \`as\` with a template literal type renames keys; \`K & string\` excludes symbol/number keys for \`Capitalize\`.
3. Remapping to \`never\` drops keys — a type-level filter.
4. Indexing with \`keyof\` gives the union of all value types.`,
    misconceptions: [
      '`keyof` always returns string literals — it can include number and symbol keys, and `string | number` for string index signatures.',
      'Mapped types lose optional/readonly modifiers — homomorphic mapped types preserve them unless you use `-?`/`-readonly`.',
      '`Pick` and `Omit` behave the same over unions — they are not distributive; `Omit` over a union collapses to common keys.',
    ],
    failureCases: [
      '`Omit<A | B, "id">` collapses a discriminated union to the shared keys, so narrowing on the discriminant breaks.',
      'A generic `Getters<T>` fails because `Capitalize` receives `string | number | symbol` without `& string`.',
      'Iterating `Object.keys(obj)` gives `string[]`, not `(keyof T)[]`, because objects may have extra keys at runtime.',
    ],
    productionImplications: `Derive form, API and event-map types from a single source type. For unions, write distributive helpers (\`T extends unknown ? Omit<T, K> : never\`). Remember type-level keys do not guarantee runtime keys — validate at boundaries.`,
    docSourceIds: ['ts-mapped', 'ts-keyof', 'ts-template-literal'],
    interviewQuestions: [
      'Implement `MyPick`, `MyReadonly` and `MyPartial`.',
      'How do you filter an object type to only its function-valued keys?',
      'Why does `Object.keys` return `string[]` in TypeScript?',
      'How do you write an `Omit` that preserves a discriminated union?',
    ],
    related: ['generics', 'conditional-types-infer', 'discriminated-unions'],
  },
  {
    id: 'discriminated-unions',
    title: 'Discriminated unions & exhaustive narrowing',
    area: 'TypeScript',
    summary: 'A union of object types sharing a literal-typed tag property lets TypeScript narrow to the exact member, and a `never` check makes handling exhaustive.',
    definition: `A **discriminated (tagged) union** is a union whose members share a property with distinct **literal** types (\`kind: 'circle' | 'square'\`). Checking that property **narrows** the value to the matching member. **Exhaustiveness checking** assigns the remaining value to \`never\` so that unhandled members cause compile errors.`,
    whyItExists: `It models state machines, reducer actions, API results and async state precisely — making impossible states unrepresentable — and turns "forgot to handle the new case" into a compile error instead of a production bug.`,
    mechanism: `- **Narrowing** is control-flow based: \`switch (x.kind)\`, \`if (x.kind === 'a')\`, \`in\` checks, and type predicates refine the type in each branch.
- After all members are excluded the type is \`never\`; \`const _exhaustive: never = x\` errors if any member remains.
- The discriminant must be a **literal** type (string/number/boolean literal, \`undefined\`, \`null\`); a plain \`string\` tag does not discriminate.
- Since TS 4.6, destructured \`const\` discriminant and payload variables narrow together.
- Narrowing does not survive across callbacks if the variable is mutable (\`let\`) — TypeScript cannot know it was not reassigned; TS 5.4 improved this for closures created after the last assignment.`,
    example: `A reducer handles \`{ type: 'add'; item } | { type: 'remove'; id } | { type: 'clear' }\`. Months later someone adds \`{ type: 'undo' }\`; every \`switch\` with an exhaustive default fails to compile until \`undo\` is handled.`,
    codeWalkthrough: `~~~ts
type Action =
  | { type: 'add'; item: string }
  | { type: 'remove'; id: number }
  | { type: 'clear' };

function assertNever(x: never): never {
  throw new Error('Unhandled: ' + JSON.stringify(x));
}

function reducer(state: string[], action: Action): string[] {
  switch (action.type) {
    case 'add':    return [...state, action.item];               // action: add
    case 'remove': return state.filter((_, i) => i !== action.id); // action: remove
    case 'clear':  return [];
    default:       return assertNever(action);                   // action: never
  }
}
~~~

1. Each \`case\` narrows \`action\`, so only that member's payload is accessible.
2. In \`default\`, all members have been excluded and \`action\` is \`never\`.
3. Adding a member without a \`case\` makes \`assertNever(action)\` a compile error.
4. At runtime, \`assertNever\` also guards against unexpected data (e.g. from an older server).`,
    misconceptions: [
      'Any shared property discriminates — it must have literal types that differ between members.',
      'A `default` branch makes a switch exhaustive — without a `never` check it silently handles new members.',
      'Narrowing persists inside callbacks — for mutable variables it may be reset, since the variable could be reassigned.',
    ],
    failureCases: [
      'A union built with `Omit` loses its discriminant, so `if (x.kind === "a")` no longer narrows.',
      'Async state modelled with optional `data?` and `error?` instead of a union allows `data` and `error` to both be set.',
      'A server adds a new event type; a switch without an exhaustive runtime guard silently drops it.',
    ],
    productionImplications: `Model reducer actions, async states, websocket messages and form steps as tagged unions; validate external data into them at the boundary (e.g. with Zod's \`discriminatedUnion\`), and use \`assertNever\` (or \`satisfies never\`) in every switch over them.`,
    docSourceIds: ['ts-narrowing'],
    interviewQuestions: [
      'What makes a union "discriminated"?',
      'How do you make a switch exhaustive at compile time and at runtime?',
      'Model the async request lifecycle as a discriminated union.',
      'Why can narrowing be lost inside a callback?',
    ],
    related: ['async-ui-states', 'conditional-types-infer', 'mapped-types-keyof', 'generics'],
  },
  // ───────────────────────────── Testing ─────────────────────────────
  {
    id: 'fake-timers',
    title: 'Testing time-based code with fake clocks',
    area: 'Testing',
    summary: 'Fake timers replace `setTimeout`, `setInterval` and `Date` with a controllable clock so debounce, polling and timeout logic can be tested deterministically and instantly.',
    definition: `A **fake clock** (Vitest \`vi.useFakeTimers()\`, built on \`@sinonjs/fake-timers\`) swaps timer globals for implementations that only advance when the test says so (\`vi.advanceTimersByTime(ms)\`, \`vi.runAllTimers()\`), and can set the system time (\`vi.setSystemTime\`).`,
    whyItExists: `Real waits make tests slow and flaky: a 300 ms debounce test that sleeps 350 ms fails on a busy CI machine. Fake time makes the order and timing of callbacks deterministic.`,
    mechanism: `- Faked timers are stored in an internal schedule ordered by due time. \`advanceTimersByTime(n)\` moves the clock forward and synchronously fires every timer that becomes due, in order, including timers scheduled by those callbacks within the window.
- \`runAllTimers()\` runs until no timers remain (throws after a loop limit for self-rescheduling intervals); \`runOnlyPendingTimers()\` runs only those already scheduled.
- **Promises and microtasks are not faked.** A callback that awaits needs the microtask queue to drain; use the async variants (\`advanceTimersByTimeAsync\`, \`runAllTimersAsync\`) which flush promises between timers.
- Which APIs are faked is configurable via \`toFake\`; in Vitest 2.x the default covers \`setTimeout\`/\`setInterval\`/\`setImmediate\` (and their clears) and \`Date\` — \`requestAnimationFrame\`, \`performance\` and \`queueMicrotask\` must be opted in.
- Always restore with \`vi.useRealTimers()\` (e.g. in \`afterEach\`).
- With Testing Library's \`user-event\`, pass \`advanceTimers: vi.advanceTimersByTime\` to \`userEvent.setup\` so its internal delays progress.`,
    example: `Testing a debounced search box: type "react", assert no request was made, advance 299 ms (still none), advance 1 ms more, assert exactly one request with "react".`,
    codeWalkthrough: `~~~ts
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

it('debounces calls', () => {
  const fn = vi.fn();
  const d = debounce(fn, 300);
  d('r'); d('re'); d('react');
  vi.advanceTimersByTime(299);
  expect(fn).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1);
  expect(fn).toHaveBeenCalledTimes(1);
  expect(fn).toHaveBeenCalledWith('react');
});
~~~

1. Fake timers are installed before the code under test captures \`setTimeout\`.
2. Three rapid calls reset the same timer.
3. Advancing to 299 ms proves the boundary; 1 ms more fires exactly once with the latest argument.
4. Restoring real timers prevents leakage into other tests.`,
    misconceptions: [
      'Fake timers also control promises — promise reactions are microtasks and are not faked; use the async advance APIs or await.',
      '`runAllTimers` is always safe — with self-rescheduling intervals it loops until the limit; prefer `advanceTimersByTime` or `runOnlyPendingTimers`.',
      'Installing fake timers after the module captured `setTimeout` still works — code that stored a reference to the real function keeps using it.',
    ],
    failureCases: [
      'A test awaits `waitFor` while fake timers are enabled and never advances the clock, so it times out.',
      'A polling test with `async` callbacks advances time synchronously; the awaited fetch never resolves between ticks and assertions fail.',
      'A test forgets `useRealTimers`, and an unrelated later test that relies on real `setTimeout` hangs.',
    ],
    productionImplications: `Test debounce/throttle, retries with backoff, polling, toasts with auto-dismiss and session timeouts with fake clocks and explicit boundary assertions (n-1 ms, n ms). Keep timer logic injectable or isolated so tests can drive it, and use \`vi.setSystemTime\` for date-dependent UI.`,
    docSourceIds: ['tl-fake-timers', 'mdn-settimeout'],
    interviewQuestions: [
      'How would you test a 300 ms debounce without waiting 300 ms?',
      'Why do async callbacks need `advanceTimersByTimeAsync` instead of `advanceTimersByTime`?',
      'How do you combine fake timers with user-event in React Testing Library?',
      'How do you test exponential backoff with jitter deterministically?',
    ],
    related: ['debouncing', 'event-loop', 'promises'],
  },
];

CONCEPTS.push(...REACT_BATCH2_CONCEPTS, ...A11Y_BATCH2_CONCEPTS, ...REACT19_PERF_CONCEPTS, ...NEXTJS_RENDERING_CONCEPTS, ...SECURITY_BROWSER_CONCEPTS);

export const CONCEPT_BY_ID: Record<string, Concept> = Object.fromEntries(CONCEPTS.map((c) => [c.id, c]));
