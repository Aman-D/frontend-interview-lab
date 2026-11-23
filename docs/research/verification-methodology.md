# Verification methodology

## 1. Source collection
1. Each primary source from the project brief was fetched on 2026-11-23.
   - Static pages: `curl -L` with a browser user agent; links extracted from the HTML.
   - JavaScript-rendered pages: headless Chromium (Playwright), `document.body.innerText` and all anchors captured.
2. A page counts as **accessible** only when it returned HTTP 200 and the text was inspected. Pages that failed are recorded as **INACCESSIBLE** with the error (see `sources.md`). Nothing is described from memory.
3. Only titles, URLs and short labels were recorded (`raw/`). No problem statements, solutions or quiz snippets were copied.

## 2. Classification rules
| Field | Rule |
|---|---|
| `VERIFIED_INTERVIEW_REPORT` | A specific, public, first-person interview report naming the question. **None collected yet.** |
| `PUBLISHED_PRACTICE_PROBLEM` | The problem (or a substantially equivalent one) is listed by name on an established practice platform or interview handbook. |
| `DOCUMENTED_TECHNICAL_EXERCISE` | Derived from behaviour documented in official docs (MDN, react.dev, TS handbook, WAI-ARIA APG). |
| `ORIGINAL_VARIATION` | Written for this project to test a concept or extend a listed problem; the parent source is cited. |

Frequency confidence (qualitative, not a probability):
- `HIGH_CONFIDENCE` — named by ≥ 2 *independent* sources (BFE.dev, the Front End Interview Handbook, FrontendGeek and allahabadi.dev are treated as independent of each other; GreatFrontEnd titles cited *through* the handbook are not counted separately from the handbook).
- `MEDIUM_CONFIDENCE` — one credible source.
- `LOW_CONFIDENCE` — only adjacent/indirect evidence, technically valuable.
- `UNKNOWN` — no public evidence found.

## 3. Content authoring rules
- Problem statements, requirements, solutions, tests, hints, MCQs and explanations are **original** to this project.
- Technical claims in concepts and solutions are checked against the official docs in `sources.md` and cite them.
- Company names are never attached to questions.

## 4. Automated verification (what is actually executed)
| What | How | Command |
|---|---|---|
| Content schema (every problem, concept, source) | Zod schemas, run in Vitest | `npm test` |
| Source traceability | Vitest asserts every `sourceId` used by a problem/MCQ/concept exists in `src/content/sources.ts`, and every URL is `https` | `npm test` |
| Output-prediction answers (plain JS) | Each snippet is executed in a fresh `node:vm` context with captured `console.log`; the captured output must equal the stored expected output | `npm test` |
| Output-prediction answers (DOM / React) | Executed in Vitest's jsdom environment with React 18 + `act` | `npm test` |
| Reference solutions (all coding problems) | The **real in-app runner** (sandboxed iframe + TypeScript compiler worker) is driven by Playwright in Chromium; every reference solution must pass all public + hidden tests, and every starter must fail at least one test (proves the tests can fail) | `npm run verify:solutions` |
| TypeScript type-level problems | The bundled TypeScript compiler type-checks the reference solution against the type tests (`Expect<Equal<…>>` and `@ts-expect-error` cases) inside the same runner | `npm run verify:solutions` |

`verify:solutions` writes `src/content/verification.generated.json` (timestamp, browser, pass/fail per test). The app shows that record on each problem page. If the file is missing or a problem failed, the app shows "not verified" — it never infers a pass.

## 5. Link checks
All documentation URLs used in `sources.ts` were checked with `curl -L` on 2026-11-23 (HTTP 200). One URL (`…/Global_attributes/sandbox`) returned 404 and was replaced with the `<iframe>` page.

## 6. Known limits of this methodology
- Practice-platform listings show that a topic is used in *preparation*, not how often real interviews use it.
- GreatFrontEnd could not be inspected directly (bot protection).
- Free-text follow-up answers are self-assessed; the app does not claim to grade them.
