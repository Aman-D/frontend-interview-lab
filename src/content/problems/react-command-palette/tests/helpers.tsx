import CommandPalette, { type CommandPaletteProps } from '../CommandPalette';
import type { Command } from '../types';

/** A fresh command list with a mock `run` per command, keyed by id. */
export function makeCommands() {
  const run: Record<string, ReturnType<typeof fn>> = {};
  const def = (id: string, title: string, section: string, extra: Partial<Command> = {}): Command => {
    run[id] = fn();
    return { id, title, section, run: run[id] as unknown as () => void, ...extra };
  };
  const commands: Command[] = [
    def('go-home', 'Go to home', 'Navigation'),
    def('go-settings', 'Go to settings', 'Navigation'),
    def('go-billing', 'Go to billing', 'Navigation'),
    def('new-file', 'Create new file', 'File'),
    def('open-recent', 'Open recent file', 'File'),
    def('save-all', 'Save all files', 'File'),
    def('sign-out', 'Sign out', 'Account'),
    def('delete-account', 'Delete account', 'Account', { disabled: true }),
  ];
  return { commands, run };
}

/** The palette next to some other focusable controls, like a real page. */
export function Page(props: CommandPaletteProps) {
  return (
    <div>
      <button type="button">Elsewhere</button>
      <input aria-label="Other field" />
      <textarea aria-label="Notes" />
      <div contentEditable suppressContentEditableWarning aria-label="Rich editor" role="textbox">
        editable
      </div>
      <CommandPalette {...props} />
    </div>
  );
}

export function pressShortcut(target: Document | Element = document, init: Record<string, unknown> = { ctrlKey: true }): boolean {
  return fireEvent.keyDown(target, { key: 'k', ...init });
}

export function openWithButton() {
  const trigger = screen.getByRole('button', { name: 'Open command palette' });
  trigger.focus(); // fireEvent.click does not move focus
  fireEvent.click(trigger);
  return { trigger, input: screen.getByRole('combobox') as HTMLInputElement };
}

export function type(input: HTMLElement, value: string) {
  fireEvent.change(input, { target: { value } });
}

export function key(input: HTMLElement, k: string, init: Record<string, unknown> = {}): boolean {
  return fireEvent.keyDown(input, { key: k, ...init });
}

export function optionTitles(container: HTMLElement = document.body): string[] {
  return within(container)
    .queryAllByRole('option')
    .map((o) => (o.textContent ?? '').trim());
}

export function activeOption(input: HTMLElement): HTMLElement | null {
  const id = input.getAttribute('aria-activedescendant');
  return id ? document.getElementById(id) : null;
}
