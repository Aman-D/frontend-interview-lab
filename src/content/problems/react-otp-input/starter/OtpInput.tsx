import { useState } from 'react';

export interface OtpInputProps {
  /** Number of boxes. Default 6. */
  length?: number;
  /** Controlled value: positional, character i is box i, a space marks an empty box. */
  value?: string;
  /** Called with the new positional value after every change. */
  onChange?: (value: string) => void;
  /** Called with the full code when the last empty box is filled — once per completed edit. */
  onComplete?: (code: string) => void;
  /** Visible group label. Default "Verification code". */
  label?: string;
  disabled?: boolean;
  /** Error message; marks every box invalid and describes them. */
  error?: string;
  autoFocus?: boolean;
}

// TODO: build the OTP input.
// - role="group" labelled by the visible label; each box aria-label "Digit i of N"
// - digits only; typing moves focus forward; Backspace on an empty box clears the previous one and moves back
// - ArrowLeft/ArrowRight move focus; paste distributes digits from the focused box (see otpUtils.fillFrom)
// - first box: autocomplete="one-time-code"; all boxes inputmode="numeric"; SMS autofill puts the whole code in one box
// - onComplete(code) once when every box is filled; controlled `value` / `onChange`; disabled; error message
export default function OtpInput({ length = 6, onChange }: OtpInputProps) {
  const [digits, setDigits] = useState<string[]>(() => Array(length).fill(''));
  return (
    <div>
      {digits.map((d, i) => (
        <input
          key={i}
          value={d}
          onChange={(e) => {
            const next = digits.slice();
            next[i] = e.target.value.slice(-1);
            setDigits(next);
            onChange?.(next.join(''));
          }}
        />
      ))}
    </div>
  );
}
