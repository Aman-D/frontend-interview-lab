/**
 * Implement your own versions of the built-in ReturnType<T> and Parameters<T>
 * WITHOUT using the built-ins.
 *
 *   type R = MyReturnType<(a: string) => number>;      // number
 *   type P = MyParameters<(a: string, b?: boolean) => void>; // [a: string, b?: boolean]
 *
 * Both must reject non-function types at compile time:
 *   type Bad = MyReturnType<string>; // error
 */

// TODO: constrain T and extract the return type
export type MyReturnType<T> = any;

// TODO: constrain T and extract the parameter tuple
export type MyParameters<T> = any;
