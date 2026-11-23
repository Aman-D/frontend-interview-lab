/**
 * Arity-based curry.
 *
 * - Arity comes from fn.length (declared parameters before the first default/rest).
 * - Any number of arguments can be supplied per call; extra arguments are forwarded.
 * - Every partial application is immutable, so partials can be reused safely.
 */
export function curry(fn) {
  if (typeof fn !== 'function') throw new TypeError('curry expects a function');
  const arity = fn.length;

  function curried(...args) {
    if (args.length >= arity) {
      // Enough arguments: call through. `this` is forwarded as a courtesy.
      return fn.apply(this, args);
    }
    // Not enough yet: return a new function that remembers what we have so far.
    // A fresh array is built on every call, so `args` is never mutated.
    return function partial(...more) {
      return curried.apply(this, [...args, ...more]);
    };
  }

  return curried;
}
