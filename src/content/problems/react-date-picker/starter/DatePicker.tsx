import { useId, useState } from 'react';
import type { Weekday } from './types';

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

// TODO: see the problem statement for the full contract. In short:
// - text input (typed ISO dates are parsed on blur / Enter; invalid → role="alert" error + aria-invalid)
// - calendar button ("Choose date" / "Change date, <long date>") opens a role="dialog" with a
//   month heading, Previous/Next month buttons and a role="grid" table of day cells (data-date="yyyy-mm-dd")
// - roving focus in the grid: arrows, PageUp/PageDown (+Shift), Home/End; Enter/Space selects; Escape closes
// - today: aria-current="date"; selected: aria-selected="true"; days outside min/max: aria-disabled="true"
export default function DatePicker({ label, defaultValue }: DatePickerProps) {
  const [text, setText] = useState(defaultValue ?? '');
  const [open, setOpen] = useState(false);
  const inputId = useId();

  return (
    <div className="datepicker">
      <label htmlFor={inputId}>{label}</label>
      <div className="datepicker__field">
        <input id={inputId} type="text" placeholder="yyyy-mm-dd" value={text} onChange={(e) => setText(e.target.value)} />
        <button type="button" className="datepicker__button" aria-label="Choose date" onClick={() => setOpen(!open)}>
          Calendar
        </button>
      </div>
      {open && (
        <div role="dialog" aria-label="Choose date" className="datepicker__dialog">
          <p>TODO: month grid</p>
        </div>
      )}
    </div>
  );
}
