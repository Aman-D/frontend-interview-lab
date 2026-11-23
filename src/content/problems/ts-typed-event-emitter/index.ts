import type { CodingProblem } from '../../schema';
import starter from './starter/solution.ts?raw';
import solution from './solution/solution.ts?raw';
import typeUtils from './support/type-utils.ts?raw';
// Stored on disk without the `.test.ts` suffix so Vitest never collects them; the runner
// uses the virtual paths below.
import publicTypeTests from './tests/types.ts?raw';
import hiddenTypeTests from './tests/types.hidden.ts?raw';
import publicRuntimeTests from './tests/runtime.ts?raw';
import hiddenRuntimeTests from './tests/runtime.hidden.ts?raw';

const problem: CodingProblem = {
  schemaVersion: 1,
  kind: 'coding',
  id: 'ts-typed-event-emitter',
  slug: 'typed-event-emitter',
  title: 'Type-safe Event Emitter',
  track: 'typescript',
  execution: 'ts-types',
  difficulty: 'medium',
  priority: 'P1',
  seniority: ['Senior', 'SDE-2', 'SDE-3'],
  topics: ['generics', 'keyof', 'indexed access types', 'mapped types', 'variadic tuples', 'observer pattern'],
  estimatedMinutes: 30,
  conceptIds: ['generics', 'mapped-types-keyof', 'observer-pattern', 'closures'],
  research: {
    provenance: 'ORIGINAL_VARIATION',
    frequencyConfidence: 'LOW_CONFIDENCE',
    verificationStatus: 'PARTIALLY_VERIFIED',
    lastVerified: '2026-11-23',
    variationOf:
      'BFE.dev "16. create an Event Emitter" (a JavaScript problem). This variation keeps the runtime behaviour and adds a TypeScript layer: an event map type parameter, keyof-constrained event names and tuple payloads, so that wrong names or payloads become compile errors. It exists to practise generics, keyof and indexed access types on a familiar problem.',
    evidence: [
      {
        sourceId: 'bfe-problems',
        url: 'https://bigfrontend.dev/problem/create-an-Event-Emitter',
        originalTitle: '16. create an Event Emitter',
        note: 'Base problem (JavaScript). The typed version is this project\'s own extension.',
      },
    ],
    researchNotes:
      'No source read for this project lists a "typed event emitter" question explicitly, so frequency confidence is LOW. The base problem is well attested (see js-event-emitter). The typing technique follows the TypeScript Handbook chapters on generics, keyof and indexed access types.',
  },
  spec: {
    summary: 'Write a generic TypedEmitter<Events> class whose on/off/emit reject unknown event names and wrong payloads at compile time, and that works correctly at runtime.',
    description: `Implement \`class TypedEmitter<Events extends Record<string, unknown[]>>\` in \`solution.ts\`.

\`Events\` maps each event name to the **tuple of arguments** its listeners receive:

\`\`\`ts
type AppEvents = {
  login: [userId: string];
  move: [x: number, y: number];
  logout: [];
};

const emitter = new TypedEmitter<AppEvents>();
const stop = emitter.on('move', (x, y) => console.log(x + y)); // x, y inferred as number
emitter.emit('move', 1, 2);   // ✅
emitter.emit('move', 1);      // ❌ missing argument
emitter.emit('login', 42);    // ❌ wrong type
emitter.emit('signup');       // ❌ unknown event
stop();
\`\`\`

**Type requirements** (checked by the compiler):
- \`on(name, listener)\`, \`off(name, listener)\` and \`emit(name, ...args)\` only accept names from \`Events\`.
- \`emit\` requires exactly the payload tuple of that event; listener parameters are inferred from it.
- \`on\` returns \`() => void\`.

**Runtime requirements** (checked by runtime tests):
- Listeners run synchronously in subscription order with the emitted arguments.
- \`on\` returns an unsubscribe function for **that** subscription; \`off\` removes one subscription of a function.
- A listener that unsubscribes during \`emit\` must not cause the next listener to be skipped; listeners added during \`emit\` run from the next \`emit\`.

Type tests use \`Expect<Equal<…>>\` and \`// @ts-expect-error\` from the read-only \`type-utils.ts\`.`,
    technologies: ['TypeScript', 'generics', 'keyof', 'mapped types'],
    learningObjectives: [
      'Model an event map as a type parameter with tuple payloads',
      'Use K extends keyof Events and Events[K] to link one argument\'s type to another\'s',
      'Type variadic arguments with a rest parameter of a tuple type',
      'Store heterogeneous listeners with a mapped type instead of any',
      'Keep runtime behaviour correct while satisfying the type layer',
    ],
    clarifications: [
      {
        question: 'Why tuples for payloads instead of a single payload object?',
        why: 'Tuples allow zero, one or several arguments with names, and `...args: Events[K]` gives exact arity checking.',
        defaultAssumption: 'Each event maps to an argument tuple; an event without data maps to [].',
      },
      {
        question: 'Can the event map be declared with an interface?',
        why: 'Interfaces have no implicit index signature, so they do not satisfy Record<string, unknown[]>; type aliases do.',
        defaultAssumption: 'Use type aliases for event maps (the tests do). Supporting interfaces is a follow-up.',
      },
      {
        question: 'What happens when emit is called with a variable whose type is a union of event names?',
        why: 'K is then inferred as the union and Events[K] becomes a union of tuples, which is unsound for listeners of either event.',
        defaultAssumption: 'Out of scope; emit is called with literal names. Discussed in the follow-ups.',
      },
      {
        question: 'Should runtime behaviour match the JavaScript emitter exactly (once, emit return value)?',
        why: 'Keeping the API small keeps the focus on the types.',
        defaultAssumption: 'Only on/off/emit are required; once() is optional and untested; emit returns void.',
      },
    ],
    scopeDecisions: [
      'No once(), wildcard listeners or async emit.',
      'Event maps are type aliases; interface support is a follow-up.',
      'Union-typed event names passed to emit are not made sound.',
      'No `any` in the public API; internal casts should be avoided if possible.',
    ],
    requirements: [
      { id: 'names', category: 'technical', level: 'MUST', text: 'on, off and emit reject event names that are not keys of Events.' },
      { id: 'payload', category: 'technical', level: 'MUST', text: 'emit requires exactly the tuple Events[K] as its rest arguments (wrong types, missing or extra arguments are errors).' },
      { id: 'listener-inference', category: 'technical', level: 'MUST', text: 'Listener parameters are inferred from the event map; incompatible listener parameter types are errors; fewer parameters are allowed.' },
      { id: 'return-type', category: 'technical', level: 'MUST', text: 'on returns () => void.' },
      { id: 'constraint', category: 'technical', level: 'MUST', text: 'TypedEmitter rejects event maps whose values are not argument tuples.' },
      { id: 'runtime-emit', category: 'functional', level: 'MUST', text: 'emit calls the event\'s listeners synchronously, in subscription order, with the arguments.' },
      { id: 'runtime-unsubscribe', category: 'functional', level: 'MUST', text: 'The function returned by on removes exactly that subscription and is idempotent; off removes one subscription of a function.' },
      { id: 'runtime-snapshot', category: 'edge-case', level: 'MUST', text: 'Changing subscriptions during emit neither skips listeners nor calls listeners added during that emit.' },
      { id: 'runtime-duplicates', category: 'edge-case', level: 'MUST', text: 'The same function subscribed twice is called twice.' },
      { id: 'isolation', category: 'technical', level: 'MUST', text: 'Instances do not share listeners.' },
      { id: 'no-any', category: 'technical', level: 'SHOULD', text: 'The implementation stores listeners with a mapped type rather than any or Function.' },
      { id: 'cleanup', category: 'performance', level: 'SHOULD', text: 'Empty listener lists are removed.' },
      { id: 'two-layers', category: 'testing', level: 'SHOULD', text: 'Both compile-time (type tests) and runtime behaviour are tested.' },
    ],
    constraints: ['No libraries.', 'Do not widen method signatures to string or any[].'],
    acceptanceCriteria: [
      'solution.ts compiles.',
      'All public type and runtime tests pass.',
      'All hidden type and runtime tests pass (listener parameter checks, object payloads, off typing, event-map constraint, separate maps, removal and addition during emit, duplicates, isolation).',
    ],
    examples: [
      { title: 'Inference', input: "emitter.on('move', (x, y) => ...)", output: 'x: number, y: number' },
      { title: 'Unknown event', input: "emitter.emit('signup')", output: 'Compile error: Argument of type \'"signup"\' is not assignable to parameter of type \'keyof AppEvents\'.' },
      { title: 'Wrong arity', input: "emitter.emit('move', 1)", output: 'Compile error: Expected 3 arguments, but got 2.' },
    ],
    manualTests: [
      'Hover the listener parameters in the editor to see the inferred types.',
      'Rename an event in the map and check that every call site using the old name fails to compile.',
    ],
  },
  files: {
    entry: '/solution.ts',
    starter: { '/solution.ts': starter },
    solution: { '/solution.ts': solution },
    readonly: [],
    support: { '/type-utils.ts': typeUtils },
  },
  tests: [
    { path: '/tests/types.test.ts', visibility: 'public', kind: 'type', source: publicTypeTests },
    { path: '/tests/types.hidden.test.ts', visibility: 'hidden', kind: 'type', source: hiddenTypeTests },
    { path: '/tests/runtime.test.ts', visibility: 'public', kind: 'runtime', source: publicRuntimeTests },
    { path: '/tests/runtime.hidden.test.ts', visibility: 'hidden', kind: 'runtime', source: hiddenRuntimeTests },
  ],
  hints: [
    'Make each method generic in the event name: `emit<K extends keyof Events>(eventName: K, ...args: Events[K])`. TypeScript infers K from the literal you pass, then Events[K] is that event\'s tuple.',
    'Type listeners the same way: `listener: (...args: Events[K]) => void`. Because K is inferred from the first argument, the callback\'s parameters are contextually typed.',
    'Store listeners in a mapped type: `{ [K in keyof Events]?: Array<Subscription<Events[K]>> }`. It keeps each event\'s listeners typed without any.',
    'For runtime correctness, store one object per subscription (so duplicates and disposers work) and loop over a copy of the array in emit.',
  ],
  solution: {
    initialApproach:
      'Start from a working JavaScript emitter, then thread a type parameter through it: the class takes an event map, every method takes K extends keyof Events, payloads are Events[K], and the storage becomes a mapped type over the event map.',
    bruteForce:
      'Typing everything as `(eventName: string, ...args: any[])` compiles and runs, but catches nothing at compile time — the starter does exactly this. Adding overloads per event works for a fixed set of events but does not scale and cannot be generic.',
    optimizedApproach:
      'Generic methods with `K extends keyof Events` link the name to `Events[K]`; rest parameters of tuple type give exact arity checking; the listener type `(...args: Events[K]) => void` gives contextual typing. Storage is `{ [K in keyof Events]?: Array<{ listener: Listener<Events[K]> }> }`, so no `any` is needed. At runtime, subscriptions are records (identity per subscription) and emit iterates a snapshot.',
    walkthrough: `1. **Event map constraint**: \`Events extends Record<string, unknown[]>\` — every value must be an argument tuple; \`{ save: string }\` is rejected.
2. **\`type Listener<Args extends unknown[]> = (...args: Args) => void\`** — a function whose parameters are exactly the tuple.
3. **Storage**: \`private subscriptions: { [K in keyof Events]?: Array<Subscription<Events[K]>> } = {}\`. Indexing it with a generic K gives \`Array<Subscription<Events[K]>> | undefined\`, which keeps types aligned inside the methods.
4. **\`on<K extends keyof Events>(eventName: K, listener: Listener<Events[K]>)\`**: create \`{ listener }\`, append it, and return \`() => this.remove(eventName, subscription)\`.
5. **\`off\`**: scan from the end for a record whose \`listener\` is the given function and remove that one record.
6. **\`emit<K extends keyof Events>(eventName: K, ...args: Events[K])\`**: copy the array and call each listener with \`...args\`.
7. **\`remove\`**: \`indexOf\` the record; if found, splice it and delete the key when the array is empty. A second call finds nothing, so disposers are idempotent.

At call sites, \`emit('move', 1)\` fails because \`[1]\` is not assignable to \`[x: number, y: number]\`, and \`emit('signup')\` fails because \`"signup"\` is not assignable to \`keyof AppEvents\`.`,
    complexity: 'Runtime: on O(1); off/unsubscribe O(k); emit O(k) for k listeners on that event (plus the snapshot copy). Types add no runtime cost; they are erased.',
    edgeCases:
      '- **Event with no payload** (`[]`) → `emit("logout")` only; extra arguments are errors.\n- **Listener with fewer parameters** → allowed (TypeScript permits ignoring trailing parameters).\n- **Listener with an incompatible parameter type** → error under strictFunctionTypes.\n- **Interface event maps** → fail the Record constraint (no implicit index signature).\n- **Union event names** (`emit(name as "a" | "b", ...)`) → Events[K] becomes a union of tuples, so a payload valid for only one event is accepted — unsound, documented as out of scope.\n- **Self-unsubscribe during emit** and **duplicates** → handled by records + snapshot, as in the JavaScript version.',
    alternatives:
      '- **Payload objects instead of tuples**: `Events extends Record<string, unknown>`, `emit<K>(name: K, payload: Events[K])` — simpler types, one argument per event.\n- **Constraint that accepts interfaces**: `class TypedEmitter<Events extends { [K in keyof Events]: unknown[] }>`.\n- **Wrap EventTarget**: typed `addEventListener` over CustomEvent with `detail`; native but less ergonomic.\n- **Libraries** such as mitt or typed Node emitter definitions use the same keyof/indexed-access technique.',
    tradeoffs:
      'Tuple payloads give exact arity checks and named parameters but are slightly harder to read than payload objects, and changing a payload shape is a breaking change everywhere. Strong typing catches typos and payload drift at compile time, but complex generic signatures produce harder error messages and do not protect against data crossing an untyped boundary (postMessage, JSON).',
    commonMistakes:
      '- Typing the name as `string` (or `keyof Events` without a type parameter), so the payload cannot depend on the name.\n- Using `...args: any[]` in emit.\n- Using an interface for the event map and being surprised by the constraint error.\n- Storing listeners as `Function[]` or `any`, losing the link between storage and API.\n- Forgetting the runtime: perfect types with an emit that skips listeners during unsubscribe still fails.',
    testingStrategy:
      'Two layers. Type tests: positive calls compile; unknown names, wrong payload types, wrong arity, wrong listener parameter types and non-tuple event maps are `@ts-expect-error`; inferred listener parameter types are checked with `Expect<Equal<typeof x, number>>`. Runtime tests: order and arguments, unsubscribe, off, isolation, self-unsubscribe during emit, subscribe during emit, duplicates.',
    seniorFollowUps:
      '- Make emit sound for union-typed event names (e.g. require K to be a single literal with a helper type).\n- Accept interface-based event maps.\n- Add `once` and `waitFor(name): Promise<Events[K]>` with correct types.\n- How do you keep an event map type shared between a web worker and the main thread so both sides stay in sync?',
  },
  followUps: [
    {
      id: 'f1',
      level: 'definition',
      question: 'What do `keyof Events` and `Events[K]` evaluate to for `type E = { a: [number]; b: [] }`?',
      expectedConcepts: ['"a" | "b"', 'indexed access type', 'E["a"] is [number]'],
      sourceIds: ['ts-keyof'],
    },
    {
      id: 'f2',
      level: 'mechanism',
      question: 'How does TypeScript infer the parameter types of the arrow function in `emitter.on("move", (x, y) => ...)`?',
      expectedConcepts: ['K inferred from the literal argument', 'contextual typing of the callback', 'Listener<Events[K]>', 'rest parameter of tuple type spreads into parameters'],
      sourceIds: ['ts-generics'],
    },
    {
      id: 'f3',
      level: 'edge-cases',
      question: 'Why does `interface AppEvents { login: [string] }` fail the `Record<string, unknown[]>` constraint while the same type alias passes, and how would you change the constraint?',
      expectedConcepts: ['interfaces have no implicit index signature', 'type aliases of object literal types do', '{ [K in keyof Events]: unknown[] } constraint'],
      sourceIds: ['ts-mapped', 'ts-keyof'],
    },
    {
      id: 'f4',
      level: 'edge-cases',
      question: 'Show how a union-typed event name lets an invalid payload compile, and sketch a fix.',
      expectedConcepts: ['K inferred as a union', 'Events[K] is a union of tuples', 'IsUnion check or overloads per key', 'distributive conditional types'],
      sourceIds: ['ts-conditional', 'ts-generics'],
    },
    {
      id: 'f5',
      level: 'production',
      question: 'Events arrive from a WebSocket as JSON and are re-emitted on the typed emitter. Where can the types lie, and how do you guard that boundary?',
      expectedConcepts: ['types are erased at runtime', 'validate with a schema at the boundary', 'unknown instead of any for parsed JSON', 'narrowing'],
      sourceIds: ['ts-narrowing'],
    },
    {
      id: 'f6',
      level: 'architecture',
      question: 'Several teams share one app-wide typed event bus. How would you organise the event map so teams can add events without editing one giant type, and what are the risks?',
      expectedConcepts: ['declaration merging / module augmentation', 'namespaced event names with template literal types', 'ownership and versioning of payloads', 'tight coupling through a global bus'],
      sourceIds: ['ts-template-literal', 'ts-mapped'],
    },
  ],
  mcqs: [
    {
      id: 'm1',
      question: 'Which signature makes `emit("move", 1)` a compile error when `move: [x: number, y: number]`?',
      options: [
        { id: 'a', text: 'emit(eventName: keyof Events, ...args: unknown[]): void', explanation: 'The name is checked, but the payload is not linked to it.' },
        { id: 'b', text: 'emit<K extends keyof Events>(eventName: K, ...args: Events[K]): void', explanation: 'Correct: K is inferred as "move", so the rest arguments must match [number, number] exactly.' },
        { id: 'c', text: 'emit(eventName: string, ...args: any[]): void', explanation: 'Nothing is checked at all.' },
        { id: 'd', text: 'emit<K extends keyof Events>(eventName: K, args: Events[keyof Events]): void', explanation: 'This takes one argument typed as the union of all payload tuples, so arity per event is not enforced.' },
      ],
      correctOptionId: 'b',
      explanation: 'A type parameter constrained to keyof Events captures the literal event name, and an indexed access type in a rest parameter turns that event\'s tuple into the exact argument list.',
      sourceIds: ['ts-generics', 'ts-keyof'],
    },
    {
      id: 'm2',
      question: 'What is `keyof { login: [string]; logout: [] }`?',
      options: [
        { id: 'a', text: 'string', explanation: 'keyof of an object type without an index signature is the union of its literal keys.' },
        { id: 'b', text: '"login" | "logout"', explanation: 'Correct.' },
        { id: 'c', text: '[string] | []', explanation: 'That is the union of the value types (the indexed access T[keyof T]).' },
        { id: 'd', text: 'string | number | symbol', explanation: 'That is the type of keyof any.' },
      ],
      correctOptionId: 'b',
      explanation: 'keyof produces a union of an object type\'s property names. Indexing with that union, T[keyof T], produces the union of the property types.',
      sourceIds: ['ts-keyof'],
    },
  ],
};

export default problem;
