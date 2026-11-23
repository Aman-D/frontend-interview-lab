import { useState } from 'react';
import DatePicker from './DatePicker';
import './styles.css';

export default function App() {
  const [checkIn, setCheckIn] = useState<string | null>(null);
  const [checkOut, setCheckOut] = useState<string | null>('2026-12-04');
  return (
    <main className="app">
      <h1>Book a stay</h1>
      <p className="hint">
        Type a date as yyyy-mm-dd, or open the calendar: arrows move by day/week, PageUp/PageDown by month (Shift: year), Home/End to the start/end
        of the week, Enter selects, Escape closes.
      </p>
      <DatePicker label="Check-in" today="2026-11-23" min="2026-11-23" max="2027-11-23" onChange={setCheckIn} locale="en-US" />
      <DatePicker label="Check-out (weeks start on Monday, German labels)" today="2026-11-23" defaultValue="2026-12-04" weekStartsOn={1} locale="de-DE" onChange={setCheckOut} />
      <p className="hint">
        Check-in: <strong>{checkIn ?? '—'}</strong> · Check-out: <strong>{checkOut ?? '—'}</strong>
      </p>
    </main>
  );
}
