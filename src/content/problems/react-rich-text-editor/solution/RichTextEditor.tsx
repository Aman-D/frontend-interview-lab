import { createElement, Fragment, useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { insertText, isMarkActive, marksAt, normalize, plainText, toggleMark } from './model';
import { MARK_ORDER, type Doc, type Mark, type RichTextEditorProps } from './types';

type Sel = { start: number; end: number };
/** `pending`: marks chosen with a collapsed caret, applied to the next typed text (null = inherit). */
type State = { doc: Doc; sel: Sel; pending: Mark[] | null };

const BUTTONS: { mark: Mark; label: string; glyph: string; key: string }[] = [
  { mark: 'bold', label: 'Bold', glyph: 'B', key: 'b' },
  { mark: 'italic', label: 'Italic', glyph: 'I', key: 'i' },
  { mark: 'underline', label: 'Underline', glyph: 'U', key: 'u' },
];
const TAGS: Record<Mark, string> = { bold: 'strong', italic: 'em', underline: 'u' };
const sameSel = (a: Sel, b: Sel) => a.start === b.start && a.end === b.end;

// ---- DOM selection <-> model offsets ---------------------------------------------------------------
// Offsets count only Text node characters, so the sentinel <br> and any element boundaries are invisible.

function offsetOf(root: HTMLElement, node: Node, offset: number): number {
  const range = document.createRange();
  range.setStart(root, 0);
  range.setEnd(node, offset);
  return range.toString().length; // Range#toString concatenates Text data only
}

function rangeToSel(root: HTMLElement, r: { startContainer: Node; startOffset: number; endContainer: Node; endOffset: number }): Sel | null {
  if (!root.contains(r.startContainer) || !root.contains(r.endContainer)) return null;
  return { start: offsetOf(root, r.startContainer, r.startOffset), end: offsetOf(root, r.endContainer, r.endOffset) };
}

function readSelection(root: HTMLElement): Sel | null {
  const s = window.getSelection();
  return s && s.rangeCount > 0 ? rangeToSel(root, s.getRangeAt(0)) : null;
}

function pointAt(root: HTMLElement, offset: number): [Node, number] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let acc = 0;
  let last: Text | null = null;
  for (let n = walker.nextNode() as Text | null; n; n = walker.nextNode() as Text | null) {
    // At a boundary prefer the END of the earlier node, so the caret keeps the formatting it will type with.
    if (offset <= acc + n.data.length) return [n, offset - acc];
    acc += n.data.length;
    last = n;
  }
  return last ? [last, last.data.length] : [root, 0];
}

function writeSelection(root: HTMLElement, sel: Sel) {
  const s = window.getSelection();
  if (!s) return;
  const [a, ao] = pointAt(root, sel.start);
  const [b, bo] = pointAt(root, sel.end);
  s.setBaseAndExtent(a, ao, b, bo);
}

const isHigh = (c: number) => c >= 0xd800 && c <= 0xdbff;
const isLow = (c: number) => c >= 0xdc00 && c <= 0xdfff;

// ---- Rendering --------------------------------------------------------------------------------------

function renderDoc(doc: Doc): ReactNode[] {
  const nodes: ReactNode[] = doc.map((run, i) => {
    let node: ReactNode = run.text; // React escapes text: model text can never become markup
    for (const mark of [...run.marks].reverse()) node = createElement(TAGS[mark], null, node);
    return <Fragment key={i}>{node}</Fragment>;
  });
  // An empty editor, or a trailing '\n', needs a <br> so the caret has a line to sit on. It holds no text.
  const text = plainText(doc);
  if (text === '' || text.endsWith('\n')) nodes.push(<br key="sentinel" data-sentinel="" />);
  return nodes;
}

export default function RichTextEditor({ label, defaultValue, onChange, placeholder }: RichTextEditorProps) {
  const id = useId();
  const labelId = `${id}-label`;
  const editorId = `${id}-editor`;

  const [state, setState] = useState<State>(() => ({ doc: normalize(defaultValue ?? []), sel: { start: 0, end: 0 }, pending: null }));
  // Native listeners and several events in one tick must see the latest state, not the last render's.
  const stateRef = useRef(state);
  const editorRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const undoStack = useRef<{ doc: Doc; sel: Sel }[]>([]);
  const redoStack = useRef<{ doc: Doc; sel: Sel }[]>([]);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [focusIndex, setFocusIndex] = useState(0);

  function commit(next: State, history: 'record' | 'skip' = 'record') {
    const prev = stateRef.current;
    stateRef.current = next;
    setState(next);
    if (next.doc !== prev.doc) {
      if (history === 'record') {
        undoStack.current.push({ doc: prev.doc, sel: prev.sel });
        if (undoStack.current.length > 100) undoStack.current.shift();
        redoStack.current = [];
      }
      onChangeRef.current?.(next.doc);
    }
  }

  /** The selection to act on: the live DOM selection when it is inside the editor, else the last known one. */
  function current(): { sel: Sel; pending: Mark[] | null } {
    const st = stateRef.current;
    const root = editorRef.current;
    const len = plainText(st.doc).length;
    const live = root ? readSelection(root) : null;
    const raw = live ?? st.sel;
    const sel = { start: Math.min(raw.start, raw.end, len), end: Math.min(Math.max(raw.start, raw.end), len) };
    // Pending marks belong to a caret position; if the caret moved since, they no longer apply.
    return { sel, pending: sameSel(sel, st.sel) ? st.pending : null };
  }

  function insert(text: string) {
    const { doc } = stateRef.current;
    const { sel, pending } = current();
    // Typed text continues the formatting before the caret; replacing a selection uses its first character's.
    const marks = pending ?? marksAt(doc, sel.start === sel.end ? sel.start : sel.start + 1);
    const caret = sel.start + text.length;
    commit({ doc: insertText(doc, sel.start, sel.end, text, marks), sel: { start: caret, end: caret }, pending: null });
  }

  function remove(direction: 'backward' | 'forward', target: Sel | null) {
    const { doc } = stateRef.current;
    const text = plainText(doc);
    let { sel } = current();
    if (sel.start === sel.end && target && target.start !== target.end) sel = target; // word/line deletes, graphemes
    if (sel.start === sel.end) {
      const at = sel.start;
      if (direction === 'backward') {
        if (at === 0) return;
        const n = at >= 2 && isLow(text.charCodeAt(at - 1)) && isHigh(text.charCodeAt(at - 2)) ? 2 : 1; // don't split surrogate pairs
        sel = { start: at - n, end: at };
      } else {
        if (at >= text.length) return;
        const n = isHigh(text.charCodeAt(at)) && isLow(text.charCodeAt(at + 1)) ? 2 : 1;
        sel = { start: at, end: at + n };
      }
    }
    commit({ doc: insertText(doc, sel.start, sel.end, '', []), sel: { start: sel.start, end: sel.start }, pending: null });
  }

  function toggle(mark: Mark) {
    const { doc } = stateRef.current;
    const { sel, pending } = current();
    if (sel.start === sel.end) {
      // Collapsed caret: nothing to format yet — remember the choice for the next typed text.
      const base = pending ?? marksAt(doc, sel.start);
      const next = base.includes(mark) ? base.filter((m) => m !== mark) : MARK_ORDER.filter((m) => m === mark || base.includes(m));
      commit({ doc, sel, pending: next });
    } else {
      commit({ doc: toggleMark(doc, sel.start, sel.end, mark), sel, pending: null });
    }
  }

  function travel(from: typeof undoStack, to: typeof undoStack) {
    const entry = from.current.pop();
    if (!entry) return;
    const st = stateRef.current;
    to.current.push({ doc: st.doc, sel: st.sel });
    commit({ doc: entry.doc, sel: entry.sel, pending: null }, 'skip');
  }

  // Native listeners: React's onBeforeInput is a polyfill without `inputType`, so it can't be used here.
  useEffect(() => {
    const root = editorRef.current!;

    function onBeforeInput(e: InputEvent) {
      const targets = typeof e.getTargetRanges === 'function' ? e.getTargetRanges() : [];
      const target = targets.length ? rangeToSel(root, targets[0]) : null;
      // The model owns the DOM: every handled (and every unknown) input is cancelled.
      e.preventDefault();
      switch (e.inputType) {
        case 'insertText':
        case 'insertReplacementText':
          insert(e.data ?? e.dataTransfer?.getData('text/plain') ?? '');
          return;
        case 'insertParagraph':
        case 'insertLineBreak':
          insert('\n');
          return;
        case 'insertFromPaste':
        case 'insertFromPasteAsQuotation':
          insert((e.dataTransfer?.getData('text/plain') ?? '').replace(/\r\n?/g, '\n'));
          return;
        case 'formatBold':
          toggle('bold');
          return;
        case 'formatItalic':
          toggle('italic');
          return;
        case 'formatUnderline':
          toggle('underline');
          return;
        case 'historyUndo':
          travel(undoStack, redoStack);
          return;
        case 'historyRedo':
          travel(redoStack, undoStack);
          return;
        default:
          if (e.inputType.startsWith('delete')) remove(e.inputType.endsWith('Forward') ? 'forward' : 'backward', target);
        // insertFromDrop, insertOrderedList, formatStrikeThrough, … : not supported → stays cancelled.
      }
    }

    function onPaste(e: ClipboardEvent) {
      e.preventDefault(); // never let clipboard HTML into the DOM; plain text only
      insert((e.clipboardData?.getData('text/plain') ?? '').replace(/\r\n?/g, '\n'));
    }

    function onSelectionChange() {
      const live = readSelection(root);
      const st = stateRef.current;
      if (live && !sameSel(live, st.sel)) commit({ ...st, sel: live, pending: null });
    }

    const cancel = (e: Event) => e.preventDefault();
    root.addEventListener('beforeinput', onBeforeInput);
    root.addEventListener('paste', onPaste);
    root.addEventListener('drop', cancel);
    document.addEventListener('selectionchange', onSelectionChange);
    return () => {
      root.removeEventListener('beforeinput', onBeforeInput);
      root.removeEventListener('paste', onPaste);
      root.removeEventListener('drop', cancel);
      document.removeEventListener('selectionchange', onSelectionChange);
    };
    // The handlers read everything through refs, so they are attached once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // After React re-renders the runs, put the caret/selection back where the model says it is.
  useLayoutEffect(() => {
    const root = editorRef.current;
    if (!root) return;
    const live = readSelection(root);
    // Only touch the selection when it belongs to the editor (focused, or selection inside it).
    if (document.activeElement !== root && !live) return;
    if (!live || !sameSel(live, state.sel)) writeSelection(root, state.sel);
  }, [state]);

  function onEditorKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const mod = e.ctrlKey || e.metaKey;
    const k = e.key.toLowerCase();
    if (e.altKey && e.key === 'F10') {
      e.preventDefault(); // APG: a shortcut from the editor to its toolbar
      buttonRefs.current[focusIndex]?.focus();
      return;
    }
    if (!mod || e.altKey) return;
    const button = BUTTONS.find((b) => b.key === k);
    if (button) {
      e.preventDefault();
      toggle(button.mark);
    } else if (k === 'z') {
      e.preventDefault();
      if (e.shiftKey) travel(redoStack, undoStack);
      else travel(undoStack, redoStack);
    } else if (k === 'y') {
      e.preventDefault();
      travel(redoStack, undoStack);
    }
  }

  function onToolbarKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const last = BUTTONS.length - 1;
    const next =
      e.key === 'ArrowRight' ? (focusIndex === last ? 0 : focusIndex + 1)
      : e.key === 'ArrowLeft' ? (focusIndex === 0 ? last : focusIndex - 1)
      : e.key === 'Home' ? 0
      : e.key === 'End' ? last
      : null;
    if (next !== null) {
      e.preventDefault();
      setFocusIndex(next);
      buttonRefs.current[next]?.focus();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      editorRef.current?.focus();
    }
  }

  const { doc, sel, pending } = state;
  const active = (mark: Mark) => (pending ? pending.includes(mark) : isMarkActive(doc, sel.start, sel.end, mark));
  const isEmpty = doc.length === 0;

  return (
    <div className="rte-wrap">
      <span id={labelId} className="rte-label">
        {label}
      </span>
      <div className="rte">
        <div className="rte-toolbar" role="toolbar" aria-label="Formatting" aria-controls={editorId} onKeyDown={onToolbarKeyDown}>
          {BUTTONS.map((b, i) => (
            <button
              key={b.mark}
              ref={(el) => {
                buttonRefs.current[i] = el;
              }}
              type="button"
              className="rte-btn"
              aria-label={b.label}
              aria-pressed={active(b.mark)}
              aria-keyshortcuts={`Control+${b.key.toUpperCase()}`}
              title={`${b.label} (Ctrl/⌘+${b.key.toUpperCase()})`}
              tabIndex={i === focusIndex ? 0 : -1}
              onFocus={() => setFocusIndex(i)}
              onMouseDown={(e) => e.preventDefault()} // keep focus and the selection in the editor
              onClick={() => toggle(b.mark)}
            >
              <span aria-hidden="true" className={`rte-glyph rte-glyph-${b.mark}`}>
                {b.glyph}
              </span>
            </button>
          ))}
        </div>
        <div
          ref={editorRef}
          id={editorId}
          className={'rte-content' + (isEmpty ? ' is-empty' : '')}
          role="textbox"
          aria-multiline="true"
          aria-labelledby={labelId}
          aria-placeholder={placeholder}
          data-placeholder={placeholder}
          contentEditable
          suppressContentEditableWarning
          spellCheck={false}
          onKeyDown={onEditorKeyDown}
        >
          {renderDoc(doc)}
        </div>
      </div>
    </div>
  );
}
