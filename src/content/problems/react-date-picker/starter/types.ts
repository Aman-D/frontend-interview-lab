/**
 * A calendar date: a day on the calendar, with no time and no time zone.
 * `month` is 1–12 (not 0–11 like Date#getMonth). Serialise it as an ISO string "yyyy-mm-dd".
 */
export interface CalendarDate {
  year: number;
  month: number;
  day: number;
}

/** 0 = Sunday, 1 = Monday, … 6 = Saturday (same numbering as Date#getUTCDay). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;
