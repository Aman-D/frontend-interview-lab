import CommandPalette from '../CommandPalette';
import type { Command } from '../types';
import { activeOption, key, makeCommands, openWithButton, optionTitles, Page, pressShortcut, type } from './helpers';

describe('CommandPalette — hidden', () => {
  it('aria-activedescendant tracks the active option (aria-selected) and wraps, skipping disabled commands', () => {
    const { commands } = makeCommands();
    render(<Page commands={commands} />);
    const { input } = openWithButton();
    let active = activeOption(input);
    expect(active).toHaveTextContent('Go to home');
    expect(active).toHaveAttribute('aria-selected', 'true');
    expect(screen.getAllByRole('option').filter((o) => o.getAttribute('aria-selected') === 'true')).toHaveLength(1);
    key(input, 'ArrowUp'); // wraps to the last ENABLED option ("Delete account" is disabled)
    active = activeOption(input);
    expect(active).toHaveTextContent('Sign out');
    expect(active).toHaveAttribute('role', 'option');
    key(input, 'ArrowDown');
    expect(activeOption(input)).toHaveTextContent('Go to home');
    expect(input).toHaveFocus();
  });

  it('disabled commands are marked aria-disabled and can be neither clicked nor run with Enter', () => {
    const { commands, run } = makeCommands();
    render(<Page commands={commands} />);
    const { input } = openWithButton();
    const disabled = screen.getAllByRole('option').find((o) => o.textContent?.includes('Delete account')) as HTMLElement;
    expect(disabled).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(disabled);
    expect(run['delete-account']).toHaveBeenCalledTimes(0);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    type(input, 'delete');
    expect(optionTitles()).toEqual(['Delete account']);
    expect(activeOption(input)).toBeNull();
    key(input, 'ArrowDown');
    key(input, 'Enter');
    expect(run['delete-account']).toHaveBeenCalledTimes(0);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('shows recent commands first in a "Recent" group and records newly run commands', () => {
    const { commands, run } = makeCommands();
    render(<Page commands={commands} initialRecentIds={['save-all']} />);
    let { input } = openWithButton();
    const groups = within(screen.getByRole('listbox')).getAllByRole('group');
    expect(groups[0]).toBe(screen.getByRole('group', { name: 'Recent' }));
    expect(optionTitles(groups[0])).toEqual(['Save all files']);
    expect(optionTitles(screen.getByRole('group', { name: 'File' }))).toEqual(['Create new file', 'Open recent file']);
    type(input, 'billing');
    key(input, 'Enter');
    expect(run['go-billing']).toHaveBeenCalledTimes(1);
    ({ input } = openWithButton());
    expect(input).toHaveValue(''); // every open starts with a fresh query
    expect(optionTitles(screen.getByRole('group', { name: 'Recent' }))).toEqual(['Go to billing', 'Save all files']);
  });

  it('Ctrl+K inside the palette closes it (restoring focus); textarea and contenteditable keep the shortcut', () => {
    const { commands } = makeCommands();
    render(<Page commands={commands} />);
    const elsewhere = screen.getByRole('button', { name: 'Elsewhere' });
    elsewhere.focus();
    pressShortcut(elsewhere, { metaKey: true });
    const input = screen.getByRole('combobox');
    expect(pressShortcut(input)).toBe(false);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(elsewhere).toHaveFocus();

    const notes = screen.getByRole('textbox', { name: 'Notes' });
    notes.focus();
    expect(pressShortcut(notes)).toBe(true);
    const editor = screen.getByRole('textbox', { name: 'Rich editor' });
    editor.focus();
    expect(pressShortcut(editor, { metaKey: true })).toBe(true);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('clicking an option runs it, closes the palette and returns focus to the trigger', () => {
    const { commands, run } = makeCommands();
    render(<Page commands={commands} />);
    const { trigger } = openWithButton();
    const option = screen.getAllByRole('option').find((o) => o.textContent?.includes('Sign out')) as HTMLElement;
    fireEvent.click(option);
    expect(run['sign-out']).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it('resets the active option to the best match when the query changes; no results means no active option', () => {
    const { commands, run } = makeCommands();
    render(<Page commands={commands} />);
    const { input } = openWithButton();
    type(input, 'go');
    expect(optionTitles()).toEqual(['Go to home', 'Go to settings', 'Go to billing', 'Sign out']);
    key(input, 'ArrowDown');
    key(input, 'ArrowDown');
    expect(activeOption(input)).toHaveTextContent('Go to billing');
    type(input, 'go t');
    expect(activeOption(input)).toHaveTextContent('Go to home');
    type(input, 'qqq');
    expect(input.getAttribute('aria-activedescendant') ?? '').toBe('');
    expect(input).toHaveAttribute('aria-expanded', 'false');
    key(input, 'Enter');
    expect(Object.values(run).some((r) => r.mock.calls.length > 0)).toBe(false);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('restores focus BEFORE running the command, so a command can move focus itself', () => {
    const commands: Command[] = [
      { id: 'focus-notes', title: 'Focus notes', section: 'Editor', run: () => (screen.getByRole('textbox', { name: 'Notes' }) as HTMLElement).focus() },
    ];
    render(<Page commands={commands} />);
    const { input } = openWithButton();
    key(input, 'Enter');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('textbox', { name: 'Notes' })).toHaveFocus();
  });

  it('keeps Tab inside the palette and removes its global listener on unmount', () => {
    const { commands } = makeCommands();
    const view = render(<CommandPalette commands={commands} />);
    const { input } = openWithButton();
    expect(key(input, 'Tab')).toBe(false);
    expect(key(input, 'Tab', { shiftKey: true })).toBe(false);
    expect(input).toHaveFocus();
    key(input, 'Escape');
    view.unmount();
    expect(pressShortcut(document)).toBe(true);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
