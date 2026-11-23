import { useState } from 'react';

export interface AutocompleteProps {
  /** Fetches suggestions. Pass `signal` through so stale requests can be cancelled. */
  fetchSuggestions: (query: string, signal: AbortSignal) => Promise<string[]>;
  /** Called when the user picks a suggestion (Enter or click). */
  onSelect?: (value: string) => void;
  /** Visible label for the input. Default: "Search". */
  label?: string;
  /** Debounce delay in ms. Default: 300. */
  debounceMs?: number;
  /** Minimum trimmed query length before searching. Default: 1. */
  minChars?: number;
}

export default function Autocomplete({ label = 'Search' }: AutocompleteProps) {
  const [query, setQuery] = useState('');

  // TODO:
  // - debounce the query, then call fetchSuggestions(query, signal)
  // - cancel / ignore stale requests
  // - render loading / empty / error / results states
  // - combobox + listbox ARIA, keyboard navigation (ArrowUp/ArrowDown/Enter/Escape)
  return (
    <div className="autocomplete">
      <label htmlFor="autocomplete-input">{label}</label>
      <input id="autocomplete-input" value={query} onChange={(e) => setQuery(e.target.value)} />
    </div>
  );
}
