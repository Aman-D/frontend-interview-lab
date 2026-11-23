import type { CalendarDate, Weekday } from './types';

// A calendar date is a {year, month, day} triple — NOT a timestamp. A timestamp is an instant;
// which calendar day it falls on depends on the time zone, and local midnights move around DST.
// The only place we touch `Date` is through UTC helpers (setUTCFullYear / getUTC*), where every day is
// exactly 24 hours and there is no DST, so the arithmetic is the same in every time zone.

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** Number of days in `month` (1–12) of `year`. */
export function daysInMonth(year: number, month: number): number {
  return [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
}

/** Strict `yyyy-mm-dd` parser (surrounding whitespace allowed). Impossible dates such as 2023-02-29 → null. */
export function parseISODate(text: string): CalendarDate | null {
  const m = ISO_RE.exec(text.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return null;
  return { year, month, day };
}

const pad = (n: number, width: number) => String(n).padStart(width, '0');

/** `{2024, 3, 5}` → `"2024-03-05"`. */
export function toISODate(d: CalendarDate): string {
  return `${pad(d.year, 4)}-${pad(d.month, 2)}-${pad(d.day, 2)}`;
}

/** Negative if a < b, 0 if equal, positive if a > b. */
export function compareDates(a: CalendarDate, b: CalendarDate): number {
  return a.year - b.year || a.month - b.month || a.day - b.day;
}

export function isSameDay(a: CalendarDate | null | undefined, b: CalendarDate | null | undefined): boolean {
  return !!a && !!b && compareDates(a, b) === 0;
}

/** UTC midnight of `d`. setUTCFullYear (unlike Date.UTC) does not map years 0–99 to 1900–1999. */
function utcMidnight(d: CalendarDate): Date {
  const date = new Date(0);
  date.setUTCFullYear(d.year, d.month - 1, d.day);
  return date;
}

/** Days since 1970-01-01 in the proleptic Gregorian calendar (UTC arithmetic: no DST, no time zone). */
function toDayNumber(d: CalendarDate): number {
  return utcMidnight(d).getTime() / 86_400_000;
}

function fromDayNumber(n: number): CalendarDate {
  const date = new Date(n * 86_400_000);
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

export function addDays(d: CalendarDate, days: number): CalendarDate {
  return fromDayNumber(toDayNumber(d) + days);
}

/** Moves by whole months, clamping the day: Jan 31 + 1 month → Feb 29 (leap year) / Feb 28. */
export function addMonths(d: CalendarDate, months: number): CalendarDate {
  const index = d.year * 12 + (d.month - 1) + months;
  const year = Math.floor(index / 12);
  const month = index - year * 12 + 1;
  return { year, month, day: Math.min(d.day, daysInMonth(year, month)) };
}

export function addYears(d: CalendarDate, years: number): CalendarDate {
  return addMonths(d, years * 12);
}

/** 0 = Sunday … 6 = Saturday. */
export function dayOfWeek(d: CalendarDate): Weekday {
  return utcMidnight(d).getUTCDay() as Weekday;
}

/** The first day of the week containing `d`, for weeks starting on `weekStartsOn`. */
export function startOfWeek(d: CalendarDate, weekStartsOn: Weekday): CalendarDate {
  return addDays(d, -((dayOfWeek(d) - weekStartsOn + 7) % 7));
}

export function endOfWeek(d: CalendarDate, weekStartsOn: Weekday): CalendarDate {
  return addDays(startOfWeek(d, weekStartsOn), 6);
}

/** Clamps `d` into [min, max]; either bound may be missing. */
export function clampDate(d: CalendarDate, min?: CalendarDate | null, max?: CalendarDate | null): CalendarDate {
  if (min && compareDates(d, min) < 0) return min;
  if (max && compareDates(d, max) > 0) return max;
  return d;
}

/**
 * The month as weeks of 7 cells, starting on `weekStartsOn`. Days of the neighbouring months are `null`.
 * Always 4–6 rows; each row has exactly 7 entries.
 */
export function getMonthGrid(year: number, month: number, weekStartsOn: Weekday): (CalendarDate | null)[][] {
  const leading = (dayOfWeek({ year, month, day: 1 }) - weekStartsOn + 7) % 7;
  const cells: (CalendarDate | null)[] = Array.from({ length: leading }, () => null);
  const count = daysInMonth(year, month);
  for (let day = 1; day <= count; day++) cells.push({ year, month, day });
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (CalendarDate | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/** A Date for formatting a calendar date with Intl. Always format it with `timeZone: 'UTC'`. */
export function toUTCDate(d: CalendarDate): Date {
  return utcMidnight(d);
}
