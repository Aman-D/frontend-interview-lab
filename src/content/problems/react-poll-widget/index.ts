import type { CodingProblem } from '../../schema';
import starterPoll from './starter/Poll.tsx?raw';
import starterUtils from './starter/pollUtils.ts?raw';
import types from './starter/types.ts?raw';
import api from './starter/api.ts?raw';
import app from './starter/App.tsx?raw';
import styles from './starter/styles.css?raw';
import solutionPoll from './solution/Poll.tsx?raw';
import solutionUtils from './solution/pollUtils.ts?raw';
import helpers from './tests/helpers.ts?raw';
import utilsTests from './tests/pollUtils.test.ts?raw';
import utilsHiddenTests from './tests/pollUtils.hidden.test.ts?raw';
import publicTests from './tests/public.test.tsx?raw';
import hiddenTests from './tests/hidden.test.tsx?raw';

const shared = { '/App.tsx': app, '/types.ts': types, '/api.ts': api, '/styles.css': styles };

const problem: CodingProblem = {
  schemaVersion: 1,
  kind: 'coding',
  id: 'react-poll-widget',
  slug: 'poll-widget',
  title: 'Poll Widget',
  track: 'react',
  execution: 'react',
  difficulty: 'medium',
  priority: 'P1',
  seniority: ['Senior', 'SDE-2', 'SDE-3', 'MTS'],
  topics: ['optimistic updates', 'rollback', 'async UI states', 'fieldset / radio group', 'live regions', 'largest-remainder rounding', 'embeddable widgets'],
  estimatedMinutes: 60,
  conceptIds: ['async-ui-states', 'radio-group-aria', 'aria-live-regions', 'focus-management', 'immutable-updates', 'derived-state', 'race-conditions', 'abort-controller', 'react-effects', 'react-19-actions'],
  research: {
    provenance: 'PUBLISHED_PRACTICE_PROBLEM',
    frequencyConfidence: 'HIGH_CONFIDENCE',
    verificationStatus: 'SOURCES_VERIFIED',
    lastVerified: '2026-11-23',
    evidence: [
      { sourceId: 'fih-sd-ui', url: 'https://www.frontendinterviewhandbook.com/front-end-system-design/ui-components', originalTitle: 'Poll widget', note: 'Listed among the UI component system-design examples.' },
      { sourceId: 'alla-components', url: 'https://allahabadi.dev/frontend-system-design/components/', originalTitle: 'Design an Embeddable Poll', note: 'Question 11 in the component design list.' },
    ],
    researchNotes:
      'Both sources frame the poll as a component/system-design question; the embeddable (third-party) angle comes from the allahabadi.dev title. This problem is the 60-minute machine-coding core of that design: load/error/retry, an accessible single-choice form, optimistic voting with exact rollback, results that add up to 100% (largest remainder), double-vote prevention and polite announcements. The embedding contract (iframe vs script, postMessage, auth and fraud) is covered in the solution discussion and follow-ups rather than coded, because it cannot be meaningfully exercised inside a single sandbox in an hour. Statement, code and tests are original to this project.',
  },
  spec: {
    summary: 'Build an accessible poll widget in React that votes optimistically, rolls back exactly on failure and shows results that always add up to 100%.',
    description: `Implement \`<Poll pollId api />\` in **Poll.tsx** and the pure helpers in **pollUtils.ts**.

\`api\` is injected (\`types.ts\`): \`getPoll(pollId, signal)\` loads a poll and \`vote(pollId, optionId)\` records the viewer's vote and resolves with the **authoritative** poll. Parents may pass \`api={{ getPoll, vote }}\` inline, so the object identity can change on every render.

1. **Load**: show a loading status, then the poll. If loading fails, show an error (\`role="alert"\`) and a **Retry** button.
2. **Vote form**: a \`<form>\` with a \`<fieldset>\` whose \`<legend>\` is the question and one native radio per option (single choice). **Vote** is disabled until an option is chosen.
3. **Optimistic results**: on submit, immediately show results that include the viewer's vote, while the request is pending. When the server answers, show **its** numbers (other people may have voted meanwhile).
4. **Rollback**: if the vote fails, discard the optimistic guess, return to the form with the choice still selected, and show an error. A retry must count the vote once, not twice.
5. **One vote**: repeated clicks/submits while pending send one request; once voted (or if \`viewerVote\` is already set by the server), show results only, with "You voted for …".
6. **Results**: each option shows its label, a whole-number percentage, its vote count ("1 vote" / "n votes") and a bar. Percentages come from \`toPercentages()\` and **always sum to 100** (largest-remainder method), including ties; with zero votes they are all 0.
7. **Announcements**: loading, "Submitting your vote…" and "Vote recorded …" are announced through one **polite** live region that stays mounted.

\`App.tsx\`, \`api.ts\` and \`types.ts\` are read-only. In the preview, tick "Votes fail" to exercise the rollback. Multi-choice polls are an optional extension.`,
    technologies: ['React 18', 'TypeScript', 'HTML forms (fieldset/legend, radio)', 'ARIA live regions'],
    learningObjectives: [
      'Separate server-confirmed state from an optimistic guess so rollback is exact by construction',
      'Prevent duplicate submissions with a synchronous guard and a server-side invariant',
      'Round percentages so they always sum to 100 (largest-remainder method) and unit-test the helper',
      'Use native form semantics (fieldset/legend/radio) and a persistent polite live region',
      'Reason about the embeddable version: iframe vs script, postMessage contract, auth and vote fraud',
    ],
    clarifications: [
      { question: 'Single choice or multiple choice?', why: 'Radio group vs checkbox group changes the data model (one optionId vs a set), the validation and the percentage maths (percent of voters vs percent of votes).', defaultAssumption: 'Single choice with native radios; multi-choice is an optional extension.' },
      { question: 'Can a viewer change or retract their vote, and who enforces "one vote per person"?', why: 'Changing a vote needs a different optimistic transition (move a vote, not add one); enforcement decides whether the client check is security or just UX.', defaultAssumption: 'One irrevocable vote; the server is the source of truth (it returns viewerVote and rejects repeats). The client guard only prevents accidental double submits.' },
      { question: 'Should results be visible before voting, and should they update live?', why: 'Showing results first biases votes; live updates need polling, SSE or WebSockets and a merge strategy for optimistic state.', defaultAssumption: 'Results are shown only after voting (or if already voted); no live updates in v1.' },
      { question: 'How should percentages be rounded?', why: 'Independently rounding each share produces totals of 99% or 101%, which users notice and report as bugs.', defaultAssumption: 'Whole numbers via the largest-remainder method, ties broken by option order; all zeros when there are no votes.' },
      { question: 'Will this be embedded on third-party sites?', why: 'Determines isolation (iframe vs script), styling, how auth works and how the host learns about votes.', defaultAssumption: 'Build the component first; discuss the embeddable delivery (iframe + postMessage) as a follow-up.' },
    ],
    scopeDecisions: [
      'Single-choice polls only in the core task; multi-choice is OPTIONAL.',
      'No live result updates (polling/WebSockets) and no vote changes — both are follow-ups.',
      'Results are hidden until the viewer has voted.',
      'The embeddable delivery (iframe, postMessage, auth, fraud) is discussed, not implemented.',
      'React 18: no `useOptimistic`/Actions; the solution models optimistic state by hand (the React 19 version is discussed as an alternative).',
    ],
    requirements: [
      { id: 'load-states', category: 'functional', level: 'MUST', text: 'Shows a loading status while `getPoll` is pending, the poll when it resolves, and an alert with a Retry button (which calls `getPoll` again) when it fails.' },
      { id: 'fieldset-radios', category: 'accessibility', level: 'MUST', text: 'The form is a `<fieldset>` whose `<legend>` is the question, with one labelled native radio per option sharing a unique `name`.' },
      { id: 'vote-disabled', category: 'functional', level: 'MUST', text: 'The Vote button is disabled until an option is chosen; submitting calls `api.vote(pollId, optionId)`.' },
      { id: 'optimistic', category: 'functional', level: 'MUST', text: 'Results including the viewer\'s vote appear immediately while the vote is pending, with a "Submitting your vote…" status.' },
      { id: 'reconcile', category: 'technical', level: 'MUST', text: 'When the vote resolves, the server\'s poll replaces the optimistic guess.' },
      { id: 'rollback', category: 'functional', level: 'MUST', text: 'A failed vote discards the optimistic guess, returns to the form with the choice kept and shows a `role="alert"` error; a retry counts the vote exactly once.' },
      { id: 'no-double-vote', category: 'edge-case', level: 'MUST', text: 'Repeated clicks or submits while pending send a single request; after voting (or when `viewerVote` is set on load) no vote form is shown.' },
      { id: 'percentages', category: 'technical', level: 'MUST', text: '`toPercentages(counts)` returns whole numbers that sum to exactly 100 using the largest-remainder method (ties by option order), or all zeros when the total is 0.' },
      { id: 'apply-vote-pure', category: 'technical', level: 'MUST', text: '`applyVote(poll, optionId)` is pure: it returns a new poll, keeps unchanged options by identity, and returns the input for unknown options or a poll already voted in.' },
      { id: 'counts-plural', category: 'edge-case', level: 'SHOULD', text: 'Each result row shows the label, percentage and count with correct pluralisation ("1 vote", "0 votes"); the viewer\'s option is marked.' },
      { id: 'stale-load', category: 'edge-case', level: 'MUST', text: 'When `pollId` changes, the previous load is aborted and its late response is ignored.' },
      { id: 'stable-api', category: 'performance', level: 'SHOULD', text: 'A new `api` object identity with the same `pollId` does not reload the poll or reset the selection.' },
      { id: 'live-region', category: 'accessibility', level: 'MUST', text: 'Loading, submitting and "Vote recorded" messages are announced through one polite live region (`role="status"`) that stays mounted across states.' },
      { id: 'accessible-results', category: 'accessibility', level: 'SHOULD', text: 'Result values are available as text; bars are decorative (`aria-hidden`) — or, if you use `role="meter"`, it has a name and value text.' },
      { id: 'focus', category: 'accessibility', level: 'SHOULD', text: 'After submitting, focus moves to the results (the form that had focus disappears); after a failure, focus returns to the chosen radio.' },
      { id: 'multi-choice', category: 'functional', level: 'OPTIONAL', text: 'Support `allowMultiple` polls with a checkbox group, and percentages of voters rather than of votes.' },
      { id: 'tests', category: 'testing', level: 'SHOULD', text: 'Pending/success/failure are tested deterministically with manually settled promises; the rounding helper has table and property tests.' },
    ],
    constraints: [
      'React 18 function components and hooks only (no `useOptimistic` / Actions — they are React 19).',
      'No third-party libraries.',
      'Do not change the props or the `types.ts` contract.',
    ],
    acceptanceCriteria: [
      'All public tests pass (rounding helper, loading → form, load error + retry, optimistic results, server reconciliation, rollback, already-voted view).',
      'All hidden tests pass (double submit, exact rollback on retry, zero-vote and tie edge cases, stale pollId, stable api identity, focus, persistent live region, decorative bars, rounding properties).',
      'Manual: with a screen reader, the question is read as the group label and "Vote recorded" is announced without interrupting.',
    ],
    examples: [
      { title: 'Optimistic vote', input: 'counts Cats 1, Dogs 1, Birds 1; vote Cats (pending)', output: 'Cats 50% (2 votes), Dogs 25%, Birds 25%; status "Submitting your vote…"' },
      { title: 'Server reconciliation', input: 'vote Dogs; server resolves with Cats 1, Dogs 2, Birds 6', output: 'Cats 11%, Dogs 22%, Birds 67% (sum 100); "You voted for Dogs"', explanation: 'Raw shares 11.1 / 22.2 / 66.7: the floors sum to 99, and the largest remainder (Birds) gets the missing point.' },
      { title: 'Rollback', input: 'counts 1, 1, 2; vote Cats → rejects; vote again (pending)', output: 'Form returns with Cats checked and an alert; the retry shows Cats 2 votes (40%), not 3', explanation: 'The confirmed poll was never mutated, so the retry starts from the server state.' },
      { title: 'Rounding ties', input: 'toPercentages([1, 1, 1])', output: '[34, 33, 33]', explanation: 'Equal remainders: the leftover point goes to the first option.' },
    ],
    manualTests: [
      'Vote in the lunch poll and watch the optimistic bars, then the server numbers (another voter is simulated).',
      'Tick "Votes fail", vote, and confirm the form returns with your choice and an error; untick and retry.',
      'Tick "Loads fail", remount, and use Retry.',
      'Keyboard only: Tab into the group, use arrow keys to pick, Tab to Vote, Enter; focus should land on the results heading.',
      'With VoiceOver/NVDA: the legend is read with the first radio; "Vote recorded" is announced politely.',
    ],
  },
  files: {
    entry: '/App.tsx',
    starter: { ...shared, '/Poll.tsx': starterPoll, '/pollUtils.ts': starterUtils },
    solution: { ...shared, '/Poll.tsx': solutionPoll, '/pollUtils.ts': solutionUtils },
    readonly: ['/App.tsx', '/types.ts', '/api.ts'],
    support: {},
  },
  tests: [
    { path: '/tests/helpers.ts', visibility: 'public', kind: 'runtime', source: helpers },
    { path: '/tests/pollUtils.test.ts', visibility: 'public', kind: 'runtime', source: utilsTests },
    { path: '/tests/public.test.tsx', visibility: 'public', kind: 'runtime', source: publicTests },
    { path: '/tests/pollUtils.hidden.test.ts', visibility: 'hidden', kind: 'runtime', source: utilsHiddenTests },
    { path: '/tests/hidden.test.tsx', visibility: 'hidden', kind: 'runtime', source: hiddenTests },
  ],
  hints: [
    'Start with `toPercentages`: compute `Math.floor(count * 100 / total)` and the remainder `(count * 100) % total` for each option, then give the missing `100 − Σfloors` points to the largest remainders (sort a copy by remainder desc, index asc). Return zeros when the total is 0.',
    'Keep two pieces of poll state: the poll the **server confirmed** and an `optimistic` guess (`applyVote(confirmed, choice)`) that exists only while the vote is pending. Render `optimistic ?? confirmed`. Rollback is then just `setOptimistic(null)` — the confirmed counts were never touched, so a retry cannot double-count.',
    'Guard the submit with a ref (`pendingRef.current`) checked and set synchronously in the handler — state updates are not visible to a second event in the same tick. Show results whenever the displayed poll has `viewerVote`, so the server value also prevents a second vote after reload.',
    'Load in an effect keyed on `[pollId, attempt]` with an `AbortController`; ignore results if `signal.aborted`. Read `api` through a ref so an inline `api={{…}}` doesn\'t reload. Render the `role="status"` element unconditionally at the same position so it is never remounted, and only change its text.',
  ],
  solution: {
    initialApproach: 'Model the widget as an explicit state machine — loading → error | ready(form) → pending(optimistic results) → voted | ready(form + error) — and keep the server-confirmed poll separate from the optimistic guess. All numbers on screen are derived from whichever poll is displayed, through one pure rounding helper.',
    bruteForce: 'Mutating the loaded poll in place (`option.votes++`) on submit and decrementing on failure "works" for one attempt, but it couples rollback to perfect bookkeeping: a retry, a re-render with a fresh server poll, or an exception between the two steps leaves the counts wrong. Rounding each share with `Math.round` independently yields totals of 99% or 101% (e.g. three equal options → 33+33+33).',
    optimizedApproach: `**Two sources, one derived view.**

- \`load\` is a discriminated union: \`{ status: 'loading' } | { status: 'error' } | { status: 'ready', poll }\`, where \`poll\` is always the **last server-confirmed** state.
- \`optimistic\` is \`applyVote(confirmed, choice)\` while the request is in flight, otherwise \`null\`. The UI renders \`optimistic ?? confirmed\`.
- **Success**: replace \`confirmed\` with the server's poll (reconciliation — never keep your guess) and clear \`optimistic\`.
- **Failure**: clear \`optimistic\`. That *is* the rollback; nothing needs undoing.
- **Double submit**: a \`pendingRef\` checked and set synchronously; plus the view switches to results as soon as \`viewerVote\` is set, so there is no form to submit. The server still enforces one vote per user — the client guard is UX, not security.
- **Percentages**: \`toPercentages\` uses the largest-remainder (Hamilton) method with integer arithmetic, so the displayed numbers always add up to 100.
- **A11y**: native \`fieldset\`/\`legend\`/radios give the group name and arrow-key behaviour for free; one always-mounted \`role="status"\` announces progress politely; errors use \`role="alert"\`; bars are \`aria-hidden\` because the text already carries the value; focus moves to the results heading after submit.`,
    walkthrough: `1. **Ids**: \`useId()\` builds the radio \`name\`, input ids, the error id (for \`aria-describedby\`) and the results heading id, so several polls can live on one page.
2. **Latest api ref**: an effect without deps copies \`api\` into \`apiRef\`; the load effect depends only on \`[pollId, attempt]\`.
3. **Load effect**: bump a \`generation\` counter, create an \`AbortController\`, reset selection/errors, announce "Loading poll…", call \`getPoll(pollId, signal)\`. Ignore the result if aborted. The cleanup aborts and invalidates the generation, so a vote that settles after a pollId change or unmount is ignored too.
4. **Submit**: \`preventDefault\`; bail if pending, not ready, nothing selected or already voted. Compute \`guess = applyVote(base, choice)\`, set \`pendingRef\`, \`setOptimistic(guess)\`, announce "Submitting your vote…", and mark the results heading as the next focus target.
5. **Await \`vote\`**: on success (same generation) set \`load.poll\` to the server poll and announce "Vote recorded. Dogs has 22% of 9 votes."; on failure set the error and mark the checked radio as the focus target; in \`finally\` clear \`optimistic\` and \`pendingRef\`.
6. **Focus effect**: an effect after every render focuses the pending target once, then clears it — focus only moves as a consequence of the user's own action.
7. **Render**: always \`<div>{body}<p role="status">{announcement}</p></div>\` so the live region keeps its DOM node. The body is: nothing (loading), alert + Retry (error), the form (no \`viewerVote\`), or the results list (label, \`n%\`, \`(n votes)\`, \`aria-hidden\` bar, "(your vote)", total and "You voted for …").`,
    complexity: '`toPercentages` is O(n log n) for n options (one sort of the remainders; n is tiny). Each render derives percentages in O(n log n). One request is in flight per poll at most; memory is O(n) for the confirmed poll plus O(n) for the optimistic copy (unchanged options are shared by identity).',
    edgeCases: '- **Zero votes**: total 0 → all 0% and "No votes yet"; the first vote becomes 100% / 0%.\n- **Ties**: equal remainders → the earlier option gets the extra point, deterministically ([1,1,1] → 34/33/33).\n- **Server disagrees with the guess**: always show the server poll after success.\n- **Failure then retry**: the retry is computed from the confirmed poll, so the vote is counted once.\n- **Double click / Enter repeat**: the ref guard rejects the second submit in the same tick.\n- **Already voted on load** (another tab, reload): show results only.\n- **pollId changes mid-load or mid-vote**: abort the load; the generation check drops a late vote result.\n- **Unknown option id**: `applyVote` returns the input; the submit bails.\n- **Pluralisation**: "1 vote" vs "0 votes" / "2 votes".',
    alternatives: '- **React 19 `useOptimistic` + an Action** (`<form action={…}>`): `useOptimistic(confirmed, applyVote)` derives the optimistic poll while the Action\'s transition is pending and automatically reverts to `confirmed` when it ends, and `useActionState`/`useFormStatus` give the pending flag. It is the same model as this solution (base state + pending update), maintained by React; it is not usable here because the sandbox runs React 18.\n- **`role="meter"` (or `<meter>`)** per option with `aria-valuenow`, `aria-valuemin/max` and `aria-valuetext="46%, 12 votes"`: semantically a scalar within a known range, but screen-reader support for meter is uneven and it adds verbosity; visible text plus a decorative bar is the most robust choice. `role="progressbar"` is wrong — results are not progress.\n- **Visible text vs visually hidden text**: if the design shows only bars, put the percentage in a visually hidden span instead of dropping it.\n- **Data libraries** (TanStack Query `onMutate`/`onError` rollback with a snapshot, SWR `optimisticData` + `rollbackOnError`) implement the same pattern with cache integration.\n- **Pessimistic UI** (wait for the server, show a spinner): simpler and always truthful; acceptable when votes are slow or contested.',
    tradeoffs: '- **Optimistic vs pessimistic**: optimistic feels instant but briefly shows numbers the server may correct; reconciling to the server response keeps it honest.\n- **Snapshot rollback vs derived optimistic state**: a snapshot (`prev = poll; setPoll(guess); onError: setPoll(prev)`) is simple but clobbers any server update that arrived meanwhile (e.g. live polling); keeping base state and pending operations separately and deriving the view (what `useOptimistic` does) composes with concurrent updates.\n- **Disabled submit button**: clear affordance, but disabled controls are skipped by some AT users and give no reason; an always-enabled button with a validation message is the more inclusive alternative.\n- **Moving focus**: needed because the focused form disappears; moving it to a heading with `tabIndex=-1` is gentle, but moving focus on every update would be disruptive — only do it in response to the user\'s action.',
    commonMistakes: '- Rounding each percentage with `Math.round` (99% / 101% totals).\n- Mutating the poll (`option.votes++`) and "undoing" it, which double-counts on retry.\n- Keeping the optimistic numbers after success instead of the server\'s.\n- Guarding double submits with state only (`if (pending) return`) — both events in the same tick see the old value.\n- Treating the client guard as the anti-fraud mechanism.\n- Mounting the live region only when there is a message (newly inserted live regions are often not announced) or making it assertive.\n- Radios without a fieldset/legend, so the question is not announced as the group label; hard-coded `name`/`id` values that collide between two polls.\n- Losing focus to `<body>` when the form is replaced by results.\n- Reloading the poll on every render because the effect depends on an inline `api` object.',
    testingStrategy: 'Unit-test `toPercentages` with a table (exact splits, one/several leftover points, ties, zero total, single option, lopsided counts) plus a seeded property test (sum is 100, each value within one point of the exact share), and `applyVote` for purity with frozen inputs. For the component, inject a fake api whose calls return manually settled promises, so each state — loading, error, pending, success, failure — is asserted at a precise point. Query by role and accessible name (group, radio, button, status, alert, list "Results"). Cover double submit, rollback-then-retry arithmetic, the zero-vote and tie cases through the UI, stale pollId, inline api identity, focus targets and the persistence of the live region node.',
    seniorFollowUps: `- **Embeddable version — iframe or script?** An **iframe** (\`https://polls.example.com/embed/:id\`) isolates CSS/JS both ways, keeps the poll's cookies on its own origin and cannot be tampered with by the host page's scripts; costs: an extra document, sizing (the iframe reports its height via \`postMessage\` so the host can resize it), third-party-cookie restrictions for auth, and limited theming (pass a theme via query params or a message). A **script** that renders into a host element (ideally inside a Shadow DOM) is lighter and fits the host's layout, but shares the global scope and lets the host page read or forge votes — fine for first-party embeds, risky for third parties.
- **postMessage contract**: version it and keep it small — e.g. \`{ source: 'poll-widget', version: 1, type: 'resize' | 'voted' | 'ready', pollId, payload }\` from widget to host, and \`{ type: 'set-theme' }\` from host to widget. Always send with an explicit \`targetOrigin\` (never \`'*'\` for anything sensitive) and validate \`event.origin\` and \`event.source\` on receipt; treat incoming data as untrusted and never let the host trigger a vote.
- **Auth & fraud**: "one vote per user" is enforced **server-side** (unique constraint on (pollId, userId) or on a device/session token for anonymous polls), with rate limiting, CAPTCHA/attestation for anonymous traffic, and anomaly detection. The client guard and \`viewerVote\` are UX only. The vote endpoint should be idempotent (idempotency key per attempt) so a retried request after a timeout does not count twice.
- **Live results**: poll or subscribe (SSE/WebSocket) and merge into the confirmed state; with an optimistic vote pending, rebase the guess on the new base (derive, don't snapshot).
- **Scale**: cache poll definitions at the CDN, aggregate counts with sharded counters, return rounded results from the server so every client shows the same numbers.
- **Performance**: the embed should be tiny and lazy (\`loading="lazy"\` iframe, no framework if it is a script), and reserve its height to avoid layout shift (CLS).`,
  },
  followUps: [
    { id: 'f1', level: 'definition', question: 'What is an optimistic update, and what must the UI do when the server disagrees with the guess?', expectedConcepts: ['show the expected result before confirmation', 'reconcile with the server response', 'roll back and explain on failure'], sourceIds: ['react-useoptimistic'] },
    { id: 'f2', level: 'mechanism', question: 'What do `<fieldset>`/`<legend>` and native radios with a shared `name` give you for free — for screen readers and for the keyboard — compared with styled divs?', expectedConcepts: ['legend becomes the group\'s accessible name', 'one tab stop per radio group', 'arrow keys move and select', 'checked state exposed natively', 'unique name per widget instance'], sourceIds: ['mdn-fieldset', 'mdn-input-radio', 'apg-radio'] },
    { id: 'f3', level: 'application', question: 'Two clicks on "Vote" arrive in the same tick. Why does `if (pending) return` with useState not stop the second one, and what does?', expectedConcepts: ['state is a snapshot per render', 'updates are applied on the next render', 'synchronous ref guard', 'server-side uniqueness'], sourceIds: ['react-refs', 'react-queueing'] },
    { id: 'f4', level: 'edge-cases', question: 'Why must the polite live region be mounted before the message changes, and why polite rather than assertive?', expectedConcepts: ['AT observes existing regions', 'inserted regions may not be announced', 'status is polite and does not interrupt', 'alert for errors'], sourceIds: ['mdn-live-regions'] },
    { id: 'f5', level: 'production', question: 'How do you guarantee one vote per user when the widget is embedded on anonymous third-party pages?', expectedConcepts: ['server-side unique constraint', 'session/device token', 'rate limiting and bot detection', 'idempotency keys for retries', 'client checks are UX only'], sourceIds: [] },
    { id: 'f6', level: 'architecture', question: 'Design the embeddable poll: iframe or script, how it sizes itself, and the postMessage contract with the host page.', expectedConcepts: ['iframe isolation vs script integration', 'resize messages', 'versioned message schema', 'targetOrigin and event.origin checks', 'third-party cookie limits'], sourceIds: ['mdn-postmessage', 'mdn-iframe', 'alla-components'] },
  ],
  mcqs: [
    {
      id: 'm1',
      question: 'Three options each have 1 vote. Which percentages does the largest-remainder method (ties broken by option order) produce?',
      options: [
        { id: 'a', text: '33, 33, 33', explanation: 'That is independent rounding (or flooring): the total is 99, which is exactly what the method prevents.' },
        { id: 'b', text: '34, 33, 33', explanation: 'Correct — the floors sum to 99; the single missing point goes to the largest remainder, and the tie is broken by order.' },
        { id: 'c', text: '33.3, 33.3, 33.3', explanation: 'The requirement is whole numbers; one decimal place would still sum to 99.9.' },
        { id: 'd', text: '34, 34, 32', explanation: 'Only one point is missing, and no option is rounded down below its floor.' },
      ],
      correctOptionId: 'b',
      explanation: 'Largest remainder: floor every exact share, then distribute the remaining points to the largest fractional parts until the total is exactly 100.',
      sourceIds: ['fih-sd-ui'],
    },
    {
      id: 'm2',
      question: 'A vote fails after the UI showed optimistic results. Which design makes "retry" count the vote exactly once?',
      options: [
        { id: 'a', text: 'Increment the option in the loaded poll, and decrement it in the catch block', explanation: 'Works only with perfect bookkeeping; any exception, re-render with fresh data or missed path leaves the counts wrong.' },
        { id: 'b', text: 'Keep the server-confirmed poll untouched and render a separate optimistic copy while pending; discard the copy on failure', explanation: 'Correct — rollback is just dropping the copy, and the retry is computed from the confirmed state. useOptimistic follows the same model.' },
        { id: 'c', text: 'Reload the whole page on failure', explanation: 'Loses the user\'s choice and context; not a rollback strategy.' },
        { id: 'd', text: 'Keep showing the optimistic results and silently retry forever', explanation: 'Shows data that may never become true and hides the failure from the user.' },
      ],
      correctOptionId: 'b',
      explanation: 'Deriving the view from (confirmed state + pending update) makes rollback exact by construction instead of by inverse operations.',
      sourceIds: ['react-useoptimistic', 'react-updating-objects'],
    },
    {
      id: 'm3',
      question: 'The poll is embedded in a third-party page as an iframe. Which is the safe way for the widget to tell the host its new height?',
      options: [
        { id: 'a', text: 'window.parent.document.getElementById("poll").style.height = …', explanation: 'Cross-origin frames cannot access the parent\'s DOM; this throws a SecurityError.' },
        { id: 'b', text: 'window.parent.postMessage({ type: "resize", height }, hostOrigin), with the host checking event.origin', explanation: 'Correct — postMessage is the cross-origin channel; specify the target origin and validate origin/source on receipt.' },
        { id: 'c', text: 'Write the height to a cookie the host polls', explanation: 'Cookies are per origin (and third-party cookies are often blocked); polling is wasteful.' },
        { id: 'd', text: 'Use localStorage shared between the two origins', explanation: 'Storage is partitioned by origin; the host cannot read the widget\'s storage.' },
      ],
      correctOptionId: 'b',
      explanation: 'window.postMessage enables controlled cross-origin communication; receivers must verify event.origin and treat the data as untrusted.',
      sourceIds: ['mdn-postmessage', 'mdn-iframe'],
    },
  ],
};

export default problem;
