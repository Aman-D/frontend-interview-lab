/**
 * Re-implementation of Promise.all().
 *
 * - Accepts any iterable (array, Set, generator, string...).
 * - Non-promise values and thenables are normalised with Promise.resolve().
 * - Fulfils with values in INPUT order, regardless of settle order.
 * - Rejects with the first rejection reason; later outcomes are ignored.
 * - Never throws synchronously: a bad input becomes a rejected promise.
 */
export function promiseAll(iterable) {
  return new Promise((resolve, reject) => {
    // A throw inside the executor rejects the returned promise, which is exactly
    // how the native implementation reports a non-iterable argument.
    if (iterable == null || typeof iterable[Symbol.iterator] !== 'function') {
      throw new TypeError(`${String(iterable)} is not iterable`);
    }

    const results = [];
    let remaining = 0;
    let index = 0;

    for (const item of iterable) {
      const position = index++; // captured per item so each callback writes its own slot
      remaining++;
      Promise.resolve(item).then((value) => {
        results[position] = value;
        remaining--;
        if (remaining === 0) resolve(results);
      }, reject); // reject is a no-op once the promise has settled
    }

    // Empty iterable: nothing will ever call the callbacks above.
    if (remaining === 0) resolve(results);
  });
}
