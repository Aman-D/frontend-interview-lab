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
  if (typeof fn !== 'function') throw new TypeError('throttle: fn must be a function');

  let timerId = null; // non-null while a window is open
  let pendingArgs = null; // latest call made during the window
  let pendingThis = null;

  function startWindow() {
    timerId = setTimeout(endWindow, wait);
  }

  function endWindow() {
    if (pendingArgs) {
      const args = pendingArgs;
      const ctx = pendingThis;
      pendingArgs = pendingThis = null;
      // The trailing call opens a new window, so calls right after it are throttled too.
      startWindow();
      fn.apply(ctx, args);
    } else {
      timerId = null;
    }
  }

  function throttled(...args) {
    if (timerId === null) {
      startWindow();
      fn.apply(this, args);
    } else {
      pendingArgs = args;
      pendingThis = this;
    }
  }

  throttled.cancel = function cancel() {
    if (timerId !== null) clearTimeout(timerId);
    timerId = null;
    pendingArgs = pendingThis = null;
  };

  return throttled;
}
