import { useState } from 'react';
import Tabs, { type TabItem } from '../Tabs';
import { fruits, press, tab, visiblePanel } from './helpers';

describe('Tabs — hidden', () => {
  it('skips disabled tabs with arrows, Home and End; a disabled tab cannot be clicked into selection', () => {
    const items: TabItem[] = [
      { id: 'a', label: 'Alpha', content: 'A', disabled: true },
      { id: 'b', label: 'Beta', content: 'B' },
      { id: 'c', label: 'Gamma', content: 'C', disabled: true },
      { id: 'd', label: 'Delta', content: 'D' },
      { id: 'e', label: 'Epsilon', content: 'E', disabled: true },
    ];
    const onChange = fn();
    render(<Tabs label="Greek" items={items} onChange={onChange} />);
    // Default selection is the first ENABLED tab.
    expect(tab('Beta')).toHaveAttribute('aria-selected', 'true');
    expect(tab('Gamma')).toBeDisabled();
    tab('Beta').focus();
    press(tab('Beta'), 'ArrowRight');
    expect(tab('Delta')).toHaveFocus();
    press(tab('Delta'), 'ArrowRight'); // skips Epsilon and Alpha while wrapping
    expect(tab('Beta')).toHaveFocus();
    press(tab('Beta'), 'ArrowLeft');
    expect(tab('Delta')).toHaveFocus();
    press(tab('Delta'), 'Home');
    expect(tab('Beta')).toHaveFocus();
    press(tab('Beta'), 'End');
    expect(tab('Delta')).toHaveFocus();
    onChange.mockClear();
    fireEvent.click(tab('Gamma'));
    expect(tab('Gamma')).toHaveAttribute('aria-selected', 'false');
    expect(onChange).toHaveBeenCalledTimes(0);
  });

  it('manual activation: arrows move focus only; Enter and Space select', () => {
    const onChange = fn();
    render(<Tabs label="Fruits" items={fruits} activation="manual" onChange={onChange} />);
    tab('Apple').focus();
    press(tab('Apple'), 'ArrowRight');
    expect(tab('Banana')).toHaveFocus();
    expect(tab('Banana')).toHaveAttribute('aria-selected', 'false');
    expect(tab('Apple')).toHaveAttribute('aria-selected', 'true');
    // The Tab-order stop stays on the selected tab while focus wanders.
    expect(tab('Apple')).toHaveAttribute('tabindex', '0');
    expect(tab('Banana')).toHaveAttribute('tabindex', '-1');
    expect(visiblePanel()).toHaveTextContent('Apples are crisp.');
    expect(onChange).toHaveBeenCalledTimes(0);
    press(tab('Banana'), 'Enter');
    expect(tab('Banana')).toHaveAttribute('aria-selected', 'true');
    expect(visiblePanel()).toHaveTextContent('Bananas are soft.');
    press(tab('Banana'), 'ArrowRight'); // skips disabled Cherry
    expect(tab('Date')).toHaveFocus();
    press(tab('Date'), ' ');
    expect(tab('Date')).toHaveAttribute('aria-selected', 'true');
    expect(onChange.mock.calls).toEqual([['banana'], ['date']]);
  });

  it('controlled: `value` drives the selection; clicks only request a change through onChange', () => {
    const onChange = fn();
    const { rerender } = render(<Tabs label="Fruits" items={fruits} value="banana" onChange={onChange} />);
    expect(tab('Banana')).toHaveAttribute('aria-selected', 'true');
    fireEvent.click(tab('Date'));
    expect(onChange).toHaveBeenCalledWith('date');
    // The parent has not accepted the change yet.
    expect(tab('Banana')).toHaveAttribute('aria-selected', 'true');
    expect(visiblePanel()).toHaveTextContent('Bananas are soft.');
    rerender(<Tabs label="Fruits" items={fruits} value="date" onChange={onChange} />);
    expect(tab('Date')).toHaveAttribute('aria-selected', 'true');
    expect(visiblePanel()).toHaveTextContent('Dates are sweet.');
    // Clicking the already-selected tab is not a change.
    onChange.mockClear();
    fireEvent.click(tab('Date'));
    expect(onChange).toHaveBeenCalledTimes(0);
  });

  it('works when the parent stores the value (controlled round trip with keyboard)', () => {
    function Parent() {
      const [value, setValue] = useState('apple');
      return (
        <>
          <Tabs label="Fruits" items={fruits} value={value} onChange={setValue} />
          <output aria-label="current">{value}</output>
        </>
      );
    }
    render(<Parent />);
    tab('Apple').focus();
    press(tab('Apple'), 'ArrowRight');
    press(tab('Banana'), 'ArrowRight');
    expect(tab('Date')).toHaveFocus();
    expect(screen.getByLabelText('current')).toHaveTextContent('date');
    expect(tab('Date')).toHaveAttribute('aria-selected', 'true');
  });

  it('generates unique, resolvable ids for multiple instances (useId)', () => {
    render(
      <>
        <Tabs label="First" items={fruits} />
        <Tabs label="Second" items={fruits} />
      </>,
    );
    const tabs = screen.getAllByRole('tab');
    const panels = Array.from(document.querySelectorAll('[role="tabpanel"]')) as HTMLElement[];
    expect(panels).toHaveLength(8); // every panel element exists, so every aria-controls resolves
    const ids = [...tabs, ...panels].map((el) => el.id);
    expect(new Set(ids).size).toBe(ids.length);
    tabs.forEach((t) => {
      const panel = document.getElementById(t.getAttribute('aria-controls') as string);
      expect(panel).toBeInTheDocument();
      expect(panel).toHaveAttribute('aria-labelledby', t.id);
    });
    const second = within(screen.getByRole('tablist', { name: 'Second' }));
    fireEvent.click(second.getByRole('tab', { name: 'Banana' }));
    const firstList = within(screen.getByRole('tablist', { name: 'First' }));
    expect(firstList.getByRole('tab', { name: 'Apple' })).toHaveAttribute('aria-selected', 'true');
  });

  it('unmounts inactive panel content by default; keepMounted preserves it (hidden)', () => {
    const items: TabItem[] = [
      { id: 'edit', label: 'Edit', content: <input aria-label="Draft" /> },
      { id: 'preview', label: 'Preview', content: <p>Preview text</p> },
    ];
    const { unmount } = render(<Tabs label="Editor" items={items} />);
    fireEvent.change(screen.getByLabelText('Draft'), { target: { value: 'hello' } });
    fireEvent.click(tab('Preview'));
    expect(screen.queryByLabelText('Draft')).toBeNull();
    fireEvent.click(tab('Edit'));
    expect(screen.getByLabelText('Draft')).toHaveValue('');
    unmount();

    render(<Tabs label="Editor" items={items} keepMounted />);
    fireEvent.change(screen.getByLabelText('Draft'), { target: { value: 'hello' } });
    fireEvent.click(tab('Preview'));
    const draft = document.querySelector('input[aria-label="Draft"]') as HTMLElement;
    expect(draft).toBeInTheDocument();
    expect(draft).not.toBeVisible();
    expect(visiblePanel()).toHaveTextContent('Preview text');
    fireEvent.click(tab('Edit'));
    expect(screen.getByLabelText('Draft')).toHaveValue('hello');
  });

  it('falls back to the first enabled tab when defaultValue is unknown or disabled', () => {
    const { unmount } = render(<Tabs label="Fruits" items={fruits} defaultValue="cherry" />);
    expect(tab('Apple')).toHaveAttribute('aria-selected', 'true');
    expect(tab('Apple')).toHaveAttribute('tabindex', '0');
    expect(tab('Cherry')).toHaveAttribute('aria-selected', 'false');
    unmount();
    render(<Tabs label="Fruits" items={fruits} defaultValue="mango" />);
    expect(tab('Apple')).toHaveAttribute('aria-selected', 'true');
    expect(visiblePanel()).toHaveTextContent('Apples are crisp.');
  });

  it('ignores unrelated keys and does not let other keys change the selection', () => {
    render(<Tabs label="Fruits" items={fruits} />);
    tab('Apple').focus();
    press(tab('Apple'), 'ArrowDown');
    press(tab('Apple'), 'a');
    expect(tab('Apple')).toHaveFocus();
    expect(tab('Apple')).toHaveAttribute('aria-selected', 'true');
  });
});
