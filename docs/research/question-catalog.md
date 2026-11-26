# Question catalog

Status of this document: **Phase 0 catalog, 2026-11-23.** Every row is linked to the sources in [`sources.md`](./sources.md). Rows marked **✅ Implemented** have full content, tests and a verified reference solution in the app. Everything else is a researched *candidate*.

Legend:
- **Provenance**: `PPP` = PUBLISHED_PRACTICE_PROBLEM, `DTE` = DOCUMENTED_TECHNICAL_EXERCISE, `OV` = ORIGINAL_VARIATION, `VIR` = VERIFIED_INTERVIEW_REPORT (none collected yet).
- **Confidence** (qualitative, see methodology): `HIGH` = named by ≥2 independent sources; `MED` = one credible source; `LOW` = only indirect/adjacent evidence; `UNK` = no public evidence found.
- Confidence describes *use in interview preparation material*, never the probability that a given company asks the question.

## Track 1 — React machine coding (30 candidates)

| # | Candidate | Evidence (source ID → title as listed) | Prov. | Conf. | Status / notes |
|---|---|---|---|---|---|
| 1 | Autocomplete / Typeahead | `fih-sd-ui` → "Autocomplete"; `alla-components` → "Design an Autocomplete"; `fg-mc` → "Auto Complete Search \| Typeahead Search" | PPP | HIGH | ✅ Implemented (`react-autocomplete`) |
| 2 | File Explorer | `fih-ui` → "File Explorer"; `fg-mc` → "Tree View / Folder View" | PPP | HIGH | ✅ Implemented (`react-file-explorer`) |
| 3 | Data Table (sort/filter/paginate) | `fih-ui` → "Data Table (with extensions for sorting and filtering)"; `fih-sd-ui` → "Data table"; `alla-components` → "Design a Data Table" | PPP | HIGH | ✅ Implemented (`react-data-table`) |
| 4 | Toast Notification System | `fg-mc` → "Toast Notification"; `alla-components` → "Design a Toast / Notification System" | PPP | HIGH | ✅ Implemented (`react-toast`) |
| 5 | Infinite Scroll | `fg-mc` → "Infinite Scroll" | PPP | MED | ✅ Implemented (`react-infinite-scroll`) |
| 6 | Modal / Dialog | `fih-ui` → "Modal Dialog"; `fih-sd-ui` → "Modal dialog"; `alla-components` → "Design a Modal / Dialog"; `fg-mc` → "Modal Component" | PPP | HIGH | ✅ Implemented (`react-modal-dialog`) |
| 7 | Multi-Select Dropdown | `fih-sd-ui` → "Dropdown menu"; `alla-components` → "Design a Dropdown Menu"; `fg-mc` → "Chips Input" | OV | MED | ✅ Implemented (`react-multi-select`) |
| 8 | Nested Comments | `fg-mc` → "Comment View (Multi-level)" | PPP | MED | ✅ Implemented (`react-nested-comments`) |
| 9 | Virtualized List | `alla-components` → "Design a Virtualized List"; `fg-mc` Infinite Scroll description mentions "Virtualization" | PPP | MED | ✅ Implemented (`react-virtualized-list`) |
| 10 | Drag-and-Drop Kanban | `fih-ui` → "Kanban Board"; `fg-mc` → "Kanban Board" | PPP | HIGH | ✅ Implemented (`react-kanban-board`) |
| 11 | OTP Input | `fg-mc` → "OTP Input Design" | PPP | MED | ✅ Implemented (`react-otp-input`) |
| 12 | Dynamic Form Builder | `alla-components` → "Design a Config-Driven UI" (adjacent) | OV | LOW | Candidate |
| 13 | Accordion | `fih-ui` → "Accordion"; `fg-mc` → "Accordion"; `alla-components` → "Design an Accordion" | PPP | HIGH | Implemented in Vanilla track; React version is a duplicate → deprioritised |
| 14 | Tabs | `fih-ui` → "Tabs"; `fg-mc` → "Tab bar"; `alla-components` → "Design a Tabs Component" | PPP | HIGH | ✅ Implemented (`react-tabs`) |
| 15 | Tree View | `fg-mc` → "Tree View / Folder View" | PPP | MED | **Duplicate of #2** — merge as File Explorer follow-up (keyboard tree nav) |
| 16 | Multi-Step Form | `fg-mc` → "Step Form", "Multi-Step Form" | PPP | MED | ✅ Implemented (`react-multi-step-form`) |
| 17 | Image Carousel | `fih-ui` → "Image Carousel"; `fih-sd-ui` → "Image carousel"; `alla-components` → "Design an Image Carousel"; `fg-mc` → "Image Carousel" | PPP | HIGH | ✅ Implemented (`react-image-carousel`) |
| 18 | Star Rating | `fih-ui` → "Star Rating"; `fg-mc` → "Star Component" | PPP | HIGH | ✅ Implemented (`react-star-rating`) |
| 19 | Calendar / Date Picker | `alla-components` → "Design a Date Picker"; `fg-mc` → "Calendar View" | PPP | HIGH | ✅ Implemented (`react-date-picker`) |
| 20 | Editable Data Grid | Variation of #3 | OV | LOW | Candidate |
| 21 | Search with Filters | Variation of #3 (filtering) | OV | LOW | Candidate |
| 22 | Chat Interface | `fg-mc` → "Messaging Interface" | PPP | MED | Candidate |
| 23 | Spreadsheet Grid | No public source found | OV | UNK | Keep only as advanced original variation |
| 24 | Rich Text Editor | `fih-sd-ui` → "Rich text editor"; `alla-components` → "Design a Rich Text Editor" | OV | HIGH | ✅ Implemented (`react-rich-text-editor`) as an inline-marks machine-coding cut of the system-design prompt |
| 25 | JSON / Code Editor | No public source found | OV | UNK | Candidate for replacement |
| 26 | Resizable Panels | No public source found | OV | UNK | Candidate for replacement |
| 27 | Command Palette | `alla-components` → "Design a Command Palette (Cmd-K)" | PPP | MED | ✅ Implemented (`react-command-palette`) |
| 28 | Real-Time Notification Feed | Adjacent to #4 only | OV | LOW | Candidate |
| 29 | Multi-Camera Dashboard | No public source found | OV | UNK | Candidate for replacement |
| 30 | Timeline / Video Scrubber | No public source found | OV | UNK | Candidate for replacement |

**Researched replacements with stronger evidence** (recommended over the `UNK` rows): Progress Bars (`fih-ui`, `fg-mc`), Tooltip/Popover (`fih-sd-ui`, `alla-components`, `fg-mc`) — ✅ implemented as `react-tooltip-popover`, Todo list (`fih-ui`, `fg-mc`), Tic-tac-toe (`fih-ui`, `fg-mc`), Transfer List (`fih-ui`), Stopwatch / Countdown (`fih-ui`, `fg-mc`), Pagination (`fg-mc`), File Uploader (`alla-components`), Poll widget (`fih-sd-ui`, `alla-components`) — ✅ implemented as `react-poll-widget`, Seat booking (`fg-mc`), BFE React hooks such as `useDebounce()`, `usePrevious()`, `useSWR()` (`bfe-react`) — ✅ implemented together as `react-custom-hooks`.

## Track 2 — Vanilla JavaScript / DOM (20 candidates)

| # | Candidate | Evidence | Prov. | Conf. | Status |
|---|---|---|---|---|---|
| 1 | Accordion (vanilla) | `fih-ui` "Accordion"; `fg-mc` "Accordion" (lists JavaScript & React); `alla-components` | PPP | HIGH | ✅ Implemented (`vanilla-accordion`) |
| 2 | Tabs (vanilla) | `fih-ui`; `fg-mc` "Tab bar" (JS & React) | PPP | HIGH | Candidate |
| 3 | Modal (vanilla) | `fg-mc` "Modal component using JavaScript or React"; `fih-ui` | PPP | HIGH | Candidate |
| 4 | Autocomplete (vanilla) | `fg-mc` "…using vanilla JS, React" | PPP | MED | Candidate (overlaps React #1 – keep as DOM-focus variation) |
| 5 | Event delegation | `bfe-problems` "117. event delegation" | PPP | MED | ✅ Implemented (`vanilla-event-delegation`) |
| 6 | Traverse DOM level by level | `bfe-problems` "104. Traverse DOM level by level" | PPP | MED | Candidate |
| 7 | DOM tree height | `bfe-problems` "58. get DOM tree height" | PPP | MED | Candidate |
| 8 | Corresponding node in identical DOM trees | `bfe-problems` "19. find corresponding node in two identical DOM tree" | PPP | MED | Candidate |
| 9 | getElementsByClassName | `fih-js` basic examples + "where to practice" | PPP | MED | Candidate |
| 10 | Next right sibling | `bfe-problems` "89. Next Right Sibling" | PPP | MED | Candidate |
| 11 | Generate CSS selector | `bfe-problems` "170. Generate CSS Selector for target element" | PPP | MED | Candidate |
| 12 | Two-way binding | `bfe-problems` "154. Two-way binding" | PPP | MED | Candidate |
| 13 | jQuery-like chaining wrapper | `bfe-problems` "15. implement a simple DOM wrapper…" | PPP | MED | Candidate |
| 14 | Star rating (vanilla) | `fg-mc` "Star Component" (JS & React); `fih-ui` | PPP | HIGH | Candidate |
| 15 | Image carousel (vanilla) | `fg-mc`; `fih-ui` | PPP | HIGH | Candidate |
| 16 | Form validation | `fg-mc` "Application Forms" | PPP | MED | Candidate |
| 17 | Drag-and-drop list | `fih-ui` / `fg-mc` Kanban (adjacent) | OV | LOW | Candidate |
| 18 | Infinite scrolling (vanilla) | `fg-mc` "Infinite Scroll" | PPP | MED | Candidate |
| 19 | Todo / dynamic list | `fih-ui` "Todo list"; `fg-mc` "ToDo App" | PPP | HIGH | Candidate |
| 20 | Accessible dropdown (vanilla) | `alla-components` Dropdown Menu; `apg-combobox` | DTE | MED | Candidate |

## Track 3 — JavaScript coding & polyfills (30 candidates)

| # | Candidate | Evidence | Prov. | Conf. | Status |
|---|---|---|---|---|---|
| 1 | debounce (trailing) | `bfe-problems` "6. implement basic debounce()"; `fih-js` "Debounce" | PPP | HIGH | ✅ Implemented (`js-debounce`) |
| 2 | debounce leading/trailing | `bfe-problems` "7." | PPP | MED | Follow-up of #1 |
| 3 | throttle | `bfe-problems` "4.", "5."; `fih-js` "throttle()" | PPP | HIGH | Candidate |
| 4 | Promise.all | `bfe-problems` "32."; `fih-js` "Promise.all" | PPP | HIGH | ✅ Implemented (`js-promise-all`) |
| 5 | Promise.allSettled | `bfe-problems` "33." | PPP | MED | Candidate |
| 6 | Promise.any | `bfe-problems` "34."; `fih-js` "Promise.any" | PPP | HIGH | Candidate |
| 7 | Promise.race | `bfe-problems` "35." | PPP | MED | Candidate |
| 8 | Deep clone | `bfe-problems` "63. create `_.cloneDeep()`"; `fih-js` "Deep Clone", "cloneDeep()" | PPP | HIGH | Candidate |
| 9 | Deep equal | `bfe-problems` "69. implement deep equal" | PPP | MED | Candidate |
| 10 | Array.prototype.flat | `bfe-problems` "3."; `fih-js` "Flatten" | PPP | HIGH | Candidate |
| 11 | Object flatten | No direct source; `fih-js` key conversion is adjacent | OV | LOW | Candidate |
| 12 | curry | `bfe-problems` "1. implement curry()" | PPP | MED | ✅ Implemented (`js-curry`) |
| 13 | memoize | `bfe-problems` "14.", "122. memoizeOne()" | PPP | MED | Candidate |
| 14 | Function.prototype.call | `bfe-problems` "61." | PPP | MED | Candidate |
| 15 | Function.prototype.bind | No direct listing found | OV | LOW | Candidate (variation of #14) |
| 16 | Function.prototype.apply | No direct listing found | OV | LOW | Merge with #14 |
| 17 | Array.prototype.map | `bfe-problems` "151."; `fih-js` | PPP | HIGH | Candidate |
| 18 | Array.prototype.reduce | `bfe-problems` "146."; `fih-js` | PPP | HIGH | Candidate |
| 19 | Array.prototype.filter | `fih-js` "Array.prototype.filter()" | PPP | MED | Candidate |
| 20 | Event emitter | `bfe-problems` "16."; `fih-js` "Event Emitter", "Observer pattern" | PPP | HIGH | ✅ Implemented (`js-event-emitter`) |
| 21 | Retry with backoff | `bfe-problems` "64. auto-retry Promise on rejection" | PPP | MED | Candidate (backoff is an original extension) |
| 22 | Concurrency limiter | `bfe-problems` "92. throttle Promises" | PPP | MED | Candidate |
| 23 | Async task queue / scheduler | `bfe-problems` "179. Implement AsyncTaskQueue" | PPP | MED | Candidate |
| 24 | LRU cache | `bfe-problems` "169. LRU - Chrome storage automatic eviction" | PPP | MED | Candidate |
| 25 | `_.get` / `_.set` | `bfe-problems` "85.", "156." | PPP | MED | Candidate |
| 26 | classNames | `bfe-problems` "125."; `fih-js` "Classnames" | PPP | HIGH | Candidate |
| 27 | JSON.stringify | `bfe-problems` "21."; `fih-js` advanced | PPP | HIGH | Candidate |
| 28 | groupBy | `bfe-problems` "177."; `fih-js` "groupBy()" | PPP | HIGH | Candidate |
| 29 | once / promisify | `bfe-problems` "46.", "159." | PPP | MED | Candidate |
| 30 | Async helpers sequence/parallel/race | `bfe-problems` "29.", "30.", "31." | PPP | MED | Candidate |

## Track 4 — TypeScript (20 candidates)

| # | Candidate | Evidence | Prov. | Conf. | Status |
|---|---|---|---|---|---|
| 1 | Implement `MyReturnType` / `MyParameters` (infer) | `bfe-ts` "12. implement ReturnType<T>", "10. implement Parameters<T>"; `ts-conditional` | PPP | MED | ✅ Implemented (`ts-return-type-parameters`) |
| 2 | Type-safe event emitter | Original extension of `bfe-problems` "16." using `ts-keyof`, `ts-generics` | OV | LOW | ✅ Implemented (`ts-typed-event-emitter`) |
| 3 | Partial / Required / Readonly | `bfe-ts` "1.", "2.", "3."; `ts-mapped` | PPP | MED | Candidate |
| 4 | Pick / Omit | `bfe-ts` "5.", "6." | PPP | MED | Candidate |
| 5 | Exclude / Extract / NonNullable | `bfe-ts` "7.", "8.", "9." | PPP | MED | Candidate |
| 6 | TupleToUnion / FirstItem / LastItem | `bfe-ts` "18.", "19.", "21." | PPP | MED | Candidate |
| 7 | UnwrapPromise | `bfe-ts` "25." | PPP | MED | Candidate |
| 8 | Equal / IsAny / IsNever (compile-time assertions) | `bfe-ts` "42.", "30.", "20." | PPP | MED | Candidate |
| 9 | Trim / Capitalize / CamelCase / SnakeCase (template literal) | `bfe-ts` "43.", "51.", "54.", "53."; `ts-template-literal` | PPP | MED | Candidate |
| 10 | Split / StringToTuple / LengthOfString | `bfe-ts` "52.", "22.", "24." | PPP | MED | Candidate |
| 11 | ObjectPaths (recursive) | `bfe-ts` "57." | PPP | MED | Candidate |
| 12 | UnionToIntersection | `bfe-ts` "40." | PPP | MED | Candidate |
| 13 | ReverseTuple / Flat | `bfe-ts` "26.", "27." | PPP | MED | Candidate |
| 14 | UndefinedToNull | `bfe-ts` "60." | PPP | MED | Candidate |
| 15 | Discriminated-union exhaustive handling (`asserts never`) | `bfe-ts` "49. asserts never"; `ts-narrowing` | PPP | MED | Candidate |
| 16 | Generic API response modelling | `ts-generics`, `ts-narrowing` | DTE | LOW | Candidate |
| 17 | Type-safe `get(obj, path)` | `bfe-problems` "85." + `bfe-ts` "57." | OV | LOW | Candidate |
| 18 | DeepReadonly | Extension of `bfe-ts` "3." | OV | LOW | Candidate |
| 19 | Type-level arithmetic (Add/Subtract) | `bfe-ts` "38.", "46." | PPP | MED | Low priority (puzzle-like, low job relevance) |
| 20 | Typed `pipe`/`compose` | `bfe-problems` "11. create a pipe()" + `ts-generics` | OV | LOW | Candidate |

## Track 5 — Output prediction (topic coverage)

BFE.dev lists 135 quizzes (`bfe-quiz`). Their **topics** were used to choose coverage; every snippet in this app is **original** and its output was **executed** (Node.js, or React 18 in jsdom) by `npm test` — see methodology. Snippets are classified `DTE` (documented behaviour, cited to MDN/react.dev) with the BFE topic recorded as supporting evidence that the topic appears in practice material.

| Topic | Supporting BFE quiz titles | Implemented snippets |
|---|---|---|
| Promise ordering / microtasks | "1. Promise order", "47. Promise Order II", "103. Promise Order III", "54. setTimeout(0ms)" | `out-microtask-vs-timeout`, `out-async-await-order`, `out-promise-then-return` |
| Promise executor | "2. Promise executor", "18. Promise executor II" | `out-promise-executor-sync` |
| Hoisting / TDZ | "27–45. Hoisting I–VI", "89. let", "39. var" | `out-var-hoisting`, `out-tdz` |
| Closures in loops | "99. closure", "100. `var` vs `let`" | `out-closure-loop-var-let` |
| `this` binding | "19. `this`" … "117. `this` VII", "6. Arrow Function" | `out-this-method-extraction`, `out-arrow-this` |
| Equality / coercion | "10. Equal", "24. Equality & Sameness", "8. Implicit Coercion I" | `out-equality-coercion`, `out-object-is` |
| Object references | "64. reference type" | `out-object-reference` |
| Prototypes | "48. Prototype", "53. Prototype 2" | `out-prototype-shadowing` |
| try/catch/finally | "88. try...catch", "120. try..catch..finally" | `out-finally-return` |
| Event propagation | (no BFE quiz; MDN documented) | `out-event-bubbling-order` (verified in jsdom) |
| React batching | (BFE React quiz not found; react.dev documented) | `out-react-batching`, `out-react-functional-update` |
| React effects order | react.dev documented | `out-react-effect-order` |
| React component identity / keys | react.dev documented | `out-react-key-reset` |

Further topics to cover (from `bfe-quiz`): generators, Proxy, JSON.stringify edge cases, parseInt, sparse arrays, getters/setters, MessageChannel/postMessage ordering, requestAnimationFrame, structuredClone.

## Duplicate / overlap review

- React #15 Tree View ≡ React #2 File Explorer → merged (keyboard tree navigation is a File Explorer follow-up).
- React #8 Nested Comments shares the recursive-render core with #2; keep as separate problem only if it emphasises reply/edit/delete flows.
- React #13 Accordion and #14 Tabs exist in both React and Vanilla tracks. Each is kept once in the React track and once in the Vanilla track only when the vanilla version emphasises DOM APIs (event delegation, `<details>`, focus management).
- Track 2 #4 (vanilla autocomplete) overlaps React #1; kept as a lower priority.
- Track 3 #14–16 (call/apply/bind) are merged into a single problem with three parts.
- Track 3 #20 (event emitter) and Track 4 #2 (typed event emitter) are deliberately paired: runtime semantics vs. type-level API.
