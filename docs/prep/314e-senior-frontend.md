# Senior Frontend prep set: 314e interview

A study guide for a Senior/Lead Frontend Engineer loop at 314e. It maps the prep plan to practice items in this lab and gives a short, interview-length answer to every theory question. Each answer is built so you can say **what it is, how it works, when to use it, when not to, and a production example**.

> **Honesty note.** The question list is a *predicted* set. It is based on a referral contact's unpublished recollection of their October 2026 loop (memoization, closures, callbacks, recruitment portal HLD, job listing, rich text editor, security) and the public job description. None of it is a verified list of questions 314e asks. Lab items carry their own provenance labels, and none of them claim to be company questions.

---

## 1. Where to practise each topic in the lab

| Plan area (priority) | Practise in the lab | Type |
|---|---|---|
| Memoization (P0) | `js-memoize` · `arch-memo-child-still-rerenders` · concept **Memoization** | Coding · scenario |
| Closures, stale closures (P0) | `arch-stale-closures-hooks` · output `out-closure-loop-var-let`, "Counter factories and shared closure state" · concept **Closures** | Scenario · output |
| Callbacks → promises → async (P0) | `js-promise-all` · `js-concurrency-limit` · output questions on async ordering · concepts **Promises**, **Event loop** | Coding · output |
| Debounce / throttle with cancel (P0) | `js-debounce` · `js-throttle` · concept **Throttling** | Coding |
| Reconciliation, Fiber, render vs commit, batching, effects (P0) | `arch-render-commit-pipeline` · output `out-react-batching`, `out-react-effect-order`, `out-react-key-reset` | Scenario · output |
| Race conditions in useEffect (P0) | `arch-search-race-conditions` · `react-autocomplete` | Scenario · coding |
| Context re-renders, state placement (P0/P1) | `arch-state-placement-context` | Scenario |
| useTransition / useDeferredValue (P1) | `arch-react-rerender-diagnosis` · concept **React performance** | Scenario |
| SSR / CSR / SSG / hydration (P1) | `arch-rendering-strategy-choice` · `arch-hydration-mismatch-debug` · SSR output questions | Scenario · output |
| XSS, sanitization (P0) | `arch-xss-job-description` · concept **XSS** | Scenario |
| Auth tokens, cookies, CSRF (P0) | `arch-auth-tokens-csrf` · concept **CSRF, cookies and auth tokens** | Scenario |
| CSP, clickjacking, Trusted Types (P0/P1) | `arch-csp-rollout` · concept **Content Security Policy** | Scenario |
| Secure file upload and preview (P1) | `arch-secure-resume-upload` | Scenario |
| Memory profiling, GC, leaks (P1) | `arch-memory-leak-hunt` · concept **Memory leaks** | Scenario |
| Web Workers / WebAssembly (P1) | `arch-web-worker-offload` · concept **Web Workers** | Scenario |
| Core Web Vitals, code splitting (P1) | `arch-core-web-vitals-plan` · `arch-code-splitting-strategy` | Scenario |
| Virtualization, infinite scroll (P1) | `react-virtualized-list` · `react-infinite-scroll` | Coding |
| HLD: recruitment portal (P0) | `arch-sd-recruitment-portal` · `react-kanban-board` (pipeline board) · `react-multi-step-form` (apply flow) | System design · coding |
| HLD: job listing (P0) | `arch-sd-job-listing` · `react-autocomplete` · `react-data-table` | System design · coding |
| Rich text editor (P0) | `react-rich-text-editor` (document model, `beforeinput`, Selection API, toolbar a11y, XSS-safe serialisation) · `arch-xss-job-description` for sanitizing editor output · notes in §6 | Coding · scenario |
| Testing (P1) | Every coding problem's "Testing strategy" section, and concept **Fake timers** | — |

In the app, open **Architecture & performance** for the scenarios and **JavaScript & polyfills** for the coding problems. Use **Interview mode** with a 45-minute timer for the two system design questions.

---

## 2. Advanced React (P0): theory answers

**1. React.memo vs useMemo vs useCallback.** `memo(Component)` skips re-rendering a component when every prop is `Object.is`-equal to last time. `useMemo(fn, deps)` caches a computed **value** between renders. `useCallback(fn, deps)` caches a **function reference**. The two hooks only help when something depends on the stable reference (a `memo` child, or another Hook's dependency list) or when the calculation is noticeably slow. → `arch-memo-child-still-rerenders`

**2. Does useCallback prevent function creation?** No. The inline function is still created on every render. React returns the *previous* one when the deps are unchanged. The react.dev page says this explicitly.

**3. When can memoization make performance worse?** When the component is cheap. When a prop changes every render anyway, so you pay for the comparison and still re-render. When the memoized values retain a lot of memory. When the cache has a low hit rate. And always on the first render, which memoization never makes faster. Measure with the Profiler first.

**4. Why does a memoized child still re-render?** A prop is a new object, array, function or JSX `children` each render. Or the child reads a context whose value changed. Or the child's own state changed. `memo` only compares props.

**5. Referential equality and Object.is.** Objects are equal only if they are the same reference. `Object.is` is like `===` except `Object.is(NaN, NaN)` is `true` and `Object.is(+0, -0)` is `false`. React uses it for state bailouts, Hook dependencies and `memo` props.

**6. Stale closure.** A function created during a render keeps that render's props and state. If it outlives the render (an interval, a listener, an effect with missing deps), it keeps reading old values. Fixes: correct dependencies, functional updates (`setX(x => x + 1)`), `useEffectEvent` for event-like logic inside effects, or a ref holding the latest value. Never silence `exhaustive-deps`. → `arch-stale-closures-hooks`

**7. How does reconciliation work?** React diffs the new element tree against the previous one. If an element has the same type at the same position with the same key, React keeps its state and DOM node and updates only the props. If the type or key differs, React unmounts and remounts it. That is why list keys must be stable ids. → `arch-render-commit-pipeline`

**8. React Fiber and scheduling.** Fiber is React's internal tree of work units, one per component, linked to its parent, child and sibling, and carrying pending updates and priority. Because work is split into units, React can pause rendering, handle an urgent update, and resume. That is how transitions are interruptible. It is an implementation detail, so describe the documented contract first.

**9. Rendering vs committing.** *Render* means calling components to compute the next UI. It must be pure, and for transitions it can be interrupted or repeated. *Commit* means applying DOM changes, attaching refs and running layout effects, synchronously and atomically. Passive effects (`useEffect`) run after that, usually after paint.

**10. State bailouts and automatic batching.** Multiple setters in one event (and, since React 18, in promises and timeouts) are **batched** into a single render. If the new state is `Object.is`-equal to the current state, React **bails out** and skips the children.

**11. Why does setting the same state sometimes call the component again?** React may need to render that component once before it can confirm the bailout. It then discards the result without rendering children or committing. This is expected, not a bug.

**12. useEffect vs useLayoutEffect.** `useLayoutEffect` runs after commit and **before the browser repaints**. Use it for measuring layout to position a tooltip or popover without a visible jump. It blocks paint ("can hurt performance") and does not run on the server. Prefer `useEffect` everywhere else.

**13. Race conditions in useEffect.** Two requests can resolve out of order. Use an `ignore` flag set in cleanup (the react.dev pattern), abort the previous request with `AbortController`, or key results by query in a cache. Debounce reduces requests but does not fix ordering. → `arch-search-race-conditions`

**14. How does Context trigger re-renders?** When a provider's `value` changes by `Object.is`, every component that reads that context re-renders, and `memo` does not stop it. A new object literal as the value re-renders all consumers on every provider render. Fixes: `useMemo` the value, split contexts by update frequency, put dispatch in its own context, or use a selector store via `useSyncExternalStore`. → `arch-state-placement-context`

**15. useRef vs useState.** Changing state re-renders the component and the value is a per-render snapshot. A ref is a mutable box (`ref.current`) that survives renders and does **not** trigger a re-render. Use refs for DOM nodes, timer ids, latest-value holders and instance variables. Don't read or write refs during render for anything that affects output.

**16. useTransition and useDeferredValue.** `startTransition(() => setX(...))` marks an update as non-urgent: React renders it in the background, can interrupt it for typing, and keeps showing the old UI meanwhile (`isPending`). `useDeferredValue(value)` gives you a lagging copy of a value so an expensive child (which should be memoized) re-renders in a low-priority pass. Neither speeds up a synchronous computation. For that you need a Web Worker.

**17. Controlled vs uncontrolled components.** In a *controlled* input React state is the source of truth (`value` plus `onChange`). In an *uncontrolled* input the DOM holds the value (`defaultValue`, read via ref or `FormData`). Controlled inputs make validation and derived UI easy. Uncontrolled inputs are cheaper for large forms and are what React 19 form Actions use.

**18. SSR, CSR, SSG, hydration, hydration mismatch.** *CSR*: the browser renders from JS, so first paint is slow and SEO is weak. *SSR*: HTML is rendered per request. *SSG/ISR*: HTML is rendered at build time or revalidated periodically. *Hydration*: React attaches to server HTML and makes it interactive. A *mismatch* happens when the client's first render differs from the server HTML (`Date.now()`, `window` checks, locale formatting, invalid nesting). Fix it by rendering the same output on both, then updating in an effect. → `arch-rendering-strategy-choice`, `arch-hydration-mismatch-debug`

**19. Implement useMemo conceptually.**

```js
function useMyMemo(factory, deps) {
  const ref = useRef(null);
  const changed = !ref.current || deps.length !== ref.current.deps.length || deps.some((d, i) => !Object.is(d, ref.current.deps[i]));
  if (changed) ref.current = { deps, value: factory() };
  return ref.current.value;
}
```

Say out loud that the real hook stores this on the fiber, that React may throw the cache away, and that writing refs during render is not safe under concurrent rendering. That is why this is only a model.

**20. Debugging unnecessary re-renders.** Use the React DevTools Profiler with "record why each component rendered" and highlight updates, with CPU throttling on. Use `<Profiler onRender>` for production metrics. Then fix the cause (colocate state, stabilise props, split context, virtualize) before reaching for memoization. → `arch-react-rerender-diagnosis`

---

## 3. JavaScript internals (P0): theory answers

**1. Closures.** A closure is a function together with the variables in scope where it was *defined*. Practical uses: private state (counters, the memoize cache), function factories, partial application, and event handlers that remember an id.

**2. Lexical scope, scope chain, execution context.** Scope is decided by where code is written. Variable lookup walks outward through enclosing scopes to the global scope (the scope chain). Each function call creates an execution context with its own variable environment and `this` binding, and pushes it onto the call stack.

**3. var vs let in loops.** `for (var i…) setTimeout(() => log(i))` logs `3, 3, 3`: one function-scoped binding, read after the loop finished. With `let` you get `0, 1, 2`, because a new binding is created per iteration. → output `out-closure-loop-var-let`

**4. Closures and memory leaks.** A closure keeps every variable it references alive for as long as the closure is reachable. A listener that is never removed, an interval that is never cleared, or a long-lived cache callback that captured a big object or a DOM node keeps all of that in memory. Capture ids rather than objects, and always clean up. → `arch-memory-leak-hunt`

**5. Generic memoize.** → `js-memoize` (resolver, `this`, `has` vs `get`, no caching on throw, evicting rejected promises).

**6. Debounce and throttle with cancellation.** → `js-debounce`, `js-throttle`. Debounce: act after calls stop. Throttle: at most once per window, leading plus trailing.

**7. Event loop, microtasks and macrotasks.** The call stack runs to completion. Then **all microtasks** run (promise reactions, `queueMicrotask`, `await` continuations). Then the browser may render. Then the next **task** runs (timers, I/O, events). So `Promise.resolve().then(a); setTimeout(b)` always runs `a` before `b`. → output questions on async ordering

**8. Promise.all and Promise.allSettled.** `all` resolves with values in input order and rejects on the first rejection. `allSettled` never rejects and resolves to `{status, value | reason}` per input. → `js-promise-all`, output "Promise.race and Promise.allSettled"

**9. Promise concurrency limiter.** → `js-concurrency-limit` (worker slots, input-order results, fail-fast, stop launching after failure).

**10. Callbacks vs promises vs async/await.** Callbacks lead to nesting, inversion of control and error handling by convention. Promises are composable values with one error channel and combinators. `async`/`await` is syntax over promises that reads sequentially and uses try/catch. Watch for accidental serialisation (awaiting in a loop when `Promise.all` would do) and unhandled rejections.

**11. this, call, apply, bind.** `this` is set by the call site: `obj.m()` gives `obj`. A plain call gives `undefined` in strict mode. `new` gives the new object. Arrow functions capture lexical `this`. `call(thisArg, ...args)` and `apply(thisArg, argsArray)` invoke immediately with a given `this`. `bind` returns a new function with `this` fixed. → output `out-this-method-extraction`, `out-arrow-this`

**12. Prototypes and inheritance.** Every object has a `[[Prototype]]` link. Property lookup walks the chain. `class` is syntax over constructor functions and prototypes, and methods live on `Class.prototype`, shared by instances. → output `out-prototype-shadowing`

**13. Shallow vs deep copy.** A spread or `Object.assign` copies only the top level, so nested objects are shared. A deep copy recursively copies. `structuredClone` handles Maps, Dates and cycles, but not functions, DOM nodes or class prototypes. `JSON.parse(JSON.stringify())` loses `undefined`, Dates and Maps. → output "What structuredClone keeps and what it rejects"

**14. WeakMap vs Map and GC.** A Map holds keys strongly, is iterable and has `size`. A WeakMap's keys must be objects and are held **weakly**: when nothing else references the key, the entry can be collected. A WeakMap is therefore not iterable and has no `size`. Use it for per-object metadata or caches tied to object lifetimes.

**15. How garbage collection works.** Reachability from roots (globals, stack, closures, DOM, pending callbacks), with mark-and-sweep, generational in V8. Unreachable memory is freed automatically. "Leaks" are things you forgot to make unreachable. → concept **Memory leaks**

---

## 4. Frontend security (P0): theory answers

**1. XSS types.** *Stored* XSS comes from saved data, *reflected* from the request, and *DOM-based* from client code moving a source (URL, `postMessage`) into a sink (`innerHTML`, `eval`, `location`).

**2. Does React prevent XSS?** It escapes text and attribute values. It does not protect `dangerouslySetInnerHTML`, direct DOM writes, `href`/`src` URLs (React 19 blocks `javascript:` URLs, but you still need an allowlist), SSR-inlined JSON, or third-party scripts. → `arch-xss-job-description`

**3. Rendering user HTML safely.** Use one `SafeHtml` component, sanitize with DOMPurify and a tag/attribute allowlist on both server and client, and validate URLs by parsed protocol. Better still, store a JSON document model and render it to elements.

**4. CSRF.** A cross-site page makes the browser send a request with your cookies. Defences: a synchronizer token or a *signed* double-submit cookie in a custom header, Fetch Metadata (`Sec-Fetch-Site`) with an Origin fallback, no state changes on GET, and SameSite as defence in depth. XSS defeats all of them. → `arch-auth-tokens-csrf`

**5. Where to store tokens.** `localStorage` is not exposed to CSRF but is readable by any XSS. HttpOnly cookies cannot be read but need CSRF defences. Recommended: a `__Host-` HttpOnly Secure SameSite session cookie plus CSRF checks, or short-lived in-memory access tokens refreshed via that cookie.

**6. CORS vs CSRF.** CORS decides whether a page may **read** a cross-origin response. It does not stop a simple form POST being sent. CORS is not a CSRF defence on its own. A strict CORS policy does block cross-origin `fetch` with custom headers through preflight, though.

**7. CSP.** A response header that allowlists script and other sources. A strict policy is `script-src 'nonce-…' 'strict-dynamic'; object-src 'none'; base-uri 'none'`. Roll it out in Report-Only first. → `arch-csp-rollout`

**8. Clickjacking.** Another site frames yours and tricks clicks. Use `frame-ancestors 'none'` (or a specific allowlist). It replaces `X-Frame-Options`.

**9. Trusted Types.** `require-trusted-types-for 'script'` makes string assignments to DOM injection sinks throw unless they come from a registered policy. That turns DOM XSS into a visible error.

**10. Secure file upload.** Validate on the server (extension allowlist, size, magic bytes, never trust `Content-Type`), use generated names, store outside the web root or on a separate host, scan for malware, and preview from an isolated cookieless domain via short-lived signed URLs. → `arch-secure-resume-upload`

**11. Third-party scripts.** Keep an inventory, load them with nonces under `strict-dynamic`, use Subresource Integrity for static CDN files, sandbox widgets in iframes where possible, and review the data they can access.

**12. Multi-tenant data isolation on the frontend.** The server authorises every request from the session. The frontend includes the tenant in cache keys, clears caches on logout or tenant switch, never scopes cookies to a shared parent domain, and never trusts a tenant id from the URL alone.

**13. RBAC in the UI.** Fetch a permissions object for the session and hide or disable UI and guard routes with it. That is UX only. The API enforces every rule.

**14. Sensitive data in the browser.** Don't log PII or tokens to the console or to error monitoring (scrub them). Avoid putting PII in URLs, which leak via Referer and history. Set `Cache-Control: no-store` on sensitive API responses. Clear in-memory caches on logout.

**15. Security headers checklist.** CSP, HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, and `frame-ancestors`.

---

## 5. Browser and performance (P1): theory answers

**1. Memory profiling.** Use Chrome Task Manager for the trend, the Performance panel with Memory enabled for the sawtooth, and heap snapshot comparison around a repeated action with a filter on "Detached". Read the retainers path to the root, and use Allocations on timeline for non-DOM leaks. → `arch-memory-leak-hunt`

**2. CPU profiling.** Record the Performance panel with CPU throttling, look for long tasks (over 50 ms) in the flame chart, attribute them to functions, and check INP interactions. The React Profiler covers component render cost.

**3. Web Workers.** Background JS threads without the DOM, communicating via `postMessage` (structured clone) or by transferring ArrayBuffers (zero-copy, original becomes unusable). Use them for parsing, search indexes and image processing. → `arch-web-worker-offload`

**4. WebAssembly.** Near-native compute for CPU-heavy or existing native code (codecs, PDF, compression), ideally run inside a worker. Measure against JS first, because boundary crossings and copies cost time.

**5. Virtualization.** Render only the visible rows plus a small overscan, positioned inside a full-height container. Watch for variable heights, keyboard focus, find-in-page and screen-reader context. → `react-virtualized-list`

**6. Core Web Vitals.** LCP (loading, ≤ 2.5 s), INP (responsiveness, ≤ 200 ms) and CLS (visual stability, ≤ 0.1), at the 75th percentile of field data. → `arch-core-web-vitals-plan`

**7. Code splitting.** Split by route and by heavy, rarely used features with `lazy`/`import()`. Preload on intent. Avoid request waterfalls. → `arch-code-splitting-strategy`

**8. Browser extensions (from the job description).** An extension has a background service worker, content scripts that run in an isolated world on pages, and a popup or options UI, all declared in `manifest.json` (MV3). Content scripts share the DOM but not JS globals with the page, and communicate with the extension via messaging. Security: request minimal permissions, never inject unsanitized HTML into host pages, and treat page data as untrusted.

---

## 6. System design: how to run the 45 minutes

Practise `arch-sd-recruitment-portal` and `arch-sd-job-listing` in Interview mode. A reliable structure:

1. **Requirements** (5 min): users, core flows, scale, and non-functional needs (SEO, PII, real-time, a11y, devices).
2. **Architecture** (5 min): surfaces, rendering per surface, CDN, BFF/API, real-time channel.
3. **Data and state model** (10 min): server state cache, URL state, local state, a small context. Define the API shape for the key screens.
4. **Deep dives** (15 min): the hardest interactions. For the portal: the board with optimistic moves and conflicts, uploads, permissions. For listings: search races, pagination, SEO.
5. **Cross-cutting** (5 min): performance, accessibility, security, error handling.
6. **Operations and trade-offs** (5 min): monitoring, testing, rollout, and what you would do differently at 10× scale.

**Rich text editor.** Build `react-rich-text-editor` (90 minutes, React track) first: it makes you implement a document model as the source of truth with the DOM as a projection, map `beforeinput` input types to model operations, restore the selection after each render, and keep the toolbar keyboard-accessible. Then rehearse the design-level extensions its follow-ups ask about: transactions as the only way to change state (undo/redo, autosave and collaboration hang off them), sanitizing pasted HTML, debounced autosave with versioning, OT vs CRDT, and block-level rendering for large documents. Name a library (Lexical, ProseMirror/Tiptap, Slate) only *after* explaining those needs.

---

## 7. Seven-day plan, mapped to the lab

| Day | Focus | Do in the lab |
|---|---|---|
| 1 | Closures, memoization, callbacks, JS internals | `js-memoize`, `js-debounce`, `js-throttle`; closure and async output questions; §3 answers aloud |
| 2 | React rendering, hooks, reconciliation | `arch-memo-child-still-rerenders`, `arch-stale-closures-hooks`, `arch-render-commit-pipeline`, `arch-react-rerender-diagnosis`; React output questions |
| 3 | Recruitment portal HLD | `arch-sd-recruitment-portal` in Interview mode (45 min); then `react-kanban-board` |
| 4 | Job listing HLD + machine coding | `arch-sd-job-listing`, `arch-search-race-conditions`; build `react-autocomplete` and `react-infinite-scroll` |
| 5 | Rich text editor | `react-rich-text-editor` (Study mode first, then Interview mode), §6 notes, `arch-xss-job-description` |
| 6 | Security, browser internals, performance | `arch-auth-tokens-csrf`, `arch-csp-rollout`, `arch-secure-resume-upload`, `arch-memory-leak-hunt`, `arch-web-worker-offload` |
| 7 | Mocks and project deep dives | Re-attempt weak items in Revision mode; `js-concurrency-limit` under a 25-minute timer; rehearse your design-system, Next.js migration and AI copilot stories |

For each project story, prepare the problem, the constraints, the options you rejected, the decision, the measurable result, and what you would change.
