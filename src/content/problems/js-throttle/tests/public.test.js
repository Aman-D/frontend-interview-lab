import { throttle } from '../solution';

describe('throttle — public', () => {
  beforeEach(() => timers.useFake());

  it('runs the first call immediately (leading edge)', () => {
    const spy = fn();
    const t = throttle(spy, 100);
    t('a');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('a');
  });

  it('ignores extra immediate calls until the window ends', () => {
    const spy = fn();
    const t = throttle(spy, 100);
    t(1);
    t(2);
    t(3);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('makes one trailing call with the latest arguments at the end of the window', () => {
    const spy = fn();
    const t = throttle(spy, 100);
    t(1);
    timers.advance(30);
    t(2);
    timers.advance(30);
    t(3);
    timers.advance(39);
    expect(spy).toHaveBeenCalledTimes(1);
    timers.advance(1);
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenLastCalledWith(3);
  });

  it('makes no trailing call when there was only one call', () => {
    const spy = fn();
    const t = throttle(spy, 100);
    t('only');
    timers.advance(500);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('runs immediately again once a quiet window has passed', () => {
    const spy = fn();
    const t = throttle(spy, 100);
    t(1);
    timers.advance(100);
    t(2);
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenLastCalledWith(2);
  });

  it('cancel() drops the pending trailing call', () => {
    const spy = fn();
    const t = throttle(spy, 100);
    t(1);
    t(2);
    t.cancel();
    timers.advance(200);
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
