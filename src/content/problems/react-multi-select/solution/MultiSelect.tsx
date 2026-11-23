import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import type { MultiSelectProps, Option } from './types';

export default function MultiSelect({ label, options, value: valueProp, defaultValue, onChange, maxSelections, placeholder }: MultiSelectProps) {
  const id = useId();
  const inputId = `${id}-input`;
  const labelId = `${id}-label`;
  const listboxId = `${id}-listbox`;
  const limitId = `${id}-limit`;

  // Controlled when `value` is provided. Decided per render, like <input value>; switching modes is a bug
  // in the parent (React warns for native inputs; we simply follow the prop).
  const isControlled = valueProp !== undefined;
  const [internal, setInternal] = useState<string[]>(() => defaultValue ?? []); // read once
  const selected = isControlled ? valueProp : internal;

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  // Track the active option by VALUE, not index: filtering and toggling change indices.
  const [activeValue, setActiveValue] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const byValue = useMemo(() => new Map(options.map((o) => [o.value, o])), [options]);
  const limitReached = maxSelections !== undefined && selected.length >= maxSelections;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  }, [options, query]);

  const isDisabled = (o: Option) => !!o.disabled || (limitReached && !selectedSet.has(o.value));

  // Derived active option: the remembered one if still listed, else the first selectable one, else the first.
  const active = filtered.find((o) => o.value === activeValue) ?? filtered.find((o) => !isDisabled(o)) ?? filtered[0] ?? null;
  const expanded = open && filtered.length > 0;
  const optionId = (index: number) => `${id}-option-${index}`;
  const activeOptionId = expanded && active ? optionId(filtered.indexOf(active)) : undefined;

  useEffect(() => {
    if (activeOptionId) document.getElementById(activeOptionId)?.scrollIntoView?.({ block: 'nearest' });
  }, [activeOptionId]);

  function commit(next: string[], message: string) {
    if (!isControlled) setInternal(next);
    onChange?.(next);
    setAnnouncement(message);
  }

  const labelOf = (value: string) => byValue.get(value)?.label ?? value;

  function toggle(o: Option) {
    if (isDisabled(o)) return; // covers both option.disabled and the max limit (selected ones stay removable)
    if (selectedSet.has(o.value)) commit(selected.filter((v) => v !== o.value), `${o.label} removed.`);
    else commit([...selected, o.value], `${o.label} selected.`);
    setQuery(''); // ready for the next search; the list stays open
    setActiveValue(o.value);
  }

  function remove(value: string) {
    commit(
      selected.filter((v) => v !== value),
      `${labelOf(value)} removed.`,
    );
    inputRef.current?.focus(); // the focused chip button is about to disappear
  }

  function move(step: 1 | -1) {
    if (filtered.length === 0) return;
    const current = active ? filtered.indexOf(active) : -1;
    const next = current === -1 ? (step === 1 ? 0 : filtered.length - 1) : (current + step + filtered.length) % filtered.length;
    setActiveValue(filtered[next].value);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.nativeEvent.isComposing) return;
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        e.preventDefault();
        const step = e.key === 'ArrowDown' ? 1 : -1;
        if (!open) {
          setOpen(true);
          if (step === -1 && filtered.length) setActiveValue(filtered[filtered.length - 1].value);
          return;
        }
        move(step);
        return;
      }
      case 'Enter':
        if (expanded && active) {
          e.preventDefault(); // don't submit a surrounding form
          toggle(active);
        }
        return;
      case 'Escape':
        if (open) {
          e.preventDefault();
          setOpen(false);
        } else if (query) {
          setQuery('');
        }
        return;
      case 'Backspace':
        // Only when there is no text to delete; otherwise Backspace edits the query as usual.
        if (e.currentTarget.value === '' && selected.length > 0) {
          e.preventDefault();
          remove(selected[selected.length - 1]);
        }
        return;
    }
  }

  const noMatches = open && query.trim() !== '' && filtered.length === 0;

  return (
    <div className="ms">
      <label id={labelId} htmlFor={inputId} className="ms-label">
        {label}
      </label>
      <div
        className="ms-field"
        onMouseDown={(e) => {
          // Clicking the empty area of the field focuses the input instead of blurring it.
          if (e.target === e.currentTarget) {
            e.preventDefault();
            inputRef.current?.focus();
            setOpen(true);
          }
        }}
      >
        {selected.length > 0 && (
          <ul className="ms-chips" aria-label={`Selected ${label}`}>
            {selected.map((v) => (
              <li key={v} className="ms-chip">
                <span>{labelOf(v)}</span>
                <button type="button" className="ms-chip-remove" aria-label={`Remove ${labelOf(v)}`} onClick={() => remove(v)}>
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
        <input
          ref={inputRef}
          id={inputId}
          className="ms-input"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={expanded}
          aria-controls={expanded ? listboxId : undefined}
          aria-activedescendant={activeOptionId}
          aria-describedby={limitReached ? limitId : undefined}
          autoComplete="off"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveValue(null); // new matches → first selectable match becomes active
            setOpen(true);
          }}
          onClick={() => setOpen(true)}
          onKeyDown={onKeyDown}
          onBlur={() => setOpen(false)}
        />
      </div>

      {expanded && (
        <ul id={listboxId} role="listbox" aria-multiselectable="true" aria-labelledby={labelId} className="ms-listbox">
          {filtered.map((o, index) => {
            const isSelected = selectedSet.has(o.value);
            const disabled = isDisabled(o);
            return (
              <li
                key={o.value}
                id={optionId(index)}
                role="option"
                aria-selected={isSelected}
                aria-disabled={disabled || undefined}
                className={'ms-option' + (o === active ? ' is-active' : '') + (isSelected ? ' is-selected' : '')}
                onMouseDown={(e) => e.preventDefault()} // keep focus (and the open list) in the input
                onMouseMove={() => {
                  if (o.value !== active?.value) setActiveValue(o.value);
                }}
                onClick={() => toggle(o)}
              >
                {o.label}
              </li>
            );
          })}
        </ul>
      )}

      <div id={limitId} className="ms-limit" aria-live="polite">
        {limitReached ? `Limit reached: you can select up to ${maxSelections} options.` : ''}
      </div>
      <div role="status" className="ms-status">
        {noMatches ? 'No options found' : <span className="sr-only">{announcement}</span>}
      </div>
    </div>
  );
}
