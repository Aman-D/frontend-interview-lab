import App from '../App';
import { Harness, openSettings, pressKey } from './helpers';

describe('Modal — public', () => {
  beforeEach(() => {
    document.body.style.overflow = '';
  });

  it('renders nothing while closed, then a labelled modal dialog', () => {
    render(<Harness />);
    expect(screen.queryByRole('dialog')).toBeNull();
    openSettings();
    const dialog = screen.getByRole('dialog', { name: 'Settings' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('is rendered through a portal into document.body', () => {
    const { container } = render(<Harness />);
    openSettings();
    const dialog = screen.getByRole('dialog');
    expect(container.contains(dialog)).toBe(false);
    expect(document.body.contains(dialog)).toBe(true);
  });

  it('moves focus to the first focusable element when it opens', () => {
    render(<Harness />);
    openSettings();
    expect(screen.getByRole('textbox', { name: 'Display name' })).toHaveFocus();
  });

  it('Escape closes the dialog and focus returns to the trigger', () => {
    const onClose = fn();
    render(<Harness onCloseSpy={onClose} />);
    const trigger = openSettings();
    expect(trigger).not.toHaveFocus();
    pressKey('Escape');
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it('traps Tab: last → first and Shift+Tab: first → last', () => {
    render(<Harness />);
    openSettings();
    const input = screen.getByRole('textbox', { name: 'Display name' });
    const cancel = screen.getByRole('button', { name: 'Cancel' });
    cancel.focus();
    pressKey('Tab');
    expect(input).toHaveFocus();
    pressKey('Tab', { shiftKey: true });
    expect(cancel).toHaveFocus();
  });

  it('a backdrop click closes it; a click inside the dialog does not', () => {
    const onClose = fn();
    render(<Harness onCloseSpy={onClose} />);
    openSettings();
    fireEvent.click(screen.getByText('Settings'));
    fireEvent.click(screen.getByRole('textbox', { name: 'Display name' }));
    expect(onClose).toHaveBeenCalledTimes(0);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('modal-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('App: the sign-out confirmation focuses "Stay signed in" and confirms', () => {
    render(<App />);
    const trigger = screen.getByRole('button', { name: 'Sign out' });
    trigger.focus();
    fireEvent.click(trigger);
    const dialog = screen.getByRole('dialog', { name: 'Sign out?' });
    expect(within(dialog).getByRole('button', { name: 'Stay signed in' })).toHaveFocus();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Sign out' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent('You have been signed out');
    expect(trigger).toHaveFocus();
  });
});
