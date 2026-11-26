import { button, formatted, input, lastDoc, select, setup, shortcut, typeText } from './helpers';

const HELLO = [
  { text: 'Hello ', marks: [] },
  { text: 'bold', marks: ['bold'] },
  { text: ' world', marks: [] },
] as const;
const hello = () => HELLO.map((r) => ({ text: r.text, marks: [...r.marks] }));

describe('RichTextEditor — public', () => {
  it('renders a labelled multi-line textbox, a Formatting toolbar and the default document', () => {
    const { editor } = setup({ defaultValue: hello() });
    expect(editor).toHaveAttribute('aria-multiline', 'true');
    expect(editor.getAttribute('contenteditable')).toBe('true');
    expect(screen.getByRole('toolbar', { name: 'Formatting' })).toBeInTheDocument();
    for (const name of ['Bold', 'Italic', 'Underline']) expect(button(name)).toHaveAttribute('aria-pressed', 'false');
    expect(editor).toHaveTextContent('Hello bold world');
    expect(formatted(editor, 'strong')).toEqual(['bold']);
  });

  it('typing goes through the model: beforeinput is cancelled, text is inserted at the caret and onChange is called', () => {
    const { editor, onChange } = setup();
    select(editor, 0);
    expect(input(editor, 'insertText', { data: 'H' })).toBe(false);
    typeText(editor, 'i!');
    expect(editor).toHaveTextContent('Hi!');
    expect(lastDoc(onChange)).toEqual([{ text: 'Hi!', marks: [] }]);
    select(editor, 2);
    typeText(editor, ' there');
    expect(lastDoc(onChange)).toEqual([{ text: 'Hi there!', marks: [] }]);
  });

  it('the Bold button formats the selected text', () => {
    const { editor, onChange } = setup({ defaultValue: hello() });
    select(editor, 12, 16); // "orld"
    fireEvent.click(button('Bold'));
    expect(lastDoc(onChange)).toEqual([
      { text: 'Hello ', marks: [] },
      { text: 'bold', marks: ['bold'] },
      { text: ' w', marks: [] },
      { text: 'orld', marks: ['bold'] },
    ]);
    expect(formatted(editor, 'strong')).toEqual(['bold', 'orld']);
  });

  it('Ctrl+I / Ctrl+U toggle on the selection, and a second press removes the mark', () => {
    const { editor, onChange } = setup({ defaultValue: hello() });
    select(editor, 0, 5);
    expect(shortcut(editor, 'i')).toBe(false);
    expect(formatted(editor, 'em')).toEqual(['Hello']);
    select(editor, 0, 5);
    shortcut(editor, 'u');
    expect(lastDoc(onChange)[0]).toEqual({ text: 'Hello', marks: ['italic', 'underline'] });
    select(editor, 0, 5);
    shortcut(editor, 'i');
    expect(lastDoc(onChange)[0]).toEqual({ text: 'Hello', marks: ['underline'] });
    expect(formatted(editor, 'em')).toEqual([]);
  });

  it('toolbar buttons reflect the formatting at the selection (aria-pressed)', async () => {
    const { editor } = setup({ defaultValue: hello() });
    select(editor, 7, 9); // inside "bold"
    await waitFor(() => expect(button('Bold')).toHaveAttribute('aria-pressed', 'true'));
    select(editor, 2, 9); // partly bold → not pressed
    await waitFor(() => expect(button('Bold')).toHaveAttribute('aria-pressed', 'false'));
  });

  it('Backspace (deleteContentBackward) removes the character before the caret', () => {
    const { editor, onChange } = setup({ defaultValue: hello() });
    select(editor, 10);
    expect(input(editor, 'deleteContentBackward')).toBe(false);
    expect(editor).toHaveTextContent('Hello bol world');
    expect(lastDoc(onChange)[1]).toEqual({ text: 'bol', marks: ['bold'] });
  });
});
