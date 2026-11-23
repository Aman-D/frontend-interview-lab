import { useId, useRef, useState, type ChangeEvent, type ClipboardEvent, type KeyboardEvent } from 'react';
import { fillFrom, isComplete, toSlots, toValue } from './otpUtils';

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

export default function OtpInput({ length = 6, value, onChange, onComplete, label = 'Verification code', disabled = false, error, autoFocus = false }: OtpInputProps) {
  const baseId = useId();
  const labelId = `${baseId}-label`;
  const errorId = `${baseId}-error`;
  const [internal, setInternal] = useState<string[]>(() => toSlots('', length));
  const isControlled = value !== undefined;
  // Derived each render: controlled → parse the prop; uncontrolled → internal state resized to `length`.
  const slots = isControlled ? toSlots(value, length) : Array.from({ length }, (_, i) => internal[i] ?? '');
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const focusBox = (i: number) => {
    const el = inputs.current[Math.max(0, Math.min(i, length - 1))];
    el?.focus();
    el?.select();
  };

  /**
   * The single place that changes the code. Runs in event handlers (not in an effect), so onComplete
   * fires once per user edit — never again on re-render, prop identity changes or StrictMode replays.
   */
  const commit = (next: string[]) => {
    if (next.every((d, i) => d === slots[i])) return;
    if (!isControlled) setInternal(next);
    onChange?.(toValue(next));
    if (isComplete(next)) onComplete?.(next.join(''));
  };

  const write = (i: number, digit: string) => {
    const next = slots.slice();
    next[i] = digit;
    commit(next);
  };

  const handleChange = (i: number, e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      write(i, '');
      return;
    }
    let digits = raw.replace(/[^0-9]/g, '');
    if (!digits) return; // rejected: React restores the controlled value
    const old = slots[i];
    // Typed into a box that already had a digit (caret before or after it): keep only the new one.
    if (old && raw.length === 2 && digits.length === 2 && digits.includes(old)) {
      digits = digits[0] === old ? digits[1] : digits[0];
    }
    if (digits.length === 1) {
      write(i, digits);
      focusBox(i + 1);
      return;
    }
    // Several characters at once: SMS autofill (autocomplete="one-time-code") or a keyboard that
    // inserts text without a paste event. Distribute from this box, like a paste.
    const filled = fillFrom(slots, i, digits);
    commit(filled.slots);
    focusBox(filled.focusIndex);
  };

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'Backspace':
        e.preventDefault();
        if (slots[i]) write(i, '');
        else if (i > 0) {
          write(i - 1, '');
          focusBox(i - 1);
        }
        break;
      case 'Delete':
        e.preventDefault();
        if (slots[i]) write(i, '');
        break;
      case 'ArrowLeft':
        e.preventDefault();
        focusBox(i - 1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        focusBox(i + 1);
        break;
      case 'Home':
        e.preventDefault();
        focusBox(0);
        break;
      case 'End':
        e.preventDefault();
        focusBox(length - 1);
        break;
    }
  };

  const handlePaste = (i: number, e: ClipboardEvent<HTMLInputElement>) => {
    // Always take over: otherwise the browser would insert the whole text into one box.
    e.preventDefault();
    const filled = fillFrom(slots, i, e.clipboardData.getData('text'));
    if (filled.slots === slots) return;
    commit(filled.slots);
    focusBox(filled.focusIndex);
  };

  return (
    <div className="otp">
      <div role="group" aria-labelledby={labelId} className="otp__group">
        <span id={labelId} className="otp__label">
          {label}
        </span>
        <div className="otp__boxes">
          {slots.map((digit, i) => (
            <input
              key={i}
              ref={(el) => {
                inputs.current[i] = el;
              }}
              className="otp__box"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              // Only the first box asks for the SMS code; no maxLength, or autofill would be truncated.
              autoComplete={i === 0 ? 'one-time-code' : 'off'}
              aria-label={`Digit ${i + 1} of ${length}`}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              autoFocus={autoFocus && i === 0}
              disabled={disabled}
              value={digit}
              onChange={(e) => handleChange(i, e)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={(e) => handlePaste(i, e)}
              onFocus={(e) => e.target.select()}
            />
          ))}
        </div>
      </div>
      {error && (
        <p id={errorId} className="otp__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

