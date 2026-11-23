import { curry } from '../solution';

const join = (a, b, c) => `${a}_${b}_${c}`;

describe('curry — public', () => {
  it('supports one argument per call', () => {
    expect(curry(join)(1)(2)(3)).toBe('1_2_3');
  });

  it('supports several arguments per call in any grouping', () => {
    const c = curry(join);
    expect(c(1, 2, 3)).toBe('1_2_3');
    expect(c(1, 2)(3)).toBe('1_2_3');
    expect(c(1)(2, 3)).toBe('1_2_3');
  });

  it('does not call fn until enough arguments are collected', () => {
    const spy = fn((a, b) => a + b);
    // fn() mocks report length 0, so wrap the spy in a 2-parameter function.
    const c = curry((a, b) => spy(a, b));
    const partial = c(1);
    expect(spy).toHaveBeenCalledTimes(0);
    expect(partial(2)).toBe(3);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('partial applications are independent and reusable', () => {
    const c = curry(join);
    const withA = c('a');
    const withAB = withA('b');
    expect(withA('x')('y')).toBe('a_x_y');
    expect(withAB('c')).toBe('a_b_c');
    expect(withAB('d')).toBe('a_b_d');
    expect(withA('b', 'e')).toBe('a_b_e');
  });

  it('forwards extra arguments to fn', () => {
    function collect(a, b) {
      return Array.from(arguments);
    }
    expect(curry(collect)(1)(2, 3, 4)).toEqual([1, 2, 3, 4]);
  });
});
