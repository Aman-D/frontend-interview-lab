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
| `mdn-drag-drop` | MDN — HTML Drag and Drop API | https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API |
| `mdn-pointer-events` | MDN — Pointer events | https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events |
| `mdn-intersection-observer` | MDN — Intersection Observer API | https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API |
| `mdn-resize-observer` | MDN — ResizeObserver | https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver |
| `mdn-intl-datetimeformat` | MDN — Intl.DateTimeFormat | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat |
| `mdn-autocomplete-attr` | MDN — HTML autocomplete attribute | https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/autocomplete |
| `mdn-inputmode` | MDN — inputmode | https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inputmode |
| `mdn-paste-event` | MDN — Element: paste event | https://developer.mozilla.org/en-US/docs/Web/API/Element/paste_event |
| `mdn-popover-api` | MDN — Popover API | https://developer.mozilla.org/en-US/docs/Web/API/Popover_API |
| `mdn-overflow-anchor` | MDN — overflow-anchor (scroll anchoring) | https://developer.mozilla.org/en-US/docs/Web/CSS/overflow-anchor |
| `apg-tooltip` | WAI-ARIA APG — Tooltip pattern | https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/ |
| `apg-datepicker-dialog` | WAI-ARIA APG — Date Picker Dialog example | https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/ |
| `apg-grid` | WAI-ARIA APG — Grid pattern | https://www.w3.org/WAI/ARIA/apg/patterns/grid/ |
| `apg-feed` | WAI-ARIA APG — Feed pattern | https://www.w3.org/WAI/ARIA/apg/patterns/feed/ |
| `webdev-virtualize` | web.dev — Virtualize large lists with react-window | https://web.dev/articles/virtualize-long-lists-react-window |
| `webdev-sms-otp` | web.dev — SMS OTP form best practices | https://web.dev/articles/sms-otp-form |
| `wcag-dragging` | WCAG 2.2 — Understanding 2.5.7 Dragging Movements | https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html |
| `wcag-hover-focus` | WCAG 2.2 — Understanding 1.4.13 Content on Hover or Focus | https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html |
| `apg-listbox` | WAI-ARIA APG — Listbox pattern | https://www.w3.org/WAI/ARIA/apg/patterns/listbox/ |
| `apg-combobox-list-example` | WAI-ARIA APG — Editable Combobox With List Autocomplete example | https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-autocomplete-list/ |
| `mdn-constraint-validation` | MDN — Constraint validation | https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Constraint_validation |
| `mdn-fieldset` | MDN — <fieldset> | https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/fieldset |
| `mdn-input-radio` | MDN — <input type="radio"> | https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/radio |
| `mdn-aria-invalid` | MDN — aria-invalid | https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-invalid |
| `wai-multipage-forms` | W3C WAI Tutorials — Multi-page Forms | https://www.w3.org/WAI/tutorials/forms/multi-page/ |
| `react-custom-hooks` | react.dev — Reusing Logic with Custom Hooks | https://react.dev/learn/reusing-logic-with-custom-hooks |
| `react-usesyncexternalstore` | react.dev — useSyncExternalStore | https://react.dev/reference/react/useSyncExternalStore |
| `react-refs` | react.dev — Referencing Values with Refs | https://react.dev/learn/referencing-values-with-refs |
| `webdev-inp` | web.dev — Optimize INP | https://web.dev/articles/optimize-inp |
| `react-19-release` | react.dev — React 19 release post | https://react.dev/blog/2024/12/05/react-19 |
| `react-useactionstate` | react.dev — useActionState | https://react.dev/reference/react/useActionState |
| `react-useoptimistic` | react.dev — useOptimistic | https://react.dev/reference/react/useOptimistic |
| `react-use` | react.dev — use | https://react.dev/reference/react/use |
| `react-form` | react.dev — <form> (actions) | https://react.dev/reference/react-dom/components/form |
| `react-server-components` | react.dev — Server Components | https://react.dev/reference/rsc/server-components |
| `react-server-functions` | react.dev — Server Functions | https://react.dev/reference/rsc/server-functions |
| `react-use-client` | react.dev — 'use client' directive | https://react.dev/reference/rsc/use-client |
| `react-compiler` | react.dev — React Compiler | https://react.dev/learn/react-compiler |
| `react-usetransition` | react.dev — useTransition | https://react.dev/reference/react/useTransition |
| `react-usedeferredvalue` | react.dev — useDeferredValue | https://react.dev/reference/react/useDeferredValue |
| `react-suspense` | react.dev — <Suspense> | https://react.dev/reference/react/Suspense |
| `react-hydrateroot` | react.dev — hydrateRoot | https://react.dev/reference/react-dom/client/hydrateRoot |
| `react-render-pipeable` | react.dev — renderToPipeableStream | https://react.dev/reference/react-dom/server/renderToPipeableStream |
| `react-memo` | react.dev — memo | https://react.dev/reference/react/memo |
| `react-lazy` | react.dev — lazy | https://react.dev/reference/react/lazy |
| `react-profiler` | react.dev — <Profiler> | https://react.dev/reference/react/Profiler |
| `next-app-router` | Next.js docs — App Router | https://nextjs.org/docs/app |
| `next-layouts-pages` | Next.js docs — Layouts and Pages | https://nextjs.org/docs/app/getting-started/layouts-and-pages |
| `next-server-client` | Next.js docs — Server and Client Components | https://nextjs.org/docs/app/getting-started/server-and-client-components |
| `next-fetching-data` | Next.js docs — Fetching Data | https://nextjs.org/docs/app/getting-started/fetching-data |
| `next-caching-revalidating` | Next.js docs — Caching (old URL …/caching-and-revalidating redirects here) | https://nextjs.org/docs/app/getting-started/caching |
| `next-caching-guide` | Next.js docs — Caching and Revalidating (Previous Model) (old …/guides/caching redirects here) | https://nextjs.org/docs/app/guides/caching-without-cache-components |
| `next-error-handling` | Next.js docs — Error Handling | https://nextjs.org/docs/app/getting-started/error-handling |
| `next-loading` | Next.js docs — loading.js | https://nextjs.org/docs/app/api-reference/file-conventions/loading |
| `next-ppr` | Next.js docs — Caching (old Partial Prerendering URL redirects here; PPR is now how Cache Components render) | https://nextjs.org/docs/app/getting-started/caching |
| `next-isr` | Next.js docs — Incremental Static Regeneration | https://nextjs.org/docs/app/guides/incremental-static-regeneration |
| `next-linking` | Next.js docs — Linking and Navigating | https://nextjs.org/docs/app/getting-started/linking-and-navigating |
| `next-use-cache` | Next.js docs — 'use cache' directive | https://nextjs.org/docs/app/api-reference/directives/use-cache |
| `next-revalidating` | Next.js docs — Revalidating | https://nextjs.org/docs/app/getting-started/revalidating |
| `next-mutating-data` | Next.js docs — Mutating Data | https://nextjs.org/docs/app/getting-started/mutating-data |
| `next-data-security` | Next.js docs — Data Security | https://nextjs.org/docs/app/guides/data-security |
| `next-streaming` | Next.js docs — Streaming | https://nextjs.org/docs/app/guides/streaming |
| `next-self-hosting` | Next.js docs — Self-hosting | https://nextjs.org/docs/app/guides/self-hosting |
| `next-upgrade-16` | Next.js docs — Upgrading to version 16 | https://nextjs.org/docs/app/guides/upgrading/version-16 |
| `react-19-3-release` | react.dev — React 19.3 release post | https://react.dev/blog/2026/09/09/react-19-3 |
| `webdev-rendering` | web.dev — Rendering on the Web | https://web.dev/articles/rendering-on-the-web |
| `webdev-vitals` | web.dev — Web Vitals | https://web.dev/articles/vitals |
| `webdev-lcp` | web.dev — Largest Contentful Paint (LCP) | https://web.dev/articles/lcp |
| `webdev-inp-metric` | web.dev — Interaction to Next Paint (INP) | https://web.dev/articles/inp |
| `webdev-cls` | web.dev — Cumulative Layout Shift (CLS) | https://web.dev/articles/cls |
| `webdev-optimize-lcp` | web.dev — Optimize LCP | https://web.dev/articles/optimize-lcp |
| `patterns-rsc` | patterns.dev — React Server Components | https://www.patterns.dev/react/react-server-components |
| `patterns-streaming-ssr` | patterns.dev — Streaming SSR | https://www.patterns.dev/react/streaming-ssr |
| `patterns-progressive-hydration` | patterns.dev — Progressive Hydration | https://www.patterns.dev/react/progressive-hydration |

Next.js pages were read at v16.4.6 ("Latest" on nextjs.org) and React pages at React 19.3.1 (npm latest) on 2026-11-23.
| `mdn-contenteditable` | MDN — contenteditable global attribute | https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/contenteditable |
| `mdn-beforeinput` | MDN — Element: beforeinput event | https://developer.mozilla.org/en-US/docs/Web/API/Element/beforeinput_event |
| `mdn-inputtype` | MDN — InputEvent: inputType property | https://developer.mozilla.org/en-US/docs/Web/API/InputEvent/inputType |
| `w3c-input-events` | W3C — Input Events Level 2 (editor's draft) | https://w3c.github.io/input-events/ |
| `mdn-selection` | MDN — Selection | https://developer.mozilla.org/en-US/docs/Web/API/Selection |
| `mdn-execcommand` | MDN — Document: execCommand() method (deprecated) | https://developer.mozilla.org/en-US/docs/Web/API/Document/execCommand |
| `apg-toolbar` | WAI-ARIA APG — Toolbar pattern | https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/ |

Sources above from `mdn-contenteditable` to `apg-toolbar` were accessed on **2026-11-26** (HTTP 200, content inspected) for the Rich Text Editor problem.

## Execution-environment references

| ID | Title | URL | Accessible |
|---|---|---|---|
| `sandpack-docs` | Sandpack docs | https://sandpack.codesandbox.io/docs | Yes |
| `sandpack-client` | Sandpack client (advanced usage) | https://sandpack.codesandbox.io/docs/advanced-usage/client | Yes |
| `monaco` | Monaco Editor | https://microsoft.github.io/monaco-editor/ | Yes |

The machine-readable version of this registry lives in `src/content/sources.ts`; a Vitest suite checks that every source referenced by a question exists in the registry.
