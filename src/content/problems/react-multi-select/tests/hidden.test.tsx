import MultiSelect from '../MultiSelect';
import { activeOption, chipLabels, ControlledParent, FRUITS, key, openList, option, optionLabels, setup, type } from './helpers';

describe('MultiSelect — hidden', () => {
  it('Backspace only removes a chip when the input is empty', () => {
    const { input, onChange } = setup({ defaultValue: ['apple'] });
    input.focus();
    type(input, 'ch');
    expect(key(input, 'Backspace')).toBe(true); // a normal text edit: not prevented
    expect(onChange).toHaveBeenCalledTimes(0);
    expect(chipLabels()).toEqual(['Apple']);
    expect(input).toHaveValue('ch');
  });

  it('Backspace with no chips is a no-op', () => {
    const { input, onChange } = setup();
    input.focus();
    key(input, 'Backspace');
    expect(onChange).toHaveBeenCalledTimes(0);
  });

  it('maxSelections disables further options with an explanation, but selected ones stay removable', () => {
    const { input, onChange } = setup({ defaultValue: ['apple'], maxSelections: 2 });
    openList(input);
    expect(screen.queryByText(/up to 2 options/)).toBeNull();
    fireEvent.click(option('Banana'));
    expect(onChange).toHaveBeenLastCalledWith(['apple', 'banana']);

    expect(option('Cherry')).toHaveAttribute('aria-disabled', 'true');
    expect(option('Apple').getAttribute('aria-disabled')).not.toBe('true');
    const describedBy = (input.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
    const description = describedBy.map((id) => document.getElementById(id)?.textContent ?? '').join(' ');
    expect(description).toMatch(/up to 2 options/);

    fireEvent.click(option('Cherry'));
    type(input, 'gra');
    key(input, 'Enter');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(chipLabels()).toEqual(['Apple', 'Banana']);

    type(input, '');
    fireEvent.click(option('Apple')); // deselecting is always allowed
    expect(onChange).toHaveBeenLastCalledWith(['banana']);
    expect(option('Cherry').getAttribute('aria-disabled')).not.toBe('true');
    expect(screen.queryByText(/up to 2 options/)).toBeNull();
  });

  it('controlled: renders `value`, reports changes, and does not change on its own', () => {
    const onChange = fn();
    const view = render(<MultiSelect label="Fruits" options={FRUITS} value={['cherry']} onChange={onChange} />);
    const input = screen.getByRole('combobox', { name: 'Fruits' });
    openList(input);
    fireEvent.click(option('Apple'));
    expect(onChange).toHaveBeenLastCalledWith(['cherry', 'apple']);
    expect(chipLabels()).toEqual(['Cherry']); // the parent did not accept the change
    expect(option('Apple')).toHaveAttribute('aria-selected', 'false');
    key(input, 'Backspace');
    expect(onChange).toHaveBeenLastCalledWith([]);
    expect(chipLabels()).toEqual(['Cherry']);
    view.rerender(<MultiSelect label="Fruits" options={FRUITS} value={['grape', 'mango']} onChange={onChange} />);
    expect(chipLabels()).toEqual(['Grape', 'Mango']);
  });

  it('controlled by a real parent: selections round-trip through the parent state in order', () => {
    const spy = fn();
    render(<ControlledParent initial={['mango']} spy={spy} />);
    const input = screen.getByRole('combobox', { name: 'Fruits' });
    openList(input);
    fireEvent.click(option('Cherry'));
    fireEvent.click(option('Apple'));
    expect(spy).toHaveBeenLastCalledWith(['mango', 'cherry', 'apple']);
    expect(chipLabels()).toEqual(['Mango', 'Cherry', 'Apple']);
    fireEvent.click(screen.getByRole('button', { name: 'Remove Cherry' }));
    expect(chipLabels()).toEqual(['Mango', 'Apple']);
  });

  it('uncontrolled: starts from defaultValue and ignores later defaultValue changes', () => {
    const onChange = fn();
    const view = render(<MultiSelect label="Fruits" options={FRUITS} defaultValue={['mango', 'grape']} onChange={onChange} />);
    expect(chipLabels()).toEqual(['Mango', 'Grape']);
    view.rerender(<MultiSelect label="Fruits" options={FRUITS} defaultValue={['apple']} onChange={onChange} />);
    expect(chipLabels()).toEqual(['Mango', 'Grape']);
    const input = screen.getByRole('combobox', { name: 'Fruits' });
    openList(input);
    fireEvent.click(option('Apple'));
    expect(onChange).toHaveBeenLastCalledWith(['mango', 'grape', 'apple']);
    expect(chipLabels()).toEqual(['Mango', 'Grape', 'Apple']);
  });

  it('the active option is exposed via aria-activedescendant (not aria-selected) and navigation wraps', () => {
    const { input } = setup({ defaultValue: ['banana'] });
    openList(input);
    let active = activeOption(input);
    expect(active).toHaveTextContent('Apple');
    expect(active).toHaveAttribute('role', 'option');
    expect(active).toHaveAttribute('aria-selected', 'false'); // active ≠ selected in a multi-select
    expect(screen.getAllByRole('option').filter((o) => o.getAttribute('aria-selected') === 'true').map((o) => o.textContent)).toEqual(['Banana']);
    key(input, 'ArrowUp');
    expect(activeOption(input)).toHaveTextContent('Pineapple');
    key(input, 'ArrowDown');
    active = activeOption(input);
    expect(active).toHaveTextContent('Apple');
    key(input, 'ArrowUp');
    key(input, 'ArrowUp');
    expect(activeOption(input)).toHaveTextContent('Mango');
    type(input, 'an'); // Banana, Durian, Mango → typing makes the FIRST selectable match active
    expect(activeOption(input)).toHaveTextContent('Banana');
    type(input, 'zz');
    expect(screen.queryAllByRole('option')).toHaveLength(0);
    expect(input.getAttribute('aria-activedescendant') ?? '').toBe('');
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('status')).toHaveTextContent('No options found');
  });

  it('selecting clears the query and keeps the list open with focus in the input', () => {
    const { input, onChange } = setup();
    input.focus();
    type(input, 'gr');
    expect(optionLabels()).toEqual(['Grape']);
    key(input, 'Enter');
    expect(onChange).toHaveBeenLastCalledWith(['grape']);
    expect(input).toHaveValue('');
    expect(optionLabels()).toEqual(FRUITS.map((f) => f.label));
    expect(input).toHaveFocus();
    expect(activeOption(input)).toHaveTextContent('Grape');
  });

  it('disabled options are aria-disabled and cannot be selected by click or Enter', () => {
    const { input, onChange } = setup();
    input.focus();
    type(input, 'dur');
    expect(option('Durian')).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(option('Durian'));
    key(input, 'Enter');
    expect(onChange).toHaveBeenCalledTimes(0);
    expect(chipLabels()).toEqual([]);
  });
});
