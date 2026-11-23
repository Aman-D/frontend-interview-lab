import type { CodingProblem } from '../../schema';
import app from './starter/App.tsx?raw';
import styles from './starter/styles.css?raw';
import starterOtp from './starter/OtpInput.tsx?raw';
import starterUtils from './starter/otpUtils.ts?raw';
import solutionOtp from './solution/OtpInput.tsx?raw';
import solutionUtils from './solution/otpUtils.ts?raw';
import helpers from './tests/helpers.tsx?raw';
import utilsTests from './tests/otpUtils.test.ts?raw';
import utilsHiddenTests from './tests/otpUtils.hidden.test.ts?raw';
import publicTests from './tests/public.test.tsx?raw';
import hiddenTests from './tests/hidden.test.tsx?raw';

const shared = { '/App.tsx': app, '/styles.css': styles };

const problem: CodingProblem = {
  schemaVersion: 1,
  kind: 'coding',
  id: 'react-otp-input',
  slug: 'otp-input',
  title: 'OTP Input',
  track: 'react',
  execution: 'react',
  difficulty: 'medium',
  priority: 'P1',
  seniority: ['Senior', 'SDE-2', 'SDE-3', 'MTS'],
  topics: ['multi-input focus management', 'paste handling', 'SMS autofill', 'controlled vs uncontrolled', 'input validation', 'form a11y'],
  estimatedMinutes: 60,
  conceptIds: ['focus-management', 'keyboard-navigation', 'controlled-uncontrolled', 'derived-state', 'immutable-updates', 'react-state-batching', 'aria-live-regions'],
  research: {
    provenance: 'PUBLISHED_PRACTICE_PROBLEM',
    frequencyConfidence: 'MEDIUM_CONFIDENCE',
    verificationStatus: 'SOURCES_VERIFIED',
    lastVerified: '2026-11-23',
    evidence: [{ sourceId: 'fg-mc', url: 'https://www.frontendgeek.com/frontend-interview/machine-coding-interview', originalTitle: 'OTP Input Design', note: 'Listed under "Component machine coding".' }],
    researchNotes:
      'One curated machine-coding hub lists "OTP Input Design"; it is a widely practised machine-coding prompt but only one source in the registry names it, hence MEDIUM_CONFIDENCE. The 60-minute scope is the canonical N-box version: digits-only input, focus advance, Backspace/arrow navigation, paste distribution from the focused box, SMS autofill (autocomplete="one-time-code") arriving as a multi-character value in one box, onComplete exactly once per completed edit, a controlled/uncontrolled API with a positional value, and accessible labelling with disabled and error states. The single-input alternative, WebOTP, alphanumeric codes, resend timers and server verification are discussed rather than required.',
  },
  spec: {
    summary: 'Build an accessible N-box one-time-code input: digits only, focus advance and Backspace/arrow navigation, paste and SMS autofill distribution, and an onComplete that fires exactly once.',
    description: `Implement \`<OtpInput />\` in **OtpInput.tsx** and the pure helpers in **otpUtils.ts**.

\`\`\`ts
interface OtpInputProps {
  length?: number;                    // number of boxes, default 6
  value?: string;                     // controlled, POSITIONAL: char i = box i, ' ' = empty box
  onChange?: (value: string) => void; // after every change, same positional format
  onComplete?: (code: string) => void;
  label?: string;                     // visible group label, default "Verification code"
  disabled?: boolean;
  error?: string;                     // error message
  autoFocus?: boolean;
}
\`\`\`

**Helpers (otpUtils.ts).** \`toSlots(value, length)\` → array of boxes (\`''\` = empty); \`toValue(slots)\` → positional string with spaces for gaps and **trailing empties dropped** (\`['1','2','','4','','']\` → \`"12 4"\`); \`fillFrom(slots, start, text)\` → \`{ slots, focusIndex }\`: writes the digits of \`text\` (non-digits stripped) from \`start\`, cuts overflow, never mutates, and returns the box after the last written one (or the last box). With no digits it returns the input unchanged and \`focusIndex = start\`.

**Behaviour.**

1. A \`role="group"\` labelled by the visible \`label\`; \`length\` inputs, each \`type="text"\` with \`aria-label="Digit i of N"\`.
2. **Digits only.** A non-digit change is rejected (the box keeps its value, focus stays, \`onChange\` is not called).
3. **Typing** a digit fills the box and moves focus to the next one. Typing into a box that already holds a digit **replaces** it (the input momentarily contains two characters — keep the new one).
4. **Backspace** on a filled box clears it and stays; on an **empty** box it clears the **previous** box and moves focus there. **Delete** clears the current box. **ArrowLeft/ArrowRight** (and Home/End) move focus, stopping at the ends. Handle these in \`keydown\` (tests dispatch synthetic key events, which have no default action).
5. **Paste** (\`onPaste\`, read \`clipboardData.getData('text')\`, call \`preventDefault()\`) distributes the digits from the **focused box** onward — full or partial codes, separators like "123-456" stripped, overflow cut — then focuses the box after the last pasted digit (or the last box).
6. **SMS autofill.** The first box has \`autocomplete="one-time-code"\`; every box has \`inputmode="numeric"\`. Autofill puts the whole code into one box as a single change event — distribute a multi-digit change exactly like a paste. Do **not** set \`maxLength={1}\`, or autofill is truncated.
7. **onComplete(code)** fires **exactly once** when a change makes every box filled, and again only after a later edit that changes the code and leaves it complete. Re-renders, focus moves or a new \`onComplete\` identity must not fire it.
8. **Controlled / uncontrolled.** With \`value\`, render from it and only report changes via \`onChange\` (the parent decides). Without it, keep internal state.
9. **disabled** disables every box. **error** renders the message (with an id), sets \`aria-invalid="true"\` on every box and points their \`aria-describedby\` at the message.

\`App.tsx\` (read-only) is a phone-verification screen that uses the controlled API and a fake server check (the right code is 123456).`,
    technologies: ['React 18', 'TypeScript', 'Clipboard events', 'HTML autocomplete="one-time-code"', 'inputmode'],
    learningObjectives: [
      'Coordinate focus across a list of inputs with refs, without effects',
      'Handle every way text arrives: key typing, replacement, paste, SMS autofill',
      'Fire a completion callback exactly once by deriving it from a user edit rather than an effect',
      'Design a controlled/uncontrolled API with a lossless (positional) value',
      'Apply form accessibility: group label, per-box labels, invalid state and error description',
    ],
    clarifications: [
      { question: 'One input or N separate boxes?', why: 'A single input gets SMS autofill, paste, undo and screen-reader behaviour for free but needs CSS tricks to look like boxes; N boxes are the usual interview version and require explicit focus management.', defaultAssumption: 'N boxes (the canonical machine-coding version); the single-input approach is discussed as an alternative.' },
      { question: 'Digits only, or alphanumeric codes?', why: 'Changes validation, inputmode and the keyboard shown on mobile.', defaultAssumption: 'ASCII digits only; other characters are rejected and stripped from pastes.' },
      { question: 'What should onComplete do on re-renders, and after the user edits a completed code?', why: 'A double-fired onComplete usually means a double-submitted verification request.', defaultAssumption: 'Fire once per user edit that leaves all boxes filled; never on re-render or prop changes.' },
      { question: 'How is the value represented when a middle box is empty?', why: 'A left-packed string ("1245") loses positions and makes controlled mode corrupt the boxes.', defaultAssumption: 'Positional string: character i is box i, a space marks a gap, trailing empties dropped ("12 4").' },
      { question: 'Who verifies the code and shows errors?', why: 'Decides whether the component owns async state.', defaultAssumption: 'The parent: it receives onComplete, verifies, and passes `disabled` and `error` back in.' },
    ],
    scopeDecisions: [
      'Digits only; no alphanumeric mode.',
      'No resend timer, masking (type="password") or WebOTP integration — discussed as follow-ups.',
      'Focus is not redirected to the first empty box when the user clicks a later box.',
      'Verification and error copy are owned by the parent.',
    ],
    requirements: [
      { id: 'group-labels', category: 'accessibility', level: 'MUST', text: 'role="group" labelled by the visible label; each box has aria-label "Digit i of N".' },
      { id: 'digits-only', category: 'functional', level: 'MUST', text: 'Non-digit input is rejected: the box keeps its value, focus stays, onChange is not called.' },
      { id: 'advance', category: 'functional', level: 'MUST', text: 'Typing a digit fills the box and focuses the next one; typing over a filled box replaces its digit.' },
      { id: 'backspace', category: 'functional', level: 'MUST', text: 'Backspace clears a filled box in place; on an empty box it clears the previous box and moves focus back. Delete clears the current box.' },
      { id: 'arrows', category: 'accessibility', level: 'MUST', text: 'ArrowLeft/ArrowRight move focus between boxes and stop at the ends; Home/End jump to the first/last box.' },
      { id: 'paste', category: 'functional', level: 'MUST', text: 'Paste distributes digits from the focused box, strips non-digits, cuts overflow, prevents the default insertion and focuses the box after the last digit.' },
      { id: 'autofill', category: 'functional', level: 'MUST', text: 'First box has autocomplete="one-time-code"; all boxes inputmode="numeric"; a multi-digit change in one box (SMS autofill) is distributed; no maxLength=1.' },
      { id: 'complete-once', category: 'functional', level: 'MUST', text: 'onComplete fires exactly once per edit that leaves every box filled; not on re-render, focus moves or a new callback identity.' },
      { id: 'controlled', category: 'technical', level: 'MUST', text: 'Supports controlled `value` + `onChange` with a positional value ("12 4"); uncontrolled otherwise.' },
      { id: 'pure-utils', category: 'technical', level: 'MUST', text: 'toSlots/toValue/fillFrom are pure and never mutate their input.' },
      { id: 'disabled-error', category: 'accessibility', level: 'MUST', text: 'disabled disables every box; error sets aria-invalid="true" on every box and links the message with aria-describedby.' },
      { id: 'error-announce', category: 'accessibility', level: 'SHOULD', text: 'The error message is announced when it appears (role="alert" or a live region).' },
      { id: 'no-effects', category: 'performance', level: 'SHOULD', text: 'Focus moves and onComplete happen in event handlers — no effect chains or extra renders per keystroke.' },
      { id: 'select-on-focus', category: 'edge-case', level: 'SHOULD', text: 'Focusing a box selects its content so typing replaces it.' },
      { id: 'length-change', category: 'edge-case', level: 'OPTIONAL', text: 'Changing `length` at runtime keeps the existing digits that still fit.' },
      { id: 'tests', category: 'testing', level: 'SHOULD', text: 'Test helpers as pure functions; test the component with real focus, change and paste events, and count onComplete calls.' },
    ],
    constraints: ['React function components and hooks only.', 'No OTP or input-mask libraries.', 'Do not change the props or App.tsx.', 'Boxes must be type="text" inputs (not type="number").'],
    acceptanceCriteria: [
      'All public tests pass (helpers; group and box labels, typing and focus advance, digit validation, Backspace on an empty box, full paste, onComplete once).',
      'All hidden tests pass (overflow, no-digit and immutability helpers; autocomplete/inputmode/no maxLength, SMS autofill, partial paste from an offset, onComplete again only after an edit, arrows and Backspace in place, typing over a digit, disabled/error, controlled mode).',
      'Manual: on a phone, the SMS code suggestion appears above the keyboard and fills all boxes in one tap.',
    ],
    examples: [
      { title: 'Paste from an offset', input: 'focus box 3, paste "9-8 7"', output: 'boxes ["", "", "9", "8", "7", ""], focus on box 6', explanation: 'Non-digits are stripped; distribution starts at the focused box.' },
      { title: 'Backspace on empty', input: 'boxes ["1","2","",…], focus box 3, Backspace', output: 'boxes ["1","","",…], focus on box 2' },
      { title: 'Autofill', input: 'change event on box 1 with value "482913"', output: 'all six boxes filled; onComplete("482913") once' },
      { title: 'Positional value', input: 'boxes ["1","2","","4","",""]', output: 'onChange("12 4")', explanation: 'A left-packed "124" would put 4 in box 3 on the next controlled render.' },
    ],
    manualTests: [
      'Type a code, then Backspace all the way to the start: each press clears one digit and moves left.',
      'Copy "98-76-54" and paste into box 1, then into box 4.',
      'Fill a wrong code: the error appears, is announced, and the boxes are marked invalid; editing clears it.',
      'On iOS/Android, receive an SMS with a code and use the keyboard suggestion.',
      'With a screen reader, Tab into the first box: "Verification code, group, Digit 1 of 6, edit text".',
    ],
  },
  files: {
    entry: '/App.tsx',
    starter: { ...shared, '/OtpInput.tsx': starterOtp, '/otpUtils.ts': starterUtils },
    solution: { ...shared, '/OtpInput.tsx': solutionOtp, '/otpUtils.ts': solutionUtils },
    readonly: ['/App.tsx'],
    support: {},
  },
  tests: [
    { path: '/tests/helpers.tsx', visibility: 'public', kind: 'runtime', source: helpers },
    { path: '/tests/otpUtils.test.ts', visibility: 'public', kind: 'runtime', source: utilsTests },
    { path: '/tests/public.test.tsx', visibility: 'public', kind: 'runtime', source: publicTests },
    { path: '/tests/otpUtils.hidden.test.ts', visibility: 'hidden', kind: 'runtime', source: utilsHiddenTests },
    { path: '/tests/hidden.test.tsx', visibility: 'hidden', kind: 'runtime', source: hiddenTests },
  ],
  hints: [
    'Model the boxes as `string[]` of length N (`\'\'` = empty). Finish the helpers first: `toValue` maps empties to spaces, joins and `trimEnd()`s; `fillFrom` copies the array, strips non-digits with `/[^0-9]/g`, slices to the room left after `start`, writes, and returns `min(start + written, N − 1)` as the next focus.',
    'Derive the boxes each render: `const slots = value !== undefined ? toSlots(value, length) : internal`. Write ONE `commit(next)` function: bail out if nothing changed, `setInternal` only when uncontrolled, call `onChange(toValue(next))`, and call `onComplete` if `next` is complete. Because it runs only from event handlers, onComplete cannot double-fire on re-render.',
    'Keep `inputs = useRef<(HTMLInputElement | null)[]>([])` and a `focusBox(i)` helper that clamps, focuses and selects. In onChange: empty → clear; no digits → ignore; one new digit → write + focus next; several digits (paste-like autofill) → `fillFrom` from this box. When the box already had a digit and the input now holds two characters, keep the one that is not the old digit.',
    'In onKeyDown handle Backspace (filled → clear; empty → clear `i − 1` and focus it), Delete, ArrowLeft/Right, Home/End, each with `preventDefault()`. In onPaste always `preventDefault()` and reuse `fillFrom`. For a11y: `role="group"` + `aria-labelledby`, `aria-label={`Digit ${i + 1} of ${length}`}`, `autoComplete={i === 0 ? \'one-time-code\' : \'off\'}`, `inputMode="numeric"`, and `aria-invalid`/`aria-describedby` when there is an error.',
  ],
  solution: {
    initialApproach:
      'The state is an array of N single-character strings, and everything else is a function of it. All the ways text can arrive — a key press, typing over a digit, a paste, an SMS autofill — are normalised into "write these digits starting at box i", implemented once in a pure `fillFrom` helper. One `commit` function applies a new array, reports it and decides about completion; focus is moved imperatively through an array of refs right after the commit, inside the same event handler.',
    bruteForce:
      'A first attempt stores `otp` in state, sets `maxLength={1}` on every input, takes `e.target.value` as the digit and moves focus in a `useEffect` that watches `otp`, and fires `onComplete` from another effect when `otp.join("").length === N`. Problems: maxLength=1 truncates SMS autofill to the first digit; paste puts at most one character in a box; typing over a filled box is blocked; the focus effect can\'t tell which box changed, so Backspace and paste jump to the wrong place; the completion effect fires again whenever `onComplete` changes identity (an inline arrow in the parent) or the component re-renders under StrictMode; a left-packed `join("")` makes a cleared middle box shift every later digit in controlled mode; and `type="number"` accepts "e", "+" and "-" and shows spinners.',
    optimizedApproach: `**Array model, one commit path, everything in event handlers.**

\`\`\`ts
const slots = isControlled ? toSlots(value, length) : internal;   // derived, never synced
const commit = (next: string[]) => {
  if (next.every((d, i) => d === slots[i])) return;               // no-op edits fire nothing
  if (!isControlled) setInternal(next);
  onChange?.(toValue(next));                                       // positional: "12 4"
  if (isComplete(next)) onComplete?.(next.join(''));               // once per completing edit
};
\`\`\`

- **onChange** per box: \`''\` → clear; no digits → reject (React restores the controlled value); one digit → write and focus \`i + 1\`; two characters where one is the old digit → keep the new one; more → \`fillFrom(slots, i, digits)\` (SMS autofill).
- **onKeyDown**: Backspace/Delete/arrows/Home/End with \`preventDefault()\`, so behaviour doesn't depend on the caret position or on default actions.
- **onPaste**: \`preventDefault()\` and the same \`fillFrom\` — paste and autofill share one tested code path.
- **Focus** moves in the handler through \`inputs.current[i].focus()\` + \`select()\`; no effect, no extra render.
- **Accessibility**: group + visible label, "Digit i of N" per box, \`autocomplete="one-time-code"\` on the first box only, \`inputmode="numeric"\` everywhere, \`aria-invalid\` + \`aria-describedby\` → an alert with the error.`,
    walkthrough: `1. **otpUtils**: \`isDigit\`, \`toSlots\` (positional parse), \`toValue\` (spaces for gaps, \`trimEnd\`), \`isComplete\`, \`fillFrom\` (clamp start, strip, cut, copy, write, next focus). All pure.
2. **State**: \`internal\` (\`string[]\`) only used when \`value\` is undefined; \`slots\` derived each render (also resized when \`length\` changes).
3. **commit(next)**: equality bail-out → \`setInternal\` (uncontrolled) → \`onChange(toValue(next))\` → \`onComplete(code)\` if complete. Because of the bail-out, typing the same digit over itself or pasting nothing fires nothing.
4. **handleChange(i)**: covers typing, typing over a digit and autofill (see above). Rejected input calls nothing, so React reverts the DOM value to the state value after the event.
5. **handleKeyDown(i)**: Backspace — filled: clear in place; empty and \`i > 0\`: clear \`i − 1\`, focus it. Delete — clear in place. Arrows/Home/End — \`focusBox\` with clamping.
6. **handlePaste(i)**: \`preventDefault()\`, \`fillFrom(slots, i, clipboardData.getData('text'))\`, commit, focus \`focusIndex\`.
7. **Render**: group with \`aria-labelledby\`; inputs with \`type="text"\`, \`inputMode="numeric"\`, \`pattern="[0-9]*"\`, \`autoComplete\` (first: one-time-code, others: off), labels, invalid/description, \`onFocus\` → \`select()\`; error \`<p role="alert">\` with an id.

Why no effect for onComplete? An effect runs after *renders*, not after *edits*: it re-fires when the callback identity changes, when StrictMode replays effects, or when a controlled parent re-renders with the same complete value. Deriving completion inside the edit itself is both simpler and exactly-once.`,
    complexity:
      'Every edit is O(N) (copy the array, compare, join) with N ≈ 4–8 — effectively constant. One state update and one render per edit; focus moves add no renders. Memory: N inputs and refs.',
    edgeCases:
      '- SMS autofill writes the whole code into the first box (single change event) — distributing multi-digit changes handles it; on some platforms it may also land in the focused box, which the same code handles.\n- Typing over a filled box: the input briefly contains two characters; keep the one that isn\'t the old digit (both equal → same digit).\n- Paste with separators ("123-456", "123 456"), with letters ("Code: 123456"), longer than the remaining boxes, or with no digits at all.\n- Backspace in the first empty box: nothing before it — do nothing.\n- Controlled parent that rejects or transforms changes: the component renders whatever `value` says; it must not keep a shadow copy that diverges.\n- A middle box cleared: a positional value keeps every other digit in place.\n- `length` changing at runtime: keep digits that still fit.\n- Mobile keyboards with autocorrect/IME may send composition events or multi-character inputs; `type="text"` + numeric inputmode avoids most of it.\n- Disabled while verifying: inputs keep their values and can\'t be edited; re-enable on error and focus the first box (parent decision).',
    alternatives:
      '- **Single input** (`maxLength={N}`, `autocomplete="one-time-code"`, letter-spacing or a background of boxes, or N fake boxes rendered over a transparent input): native paste, undo, caret, selection, SMS autofill and screen-reader behaviour for free, one tab stop, no focus juggling; harder to style per box and to show a "current box" highlight. Often the better production choice.\n- **WebOTP API** (`navigator.credentials.get({ otp: { transport: ["sms"] } })` with an SMS ending in `@domain #code`): reads the code programmatically on supporting Android browsers, then you fill the boxes; still keep `one-time-code` autofill for iOS.\n- **Uncontrolled-only** API with `onComplete` and a ref `clear()` method: simpler, but forms that validate or reset from outside want a controlled `value`.\n- **Left-packed value** ("124"): simpler for callers, but loses positions; acceptable only if the UI forbids gaps (e.g. focus always jumps to the first empty box).\n- **Libraries** (input-otp, react-otp-input) handle many browser quirks, including password managers and IME.',
    tradeoffs:
      '- N boxes give a clear per-digit UI but N tab stops; consider `tabIndex=-1` on all but the current box (roving) if the product wants one tab stop.\n- `preventDefault` on Backspace makes behaviour deterministic but bypasses native undo history.\n- Firing onComplete synchronously in the handler is exactly-once and simple; if verification is async the parent must also guard against a second completion while the first request is pending (disable the input).\n- A positional value with spaces is lossless but slightly unusual; document it, or expose `onChange(slots: string[])` instead.\n- `role="alert"` announces errors immediately but can interrupt; `aria-live="polite"` is gentler.\n- `select()` on focus makes typing replace naturally but can fight with some mobile keyboards; test on devices.',
    commonMistakes:
      '- `maxLength={1}` on the first box: SMS autofill and paste are truncated to one digit.\n- `type="number"`: allows "e", "+", "-", ".", shows spinners, and `value` is "" for invalid input.\n- Firing onComplete in an effect (fires again on re-render/new callback identity) or inside a `setState` updater (StrictMode double-invokes updaters).\n- Moving focus in an effect keyed on the array: it can\'t know which box changed.\n- Backspace handled only via onChange: on an empty box there is no change event, so focus never moves back.\n- Paste handled by onChange only: the browser inserts the whole text into one box.\n- Ignoring the focused offset when pasting (always starting at box 0).\n- Mutating the state array (`otp[i] = d; setOtp(otp)`): React bails out and nothing re-renders.\n- Left-packing the value in controlled mode, shifting digits after a middle box is cleared.\n- Placeholder-only labelling or no group label for screen readers.',
    testingStrategy:
      'Unit-test the helpers with plain arrays (gaps, trailing empties, offsets, overflow, no digits, immutability). For the component, simulate exactly what browsers send: `fireEvent.change` with the box\'s new full value (one char, two chars when typing over a digit, the whole code for autofill), `fireEvent.paste` with a fake `clipboardData.getData`, and `keyDown` for Backspace/arrows (synthetic key events have no default action, so the component must act on them). Always focus the box first so focus assertions are real (`document.activeElement`). Count `onComplete` calls across typing, navigation, re-render with a new callback, a no-op edit and a real edit. Test controlled mode with a parent that ignores changes and with a stateful parent.',
    seniorFollowUps:
      '- Rebuild it as a single input with visual boxes; what do you gain for accessibility and autofill?\n- Integrate WebOTP with an AbortController so the request is cancelled on unmount or when the user types manually.\n- Add a resend timer and rate limiting; where does that state live?\n- Make it work inside a `<form>`: a hidden input with `name`, `required`, native validation and reset.\n- Support alphanumeric codes and case normalisation; what changes in inputmode and validation?\n- Password-manager and IME quirks: composition events, autocorrect, and paste from SMS apps that add text around the code.',
  },
  followUps: [
    { id: 'f1', level: 'definition', question: 'What do autocomplete="one-time-code" and inputmode="numeric" do, and why not use type="number"?', expectedConcepts: ['browser/OS offers the SMS code', 'numeric virtual keyboard', 'type=number allows e/+/-, spinners, no leading-zero semantics', 'codes are strings not numbers'], sourceIds: ['mdn-autocomplete-attr', 'mdn-inputmode', 'webdev-sms-otp'] },
    { id: 'f2', level: 'mechanism', question: 'Why must the paste handler call preventDefault(), and how do you read the pasted text?', expectedConcepts: ['default action inserts text into the focused input', 'clipboardData.getData("text")', 'paste event fires before insertion', 'distribute and move focus manually'], sourceIds: ['mdn-paste-event'] },
    { id: 'f3', level: 'application', question: 'Your onComplete fires twice in development and again whenever the parent re-renders. What is wrong and how do you fix it?', expectedConcepts: ['effect-based completion', 'StrictMode replays effects', 'callback identity in deps', 'fire from the event handler that completes the code', 'parent disables while verifying'], sourceIds: ['react-no-effect', 'react-sync-effects'] },
    { id: 'f4', level: 'edge-cases', question: 'SMS autofill puts "482913" into the first box. Walk through what happens with maxLength={1} and with your implementation.', expectedConcepts: ['maxLength truncates to "4"', 'single change event with full value', 'distribute from the box', 'onComplete once', 'focus last box'], sourceIds: ['webdev-sms-otp', 'mdn-autocomplete-attr'] },
    { id: 'f5', level: 'production', question: 'Would you ship N boxes or a single input in production? Discuss accessibility, autofill, paste and styling.', expectedConcepts: ['single input: one tab stop, native paste/undo/autofill, SR reads one field', 'N boxes: per-box styling, focus juggling', 'overlay technique', 'group labelling'], sourceIds: ['webdev-sms-otp'] },
    { id: 'f6', level: 'architecture', question: 'Design the verification flow around this component: WebOTP, resend with cooldown, rate limits, error states and form submission.', expectedConcepts: ['parent owns async state', 'AbortController for WebOTP and requests', 'disable while verifying', 'error with live region', 'hidden form field / native form integration'], sourceIds: ['webdev-sms-otp', 'mdn-abortcontroller'] },
  ],
  mcqs: [
    {
      id: 'm1',
      question: 'Each box has maxLength={1}. The phone offers the SMS code "482913" and the user taps it while the first box is focused. What ends up in the boxes?',
      options: [
        { id: 'a', text: 'All six digits, one per box', explanation: 'Only if your code distributes a multi-character value — and maxLength stops that value from ever arriving.' },
        { id: 'b', text: 'Only "4" in the first box', explanation: 'Correct — autofill writes the whole code into one input, and maxLength=1 truncates it to its first character.' },
        { id: 'c', text: 'Nothing; autofill is blocked by maxLength', explanation: 'The value is truncated, not blocked.' },
        { id: 'd', text: 'The browser splits the code across inputs that share autocomplete="one-time-code"', explanation: 'Browsers fill a single field; splitting across boxes is the component\'s job.' },
      ],
      correctOptionId: 'b',
      explanation: 'One-time-code autofill targets one field. A multi-box OTP must accept a multi-character value in that box (no maxLength=1) and distribute it.',
      sourceIds: ['webdev-sms-otp', 'mdn-autocomplete-attr'],
    },
    {
      id: 'm2',
      question: 'Which implementation fires onComplete exactly once per completed edit?',
      code: `// A
useEffect(() => { if (digits.every(Boolean)) onComplete(digits.join('')); }, [digits, onComplete]);
// B
setDigits((prev) => { const next = write(prev); if (isDone(next)) onComplete(next.join('')); return next; });
// C
const next = write(digits); setDigits(next); if (isDone(next)) onComplete(next.join(''));`,
      options: [
        { id: 'a', text: 'A', explanation: 'The effect re-runs whenever onComplete changes identity (an inline arrow in the parent) and twice on mount under StrictMode in development.' },
        { id: 'b', text: 'B', explanation: 'Updater functions must be pure; StrictMode calls them twice in development, so onComplete fires twice.' },
        { id: 'c', text: 'C', explanation: 'Correct — the side effect happens once, in the event handler that caused the edit (add a no-change bail-out for same-digit edits).' },
      ],
      correctOptionId: 'c',
      explanation: 'Side effects tied to a user action belong in the event handler. Effects run after renders, and state updaters must stay pure.',
      sourceIds: ['react-no-effect', 'react-queueing'],
    },
    {
      id: 'm3',
      question: 'Why use type="text" with inputmode="numeric" instead of type="number" for OTP boxes?',
      options: [
        { id: 'a', text: 'type="number" cannot show a numeric keyboard on mobile', explanation: 'It does show one; the problems are elsewhere.' },
        { id: 'b', text: 'An OTP is a string of digits, not a quantity: type="number" accepts e/+/-, shows spinners, and reports "" for partial input', explanation: 'Correct — inputmode only chooses the virtual keyboard while the field keeps text semantics.' },
        { id: 'c', text: 'inputmode="numeric" rejects non-digit characters', explanation: 'inputmode is only a keyboard hint; validation is still your job.' },
        { id: 'd', text: 'type="number" does not fire change events', explanation: 'It fires input/change events like other inputs.' },
      ],
      correctOptionId: 'b',
      explanation: 'inputmode affects the virtual keyboard only. Codes with leading zeros are strings; type="number" adds number semantics and UI that do not fit.',
      sourceIds: ['mdn-inputmode', 'webdev-sms-otp'],
    },
  ],
};

export default problem;
