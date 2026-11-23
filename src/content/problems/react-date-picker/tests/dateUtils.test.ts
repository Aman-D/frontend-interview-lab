import { addDays, addMonths, addYears, getMonthGrid, parseISODate, toISODate } from '../dateUtils';

const d = (year: number, month: number, day: number) => ({ year, month, day });
const iso = (s: string) => parseISODate(s)!;

describe('dateUtils — public', () => {
  it('parseISODate accepts real yyyy-mm-dd dates only', () => {
    expect(parseISODate('2024-03-15')).toEqual(d(2024, 3, 15));
    expect(parseISODate('  2024-02-29 ')).toEqual(d(2024, 2, 29)); // leap day, whitespace trimmed
    for (const bad of ['2023-02-29', '2024-04-31', '2024-13-01', '2024-00-10', '2024-01-00', '2024-1-5', '15/03/2024', '2024-03-15T00:00', '', 'tomorrow']) {
      expect(parseISODate(bad)).toBeNull();
    }
  });

  it('toISODate zero-pads and round-trips', () => {
    expect(toISODate(d(2024, 3, 5))).toBe('2024-03-05');
    expect(toISODate(d(987, 12, 31))).toBe('0987-12-31');
    expect(toISODate(iso('2030-10-09'))).toBe('2030-10-09');
  });

  it('addDays crosses month, year, leap-day and DST boundaries without drifting', () => {
    expect(addDays(d(2024, 2, 28), 1)).toEqual(d(2024, 2, 29));
    expect(addDays(d(2023, 2, 28), 1)).toEqual(d(2023, 3, 1));
    expect(addDays(d(2024, 12, 31), 1)).toEqual(d(2025, 1, 1));
    expect(addDays(d(2024, 3, 1), -1)).toEqual(d(2024, 2, 29));
    // Daylight-saving transitions in the US (Mar 10 / Nov 3 2024) and EU (Mar 31 / Oct 27 2024)
    expect(addDays(d(2024, 3, 10), 1)).toEqual(d(2024, 3, 11));
    expect(addDays(d(2024, 3, 11), -1)).toEqual(d(2024, 3, 10));
    expect(addDays(d(2024, 11, 3), 1)).toEqual(d(2024, 11, 4));
    expect(addDays(d(2024, 3, 31), 1)).toEqual(d(2024, 4, 1));
    expect(addDays(d(2024, 10, 27), 7)).toEqual(d(2024, 11, 3));
    expect(addDays(d(2024, 3, 3), 28)).toEqual(d(2024, 3, 31));
  });

  it('addMonths / addYears clamp the day to the target month', () => {
    expect(addMonths(d(2024, 1, 31), 1)).toEqual(d(2024, 2, 29));
    expect(addMonths(d(2023, 1, 31), 1)).toEqual(d(2023, 2, 28));
    expect(addMonths(d(2024, 3, 31), -1)).toEqual(d(2024, 2, 29));
    expect(addMonths(d(2024, 5, 31), 1)).toEqual(d(2024, 6, 30));
    expect(addMonths(d(2024, 12, 15), 1)).toEqual(d(2025, 1, 15));
    expect(addMonths(d(2024, 1, 15), -1)).toEqual(d(2023, 12, 15));
    expect(addYears(d(2024, 2, 29), 1)).toEqual(d(2025, 2, 28));
    expect(addYears(d(2024, 2, 29), 4)).toEqual(d(2028, 2, 29));
  });

  it('getMonthGrid lays out weeks of 7 starting on the configured weekday', () => {
    // 1 March 2024 was a Friday.
    const sunday = getMonthGrid(2024, 3, 0);
    expect(sunday).toHaveLength(6);
    for (const week of sunday) expect(week).toHaveLength(7);
    expect(sunday[0]).toEqual([null, null, null, null, null, d(2024, 3, 1), d(2024, 3, 2)]);
    expect(sunday[5]).toEqual([d(2024, 3, 31), null, null, null, null, null, null]);
    const monday = getMonthGrid(2024, 3, 1);
    expect(monday).toHaveLength(5);
    expect(monday[0]).toEqual([null, null, null, null, d(2024, 3, 1), d(2024, 3, 2), d(2024, 3, 3)]);
    expect(monday.flat().filter(Boolean)).toHaveLength(31);
  });
});
