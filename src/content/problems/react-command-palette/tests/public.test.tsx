import { key, makeCommands, openWithButton, optionTitles, Page, pressShortcut, type } from './helpers';

describe('CommandPalette — public', () => {
  it('the button opens a modal dialog with a focused combobox and options grouped by section', () => {
    const { commands } = makeCommands();
    render(<Page commands={commands} />);
    expect(screen.queryByRole('dialog')).toBeNull();
    const { input } = openWithButton();
    const dialog = screen.getByRole('dialog', { name: 'Command palette' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog.contains(input)).toBe(true);
    expect(input).toHaveFocus();
    expect(input).toHaveAttribute('aria-expanded', 'true');
    const listbox = screen.getByRole('listbox');
    expect(input.getAttribute('aria-controls')).toBe(listbox.id);
    expect(optionTitles(within(listbox).getByRole('group', { name: 'Navigation' }))).toEqual(['Go to home', 'Go to settings', 'Go to billing']);
    expect(optionTitles(within(listbox).getByRole('group', { name: 'File' }))).toEqual(['Create new file', 'Open recent file', 'Save all files']);
  });

  it('Ctrl+K and Cmd+K open the palette and prevent the browser default', () => {
    const { commands } = makeCommands();
    render(<Page commands={commands} />);
    expect(pressShortcut(document, { ctrlKey: true })).toBe(false);
    expect(screen.getByRole('dialog', { name: 'Command palette' })).toBeInTheDocument();
    key(screen.getByRole('combobox'), 'Escape');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(pressShortcut(document, { metaKey: true })).toBe(false);
    expect(screen.getByRole('dialog', { name: 'Command palette' })).toBeInTheDocument();
  });

  it('typing filters the list; with no match a status region says "No commands found"', () => {
    const { commands } = makeCommands();
    render(<Page commands={commands} />);
    const { input } = openWithButton();
    type(input, 'sett');
    expect(optionTitles()).toEqual(['Go to settings']);
    expect(screen.getByRole('status')).not.toHaveTextContent('No commands found');
    type(input, 'zzz');
    expect(screen.queryAllByRole('option')).toHaveLength(0);
    expect(screen.getByRole('status')).toHaveTextContent('No commands found');
    expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  it('ArrowDown + Enter runs the active command once and closes the palette', () => {
    const { commands, run } = makeCommands();
    render(<Page commands={commands} />);
    const { input } = openWithButton();
    type(input, 'file');
    expect(optionTitles()).toEqual(['Create new file', 'Open recent file', 'Save all files']);
    key(input, 'ArrowDown');
    expect(key(input, 'Enter')).toBe(false);
    expect(run['open-recent']).toHaveBeenCalledTimes(1);
    expect(run['new-file']).toHaveBeenCalledTimes(0);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('Escape closes and returns focus to the element focused before opening', () => {
    const { commands, run } = makeCommands();
    render(<Page commands={commands} />);
    const elsewhere = screen.getByRole('button', { name: 'Elsewhere' });
    elsewhere.focus();
    pressShortcut(elsewhere);
    const input = screen.getByRole('combobox');
    expect(input).toHaveFocus();
    key(input, 'Escape');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(elsewhere).toHaveFocus();
    expect(Object.values(run).some((r) => r.mock.calls.length > 0)).toBe(false);
  });

  it('ignores the shortcut while the user types in another text field', () => {
    const { commands } = makeCommands();
    render(<Page commands={commands} />);
    const other = screen.getByRole('textbox', { name: 'Other field' });
    other.focus();
    expect(pressShortcut(other)).toBe(true); // not prevented: the field keeps its own Ctrl+K behaviour
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(other).toHaveFocus();
  });
});
