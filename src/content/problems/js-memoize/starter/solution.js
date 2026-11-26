/**
 * Returns a memoized version of `fn`.
 *
 * - By default the cache key is the FIRST argument.
 * - If `resolver` is given, the key is `resolver.apply(this, args)`.
 * - The memoized function exposes `.cache` (a Map) and `.clear()`.
 *
 * @param {Function} fn
 * @param {Function} [resolver]
 */
export function memoize(fn, resolver) {
  // TODO: implement
  return function memoized(...args) {};
}
