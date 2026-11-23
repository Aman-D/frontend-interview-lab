import { setup, toastFor } from './helpers';

const order = (container: HTMLElement, messages: string[]) =>
  Array.from(container.querySelectorAll('[data-toast]')).map((el) => messages.find((m) => (el.textContent ?? '').includes(m)));

describe('Toast — hidden', () => {
  beforeEach(() => timers.useFake());

  it('focus inside a toast pauses it; it stays paused until BOTH hover and focus have left', () => {
    const { show } = setup();
    show('Focus me', { duration: 2000 });
    timers.advance(500);
    const close = within(toastFor('Focus me')).getByRole('button', { name: /dismiss/i });
    fireEvent.focus(close);
    fireEvent.mouseEnter(toastFor('Focus me'));
    timers.advance(5000);
    fireEvent.mouseLeave(toastFor('Focus me')); // still focused → still paused
    timers.advance(5000);
    expect(screen.getByText('Focus me')).toBeInTheDocument();
    fireEvent.blur(close);
    timers.advance(1499);
    expect(screen.getByText('Focus me')).toBeInTheDocument();
    timers.advance(1);
    expect(screen.queryByText('Focus me')).toBeNull();
  });

  it('remaining time accumulates across several pause/resume cycles', () => {
    const { show } = setup();
    show('Cycles', { duration: 3000 });
    const el = () => toastFor('Cycles');
    timers.advance(1000); // 2000 left
    fireEvent.mouseEnter(el());
    timers.advance(4000);
    fireEvent.mouseLeave(el());
    timers.advance(1000); // 1000 left
    fireEvent.mouseEnter(el());
    timers.advance(4000);
    fireEvent.mouseLeave(el());
    timers.advance(999);
    expect(screen.getByText('Cycles')).toBeInTheDocument();
    timers.advance(1);
    expect(screen.queryByText('Cycles')).toBeNull();
  });

  it('duration 0 or Infinity makes a toast sticky without scheduling any timer', () => {
    const { show } = setup();
    show('Sticky zero', { duration: 0 });
    show('Sticky forever', { duration: Infinity });
    expect(timers.pendingCount()).toBe(0);
    timers.advance(60_000);
    expect(screen.getByText('Sticky zero')).toBeInTheDocument();
    expect(screen.getByText('Sticky forever')).toBeInTheDocument();
  });

  it('shows at most `max` toasts; queued toasts appear (FIFO) when space frees and only then start their timer', () => {
    const { show } = setup({ max: 2 });
    show('A', { duration: 1000 });
    show('B', { duration: Infinity });
    show('C', { duration: 1000 });
    show('D', { duration: Infinity });
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.queryByText('C')).toBeNull();
    expect(screen.queryByText('D')).toBeNull();
    timers.advance(1000); // A expires → C (the oldest queued) appears
    expect(screen.queryByText('A')).toBeNull();
    expect(screen.getByText('C')).toBeInTheDocument();
    expect(screen.queryByText('D')).toBeNull();
    timers.advance(999); // C has been visible for 999 ms
    expect(screen.getByText('C')).toBeInTheDocument();
    timers.advance(1);
    expect(screen.queryByText('C')).toBeNull();
    expect(screen.getByText('D')).toBeInTheDocument();
  });

  it('keeps every toast shown in the same tick and renders the newest first', () => {
    const { captured } = setup();
    // Three calls inside ONE act (one batch): a stale-closure `setToasts([...toasts, t])` would keep only the last.
    act(() => {
      const api = captured.api as NonNullable<typeof captured.api>;
      api.show('Oldest', { duration: Infinity });
      api.show('Middle', { duration: Infinity });
      api.show('Newest', { duration: Infinity });
    });
    expect(order(screen.getByRole('status'), ['Oldest', 'Middle', 'Newest'])).toEqual(['Newest', 'Middle', 'Oldest']);
  });

  it('dismiss(id) removes visible and queued toasts; unknown ids are ignored', () => {
    const { show, dismiss } = setup({ max: 1 });
    const a = show('Visible one', { duration: Infinity });
    const b = show('Queued one', { duration: Infinity });
    show('Queued two', { duration: Infinity });
    dismiss(b); // remove from the queue before it is ever shown
    dismiss('does-not-exist');
    expect(screen.getByText('Visible one')).toBeInTheDocument();
    dismiss(a);
    expect(screen.queryByText('Visible one')).toBeNull();
    expect(screen.queryByText('Queued one')).toBeNull();
    expect(screen.getByText('Queued two')).toBeInTheDocument();
  });

  it('clears every timer when the provider unmounts', () => {
    const { show, unmount } = setup({ max: 2 });
    show('One');
    show('Two', { type: 'error' });
    show('Three');
    expect(timers.pendingCount()).toBeGreaterThan(0);
    unmount();
    expect(timers.pendingCount()).toBe(0);
    timers.advance(10_000); // nothing fires after unmount
  });

  it('show/dismiss keep their identity and consumers do not re-render when toasts change', () => {
    const { show, dismiss, captured } = setup();
    const first = captured.api;
    const rendersBefore = captured.renders;
    const id = show('One');
    show('Two');
    dismiss(id);
    timers.advance(5000);
    expect(captured.renders).toBe(rendersBefore);
    expect(captured.api?.show).toBe(first?.show);
    expect(captured.api?.dismiss).toBe(first?.dismiss);
  });
});
