import { memoize } from '../solution';

describe('memoize — public', () => {
  it('calls fn once for repeated calls with the same argument', () => {
    const square = fn((n) => n * n);
    const m = memoize(square);
    expect(m(4)).toBe(16);
    expect(m(4)).toBe(16);
    expect(square).toHaveBeenCalledTimes(1);
  });

  it('computes separately for different arguments', () => {
    const square = fn((n) => n * n);
    const m = memoize(square);
    expect(m(2)).toBe(4);
    expect(m(3)).toBe(9);
    expect(square).toHaveBeenCalledTimes(2);
  });

  it('uses the first argument as the default cache key', () => {
    const add = fn((a, b) => a + b);
    const m = memoize(add);
    expect(m(1, 2)).toBe(3);
    expect(m(1, 100)).toBe(3); // same key (1) → cached result
    expect(add).toHaveBeenCalledTimes(1);
  });

  it('uses resolver(...args) as the key when provided', () => {
    const add = fn((a, b) => a + b);
    const m = memoize(add, (a, b) => `${a}|${b}`);
    expect(m(1, 2)).toBe(3);
    expect(m(1, 100)).toBe(101);
    expect(m(1, 2)).toBe(3);
    expect(add).toHaveBeenCalledTimes(2);
  });

  it('forwards `this` to fn', () => {
    const obj = { factor: 10, scale: memoize(function (n) { return n * this.factor; }) };
    expect(obj.scale(3)).toBe(30);
  });

  it('exposes cache (a Map) and clear()', () => {
    const spy = fn((n) => n + 1);
    const m = memoize(spy);
    m(1);
    expect(m.cache).toBeInstanceOf(Map);
    expect(m.cache.get(1)).toBe(2);
    m.clear();
    expect(m.cache.size).toBe(0);
    m(1);
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
