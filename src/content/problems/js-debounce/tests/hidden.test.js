import { debounce } from '../solution';

describe('debounce — hidden', () => {
  beforeEach(() => timers.useFake());

  it('preserves `this` from the last call', () => {
    let seen = null;
    const obj = {
      name: 'obj',
      handler: debounce(function () { seen = this; }, 10),
    };
    obj.handler();
    timers.advance(10);
    expect(seen).toBe(obj);
  });

  it('separate bursts produce separate calls', () => {
    const spy = fn();
    const d = debounce(spy, 20);
    d(1);
    timers.advance(20);
    d(2);
    timers.advance(20);
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy.mock.calls[1]).toEqual([2]);
  });

  it('cancel() drops the pending invocation', () => {
    const spy = fn();
    const d = debounce(spy, 30);
    d();
    d.cancel();
    timers.advance(100);
    expect(spy).toHaveBeenCalledTimes(0);
    d();
    timers.advance(30);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('wait = 0 still defers to a macrotask', () => {
    const spy = fn();
    const d = debounce(spy, 0);
    d();
    expect(spy).toHaveBeenCalledTimes(0);
    timers.advance(0);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('independent debounced functions do not share state', () => {
    const a = fn();
    const b = fn();
    const da = debounce(a, 10);
    const db = debounce(b, 10);
    da();
    db();
    timers.advance(10);
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
  });
});
