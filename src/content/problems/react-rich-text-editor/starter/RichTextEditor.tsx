import { useId } from 'react';
import type { RichTextEditorProps } from './types';
// import { insertText, isMarkActive, marksAt, toggleMark } from './model';

export default function RichTextEditor({ label, placeholder }: RichTextEditorProps) {
  const id = useId();

  // TODO:
  // - keep the document MODEL (Doc) in state, initialised once from defaultValue; render it as
  //   <strong>/<em>/<u> inside a contentEditable role="textbox" — the model is the source of truth, not the DOM
  // - map the DOM selection to/from plain-text offsets
  // - intercept native `beforeinput` (insertText, insertParagraph/insertLineBreak, delete*, format*,
  //   history*): preventDefault, update the model, restore the caret; prevent anything you don't handle
  // - paste inserts text/plain only
  // - toolbar (role="toolbar") with Bold / Italic / Underline toggle buttons (aria-pressed reflects the selection),
  //   one Tab stop, ArrowLeft/ArrowRight between buttons; toolbar mousedown must not steal the selection
  // - Ctrl/⌘+B / I / U; with a collapsed caret the toggle applies to the next typed text
  // - call onChange(doc) after every change
  return (
    <div className="rte-wrap">
      <span id={`${id}-label`} className="rte-label">
        {label}
      </span>
      <div className="rte">
        <div className="rte-toolbar">
          <button type="button" className="rte-btn">
            B
          </button>
        </div>
        <div className="rte-content" contentEditable suppressContentEditableWarning data-placeholder={placeholder} />
      </div>
    </div>
  );
}
