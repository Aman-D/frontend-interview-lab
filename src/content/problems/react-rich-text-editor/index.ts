import type { CodingProblem } from '../../schema';
import starterEditor from './starter/RichTextEditor.tsx?raw';
import starterModel from './starter/model.ts?raw';
import types from './starter/types.ts?raw';
import app from './starter/App.tsx?raw';
import styles from './starter/styles.css?raw';
import solutionEditor from './solution/RichTextEditor.tsx?raw';
import solutionModel from './solution/model.ts?raw';
import helpers from './tests/helpers.tsx?raw';
import modelTests from './tests/model.test.ts?raw';
import modelHiddenTests from './tests/model.hidden.test.ts?raw';
import publicTests from './tests/public.test.tsx?raw';
import hiddenTests from './tests/hidden.test.tsx?raw';

const shared = { '/App.tsx': app, '/types.ts': types, '/styles.css': styles };

const problem: CodingProblem = {
  schemaVersion: 1,
  kind: 'coding',
  id: 'react-rich-text-editor',
  slug: 'rich-text-editor',
  title: 'Rich Text Editor (Bold / Italic / Underline)',
  track: 'react',
  execution: 'react',
  difficulty: 'hard',
  priority: 'P1',
  seniority: ['Senior', 'SDE-2', 'SDE-3', 'MTS'],
  topics: ['contenteditable', 'document model', 'beforeinput / Input Events', 'Selection API', 'toolbar a11y', 'XSS-safe serialisation', 'pure functions'],
  estimatedMinutes: 90,
  conceptIds: ['immutable-updates', 'derived-state', 'react-effects', 'keyboard-navigation', 'focus-management', 'controlled-uncontrolled'],
  research: {
    provenance: 'ORIGINAL_VARIATION',
    frequencyConfidence: 'HIGH_CONFIDENCE',
    verificationStatus: 'SOURCES_VERIFIED',
    lastVerified: '2026-11-26',
    variationOf:
      'Both sources list a rich text editor as a component SYSTEM-DESIGN question. This is a machine-coding cut of it: a flat document model with inline marks (bold/italic/underline) rendered into a contentEditable, editing through `beforeinput`, and an accessible toolbar — the part of the design that can be written and tested in one sitting. Blocks (lists, headings), links, collaboration and IME are follow-ups.',
    evidence: [
      { sourceId: 'fih-sd-ui', url: 'https://www.frontendinterviewhandbook.com/front-end-system-design/ui-components', originalTitle: 'Rich text editor', note: 'Listed in the UI component system-design examples (links to a paid GreatFrontEnd question that was not read).' },
      { sourceId: 'alla-components', url: 'https://allahabadi.dev/frontend-system-design/components/', originalTitle: 'Design a Rich Text Editor', note: 'Question 12 in the component design list; its blurb: model the document yourself and use contenteditable for rendering.' },
    ],
    researchNotes:
      'Two independent preparation sources name the topic (HIGH confidence that it appears in interview preparation material), both as system design. The core idea both the sources and the browser docs point to is "your model is the source of truth, contenteditable only renders it": MDN marks document.execCommand as deprecated, and the Input Events spec makes almost every `beforeinput` cancelable (IME composition is the notable exception), which is what makes a model-driven editor possible. The coding scope is deliberately inline-only so the time goes into the model, selection mapping and input handling rather than block layout.',
  },
  spec: {
    summary: 'Build a small model-driven rich text editor: a pure document model with inline marks, a contentEditable view that cancels native edits, and an accessible formatting toolbar.',
    description: `The document is a flat list of runs (see the read-only \`types.ts\`):

\`\`\`ts
type Mark = 'bold' | 'italic' | 'underline';
interface TextRun { text: string; marks: Mark[] }   // '\\n' inside text = line break
type Doc = TextRun[];                                // normalised: no empty runs, no equal neighbours, marks in MARK_ORDER
\`\`\`

**Part 1 — model.ts (pure functions, unit-tested).** Implement \`normalize\`, \`marksAt\`, \`isMarkActive\`, \`toggleMark\`, \`insertText\` and \`toHTML\` exactly as documented in the file. Offsets are positions in the plain text. Never mutate the input; always return a normalised document. \`toHTML\` must escape text and nest tags as \`<strong><em><u>…</u></em></strong>\`.

**Part 2 — RichTextEditor.tsx.**

1. **Structure.** A visible label; a \`role="toolbar"\` named **"Formatting"** with three buttons named **Bold**, **Italic**, **Underline**; and a \`contentEditable\` editing area with \`role="textbox"\`, \`aria-multiline="true"\`, named by the label. Runs render as \`<strong>\`, \`<em>\`, \`<u>\` (nested in that order).
2. **The model is the source of truth.** Keep the \`Doc\` in state (initialised once from \`defaultValue\`). Listen to the **native \`beforeinput\`** event, call \`preventDefault()\` and apply the edit to the model: \`insertText\`, \`insertParagraph\`/\`insertLineBreak\` (insert \`'\\n'\`), \`deleteContentBackward\`/\`deleteContentForward\` (and other \`delete*\` types), \`formatBold\`/\`formatItalic\`/\`formatUnderline\`. **Cancel every other input type** (lists, strike-through, drop…). After each change restore the caret/selection and call \`onChange(doc)\`.
3. **Typing** inserts at the caret with the marks of the character before it (\`marksAt\`); typing over a selection replaces it using the marks of its first character.
4. **Formatting.** Toolbar clicks and **Ctrl/⌘+B / I / U** toggle the mark on the selection. With a collapsed caret they change the marks the *next typed text* gets (shown on the button) without changing the document; moving the caret discards that pending choice.
5. **Toolbar state.** Each button's \`aria-pressed\` reflects the selection (\`isMarkActive\`, or the pending marks). Mousedown on a button must not move focus or the selection out of the editor.
6. **Toolbar keyboard (APG).** One Tab stop (roving \`tabindex\`): ArrowRight/ArrowLeft move focus with wrapping, Home/End go to the first/last button.
7. **Paste** inserts \`text/plain\` only — clipboard HTML never reaches the DOM.
8. *(Optional)* undo/redo (\`historyUndo\`/\`historyRedo\`, Ctrl/⌘+Z / Shift+Z / Y), Alt+F10 to jump to the toolbar, Escape to go back.

\`App.tsx\` shows the editor next to the serialised HTML and a preview rendered from it.`,
    technologies: ['React 18', 'TypeScript', 'contenteditable', 'Input Events (beforeinput)', 'Selection & Range APIs', 'WAI-ARIA toolbar'],
    learningObjectives: [
      'Separate a document model from its view and keep the model as the single source of truth',
      'Write the core editing operations as pure, testable functions ("split at the range, map the middle, normalise")',
      'Map between DOM selections and model offsets, and restore the selection after React re-renders',
      'Use beforeinput/inputType to intercept every native edit instead of the deprecated execCommand',
      'Make a formatting toolbar accessible: aria-pressed, roving tabindex, shortcuts, focus kept in the editor',
      'Keep the editor XSS-safe by construction: text-only model, escaped serialisation, plain-text paste',
    ],
    clarifications: [
      { question: 'Which formats: inline marks only, or blocks (headings, lists, quotes) and links?', why: 'Blocks change the model from a flat list to a tree and multiply the selection cases.', defaultAssumption: 'Inline bold/italic/underline only, with line breaks as "\\n". Blocks and links are follow-ups.' },
      { question: 'Can we use document.execCommand or a library (Slate, Lexical, ProseMirror, TipTap)?', why: 'execCommand is deprecated and produces browser-specific HTML; libraries remove the part being assessed.', defaultAssumption: 'No libraries and no execCommand: the model drives the DOM.' },
      { question: 'What is the output format — HTML, JSON, Markdown?', why: 'It decides what is stored, how it is sanitised and what the server must validate.', defaultAssumption: 'The JSON Doc is the value (onChange); HTML is a derived, escaped serialisation.' },
      { question: 'What happens with pasted rich content from Word or a web page?', why: 'Clipboard HTML is the main XSS and "style soup" vector in editors.', defaultAssumption: 'Plain text only. Mapping safe tags to marks is a follow-up.' },
      { question: 'Does the parent need to control the content (value + onChange)?', why: 'A controlled editor must reconcile external updates with the caret, which is much harder.', defaultAssumption: 'Uncontrolled: defaultValue read once, onChange reports every change.' },
      { question: 'Do we support IME (Chinese/Japanese input), spellcheck replacements and collaboration?', why: 'Composition input cannot be cancelled and needs a different strategy (let the browser edit, then read back).', defaultAssumption: 'Out of scope for the coding round; discuss as a follow-up.' },
    ],
    scopeDecisions: [
      'Flat model of runs; no blocks, links, images or tables.',
      'Uncontrolled: `defaultValue` is read once.',
      'IME composition, spellcheck and drag-and-drop are out of scope (spellcheck is disabled; drop is cancelled).',
      'Offsets are UTF-16 code units like the DOM; Backspace does not split surrogate pairs, full grapheme handling uses the browser\'s target ranges when available.',
      'Undo/redo is optional; each operation is one history step.',
    ],
    requirements: [
      { id: 'model-pure', category: 'technical', level: 'MUST', text: 'model.ts functions are pure and always return a normalised Doc (no empty runs, no equal neighbours, ordered marks).' },
      { id: 'toggle', category: 'functional', level: 'MUST', text: 'toggleMark removes the mark when it covers the whole range, otherwise adds it to every character; other marks are kept.' },
      { id: 'insert', category: 'functional', level: 'MUST', text: 'insertText replaces a range (across runs) with text carrying exactly the given marks; "" deletes.' },
      { id: 'html', category: 'technical', level: 'MUST', text: 'toHTML escapes & < > " \', turns "\\n" into <br> and nests <strong><em><u>.' },
      { id: 'model-truth', category: 'technical', level: 'MUST', text: 'Native beforeinput is cancelled and applied to the model; unsupported input types are cancelled too, so the DOM is only ever written by React.' },
      { id: 'typing', category: 'functional', level: 'MUST', text: 'Typed text goes at the caret with the marks of the previous character; typing over a selection replaces it with the marks of its first character; Enter inserts a line break.' },
      { id: 'delete', category: 'functional', level: 'MUST', text: 'Backspace/Delete remove the selection, or one character before/after the caret; nothing happens at the document edges.' },
      { id: 'format', category: 'functional', level: 'MUST', text: 'Toolbar buttons, Ctrl/⌘+B/I/U and formatBold/Italic/Underline input events toggle marks on the selection.' },
      { id: 'pending', category: 'edge-case', level: 'MUST', text: 'With a collapsed caret a toggle sets the marks for the next typed text (shown as pressed) without calling onChange; moving the caret discards it.' },
      { id: 'selection', category: 'technical', level: 'MUST', text: 'The DOM selection is mapped to model offsets for every operation and restored after each re-render.' },
      { id: 'paste', category: 'edge-case', level: 'MUST', text: 'Paste inserts text/plain only; clipboard HTML never reaches the DOM.' },
      { id: 'roles', category: 'accessibility', level: 'MUST', text: 'role="textbox" aria-multiline="true" named by the label; role="toolbar" named "Formatting" with Bold/Italic/Underline buttons using aria-pressed.' },
      { id: 'toolbar-keys', category: 'accessibility', level: 'MUST', text: 'Toolbar has one Tab stop; ArrowLeft/Right (wrapping), Home/End move focus; button mousedown does not take focus or the selection from the editor.' },
      { id: 'onchange', category: 'functional', level: 'MUST', text: 'onChange receives the full normalised Doc after every document change, and only then.' },
      { id: 'shortcut-hint', category: 'accessibility', level: 'SHOULD', text: 'Buttons expose their shortcuts (aria-keyshortcuts / title); Alt+F10 moves from the editor to the toolbar and Escape returns.' },
      { id: 'placeholder', category: 'functional', level: 'SHOULD', text: 'An empty editor shows the placeholder (CSS, not text in the model) and still has a line for the caret.' },
      { id: 'undo', category: 'functional', level: 'OPTIONAL', text: 'Undo/redo through historyUndo/historyRedo and Ctrl/⌘+Z, Shift+Z, Y, restoring the selection.' },
      { id: 'tests', category: 'testing', level: 'SHOULD', text: 'Unit tests cover the model at run boundaries and immutability; component tests drive real beforeinput/paste events and selections.' },
    ],
    constraints: ['React function components and hooks only.', 'No editor libraries and no document.execCommand.', 'Do not change App.tsx, types.ts, the props or the model signatures.'],
    acceptanceCriteria: [
      'All public tests pass (model: normalize, toggle add/remove, isMarkActive/marksAt, insertText, toHTML; editor: roles, typing via beforeinput, Bold button, Ctrl+I/U, aria-pressed, Backspace).',
      'All hidden tests pass (immutability, cross-run toggles and inserts, escaping; inherited marks, pending marks and discarding them, replacing a selection, plain-text paste, markup as text, Enter, deletes at edges, cancelled unsupported inputs, toolbar roving focus, defaultValue read once).',
      'Manual: in the preview, type, select and format with mouse and keyboard; the HTML panel updates and never contains unescaped user markup.',
    ],
    examples: [
      { title: 'Toggle over mixed formatting', input: '"Hello **bold** world", select "lo bo", Bold', output: '"Hel" plain, "lo bold" bold, " world" plain', explanation: 'Bold is not on every selected character, so it is added to all of them; the result is merged.' },
      { title: 'Pending marks', input: 'caret at the end of "Plain", Ctrl+B, type "!!"', output: '[{ "Plain" }, { "!!", bold }]; onChange not called by Ctrl+B itself' },
      { title: 'Paste', input: 'clipboard text/html "<img onerror=…><b>evil</b>", text/plain "evil"', output: 'the text "evil" is inserted; no <img> or <b> in the editor' },
    ],
    manualTests: [
      'Select a word with the mouse, click Bold, then Italic; the buttons stay pressed while the word is selected.',
      'Put the caret at the end, press Ctrl/⌘+B and type: the new text is bold; click elsewhere and type: it is not.',
      'Paste formatted text from a web page: only the text arrives.',
      'Tab into the toolbar, use the arrow keys, press Space on Underline; Tab again leaves the toolbar in one step.',
      'Press Enter twice at the end: the caret moves down to an empty line.',
      'With a screen reader, the editor is announced as an editable multi-line text field with its label, and buttons as toggle buttons.',
    ],
  },
  files: {
    entry: '/App.tsx',
    starter: { ...shared, '/RichTextEditor.tsx': starterEditor, '/model.ts': starterModel },
    solution: { ...shared, '/RichTextEditor.tsx': solutionEditor, '/model.ts': solutionModel },
    readonly: ['/App.tsx', '/types.ts'],
    support: {},
  },
  tests: [
    { path: '/tests/helpers.tsx', visibility: 'public', kind: 'runtime', source: helpers },
    { path: '/tests/model.test.ts', visibility: 'public', kind: 'runtime', source: modelTests },
    { path: '/tests/public.test.tsx', visibility: 'public', kind: 'runtime', source: publicTests },
    { path: '/tests/model.hidden.test.ts', visibility: 'hidden', kind: 'runtime', source: modelHiddenTests },
    { path: '/tests/hidden.test.tsx', visibility: 'hidden', kind: 'runtime', source: hiddenTests },
  ],
  hints: [
    'Start with the model. Write one private helper `slice(doc, start, end)` that splits runs at both offsets and returns `[before, inside, after]`. Then `toggleMark` maps `inside`, `insertText` replaces it, and both finish with `normalize(...)`.',
    'Offsets ↔ DOM: `range.setStart(root, 0); range.setEnd(node, offset); range.toString().length` gives the model offset of any DOM point (toString only counts text). The reverse walks text nodes with a TreeWalker summing lengths. Restore the selection in `useLayoutEffect` with `selection.setBaseAndExtent`.',
    'Attach `beforeinput` with `addEventListener` (React\'s `onBeforeInput` has no `inputType`). Call `preventDefault()` first, then `switch (e.inputType)`. Because the listener is attached once, read state through a ref that you update synchronously in your commit function.',
    'Pending marks: store `{ doc, sel, pending }`. A toggle with a collapsed caret only sets `pending`; `insert` uses `pending ?? marksAt(...)`. On `selectionchange`, if the live selection differs from `sel`, update `sel` and clear `pending`. Toolbar buttons: `onMouseDown={e => e.preventDefault()}`.',
  ],
  solution: {
    initialApproach:
      'Decide where the truth lives before writing UI: a plain `Doc` in React state. Everything the browser would normally do to the DOM (typing, deleting, formatting, pasting) is intercepted and expressed as a model operation, then React renders the model. The only DOM-specific code is the two-way mapping between DOM selections and plain-text offsets.',
    bruteForce:
      'The classic first attempt is `contentEditable` + `document.execCommand("bold")` + reading `innerHTML` on every input. It demos quickly, but execCommand is deprecated, produces different markup per browser (`<b>` vs `<strong>` vs `<span style>`), the toolbar state has to be guessed with `queryCommandState`, the stored HTML must be sanitised because paste injects arbitrary markup, and as soon as React re-renders the same node it fights the browser\'s DOM changes (lost caret, duplicated text).',
    optimizedApproach: `**Model first, as pure functions.** Every operation is "split at the range → change the middle → normalise":

\`\`\`ts
function toggleMark(doc, start, end, mark) {
  if (start === end) return normalize(doc);
  const remove = isMarkActive(doc, start, end, mark);         // active on EVERY character?
  const [before, inside, after] = slice(doc, start, end);
  const changed = inside.map(r => ({ text: r.text, marks: remove ? r.marks.filter(m => m !== mark) : [...r.marks, mark] }));
  return normalize([...before, ...changed, ...after]);
}
\`\`\`

\`normalize\` keeps one canonical shape (merged runs, ordered marks), so equality checks, tests and serialisation are simple.

**View: React renders, the browser never edits.** A native \`beforeinput\` listener cancels every input type; known types become \`insert\`, \`remove\` or \`toggle\`; unknown ones stay cancelled. Since the DOM only changes when React renders, React and the browser never disagree.

**Selection:** read it from the DOM at the moment of each operation (\`Range#toString().length\` from the root), store it in state, and write it back in \`useLayoutEffect\` after the runs re-render. Pending marks belong to a caret position and are cleared when \`selectionchange\` reports a different one.

**Safety by construction:** the model contains only text, React escapes it when rendering, \`toHTML\` escapes it when serialising, and paste only ever reads \`text/plain\`.`,
    walkthrough: `1. **model.ts**: \`normalize\` (drop empty, order marks, merge neighbours); \`slice\` (split runs at start/end); \`marksAt\` (character before the offset, first character at 0); \`isMarkActive\` (collapsed → marksAt, range → every run in \`inside\`); \`toggleMark\`; \`insertText\` (\`before + new run + after\`); \`toHTML\` (escape, \`\\n\` → \`<br>\`, wrap \`u\`, then \`em\`, then \`strong\`).
2. **State**: \`{ doc, sel, pending }\` in \`useState\`, mirrored in \`stateRef\`; \`commit(next)\` updates both synchronously, records history and calls \`onChange\` only when \`doc\` changed.
3. **current()**: live DOM selection inside the editor (clamped, ordered) or the last known one; pending marks only if the caret has not moved.
4. **insert(text)**: marks = \`pending ?? marksAt(...)\` (first selected character when replacing), \`insertText\`, caret after the text.
5. **remove(direction, target)**: selection, else the browser's target range, else one code point (surrogate-safe); no-op at the edges.
6. **toggle(mark)**: collapsed → update \`pending\`; otherwise \`toggleMark\` and keep the selection.
7. **Native listeners (once)**: \`beforeinput\` switch on \`inputType\`; \`paste\` → plain text; \`drop\` cancelled; \`selectionchange\` → sync \`sel\`, clear \`pending\`.
8. **useLayoutEffect**: when the editor is focused and the DOM selection differs from \`sel\`, \`setBaseAndExtent\` to the model position.
9. **Keyboard**: Ctrl/⌘+B/I/U toggle, Ctrl/⌘+Z/Shift+Z/Y history, Alt+F10 → toolbar; toolbar roving tabindex with arrows/Home/End and Escape back to the editor.
10. **Render**: label, toolbar (\`aria-pressed\` from pending or \`isMarkActive\`), editor with runs as nested \`strong/em/u\` and a sentinel \`<br>\` when empty or ending in \`\\n\`.`,
    complexity:
      'Every model operation is O(r + n) for r runs and n characters touched (slice + normalise); offset mapping is O(text nodes). Rendering re-creates all runs on each change, which is fine for documents of a few thousand runs; beyond that, split the document into blocks so only the edited block re-renders.',
    edgeCases:
      '- Empty document: placeholder via CSS, sentinel `<br>` so the caret has a line.\n- Trailing "\\n": needs the sentinel too, otherwise the caret can\'t sit on the new line.\n- Collapsed toggles (pending marks) and what happens when the caret moves.\n- Toggling over mixed formatting: add when not on every character, remove only when on all.\n- Selections that start or end at run boundaries, or select the whole document.\n- Backward selections (focus before anchor) — normalise to start ≤ end.\n- Backspace at 0, Delete at the end; surrogate pairs (emoji) must not be split.\n- Paste with only text/html, with \\r\\n line endings, or with nothing.\n- Toolbar click after the editor lost focus (use the last known selection).\n- IME composition: insertCompositionText is not cancelable — needs a read-back strategy.',
    alternatives:
      '- **execCommand + innerHTML**: fastest to demo, deprecated, inconsistent markup, needs sanitising.\n- **Read-back model**: let the browser edit, then parse the DOM back into the model on `input` (works with IME; harder to keep canonical).\n- **Tree model with blocks** (paragraphs → inline nodes), as in ProseMirror/Slate/Lexical: needed for lists, headings, tables; selections become (path, offset).\n- **Hidden textarea + custom rendering** (as in code editors and Google Docs\' canvas mode): full control over layout, but you rebuild caret, selection and accessibility yourself.\n- **Libraries** (Lexical, ProseMirror/TipTap, Slate): the production answer; the interview is about understanding what they do.',
    tradeoffs:
      '- Cancelling every input keeps React and the DOM in sync, but anything not cancelable (IME, some autocorrect) needs extra handling.\n- A flat run list is simple and fast for inline marks, but blocks force a tree.\n- Re-rendering the whole document on each keystroke is simple; per-block memoisation scales better.\n- One undo step per operation is easy; coalescing typing into word-sized steps matches user expectations better.\n- `aria-pressed` toggle buttons are announced clearly; a checkbox-style `role="switch"` or menu would be wrong for formatting.',
    commonMistakes:
      '- Using React\'s `onBeforeInput` (no `inputType`) instead of the native event.\n- Letting the browser mutate the DOM and React render the same nodes — caret jumps and duplicated text.\n- Toolbar buttons that take focus on mousedown, so the selection is gone before the click handler runs.\n- Toggling based only on the first character (bold → unbold when only part of the range was bold).\n- Forgetting to normalise: equal neighbours pile up and `aria-pressed`/serialisation logic gets complicated.\n- Storing `innerHTML` as the value and rendering it with `dangerouslySetInnerHTML` (XSS).\n- Reading state in a once-attached listener from a stale closure.',
    testingStrategy:
      'Test the model directly: run boundaries, mixed marks, edges (0, length), deleting everything, escaping, and immutability (deep-compare the input after each call). For the component, drive the real browser APIs the editor depends on: set a DOM selection with `setBaseAndExtent`, dispatch `new InputEvent("beforeinput", { inputType, data, cancelable: true })` and `new ClipboardEvent("paste", { clipboardData })`, and assert the returned `dispatchEvent` value (cancelled), the onChange documents, the rendered `strong/em/u` elements and `aria-pressed`. Use `waitFor` for assertions that depend on the asynchronous `selectionchange` event.',
    seniorFollowUps:
      '- Add paragraphs, headings and lists: what does the model become, and how do selections across blocks work?\n- Links: inline nodes with attributes, URL validation, and keyboard access to edit/remove.\n- IME and mobile keyboards: why cancelling beforeinput is not enough and how to reconcile after composition.\n- Collaborative editing: operational transforms vs CRDTs (Yjs), presence and remote cursors.\n- Performance for a 200-page document: block-level rendering, memoisation, virtualisation.\n- Paste from Word/Google Docs: map a safe subset of HTML to marks; server-side validation of the stored JSON.',
  },
  followUps: [
    { id: 'f1', level: 'definition', question: 'What does "the model is the source of truth, contenteditable is the view" mean, and why not just store innerHTML?', expectedConcepts: ['state in JS, DOM derived', 'native edits cancelled and re-expressed as operations', 'innerHTML is browser-specific and unsafe', 'canonical, serialisable document'], sourceIds: ['mdn-contenteditable', 'mdn-beforeinput'] },
    { id: 'f2', level: 'mechanism', question: 'Walk through what happens between a key press and the new character appearing in your editor.', expectedConcepts: ['keydown', 'beforeinput with inputType insertText', 'preventDefault', 'model update + onChange', 'React render', 'selection restored in layout effect'], sourceIds: ['mdn-beforeinput', 'mdn-inputtype', 'mdn-selection'] },
    { id: 'f3', level: 'application', question: 'Add a "Link" button. What changes in the model, the toolbar and keyboard behaviour?', expectedConcepts: ['inline node or mark with attributes (href)', 'URL validation / allowed protocols', 'pressed state when the selection is inside a link', 'dialog or popover to edit', 'escape href in toHTML'], sourceIds: ['apg-toolbar', 'mdn-contenteditable'] },
    { id: 'f4', level: 'edge-cases', question: 'A Japanese user types with an IME and the text comes out duplicated. Why, and how do you fix it?', expectedConcepts: ['insertCompositionText is not cancelable', 'browser mutates the DOM during composition', 'do not re-render the composing node', 'read back on compositionend and reconcile'], sourceIds: ['w3c-input-events', 'mdn-beforeinput'] },
    { id: 'f5', level: 'production', question: 'Content is stored and shown to other users. How do you make it safe end to end?', expectedConcepts: ['store JSON, not HTML', 'escape on serialisation', 'plain-text or allow-listed paste', 'validate the document on the server', 'CSP as defence in depth'], sourceIds: ['mdn-paste-event', 'mdn-execcommand'] },
    { id: 'f6', level: 'architecture', question: 'Design the editor for a product used by millions: block model, plugins, collaboration and performance.', expectedConcepts: ['tree of blocks with inline content', 'commands/transactions as the only way to change state', 'plugin API for marks/nodes/shortcuts', 'CRDT/OT for collaboration', 'block-level rendering and memoisation'], sourceIds: ['alla-components', 'fih-sd-ui'] },
  ],
  mcqs: [
    {
      id: 'm1',
      question: 'The selection covers "lo bo" in "Hel" + "lo " (plain) + "bold" (bold). The user presses Bold. What should happen?',
      options: [
        { id: 'a', text: 'Bold is removed from "bo" because part of the selection is already bold', explanation: 'Removing only happens when the mark covers every selected character.' },
        { id: 'b', text: 'Bold is added to every selected character', explanation: 'Correct — the mark is not active on the whole range, so toggling adds it everywhere (the common editor convention).' },
        { id: 'c', text: 'Each character is flipped: "lo " becomes bold, "bo" becomes plain', explanation: 'Per-character flipping produces confusing results and is not how editors behave.' },
        { id: 'd', text: 'Nothing, because the selection has mixed formatting', explanation: 'Mixed selections are normal; they show the button as not pressed and pressing it adds the mark.' },
      ],
      correctOptionId: 'b',
      explanation: 'A toggle asks "is the mark active on the entire range?". If yes, remove it from all; if not, add it to all. That is also what aria-pressed reports.',
      sourceIds: ['apg-toolbar'],
    },
    {
      id: 'm2',
      question: 'Why does the editor listen to the native `beforeinput` event with addEventListener instead of React\'s onBeforeInput?',
      options: [
        { id: 'a', text: 'React does not support contentEditable', explanation: 'React renders contentEditable fine; it only warns when it also manages children.' },
        { id: 'b', text: 'React\'s onBeforeInput is a polyfill based on older events and does not expose inputType, so deletes/formatting/paste can\'t be told apart', explanation: 'Correct — the editor needs inputType (insertText, deleteContentBackward, formatBold, …) to map each edit to a model operation.' },
        { id: 'c', text: 'Native listeners are faster', explanation: 'Performance is not the reason.' },
        { id: 'd', text: 'beforeinput cannot be cancelled from React', explanation: 'The issue is the missing inputType, not cancellation.' },
      ],
      correctOptionId: 'b',
      explanation: 'The Input Events spec gives each beforeinput an inputType and (for most types) makes it cancelable — exactly what a model-driven editor needs.',
      sourceIds: ['mdn-beforeinput', 'mdn-inputtype', 'w3c-input-events'],
    },
    {
      id: 'm3',
      question: 'Clicking the Bold button deselects the text before the click handler runs, so nothing gets formatted. What is the standard fix?',
      options: [
        { id: 'a', text: 'Save the selection in a setTimeout', explanation: 'Timing hacks are fragile; the selection is already lost by then.' },
        { id: 'b', text: 'preventDefault on the button\'s mousedown so focus and the selection stay in the editor', explanation: 'Correct — mousedown is when the browser moves focus; preventing it keeps the editor\'s selection intact.' },
        { id: 'c', text: 'Make the button contentEditable too', explanation: 'That would make the toolbar editable.' },
        { id: 'd', text: 'Use execCommand("bold") which remembers the selection', explanation: 'execCommand is deprecated and has the same focus problem.' },
      ],
      correctOptionId: 'b',
      explanation: 'Focus moves on mousedown. Cancelling it (and keeping a last-known selection as a fallback for keyboard use of the toolbar) keeps formatting commands working.',
      sourceIds: ['mdn-selection', 'apg-toolbar'],
    },
  ],
};

export default problem;
