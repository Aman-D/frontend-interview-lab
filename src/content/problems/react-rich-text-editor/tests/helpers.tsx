import RichTextEditor from '../RichTextEditor';
import type { Doc, RichTextEditorProps } from '../types';

/** Renders <RichTextEditor label="Notes"> with a spy onChange; any prop can be overridden. */
export function setup(props: Partial<RichTextEditorProps> = {}) {
  const onChange = fn();
  const view = render(<RichTextEditor label="Notes" onChange={onChange} {...props} />);
  const editor = screen.getByRole('textbox', { name: 'Notes' }) as HTMLElement;
  return { editor, onChange, view };
}

/** The document passed to the most recent onChange call. */
export function lastDoc(onChange: { mock: { calls: unknown[][] } }): Doc {
  const calls = onChange.mock.calls;
  if (calls.length === 0) throw new Error('onChange was never called');
  return calls[calls.length - 1][0] as Doc;
}

function textNodes(root: Node): Text[] {
  const out: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) out.push(n as Text);
  return out;
}

function point(root: HTMLElement, offset: number): [Node, number] {
  let acc = 0;
  const nodes = textNodes(root);
  for (const n of nodes) {
    if (offset <= acc + n.data.length) return [n, offset - acc];
    acc += n.data.length;
  }
  const last = nodes[nodes.length - 1];
  return last ? [last, last.data.length] : [root, 0];
}

/** Focuses the editor and selects the plain-text range [start, end) (a caret when end is omitted). */
export function select(editor: HTMLElement, start: number, end: number = start) {
  act(() => {
    editor.focus();
    const [a, ao] = point(editor, start);
    const [b, bo] = point(editor, end);
    window.getSelection()!.setBaseAndExtent(a, ao, b, bo);
  });
}

/** Dispatches a native `beforeinput` like the browser does. Returns false when the editor prevented it. */
export function input(editor: HTMLElement, inputType: string, init: InputEventInit = {}): boolean {
  let notPrevented = true;
  act(() => {
    notPrevented = editor.dispatchEvent(new InputEvent('beforeinput', { inputType, bubbles: true, cancelable: true, ...init }));
  });
  return notPrevented;
}

/** Types text one character at a time through `beforeinput` insertText events. */
export function typeText(editor: HTMLElement, text: string) {
  for (const ch of text) input(editor, 'insertText', { data: ch });
}

/** Dispatches a native paste with the given clipboard flavours. */
export function paste(editor: HTMLElement, data: Record<string, string>): boolean {
  const dt = new DataTransfer();
  for (const [type, value] of Object.entries(data)) dt.setData(type, value);
  let notPrevented = true;
  act(() => {
    notPrevented = editor.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
  });
  return notPrevented;
}

/** Ctrl+<key> on the editor (Ctrl on every platform in tests). */
export function shortcut(editor: HTMLElement, key: string, init: Record<string, unknown> = {}): boolean {
  return fireEvent.keyDown(editor, { key, ctrlKey: true, ...init });
}

export function button(name: string): HTMLElement {
  return within(screen.getByRole('toolbar')).getByRole('button', { name });
}

/** Text inside each <strong>/<em>/<u> element of the editor, e.g. formatted(editor, 'strong') → ['world']. */
export function formatted(editor: HTMLElement, tag: 'strong' | 'em' | 'u'): string[] {
  return Array.from(editor.querySelectorAll(tag)).map((el) => el.textContent ?? '');
}
