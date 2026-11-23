import Tabs from '../Tabs';
import { fruits, press, tab, visiblePanel } from './helpers';

describe('Tabs — public', () => {
  it('renders a labelled tablist; the first tab is selected and only its panel is shown', () => {
    render(<Tabs label="Fruits" items={fruits} />);
    expect(screen.getByRole('tablist', { name: 'Fruits' })).toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(4);
    expect(tab('Apple')).toHaveAttribute('aria-selected', 'true');
    expect(tab('Banana')).toHaveAttribute('aria-selected', 'false');
    expect(screen.getAllByRole('tabpanel')).toHaveLength(1);
    expect(visiblePanel()).toHaveTextContent('Apples are crisp.');
    expect(screen.queryByText('Bananas are soft.')).toBeNull();
  });

  it('links each tab and panel with ids (aria-controls / aria-labelledby); the panel is focusable', () => {
    render(<Tabs label="Fruits" items={fruits} />);
    const apple = tab('Apple');
    const panel = visiblePanel();
    expect(apple.id).toBeTruthy();
    expect(panel.id).toBeTruthy();
    expect(apple).toHaveAttribute('aria-controls', panel.id);
    expect(panel).toHaveAttribute('aria-labelledby', apple.id);
    expect(panel).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('tabpanel', { name: 'Apple' })).toBe(panel);
  });

  it('clicking a tab selects it, shows its panel and calls onChange', () => {
    const onChange = fn();
    render(<Tabs label="Fruits" items={fruits} onChange={onChange} />);
    fireEvent.click(tab('Banana'));
    expect(tab('Banana')).toHaveAttribute('aria-selected', 'true');
    expect(tab('Apple')).toHaveAttribute('aria-selected', 'false');
    expect(visiblePanel()).toHaveTextContent('Bananas are soft.');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('banana');
  });

  it('uses a roving tabindex: only the selected tab is in the Tab order', () => {
    render(<Tabs label="Fruits" items={fruits} defaultValue="banana" />);
    expect(tab('Banana')).toHaveAttribute('tabindex', '0');
    expect(tab('Apple')).toHaveAttribute('tabindex', '-1');
    expect(tab('Date')).toHaveAttribute('tabindex', '-1');
    fireEvent.click(tab('Date'));
    expect(tab('Date')).toHaveAttribute('tabindex', '0');
    expect(tab('Banana')).toHaveAttribute('tabindex', '-1');
  });

  it('ArrowRight / ArrowLeft move focus and select (automatic activation), wrapping at the ends', () => {
    render(<Tabs label="Fruits" items={fruits.filter((f) => !f.disabled)} />);
    tab('Apple').focus();
    press(tab('Apple'), 'ArrowRight');
    expect(tab('Banana')).toHaveFocus();
    expect(tab('Banana')).toHaveAttribute('aria-selected', 'true');
    expect(visiblePanel()).toHaveTextContent('Bananas are soft.');
    press(tab('Banana'), 'ArrowLeft');
    press(tab('Apple'), 'ArrowLeft'); // wraps to the last tab
    expect(tab('Date')).toHaveFocus();
    expect(tab('Date')).toHaveAttribute('aria-selected', 'true');
    press(tab('Date'), 'ArrowRight'); // wraps to the first tab
    expect(tab('Apple')).toHaveFocus();
  });

  it('Home and End jump to the first and last tab', () => {
    render(<Tabs label="Fruits" items={fruits} defaultValue="banana" />);
    tab('Banana').focus();
    press(tab('Banana'), 'End');
    expect(tab('Date')).toHaveFocus();
    expect(tab('Date')).toHaveAttribute('aria-selected', 'true');
    press(tab('Date'), 'Home');
    expect(tab('Apple')).toHaveFocus();
    expect(tab('Apple')).toHaveAttribute('aria-selected', 'true');
  });
});
