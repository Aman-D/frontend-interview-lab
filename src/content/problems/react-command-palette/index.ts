import type { CodingProblem } from '../../schema';
import starterPalette from './starter/CommandPalette.tsx?raw';
import starterRank from './starter/rank.ts?raw';
import types from './starter/types.ts?raw';
import app from './starter/App.tsx?raw';
import styles from './starter/styles.css?raw';
import solutionPalette from './solution/CommandPalette.tsx?raw';
import solutionRank from './solution/rank.ts?raw';
import helpers from './tests/helpers.tsx?raw';
import rankTests from './tests/rank.test.ts?raw';
import rankHiddenTests from './tests/rank.hidden.test.ts?raw';
import publicTests from './tests/public.test.tsx?raw';
import hiddenTests from './tests/hidden.test.tsx?raw';

const shared = { '/App.tsx': app, '/types.ts': types, '/styles.css': styles };

const problem: CodingProblem = {
  schemaVersion: 1,
  kind: 'coding',
  id: 'react-command-palette',
  slug: 'command-palette',
  title: 'Command Palette (Cmd-K)',
  track: 'react',
  execution: 'react',
  difficulty: 'hard',
  priority: 'P1',
  seniority: ['Senior', 'SDE-2', 'SDE-3', 'MTS'],
  topics: ['global keyboard shortcuts', 'fuzzy ranking', 'combobox a11y', 'modal focus management', 'aria-activedescendant', 'derived state'],
  estimatedMinutes: 60,
  conceptIds: ['combobox-aria', 'dialog-aria-pattern', 'focus-management', 'keyboard-navigation', 'aria-live-regions', 'derived-state', 'react-effects', 'react-portals', 'closures'],
  research: {
    provenance: 'PUBLISHED_PRACTICE_PROBLEM',
    frequencyConfidence: 'MEDIUM_CONFIDENCE',
    verificationStatus: 'SOURCES_VERIFIED',
    lastVerified: '2026-11-23',
    evidence: [
      {
        sourceId: 'alla-components',
        url: 'https://allahabadi.dev/frontend-system-design/components/',
        originalTitle: 'Design a Command Palette (Cmd-K)',
        note: 'Question 15 in the component design list; framed as component system design rather than machine coding.',
      },
    ],
    researchNotes:
      'Only one inspected source names a command palette, and it frames it as a component system-design question, so frequency confidence is MEDIUM rather than HIGH. The machine-coding version here is the 60-minute core that such a design discussion depends on: a global shortcut that respects text fields, a modal dialog that restores focus, an APG combobox + grouped listbox driven by aria-activedescendant, and a pure, separately tested ranking function. Nested pages ("Change theme →"), keyword aliases, async/remote commands, virtualisation and a shortcut registry are follow-ups, not required.',
  },
  spec: {
    summary: 'Build a Cmd/Ctrl+K command palette: a modal combobox with grouped, ranked, keyboard-navigable commands, recents, and correct focus handling.',
    description: `Implement two files:

**1. \`rank.ts\` — \`rankCommands(query, commands, recentIds)\`** (pure, unit-tested on its own)

- Trim the query; compare case-insensitively. Never mutate inputs; always return a new array.
- **Empty query** → all commands: ids in \`recentIds\` first (in that order; unknown or repeated ids ignored), then the rest in original order.
- **Otherwise** keep only matches, best tier first:
  1. **prefix** — the title starts with the query
  2. **word start** — the query occurs at index 0 or right after a non-letter/digit character (check *every* occurrence)
  3. **substring** — the query occurs anywhere
  4. **subsequence** — the query's characters (whitespace removed) appear in the title in order
- Inside a tier: **recent** commands first (more recent first), then **original order** (stable).

| query \`set\` | tier |
| --- | --- |
| Settings: sync | prefix |
| Open settings | word start |
| Reset view | substring |
| Close tab | subsequence |
| Toggle sidebar | — (excluded) |

**2. \`CommandPalette.tsx\` — \`<CommandPalette commands initialRecentIds? maxRecent? />\`**

1. Renders a button **"Open command palette"**. Clicking it, or pressing **Ctrl+K / Cmd+K** anywhere on the page, opens the palette (call \`preventDefault()\` on the shortcut).
2. The shortcut is **ignored while the user types in another text field** (\`<input>\` of a text type, \`<textarea>\`, \`<select>\`, contenteditable). Inside the palette's own input it **closes** the palette.
3. The palette is a **modal dialog** (\`role="dialog"\`, \`aria-modal="true"\`, accessible name **"Command palette"**) containing a \`role="combobox"\` input that receives focus on open, and a \`role="listbox"\` (referenced by \`aria-controls\`) whose options are grouped by \`section\` in \`role="group"\` elements labelled by the section name. Groups appear in order of their first ranked command. With an empty query, recent commands appear first in a group named **"Recent"** (and not again in their own section). An option's text content is the command title (plus its \`shortcut\`, if any).
4. **ArrowDown / ArrowUp** move the active option, wrapping at both ends and **skipping disabled commands**. Focus stays in the input; the active option is referenced by \`aria-activedescendant\` and is the only option with \`aria-selected="true"\`. When the query changes, the first enabled result becomes active.
5. **Enter** or **click** runs the active (enabled) command and closes the palette; the command becomes the most recent. **Escape** closes. Every open starts with an empty query.
6. On close, **focus returns to the element that was focused before opening** — *before* the command runs, so a command may move focus itself. **Tab** must not move focus out of the palette.
7. **Disabled** commands are listed with \`aria-disabled="true"\` but can't be activated or run.
8. With no results, a polite \`role="status"\` region inside the dialog reads **"No commands found"** and \`aria-expanded\` is \`false\`.
9. *(Optional)* nested pages: a command opens a sub-list (e.g. "Change theme…" → Light / Dark), Backspace on an empty query goes back.

\`App.tsx\` and \`types.ts\` are read-only. The preview is a small docs app: try \`set\`, \`tgl\`, \`pdf\`, and Ctrl/Cmd+K inside the notes field.`,
    technologies: ['React 18', 'TypeScript', 'react-dom createPortal', 'WAI-ARIA combobox + listbox', 'WAI-ARIA modal dialog'],
    learningObjectives: [
      'Separate a ranking algorithm into a pure, deterministic, unit-tested function with explicit tie-breaking',
      'Register a global keyboard shortcut once and scope it correctly (editable targets, preventDefault, cleanup)',
      'Combine the modal dialog and combobox patterns: focus in, focus kept, focus restored to the invoker',
      'Derive the active option from data instead of syncing it with effects',
      'Announce empty results politely without stealing focus',
    ],
    clarifications: [
      { question: 'How "fuzzy" should matching be, and must the ranking be explainable?', why: 'Scored fuzzy matchers (fzf-style) are hard to test and to reason about in an interview; tiered matching is predictable.', defaultAssumption: 'Four tiers (prefix > word start > substring > subsequence), recency inside a tier, original order for ties. A scored matcher is a follow-up.' },
      { question: 'Should the shortcut work while the user is typing in a form field or editor?', why: 'Hijacking Ctrl+K inside an editor (where it often means "insert link") is a real usability bug.', defaultAssumption: 'No: ignore it when the event target is a text input, textarea, select or contenteditable, except the palette input itself, where it toggles the palette closed.' },
      { question: 'What happens to recently used commands: persisted, how many, and do they outrank better matches?', why: 'Decides state ownership and whether recency is a tie-breaker or a score boost.', defaultAssumption: 'Kept in component state (max 5, seeded by `initialRecentIds`), shown as a "Recent" group for the empty query, and used only as a tie-breaker inside a match tier. Persistence (localStorage) is a follow-up.' },
      { question: 'Should disabled commands be hidden or shown?', why: 'Hiding makes features undiscoverable; showing them needs clear disabled semantics.', defaultAssumption: 'Shown with aria-disabled and skipped by arrow keys, so they are discoverable when browsing but never activated.' },
      { question: 'Where does focus go after a command runs?', why: 'Commands such as "Focus search" move focus themselves; restoring focus after them would undo it.', defaultAssumption: 'Restore focus to the previously focused element first, then run the command.' },
    ],
    scopeDecisions: [
      'Matching is on the title only; keyword aliases are a follow-up.',
      'Nested pages are optional and untested.',
      'No virtualisation: palettes typically show tens to a few hundred commands.',
      'Recents live in memory, not localStorage.',
      'Background content is not made inert; aria-modal plus keeping focus in the input is the baseline.',
    ],
    requirements: [
      { id: 'rank-tiers', category: 'functional', level: 'MUST', text: 'rankCommands keeps only matches and orders them prefix > word start > substring > subsequence, case-insensitively, on the trimmed query.' },
      { id: 'rank-empty', category: 'functional', level: 'MUST', text: 'With an empty query rankCommands returns recents first (recentIds order, unknown/duplicate ids ignored) and then every other command in original order.' },
      { id: 'rank-ties', category: 'technical', level: 'MUST', text: 'Ties inside a tier are broken by recency, then by original index; rankCommands is pure and returns a new array.' },
      { id: 'open-shortcut', category: 'functional', level: 'MUST', text: 'The trigger button and Ctrl+K / Cmd+K open the palette; the shortcut calls preventDefault.' },
      { id: 'shortcut-scope', category: 'edge-case', level: 'MUST', text: 'The shortcut does nothing while focus is in another text input, textarea, select or contenteditable; in the palette input it closes the palette.' },
      { id: 'run-close', category: 'functional', level: 'MUST', text: 'Enter or click runs the active enabled command exactly once, closes the palette and records it as the most recent command.' },
      { id: 'recent-group', category: 'functional', level: 'SHOULD', text: 'With an empty query, recent commands are shown first in a "Recent" group and not repeated in their own section; every open starts with an empty query.' },
      { id: 'dialog-combobox', category: 'accessibility', level: 'MUST', text: 'Modal dialog named "Command palette" with a focused role="combobox" input (aria-expanded, aria-controls, aria-autocomplete="list") and a listbox of role="group" sections labelled by their headings.' },
      { id: 'activedescendant', category: 'accessibility', level: 'MUST', text: 'ArrowUp/ArrowDown move the active option with wrapping and skip disabled commands; focus stays in the input, aria-activedescendant references the active option, which alone has aria-selected="true". Changing the query makes the first enabled result active; the active option scrolls into view.' },
      { id: 'focus-restore', category: 'accessibility', level: 'MUST', text: 'Escape (and every other way of closing) returns focus to the element focused before opening, before the command runs; Tab does not leave the palette.' },
      { id: 'disabled', category: 'edge-case', level: 'MUST', text: 'Disabled commands render aria-disabled="true" and are never activated or run by keyboard or mouse.' },
      { id: 'empty-status', category: 'accessibility', level: 'MUST', text: 'No results → a polite role="status" region inside the dialog says "No commands found" and aria-expanded is false; nothing is active.' },
      { id: 'listener-cleanup', category: 'technical', level: 'MUST', text: 'The global keydown listener is registered once and removed on unmount; it reads current state through refs rather than re-subscribing.' },
      { id: 'memo-ranking', category: 'performance', level: 'SHOULD', text: 'Ranking runs only while open and only when query, commands or recents change (memoised); commands should have a stable identity.' },
      { id: 'nested-pages', category: 'functional', level: 'OPTIONAL', text: 'Nested pages: a command can open a sub-list; Backspace on an empty query or Escape goes back one level before closing.' },
      { id: 'tests', category: 'testing', level: 'SHOULD', text: 'The ranking function is unit-tested separately (ties, frozen inputs, word boundaries); component tests assert real focus and ARIA state.' },
    ],
    constraints: ['React function components and hooks only.', 'No third-party libraries (no cmdk, kbar, fuse.js).', 'Do not change App.tsx, types.ts or the exported signatures.'],
    acceptanceCriteria: [
      'All public tests pass (rankCommands basics; open via button and Ctrl/Cmd+K; filtering and "No commands found"; Enter runs + closes; Escape restores focus; shortcut ignored in another input).',
      'All hidden tests pass (stable ties, recency within tiers only, every-occurrence word starts, subsequence repeats, whitespace handling; aria-activedescendant + wrapping over disabled commands; disabled commands; Recent group; Ctrl+K toggle and editable targets; click to run; active reset; focus restored before run; Tab kept inside; listener cleanup).',
      'Manual: with a screen reader the active command is announced while typing, and "No commands found" is announced without moving focus.',
    ],
    examples: [
      { title: 'Ranking', input: 'rankCommands("set", ["Toggle sidebar", "Open settings", "Settings: sync", "Reset view", "Close tab"])', output: '["Settings: sync", "Open settings", "Reset view", "Close tab"]', explanation: 'Prefix, word start, substring, subsequence; "Toggle sidebar" has no "t" after "s…e".' },
      { title: 'Recency is a tie-breaker, not a trump card', input: 'query "p", recents ["Open preferences"], titles ["Print page", "Open preferences"]', output: '["Print page", "Open preferences"]', explanation: 'A recent word-start match still ranks below a non-recent prefix match.' },
      { title: 'Focus', input: 'Focus "Elsewhere", press Ctrl+K, press Escape', output: 'Palette closes; "Elsewhere" has focus again' },
    ],
    manualTests: [
      'Press Ctrl/Cmd+K in the page, then inside the notes textarea: only the first opens the palette.',
      'Type "tgl" and "set" and check the order matches the tier rules.',
      'Run "Focus notes" from the palette: the notes field (not the trigger) ends up focused.',
      'Arrow past the disabled "Deploy" command; it is skipped but visible.',
      'With VoiceOver/NVDA, confirm the active option and "No commands found" are announced.',
    ],
  },
  files: {
    entry: '/App.tsx',
    starter: { ...shared, '/CommandPalette.tsx': starterPalette, '/rank.ts': starterRank },
    solution: { ...shared, '/CommandPalette.tsx': solutionPalette, '/rank.ts': solutionRank },
    readonly: ['/App.tsx', '/types.ts'],
    support: {},
  },
  tests: [
    { path: '/tests/helpers.tsx', visibility: 'public', kind: 'runtime', source: helpers },
    { path: '/tests/rank.test.ts', visibility: 'public', kind: 'runtime', source: rankTests },
    { path: '/tests/public.test.tsx', visibility: 'public', kind: 'runtime', source: publicTests },
    { path: '/tests/rank.hidden.test.ts', visibility: 'hidden', kind: 'runtime', source: rankHiddenTests },
    { path: '/tests/hidden.test.tsx', visibility: 'hidden', kind: 'runtime', source: hiddenTests },
  ],
  hints: [
    'Start with rank.ts. Write `matchTier(q, title)` returning 4/3/2/1/0, then `rankCommands` = map to `{ command, index, tier, recent }`, filter out tier 0, and sort with one comparator: `b.tier - a.tier || a.recent - b.recent || a.index - b.index` (non-recent = a large number). The explicit index makes ties deterministic.',
    'Word start: loop over every `indexOf(q, from)` hit and accept it if it is at 0 or the previous character is not a letter/digit. Subsequence: one pointer into the query, one pass over the title.',
    'Shortcut: register ONE `document` keydown listener in an effect with cleanup. Ignore the event if the target is a text field that is not your input; otherwise `preventDefault()` and toggle. Keep `open` and "where focus was" in refs so the listener never needs to re-subscribe.',
    'Derive, don\'t sync: `results → groups → visible (flattened) → enabled`; `active = enabled.find(c => c.id === activeId) ?? enabled[0]`. Store only `activeId` and reset it to null on typing. In `close()`, call `setOpen(false)` and focus the saved element synchronously, then run the command.',
  ],
  solution: {
    initialApproach:
      'Split the problem in two. The ranking is a pure function of (query, commands, recents) with an explicit, total ordering — test it like an algorithm. The component is a modal combobox: a lifetime-long shortcut listener, open/close functions that own focus capture and restoration, and render-time derivation of groups, visible order and the active option.',
    bruteForce:
      'A first attempt often filters with `title.includes(query)`, sorts with `localeCompare`, re-adds a `keydown` listener in an effect that depends on `open` (or on nothing), moves real focus onto options, and restores focus in an effect cleanup. Problems: no subsequence matching, ties reorder alphabetically (users\' muscle memory breaks), listeners leak or fire twice, typing stops working when focus leaves the input, Ctrl+K inside an editor opens the palette, and focus restoration in cleanup runs *after* the command, undoing commands that move focus.',
    optimizedApproach: `**Ranking — tiers + one comparator.**

\`\`\`ts
const tier = q === '' ? PREFIX : matchTier(q, c.title);        // 4..1, 0 = drop
scored.sort((a, b) => b.tier - a.tier || a.recent - b.recent || a.index - b.index);
\`\`\`

Every ordering question ("does a recent subsequence beat a prefix?", "what about equal titles?") has exactly one answer encoded in that line. Recency only breaks ties, so a better match always wins.

**Component — refs for the long-lived listener, derivation for everything else.**

- \`useEffect(() => { document.addEventListener('keydown', onKey); return () => remove… }, [])\` — \`onKey\` reads \`openRef\` and \`inputRef\`, so it never needs to re-subscribe. It ignores text-entry targets other than the palette input, then \`preventDefault()\`s and toggles.
- \`openPalette()\` captures \`document.activeElement\` **before** focus moves; \`closePalette()\` sets state and focuses that element **synchronously**, so \`runCommand\` can do \`close(); record(); command.run()\` and the command gets the last word on focus.
- \`ranked → groups (Map by section, first appearance; "Recent" for empty query) → visible → enabled → active\` are all derived with \`useMemo\` — no effect synchronises "active index" with results, so it can never point at a stale option.
- Combobox + listbox semantics: input keeps DOM focus; \`aria-activedescendant\` points at the active option's id (\`useId\`-based); \`aria-selected\` marks it; \`role="group"\` + \`aria-labelledby\` names sections; a \`role="status"\` region inside the dialog announces "No commands found" (and result counts for screen readers).`,
    walkthrough: `1. **rank.ts**: build a \`recentId → position\` map (first occurrence wins). For each command compute the tier (\`PREFIX\` for everyone when the query is empty), drop tier 0, sort with the three-key comparator, map back to commands. Pure: \`forEach\` + a new array, so frozen inputs are fine.
2. **matchTier**: \`startsWith\` → 4. Loop over \`indexOf\` hits; a hit at 0 or after a non-\`\\p{L}\\p{N}\` character → 3. Any hit → 2. Greedy subsequence on the query without whitespace → 1. Else 0.
3. **State**: \`open\`, \`query\`, \`activeId\`, \`recentIds\` (seeded from \`initialRecentIds\`, capped at \`maxRecent\`). Refs: \`openRef\` (synchronous mirror), \`returnFocusRef\`, \`inputRef\`.
4. **openPalette**: guard on \`openRef\`, capture the active element, reset query/active, \`setOpen(true)\`. An effect on \`open\` focuses the input.
5. **closePalette**: guard, \`setOpen(false)\`, focus the saved element if \`isConnected\`.
6. **Shortcut effect**: Ctrl/Meta + "k" without Alt/Shift, not composing; ignore text-entry targets unless the target is our input; \`preventDefault()\`; toggle.
7. **Derivation**: \`useMemo\` for ranked (only while open), groups, visible, enabled and option ids; \`active = enabled.find(id) ?? enabled[0] ?? null\`.
8. **Keys on the input**: arrows step through \`enabled\` with modulo wrapping (\`preventDefault\` keeps the caret still); Enter runs \`active\`; Escape closes; Tab is prevented because the input is the dialog's only tabbable element.
9. **runCommand**: ignore disabled; close (restores focus); move the id to the front of recents; \`command.run()\`.
10. **Render**: trigger button; when open, a portal with a backdrop (mousedown on the backdrop itself closes), the dialog, the combobox input, the grouped listbox (options use \`onMouseDown={e => e.preventDefault()}\` so the input keeps focus, \`onMouseMove\` to follow the pointer, \`onClick\` to run), and the status region.`,
    complexity:
      'Ranking is O(n·m) for n commands and title length m (each tier check is linear), plus O(n log n) to sort; for hundreds of commands this is well under a millisecond per keystroke. Rendering is O(n). Memory O(n). The single document listener is O(1) per key press.',
    edgeCases:
      '- Ties: equal tier and recency fall back to original index — never to title order or engine-specific sort behaviour.\n- "Reset settings" + "set": the first occurrence is mid-word, the second is a word start — check every occurrence.\n- Repeated query letters ("oo") must consume distinct title characters.\n- Query of only whitespace = empty query.\n- recentIds containing deleted commands or duplicates.\n- All results disabled → nothing active, Enter does nothing, the list is still visible.\n- The invoker was removed while the palette was open → `isConnected` check, don\'t focus a detached node.\n- Opened from `<body>` (no invoker) → nothing to restore.\n- Ctrl+K during IME composition, with Shift/Alt, or as a key repeat while already open (guard via `openRef`).\n- Non-Latin keyboard layouts: `event.key` may not be "k"; a production palette may also accept `event.code === "KeyK"` and must document the trade-off.\n- Component unmounted while open → restore focus in an unmount cleanup.',
    alternatives:
      '- **Scored fuzzy matching** (fzf/VS Code style): consecutive-run and word-boundary bonuses, gap penalties, highlighting of matched indices. Better recall, harder to test and explain; still needs a deterministic tie-break.\n- **Pre-normalised index**: lower-case titles and keyword aliases once (memoised by `commands`), not on each keystroke.\n- **Library**: `cmdk` or `kbar` provide the combobox, grouping and ranking; you still own shortcut scoping and focus policy.\n- **Native `<dialog>` with `showModal()`**: top layer, inert background and Escape via the `cancel` event for free; you still restore focus explicitly if you need "before the command runs" ordering.\n- **Roving focus into the list** instead of aria-activedescendant: simpler for some AT, but typing would require moving focus back to the input.',
    tradeoffs:
      '- Tiers vs scores: tiers are predictable and easy to test; scores rank better for long, messy queries. Recency as a tie-breaker keeps results "honest"; a stronger boost favours habits but can surface poor matches.\n- Skipping disabled options with arrows keeps navigation fast; making them focusable improves discoverability for screen-reader users (APG allows both — choose deliberately).\n- Grouping results by section after ranking can show a slightly worse match above a better one in another group; some palettes flatten results while a query is typed.\n- A document-level listener is simple but global: in a micro-frontend or embedded widget you need a shortcut registry to avoid two palettes fighting over Ctrl+K.\n- Restoring focus synchronously inside the handler couples close() to focus; an effect-based restore is tidier but runs too late for focus-moving commands.',
    commonMistakes:
      '- Sorting with `localeCompare` or relying on implementation details for ties.\n- Checking only the first `indexOf` match for word starts.\n- Registering the keydown listener with `[open]` deps (re-subscribes on every toggle) or without cleanup (fires twice after remount).\n- Opening the palette while the user types Ctrl+K in an editor, or not calling preventDefault so the browser\'s search bar also opens.\n- Moving DOM focus to options, losing the caret and typed text.\n- Keeping `activeIndex` in state and syncing it in an effect, so it briefly points at a missing or disabled option.\n- Restoring focus after `command.run()`, overriding focus the command moved.\n- Marking every option `aria-selected="false"` except none, or many as true.\n- Announcing "No commands found" with an alert (assertive) or by moving focus.',
    testingStrategy:
      'Unit-test `rankCommands` as a pure function with small hand-written tables: one test per rule, frozen inputs to catch in-place sorting, and adversarial cases (ties, every-occurrence word starts, repeated characters, whitespace, recents that must not jump tiers). Component tests run in a real browser: dispatch `keydown` on `document` and on specific fields for the shortcut and assert the return value of `fireEvent` for preventDefault; focus a real element before opening and assert `document.activeElement` after closing; query by role and name (dialog, combobox, listbox, group, option, status); resolve `aria-activedescendant` to an element and check its text and aria-selected; cover unmount + shortcut to prove the listener is removed.',
    seniorFollowUps:
      '- Nested pages and breadcrumbs: model the palette as a stack of pages; how do Backspace and Escape behave?\n- A command registry: features register commands (with `when` conditions) via context; how do you avoid re-render storms and stale closures?\n- Async commands (search files on a server) mixed with local ones: debounce, cancellation, and a stable order while results stream in.\n- Persist recents per user (localStorage, sync across tabs with the `storage` event) and handle deleted commands.\n- Keyboard layouts, `event.code` vs `event.key`, and conflicts with browser/OS/editor shortcuts.\n- Measuring quality: time to command, query abandonment, most-searched-but-not-found terms.',
  },
  followUps: [
    { id: 'f1', level: 'definition', question: 'What does aria-activedescendant do in a combobox, and why is it preferable to moving focus into the list here?', expectedConcepts: ['focus stays on the input', 'AT announces the referenced option', 'typing keeps working', 'id must reference a rendered element'], sourceIds: ['mdn-aria-activedescendant', 'apg-combobox'] },
    { id: 'f2', level: 'mechanism', question: 'Your document keydown listener is registered once with empty deps. How does it know whether the palette is open, and what breaks if it closes over `open` from the first render?', expectedConcepts: ['stale closure', 'ref mirror of state', 're-subscribing vs refs', 'effect cleanup on unmount'], sourceIds: ['react-useeffect', 'react-refs'] },
    { id: 'f3', level: 'application', question: 'Add keyword aliases ("theme" finds "Toggle dark mode") without hurting typing latency in a palette with 2 000 commands.', expectedConcepts: ['precompute a normalised index once per commands identity', 'best tier across title and keywords', 'memoisation', 'useDeferredValue for rendering'], sourceIds: ['react-usedeferredvalue'] },
    { id: 'f4', level: 'edge-cases', question: 'A command deletes the element that opened the palette, or the palette unmounts during a route change. Where should focus go?', expectedConcepts: ['isConnected check', 'fallback focus target', 'unmount cleanup restores focus', 'never strand focus on body'], sourceIds: ['apg-dialog-modal'] },
    { id: 'f5', level: 'production', question: 'Screen-reader users report that "No commands found" is sometimes not announced. What are the usual causes and fixes?', expectedConcepts: ['live region must exist before its content changes', 'role=status is polite', 'identical repeated text may not re-announce', 'avoid aria-live on frequently re-mounted nodes'], sourceIds: ['mdn-live-regions'] },
    { id: 'f6', level: 'architecture', question: 'Design a command system for a large app: features contribute commands, some only in certain contexts, with nested pages and a single global shortcut. What are the pieces?', expectedConcepts: ['registry via context or external store', 'when-clauses / context keys', 'useSyncExternalStore for subscriptions', 'page stack', 'one shortcut owner'], sourceIds: ['react-context', 'react-usesyncexternalstore'] },
  ],
  mcqs: [
    {
      id: 'm1',
      question: 'Two commands have the same match tier and neither is recent. Which tie-break gives users a predictable order?',
      options: [
        { id: 'a', text: 'Alphabetical by title with localeCompare', explanation: 'Deterministic, but it overrides the author\'s intended order ("Item 10" before "Item 2") and contradicts the empty-query order.' },
        { id: 'b', text: 'Their original index in the commands array', explanation: 'Correct — stable, explicit, and consistent with the order users see when browsing.' },
        { id: 'c', text: 'Whatever Array.prototype.sort returns for a comparator that only compares tiers', explanation: 'Modern engines sort stably, so this usually works, but the intent is implicit and breaks as soon as the comparator or data pipeline changes.' },
        { id: 'd', text: 'Shorter titles first', explanation: 'A plausible heuristic, but it is a ranking rule, not a tie-break, and still needs its own tie-break.' },
      ],
      correctOptionId: 'b',
      explanation: 'An explicit index key in the comparator makes ties stable by construction. Array.prototype.sort has been required to be stable since ES2019, but encoding the intent avoids depending on it.',
      sourceIds: ['mdn-array-sort'],
    },
    {
      id: 'm2',
      question: 'The palette closes in an effect cleanup that restores focus: `useEffect(() => { if (!open) return; const prev = document.activeElement; return () => prev.focus(); }, [open])`. A command "Focus search" runs `searchInput.focus()` in the Enter handler right after `setOpen(false)`. Where does focus end up?',
      options: [
        { id: 'a', text: 'On the search input', explanation: 'It is focused first, but the cleanup runs later, during the commit triggered by setOpen(false).' },
        { id: 'b', text: 'On the element that was focused before opening', explanation: 'Correct — the effect cleanup runs after the event handler, so it overrides the command\'s focus change.' },
        { id: 'c', text: 'On document.body', explanation: 'Only if prev was disconnected or the palette input unmounted without any restore.' },
        { id: 'd', text: 'On the palette input', explanation: 'The palette is closed and its input unmounted.' },
      ],
      correctOptionId: 'b',
      explanation: 'State updates from an event handler are committed after the handler returns; effect cleanups run during that commit. Restoring focus synchronously in close() before running the command avoids the conflict.',
      sourceIds: ['react-useeffect', 'react-queueing'],
    },
    {
      id: 'm3',
      question: 'Which element should own `aria-activedescendant` in this palette?',
      options: [
        { id: 'a', text: 'The dialog', explanation: 'The dialog is not focused while the user types; the attribute belongs on the focused composite widget.' },
        { id: 'b', text: 'The listbox', explanation: 'In the listbox pattern alone it can, but here focus stays in the combobox input.' },
        { id: 'c', text: 'The combobox input that has DOM focus', explanation: 'Correct — the focused combobox references the active option by id.' },
        { id: 'd', text: 'Each option, pointing at itself', explanation: 'That is not how the attribute works; it identifies a descendant from the focused element.' },
      ],
      correctOptionId: 'c',
      explanation: 'aria-activedescendant is set on the element that has DOM focus — here the combobox — and references the currently active option in the popup it controls.',
      sourceIds: ['apg-combobox', 'mdn-aria-activedescendant'],
    },
  ],
};

export default problem;
