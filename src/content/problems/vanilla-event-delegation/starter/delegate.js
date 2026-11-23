/**
 * Event delegation helper.
 *
 * Calls `handler(matchedElement, event)` whenever a click happens on an element
 * inside `root` that matches `selector` — or on any descendant of such an element.
 * Returns a function that removes the listener.
 *
 *   const off = onClickMatching(list, '.task-delete', (button, event) => { ... });
 *   off(); // stop listening
 *
 * @param {Element} root
 * @param {string} selector
 * @param {(matched: Element, event: MouseEvent) => void} handler
 * @returns {() => void}
 */
export function onClickMatching(root, selector, handler) {
  // TODO: implement
  return () => {};
}
