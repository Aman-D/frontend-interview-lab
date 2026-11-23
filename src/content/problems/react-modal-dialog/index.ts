import type { CodingProblem } from '../../schema';
import starterModal from './starter/Modal.tsx?raw';
import app from './starter/App.tsx?raw';
import styles from './starter/styles.css?raw';
import solutionModal from './solution/Modal.tsx?raw';
import helpers from './tests/helpers.tsx?raw';
import publicTests from './tests/public.test.tsx?raw';
import hiddenTests from './tests/hidden.test.tsx?raw';

const shared = { '/App.tsx': app, '/styles.css': styles };

const problem: CodingProblem = {
  schemaVersion: 1,
  kind: 'coding',
  id: 'react-modal-dialog',
  slug: 'modal-dialog',
  title: 'Accessible Modal Dialog',
  track: 'react',
  execution: 'react',
  difficulty: 'medium',
  priority: 'P0',
  seniority: ['Senior', 'SDE-2', 'SDE-3', 'MTS'],
  topics: ['portals', 'focus trap', 'focus restoration', 'dialog a11y', 'scroll lock', 'effect cleanup'],
  estimatedMinutes: 60,
  conceptIds: ['react-portals', 'focus-management', 'keyboard-navigation', 'react-effects', 'event-propagation', 'closures', 'referential-equality'],
  research: {
    provenance: 'PUBLISHED_PRACTICE_PROBLEM',
    frequencyConfidence: 'HIGH_CONFIDENCE',
    verificationStatus: 'SOURCES_VERIFIED',
    lastVerified: '2026-11-23',
    evidence: [
      { sourceId: 'fih-ui', url: 'https://www.frontendinterviewhandbook.com/coding/build-front-end-user-interfaces', originalTitle: 'Modal Dialog', note: 'Listed under "Components" in the handbook\'s "Where to practice" list.' },
      { sourceId: 'fih-sd-ui', url: 'https://www.frontendinterviewhandbook.com/front-end-system-design/ui-components', originalTitle: 'Modal dialog', note: 'Listed as a UI component system-design example.' },
      { sourceId: 'alla-components', url: 'https://allahabadi.dev/frontend-system-design/components/', originalTitle: 'Design a Modal / Dialog', note: 'Question 03 in the component design list (framed as system design).' },
      { sourceId: 'fg-mc', url: 'https://www.frontendgeek.com/frontend-interview/machine-coding-interview', originalTitle: 'Modal Component', note: 'Listed under "Component machine coding".' },
    ],
    researchNotes:
      'Four independent sources list a modal/dialog: two as UI coding or machine coding, two as component system design. This problem is the 60-minute machine-coding subset centred on the WAI-ARIA modal dialog pattern: portal rendering, focus in/trap/restore, Escape and backdrop dismissal, and scroll locking, plus the React-specific traps (effect dependencies, stale callbacks, event bubbling through portals). Stacked modals are an optional follow-up; animations, native <dialog> migration and a full inert-based background are discussed in the solution rather than required.',
  },
  spec: {
    summary: 'Build a reusable, accessible React modal: portal, focus management and trap, Escape/backdrop dismissal, focus restoration and scroll lock.',
    description: `Implement \`<Modal />\` in **Modal.tsx**:

\`\`\`ts
interface ModalProps {
  open: boolean;                              // controlled by the parent
  onClose: () => void;                        // Escape or backdrop click
  title: string;                              // visible heading + accessible name
  description?: string;                       // optional, referenced by aria-describedby
  initialFocusRef?: RefObject<HTMLElement>;   // element to focus on open
  children?: ReactNode;
}
\`\`\`

The modal must:

1. Render **nothing** while \`open\` is false. When open, render through a **portal into \`document.body\`**: a full-screen backdrop element with \`data-testid="modal-backdrop"\` that contains the dialog.
2. The dialog element has \`role="dialog"\`, \`aria-modal="true"\`, \`aria-labelledby\` pointing to the rendered \`title\` heading, and — only when \`description\` is given — \`aria-describedby\` pointing to the rendered description.
3. **Focus in.** On open, focus \`initialFocusRef.current\` if provided, otherwise the **first focusable** element inside (skipping disabled controls), otherwise the dialog itself (give it \`tabIndex={-1}\`).
4. **Focus trap.** Tab on the last focusable element moves to the first; Shift+Tab on the first moves to the last (call \`preventDefault()\` when you wrap). With nothing focusable, Tab keeps focus on the dialog. Implement this in a **keydown handler** — the tests dispatch synthetic key events, which never move focus by themselves.
5. **Escape** calls \`onClose\`. Nothing should listen for keys while the modal is closed.
6. **Backdrop click** (a click whose target is the backdrop itself) calls \`onClose\`; clicks inside the dialog do not.
7. **Focus restore.** When the modal closes (for any reason, including the parent setting \`open\` to false) or unmounts, focus returns to the element that was focused when it opened.
8. **Scroll lock.** While open, \`document.body.style.overflow\` is \`"hidden"\`; afterwards it is restored to its **previous** value (also on unmount).
9. A parent that passes a new inline \`onClose\` on every render must not cause focus to jump back to the first field, and the latest \`onClose\` must be the one called.
10. *(Optional)* Stacked modals: only the top-most modal reacts to Escape/Tab, and scroll stays locked until the last one closes.

\`App.tsx\` (read-only) uses the modal for a sign-out confirmation (initial focus on the safe action) and an "Edit profile" form.`,
    technologies: ['React 18', 'TypeScript', 'react-dom createPortal', 'WAI-ARIA dialog (modal) pattern'],
    learningObjectives: [
      'Apply the WAI-ARIA modal dialog pattern: roles, labelling and keyboard behaviour',
      'Manage focus deliberately: move in, trap, and restore to the invoker',
      'Use effect setup/cleanup symmetrically for listeners, scroll lock and focus restoration',
      'Avoid stale-closure and effect-dependency bugs with a latest-callback ref',
      'Understand how React events bubble through portals and how native <dialog> and inert compare',
    ],
    clarifications: [
      { question: 'Is the modal controlled by the parent, or does it own its open state?', why: 'Decides who triggers close and how confirm flows (async submit, unsaved changes) can veto closing.', defaultAssumption: 'Controlled: the parent owns `open` and closes it in `onClose`; the modal only requests closing.' },
      { question: 'Which element should receive focus when it opens?', why: 'For destructive confirmations the APG recommends the least destructive action; for forms, the first field.', defaultAssumption: 'An optional `initialFocusRef`, falling back to the first focusable element, then the dialog itself.' },
      { question: 'Should clicking the backdrop close it? What about forms with unsaved data?', why: 'Accidental dismissal can lose work; some dialogs must be explicitly answered.', defaultAssumption: 'Backdrop click and Escape both call `onClose`; the parent can ignore the request. A `dismissible` prop is a follow-up.' },
      { question: 'Can modals be stacked (a confirm on top of a form modal)?', why: 'Requires ordering for Escape handling, focus restoration and scroll lock.', defaultAssumption: 'Optional. A single modal must be correct; stacking should not break if supported.' },
      { question: 'Can we use the native <dialog> element, and which browsers matter?', why: '`showModal()` gives top-layer rendering, inertness and Escape for free but has its own styling and event model.', defaultAssumption: 'Build it with a portal + ARIA for this exercise (to show the mechanics); discuss <dialog> and inert as the production alternative.' },
    ],
    scopeDecisions: [
      'No built-in close button or footer: content and actions come from children.',
      'No enter/exit animations (prefers-reduced-motion is discussed as a follow-up).',
      'Background is not made inert in the core task; aria-modal plus the focus trap is the baseline, inert is discussed.',
      'Stacked modals are optional.',
    ],
    requirements: [
      { id: 'portal', category: 'functional', level: 'MUST', text: 'Nothing renders while closed; when open, the backdrop and dialog are portalled into document.body.' },
      { id: 'escape', category: 'functional', level: 'MUST', text: 'Escape calls onClose; no key listener is active while closed.' },
      { id: 'backdrop', category: 'functional', level: 'MUST', text: 'A click whose target is the backdrop (data-testid="modal-backdrop") calls onClose; clicks inside the dialog do not.' },
      { id: 'scroll-lock', category: 'functional', level: 'MUST', text: 'document.body overflow is "hidden" while open and restored to its previous value on close and on unmount.' },
      { id: 'dialog-roles', category: 'accessibility', level: 'MUST', text: 'role="dialog", aria-modal="true", aria-labelledby → title; aria-describedby → description only when provided.' },
      { id: 'focus-in', category: 'accessibility', level: 'MUST', text: 'On open, focus initialFocusRef, else the first enabled focusable element, else the dialog itself (tabIndex=-1).' },
      { id: 'focus-trap', category: 'accessibility', level: 'MUST', text: 'Tab from the last focusable wraps to the first, Shift+Tab from the first wraps to the last (preventDefault on wrap); disabled controls are skipped.' },
      { id: 'focus-restore', category: 'accessibility', level: 'MUST', text: 'On close or unmount, focus returns to the element that was focused when the modal opened, if it still exists.' },
      { id: 'stable-effects', category: 'technical', level: 'MUST', text: 'A new onClose identity on re-render does not re-run the open effect (no focus jump) and the latest onClose is used.' },
      { id: 'cleanup', category: 'technical', level: 'MUST', text: 'Every side effect of opening (listener, scroll lock, stack entry) is undone in the effect cleanup.' },
      { id: 'portal-bubbling', category: 'technical', level: 'SHOULD', text: 'Account for React synthetic events bubbling through portals to React ancestors (e.g. a parent onClick or onKeyDown).' },
      { id: 'empty-dialog', category: 'edge-case', level: 'MUST', text: 'With no focusable content, Tab and Shift+Tab keep focus on the dialog.' },
      { id: 'ime', category: 'edge-case', level: 'SHOULD', text: 'Escape during IME composition does not close the dialog.' },
      { id: 'stacking', category: 'edge-case', level: 'OPTIONAL', text: 'Stacked modals: only the top-most handles Escape/Tab; scroll unlocks when the last closes; focus returns layer by layer.' },
      { id: 'no-layout-thrash', category: 'performance', level: 'OPTIONAL', text: 'Compensate for the removed scrollbar (padding-right) to avoid layout shift when locking scroll.' },
      { id: 'tests', category: 'testing', level: 'SHOULD', text: 'Tests assert real focus (document.activeElement), preventDefault on wrapping Tab, scroll restoration and listener removal.' },
    ],
    constraints: ['React function components and hooks only.', 'No third-party focus-trap or dialog libraries.', 'Do not change the props or App.tsx.', 'The backdrop element must have data-testid="modal-backdrop".'],
    acceptanceCriteria: [
      'All public tests pass (closed/open rendering with role and aria-modal, portal, initial focus, Escape + focus return, Tab/Shift+Tab wrapping, backdrop vs inside click, the App sign-out flow).',
      'All hidden tests pass (initialFocusRef, disabled controls skipped with preventDefault, empty dialog focus, aria-describedby only when given, scroll-lock restore on close and unmount, no listener while closed, stable effects with a fresh onClose, focus restore via the open prop).',
      'Manual: with a screen reader, opening announces the dialog title and description; the page behind cannot be scrolled.',
    ],
    examples: [
      { title: 'Confirm flow', input: 'Focus "Sign out" and click it', output: 'Dialog "Sign out?" opens; "Stay signed in" has focus; Escape closes; focus is back on "Sign out"', explanation: 'initialFocusRef points at the least destructive action.' },
      { title: 'Trap', input: 'Focus "Cancel" (last enabled control; "Reset" after it is disabled) and press Tab', output: 'Focus moves to the "Display name" input and the event is default-prevented' },
      { title: 'Scroll restore', input: 'body.style.overflow = "scroll"; open; close', output: '"hidden" while open, "scroll" afterwards', explanation: 'Restore the saved value — not "" or "auto".' },
    ],
    manualTests: [
      'Tab through the Edit profile modal repeatedly in both directions; focus never reaches the page behind.',
      'Open "Sign out", press Escape: focus returns to the "Sign out" button.',
      'Try to scroll the page with the wheel while a modal is open.',
      'Click on the dark area: the modal closes. Drag-select text inside the dialog and release outside — note what happens and discuss the mousedown-origin refinement.',
      'With VoiceOver/NVDA, confirm the title and description are announced when the dialog opens.',
    ],
  },
  files: {
    entry: '/App.tsx',
    starter: { ...shared, '/Modal.tsx': starterModal },
    solution: { ...shared, '/Modal.tsx': solutionModal },
    readonly: ['/App.tsx'],
    support: {},
  },
  tests: [
    { path: '/tests/helpers.tsx', visibility: 'public', kind: 'runtime', source: helpers },
    { path: '/tests/public.test.tsx', visibility: 'public', kind: 'runtime', source: publicTests },
    { path: '/tests/hidden.test.tsx', visibility: 'hidden', kind: 'runtime', source: hiddenTests },
  ],
  hints: [
    'Start with structure: `if (!open) return null`, then `createPortal(<div data-testid="modal-backdrop" onClick={...}><div role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>…</div></div>, document.body)`. Use `useId()` for the title/description ids.',
    'Put everything that happens "while open" in ONE effect keyed on `[open]`: remember `document.activeElement`, save and set `document.body.style.overflow`, focus the initial element, add a `keydown` listener. The cleanup undoes each step in reverse — including `previous.focus()`.',
    'The trap: on Tab, collect focusable elements inside the dialog (`button:not([disabled])`, `input:not([disabled])`, `[tabindex]:not([tabindex="-1"])`, …). If Shift+Tab on the first → `preventDefault()` and focus the last; Tab on the last → focus the first; nothing focusable → keep focus on the dialog. Otherwise let the browser move focus.',
    'Don\'t put `onClose` in the effect\'s dependency list — a parent\'s inline arrow changes every render, so the effect would re-run and yank focus back. Store it in a ref updated after each render and call `onCloseRef.current()`. For the backdrop, compare `e.target === e.currentTarget` so clicks inside the dialog are ignored.',
  ],
  solution: {
    initialApproach:
      'Treat the modal as a controlled component with one "while open" effect. Opening is a set of side effects — remember the invoker, lock scroll, move focus, listen for keys — and closing is exactly the reverse, which maps directly onto a React effect and its cleanup. The markup is a portalled backdrop containing an element with the dialog role.',
    bruteForce:
      'A naive version renders `{open && <div className="overlay">…</div>}` inline, closes on any click of the overlay, and listens for Escape with `useEffect(() => { document.addEventListener("keydown", …) })` without cleanup or with `[open, onClose]` dependencies. Problems: z-index/overflow clipping from ancestors (no portal), clicks inside the content bubble to the overlay and close it, listeners pile up, Tab walks out into the page behind, focus is lost to <body> on close, the body keeps `overflow: hidden` forever if the component unmounts while open, and an inline `onClose` re-runs the effect on every parent render, stealing focus back to the first field while the user types.',
    optimizedApproach: `**One effect for the open lifetime, symmetric cleanup, refs for callbacks.**

\`\`\`ts
useEffect(() => {
  if (!open) return;
  const returnFocusTo = document.activeElement;
  lockScroll();                                   // save previous overflow, set 'hidden'
  (initialFocusRef?.current ?? firstFocusable(dialog) ?? dialog).focus();
  document.addEventListener('keydown', onKeyDown); // Escape → onCloseRef.current(); Tab → wrap
  return () => {
    document.removeEventListener('keydown', onKeyDown);
    unlockScroll();                               // restore the saved value
    if (returnFocusTo?.isConnected) returnFocusTo.focus();
  };
}, [open]);
\`\`\`

- **Portal** to \`document.body\` so no ancestor's \`overflow: hidden\`, \`transform\` or stacking context can clip or trap the overlay.
- **Semantics**: \`role="dialog"\`, \`aria-modal="true"\`, \`aria-labelledby\` → the heading, \`aria-describedby\` → the description only if it exists (a dangling id reference is an a11y bug).
- **Trap in keydown**: a focus trap is "on Tab at the boundary, move focus to the other end and preventDefault". In the middle, let the browser do its job. An empty dialog keeps focus on itself (\`tabIndex={-1}\`).
- **Latest-callback ref** (\`onCloseRef\`) keeps the effect's deps at \`[open]\` while always calling the current \`onClose\`.
- **Backdrop**: \`e.target === e.currentTarget\` — clicks inside the dialog bubble to the backdrop's React handler, so the check is what makes "inside doesn't close" work.
- **Stacking (optional)**: a module-level stack of open instances; only the top one handles keys, and scroll is locked by the first and unlocked by the last.`,
    walkthrough: `1. **Ids**: \`useId()\` → \`titleId\`, \`descriptionId\`. Multiple modals on a page never collide.
2. **Refs**: \`dialogRef\` for the dialog element; \`onCloseRef\` updated by a dependency-less effect after every render.
3. **Open effect** (\`[open]\`):
   - Return early when closed — this is also why no listener exists while closed.
   - Capture \`document.activeElement\` *before* moving focus; that is the invoker to return to.
   - If no other modal is open, save \`document.body.style.overflow\` and set \`"hidden"\`; push this instance on the stack.
   - Focus \`initialFocusRef.current\`, else the first tabbable element (selector list filtered by \`getClientRects().length > 0\` to skip hidden ones), else the dialog.
   - \`keydown\` on \`document\`: ignore if not top-most; Escape (not while \`isComposing\`) → \`onCloseRef.current()\`; Tab → wrap at the ends with \`preventDefault()\`, pull focus back if it is outside the dialog, keep focus on the dialog if nothing is tabbable.
   - **Cleanup**: remove the listener, pop the stack, restore overflow if the stack is empty, and focus the invoker if it is still connected.
4. **Render**: \`if (!open) return null\`, then \`createPortal(backdrop > dialog > [h2#title, p#description?, children], document.body)\`.
5. **Backdrop** \`onClick\`: call \`onCloseRef.current()\` only when \`e.target === e.currentTarget\`.

Why a \`document\` listener instead of \`onKeyDown\` on the dialog? It works even if focus was lost to \`<body>\` and, combined with the stack, gives "top-most only" semantics without relying on React's bubbling through nested portals (where an inner modal's keydown would also reach an outer modal's \`onKeyDown\`).`,
    complexity:
      'Opening and closing are O(1) apart from focusing. Each Tab press queries the focusable descendants — O(d) for d descendants — which is negligible for dialog-sized DOM and always reflects dynamic content (fields that appear or become disabled). Memory: one listener and a few references per open modal.',
    edgeCases:
      '- Invoker removed while the modal was open (e.g. a deleted row\'s button): `isConnected` is false, so don\'t focus a detached node; a production API might accept a `returnFocusRef` fallback.\n- Unmount while open: the same cleanup restores scroll and focus.\n- No focusable content: the dialog itself (tabIndex=-1) receives focus and keeps it on Tab.\n- Disabled or hidden controls: excluded from the tabbable list.\n- `tabindex` > 0 inside the dialog breaks DOM-order assumptions; avoid it or sort by tabIndex.\n- Escape while composing text with an IME (`isComposing`) should cancel composition, not the dialog.\n- Drag-to-select starting inside the dialog and releasing on the backdrop produces a click on the backdrop in some browsers; track where `mousedown` started if that matters.\n- Stacked modals: the inner one returns focus into the outer one; scroll unlocks only after the outermost closes.\n- React StrictMode runs the effect twice in development: the symmetric cleanup makes that harmless.',
    alternatives:
      '- **Native `<dialog>` + `showModal()`**: rendered in the top layer (no portal or z-index fights), the rest of the page becomes inert, Escape fires a `cancel` event, `::backdrop` is styleable, and focus is returned on close by the browser. You still need to sync `open` with `showModal()/close()` in an effect, handle backdrop clicks (click target is the dialog element itself), and scroll lock is not automatic.\n- **`inert` on the app root** (or every sibling of the portal container) while open: background content can\'t be focused, clicked or found by assistive tech — a stronger guarantee than a keydown trap, which can\'t stop screen-reader virtual cursors or mouse clicks on a transparent backdrop. Typically combined with the trap.\n- **`aria-hidden="true"` on siblings**: the older approach for hiding the background from assistive tech; it doesn\'t prevent focus, so it must be combined with a trap.\n- **`focusin` listener** that pulls focus back when it lands outside the dialog — catches programmatic focus and clicks, complementing the Tab handler.\n- **Libraries** (Radix Dialog, React Aria\'s useModal/FocusScope, focus-trap) handle nested layers, portals, scroll-lock scrollbar compensation and many browser quirks.',
    tradeoffs:
      '- Document-level keydown vs `onKeyDown` on the dialog: document-level works when focus is lost and with stacking; element-level is more local but React bubbles synthetic events through portals to React ancestors, which can surprise nested modals.\n- Reading `initialFocusRef` only on open is intentional; reacting to later changes would steal focus.\n- Locking via `overflow: hidden` on `<body>` is simple but causes layout shift when the scrollbar disappears and doesn\'t stop iOS Safari rubber-band scrolling; compensating padding or `position: fixed` with saved scroll offset are heavier fixes.\n- A custom implementation teaches the mechanics; native `<dialog>` reduces code and bugs but limits animation control and still needs React glue.\n- Closing on backdrop click is convenient but risky for forms with unsaved data — make it configurable.',
    commonMistakes:
      '- Closing on any backdrop click without checking the target, so clicks inside the content close it.\n- Missing effect cleanup: listeners leak, `overflow: hidden` remains after close/unmount.\n- Restoring overflow to `""` instead of the previous value.\n- Putting `onClose` in the effect deps, so every parent render re-focuses the first field.\n- Capturing `onClose` once without a ref, then calling a stale callback.\n- Forgetting to move focus in (screen readers don\'t notice the dialog) or to restore it (keyboard users are dumped at the top of the page).\n- Relying on Tab keydown events to move focus in tests — synthetic events don\'t; the component must move focus itself at the boundaries.\n- Including disabled or hidden elements in the focusable list, so Tab "dies" on an element that can\'t take focus.\n- A dangling `aria-describedby` that references an element that isn\'t rendered.\n- Using `aria-hidden` on the portal container\'s ancestors in a way that also hides the dialog.',
    testingStrategy:
      'Run in a real browser so `focus()` and `document.activeElement` are real. Focus the trigger before clicking it (a synthetic click doesn\'t move focus) so focus restoration can be asserted. Query by role and name (`dialog` "Settings", `textbox` "Display name", `button` "Cancel"). For the trap, focus the boundary element, fire keydown Tab / Shift+Tab, and assert the new `activeElement` plus that the event was default-prevented (`fireEvent` returns false). Assert portal placement with `container.contains(dialog) === false`. Test scroll lock with a non-default initial overflow value to catch "restore to empty string". Test effect hygiene: no Escape handling while closed, and re-rendering with a new `onClose` keeps focus where the user put it and calls only the newest callback.',
    seniorFollowUps:
      '- Migrate to native `<dialog>`/`showModal()`: what React glue remains, and how do the `cancel`/`close` events map to `onClose`?\n- Make the background `inert` while open; where does the portal container need to live for that to work?\n- Nested/stacked modals and toasts: design a layer manager (z-order, Escape routing, focus return chain).\n- Animations: keep the dialog mounted during the exit transition, respect `prefers-reduced-motion`, and only restore focus after it\'s gone.\n- SSR: `document` doesn\'t exist on the server — how do you portal safely and avoid hydration mismatches?\n- Async confirm: `onConfirm` returns a promise; show pending state, prevent double submit, and decide whether Escape can cancel mid-request.',
  },
  followUps: [
    { id: 'f1', level: 'definition', question: 'What does aria-modal="true" tell assistive technology, and what does it NOT do?', expectedConcepts: ['content outside the dialog is inert for AT', 'does not trap keyboard focus', 'does not block mouse clicks', 'still need a trap or inert'], sourceIds: ['apg-dialog-modal'] },
    { id: 'f2', level: 'mechanism', question: 'A click on a button inside the portalled dialog also triggers an onClick on a React ancestor of <Modal>, even though the DOM nodes are not nested. Why?', expectedConcepts: ['synthetic events follow the React tree', 'portals preserve React context and bubbling', 'stopPropagation or target checks', 'native events follow the DOM tree'], sourceIds: ['react-create-portal'] },
    { id: 'f3', level: 'application', question: 'Rewrite the component with the native <dialog> element. What do you get for free, and what still needs code?', expectedConcepts: ['showModal() top layer', 'background inert', 'Escape fires cancel', '::backdrop', 'sync open prop with showModal/close in an effect', 'backdrop click detection'], sourceIds: ['mdn-dialog'] },
    { id: 'f4', level: 'edge-cases', question: 'The button that opened the modal is deleted while the modal is open (e.g. "Delete row"). Where should focus go when the modal closes?', expectedConcepts: ['isConnected check', 'fallback focus target (next row, list container)', 'never leave focus on body', 'returnFocusRef API'], sourceIds: ['apg-dialog-modal'] },
    { id: 'f5', level: 'production', question: 'Screen-reader users can still reach page content behind your modal with the virtual cursor. How do you fix that?', expectedConcepts: ['inert attribute on background', 'aria-hidden on siblings (legacy)', 'portal container outside the inert subtree', 'native dialog makes background inert'], sourceIds: ['mdn-inert', 'apg-dialog-modal'] },
    { id: 'f6', level: 'architecture', question: 'Design a modal system for a large app: imperative `confirm()` calls from anywhere, stacked layers, and route changes. What does the API look like?', expectedConcepts: ['provider + context with a layer stack', 'promise-returning confirm()', 'focus return chain', 'close on navigation', 'declarative <Modal> for simple cases'], sourceIds: ['react-context', 'react-create-portal'] },
  ],
  mcqs: [
    {
      id: 'm1',
      question: 'A modal is open and focus is on its last focusable button. A test dispatches a synthetic `keydown` Tab event on that button but the component has no Tab handling. Where is focus afterwards?',
      options: [
        { id: 'a', text: 'On the first focusable element in the dialog', explanation: 'Only if your keydown handler moves it there; the browser does not.' },
        { id: 'b', text: 'Still on the last button', explanation: 'Correct — synthetic (untrusted) key events do not trigger the browser\'s default focus navigation, which is why the trap logic must move focus itself.' },
        { id: 'c', text: 'On the next focusable element in the page behind the modal', explanation: 'That is what a real Tab key press would do without a trap, not a synthetic event.' },
        { id: 'd', text: 'On document.body', explanation: 'Nothing blurs the button.' },
      ],
      correctOptionId: 'b',
      explanation: 'Dispatching an event does not perform the default action of a real key press. A focus trap therefore works by handling keydown at the boundaries, calling preventDefault and focusing the target element explicitly.',
      sourceIds: ['apg-dialog-modal'],
    },
    {
      id: 'm2',
      question: 'Which statement about rendering a modal with `createPortal(node, document.body)` is true?',
      options: [
        { id: 'a', text: 'The modal loses access to React context from its parents', explanation: 'Portals keep the React tree: context still flows from the component that renders the portal.' },
        { id: 'b', text: 'React events from inside the portal bubble to React ancestors of the component that rendered it', explanation: 'Correct — synthetic events follow the React tree, not the DOM tree.' },
        { id: 'c', text: 'Native DOM events from inside the portal bubble to the parent component\'s DOM container', explanation: 'Native events follow the DOM: they bubble to body/document, not to the React parent\'s DOM node.' },
        { id: 'd', text: 'Portalled content is automatically made modal and inert-protected', explanation: 'A portal only changes where the DOM nodes are mounted; modality is your job.' },
      ],
      correctOptionId: 'b',
      explanation: 'A portal moves DOM placement only. Context and synthetic event propagation still follow the React component tree.',
      sourceIds: ['react-create-portal'],
    },
    {
      id: 'm3',
      question: 'What does `dialog.showModal()` provide that a `<div role="dialog">` does not?',
      options: [
        { id: 'a', text: 'Rendering in the top layer and making the rest of the document inert', explanation: 'Correct — modal <dialog> elements are placed in the top layer and content outside them becomes inert, and Escape triggers a cancel event.' },
        { id: 'b', text: 'Automatic body scroll locking', explanation: 'Scrolling the page behind is not prevented by showModal(); you still lock scroll yourself.' },
        { id: 'c', text: 'Automatic closing when the ::backdrop is clicked', explanation: 'Not by default: you detect backdrop clicks yourself (some newer browsers add an opt-in closedby attribute).' },
        { id: 'd', text: 'Nothing; they are equivalent', explanation: 'The native element brings top-layer rendering, inertness and Escape handling.' },
      ],
      correctOptionId: 'a',
      explanation: 'showModal() opens the dialog in the top layer, makes the rest of the page inert and supports Escape via the cancel event; scroll locking and backdrop-click handling remain your responsibility.',
      sourceIds: ['mdn-dialog', 'mdn-inert'],
    },
  ],
};

export default problem;
