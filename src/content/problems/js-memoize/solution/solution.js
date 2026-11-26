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
  if (typeof fn !== 'function') throw new TypeError('memoize: fn must be a function');
  if (resolver !== undefined && typeof resolver !== 'function') {
    throw new TypeError('memoize: resolver must be a function');
  }

  const cache = new Map();

  function memoized(...args) {
    const key = resolver ? resolver.apply(this, args) : args[0];
    // has() rather than get(): undefined / null / 0 are valid cached results.
    if (cache.has(key)) return cache.get(key);

    // If fn throws, nothing is cached and the error propagates to the caller.
    const result = fn.apply(this, args);
    cache.set(key, result);

    // Async results: share the in-flight promise, but evict it if it rejects so
    // a transient failure is not cached forever.
    if (result !== null && typeof result === 'object' && typeof result.then === 'function') {
      result.then(undefined, () => {
        if (cache.get(key) === result) cache.delete(key);
      });
    }
    return result;
  }

  memoized.cache = cache;
  memoized.clear = () => cache.clear();
  return memoized;
}
