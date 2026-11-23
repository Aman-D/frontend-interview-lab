/** One box holds one ASCII digit, or '' when empty. */
export const isDigit = (c: string | undefined): c is string => c !== undefined && c.length === 1 && c >= '0' && c <= '9';

/**
 * Positional string → boxes. Character i belongs to box i; anything that is not a digit
 * (a space marks a gap) becomes an empty box. Extra characters are ignored.
 */
export function toSlots(value: string, length: number): string[] {
  return Array.from({ length }, (_, i) => (isDigit(value[i]) ? value[i] : ''));
}

/** Boxes → positional string: gaps become spaces, trailing empty boxes are dropped. */
export function toValue(slots: string[]): string {
  // TODO: gaps must be kept as spaces so the value stays positional ("12 4").
  return slots.join('');
}

export const isComplete = (slots: string[]) => slots.length > 0 && slots.every(isDigit);

/**
 * Writes the digits found in `text` into the boxes starting at `start` (non-digits are dropped,
 * overflow past the last box is cut). Returns NEW boxes plus the box that should get focus next:
 * the one after the last written box, or the last box. With no digits, returns the input unchanged.
 */
export function fillFrom(slots: string[], start: number, text: string): { slots: string[]; focusIndex: number } {
  // TODO: implement (do not mutate `slots`).
  void text;
  return { slots, focusIndex: start };
}
