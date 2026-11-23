import Modal from '../Modal';
import { Harness, openSettings, pressKey, trackGlobalKeyListeners } from './helpers';

describe('Modal — hidden', () => {
  beforeEach(() => {
    document.body.style.overflow = '';
  });

  it('initialFocusRef takes precedence over the first focusable element', () => {
    render(<Harness focusSave />);
    openSettings();
    expect(screen.getByRole('button', { name: 'Save' })).toHaveFocus();
  });

  it('skips disabled controls in the trap and prevents the default Tab when wrapping', () => {
    render(<Harness />);
    openSettings();
    screen.getByRole('button', { name: 'Cancel' }).focus(); // "Reset" after it is disabled
    const notPrevented = pressKey('Tab');
    expect(notPrevented).toBe(false);
    expect(screen.getByRole('textbox', { name: 'Display name' })).toHaveFocus();
  });

  it('with no focusable content, focuses the dialog itself and keeps focus there on Tab', () => {
    render(<Harness empty />);
    openSettings();
    const dialog = screen.getByRole('dialog', { name: 'Settings' });
    expect(dialog).toHaveFocus();
    expect(pressKey('Tab')).toBe(false);
    expect(dialog).toHaveFocus();
    expect(pressKey('Tab', { shiftKey: true })).toBe(false);
    expect(dialog).toHaveFocus();
  });

  it('aria-describedby references the description only when one is given', () => {
    const { unmount } = render(<Harness description="Changes apply to every device." />);
    openSettings();
    const dialog = screen.getByRole('dialog');
    const describedBy = dialog.getAttribute('aria-describedby');
    expect(typeof describedBy).toBe('string');
    expect(document.getElementById(describedBy as string)).toHaveTextContent('Changes apply to every device.');
    const labelledBy = dialog.getAttribute('aria-labelledby');
    expect(document.getElementById(labelledBy as string)).toHaveTextContent('Settings');
    unmount();

    render(<Harness />);
    openSettings();
    expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-describedby');
  });

  it('locks body scroll while open and restores the previous value on close and on unmount', () => {
    document.body.style.overflow = 'scroll';
    const { unmount } = render(<Harness />);
    openSettings();
    expect(document.body.style.overflow).toBe('hidden');
    pressKey('Escape');
    expect(document.body.style.overflow).toBe('scroll');
    openSettings();
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('scroll');
  });

  it('only listens for keys while open and leaves no global keydown listener behind', () => {
    const tracker = trackGlobalKeyListeners();
    try {
      const onClose = fn();
      const { rerender } = render(<Modal open={false} onClose={onClose} title="Closed" />);
      fireEvent.keyDown(document.body, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(0);
      rerender(<Modal open onClose={onClose} title="Open" />);
      pressKey('Escape');
      expect(onClose).toHaveBeenCalledTimes(1);
      rerender(<Modal open={false} onClose={onClose} title="Open" />);
      fireEvent.keyDown(document.body, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(tracker.count()).toBe(0);
    } finally {
      tracker.restore();
    }
  });

  it('a new onClose on re-render neither steals focus nor leaves a stale callback', () => {
    const first = fn();
    const second = fn();
    const el = (onClose: () => void) => (
      <Modal open onClose={onClose} title="Rename">
        <input aria-label="First" />
        <input aria-label="Second" />
      </Modal>
    );
    const { rerender } = render(el(() => first()));
    const secondInput = screen.getByRole('textbox', { name: 'Second' });
    secondInput.focus();
    rerender(el(() => second()));
    expect(secondInput).toHaveFocus();
    pressKey('Escape');
    expect(first).toHaveBeenCalledTimes(0);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('returns focus to the trigger when the parent closes it via the open prop', () => {
    render(<Harness />);
    const trigger = openSettings();
    expect(trigger).not.toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(trigger).toHaveFocus();
  });
});
