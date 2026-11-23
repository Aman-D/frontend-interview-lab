import type { CalendarDate, Weekday } from './types';

// Calendar dates are {year, month (1–12), day} triples, NOT timestamps.
// If you need `Date` for arithmetic, use UTC only (setUTCFullYear / getUTC*): in UTC every day is
// exactly 24 hours and there is no DST, so results do not depend on the user's time zone.

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** Number of days in `month` (1–12) of `year`. */
export function daysInMonth(year: number, month: number): number {
  // TODO
  return 30;
}

/** Strict "yyyy-mm-dd" parser (surrounding whitespace allowed). Impossible dates such as 2023-02-29 → null. */
export function parseISODate(text: string): CalendarDate | null {
  // TODO
  return null;
}

/** {2024, 3, 5} → "2024-03-05" (4-digit year, 2-digit month and day). */
export function toISODate(d: CalendarDate): string {
  // TODO
  return `${d.year}-${d.month}-${d.day}`;
}

/** Negative if a < b, 0 if equal, positive if a > b. */
export function compareDates(a: CalendarDate, b: CalendarDate): number {
  return a.year - b.year || a.month - b.month || a.day - b.day;
}

export function isSameDay(a: CalendarDate | null | undefined, b: CalendarDate | null | undefined): boolean {
  return !!a && !!b && compareDates(a, b) === 0;
}

export function addDays(d: CalendarDate, days: number): CalendarDate {
  // TODO
  return d;
}

/** Moves by whole months, clamping the day: Jan 31 + 1 month → Feb 29 (leap year) / Feb 28. */
export function addMonths(d: CalendarDate, months: number): CalendarDate {
  // TODO
  return d;
}

export function addYears(d: CalendarDate, years: number): CalendarDate {
  // TODO
  return d;
}

/** 0 = Sunday … 6 = Saturday. */
export function dayOfWeek(d: CalendarDate): Weekday {
  // TODO
  return 0;
}

/** The first day of the week containing `d`, for weeks starting on `weekStartsOn`. */
export function startOfWeek(d: CalendarDate, weekStartsOn: Weekday): CalendarDate {
  // TODO
  return d;
}

/** The last day of the week containing `d`. */
export function endOfWeek(d: CalendarDate, weekStartsOn: Weekday): CalendarDate {
  // TODO
  return d;
}

/** Clamps `d` into [min, max]; either bound may be missing. */
export function clampDate(d: CalendarDate, min?: CalendarDate | null, max?: CalendarDate | null): CalendarDate {
  // TODO
  return d;
}

/**
 * The month as weeks of 7 cells, starting on `weekStartsOn`. Days of the neighbouring months are `null`.
 * Each row has exactly 7 entries; there are as many rows as needed (4–6).
 */
export function getMonthGrid(year: number, month: number, weekStartsOn: Weekday): (CalendarDate | null)[][] {
  // TODO
  return [];
}

/** A Date for formatting a calendar date with Intl. Always format it with `timeZone: 'UTC'`. */
export function toUTCDate(d: CalendarDate): Date {
  const date = new Date(0);
  date.setUTCFullYear(d.year, d.month - 1, d.day); // unlike Date.UTC, keeps years 0–99 as-is
  return date;
}
