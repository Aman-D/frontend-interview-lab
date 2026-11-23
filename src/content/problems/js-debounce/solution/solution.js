/**
 * Trailing-edge debounce with cancel() and flush().
 */
export function debounce(fn, wait = 0) {
  if (typeof fn !== 'function') throw new TypeError('Expected a function');

  let timerId = null;
  let lastArgs = null;
  let lastThis = null;

  function invoke() {
    const args = lastArgs;
    const ctx = lastThis;
    timerId = null;
    lastArgs = lastThis = null;
    return fn.apply(ctx, args);
  }

  function debounced(...args) {
    lastArgs = args;
    lastThis = this;
    if (timerId !== null) clearTimeout(timerId);
    timerId = setTimeout(invoke, wait);
  }

  debounced.cancel = function cancel() {
    if (timerId !== null) clearTimeout(timerId);
    timerId = null;
    lastArgs = lastThis = null;
  };

  debounced.flush = function flush() {
    if (timerId === null) return undefined;
    clearTimeout(timerId);
    return invoke();
  };

  return debounced;
}
