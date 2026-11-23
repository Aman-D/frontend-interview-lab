# Architecture

Frontend Interview Lab is a **local-first single-page app**. There is no backend: content is bundled at build time, user data lives in IndexedDB, and candidate code runs in an isolated iframe inside the browser.

```
┌──────────────────────────── App origin (trusted) ────────────────────────────┐
│ React 18 + React Router + Tailwind                                            │
│  pages/  Dashboard · Library · Problem detail · Workspace · Concepts ·       │
│          Revision · History · Notes · Sources · Settings                      │
│  content/  Zod-validated question bank, concepts, source registry            │
│  db/       Dexie (IndexedDB): attempts, drafts, progress, notes, concepts…   │
│  runtime/  compilerClient ──postMessage──► compiler.worker (TypeScript)      │
│            sandbox.ts ─────postMessage──► ┌─────────── sandbox iframe ──────┐ │
│                                           │ opaque origin (no same-origin)  │ │
│                                           │ harness.js: module loader,      │ │
│                                           │ test API, fake timers, console  │ │
│                                           │ React UMD + Testing Library DOM │ │
│                                           └─────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────────────┘
```

## Runtime decisions (Phase 0 evaluation)

| Option | Finding | Decision |
|---|---|---|
| **Sandpack** (`sandpack.codesandbox.io/docs`, accessed 2026-11-23) | Bundling happens in a remotely hosted bundler iframe (self-hosting is possible but is a separate deployment). Fails the offline / no-backend requirement, and its test runner is Jest-in-browser tied to that bundler. | **Not used.** Documented as the upgrade path if npm-package support becomes a requirement. |
| **Monaco Editor** | Works fully offline when bundled (workers via Vite `?worker`). TS language service gives IntelliSense; React types and harness globals are added as extra libs. | **Used** for editing and diffs (`@monaco-editor/react` with `loader.config({ monaco })`, no CDN). |
| **TypeScript compiler API** in a Web Worker | `transpileModule` for TS/TSX → CommonJS (fast, per file), `createProgram` with an in-memory host for real type-checking. Lib `.d.ts` files are bundled and lazy-loaded. | **Used** for all compilation and for type-level tests. Candidate code is only parsed/type-checked here, never executed. |
| **Custom transformer** | Inserts `__lg()` at the start of every loop body. | **Used** as an infinite-loop guard. |
| **Sandboxed iframe** (`sandbox="allow-scripts allow-forms"`, no `allow-same-origin`; forms so `onSubmit` fires) | Opaque origin → no access to app IndexedDB/localStorage/cookies/DOM. A fresh frame per run, destroyed after 20 s. | **Used** for every execution (preview and tests). |
| Web Worker for JS-only problems | Could be terminated on infinite loops, but would not share the test API/DOM; the loop guard already covers sync loops. | Not used in v1. |

### How a test run works
1. `runTests()` merges candidate files + test files, sends them to the compiler worker.
2. Syntax errors → status `compile-error`, nothing executes.
3. For `ts-types` problems the worker type-checks the project; diagnostics are mapped onto `// @test:` segments (`evaluateTypeTests`). Unused `@ts-expect-error` (TS2578) fails a "must not compile" case.
4. Runtime tests: a hidden sandbox iframe receives transpiled CommonJS modules. `harness.js` provides `describe/it/expect`, `fn()` mocks, fake timers (`timers.useFake/advance`), `flush()`, `deferred()`, Testing Library queries, `render()` (React, wrapped in `act`) and `mount()` (vanilla DOM). Each test has a 5 s timeout; a run has a 20 s wall-clock limit.
5. Results stream back via `postMessage` (accepted only from that frame's window) and are stored on the attempt as a `RunSummary`.

Hidden tests are executed but their source and failure messages are only shown after submission.

### Vanilla DOM problems
`index.html`'s body (scripts stripped), CSS files and the entry script are mounted by `mount()`. Only relative imports resolve — `react` is not available, so the "no frameworks" rule is enforced by the runtime.

## Data model

Content (`src/content/schema.ts`, version `CONTENT_SCHEMA_VERSION = 1`):
- `CodingProblem` / `OutputQuestion` (discriminated by `kind`) — stable `id`, `slug`, `track`, `execution`, difficulty, priority, seniority, topics, estimated minutes, `research` (provenance, frequency confidence, verification status, last verified, evidence with exact original titles + URLs, notes), full spec (clarifications, scope, categorised MUST/SHOULD/OPTIONAL requirements, constraints, acceptance criteria, examples, manual tests), starter/solution/support files, tests, hints, solution sections, concept ids, follow-ups, MCQs.
- `Concept` — definition, rationale, mechanism, example, walkthrough, misconceptions, failure cases, production implications, doc sources, interview questions, related concepts.
- `Source` registry (`sources.ts`) — every evidence/doc reference must resolve here (enforced by tests).

User data (`src/db`, Dexie `DB_VERSION = 1`) — kept separate from content:
- `attempts` — mode, status, timestamps, active time, persistent timer state, code snapshot, last run summary, requirements checked, hints revealed, solution revealed, confidence, mistakes, next revision date, outcome.
- `drafts` (autosaved code per problem), `progress` (needs-revision flag, revision date, interview-ready), `notes`, `concepts` (status), `mcqAnswers`, `followUps`, `kv`.

### Outcome rules (`src/lib/progress.ts`)
- Any hint or solution view ⇒ **assisted** (never "independently solved").
- No help + last run executed and passed every public **and** hidden test ⇒ **independently solved & tested**.
- No help otherwise ⇒ **independently solved**.
- Submitting re-runs the tests if the code changed since the last run, so the outcome reflects the final code.
- **Interview-ready** is only ever set by the user, and only when an attempt is independent-tested, self-rated ≥ 4 and has every MUST requirement checked. A later assisted/failing submission revokes it.
- Concepts can be marked **Understood** only with evidence (independent solve, correct MCQ, or a follow-up self-rated "solid").

## Verification pipeline
- `npm test` (Vitest): schemas, source traceability, content integrity, executed output-prediction answers (Node `vm`, jsdom, React 18), compiler/type-test evaluation, persistence (fake-indexeddb), timer, filtering, outcome rules.
- `npm run verify:solutions`: builds the app, opens `/__verify` in Chromium, runs every reference solution and starter through the real runner, writes `src/content/verification.generated.json`, rebuilds.
- `npm run test:e2e`: drives the built app (pages, filtering, interview-mode hiding, sandboxed test runs, autosave across reload, submission outcome, reveal confirmation, notes persistence, output prediction, sandbox isolation, loop guard).

## Known limitations
- Only `react`/`react-dom` are importable in the sandbox (no npm packages).
- The loop guard covers loops in candidate code; deep recursion surfaces as a stack overflow; a busy loop inside a library could still block the sandbox until the run is destroyed. Same-process iframes share the main thread while blocked.
- Fake timers do not patch `requestAnimationFrame`, `queueMicrotask` or `performance.now`.
- Free-text follow-ups are self-assessed; no automated grading is claimed.
