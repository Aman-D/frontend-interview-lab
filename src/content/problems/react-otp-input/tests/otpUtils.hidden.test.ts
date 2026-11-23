import { fillFrom, toSlots, toValue } from '../otpUtils';

describe('otpUtils — hidden', () => {
  it('fillFrom cuts digits that do not fit after the start box', () => {
    expect(fillFrom(['', '', '', ''], 2, '98765')).toEqual({ slots: ['', '', '9', '8'], focusIndex: 3 });
  });

  it('fillFrom with no digits returns the boxes unchanged and keeps focus', () => {
    const slots = ['1', '', ''];
    const r = fillFrom(slots, 1, 'abc - ');
    expect(r.slots).toEqual(['1', '', '']);
    expect(r.focusIndex).toBe(1);
  });

  it('fillFrom does not mutate its input', () => {
    const slots = ['', '', ''];
    const r = fillFrom(slots, 0, '42');
    expect(slots).toEqual(['', '', '']);
    expect(r.slots === slots).toBe(false);
  });

  it('toSlots ignores extra characters and toValue round-trips', () => {
    expect(toSlots('1234567', 4)).toEqual(['1', '2', '3', '4']);
    expect(toValue(toSlots(' 2 4', 4))).toBe(' 2 4');
  });
});
