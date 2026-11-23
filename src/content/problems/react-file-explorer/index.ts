import type { CodingProblem } from '../../schema';
import starterExplorer from './starter/FileExplorer.tsx?raw';
import starterUtils from './starter/treeUtils.ts?raw';
import types from './starter/types.ts?raw';
import data from './starter/data.ts?raw';
import app from './starter/App.tsx?raw';
import styles from './starter/styles.css?raw';
import solutionExplorer from './solution/FileExplorer.tsx?raw';
import solutionUtils from './solution/treeUtils.ts?raw';
import utilsTests from './tests/treeUtils.test.ts?raw';
import publicTests from './tests/public.test.tsx?raw';
import hiddenTests from './tests/hidden.test.tsx?raw';

const shared = { '/App.tsx': app, '/types.ts': types, '/data.ts': data, '/styles.css': styles };

const problem: CodingProblem = {
  schemaVersion: 1,
  kind: 'coding',
  id: 'react-file-explorer',
  slug: 'file-explorer',
  title: 'File Explorer',
  track: 'react',
  execution: 'react',
  difficulty: 'medium',
  priority: 'P0',
  seniority: ['Senior', 'SDE-2', 'SDE-3', 'MTS'],
  topics: ['recursive rendering', 'immutable updates', 'discriminated unions', 'tree a11y', 'roving tabindex'],
  estimatedMinutes: 60,
  conceptIds: ['recursive-tree-traversal', 'discriminated-unions', 'immutable-updates', 'referential-equality', 'react-reconciliation-keys', 'tree-aria-pattern', 'keyboard-navigation', 'focus-management'],
  research: {
    provenance: 'PUBLISHED_PRACTICE_PROBLEM',
    frequencyConfidence: 'HIGH_CONFIDENCE',
    verificationStatus: 'SOURCES_VERIFIED',
    lastVerified: '2026-11-23',
    evidence: [
      { sourceId: 'fih-ui', url: 'https://www.frontendinterviewhandbook.com/coding/build-front-end-user-interfaces', originalTitle: 'File Explorer', note: 'Listed under "Apps" in the handbook\'s "Where to practice" list.' },
      { sourceId: 'fg-mc', url: 'https://www.frontendgeek.com/frontend-interview/machine-coding-interview', originalTitle: 'Tree View / Folder View', note: 'Listed under component machine coding ("Single-level or multi-level comment or folder view").' },
    ],
    researchNotes:
      'Two independent sources. The catalog merges the separate "Tree View" candidate into this problem (duplicate). Create/delete and the APG tree keyboard model are scoped in to give senior-level depth; rename, drag-and-drop and lazy loading are follow-ups.',
  },
  spec: {
    summary: 'Render a nested file tree with expand/collapse, selection, create/delete, immutable updates and the ARIA tree keyboard model.',
    description: `Implement **FileExplorer.tsx** and the pure helpers in **treeUtils.ts**.

The data is a recursive discriminated union (\`types.ts\`):

\`\`\`ts
type TreeNode = { kind: 'file'; id; name } | { kind: 'folder'; id; name; children: TreeNode[] };
\`\`\`

The explorer must:

1. Render the root folder's children as a \`role="tree"\` with \`role="treeitem"\` rows and \`role="group"\` for expanded folder contents. Folders come first, then files, both sorted case-insensitively.
2. Toggle folders on click (folders start collapsed) and open files (\`onOpenFile(file)\`). The clicked item becomes **selected** (\`aria-selected\`).
3. **New file / New folder** create a node in the selected folder — or in the selected file's folder, or the root. Names are trimmed, required, must not contain "/" and must be unique among siblings (case-insensitive); show errors with \`role="alert"\`. Enter creates, Escape cancels.
4. **Delete** removes the selected node and its descendants.
5. Keyboard (WAI-ARIA tree): roving tabindex, ArrowUp/ArrowDown, ArrowRight (expand / first child), ArrowLeft (collapse / parent), Home/End, Enter/Space (activate).
6. \`treeUtils.ts\`: \`sortNodes\`, \`insertNode\` and \`removeNode\` are **pure** and use **structural sharing** — only the path to the change is copied, and no-op operations return the original reference.

\`App.tsx\`, \`types.ts\` and \`data.ts\` are read-only.`,
    technologies: ['React 18', 'TypeScript', 'WAI-ARIA tree view'],
    learningObjectives: [
      'Model recursive data with a discriminated union',
      'Write immutable tree updates with structural sharing',
      'Derive a flat "visible rows" list for keyboard navigation',
      'Implement roving tabindex and the APG tree keyboard model',
    ],
    clarifications: [
      { question: 'How large can the tree get, and is it loaded all at once?', why: 'Large or remote trees need lazy loading and virtualisation, which changes the data model.', defaultAssumption: 'A few hundred nodes, fully loaded in memory.' },
      { question: 'Which operations are required: create, rename, delete, move?', why: 'Each adds UI and state complexity; scope it for the time box.', defaultAssumption: 'Create and delete; rename/move are follow-ups.' },
      { question: 'How should items be ordered?', why: 'Users expect folders first; sorting affects keyboard order.', defaultAssumption: 'Folders first, then case-insensitive alphabetical.' },
      { question: 'Is the tree state owned by the component or by a parent/store?', why: 'Controlled vs uncontrolled affects the API and persistence.', defaultAssumption: 'Uncontrolled: `initialTree` seeds internal state.' },
      { question: 'What identifies a node?', why: 'Stable ids are needed for keys, expansion state and selection.', defaultAssumption: 'Path-like string ids; new ids are `${parentId}/${name}`.' },
    ],
    scopeDecisions: ['No rename, drag-and-drop or multi-select.', 'Expansion state is not persisted.', 'The root folder is not rendered as a row.'],
    requirements: [
      { id: 'render-tree', category: 'functional', level: 'MUST', text: 'Nested folders and files render recursively with correct nesting levels.' },
      { id: 'sort', category: 'functional', level: 'MUST', text: 'Folders first, then files; case-insensitive alphabetical order.' },
      { id: 'toggle', category: 'functional', level: 'MUST', text: 'Folders start collapsed and toggle on click.' },
      { id: 'open-file', category: 'functional', level: 'MUST', text: 'Clicking a file selects it and calls onOpenFile(file).' },
      { id: 'create', category: 'functional', level: 'MUST', text: 'New file / New folder create a node in the target folder; the parent expands and the new node is selected.' },
      { id: 'validate', category: 'edge-case', level: 'MUST', text: 'Empty, "/"-containing and duplicate (case-insensitive) names are rejected with an alert.' },
      { id: 'delete', category: 'functional', level: 'MUST', text: 'Delete removes the selected node and all descendants.' },
      { id: 'immutable', category: 'technical', level: 'MUST', text: 'Tree updates never mutate existing nodes.' },
      { id: 'structural-sharing', category: 'performance', level: 'SHOULD', text: 'Unchanged subtrees keep their identity; no-op updates return the original tree.' },
      { id: 'union-types', category: 'technical', level: 'SHOULD', text: 'Narrow on `kind` instead of checking for `children`.' },
      { id: 'tree-roles', category: 'accessibility', level: 'MUST', text: 'role="tree"/"treeitem"/"group", aria-expanded on folders only, aria-selected, aria-level.' },
      { id: 'item-names', category: 'accessibility', level: 'MUST', text: 'Each treeitem\'s accessible name is its own name only (e.g. aria-labelledby on the label), not the text of its descendants.' },
      { id: 'roving-tabindex', category: 'accessibility', level: 'MUST', text: 'Exactly one treeitem has tabIndex=0; arrow keys move focus.' },
      { id: 'keyboard', category: 'accessibility', level: 'MUST', text: 'ArrowUp/Down, ArrowRight/Left, Home/End, Enter/Space follow the APG tree pattern.' },
      { id: 'keys', category: 'performance', level: 'SHOULD', text: 'React keys are stable node ids, not array indexes.' },
      { id: 'empty', category: 'edge-case', level: 'SHOULD', text: 'An empty root shows an empty state; empty folders expand to an empty group.' },
      { id: 'pure-tests', category: 'testing', level: 'SHOULD', text: 'Tree helpers are unit-tested independently of the UI, including identity assertions.' },
    ],
    constraints: ['React function components and hooks only.', 'No tree libraries.'],
    acceptanceCriteria: [
      'All public tests pass (tree helpers, rendering order, toggle, open, create, delete).',
      'All hidden tests pass (roving tabindex, keyboard navigation, Home/End, validation, Escape, create next to file, recursive delete).',
    ],
    examples: [
      { title: 'Ordering', input: '[z.md, src/, a.json]', output: 'src/, a.json, z.md' },
      { title: 'Structural sharing', input: 'insertNode(tree, "root/src", file)', output: 'new root and new src; README.md, public/ … are the same objects as before' },
    ],
    manualTests: [
      'Navigate the whole tree with only the keyboard; the focus ring should always be visible.',
      'Create a file while a file is selected — it should appear next to it.',
      'Check with a screen reader that level, expanded state and position are announced.',
    ],
  },
  files: {
    entry: '/App.tsx',
    starter: { ...shared, '/FileExplorer.tsx': starterExplorer, '/treeUtils.ts': starterUtils },
    solution: { ...shared, '/FileExplorer.tsx': solutionExplorer, '/treeUtils.ts': solutionUtils },
    readonly: ['/App.tsx', '/types.ts', '/data.ts'],
    support: {},
  },
  tests: [
    { path: '/tests/treeUtils.test.ts', visibility: 'public', kind: 'runtime', source: utilsTests },
    { path: '/tests/public.test.tsx', visibility: 'public', kind: 'runtime', source: publicTests },
    { path: '/tests/hidden.test.tsx', visibility: 'hidden', kind: 'runtime', source: hiddenTests },
  ],
  hints: [
    'Start with treeUtils.ts. `insertNode` is a recursive function: if this folder is the parent, return a copy with the new child appended; otherwise map over children and recurse into folders.',
    'Structural sharing: track whether any child actually changed. If nothing changed, return the original object — that is what makes no-op updates return the same reference.',
    'In the component, keep `expanded` as a Set of ids and `selectedId`. Render recursively; only render a folder\'s children when it is expanded.',
    'For keyboard navigation, compute a flat array of the *visible* nodes in display order (useMemo). ArrowDown/ArrowUp are then index ± 1. Keep a `focusedId`, give that item tabIndex=0, and call `.focus()` on it after keyboard moves.',
  ],
  solution: {
    initialApproach: 'Store the tree in state, keep UI state (expanded ids, selected id, focused id, draft) separately from the data, render recursively, and implement every mutation as a pure function that returns a new tree.',
    bruteForce: 'Deep-cloning the whole tree (`structuredClone`) and mutating the clone is simple and correct, but it is O(n) per edit, discards referential identity everywhere (every memoised row re-renders) and hides intent. It is a fine first step to mention, not the final answer.',
    optimizedApproach: `- **Pure, structurally-shared helpers**: \`insertNode\`/\`removeNode\` copy only the nodes on the path from the root to the change; untouched siblings keep their identity, and a no-op returns the input. That makes \`React.memo\` on rows effective and makes "did anything change?" an O(1) reference check.
- **Index once per tree**: \`indexTree\` builds \`byId\` and \`parentOf\` maps in O(n), used for parent lookups (ArrowLeft, create next to file).
- **Derived visible list**: a \`useMemo\` depth-first walk over expanded folders produces display order for keyboard navigation — no DOM querying.
- **Roving tabindex**: one tabbable item; arrow keys change \`focusedId\` and an effect focuses the element via a ref map.`,
    walkthrough: `1. **Types**: \`TreeNode\` is a discriminated union, so \`node.kind === 'folder'\` narrows to a type with \`children\`.
2. **sortNodes** copies the array before sorting (Array#sort mutates) and compares with \`localeCompare(..., { sensitivity: 'base', numeric: true })\`.
3. **insertNode**: base case — the current folder is the parent: return \`{ ...tree, children: [...tree.children, node] }\`. Otherwise map children, recurse into folders, record whether anything changed, and return \`tree\` itself when nothing did.
4. **removeNode**: same shape, filtering out the matching id.
5. **State**: \`tree\`, \`expanded: Set<string>\` (always replaced, never mutated), \`selectedId\`, \`focusedId\`, \`draft\`.
6. **visible**: depth-first walk of sorted children, descending only into expanded folders, recording \`level\`.
7. **tabbableId** falls back to the first visible row when the focused one disappears (collapsed or deleted).
8. **Keyboard** handler on the \`tree\` element (events bubble from the focused treeitem) implements the APG map and calls \`preventDefault\` so arrows don't scroll the page.
9. **Create**: pick the target folder (selected folder → selected file's parent → root), validate the trimmed name against siblings, insert, expand the parent, select and focus the new node.
10. **Delete**: remove, clear selection, move focus to the previous visible row.`,
    complexity: '- Insert/remove: O(n) worst case to find the node, but only O(depth) nodes are copied.\n- indexTree and the visible list: O(n) per tree/expansion change.\n- Rendering: O(visible nodes). With memoised rows and structural sharing, an edit re-renders only the changed path.',
    edgeCases: '- Duplicate names differing only by case.\n- Creating while a file is selected (use its parent).\n- Deleting a folder that contains the focused item (focus falls back).\n- Empty folders (expand to an empty group) and an empty root (empty state).\n- Names with "/" would break path ids.\n- Ids must stay unique; deriving them from paths is safe only while rename is not supported.',
    alternatives: '- **Normalised store** (`{ nodes: Record<id, Node>, childrenOf: Record<id, id[]> }`): O(1) updates and moves; better for large trees and drag-and-drop, at the cost of denormalising for rendering.\n- **useReducer** with actions (`create`, `delete`, `toggle`) for testable state transitions.\n- **Immer** for ergonomic immutable updates (still structural sharing underneath).\n- **Native `<details>/<summary>`** for a simple disclosure tree — no ARIA tree semantics or arrow-key navigation, but zero JS.',
    tradeoffs: '- Nested data mirrors the UI and is easy to render, but moves and lookups are O(n); normalised data is the reverse.\n- Roving tabindex moves real focus (simple, robust); aria-activedescendant keeps focus on the container (better for type-ahead, more id bookkeeping).\n- Uncontrolled state is simple to embed, but a controlled API (`tree` + `onChange`) is necessary when the server owns the data.',
    commonMistakes: '- Mutating `children.push(...)` on the existing state, so React (and memoised rows) don\'t notice changes.\n- Using array indexes as keys — expansion/focus state jumps to the wrong row after inserts.\n- Checking `"children" in node` instead of narrowing on `kind`.\n- Making every row tabbable (Tab then has to walk the entire tree).\n- Putting aria-expanded on files.\n- Querying the DOM for "next item" instead of deriving it from state.',
    testingStrategy: '- Unit-test pure helpers, including **identity** assertions (`toBe`) for structural sharing and no-ops.\n- Component tests by role and accessible name: tree, treeitem, aria-expanded, aria-selected, aria-level.\n- Keyboard tests assert `toHaveFocus` after each key.\n- Validation tests for empty/duplicate names.',
    seniorFollowUps: '- 50 000 nodes: virtualise the flattened visible list, keep aria-level/aria-setsize/aria-posinset correct.\n- Lazy-load folder contents from an API: loading/error per folder, cancellation, caching.\n- Drag-and-drop moves with keyboard alternative; prevent moving a folder into its own descendant.\n- Rename with id stability (ids must not be derived from names).\n- Persist expansion state across sessions; reconcile when the tree changes on the server.',
  },
  followUps: [
    { id: 'f1', level: 'definition', question: 'What is structural sharing?', expectedConcepts: ['new versions reuse unchanged parts', 'only the path to the change is copied', 'enables cheap reference equality checks'], sourceIds: ['react-updating-objects'] },
    { id: 'f2', level: 'mechanism', question: 'Why do array-index keys cause bugs in this tree after inserting a node?', expectedConcepts: ['keys identify components across renders', 'state moves to the wrong row', 'use stable ids'], sourceIds: ['react-rendering-lists', 'react-preserving-state'] },
    { id: 'f3', level: 'application', question: 'Implement "move node" (drag and drop). What invariants must you check?', expectedConcepts: ['cannot move into own descendant', 'name collisions in target', 'remove then insert atomically', 'ids derived from paths must be rewritten'], sourceIds: [] },
    { id: 'f4', level: 'edge-cases', question: 'The focused folder gets collapsed by its parent being collapsed. Where should focus go?', expectedConcepts: ['focus must stay on a visible item', 'fall back to nearest visible ancestor', 'roving tabindex fallback'], sourceIds: ['apg-treeview'] },
    { id: 'f5', level: 'production', question: 'Folders are loaded lazily from an API. How does the state model change?', expectedConcepts: ['per-folder loading/error state', 'children: undefined vs []', 'cancellation and caching', 'aria-busy'], sourceIds: [] },
    { id: 'f6', level: 'architecture', question: 'Nested vs normalised tree state: which would you choose for an IDE-scale explorer and why?', expectedConcepts: ['normalised maps for O(1) updates', 'moves are cheap', 'selectors derive nested view', 'memoisation per node'], sourceIds: ['react-updating-objects'] },
  ],
  mcqs: [
    {
      id: 'm1',
      question: 'In the WAI-ARIA tree pattern, what should ArrowRight do on a focused, closed folder?',
      options: [
        { id: 'a', text: 'Move focus to the next sibling', explanation: 'That is ArrowDown\'s job.' },
        { id: 'b', text: 'Open the folder without moving focus', explanation: 'Correct — a second ArrowRight then moves to the first child.' },
        { id: 'c', text: 'Select the folder', explanation: 'Selection is separate from expansion.' },
        { id: 'd', text: 'Nothing; only Enter opens folders', explanation: 'ArrowRight opens closed nodes in the tree pattern.' },
      ],
      correctOptionId: 'b',
      explanation: 'APG tree view: Right Arrow on a closed node opens it; on an open node moves to the first child; on an end node does nothing.',
      sourceIds: ['apg-treeview'],
    },
    {
      id: 'm2',
      question: 'insertNode(tree, "root/src", file) is implemented with structural sharing. Which statement is true?',
      code: 'const next = insertNode(tree, "root/src", file);',
      options: [
        { id: 'a', text: 'next === tree', explanation: 'Something changed, so the root must be a new object.' },
        { id: 'b', text: 'next.children[i] === tree.children[i] for every i', explanation: 'The src folder is on the changed path, so it is a new object.' },
        { id: 'c', text: 'Siblings of src are the same objects; root and src are new', explanation: 'Correct — only the path from the root to the change is copied.' },
        { id: 'd', text: 'Every node is a new object', explanation: 'That describes a deep clone, not structural sharing.' },
      ],
      correctOptionId: 'c',
      explanation: 'Copy-on-path: the root and each ancestor of the change get new objects; everything else is reused.',
      sourceIds: ['react-updating-objects'],
    },
  ],
};

export default problem;
