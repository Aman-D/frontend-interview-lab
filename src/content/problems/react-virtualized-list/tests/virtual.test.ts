import { getVisibleRange } from '../virtual';

// 40px rows in a 400px viewport: exactly 10 rows fit when scrollTop is a multiple of 40.
const base = { viewportHeight: 400, itemHeight: 40, count: 100, overscan: 0 };

describe('getVisibleRange — public', () => {
  it('top of the list: the rows that fit, plus overscan below only', () => {
    expect(getVisibleRange({ ...base, scrollTop: 0 })).toEqual({ start: 0, end: 10 });
    expect(getVisibleRange({ ...base, scrollTop: 0, overscan: 3 })).toEqual({ start: 0, end: 13 });
  });

  it('partial rows at both edges are included', () => {
    // 10px down: row 0 is partly hidden at the top, row 10 partly visible at the bottom.
    expect(getVisibleRange({ ...base, scrollTop: 10 })).toEqual({ start: 0, end: 11 });
    expect(getVisibleRange({ ...base, scrollTop: 50 })).toEqual({ start: 1, end: 12 });
  });

  it('row-aligned scroll positions do not include the row just below the viewport', () => {
    expect(getVisibleRange({ ...base, scrollTop: 400 })).toEqual({ start: 10, end: 20 });
    expect(getVisibleRange({ ...base, scrollTop: 400, overscan: 2 })).toEqual({ start: 8, end: 22 });
  });

  it('bottom of the list: end is clamped to count', () => {
    // max scrollTop = 100 * 40 - 400 = 3600
    expect(getVisibleRange({ ...base, scrollTop: 3600 })).toEqual({ start: 90, end: 100 });
    expect(getVisibleRange({ ...base, scrollTop: 3600, overscan: 3 })).toEqual({ start: 87, end: 100 });
  });

  it('count 0 renders nothing', () => {
    expect(getVisibleRange({ ...base, count: 0, scrollTop: 0, overscan: 3 })).toEqual({ start: 0, end: 0 });
  });
});
