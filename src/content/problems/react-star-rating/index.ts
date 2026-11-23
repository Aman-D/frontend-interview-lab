import type { CodingProblem } from '../../schema';
import starterRating from './starter/StarRating.tsx?raw';
import starterApp from './starter/App.tsx?raw';
import styles from './starter/styles.css?raw';
import solutionRating from './solution/StarRating.tsx?raw';
import publicTests from './tests/public.test.tsx?raw';
import hiddenTests from './tests/hidden.test.tsx?raw';

const shared = { '/App.tsx': starterApp, '/styles.css': styles };

const problem: CodingProblem = {
  schemaVersion: 1,
  kind: 'coding',
  id: 'react-star-rating',
  slug: 'star-rating',
  title: 'Star Rating',
  track: 'react',
  execution: 'react',
  difficulty: 'easy',
  priority: 'P1',
  seniority: ['Senior', 'SDE-2', 'SDE-3', 'MTS'],
  topics: ['controlled vs uncontrolled', 'radio group a11y', 'roving tabindex', 'hover preview', 'input validation'],
  estimatedMinutes: 40,
  conceptIds: ['keyboard-navigation', 'focus-management', 'event-propagation'],
  research: {
    provenance: 'PUBLISHED_PRACTICE_PROBLEM',
    frequencyConfidence: 'HIGH_CONFIDENCE',
    verificationStatus: 'SOURCES_VERIFIED',
    lastVerified: '2026-11-23',
    evidence: [
      { sourceId: 'fih-ui', url: 'https://www.frontendinterviewhandbook.com/coding/build-front-end-user-interfaces', originalTitle: 'Star Rating', note: 'Listed among the "Components" UI coding questions.' },
      { sourceId: 'fg-mc', url: 'https://www.frontendgeek.com/frontend-interview/machine-coding-interview', originalTitle: 'Star Component', note: 'Listed under "Component machine coding".' },
    ],
    researchNotes:
      'Two independent machine-coding listings. The basic version (render N stars, click to set, hover to preview) is a warm-up. To make it senior-level, this problem adds a component API that works both controlled and uncontrolled, the APG radio-group keyboard model with roving tabindex, an accessible read-only mode and input validation. Half-star precision is an OPTIONAL requirement discussed in the solution; the reference implementation uses whole stars. All statements, code and tests are original.',
  },
  spec: {
    summary: 'Build a reusable star-rating input that works controlled and uncontrolled, previews on hover, follows the APG radio-group keyboard model and has an accessible read-only mode.',
    description: `Implement \`<StarRating />\` in **StarRating.tsx**:

\`\`\`ts
<StarRating max={5} value? defaultValue? onChange? readOnly? label? allowClear? />
\`\`\`

**Behaviour**

1. Renders \`max\` stars (default 5). Clicking star *n* sets the rating to *n* and calls \`onChange(n)\`.
2. **Controlled vs uncontrolled**: if \`value\` is provided, the component renders exactly that and only reports changes through \`onChange\`. Otherwise it keeps its own state, initialised once from \`defaultValue\` (default 0 = not rated).
3. **Hover preview**: hovering star *n* visually fills stars 1…n. Leaving the group restores the actual value. Hovering never calls \`onChange\`.
4. **Validation**: \`value\`/\`defaultValue\` are rounded to whole stars and clamped to \`[0, max]\`; \`NaN\` becomes 0. \`max\` is floored to an integer ≥ 1; non-finite values fall back to 5.
5. **Optional**, \`allowClear\`: clicking the star that is already selected clears the rating (\`onChange(0)\`). Without it, that click does nothing.

**Accessibility: APG radio group**

- Container: \`role="radiogroup"\` with \`aria-label={label}\` (default "Rating").
- Each star: \`role="radio"\`, \`aria-checked\`, accessible name **"1 star"**, **"2 stars"**, …
- **Roving tabindex**: only one star has \`tabIndex=0\`: the checked star, or the first star when nothing is checked. All others have \`-1\`.
- **ArrowRight/ArrowDown** check the next star and move focus to it; **ArrowLeft/ArrowUp** go to the previous one. Both wrap at the ends. **Space** checks the focused star.
- Each star exposes its visual state as \`data-filled="true" | "false"\` (taking the hover preview into account). This is what the tests read instead of colours.

**Read-only**: \`readOnly\` renders a single \`role="img"\` element named **"3 out of 5 stars"**, with no radios and no handlers.

The tests send synthetic key events, which do not trigger a browser’s built-in radio-button behaviour. Implement the keyboard model yourself, on elements with \`role="radio"\` as in the starter. \`App.tsx\` is read-only.`,
    technologies: ['React 18', 'TypeScript', 'WAI-ARIA radio group', 'Roving tabindex'],
    learningObjectives: [
      'Design a component that works both controlled and uncontrolled, the way native inputs do',
      'Separate committed state (value) from transient UI state (hover preview)',
      'Implement the APG radio-group keyboard model with roving tabindex and programmatic focus',
      'Validate and clamp numeric props at the boundary so the UI can never show an impossible value',
      'Choose a non-interactive accessible representation for read-only data',
    ],
    clarifications: [
      { question: 'Does the parent own the value, or does the component?', why: 'Forms and stores usually own the value (controlled), but quick usages want it to just work (uncontrolled). The API decides who has the source of truth.', defaultAssumption: 'Support both, like <input>: `value` + `onChange` for controlled, `defaultValue` for uncontrolled. Switching between the two after mount is a bug and gets a dev warning.' },
      { question: 'Which ARIA pattern should the stars use: buttons, a slider, or a radio group?', why: 'Each pattern has a different keyboard model and announcement. Buttons give N tab stops and no "checked" state. A slider fits continuous ranges better.', defaultAssumption: 'An APG radio group: a single choice from a small set, one tab stop, arrows move and select, and screen readers say "3 stars, radio button, checked, 3 of 5".' },
      { question: 'Can the user remove a rating once given?', why: 'Radio buttons normally cannot be unchecked, but review forms often need "no rating".', defaultAssumption: 'Opt-in via `allowClear`: clicking the current star clears it.' },
      { question: 'Are half stars needed?', why: 'Half stars double the number of choices and change both the hit-testing and the accessible names.', defaultAssumption: 'Whole stars. Half-star precision is an OPTIONAL extension (see solution).' },
      { question: 'What should read-only ratings (e.g. product averages) look like to assistive technology?', why: 'Five separate "star" images or disabled radios are noisy and imply the user could interact.', defaultAssumption: 'One role="img" element labelled "N out of MAX stars".' },
    ],
    scopeDecisions: [
      'Whole-star precision. Half stars are discussed, not implemented, in the reference.',
      'Characters (★) are used instead of SVG icons; the visual state is exposed via data-filled.',
      'No disabled state and no form integration (hidden input / name) in the core task. Both are follow-ups.',
      'Arrow keys wrap at the ends, following the APG radio-group pattern literally.',
    ],
    requirements: [
      { id: 'render-max', category: 'functional', level: 'MUST', text: 'Renders `max` stars (default 5) as role="radio" elements named "1 star", "2 stars", …, inside a labelled role="radiogroup".' },
      { id: 'click-sets', category: 'functional', level: 'MUST', text: 'Clicking star n calls onChange(n). In uncontrolled mode it also checks star n.' },
      { id: 'controlled', category: 'technical', level: 'MUST', text: 'With `value`, the rendered rating always equals the prop; clicks only call onChange.' },
      { id: 'uncontrolled', category: 'technical', level: 'MUST', text: 'Without `value`, state starts from defaultValue and later defaultValue changes are ignored.' },
      { id: 'hover-preview', category: 'functional', level: 'MUST', text: 'Hovering star n fills stars 1…n (data-filled); leaving the group restores the real value; hover never calls onChange.' },
      { id: 'roving-tabindex', category: 'accessibility', level: 'MUST', text: 'Exactly one star has tabIndex 0 (checked star, or first when none); the others have -1.' },
      { id: 'arrow-keys', category: 'accessibility', level: 'MUST', text: 'Right/Down and Left/Up check the next/previous star, wrap at the ends, and move DOM focus to it.' },
      { id: 'space', category: 'accessibility', level: 'SHOULD', text: 'Space checks the focused star if it is not already checked.' },
      { id: 'read-only', category: 'accessibility', level: 'MUST', text: 'readOnly renders a single role="img" named "N out of MAX stars", with no radios.' },
      { id: 'clamp', category: 'edge-case', level: 'MUST', text: 'value/defaultValue are rounded and clamped to [0, max]; NaN → 0; max is an integer ≥ 1.' },
      { id: 'allow-clear', category: 'functional', level: 'OPTIONAL', text: 'With allowClear, clicking the current star clears the rating (onChange(0)) and the hover preview.' },
      { id: 'no-redundant-change', category: 'edge-case', level: 'SHOULD', text: 'onChange is not called when the value would not change.' },
      { id: 'mode-switch-warning', category: 'technical', level: 'OPTIONAL', text: 'Warn in development when a component switches between controlled and uncontrolled.' },
      { id: 'half-stars', category: 'functional', level: 'OPTIONAL', text: 'Support `precision={0.5}`: half-star hit areas, names like "2.5 stars", and half-filled visuals.' },
      { id: 'cheap-renders', category: 'performance', level: 'SHOULD', text: 'Hovering updates one piece of state; no effects run on hover and no per-star components re-mount.' },
      { id: 'tests-by-role', category: 'testing', level: 'SHOULD', text: 'Tests query radios by accessible name and assert aria-checked, tabIndex and focus rather than CSS classes.' },
    ],
    constraints: ['React function components and hooks only.', 'No third-party libraries.', 'Keep the props and accessible names listed above.'],
    acceptanceCriteria: [
      'All public tests pass (roles/names, max, uncontrolled, controlled, hover preview, arrow keys + focus, read-only).',
      'All hidden tests pass (roving tabindex, wrapping, Space, clamping, allowClear, parent-owned state, defaultValue changes ignored, hover never commits).',
      'Manual: with a screen reader, tabbing in announces the group label and "N stars, radio button, checked".',
    ],
    examples: [
      { title: 'Controlled', input: 'value=2; user clicks star 4; parent does not update', output: 'onChange(4) is called; star 2 stays checked', explanation: 'The parent owns the state. This is how a form can reject or transform a value.' },
      { title: 'Hover', input: 'value=2; hover star 4; leave', output: 'filled: ★★★★☆ → ★★☆☆☆; no onChange' },
      { title: 'Clamping', input: 'value=9, max=5', output: '5 stars checked; read-only label "5 out of 5 stars"' },
      { title: 'Keyboard wrap', input: 'value=5; ArrowRight', output: 'Star 1 is checked and focused; onChange(1)' },
    ],
    manualTests: [
      'Tab to the first rating: focus lands on the checked star, not on star 1.',
      'Use the arrow keys: the rating and the focus ring move together; Tab leaves the group in one step.',
      'Hover across the stars, then move the mouse away: the preview disappears and the real value comes back.',
      'In the controlled example, click the current star to clear it (allowClear).',
      'With VoiceOver/NVDA, the read-only rating is announced once as "3 out of 5 stars, image".',
    ],
  },
  files: {
    entry: '/App.tsx',
    starter: { ...shared, '/StarRating.tsx': starterRating },
    solution: { ...shared, '/StarRating.tsx': solutionRating },
    readonly: ['/App.tsx'],
    support: {},
  },
  tests: [
    { path: '/tests/public.test.tsx', visibility: 'public', kind: 'runtime', source: publicTests },
    { path: '/tests/hidden.test.tsx', visibility: 'hidden', kind: 'runtime', source: hiddenTests },
  ],
  hints: [
    'Controlled/uncontrolled in three lines: `const isControlled = value !== undefined; const [internal, setInternal] = useState(defaultValue); const current = isControlled ? value : internal;` Only call `setInternal` when uncontrolled, and always call `onChange`.',
    'Keep hover separate from the value: `const [hovered, setHovered] = useState<number | null>(null)` and `display = hovered ?? current`. Put `onMouseLeave` on the group, not on each star, so moving between stars doesn’t flicker.',
    'Roving tabindex: `tabIndex={n === (current || 1) ? 0 : -1}`. Store star elements in a ref array and call `.focus()` on the new star inside the keydown handler. The element already exists, so no effect is needed.',
    'Clamp once at the boundary with a pure helper (`Math.min(max, Math.max(0, Math.round(v)))`, NaN → 0) and apply it to both the controlled value and the initial uncontrolled value. Then add the readOnly branch: one `role="img"` with a sentence label.',
  ],
  solution: {
    initialApproach:
      'Treat the component like a native input. The committed value comes from `value` (controlled) or internal state (uncontrolled), while hover is a separate, purely visual state. Accessibility follows the APG radio group: one tab stop, arrows both move focus and select.',
    bruteForce:
      'A row of five `<button>`s with an `onClick` that sets local state works visually. However, it can’t be controlled by a form, it gives keyboard users five tab stops with no "checked" semantics, and it usually implements hover by toggling CSS classes imperatively. It also often mirrors `value` into state with an effect, which lags one render behind and overwrites what the user picked.',
    optimizedApproach: `**Single source of truth per mode**

\`\`\`ts
const isControlled = value !== undefined;
const [internal, setInternal] = useState(() => clampRating(defaultValue, max));
const current = clampRating(isControlled ? value : internal, max);
\`\`\`

No effect copies props into state, so a controlled parent always wins and an uncontrolled component never resets when \`defaultValue\` changes (same semantics as \`<input defaultValue>\`).

**commit(next)**: clamp, return early if nothing changes, call \`setInternal\` only when uncontrolled, and always call \`onChange\`.

**Hover**: \`hovered: number | null\`, \`display = hovered ?? current\`. Each star's \`onMouseEnter\` sets it, and a single \`onMouseLeave\` on the radiogroup clears it. Because mouseleave does not bubble and fires only when the pointer leaves the group itself, moving between stars never briefly resets the preview.

**APG radio group**: \`role="radiogroup"\` + \`aria-label\`. Each star is \`role="radio"\` with \`aria-checked\` and a name ("3 stars"). Roving tabindex puts the only tab stop on the checked star (or the first). Arrow keys call \`commit\` and \`.focus()\` the target element from a ref array, wrapping at the ends. Space checks the focused star.

**Read-only**: an early-return branch renders one \`role="img"\` labelled "3 out of 5 stars". The individual glyphs are \`aria-hidden\`.`,
    walkthrough: `1. **Normalise inputs**: \`normalizeMax\` (finite, floor, ≥ 1, default 5) and \`clampRating\` (non-number/NaN → 0, round, clamp to [0, max]). Both are pure and exported, so they are easy to unit-test.
2. **State**: \`internal\` (uncontrolled only) and \`hovered\` (UI only). \`current\` is derived on every render, so a shrinking \`max\` also re-clamps a stored value.
3. **Dev warning**: a ref remembers whether the component started controlled. An effect warns if that flips, as React does for inputs.
4. **readOnly branch**: returns the image representation after all hooks have run.
5. **Rendering**: \`tabStop = current || 1\`. For each star n: \`role="radio"\`, \`aria-checked={n === current}\`, \`aria-label\` with correct pluralisation, \`tabIndex\`, \`data-filled={n <= display}\`, and handlers for click, mouseenter and keydown.
6. **Keyboard**: \`selectAndFocus(n)\` clears the hover preview (the keyboard takes over), commits, and focuses \`starRefs.current[n]\`. In controlled mode the parent re-renders with the new value, and the roving tab stop follows \`current\`.
7. **Click**: with \`allowClear\` and \`n === current\`, commit 0 and drop the hover preview so the cleared state is visible immediately. Otherwise commit n.`,
    complexity: 'Every interaction is O(1) state work plus an O(max) re-render of tiny spans. Memory is O(max) for the ref array. Hover causes one state update per star crossed; no effects run.',
    edgeCases: `- \`value={undefined}\` means uncontrolled. \`value={0}\` means controlled and "not rated".
- \`value\` outside the range, fractional or NaN is clamped or rounded. \`max\` of 0, negative or Infinity is normalised.
- \`max\` shrinks below the current value: \`current\` is derived, so it is clamped on the next render.
- Controlled parent ignores onChange: the click is reported but nothing changes visually. That's correct, because the parent decides.
- A click on the current star without \`allowClear\` does nothing and doesn't call onChange.
- A rating of 0 puts the tab stop on star 1, so the group is still reachable by keyboard.
- Wrapping with max=1: ArrowRight targets the same star, and commit returns early with no redundant onChange.
- A hover preview that is still showing when the keyboard is used is cleared, so screen and focus agree.`,
    alternatives: `- **Native \`<input type="radio">\` + \`<label>\`** (visually hidden inputs, styled labels): the browser gives you arrow keys, roving focus, form submission (\`name\`) and \`:focus-visible\` for free. This is the best production choice. Hover preview is then done with CSS sibling selectors (\`:has()\` or reversed DOM order with \`~\`). The exercise uses ARIA radios so the keyboard model is visible and testable with synthetic events.
- **Slider (\`role="slider"\`, \`aria-valuenow/min/max\`)**: a good fit for half or tenth steps and large ranges. Arrow keys change the value and Home/End jump to the ends. Screen readers announce a number rather than "N stars", so set \`aria-valuetext\`.
- **N buttons with \`aria-pressed\`**: simple, but gives N tab stops and the wrong semantics for a single choice.
- **\`aria-activedescendant\` on the group** instead of roving tabindex: focus stays on the container. This is less common for radio groups and has weaker screen-reader support here.
- **Half stars (OPTIONAL)**: render 2×max radios named "0.5 stars" … "5 stars", or a slider with \`step={0.5}\`. Visually, each star gets two hit areas (left/right halves, or a pointer x-offset), and a half-filled glyph via a clipped overlay (\`width: 50%; overflow: hidden\`). \`clampRating\` rounds to the nearest 0.5 instead of 1.`,
    tradeoffs: `- **ARIA radios vs native radios**: ARIA gives full control over markup and testability, but you have to reimplement focus and keyboard behaviour (and keep it right). Native radios are more robust and integrate with forms.
- **Wrapping arrows**: APG-literal and consistent with other radio groups, but jumping from 5 to 1 can surprise users of a rating. A slider model (clamping at the ends, Home/End) is arguably more natural. Decide with design and document it.
- **Supporting both modes**: more API surface, plus a mode-switch hazard, but the component drops into any form library or quick prototype without wrappers.
- **Read-only as role="img"**: concise for screen readers, but the label must be localised, and fractional averages ("4.3 out of 5") need their own formatting.`,
    commonMistakes: `- Copying \`value\` into state with \`useEffect\`: the UI lags one render behind, and user changes are overwritten.
- Treating \`value || defaultValue\` as the mode check: \`value={0}\` (a valid controlled "no rating") falls back to uncontrolled.
- Calling \`setInternal\` in controlled mode, so the UI shows a value the parent never accepted.
- Clearing the hover preview with \`onMouseLeave\` on each star, which causes flicker between stars. Or forgetting to clear it at all, so the preview sticks.
- Every star having \`tabIndex=0\` (five tab stops), or none (not keyboard-reachable).
- Moving focus with arrows but not checking the star (APG radios select on focus move), or checking without moving focus.
- Labelling stars "Star 1" instead of "1 star", or showing "1 stars".
- Rendering read-only stars as disabled radios, which are announced as unavailable form controls.
- Not clamping, so \`value={7}\` with \`max={5}\` shows nothing checked.`,
    testingStrategy: `- Query stars by **accessible name** ("3 stars") and assert \`aria-checked\`, \`tabIndex\` and \`toHaveFocus()\`. These are user-visible contracts, not implementation details.
- For visual state, read a stable \`data-filled\` attribute instead of colours or class names.
- **Controlled**: render with \`value\`, click, assert \`onChange\` and that the checked star did *not* change. Then \`rerender\` with the new value. Also test a real parent component with \`useState\` (the "sharing state" setup).
- **Uncontrolled**: \`defaultValue\` initialises the state, clicks update it, and a later \`defaultValue\` change is ignored.
- **Hover**: \`mouseEnter\` on a star, then \`mouseLeave\` on the group, asserting \`onChange\` was never called.
- **Keyboard**: synthetic \`keyDown\` on the focused star, covering both wrap edges, Up/Down aliases and Space.
- **Validation** as a table of inputs through \`rerender\` (9, −2, 3.6, NaN, max=0).`,
    seniorFollowUps: `- Make it a form control: a hidden \`<input name>\` or \`useImperativeHandle\`, \`required\` validation, and resetting with the form.
- Half or tenth precision with pointer-position hit-testing. What's the accessible name of "3.5"?
- Internationalisation: localised and pluralised labels via Intl.PluralRules, and RTL (ArrowRight should move *left* in RTL).
- A design-system API: \`renderIcon\`, \`size\`, \`disabled\`, \`name\`, and a headless \`useRating\` that returns prop getters.
- Showing an aggregate (4.3 from 1 200 reviews) next to the user’s own input: which one is \`role="img"\` and which is a radiogroup?
- Optimistic submission: the user rates and the request fails. Who rolls back the value, the component or the parent? (This is an argument for the controlled mode.)`,
  },
  followUps: [
    { id: 'f1', level: 'definition', question: 'What is the difference between a controlled and an uncontrolled component? Give the native-input analogue for each.', expectedConcepts: ['controlled: parent owns value via props + onChange', 'uncontrolled: component owns state, initialised from defaultValue', '<input value> vs <input defaultValue>', 'single source of truth'], sourceIds: ['react-sharing-state'] },
    { id: 'f2', level: 'mechanism', question: 'Walk through what happens, render by render, when a controlled StarRating with value=2 is clicked on star 4 and the parent calls setState(4).', expectedConcepts: ['click calls onChange(4)', 'no internal state change', 'parent re-renders with value=4', 'current derived from props', 'roving tab stop follows the checked star'], sourceIds: ['react-sharing-state', 'react-queueing'] },
    { id: 'f3', level: 'application', question: 'Why is the APG radio group a better fit for a 1–5 rating than five toggle buttons? When would you pick a slider instead?', expectedConcepts: ['single choice from a small set', 'one tab stop + arrow keys', 'checked state announced with position in set', 'slider for fine-grained or large ranges', 'aria-valuetext'], sourceIds: ['apg-radio'] },
    { id: 'f4', level: 'edge-cases', question: 'A parent passes value={0}, then value={undefined}, then value={7} with max={5}. What should the component do in each case?', expectedConcepts: ['0 is controlled and "no rating"', 'undefined switches to uncontrolled (warn)', 'clamp 7 to 5', 'do not use || for the mode check'], sourceIds: ['react-sharing-state'] },
    { id: 'f5', level: 'production', question: 'Product pages show the average rating (4.3) next to the user’s own rating input. How do you make both accessible and avoid confusing screen-reader users?', expectedConcepts: ['read-only as one role=img with a sentence label', 'distinct labels ("Average rating", "Your rating")', 'fractional formatting', 'do not render disabled radios for display'], sourceIds: ['apg-radio'] },
    { id: 'f6', level: 'architecture', question: 'Turn this into a headless `useRating` hook for a design system. What does it return, and how does it support both modes and half stars?', expectedConcepts: ['useControllableState helper', 'getRootProps/getItemProps prop getters', 'precision option', 'hover state inside the hook', 'icons are rendered by the consumer'], sourceIds: ['react-sharing-state', 'apg-radio'] },
  ],
  mcqs: [
    {
      id: 'm1',
      question: 'In the WAI-ARIA radio group pattern, what does ArrowRight do when focus is on a radio button?',
      options: [
        { id: 'a', text: 'Moves focus to the next radio without changing which one is checked', explanation: 'That describes a toolbar or a listbox with manual selection, not a radio group.' },
        { id: 'b', text: 'Moves focus to the next radio and checks it, wrapping from last to first', explanation: 'Correct: in a radio group, arrow keys move focus and selection together, and wrap at the ends.' },
        { id: 'c', text: 'Nothing; Tab moves between radios in a group', explanation: 'Tab moves focus into and out of the group. Arrow keys move within it.' },
        { id: 'd', text: 'Checks the next radio but leaves focus where it is', explanation: 'Focus and the checked state move together.' },
      ],
      correctOptionId: 'b',
      explanation: 'APG: Right/Down Arrow move focus to the next radio button, uncheck the previous one and check the newly focused one. Focus wraps from the last to the first button.',
      sourceIds: ['apg-radio'],
    },
    {
      id: 'm2',
      code: `function StarRating({ value, defaultValue = 0, onChange }) {
  const [rating, setRating] = useState(value ?? defaultValue);
  // ...clicks call setRating(n) and onChange(n)
}`,
      question: 'A parent renders <StarRating value={score} onChange={setScore} /> and later resets score to 0 from a "Clear" button. What happens?',
      options: [
        { id: 'a', text: 'The stars reset to 0', explanation: 'useState only uses its argument on the first render, so the new prop is ignored.' },
        { id: 'b', text: 'The stars keep showing the old rating, because state was only initialised from the prop', explanation: 'Correct: copying a prop into state breaks controlled usage. Derive the value from the prop when it is provided.' },
        { id: 'c', text: 'React throws because value changed', explanation: 'React does not throw. The UI is simply out of sync.' },
        { id: 'd', text: 'The component re-mounts with the new value', explanation: 'Nothing re-mounts unless the key changes.' },
      ],
      correctOptionId: 'b',
      explanation: 'When a parent controls a value, the child must read it from props on every render ("single source of truth"). Internal state is only for the uncontrolled mode.',
      sourceIds: ['react-sharing-state'],
    },
    {
      id: 'm3',
      question: 'Which markup best represents a read-only average rating of 4 out of 5 to assistive technology?',
      options: [
        { id: 'a', text: 'Five disabled role="radio" elements, four of them aria-checked', explanation: 'This is announced as unavailable form controls, five times. Noisy and misleading.' },
        { id: 'b', text: 'One element with role="img" and aria-label="4 out of 5 stars"; the glyphs are aria-hidden', explanation: 'Correct: a single concise announcement that implies no interaction.' },
        { id: 'c', text: 'Five <img alt="star"> elements', explanation: 'Announced as "star, star, star, star, star", which loses the meaning.' },
        { id: 'd', text: 'Only CSS-coloured ★ characters', explanation: 'A screen reader reads five "black star" characters, or nothing useful.' },
      ],
      correctOptionId: 'b',
      explanation: 'For display-only data, expose one accessible name that states the value and the scale, and hide the decorative parts.',
      sourceIds: ['apg-radio'],
    },
  ],
};

export default problem;
