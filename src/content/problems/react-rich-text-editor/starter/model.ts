import type { Doc, Mark } from './types';

// Every function here is PURE: it never mutates its input and always returns a NORMALISED document
// (see types.ts). Offsets satisfy 0 <= start <= end <= length; you do not need to validate them.

/** Merges adjacent runs with equal marks, drops empty runs, de-duplicates and orders marks. */
export function normalize(doc: Doc): Doc {
  // TODO
  return doc;
}

/** The text of the document with all formatting removed. */
export function plainText(doc: Doc): string {
  return doc.map((r) => r.text).join('');
}

/**
 * The marks that text typed at `offset` should get: the marks of the character BEFORE the offset,
 * or of the first character when offset is 0. [] for an empty document.
 */
export function marksAt(doc: Doc, offset: number): Mark[] {
  // TODO
  return [];
}

/**
 * Is `mark` active for the range? Collapsed range (start === end): `marksAt(doc, start)` includes it.
 * Otherwise: EVERY character in [start, end) has it.
 */
export function isMarkActive(doc: Doc, start: number, end: number, mark: Mark): boolean {
  // TODO
  return false;
}

/**
 * Toggles `mark` on [start, end): when it is active on the whole range it is removed from every character,
 * otherwise it is added to every character. A collapsed range returns the (normalised) document unchanged.
 */
export function toggleMark(doc: Doc, start: number, end: number, mark: Mark): Doc {
  // TODO
  return doc;
}

/** Replaces [start, end) with `text`, which gets exactly `marks`. With text '' this deletes the range. */
export function insertText(doc: Doc, start: number, end: number, text: string, marks: Mark[]): Doc {
  // TODO
  return doc;
}

/**
 * Serialises to HTML. Text is escaped (& < > " '), '\n' becomes <br>, and each run is wrapped as
 * <strong><em><u>text</u></em></strong> (only the tags for its marks, always in this nesting order).
 * The empty document is ''.
 */
export function toHTML(doc: Doc): string {
  // TODO
  return '';
}
