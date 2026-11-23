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
  return slots
    .map((d) => d || ' ')
    .join('')
    .trimEnd();
}

export const isComplete = (slots: string[]) => slots.length > 0 && slots.every(isDigit);

/**
 * Writes the digits found in `text` into the boxes starting at `start` (non-digits are dropped,
 * overflow past the last box is cut). Returns NEW boxes plus the box that should get focus next:
 * the one after the last written box, or the last box. With no digits, returns the input unchanged.
 */
export function fillFrom(slots: string[], start: number, text: string): { slots: string[]; focusIndex: number } {
  const from = Math.max(0, Math.min(start, slots.length - 1));
  const digits = text.replace(/[^0-9]/g, '').slice(0, slots.length - from);
  if (!digits) return { slots, focusIndex: from };
  const next = slots.slice();
  for (let i = 0; i < digits.length; i++) next[from + i] = digits[i];
  return { slots: next, focusIndex: Math.min(from + digits.length, slots.length - 1) };
}
