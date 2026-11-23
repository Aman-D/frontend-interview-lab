import { addDays, clampDate, daysInMonth, dayOfWeek, endOfWeek, getMonthGrid, startOfWeek } from '../dateUtils';

const d = (year: number, month: number, day: number) => ({ year, month, day });

describe('dateUtils — hidden', () => {
  it('daysInMonth follows the Gregorian leap-year rules', () => {
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2023, 2)).toBe(28);
    expect(daysInMonth(1900, 2)).toBe(28);
    expect(daysInMonth(2000, 2)).toBe(29);
    expect(daysInMonth(2100, 2)).toBe(28);
    expect([1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => daysInMonth(2025, m))).toEqual([31, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]);
  });

  it('dayOfWeek, startOfWeek and endOfWeek work across month boundaries', () => {
    expect(dayOfWeek(d(2024, 3, 15))).toBe(5);
    expect(dayOfWeek(d(2000, 1, 1))).toBe(6);
    expect(dayOfWeek(d(1970, 1, 1))).toBe(4);
    expect(startOfWeek(d(2024, 3, 1), 1)).toEqual(d(2024, 2, 26));
    expect(startOfWeek(d(2024, 3, 3), 1)).toEqual(d(2024, 2, 26)); // Sunday is the last day of a Monday week
    expect(startOfWeek(d(2024, 3, 3), 0)).toEqual(d(2024, 3, 3));
    expect(endOfWeek(d(2024, 3, 31), 0)).toEqual(d(2024, 4, 6));
    expect(endOfWeek(d(2024, 3, 27), 6)).toEqual(d(2024, 3, 29)); // Saturday-start weeks end on Friday
  });

  it('addDays handles long spans and years below 100', () => {
    expect(addDays(d(2024, 1, 1), 366)).toEqual(d(2025, 1, 1));
    expect(addDays(d(2024, 1, 1), -1)).toEqual(d(2023, 12, 31));
    expect(addDays(d(2024, 1, 1), 365 * 4 + 1)).toEqual(d(2028, 1, 1));
    expect(addDays(d(50, 12, 31), 1)).toEqual(d(51, 1, 1));
  });

  it('getMonthGrid: a 4-row February and a 6-row month', () => {
    const feb = getMonthGrid(2026, 2, 0); // 1 Feb 2026 is a Sunday
    expect(feb).toHaveLength(4);
    expect(feb[0][0]).toEqual(d(2026, 2, 1));
    expect(feb[3][6]).toEqual(d(2026, 2, 28));
    const mar = getMonthGrid(2025, 3, 0); // 1 Mar 2025 is a Saturday
    expect(mar).toHaveLength(6);
    expect(mar[0].filter(Boolean)).toEqual([d(2025, 3, 1)]);
    const days = mar.flat().filter(Boolean) as { day: number }[];
    expect(days.map((x) => x.day)).toEqual(Array.from({ length: 31 }, (_, i) => i + 1));
  });

  it('clampDate respects either bound', () => {
    const min = d(2024, 3, 10);
    const max = d(2024, 3, 20);
    expect(clampDate(d(2024, 3, 1), min, max)).toEqual(min);
    expect(clampDate(d(2025, 1, 1), min, max)).toEqual(max);
    expect(clampDate(d(2024, 3, 15), min, max)).toEqual(d(2024, 3, 15));
    expect(clampDate(d(1999, 1, 1), null, max)).toEqual(d(1999, 1, 1));
    expect(clampDate(d(2099, 1, 1), min)).toEqual(d(2099, 1, 1));
  });
});
