import { memoize } from '../solution';

describe('memoize — hidden', () => {
  it('caches falsy and undefined results (uses has, not truthiness)', () => {
    const spy = fn(() => undefined);
    const m = memoize(spy);
    m('a');
    m('a');
    expect(spy).toHaveBeenCalledTimes(1);
    const zero = fn(() => 0);
    const mz = memoize(zero);
    mz('x');
    mz('x');
    expect(zero).toHaveBeenCalledTimes(1);
  });

  it('treats object arguments by identity, not by structure', () => {
    const spy = fn((o) => o.v);
    const m = memoize(spy);
    const a = { v: 1 };
    m(a);
    m(a);
    m({ v: 1 });
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('handles NaN as a key (SameValueZero)', () => {
    const spy = fn(() => 'nan');
    const m = memoize(spy);
    m(NaN);
    m(NaN);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('does not cache when fn throws', () => {
    let calls = 0;
    const m = memoize((n) => {
      calls += 1;
      if (calls === 1) throw new Error('first call fails');
      return n * 2;
    });
    expect(() => m(5)).toThrow('first call fails');
    expect(m.cache.has(5)).toBe(false);
    expect(m(5)).toBe(10);
    expect(calls).toBe(2);
  });

  it('shares an in-flight promise for concurrent calls', async () => {
    const d = deferred();
    const spy = fn(() => d.promise);
    const m = memoize(spy);
    const p1 = m('user-1');
    const p2 = m('user-1');
    expect(p1).toBe(p2);
    expect(spy).toHaveBeenCalledTimes(1);
    d.resolve('ok');
    await expect(p1).resolves.toBe('ok');
  });

  it('evicts a rejected promise so the next call retries', async () => {
    let attempt = 0;
    const m = memoize(() => {
      attempt += 1;
      return attempt === 1 ? Promise.reject(new Error('network')) : Promise.resolve('data');
    });
    await expect(m('k')).rejects.toThrow('network');
    await flush();
    expect(m.cache.has('k')).toBe(false);
    await expect(m('k')).resolves.toBe('data');
    expect(attempt).toBe(2);
  });

  it('keeps separate caches for separate memoized functions', () => {
    const a = memoize((n) => n + 1);
    const b = memoize((n) => n + 2);
    expect(a(1)).toBe(2);
    expect(b(1)).toBe(3);
    expect(a.cache).not.toBe(b.cache);
  });

  it('calls the resolver with the caller `this` and all arguments', () => {
    const resolver = fn(function (a, b) { return `${this.ns}:${a}:${b}`; });
    const obj = { ns: 'x', get: memoize((a, b) => a * b, resolver) };
    expect(obj.get(2, 3)).toBe(6);
    expect(resolver).toHaveBeenCalledWith(2, 3);
    expect(obj.get.cache.has('x:2:3')).toBe(true);
  });

  it('throws a TypeError when fn is not a function', () => {
    expect(() => memoize(42)).toThrow(TypeError);
  });
});
