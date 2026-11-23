import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';

export interface AutocompleteProps {
  fetchSuggestions: (query: string, signal: AbortSignal) => Promise<string[]>;
  onSelect?: (value: string) => void;
  label?: string;
  debounceMs?: number;
  minChars?: number;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function Autocomplete({ fetchSuggestions, onSelect, label = 'Search', debounceMs = 300, minChars = 1 }: AutocompleteProps) {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const id = useId();
  const inputId = `${id}-input`;
  const listId = `${id}-listbox`;
  const optionId = (i: number) => `${id}-option-${i}`;

  // Keep the latest callbacks without re-running the search effect when a parent
  // passes a new inline function on every render.
  const fetchRef = useRef(fetchSuggestions);
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    fetchRef.current = fetchSuggestions;
    onSelectRef.current = onSelect;
  });

  // Set when the query changes because of a selection, so we don't search for it.
  const skipNextSearch = useRef(false);

  useEffect(() => {
    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }
    const q = query.trim();
    if (q.length < minChars) {
      setItems([]);
      setStatus('idle');
      setOpen(false);
      setActive(-1);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setStatus('loading');
      setOpen(true);
      fetchRef.current(q, controller.signal).then(
        (results) => {
          if (controller.signal.aborted) return; // stale: a newer query owns the UI
          setItems(results);
          setStatus('success');
          setActive(-1);
        },
        (error: unknown) => {
          if (controller.signal.aborted) return; // AbortError from our own cancel — not a failure
          console.error(error);
          setItems([]);
          setStatus('error');
        },
      );
    }, debounceMs);
    // Runs when the query changes and on unmount: drop the pending timer and cancel in-flight work.
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, debounceMs, minChars]);

  function select(value: string) {
    if (value !== query) skipNextSearch.current = true;
    setQuery(value);
    setItems([]);
    setStatus('idle');
    setOpen(false);
    setActive(-1);
    onSelectRef.current?.(value);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    switch (e.key) {
      case 'ArrowDown':
        if (!items.length) return;
        e.preventDefault();
        setOpen(true);
        setActive((a) => (a + 1) % items.length);
        break;
      case 'ArrowUp':
        if (!items.length) return;
        e.preventDefault();
        setOpen(true);
        setActive((a) => (a <= 0 ? items.length - 1 : a - 1));
        break;
      case 'Enter':
        if (open && active >= 0 && active < items.length) {
          e.preventDefault();
          select(items[active]);
        }
        break;
      case 'Escape':
        if (open) {
          e.preventDefault();
          setOpen(false);
          setActive(-1);
        }
        break;
    }
  }

  const showList = open && status === 'success' && items.length > 0;

  return (
    <div className="autocomplete">
      <label htmlFor={inputId}>{label}</label>
      <input
        id={inputId}
        type="text"
        role="combobox"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={showList && active >= 0 ? optionId(active) : undefined}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => {
          setOpen(false);
          setActive(-1);
        }}
      />
      <ul id={listId} role="listbox" aria-label={`${label} suggestions`} hidden={!showList}>
        {items.map((item, i) => (
          <li
            key={item}
            id={optionId(i)}
            role="option"
            aria-selected={i === active}
            // keep focus in the input so blur doesn't close the list before click fires
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => select(item)}
            onMouseEnter={() => setActive(i)}
          >
            {item}
          </li>
        ))}
      </ul>
      <div className="status" role="status" aria-live="polite">
        {open && status === 'loading' ? 'Loading…' : open && status === 'success' && items.length === 0 ? 'No results' : ''}
      </div>
      {status === 'error' && (
        <div className="error" role="alert">
          Something went wrong. Please try again.
        </div>
      )}
    </div>
  );
}
