import { useId, useState } from 'react';
import type { MultiSelectProps } from './types';

export default function MultiSelect({ label, options, placeholder }: MultiSelectProps) {
  const id = useId();
  const [query, setQuery] = useState('');

  // TODO:
  // - controlled (`value` + `onChange`) and uncontrolled (`defaultValue`) selection
  // - chips for selected values, each with a "Remove <label>" button
  // - combobox input + listbox (aria-multiselectable) filtered by the query
  // - selected options stay listed with aria-selected="true"
  // - ArrowUp/ArrowDown (wrapping) via aria-activedescendant, Enter toggles, Escape closes
  // - Backspace in an EMPTY input removes the last chip
  // - maxSelections: disable further options and explain why
  return (
    <div className="ms">
      <label htmlFor={`${id}-input`} className="ms-label">
        {label}
      </label>
      <div className="ms-field">
        <input id={`${id}-input`} className="ms-input" value={query} placeholder={placeholder} onChange={(e) => setQuery(e.target.value)} />
      </div>
      <ul className="ms-listbox">
        {options.map((o) => (
          <li key={o.value}>{o.label}</li>
        ))}
      </ul>
    </div>
  );
}
