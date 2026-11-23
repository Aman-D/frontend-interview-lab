import { fillFrom, toSlots, toValue } from '../otpUtils';

describe('otpUtils — public', () => {
  it('toSlots reads a positional string; spaces and non-digits are empty boxes', () => {
    expect(toSlots('12 4', 6)).toEqual(['1', '2', '', '4', '', '']);
    expect(toSlots('', 4)).toEqual(['', '', '', '']);
  });

  it('toValue keeps gaps as spaces and drops trailing empty boxes', () => {
    expect(toValue(['1', '2', '', '4', '', ''])).toBe('12 4');
    expect(toValue(['', '', '', ''])).toBe('');
    expect(toValue(['9', '8', '7', '6'])).toBe('9876');
  });

  it('fillFrom writes a full code from the first box and focuses the last box', () => {
    expect(fillFrom(['', '', '', '', '', ''], 0, '123456')).toEqual({ slots: ['1', '2', '3', '4', '5', '6'], focusIndex: 5 });
  });

  it('fillFrom starts at the given box, strips non-digits and focuses the box after the last written', () => {
    expect(fillFrom(['1', '', '', '', '', ''], 1, '2 3-4')).toEqual({ slots: ['1', '2', '3', '4', '', ''], focusIndex: 4 });
  });
});
