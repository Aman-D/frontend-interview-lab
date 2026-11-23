import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import {
  addDays,
  addMonths,
  addYears,
  clampDate,
  compareDates,
  endOfWeek,
  getMonthGrid,
  isSameDay,
  parseISODate,
  startOfWeek,
  toISODate,
  toUTCDate,
} from './dateUtils';
import type { CalendarDate, Weekday } from './types';

export interface DatePickerProps {
  /** Visible label of the text input. */
  label: string;
  /** Initial value as "yyyy-mm-dd" (uncontrolled). */
  defaultValue?: string | null;
  /** Called with "yyyy-mm-dd", or null when the input is cleared, whenever the value changes. */
  onChange?: (value: string | null) => void;
  /** Earliest / latest selectable day, "yyyy-mm-dd" (inclusive). */
  min?: string;
  max?: string;
  /** "Today" as "yyyy-mm-dd". Injected for deterministic tests; defaults to the user's local date. */
  today?: string;
  /** First column of the grid. Default 0 (Sunday). */
  weekStartsOn?: Weekday;
  /** BCP 47 locale for month and weekday names. Default: the browser's locale. */
  locale?: string;
}

/** Today's date on the user's wall calendar (local time zone) — the one place local time is correct. */
function localToday(): CalendarDate {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
}

const monthIndex = (d: CalendarDate) => d.year * 12 + d.month - 1;

export default function DatePicker({ label, defaultValue = null, onChange, min, max, today, weekStartsOn = 0, locale }: DatePickerProps) {
  const minDate = useMemo(() => (min ? parseISODate(min) : null), [min]);
  const maxDate = useMemo(() => (max ? parseISODate(max) : null), [max]);
  const todayValue = useMemo(() => (today && parseISODate(today)) || localToday(), [today]);

  const [value, setValue] = useState<CalendarDate | null>(() => (defaultValue ? parseISODate(defaultValue) : null));
  const [text, setText] = useState(() => (value ? toISODate(value) : ''));
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  // The focused day. The visible month is derived from it, so they can never disagree.
  const [focused, setFocused] = useState<CalendarDate>(todayValue);

  const uid = useId();
  const inputId = `${uid}-input`;
  const hintId = `${uid}-hint`;
  const errorId = `${uid}-error`;
  const headingId = `${uid}-heading`;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLTableElement>(null);
  const focusCellAfterRender = useRef(false);

  const fmt = useMemo(
    () => ({
      monthYear: new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }),
      long: new Intl.DateTimeFormat(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }),
      weekdayShort: new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' }),
      weekdayLong: new Intl.DateTimeFormat(locale, { weekday: 'long', timeZone: 'UTC' }),
    }),
    [locale],
  );

  const isDisabled = (d: CalendarDate) => (!!minDate && compareDates(d, minDate) < 0) || (!!maxDate && compareDates(d, maxDate) > 0);
  const clamp = (d: CalendarDate) => clampDate(d, minDate, maxDate);

  // Roving focus: after a keyboard move (possibly into another month), focus the new day cell.
  useLayoutEffect(() => {
    if (!open || !focusCellAfterRender.current) return;
    focusCellAfterRender.current = false;
    gridRef.current?.querySelector<HTMLElement>(`[data-date="${toISODate(focused)}"]`)?.focus();
  });

  // Clicking or tapping outside closes the popup without changing the value.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (dialogRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  function openCalendar() {
    setFocused(clamp(value ?? todayValue));
    setOpen(true);
    focusCellAfterRender.current = true;
  }

  function close() {
    setOpen(false);
    buttonRef.current?.focus();
  }

  function commit(next: CalendarDate | null) {
    const changed = !(next === null ? value === null : isSameDay(next, value));
    setValue(next);
    setText(next ? toISODate(next) : '');
    setError(null);
    if (changed) onChange?.(next ? toISODate(next) : null);
  }

  function select(d: CalendarDate) {
    if (isDisabled(d)) return;
    commit(d);
    close();
  }

  function rangeMessage() {
    if (minDate && maxDate) return `Choose a date between ${toISODate(minDate)} and ${toISODate(maxDate)}.`;
    if (minDate) return `Choose a date on or after ${toISODate(minDate)}.`;
    return `Choose a date on or before ${toISODate(maxDate!)}.`;
  }

  function commitText() {
    if (text.trim() === '') return commit(null);
    const parsed = parseISODate(text);
    if (!parsed) return setError('Enter a valid date as yyyy-mm-dd.');
    if (isDisabled(parsed)) return setError(rangeMessage());
    commit(parsed);
  }

  function moveFocus(next: CalendarDate) {
    setFocused(clamp(next));
    focusCellAfterRender.current = true;
  }

  function onGridKeyDown(e: KeyboardEvent<HTMLTableElement>) {
    let next: CalendarDate | null = null;
    switch (e.key) {
      case 'ArrowLeft': next = addDays(focused, -1); break;
      case 'ArrowRight': next = addDays(focused, 1); break;
      case 'ArrowUp': next = addDays(focused, -7); break;
      case 'ArrowDown': next = addDays(focused, 7); break;
      case 'PageUp': next = e.shiftKey ? addYears(focused, -1) : addMonths(focused, -1); break;
      case 'PageDown': next = e.shiftKey ? addYears(focused, 1) : addMonths(focused, 1); break;
      case 'Home': next = startOfWeek(focused, weekStartsOn); break;
      case 'End': next = endOfWeek(focused, weekStartsOn); break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        select(focused);
        return;
      default:
        return;
    }
    e.preventDefault();
    moveFocus(next);
  }

  function onDialogKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation(); // don't also close an enclosing modal
      close();
      return;
    }
    if (e.key !== 'Tab' || !dialogRef.current) return;
    // Modal dialog: keep Tab inside (previous month, next month, the focused day).
    const items = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), [tabindex="0"]'));
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  const weeks = getMonthGrid(focused.year, focused.month, weekStartsOn);
  const weekdays = Array.from({ length: 7 }, (_, i) => toUTCDate({ year: 2023, month: 1, day: 1 + ((weekStartsOn + i) % 7) })); // 2023-01-01 was a Sunday
  const prevDisabled = !!minDate && monthIndex(focused) - 1 < monthIndex(minDate);
  const nextDisabled = !!maxDate && monthIndex(focused) + 1 > monthIndex(maxDate);

  return (
    <div className="datepicker">
      <label htmlFor={inputId}>{label}</label>
      <div className="datepicker__field">
        <input
          id={inputId}
          type="text"
          autoComplete="off"
          placeholder="yyyy-mm-dd"
          value={text}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${hintId} ${errorId}` : hintId}
          onChange={(e) => {
            setText(e.target.value);
            if (error) setError(null);
          }}
          onBlur={commitText}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitText();
          }}
        />
        <button
          ref={buttonRef}
          type="button"
          className="datepicker__button"
          aria-label={value ? `Change date, ${fmt.long.format(toUTCDate(value))}` : 'Choose date'}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => (open ? close() : openCalendar())}
        >
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="3" width="12" height="11" rx="1.5" />
            <path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3" />
          </svg>
        </button>
      </div>
      <span id={hintId} className="datepicker__hint">
        Format: yyyy-mm-dd
      </span>
      {error && (
        <span id={errorId} role="alert" className="datepicker__error">
          {error}
        </span>
      )}

      {open && (
        <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Choose date" className="datepicker__dialog" onKeyDown={onDialogKeyDown}>
          <div className="datepicker__header">
            <button type="button" aria-label="Previous month" disabled={prevDisabled} onClick={() => setFocused(clamp(addMonths(focused, -1)))}>
              ‹
            </button>
            <h2 id={headingId} aria-live="polite">
              {fmt.monthYear.format(toUTCDate({ ...focused, day: 1 }))}
            </h2>
            <button type="button" aria-label="Next month" disabled={nextDisabled} onClick={() => setFocused(clamp(addMonths(focused, 1)))}>
              ›
            </button>
          </div>
          <table ref={gridRef} role="grid" aria-labelledby={headingId} className="datepicker__grid" onKeyDown={onGridKeyDown}>
            <thead>
              <tr>
                {weekdays.map((d) => (
                  <th key={d.getUTCDay()} scope="col" abbr={fmt.weekdayLong.format(d)}>
                    {fmt.weekdayShort.format(d)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weeks.map((week, w) => (
                <tr key={w}>
                  {week.map((day, i) => {
                    if (!day) return <td key={`empty-${i}`} role="gridcell" />;
                    const iso = toISODate(day);
                    const disabled = isDisabled(day);
                    return (
                      <td
                        key={iso}
                        role="gridcell"
                        data-date={iso}
                        tabIndex={isSameDay(day, focused) ? 0 : -1}
                        aria-selected={isSameDay(day, value)}
                        aria-current={isSameDay(day, todayValue) ? 'date' : undefined}
                        aria-disabled={disabled || undefined}
                        onClick={() => {
                          if (disabled) return;
                          setFocused(day);
                          select(day);
                        }}
                      >
                        {day.day}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
