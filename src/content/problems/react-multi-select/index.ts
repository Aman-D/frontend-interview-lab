import type { CodingProblem } from '../../schema';
import starterMultiSelect from './starter/MultiSelect.tsx?raw';
import types from './starter/types.ts?raw';
import app from './starter/App.tsx?raw';
import styles from './starter/styles.css?raw';
import solutionMultiSelect from './solution/MultiSelect.tsx?raw';
import helpers from './tests/helpers.tsx?raw';
import publicTests from './tests/public.test.tsx?raw';
import hiddenTests from './tests/hidden.test.tsx?raw';

const shared = { '/App.tsx': app, '/types.ts': types, '/styles.css': styles };

const problem: CodingProblem = {
  schemaVersion: 1,
  kind: 'coding',
  id: 'react-multi-select',
  slug: 'multi-select',
  title: 'Multi-select Dropdown with Chips',
  track: 'react',
  execution: 'react',
  difficulty: 'medium',
  priority: 'P1',
  seniority: ['Senior', 'SDE-2', 'SDE-3', 'MTS'],
  topics: ['controlled vs uncontrolled', 'combobox a11y', 'multi-select listbox', 'keyboard navigation', 'derived state', 'chips input'],
  estimatedMinutes: 60,
  conceptIds: ['controlled-uncontrolled', 'combobox-aria', 'keyboard-navigation', 'focus-management', 'derived-state', 'aria-live-regions', 'immutable-updates'],
  research: {
    provenance: 'ORIGINAL_VARIATION',
    frequencyConfidence: 'MEDIUM_CONFIDENCE',
    verificationStatus: 'SOURCES_VERIFIED',
    lastVerified: '2026-11-23',
    variationOf:
      'Combines two listed prompts — a dropdown menu (listed as a component design question) and a chips input (listed as a machine-coding question) — into a single filterable multi-select combobox, because the combination exercises controlled/uncontrolled APIs and the multi-select listbox semantics that neither prompt covers alone.',
    evidence: [
      { sourceId: 'fih-sd-ui', url: 'https://www.frontendinterviewhandbook.com/front-end-system-design/ui-components', originalTitle: 'Dropdown menu', note: 'Listed as a UI component system-design example.' },
      { sourceId: 'alla-components', url: 'https://allahabadi.dev/frontend-system-design/components/', originalTitle: 'Design a Dropdown Menu', note: 'Question 04 in the component design list (framed as system design).' },
      { sourceId: 'fg-mc', url: 'https://www.frontendgeek.com/frontend-interview/machine-coding-interview', originalTitle: 'Chips Input', note: 'Listed under "Component machine coding".' },
    ],
    researchNotes:
      'No inspected source names "multi-select with chips" verbatim: two list a dropdown (as component system design) and one lists a chips input (as machine coding), so this is an original combination with MEDIUM confidence. The 60-minute scope is the part interviewers can probe in code: a filterable combobox with an aria-multiselectable listbox, chips with accessible remove buttons, Backspace-to-remove, a max-selection limit that explains itself, and a dual controlled/uncontrolled API. Async options, creatable values, grouping and virtualisation are follow-ups.',
  },
  spec: {
    summary: 'Build an accessible multi-select combobox with filtering, removable chips, a selection limit, and a controlled/uncontrolled value API.',
    description: `Implement \`<MultiSelect />\` in **MultiSelect.tsx** (props are defined in the read-only \`types.ts\`):

\`\`\`ts
interface MultiSelectProps {
  label: string;               // visible <label>; accessible name of the combobox
  options: Option[];           // { value, label, disabled? }
  value?: string[];            // controlled selection (selection order)
  defaultValue?: string[];     // uncontrolled initial selection, read once
  onChange?: (value: string[]) => void;
  maxSelections?: number;
  placeholder?: string;
}
\`\`\`

1. **Combobox.** A text input with \`role="combobox"\`, labelled by \`label\`, \`aria-autocomplete="list"\`, \`aria-expanded\` and (while open) \`aria-controls\` pointing to a \`role="listbox"\` with \`aria-multiselectable="true"\`. Typing opens the list and **filters options by label, case-insensitively** (substring). An option's text content is exactly its label (draw check marks with CSS).
2. **Selection state stays visible.** Selected options **remain in the list** with \`aria-selected="true"\`; every other option has \`aria-selected="false"\`. Clicking or pressing **Enter** on the active option **toggles** it. After a toggle the query is cleared, the list stays open and focus stays in the input.
3. **Chips.** Each selected value is shown as a chip (in selection order) with a button whose accessible name is **"Remove <label>"**. Removing a chip moves focus to the input.
4. **Keyboard.** ArrowDown/ArrowUp open the list and move the active option with **wrapping**; the active option is referenced by \`aria-activedescendant\` (it is *not* marked with \`aria-selected\`). When the list opens and whenever the query changes, the first selectable match becomes active. **Escape** closes the list. **Backspace in an empty input** removes the last chip — with text in the input it edits the text as usual.
5. **Limit.** With \`maxSelections\`, once the limit is reached every *unselected* option gets \`aria-disabled="true"\` and can't be selected; selected ones can still be removed. A message containing **"you can select up to N options"** is shown and referenced from the input via \`aria-describedby\` (in a polite live region).
6. **Disabled options** (\`option.disabled\`) are listed with \`aria-disabled="true"\` and never selectable.
7. **Controlled & uncontrolled.** When \`value\` is passed, render exactly \`value\` and only *request* changes through \`onChange(next)\`. Otherwise keep internal state initialised from \`defaultValue\` (later changes to \`defaultValue\` are ignored) and still call \`onChange\`.
8. With a query that matches nothing, a \`role="status"\` region says **"No options found"**.
9. *(Optional)* async options loaded from a search function (debounced, cancellable).

\`App.tsx\` renders a controlled "Required skills (max 3)" field and an uncontrolled "Time zones" field.`,
    technologies: ['React 18', 'TypeScript', 'WAI-ARIA combobox', 'WAI-ARIA listbox (multi-select)'],
    learningObjectives: [
      'Design a component API that supports both controlled and uncontrolled usage without syncing state',
      'Apply multi-select listbox semantics: aria-multiselectable, aria-selected for selection, aria-activedescendant for the active option',
      'Track the active option by identity so filtering and toggling never point it at the wrong item',
      'Handle the small keyboard details users notice: Backspace-to-remove, Enter without form submit, focus after chip removal',
      'Explain constraints (max selections) accessibly instead of silently ignoring input',
    ],
    clarifications: [
      { question: 'Is the selection controlled by the parent, uncontrolled, or both?', why: 'Design-system components need both; mixing them incorrectly causes "ghost" selections or ignored props.', defaultAssumption: 'Both: `value` + `onChange` (controlled) or `defaultValue` (uncontrolled, read once). `onChange` always receives the full next array.' },
      { question: 'Should selected options disappear from the list or stay with a check mark?', why: 'Hiding them makes deselection from the list impossible and changes indices while navigating.', defaultAssumption: 'They stay, marked aria-selected="true", and toggle on Enter/click.' },
      { question: 'What happens when the limit is reached — block silently, replace the oldest, or explain?', why: 'Silent failure is the most common usability and accessibility bug for limits.', defaultAssumption: 'Unselected options become aria-disabled and a polite message explains the limit; selected ones remain removable.' },
      { question: 'Can users create values that are not in the options (tags)?', why: 'A creatable input changes Enter semantics and validation.', defaultAssumption: 'No; only listed options can be selected. "Creatable" is a follow-up.' },
      { question: 'Are options static or loaded from a server?', why: 'Async options need debouncing, cancellation and a way to show labels for selected values that are not in the current results.', defaultAssumption: 'Static for the core task; async is optional.' },
    ],
    scopeDecisions: [
      'Filtering is a case-insensitive substring match on the label.',
      'No creatable values, grouping, select-all or virtualisation.',
      'Selected values that are not in `options` are shown with their raw value as the label.',
      'The listbox is rendered inline (absolutely positioned), not in a portal.',
    ],
    requirements: [
      { id: 'filter', category: 'functional', level: 'MUST', text: 'Typing opens the listbox and filters options by label, case-insensitively.' },
      { id: 'toggle', category: 'functional', level: 'MUST', text: 'Click or Enter on the active option toggles it; the query is cleared and the list stays open with focus in the input. Option mousedown is prevented so clicking does not blur the input; a real blur closes the list.' },
      { id: 'chips', category: 'functional', level: 'MUST', text: 'Each selected value renders as a chip in selection order with a button named "Remove <label>"; removing focuses the input.' },
      { id: 'backspace', category: 'edge-case', level: 'MUST', text: 'Backspace removes the last chip only when the input is empty; otherwise it edits the text.' },
      { id: 'max', category: 'edge-case', level: 'MUST', text: 'At maxSelections, unselected options are aria-disabled and cannot be selected; selected ones stay removable.' },
      { id: 'max-message', category: 'accessibility', level: 'MUST', text: 'At the limit a polite message "…you can select up to N options." is shown and referenced by the input\'s aria-describedby.' },
      { id: 'controlled', category: 'technical', level: 'MUST', text: 'With `value`, the component renders exactly `value` and only calls onChange(next); it never updates its own copy.' },
      { id: 'uncontrolled', category: 'technical', level: 'MUST', text: 'Without `value`, internal state is initialised once from defaultValue and onChange is still called with the next value.' },
      { id: 'combobox-roles', category: 'accessibility', level: 'MUST', text: 'Labelled role="combobox" with aria-autocomplete="list", aria-expanded and aria-controls → role="listbox" aria-multiselectable="true".' },
      { id: 'selected-vs-active', category: 'accessibility', level: 'MUST', text: 'aria-selected reflects selection on every option; the active option is conveyed with aria-activedescendant only.' },
      { id: 'keyboard', category: 'accessibility', level: 'MUST', text: 'ArrowDown/ArrowUp open and move with wrapping, Enter toggles without submitting a form, Escape closes.' },
      { id: 'disabled-options', category: 'edge-case', level: 'MUST', text: 'Options with disabled: true are aria-disabled and never selectable.' },
      { id: 'no-results', category: 'accessibility', level: 'SHOULD', text: 'No matches → "No options found" in a role="status" region; selections/removals are announced politely.' },
      { id: 'derived', category: 'performance', level: 'SHOULD', text: 'Filtered options, the selected Set and the active option are derived during render (memoised), not synchronised with effects.' },
      { id: 'async', category: 'functional', level: 'OPTIONAL', text: 'Async options: debounced, abortable search with loading/empty/error states; selected chips keep their labels when results change.' },
      { id: 'tests', category: 'testing', level: 'SHOULD', text: 'Tests cover controlled with and without a state-owning parent, uncontrolled defaultValue, the limit, and Backspace with/without text.' },
    ],
    constraints: ['React function components and hooks only.', 'No third-party libraries (no react-select, Downshift).', 'Do not change App.tsx, types.ts or the props.'],
    acceptanceCriteria: [
      'All public tests pass (labelled combobox + filtering, click to select with aria-selected, chip removal + focus, Backspace on empty input, ArrowDown/Enter toggle, Escape).',
      'All hidden tests pass (Backspace with text, no chips, max limit + aria-describedby + deselection, controlled without and with a parent, uncontrolled defaultValue, aria-activedescendant vs aria-selected + wrapping + "No options found", query cleared after selection, disabled options).',
      'Manual: with a screen reader, options are announced with their selected state and the limit message is read when it appears.',
    ],
    examples: [
      { title: 'Controlled without accepting', input: 'value=["cherry"], parent ignores onChange; click "Apple"', output: 'onChange(["cherry","apple"]); still one chip, "Cherry"', explanation: 'The parent owns the value; the component only requests changes.' },
      { title: 'Backspace', input: 'chips [Apple, Cherry]; input "" → Backspace; then type "ch" → Backspace', output: 'First press removes Cherry; second press only deletes a character' },
      { title: 'Limit', input: 'maxSelections=2, selected [Apple, Banana]', output: 'Cherry… are aria-disabled; "Limit reached: you can select up to 2 options." is announced; Apple and Banana can still be deselected' },
    ],
    manualTests: [
      'Select three skills in the preview, then try a fourth: it is disabled and the message explains why.',
      'Press Backspace repeatedly in the empty Time zones input to remove chips one by one.',
      'Tab to a chip\'s remove button and press Enter: focus returns to the input.',
      'Use only the keyboard: ArrowDown, ArrowDown, Enter, Escape.',
      'With VoiceOver/NVDA, confirm "selected"/"not selected" and "dimmed/unavailable" are announced for options.',
    ],
  },
  files: {
    entry: '/App.tsx',
    starter: { ...shared, '/MultiSelect.tsx': starterMultiSelect },
    solution: { ...shared, '/MultiSelect.tsx': solutionMultiSelect },
    readonly: ['/App.tsx', '/types.ts'],
    support: {},
  },
  tests: [
    { path: '/tests/helpers.tsx', visibility: 'public', kind: 'runtime', source: helpers },
    { path: '/tests/public.test.tsx', visibility: 'public', kind: 'runtime', source: publicTests },
    { path: '/tests/hidden.test.tsx', visibility: 'hidden', kind: 'runtime', source: hiddenTests },
  ],
  hints: [
    'Start with the value model: `const isControlled = value !== undefined; const [internal, setInternal] = useState(defaultValue ?? []); const selected = isControlled ? value : internal;`. Write one `commit(next)` that calls `setInternal` only when uncontrolled and always calls `onChange`.',
    'Derive, don\'t store: `filtered` from options + query, a `Set` of selected values, `limitReached`, and `isDisabled(o) = o.disabled || (limitReached && !selected.has(o.value))`. All of it is recomputed each render.',
    'Store the active option as a value (`activeValue`), not an index, and derive `active = filtered.find(o => o.value === activeValue) ?? first selectable`. Reset it to null when the query changes. Put `aria-activedescendant` on the input and keep `aria-selected` for selection only.',
    'Keyboard in one `onKeyDown`: arrows (preventDefault, open if closed, wrap with modulo), Enter (preventDefault, toggle active), Escape (close), Backspace (only if `e.currentTarget.value === ""`, remove the last value). On options use `onMouseDown={e => e.preventDefault()}` so clicking does not blur the input.',
  ],
  solution: {
    initialApproach:
      'Model the value first (controlled vs uncontrolled, one commit path), then derive everything the UI needs from (options, query, selected, activeValue, open). The component then only has four pieces of state — query, open, activeValue and (when uncontrolled) the internal selection — and one keydown handler.',
    bruteForce:
      'A common first version copies `value` into state (`useState(value)` plus a `useEffect` to sync it), hides selected options from the list, keeps `activeIndex` as a number, and uses `aria-selected` to mark the highlighted option. It "works" for one demo but: the controlled parent can\'t reject a change (the copy already updated), the effect causes an extra render and races with user input, deselecting from the list is impossible, the highlighted index points at the wrong option after filtering or selecting, and screen readers announce the highlighted option as "selected" even when it isn\'t.',
    optimizedApproach: `**Single source of truth for the value.**

\`\`\`ts
const isControlled = value !== undefined;
const [internal, setInternal] = useState(() => defaultValue ?? []);   // read once
const selected = isControlled ? value : internal;
function commit(next: string[]) {
  if (!isControlled) setInternal(next);
  onChange?.(next);
}
\`\`\`

No effect ever copies props into state, so a controlled parent can accept, transform or reject every change.

**Everything else is derived during render:** \`filtered\` (memoised on options + query), \`selectedSet\`, \`limitReached\`, \`isDisabled(o)\`, and \`active = filtered.find(o => o.value === activeValue) ?? firstSelectable ?? filtered[0]\`. Tracking the active option by **value** means toggling or re-filtering can never leave the highlight on a different item.

**Semantics:** \`role="combobox"\` input keeps focus and points \`aria-activedescendant\` at the active option; the listbox has \`aria-multiselectable="true"\`; every option has an explicit \`aria-selected\` (true/false) for *selection*; disabled options (intrinsic or by limit) use \`aria-disabled\` and stay navigable so their state is discoverable. The limit message lives in an always-present polite live region and is linked with \`aria-describedby\` while it applies.`,
    walkthrough: `1. **Ids** from \`useId()\`: label, input, listbox, limit message and option ids — safe with several instances on a page.
2. **Value model**: \`isControlled\`, \`internal\`, \`selected\`, \`commit(next, announcement)\`.
3. **Derived data**: \`byValue\` map for chip labels (unknown values fall back to the raw value), \`selectedSet\`, \`filtered\`, \`limitReached\`, \`isDisabled\`, \`active\`, \`expanded = open && filtered.length > 0\`.
4. **toggle(o)**: return if \`isDisabled(o)\`; remove if selected, otherwise append (selection order); clear the query; remember \`o.value\` as active.
5. **remove(value)** (chip button / Backspace): commit without it and focus the input, because the focused chip button is about to unmount.
6. **onKeyDown**: ArrowDown/Up → open if closed (ArrowUp starts at the last option), else move with modulo wrapping; Enter → toggle when expanded (preventDefault so a surrounding form isn't submitted); Escape → close (second Escape clears the text); Backspace → remove the last chip only when the input value is empty. Ignore keys during IME composition.
7. **Input events**: \`onChange\` sets the query, resets \`activeValue\` and opens; \`onBlur\` closes; \`onClick\` opens.
8. **Render**: label; field (chips list + input); listbox when expanded (options with \`onMouseDown\` preventDefault, \`onMouseMove\` to follow the pointer, \`onClick\` toggle); the limit live region; a \`role="status"\` region for "No options found" and add/remove announcements.`,
    complexity:
      'Filtering is O(n·m) per keystroke for n options of label length m; selection checks are O(1) via a Set; rendering is O(n). Toggling is O(k) for k selected values (copying the array). Memory O(n + k). For thousands of options, add virtualisation and a pre-lower-cased index.',
    edgeCases:
      '- Backspace with text, with a non-collapsed selection, or with no chips.\n- Limit reached while the active option is unselected → Enter does nothing; deselecting re-enables options immediately.\n- `value` contains an unknown value → chip shows the raw value and can still be removed.\n- Controlled parent rejects or transforms the change (e.g. sorts) → render what the parent passes.\n- Switching between controlled and uncontrolled after mount is a parent bug; mirror React\'s native inputs and document it (optionally warn in development).\n- All matches disabled → there is an active option (so its state is announced) but Enter is a no-op.\n- Duplicate option values break keys and selection — clarify uniqueness.\n- Enter inside a `<form>` must not submit while the list is open.\n- IME composition: Enter confirms the composition, not an option.',
    alternatives:
      '- **Native `<select multiple>`**: free semantics and keyboard support, but Ctrl/Cmd-click selection is hard to discover, no filtering, and limited styling.\n- **Checkbox list in a disclosure/popover**: simpler semantics (each option is a checkbox), good for short lists; loses type-to-filter.\n- **Headless libraries** (Downshift `useMultipleSelection` + `useCombobox`, React Aria, Radix-based comboboxes): prop getters handle ARIA and many browser/AT quirks.\n- **`useControllableState` hook**: extract the controlled/uncontrolled logic into a reusable hook for every design-system input.\n- **Chips as a roving-tabindex toolbar**: Left/Right arrows move between chips and Delete removes, instead of one tab stop per chip.',
    tradeoffs:
      '- Keeping disabled options navigable (APG recommendation for listboxes) aids discovery but adds keystrokes; skipping them is faster for sighted keyboard users.\n- Clearing the query after each selection supports "type, pick, type, pick" flows, but users selecting several similar items ("Ap…") must retype; some designs keep the query.\n- One tab stop per chip remove button is simple and explicit but makes tabbing through many chips slow; a roving chip group is more efficient but more code.\n- Reporting the full next array keeps `onChange` simple for forms; reporting deltas (added/removed) suits optimistic server updates.\n- Inline popup vs portal: inline is simpler and keeps DOM order for AT; a portal avoids clipping by `overflow: hidden` ancestors.',
    commonMistakes:
      '- Copying `value` into state with a sync effect (stale UI, rejected changes "stick").\n- Ignoring `defaultValue`, or re-reading it on every render (resetting user changes).\n- Using `aria-selected` for the highlighted option in a multi-select.\n- Removing a chip on every Backspace, deleting selections while the user edits text.\n- Silently ignoring clicks at the limit without an explanation.\n- Forgetting `preventDefault` on Enter inside forms, or on option mousedown (the input blurs and the list closes before the click).\n- Losing focus to `<body>` after the focused chip button unmounts.\n- Index-based active state that drifts after filtering.',
    testingStrategy:
      'Query by role and accessible name only (combobox "Fruits", listbox, option, button "Remove Cherry", status). Test the controlled contract twice: with a parent that ignores `onChange` (the UI must not change) and with a state-owning parent (changes round-trip in order). Test uncontrolled initialisation and that later `defaultValue` changes are ignored. Assert ARIA state precisely: `aria-selected` true/false on options, `aria-activedescendant` resolving to the active option, `aria-disabled` at the limit, `aria-describedby` resolving to the limit message. Cover Backspace with and without text, and focus after chip removal via `document.activeElement`.',
    seniorFollowUps:
      '- Extract `useControllableState(value, defaultValue, onChange)` and discuss its pitfalls (mode switching, functional updates).\n- Async options with debouncing and AbortController; how do selected chips keep labels when they are not in the current results?\n- Creatable values: validation, duplicates, Enter vs comma separators, paste of "a, b, c".\n- 10 000 options: virtualise the listbox while keeping aria-activedescendant pointing at a rendered option; aria-setsize/aria-posinset.\n- Form integration: hidden inputs or FormData for native submission, `name` prop, reset behaviour, server actions.\n- Internationalisation: locale-aware, accent-insensitive matching with Intl.Collator.',
  },
  followUps: [
    { id: 'f1', level: 'definition', question: 'What is the difference between a controlled and an uncontrolled component, and what does `defaultValue` mean for each?', expectedConcepts: ['parent owns state via value + onChange', 'component owns state initialised from defaultValue', 'defaultValue read once', 'single source of truth'], sourceIds: ['react-sharing-state'] },
    { id: 'f2', level: 'mechanism', question: 'In a multi-select listbox, what do aria-selected, aria-activedescendant and aria-multiselectable each communicate?', expectedConcepts: ['aria-selected = chosen', 'aria-activedescendant = focused/active option', 'aria-multiselectable on the listbox', 'selection and focus are independent in multi-select'], sourceIds: ['apg-listbox', 'mdn-aria-activedescendant'] },
    { id: 'f3', level: 'application', question: 'Extract the value logic into a reusable `useControllableState` hook. What is its signature, and how do you handle functional updates?', expectedConcepts: ['value, defaultValue, onChange in; [state, setState] out', 'mode decided by value !== undefined', 'resolve updater against current value', 'warn on mode switch'], sourceIds: ['react-custom-hooks'] },
    { id: 'f4', level: 'edge-cases', question: 'The limit is reached and the user presses Enter on an unselected option. What should happen visually and for screen-reader users?', expectedConcepts: ['no selection', 'option is aria-disabled and still discoverable', 'polite explanation via live region', 'aria-describedby on the input', 'deselecting re-enables'], sourceIds: ['mdn-live-regions', 'apg-listbox'] },
    { id: 'f5', level: 'production', question: 'Options now come from a search API. What changes in state, rendering and the chips?', expectedConcepts: ['debounce + AbortController', 'loading/empty/error states', 'cache labels for selected values', 'stale responses ignored', 'keep selected values even if absent from results'], sourceIds: ['mdn-abortcontroller', 'apg-combobox-list-example'] },
    { id: 'f6', level: 'architecture', question: 'Design the multi-select for a design system used by 50 teams: API surface, customisation and accessibility guarantees.', expectedConcepts: ['headless hook + styled wrapper', 'controlled and uncontrolled', 'render props for options and chips', 'ARIA owned by the library', 'form integration via name/hidden inputs'], sourceIds: ['apg-combobox', 'react-custom-hooks'] },
  ],
  mcqs: [
    {
      id: 'm1',
      question: 'The parent renders `<MultiSelect value={["a"]} onChange={log} />` and never updates `value`. The user clicks option "b". What should the component show afterwards?',
      options: [
        { id: 'a', text: 'Chips "a" and "b"', explanation: 'That means the component kept its own copy of a controlled value — the parent lost control.' },
        { id: 'b', text: 'Only chip "a"; onChange was called with ["a", "b"]', explanation: 'Correct — a controlled component renders the prop and only requests changes.' },
        { id: 'c', text: 'Only chip "b"', explanation: 'Nothing should replace the selection; and the parent did not accept any change.' },
        { id: 'd', text: 'Nothing, and onChange is not called', explanation: 'The component must still report the requested change.' },
      ],
      correctOptionId: 'b',
      explanation: 'In controlled mode the prop is the single source of truth. The component calls onChange(next) and re-renders only when the parent passes a new value.',
      sourceIds: ['react-sharing-state'],
    },
    {
      id: 'm2',
      question: 'In a multi-select combobox, the user arrows onto "Banana", which is not selected. Which markup is correct?',
      options: [
        { id: 'a', text: 'Banana has aria-selected="true" because it is highlighted', explanation: 'That is the single-select convention; in a multi-select it would announce Banana as chosen.' },
        { id: 'b', text: 'The input\'s aria-activedescendant references Banana; Banana keeps aria-selected="false"', explanation: 'Correct — active and selected are separate states in a multi-select listbox.' },
        { id: 'c', text: 'Banana receives DOM focus and aria-checked="true"', explanation: 'Focus stays in the combobox input, and aria-checked is not the option-selection attribute here.' },
        { id: 'd', text: 'The listbox gets aria-activedescendant and the input aria-selected', explanation: 'The focused element (the input) owns aria-activedescendant; aria-selected belongs on options.' },
      ],
      correctOptionId: 'b',
      explanation: 'With aria-multiselectable, aria-selected expresses selection for each option, while aria-activedescendant on the focused combobox identifies the active option.',
      sourceIds: ['apg-listbox', 'mdn-aria-activedescendant'],
    },
    {
      id: 'm3',
      question: 'Why track the active option by value instead of by index?',
      options: [
        { id: 'a', text: 'Indices are slower to compare', explanation: 'Performance is not the issue.' },
        { id: 'b', text: 'Filtering changes indices, so an index can silently point at a different option', explanation: 'Correct — after the list changes, index 2 may be a different option; a value keeps identity.' },
        { id: 'c', text: 'React keys must be values', explanation: 'Keys are a separate concern; the active state is not a key.' },
        { id: 'd', text: 'aria-activedescendant only accepts option values', explanation: 'It references an element id; the id can be built from an index.' },
      ],
      correctOptionId: 'b',
      explanation: 'Derived lists change shape as the user types. Storing identity (the value) and deriving the index each render keeps the highlight on the intended option or falls back predictably.',
      sourceIds: ['react-no-effect'],
    },
  ],
};

export default problem;
