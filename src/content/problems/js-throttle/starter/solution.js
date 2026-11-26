/**
 * Returns a throttled version of `fn` that runs at most once per `wait` ms.
 *
 * - Leading edge: the first call runs immediately.
 * - Trailing edge: calls made during the window collapse into ONE call at the
 *   end of the window, with the latest arguments and `this`.
 * - throttled.cancel() drops any pending trailing call and resets the window.
 *
 * @param {Function} fn
 * @param {number} wait
 */
export function throttle(fn, wait) {
  // TODO: implement
  return function throttled(...args) {};
}
