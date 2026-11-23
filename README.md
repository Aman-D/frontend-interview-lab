# Frontend Interview Lab

A local-first, research-backed practice environment for **Senior Frontend / SDE-2 / SDE-3 / MTS** interviews: real coding environments, executable tests, hidden-until-you-choose solutions, persistent notes and honest progress tracking.

- **No backend.** Content is bundled; your progress, code and notes live in your browser's IndexedDB. Export/import from Settings.
- **Works offline** once loaded: Monaco, the TypeScript compiler and the React runtime are bundled locally (no CDNs).
- **Isolated execution.** Your code runs in a fresh `<iframe sandbox="allow-scripts">` with an opaque origin — it cannot touch the app's storage.
- **Nothing is invented.** Every question shows its sources and classification; every dashboard number comes from your recorded activity; every "passed" is an actual test execution.

## Quick start

Requires Node.js ≥ 20.

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:5173.

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Type-check (`tsc -b`) + production build to `dist/` |
| `npm run preview` | Serve the production build |
| `npm test` | Vitest unit/content tests (schemas, sources, executed output answers, persistence, timer, filters, outcome rules, compiler) |
| `npm run verify:solutions` | Build, then run **every reference solution and starter** through the real in-browser runner in Chromium; writes `src/content/verification.generated.json` and rebuilds |
| `npm run test:e2e` | End-to-end smoke test of the built app in Chromium (run `npm run build` first) |

`verify:solutions` and `test:e2e` use Playwright's Chromium (`npx playwright install chromium` if it is not already available).

## What's inside

| Track | Implemented (full content + verified) | Researched candidates |
|---|---|---|
| React machine coding | Autocomplete / Typeahead, File Explorer, Data Table, Modal Dialog, Tabs, Toast, Image Carousel, Star Rating | 30 |
| Vanilla JS / DOM | Accessible Accordion, Event Delegation | 20 |
| JavaScript & polyfills | debounce, Promise.all, curry, Event Emitter | 30 |
| TypeScript | ReturnType/Parameters (`infer`), Type-safe Event Emitter | 20 |
| Output prediction | 19 questions (event loop, hoisting/TDZ, closures, `this`, coercion, prototypes, finally, event propagation, React batching/effects/keys) | 19 implemented, 50+ targeted |

Plus **42 concept pages**, each with mechanism, misconceptions, failure cases, production implications and official-doc links.

Each coding problem has: interviewer-style description, clarification questions (why + default assumption), scope decisions, MUST/SHOULD/OPTIONAL requirements by category, acceptance criteria, public + hidden tests, progressive hints, a 12-part solution (approaches, full code, walkthrough, complexity, edge cases, alternatives, trade-offs, mistakes, testing strategy, senior follow-ups), follow-up questions from definition → architecture, MCQs with per-option explanations, and sources.

### Practice modes
- **Study** — hints and concepts available; the solution needs an explicit, confirmed, recorded reveal.
- **Interview** — optional countdown (30/45/60/90 min); hints and solution are not rendered until you submit; final review afterwards.
- **Revision** — re-attempt with your previous mistakes visible; compare code between attempts in Attempt History (Monaco diff).

### Honest progress
- Viewing a hint or the solution makes an attempt **"Completed with help"** — never "independently solved".
- **"Independently solved & tested"** requires an actual run where every public *and* hidden test passed (tests are re-run on submit if code changed).
- **Interview-ready** is never automatic — you can only mark it when an independent, fully-tested attempt with all MUST requirements and confidence ≥ 4 exists.
- Concepts can only be marked **Understood** with evidence (independent solve, correct MCQ, or a follow-up you rated "solid").

### Keyboard shortcuts (workspace)
`Ctrl/⌘+Enter` run tests · `Ctrl/⌘+Shift+Enter` run/refresh preview · `Ctrl/⌘+S` save · `Ctrl/⌘+Shift+M` maximise editor.

## Research & sourcing
See [`docs/research/`](docs/research):
- [`sources.md`](docs/research/sources.md) — every source, access date, and whether it was actually accessible
- [`question-catalog.md`](docs/research/question-catalog.md) — 119 researched candidates with evidence, provenance, confidence, duplicates
- [`verification-methodology.md`](docs/research/verification-methodology.md) — how sources and answers were verified
- [`coverage-gaps.md`](docs/research/coverage-gaps.md) — what is missing and why
- [`raw/`](docs/research/raw) — title/URL extractions from the inspected pages

Practice-platform listings show that a topic appears in interview *preparation*; they are not evidence that any particular company asks it. No company attributions are made.

## Architecture
See [`docs/architecture.md`](docs/architecture.md) (runtime evaluation incl. why Sandpack was not used, data model, outcome rules, verification pipeline, limitations).

```
src/
  content/      schema.ts (Zod), sources.ts, concepts.ts, problems/<id>/{index.ts,starter,solution,tests}, output/questions.ts
  runtime/      compiler.worker.ts, compilerCore.ts, loopGuard.ts, sandbox.ts, runProject.ts
  db/           Dexie schema, repository (attempts, drafts, progress, notes, export/import)
  lib/          progress rules, timer, filters, notes export
  workspace/    coding + output-prediction workspaces, panels
  pages/        routes
public/runner/  sandbox page + harness.js (test API, fake timers, module loader)
scripts/        verify-solutions.mjs, e2e-smoke.mjs, copy-runtime-vendor.mjs
```

## Adding a problem
1. Research it first: add evidence (exact original title + URL from an inspected source) to `docs/research/question-catalog.md` and, if new, the source to `sources.md` + `src/content/sources.ts`.
2. Create `src/content/problems/<id>/` following an existing problem (`index.ts`, `starter/`, `solution/`, `tests/`), register it in `src/content/index.ts`.
3. `npm test` (schema + traceability) and `npm run verify:solutions` (solution passes everything, starter fails something).

## Agent skills
`.claude/skills/design-taste-frontend/` vendors [Taste Skill](https://www.tasteskill.dev/) v2.5.1 (MIT) for Claude Code UI work — see its `SOURCE.md` for the pinned commit, requirements (Node 22+, Chrome; `CHROME_PATH=/opt/pw-browsers/chromium` in cloud sessions) and how it applies to this app. Its working folder `.taste-skill/` is git-ignored.
