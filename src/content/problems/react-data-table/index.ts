import type { CodingProblem } from '../../schema';
import starterTable from './starter/DataTable.tsx?raw';
import app from './starter/App.tsx?raw';
import types from './starter/types.ts?raw';
import data from './starter/data.ts?raw';
import styles from './starter/styles.css?raw';
import solutionTable from './solution/DataTable.tsx?raw';
import helpers from './tests/helpers.ts?raw';
import publicTests from './tests/public.test.tsx?raw';
import hiddenTests from './tests/hidden.test.tsx?raw';

const shared = { '/App.tsx': app, '/types.ts': types, '/data.ts': data, '/styles.css': styles };

const problem: CodingProblem = {
  schemaVersion: 1,
  kind: 'coding',
  id: 'react-data-table',
  slug: 'data-table',
  title: 'Data Table (sort, filter, paginate)',
  track: 'react',
  execution: 'react',
  difficulty: 'medium',
  priority: 'P0',
  seniority: ['Senior', 'SDE-2', 'SDE-3', 'MTS'],
  topics: ['derived state', 'stable sorting', 'Intl.Collator', 'pagination', 'generic components', 'sortable table a11y'],
  estimatedMinutes: 60,
  conceptIds: ['derived-state', 'generics', 'immutable-updates', 'react-effects', 'react-state-batching', 'react-reconciliation-keys', 'referential-equality'],
  research: {
    provenance: 'PUBLISHED_PRACTICE_PROBLEM',
    frequencyConfidence: 'HIGH_CONFIDENCE',
    verificationStatus: 'SOURCES_VERIFIED',
    lastVerified: '2026-11-23',
    evidence: [
      { sourceId: 'fih-ui', url: 'https://www.frontendinterviewhandbook.com/coding/build-front-end-user-interfaces', originalTitle: 'Data Table (with extensions for sorting and filtering)', note: 'Listed under "Apps" in the handbook\'s "Where to practice" list.' },
      { sourceId: 'fih-sd-ui', url: 'https://www.frontendinterviewhandbook.com/front-end-system-design/ui-components', originalTitle: 'Data table', note: 'Listed as a UI component system-design example.' },
      { sourceId: 'alla-components', url: 'https://allahabadi.dev/frontend-system-design/components/', originalTitle: 'Design a Data Table', note: 'Question 05 in the component design list (framed as system design).' },
    ],
    researchNotes:
      'Three independent sources list a data table; one as a UI coding exercise whose extensions are explicitly sorting and filtering, two as component system design. This problem is the 60-minute machine-coding subset: a generic, column-driven table with tri-state sorting (APG sortable-table semantics), a text filter and client-side pagination, with the emphasis on deriving the view during render. Server-side data, virtualisation, column resizing, row selection and multi-column sort are follow-ups.',
  },
  spec: {
    summary: 'Build a generic, column-driven React data table with accessible tri-state sorting, a text filter and pagination — all derived during render.',
    description: `Implement \`<DataTable<T> />\` in **DataTable.tsx**. The props and column type are in \`types.ts\` (read-only):

\`\`\`ts
interface Column<T> { key: keyof T & string; header: string; sortable?: boolean; render?: (row: T) => ReactNode; compare?: (a: T, b: T) => number }
interface DataTableProps<T> { caption: string; rows: readonly T[]; columns: readonly Column<T>[]; getRowId: (row: T) => string | number; filterKeys?: ...; pageSizeOptions?: readonly number[] }
\`\`\`

The table must:

1. Render a \`<table>\` whose \`<caption>\` is \`caption\`, one \`<th scope="col">\` per column in a \`<thead>\`, and the current page of rows in a \`<tbody>\`. Cells show \`render(row)\` when given, otherwise \`String(row[key])\` (empty for null/undefined).
2. **Sort.** A \`sortable\` column's header contains a real \`<button type="button">\` whose accessible name is exactly the header text (decorative arrows are \`aria-hidden\`). Clicks cycle **ascending → descending → none**; clicking another column starts at ascending. The sorted \`<th>\` has \`aria-sort="ascending" | "descending"\`; other headers have no \`aria-sort\` (or \`"none"\`).
   - Default ordering: numbers numerically, strings case-insensitively and locale-aware (\`Intl.Collator\`), and **empty values (null / undefined / "") last in both directions**.
   - A column's \`compare\` defines its ascending order; descending is the same comparator **negated**.
   - Sorting is **stable** (ties keep their original order in both directions) and **never mutates** \`rows\`.
3. **Filter.** A search input labelled **"Filter"** keeps rows where any \`filterKeys\` field (default: every column key) contains the trimmed query, case-insensitively. Filtering uses **raw values**, never rendered output; null/undefined never match.
4. **Paginate.** A **"Rows per page"** \`<select>\` (options \`pageSizeOptions\`, default \`[5, 10, 20]\`, first is initial), **"Previous page" / "Next page"** buttons disabled at the ends, and the text **"Page X of Y"** (Y ≥ 1). Changing the filter, the sort or the page size returns to page 1. If \`rows\` shrinks, the page is clamped to the last page.
5. **Empty states.** No rows at all → one full-width cell reading **"No data"**; rows exist but none match → **"No matching rows"**.
6. **Derive, don't sync.** Only user input (sort, query, page size, page) lives in state. Filtered, sorted and paged rows are computed during render — no \`useEffect\` that copies them into state.

\`App.tsx\`, \`data.ts\` and \`types.ts\` are read-only; the preview shows a team directory with formatted salaries and a custom "Level" comparator.`,
    technologies: ['React 18', 'TypeScript generics', 'Intl.Collator', 'WAI-ARIA sortable table'],
    learningObjectives: [
      'Separate user input state from derived view data and compute the latter during render',
      'Write a stable, non-mutating, direction-aware sort with sensible handling of numbers, strings and empty values',
      'Design a type-safe generic component API driven by column definitions',
      'Expose sort state accessibly with buttons inside headers and aria-sort',
      'Handle pagination edge cases: resets, clamping and empty results',
    ],
    clarifications: [
      { question: 'Is the data client-side, or does the server sort, filter and paginate?', why: 'Server-side tables move sort/filter/page into a request (and bring race conditions and loading states); client-side tables derive everything locally.', defaultAssumption: 'All rows are in memory (hundreds to a few thousand). Server-driven mode is a follow-up.' },
      { question: 'Single- or multi-column sort? What does a third click do?', why: 'Multi-sort changes the state shape (an ordered list of keys) and the header UX.', defaultAssumption: 'Single column; clicks cycle ascending → descending → none (back to the original order).' },
      { question: 'Which columns does the filter search, and does it match the displayed or the raw value?', why: 'Formatted values ("$112,000", "—") and raw values ("112000", null) give different results.', defaultAssumption: 'A configurable list of keys (default: all columns), matching raw values with a trimmed, case-insensitive substring test.' },
      { question: 'How should empty values sort?', why: 'Missing data scattered in the middle (or flipping to the top on descending) is a common complaint.', defaultAssumption: 'Empty values always go last, in both directions, for default comparisons. Custom comparators own their full ordering.' },
      { question: 'What happens to the current page when the data, filter or page size changes?', why: 'Staying on page 4 of a 1-page result shows an empty table with no way back.', defaultAssumption: 'Filter, sort and page-size changes return to page 1; if the rows prop shrinks, the page is clamped during render.' },
    ],
    scopeDecisions: [
      'Client-side data only; no fetching, debouncing or server pagination in the core task.',
      'Single-column, tri-state sorting.',
      'No row selection, column resizing, sticky headers or virtualisation (follow-ups).',
      'The filter is a plain substring match — no fuzzy search or per-column filters.',
    ],
    requirements: [
      { id: 'semantic-table', category: 'functional', level: 'MUST', text: 'Render a native <table> with <caption>, <thead> with <th scope="col"> headers, and <tbody> rows keyed by getRowId.' },
      { id: 'tri-state-sort', category: 'functional', level: 'MUST', text: 'Clicking a sortable header cycles ascending → descending → none; a different column starts at ascending.' },
      { id: 'filter', category: 'functional', level: 'MUST', text: 'A "Filter" search box keeps rows whose filterKeys raw values contain the trimmed query, case-insensitively.' },
      { id: 'pagination', category: 'functional', level: 'MUST', text: '"Rows per page" select, "Previous page"/"Next page" buttons disabled at the ends, and "Page X of Y" text.' },
      { id: 'page-reset', category: 'functional', level: 'MUST', text: 'Changing the filter or page size returns to page 1.', acceptance: 'Sorting also returns to page 1 (SHOULD-level behaviour covered by a hidden test).' },
      { id: 'derived-state', category: 'technical', level: 'MUST', text: 'Filtered/sorted/paged rows are derived during render; no effect copies them into state.' },
      { id: 'stable-sort', category: 'technical', level: 'MUST', text: 'Sorting is stable in both directions (descending negates the comparator rather than reversing) and does not mutate the rows prop.' },
      { id: 'comparators', category: 'technical', level: 'MUST', text: 'Numbers compare numerically, strings with Intl.Collator (case-insensitive, numeric), and column.compare overrides the default.' },
      { id: 'generic-api', category: 'technical', level: 'SHOULD', text: 'DataTable is generic over the row type, so column keys and render/compare callbacks are type-checked against T.' },
      { id: 'empty-last', category: 'edge-case', level: 'SHOULD', text: 'Empty values (null/undefined/"") sort last in both directions and never match the filter.' },
      { id: 'clamp-page', category: 'edge-case', level: 'MUST', text: 'If rows shrink so the current page no longer exists, the last available page is shown (clamped during render).' },
      { id: 'empty-states', category: 'edge-case', level: 'MUST', text: '"No data" when rows is empty, "No matching rows" when the filter removes everything; "Page 1 of 1" with both buttons disabled.' },
      { id: 'sort-button', category: 'accessibility', level: 'MUST', text: 'Sortable headers contain a <button type="button"> named exactly by the header text; arrow glyphs are aria-hidden.' },
      { id: 'aria-sort', category: 'accessibility', level: 'MUST', text: 'Only the sorted <th> carries aria-sort="ascending" or "descending".' },
      { id: 'labelled-controls', category: 'accessibility', level: 'SHOULD', text: 'The filter and page-size controls have visible <label>s; the page status is in a polite live region.' },
      { id: 'memo', category: 'performance', level: 'OPTIONAL', text: 'Memoise filtering and sorting with useMemo so typing in an unrelated parent does not re-sort; correctness must not depend on it.' },
      { id: 'tests', category: 'testing', level: 'SHOULD', text: 'Tests cover tie stability in both directions, null placement, clamping and a render spy that proves no stale rows are rendered.' },
    ],
    constraints: ['React function components and hooks only.', 'No third-party table libraries.', 'Do not change types.ts, data.ts or App.tsx.', 'Do not mutate the rows or columns props.'],
    acceptanceCriteria: [
      'All public tests pass (caption/headers/first page, tri-state sort with aria-sort, numeric sort, filter + reset, pagination bounds and page size, empty state).',
      'All hidden tests pass (stable ties in both directions, custom compare negation, null placement, raw-value filterKeys, sort resets the page, clamping and "No data", no stale rows rendered after filtering).',
      'Manual: with a screen reader, header buttons announce their name and the column\'s sort state.',
    ],
    examples: [
      { title: 'Stable descending sort', input: 'tickets = [45 (Bilal), 45 (Ines), 45 (Diego)] in that order; sort Tickets twice', output: 'Descending order keeps Bilal, Ines, Diego for the tie', explanation: 'Negating the comparator keeps ties stable. Sorting ascending and then calling reverse() would give Diego, Ines, Bilal.' },
      { title: 'Filter + pagination', input: 'On page 2 of 3, type "ENGINEERING"', output: '4 matching rows, "Page 1 of 1"', explanation: 'The query handler also sets page to 1 in the same event (one batched render).' },
      { title: 'Clamping', input: 'On page 3 of 3, the parent passes 4 rows', output: '"Page 1 of 1" with all 4 rows', explanation: 'currentPage = min(page, pageCount) is computed during render — no effect needed.' },
    ],
    manualTests: [
      'Sort by Salary: $98,000 should come after $91,000 and before $112,000 (numeric, not string order).',
      'Sort by Level: Junior → Mid → Senior → Staff thanks to the column comparator.',
      'Sort by Salary ascending, then descending: the three $112,000 rows (Bruno, Hiro, Luca) keep that relative order both times.',
      'Go to the last page, then type "a" — you are back on page 1.',
      'Tab to a header button and press Enter/Space; a screen reader should announce e.g. "Name, button, sorted ascending".',
    ],
  },
  files: {
    entry: '/App.tsx',
    starter: { ...shared, '/DataTable.tsx': starterTable },
    solution: { ...shared, '/DataTable.tsx': solutionTable },
    readonly: ['/App.tsx', '/types.ts', '/data.ts'],
    support: {},
  },
  tests: [
    { path: '/tests/helpers.ts', visibility: 'public', kind: 'runtime', source: helpers },
    { path: '/tests/public.test.tsx', visibility: 'public', kind: 'runtime', source: publicTests },
    { path: '/tests/hidden.test.tsx', visibility: 'hidden', kind: 'runtime', source: hiddenTests },
  ],
  hints: [
    'List the state first. Only four things are user input: the sort ({ key, direction } or null), the query, the page size and the page. Everything else — filtered rows, sorted rows, page count, visible slice — is a pure function of props + that state, so compute it in the component body.',
    'Pipeline order: filter → sort → paginate. Filter with `rows.filter(...)` against `String(value).toLowerCase().includes(query.trim().toLowerCase())`, skipping null/undefined. Then `pageCount = Math.max(1, Math.ceil(n / pageSize))`, `currentPage = Math.min(page, pageCount)` and `slice((currentPage - 1) * pageSize, currentPage * pageSize)`.',
    'Sorting: copy before sorting (`[...rows].sort(cmp)`), because sort() mutates. For descending, multiply the comparator by −1 instead of reversing — Array.prototype.sort is stable, but reverse() flips ties. Put empty values last before applying the sign. Use one module-level `new Intl.Collator(undefined, { numeric: true, sensitivity: "base" })` for strings.',
    'Reset the page in the event handlers that change the query, sort or page size (`setQuery(v); setPage(1)` — React batches them into one render). Render `<th aria-sort={...}>` only for the sorted column, and put a `<button type="button">{header}<span aria-hidden="true">▲</span></button>` inside sortable headers.',
  ],
  solution: {
    initialApproach:
      'Keep the minimum state — sort, query, pageSize, page — and derive the visible rows with a pure filter → sort → paginate pipeline in the render body. All resets happen in the event handlers that cause them; anything that depends on props (like the page being out of range) is resolved by clamping during render.',
    bruteForce:
      'A common first attempt stores `filteredRows`, `sortedRows` and `pageRows` in state and keeps them in sync with a chain of `useEffect`s (`useEffect(() => setFiltered(rows.filter(...)), [rows, query])`, and so on). It renders stale data for one frame on every change (the effect runs after paint and triggers a second render), duplicates the source of truth, and invites bugs such as a page that is out of range because two effects ran in an unexpected order. Sorting with `rows.sort()` in place or with `reverse()` for descending are the other two classic bugs.',
    optimizedApproach: `**State = user intent; everything else is derived.**

\`\`\`ts
const [sort, setSort] = useState<{ key; direction } | null>(null);
const [query, setQuery] = useState('');
const [pageSize, setPageSize] = useState(pageSizeOptions[0]);
const [page, setPage] = useState(1);

const filtered = useMemo(() => filter(rows, keys, needle), [rows, columns, filterKeys, needle]);
const sorted   = useMemo(() => sort ? sortRows(filtered, column, sort.direction) : filtered, [filtered, columns, sort]);
const pageCount   = Math.max(1, Math.ceil(sorted.length / pageSize));
const currentPage = Math.min(page, pageCount);            // clamp, don't "fix" in an effect
const visible     = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);
\`\`\`

- **Sorting** copies the array, then sorts with \`sign * compare(a, b)\`. Because \`Array.prototype.sort\` is stable (guaranteed since ES2019), ties keep their input order in both directions. Empty values are compared *before* the sign is applied, so they stay last whichever way you sort. Strings use a single shared \`Intl.Collator\` with \`numeric: true\` and \`sensitivity: 'base'\`.
- **Filtering** checks raw values of \`filterKeys\` (default: column keys), never the rendered cell, so "$112,000" formatting or "—" placeholders don't leak into matching, and \`null\` never matches the text "null".
- **Resets** live in event handlers: \`setQuery(v); setPage(1)\`. React batches both updates into one render.
- **Accessibility** follows the APG sortable-table example: a real \`<button>\` inside each sortable \`<th>\` (keyboard and screen-reader operable for free), \`aria-sort\` only on the sorted column, decorative arrows \`aria-hidden\`, labelled filter and page-size controls, and a polite live region for "Page X of Y".
- \`useMemo\` is purely a cache: deleting it changes performance, not behaviour.`,
    walkthrough: `1. **Types**: \`Column<T>\` uses \`key: keyof T & string\`, so \`render\`/\`compare\` receive a typed \`T\` and a typo in a key is a compile error. The component is declared \`function DataTable<T>(props: DataTableProps<T>)\`; TypeScript infers \`T\` from \`rows\`.
2. **Ids**: \`useId()\` gives unique ids for the filter and select labels, so two tables can live on one page.
3. **Filter**: \`needle = query.trim().toLowerCase()\`; with an empty needle return \`rows\` itself (no copy). Otherwise keep rows where some key's value is non-empty and \`String(value).toLowerCase().includes(needle)\`.
4. **Sort**: find the column for \`sort.key\` (if it disappeared from \`columns\`, fall back to unsorted). Comparator: if the column has \`compare\`, return \`sign * compare(a, b)\`; otherwise push empties last, then \`sign * compareValues(a[key], b[key])\` where numbers subtract, dates compare by time and everything else goes through the collator.
5. **Paginate**: compute \`pageCount\` (at least 1, so the empty state reads "Page 1 of 1"), clamp \`currentPage\`, slice. Prev/Next call \`setPage(currentPage ± 1)\` — based on the *clamped* page, otherwise "Previous" from a stale page 7 would go to 6 of 1.
6. **Headers**: \`aria-sort\` is \`undefined\` (attribute omitted) unless the column is sorted. The button's text is the header; the arrow span is \`aria-hidden\`.
7. **Body**: \`visible.length === 0\` renders one \`<td colSpan={columns.length}>\` with "No data" or "No matching rows"; otherwise rows keyed by \`getRowId(row)\` — never by index, which would remount/mismatch rows when sorting.
8. **Footer**: labelled select (resets the page), disabled Prev/Next at the ends, and the live "Page X of Y" text.`,
    complexity:
      'Filtering is O(n·k) for n rows and k filter keys. Sorting is O(m log m) for m filtered rows, plus an O(m) copy. Pagination is O(pageSize). With useMemo, changing only the page re-slices without re-filtering or re-sorting; typing re-filters and re-sorts (O(n·k + m log m)). Memory is O(m) for the sorted copy. For tens of thousands of rows, debounce or defer the query (useDeferredValue) and virtualise the body.',
    edgeCases:
      '- Ties: stable in both directions because the comparator is negated, not the result reversed.\n- Empty values: always last for default comparisons; a custom `compare` owns its full ordering (document this).\n- Mixed types in one column (numbers and strings): fall back to collator comparison of String(value); clarify with the interviewer.\n- `rows` shrinks while on a later page: clamped during render; Prev/Next work from the clamped page.\n- Page size larger than the data: "Page 1 of 1", both buttons disabled.\n- Sorted column removed from `columns`: treated as unsorted instead of crashing.\n- Query of only whitespace: treated as empty.\n- `null` values never match the filter text "null"; rendered placeholders ("—") are never searched.\n- Duplicate `getRowId` values would break reconciliation — ids must be unique.',
    alternatives:
      '- **Headless table libraries** (e.g. TanStack Table) model columns, sorting, filtering and pagination as composable row models; worth it for multi-sort, grouping, column pinning and server mode.\n- **useReducer** for the four pieces of state, with actions like `sortBy(key)` that also reset the page — the reset logic lives in one place.\n- **Server-side mode**: sort/filter/page become query parameters; the table becomes controlled (`state` + `onStateChange`) and fetches with AbortController + debouncing (see the Autocomplete problem).\n- **Schwartzian transform** (decorate–sort–undecorate) for expensive keys: compute sort keys once per row instead of on every comparison.\n- **`aria-sort` on a native button vs. a clickable `<th>`**: the APG example uses a button inside the header; making the `<th>` itself clickable needs tabindex and key handling and is easier to get wrong.',
    tradeoffs:
      '- Deriving everything on each render is simplest and always consistent; memoising adds dependency bookkeeping (inline `columns` arrays from the parent invalidate the cache every render).\n- Resetting to page 1 on sort is friendlier for "show me the top" but loses the user\'s place; some products keep the page — decide explicitly.\n- Empties-last is a product choice; spreadsheets often put blanks last in both directions, databases differ (NULLS FIRST/LAST).\n- Case-insensitive collation means "chloe" and "Chloe" tie (then stay stable); a case-sensitive tiebreaker would make the order deterministic across data sources.\n- Client-side pagination keeps all rows in memory and the DOM small; virtualisation keeps the DOM small without paging but complicates accessibility (row counts via aria-rowcount/aria-rowindex).',
    commonMistakes:
      '- Syncing `filteredRows` into state with `useEffect` (stale frame, double render, multiple sources of truth).\n- `rows.sort(...)` mutating the parent\'s array.\n- Implementing descending as `ascending.reverse()` — flips ties.\n- `a.localeCompare(b)` on numbers ("100" < "9") or `a - b` on strings (NaN).\n- Forgetting to reset the page when filtering, leaving users on an empty page 3 of 1.\n- Putting `onClick` on the `<th>` with no button: not focusable, no role, no keyboard support.\n- Setting `aria-sort="none"` text on every header but forgetting to update it, or putting arrows in the accessible name ("Name ▲").\n- Keying rows by index, so sorting reuses DOM nodes (and their internal state) for different rows.\n- Searching the rendered output, so formatting characters affect matching.',
    testingStrategy:
      'Use a fixture designed to expose bugs: numbers whose string and numeric orders differ (3, 9, 10, 100), a three-way tie to prove stability in both directions, mixed-case names and null cells. Query by role and name: `table` by caption, `columnheader`, `button` inside a header via `within`, `searchbox` "Filter", `combobox` "Rows per page". Assert `aria-sort` transitions, disabled pagination buttons and "Page X of Y". Prove the rows prop is not mutated by comparing a copy before/after. Prove derived state with a render spy on a column\'s `render`: after filtering, it must never be called for rows that no longer match (an effect-synced implementation renders the stale page once). Use `rerender` with fewer rows to test clamping.',
    seniorFollowUps:
      '- Move sort/filter/pagination to the server: what becomes controlled state, how do you debounce and cancel requests, and how do you keep "Page X of Y" honest while a request is in flight?\n- 50 000 rows: virtualise the body while keeping keyboard navigation and screen-reader row counts (aria-rowcount / aria-rowindex).\n- Multi-column sort (shift+click): state shape, comparator chaining, and how to announce it.\n- Persist table state in the URL (shareable views) and restore it on load.\n- Row selection with "select all" across pages vs. on the current page — what does "all" mean with a filter?\n- Make the component headless: hooks returning prop getters so teams can render their own markup.',
  },
  followUps: [
    { id: 'f1', level: 'definition', question: 'What is "derived state", and why is copying it into state with useEffect considered an anti-pattern?', expectedConcepts: ['value computable from props/state', 'extra render with stale data', 'two sources of truth', 'compute during render, cache with useMemo'], sourceIds: ['react-no-effect'] },
    { id: 'f2', level: 'mechanism', question: 'Why does `sorted.reverse()` break a stable sort for descending order, and what is the correct approach?', expectedConcepts: ['sort() is stable since ES2019', 'reverse flips the relative order of ties', 'negate the comparator', 'copy before sorting because sort mutates'], sourceIds: ['mdn-array-sort'] },
    { id: 'f3', level: 'application', question: 'Your table must sort names in several languages ("Émile", "Zoë", "ångström") and file names like "file10" vs "file9". How do you compare strings?', expectedConcepts: ['Intl.Collator', 'numeric option', 'sensitivity base / accent', 'create the collator once, reuse compare'], sourceIds: ['mdn-intl-collator'] },
    { id: 'f4', level: 'edge-cases', question: 'The user is on page 5, then deletes rows (or changes a filter elsewhere) so only 2 pages remain. What should happen and where does that logic live?', expectedConcepts: ['clamp during render', 'Math.min(page, pageCount)', 'no effect to fix state', 'reset page in event handlers'], sourceIds: ['react-no-effect'] },
    { id: 'f5', level: 'production', question: 'The dataset grows to 100 000 rows and typing in the filter feels sluggish. How do you diagnose and fix it?', expectedConcepts: ['profile render vs filter cost', 'useDeferredValue / debounce the query', 'useMemo with stable column definitions', 'virtualise or move work to the server', 'INP'], sourceIds: ['webdev-inp'] },
    { id: 'f6', level: 'architecture', question: 'Design this table as a reusable design-system component that supports both client-side and server-side data. What is the API?', expectedConcepts: ['controlled vs uncontrolled sort/filter/page state', 'onStateChange callback', 'column definitions with typed accessors', 'headless hook + default renderer', 'aria-sort handled by the library'], sourceIds: ['react-sharing-state', 'apg-sortable-table'] },
  ],
  mcqs: [
    {
      id: 'm1',
      question: 'Rows A, B and C all have salary 100 and appear in that order. You sort by salary ascending with a stable sort, then implement "descending" as `ascending.slice().reverse()`. What order do the three rows appear in?',
      options: [
        { id: 'a', text: 'A, B, C', explanation: 'That is what negating the comparator would produce; reversing the whole array also reverses the tie.' },
        { id: 'b', text: 'C, B, A', explanation: 'Correct — reverse() flips every pair, including rows that compared equal, so the original order of ties is lost.' },
        { id: 'c', text: 'Unpredictable, because sort() is not stable', explanation: 'Array.prototype.sort is required to be stable since ES2019.' },
        { id: 'd', text: 'B, A, C', explanation: 'Neither stable sorting nor reverse() would produce this order.' },
      ],
      correctOptionId: 'b',
      explanation: 'Stable sort keeps ties in input order for the comparator you give it. To sort descending stably, sort with the negated comparator instead of reversing.',
      sourceIds: ['mdn-array-sort'],
    },
    {
      id: 'm2',
      question: 'Where should a filtered-and-sorted list of rows live in a React component whose inputs are a `rows` prop and a `query` state?',
      options: [
        { id: 'a', text: 'In state, updated by a useEffect that depends on rows and query', explanation: 'This renders once with stale data and once more after the effect — the pattern react.dev recommends removing.' },
        { id: 'b', text: 'Computed during render (optionally cached with useMemo)', explanation: 'Correct — it is derived data, so computing it from current props and state keeps it always consistent.' },
        { id: 'c', text: 'In a ref, updated in the onChange handler', explanation: 'Refs do not trigger renders and would miss changes to the rows prop.' },
        { id: 'd', text: 'In state, initialised once with useState(() => sort(rows))', explanation: 'The initialiser only runs on mount, so new rows from the parent would be ignored.' },
      ],
      correctOptionId: 'b',
      explanation: 'Anything that can be calculated from existing props and state should be calculated during rendering; useMemo is an optional cache for expensive calculations.',
      sourceIds: ['react-no-effect'],
    },
    {
      id: 'm3',
      question: 'Following the WAI-ARIA sortable table example, how is the sort state of a column exposed?',
      options: [
        { id: 'a', text: 'aria-sort on the column header (th) of the sorted column, with a button inside the header to change it', explanation: 'Correct — the header cell carries aria-sort, and a native button makes it operable by keyboard and assistive technology.' },
        { id: 'b', text: 'aria-sort on the <table> element', explanation: 'aria-sort belongs on the header cell, so users know which column is sorted.' },
        { id: 'c', text: 'aria-pressed on the header button', explanation: 'aria-pressed describes a toggle button, not a sort direction.' },
        { id: 'd', text: 'An arrow character in the header text', explanation: 'Glyphs like ▲ are not reliably announced as a sort direction; they should be aria-hidden decoration.' },
      ],
      correctOptionId: 'a',
      explanation: 'The sorted column header gets aria-sort="ascending" or "descending"; the control that changes it is a button inside that header.',
      sourceIds: ['apg-sortable-table'],
    },
  ],
};

export default problem;
