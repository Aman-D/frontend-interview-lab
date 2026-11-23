/**
 * Re-implementation of Promise.all().
 *
 * Returns a promise that fulfils with an array of the fulfilment values of every
 * item in `iterable` (in input order), or rejects with the reason of the first
 * item that rejects.
 *
 * @param {Iterable<any>} iterable
 * @returns {Promise<any[]>}
 */
export function promiseAll(iterable) {
  // TODO: implement
  return Promise.resolve([]);
}
