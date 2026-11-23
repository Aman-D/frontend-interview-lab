import { debounce } from '../solution';

describe('debounce — public', () => {
  beforeEach(() => timers.useFake());

  it('does not call fn synchronously', () => {
    const spy = fn();
    const d = debounce(spy, 100);
    d();
    expect(spy).toHaveBeenCalledTimes(0);
  });

  it('calls fn once after `wait` ms of inactivity', () => {
    const spy = fn();
    const d = debounce(spy, 100);
    d();
    timers.advance(99);
    expect(spy).toHaveBeenCalledTimes(0);
    timers.advance(1);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('restarts the timer on every call (burst collapses to one call)', () => {
    const spy = fn();
    const d = debounce(spy, 100);
    d();
    timers.advance(50);
    d();
    timers.advance(50);
    d();
    timers.advance(99);
    expect(spy).toHaveBeenCalledTimes(0);
    timers.advance(1);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('invokes with the arguments of the LAST call', () => {
    const spy = fn();
    const d = debounce(spy, 50);
    d('a');
    d('b', 2);
    timers.advance(50);
    expect(spy).toHaveBeenCalledWith('b', 2);
  });
});
