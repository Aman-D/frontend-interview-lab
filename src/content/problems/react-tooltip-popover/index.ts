import type { CodingProblem } from '../../schema';
import types from './starter/types.ts?raw';
import app from './starter/App.tsx?raw';
import styles from './starter/styles.css?raw';
import starterPosition from './starter/position.ts?raw';
import starterHook from './starter/useAnchoredPosition.ts?raw';
import starterTooltip from './starter/Tooltip.tsx?raw';
import starterPopover from './starter/Popover.tsx?raw';
import solutionPosition from './solution/position.ts?raw';
import solutionHook from './solution/useAnchoredPosition.ts?raw';
import solutionTooltip from './solution/Tooltip.tsx?raw';
import solutionPopover from './solution/Popover.tsx?raw';
import helpers from './tests/helpers.tsx?raw';
import positionTests from './tests/position.test.ts?raw';
import positionHiddenTests from './tests/position.hidden.test.ts?raw';
import publicTests from './tests/public.test.tsx?raw';
import hiddenTests from './tests/hidden.test.tsx?raw';

const shared = { '/App.tsx': app, '/styles.css': styles, '/types.ts': types };

const problem: CodingProblem = {
  schemaVersion: 1,
  kind: 'coding',
  id: 'react-tooltip-popover',
  slug: 'tooltip-popover',
  title: 'Tooltip & Popover',
  track: 'react',
  execution: 'react',
  difficulty: 'hard',
  priority: 'P1',
  seniority: ['Senior', 'SDE-2', 'SDE-3', 'MTS'],
  topics: ['floating UI positioning', 'collision detection (flip/shift)', 'portals', 'tooltip a11y', 'WCAG 1.4.13', 'non-modal dialog', 'focus management', 'timers'],
  estimatedMinutes: 75,
  conceptIds: ['react-portals', 'focus-management', 'keyboard-navigation', 'react-effects', 'fake-timers', 'event-propagation', 'closures', 'dialog-aria-pattern'],
  research: {
    provenance: 'PUBLISHED_PRACTICE_PROBLEM',
    frequencyConfidence: 'HIGH_CONFIDENCE',
    verificationStatus: 'SOURCES_VERIFIED',
    lastVerified: '2026-11-23',
    evidence: [
      { sourceId: 'fih-sd-ui', url: 'https://www.frontendinterviewhandbook.com/front-end-system-design/ui-components', originalTitle: 'Tooltip', note: 'Listed as a UI component system-design example.' },
      { sourceId: 'alla-components', url: 'https://allahabadi.dev/frontend-system-design/components/', originalTitle: 'Design a Tooltip', note: 'Question 08 in the component design list (framed as system design; used as supporting evidence).' },
      { sourceId: 'fg-mc', url: 'https://www.frontendgeek.com/frontend-interview/machine-coding-interview', originalTitle: 'Popover', note: 'Listed under "Component machine coding".' },
    ],
    researchNotes:
      'Three independent sources list a tooltip or popover: two as component system design (Tooltip) and one as a machine-coding component (Popover). They are combined here because the interesting engineering — portal rendering, measuring and collision-aware placement — is shared, while the accessibility contracts differ sharply (a tooltip is a non-interactive description, a popover is an interactive non-modal dialog), which is exactly what senior interviewers probe. The 60–75 minute scope is: a pure computePosition helper with flip + shift on four sides, a Tooltip that meets WCAG 1.4.13 (hover/focus, delay, hoverable, dismissible with Escape), and a click Popover with aria-expanded/aria-controls, focus in, Escape/outside-press dismissal and focus return. Arrows, nested popovers, virtual elements, animation and the native Popover API / CSS anchor positioning are discussed in the solution and follow-ups rather than required.',
  },
  spec: {
    summary: 'Build a WCAG-compliant Tooltip and an interactive click Popover that share a pure, unit-tested positioning helper with flip and shift, rendered through portals.',
    description: `Implement three pieces that share one positioning engine.

### 1. \`computePosition\` in **position.ts** (pure — no DOM access)

\`\`\`ts
computePosition(trigger: Rect, floating: Size, viewport: Size, placement: Placement, options?: { offset?: number; padding?: number }): Position
// Rect = { top, left, width, height } in viewport coordinates; Position = { top, left, placement }
\`\`\`

- \`offset\` (default 8) is the gap between trigger and floating element; \`padding\` (default 8) is the minimum distance to every viewport edge.
- **Main axis.** Use \`placement\` if the floating element fits between the trigger (+ offset) and the viewport edge (− padding) — an exact fit counts. Otherwise **flip** to the opposite side if it fits there. If neither fits, use the side with **more room** (a tie keeps the requested side).
- **Cross axis.** Centre on the trigger, then **shift** so it stays \`padding\` away from both edges. If it is larger than the viewport, align it to the start edge (\`padding\`).
- Return the side actually used in \`placement\`. Do not round.

### 2. \`<Tooltip content placement? delay? hideDelay?>{trigger}</Tooltip>\` in **Tooltip.tsx**

- A \`role="tooltip"\` element with an id, rendered through a **portal into \`document.body\`**, positioned with \`position: fixed\` using \`useAnchoredPosition\` (and therefore \`computePosition\`). Put the resolved side on it as \`data-placement\`.
- The trigger (the single child) gets \`aria-describedby\` pointing at the tooltip — **not** a label: the trigger keeps its own name. Merge with an \`aria-describedby\` the child already has.
- Shows **after \`delay\`** (default 300 ms) on **mouseenter and on keyboard focus**. Leaving before the delay cancels it.
- **Hoverable**: on mouseleave, wait \`hideDelay\` (default 100 ms) before hiding; entering the tooltip in that window keeps it open, and leaving the tooltip starts the same grace period.
- **Persistent**: it stays while either the pointer (over trigger or tooltip) or focus holds it. Blur hides it unless the pointer is still over it.
- **Dismissible**: Escape hides it without moving pointer or focus.
- Non-interactive content only; no timers may fire after unmount.

### 3. \`<Popover trigger content placement? onOpenChange?>\` in **Popover.tsx**

- \`trigger\` is a button element. Clicking it **toggles** the popover. It gets \`aria-haspopup="dialog"\`, \`aria-expanded\` ("true"/"false"), and \`aria-controls\` = the panel id **while open**. Keep the trigger's own \`onClick\`.
- The panel is a non-modal \`role="dialog"\` **labelled by the trigger** (\`aria-labelledby\`), portalled into \`document.body\`, positioned like the tooltip (default \`'bottom'\`, with \`data-placement\`).
- On open, focus the **first focusable** element inside, else the panel itself (\`tabIndex={-1}\`).
- **Escape** and a **press outside** (a \`mousedown\` whose target is in neither the trigger nor the panel) close it and **return focus to the trigger**. A press on the trigger while open must close it — not close-then-reopen.
- \`onOpenChange(open)\` is called once per actual change. No document listeners remain while closed.

**useAnchoredPosition.ts** is yours to finish: measure on open (before paint), re-measure on resize and on scroll of any container, clean up.

\`App.tsx\` (read-only) shows a toolbar with tooltips, a filter popover, and two triggers pinned to the viewport corners so you can watch flip and shift in the preview.`,
    technologies: ['React 18', 'TypeScript', 'react-dom createPortal', 'useLayoutEffect', 'WAI-ARIA tooltip pattern', 'WCAG 2.2 SC 1.4.13'],
    learningObjectives: [
      'Separate geometry (a pure, unit-testable function) from DOM measurement and React state',
      'Implement collision handling: flip on the main axis, shift on the cross axis',
      'Meet WCAG 1.4.13 for hover/focus content: hoverable, dismissible, persistent',
      'Distinguish a tooltip (description, non-interactive) from a popover (interactive non-modal dialog) in ARIA and focus behaviour',
      'Manage timers, document listeners and focus return with symmetric effect cleanup',
      'Know when the native Popover API and CSS anchor positioning replace this code',
    ],
    clarifications: [
      { question: 'Can the tooltip contain interactive content such as links or buttons?', why: 'A tooltip is never focusable; interactive content needs a popover/dialog with focus management, or keyboard users cannot reach it.', defaultAssumption: 'Tooltip content is plain, non-interactive text; anything interactive goes in the Popover.' },
      { question: 'Should the tooltip appear on keyboard focus, and with the same delay as hover?', why: 'Hover-only tooltips exclude keyboard and many assistive-tech users; the delay prevents flicker when the pointer sweeps across a toolbar.', defaultAssumption: 'Both hover and focus show it after `delay` (300 ms); Escape and blur hide it.' },
      { question: 'What happens when there is not enough room on the preferred side?', why: 'Defines the collision strategy and how it is tested; real products also care about arrows and scroll containers.', defaultAssumption: 'Flip to the opposite side if it fits there, else the side with more room; shift along the cross axis to keep an 8px padding.' },
      { question: 'Does an outside click return focus to the trigger, and does the popover close when focus leaves it?', why: 'Returning focus is essential when focus was inside the panel (it would otherwise drop to <body>); stealing focus from a control the user just clicked would be wrong.', defaultAssumption: 'Escape and outside press return focus to the trigger (the browser then moves focus to a clicked focusable control); tabbing out closes it without moving focus.' },
      { question: 'Must it support touch devices and long-press?', why: 'There is no hover on touch; tooltips that carry essential information fail there.', defaultAssumption: 'Out of scope; essential information should not live only in a tooltip. Touch behaviour is a follow-up.' },
    ],
    scopeDecisions: [
      'No arrow element (computing the arrow offset after a shift is a follow-up).',
      'Viewport collision only — no clipping by scrollable ancestors other than the viewport.',
      'No enter/exit animations.',
      'Popover is uncontrolled; a controlled `open` prop is discussed as a follow-up.',
      'No nested popovers; the outside-press check uses DOM containment only.',
    ],
    requirements: [
      { id: 'compute-flip', category: 'functional', level: 'MUST', text: 'computePosition flips to the opposite side when the preferred side does not fit, and uses the roomier side when neither fits.' },
      { id: 'compute-shift', category: 'functional', level: 'MUST', text: 'computePosition centres on the cross axis and shifts to keep `padding` from both edges; oversized elements align to the start padding.' },
      { id: 'compute-pure', category: 'technical', level: 'MUST', text: 'computePosition is pure: it uses only its arguments (not window), returns the resolved placement and does not mutate inputs.' },
      { id: 'tooltip-show', category: 'functional', level: 'MUST', text: 'Tooltip shows after `delay` on mouseenter and on focus; leaving before the delay cancels the pending show.' },
      { id: 'tooltip-hoverable', category: 'accessibility', level: 'MUST', text: 'Hoverable: after mouseleave the tooltip waits `hideDelay`; moving onto the tooltip keeps it open.' },
      { id: 'tooltip-dismiss', category: 'accessibility', level: 'MUST', text: 'Dismissible: Escape hides the tooltip without moving pointer or focus; blur hides it unless the pointer still holds it.' },
      { id: 'tooltip-aria', category: 'accessibility', level: 'MUST', text: 'role="tooltip" element referenced by the trigger\'s aria-describedby (merged with any existing value); the trigger keeps its own accessible name.' },
      { id: 'popover-toggle', category: 'functional', level: 'MUST', text: 'Clicking the trigger toggles the popover; the trigger\'s own onClick still runs; onOpenChange fires once per change.' },
      { id: 'popover-aria', category: 'accessibility', level: 'MUST', text: 'Trigger has aria-haspopup="dialog", aria-expanded and aria-controls (while open); the panel is role="dialog" labelled by the trigger.' },
      { id: 'popover-focus', category: 'accessibility', level: 'MUST', text: 'On open, focus the first focusable element in the panel (else the panel); Escape and outside press close it and return focus to the trigger.' },
      { id: 'portal-position', category: 'technical', level: 'MUST', text: 'Both floating elements render through a portal into document.body with position: fixed and expose the resolved side as data-placement.' },
      { id: 'measure-before-paint', category: 'performance', level: 'SHOULD', text: 'Measure and position in a layout effect (no visible jump), re-measure on resize and scroll (capture), and skip state updates when nothing moved.' },
      { id: 'cleanup', category: 'technical', level: 'MUST', text: 'No timers fire after unmount; no document listeners exist while closed.' },
      { id: 'trigger-press', category: 'edge-case', level: 'MUST', text: 'A press on the trigger while the popover is open closes it (the outside-press handler ignores the trigger).' },
      { id: 'tab-out', category: 'edge-case', level: 'SHOULD', text: 'Tabbing out of the popover closes it without pulling focus back.' },
      { id: 'tests', category: 'testing', level: 'SHOULD', text: 'Unit-test computePosition with plain rects; drive timers with fake timers; assert real focus and real bounding rects at the viewport edges.' },
    ],
    constraints: ['React function components and hooks only.', 'No positioning or popover libraries (no Floating UI, Popper, Radix).', 'Do not change the exported props, types.ts or App.tsx.', 'The tooltip and popover panel must expose data-placement with the resolved side.'],
    acceptanceCriteria: [
      'All public tests pass (computePosition: both vertical sides, both flips, shift at both edges; Tooltip: delay, describedby, portal, focus/blur, Escape; Popover: toggle with ARIA state, focus in, Escape and outside press with focus return).',
      'All hidden tests pass (left/right placement and flips, roomier-side fallback, inclusive fit, oversized element, options, purity; hoverable tooltip, cancelled delay and no timers after unmount, describedby merge, hover+focus persistence, real flip/shift at the viewport edge; trigger press while open, dialog name and panel focus, onClick composition and listener cleanup, real flip at the bottom edge).',
      'Manual: in the preview, the corner tooltip flips below and stays on screen; the help popover opens above its trigger.',
    ],
    examples: [
      { title: 'Fits below', input: 'trigger {top:100,left:100,w:80,h:30}, floating {w:120,h:40}, viewport 800×600, "bottom"', output: '{ top: 138, left: 80, placement: "bottom" }', explanation: 'top = 130 + 8; left = centre 140 − 60.' },
      { title: 'Flip', input: 'same, trigger top 20, "top"', output: '{ top: 58, left: 80, placement: "bottom" }', explanation: 'Above needs 40px but only 4px are available (20 − 8 − 8).' },
      { title: 'Shift', input: 'trigger {left:760,w:40}, floating width 200, "bottom"', output: 'left 592', explanation: 'Centred left would be 680; the maximum is 800 − 8 − 200.' },
      { title: 'Hoverable', input: 'hover "Archive" 300ms → tooltip; leave trigger, enter tooltip within 100ms', output: 'tooltip stays until the pointer leaves the tooltip + 100ms' },
    ],
    manualTests: [
      'Sweep the pointer quickly across the toolbar: no tooltip flashes (the delay is cancelled).',
      'Hover "Link", then move the pointer onto its tooltip and hold it there; it stays. Press Escape: it goes.',
      'Tab to "Bold": its tooltip appears; Tab on: it moves to "Italic".',
      'Open Filters, toggle a checkbox, press Escape: focus is back on Filters. Open it again and click the page background.',
      'Resize the preview and scroll: open floating elements follow their triggers.',
      'With a screen reader, focus "Bold": it is announced as "Bold, button" followed by the description.',
    ],
  },
  files: {
    entry: '/App.tsx',
    starter: { ...shared, '/position.ts': starterPosition, '/useAnchoredPosition.ts': starterHook, '/Tooltip.tsx': starterTooltip, '/Popover.tsx': starterPopover },
    solution: { ...shared, '/position.ts': solutionPosition, '/useAnchoredPosition.ts': solutionHook, '/Tooltip.tsx': solutionTooltip, '/Popover.tsx': solutionPopover },
    readonly: ['/App.tsx', '/types.ts'],
    support: {},
  },
  tests: [
    { path: '/tests/helpers.tsx', visibility: 'public', kind: 'runtime', source: helpers },
    { path: '/tests/position.test.ts', visibility: 'public', kind: 'runtime', source: positionTests },
    { path: '/tests/public.test.tsx', visibility: 'public', kind: 'runtime', source: publicTests },
    { path: '/tests/position.hidden.test.ts', visibility: 'hidden', kind: 'runtime', source: positionHiddenTests },
    { path: '/tests/hidden.test.tsx', visibility: 'hidden', kind: 'runtime', source: hiddenTests },
  ],
  hints: [
    'Start with the pure function. Write `spaceOn(side)` = room between trigger+offset and the viewport edge−padding for each of the four sides. Flip when `spaceOn(preferred) < size` and the opposite side fits (or simply has more room). Then compute the main-axis coordinate for the chosen side and `clamp(centred, padding, viewportSize − padding − floatingSize)` on the cross axis, with `Math.max(min, Math.min(v, max))` so the start edge wins when the element is too big.',
    'Tooltip state: `open` in state, but "why it is open" (`hovered`, `focused`) and the timer id in refs — they are read in timeouts and never rendered. `show()` = clear timer, schedule `setOpen(true)` after `delay`. `hide(ms)` = clear timer, return early if hovered or focused, otherwise schedule (or immediately run) `setOpen(false)`.',
    'Wiring: clone the child with `aria-describedby` (append to its existing value). Put the pointer/focus handlers on a wrapper with `display: contents` (React onFocus/onBlur bubble) and measure `wrapper.firstElementChild`. The portalled tooltip gets its own mouseenter (cancel the hide timer) and mouseleave (start it). Escape: a `keydown` listener on `document` that exists only while open.',
    'Popover: clone the trigger with `id`, `ref`, `aria-haspopup`, `aria-expanded`, `aria-controls` and a composed `onClick` that toggles. One effect keyed on `[open]` focuses the first focusable element and adds `keydown` (Escape) and `mousedown` (outside) listeners on `document` — ignore presses inside the panel **or the trigger**, or the trigger click will reopen what mousedown just closed. Focus the trigger before closing so focus is never dropped on <body>.',
  ],
  solution: {
    initialApproach:
      'Split the problem in three layers. Geometry is a pure function from rectangles to coordinates — easy to reason about and to unit-test without a DOM. Measurement is a small hook that reads `getBoundingClientRect()` for the trigger and floating element in a layout effect and feeds the pure function. Behaviour and semantics live in two thin components: the Tooltip (hover/focus timers, aria-describedby, Escape) and the Popover (toggle, ARIA state, focus in/out, outside press). Both portal to `document.body` and use `position: fixed`, so viewport coordinates from `getBoundingClientRect()` can be applied directly with no scroll maths.',
    bruteForce:
      'The naive tooltip is `{hover && <span className="tooltip">…</span>}` inside the trigger\'s wrapper with CSS `position: absolute; bottom: 100%`. It is clipped by any ancestor with `overflow: hidden`, sits under later stacking contexts, never flips at the viewport edge, flashes as the pointer sweeps past, ignores keyboard users, vanishes the instant the pointer moves toward it (failing WCAG 1.4.13 "hoverable") and cannot be dismissed with Escape. The naive popover toggles a sibling div, has no ARIA state, leaves focus on the trigger, closes on any document click including the trigger\'s own (so it reopens immediately), and leaks listeners.',
    optimizedApproach: `**Pure geometry + layout-effect measurement + timer/ref state machine.**

\`\`\`ts
// position.ts — four sides, flip then shift
const room = spaceOn(placement);                       // trigger→edge minus offset and padding
let side = placement;
if (room < need && (spaceOn(opposite) >= need || spaceOn(opposite) > room)) side = opposite;
const main = side === 'top' ? t.top - offset - f.height : t.top + t.height + offset;  // etc.
const cross = clamp(centre - f.width / 2, padding, vw - padding - f.width);
\`\`\`

- **useAnchoredPosition** runs in \`useLayoutEffect\`: the floating element is in the DOM (so it can be measured) but not yet painted, so the corrected position is applied before the user sees anything. It also listens to \`resize\` and \`scroll\` **in the capture phase** (scroll does not bubble, but capture on \`window\` sees scrolls of every container) and bails out of \`setState\` when nothing moved.
- **Tooltip** keeps \`open\` in state and its *reasons* (\`hovered\`, \`focused\`) plus the timer id in refs. Every transition clears the previous timer first, so there is at most one pending timer and none after unmount.
- **WCAG 1.4.13**: *hoverable* via the hide grace period plus mouseenter on the tooltip; *dismissible* via a document Escape listener that exists only while open; *persistent* because it hides only when neither pointer nor focus holds it.
- **Tooltip semantics**: the tooltip element stays mounted (with \`hidden\` while closed) so \`aria-describedby\` always resolves and assistive tech can read the description as soon as the trigger is focused, even before the visual delay.
- **Popover semantics**: \`aria-haspopup="dialog"\`, \`aria-expanded\`, \`aria-controls\` while open, and a \`role="dialog"\` panel labelled by the trigger. Focus moves in on open and returns to the trigger on Escape/outside press.
- **Outside press** uses \`mousedown\` and ignores the trigger, otherwise mousedown closes and the subsequent click toggles it open again.`,
    walkthrough: `1. **computePosition** — \`spaceOn(side)\` for all four sides, the flip decision, then the main-axis coordinate for the chosen side and a clamped cross-axis coordinate. Return \`{ top, left, placement: side }\`.
2. **useAnchoredPosition(open, getAnchor, floatingRef, placement)** — keep the latest \`getAnchor\` in a ref so callers can pass inline functions. In a layout effect keyed on \`[open, placement]\`: \`update()\` measures both rects, reads the viewport from \`documentElement.clientWidth/Height\` (excludes scrollbars), calls \`computePosition\` and sets state only when the result changed. Subscribe to \`resize\` and capture-phase \`scroll\`; unsubscribe in cleanup.
3. **Tooltip**
   - \`useId()\` for the tooltip id; clone the single child with \`aria-describedby\` appended.
   - Wrapper \`<span style={{display:'contents'}}>\` carries \`onMouseEnter/onMouseLeave/onFocus/onBlur\`; React's focus events bubble, and \`display: contents\` adds no box, so the anchor measured is \`wrapper.firstElementChild\`.
   - \`show()\` clears and schedules \`setOpen(true)\` after \`delay\`; \`hide(ms)\` clears, returns if \`hovered || focused\`, else schedules \`setOpen(false)\` (immediately for blur).
   - The portalled tooltip's \`onMouseEnter\` sets \`hovered\` and clears the hide timer; \`onMouseLeave\` starts it again. Because the portal is a *sibling* of the wrapper in the React tree, React's enter/leave events on the tooltip do not also fire on the wrapper.
   - A \`keydown\` listener on \`document\` while open handles Escape; an unmount effect clears any timer.
4. **Popover**
   - Clone the trigger with \`id\` (keep an existing one), a merged \`ref\`, ARIA attributes and an \`onClick\` that runs the original first and then toggles (unless it called \`preventDefault()\`).
   - \`setOpenState(next)\` guards against no-op changes so \`onOpenChange\` fires exactly once per change; a ref mirrors \`open\` for handlers.
   - Effect keyed on \`[open]\`: focus the first focusable element (or the panel); add \`keydown\` (Escape) and \`mousedown\` (outside = not in panel, not in trigger) listeners; remove them in cleanup.
   - \`close(returnFocus)\` focuses the trigger *before* the panel unmounts, so focus never lands on \`<body>\`.
   - \`onBlur\` on the panel closes it (without moving focus) when \`relatedTarget\` is outside both panel and trigger — the Tab-out case.`,
    complexity:
      'computePosition is O(1). Each open floating element costs two `getBoundingClientRect()` calls per update; on scroll that can run every frame, so the bail-out on unchanged results matters, and very scroll-heavy pages throttle updates with requestAnimationFrame. Memory: one portal node per mounted Tooltip (kept mounted for aria-describedby), one timer at most, and listeners only while open.',
    edgeCases:
      '- Trigger at a viewport corner: flip on the main axis and shift on the cross axis at the same time.\n- Floating element larger than the viewport: the clamp range is empty; aligning to the start edge keeps the beginning readable.\n- Neither side fits: choose the roomier side rather than oscillating; a production version also shrinks (max-height + scroll) or tries the perpendicular sides.\n- The tooltip changes size after positioning (text wraps differently at its new left): re-measure with a ResizeObserver or a second pass.\n- Pointer sweeps across many triggers: each mouseleave before the delay cancels its timer, so nothing flashes; libraries add a "warm-up" so adjacent tooltips open instantly once one is open.\n- Escape inside a modal that contains an open tooltip: ideally Escape closes only the tooltip (stop propagation or a layer manager), not both.\n- Popover trigger pressed while open: the outside-press handler must ignore the trigger or it reopens.\n- Nested popovers: a child popover is portalled outside the parent panel\'s DOM, so DOM containment says "outside"; track containment through the React tree (React events bubble through portals) or a layer stack.\n- Trigger scrolled out of view while open: either follow it, hide the floating element, or close it.\n- IME composition: ignore Escape while `isComposing`.',
    alternatives:
      '- **Native Popover API** (`popover` attribute + `popovertarget`): the element is rendered in the top layer (no portal, no z-index wars), gets light dismiss (outside click and Escape) for `popover="auto"`, and the invoker gets the correct expanded state exposed to assistive tech. `popover="hint"` is designed for tooltip-like hints. You still need positioning and, for tooltips, hover/focus timing.\n- **CSS anchor positioning** (`anchor-name`, `position-anchor`, `position-area`/`anchor()`, `position-try-fallbacks: flip-block`): the browser positions and flips the element on every frame with no JavaScript measurement; combine it with the Popover API for a nearly JS-free popover. Browser support needs checking, so ship the JS fallback.\n- **Floating UI / Popper**: battle-tested middleware (offset, flip, shift, size, arrow, hide, autoUpdate with ResizeObserver and scroll ancestors, virtual elements).\n- **`title` attribute**: free, but not keyboard-accessible, not styleable, inconsistent with assistive tech and fails 1.4.13.\n- **Render the tooltip only while open** (instead of keeping it mounted): fewer DOM nodes on pages with hundreds of triggers, at the cost of `aria-describedby` pointing at nothing while closed and the description arriving after the delay.',
    tradeoffs:
      '- Keeping every tooltip mounted gives reliable descriptions but adds a portal node per trigger; for large tables, mount on first interaction or share a single tooltip element.\n- A wrapper with `display: contents` avoids cloning refs onto arbitrary children and does not affect layout, but it is an extra element in the tree and cannot be measured itself; cloning the child with a merged ref is cleaner when the child forwards refs.\n- `position: fixed` + viewport coordinates avoids scroll maths but breaks inside an ancestor with `transform`/`filter` (it becomes the containing block); the top layer (Popover API) avoids that entirely.\n- `mousedown` for outside presses closes before focus moves and avoids drag-release false positives, but touch-only flows may prefer `pointerdown`.\n- Returning focus to the trigger on outside press is safe because the browser re-focuses a clicked control afterwards, but it can scroll the trigger into view on long pages; some designs skip focus return when the press target is focusable.\n- A fixed `delay` is simple; UX teams often want "instant if another tooltip was just open".',
    commonMistakes:
      '- Using `aria-labelledby` (or `aria-label`) for the tooltip: it replaces the trigger\'s name instead of describing it.\n- Hiding on mouseleave immediately, so the pointer can never reach the tooltip (fails 1.4.13 hoverable).\n- Showing on hover only — keyboard users never see it.\n- Forgetting to cancel the show timer on mouseleave, so tooltips flash after the pointer has gone, or timers that call setState after unmount.\n- Putting interactive content in a tooltip.\n- Measuring in `useEffect` (one frame at the wrong position) or before the element is rendered (width 0).\n- Using `window.innerWidth` (includes the scrollbar) instead of `documentElement.clientWidth`.\n- Listening to `scroll` without capture, so scrolling an inner container leaves the popover behind.\n- Closing on document `click` without excluding the trigger, so the popover reopens instantly.\n- Not returning focus on Escape, dropping keyboard users at the top of the document.\n- `aria-controls` pointing at a panel that is not rendered.',
    testingStrategy:
      'Test the geometry exhaustively as a pure function with literal rectangles: each side, each flip, the "neither fits" fallback, inclusive boundaries, oversized elements, options and immutability. Component tests run in a real browser iframe (1024×768), so `getBoundingClientRect()` is real: pin a trigger to a viewport edge with `position: fixed` and assert `data-placement` and the rendered rect. Use fake timers for delays — assert "not yet" just before the delay and "visible" after — and `timers.pendingCount()` after unmount. Simulate the pointer path trigger → tooltip with mouseEnter/mouseLeave pairs. For the popover, use a full press sequence (pointerdown, mousedown, pointerup, mouseup, click) so implementations based on either mousedown or click are exercised, and assert focus with `document.activeElement` and `onOpenChange` call lists.',
    seniorFollowUps:
      '- Add an arrow that keeps pointing at the trigger after a shift (return `arrowOffset` from computePosition).\n- Support scroll containers that clip (overflow: auto ancestors) and hide the floating element when the trigger is scrolled out of view.\n- Replace the implementation with the native Popover API and CSS anchor positioning; what is the fallback strategy?\n- Nested popovers and a tooltip inside a popover: route Escape to the top-most layer only.\n- A single shared tooltip for a 10,000-row table: event delegation on `data-tooltip` attributes and one floating element.\n- Touch: long-press to show, or avoid tooltips for essential information.',
  },
  followUps: [
    { id: 'f1', level: 'definition', question: 'What is the difference between a tooltip and a popover, in ARIA roles and keyboard behaviour?', expectedConcepts: ['tooltip = role tooltip, aria-describedby, never focusable, no interactive content', 'popover = interactive, often role dialog', 'aria-expanded / aria-controls on the popover trigger', 'focus moves into the popover'], sourceIds: ['apg-tooltip', 'mdn-popover-api'] },
    { id: 'f2', level: 'mechanism', question: 'WCAG 1.4.13 asks hover/focus content to be dismissible, hoverable and persistent. How does each map to code in your Tooltip?', expectedConcepts: ['Escape without moving pointer/focus', 'hide grace period + mouseenter on tooltip', 'stays until trigger loses hover/focus or user dismisses', 'timer management'], sourceIds: ['wcag-hover-focus'] },
    { id: 'f3', level: 'application', question: 'Why measure and position in useLayoutEffect rather than useEffect, and why does the hook listen to scroll in the capture phase?', expectedConcepts: ['layout effect runs before paint', 'no visible jump', 'scroll does not bubble', 'capture on window sees every scroll container', 'resize updates'], sourceIds: ['react-useeffect', 'mdn-addeventlistener'] },
    { id: 'f4', level: 'edge-cases', question: 'The popover is opened from inside another popover (nested). Clicking inside the child closes the parent. Why, and how do you fix it?', expectedConcepts: ['portals break DOM containment', 'React events bubble through portals', 'layer stack / context', 'mark presses inside React subtree'], sourceIds: ['react-create-portal'] },
    { id: 'f5', level: 'production', question: 'How would you rebuild this with the native Popover API and CSS anchor positioning, and what would you keep in JavaScript?', expectedConcepts: ['popover attribute and popovertarget', 'top layer, light dismiss', 'anchor-name / position-anchor / position-try fallbacks', 'hover/focus delay still JS', 'feature detection and fallback'], sourceIds: ['mdn-popover-api'] },
    { id: 'f6', level: 'architecture', question: 'Design a floating-element primitive for a design system that powers tooltips, popovers, menus, comboboxes and date pickers.', expectedConcepts: ['headless positioning hook with middleware (offset, flip, shift, size, arrow)', 'separate interaction hooks (hover, focus, click, dismiss)', 'role-specific ARIA wiring', 'layer manager for Escape/z-order', 'portal root and SSR'], sourceIds: ['react-create-portal', 'apg-tooltip'] },
  ],
  mcqs: [
    {
      id: 'm1',
      question: 'An icon-only button already has aria-label="Delete". You add a tooltip "Moves the file to the bin". How should the button reference the tooltip?',
      options: [
        { id: 'a', text: 'aria-labelledby="tooltip-id"', explanation: 'That replaces the accessible name "Delete" with the tooltip text — the tooltip would become the label.' },
        { id: 'b', text: 'aria-describedby="tooltip-id"', explanation: 'Correct — the button keeps its name and the tooltip is exposed as its description, as in the APG tooltip pattern.' },
        { id: 'c', text: 'aria-controls="tooltip-id"', explanation: 'aria-controls expresses that the element controls another widget\'s content; it does not provide a name or description.' },
        { id: 'd', text: 'No reference is needed if the tooltip has role="tooltip"', explanation: 'The role alone does not associate the tooltip with its trigger; assistive tech needs the id reference.' },
      ],
      correctOptionId: 'b',
      explanation: 'A tooltip supplements a control that already has a name. aria-describedby links it as a description; aria-labelledby would override the name.',
      sourceIds: ['apg-tooltip'],
    },
    {
      id: 'm2',
      question: 'Which tooltip behaviour violates WCAG 2.2 SC 1.4.13 (Content on Hover or Focus)?',
      options: [
        { id: 'a', text: 'It appears after a 300 ms delay', explanation: 'A delay is allowed; the criterion is about what happens once the content is shown.' },
        { id: 'b', text: 'It disappears as soon as the pointer moves from the trigger toward the tooltip', explanation: 'Correct — the content must be hoverable: the pointer can move over it without it disappearing.' },
        { id: 'c', text: 'It closes when the user presses Escape', explanation: 'That is the required "dismissible" mechanism.' },
        { id: 'd', text: 'It stays visible until focus or hover leaves the trigger', explanation: 'That is the required "persistent" behaviour.' },
      ],
      correctOptionId: 'b',
      explanation: 'SC 1.4.13 requires such content to be dismissible (e.g. Escape), hoverable (the pointer can move onto it) and persistent (it stays until hover/focus is removed, the user dismisses it, or it is no longer valid).',
      sourceIds: ['wcag-hover-focus'],
    },
    {
      id: 'm3',
      question: 'What does an element with the `popover` attribute (popover="auto") give you natively?',
      options: [
        { id: 'a', text: 'Automatic positioning next to its invoker with flip and shift', explanation: 'The Popover API does not position the element; CSS anchor positioning (or JS) does that.' },
        { id: 'b', text: 'Top-layer rendering and light dismiss (outside click and Escape)', explanation: 'Correct — auto popovers render in the top layer above all other content and close on light dismiss.' },
        { id: 'c', text: 'A focus trap like a modal dialog', explanation: 'Popovers are non-modal: the rest of the page stays interactive and focus is not trapped.' },
        { id: 'd', text: 'Show-on-hover with a delay', explanation: 'Popovers are toggled by an invoker (popovertarget) or script; hover timing is not built in for auto popovers.' },
      ],
      correctOptionId: 'b',
      explanation: 'The Popover API handles stacking (top layer), light dismiss and invoker wiring. Placement relative to the trigger is a separate concern solved by CSS anchor positioning or a JS helper like computePosition.',
      sourceIds: ['mdn-popover-api'],
    },
  ],
};

export default problem;
