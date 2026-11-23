import { curry } from '../solution';

describe('curry — hidden', () => {
  it('calls a zero-arity function on the first call', () => {
    const c = curry(() => 'ran');
    expect(c()).toBe('ran');
  });

  it('calling a partial with no arguments does not consume a slot', () => {
    const add3 = curry((a, b, c) => a + b + c);
    expect(typeof add3()).toBe('function');
    expect(add3(1)()(2)()(3)).toBe(6);
  });

  it('uses fn.length, so parameters with defaults are not waited for', () => {
    const withDefault = curry((a, b = 10) => a + b);
    expect(withDefault(1)).toBe(11);
    const withRest = curry((a, ...rest) => [a, rest]);
    expect(withRest(1, 2, 3)).toEqual([1, [2, 3]]);
  });

  it('returns exactly what fn returns', () => {
    const result = { ok: true };
    const c = curry((a, b) => result);
    expect(c(1)(2)).toBe(result);
    expect(curry((a) => undefined)(1)).toBe(undefined);
  });

  it('two curried versions of the same function do not share arguments', () => {
    const pair = (a, b) => [a, b];
    const first = curry(pair);
    const second = curry(pair);
    const p1 = first('x');
    const p2 = second('y');
    expect(p1(1)).toEqual(['x', 1]);
    expect(p2(2)).toEqual(['y', 2]);
  });

  it('treats undefined and null as real arguments', () => {
    const c = curry((a, b) => [a, b]);
    expect(c(undefined)(null)).toEqual([undefined, null]);
  });

  it('throws a TypeError when given a non-function', () => {
    expect(() => curry(42)).toThrow(TypeError);
  });
});
