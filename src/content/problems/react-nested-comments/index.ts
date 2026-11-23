import type { CodingProblem } from '../../schema';
import starterThread from './starter/CommentThread.tsx?raw';
import starterStore from './starter/commentStore.ts?raw';
import types from './starter/types.ts?raw';
import data from './starter/data.ts?raw';
import app from './starter/App.tsx?raw';
import styles from './starter/styles.css?raw';
import solutionThread from './solution/CommentThread.tsx?raw';
import solutionStore from './solution/commentStore.ts?raw';
import helpers from './tests/helpers.tsx?raw';
import storeTests from './tests/commentStore.test.ts?raw';
import storeHiddenTests from './tests/commentStore.hidden.test.ts?raw';
import publicTests from './tests/public.test.tsx?raw';
import hiddenTests from './tests/hidden.test.tsx?raw';

const shared = { '/App.tsx': app, '/types.ts': types, '/data.ts': data, '/styles.css': styles };

const problem: CodingProblem = {
  schemaVersion: 1,
  kind: 'coding',
  id: 'react-nested-comments',
  slug: 'nested-comments',
  title: 'Nested Comments',
  track: 'react',
  execution: 'react',
  difficulty: 'medium',
  priority: 'P1',
  seniority: ['Senior', 'SDE-2', 'SDE-3', 'MTS'],
  topics: ['recursive rendering', 'normalised state', 'immutable updates', 'soft delete', 'focus management', 'list semantics', 'XSS'],
  estimatedMinutes: 60,
  conceptIds: ['recursive-tree-traversal', 'immutable-updates', 'referential-equality', 'react-reconciliation-keys', 'focus-management', 'aria-live-regions', 'derived-state', 'react-effects'],
  research: {
    provenance: 'PUBLISHED_PRACTICE_PROBLEM',
    frequencyConfidence: 'MEDIUM_CONFIDENCE',
    verificationStatus: 'SOURCES_VERIFIED',
    lastVerified: '2026-11-23',
    evidence: [
      {
        sourceId: 'fg-mc',
        url: 'https://www.frontendgeek.com/frontend-interview/machine-coding-interview',
        originalTitle: 'Comment View (Multi-level)',
        note: 'Listed under "Component machine coding" on the FrontendGeek machine-coding hub.',
      },
    ],
    researchNotes:
      'One published practice source names the problem ("Comment View (Multi-level)"), so frequency is MEDIUM_CONFIDENCE; the same hub\'s "Tree View / Folder View" entry is a sibling recursive-rendering exercise (see react-file-explorer). The handbook page behind fih-ui lists XSS via innerHTML among UI-coding evaluation points, which is why rendering user text safely is a requirement here. Nothing was copied from either page: the statement, data model, tests and solution are original. 60-minute scope: recursive rendering, reply/edit/delete/upvote, soft delete with tombstone pruning, collapse with counts, top-level sorting, and focus/naming for keyboard and screen-reader users. Pagination ("load more replies"), real-time updates, optimistic server sync, moderation and the "Continue thread" view are follow-ups.',
  },
  spec: {
    summary:
      'Build a threaded comment list: recursive replies, reply/edit/delete/upvote, collapse with reply counts and top-level sorting, with every update done by pure, tested helpers over a normalised store.',
    description: `Implement the pure helpers in **commentStore.ts** and the UI in **CommentThread.tsx**.

### Data (\`types.ts\`, read-only)

Comments are **normalised**: stored once in \`byId\`, with \`rootIds\` for top-level comments and \`childIds\` (oldest first) for replies.

\`\`\`ts
interface Comment { id; parentId: string | null; author; text; createdAt; votes; voted; edited; deleted; childIds: string[] }
interface CommentStore { byId: Record<string, Comment>; rootIds: string[] }
\`\`\`

### Helpers (\`commentStore.ts\`) — pure, structurally shared, no-ops return the same store

| Function | Behaviour |
|---|---|
| \`addReply(store, parentId \\| null, { id, author, text, createdAt })\` | Trimmed text; \`null\` → top-level. Appends to the parent's \`childIds\`. No-op for empty text, a used id, or an unknown/deleted parent. |
| \`editComment(store, id, text)\` | Trimmed; sets \`edited\`. No-op for empty, unchanged, unknown or deleted. |
| \`deleteComment(store, id)\` | **Has replies** → soft delete (\`deleted: true\`, \`text: ''\`, subtree kept). **Leaf** → removed from \`byId\` and its parent/\`rootIds\`; a soft-deleted parent left with no replies is removed too, cascading upwards. |
| \`toggleVote(store, id)\` | Flips \`voted\`, \`votes ± 1\`. No-op for unknown/deleted. |
| \`countDescendants(store, id)\` | Non-deleted replies at **any** depth (not the comment itself). Unknown → 0. |
| \`sortRootIds(store, 'newest' \\| 'top')\` | New array. newest: \`createdAt\` desc; top: \`votes\` desc then \`createdAt\` desc; final tie-break id asc. |

### Component

\`\`\`tsx
<CommentThread initialStore={store} currentUser="You" onChange={(next) => …} generateId={…} now={…} />
\`\`\`

- A heading **"Comments (n)"** (n = non-deleted comments) labels a \`<ul>\` of top-level comments. Each comment is an \`<li>\` holding an \`<article aria-label="Comment by {author}">\` (or **"Deleted comment"**) and, if it has replies, a nested \`<ul aria-label="Replies to {author}">\` — recursively, to any depth.
- A **Sort by** \`<select>\` (\`newest\` "Newest" / \`top\` "Top") orders top-level comments only; replies stay oldest-first.
- An **"Add a comment"** textarea with a **Post comment** button adds a top-level comment.
- Per comment (inside its article; names are exact):

| Control | Accessible name | Notes |
|---|---|---|
| Upvote | \`Upvote comment by {author}\` | \`aria-pressed\`; the count is in an element with \`data-testid="vote-count"\` |
| Reply | \`Reply to {author}\` | opens a textarea labelled \`Your reply to {author}\` with **Post reply** / **Cancel** |
| Edit | \`Edit comment by {author}\` | only on \`currentUser\`'s comments; textarea \`Edit your comment\`, **Save** / **Cancel** |
| Delete | \`Delete comment by {author}\` | only on \`currentUser\`'s comments |
| Collapse toggle | \`{n} replies to {author}\` (\`1 reply\`; \`deleted comment\` for placeholders) | only when the comment has replies; \`aria-expanded\`, \`aria-controls\` |

- A deleted placeholder shows **[deleted]**, has no actions except the collapse toggle, and keeps its replies.
- **Focus:** opening Reply/Edit focuses the textarea; Cancel, **Escape** and a successful Post/Save return focus to the button that opened it. After Delete, focus moves to the placeholder, else the nearest surviving ancestor, else the heading. Announce "Reply posted." / "Comment deleted." etc. in a \`role="status"\` region.
- Post/Save buttons are disabled while the trimmed text is empty. Replying to a collapsed thread expands it.
- Comment text is user input: render it as text — never \`dangerouslySetInnerHTML\`.
- *(Optional)* Stop indenting after depth 4 and offer a "Continue thread" view for deeper replies.

\`App.tsx\`, \`types.ts\` and \`data.ts\` are read-only.`,
    technologies: ['React 18', 'TypeScript', 'Normalised state', 'HTML lists + ARIA'],
    learningObjectives: [
      'Render arbitrarily deep data recursively from a normalised store (byId + childIds)',
      'Write pure, structurally shared updates and prove them with identity assertions on frozen fixtures',
      'Model soft deletes (tombstones) and prune them without corrupting the tree',
      'Keep per-row UI state attached to the right comment through reordering (keys)',
      'Manage focus for inline forms and destructive actions, and name repeated controls for screen readers',
    ],
    clarifications: [
      {
        question: 'What happens when someone deletes a comment that already has replies?',
        why: 'Hard-deleting it would orphan or silently remove other people\'s replies; this is the core data-model decision.',
        defaultAssumption: 'Soft delete: keep a "[deleted]" placeholder so the subtree survives; a leaf is removed outright, and a placeholder that loses its last reply is pruned.',
      },
      {
        question: 'How deep can threads go, and how large can a discussion get?',
        why: 'Depth affects recursion and layout on narrow screens; size decides whether you need pagination, memoised rows or virtualisation.',
        defaultAssumption: 'Unbounded depth but typically < 10; a few hundred comments loaded at once. Indentation stops growing after depth 4.',
      },
      {
        question: 'Who can edit or delete, and does the client enforce it?',
        why: 'The UI should only offer allowed actions, but authorisation belongs on the server.',
        defaultAssumption: 'Only the current user\'s comments show Edit/Delete; the pure helpers don\'t check authorship (the server would).',
      },
      {
        question: 'What does sorting apply to — top-level comments or every level?',
        why: 'Sorting replies by votes breaks conversational order; sorting changes which rows move and therefore tests key stability.',
        defaultAssumption: 'Top-level only (Newest or Top); replies stay chronological.',
      },
      {
        question: 'Is the data owned by this component or by a parent / server?',
        why: 'Controlled vs uncontrolled decides the API and where optimistic updates and rollback would live.',
        defaultAssumption: 'Uncontrolled: `initialStore` seeds internal state and `onChange` reports each committed store. Server sync is a follow-up.',
      },
    ],
    scopeDecisions: [
      'No server: ids and timestamps come from injectable `generateId` / `now` props.',
      'No pagination, "load more replies" or real-time updates.',
      'Delete has no confirmation dialog (an undo toast is the production answer — see follow-ups).',
      'Markdown/links in comments are out of scope; text is rendered verbatim.',
      'The "Continue thread" view for very deep replies is optional.',
    ],
    requirements: [
      { id: 'recursive-render', category: 'functional', level: 'MUST', text: 'Replies at any depth render recursively as nested <ul>/<li>; the top-level list is labelled by the "Comments (n)" heading and each nested list is named "Replies to {author}".' },
      { id: 'reply', category: 'functional', level: 'MUST', text: 'Reply opens a labelled textarea; Post reply appends the trimmed reply as the parent\'s last child; Cancel and Escape close it without changes.' },
      { id: 'edit-own', category: 'functional', level: 'MUST', text: 'Only the current user\'s comments offer Edit and Delete; Save trims the text and shows "(edited)".' },
      { id: 'soft-delete', category: 'functional', level: 'MUST', text: 'Deleting a leaf removes it; deleting a comment with replies leaves a "[deleted]" placeholder (no actions) that keeps its subtree.' },
      { id: 'prune-tombstones', category: 'edge-case', level: 'SHOULD', text: 'When a placeholder loses its last reply it is removed as well, cascading up through placeholder ancestors.' },
      { id: 'collapse-count', category: 'functional', level: 'MUST', text: 'A toggle named "{n} replies to {author}" collapses/expands a thread (aria-expanded, aria-controls); n counts non-deleted replies at every depth. Replying to a collapsed thread expands it.' },
      { id: 'upvote', category: 'functional', level: 'MUST', text: 'Upvote toggles the current user\'s vote (aria-pressed) and updates the count.' },
      { id: 'sort', category: 'functional', level: 'MUST', text: 'Top-level comments sort by Newest or Top with deterministic tie-breaks; replies stay oldest-first.' },
      { id: 'pure-helpers', category: 'technical', level: 'MUST', text: 'All updates go through pure helpers over the normalised store: no mutation, untouched comments and rootIds keep their identity, and no-ops return the same store.' },
      { id: 'stable-keys', category: 'technical', level: 'MUST', text: 'Rows are keyed by comment id, so per-row UI state (open reply draft, collapsed) follows its comment when the order changes.' },
      { id: 'no-html-injection', category: 'edge-case', level: 'MUST', text: 'Comment text is rendered as text; HTML-looking input shows literally and never creates elements.' },
      { id: 'semantics-names', category: 'accessibility', level: 'MUST', text: 'Nested lists with one named <article> per comment; repeated controls have unique names ("Reply to Ada", "Upvote comment by Ada"); textareas have visible labels.' },
      { id: 'focus', category: 'accessibility', level: 'MUST', text: 'Opening Reply/Edit focuses the textarea; Cancel, Escape and successful Post/Save return focus to the opener; after Delete focus goes to the placeholder, the nearest surviving ancestor, or the heading — never <body>. Changes are announced in a status region.' },
      { id: 'indent-cap', category: 'accessibility', level: 'OPTIONAL', text: 'Indentation stops growing after depth 4 (deeper replies say who they reply to); optionally a "Continue thread" control opens the deep subtree on its own and moves focus to it.' },
      { id: 'render-cost', category: 'performance', level: 'SHOULD', text: 'Typing in any textarea re-renders only its form (draft state is local); sorting is memoised on (store, order). Explain what you would add for thousands of comments.' },
      { id: 'helper-tests', category: 'testing', level: 'SHOULD', text: 'Helpers are unit-tested on deep-frozen fixtures with identity (toBe) assertions; component tests query by role and accessible name and assert focus.' },
    ],
    constraints: [
      'React function components and hooks only; no state or tree libraries.',
      'Do not change App.tsx, types.ts or data.ts, the helper signatures, or the accessible names in the table.',
      'Never use dangerouslySetInnerHTML for comment content.',
    ],
    acceptanceCriteria: [
      'All public tests pass (helpers: addReply/deleteComment/countDescendants/toggleVote; UI: recursive lists, reply with focus, cancel, delete leaf vs. placeholder, collapse with count, upvote, sorting).',
      'All hidden tests pass (tombstone pruning, no-op identity, deep chains, edit rules, deterministic sort without mutation; literal HTML text, edit permissions and focus, Escape, state surviving reorder, reply into a collapsed thread, blank input, composer, placeholder actions and focus after delete).',
      'Manual: with a screen reader, list nesting levels are announced, every Reply button has a distinct name, and focus never falls to the top of the page after an action.',
    ],
    examples: [
      { title: 'Soft delete', input: 'deleteComment(store, "c2")  // c2 has one reply, c3', output: 'c2 → { deleted: true, text: "" }; c3 still under c2; UI shows "[deleted]"', explanation: 'The subtree survives because other people wrote it.' },
      { title: 'Pruning', input: 'then deleteComment(store, "c3")', output: 'c3 removed, and c2 (now an empty placeholder) removed from c1.childIds', explanation: 'A placeholder exists only to hold replies.' },
      { title: 'Counts', input: 'Ada → [Ben → [Eve], You]', output: 'Toggle on Ada: "3 replies to Ada"; on Ben: "1 reply to Ben"', explanation: 'Descendants at every depth, excluding deleted placeholders.' },
      { title: 'Sharing', input: 'addReply(store, "c2", reply)', output: 'new byId and new c2; c1, c3, c5 and rootIds are the same objects as before' },
    ],
    manualTests: [
      'Tab through the thread: every Reply/Upvote button announces whose comment it belongs to.',
      'Open Reply, type a draft, switch the sort order: the draft stays under the same comment.',
      'Delete your own reply with the keyboard: focus lands on the parent comment, and a status message is announced.',
      'Narrow the window to ~360px: deep threads stop indenting after level 4 and stay readable.',
      'Post a comment containing <b>bold</b> or <script>…</script>: it appears as literal text.',
    ],
  },
  files: {
    entry: '/App.tsx',
    starter: { ...shared, '/CommentThread.tsx': starterThread, '/commentStore.ts': starterStore },
    solution: { ...shared, '/CommentThread.tsx': solutionThread, '/commentStore.ts': solutionStore },
    readonly: ['/App.tsx', '/types.ts', '/data.ts'],
    support: {},
  },
  tests: [
    { path: '/tests/helpers.tsx', visibility: 'public', kind: 'runtime', source: helpers },
    { path: '/tests/commentStore.test.ts', visibility: 'public', kind: 'runtime', source: storeTests },
    { path: '/tests/public.test.tsx', visibility: 'public', kind: 'runtime', source: publicTests },
    { path: '/tests/commentStore.hidden.test.ts', visibility: 'hidden', kind: 'runtime', source: storeHiddenTests },
    { path: '/tests/hidden.test.tsx', visibility: 'hidden', kind: 'runtime', source: hiddenTests },
  ],
  hints: [
    'Start with commentStore.ts. Every helper has the same shape: look the comment up, return `store` for no-ops, otherwise copy `byId` (`{ ...store.byId }`) and replace only the comments that change with spread copies. Pass `rootIds` through untouched unless a top-level comment is added or removed.',
    '`deleteComment` has two cases. With replies: replace the comment with `{ ...comment, deleted: true, text: "" }`. Leaf: delete it from your copied `byId`, filter it out of the parent\'s `childIds` (or `rootIds`), then loop: if that parent is a placeholder with no replies left, remove it too and continue with its parent.',
    'Render recursively: `CommentThread` maps sorted root ids to `<CommentItem id depth />`; each item reads its comment from the store and maps `childIds` to more `CommentItem`s inside a nested `<ul>`. Key every row by comment id. Keep `collapsed` / `replying` / `editing` as local state in `CommentItem` — correct keys make that state follow the comment when sorting.',
    'Focus: give the inline form a ref and focus it in a mount effect; keep a ref to the Reply button and call `.focus()` on it when the form closes. For Delete, the button disappears, so record a target id (placeholder → surviving ancestor → heading) and focus it in an effect after the store update renders.',
  ],
  solution: {
    initialApproach:
      'Separate domain state from UI state. The comment data lives in one normalised store updated only by pure helpers; per-row UI state (collapsed, replying, editing, drafts) lives in the row components, keyed by comment id. Rendering is a recursive component that turns `childIds` back into nested lists.',
    bruteForce:
      'A nested tree (`{ ...comment, replies: Comment[] }`) updated with recursive search-and-copy, or worse, with `structuredClone` + mutation, works for a demo but every edit is an O(n) search, a deep clone destroys identity (every row re-renders, React.memo is useless), and "delete" usually becomes `filter` at the right level — which silently drops the whole subtree of other people\'s replies. Index keys then make open reply boxes jump to the wrong comment after sorting.',
    optimizedApproach: `**Normalised store + pure helpers + recursive rows keyed by id.**

- \`byId\` gives O(1) access to any comment for edit/vote/delete; \`childIds\`/\`rootIds\` keep order. Updates copy only \`byId\` (shallow) and the touched comments, so unchanged comments keep their identity and no-ops return the same store (\`next === store\` means "nothing to commit").
- **Soft delete** keeps placeholders only while they have replies; pruning walks *up* from a removed leaf, so the invariant "every placeholder has at least one reply" always holds — which also means a placeholder's subtree always contains a live comment.
- \`countDescendants\` is an iterative DFS (no recursion-depth limit) that skips placeholders.
- The thread component keeps the latest store in a ref as well as state, so two events in the same tick compose instead of the second overwriting the first with a stale closure; \`onChange\` is called from the event handler, not from a state updater (updaters must be pure and may run twice in StrictMode).
- Collapsed subtrees use the \`hidden\` attribute instead of unmounting, so drafts inside them survive collapsing.`,
    walkthrough: `1. **Types**: \`CommentStore = { byId, rootIds }\`; every comment knows \`parentId\` and ordered \`childIds\`.
2. **addReply**: trim; reject empty text, duplicate ids (own-property check, so ids like "constructor" are safe), unknown or deleted parents. Top-level → \`rootIds: [...rootIds, id]\`; reply → copy the parent with \`childIds: [...childIds, id]\`.
3. **editComment / toggleVote**: replace one comment with a spread copy; return \`store\` when nothing changes.
4. **deleteComment**: soft-delete when \`childIds.length > 0\`; otherwise remove the leaf and loop upward pruning empty placeholders, finally filtering \`rootIds\` if a top-level comment went away.
5. **sortRootIds**: \`[...rootIds].sort(...)\` — never sort the store's array in place (it is shared, and frozen in tests).
6. **CommentThread**: \`useState(initialStore)\` + \`storeRef\`; \`commit(next, message)\` ignores no-ops, updates ref/state, sets the status message and calls \`onChange\`. \`ordered = useMemo(() => sortRootIds(store, sort))\`.
7. **CommentItem** (recursive): \`<li>\` → \`<article aria-label="Comment by …" tabIndex={-1}>\` with meta, text (as a text child), actions and the toggle, then \`<ul hidden={collapsed} aria-label="Replies to …">\` of child items.
8. **Forms**: one \`TextForm\` for reply and edit — local draft, focus on mount, Escape cancels, submit disabled while blank. The top-level \`Composer\` owns its draft so typing doesn't re-render the thread.
9. **Delete focus**: compute the target before committing (placeholder → nearest ancestor still in the next store → heading) and focus it in an effect keyed on \`store\`.`,
    complexity:
      '- addReply/edit/vote/soft delete: O(n) for the shallow copy of `byId` (O(1) with a persistent map), O(1) lookups.\n- Hard delete with pruning: O(depth · siblings).\n- countDescendants: O(subtree). The UI calls it once per row with replies, so a full render is O(n · depth) — fine for hundreds of comments; a single post-order pass memoised per store makes it O(n).\n- Sorting: O(r log r) for r top-level comments, memoised.\n- Rendering: every committed change re-renders the visible tree (O(n)); see trade-offs for making it O(changed rows).',
    edgeCases:
      '- Deleting a comment with replies, then its last reply → both disappear (cascade, including a top-level placeholder).\n- Deleting/editing/voting an already-deleted or unknown id → no-op, same store.\n- Whitespace-only text → nothing posted (button disabled and helper no-op — defence in depth).\n- Two replies posted in the same tick → the store ref prevents a lost update.\n- Replying inside a collapsed thread → expand so the user sees the result.\n- HTML/script-looking text → shown literally.\n- Ids that collide with Object.prototype keys ("constructor") → own-property lookups.\n- Very deep threads → iterative counting; capped indentation.\n- Focus target removed by the action → explicit fallback chain instead of losing focus to <body>.',
    alternatives:
      '- **Nested tree state** with recursive copy-on-path updates (like the file-explorer problem): simpler rendering, O(depth) copies, but O(n) searches and awkward moves.\n- **useReducer** with actions (`reply`, `edit`, `delete`, `vote`) wrapping the same helpers — nice for logging/undo; `onChange` would then be fired from an effect or the dispatching handler.\n- **Immer** for ergonomic immutable updates (still structural sharing).\n- **Collapse state lifted** into a `Set<string>` in the thread — enables "collapse all" and persistence; local state is simpler when not needed.\n- **role="tree" / role="treegrid"**: rejected — tree items must not contain interactive widgets (buttons, textareas) and the pattern requires a single tab stop with arrow-key navigation, which is wrong for a document-like discussion. The APG **feed** pattern (`role="feed"` of articles) suits infinite top-level streams; nested lists remain best for reply structure.',
    tradeoffs:
      '- Normalised store: O(1) targeted updates and easy server merges, but rendering must reassemble the tree and memoisation is harder: an ancestor row does not change when a descendant does, so `React.memo` on rows would *block* updates unless each row subscribes to its own comment (selector-based store, e.g. `useSyncExternalStore`). Without that, re-render the tree (fine at hundreds of comments).\n- `hidden` vs unmounting collapsed subtrees: keeps drafts and DOM state but keeps nodes in memory; unmount + lifted state is lighter for huge threads.\n- Local row UI state is simple, but disappears if a row unmounts (e.g. a parent is pruned) — acceptable here.\n- Focusing the Reply button after posting is predictable; focusing the new comment is an alternative that confirms what was posted. Either is defensible if consistent and announced.\n- Soft delete keeps author/vote metadata in the client store; a real API should strip personal data server-side.',
    commonMistakes:
      '- `filter`-ing a deleted comment out of the tree and losing its replies.\n- Mutating `parent.childIds.push(...)` or `rootIds.sort()` on state — React may not re-render, and other references silently change.\n- Counting only direct children for "n replies".\n- Index keys, so an open reply box or collapsed state jumps to another comment after sorting.\n- `dangerouslySetInnerHTML` for comment text (XSS).\n- Ten identical "Reply" buttons with no context for screen-reader users.\n- Focus lost to <body> after Cancel or Delete.\n- Calling `onChange` inside a `setState` updater (impure; runs twice in StrictMode).\n- Keeping the top-level draft in the thread component so each keystroke re-renders every comment.',
    testingStrategy:
      '- Helpers: deep-freeze the fixture so any mutation throws; assert results with `toEqual` and sharing with `toBe` (untouched comments, rootIds, no-op returns the same store); cover pruning cascades and deep chains.\n- Component: query by role + accessible name ("Reply to Ben", "3 replies to Ada", articles named "Comment by …", lists named "Replies to …"); assert focus with `toHaveFocus` after open/cancel/escape/post/delete; assert `onChange` payloads.\n- Key stability: open a draft, change the sort, and check the draft is still inside the same article.\n- Security: render HTML-looking text and assert no element was created.\n- Pass the initial store deep-frozen to the component too, so a component that mutates props fails loudly.',
    seniorFollowUps:
      '- Server sync: optimistic add/edit/delete with temporary ids, rollback on failure, reconciliation when the server returns the real id.\n- "Load more replies" / pagination per thread: partial `childIds`, cursors, and counts that come from the server.\n- 10 000 comments: selector-based row subscriptions or virtualising a flattened visible list; what happens to focus and find-in-page.\n- Real-time updates (another user replies while you type): where does the new comment go, and how do you avoid moving content under the reader?\n- Undo for delete (toast with a timeout) instead of a confirm dialog.\n- Rich text/markdown safely: sanitising on the server vs client, and why escaping is not the same as sanitising.',
  },
  followUps: [
    { id: 'f1', level: 'definition', question: 'What is a normalised store, and why does it suit a comment thread?', expectedConcepts: ['entities stored once by id', 'relationships as id lists', 'O(1) lookups for edit/vote/delete', 'tree rebuilt at render time'], sourceIds: ['react-updating-objects'] },
    { id: 'f2', level: 'mechanism', question: 'A user opens a reply box under one comment and then changes the sort order. With index keys the box jumps to another comment. Explain exactly why, and the fix.', expectedConcepts: ['React matches children by key within a parent', 'state belongs to the position when keys are indexes', 'stable ids as keys', 'state follows the component identity'], sourceIds: ['react-rendering-lists', 'react-preserving-state'] },
    { id: 'f3', level: 'application', question: 'Add "Continue this thread" for replies deeper than level 4. How do you render it, and what happens to focus and the browser Back button?', expectedConcepts: ['render a subtree rooted at another id', 'move focus to the new heading/root', 'link to a URL or route for deep links', 'way back to the full thread'], sourceIds: ['react-preserving-state'] },
    { id: 'f4', level: 'edge-cases', question: 'Why do soft-deleted placeholders need pruning, and what invariant does pruning maintain?', expectedConcepts: ['placeholders only exist to hold replies', 'cascade upwards when the last reply goes', 'every placeholder has a live descendant', 'counts and "[deleted]" noise stay correct'], sourceIds: [] },
    { id: 'f5', level: 'production', question: 'Posting is now an API call. Design optimistic posting, editing and deleting, including failure and rollback.', expectedConcepts: ['temporary client ids replaced by server ids', 'pending state per comment', 'rollback with the previous store snapshot', 'idempotency and retries', 'useOptimistic or a reducer-based queue'], sourceIds: ['react-useoptimistic'] },
    { id: 'f6', level: 'architecture', question: 'The thread has 10 000 comments and every vote re-renders everything. How would you restructure state and rendering?', expectedConcepts: ['per-row subscriptions with selectors', 'useSyncExternalStore', 'memoised rows only work when props change identity', 'virtualise a flattened visible list', 'precomputed descendant counts'], sourceIds: ['react-usesyncexternalstore', 'react-memo', 'webdev-virtualize'] },
  ],
  mcqs: [
    {
      id: 'm1',
      question: 'Rows are wrapped in React.memo and receive their own Comment object. A reply is added to c3, which is nested under c1 → c2 → c3. What happens with the normalised store in this problem?',
      options: [
        { id: 'a', text: 'Only the c3 row re-renders, because only c3 changed', explanation: 'c3\'s row is rendered by c2\'s row. If c2 and c1 are skipped by memo (their objects are unchanged), React never reaches c3\'s row unless it subscribes to the store itself.' },
        { id: 'b', text: 'The new reply may not appear: memo skips c1 and c2 because their Comment objects did not change, so c3\'s row is never re-rendered', explanation: 'Correct — in a normalised store an ancestor object does not change when a descendant does. Memoised rows need per-row subscriptions (selectors) or must receive something that changes.' },
        { id: 'c', text: 'Every row re-renders because byId is a new object', explanation: 'Rows receive their own Comment, not byId, so memo compares unchanged objects and skips them.' },
        { id: 'd', text: 'React throws because the store is frozen', explanation: 'Freezing has nothing to do with rendering; the helpers never mutate it.' },
      ],
      correctOptionId: 'b',
      explanation: 'Structural sharing in a nested tree changes every ancestor on the path, so memo works top-down. In a normalised store only the touched entity changes; memoising rows therefore requires each row to read its own data from the store (e.g. useSyncExternalStore with a selector).',
      sourceIds: ['react-memo', 'react-updating-objects', 'react-usesyncexternalstore'],
    },
    {
      id: 'm2',
      question: 'Which markup best exposes a threaded discussion where every comment has Reply, Edit and Upvote buttons?',
      options: [
        { id: 'a', text: 'role="tree" with each comment as a treeitem', explanation: 'Tree items should not contain interactive widgets, and the pattern requires one tab stop plus arrow-key navigation — wrong for a page of independent controls.' },
        { id: 'b', text: 'Nested <ul>/<li> with an <article> per comment and buttons whose names include the author', explanation: 'Correct — screen readers announce list nesting levels, articles can be navigated, and contextual names distinguish the repeated buttons.' },
        { id: 'c', text: 'A flat list of <div>s indented with margin-left', explanation: 'Indentation is visual only; the reply structure is lost for assistive technology.' },
        { id: 'd', text: 'role="grid" so arrow keys move between comments', explanation: 'A grid implies tabular, cell-based navigation and a single tab stop; it adds complexity and does not match a discussion.' },
      ],
      correctOptionId: 'b',
      explanation: 'Use native list semantics for hierarchy and contextual accessible names for repeated actions. The tree pattern is for selectable hierarchies (file explorers), and the feed pattern suits an infinitely scrolling list of top-level articles.',
      sourceIds: ['apg-treeview', 'apg-feed', 'react-rendering-lists'],
    },
    {
      id: 'm3',
      question: 'deleteComment(store, "c2") is called and c2 has replies. Which result follows the rules of this problem?',
      code: '// before: c1.childIds = ["c2", "c4"], c2.childIds = ["c3"]',
      options: [
        { id: 'a', text: 'c2 and c3 are removed; c1.childIds = ["c4"]', explanation: 'That deletes another user\'s reply (c3) along with c2.' },
        { id: 'b', text: 'c2 becomes { ...c2, deleted: true, text: "" }; c3 stays; c1 is the same object as before', explanation: 'Correct — a soft delete only replaces c2; c1\'s childIds did not change, so c1 keeps its identity.' },
        { id: 'c', text: 'c2 is removed from byId and c3 is re-parented to c1', explanation: 'Re-parenting changes the meaning of c3 (it was a reply to c2) and breaks conversation context.' },
        { id: 'd', text: 'c2.deleted is set to true on the existing object', explanation: 'That mutates state: React may not re-render, and the frozen test fixture throws.' },
      ],
      correctOptionId: 'b',
      explanation: 'Soft delete preserves the subtree with a placeholder; only the changed comment is copied. The placeholder is pruned later if its last reply is deleted.',
      sourceIds: ['react-updating-objects'],
    },
  ],
};

export default problem;
