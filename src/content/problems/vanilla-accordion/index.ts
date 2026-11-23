import type { CodingProblem } from '../../schema';
import starterHtml from './starter/index.html?raw';
import starterCss from './starter/styles.css?raw';
import starterJs from './starter/script.js?raw';
import solutionHtml from './solution/index.html?raw';
import solutionCss from './solution/styles.css?raw';
import solutionJs from './solution/script.js?raw';
import publicTests from './tests/public.test.js?raw';
import hiddenTests from './tests/hidden.test.js?raw';

const problem: CodingProblem = {
  schemaVersion: 1,
  kind: 'coding',
  id: 'vanilla-accordion',
  slug: 'accordion',
  title: 'Accessible Accordion (vanilla JS)',
  track: 'vanilla',
  execution: 'dom',
  difficulty: 'medium',
  priority: 'P0',
  seniority: ['Senior', 'SDE-2', 'SDE-3'],
  topics: ['accessibility', 'ARIA', 'event delegation', 'keyboard navigation', 'DOM'],
  estimatedMinutes: 30,
  conceptIds: ['disclosure-accordion-aria', 'event-delegation', 'keyboard-navigation', 'focus-management', 'event-propagation'],
  research: {
    provenance: 'PUBLISHED_PRACTICE_PROBLEM',
    frequencyConfidence: 'HIGH_CONFIDENCE',
    verificationStatus: 'SOURCES_VERIFIED',
    lastVerified: '2026-11-23',
    evidence: [
      {
        sourceId: 'fih-ui',
        url: 'https://www.frontendinterviewhandbook.com/coding/build-front-end-user-interfaces',
        originalTitle: 'Accordion',
        note: 'Named in the "Where to practice" components list (GreatFrontEnd question cited via the handbook).',
      },
      { sourceId: 'fg-mc', url: 'https://www.frontendgeek.com/frontend-interview/machine-coding-interview', originalTitle: 'Accordion', note: 'Component machine-coding list.' },
      {
        sourceId: 'alla-components',
        url: 'https://allahabadi.dev/frontend-system-design/components/',
        originalTitle: 'Accordion',
        note: 'Item 10 of 16 component design questions; framed as system design, used as supporting evidence only.',
      },
    ],
    researchNotes:
      'Three independent sources list an accordion component. The accessibility requirements follow the WAI-ARIA Authoring Practices accordion pattern (buttons inside headings, aria-expanded, aria-controls, optional region role, optional arrow-key navigation). This vanilla version emphasises DOM-level concerns — event delegation, the hidden attribute, focus movement — rather than component state.',
  },
  spec: {
    summary: 'Make the provided accordion markup work: toggle panels with aria-expanded and hidden, support single-open and multi-open modes, and add arrow-key navigation — using one listener per accordion.',
    description: `The page contains two accordions whose **markup is already correct**: every header is a \`<button>\` inside an \`<h3>\`, with \`aria-expanded\` and \`aria-controls\`; every panel is a \`role="region"\` labelled by its button, and collapsed panels carry the \`hidden\` attribute.

Write \`script.js\` so that:

1. **Clicking a header** toggles its panel: update \`aria-expanded\` on the button and the \`hidden\` attribute on the panel referenced by \`aria-controls\`.
2. In an accordion **without** \`data-allow-multiple\`, opening a section **closes the other sections** of that accordion. Clicking the open section closes it (all may be closed).
3. In an accordion **with** \`data-allow-multiple\`, sections open and close independently.
4. **Keyboard**: Enter and Space already work because the headers are real buttons. Add **ArrowDown / ArrowUp** (move focus to the next / previous header of the same accordion, wrapping around) and **Home / End** (first / last header).
5. Attach **one \`click\` listener and one \`keydown\` listener per accordion container** (event delegation). Sections appended later must work without extra code.

\`\`\`html
<h3>
  <button aria-expanded="false" aria-controls="p2" id="t2">Can I change my delivery address?</button>
</h3>
<div id="p2" role="region" aria-labelledby="t2" hidden>…</div>
\`\`\``,
    technologies: ['HTML', 'CSS', 'JavaScript (DOM)', 'WAI-ARIA'],
    learningObjectives: [
      'Apply the WAI-ARIA accordion pattern: button in heading, aria-expanded, aria-controls, region',
      'Use the hidden attribute so collapsed content leaves the accessibility tree and tab order',
      'Use event delegation with closest() and scope it to the right container',
      'Implement roving focus between headers with arrow keys, Home and End',
      'Explain when native <details>/<summary> is a better choice',
    ],
    clarifications: [
      {
        question: 'Single-open or multi-open?',
        why: 'Both exist in real products; single-open saves space, multi-open lets users compare sections.',
        defaultAssumption: 'Single-open by default; multi-open when the container has data-allow-multiple.',
      },
      {
        question: 'In single-open mode, can the open section be collapsed?',
        why: 'The APG pattern allows either; if collapsing is forbidden the open button should expose aria-disabled="true".',
        defaultAssumption: 'Yes, clicking the open section closes it, so all sections can be closed.',
      },
      {
        question: 'Are arrow keys required?',
        why: 'The APG lists them as optional; Tab already reaches every header. They help long accordions.',
        defaultAssumption: 'Required in this exercise (ArrowUp/ArrowDown with wrap-around, Home, End), only on header buttons.',
      },
      {
        question: 'Should panels animate?',
        why: 'Animating height needs measured heights or newer CSS; it is easy to break the hidden semantics in the process.',
        defaultAssumption: 'No height animation. Only the icon may transition, and only when the user has no reduced-motion preference.',
      },
    ],
    scopeDecisions: [
      'The markup is provided and already accessible; the work is behaviour.',
      'Nested accordions are not in the page, but a header must only control the accordion it belongs to.',
      'No persistence of open sections (URL hash, storage).',
      'No height animation.',
    ],
    requirements: [
      { id: 'toggle', category: 'functional', level: 'MUST', text: 'Clicking a header toggles aria-expanded on the button and the hidden attribute on the panel referenced by aria-controls.' },
      { id: 'single-open', category: 'functional', level: 'MUST', text: 'Without data-allow-multiple, expanding one section collapses the others in the same accordion.' },
      { id: 'multi-open', category: 'functional', level: 'MUST', text: 'With data-allow-multiple, sections toggle independently.' },
      { id: 'independent-instances', category: 'technical', level: 'MUST', text: 'Accordions on the same page never affect each other.' },
      { id: 'aria-state', category: 'accessibility', level: 'MUST', text: 'aria-expanded always matches the panel\'s visibility; collapsed panels use the hidden attribute (not only a CSS class).' },
      { id: 'semantics', category: 'accessibility', level: 'MUST', text: 'Headers remain native <button> elements inside headings, so Enter, Space and Tab work without extra code.' },
      { id: 'arrow-keys', category: 'accessibility', level: 'MUST', text: 'ArrowDown/ArrowUp move focus to the next/previous header of the same accordion (wrapping); Home/End go to the first/last header. Moving focus does not toggle sections.' },
      { id: 'keys-scope', category: 'accessibility', level: 'MUST', text: 'Arrow keys pressed inside panel content (e.g. a checkbox or select) are not intercepted.' },
      { id: 'delegation', category: 'technical', level: 'MUST', text: 'One click and one keydown listener per accordion container; sections added later work automatically.' },
      { id: 'nested-targets', category: 'edge-case', level: 'MUST', text: 'Clicks on elements inside a header button (title, icon) toggle that header; clicks inside panels do nothing.' },
      { id: 'focus-visible', category: 'accessibility', level: 'SHOULD', text: 'Headers have a clearly visible :focus-visible style.' },
      { id: 'reduced-motion', category: 'accessibility', level: 'SHOULD', text: 'Any animation is disabled when the user prefers reduced motion.' },
      { id: 'no-layout-thrash', category: 'performance', level: 'OPTIONAL', text: 'Toggling does not read layout (offsetHeight etc.) in a loop.' },
      { id: 'role-queries', category: 'testing', level: 'SHOULD', text: 'Tests find elements by role and accessible name, which also verifies the ARIA wiring.' },
    ],
    constraints: ['No libraries or frameworks.', 'Do not replace the buttons with divs or add tabindex hacks.'],
    acceptanceCriteria: [
      'All public tests pass.',
      'All hidden tests pass (multi-open, independent accordions, clicks on button children, clicks in panels, dynamically added sections, arrow/Home/End focus movement).',
      'Manual check with a screen reader announces "expanded"/"collapsed" when toggling.',
    ],
    examples: [
      { title: 'Single-open', input: 'Click "Can I change my delivery address?" while "When will my order ship?" is open', output: 'The address panel opens, the shipping panel closes' },
      { title: 'Multi-open', input: 'Click "Email notifications", then "Language and region"', output: 'Both panels are open' },
      { title: 'Keyboard', input: 'Focus the last FAQ header and press ArrowDown', output: 'Focus moves to the first FAQ header' },
    ],
    manualTests: [
      'Tab through the page: only headers and controls inside OPEN panels receive focus.',
      'With VoiceOver or NVDA, toggle a header and listen for the expanded/collapsed announcement.',
      'Use the heading navigation of a screen reader (H key) to jump between sections.',
      'Enable "reduce motion" in the OS and check that nothing animates.',
    ],
  },
  files: {
    entry: '/script.js',
    starter: { '/index.html': starterHtml, '/styles.css': starterCss, '/script.js': starterJs },
    solution: { '/index.html': solutionHtml, '/styles.css': solutionCss, '/script.js': solutionJs },
    readonly: [],
    support: {},
  },
  tests: [
    { path: '/tests/public.test.js', visibility: 'public', kind: 'runtime', source: publicTests },
    { path: '/tests/hidden.test.js', visibility: 'hidden', kind: 'runtime', source: hiddenTests },
  ],
  hints: [
    'Write a helper `setExpanded(button, expanded)` that updates `aria-expanded` and sets `panel.hidden` on `document.getElementById(button.getAttribute("aria-controls"))`. Everything else calls it.',
    'Add the click listener to the accordion container, not to each button. Find the header with `event.target.closest(".accordion-trigger")` — the target may be a span inside the button.',
    'For single-open mode, close every other header of the *same* accordion before opening the clicked one. Read `data-allow-multiple` once with `hasAttribute`.',
    'For keyboard support, collect the header buttons of this accordion into an array, find the index of `event.target`, compute the next index with wrap-around, call `focus()` and `preventDefault()`. Ignore keydown events that did not come from a header.',
  ],
  solution: {
    initialApproach:
      'Loop over every header button, attach a click listener to each, and toggle a CSS class on the panel. It looks right but leaves aria-expanded stale, keeps collapsed content in the tab order, and needs re-wiring for sections added later.',
    bruteForce:
      'Per-button listeners that toggle `aria-expanded` and `hidden` correctly do satisfy the visible behaviour. The cost is N listeners per accordion and new code paths whenever sections are inserted dynamically — the reason the exercise asks for delegation.',
    optimizedApproach:
      'Treat aria-expanded as the single source of truth and derive everything from it: a `setExpanded(button, bool)` helper sets the attribute and the panel\'s `hidden`, and CSS styles the icon from `[aria-expanded="true"]`. One click listener per container resolves the header with `closest()`, checks it belongs to this accordion, closes siblings in single-open mode, and toggles. One keydown listener moves focus among this accordion\'s headers.',
    walkthrough: `1. **Find accordions**: \`document.querySelectorAll('[data-accordion]').forEach(initAccordion)\`.
2. **Mode**: \`allowMultiple = accordion.hasAttribute('data-allow-multiple')\`.
3. **Normalise initial state**: for each header, call \`setExpanded(header, header.getAttribute('aria-expanded') === 'true')\` so markup mistakes cannot leave ARIA and visibility out of sync.
4. **Click (delegated)**: \`event.target.closest('.accordion-trigger[aria-controls]')\`. Ignore clicks that are not on a header, or on a header of a different (nested) accordion — \`header.closest('[data-accordion]') === accordion\`.
5. **Single-open**: if expanding and not \`allowMultiple\`, collapse every other header of this accordion, then expand the clicked one. Collapsing just flips the clicked one.
6. **\`setExpanded\`** writes \`aria-expanded="true|false"\` and \`panel.hidden = !expanded\`. The \`hidden\` attribute removes the panel from rendering, the accessibility tree and the tab order in one step.
7. **Keydown (delegated)**: same header lookup. For ArrowDown/ArrowUp compute the next index modulo the number of headers; Home/End pick the ends. Call \`preventDefault()\` (the page would otherwise scroll) and \`focus()\`. Any other key returns early, so Enter/Space keep their native button behaviour and arrow keys inside panels are untouched.
8. Headers are queried at event time, so sections appended later are included automatically.`,
    complexity: 'Each click is O(n) for n headers in that accordion (closing siblings); each keydown is O(n) to build the header list. Memory: two listeners per accordion regardless of n.',
    edgeCases:
      '- **Click on a child** of the button (title/icon span) → `closest()` resolves the button.\n- **Click inside a panel** → no header found → ignored.\n- **Nested accordions** → the `closest("[data-accordion]") === accordion` check stops the outer accordion from handling the inner one\'s headers.\n- **aria-controls pointing nowhere** → `setExpanded` guards against a missing panel.\n- **CSS that sets `display` on panels** overrides the UA style for `[hidden]`; the stylesheet re-adds `[hidden] { display: none }`.\n- **Single section** → arrow keys wrap onto the same button (harmless).',
    alternatives:
      '- **`<details>`/`<summary>`**: native disclosure with built-in keyboard support and no JS. Current browsers (Chrome 120+, Safari 17.2+, Firefox 130+) also support `<details name="group">` for exclusive (single-open) groups. Styling and heading semantics are more limited.\n- **Per-button listeners**: simpler to reason about, worse for dynamic content.\n- **State object + render function**: keeps state in JS and re-renders attributes — closer to how a framework would do it.\n- **`hidden="until-found"`** (where supported): lets find-in-page reveal collapsed content via the `beforematch` event.',
    tradeoffs:
      'A custom accordion gives full control over heading levels, styling and single-open behaviour, at the cost of writing and testing ARIA state by hand. `<details>` is more robust (works without JS, cannot get ARIA wrong) but its summary cannot be a heading-wrapped button and animation/styling options differ by browser. Delegation trades a tiny lookup on each event for a constant number of listeners and automatic support for dynamic content.',
    commonMistakes:
      '- Toggling only a CSS class: aria-expanded goes stale and hidden content stays focusable.\n- Using `display: block` on panels, which silently overrides the `hidden` attribute.\n- Making the header a `<div>` with a click handler — no keyboard or screen-reader support.\n- Putting the heading *inside* the button (invalid: buttons may only contain phrasing content).\n- Comparing `event.target` to the button directly, so clicks on the inner span do nothing.\n- Closing panels in *every* accordion on the page instead of only the current one.\n- Forgetting `preventDefault()` on arrow keys, so the page scrolls while focus moves.',
    testingStrategy:
      'Query by role and accessible name (`getByRole("button", { name })`, `getByRole("region", { name })`) so the tests double as an ARIA check: a region that should be collapsed is simply not found. Fire clicks on the button and on its children, check `aria-expanded`, `hidden` and visibility, cover single-open vs multi-open and two accordions on one page, append a section at runtime to prove delegation, and drive keyboard focus with keyDown + `toHaveFocus`. Finish with a manual screen-reader pass.',
    seniorFollowUps:
      '- When would you choose `<details name="...">` instead, and what do you lose?\n- How would you deep-link to a section (URL hash) and open it on load without breaking focus?\n- How would you animate height while keeping `hidden` semantics and respecting reduced motion?\n- How would you expose this as a reusable component API (vanilla custom element vs framework component)?',
  },
  followUps: [
    {
      id: 'f1',
      level: 'definition',
      question: 'Which roles and attributes does the WAI-ARIA accordion pattern use, and what does each one communicate?',
      expectedConcepts: ['button inside heading', 'aria-expanded', 'aria-controls', 'region with aria-labelledby (optional)', 'aria-disabled when a panel cannot be collapsed'],
      sourceIds: ['apg-accordion'],
    },
    {
      id: 'f2',
      level: 'mechanism',
      question: 'What does the hidden attribute do that a `.is-collapsed { height: 0; overflow: hidden }` class does not?',
      expectedConcepts: ['removes element from rendering', 'removes it from the accessibility tree', 'descendants leave the tab order', 'CSS display can override hidden'],
      sourceIds: ['apg-accordion'],
    },
    {
      id: 'f3',
      level: 'mechanism',
      question: 'Your click listener sits on the accordion container. Explain how a click on the icon span inside a header reaches it and how you find the header.',
      expectedConcepts: ['event bubbling', 'event.target is the span', 'closest() walks up ancestors', 'scope check to this container'],
      sourceIds: ['mdn-event-bubbling'],
    },
    {
      id: 'f4',
      level: 'application',
      question: 'Rebuild the FAQ with <details> and <summary>. How do you get single-open behaviour, and what changes for headings and screen readers?',
      expectedConcepts: ['details name attribute for exclusive groups', 'toggle event', 'summary has implicit button semantics', 'heading inside summary', 'no JS needed'],
      sourceIds: ['mdn-details'],
    },
    {
      id: 'f5',
      level: 'production',
      question: 'Content inside collapsed panels is not found by the browser\'s find-in-page or by search engines in some cases. How would you address that?',
      expectedConcepts: ['hidden="until-found" and beforematch', 'server-render content in the DOM', 'open section from URL hash', 'trade-off with page length'],
      sourceIds: ['apg-accordion'],
    },
    {
      id: 'f6',
      level: 'architecture',
      question: 'Design an accordion component for a design system used by several teams. What API would you expose, and how would you support both controlled and uncontrolled usage?',
      expectedConcepts: ['single vs multiple mode', 'controlled open state + onChange', 'default open sections', 'heading level prop', 'accessibility baked in', 'composition (Item/Header/Panel)'],
      sourceIds: ['apg-accordion', 'alla-components'],
    },
  ],
  mcqs: [
    {
      id: 'm1',
      question: 'In the APG accordion pattern, which element carries aria-expanded?',
      options: [
        { id: 'a', text: 'The panel', explanation: 'The panel is what gets shown or hidden; the state is announced on the control that toggles it.' },
        { id: 'b', text: 'The heading element', explanation: 'The heading provides structure. It wraps the button but does not carry the state.' },
        { id: 'c', text: 'The button inside the heading', explanation: 'Correct: the header button has aria-expanded and aria-controls pointing to its panel.' },
        { id: 'd', text: 'The accordion container', explanation: 'The container has no required role or state in this pattern.' },
      ],
      correctOptionId: 'c',
      explanation: 'Screen readers announce state on the focused control. The header button exposes aria-expanded="true|false" and references its panel with aria-controls.',
      sourceIds: ['apg-accordion'],
    },
    {
      id: 'm2',
      question: 'A panel has the hidden attribute but is still visible on screen. What is the most likely cause?',
      options: [
        { id: 'a', text: 'The browser does not support the hidden attribute', explanation: 'All current browsers support it.' },
        { id: 'b', text: 'A CSS rule sets display on the panel, overriding the user-agent style for [hidden]', explanation: 'Correct: hidden is implemented as a UA style (display: none) that any author display rule beats.' },
        { id: 'c', text: 'aria-expanded on the button is "true"', explanation: 'ARIA attributes do not change rendering.' },
        { id: 'd', text: 'The panel has role="region"', explanation: 'Roles do not affect rendering either.' },
      ],
      correctOptionId: 'b',
      explanation: 'The hidden attribute maps to a user-agent `display: none`. An author rule such as `.panel { display: grid }` wins, so add `[hidden] { display: none }` (or avoid setting display on the panel).',
      sourceIds: ['apg-accordion'],
    },
    {
      id: 'm3',
      question: 'Which native element gives you an expand/collapse widget with keyboard support and no JavaScript?',
      options: [
        { id: 'a', text: '<details> with a <summary>', explanation: 'Correct: summary toggles the details element with mouse, Enter and Space.' },
        { id: 'b', text: '<dialog>', explanation: 'dialog is for modal and non-modal dialogs, not inline disclosure.' },
        { id: 'c', text: '<section hidden>', explanation: 'hidden hides content but provides no toggle control.' },
        { id: 'd', text: '<menu>', explanation: 'menu is a list of commands with no disclosure behaviour.' },
      ],
      correctOptionId: 'a',
      explanation: '<details>/<summary> is the native disclosure widget. Several details elements sharing a name attribute form an exclusive group, which gives single-open accordion behaviour without script.',
      sourceIds: ['mdn-details'],
    },
  ],
};

export default problem;
