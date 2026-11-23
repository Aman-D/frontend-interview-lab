import { useState } from 'react';
import Tabs, { type TabItem } from './Tabs';
import './styles.css';

const settings: TabItem[] = [
  { id: 'profile', label: 'Profile', content: <p>Your public name, avatar and bio.</p> },
  { id: 'security', label: 'Security', content: <p>Password, passkeys and two-factor authentication.</p> },
  { id: 'billing', label: 'Billing', content: <p>Billing is managed by your organisation admin.</p>, disabled: true },
  {
    id: 'notes',
    label: 'Notes',
    content: (
      <label>
        Draft note (keeps its text only when panels stay mounted)
        <textarea rows={3} />
      </label>
    ),
  },
];

export default function App() {
  const [report, setReport] = useState('summary');
  return (
    <main className="app">
      <h1>Accessible tabs</h1>
      <p className="hint">Click a tab, then use ArrowLeft/ArrowRight, Home and End. "Billing" is disabled and skipped.</p>

      <h2>Automatic activation, uncontrolled</h2>
      <Tabs label="Account settings" items={settings} defaultValue="security" />

      <h2>Manual activation, controlled, panels kept mounted</h2>
      <p className="hint">Arrows only move focus here; press Enter or Space to select. Selected: <strong>{report}</strong></p>
      <Tabs
        label="Reports"
        activation="manual"
        keepMounted
        value={report}
        onChange={setReport}
        items={[
          { id: 'summary', label: 'Summary', content: <p>Quarter-to-date revenue is up 12%.</p> },
          { id: 'details', label: 'Details', content: <p>Breakdown by region and product line.</p> },
          { id: 'notes', label: 'Notes', content: <label>Notes<textarea rows={3} /></label> },
        ]}
      />
    </main>
  );
}
