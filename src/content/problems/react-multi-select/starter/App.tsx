import { useState } from 'react';
import MultiSelect from './MultiSelect';
import type { Option } from './types';
import './styles.css';

const SKILLS: Option[] = [
  { value: 'react', label: 'React' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'css', label: 'CSS' },
  { value: 'a11y', label: 'Accessibility' },
  { value: 'testing', label: 'Testing' },
  { value: 'graphql', label: 'GraphQL' },
  { value: 'perf', label: 'Web performance' },
  { value: 'cobol', label: 'COBOL (not hiring)', disabled: true },
  { value: 'node', label: 'Node.js' },
];

const TIMEZONES: Option[] = [
  { value: 'utc', label: 'UTC' },
  { value: 'ist', label: 'India (IST)' },
  { value: 'cet', label: 'Central Europe (CET)' },
  { value: 'est', label: 'US Eastern (EST)' },
  { value: 'pst', label: 'US Pacific (PST)' },
  { value: 'jst', label: 'Japan (JST)' },
];

export default function App() {
  const [skills, setSkills] = useState<string[]>(['react']);

  return (
    <main className="app">
      <h1>Post a job</h1>
      <p className="hint">Type to filter, Enter to toggle, Backspace in an empty field removes the last chip.</p>

      <MultiSelect label="Required skills (max 3)" options={SKILLS} value={skills} onChange={setSkills} maxSelections={3} placeholder="Add a skill…" />
      <p className="value">
        Controlled value: <code>{JSON.stringify(skills)}</code>
      </p>

      <MultiSelect label="Time zones" options={TIMEZONES} defaultValue={['utc']} onChange={(v) => console.log('time zones', v)} placeholder="Add a time zone…" />
    </main>
  );
}
