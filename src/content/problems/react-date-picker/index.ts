import type { CodingProblem } from '../../schema';
import starterPicker from './starter/DatePicker.tsx?raw';
import starterUtils from './starter/dateUtils.ts?raw';
import types from './starter/types.ts?raw';
import app from './starter/App.tsx?raw';
import styles from './starter/styles.css?raw';
import solutionPicker from './solution/DatePicker.tsx?raw';
import solutionUtils from './solution/dateUtils.ts?raw';
import helpers from './tests/helpers.tsx?raw';
import utilsTests from './tests/dateUtils.test.ts?raw';
import utilsHiddenTests from './tests/dateUtils.hidden.test.ts?raw';
import publicTests from './tests/public.test.tsx?raw';
import hiddenTests from './tests/hidden.test.tsx?raw';

const shared = { '/App.tsx': app, '/types.ts': types, '/styles.css': styles };

const problem: CodingProblem = {
  schemaVersion: 1,
  kind: 'coding',
  id: 'react-date-picker',
  slug: 'date-picker',
  title: 'Date Picker',
  track: 'react',
  execution: 'react',
  difficulty: 'hard',
  priority: 'P1',
  seniority: ['Senior', 'SDE-2', 'SDE-3', 'MTS'],
  topics: ['calendar arithmetic', 'time zones', 'Intl.DateTimeFormat', 'grid keyboard navigation', 'roving focus', 'dialog a11y', 'input parsing'],
  estimatedMinutes: 60,
  conceptIds: ['dialog-aria-pattern', 'keyboard-navigation', 'focus-management', 'derived-state', 'aria-live-regions', 'react-effects', 'controlled-uncontrolled'],
  research: {
    provenance: 'PUBLISHED_PRACTICE_PROBLEM',
    frequencyConfidence: 'HIGH_CONFIDENCE',
    verificationStatus: 'SOURCES_VERIFIED',
    lastVerified: '2026-11-23',
    evidence: [
      { sourceId: 'alla-components', url: 'https://allahabadi.dev/frontend-system-design/components/', originalTitle: 'Design a Date Picker', note: 'Question 06 in the component design list (framed as system design).' },
      { sourceId: 'fg-mc', url: 'https://www.frontendgeek.com/frontend-interview/machine-coding-interview', originalTitle: 'Calendar View', note: 'Listed under "Application machine coding"; the month grid is the shared core.' },
    ],
    researchNotes:
      'One source lists the date picker as a component system-design question, the other lists a calendar view as machine coding; this problem is the 60-minute machine-coding subset they share: a single-date picker with an ISO text input and a popup month grid following the WAI-ARIA APG Date Picker Dialog example. The senior learning objective is date modelling: calendar dates as {year, month, day} with UTC-only arithmetic instead of timestamps, so there are no time-zone or DST off-by-one bugs, and Intl.DateTimeFormat (with timeZone "UTC") for labels. Range selection, locale-specific input formats, a year/month picker, time of day and a controlled API are follow-ups. The tests inject `today` and `locale` for determinism and were run under several time zones.',
  },
  spec: {
    summary: 'Build an accessible single-date picker: ISO text input plus a popup month grid with APG keyboard navigation, min/max, configurable week start and time-zone-safe calendar arithmetic.',
    description: `Implement the pure helpers in **dateUtils.ts** and \`<DatePicker />\` in **DatePicker.tsx**.

### Model dates as calendar dates, not timestamps
A \`CalendarDate\` is \`{ year, month /* 1–12 */, day }\` (\`types.ts\`) and is serialised as \`"yyyy-mm-dd"\`. A \`Date\` is an *instant*: which calendar day it shows depends on the time zone, and local midnights shift around DST. If you use \`Date\` for arithmetic, use **UTC only** (\`setUTCFullYear\`, \`getUTC*\`), and format with \`Intl.DateTimeFormat(locale, { …, timeZone: 'UTC' })\`. The tests run in a real browser in whatever time zone the machine has.

### dateUtils.ts
\`daysInMonth\`, \`parseISODate\` (strict \`yyyy-mm-dd\`, trims whitespace, rejects impossible dates like 2023-02-29 → \`null\`), \`toISODate\` (zero-padded), \`addDays\`, \`addMonths\` / \`addYears\` (**clamp** the day: Jan 31 + 1 month → Feb 29 or 28), \`dayOfWeek\` (0 = Sunday), \`startOfWeek\` / \`endOfWeek\` (for a given \`weekStartsOn\`), \`clampDate\` and \`getMonthGrid(year, month, weekStartsOn)\` → rows of 7 cells, \`null\` for days of other months. \`isLeapYear\`, \`compareDates\`, \`isSameDay\` and \`toUTCDate\` are provided.

### DatePicker.tsx
Props: \`label\`, \`defaultValue?\` (ISO, uncontrolled), \`onChange?(iso | null)\`, \`min?\`, \`max?\` (ISO, inclusive), \`today?\` (ISO; defaults to the user's local date), \`weekStartsOn?\` (default 0), \`locale?\`.

1. **Input.** A text input labelled by \`label\`. A typed value is committed on **blur** and on **Enter**: a valid in-range ISO date becomes the value (\`onChange(iso)\`); an empty input clears it (\`onChange(null)\`); anything else shows an error with \`role="alert"\`, sets \`aria-invalid="true"\` and keeps the previous value. \`onChange\` is only called when the value actually changes.
2. **Calendar button.** Named **"Choose date"** when empty and **"Change date, <long date>"** when set, e.g. *"Change date, Wednesday, March 20, 2024"* (\`Intl.DateTimeFormat\` with weekday/year/month/day long).
3. **Dialog.** Clicking it opens \`role="dialog"\` with \`aria-modal="true"\`, containing a **"Previous month"** button, a month/year heading (e.g. *"March 2024"*, polite live region), a **"Next month"** button, and a \`role="grid"\` table labelled by the heading. Column headers are weekday names (\`weekday: 'short'\`) starting at \`weekStartsOn\`.
4. **Day cells.** \`role="gridcell"\` with \`data-date="yyyy-mm-dd"\` and the day number as text; days of other months are empty cells. Today has \`aria-current="date"\`; the selected day \`aria-selected="true"\` (others \`"false"\`); days outside \`min\`/\`max\` \`aria-disabled="true"\` and cannot be selected.
5. **Focus.** On open, focus the selected day (else today), clamped to \`min\`/\`max\`. Roving tabindex: only the focused day has \`tabIndex=0\`.
6. **Keys in the grid** (all \`preventDefault\`-ed): ←/→ ±1 day, ↑/↓ ±1 week, PageUp/PageDown ±1 month, **Shift**+PageUp/PageDown ±1 year (day clamped), Home/End start/end of the week. Moving out of the visible month shows the new month. Keyboard focus never leaves \`[min, max]\`.
7. **Select / close.** Enter, Space or a click selects the day, closes the dialog and returns focus to the calendar button. **Escape** closes without changing the value, also returning focus. Previous/Next month change the month (disabled when the whole month is out of range) without moving focus. **Tab/Shift+Tab** wrap inside the dialog. Clicking outside closes it.

\`App.tsx\` and \`types.ts\` are read-only.`,
    technologies: ['React 18', 'TypeScript', 'Intl.DateTimeFormat', 'WAI-ARIA dialog and grid patterns'],
    learningObjectives: [
      'Model calendar dates as {year, month, day} and do date arithmetic in UTC so results never depend on the time zone or DST',
      'Implement month/year arithmetic with day clamping and leap-year rules',
      'Build the APG date picker dialog: grid roles, roving focus, the keyboard map, focus return',
      'Derive the visible month from a single "focused date" state instead of syncing two states',
      'Localise labels with Intl.DateTimeFormat and a configurable first day of the week',
    ],
    clarifications: [
      { question: 'Is the value a calendar date or a moment in time? Does time of day matter?', why: 'A birthday or check-in day is a calendar date; storing it as a timestamp makes it shift by a day for users in other time zones.', defaultAssumption: 'A calendar date only, exchanged as an ISO "yyyy-mm-dd" string.' },
      { question: 'Which text formats must the input accept?', why: 'Locale formats (03/04/2024) are ambiguous; parsing them needs locale-aware rules.', defaultAssumption: 'ISO yyyy-mm-dd only, shown as the placeholder and in a hint; locale input is a follow-up.' },
      { question: 'Which day does the week start on, and which language are labels in?', why: 'Varies by region (Sunday in the US, Monday in most of Europe); labels should come from Intl rather than hard-coded arrays.', defaultAssumption: '`weekStartsOn` prop (default Sunday) and `locale` prop (default: the browser\'s).' },
      { question: 'Are there selectable limits (min/max, blocked days)?', why: 'Affects rendering, keyboard movement and validation of typed input.', defaultAssumption: 'Inclusive `min`/`max`; out-of-range days are disabled and keyboard focus is clamped. Arbitrary blocked days are a follow-up.' },
      { question: 'Controlled or uncontrolled? Single date or a range?', why: 'Changes the API and the state model (a range needs hover preview and two values).', defaultAssumption: 'Uncontrolled single date (`defaultValue` + `onChange`); controlled mode and ranges are follow-ups.' },
    ],
    scopeDecisions: [
      'Single date, uncontrolled, no time of day.',
      'ISO text input only; no locale-specific parsing.',
      'Popup rendered next to the input (no portal); no year/month dropdowns.',
      'No right-to-left arrow mirroring (mentioned as a follow-up).',
    ],
    requirements: [
      { id: 'calendar-dates', category: 'technical', level: 'MUST', text: 'Dates are {year, month, day} / ISO strings; arithmetic is time-zone independent (UTC only), so results are identical in every time zone and across DST changes.' },
      { id: 'parse-iso', category: 'functional', level: 'MUST', text: '`parseISODate` accepts only real yyyy-mm-dd dates (leap years included) and `toISODate` zero-pads.' },
      { id: 'month-math', category: 'edge-case', level: 'MUST', text: '`addMonths`/`addYears` clamp the day (Jan 31 → Feb 29/28, Feb 29 + 1 year → Feb 28).' },
      { id: 'month-grid', category: 'functional', level: 'MUST', text: '`getMonthGrid` returns rows of 7 starting at `weekStartsOn`, with every day of the month exactly once.' },
      { id: 'input-commit', category: 'functional', level: 'MUST', text: 'Typed dates are committed on blur/Enter; empty clears to null; invalid or out-of-range shows a role="alert" error with aria-invalid and keeps the value.' },
      { id: 'button-label', category: 'accessibility', level: 'MUST', text: 'The calendar button is named "Choose date" or "Change date, <long date>" using Intl.DateTimeFormat.' },
      { id: 'dialog-grid', category: 'accessibility', level: 'MUST', text: 'A modal role="dialog" with a month heading and a role="grid" labelled by it; weekday column headers; day cells with data-date.' },
      { id: 'markers', category: 'accessibility', level: 'MUST', text: 'aria-current="date" on today, aria-selected on the selected day, aria-disabled on days outside min/max.' },
      { id: 'grid-keys', category: 'accessibility', level: 'MUST', text: 'Arrows, PageUp/PageDown (+Shift), Home/End move focus per the APG date picker; moving out of the month changes the visible month.' },
      { id: 'select-close', category: 'functional', level: 'MUST', text: 'Enter/Space/click select, close and return focus to the button; Escape closes without changes and returns focus.' },
      { id: 'roving-focus', category: 'accessibility', level: 'MUST', text: 'Exactly one day cell is tabbable; it receives focus on open and after every keyboard move.' },
      { id: 'min-max', category: 'edge-case', level: 'MUST', text: 'Disabled days cannot be selected by click or keyboard; keyboard focus and Previous/Next month respect the range.' },
      { id: 'focus-trap', category: 'accessibility', level: 'SHOULD', text: 'Tab and Shift+Tab wrap within the dialog; clicking outside closes it.' },
      { id: 'derived-view', category: 'technical', level: 'SHOULD', text: 'The visible month is derived from the focused date rather than stored separately.' },
      { id: 'intl', category: 'technical', level: 'SHOULD', text: 'Month, weekday and long-date labels come from Intl.DateTimeFormat (with timeZone "UTC"), with memoised formatters.' },
      { id: 'utils-tests', category: 'testing', level: 'SHOULD', text: 'Date helpers are unit-tested at month/year/leap/DST boundaries independent of the UI; `today` is injected for deterministic component tests.' },
    ],
    constraints: ['React function components and hooks only.', 'No date libraries (date-fns, Day.js, Temporal polyfills).', 'Only react and react-dom can be imported.'],
    acceptanceCriteria: [
      'All public tests pass (parsing, formatting, addDays across DST, month clamping, month grid; UI: render, open/focus/markers, arrow keys, Enter select, Escape, typed input).',
      'All hidden tests pass (leap-year rules, weekdays, years below 100, 4- and 6-row months, clamping; PageUp/PageDown with clamping, weekStartsOn + Home/End, min/max, range errors and clearing, month buttons, focus trap, markers, DST months).',
      'The solution behaves identically when the browser runs in UTC, America/Los_Angeles, Asia/Kolkata or Pacific/Auckland.',
    ],
    examples: [
      { title: 'Month clamping', input: 'Focus 2024-01-31, press PageDown', output: 'Focus 2024-02-29 (February 2024)', explanation: 'Date.UTC(2024, 1, 31) would roll over to March 2 — clamp instead.' },
      { title: 'Time-zone trap', input: "new Date('2024-03-15').getDate() in Los Angeles", output: '14', explanation: 'An ISO date-only string is parsed as UTC midnight, which is the previous evening in negative-offset zones.' },
      { title: 'Week start', input: 'weekStartsOn = 1, focus Wed 2024-03-13, press Home', output: 'Mon 2024-03-11' },
    ],
    manualTests: [
      'Open the calendar and operate it with the keyboard only; focus should always be visible and never leave the dialog.',
      'Change the computer\'s time zone (or emulate one in DevTools) to Los Angeles and to Auckland: the same dates must be shown and selected.',
      'Type 2023-02-29 and press Tab: an error is shown and announced, and the previous date is kept.',
      'In the Check-out picker (Monday start, de-DE), check that weekday headers and the month name are German and the grid starts on Monday.',
      'With a screen reader, move through the grid: the month change should be announced via the heading.',
    ],
  },
  files: {
    entry: '/App.tsx',
    starter: { ...shared, '/DatePicker.tsx': starterPicker, '/dateUtils.ts': starterUtils },
    solution: { ...shared, '/DatePicker.tsx': solutionPicker, '/dateUtils.ts': solutionUtils },
    readonly: ['/App.tsx', '/types.ts'],
    support: {},
  },
  tests: [
    { path: '/tests/helpers.tsx', visibility: 'public', kind: 'runtime', source: helpers },
    { path: '/tests/dateUtils.test.ts', visibility: 'public', kind: 'runtime', source: utilsTests },
    { path: '/tests/public.test.tsx', visibility: 'public', kind: 'runtime', source: publicTests },
    { path: '/tests/dateUtils.hidden.test.ts', visibility: 'hidden', kind: 'runtime', source: utilsHiddenTests },
    { path: '/tests/hidden.test.tsx', visibility: 'hidden', kind: 'runtime', source: hiddenTests },
  ],
  hints: [
    'Do all arithmetic on "day numbers": convert a CalendarDate to UTC midnight (`d = new Date(0); d.setUTCFullYear(y, m - 1, day)`), divide by 86 400 000, add days, convert back with getUTCFullYear/getUTCMonth/getUTCDate. In UTC every day is exactly 24 h, so DST cannot bite.',
    'addMonths: work with a month index (`year * 12 + month - 1 + n`), split it back into year/month, then `day = Math.min(day, daysInMonth(year, month))`. addYears is addMonths(12 × n).',
    'Keep one state for the grid: the focused date. The visible month is `focused.year/month`, so PageDown, arrow keys and the month buttons all just compute a new focused date (clamped to min/max). After a keyboard move, focus the cell `[data-date="…"]` in a layout effect.',
    'Format labels with memoised `Intl.DateTimeFormat(locale, { …, timeZone: "UTC" })` applied to the UTC-midnight Date. For weekday headers, format seven consecutive known dates (1 Jan 2023 was a Sunday), rotated by weekStartsOn.',
  ],
  solution: {
    initialApproach:
      'Separate the calendar maths from the UI. Write small pure helpers over `{year, month, day}`, then build the component around three pieces of state — the committed value, the input text, and the focused day (from which the visible month is derived) — plus open/error flags.',
    bruteForce:
      'Storing `Date` objects and using `setDate(getDate() + 1)`, `setMonth(getMonth() + 1)` and `toISOString().slice(0, 10)` looks fine in UTC but breaks elsewhere: `new Date("2024-03-15")` is UTC midnight (the 14th in the Americas), `toISOString()` of a local midnight is the previous day east of Greenwich, `setMonth` on Jan 31 rolls over to March, and adding 86 400 000 ms to a local midnight lands at 23:00 on the same day when DST ends.',
    optimizedApproach: `- **Calendar dates + UTC day numbers.** \`toDayNumber(d)\` = UTC midnight / 86 400 000; \`addDays\` is integer addition; weekday is \`getUTCDay()\`. \`setUTCFullYear\` instead of \`Date.UTC\` so years 0–99 are not mapped to 1900–1999.
- **Month maths without Date.** \`addMonths\` uses a month index and clamps the day; \`daysInMonth\` uses a table plus the Gregorian leap rule.
- **One source of truth for the grid.** \`focused\` is state; \`view = focused.year/month\`, the grid is \`getMonthGrid(view, weekStartsOn)\`. Nothing to keep in sync.
- **Clamp once.** Every keyboard move goes through \`clampDate(next, min, max)\`, so focus can never land outside the range.
- **Focus via layout effect.** Keyboard handlers set \`focused\` and a "focus the cell after render" flag; the effect focuses \`[data-date]\` before paint. Month buttons do not set the flag, so focus stays on the button.
- **Intl with timeZone "UTC".** All labels format the UTC-midnight Date in UTC — the date shown is the calendar date, regardless of where the user is.`,
    walkthrough: `1. **parseISODate**: regex \`^(\\d{4})-(\\d{2})-(\\d{2})$\` on the trimmed text, then range-check month and \`day <= daysInMonth\`. Do not use \`new Date(text)\`: it accepts other formats, rolls 02-30 over and parses as UTC.
2. **addDays / dayOfWeek / startOfWeek**: via day numbers; \`startOfWeek = addDays(d, -((dayOfWeek(d) - weekStartsOn + 7) % 7))\`.
3. **getMonthGrid**: \`leading = (dayOfWeek(1st) - weekStartsOn + 7) % 7\` nulls, all days, trailing nulls to a multiple of 7, chunk by 7.
4. **State**: \`value\`, \`text\`, \`error\`, \`open\`, \`focused\`; \`min\`, \`max\`, \`today\` are parsed with \`useMemo\`.
5. **Open**: \`focused = clamp(value ?? today)\`; set the focus flag; the layout effect focuses the cell.
6. **Grid keydown** (on the table; events bubble from the focused cell): map key → next date, \`preventDefault\`, \`setFocused(clamp(next))\`. Enter/Space → select.
7. **Select**: ignore disabled; commit (calls \`onChange\` only if the value changed), close, \`buttonRef.focus()\`.
8. **Dialog keydown**: Escape closes (and stops propagation so an enclosing modal stays open); Tab wraps between the first and last focusable element (enabled buttons and the tabbable cell).
9. **Outside click**: a \`pointerdown\` listener on \`document\` while open, removed in the effect cleanup.
10. **Input**: \`onChange\` updates text and clears the error; blur/Enter run \`commitText\` (empty → null, invalid → format error, out of range → range error, else commit and normalise the text).`,
    complexity:
      '- Every helper is O(1) except `getMonthGrid`, which is O(42) at most.\n- Rendering the grid: ≤ 42 cells per render; formatters are memoised per locale (constructing `Intl.DateTimeFormat` is comparatively expensive).\n- No work is proportional to the distance travelled: jumping 100 years with Shift+PageUp is one call.',
    edgeCases:
      '- 31st → shorter month (PageDown on Jan 31, Mar 31 − 1 month), Feb 29 ± 1 year.\n- Century leap years (1900 no, 2000 yes).\n- DST transition days in the user\'s zone (US: second Sunday of March / first Sunday of November; EU: last Sundays of March / October) — irrelevant only if you never use local time.\n- Weeks that start in the previous month (Home on the 1st).\n- `min`/`max` within the visible month, and months entirely out of range (disable Previous/Next).\n- An initial `defaultValue` outside `min`/`max`, or invalid: open on a clamped date.\n- Typing an invalid date after a valid one: keep the old value, show the error.\n- Years below 100 with `Date.UTC`, and five-digit years (out of scope for the ISO regex).\n- "Today" changes at midnight while the page is open.',
    alternatives:
      '- **`<input type="date">`**: native, accessible, localised and mobile friendly; little styling control, no custom disabled days beyond min/max, and the UI differs per browser. Often the right production answer.\n- **Temporal (`Temporal.PlainDate`)**: the standard calendar-date type that makes this whole class of bugs disappear, once it is available in your target browsers.\n- **date-fns / Day.js / Luxon** for arithmetic and parsing; **react-aria `useDatePicker`** for a complete accessible implementation including locale-aware segmented input.\n- **aria-activedescendant** on the grid instead of roving tabindex: focus stays on the table; more id bookkeeping, fewer focus calls.',
    tradeoffs:
      '- Commit-on-blur avoids nagging while typing but means `onChange` lags the keystrokes; commit-on-change would fire on every valid intermediate string.\n- Clamping keyboard focus to the range prevents dead ends but hides why a key "does nothing" — an announcement or visible disabled state helps.\n- A modal dialog (focus trap) follows the APG example; a non-modal popover is lighter and lets users keep typing, but then focus leaving must close it.\n- Uncontrolled keeps the API tiny; a controlled `value` is needed when a form library or URL owns the value (and you must then resync the text input).',
    commonMistakes:
      '- `new Date("yyyy-mm-dd")` (UTC) mixed with `getDate()` (local): off by one day in the Americas.\n- `toISOString().slice(0, 10)` on a local date: off by one day east of UTC.\n- Adding `24 * 60 * 60 * 1000` to local midnights: repeated or skipped days around DST.\n- `setMonth(m + 1)` on the 31st: skips a month.\n- Formatting with Intl but without `timeZone: "UTC"` for a UTC-midnight Date.\n- Storing `viewMonth` and `focusedDate` separately and letting them drift apart.\n- Making every day cell tabbable, or not moving DOM focus when the month changes.\n- Hard-coded `["Su", "Mo", …]` that ignores `weekStartsOn` and locale.\n- Not returning focus to the button after closing.',
    testingStrategy:
      '- Unit-test helpers at boundaries: month ends, leap days, century years, DST dates, years < 100.\n- Inject `today` and `locale`; never depend on the real clock in component tests.\n- Drive the grid with `keyDown` on `document.activeElement` and assert `data-date` of the focused cell and the grid\'s accessible name.\n- Run the same suite under several time zones (e.g. Playwright `timezoneId`: UTC, America/Los_Angeles, Asia/Kolkata, Pacific/Auckland) — a timestamp-based implementation that passes in UTC fails in at least one of them.\n- Check ARIA state (`aria-current`, `aria-selected`, `aria-disabled`, `aria-invalid`) and focus return explicitly.',
    seniorFollowUps:
      '- Date range selection with hover preview and keyboard support for both ends.\n- Locale-aware typed input (segmented day/month/year fields, as in react-aria), including different orders and separators.\n- Controlled API and integration with a form library; validation messages and server-side validation.\n- Time of day and time zones: storing an instant vs a wall-clock time plus a zone; meetings across zones.\n- RTL: ArrowLeft/ArrowRight mirrored; non-Gregorian calendars via Intl `calendar` option.\n- Performance and bundle size: Intl vs a date library; memoising formatters.',
  },
  followUps: [
    { id: 'f1', level: 'definition', question: 'What is the difference between a calendar date and a timestamp, and which one is a birthday?', expectedConcepts: ['timestamp is an instant', 'calendar date has no time zone', 'the same instant is different days in different zones', 'store birthdays as yyyy-mm-dd'], sourceIds: ['mdn-intl-datetimeformat'] },
    { id: 'f2', level: 'mechanism', question: 'Why does `new Date("2024-03-15").getDate()` return 14 for some users, and how do you avoid it?', expectedConcepts: ['date-only ISO strings parse as UTC', 'getDate reads local time', 'negative UTC offsets', 'use UTC getters or parse into {y, m, d}'], sourceIds: ['mdn-intl-datetimeformat'] },
    { id: 'f3', level: 'application', question: 'Walk through the APG date picker keyboard map. What happens on PageDown from January 31?', expectedConcepts: ['arrows by day/week', 'PageUp/PageDown month, Shift year', 'Home/End week', 'clamp to the last day of February', 'focus moves to the new cell'], sourceIds: ['apg-datepicker-dialog', 'apg-grid'] },
    { id: 'f4', level: 'edge-cases', question: 'Which edge cases would you test for min/max and for typed input?', expectedConcepts: ['disabled cells not selectable', 'keyboard focus clamped', 'month buttons disabled', 'invalid and impossible dates', 'out-of-range error keeps previous value', 'clearing reports null'], sourceIds: ['apg-datepicker-dialog'] },
    { id: 'f5', level: 'production', question: 'Your picker is used in 40 countries. What changes for localisation?', expectedConcepts: ['Intl month and weekday names', 'first day of the week per region', 'input format per locale', 'RTL arrow keys', 'non-Gregorian calendars'], sourceIds: ['mdn-intl-datetimeformat'] },
    { id: 'f6', level: 'architecture', question: 'Design a date-picker package used by several teams: single date, range and date-time. How do you structure it?', expectedConcepts: ['headless state hooks separate from UI', 'calendar-date type (or Temporal.PlainDate)', 'controlled and uncontrolled APIs', 'shared grid and keyboard logic', 'accessibility tests per variant'], sourceIds: ['apg-datepicker-dialog', 'apg-grid'] },
  ],
  mcqs: [
    {
      id: 'm1',
      question: 'A user in Los Angeles (UTC−8) selects 15 March 2024 and the code does the following. What is displayed?',
      code: "const d = new Date('2024-03-15');\nlabel.textContent = String(d.getDate());",
      options: [
        { id: 'a', text: '15', explanation: 'That is what UTC users see; getDate() reads the local day.' },
        { id: 'b', text: '14', explanation: 'Correct: a date-only ISO string is parsed as UTC midnight, which is 16:00 on the 14th in Los Angeles.' },
        { id: 'c', text: '16', explanation: 'That would need a positive offset of more than 24 h.' },
        { id: 'd', text: 'NaN', explanation: 'The string is valid; it parses fine.' },
      ],
      correctOptionId: 'b',
      explanation: 'Mixing UTC parsing with local getters causes off-by-one days. Keep calendar dates as {year, month, day} and use UTC consistently (including timeZone: "UTC" when formatting).',
      sourceIds: ['mdn-intl-datetimeformat'],
    },
    {
      id: 'm2',
      question: 'In the APG Date Picker Dialog example, what does Shift + Page Down do in the grid?',
      options: [
        { id: 'a', text: 'Moves focus to the same day in the next month', explanation: 'That is Page Down without Shift.' },
        { id: 'b', text: 'Moves focus to the same day in the next year', explanation: 'Correct (clamping when that day does not exist, e.g. Feb 29).' },
        { id: 'c', text: 'Moves focus to the last day of the week', explanation: 'That is End.' },
        { id: 'd', text: 'Selects the focused date and closes the dialog', explanation: 'That is Enter (or Space).' },
      ],
      correctOptionId: 'b',
      explanation: 'Page Up/Down change the month and with Shift the year; arrows move by day/week; Home/End go to the start/end of the week.',
      sourceIds: ['apg-datepicker-dialog'],
    },
    {
      id: 'm3',
      question: 'Which formatter shows the right weekday for a CalendarDate converted with `new Date(Date.UTC(y, m - 1, d))`, for every user?',
      options: [
        { id: 'a', text: "new Intl.DateTimeFormat('en-US', { weekday: 'long' })", explanation: 'Uses the user\'s zone: for UTC−x users UTC midnight is the previous evening, so the previous weekday is shown.' },
        { id: 'b', text: "new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'UTC' })", explanation: 'Correct: the instant was built in UTC, so it must be formatted in UTC.' },
        { id: 'c', text: "new Intl.DateTimeFormat('en-US', { weekday: 'long', hour12: false })", explanation: 'hour12 does not affect the date.' },
        { id: 'd', text: 'Any of them; Intl always formats in UTC', explanation: 'Intl defaults to the runtime\'s time zone.' },
      ],
      correctOptionId: 'b',
      explanation: 'Build and format in the same zone. With calendar dates, UTC is the convenient "zone without DST".',
      sourceIds: ['mdn-intl-datetimeformat'],
    },
  ],
};

export default problem;
