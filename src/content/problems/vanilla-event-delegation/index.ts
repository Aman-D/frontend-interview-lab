import type { CodingProblem } from '../../schema';
import starterHtml from './starter/index.html?raw';
import starterCss from './starter/styles.css?raw';
import starterScript from './starter/script.js?raw';
import starterDelegate from './starter/delegate.js?raw';
import solutionHtml from './solution/index.html?raw';
import solutionCss from './solution/styles.css?raw';
import solutionScript from './solution/script.js?raw';
import solutionDelegate from './solution/delegate.js?raw';
import publicTests from './tests/public.test.js?raw';
import hiddenTests from './tests/hidden.test.js?raw';

const problem: CodingProblem = {
  schemaVersion: 1,
  kind: 'coding',
  id: 'vanilla-event-delegation',
  slug: 'event-delegation',
  title: 'Event Delegation Helper',
  track: 'vanilla',
  execution: 'dom',
  difficulty: 'medium',
  priority: 'P1',
  seniority: ['Senior', 'SDE-2'],
  topics: ['event delegation', 'event bubbling', 'DOM traversal', 'closest()'],
  estimatedMinutes: 20,
  conceptIds: ['event-delegation', 'event-propagation', 'focus-management', 'closures'],
  research: {
    provenance: 'PUBLISHED_PRACTICE_PROBLEM',
    frequencyConfidence: 'MEDIUM_CONFIDENCE',
    verificationStatus: 'PARTIALLY_VERIFIED',
    lastVerified: '2026-11-23',
    evidence: [
      { sourceId: 'bfe-problems', url: 'https://bigfrontend.dev/problem/event-delegation', originalTitle: '117. event delegation' },
    ],
    researchNotes:
      'Listed as a coding problem on BFE.dev (#117). Only the title was read; the helper\'s signature, the todo-list integration and the edge cases (root boundary, nested matches, text-node targets, eager selector validation) are this project\'s own specification. Event delegation also appears implicitly in the handbook\'s UI questions (lists, tables), but it is not named there as a separate question, so confidence is MEDIUM.',
  },
  spec: {
    summary: 'Implement onClickMatching(root, selector, handler): one click listener on root that calls handler for clicks on (or inside) descendants matching selector, returning an unsubscribe function.',
    description: `Implement \`onClickMatching(root, selector, handler)\` in **\`delegate.js\`**.

- Add **one** \`click\` listener to \`root\`.
- When a click happens, find the **nearest element at or above the click target that matches \`selector\`**. If it exists **and is a descendant of \`root\`**, call \`handler(matchedElement, event)\`.
- Clicks on **children** of a matching element (an icon inside a button) count as clicks on the matching element.
- Matching elements **added after** the call must work — that is the point of delegation.
- Return a function that **removes the listener**.

\`\`\`js
const off = onClickMatching(list, '.task-delete', (button, event) => {
  button.closest('li').remove();
});
// later
off();
\`\`\`

The page contains a small todo list (\`script.js\`, read-only) that uses your helper for its delete and toggle buttons, including tasks added at runtime.`,
    technologies: ['JavaScript (DOM)', 'Element.closest()', 'event bubbling'],
    learningObjectives: [
      'Explain bubbling and why one ancestor listener can serve many children',
      'Resolve the logical target with closest() instead of comparing event.target directly',
      'Respect the delegation boundary: closest() does not stop at root',
      'Return disposers so listeners can be cleaned up',
    ],
    clarifications: [
      {
        question: 'Should root itself be able to match the selector?',
        why: 'closest() starts at the target and walks up through root and beyond; without a rule, clicking anywhere inside root would match root.',
        defaultAssumption: 'No. Only strict descendants of root are delegation targets.',
      },
      {
        question: 'With nested matches (a .row inside a .row), how many times is the handler called?',
        why: 'jQuery-style delegation calls the handler for every matching level; many hand-written helpers only call it for the innermost.',
        defaultAssumption: 'Once, with the innermost match.',
      },
      {
        question: 'What arguments does the handler get?',
        why: 'event.target may be a child (span, svg path), so callers need the matched element explicitly.',
        defaultAssumption: 'handler(matchedElement, event). `this` is also the matched element, but that is not tested.',
      },
      {
        question: 'How should an invalid selector be reported?',
        why: 'closest() throws on invalid selectors; without validation the error surfaces on the first click, far from the bug.',
        defaultAssumption: 'Throw immediately when onClickMatching is called.',
      },
    ],
    scopeDecisions: [
      'Only the click event is supported; generalising to any event type is a follow-up.',
      'Events that do not bubble (focus, blur, mouseenter) are out of scope.',
      'Shadow DOM retargeting is out of scope.',
      'script.js (the todo app) is provided and read-only.',
    ],
    requirements: [
      { id: 'single-listener', category: 'technical', level: 'MUST', text: 'Exactly one click listener is added to root per call.' },
      { id: 'match', category: 'functional', level: 'MUST', text: 'The handler is called with (matchedElement, event) when a matching descendant of root is clicked.' },
      { id: 'nested-target', category: 'functional', level: 'MUST', text: 'Clicks on descendants of a matching element resolve to the nearest matching ancestor.' },
      { id: 'dynamic', category: 'functional', level: 'MUST', text: 'Matching elements added after registration are handled.' },
      { id: 'unsubscribe', category: 'functional', level: 'MUST', text: 'The returned function removes the listener; calling it twice is harmless.' },
      { id: 'root-boundary', category: 'edge-case', level: 'MUST', text: 'Neither root itself nor anything outside root (ancestors, siblings) is ever passed to the handler.' },
      { id: 'innermost', category: 'edge-case', level: 'MUST', text: 'With nested matches, the handler is called once with the innermost match.' },
      { id: 'text-target', category: 'edge-case', level: 'SHOULD', text: 'Events whose target is a Text node are handled (start from the parent element).' },
      { id: 'validate-selector', category: 'edge-case', level: 'SHOULD', text: 'An invalid selector throws when onClickMatching is called.' },
      { id: 'independent', category: 'technical', level: 'MUST', text: 'Several registrations on the same root work independently.' },
      { id: 'focus-after-delete', category: 'accessibility', level: 'SHOULD', text: 'The todo list keeps keyboard focus in a sensible place after deleting (provided by script.js).' },
      { id: 'constant-listeners', category: 'performance', level: 'SHOULD', text: 'The number of listeners does not grow with the number of list items.' },
      { id: 'unit-and-integration', category: 'testing', level: 'SHOULD', text: 'Tests cover the helper in isolation and through the todo list.' },
    ],
    constraints: ['No libraries.', 'Do not edit script.js; all behaviour must come from the helper.'],
    acceptanceCriteria: [
      'All public tests pass.',
      'All hidden tests pass (root boundary, outside elements, nested matches, text-node targets, selector validation, independent registrations, todo-list integration).',
    ],
    examples: [
      { title: 'Icon click', input: 'Click the × span inside button.task-delete', output: 'handler(button.task-delete, event)' },
      { title: 'Outside root', input: 'onClickMatching(listA, ".del", h); click a .del in listB', output: 'h not called' },
      { title: 'Nested', input: 'selector ".row", click inside .row > .row', output: 'h called once with the inner .row' },
    ],
    manualTests: [
      'Add three tasks with the keyboard (type + Enter), then delete them with Tab + Enter and check where focus goes.',
      'In DevTools, run getEventListeners(document.getElementById("task-list")) and confirm there are exactly two click listeners however many tasks exist.',
    ],
  },
  files: {
    entry: '/script.js',
    starter: { '/index.html': starterHtml, '/styles.css': starterCss, '/script.js': starterScript, '/delegate.js': starterDelegate },
    solution: { '/index.html': solutionHtml, '/styles.css': solutionCss, '/script.js': solutionScript, '/delegate.js': solutionDelegate },
    readonly: ['/script.js'],
    support: {},
  },
  tests: [
    { path: '/tests/public.test.js', visibility: 'public', kind: 'runtime', source: publicTests },
    { path: '/tests/hidden.test.js', visibility: 'hidden', kind: 'runtime', source: hiddenTests },
  ],
  hints: [
    'Clicks bubble: a listener on `root` sees every click on its descendants. `event.target` is the innermost element that was clicked — often a span inside your button.',
    '`event.target.closest(selector)` walks up from the target and returns the nearest match. But it does not stop at `root`: it can return `root` itself or an element above it.',
    'After `closest()`, accept the result only if `matched !== root && root.contains(matched)`.',
    'Keep a reference to the listener function so the returned disposer can call `root.removeEventListener("click", listener)`. Validate the selector up front with `root.matches(selector)`, which throws for invalid syntax.',
  ],
  solution: {
    initialApproach:
      'Add a listener to root and check `event.target.matches(selector)`. This works when the user clicks exactly on the matching element but fails for clicks on its children (icons, nested spans), which is most real clicks on icon buttons.',
    bruteForce:
      'Attaching a listener to every matching element (`root.querySelectorAll(selector).forEach(...)`) is the non-delegated alternative: it misses elements added later and costs one listener per item. Mention it as the thing delegation replaces.',
    optimizedApproach:
      'One listener on root. On click, normalise the target (Text node → parent element), call `closest(selector)`, then check the boundary (`matched !== root && root.contains(matched)`). Call `handler(matched, event)`. Return an idempotent disposer that removes the same listener reference.',
    walkthrough: `1. **Validate** \`root\`, \`handler\`, and the selector (\`root.matches(selector)\` throws a SyntaxError for invalid selectors).
2. **Define \`listener(event)\`** inside the function so it closes over \`root\`, \`selector\` and \`handler\`.
3. **Normalise the target**: if \`event.target\` is not an Element (e.g. a Text node), use its \`parentElement\`.
4. **Find the candidate**: \`start.closest(selector)\` returns the nearest matching ancestor-or-self.
5. **Enforce the boundary**: reject when there is no match, when the match is \`root\`, or when \`root.contains(match)\` is false (the match is above root). Because closest() returns the *nearest* match, if that one is outside root then nothing between the target and root matched either.
6. **Call** \`handler.call(matched, matched, event)\`.
7. **Register** with \`root.addEventListener('click', listener)\` and return a disposer that removes it once.

The todo list then needs only two listeners on \`#task-list\` (delete and toggle) for any number of tasks.`,
    complexity: 'Per click: O(d) for d ancestors walked by closest() plus O(d) for contains(). Listener count: one per registration, independent of the number of items.',
    edgeCases:
      '- **Click on a child of the match** → closest() resolves upward.\n- **root matches the selector** → explicitly ignored.\n- **A match above root** → `root.contains()` is false → ignored.\n- **Nested matches** → closest() gives the innermost; the handler runs once.\n- **Text node target** → start from `parentElement`.\n- **Invalid selector** → throws at registration.\n- **Inner listener calls stopPropagation()** → the click never reaches root, so delegation cannot see it; this is a known limitation of delegation.\n- **Element removed during its own handler** (deleting a task) → safe, because matching already happened.',
    alternatives:
      '- **Generalise the event type**: `delegate(root, type, selector, handler)`; for focus events use `focusin`/`focusout`, which bubble.\n- **Call for every matching level** (jQuery semantics): walk from target to root and call the handler for each match, respecting `stopPropagation` emulation.\n- **AbortSignal-based cleanup**: `root.addEventListener("click", listener, { signal })` and accept a signal instead of returning a disposer.\n- **Per-element listeners**: fine for a handful of static elements.',
    tradeoffs:
      'Delegation reduces listener count and handles dynamic content for free, but every click inside root runs the matching logic, handlers cannot rely on `event.currentTarget` being the item, and anything that stops propagation below root breaks it. Events that do not bubble need their bubbling counterparts. For a small static set of buttons, direct listeners are simpler to read.',
    commonMistakes:
      '- Using `event.target.matches(selector)` — misses clicks on children.\n- Forgetting that `closest()` walks past root, so elements outside root (or root itself) match.\n- Using `event.currentTarget` as the matched element (it is always root).\n- Passing a new arrow function to `removeEventListener`, which removes nothing.\n- Rebuilding list items with `innerHTML` from user input (XSS) instead of `textContent`.',
    testingStrategy:
      'Unit-test the helper with small DOM fragments: direct match, child-of-match, non-match, dynamically added element, unsubscribe, root boundary (root matches; ancestor matches), outside sibling, nested matches, Text-node target, invalid selector, multiple registrations. Then integration-test the todo list through `mount()` with role queries: delete an initial task, add and delete a new one, click the icon span, toggle, and check where focus lands.',
    seniorFollowUps:
      '- Extend to any event type. What happens with focus/blur, mouseenter, and scroll?\n- How do React\'s synthetic events use delegation (root container listener), and what changed in React 17?\n- How does delegation interact with Shadow DOM event retargeting?\n- When does delegation measurably help performance, and how would you measure it (listener count, memory, INP)?',
  },
  followUps: [
    {
      id: 'f1',
      level: 'definition',
      question: 'What is event delegation, and which browser behaviour makes it possible?',
      expectedConcepts: ['one listener on an ancestor', 'event bubbling', 'event.target identifies the origin'],
      sourceIds: ['mdn-event-bubbling'],
    },
    {
      id: 'f2',
      level: 'mechanism',
      question: 'What is the difference between event.target and event.currentTarget inside your root listener?',
      expectedConcepts: ['target is where the event originated', 'currentTarget is the element whose listener is running (root)', 'matched element must be computed'],
      sourceIds: ['mdn-event-bubbling'],
    },
    {
      id: 'f3',
      level: 'edge-cases',
      question: 'A child component calls event.stopPropagation() in its own click handler. What happens to your delegated handler, and how would you design around it?',
      expectedConcepts: ['event never reaches root', 'avoid stopPropagation in shared components', 'capture-phase listener as an alternative', 'document the contract'],
      sourceIds: ['mdn-stoppropagation'],
    },
    {
      id: 'f4',
      level: 'application',
      question: 'Generalise the helper to delegate(root, type, selector, handler). Which event types need special handling?',
      expectedConcepts: ['non-bubbling events', 'focusin/focusout instead of focus/blur', 'mouseover/mouseout instead of mouseenter/mouseleave', 'passive listeners for touch/wheel'],
      sourceIds: ['mdn-event-bubbling'],
    },
    {
      id: 'f5',
      level: 'production',
      question: 'A table with 5 000 rows has edit and delete buttons in every row. Compare per-row listeners with delegation in terms of memory, setup time and responsiveness.',
      expectedConcepts: ['listener count and closures per row', 'setup cost on render', 'delegation handles re-renders', 'per-event matching cost is small', 'measure with INP'],
      sourceIds: ['webdev-inp'],
    },
    {
      id: 'f6',
      level: 'architecture',
      question: 'React attaches its event listeners to the root container rather than to each element. What problems does that solve, and what trade-offs does it introduce when mixing React with non-React code?',
      expectedConcepts: ['delegation at the root', 'React 17 moved from document to root container', 'native stopPropagation interplay', 'multiple React roots / micro-frontends'],
      sourceIds: ['mdn-event-bubbling'],
    },
  ],
  mcqs: [
    {
      id: 'm1',
      question: 'A delete button contains an <svg> icon. Your delegated listener does `if (event.target.matches(".delete")) ...`. Clicking the icon does nothing. Why?',
      options: [
        { id: 'a', text: 'SVG elements do not dispatch click events', explanation: 'SVG elements are clickable and the event bubbles normally.' },
        { id: 'b', text: 'event.target is the svg (or one of its paths), not the button, so matches(".delete") is false', explanation: 'Correct: use event.target.closest(".delete") to find the button.' },
        { id: 'c', text: 'Click events do not bubble out of buttons', explanation: 'They do; that is why the root listener runs at all.' },
        { id: 'd', text: 'matches() only works on elements in the light DOM of the document root', explanation: 'matches() works on any element.' },
      ],
      correctOptionId: 'b',
      explanation: 'event.target is the innermost element under the pointer. Delegation code must walk upward with closest() to find the logical target.',
      sourceIds: ['mdn-event-bubbling'],
    },
    {
      id: 'm2',
      question: 'Root is a <ul> inside <div class="card">. You delegate with selector ".card". What does `event.target.closest(".card")` return for a click on an <li> inside the <ul>?',
      options: [
        { id: 'a', text: 'null, because closest() stops at the listener element', explanation: 'closest() knows nothing about listeners; it walks all the way up to the document.' },
        { id: 'b', text: 'The <div class="card"> outside root', explanation: 'Correct: that is why you must check root.contains(match) before calling the handler.' },
        { id: 'c', text: 'The <ul>', explanation: 'The ul does not have the class card.' },
        { id: 'd', text: 'It throws because the match is outside root', explanation: 'closest() never throws for a valid selector; it returns the match or null.' },
      ],
      correctOptionId: 'b',
      explanation: 'Element.closest() walks from the element through every ancestor up to the document. A delegation helper must reject matches that are not inside its root.',
      sourceIds: ['mdn-event-bubbling'],
    },
  ],
};

export default problem;
