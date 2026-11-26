import { MARK_ORDER, type Doc, type Mark, type TextRun } from './types';

// Every function here is PURE: it never mutates its input and always returns a NORMALISED document
// (see types.ts). Offsets satisfy 0 <= start <= end <= length; you do not need to validate them.

const sortMarks = (marks: Mark[]): Mark[] => MARK_ORDER.filter((m) => marks.includes(m));
const sameMarks = (a: Mark[], b: Mark[]) => a.length === b.length && a.every((m, i) => m === b[i]);

/** Merges adjacent runs with equal marks, drops empty runs, de-duplicates and orders marks. */
export function normalize(doc: Doc): Doc {
  const out: TextRun[] = [];
  for (const run of doc) {
    if (!run.text) continue;
    const marks = sortMarks(run.marks);
    const last = out[out.length - 1];
    if (last && sameMarks(last.marks, marks)) out[out.length - 1] = { text: last.text + run.text, marks: last.marks };
    else out.push({ text: run.text, marks });
  }
  return out;
}

/** The text of the document with all formatting removed. */
export function plainText(doc: Doc): string {
  return doc.map((r) => r.text).join('');
}

/**
 * Splits the runs so that `start` and `end` fall on run boundaries, then returns the runs before,
 * inside and after the range. The heart of every edit: all operations are "split, map the middle, join".
 */
function slice(doc: Doc, start: number, end: number): [TextRun[], TextRun[], TextRun[]] {
  const before: TextRun[] = [];
  const inside: TextRun[] = [];
  const after: TextRun[] = [];
  let pos = 0;
  for (const run of doc) {
    const runStart = pos;
    const runEnd = pos + run.text.length;
    pos = runEnd;
    const cut = (from: number, to: number) => ({ text: run.text.slice(from - runStart, to - runStart), marks: run.marks });
    if (runEnd <= start) before.push(run);
    else if (runStart >= end) after.push(run);
    else {
      if (runStart < start) before.push(cut(runStart, start));
      inside.push(cut(Math.max(runStart, start), Math.min(runEnd, end)));
      if (runEnd > end) after.push(cut(end, runEnd));
    }
  }
  return [before, inside, after];
}

/**
 * The marks that text typed at `offset` should get: the marks of the character BEFORE the offset,
 * or of the first character when offset is 0. [] for an empty document.
 */
export function marksAt(doc: Doc, offset: number): Mark[] {
  if (doc.length === 0) return [];
  if (offset <= 0) return [...doc[0].marks];
  const [, inside] = slice(doc, offset - 1, offset);
  return inside.length ? [...inside[0].marks] : [...doc[doc.length - 1].marks];
}

/**
 * Is `mark` active for the range? Collapsed range (start === end): `marksAt(doc, start)` includes it.
 * Otherwise: EVERY character in [start, end) has it.
 */
export function isMarkActive(doc: Doc, start: number, end: number, mark: Mark): boolean {
  if (start === end) return marksAt(doc, start).includes(mark);
  const [, inside] = slice(doc, start, end);
  return inside.length > 0 && inside.every((r) => r.marks.includes(mark));
}

/**
 * Toggles `mark` on [start, end): when it is active on the whole range it is removed from every character,
 * otherwise it is added to every character. A collapsed range returns the (normalised) document unchanged.
 */
export function toggleMark(doc: Doc, start: number, end: number, mark: Mark): Doc {
  if (start === end) return normalize(doc);
  const remove = isMarkActive(doc, start, end, mark);
  const [before, inside, after] = slice(doc, start, end);
  const changed = inside.map((r) => ({ text: r.text, marks: remove ? r.marks.filter((m) => m !== mark) : [...r.marks, mark] }));
  return normalize([...before, ...changed, ...after]);
}

/** Replaces [start, end) with `text`, which gets exactly `marks`. With text '' this deletes the range. */
export function insertText(doc: Doc, start: number, end: number, text: string, marks: Mark[]): Doc {
  const [before, , after] = slice(doc, start, end);
  return normalize([...before, { text, marks: [...marks] }, ...after]);
}

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ESCAPES[c]);
const TAGS: Record<Mark, string> = { bold: 'strong', italic: 'em', underline: 'u' };

/**
 * Serialises to HTML. Text is escaped (& < > " '), '\n' becomes <br>, and each run is wrapped as
 * <strong><em><u>text</u></em></strong> (only the tags for its marks, always in this nesting order).
 * The empty document is ''.
 */
export function toHTML(doc: Doc): string {
  return normalize(doc)
    .map((run) => {
      let html = escapeHtml(run.text).replace(/\n/g, '<br>');
      for (const mark of [...run.marks].reverse()) html = `<${TAGS[mark]}>${html}</${TAGS[mark]}>`;
      return html;
    })
    .join('');
}
