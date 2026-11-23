import type { CodingProblem } from '../../schema';
import starterBoard from './starter/KanbanBoard.tsx?raw';
import starterUtils from './starter/boardUtils.ts?raw';
import types from './starter/types.ts?raw';
import data from './starter/data.ts?raw';
import app from './starter/App.tsx?raw';
import styles from './starter/styles.css?raw';
import solutionBoard from './solution/KanbanBoard.tsx?raw';
import solutionUtils from './solution/boardUtils.ts?raw';
import helpers from './tests/helpers.tsx?raw';
import utilsTests from './tests/boardUtils.test.ts?raw';
import utilsHiddenTests from './tests/boardUtils.hidden.test.ts?raw';
import publicTests from './tests/public.test.tsx?raw';
import hiddenTests from './tests/hidden.test.tsx?raw';

const shared = { '/App.tsx': app, '/types.ts': types, '/data.ts': data, '/styles.css': styles };

const problem: CodingProblem = {
  schemaVersion: 1,
  kind: 'coding',
  id: 'react-kanban-board',
  slug: 'kanban-board',
  title: 'Kanban Board (drag and drop)',
  track: 'react',
  execution: 'react',
  difficulty: 'hard',
  priority: 'P1',
  seniority: ['Senior', 'SDE-2', 'SDE-3', 'MTS'],
  topics: ['normalised state', 'immutable updates', 'drag and drop', 'pointer events', 'keyboard alternative', 'live regions', 'focus management'],
  estimatedMinutes: 60,
  conceptIds: ['immutable-updates', 'referential-equality', 'react-reconciliation-keys', 'derived-state', 'keyboard-navigation', 'focus-management', 'aria-live-regions', 'react-effects'],
  research: {
    provenance: 'PUBLISHED_PRACTICE_PROBLEM',
    frequencyConfidence: 'HIGH_CONFIDENCE',
    verificationStatus: 'SOURCES_VERIFIED',
    lastVerified: '2026-11-23',
    evidence: [
      { sourceId: 'fih-ui', url: 'https://www.frontendinterviewhandbook.com/coding/build-front-end-user-interfaces', originalTitle: 'Kanban Board', note: 'Listed under "Apps" in the handbook\'s "Where to practice" list.' },
      { sourceId: 'fg-mc', url: 'https://www.frontendgeek.com/frontend-interview/machine-coding-interview', originalTitle: 'Kanban Board', note: 'Listed under "Application machine coding".' },
    ],
    researchNotes:
      'Two independent sources list a Kanban board as a UI/machine-coding exercise; neither specifies the scope. This 60-minute version keeps what separates a senior answer: a normalised board with pure, structurally shared move/add/remove helpers (tested on their own), a live preview while moving that is only committed on drop, pointer dragging, and an equivalent keyboard and single-pointer path with live-region announcements (WCAG 2.5.7 and 2.1.1). Column CRUD, persistence, multi-select, auto-scroll and virtualisation are follow-ups; WIP limits are optional. Pointer dragging is required but not covered by the automated tests, so candidates may use either Pointer Events or the HTML Drag and Drop API.',
  },
  spec: {
    summary: 'Build a three-column Kanban board with pure immutable move helpers, pointer drag and an equivalent keyboard and single-pointer path with live-region announcements.',
    description: `Implement the pure helpers in **boardUtils.ts** and the \`<KanbanBoard />\` component in **KanbanBoard.tsx**.

The board state is **normalised** (\`types.ts\`):

\`\`\`ts
interface Board {
  cards: Record<string, Card>;                                  // { id, title }
  columns: { id: string; title: string; cardIds: string[]; limit?: number }[];
}
\`\`\`

### boardUtils.ts (pure, never mutate the input)
- \`findCard(board, cardId)\` → \`{ columnId, index }\` or \`null\`.
- \`moveCard(board, cardId, toColumnId, toIndex)\` — \`toIndex\` is the card's **final** index in the target column, i.e. an index into the target list *with the card already removed*. Clamp it (\`Infinity\` = last, negative = first). Unchanged columns and the \`cards\` record keep their identity; a no-op returns \`board\` itself.
- \`addCard(board, columnId, card, index = Infinity)\` and \`removeCard(board, cardId)\` — same rules.
- *(Optional)* \`canAccept(board, columnId, cardId)\` for WIP limits.

### KanbanBoard.tsx
Props: \`initialBoard\` (seeds internal state), \`onChange?(board)\` (called after every **committed** change), \`label?\`.

1. **Columns.** Each column is a \`<section aria-labelledby>\` pointing at an \`<h2>\` with the column title (so it is a *region* named after the column). Next to the heading, an element with \`data-testid="column-count"\` shows the number of cards.
2. **Cards.** Each card is an \`<li>\` containing:
   - a **handle**: \`role="button"\`, \`tabIndex={0}\`, its text is the card title (its accessible name), \`aria-pressed\` is \`"true"\` while the card is picked up, and \`aria-describedby\` points at visually hidden instructions that mention Space and Escape;
   - a **"Move <title>"** button (\`aria-expanded\`) revealing **Move up**, **Move down** (disabled at the ends) and **Move to <column>** (one per *other* column; appends to the end);
   - a **"Delete <title>"** button.
3. **Add.** Each column has an input labelled **"New card in <column>"** and an **"Add card"** button; pressing Enter in the input also adds (don't rely on \`<form>\` submission — the sandboxed preview blocks it). Titles are trimmed; blank titles are ignored. New cards go to the end, get a unique id, and the input is cleared.
4. **Pointer drag.** Cards can be dragged within and between columns with a mouse, pen or finger. Use **Pointer Events** or the **HTML Drag and Drop API** — choose and justify (HTML DnD does not fire for touch input in most mobile browsers).
5. **Keyboard move** on a focused handle: **Space/Enter** picks up; **ArrowUp/ArrowDown** move within the column; **ArrowLeft/ArrowRight** move to the neighbouring column, keeping the row (clamped); **Space/Enter** drops; **Escape** cancels and restores the original position. Arrow keys are \`preventDefault\`-ed while moving and do nothing otherwise. Focus stays on the moving card — even when it changes column. Moves are a **preview**: \`onChange\` is called once, on drop, and not at all when the card is dropped where it started or the move is cancelled.
6. **Announcements.** One \`role="status"\` (polite) live region, rendered empty from the start, announces each step: *"Picked up Alpha. Position 1 of 3 in To do. …"*, *"Alpha: position 2 of 3 in To do."*, *"Dropped Alpha at position 1 of 2 in In progress."*, *"Move cancelled. …"*, plus add, delete and menu moves.
7. **Focus after changes.** After a menu move, focus the moved card's handle. After a delete, focus the next card in the column, else the previous one, else the column's input.
8. *(Optional)* **WIP limit**: a column with \`limit\` shows "n / limit" and refuses cards beyond it (announce why).

\`App.tsx\`, \`types.ts\` and \`data.ts\` are read-only.`,
    technologies: ['React 18', 'TypeScript', 'Pointer Events (or HTML Drag and Drop)', 'ARIA live regions'],
    learningObjectives: [
      'Model board data in a normalised shape and write pure, structurally shared move helpers with a precise index contract',
      'Separate a transient "preview" (derived from the committed board) from committed state, so cancel is free and onChange fires once',
      'Implement pointer dragging that survives the dragged element being re-parented (window listeners, effect cleanup)',
      'Provide keyboard and single-pointer alternatives to dragging (WCAG 2.1.1 and 2.5.7) with live-region announcements',
      'Restore focus deliberately when React remounts an element under a different parent',
    ],
    clarifications: [
      { question: 'What exactly does `toIndex` mean when moving inside the same column?', why: 'The classic off-by-one: an index computed before removing the card is one too high when moving down. A precise contract makes the helper testable.', defaultAssumption: 'The card\'s final index in the target column (as if the card were removed first), clamped to the valid range.' },
      { question: 'Does every intermediate step of a drag count as a change, or only the drop?', why: 'Decides what the parent/server sees, whether cancel needs an undo, and how many network writes a drag causes.', defaultAssumption: 'Moves are a local preview; `onChange` fires once on drop, never on cancel or a drop in the original position.' },
      { question: 'Which input devices must dragging support: mouse only, or touch and pen too?', why: 'HTML Drag and Drop does not fire for touch in most mobile browsers; Pointer Events cover all three but you build the drag yourself.', defaultAssumption: 'Mouse, touch and pen — so Pointer Events is the default choice; HTML DnD is acceptable if the trade-off is stated.' },
      { question: 'What accessibility level is expected for the drag interaction?', why: 'WCAG 2.2 requires a single-pointer alternative to dragging (2.5.7) and keyboard operability (2.1.1); screen-reader users need announcements.', defaultAssumption: 'A keyboard pick-up/move/drop mode, a "Move" menu for single-pointer use, and a polite live region.' },
      { question: 'Is the board persisted or shared with other users?', why: 'Server sync brings optimistic updates, ordering keys and conflict resolution, which changes the data model.', defaultAssumption: 'Local only, seeded from `initialBoard`; the parent can persist via `onChange`.' },
    ],
    scopeDecisions: [
      'Three fixed columns; adding, renaming or reordering columns is a follow-up.',
      'No persistence, undo history, multi-select, auto-scroll during drag or virtualisation.',
      'Pointer drag is required but not exercised by the automated tests, so either Pointer Events or HTML DnD can be used.',
      'WIP limits are optional.',
    ],
    requirements: [
      { id: 'normalised-state', category: 'technical', level: 'MUST', text: 'Board state stays normalised: `cards` by id plus ordered `cardIds` per column; components never keep a second copy of card order.' },
      { id: 'move-helper', category: 'functional', level: 'MUST', text: '`moveCard` moves within and across columns, treating `toIndex` as the final index and clamping it.', acceptance: 'moveCard(a→todo, 2) on [a,b,c] gives [b,c,a]; Infinity appends; negative inserts first.' },
      { id: 'pure-helpers', category: 'technical', level: 'MUST', text: '`moveCard`, `addCard` and `removeCard` never mutate their input (they work on deep-frozen boards).' },
      { id: 'structural-sharing', category: 'performance', level: 'SHOULD', text: 'Untouched columns and the `cards` record keep their identity; no-ops return the same board, so memoised columns can skip re-rendering.' },
      { id: 'columns-counts', category: 'functional', level: 'MUST', text: 'Columns render as labelled regions with their cards in order and a live card count.' },
      { id: 'add-delete', category: 'functional', level: 'MUST', text: 'Add (trimmed, non-blank, unique id, appended, input cleared) and delete cards; both call `onChange` once.' },
      { id: 'pointer-drag', category: 'functional', level: 'MUST', text: 'Cards can be dragged within and between columns with mouse, touch or pen (Pointer Events or HTML DnD, with the choice justified).' },
      { id: 'keyboard-move', category: 'accessibility', level: 'MUST', text: 'Space/Enter picks up, arrows move (Up/Down within, Left/Right across columns keeping the row), Space/Enter drops, Escape cancels.' },
      { id: 'single-pointer', category: 'accessibility', level: 'MUST', text: 'A "Move" control offers Move up / Move down / Move to <column> without dragging (WCAG 2.5.7).' },
      { id: 'live-region', category: 'accessibility', level: 'MUST', text: 'One polite `role="status"` region, present from the first render, announces pick-up, every position change (position n of m in column), drop, cancel, add and delete.' },
      { id: 'focus-follows', category: 'accessibility', level: 'MUST', text: 'Focus stays on the moving card even when it is remounted in another column; after delete, focus moves to a sensible neighbour.' },
      { id: 'preview-commit', category: 'technical', level: 'MUST', text: 'Moves are a preview derived from the committed board; `onChange` fires once on drop and not on cancel or a drop at the start position.' },
      { id: 'edges', category: 'edge-case', level: 'MUST', text: 'Arrow keys stop at the first/last row and column, moves into empty columns work, and arrows do nothing unless a card is picked up.' },
      { id: 'instructions', category: 'accessibility', level: 'SHOULD', text: 'Handles reference hidden usage instructions via `aria-describedby`, and use `aria-pressed` for the picked-up state.' },
      { id: 'listener-cleanup', category: 'technical', level: 'SHOULD', text: 'Window-level pointer listeners are added for the duration of one drag and always removed (pointerup, pointercancel, Escape, unmount).' },
      { id: 'wip-limit', category: 'functional', level: 'OPTIONAL', text: 'A column with `limit` shows "n / limit" and refuses extra cards from every input path, announcing why.' },
      { id: 'helper-tests', category: 'testing', level: 'SHOULD', text: 'The pure helpers are unit-tested independently of the UI, including identity (`toBe`) and no-mutation (frozen input) assertions.' },
    ],
    constraints: ['React function components and hooks only.', 'No drag-and-drop or state libraries.', 'Only react and react-dom can be imported.'],
    acceptanceCriteria: [
      'All public tests pass (helpers: find, move across/within, clamping, sharing; UI: render, add, delete, keyboard move, cross-column move, cancel).',
      'All hidden tests pass (more helper cases, focus following a remounted card, edges, empty columns, no-op drop, instructions and live region, Move menu, focus after delete, unique ids).',
      'Dragging with a mouse and on a touch screen works in the preview.',
    ],
    examples: [
      { title: 'Final-index contract', input: "moveCard(board, 'a', 'todo', 2) with todo = [a, b, c]", output: 'todo = [b, c, a]', explanation: 'Index 2 is where the card ends up, counted after removing it — not "before the card currently at index 2".' },
      { title: 'Cross-column move', input: "moveCard(board, 'b', 'doing', 0)", output: 'todo = [a, c], doing = [b, d]; done and cards keep their identity' },
      { title: 'Keyboard', input: 'Focus "Alpha", Space, ArrowRight, Enter', output: 'Alpha is first in "In progress"; status says "Dropped Alpha at position 1 of 2 in In progress."; onChange called once' },
    ],
    manualTests: [
      'Drag a card to the bottom of another column with a mouse, then on a phone or with touch emulation; the page must not scroll while dragging.',
      'Start a drag and press Escape (or release outside the board): the card returns to where it was.',
      'With a screen reader, pick up a card with Space and move it: every step should be announced once.',
      'Move a card with the "Move" menu using only clicks, and check where focus lands.',
      'Delete the last card of a column: focus should land on that column\'s input.',
    ],
  },
  files: {
    entry: '/App.tsx',
    starter: { ...shared, '/KanbanBoard.tsx': starterBoard, '/boardUtils.ts': starterUtils },
    solution: { ...shared, '/KanbanBoard.tsx': solutionBoard, '/boardUtils.ts': solutionUtils },
    readonly: ['/App.tsx', '/types.ts', '/data.ts'],
    support: {},
  },
  tests: [
    { path: '/tests/helpers.tsx', visibility: 'public', kind: 'runtime', source: helpers },
    { path: '/tests/boardUtils.test.ts', visibility: 'public', kind: 'runtime', source: utilsTests },
    { path: '/tests/public.test.tsx', visibility: 'public', kind: 'runtime', source: publicTests },
    { path: '/tests/boardUtils.hidden.test.ts', visibility: 'hidden', kind: 'runtime', source: utilsHiddenTests },
    { path: '/tests/hidden.test.tsx', visibility: 'hidden', kind: 'runtime', source: hiddenTests },
  ],
  hints: [
    'Start with boardUtils.ts. For `moveCard`, find the card, compute the clamped final index (the max is `length - 1` in the same column, `length` in another), then map over columns: copy only the source and target lists — remove at the old index first, then insert at the final index. Return untouched columns as-is.',
    'Keep two pieces of state: the committed `board` and a `drag` object `{ cardId, preview }`. Render `drag?.preview ?? board`. Arrow keys replace `preview` with `moveCard(preview, …)`; Escape just clears `drag`; drop commits `preview` and calls `onChange` once.',
    'A card that moves into another column is a different `<li>` in a different `<ul>` — React remounts it and focus is lost. Keep a ref map of handles by card id and a "pending focus" ref; a `useLayoutEffect` after each render focuses the pending card.',
    'For pointer dragging, register `pointermove`/`pointerup`/`pointercancel` on `window` while a drag is active (an effect keyed on the drag session, with cleanup). Use a small movement threshold before starting, then find the column under the pointer with `elementFromPoint(...).closest("[data-column-id]")` and the index by comparing `clientY` with the midpoints of the other cards.',
  ],
  solution: {
    initialApproach:
      'Normalise the data, put every mutation in pure helpers, and treat "moving" as a preview derived from the committed board. All three input paths — pointer, keyboard and the Move menu — end up calling the same `moveCard`, so there is exactly one place where ordering bugs can live.',
    bruteForce:
      'Storing columns as arrays of card objects and moving by `splice` on the existing arrays works in a demo, but it mutates state (React may skip renders), makes "cancel" require a manual undo, and duplicates card data if the same card is ever referenced twice. Using `structuredClone` on every move fixes mutation but destroys identity, so every column re-renders on every pointermove.',
    optimizedApproach: `- **Normalised state + pure helpers.** \`cards\` by id; columns hold ordered ids. \`moveCard\` copies only the source and target \`cardIds\` arrays; everything else (other columns, the \`cards\` record) is shared, and no-ops return the same object. That keeps \`React.memo\` on columns effective during a drag.
- **Preview vs committed.** \`drag = { cardId, mode, preview }\` is the only transient state. The UI renders \`drag?.preview ?? board\`. Cancel is \`setDrag(null)\`; drop commits \`preview\` and calls \`onChange\` once — and only if the card's location actually changed.
- **Pointer drag with window listeners.** On \`pointerdown\`, store a pointer session; an effect keyed on it adds \`pointermove/up/cancel\` (and Escape) listeners on \`window\` and removes them in cleanup. Window-level listeners matter because the dragged \`<li>\` is remounted when it changes column, which would drop element listeners and pointer capture.
- **Hit testing from real layout.** \`document.elementFromPoint\` → \`closest('[data-column-id]')\` → count the other cards whose vertical midpoint is above the pointer. That count *is* the final index, which is exactly \`moveCard\`'s contract.
- **Keyboard and single-pointer paths** reuse the same helper and announce through one polite live region.`,
    walkthrough: `1. **findCard** scans the columns' \`cardIds\` (O(cards)). For very large boards keep a \`columnOf\` index.
2. **moveCard**: \`maxIndex = sameColumn ? len - 1 : len\`; clamp; same column and same index → return \`board\`. Map columns: source → \`slice()\` + \`splice(from.index, 1)\`; target → \`splice(index, 0, id)\`; when source and target are the same column both happen on one copy, in that order.
3. **addCard/removeCard** copy \`cards\` with spread (and \`delete\` on the copy) and only the affected column.
4. **State**: \`board\`, \`drag\`, \`pointer\` (session), \`menuFor\`, \`drafts\` per column, \`message\` for the live region.
5. **Keyboard**: \`onKeyDown\` on the handle. Not picked up: Space/Enter → \`setDrag({ preview: board })\` and announce. Picked up: arrows compute the next preview with \`moveCard\` (Left/Right keep \`loc.index\`, which \`moveCard\` clamps), \`preventDefault\`, set \`pendingFocus\`; Space/Enter drop; Escape cancel; Tab cancels and lets focus move.
6. **Focus restoration**: ref callbacks maintain \`Map<cardId, HTMLElement>\`; a \`useLayoutEffect\` without deps consumes \`pendingFocus\` after every commit, before paint.
7. **Pointer**: threshold of ~5px so clicks are not drags; on activation copy \`board\` into a pointer-mode \`drag\`; each move updates the preview with a functional \`setDrag\`; \`pointerup\` commits, \`pointercancel\`/Escape cancels; refs give the listeners the latest \`board\`/\`onChange\` without re-subscribing.
8. **Move menu**: a disclosure (\`aria-expanded\`) with buttons that call \`moveCard\` directly on the committed board, then focus the card.
9. **Announcements**: a single \`role="status"\` element rendered from the first render (live regions added together with their content are often not announced); every action sets its text.`,
    complexity:
      '- `moveCard`: O(C + n) to find the card and copy two arrays (C columns, n cards in the affected columns). Memory: two new arrays, one new board object.\n- Pointer move: one `elementFromPoint` plus reading the rects of one column\'s cards — O(cards in that column) per event. For long columns, cache rects on drag start or throttle with `requestAnimationFrame`.\n- Rendering: with structural sharing and memoised columns, a move re-renders only the source and target columns.',
    edgeCases:
      '- Moving down within a column (the final-index off-by-one).\n- Moving into an empty column, or Left/Right from a row deeper than the target column has (clamp).\n- Dropping at the starting position — not a change.\n- The dragged element is remounted in another column: element listeners, pointer capture and focus are lost.\n- A click (no movement) must not start a drag: use a threshold.\n- `pointercancel` (the browser takes over the gesture, e.g. scrolling) must cancel cleanly; `touch-action: none` on the handle prevents that on touch.\n- Adding or deleting while a preview exists must not let the stale preview overwrite the change on drop.\n- Two cards with the same title: ids, not titles, are keys.\n- Repeating the exact same announcement text may not be re-announced by screen readers.',
    alternatives:
      '- **HTML Drag and Drop API**: native drag image, cross-window/file drops and `dataTransfer`, but no touch support in most mobile browsers, limited styling of the drag preview, and quirky `dragenter`/`dragleave` on children.\n- **Libraries** (dnd-kit, react-aria\'s drag and drop, pragmatic-drag-and-drop): sensors, collision detection, auto-scroll and accessibility built in — the right production choice, but not allowed here.\n- **Fractional ordering keys** (`order: "a0", "a0V"`) instead of arrays: a move changes one card\'s key, which suits server sync and concurrent edits.\n- **useReducer** with `move/add/remove/startDrag/drop/cancel` actions makes the state machine explicit and testable.',
    tradeoffs:
      '- Live preview (the card actually moves while dragging) gives clear feedback and reuses `moveCard`, but re-renders on every pointermove; a placeholder + `transform` on a floating copy is smoother for large boards.\n- Window listeners per drag are simple and robust; pointer capture alone is lighter but breaks when the captured element is remounted.\n- Announcing every keyboard step is helpful; announcing every pointer step would be noise, so pointer drags only announce pick-up and drop.\n- Uncontrolled (`initialBoard` + `onChange`) is easy to embed; a controlled `board` prop is needed when the server is the source of truth.',
    commonMistakes:
      '- Computing the insert index before removing the card, so moving down lands one slot too far (or not at all).\n- `column.cardIds.splice(...)` on state — mutation; React may not re-render and memoised columns go stale.\n- Calling `onChange` on every intermediate move, or forgetting to restore the board on cancel.\n- Element-level `onPointerMove` that stops firing as soon as the card changes column.\n- Losing focus after a cross-column keyboard move (the element is remounted).\n- Rendering the live region only when there is a message, so the first announcement is missed.\n- Using `aria-grabbed`/`aria-dropeffect` (deprecated) as the only accessibility affordance.\n- Using the array index or title as the React key.',
    testingStrategy:
      '- Unit-test the helpers on **deep-frozen** boards (mutation throws) and assert identity with `toBe` for shared columns and no-ops.\n- Drive the keyboard path in component tests: `keyDown` Space/arrows/Escape on the focused handle, then assert DOM order, `aria-pressed`, focus, live-region text and `onChange` calls.\n- Test the Move menu with clicks only — it is the single-pointer path.\n- Pointer dragging can be simulated with `fireEvent.pointerDown/Move/Up` and `clientX/clientY` in a real browser, but it depends on layout (rects, `elementFromPoint`), thresholds and whether the implementation uses Pointer Events or HTML DnD, so it is fragile; cover it with a real-browser E2E test (e.g. Playwright `mouse.move` with steps) rather than unit tests.',
    seniorFollowUps:
      '- Persist moves to a server with optimistic updates: one PATCH per drop, rollback on failure, ordering keys to avoid rewriting whole arrays.\n- Real-time collaboration: conflicting moves from two users, server-assigned ordering, reconciling a drag in progress with remote changes.\n- Auto-scroll when dragging near the edge of a scrolling column or board.\n- Performance with 1 000+ cards: memoised columns, virtualised lists (and how drop targets work for unrendered cards), rAF-throttled hit testing.\n- Multi-select drag and keyboard shortcuts for power users.',
  },
  followUps: [
    { id: 'f1', level: 'definition', question: 'Why does WCAG 2.5.7 require a non-dragging alternative even if the board is keyboard accessible?', expectedConcepts: ['2.5.7 is about pointer users who cannot drag', 'keyboard support is a separate criterion (2.1.1)', 'single-pointer alternative such as a Move menu'], sourceIds: ['wcag-dragging'] },
    { id: 'f2', level: 'mechanism', question: 'When a card moves to another column during a drag, what happens to its DOM element, its pointer capture and its focus — and why?', expectedConcepts: ['keys are compared among siblings only', 'different parent means unmount and mount', 'capture and focus are lost', 'window listeners and explicit focus restoration'], sourceIds: ['react-preserving-state', 'react-rendering-lists'] },
    { id: 'f3', level: 'application', question: 'Pointer Events or the HTML Drag and Drop API for this board? Justify for mouse, touch and pen.', expectedConcepts: ['HTML DnD does not fire for touch in most mobile browsers', 'pointer events unify input types', 'touch-action: none', 'pointercancel', 'HTML DnD gives native drag image and cross-window drops'], sourceIds: ['mdn-pointer-events', 'mdn-drag-drop'] },
    { id: 'f4', level: 'edge-cases', question: 'A screen-reader user moves a card with the arrow keys. What should be announced, how, and what can go wrong?', expectedConcepts: ['polite status region present before content changes', 'position n of m in column', 'identical messages may not repeat', 'avoid announcing every pointermove'], sourceIds: ['mdn-live-regions'] },
    { id: 'f5', level: 'production', question: 'Moves must be saved to a server. How do you handle a failed save and two users moving cards at the same time?', expectedConcepts: ['optimistic update with rollback', 'one request per drop, not per move', 'fractional ordering keys', 'server as source of truth and reconciliation'], sourceIds: ['react-updating-objects'] },
    { id: 'f6', level: 'architecture', question: 'How would you design a reusable drag-and-drop layer for several boards and lists in a product?', expectedConcepts: ['sensors for pointer and keyboard', 'collision detection strategies', 'data model independent of the DnD layer', 'accessibility announcements as a pluggable piece', 'auto-scroll and virtualisation support'], sourceIds: ['mdn-pointer-events', 'wcag-dragging'] },
  ],
  mcqs: [
    {
      id: 'm1',
      question: 'With `toIndex` defined as the card\'s final index, what does this return for column "todo"?',
      code: "// todo.cardIds = ['a', 'b', 'c', 'd']\nmoveCard(board, 'a', 'todo', 2).columns[0].cardIds",
      options: [
        { id: 'a', text: "['b', 'a', 'c', 'd']", explanation: 'That is what you get by inserting before the card currently at index 2 and then removing the original — the classic off-by-one.' },
        { id: 'b', text: "['b', 'c', 'a', 'd']", explanation: 'Correct: remove "a" first ([b, c, d]), then insert at index 2.' },
        { id: 'c', text: "['b', 'c', 'd', 'a']", explanation: 'That would be index 3 (the end).' },
        { id: 'd', text: "['a', 'b', 'c', 'd']", explanation: 'Only index 0 is a no-op for "a".' },
      ],
      correctOptionId: 'b',
      explanation: 'Defining the index as "after removal" makes same-column and cross-column moves use the same rule and matches how hit testing counts the other cards above the pointer.',
      sourceIds: ['react-updating-objects'],
    },
    {
      id: 'm2',
      question: 'Which statement about the HTML Drag and Drop API is accurate?',
      options: [
        { id: 'a', text: 'It handles mouse, touch and pen identically in all browsers.', explanation: 'Touch is the gap: most mobile browsers do not start HTML drag operations from touch input.' },
        { id: 'b', text: 'Its events are not fired for touch input in most mobile browsers, so touch needs Pointer/Touch Events.', explanation: 'Correct — which is why Pointer Events are the usual choice for touch-friendly boards.' },
        { id: 'c', text: 'It makes a component satisfy WCAG 2.5.7 automatically.', explanation: 'Native drag is still a dragging movement; 2.5.7 needs a single-pointer alternative.' },
        { id: 'd', text: 'It requires calling setPointerCapture on the dragged element.', explanation: 'Pointer capture belongs to Pointer Events, not HTML DnD.' },
      ],
      correctOptionId: 'b',
      explanation: 'HTML DnD (draggable, dragstart, dragover, drop) is mouse-oriented; Pointer Events unify mouse, pen and touch but you implement the drag yourself.',
      sourceIds: ['mdn-drag-drop', 'mdn-pointer-events'],
    },
    {
      id: 'm3',
      question: 'Why should the `role="status"` element be rendered (empty) from the first render instead of only when there is a message?',
      options: [
        { id: 'a', text: 'Because React cannot update text inside a newly mounted element.', explanation: 'React can; the problem is assistive technology, not React.' },
        { id: 'b', text: 'Screen readers reliably announce changes to an existing live region; a region inserted together with its text is often not announced.', explanation: 'Correct — register the region first, then change its content.' },
        { id: 'c', text: 'role="status" is only valid on elements present at page load.', explanation: 'There is no such rule; it is about how changes are observed.' },
        { id: 'd', text: 'An empty live region interrupts the user immediately.', explanation: 'A polite region waits for the user to be idle, and an empty one says nothing.' },
      ],
      correctOptionId: 'b',
      explanation: 'Live regions announce changes to their content; the region must exist in the accessibility tree before the content changes.',
      sourceIds: ['mdn-live-regions'],
    },
  ],
};

export default problem;
