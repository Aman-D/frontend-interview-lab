/** Inline formats the editor supports. Within a run, marks are always listed in this order. */
export type Mark = 'bold' | 'italic' | 'underline';
export const MARK_ORDER: Mark[] = ['bold', 'italic', 'underline'];

/** A stretch of text that shares exactly the same marks. Line breaks are '\n' characters inside `text`. */
export interface TextRun {
  text: string;
  marks: Mark[];
}

/**
 * The document is a flat list of runs. A NORMALISED document:
 * - has no empty runs (the empty document is []),
 * - never has two adjacent runs with the same marks (they are merged),
 * - lists each run's marks without duplicates, in MARK_ORDER.
 * Offsets are positions between characters (UTF-16 code units, like DOM offsets), 0 … plainText(doc).length.
 */
export type Doc = TextRun[];

export interface RichTextEditorProps {
  /** Visible label; also the accessible name of the editing area. */
  label: string;
  /** Initial document (uncontrolled). Read once, on mount. */
  defaultValue?: Doc;
  /** Called with the complete, normalised next document after every change. */
  onChange?: (doc: Doc) => void;
  placeholder?: string;
}
