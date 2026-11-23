# Research sources

Access date for every source below: **2026-11-23**. "Accessible" means the page returned HTTP 200 and its content was inspected in this session (curl, or headless Chromium for JavaScript-rendered pages). Raw title extractions are in [`raw/`](./raw).

## Interview-question sources

| ID | Source | URL | Category | Accessible | What was used |
|---|---|---|---|---|---|
| `bfe-problems` | BFE.dev — JavaScript coding problems | https://bigfrontend.dev/problem | Practice platform | Yes | 179 problem titles + URLs ([raw](./raw/bfe-javascript-problems.md)) |
| `bfe-quiz` | BFE.dev — JavaScript quizzes | https://bigfrontend.dev/quiz | Practice platform | Yes | 135 quiz titles ([raw](./raw/bfe-javascript-quizzes.md)) — topics only, no snippets copied |
| `bfe-ts` | BFE.dev — TypeScript problems | https://bigfrontend.dev/typescript | Practice platform | Yes | 62 titles ([raw](./raw/bfe-typescript-problems.md)) |
| `bfe-react` | BFE.dev — React problems | https://bigfrontend.dev/react | Practice platform | Yes | 16 titles ([raw](./raw/bfe-react-problems.md)) |
| `fih-ui` | Front End Interview Handbook — User interface coding | https://www.frontendinterviewhandbook.com/coding/build-front-end-user-interfaces | Interview handbook | Yes | Named UI questions + evaluation considerations |
| `fih-js` | Front End Interview Handbook — JavaScript coding | https://www.frontendinterviewhandbook.com/coding/javascript-utility-function | Interview handbook | Yes | Basic/advanced examples, expected durations |
| `fih-sd-ui` | Front End Interview Handbook — UI component system design | https://www.frontendinterviewhandbook.com/front-end-system-design/ui-components | Interview handbook | Yes | Component design examples |
| `fih-repo` | yangshun/front-end-interview-handbook (GitHub) | https://github.com/yangshun/front-end-interview-handbook | Interview handbook (source) | Partially — github.com HTML was blocked (403) early in the session; the published site above was used instead | — |
| `fg-mc` | FrontendGeek — Machine Coding Round Interview | https://www.frontendgeek.com/frontend-interview/machine-coding-interview | Curated resource hub | Yes | Component/app machine-coding topic list |
| `alla-components` | allahabadi.dev — 16 Frontend System Design Interview Questions (components) | https://allahabadi.dev/frontend-system-design/components/ | Blog / system-design guide | Yes | 16 component design titles |
| `gfe` | GreatFrontEnd (blog, playbook, question lists) | https://www.greatfrontend.com/ | Practice platform | **No — INACCESSIBLE** (HTTP 429 Vercel bot checkpoint, Code 21) | Nothing read directly. GFE titles are cited only via `fih-*`, which names them. |

**No `VERIFIED_INTERVIEW_REPORT` sources were collected in this phase.** The handbook's company-specific pages (e.g. "Google interview questions") exist but were not used, because their attribution methodology could not be verified. No question in this project claims that a particular company asks it.

## Technical validation sources (official documentation)

All returned HTTP 200 on 2026-11-23 (checked with `curl -L`; see methodology).

| ID | Title | URL |
|---|---|---|
| `mdn-abortcontroller` | MDN — AbortController | https://developer.mozilla.org/en-US/docs/Web/API/AbortController |
| `mdn-promise-all` | MDN — Promise.all() | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all |
| `mdn-microtask` | MDN — Using microtasks | https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide |
| `mdn-event-loop` | MDN — Event loop / execution model | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Event_loop |
| `mdn-debounce` | MDN Glossary — Debounce | https://developer.mozilla.org/en-US/docs/Glossary/Debounce |
| `mdn-let` | MDN — let (TDZ) | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let |
| `mdn-this` | MDN — this | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this |
| `mdn-closures` | MDN — Closures | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures |
| `mdn-hoisting` | MDN Glossary — Hoisting | https://developer.mozilla.org/en-US/docs/Glossary/Hoisting |
| `mdn-equality` | MDN — Equality (==) | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Equality |
| `mdn-object-is` | MDN — Object.is() | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is |
| `mdn-prototype` | MDN — Inheritance and the prototype chain | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Inheritance_and_the_prototype_chain |
| `mdn-event-bubbling` | MDN — Event bubbling | https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Event_bubbling |
| `mdn-stoppropagation` | MDN — Event.stopPropagation() | https://developer.mozilla.org/en-US/docs/Web/API/Event/stopPropagation |
| `mdn-details` | MDN — `<details>` | https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/details |
| `mdn-map` | MDN — Map | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map |
| `mdn-iframe` | MDN — `<iframe>` (sandbox attribute) | https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe |
| `mdn-settimeout` | MDN — setTimeout() | https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout |
| `mdn-queuemicrotask` | MDN — queueMicrotask() | https://developer.mozilla.org/en-US/docs/Web/API/Window/queueMicrotask |
| `mdn-aria-activedescendant` | MDN — aria-activedescendant | https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-activedescendant |
| `mdn-structuredclone` | MDN — structuredClone() | https://developer.mozilla.org/en-US/docs/Web/API/structuredClone |
| `mdn-postmessage` | MDN — Window.postMessage() | https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage |
| `apg-combobox` | WAI-ARIA APG — Combobox pattern | https://www.w3.org/WAI/ARIA/apg/patterns/combobox/ |
| `apg-treeview` | WAI-ARIA APG — Tree View pattern | https://www.w3.org/WAI/ARIA/apg/patterns/treeview/ |
| `apg-accordion` | WAI-ARIA APG — Accordion pattern | https://www.w3.org/WAI/ARIA/apg/patterns/accordion/ |
| `apg-tabs` | WAI-ARIA APG — Tabs pattern | https://www.w3.org/WAI/ARIA/apg/patterns/tabs/ |
| `react-queueing` | react.dev — Queueing a series of state updates | https://react.dev/learn/queueing-a-series-of-state-updates |
| `react-preserving-state` | react.dev — Preserving and resetting state | https://react.dev/learn/preserving-and-resetting-state |
| `react-sync-effects` | react.dev — Synchronizing with Effects | https://react.dev/learn/synchronizing-with-effects |
| `react-updating-objects` | react.dev — Updating objects in state | https://react.dev/learn/updating-objects-in-state |
| `react-rendering-lists` | react.dev — Rendering lists (keys) | https://react.dev/learn/rendering-lists |
| `react-useeffect` | react.dev — useEffect reference | https://react.dev/reference/react/useEffect |
| `ts-generics` | TS Handbook — Generics | https://www.typescriptlang.org/docs/handbook/2/generics.html |
| `ts-conditional` | TS Handbook — Conditional types | https://www.typescriptlang.org/docs/handbook/2/conditional-types.html |
| `ts-mapped` | TS Handbook — Mapped types | https://www.typescriptlang.org/docs/handbook/2/mapped-types.html |
| `ts-narrowing` | TS Handbook — Narrowing | https://www.typescriptlang.org/docs/handbook/2/narrowing.html |
| `ts-keyof` | TS Handbook — keyof | https://www.typescriptlang.org/docs/handbook/2/keyof-types.html |
| `ts-template-literal` | TS Handbook — Template literal types | https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html |
| `ts-utility` | TS Handbook — Utility types | https://www.typescriptlang.org/docs/handbook/utility-types.html |
| `tl-queries` | Testing Library — About queries | https://testing-library.com/docs/queries/about |
| `mdn-try-catch` | MDN — try...catch | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch |
| `mdn-addeventlistener` | MDN — EventTarget.addEventListener() | https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener |
| `tl-fake-timers` | Testing Library — Using fake timers | https://testing-library.com/docs/using-fake-timers/ |
| `apg-dialog-modal` | WAI-ARIA APG — Dialog (Modal) pattern | https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/ |
| `apg-carousel` | WAI-ARIA APG — Carousel pattern | https://www.w3.org/WAI/ARIA/apg/patterns/carousel/ |
| `apg-radio` | WAI-ARIA APG — Radio Group pattern | https://www.w3.org/WAI/ARIA/apg/patterns/radio/ |
| `apg-sortable-table` | WAI-ARIA APG — Sortable Table example | https://www.w3.org/WAI/ARIA/apg/patterns/table/examples/sortable-table/ |
| `mdn-live-regions` | MDN — ARIA live regions | https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions |
| `mdn-dialog` | MDN — &lt;dialog&gt; | https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog |
| `mdn-inert` | MDN — inert attribute | https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inert |
| `mdn-reduced-motion` | MDN — prefers-reduced-motion | https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion |
| `mdn-img` | MDN — &lt;img&gt; (loading, decoding, alt) | https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img |
| `mdn-array-sort` | MDN — Array.prototype.sort() | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort |
| `mdn-intl-collator` | MDN — Intl.Collator | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Collator |
| `react-create-portal` | react.dev — createPortal | https://react.dev/reference/react-dom/createPortal |
| `react-no-effect` | react.dev — You Might Not Need an Effect | https://react.dev/learn/you-might-not-need-an-effect |
| `react-context` | react.dev — Passing Data Deeply with Context | https://react.dev/learn/passing-data-deeply-with-context |
| `react-sharing-state` | react.dev — Sharing State Between Components (controlled vs uncontrolled) | https://react.dev/learn/sharing-state-between-components |
| `webdev-inp` | web.dev — Optimize INP | https://web.dev/articles/optimize-inp |

## Execution-environment references

| ID | Title | URL | Accessible |
|---|---|---|---|
| `sandpack-docs` | Sandpack docs | https://sandpack.codesandbox.io/docs | Yes |
| `sandpack-client` | Sandpack client (advanced usage) | https://sandpack.codesandbox.io/docs/advanced-usage/client | Yes |
| `monaco` | Monaco Editor | https://microsoft.github.io/monaco-editor/ | Yes |

The machine-readable version of this registry lives in `src/content/sources.ts`; a Vitest suite checks that every source referenced by a question exists in the registry.
