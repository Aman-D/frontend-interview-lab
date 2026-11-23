import type { CodingProblem } from '../../schema';
import starterWizard from './starter/SignupWizard.tsx?raw';
import starterValidation from './starter/validation.ts?raw';
import types from './starter/types.ts?raw';
import steps from './starter/steps.ts?raw';
import app from './starter/App.tsx?raw';
import styles from './starter/styles.css?raw';
import solutionWizard from './solution/SignupWizard.tsx?raw';
import solutionValidation from './solution/validation.ts?raw';
import helpers from './tests/helpers.tsx?raw';
import validationTests from './tests/validation.test.ts?raw';
import validationHiddenTests from './tests/validation.hidden.test.ts?raw';
import publicTests from './tests/public.test.tsx?raw';
import hiddenTests from './tests/hidden.test.tsx?raw';

const shared = { '/App.tsx': app, '/types.ts': types, '/steps.ts': steps, '/styles.css': styles };

const problem: CodingProblem = {
  schemaVersion: 1,
  kind: 'coding',
  id: 'react-multi-step-form',
  slug: 'multi-step-form',
  title: 'Multi-step Form',
  track: 'react',
  execution: 'react',
  difficulty: 'medium',
  priority: 'P1',
  seniority: ['Senior', 'SDE-2', 'SDE-3', 'MTS'],
  topics: ['forms', 'useReducer', 'validation', 'error summary', 'focus management', 'async submit', 'persistence'],
  estimatedMinutes: 60,
  conceptIds: ['controlled-uncontrolled', 'derived-state', 'discriminated-unions', 'async-ui-states', 'race-conditions', 'focus-management', 'aria-live-regions', 'react-effects', 'react-19-actions'],
  research: {
    provenance: 'PUBLISHED_PRACTICE_PROBLEM',
    frequencyConfidence: 'MEDIUM_CONFIDENCE',
    verificationStatus: 'SOURCES_VERIFIED',
    lastVerified: '2026-11-23',
    evidence: [
      {
        sourceId: 'fg-mc',
        url: 'https://www.frontendgeek.com/frontend-interview/machine-coding-interview',
        originalTitle: 'Step Form',
        note: 'Listed under "Component machine coding".',
      },
      {
        sourceId: 'fg-mc',
        url: 'https://www.frontendgeek.com/frontend-interview/machine-coding-interview',
        originalTitle: 'Multi-Step Form',
        note: 'Listed separately in the same "Component machine coding" list; treated here as the same problem. The hub also lists "Application Forms" under application machine coding.',
      },
    ],
    researchNotes:
      'One published practice source lists the problem twice ("Step Form" and "Multi-Step Form"), so frequency is MEDIUM_CONFIDENCE; no interview report was used. The statement, field set, validation rules, tests and solution are original. Accessibility behaviour follows the W3C WAI multi-page forms tutorial (step indication, keeping data between steps) plus constraint-validation/aria-invalid guidance. 60-minute scope: three data steps plus review, per-step validation with an error summary and focus on the first invalid field, Back that keeps data, review with jump-to-edit, an async submit with pending/error/success states and a double-submit guard, and reload persistence that never stores the password. Server-side validation (e.g. "email already taken" mapped back to a field), React 19 form actions and URL-addressable steps are discussed as follow-ups.',
  },
  spec: {
    summary:
      'Build an accessible 4-step signup wizard with per-step validation, an error summary, review-and-edit, an async submit with pending/error/success states, and reload-safe progress — all state in one reducer.',
    description: `Implement the pure validators in **validation.ts** and the wizard in **SignupWizard.tsx**.

\`\`\`tsx
<SignupWizard onSubmit={(data) => api.createAccount(data)} storage={sessionStorage /* default */} />
\`\`\`

### Steps (\`steps.ts\`, read-only: \`STEPS\`, \`EMPTY_DATA\`, \`TEAM_SIZES\`, \`PLANS\`, \`MESSAGES\`)

| # | Step | Fields (label) | Rules (use \`MESSAGES\`) |
|---|---|---|---|
| 1 | Account | **Full name**, **Email** (\`type=email\`), **Password** (\`type=password\`, hint) | name required (trimmed); email required + \`local@domain.tld\` shape; password required, ≥ 8 chars, contains a digit — reported in that order |
| 2 | Workspace | **Workspace name**, **Team size** (\`<select>\`) | 3–40 chars after trimming; team size required |
| 3 | Plan | radio group **Choose a plan** (\`<fieldset>\`/\`<legend>\`), checkbox **I accept the terms of service** | plan required; **Business needs a team of 2+** (cross-step rule); terms must be accepted |
| 4 | Review | read-only summary with **Edit account / Edit workspace / Edit plan** | password shown masked |

### Validation (\`validation.ts\`) — pure, \`(data) => FieldErrors\`

\`validateAccount\`, \`validateWorkspace\`, \`validatePlan\`, \`validateStep(step, data)\` (review → \`{}\`), \`firstInvalidStep(data)\` and \`normalize(data)\` (trims name, email, workspace — never the password).

### Behaviour

1. One real \`<form noValidate>\` named **"Create your workspace"**. The primary button is \`type="submit"\` — so **Enter** advances too. Always \`preventDefault()\`.
2. A \`<nav aria-label="Signup progress">\` with an \`<ol>\` of the four titles; the current one has \`aria-current="step"\`. A heading **"Step n of 4: Title"** (\`tabIndex={-1}\`).
3. **Next** validates only the current step. If invalid: stay, show each message under its field (\`aria-invalid="true"\`, \`aria-describedby\` → the message), show a \`role="alert"\` summary **"There are N errors on this step"** / **"There is 1 error on this step"** listing the messages, and **focus the first invalid field** (for the plan group: the checked radio, else the first). Errors are not shown before the first attempt; after it they update as the user types.
4. A valid Next moves on and **focuses the step heading**. **Back** never validates, keeps every answer, and focuses the heading. Nothing is focused on initial load.
5. **Review** lists the answers. **Edit …** opens that step; its primary button reads **Save and review** and returns to review — unless the change invalidated another step (e.g. team size → "Just me" with the Business plan), in which case go to the first invalid step with its errors shown.
6. **Create account** re-validates every step (restored data may be incomplete). Then call \`onSubmit(normalize(data))\` **once**: while pending, the button reads **Creating account…** with \`aria-disabled="true"\`, the form has \`aria-busy="true"\`, Back/Edit are disabled, and further submits are ignored. On success, replace the form with a focused heading **"Account created"**. On failure, show a \`role="alert"\` containing the error message, keep all answers, and focus **Create account** for a retry.
7. **Persistence**: save \`{ v: 1, step, data }\` to \`storage\` under \`storageKey\` (default \`"signup-wizard"\`) whenever the step or data change — **never the password** — restore it on mount, ignore corrupt data, and remove it after success. \`storage\` defaults to \`sessionStorage\`, which **throws** in sandboxed/opaque-origin frames: every storage access must be guarded.
8. All wizard state lives in **one \`useReducer\`**; errors are derived from data, not stored.

\`App.tsx\`, \`types.ts\` and \`steps.ts\` are read-only.`,
    technologies: ['React 18', 'TypeScript', 'useReducer', 'HTML forms', 'ARIA (aria-invalid, aria-describedby, aria-current, alert)', 'Web Storage'],
    learningObjectives: [
      'Model a wizard as one reducer with explicit actions and a discriminated submit state',
      'Keep validation pure and per step, including a rule that spans steps',
      'Apply accessible error handling: inline messages, aria-invalid/aria-describedby, an error summary and focus on the first invalid field',
      'Handle async submission states (pending, error + retry, success) and prevent double submits',
      'Persist progress safely: guarded storage access, untrusted restored data, and no secrets at rest',
    ],
    clarifications: [
      {
        question: 'When should validation errors appear: on blur, on every keystroke, or on Next?',
        why: 'Premature errors are noisy for everyone and especially for screen-reader users; late errors are frustrating.',
        defaultAssumption: 'On Next (or submit). After the first attempt on a step, its errors update live as the user fixes them.',
      },
      {
        question: 'Can users jump to any step from the step indicator?',
        why: 'Free navigation lets users skip validation; it changes where re-validation must happen.',
        defaultAssumption: 'No: the indicator is informational. Users move with Next/Back, and from the review page with Edit buttons. The final submit re-validates everything anyway.',
      },
      {
        question: 'Should progress survive a reload, and what may be stored?',
        why: 'Losing a long form is painful, but storing personal data and secrets in the browser has privacy implications.',
        defaultAssumption: 'Keep progress in sessionStorage (tab-scoped, cleared when the tab closes) — never the password — and clear it after success.',
      },
      {
        question: 'What does the submit API return on failure, and can it report field-level errors?',
        why: 'Field errors (e.g. "email taken") should be mapped back to a step and field; generic failures need a retry.',
        defaultAssumption: '`onSubmit` resolves on success and rejects with an Error on failure; show its message with a retry. Mapping server field errors is a follow-up.',
      },
      {
        question: 'Do we need to support browsers without JavaScript or React 19 form actions?',
        why: 'Progressive enhancement and server actions change the architecture (FormData, server validation).',
        defaultAssumption: 'Client-rendered React 18 app; React 19 actions are discussed as an alternative.',
      },
    ],
    scopeDecisions: [
      'Four fixed steps; no conditional/branching steps.',
      'The step indicator is not clickable.',
      'No server-side field errors; a rejected submit shows one message and allows a retry.',
      'Steps are not reflected in the URL (discussed as a follow-up).',
      'Persistence uses an injectable StorageLike so it can be tested; sessionStorage is the default.',
    ],
    requirements: [
      { id: 'steps-indicator', category: 'functional', level: 'MUST', text: 'Four steps (Account, Workspace, Plan, Review) with a "Step n of 4: Title" heading and a "Signup progress" nav whose current item has aria-current="step".' },
      { id: 'validate-on-next', category: 'functional', level: 'MUST', text: 'Next (and Enter) validate only the current step with its pure validator; an invalid step does not advance.' },
      { id: 'inline-errors', category: 'accessibility', level: 'MUST', text: 'Each error appears under its field; the field gets aria-invalid="true" and aria-describedby pointing at the message (plus any hint). No errors before the first attempt; afterwards they update as the user types.' },
      { id: 'summary-first-invalid', category: 'accessibility', level: 'MUST', text: 'A role="alert" summary states the number of errors and lists them; focus moves to the first invalid field in DOM order (the checked or first radio for the plan group).' },
      { id: 'step-focus', category: 'accessibility', level: 'MUST', text: 'After moving between steps, focus is on the new step heading; nothing is focused on initial load.' },
      { id: 'back-keeps-data', category: 'functional', level: 'MUST', text: 'Back never validates and never loses answers on any step.' },
      { id: 'review-edit', category: 'functional', level: 'MUST', text: 'Review shows all answers with the password masked; Edit buttons open a step whose primary button "Save and review" returns straight to review.' },
      { id: 'cross-step-revalidation', category: 'edge-case', level: 'MUST', text: 'Returning to review and submitting re-validate all steps; if an edit or restored data made another step invalid, go to the first invalid step with errors shown and focus its first invalid field.' },
      { id: 'submit-states', category: 'functional', level: 'MUST', text: 'onSubmit(normalize(data)) is awaited: pending (aria-disabled "Creating account…", aria-busy form, Back/Edit disabled) → success (focused "Account created" heading) or error (alert with the message, answers kept, focus on Create account for a retry).' },
      { id: 'no-double-submit', category: 'edge-case', level: 'MUST', text: 'Repeated clicks or Enter presses while pending never call onSubmit again (synchronous guard, not only a disabled button).' },
      { id: 'one-reducer', category: 'technical', level: 'MUST', text: 'All wizard state (step, data, attempted steps, return-to-review, submit status, focus requests) lives in one useReducer; field errors are derived during render, not stored.' },
      { id: 'pure-validation', category: 'technical', level: 'MUST', text: 'validateAccount/Workspace/Plan, validateStep, firstInvalidStep and normalize are pure, use the MESSAGES strings and receive the whole data object (so cross-step rules are possible).' },
      { id: 'real-form', category: 'technical', level: 'MUST', text: 'A real <form noValidate> with a type="submit" primary button, preventDefault on submit, visible <label>s, a <fieldset>/<legend> radio group and sensible autocomplete values.' },
      { id: 'persistence', category: 'technical', level: 'SHOULD', text: 'Progress (step + data, never the password) is saved to storage, restored defensively on mount (corrupt or unexpected values ignored), and removed after success; storage that throws never breaks the form.' },
      { id: 'render-cost', category: 'performance', level: 'SHOULD', text: 'Only the current step is mounted; validation is cheap enough to derive on every render; explain how you would throttle storage writes for large forms.' },
      { id: 'tests', category: 'testing', level: 'SHOULD', text: 'Validators are unit-tested at their boundaries; component tests assert focus, aria-invalid/aria-describedby, the summary, pending/error/success and persistence with a fake storage.' },
    ],
    constraints: [
      'React function components and hooks only; no form or validation libraries.',
      'Do not change App.tsx, types.ts or steps.ts, the props, the labels or the MESSAGES strings.',
      'Never write the password to storage or render it on the review step.',
    ],
    acceptanceCriteria: [
      'All public tests pass (validators; initial render and indicator; errors + summary + focus; advancing with heading focus; Back keeps data; review → pending → success).',
      'All hidden tests pass (validator boundaries and purity; first-invalid focus and live errors; Enter/submit with preventDefault; radio group focus; Save and review and cross-step re-validation; error + retry with normalised data; double-submit guard; persistence without the password; corrupt/throwing/default storage and re-validation on submit).',
      'Manual: completing the wizard with only a keyboard and a screen reader, each step change and each error is announced.',
    ],
    examples: [
      { title: 'First invalid field', input: 'Full name filled, Email "grace", Password empty → Next', output: 'Summary "There are 2 errors on this step"; Email has focus with "Enter an email address like name@example.com"' },
      { title: 'Cross-step rule', input: 'Plan = Business, then Edit workspace → Team size "Just me" → Save and review', output: 'Lands on Plan with "The Business plan needs a team of 2 or more…" and the Business radio focused' },
      { title: 'Persistence', input: 'Fill step 1, reach step 2, reload', output: 'Back on step 2 with every answer except the password; a note asks to re-enter it', explanation: 'Submitting without it sends you to step 1 with "Create a password".' },
      { title: 'Retry', input: 'onSubmit rejects with Error("server unavailable")', output: 'Alert "Could not create your account: server unavailable…", Create account focused; clicking again succeeds' },
    ],
    manualTests: [
      'Press Enter in the Full name field on an empty form: errors appear and focus stays in the form.',
      'With a screen reader, press Next with errors: the summary is announced and the focused field reads its error as its description.',
      'Double-click Create account quickly: only one request is made (check the console / network).',
      'Reload on step 3 (with sessionStorage available): you return to step 3; DevTools → Application shows no password stored.',
      'Use an email starting with "taken@" in the preview: the error appears; fix it via Edit account and resubmit.',
    ],
  },
  files: {
    entry: '/App.tsx',
    starter: { ...shared, '/SignupWizard.tsx': starterWizard, '/validation.ts': starterValidation },
    solution: { ...shared, '/SignupWizard.tsx': solutionWizard, '/validation.ts': solutionValidation },
    readonly: ['/App.tsx', '/types.ts', '/steps.ts'],
    support: {},
  },
  tests: [
    { path: '/tests/helpers.tsx', visibility: 'public', kind: 'runtime', source: helpers },
    { path: '/tests/validation.test.ts', visibility: 'public', kind: 'runtime', source: validationTests },
    { path: '/tests/public.test.tsx', visibility: 'public', kind: 'runtime', source: publicTests },
    { path: '/tests/validation.hidden.test.ts', visibility: 'hidden', kind: 'runtime', source: validationHiddenTests },
    { path: '/tests/hidden.test.tsx', visibility: 'hidden', kind: 'runtime', source: hiddenTests },
  ],
  hints: [
    'Start with validation.ts: each validator builds an `errors` object field by field using MESSAGES and returns it; `validateStep` is a lookup table by step id; `firstInvalidStep` walks STEPS and returns the first id whose errors are non-empty.',
    'Shape the reducer state as `{ stepIndex, data, attempted: StepId[], returnToReview, submit: { status: "idle" | "pending" | "error" | "success" }, focus }`. Derive `errors = attempted.includes(step) ? validateStep(step, data) : {}` during render — don\'t store errors.',
    'Focus is a side effect: let the reducer record a focus request (`{ kind: "heading" }` or `{ kind: "field", field }`, a new object each time) and run `element.focus()` in an effect keyed on that request. For "first invalid field", walk the step\'s `fields` in order and pick the first with an error.',
    'Submit: `preventDefault()`, return early if a `useRef` in-flight flag is set (state is not updated until the next render), re-validate with `firstInvalidStep`, then `await onSubmit(normalize(data))` inside try/catch/finally. Wrap every storage call in try/catch and strip `password` before saving.',
  ],
  solution: {
    initialApproach:
      'Treat the wizard as a small state machine: one reducer owns the step, the answers, which steps have been attempted, whether we are editing from review, the submit status and focus requests. Validation is a set of pure functions over the whole answer object; errors are derived from data at render time. Side effects — focusing, persisting, calling the API — happen in effects and the submit handler, never in the reducer.',
    bruteForce:
      'A common first attempt keeps one `useState` per field inside each step component and a `step` number in the parent. Going Back unmounts the step and loses its answers (or forces lifting everything later), validation is duplicated in handlers, errors are stored in state and drift out of sync with values, the "Next" button calls `setStep(step + 1)` before validation finishes, and a disabled-button-only guard still lets Enter submit twice.',
    optimizedApproach: `**One reducer, derived errors, focus requests, guarded side effects.**

- **State**: \`{ stepIndex, data, attempted, returnToReview, submit, restored, focus }\`. \`submit\` is a discriminated union (\`idle | pending | error(message) | success\`), so impossible combinations can't be represented.
- **Derived errors**: \`errors = attempted.includes(step) ? validateStep(step, data) : {}\`. No error state to keep in sync; live updates after the first attempt come for free.
- **Next** in the reducer: invalid → mark attempted and request focus on the first invalid field; valid → next step (or back to review when editing, after checking \`firstInvalidStep\` for cross-step breakage) and request heading focus.
- **Focus requests** are data (a fresh object per request), executed by one effect after the DOM for the target step exists.
- **Submit**: synchronous \`useRef\` in-flight guard → re-validate everything → \`submitStart\` → \`await onSubmit(normalize(data))\` → \`submitSuccess\` or \`submitError(message)\`. The button uses \`aria-disabled\` rather than \`disabled\` while pending so it keeps focus and stays announced.
- **Persistence**: lazy reducer initialiser restores from storage (validated field by field); an effect writes \`{ v, step, data − password }\` and removes it after success; every access is in try/catch, and the default probes \`sessionStorage\` once.`,
    walkthrough: `1. **validation.ts**: three step validators returning \`FieldErrors\`, a \`VALIDATORS\` lookup for \`validateStep\`, \`firstInvalidStep\` iterating \`STEPS\`, and \`normalize\` trimming three fields.
2. **init(storage)** (third argument of \`useReducer\`): parse the saved JSON, check \`v\`, map the step id to an index, copy only known fields with the right types/enum values, never a password.
3. **Reducer actions**: \`change\`, \`next\`, \`back\`, \`edit\`, \`showInvalid\`, \`submitStart\`, \`submitSuccess\`, \`submitError\`. While pending or after success, data-changing actions are ignored.
4. **showInvalid(state, step)**: set \`stepIndex\`, add the step to \`attempted\`, keep/enable \`returnToReview\` when jumping from elsewhere, request focus on \`firstErrorField\`.
5. **Render**: \`<form noValidate aria-labelledby aria-busy onSubmit>\` → title → progress nav (\`aria-current="step"\`) → step heading (\`tabIndex={-1}\`) → optional "restored" notice → error summary (\`role="alert"\`, links that focus fields) → the current step's fields → submit error alert → Back / primary button.
6. **Fields**: label + optional hint + input with \`aria-invalid\` and \`aria-describedby="hintId errorId"\`; the plan radios live in a \`<fieldset>\` with a \`<legend>\`; the focusable id goes on the checked radio (or the first).
7. **Effects**: one runs focus requests; one persists on \`[stepIndex, data, submit.status]\`.
8. **Success** replaces the form with a focused "Account created" heading.`,
    complexity:
      'Every render validates at most one step: O(f) for f fields. Submitting validates all steps once: O(total fields). Persisting serialises the answers on each change (small; debounce for big forms). Rendering mounts only the current step.',
    edgeCases:
      '- Restored session on a later step without the password → final submit sends the user to step 1 with "Create a password" (and a notice explains why).\n- Edits that invalidate another step (Business plan vs. solo team) → caught on "Save and review" and on submit.\n- Double click / Enter while pending → in-flight ref guard.\n- `sessionStorage` throwing (sandboxed iframe, blocked cookies, quota) → treated as "no storage".\n- Corrupt or tampered saved JSON → ignored, enum values checked.\n- Whitespace-only names and workspace names; exactly-8-character passwords; passwords with spaces (not trimmed).\n- The focused submit button becoming disabled → avoided with aria-disabled.\n- Unmount while the request is in flight (navigation away) → in React 18 the late dispatch is harmless; an AbortSignal would let the request be cancelled.',
    alternatives:
      '- **Per-step components with their own state** lifted on Next: fine with a parent store, but you must commit on Back too or lose edits.\n- **Uncontrolled inputs + FormData** read on Next: fewer renders, but you must keep data for unmounted steps somewhere and can\'t derive live errors as easily.\n- **Schema libraries** (Zod/Yup) for validation and react-hook-form for field state — less code, same principles (per-step schema, cross-field refinement).\n- **React 19 form actions** (`<form action={fn}>`, `useActionState`, `useFormStatus`): the pending state and progressive enhancement come built in, and server functions can validate on the server; you still need per-step client validation and focus management.\n- **URL-driven steps** (`?step=2`): Back/forward buttons and deep links work; you must guard direct entry to later steps.\n- **Native constraint validation** (`required`, `type=email`, `setCustomValidity`) with `noValidate` removed: free browser bubbles, but they are inconsistent across screen readers and hard to style; many teams use the Constraint Validation API for checks but render their own messages.',
    tradeoffs:
      '- Errors on Next (and live afterwards) vs. on blur: fewer interruptions, but the user learns about problems later.\n- A role="alert" summary plus focus on the first field gives two cues; some teams instead focus the summary itself (GOV.UK style) and let its links move focus — one announcement, one extra keystroke.\n- The alert re-renders as errors are fixed; some screen readers re-announce it. Rendering a static summary only at attempt time avoids that at the cost of staleness.\n- aria-disabled keeps focus and discoverability but requires a JS guard; disabled is simpler but drops focus to <body>.\n- sessionStorage limits exposure to the tab and still survives reloads; localStorage would survive restarts but keeps personal data around longer. Either way, never store secrets.\n- Re-validating everything at submit duplicates work but is the only safe answer once data can be restored or edited out of order.',
    commonMistakes:
      '- Losing data on Back because each step owns its own state.\n- Advancing before validating, or validating the whole form on step 1.\n- Storing errors in state and forgetting to clear them; or showing errors while the user types the first character.\n- Error text that is not linked with aria-describedby, or aria-invalid left "true" after the fix.\n- Always focusing the first field instead of the first *invalid* field.\n- No focus management on step change, so screen-reader users don\'t know the content changed.\n- Missing `preventDefault`, so the browser navigates/reloads on Enter.\n- A disabled button as the only double-submit protection.\n- Persisting the password, or reading sessionStorage without try/catch (it throws in sandboxed iframes and some privacy modes).\n- Trusting restored data without validating it again at submit.',
    testingStrategy:
      '- Validators: table-like boundary tests (lengths 7/8, 2/3/40/41, email shapes), cross-step rules, purity on frozen input, and `normalize` leaving the password untouched.\n- Component: drive it like a user with labels and roles; assert `aria-current`, `aria-invalid`, the text referenced by `aria-describedby`, the alert summary and `toHaveFocus` after every navigation.\n- Async: control the promise with `deferred()` to assert the pending UI, then resolve/reject and `await flush()`; assert call counts for the double-submit guard (click + submit event while pending).\n- Persistence: inject an in-memory storage, unmount and re-render to simulate a reload, inspect stored strings for the password, and use a throwing storage and corrupt JSON for robustness.\n- `fireEvent.submit` returns false when the handler called preventDefault — a cheap guard against accidental navigation.',
    seniorFollowUps:
      '- Map server-side field errors ("email already registered") to the right step and field, and focus it.\n- Make steps URL-addressable without letting users skip validation.\n- Conditional steps (e.g. company details only for Business) — how does the reducer and the indicator change?\n- Migrate to React 19 actions: what do `useActionState`/`useFormStatus` replace, and what stays custom?\n- Autosave drafts to the server with debouncing and conflict handling across tabs.\n- Analytics: measure drop-off per step without logging personal data.',
  },
  followUps: [
    { id: 'f1', level: 'definition', question: 'What do aria-invalid and aria-describedby each communicate, why are both needed on an invalid field, and where do they go for a radio group?', expectedConcepts: ['aria-invalid announces the invalid state', 'aria-describedby links the message as the description', 'visual error alone is not perceivable', 'remove aria-invalid when fixed', 'fieldset + legend name the radio group; mark the radios and reference the group message'], sourceIds: ['mdn-aria-invalid', 'mdn-fieldset', 'mdn-constraint-validation'] },
    { id: 'f2', level: 'mechanism', question: 'Why is the in-flight guard a ref rather than a check of `state.submit.status`?', expectedConcepts: ['state updates are applied on the next render', 'two events before a re-render see the same state', 'refs update synchronously', 'a disabled button does not stop Enter'], sourceIds: ['react-refs', 'react-queueing'] },
    { id: 'f3', level: 'application', question: 'The server rejects the signup with { field: "email", message: "already registered" }. Change the design to surface it correctly.', expectedConcepts: ['map field to its step', 'store server errors separately from derived client errors', 'navigate and focus the field', 'clear the server error when the value changes'], sourceIds: ['wai-multipage-forms'] },
    { id: 'f4', level: 'edge-cases', question: 'What can go wrong when restoring a saved wizard from sessionStorage, and how does the solution defend against it?', expectedConcepts: ['storage access can throw', 'corrupt or tampered JSON', 'schema/version changes', 'password intentionally missing', 're-validate everything at submit'], sourceIds: ['mdn-iframe'] },
    { id: 'f5', level: 'production', question: 'How would you rebuild this with React 19 form actions, and what would still need custom code?', expectedConcepts: ['useActionState for pending/result', 'useFormStatus inside the form', 'FormData instead of controlled state', 'per-step validation and focus management stay custom', 'progressive enhancement with server functions'], sourceIds: ['react-19-release', 'react-useactionstate', 'react-form'] },
    { id: 'f6', level: 'architecture', question: 'Product wants 15 configurable steps with branching, shared across three apps. How do you architect it?', expectedConcepts: ['config/schema-driven steps', 'per-step validators and conditions', 'state machine for transitions', 'headless hook + renderer separation', 'URL and persistence adapters'], sourceIds: ['react-custom-hooks', 'wai-multipage-forms'] },
  ],
  mcqs: [
    {
      id: 'm1',
      question: 'Next is pressed on a step where the Email and Password fields are invalid but Full name is valid. What should happen for keyboard and screen-reader users?',
      options: [
        { id: 'a', text: 'Focus stays on the Next button; red borders appear on the invalid fields', explanation: 'Colour alone is not perceivable to everyone, and nothing tells a screen-reader user what went wrong or where.' },
        { id: 'b', text: 'Focus moves to Email, which has aria-invalid="true" and aria-describedby pointing at its message; an alert summary lists both errors', explanation: 'Correct — the user lands on the first problem, hears its error as the field description, and the summary gives the overview.' },
        { id: 'c', text: 'Focus moves to Full name because it is the first field of the step', explanation: 'Full name is valid; jumping there makes the user tab to find the actual problem.' },
        { id: 'd', text: 'A window.alert() lists the errors', explanation: 'Modal browser alerts are disruptive, unstyled and lose the association with each field.' },
      ],
      correctOptionId: 'b',
      explanation: 'Combine an announced summary with programmatic error association (aria-invalid + aria-describedby) and move focus to the first invalid field so users can fix errors efficiently.',
      sourceIds: ['mdn-aria-invalid', 'wai-multipage-forms'],
    },
    {
      id: 'm2',
      question: 'The handler below runs on submit. A user double-clicks "Create account" very quickly. Why can onSubmit run twice?',
      code: `async function handleSubmit(e) {
  e.preventDefault();
  if (state.submit.status === 'pending') return;
  dispatch({ type: 'submitStart' });
  await onSubmit(data);
}`,
      options: [
        { id: 'a', text: 'Because dispatch is asynchronous and throws away the first action', explanation: 'Dispatch queues the update; it is not discarded.' },
        { id: 'b', text: 'Because both events can run before React re-renders, so both handlers read the same "idle" state from their closure', explanation: 'Correct — the new state is only visible in the next render. A ref flag set synchronously closes that window.' },
        { id: 'c', text: 'Because preventDefault() re-dispatches the event', explanation: 'preventDefault only cancels the default action (navigation).' },
        { id: 'd', text: 'It cannot; React batches the two clicks into one event', explanation: 'Batching merges state updates within one event; two separate events still run two handlers.' },
      ],
      correctOptionId: 'b',
      explanation: 'State values captured in a render are snapshots. Guard re-entrancy with something that changes synchronously (a ref), and still disable/aria-disable the button for feedback.',
      sourceIds: ['react-queueing', 'react-refs'],
    },
    {
      id: 'm3',
      question: 'Which data is appropriate to persist in sessionStorage so the wizard survives a reload?',
      options: [
        { id: 'a', text: 'Everything, including the password, so the user does not retype anything', explanation: 'Secrets at rest in web storage are readable by any script on the origin (e.g. via XSS) and outlive the form.' },
        { id: 'b', text: 'The current step and the non-secret answers, cleared after successful submission', explanation: 'Correct — enough to resume, nothing secret, and removed as soon as it is no longer needed.' },
        { id: 'c', text: 'Nothing: web storage is always unavailable inside iframes', explanation: 'It is unavailable in opaque-origin (sandboxed) frames and can be blocked — so guard it — but it works in ordinary pages.' },
        { id: 'd', text: 'Only the validation errors, so they can be shown again', explanation: 'Errors are derived from data; storing them adds state that can drift out of sync.' },
      ],
      correctOptionId: 'b',
      explanation: 'Persist the minimum needed to resume, never credentials, and clear it on success. Access to storage can throw, so wrap it in try/catch and treat restored data as untrusted input.',
      sourceIds: ['wai-multipage-forms', 'mdn-iframe'],
    },
  ],
};

export default problem;
