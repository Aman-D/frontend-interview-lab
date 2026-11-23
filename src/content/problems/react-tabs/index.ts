import type { CodingProblem } from '../../schema';
import starterTabs from './starter/Tabs.tsx?raw';
import app from './starter/App.tsx?raw';
import styles from './starter/styles.css?raw';
import solutionTabs from './solution/Tabs.tsx?raw';
import helpers from './tests/helpers.tsx?raw';
import publicTests from './tests/public.test.tsx?raw';
import hiddenTests from './tests/hidden.test.tsx?raw';

const shared = { '/App.tsx': app, '/styles.css': styles };

const problem: CodingProblem = {
  schemaVersion: 1,
  kind: 'coding',
  id: 'react-tabs',
  slug: 'tabs',
  title: 'Accessible Tabs',
  track: 'react',
  execution: 'react',
  difficulty: 'medium',
  priority: 'P0',
  seniority: ['Senior', 'SDE-2', 'SDE-3', 'MTS'],
  topics: ['WAI-ARIA tabs', 'roving tabindex', 'keyboard navigation', 'controlled vs uncontrolled', 'useId', 'component API design'],
  estimatedMinutes: 45,
  conceptIds: ['controlled-uncontrolled', 'keyboard-navigation', 'focus-management', 'react-reconciliation-keys', 'react-effects'],
  research: {
    provenance: 'PUBLISHED_PRACTICE_PROBLEM',
    frequencyConfidence: 'HIGH_CONFIDENCE',
    verificationStatus: 'SOURCES_VERIFIED',
    lastVerified: '2026-11-23',
    evidence: [
      { sourceId: 'fih-ui', url: 'https://www.frontendinterviewhandbook.com/coding/build-front-end-user-interfaces', originalTitle: 'Tabs', note: 'Listed under "Components" in the handbook\'s "Where to practice" list.' },
      { sourceId: 'fg-mc', url: 'https://www.frontendgeek.com/frontend-interview/machine-coding-interview', originalTitle: 'Tab bar', note: 'Listed under "Component machine coding".' },
      { sourceId: 'alla-components', url: 'https://allahabadi.dev/frontend-system-design/components/', originalTitle: 'Design a Tabs Component', note: 'Question 09 in the component design list (framed as system design; used as supporting evidence).' },
    ],
    researchNotes:
      'Three independent sources list a tabs component; two as machine coding, one as component system design. The sources give titles only, so the requirements here come from the WAI-ARIA APG tabs pattern and react.dev guidance on controlled/uncontrolled components. Scope is the senior machine-coding version: full APG keyboard model (both activation modes), roving tabindex, disabled tabs, controlled + uncontrolled API and an explicit mount policy for inactive panels. Vertical orientation, overflow scrolling, closable/reorderable tabs, URL sync and a compound-component API are follow-ups.',
  },
  spec: {
    summary: 'Build a reusable, WAI-ARIA-compliant tabs component with roving tabindex, automatic/manual activation and a controlled + uncontrolled API.',
    description: `Implement \`<Tabs />\` in **Tabs.tsx**. The props are already typed:

\`\`\`ts
<Tabs
  label="Account settings"          // accessible name of the tablist
  items={[{ id, label, content, disabled? }]}
  value? / defaultValue? / onChange?  // controlled or uncontrolled
  activation?: 'automatic' | 'manual' // default 'automatic'
  keepMounted?: boolean               // default false
/>
\`\`\`

The API is an **\`items\` array** rather than compound children (\`<Tabs.List>\`, \`<Tabs.Tab>\` …). Keyboard navigation needs the ordered list of tabs and their disabled flags; with an array that is plain data, while a compound API needs a registration mechanism (context + effects or DOM queries). The compound API is discussed as a follow-up.

The component must:

1. Render a \`role="tablist"\` labelled by \`label\`, one \`role="tab"\` **button** per item and one \`role="tabpanel"\` per item.
2. Wire them together with ids from \`useId()\`: each tab has \`aria-selected\` and \`aria-controls\` → its panel; each panel has \`aria-labelledby\` → its tab and \`tabIndex={0}\`. Several instances on a page must not share ids.
3. Select by click. **Uncontrolled**: start at \`defaultValue\` if it is an enabled tab, otherwise the first enabled tab. **Controlled**: when \`value\` is defined, render exactly that and only *request* changes via \`onChange(id)\`. \`onChange\` fires only when the selection actually changes.
4. Use a **roving tabindex**: only the selected tab has \`tabIndex=0\`, all others \`-1\`.
5. Keyboard (focus on a tab): **ArrowRight / ArrowLeft** move to the next / previous tab and wrap; **Home / End** go to the first / last tab; **disabled tabs are skipped**. With \`activation="automatic"\` moving focus also selects; with \`"manual"\` arrows only move focus and **Enter / Space** select.
6. Show only the selected panel: inactive panels get the \`hidden\` attribute. By default their **content is unmounted** (state resets); with \`keepMounted\` it stays mounted but hidden (state survives).

\`App.tsx\` is read-only and shows both modes side by side.`,
    technologies: ['React 18', 'TypeScript', 'WAI-ARIA tabs pattern', 'useId'],
    learningObjectives: [
      'Implement the APG tabs pattern: roles, states, properties and the keyboard model',
      'Apply a roving tabindex and move focus imperatively from an event handler',
      'Design a component that works both controlled and uncontrolled without syncing state in effects',
      'Choose and justify a mount policy for hidden content (state preservation vs. cost)',
    ],
    clarifications: [
      { question: 'Should moving focus with the arrow keys also select the tab?', why: 'Automatic activation is best when panels render instantly; manual activation avoids loading every panel the user passes over (e.g. panels that fetch).', defaultAssumption: 'Support both via `activation`; default automatic, as the APG recommends when panels are cheap.' },
      { question: 'Who owns the selected tab — the component or the parent (URL, store)?', why: 'Decides whether we need a controlled API, an uncontrolled one, or both.', defaultAssumption: 'Both: `value` + `onChange` when controlled, `defaultValue` otherwise, following the React input convention.' },
      { question: 'Should inactive panels stay mounted?', why: 'Unmounting saves work and resets state; keeping them mounted preserves form input and scroll position but costs memory and render time.', defaultAssumption: 'Unmount content by default; `keepMounted` opt-in. Panel elements themselves always exist so `aria-controls` always resolves.' },
      { question: 'Horizontal or vertical tabs? Can the list overflow?', why: 'Vertical tabs use ArrowUp/ArrowDown and `aria-orientation="vertical"`; overflow needs scroll buttons or a "more" menu.', defaultAssumption: 'Horizontal only, no overflow handling (follow-ups).' },
      { question: 'Can tabs be disabled, added or removed at runtime?', why: 'Affects keyboard navigation and what happens if the selected tab disappears.', defaultAssumption: 'Disabled tabs are supported and skipped; if the uncontrolled selection disappears, fall back to the first enabled tab.' },
    ],
    scopeDecisions: [
      '`items` array API instead of compound components (justified in the description).',
      'Horizontal orientation only; no overflow, closing, reordering or lazy loading.',
      'Disabled tabs use the native `disabled` attribute, so they are not focusable (the APG also allows focusable `aria-disabled` tabs — see follow-ups).',
      'Ids are derived from `useId()` and the item index, so arbitrary item ids (spaces, symbols) never end up inside IDREF attributes.',
    ],
    requirements: [
      { id: 'roles', category: 'accessibility', level: 'MUST', text: 'role="tablist" with an accessible name, role="tab" on button elements, role="tabpanel" for panels.' },
      { id: 'aria-wiring', category: 'accessibility', level: 'MUST', text: 'Tabs have aria-selected and aria-controls; panels have aria-labelledby and tabIndex=0; ids come from useId and are unique per instance.', acceptance: 'getByRole("tabpanel", { name: "<tab label>" }) finds the visible panel.' },
      { id: 'click-select', category: 'functional', level: 'MUST', text: 'Clicking an enabled tab selects it and shows its panel.' },
      { id: 'uncontrolled', category: 'functional', level: 'MUST', text: 'Uncontrolled: initial selection is `defaultValue` if it names an enabled tab, else the first enabled tab.' },
      { id: 'controlled', category: 'technical', level: 'MUST', text: 'Controlled: when `value` is defined it is the single source of truth; interactions call `onChange` and do not change the selection by themselves.' },
      { id: 'onchange-only-on-change', category: 'edge-case', level: 'SHOULD', text: '`onChange` is not called when the already-selected tab is activated again.' },
      { id: 'roving-tabindex', category: 'accessibility', level: 'MUST', text: 'Exactly one tab has tabIndex=0 (the selected one, or the first enabled tab when nothing is selected); all others have -1.' },
      { id: 'arrows', category: 'accessibility', level: 'MUST', text: 'ArrowRight/ArrowLeft move focus to the next/previous tab and wrap around.' },
      { id: 'home-end', category: 'accessibility', level: 'MUST', text: 'Home/End move focus to the first/last tab.' },
      { id: 'disabled', category: 'edge-case', level: 'MUST', text: 'Disabled tabs cannot be selected by click and are skipped by arrows, Home and End.' },
      { id: 'activation', category: 'functional', level: 'MUST', text: 'activation="automatic" selects on focus move; "manual" only moves focus and selects on Enter/Space.' },
      { id: 'hidden-panels', category: 'functional', level: 'MUST', text: 'Only the selected panel is visible; inactive panels use the `hidden` attribute.' },
      { id: 'keep-mounted', category: 'performance', level: 'SHOULD', text: 'Inactive panel content is unmounted by default; `keepMounted` keeps it mounted (hidden) so its state is preserved.' },
      { id: 'no-sync-effects', category: 'technical', level: 'SHOULD', text: 'Focus is moved in the keydown handler and fallbacks are derived during render — no effect that copies props into state.' },
      { id: 'prevent-scroll', category: 'edge-case', level: 'SHOULD', text: 'Handled keys call preventDefault (Home/End would otherwise scroll the page); unrelated keys are left alone.' },
      { id: 'vertical', category: 'functional', level: 'OPTIONAL', text: 'Support `orientation="vertical"` (ArrowUp/ArrowDown, aria-orientation="vertical").' },
      { id: 'tests', category: 'testing', level: 'SHOULD', text: 'Tests query by role and accessible name, assert real focus (document.activeElement) and cover both activation modes and both ownership modes.' },
    ],
    constraints: ['React function components and hooks only.', 'No third-party libraries.', 'Do not change the exported types or props.'],
    acceptanceCriteria: [
      'All public tests pass (roles and labelling, id wiring, click selection, roving tabindex, arrows with wrapping, Home/End).',
      'All hidden tests pass (disabled tabs, manual activation, controlled mode, unique ids across instances, mount policy, defaultValue fallback).',
      'Manual: the whole widget is usable with the keyboard alone, and Tab moves from the selected tab into the panel.',
    ],
    examples: [
      { title: 'Wrapping', input: 'tabs [Apple, Banana, Date]; focus Date; ArrowRight', output: 'focus + selection on Apple' },
      { title: 'Disabled skipped', input: 'tabs [Apple, Banana, Cherry (disabled), Date]; focus Banana; ArrowRight', output: 'focus on Date', explanation: 'Cherry is skipped; with automatic activation Date is also selected.' },
      { title: 'Manual activation', input: 'activation="manual"; focus Apple; ArrowRight; Enter', output: 'after ArrowRight: focus on Banana, Apple still selected; after Enter: Banana selected', explanation: 'The Tab stop (tabIndex=0) stays on Apple until Enter.' },
      { title: 'Controlled', input: 'value="banana"; click Date; parent ignores onChange', output: 'onChange("date") called, Banana stays selected' },
    ],
    manualTests: [
      'Tab into the first widget: focus lands on the selected tab only; Tab again moves into the panel.',
      'Use ArrowLeft/ArrowRight/Home/End and confirm "Billing" (disabled) is never focused.',
      'In the manual widget, arrow across tabs and confirm the panel only changes on Enter/Space.',
      'Type in the "Notes" textarea in each widget, switch tabs and come back: text is lost in the first (unmounted) and kept in the second (keepMounted).',
      'With a screen reader, confirm the tab announces "tab, 2 of 4, selected" and the panel announces its label.',
    ],
  },
  files: {
    entry: '/App.tsx',
    starter: { ...shared, '/Tabs.tsx': starterTabs },
    solution: { ...shared, '/Tabs.tsx': solutionTabs },
    readonly: ['/App.tsx'],
    support: {},
  },
  tests: [
    { path: '/tests/helpers.tsx', visibility: 'public', kind: 'runtime', source: helpers },
    { path: '/tests/public.test.tsx', visibility: 'public', kind: 'runtime', source: publicTests },
    { path: '/tests/hidden.test.tsx', visibility: 'hidden', kind: 'runtime', source: hiddenTests },
  ],
  hints: [
    'Start with structure and ids: `const base = useId()`, then `tab-${i}` / `panel-${i}` suffixes. Render every panel element (inactive ones `hidden`) so each `aria-controls` points at something real.',
    'Ownership: `const isControlled = value !== undefined; const selectedId = isControlled ? value : internal;`. A single `select(id)` function updates internal state only when uncontrolled and always calls `onChange` — but only if the id actually changed.',
    'Roving tabindex is just `tabIndex={i === selectedIndex ? 0 : -1}`. For the keyboard, write one helper `findEnabled(from, step)` that walks with modulo arithmetic and skips disabled items; ArrowRight/Left, Home (`from = -1, step = +1`) and End (`from = length, step = -1`) all reuse it.',
    'Keep an array of button refs and call `.focus()` inside the keydown handler — no effect needed. In automatic mode, also call `select()`; in manual mode only Enter/Space call it. Remember `preventDefault()` for keys you handle.',
  ],
  solution: {
    initialApproach: 'Treat the selected id as the only piece of state, derive everything else (selected index, tabbable index, which panel is visible) during render, and keep the keyboard model in one keydown handler that computes a target index, moves DOM focus and — in automatic mode — selects.',
    bruteForce: 'A typical first attempt renders buttons and conditionally renders one panel: `{items.map(b => <button onClick={...}>)}{active.content}`. It looks right, but every button is a Tab stop (the user must tab through every tab), there are no roles or relationships for screen readers, arrows do nothing, and the only panel element changes identity on every switch so `aria-controls` cannot point anywhere stable.',
    optimizedApproach: `**State and ownership**
- \`isControlled = value !== undefined\`. Controlled → \`value\` is the truth; uncontrolled → \`useState\` initialised once from \`defaultValue\` (validated) or the first enabled tab.
- Fallbacks are **derived**, not synced: if the uncontrolled id no longer names an enabled item (items changed), render the first enabled tab instead. No \`useEffect(() => setState(...))\`, so there is never a frame with an invalid selection.
- \`select(id)\` is the single mutation path: no-op if unchanged, update internal state only when uncontrolled, then \`onChange?.(id)\`.

**Accessibility (APG tabs)**
- \`role="tablist"\` + \`aria-label\`; each tab is a native \`<button type="button" role="tab">\` (free focusability and click on Enter/Space).
- \`aria-selected\`, \`aria-controls\` and \`aria-labelledby\` built from \`useId()\` + index.
- **Roving tabindex**: \`tabIndex = 0\` only on the selected tab (or the first enabled tab if nothing valid is selected), \`-1\` elsewhere. Panels have \`tabIndex=0\` so Tab moves from the tab into the panel even if it contains no focusable content.

**Keyboard**
- \`findEnabled(from, step)\` walks at most \`n\` steps with \`((from + step*i) % n + n) % n\` and skips disabled items — wrapping and skipping in one place.
- The handler moves focus with \`tabRefs.current[target].focus()\` and, if \`activation === 'automatic'\`, selects. Enter/Space always select (this is what makes manual mode work and keeps behaviour identical when the keydown comes from assistive tech).

**Panels**
- Every panel element is always rendered with \`hidden={!selected}\`; only its *content* is conditional: \`selected || keepMounted ? content : null\`. Keys are item ids, so a kept-mounted panel keeps its state even if tabs are reordered.`,
    walkthrough: `1. \`baseId = useId()\`; \`tabId(i)\` and \`panelId(i)\` append \`-tab-i\` / \`-panel-i\`.
2. Compute \`selectedId\` (controlled value or validated internal value), \`selectedIndex\`, and \`tabbableIndex\`.
3. Render the tablist. For each item: a button with \`role="tab"\`, \`id\`, \`aria-selected\`, \`aria-controls\`, \`tabIndex\`, \`disabled\`, a callback ref that stores it in \`tabRefs.current[i]\`, \`onClick={() => select(id)}\` and \`onKeyDown={e => handleKeyDown(e, i)}\`.
4. \`handleKeyDown\`: switch on \`event.key\` → ArrowRight \`findEnabled(i, 1)\`, ArrowLeft \`findEnabled(i, -1)\`, Home \`findEnabled(-1, 1)\`, End \`findEnabled(n, -1)\`; Enter/Space → \`preventDefault\` + \`select\`; any other key → return without \`preventDefault\` (Tab must keep working). For handled navigation keys: \`preventDefault\`, focus the target, select if automatic.
5. Render panels: \`role="tabpanel"\`, \`id\`, \`aria-labelledby\`, \`tabIndex=0\`, \`hidden\`, content only when selected or \`keepMounted\`.
6. Controlled round trip: click → \`onChange("date")\` → parent \`setValue("date")\` → re-render with \`value="date"\`. If the parent ignores the change, the UI correctly stays put.`,
    complexity: 'Rendering is O(n) in the number of tabs. A key press does at most n steps to find the next enabled tab, O(n) worst case when most tabs are disabled, O(1) typically. With keepMounted, memory and render cost grow with the content of all panels; without it, only the selected panel\'s content is mounted.',
    edgeCases: `- All tabs disabled → no tab is tabbable, \`findEnabled\` returns -1 and keys do nothing (no infinite loop).
- \`defaultValue\` names a disabled or unknown tab → first enabled tab.
- Selected item removed at runtime (uncontrolled) → derived fallback to the first enabled tab.
- Controlled \`value\` names a disabled tab → it is shown selected (the parent is authoritative), but the Tab stop goes to the first enabled tab so the widget stays reachable.
- Clicking the selected tab → no \`onChange\`.
- Item ids with spaces → safe, because DOM ids are built from \`useId()\` + index, never from the item id (IDREF attributes are whitespace-separated lists).
- CSS that sets \`display\` on panels overrides the \`hidden\` attribute — a frequent "all panels visible" bug.`,
    alternatives: `- **Compound components** (\`<Tabs><Tabs.List><Tabs.Tab value="a"/>…</Tabs.List><Tabs.Panel value="a"/></Tabs>\`): more flexible markup (icons, badges, panels anywhere), but tabs must register themselves (context + effect, or querying \`[role=tab]\` in the DOM) to know their order and disabled state — more moving parts for a 45-minute round.
- **Headless hook** (\`useTabs()\` returning prop getters): maximum styling freedom; the same logic as here behind a different API.
- **\`aria-disabled\` instead of \`disabled\`**: keeps disabled tabs focusable/discoverable by screen-reader users (the APG allows it), but then the click handler and keyboard model must ignore them explicitly.
- **Moving focus in an effect** after selection changes: works for automatic mode but not for manual mode (focus moves without a state change) and adds a render-then-focus delay.
- **CSS-only (radio buttons + :checked)**: no JS, but cannot express the tabs semantics or roving focus correctly.`,
    tradeoffs: `- **Automatic vs manual activation**: automatic is faster for sighted keyboard users when panels are instant; manual is kinder when panels fetch data or are expensive, at the cost of an extra key press.
- **Unmount vs keepMounted**: unmounting is cheap and resets state (good for forms you *want* reset); keeping mounted preserves state but keeps effects, subscriptions and DOM alive for every tab.
- **Index-based ids**: robust against unusual item ids, but a tab's DOM id changes if items are reordered (harmless here because relationships are re-rendered together).
- **Native \`disabled\`**: simplest and impossible to select, but disabled tabs are invisible to keyboard and screen-reader users.`,
    commonMistakes: `- Every tab has \`tabIndex=0\` (or none, so every button is a Tab stop).
- Arrow keys handled but focus not moved — only \`aria-selected\` changes, so the screen reader never announces the new tab.
- Hard-coded ids (\`id="tab-1"\`) that collide when two tab widgets are on a page.
- Treating \`value\` as an initial value (\`useState(value)\`) so the component ignores later prop changes, or syncing props into state with an effect.
- Calling \`onChange\` from an effect when state changes (fires on mount and loops in controlled mode).
- Forgetting \`preventDefault()\` on Home/End (page scrolls) or calling it on every key (Tab stops working).
- Selecting disabled tabs via keyboard because only the click path checks \`disabled\`.
- Conditionally rendering a single panel, so \`aria-controls\` on inactive tabs points at nothing.`,
    testingStrategy: 'Query by role and accessible name (`getByRole("tab", { name })`, `getByRole("tabpanel", { name })`) — the same contract assistive tech relies on. Fire `keyDown` on the focused tab and assert real focus with `toHaveFocus()` (tests run in a real browser) plus `aria-selected` and `tabindex`. Cover: wrap at both ends, Home/End, disabled skipping (including at the wrap boundary), manual mode (focus moves, selection does not, Tab stop stays), controlled mode where the parent ignores `onChange`, a full controlled round trip with `useState` in a parent, two instances for id uniqueness, and the mount policy by typing into an input, switching away and back.',
    seniorFollowUps: `- Convert to a compound-component API: how do tabs register their order (context + layout effect vs DOM query), and what breaks with conditional rendering or portals?
- Add vertical orientation and RTL support (ArrowLeft means "next" in RTL).
- Lazy panels: mount on first activation and keep afterwards ("lazy + keepMounted") — how do you model that state?
- Sync the selected tab with the URL (\`?tab=billing\`) — controlled mode with the router as owner; what about back/forward and SSR?
- Overflowing tab lists: scroll buttons vs a "More" menu, and keeping the focused tab scrolled into view.
- Tabs whose panels fetch data: manual activation, prefetch on focus, and cancelling the fetch when the user moves on.`,
  },
  followUps: [
    { id: 'f1', level: 'definition', question: 'What is a roving tabindex and why do composite widgets like tabs use it?', expectedConcepts: ['only one element in the Tab sequence', 'arrow keys move within the widget', 'tabIndex 0 vs -1', 'Tab leaves the widget'], sourceIds: ['apg-tabs'] },
    { id: 'f2', level: 'mechanism', question: 'Explain how a component can be both controlled and uncontrolled. What decides the mode, and what happens if a parent switches from `value={undefined}` to a defined value?', expectedConcepts: ['value !== undefined check', 'single source of truth', 'internal state ignored when controlled', 'mode switching is a bug; warn in dev'], sourceIds: ['react-sharing-state'] },
    { id: 'f3', level: 'application', question: 'Your panels each fetch data on mount. Which activation mode do you choose, and what else changes in the implementation?', expectedConcepts: ['manual activation', 'avoid fetching for every tab passed over', 'abort on switch', 'keepMounted / cache to avoid refetching'], sourceIds: ['apg-tabs'] },
    { id: 'f4', level: 'edge-cases', question: 'A tab is disabled. Should it be focusable? Compare the native `disabled` attribute with `aria-disabled="true"`.', expectedConcepts: ['disabled removes it from focus and the a11y interaction', 'aria-disabled keeps it discoverable', 'must block activation manually', 'APG allows either'], sourceIds: ['apg-tabs'] },
    { id: 'f5', level: 'production', question: 'Product wants the selected tab to survive reloads and be shareable. How do you implement it, and how does it interact with the component API?', expectedConcepts: ['URL search param as source of truth', 'controlled mode', 'replace vs push history', 'validate unknown values', 'SSR consistency'], sourceIds: ['react-sharing-state'] },
    { id: 'f6', level: 'architecture', question: 'Design the tabs for a design system used by 50 teams: items prop, compound components or a headless hook? How would you keep accessibility correct by default?', expectedConcepts: ['compound components with registration', 'headless hooks / prop getters', 'ARIA owned by the library', 'escape hatches', 'automated a11y tests'], sourceIds: ['apg-tabs', 'react-context'] },
  ],
  mcqs: [
    {
      id: 'm1',
      question: 'In a tabs widget following the APG pattern, the user presses Tab while focus is on the selected tab. Where should focus go?',
      options: [
        { id: 'a', text: 'To the next tab in the tablist', explanation: 'Moving between tabs is the job of the arrow keys; with a roving tabindex the other tabs have tabIndex=-1.' },
        { id: 'b', text: 'To the active tab panel (or the first focusable element after the tablist)', explanation: 'Correct — the tablist is a single Tab stop, and the panel is usually focusable (tabIndex=0) so it is the next stop.' },
        { id: 'c', text: 'Back to the first tab', explanation: 'Tab never cycles inside the tablist.' },
        { id: 'd', text: 'Nowhere — Tab is prevented inside tabs', explanation: 'Trapping Tab would break keyboard navigation of the page.' },
      ],
      correctOptionId: 'b',
      explanation: 'The tablist participates in the page Tab order once (roving tabindex). Tab moves into the panel; arrow keys move between tabs.',
      sourceIds: ['apg-tabs'],
    },
    {
      id: 'm2',
      question: 'A Tabs component is rendered as `<Tabs value="b" items={items} />` with no `onChange`. The user clicks tab "c". What should happen?',
      options: [
        { id: 'a', text: 'Tab "c" becomes selected', explanation: 'That would make the component ignore its controlled `value` — two sources of truth.' },
        { id: 'b', text: 'Tab "b" stays selected', explanation: 'Correct — in controlled mode the parent owns the state; without onChange nobody updates `value`.' },
        { id: 'c', text: 'The component throws', explanation: 'Read-only controlled usage is legitimate (React only warns for inputs); throwing would be hostile.' },
        { id: 'd', text: 'It switches to uncontrolled mode', explanation: 'Mode is decided by whether `value` is defined, not by whether `onChange` exists.' },
      ],
      correctOptionId: 'b',
      explanation: 'A controlled component renders exactly the value it is given and only requests changes. This is the same rule as a controlled `<input value>` without onChange.',
      sourceIds: ['react-sharing-state'],
    },
    {
      id: 'm3',
      question: 'Which attribute combination is correct for an inactive, mounted tab panel?',
      options: [
        { id: 'a', text: 'role="tabpanel" hidden aria-labelledby="<tab id>"', explanation: 'Correct — hidden removes it from rendering and the accessibility tree; the label relationship stays valid.' },
        { id: 'b', text: 'role="tabpanel" aria-hidden="true" (still displayed)', explanation: 'aria-hidden only hides it from assistive tech; sighted users still see it and its focusable content stays tabbable.' },
        { id: 'c', text: 'role="tabpanel" aria-selected="false"', explanation: 'aria-selected belongs on the tab, not the panel.' },
        { id: 'd', text: 'role="tabpanel" tabIndex="-1" (still displayed)', explanation: 'tabIndex does not hide anything.' },
      ],
      correctOptionId: 'a',
      explanation: 'Use the `hidden` attribute (or display: none) so the panel is hidden for everyone; selection state lives on the tab via aria-selected.',
      sourceIds: ['apg-tabs'],
    },
  ],
};

export default problem;
