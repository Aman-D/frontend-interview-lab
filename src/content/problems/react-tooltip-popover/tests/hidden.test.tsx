import Popover from '../Popover';
import Tooltip from '../Tooltip';
import { focusOn, idsOf, press } from './helpers';

const fixedAt = (style: Record<string, number>) => ({ position: 'fixed' as const, ...style });

describe('Tooltip — hidden', () => {
  beforeEach(() => timers.useFake());

  it('is hoverable: moving from the trigger onto the tooltip keeps it open; leaving both hides it', () => {
    render(
      <Tooltip content="Archived items are kept for 30 days">
        <button type="button">Archive</button>
      </Tooltip>,
    );
    const button = screen.getByRole('button', { name: 'Archive' });
    fireEvent.mouseEnter(button);
    timers.advance(400);
    const tooltip = screen.getByRole('tooltip');
    fireEvent.mouseLeave(button);
    expect(screen.getByRole('tooltip')).toBeVisible(); // not hidden synchronously
    fireEvent.mouseEnter(tooltip);
    timers.advance(1000);
    expect(screen.getByRole('tooltip')).toBeVisible();
    focusOn(button);
    act(() => button.blur()); // the pointer resting on the tooltip still holds it open
    timers.advance(1000);
    expect(screen.getByRole('tooltip')).toBeVisible();
    fireEvent.mouseLeave(tooltip);
    timers.advance(1000);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('never appears if the pointer leaves before the delay, and leaves no timer behind on unmount', () => {
    const { unmount } = render(
      <Tooltip content="Delete forever" delay={500}>
        <button type="button">Delete</button>
      </Tooltip>,
    );
    const button = screen.getByRole('button', { name: 'Delete' });
    fireEvent.mouseEnter(button);
    timers.advance(300);
    fireEvent.mouseLeave(button);
    timers.advance(2000);
    expect(screen.queryByRole('tooltip')).toBeNull();
    fireEvent.mouseEnter(button);
    timers.advance(499);
    expect(screen.queryByRole('tooltip')).toBeNull();
    unmount();
    expect(timers.pendingCount()).toBe(0); // the pending show timer was cleared, not left to fire
  });

  it('keeps the trigger\'s own name and merges with an existing aria-describedby (no aria-labelledby)', () => {
    render(
      <div>
        <p id="shortcut-hint">Shortcut: S</p>
        <Tooltip content="Saves a draft">
          <button type="button" aria-describedby="shortcut-hint">
            Save
          </button>
        </Tooltip>
      </div>,
    );
    const button = screen.getByRole('button', { name: 'Save' });
    fireEvent.mouseEnter(button);
    timers.advance(400);
    const tooltip = screen.getByRole('tooltip');
    const ids = idsOf(button, 'aria-describedby');
    expect(ids).toContain('shortcut-hint');
    expect(ids).toContain(tooltip.id);
    expect(button).not.toHaveAttribute('aria-labelledby');
    expect(button).not.toHaveAttribute('aria-label');
    expect(document.getElementById(tooltip.id)).toHaveTextContent('Saves a draft');
  });

  it('stays open while either hover or focus holds it', () => {
    render(
      <Tooltip content="Share with your team">
        <button type="button">Share</button>
      </Tooltip>,
    );
    const button = focusOn(screen.getByRole('button', { name: 'Share' }));
    fireEvent.mouseEnter(button);
    timers.advance(400);
    act(() => button.blur()); // pointer is still over it
    timers.advance(400);
    expect(screen.getByRole('tooltip')).toBeVisible();
    fireEvent.mouseLeave(button);
    timers.advance(400);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('flips to the bottom at the top edge and stays inside the left edge', () => {
    render(
      <div style={fixedAt({ top: 0, left: 0 })}>
        <Tooltip content="A fairly long description that is wider than its trigger" placement="top">
          <button type="button">Edge</button>
        </Tooltip>
      </div>,
    );
    const button = screen.getByRole('button', { name: 'Edge' });
    fireEvent.mouseEnter(button);
    timers.advance(400);
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveAttribute('data-placement', 'bottom');
    const t = button.getBoundingClientRect();
    const r = tooltip.getBoundingClientRect();
    expect(r.top).toBeGreaterThanOrEqual(t.bottom);
    expect(r.left).toBeGreaterThanOrEqual(8);
    expect(r.width).toBeGreaterThan(t.width); // centring alone would have pushed it off-screen
  });
});

describe('Popover — hidden', () => {
  it('clicking the trigger while open closes it (the outside-press handler must ignore the trigger)', () => {
    const onOpenChange = fn();
    render(<Popover trigger={<button type="button">Sort</button>} content={<button type="button">Newest first</button>} onOpenChange={onOpenChange} />);
    const trigger = focusOn(screen.getByRole('button', { name: 'Sort' }));
    press(trigger);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    focusOn(trigger);
    press(trigger);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveFocus();
    expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
  });

  it('is a dialog named by its trigger; with no focusable content the panel itself gets focus', () => {
    render(<Popover trigger={<button type="button">Shipping info</button>} content={<p>Ships in 2–3 days.</p>} />);
    const trigger = screen.getByRole('button', { name: 'Shipping info' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    focusOn(trigger);
    press(trigger);
    const dialog = screen.getByRole('dialog', { name: 'Shipping info' });
    expect(dialog).toHaveFocus();
  });

  it('composes the trigger\'s own onClick and removes its document listeners after closing', () => {
    const onClick = fn();
    const onOpenChange = fn();
    render(
      <div>
        <Popover trigger={<button type="button" onClick={onClick}>Menu</button>} content={<a href="#a">Account</a>} onOpenChange={onOpenChange} />
        <button type="button">Elsewhere</button>
      </div>,
    );
    const trigger = focusOn(screen.getByRole('button', { name: 'Menu' }));
    press(trigger);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('link', { name: 'Account' })).toHaveFocus();
    press(screen.getByRole('button', { name: 'Elsewhere' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onOpenChange).toHaveBeenCalledTimes(2);
    const elsewhere = focusOn(screen.getByRole('button', { name: 'Elsewhere' }));
    press(elsewhere);
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(elsewhere).toHaveFocus(); // a leftover listener would pull focus back to the trigger
    expect(onOpenChange).toHaveBeenCalledTimes(2);
    expect(trigger).not.toHaveAttribute('aria-controls');
  });

  it('flips above the trigger near the bottom edge of the viewport', () => {
    render(
      <div style={fixedAt({ bottom: 0, left: 200 })}>
        <Popover trigger={<button type="button">Help</button>} content={<div style={{ height: 120, width: 160 }}>Help text</div>} />
      </div>,
    );
    const trigger = focusOn(screen.getByRole('button', { name: 'Help' }));
    press(trigger);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('data-placement', 'top');
    expect(dialog.getBoundingClientRect().bottom).toBeLessThanOrEqual(trigger.getBoundingClientRect().top);
  });
});
