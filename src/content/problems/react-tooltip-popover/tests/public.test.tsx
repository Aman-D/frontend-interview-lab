import Popover from '../Popover';
import Tooltip from '../Tooltip';
import { focusOn, idsOf, press } from './helpers';

function CopyButton() {
  return (
    <Tooltip content="Copy link to clipboard">
      <button type="button">Copy</button>
    </Tooltip>
  );
}

function Filters({ onOpenChange }: { onOpenChange?: (open: boolean) => void }) {
  return (
    <div>
      <Popover
        trigger={<button type="button">Filters</button>}
        onOpenChange={onOpenChange}
        content={
          <div>
            <label>
              <input type="checkbox" /> In stock only
            </label>
            <button type="button">Apply</button>
          </div>
        }
      />
      <p>Outside text</p>
    </div>
  );
}

describe('Tooltip — public', () => {
  beforeEach(() => timers.useFake());

  it('shows a role="tooltip" after the hover delay, described by the trigger', () => {
    render(<CopyButton />);
    const button = screen.getByRole('button', { name: 'Copy' });
    fireEvent.mouseEnter(button);
    timers.advance(100);
    expect(screen.queryByRole('tooltip')).toBeNull();
    timers.advance(250);
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveTextContent('Copy link to clipboard');
    expect(tooltip).toBeVisible();
    expect(idsOf(button, 'aria-describedby')).toContain(tooltip.id);
  });

  it('is rendered through a portal into document.body', () => {
    const { container } = render(<CopyButton />);
    fireEvent.mouseEnter(screen.getByRole('button', { name: 'Copy' }));
    timers.advance(400);
    const tooltip = screen.getByRole('tooltip');
    expect(container.contains(tooltip)).toBe(false);
    expect(document.body.contains(tooltip)).toBe(true);
  });

  it('shows on keyboard focus and hides on blur', () => {
    render(<CopyButton />);
    const button = focusOn(screen.getByRole('button', { name: 'Copy' }));
    timers.advance(400);
    expect(screen.getByRole('tooltip')).toBeVisible();
    act(() => button.blur());
    timers.advance(400);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('Escape dismisses it while the pointer is still over the trigger', () => {
    render(<CopyButton />);
    const button = screen.getByRole('button', { name: 'Copy' });
    fireEvent.mouseEnter(button);
    timers.advance(400);
    expect(screen.getByRole('tooltip')).toBeVisible();
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).toBeNull();
    timers.advance(1000);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });
});

describe('Popover — public', () => {
  it('toggles on click with aria-expanded / aria-controls and moves focus inside', () => {
    render(<Filters />);
    const trigger = screen.getByRole('button', { name: 'Filters' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('dialog')).toBeNull();
    focusOn(trigger);
    press(trigger);
    const dialog = screen.getByRole('dialog');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger.getAttribute('aria-controls')).toBe(dialog.id);
    expect(screen.getByRole('checkbox', { name: 'In stock only' })).toHaveFocus();
  });

  it('Escape closes it and returns focus to the trigger', () => {
    const onOpenChange = fn();
    render(<Filters onOpenChange={onOpenChange} />);
    const trigger = focusOn(screen.getByRole('button', { name: 'Filters' }));
    press(trigger);
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    fireEvent.keyDown(document.activeElement as Element, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveFocus();
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it('a press outside closes it and returns focus; a press inside does not', () => {
    const { container } = render(<Filters />);
    const trigger = focusOn(screen.getByRole('button', { name: 'Filters' }));
    press(trigger);
    const dialog = screen.getByRole('dialog');
    expect(container.contains(dialog)).toBe(false);
    press(within(dialog).getByRole('button', { name: 'Apply' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    press(screen.getByText('Outside text'));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(trigger).toHaveFocus();
  });
});
