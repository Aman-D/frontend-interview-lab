import { chipLabels, key, openList, option, optionLabels, setup, type } from './helpers';

describe('MultiSelect — public', () => {
  it('renders a labelled, collapsed combobox; typing opens a multi-selectable listbox filtered case-insensitively', () => {
    const { input } = setup();
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(input).toHaveAttribute('aria-autocomplete', 'list');
    expect(screen.queryByRole('listbox')).toBeNull();
    input.focus();
    type(input, 'AP');
    const listbox = screen.getByRole('listbox');
    expect(listbox).toHaveAttribute('aria-multiselectable', 'true');
    expect(input).toHaveAttribute('aria-expanded', 'true');
    expect(input.getAttribute('aria-controls')).toBe(listbox.id);
    expect(optionLabels()).toEqual(['Apple', 'Grape', 'Pineapple']);
  });

  it('clicking an option adds a chip and calls onChange; the option stays listed with aria-selected="true"', () => {
    const { input, onChange } = setup();
    input.focus();
    type(input, 'an');
    expect(optionLabels()).toEqual(['Banana', 'Durian', 'Mango']);
    fireEvent.click(option('Banana'));
    expect(onChange).toHaveBeenLastCalledWith(['banana']);
    expect(chipLabels()).toEqual(['Banana']);
    expect(option('Banana')).toHaveAttribute('aria-selected', 'true');
    expect(option('Mango')).toHaveAttribute('aria-selected', 'false');
  });

  it('a chip\'s "Remove <label>" button removes that value and moves focus to the input', () => {
    const { input, onChange } = setup({ defaultValue: ['apple', 'cherry', 'mango'] });
    expect(chipLabels()).toEqual(['Apple', 'Cherry', 'Mango']);
    const remove = screen.getByRole('button', { name: 'Remove Cherry' });
    remove.focus();
    fireEvent.click(remove);
    expect(onChange).toHaveBeenLastCalledWith(['apple', 'mango']);
    expect(chipLabels()).toEqual(['Apple', 'Mango']);
    expect(input).toHaveFocus();
  });

  it('Backspace in an empty input removes the last chip', () => {
    const { input, onChange } = setup({ defaultValue: ['apple', 'cherry'] });
    input.focus();
    key(input, 'Backspace');
    expect(onChange).toHaveBeenLastCalledWith(['apple']);
    expect(chipLabels()).toEqual(['Apple']);
  });

  it('ArrowDown moves the active option and Enter toggles it', () => {
    const { input, onChange } = setup();
    openList(input); // opens; first option is active
    key(input, 'ArrowDown');
    expect(key(input, 'Enter')).toBe(false);
    expect(onChange).toHaveBeenLastCalledWith(['banana']);
    expect(option('Banana')).toHaveAttribute('aria-selected', 'true');
    key(input, 'Enter');
    expect(onChange).toHaveBeenLastCalledWith([]);
    expect(option('Banana')).toHaveAttribute('aria-selected', 'false');
    expect(chipLabels()).toEqual([]);
  });

  it('Escape closes the listbox', () => {
    const { input } = setup();
    openList(input);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    key(input, 'Escape');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(input).toHaveFocus();
  });
});
