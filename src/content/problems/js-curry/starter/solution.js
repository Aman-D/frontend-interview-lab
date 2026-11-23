/**
 * Returns a curried version of `fn`.
 *
 * The curried function collects arguments across calls and invokes `fn` once at
 * least `fn.length` arguments have been supplied.
 *
 *   const join = (a, b, c) => `${a}_${b}_${c}`;
 *   curry(join)(1)(2)(3);   // '1_2_3'
 *   curry(join)(1, 2)(3);   // '1_2_3'
 *
 * @param {Function} fn
 * @returns {Function}
 */
export function curry(fn) {
  // TODO: implement
  return function curried(...args) {
    return fn(...args);
  };
}
