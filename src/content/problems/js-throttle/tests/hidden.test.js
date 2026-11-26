import { throttle } from '../solution';

describe('throttle — hidden', () => {
  beforeEach(() => timers.useFake());

  it('limits a continuous stream to one call per window', () => {
    const spy = fn();
    const t = throttle(spy, 100);
    for (let ms = 0; ms < 1000; ms += 10) {
      t(ms);
      timers.advance(10);
    }
    // leading call at 0, then one trailing call per 100 ms window
    expect(spy.mock.calls.length).toBeGreaterThanOrEqual(10);
    expect(spy.mock.calls.length).toBeLessThanOrEqual(11);
  });

  it('the trailing call opens a new window', () => {
    const spy = fn();
    const t = throttle(spy, 100);
    t(1); // t=0, leading
    t(2); // pending
    timers.advance(100); // trailing call with 2 at t=100
    expect(spy).toHaveBeenCalledTimes(2);
    t(3); // inside the new window → must NOT run immediately
    expect(spy).toHaveBeenCalledTimes(2);
    timers.advance(100);
    expect(spy).toHaveBeenCalledTimes(3);
    expect(spy).toHaveBeenLastCalledWith(3);
  });

  it('forwards `this` for leading and trailing calls', () => {
    const contexts = [];
    const t = throttle(function () { contexts.push(this); }, 50);
    const a = { name: 'a', t };
    const b = { name: 'b', t };
    a.t();
    b.t();
    timers.advance(50);
    expect(contexts[0]).toBe(a);
    expect(contexts[1]).toBe(b);
  });

  it('works normally after cancel()', () => {
    const spy = fn();
    const t = throttle(spy, 100);
    t(1);
    t.cancel();
    t(2); // window was reset, so this is a new leading call
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenLastCalledWith(2);
  });

  it('keeps independent state per throttled function', () => {
    const s1 = fn();
    const s2 = fn();
    const t1 = throttle(s1, 100);
    const t2 = throttle(s2, 100);
    t1();
    t2();
    expect(s1).toHaveBeenCalledTimes(1);
    expect(s2).toHaveBeenCalledTimes(1);
  });

  it('leaves no timers behind after a quiet window', () => {
    const t = throttle(fn(), 100);
    t();
    timers.advance(100);
    expect(timers.pendingCount()).toBe(0);
  });

  it('throws a TypeError when fn is not a function', () => {
    expect(() => throttle(null, 100)).toThrow(TypeError);
  });
});
