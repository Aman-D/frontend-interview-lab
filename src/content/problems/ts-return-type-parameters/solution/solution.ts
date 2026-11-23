/**
 * T is constrained to "any function", so non-function types are rejected
 * where the type is USED (MyReturnType<string> is a compile error).
 *
 * `(...args: any) => any` is the widest function type: every function type,
 * including ones with a `this` parameter, is assignable to it.
 *
 * The conditional type pattern-matches T against a function type and `infer`
 * declares a type variable that TypeScript fills in from the match.
 */
export type MyReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R ? R : never;

export type MyParameters<T extends (...args: any) => any> = T extends (...args: infer P) => any ? P : never;
