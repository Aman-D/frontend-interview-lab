import { useState } from 'react';
import MultiSelect from '../MultiSelect';
import type { MultiSelectProps, Option } from '../types';

export const FRUITS: Option[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'durian', label: 'Durian', disabled: true },
  { value: 'grape', label: 'Grape' },
  { value: 'mango', label: 'Mango' },
  { value: 'pineapple', label: 'Pineapple' },
];

/** Renders <MultiSelect label="Fruits"> with a spy onChange; any prop can be overridden. */
export function setup(props: Partial<MultiSelectProps> = {}) {
  const onChange = fn();
  const view = render(<MultiSelect label="Fruits" options={FRUITS} onChange={onChange} {...props} />);
  const input = screen.getByRole('combobox', { name: 'Fruits' }) as HTMLInputElement;
  return { input, onChange, view };
}

/** A parent that owns the value, like real controlled usage. */
export function ControlledParent({ initial = [], maxSelections, spy }: { initial?: string[]; maxSelections?: number; spy?: (v: string[]) => void }) {
  const [value, setValue] = useState<string[]>(initial);
  return (
    <MultiSelect
      label="Fruits"
      options={FRUITS}
      value={value}
      maxSelections={maxSelections}
      onChange={(next) => {
        spy?.(next);
        setValue(next);
      }}
    />
  );
}

export function type(input: HTMLElement, value: string) {
  fireEvent.change(input, { target: { value } });
}

export function key(el: HTMLElement, k: string, init: Record<string, unknown> = {}): boolean {
  return fireEvent.keyDown(el, { key: k, ...init });
}

/** Labels of the chips, read from their "Remove <label>" buttons. */
export function chipLabels(): string[] {
  return screen
    .queryAllByRole('button', { name: /^Remove / })
    .map((b) => (b.getAttribute('aria-label') || b.textContent || '').replace(/^Remove\s+/, '').trim());
}

export function optionLabels(): string[] {
  return screen.queryAllByRole('option').map((o) => (o.textContent ?? '').trim());
}

export function option(labelText: string): HTMLElement {
  const found = screen.getAllByRole('option').find((o) => (o.textContent ?? '').trim() === labelText);
  if (!found) throw new Error(`No option "${labelText}"`);
  return found;
}

export function activeOption(input: HTMLElement): HTMLElement | null {
  const id = input.getAttribute('aria-activedescendant');
  return id ? document.getElementById(id) : null;
}

/** Opens the list with ArrowDown (focus first, since fireEvent does not move focus). */
export function openList(input: HTMLElement) {
  input.focus();
  key(input, 'ArrowDown');
}
