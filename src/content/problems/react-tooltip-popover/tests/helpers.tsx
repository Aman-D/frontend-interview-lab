/** A full mouse press on an element: pointerdown, mousedown, pointerup, mouseup, click. */
export function press(el: Element) {
  fireEvent.pointerDown(el);
  fireEvent.mouseDown(el);
  fireEvent.pointerUp(el);
  fireEvent.mouseUp(el);
  fireEvent.click(el);
}

/** Focus an element the way a keyboard user would land on it, then report it. */
export function focusOn(el: HTMLElement) {
  act(() => el.focus());
  return el;
}

/** Blur whatever has focus. */
export function blurActive() {
  const el = document.activeElement as HTMLElement | null;
  if (el && el !== document.body) act(() => el.blur());
}

/** The id list of an aria-describedby / aria-labelledby attribute. */
export function idsOf(el: Element, attr: string): string[] {
  return (el.getAttribute(attr) ?? '').split(/\s+/).filter(Boolean);
}
