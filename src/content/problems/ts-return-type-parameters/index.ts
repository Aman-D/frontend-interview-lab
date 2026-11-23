import type { CodingProblem } from '../../schema';
import starter from './starter/solution.ts?raw';
import solution from './solution/solution.ts?raw';
import typeUtils from './support/type-utils.ts?raw';
// Stored on disk without the `.test.ts` suffix so Vitest never collects them; they are
// only type-checked by the in-browser runner under the virtual paths below.
import publicTypeTests from './tests/types.ts?raw';
import hiddenTypeTests from './tests/types.hidden.ts?raw';

const problem: CodingProblem = {
  schemaVersion: 1,
  kind: 'coding',
  id: 'ts-return-type-parameters',
  slug: 'return-type-and-parameters',
  title: 'Implement ReturnType<T> and Parameters<T>',
  track: 'typescript',
  execution: 'ts-types',
  difficulty: 'easy',
  priority: 'P1',
  seniority: ['Senior', 'SDE-2'],
  topics: ['conditional types', 'infer', 'generic constraints', 'utility types'],
  estimatedMinutes: 15,
  conceptIds: ['conditional-types-infer', 'generics'],
  research: {
    provenance: 'PUBLISHED_PRACTICE_PROBLEM',
    frequencyConfidence: 'MEDIUM_CONFIDENCE',
    verificationStatus: 'PARTIALLY_VERIFIED',
    lastVerified: '2026-11-23',
    evidence: [
      { sourceId: 'bfe-ts', url: 'https://bigfrontend.dev/typescript/ReturnType', originalTitle: '12. implement ReturnType<T>' },
      { sourceId: 'bfe-ts', url: 'https://bigfrontend.dev/typescript/Parameters', originalTitle: '10. implement Parameters<T>' },
    ],
    researchNotes:
      'Two adjacent BFE.dev TypeScript problems, combined here because they use the same technique (conditional type + infer on a function type). Only the listing titles were read. Expected behaviour (overloads resolve to the last signature, `this` parameters are excluded, distributive behaviour over never) was taken from how the compiler treats the built-in utility types, which the hidden tests compare against directly.',
  },
  spec: {
    summary: 'Re-implement the built-in ReturnType<T> and Parameters<T> utility types with a constrained generic, a conditional type and infer.',
    description: `In \`solution.ts\`, implement two exported types **without using the built-in \`ReturnType\` or \`Parameters\`**:

- \`MyReturnType<T>\` — the return type of the function type \`T\`.
- \`MyParameters<T>\` — the parameters of \`T\` as a tuple (names, optional and rest elements preserved).

Both must **only accept function types**: \`MyReturnType<string>\` must be a compile error at the place it is used.

\`\`\`ts
type A = MyReturnType<(id: number) => Promise<User>>; // Promise<User>
type B = MyParameters<(id: number, opts?: Options) => void>; // [id: number, opts?: Options]
type C = MyParameters<() => void>; // []
type D = MyReturnType<string>; // ❌ compile error
\`\`\`

The tests are **type-level**: each \`// @test:\` block passes when the TypeScript compiler reports no error in it. \`Expect<Equal<A, B>>\` only compiles when \`A\` and \`B\` are identical, and a \`// @ts-expect-error\` line passes only if the next line really is an error. The helpers live in the read-only \`type-utils.ts\`.`,
    technologies: ['TypeScript'],
    learningObjectives: [
      'Write a generic constraint that limits a type parameter to functions',
      'Use a conditional type with infer to extract part of a type',
      'Understand how overloads, generics, this-parameters and never behave in conditional types',
      'Read and write type-level tests with Equal/Expect and @ts-expect-error',
    ],
    clarifications: [
      {
        question: 'Should non-function inputs return never or be a compile error?',
        why: 'Returning never hides mistakes (the error shows up far away); a constraint reports it where the type is used.',
        defaultAssumption: 'Compile error via a constraint on T.',
      },
      {
        question: 'Which signature of an overloaded function is used?',
        why: 'infer against an overloaded type cannot pick "the right" overload; the compiler uses the last one.',
        defaultAssumption: 'Same as the built-ins: the last overload.',
      },
      {
        question: 'Should parameter names and optional/rest markers be kept?',
        why: 'Named tuple elements improve editor hints when the tuple is reused, e.g. in wrapper functions.',
        defaultAssumption: 'Yes; inferring the whole parameter list as one tuple keeps them automatically.',
      },
    ],
    scopeDecisions: [
      'Constructor types (ConstructorParameters/InstanceType) are a follow-up, not part of this exercise.',
      'Only the type definitions are graded; there is no runtime code.',
    ],
    requirements: [
      { id: 'return-type', category: 'functional', level: 'MUST', text: 'MyReturnType<F> is the return type of F, including unions, objects, void, promises and function types.' },
      { id: 'parameters', category: 'functional', level: 'MUST', text: 'MyParameters<F> is the parameter list of F as a tuple, preserving names, optional and rest elements; [] for no parameters.' },
      { id: 'constraint', category: 'technical', level: 'MUST', text: 'Both types reject non-function arguments (primitives, plain object types, class constructors, undefined) at compile time.' },
      { id: 'no-builtins', category: 'technical', level: 'MUST', text: 'The built-in ReturnType and Parameters are not used in the solution.' },
      { id: 'overloads', category: 'edge-case', level: 'MUST', text: 'For overloaded functions, the result matches the built-ins (last signature).' },
      { id: 'generics', category: 'edge-case', level: 'MUST', text: 'For generic functions, the result matches the built-ins.' },
      { id: 'this-param', category: 'edge-case', level: 'MUST', text: 'A `this` parameter is not included in MyParameters.' },
      { id: 'never-input', category: 'edge-case', level: 'SHOULD', text: 'MyReturnType<never> and MyParameters<never> are never, as with the built-ins (distribution over an empty union).' },
      { id: 'type-tests', category: 'testing', level: 'SHOULD', text: 'Positive cases use Expect<Equal<…>>; negative cases use @ts-expect-error.' },
    ],
    constraints: ['Do not use ReturnType, Parameters or any other built-in utility type in solution.ts.'],
    acceptanceCriteria: ['solution.ts compiles.', 'All public type tests pass.', 'All hidden type tests pass (typeof functions, rest parameters, overloads, generics, this-parameters, never, rejected constructors).'],
    examples: [
      { title: 'Return type', input: 'MyReturnType<() => Promise<number>>', output: 'Promise<number>' },
      { title: 'Parameters', input: 'MyParameters<(a: string, ...rest: number[]) => void>', output: '[a: string, ...rest: number[]]' },
      { title: 'Overload', input: 'declare function f(x: number): string; declare function f(x: Date): boolean; MyReturnType<typeof f>', output: 'boolean' },
      { title: 'Rejected', input: 'MyReturnType<string>', output: 'Error: Type \'string\' does not satisfy the constraint \'(...args: any) => any\'.' },
    ],
    manualTests: ['Hover over a few aliases in the editor (e.g. `type X = MyParameters<typeof fetch>`) and compare with the built-in result.'],
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
  ],
  hints: [
    'First make bad inputs fail: add a constraint to the type parameter, e.g. `T extends (...args: any) => any`. Using `any` (not `unknown[]`) for the arguments lets every function type satisfy it.',
    'A conditional type can "pattern match" a type: `T extends SomeShape ? A : B`. Put a placeholder in the shape where the part you want sits.',
    'That placeholder is `infer`: `T extends (...args: any) => infer R ? R : never`. R is filled in from T.',
    'For the parameters, infer the whole rest-parameter list at once — `(...args: infer P) => any` — so names, optional and rest elements are kept.',
  ],
  solution: {
    initialApproach:
      'A conditional type that matches T against a function shape and uses infer for the part to extract: the return position for MyReturnType and the rest-parameter list for MyParameters. Add a constraint so non-functions are rejected.',
    bruteForce:
      'Without a constraint (`type MyReturnType<T> = T extends (...a: any) => infer R ? R : never`) the type "works" but silently returns never for MyReturnType<string>. The error then surfaces wherever the never value is used — far from the actual mistake. The constraint is what the negative tests check.',
    optimizedApproach:
      '`type MyReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R ? R : never;` and `type MyParameters<T extends (...args: any) => any> = T extends (...args: infer P) => any ? P : never;` — essentially the standard library definitions. (The library\'s ReturnType uses `any` instead of `never` in the unreachable false branch; the only observable difference is `ReturnType<any>`, which is `any` there and `unknown` here.)',
    walkthrough: `1. **Constraint**: \`T extends (...args: any) => any\` is the widest function type. A plain \`any\` for the rest parameter (rather than \`any[]\` or \`unknown[]\`) avoids assignability surprises with parameter types, and functions with a \`this\` parameter still match.
2. **Conditional type**: \`T extends (...args: any) => infer R ? R : never\`. The compiler tries to match T against the shape and, when it can, binds R to whatever is in the return position.
3. **The false branch** (\`never\`) is unreachable for valid input because of the constraint, but conditional types always need one.
4. **Parameters**: \`(...args: infer P) => any\`. Inferring the whole rest list produces a tuple type with labels (\`[id: string, opts?: Options]\`), optional elements and rest elements intact.
5. **Overloads**: inferring from an overloaded type uses the last signature, so results match the built-ins.
6. **Distribution**: because T is a naked type parameter, the conditional distributes over unions and never — \`MyParameters<never>\` is \`never\`, again like the built-in.
7. **\`this\` parameters** are not part of the parameter list, so \`MyParameters<(this: Window, e: Event) => void>\` is \`[e: Event]\`.`,
    complexity: 'Type-level only; constant compile-time cost per use. No runtime code is emitted.',
    edgeCases:
      '- **Overloads** → last signature.\n- **Generic functions** (`<T>(x: T) => T`) → type parameters are replaced by their constraints, giving `unknown` for the return type here.\n- **`this` parameter** → excluded from the tuple.\n- **Optional and rest parameters** → preserved as `opts?:` and `...rest:` elements.\n- **never** → `never` (distribution over an empty union).\n- **any** → the conditional resolves to *both* branches. With `never` as the false branch you get `unknown` (the inferred R); the library\'s ReturnType writes `any` in its false branch, so `ReturnType<any>` is `any`.\n- **Union of functions** → distributes: `MyReturnType<(() => A) | (() => B)>` is `A | B`.\n- **Class constructors** → rejected; use `new (...args: any) => infer R` for InstanceType.',
    alternatives:
      '- **`unknown[]` / `never` in the constraint**: `(...args: never) => unknown` accepts every function under strict function types and is a popular modern alternative; `(...args: unknown[]) => unknown` rejects functions with specific parameter types and is a common bug.\n- **Without constraint, returning never**: simpler, but hides mistakes.\n- **Constructor versions**: `T extends abstract new (...args: any) => infer R ? R : never` for InstanceType and ConstructorParameters.',
    tradeoffs:
      'A constraint gives earlier, clearer errors but forces every caller to prove T is a function — which matters inside other generic types, where you may need `T extends (...args: any) => any ? MyReturnType<T> : never` to satisfy it. Matching the built-ins exactly (overloads, distribution) keeps behaviour predictable for people who already know them.',
    commonMistakes:
      '- Using `(...args: unknown[]) => unknown` as the constraint: `(x: string) => void` is not assignable to it, so valid functions are rejected.\n- Inferring parameters one by one (`(a: infer A, b: infer B) => any`), which only works for a fixed arity and loses labels.\n- Forgetting the constraint, so `MyReturnType<string>` is silently `never`.\n- Wrapping in a tuple (`[T] extends [...]`) and accidentally turning off distribution.\n- Writing `infer` outside the `extends` clause of a conditional type (a syntax error).',
    testingStrategy:
      'Use `Expect<Equal<Actual, Expected>>` for exact matches — mutual assignability is not enough because it would accept `any`. Compare against the built-ins for overloads and generics, where the expected type is subtle. Use `@ts-expect-error` for inputs that must not compile; an unused directive is itself an error, so a too-loose type fails the test.',
    seniorFollowUps:
      '- Implement ConstructorParameters and InstanceType. How do abstract classes change the constraint?\n- Write `Awaited<T>`-style recursive unwrapping of the return type of an async function.\n- Why does the `Equal` helper use generic function types instead of `X extends Y ? Y extends X ? true : false : false`?\n- How would you type a `wrap(fn)` helper that returns a function with the same parameters and a Promise of the same return type?',
  },
  followUps: [
    {
      id: 'f1',
      level: 'definition',
      question: 'What does the infer keyword do, and where is it allowed?',
      expectedConcepts: ['declares a type variable inferred from a match', 'only in the extends clause of a conditional type', 'available in the true branch'],
      sourceIds: ['ts-conditional'],
    },
    {
      id: 'f2',
      level: 'mechanism',
      question: 'What is a distributive conditional type? What do MyReturnType<(() => A) | (() => B)> and MyParameters<never> evaluate to?',
      expectedConcepts: ['naked type parameter distributes over unions', 'A | B', 'never is an empty union, result never', 'wrap in a tuple to disable'],
      sourceIds: ['ts-conditional'],
    },
    {
      id: 'f3',
      level: 'edge-cases',
      question: 'Why does `(...args: unknown[]) => unknown` make a poor constraint here, while `(...args: any) => any` works?',
      expectedConcepts: ['parameter contravariance under strictFunctionTypes', '(x: string) => void is not assignable to (...args: unknown[]) => unknown', 'any or never in parameter position'],
      sourceIds: ['ts-generics'],
    },
    {
      id: 'f4',
      level: 'application',
      question: 'Implement InstanceType<T> and ConstructorParameters<T>. What changes in the constraint and the pattern?',
      expectedConcepts: ['new (...args: any) => infer R', 'abstract new for abstract classes', 'same infer technique'],
      sourceIds: ['ts-utility'],
    },
    {
      id: 'f5',
      level: 'production',
      question: 'Type a `withRetry(fn, attempts)` helper so the returned function has exactly the same parameters as fn and returns a Promise of fn\'s awaited return type.',
      expectedConcepts: ['generic F extends (...args: any) => any', '(...args: Parameters<F>) => Promise<Awaited<ReturnType<F>>>', 'overload loss'],
      sourceIds: ['ts-utility', 'ts-generics'],
    },
    {
      id: 'f6',
      level: 'architecture',
      question: 'An API client is typed by deriving request and response types from handler functions with ReturnType/Parameters. What are the benefits and the risks compared with declaring the types explicitly?',
      expectedConcepts: ['single source of truth', 'refactors propagate automatically', 'overloads and generics lose precision', 'harder-to-read error messages', 'accidental public API changes'],
      sourceIds: ['ts-utility'],
    },
  ],
  mcqs: [
    {
      id: 'm1',
      question: 'Given the declarations below, what is `ReturnType<typeof parse>`?',
      code: `declare function parse(input: string): number;
declare function parse(input: string, radix: number): bigint;`,
      options: [
        { id: 'a', text: 'number', explanation: 'That is the first overload; inference from overloaded types uses the last one.' },
        { id: 'b', text: 'number | bigint', explanation: 'The compiler does not union the overloads.' },
        { id: 'c', text: 'bigint', explanation: 'Correct: inference from a type with several call signatures uses the last signature.' },
        { id: 'd', text: 'A compile error, because parse is overloaded', explanation: 'Overloaded functions are accepted; only the choice of signature is surprising.' },
      ],
      correctOptionId: 'c',
      explanation: 'When inferring from a type with multiple call signatures, TypeScript uses the last signature (usually the most general one). Your own infer-based types behave the same way.',
      sourceIds: ['ts-conditional'],
    },
    {
      id: 'm2',
      question: 'Which definition makes `MyReturnType<string>` a compile error?',
      options: [
        { id: 'a', text: 'type MyReturnType<T> = T extends (...a: any) => infer R ? R : never', explanation: 'Without a constraint, MyReturnType<string> is valid and evaluates to never.' },
        { id: 'b', text: 'type MyReturnType<T extends (...a: any) => any> = T extends (...a: any) => infer R ? R : never', explanation: 'Correct: the constraint is checked where the type is used, so string is rejected.' },
        { id: 'c', text: 'type MyReturnType<T> = T extends Function ? any : never', explanation: 'No constraint, and it loses the actual return type.' },
        { id: 'd', text: 'type MyReturnType<T> = [T] extends [(...a: any) => infer R] ? R : never', explanation: 'Wrapping in a tuple only turns off distribution; it does not reject string.' },
      ],
      correctOptionId: 'b',
      explanation: 'A generic constraint (`T extends ...` in the type parameter list) produces an error at the use site. A conditional type alone can only map bad input to some result type such as never.',
      sourceIds: ['ts-generics', 'ts-conditional'],
    },
  ],
};

export default problem;
