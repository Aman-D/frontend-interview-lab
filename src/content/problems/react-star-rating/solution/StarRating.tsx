import { useEffect, useRef, useState, type KeyboardEvent } from 'react';

export interface StarRatingProps {
  /** Number of stars. Default 5. Invalid values fall back to a sane integer ≥ 1. */
  max?: number;
  /** Controlled value (0 = no rating). When provided, the parent owns the state. */
  value?: number;
  /** Initial value for uncontrolled usage. Ignored when `value` is provided. */
  defaultValue?: number;
  /** Called with the new value whenever the user changes the rating. */
  onChange?: (value: number) => void;
  /** Render a non-interactive, accessible representation. */
  readOnly?: boolean;
  /** Accessible name of the group. Default: "Rating". */
  label?: string;
  /** OPTIONAL: clicking the current value again clears the rating (calls onChange(0)). Default false. */
  allowClear?: boolean;
}

const DEFAULT_MAX = 5;

/** max: finite integer ≥ 1, otherwise the default. */
export function normalizeMax(max: number | undefined): number {
  if (typeof max !== 'number' || !Number.isFinite(max)) return DEFAULT_MAX;
  return Math.max(1, Math.floor(max));
}

/** value: whole stars in [0, max]; NaN / non-numbers become 0. */
export function clampRating(value: unknown, max: number): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0;
  return Math.min(max, Math.max(0, Math.round(value)));
}

const starName = (n: number) => `${n} ${n === 1 ? 'star' : 'stars'}`;

export default function StarRating({
  max: maxProp = DEFAULT_MAX,
  value,
  defaultValue = 0,
  onChange,
  readOnly = false,
  label = 'Rating',
  allowClear = false,
}: StarRatingProps) {
  const max = normalizeMax(maxProp);
  const isControlled = value !== undefined;

  // Uncontrolled state is only *initialised* from defaultValue (like <input defaultValue>).
  const [internal, setInternal] = useState(() => clampRating(defaultValue, normalizeMax(maxProp)));
  // Clamp at read time too, so a shrinking `max` can never leave an out-of-range value on screen.
  const current = clampRating(isControlled ? value : internal, max);

  const [hovered, setHovered] = useState<number | null>(null);
  const starRefs = useRef<(HTMLSpanElement | null)[]>([]);

  // Dev-only warning, mirroring React's own warning for <input>.
  const wasControlled = useRef(isControlled);
  useEffect(() => {
    if (wasControlled.current !== isControlled) {
      console.warn(`StarRating switched from ${wasControlled.current ? 'controlled' : 'uncontrolled'} to ${isControlled ? 'controlled' : 'uncontrolled'}. Decide on one for the lifetime of the component.`);
      wasControlled.current = isControlled;
    }
  }, [isControlled]);

  const commit = (next: number) => {
    const clamped = clampRating(next, max);
    if (clamped === current) return;
    if (!isControlled) setInternal(clamped);
    onChange?.(clamped);
  };

  if (readOnly) {
    // One image with a full sentence is far less noisy for screen readers than N "star" nodes.
    return (
      <span className="star-rating star-rating--readonly" role="img" aria-label={`${current} out of ${max} stars`}>
        {Array.from({ length: max }, (_, i) => (
          <span key={i} className="star" aria-hidden="true" data-filled={i + 1 <= current ? 'true' : 'false'}>
            ★
          </span>
        ))}
      </span>
    );
  }

  const display = hovered ?? current;
  // Roving tabindex: exactly one star is tabbable — the checked one, or the first when nothing is checked.
  const tabStop = current > 0 ? current : 1;

  const selectAndFocus = (n: number) => {
    setHovered(null); // the keyboard takes over from a stale mouse preview
    commit(n);
    starRefs.current[n]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLSpanElement>, n: number) => {
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        selectAndFocus(n >= max ? 1 : n + 1); // APG radio group: wraps from last to first
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        selectAndFocus(n <= 1 ? max : n - 1);
        break;
      case ' ':
        e.preventDefault(); // don't scroll the page
        if (n !== current) selectAndFocus(n);
        break;
    }
  };

  const onClick = (n: number) => {
    if (allowClear && n === current) {
      setHovered(null); // otherwise the hover preview would hide the fact that it was cleared
      commit(0);
    } else {
      commit(n);
    }
  };

  return (
    <div className="star-rating" role="radiogroup" aria-label={label} onMouseLeave={() => setHovered(null)}>
      {Array.from({ length: max }, (_, i) => {
        const n = i + 1;
        return (
          <span
            key={n}
            ref={(el) => {
              starRefs.current[n] = el;
            }}
            className="star"
            role="radio"
            aria-checked={n === current}
            aria-label={starName(n)}
            tabIndex={n === tabStop ? 0 : -1}
            data-filled={n <= display ? 'true' : 'false'}
            onClick={() => onClick(n)}
            onMouseEnter={() => setHovered(n)}
            onKeyDown={(e) => onKeyDown(e, n)}
          >
            <span aria-hidden="true">★</span>
          </span>
        );
      })}
    </div>
  );
}
