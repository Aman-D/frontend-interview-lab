/**
 * Event delegation helper.
 *
 * One click listener on `root`. For each click, walk up from the event target
 * to the nearest element matching `selector`, and call the handler only if that
 * element is a descendant of `root`.
 */
export function onClickMatching(root, selector, handler) {
  if (!(root instanceof Element)) throw new TypeError('root must be an Element');
  if (typeof handler !== 'function') throw new TypeError('handler must be a function');
  // Validate the selector now, so a typo fails here and not on the first click.
  // (matches() throws a SyntaxError for an invalid selector.)
  root.matches(selector);

  function listener(event) {
    // The target can be a Text node when an event is dispatched on one; start from its parent.
    const start = event.target instanceof Element ? event.target : event.target.parentElement;
    if (!start) return;
    // Innermost matching element at or above the target...
    const matched = start.closest(selector);
    // ...that is strictly inside root. closest() can walk past root into the
    // rest of the page, and root itself is the delegation host, not a target.
    if (!matched || matched === root || !root.contains(matched)) return;
    handler.call(matched, matched, event);
  }

  root.addEventListener('click', listener);
  let active = true;
  return function unsubscribe() {
    if (!active) return;
    active = false;
    root.removeEventListener('click', listener);
  };
}
