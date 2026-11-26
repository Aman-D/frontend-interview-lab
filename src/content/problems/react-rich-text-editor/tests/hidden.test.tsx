import RichTextEditor from '../RichTextEditor';
import { button, formatted, input, lastDoc, paste, select, setup, shortcut, typeText } from './helpers';

const hello = () => [
  { text: 'Hello ', marks: [] as ('bold' | 'italic' | 'underline')[] },
  { text: 'bold', marks: ['bold'] as ('bold' | 'italic' | 'underline')[] },
  { text: ' world', marks: [] as ('bold' | 'italic' | 'underline')[] },
];

describe('RichTextEditor — hidden', () => {
  it('typed text continues the formatting before the caret', () => {
    const { editor, onChange } = setup({ defaultValue: hello() });
    select(editor, 10); // right after "bold"
    typeText(editor, 'er');
    expect(lastDoc(onChange)[1]).toEqual({ text: 'bolder', marks: ['bold'] });
    select(editor, 6); // after "Hello " → plain
    typeText(editor, 'x');
    expect(lastDoc(onChange)[0]).toEqual({ text: 'Hello x', marks: [] });
  });

  it('with a collapsed caret, a toggle applies to the next typed text (and shows as pressed) without changing the document', () => {
    const { editor, onChange } = setup({ defaultValue: [{ text: 'Plain', marks: [] }] });
    select(editor, 5);
    shortcut(editor, 'b');
    expect(onChange).toHaveBeenCalledTimes(0);
    expect(button('Bold')).toHaveAttribute('aria-pressed', 'true');
    typeText(editor, '!!');
    expect(lastDoc(onChange)).toEqual([
      { text: 'Plain', marks: [] },
      { text: '!!', marks: ['bold'] },
    ]);
    // Pressing it again at the caret (now inside bold text) turns bold off for what follows.
    shortcut(editor, 'b');
    typeText(editor, '?');
    expect(lastDoc(onChange)[2]).toEqual({ text: '?', marks: [] });
  });

  it('moving the caret discards a pending toggle', async () => {
    const { editor, onChange } = setup({ defaultValue: [{ text: 'abcdef', marks: [] }] });
    select(editor, 6);
    fireEvent.click(button('Italic'));
    expect(button('Italic')).toHaveAttribute('aria-pressed', 'true');
    select(editor, 2);
    await waitFor(() => expect(button('Italic')).toHaveAttribute('aria-pressed', 'false'));
    typeText(editor, 'X');
    expect(lastDoc(onChange)).toEqual([{ text: 'abXcdef', marks: [] }]);
  });

  it('typing over a selection replaces it, using the formatting of its first character', () => {
    const { editor, onChange } = setup({ defaultValue: hello() });
    select(editor, 6, 16); // "bold world"
    typeText(editor, 'Z');
    expect(lastDoc(onChange)).toEqual([
      { text: 'Hello ', marks: [] },
      { text: 'Z', marks: ['bold'] },
    ]);
    expect(editor).toHaveTextContent('Hello Z');
  });

  it('paste inserts plain text only, never clipboard HTML', () => {
    const { editor, onChange } = setup({ defaultValue: [{ text: 'ab', marks: [] }] });
    select(editor, 1);
    const notPrevented = paste(editor, { 'text/html': '<img src=x onerror="window.__pwned=1"><b>evil</b>', 'text/plain': 'evil' });
    expect(notPrevented).toBe(false);
    expect(editor.querySelector('img, b, script')).toBeNull();
    expect(lastDoc(onChange)).toEqual([{ text: 'aevilb', marks: [] }]);
  });

  it('markup typed as text stays text', () => {
    const { editor, onChange } = setup();
    select(editor, 0);
    typeText(editor, '<b>x</b>');
    expect(editor.querySelector('b')).toBeNull();
    expect(editor).toHaveTextContent('<b>x</b>');
    expect(lastDoc(onChange)).toEqual([{ text: '<b>x</b>', marks: [] }]);
  });

  it('Enter inserts a line break character into the model', () => {
    const { editor, onChange } = setup({ defaultValue: [{ text: 'ab', marks: [] }] });
    select(editor, 1);
    expect(input(editor, 'insertParagraph')).toBe(false);
    typeText(editor, 'c');
    expect(lastDoc(onChange)).toEqual([{ text: 'a\ncb', marks: [] }]);
    select(editor, 4);
    input(editor, 'insertLineBreak');
    expect(lastDoc(onChange)).toEqual([{ text: 'a\ncb\n', marks: [] }]);
  });

  it('deletes: a selected range, forward delete, and nothing before the start', () => {
    const { editor, onChange } = setup({ defaultValue: hello() });
    select(editor, 0);
    input(editor, 'deleteContentBackward');
    expect(onChange).toHaveBeenCalledTimes(0);
    select(editor, 4, 12); // "o bold w"
    input(editor, 'deleteContentBackward');
    expect(lastDoc(onChange)).toEqual([{ text: 'Hellorld', marks: [] }]);
    select(editor, 0);
    input(editor, 'deleteContentForward');
    expect(lastDoc(onChange)).toEqual([{ text: 'ellorld', marks: [] }]);
    select(editor, 7);
    input(editor, 'deleteContentForward');
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('unsupported edits are cancelled and leave the document alone; native format events are handled', () => {
    const { editor, onChange } = setup({ defaultValue: hello() });
    select(editor, 0, 5);
    expect(input(editor, 'formatStrikeThrough')).toBe(false);
    expect(input(editor, 'insertOrderedList')).toBe(false);
    expect(onChange).toHaveBeenCalledTimes(0);
    expect(editor).toHaveTextContent('Hello bold world');
    select(editor, 0, 5);
    expect(input(editor, 'formatItalic')).toBe(false);
    expect(formatted(editor, 'em')).toEqual(['Hello']);
  });

  it('toolbar: one Tab stop, arrow keys move focus with wrapping, Home/End; mousedown does not steal focus', () => {
    setup();
    const [bold, italic, underline] = ['Bold', 'Italic', 'Underline'].map(button);
    expect([bold, italic, underline].map((b) => b.getAttribute('tabindex'))).toEqual(['0', '-1', '-1']);
    bold.focus();
    fireEvent.keyDown(bold, { key: 'ArrowRight' });
    expect(italic).toHaveFocus();
    expect(italic).toHaveAttribute('tabindex', '0');
    expect(bold).toHaveAttribute('tabindex', '-1');
    fireEvent.keyDown(italic, { key: 'End' });
    expect(underline).toHaveFocus();
    fireEvent.keyDown(underline, { key: 'ArrowRight' });
    expect(bold).toHaveFocus();
    fireEvent.keyDown(bold, { key: 'ArrowLeft' });
    expect(underline).toHaveFocus();
    fireEvent.keyDown(underline, { key: 'Home' });
    expect(bold).toHaveFocus();
    expect(fireEvent.mouseDown(italic)).toBe(false);
  });

  it('defaultValue is read once; onChange receives normalised documents', () => {
    const onChange = fn();
    const view = render(<RichTextEditor label="Notes" defaultValue={[{ text: 'a', marks: ['bold'] }, { text: 'b', marks: ['bold'] }]} onChange={onChange} />);
    const editor = screen.getByRole('textbox', { name: 'Notes' });
    view.rerender(<RichTextEditor label="Notes" defaultValue={[{ text: 'zzz', marks: [] }]} onChange={onChange} />);
    expect(editor).toHaveTextContent('ab');
    select(editor, 2);
    typeText(editor, 'c');
    expect(lastDoc(onChange)).toEqual([{ text: 'abc', marks: ['bold'] }]);
    expect(formatted(editor, 'strong')).toEqual(['abc']);
  });
});
