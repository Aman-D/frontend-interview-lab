import { useState } from 'react';

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

/*
 * Contract the tests rely on (see the problem description):
 * - interactive: role="radiogroup" named {label}; each star is role="radio" named "1 star", "2 stars", …
 *   with aria-checked, a roving tabIndex (0 on the checked star, or on the first star when nothing is checked)
 *   and data-filled="true" | "false" for the visual (hover-preview aware) state
 * - readOnly: a single role="img" element named "N out of MAX stars" and no radios
 */
export default function StarRating({ max = 5, defaultValue = 0, label = 'Rating' }: StarRatingProps) {
  const [value, setValue] = useState(defaultValue);

  // TODO: controlled vs uncontrolled, hover preview, keyboard (APG radio group), readOnly, clamping
  return (
    <div className="star-rating" aria-label={label}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className="star" data-filled={i < value ? 'true' : 'false'} onClick={() => setValue(i + 1)}>
          ★
        </span>
      ))}
    </div>
  );
}
