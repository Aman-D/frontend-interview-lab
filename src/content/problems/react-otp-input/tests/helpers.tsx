/** All digit boxes, in order. */
export const boxes = (): HTMLInputElement[] => screen.getAllByRole('textbox') as HTMLInputElement[];

export const values = () => boxes().map((b) => b.value);

/** Type one character into a box: focus it (as a click would), then change its value. */
export function typeInto(box: HTMLInputElement, text: string) {
  act(() => box.focus());
  fireEvent.change(box, { target: { value: text } });
}

/** Type a sequence of characters, each into whichever box has focus. */
export function typeSequence(text: string) {
  for (const ch of text) {
    const active = document.activeElement as HTMLInputElement;
    fireEvent.change(active, { target: { value: active.value + ch } });
  }
}

/**
 * Focus a box and paste `text` into it. Returns false if the paste was default-prevented.
 * (In real Chromium, `new ClipboardEvent(..., { clipboardData })` only accepts a real DataTransfer and
 * Testing Library's createEvent drops its data, so dispatch a plain cancelable 'paste' event with a
 * clipboardData stand-in. React reads `event.clipboardData` from the native event.)
 */
export function pasteInto(box: HTMLInputElement, text: string): boolean {
  act(() => box.focus());
  const event = new Event('paste', { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'clipboardData', { value: { getData: () => text, types: ['text/plain'] } });
  act(() => {
    box.dispatchEvent(event);
  });
  return !event.defaultPrevented;
}

export function key(k: string) {
  return fireEvent.keyDown(document.activeElement as Element, { key: k });
}
