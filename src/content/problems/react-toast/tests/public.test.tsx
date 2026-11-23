import { useToast } from '../ToastProvider';
import { setup, toastFor } from './helpers';

describe('Toast — public', () => {
  beforeEach(() => timers.useFake());

  it('has a polite status region before any toast; show() renders the message there and returns an id', () => {
    const { show } = setup();
    const region = screen.getByRole('status');
    expect(region).toHaveAttribute('aria-live', 'polite');
    const id = show('Profile saved', { type: 'success' });
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
    expect(screen.getByRole('status')).toBe(region); // same element: the region was not re-created
    expect(region).toHaveTextContent('Profile saved');
    expect(show('Another')).not.toBe(id);
  });

  it('auto-dismisses after the default duration (4000 ms) or a custom one', () => {
    const { show } = setup();
    show('Default toast');
    show('Quick toast', { duration: 1000 });
    timers.advance(999);
    expect(screen.queryByText('Quick toast')).toBeInTheDocument();
    timers.advance(1);
    expect(screen.queryByText('Quick toast')).toBeNull();
    timers.advance(2999); // t = 3999
    expect(screen.queryByText('Default toast')).toBeInTheDocument();
    timers.advance(1);
    expect(screen.queryByText('Default toast')).toBeNull();
  });

  it('the close button dismisses only its own toast', () => {
    const { show } = setup();
    show('First');
    show('Second');
    fireEvent.click(within(toastFor('First')).getByRole('button', { name: /dismiss/i }));
    expect(screen.queryByText('First')).toBeNull();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });

  it('error toasts use role="alert" and are not placed in the polite region', () => {
    const { show } = setup();
    show('Upload failed', { type: 'error' });
    show('Uploading…');
    expect(screen.getByRole('alert')).toHaveTextContent('Upload failed');
    expect(screen.getByRole('status')).not.toHaveTextContent('Upload failed');
    expect(screen.getByRole('status')).toHaveTextContent('Uploading…');
  });

  it('hovering pauses the timer; leaving resumes with the REMAINING time', () => {
    const { show } = setup();
    show('Hover me', { duration: 4000 });
    timers.advance(3000);
    fireEvent.mouseEnter(toastFor('Hover me'));
    timers.advance(10000);
    expect(screen.getByText('Hover me')).toBeInTheDocument();
    fireEvent.mouseLeave(toastFor('Hover me'));
    timers.advance(999);
    expect(screen.getByText('Hover me')).toBeInTheDocument();
    timers.advance(1);
    expect(screen.queryByText('Hover me')).toBeNull();
  });

  it('useToast() outside a provider throws a helpful error', () => {
    function Orphan() {
      useToast();
      return null;
    }
    // Expected noise: React's development build logs this error and re-dispatches it as window
    // "error" events, so the run's Problems/console view shows it (as "Script error.") even when
    // this test passes.
    expect(() => render(<Orphan />)).toThrow(/ToastProvider/);
  });
});
