import type { DesignQuestion } from '../schema';

/**
 * Architecture & performance scenario questions: rendering patterns and the Next.js App Router.
 *
 * All claims were checked against the live docs on 2026-11-23 (Next.js 16.4.6 "Latest", React 19.3.1).
 * Several registry URLs now redirect after the Next.js docs were reorganised for Cache Components:
 *  - next-caching-revalidating (/getting-started/caching-and-revalidating) → split into /getting-started/caching and /getting-started/revalidating
 *  - next-ppr (/getting-started/partial-prerendering) → /getting-started/caching (Prerendering section)
 *  - next-caching-guide (/guides/caching) → /guides/caching-without-cache-components ("Previous Model")
 * Evidence entries below cite the canonical page each redirect lands on.
 */

const LAST_VERIFIED = '2026-11-23';
const SENIORITY: DesignQuestion['seniority'] = ['Senior', 'SDE-2', 'SDE-3', 'MTS'];

const NO_FREQUENCY_EVIDENCE =
  'No interview-report evidence was collected for this scenario, so frequency confidence is LOW and no claim is made that any company asks it. It is an original scenario built only from the official documentation listed as evidence.';

// ---------------------------------------------------------------------------
// 1. Rendering strategy per route
// ---------------------------------------------------------------------------

const renderingStrategyChoice: DesignQuestion = {
  schemaVersion: 1,
  kind: 'design',
  execution: 'quiz',
  track: 'architecture',
  id: 'arch-rendering-strategy-choice',
  slug: 'rendering-strategy-choice',
  title: 'Choose a rendering strategy per route for an e-commerce site',
  difficulty: 'medium',
  priority: 'P0',
  seniority: SENIORITY,
  topics: ['rendering strategies', 'SSR', 'SSG', 'ISR', 'Partial Prerendering', 'streaming', 'Core Web Vitals', 'Cache Components'],
  estimatedMinutes: 25,
  conceptIds: ['rendering-strategies', 'core-web-vitals', 'streaming-ssr', 'nextjs-caching', 'nextjs-app-router'],
  research: {
    provenance: 'DOCUMENTED_TECHNICAL_EXERCISE',
    frequencyConfidence: 'LOW_CONFIDENCE',
    verificationStatus: 'SOURCES_VERIFIED',
    lastVerified: LAST_VERIFIED,
    evidence: [
      { sourceId: 'webdev-rendering', url: 'https://web.dev/articles/rendering-on-the-web', originalTitle: 'Rendering on the web', note: 'Trade-offs of static rendering, server-side rendering, CSR and hydration against TTFB, FCP and INP.' },
      { sourceId: 'next-ppr', url: 'https://nextjs.org/docs/app/getting-started/caching', originalTitle: 'Caching', note: 'The registry URL (/getting-started/partial-prerendering) now redirects here; the Prerendering section defines the static shell, App Shell and PPR as the default with Cache Components.' },
      { sourceId: 'next-isr', url: 'https://nextjs.org/docs/app/guides/incremental-static-regeneration', originalTitle: 'How to implement Incremental Static Regeneration (ISR)', note: 'Covers ISR without Cache Components and points to ISR with Cache Components.' },
      { sourceId: 'next-use-cache', url: 'https://nextjs.org/docs/app/api-reference/directives/use-cache', originalTitle: 'use cache', note: 'Cache keys, runtime in-memory storage, and the ban on runtime APIs inside cached scopes.' },
      { sourceId: 'webdev-lcp', url: 'https://web.dev/articles/lcp', originalTitle: 'Largest Contentful Paint (LCP)' },
    ],
    researchNotes: `${NO_FREQUENCY_EVIDENCE} Route-level choices follow the Next.js 16.4 Cache Components model (static shell + Suspense-wrapped dynamic holes); the cacheLife prerendering thresholds and the generateStaticParams/ISR behaviour come from the cacheLife reference and the Migrating to Cache Components guide on nextjs.org.`,
  },
  scenario: `You own the storefront for a mid-size retailer on the **Next.js 16 App Router** with Cache Components enabled. The routes are:

- \`/\`: merchandised banners that editors change a few times a day, plus a "Hi, Sam" greeting and a cart-count badge.
- \`/c/[category]\`: about 2,000 categories, with filters and sort in the query string.
- \`/p/[sku]\`: about 400k SKUs. The top 5k get 80% of traffic. Copy and images rarely change, but **price and stock change often**.
- \`/cart\` and \`/account/*\`: authenticated, per-user.
- \`/search?q=\`: free-text search with typeahead.

Marketing wants p75 mobile LCP under 2.5 s and SEO on home, category and product pages. Infra wants to cut compute spend. For each route, choose CSR, request-time SSR, SSG, ISR, streaming or Partial Prerendering (or a combination). Justify each choice in terms of TTFB, LCP, INP, freshness and server cost.`,
  constraints: [
    'Next.js 16.4 App Router with `cacheComponents: true`, deployed behind a CDN.',
    'Displayed prices may be at most about one minute stale. Catalogue copy may be hours stale.',
    'Sessions are a cookie. No per-user HTML may ever be served from a shared cache.',
  ],
  answerOutline: [
    'Use one lens for every route: are the bytes the same for every visitor, how stale may they be, does the route need to rank, and which data does the LCP element depend on?',
    'Shared, stale-tolerant content goes into the prerendered static shell, which is cheap and has a near-static TTFB. Per-user or must-be-fresh parts become Suspense-wrapped dynamic holes. This is Partial Prerendering, the default with Cache Components.',
    "Home: cached merchandising ('use cache' + cacheLife('hours') + cacheTag) in the shell. The greeting and cart badge read cookies() inside <Suspense>.",
    'Category: generateStaticParams for the categories, and a cached product-grid function keyed by category and normalised filters. Read searchParams deep in the tree, behind a fallback that has the size of the grid.',
    'Product: prerender the hot SKUs. The long tail gets the App Shell and is upgraded and cached on its first visit (ISR with Cache Components). Copy is cached long and tagged. Price and stock are short-lived or uncached holes. The LCP image and H1 sit outside slow boundaries.',
    'Cart and account: rendered at request time inside Suspense under static chrome, never shared-cached, with small client islands for interactivity and mutations through Server Actions.',
    'Search: a static shell with results streamed from a cached search(q). Typeahead is a CSR island.',
    'Tie each choice back to the metrics: TTFB (shell versus waiting for the slowest query), LCP (element outside Suspense), INP (less client JS, hydration split per boundary) and CLS (fallbacks sized like the content). Also cover server cost: render once, or per request.',
    'Say how this differs on the previous caching model and on older versions (whole-route dynamic on cookies(), different fetch defaults).',
  ],
  modelAnswer: `**Decision lens.** For each route, ask four questions. Are the bytes identical for every visitor? How stale may they be? Must the route rank? What is the LCP element, and what data does it need? Content that is shared and can tolerate some staleness gets prerendered. Content that is per-user or must be fresh renders at request time, but only the parts that need it.

**Default shape in Next.js 16 with Cache Components: Partial Prerendering.** At build time Next.js renders each route into a *static shell* (HTML plus an RSC payload). A \`use cache\` result with a long enough lifetime is baked into the shell. Anything that reads \`cookies()\`, \`headers()\`, \`searchParams\`, unknown \`params\` or uncached data must sit behind \`<Suspense>\`: its fallback ships in the shell and its content streams at request time. The shell can be served from a CDN, so even a personalised page gets a near-static TTFB.

| Route | Strategy | Why |
|---|---|---|
| \`/\` | PPR: merchandising cached with \`cacheLife('hours')\` and \`cacheTag('home')\`. Greeting and badge in \`<Suspense>\` | The hero is shared and is the LCP element, so it goes in the shell. The per-user bits must never be shared |
| \`/c/[category]\` | PPR with \`generateStaticParams\`. Grid from a cached \`getProducts(category, filters)\` | Shared and needs SEO. Filters come from \`searchParams\`, so they stream behind a fallback with the grid's size |
| \`/p/[sku]\` | Prerender the top 5k. The long tail gets the App Shell and is upgraded on first visit. Price is short-lived or uncached | Avoids building 400k pages nobody visits. Copy can be stale, price cannot |
| \`/cart\`, \`/account/*\` | Request-time inside Suspense with static chrome. Client islands for steppers and forms | Per-user and private. Never CDN-cached |
| \`/search\` | Static shell plus results streamed from a cached \`search(q)\`. Typeahead runs on the client | The query space is unbounded, so cache what repeats |

~~~tsx
// app/p/[sku]/page.tsx
export async function generateStaticParams() {
  return (await getTopSkus(5000)).map((sku) => ({ sku }))  // must return at least one
}
export default function Page({ params }: { params: Promise<{ sku: string }> }) {
  return (
    <>
      <Suspense fallback={<HeroSkeleton />}>
        <ProductHero params={params} />  {/* 'use cache' + cacheLife('days'); concrete in the shell for known SKUs */}
      </Suspense>
      <Suspense fallback={<PriceSkeleton />}>
        <LivePrice params={params} />    {/* uncached or cacheLife('seconds'): a dynamic hole */}
      </Suspense>
    </>
  )
}
~~~

**Where CSR still fits.** Not for routes that must rank. CSR suits small \`'use client'\` islands such as the cart drawer, filter UI state, typeahead and image zoom.

**Metrics.** *TTFB.* A static shell is as fast as a static file. Classic SSR waits for the slowest query unless it streams. *LCP.* Keep the hero image and H1 outside slow boundaries, because an element inside a boundary cannot paint until its content is swapped in. Preload a known LCP image. *INP.* Server Components ship no component JS, and each Suspense boundary hydrates separately, so hydration happens in smaller tasks. *CLS.* A fallback must reserve the final size.

**Cost.** Prerendered output costs build time and storage, not per-request compute. Every dynamic hole costs a server render per request. Runtime \`use cache\` entries live in per-instance memory by default, which is ephemeral on serverless. \`use cache: remote\` adds a network round trip and only pays off at high hit rates. Removing \`generateStaticParams\` opts a route out of ISR entirely.

**Older versions and the previous model.** Without Cache Components (still supported in 16), one \`cookies()\` read makes the whole route dynamic. You would then push personalisation into client-fetched islands, or accept full SSR. ISR was configured with \`export const revalidate\` or \`fetch(url, { next: { revalidate } })\`. \`fetch\` was cached by default in 14 and is uncached by default from 15.`,
  pitfalls: [
    'Making the whole product page request-time SSR because one widget (price or cart badge) is dynamic. With Cache Components only the Suspense-wrapped hole needs request time.',
    'Prerendering all 400k SKUs at build. Prerender the hot set and let the long tail fill in on first visit.',
    'Putting the LCP image or H1 inside the same Suspense boundary as slow data, which ties LCP to that data.',
    'Caching per-user HTML or data (greeting, cart) in a shared cache or CDN, which leaks it across users.',
    "Expecting a cacheLife('seconds') value to be in the static shell. Short-lived caches are excluded from prerenders and become dynamic holes.",
  ],
  versionNotes: `Checked against Next.js 16.4 and React 19.3 docs on 2026-11-23. Assumes \`cacheComponents: true\` (with \`partialPrefetching: true\`). Since 16.4, create-next-app enables both by default, and the 16.4 release post says Cache Components becomes the default in Next.js 17. Under the previous model, reading cookies()/headers()/searchParams makes the whole route dynamic, and ISR uses the route segment \`revalidate\` or the fetch option \`next.revalidate\`. With Cache Components enabled, those segment configs error and are replaced by use cache + cacheLife. fetch was cached by default in 13–14 and is uncached by default from 15. PPR was experimental in 15 (experimental.ppr / experimental_ppr); 16 removed those flags and made PPR the default behaviour of cacheComponents.`,
  docSourceIds: ['webdev-rendering', 'next-ppr', 'next-isr', 'next-use-cache', 'next-caching-revalidating', 'webdev-vitals', 'webdev-lcp', 'webdev-inp-metric'],
  mcqs: [
    {
      id: 'm1',
      question:
        "Cache Components is enabled. A product page has a static header, a <ProductInfo> component using 'use cache' with cacheLife('days'), and a <CartBadge> that calls await cookies(), wrapped in <Suspense>. What does a direct visit receive first?",
      options: [
        { id: 'a', text: 'Nothing until the whole route renders at request time, because cookies() was read', explanation: 'That is the previous model, where one request-time API made the whole route dynamic. With Cache Components only the Suspense boundary is deferred.' },
        { id: 'b', text: 'A prerendered shell with the header, product info and the badge fallback. The badge streams in at request time', explanation: 'Correct. Cached and static output is in the static shell, and runtime-API access streams behind its Suspense fallback.' },
        { id: 'c', text: 'A build error, because cookies() and use cache cannot appear on the same page', explanation: "They can coexist. The error is reading cookies() inside a 'use cache' scope, not on the same page." },
        { id: 'd', text: 'The badge rendered with empty cookies at build time, never updated', explanation: 'Request-time APIs are not faked during prerender. The fallback ships and the real content streams.' },
      ],
      correctOptionId: 'b',
      explanation: 'With Cache Components, Partial Prerendering is the default. Static and cached content forms the shell, and runtime data inside <Suspense> streams in at request time without making the rest of the route dynamic.',
      sourceIds: ['next-ppr', 'next-use-cache'],
    },
    {
      id: 'm2',
      question: "You wrap getStock(sku) in 'use cache' with cacheLife('seconds') and render it on the product page. What happens during prerendering?",
      options: [
        { id: 'a', text: 'It is baked into the static shell and the shell is rebuilt every second', explanation: 'Static shells are not rebuilt per second. Short-lived caches are kept out of them.' },
        { id: 'b', text: 'It is excluded from the prerender and becomes a dynamic hole resolved at request time, so it needs a Suspense boundary', explanation: 'Correct. The seconds profile (expire 60 s) is under the 5-minute threshold, so it is treated as dynamic.' },
        { id: 'c', text: 'The build fails because cacheLife values must be at least 5 minutes', explanation: 'Short lifetimes are allowed. They only change how the entry participates in prerendering.' },
        { id: 'd', text: 'It is cached until a revalidateTag call, ignoring the profile', explanation: 'The profile still sets stale, revalidate and expire. Tags add on-demand invalidation on top.' },
      ],
      correctOptionId: 'b',
      explanation: "A cache is short-lived when it uses the seconds profile, revalidate: 0, or expire under 5 minutes. Short-lived caches are excluded from prerenders and resolve at request time.",
      sourceIds: ['next-caching-revalidating', 'next-use-cache'],
    },
    {
      id: 'm3',
      question: 'Which change is most likely to regress LCP on the product page?',
      options: [
        { id: 'a', text: 'Moving recommendations into their own Suspense boundary', explanation: 'This usually helps, because slow below-the-fold data no longer blocks the shell.' },
        { id: 'b', text: 'Moving the hero product image inside the Suspense boundary that waits for the live price API', explanation: 'Correct. The LCP element cannot paint until that boundary resolves and is swapped in, so LCP now tracks the price API.' },
        { id: 'c', text: 'Rendering the static description as a Server Component instead of a Client Component', explanation: 'This reduces client JS and does not delay the LCP element.' },
        { id: 'd', text: 'Giving the recommendations skeleton the same height as the final carousel', explanation: 'This prevents layout shift (CLS) and is neutral for LCP.' },
      ],
      correctOptionId: 'b',
      explanation: 'Keep LCP elements in the static shell, outside or above Suspense boundaries that wait on slow data. Preloading the image controls when it downloads, not when its boundary is revealed.',
      sourceIds: ['webdev-lcp', 'webdev-optimize-lcp', 'next-ppr'],
    },
  ],
  followUps: [
    { id: 'f1', level: 'mechanism', question: 'A SKU was not returned by generateStaticParams. What is in its static shell, and what happens on the second visit?', expectedConcepts: ['App Shell with param-specific parts behind fallbacks', 'background upgrade once params are known', 'result cached for the next visitor', 'caches are scoped to one deployment'], sourceIds: ['next-ppr', 'next-isr'] },
    { id: 'f2', level: 'application', question: 'Price must be at most one minute stale, but you still want product pages served from the shell. What are your options?', expectedConcepts: ['uncached or short-lived price as a dynamic hole', 'tag plus revalidateTag from a pricing webhook', 'checkout recomputes the price server-side', 'trade-off between freshness and server cost'], sourceIds: ['next-caching-revalidating', 'next-use-cache'] },
    { id: 'f3', level: 'edge-cases', question: 'An HTML-only crawler (no JavaScript) requests a PPR product page. What does it receive, and what can break?', expectedConcepts: ['HTML-limited bots detected by user agent', 'rendered dynamically so metadata lands in <head>', 'build-time-only data must also exist at request time', 'htmlLimitedBots config'], sourceIds: ['next-loading', 'next-ppr'] },
    { id: 'f4', level: 'production', question: 'How would you check in production that these choices worked?', expectedConcepts: ['field data (RUM) at p75 for LCP, INP and CLS per route', 'TTFB per route', 'CDN hit ratio', 'server compute per route and cache hit rates'], sourceIds: ['webdev-vitals'] },
    { id: 'f5', level: 'architecture', question: 'When would you deliberately choose a client-rendered SPA section instead of server rendering?', expectedConcepts: ['authenticated, app-like views with no SEO need', 'heavy long-lived client state or offline use', 'hydration cost compared with an empty shell', 'TTFB and FCP trade-off against JS cost'], sourceIds: ['webdev-rendering'] },
  ],
};

// ---------------------------------------------------------------------------
// 2. Hydration mismatch debugging
// ---------------------------------------------------------------------------

const hydrationMismatchDebug: DesignQuestion = {
  schemaVersion: 1,
  kind: 'design',
  execution: 'quiz',
  track: 'architecture',
  id: 'arch-hydration-mismatch-debug',
  slug: 'hydration-mismatch-debug',
  title: 'Debug hydration mismatches and the flash they cause',
  difficulty: 'medium',
  priority: 'P0',
  seniority: SENIORITY,
  topics: ['hydration', 'SSR', 'useId', 'suppressHydrationWarning', 'dates and time zones', 'invalid HTML nesting', 'browser extensions'],
  estimatedMinutes: 20,
  conceptIds: ['hydration', 'react-server-components', 'react-effects', 'rendering-strategies', 'react-19-apis'],
  research: {
    provenance: 'DOCUMENTED_TECHNICAL_EXERCISE',
    frequencyConfidence: 'LOW_CONFIDENCE',
    verificationStatus: 'SOURCES_VERIFIED',
    lastVerified: LAST_VERIFIED,
    evidence: [
      { sourceId: 'react-hydrateroot', url: 'https://react.dev/reference/react-dom/client/hydrateRoot', originalTitle: 'hydrateRoot', note: 'Mismatches are bugs, common causes, suppressHydrationWarning, two-pass rendering, onRecoverableError.' },
      { sourceId: 'react-19-release', url: 'https://react.dev/blog/2024/12/05/react-19', originalTitle: 'React v19', note: 'Diff-style hydration errors ("this tree will be regenerated on the client") and skipping unexpected <head>/<body> tags from extensions.' },
      { sourceId: 'next-app-router', url: 'https://nextjs.org/docs/messages/react-hydration-error', originalTitle: 'Text content does not match server-rendered HTML', note: 'Next.js error-message page listing causes (invalid nesting, typeof window, Date, extensions, CDN rewriting, iOS format detection). There is no dedicated registry entry, so it is filed under the Next.js docs source.' },
      { sourceId: 'next-server-client', url: 'https://nextjs.org/docs/app/getting-started/server-and-client-components', originalTitle: 'Server and Client Components', note: 'Client Components are prerendered to HTML and then hydrated.' },
    ],
    researchNotes: `${NO_FREQUENCY_EVIDENCE} The React 19.3 \`use(browser())\` API is taken from the React 19.3 release post (https://react.dev/blog/2026/09/09/react-19-3), which is not yet in the source registry.`,
  },
  scenario: `After a release, error monitoring reports **"Hydration failed because the server rendered HTML didn't match the client"** on about 3% of product-page views. Users also report the header "jumping" and the order-date text flashing. Recent changes in Client Components that are server-rendered for the initial HTML:

- \`<PromoBanner>\` renders \`typeof window !== 'undefined' && localStorage.getItem('dismissed') ? null : <Banner/>\`.
- The order-history list renders \`new Date(order.createdAt).toLocaleString()\`.
- \`<Tooltip>\` builds its \`aria-describedby\` id from \`Math.random()\`.
- The CMS product description (HTML that contains \`<div>\`s) is rendered inside a \`<p>\`.
- A dark-mode toggle reads \`localStorage.theme\` during render to choose a class.

Some reports come only from users with a particular password-manager extension installed. Diagnose each cause and fix it properly.`,
  constraints: [
    'Next.js 16 App Router, React 19.3. Servers run in UTC with the en-US locale. Users are worldwide.',
    'Do not hide errors globally. The page must stay SEO-friendly and must not gain layout shift.',
  ],
  answerOutline: [
    'Define hydration: React attaches to the server HTML and expects the first client render to produce identical output. Mismatches are bugs.',
    'Explain the flash: on a mismatch React 19 discards the server HTML for that tree and regenerates it on the client. Attribute differences are not guaranteed to be patched.',
    'Triage: production build, read the dev-overlay diff, retry in a clean profile to separate extension reports, compare view-source with the live DOM.',
    'Dates and locales: format deterministically (explicit locale and timeZone on both sides), or render a stable value on the server and localise after hydration. suppressHydrationWarning only for an unavoidable leaf.',
    'Browser-only state in render (typeof window, localStorage): use a two-pass render with an effect, or React 19.3 use(browser()) under a Suspense fallback, or move the state into a cookie the server can read. Reserve the space so nothing shifts.',
    'Theme flash: render the theme from a cookie on the server, or set the class on <html> from a tiny inline script before hydration and add suppressHydrationWarning on <html>.',
    'Random ids: useId, which matches between server and client when the trees match.',
    'Invalid nesting: the HTML parser closes <p> before a <div>, so the DOM no longer matches React’s tree. Render rich text into a <div> and sanitise it.',
    'Extensions and rewriters: React 19 skips injected <head>/<body> tags, but in-tree mutations, CDN auto-minify and iOS auto-linking still cause mismatches.',
    'Prevent regressions: hydrate pages in tests and fail on recoverable errors, monitor recoverable errors in production, and lint DOM nesting.',
  ],
  modelAnswer: `**What is happening.** Hydration attaches React to server-generated HTML. \`hydrateRoot\` expects the first client render to produce *identical* output, and the React docs say to treat any mismatch as a bug. React 19 reports a mismatch as a single error with a diff ("…this tree will be regenerated on the client"). React throws away the server HTML for that subtree and client-renders it. That re-render is the flash users see, and it wastes the SSR work. React does not guarantee to patch attribute differences, so some wrong attributes can survive silently.

**Triage.** Reproduce on a production build. Read the diff in the dev overlay. Repeat in a clean browser profile to separate the extension reports. Compare view-source (the server HTML) with the live DOM.

**Fix each cause at its root.**

1. *Dates and locales.* \`toLocaleString()\` runs as UTC/en-US on the server and in the user's zone and locale in the browser. Either make the output deterministic, by passing an explicit \`locale\` and \`timeZone\` (from a user setting or cookie) to \`Intl.DateTimeFormat\` on both sides, or render a stable value on the server (an ISO date in \`<time dateTime>\`) and localise after hydration. \`suppressHydrationWarning\` on one \`<time>\` is acceptable when the difference is truly unavoidable. It only works one level deep, and React will not patch that text.
2. *\`typeof window\` or \`localStorage\` in render.* The server and the first client render take different branches. Read browser-only state after hydration. Use the classic two-pass render (state set in an effect), or in React 19.3+ call \`use(browser())\` in a component under a \`<Suspense>\` fallback. Either way, reserve the banner's space so it doesn't cause CLS. Better: store "dismissed" in a cookie so the server renders the right thing from the start.
3. *Theme flash.* Reading localStorage after mount fixes the error but flashes light, then dark. Put the theme in a cookie the server reads. Alternatively, set the class on \`<html>\` from a tiny inline script before hydration and add \`suppressHydrationWarning\` to \`<html>\` (it only covers that element's attributes).
4. *Random ids.* \`Math.random()\` differs on every render. \`useId()\` produces the same ids on server and client as long as the component trees match.
5. *Invalid nesting.* A \`<div>\` inside a \`<p>\` is invalid HTML, so the browser's parser closes the \`<p>\` early and the DOM no longer matches React's tree. Render rich text into a \`<div>\` and sanitise the CMS HTML.
6. *Extensions and HTML rewriters.* React 19 skips unexpected tags that extensions insert into \`<head>\` and \`<body>\`. Mutations *inside* your tree, CDN "auto minify", and iOS phone-number and date auto-linking can still cause mismatches. Turn off HTML rewriting and add a \`format-detection\` meta tag.

~~~tsx
'use client'
import { Suspense, use } from 'react'
import { browser } from 'react-dom'          // React 19.3+

function LocalTime({ iso }: { iso: string }) {
  use(browser())                              // suspends during SSR only
  return <time dateTime={iso}>{new Date(iso).toLocaleString()}</time>
}
export function OrderDate({ iso }: { iso: string }) {
  return (
    <Suspense fallback={<time dateTime={iso}>{iso.slice(0, 10)}</time>}>
      <LocalTime iso={iso} />
    </Suspense>
  )
}
~~~

**Anti-fixes.** \`dynamic(() => import('./X'), { ssr: false })\` (allowed only in Client Components) and blanket \`suppressHydrationWarning\` hide the symptom and often remove content that search engines should index. Cache Components adds its own guardrail: \`Date.now()\`, \`Math.random()\` and \`crypto.randomUUID()\` during prerender must sit behind \`connection()\` plus Suspense, or be cached with \`use cache\`.

**Prevent regressions.** Add tests that server-render and then hydrate key pages, failing on recoverable errors. Send recoverable hydration errors to monitoring. Lint for invalid DOM nesting.`,
  pitfalls: [
    'Spreading suppressHydrationWarning everywhere. It only works one level deep, and React will not patch the mismatched text.',
    'Using ssr: false for content that should be indexed or is above the fold, which trades an error for worse SEO and LCP.',
    "Treating typeof window checks in render as a way to 'detect the client'. They cause the mismatch, they don't fix it.",
    'Generating ids with Math.random() or a module-level counter instead of useId.',
    'Writing off every report as an extension problem. React 19 tolerates injected <head>/<body> tags, but not mutations inside your tree.',
  ],
  versionNotes:
    'Checked against Next.js 16.4 and React 19.3 docs on 2026-11-23. React 19 introduced single diff-style hydration errors and skips unexpected <head>/<body> tags inserted by extensions and third-party scripts. React 18 logged several less specific errors. React 19.3 added use(browser()) from react-dom as a first-class way to skip server rendering for one component; earlier versions use a two-pass render (useState + useEffect). With Cache Components in Next.js 16, time-dependent and random values during prerender must be wrapped with connection() plus Suspense, or cached.',
  docSourceIds: ['react-hydrateroot', 'react-19-release', 'react-suspense', 'react-use', 'next-server-client', 'mdn-intl-datetimeformat'],
  mcqs: [
    {
      id: 'm1',
      question: 'A Client Component renders <p>{new Date(ts).toLocaleTimeString()}</p>. The server runs in UTC and the user is in Asia/Kolkata. What happens on first load with React 19?',
      options: [
        { id: 'a', text: 'React silently patches the text node at no cost', explanation: 'React does not quietly patch text mismatches. It reports an error and recovers by client rendering.' },
        { id: 'b', text: 'A hydration mismatch is reported, and React regenerates that tree on the client, so the text visibly changes', explanation: 'Correct. The React 19 error says the tree "will be regenerated on the client". The server HTML for that subtree is discarded.' },
        { id: 'c', text: 'The server time stays on screen until the next navigation', explanation: 'React does not keep mismatched server text. It client-renders the affected tree.' },
        { id: 'd', text: 'Next.js fails the build because Date is used in a Client Component', explanation: 'Client Components may use Date. The problem is that the output differs between environments.' },
      ],
      correctOptionId: 'b',
      explanation: 'The first client render must match the server HTML. When it doesn’t, React 19 reports one error with a diff and re-creates that subtree on the client, which causes the flash and wastes the SSR work.',
      sourceIds: ['react-19-release', 'react-hydrateroot'],
    },
    {
      id: 'm2',
      question: 'Which way of generating a tooltip id avoids hydration mismatches?',
      options: [
        { id: 'a', text: 'const id = useMemo(() => Math.random().toString(36), [])', explanation: 'useMemo runs separately on the server and the client, so the values still differ.' },
        { id: 'b', text: 'const id = useRef(crypto.randomUUID()).current', explanation: 'Same problem: each environment generates its own random value.' },
        { id: 'c', text: 'const id = useId()', explanation: 'Correct. useId produces stable ids that match between server and client when the component trees match.' },
        { id: 'd', text: 'let n = 0; const id = "tip-" + n++ (module-level counter)', explanation: 'The order of server output and client hydration need not match, and server counters persist across requests.' },
      ],
      correctOptionId: 'c',
      explanation: 'useId exists for exactly this case. With several React roots on a page, pass a matching identifierPrefix to the server renderer and to hydrateRoot.',
      sourceIds: ['react-hydrateroot'],
    },
    {
      id: 'm3',
      question: 'CMS HTML containing <div> elements is rendered inside a <p>. Why does this cause a hydration error even though the server and client render the same JSX?',
      options: [
        { id: 'a', text: 'React does not allow dangerouslySetInnerHTML during SSR', explanation: 'dangerouslySetInnerHTML works with SSR.' },
        { id: 'b', text: 'The browser’s HTML parser closes the <p> before the <div>, so the parsed DOM differs from the tree React expects', explanation: 'Correct. Invalid nesting is repaired by the parser, and the resulting DOM no longer matches React’s tree.' },
        { id: 'c', text: 'Block elements always re-render on the client', explanation: 'Element type does not decide client rendering.' },
        { id: 'd', text: 'The CMS HTML is escaped differently on the server', explanation: 'The cause is HTML parsing of invalid nesting, not escaping.' },
      ],
      correctOptionId: 'b',
      explanation: 'Invalid nesting such as <div> in <p>, <p> in <p>, or <a> in <a> is listed as a common cause of hydration errors in the Next.js error docs. Fix the markup rather than suppressing the warning.',
      sourceIds: ['next-app-router', 'react-hydrateroot'],
    },
  ],
  followUps: [
    { id: 'f1', level: 'mechanism', question: 'Why are attribute mismatches potentially worse than text mismatches?', expectedConcepts: ['React does not guarantee patching attributes', 'the DOM may keep the server value', 'event handlers can attach to the wrong elements', 'validating every attribute would be too expensive'], sourceIds: ['react-hydrateroot'] },
    { id: 'f2', level: 'application', question: 'Implement dark mode with no flash and no hydration error.', expectedConcepts: ['theme cookie read on the server', 'or a blocking inline script that sets the class before paint', 'suppressHydrationWarning on <html> only', 'prefers-color-scheme as the default'], sourceIds: ['react-hydrateroot', 'next-server-client'] },
    { id: 'f3', level: 'edge-cases', question: 'Compare a two-pass render, use(browser()), and next/dynamic with ssr: false for client-only UI.', expectedConcepts: ['extra render right after hydration', 'Suspense fallback is what lands in the HTML', 'ssr: false only works in Client Components', 'content missing from the HTML hurts SEO', 'reserve space to avoid CLS'], sourceIds: ['react-suspense', 'react-use', 'react-hydrateroot'] },
    { id: 'f4', level: 'production', question: 'How do you catch hydration regressions before users do?', expectedConcepts: ['E2E tests that fail on hydration console errors', 'monitor recoverable errors in production', 'smoke-test production builds', 'audit CDN HTML rewriting'], sourceIds: ['react-hydrateroot'] },
    { id: 'f5', level: 'architecture', question: 'How does moving UI to Server Components reduce the hydration-mismatch surface?', expectedConcepts: ['Server Components are not hydrated', 'only Client Components hydrate', 'fewer environment-dependent branches', 'smaller client islands'], sourceIds: ['next-server-client', 'react-server-components'] },
  ],
};

// ---------------------------------------------------------------------------
// 3. Streaming and Suspense boundaries
// ---------------------------------------------------------------------------

const streamingSuspenseBoundaries: DesignQuestion = {
  schemaVersion: 1,
  kind: 'design',
  execution: 'quiz',
  track: 'architecture',
  id: 'arch-streaming-suspense-boundaries',
  slug: 'streaming-suspense-boundaries',
  title: 'Fix a slow product page with Suspense and streaming',
  difficulty: 'hard',
  priority: 'P1',
  seniority: SENIORITY,
  topics: ['streaming SSR', 'Suspense boundaries', 'loading.js', 'TTFB', 'LCP', 'error boundaries', 'SEO', 'waterfalls'],
  estimatedMinutes: 25,
  conceptIds: ['streaming-ssr', 'core-web-vitals', 'nextjs-app-router', 'async-ui-states', 'hydration'],
  research: {
    provenance: 'DOCUMENTED_TECHNICAL_EXERCISE',
    frequencyConfidence: 'LOW_CONFIDENCE',
    verificationStatus: 'SOURCES_VERIFIED',
    lastVerified: LAST_VERIFIED,
    evidence: [
      { sourceId: 'next-loading', url: 'https://nextjs.org/docs/app/api-reference/file-conventions/loading', originalTitle: 'loading.js', note: 'What loading.js wraps, prefetched fallbacks, SEO and status-code behaviour of streamed responses.' },
      { sourceId: 'next-app-router', url: 'https://nextjs.org/docs/app/guides/streaming', originalTitle: 'Streaming', note: 'Streaming guide (no dedicated registry entry): loading.js compared with <Suspense>, errors mid-stream, Web Vitals, the HTTP contract, bots, buffering proxies.' },
      { sourceId: 'next-error-handling', url: 'https://nextjs.org/docs/app/getting-started/error-handling', originalTitle: 'Error Handling', note: 'error.js and the component-level catchError boundary.' },
      { sourceId: 'react-suspense', url: 'https://react.dev/reference/react/Suspense', originalTitle: '<Suspense>' },
      { sourceId: 'patterns-streaming-ssr', url: 'https://www.patterns.dev/react/streaming-ssr', originalTitle: 'Streaming Server-Side Rendering' },
    ],
    researchNotes: `${NO_FREQUENCY_EVIDENCE} The 404 behaviour with Cache Components (the shell is sent with 200 first, and Proxy is needed for a request-time 404 status) comes from the HTTP-contract section of the Next.js Streaming guide.`,
  },
  scenario: `\`app/p/[sku]/page.tsx\` awaits three calls **sequentially at the top of the page** and then returns JSX:

1. \`getProduct(sku)\`: 80 ms.
2. \`getReviews(sku)\`: 300 ms.
3. \`getRecommendations(sku)\`: p50 900 ms, p99 4 s, and it occasionally returns 5xx.

TTFB p75 is 1.6 s and LCP p75 is 2.9 s. Recommendations are below the fold. Restructure the page using Suspense boundaries and streaming (and \`loading.js\` if appropriate). Decide what belongs in the shell, how errors are handled, and what happens to SEO and status codes.`,
  constraints: [
    'Next.js 16.4 App Router with Cache Components enabled.',
    'Product title, price, main image and the Add-to-cart button must be in the first HTML. A recommendations outage must not break the page.',
    'Unknown SKUs must not be indexed, and should ideally return a real 404 status.',
  ],
  answerOutline: [
    'Diagnose the waterfall: sequential awaits before any JSX is returned, so TTFB is the sum of the chain and nothing can stream.',
    'Push each await down into the component that needs it, so independent work starts in parallel.',
    "Shell: layout plus a product hero backed by a cached getProduct ('use cache', cacheLife, cacheTag), with price and an Add-to-cart client island. Keep the LCP image outside slow boundaries.",
    'Reviews and recommendations each get their own sibling <Suspense> boundary with a fallback that matches the final dimensions.',
    'loading.js wraps the whole page in one boundary and is prefetched for navigations. That is too coarse here, so use granular Suspense close to the slow access.',
    'Errors: a component-level error boundary (catchError, or a custom boundary) or a try/catch that renders nothing, plus a timeout (AbortSignal.timeout). error.js stays the route-level net. Once streaming has started the status is already 200.',
    'SEO: streamed HTML is still server-rendered and indexable, and HTML-limited bots get metadata in <head>. notFound() mid-stream adds noindex. For a request-time 404 status with Cache Components, check in Proxy.',
    'Optionally pass a promise to a Client Component and read it with use() for a client-side carousel.',
    'Ops: make sure reverse proxies, CDN and compression do not buffer the stream, then re-measure TTFB and LCP.',
  ],
  modelAnswer: `**Why it is slow.** Three sequential awaits at the top of \`page.tsx\` form a waterfall (80 + 300 + 900 ms at p50). Because the page awaits before returning any JSX, nothing can be sent until all three finish. TTFB therefore equals the whole chain, and the browser can't even discover the LCP image. A below-the-fold nice-to-have is holding the response hostage.

**Restructure around boundaries.**

~~~tsx
// app/p/[sku]/page.tsx
export default function Page({ params }: { params: Promise<{ sku: string }> }) {
  return (
    <>
      <Suspense fallback={<HeroSkeleton />}>
        <ProductHero params={params} />    {/* title, price, image, <AddToCart/> */}
      </Suspense>
      <Suspense fallback={<ReviewsSkeleton />}>    {/* fixed min-height */}
        <Reviews params={params} />
      </Suspense>
      <RecsErrorBoundary>                   {/* e.g. built with catchError */}
        <Suspense fallback={<RecsSkeleton />}>
          <Recommendations params={params} />
        </Suspense>
      </RecsErrorBoundary>
    </>
  )
}

async function getProduct(sku: string) {
  'use cache'
  cacheLife('hours')
  cacheTag('product:' + sku)
  return db.product.find(sku)
}
~~~

- **Shell.** \`getProduct\` is cached. For SKUs returned by \`generateStaticParams\`, the hero (H1, price, main image, Add-to-cart island) resolves during prerender, so the shell contains the real hero rather than the skeleton. Other SKUs get the App Shell and are filled in on first visit. Keep the LCP image outside slow boundaries, because an element inside a boundary can't paint until its content is swapped in. Use \`preload\` on \`next/image\` for a known LCP image.
- **Sibling boundaries.** Reviews and recommendations each await their own data inside their own \`<Suspense>\`. They start in parallel and stream independently, in whichever order they finish. Each boundary is also a separate hydration unit, which helps INP.
- **Fallbacks with the final dimensions** reserve space so the swap does not cause CLS.

**\`loading.js\` vs \`<Suspense>\`.** \`loading.js\` wraps the segment's \`page.js\` (but not the same-segment \`layout.js\`) in one boundary, and its fallback is prefetched, so navigations show it instantly. Here it is too coarse: the whole page would drop to a skeleton and the hero would wait for the slowest query. Use it at most as a navigation fallback, and put granular boundaries close to the slow access.

**Errors.** Once the first chunk is sent, the response is \`200\` and can't change. Contain recommendation failures with a component-level error boundary (\`catchError\` from \`next/error\`, stable since 16.3, or your own), or catch inside \`Recommendations\` and render nothing. Bound latency with \`fetch(url, { signal: AbortSignal.timeout(1500) })\` so a hung dependency can't hold the stream open. \`error.js\` stays as the route-level safety net.

**404s and SEO.** Streamed content is server-rendered HTML, so it is indexable. HTML-limited bots get \`generateMetadata\` resolved into \`<head>\` before content streams. If \`notFound()\` fires after streaming has begun, Next.js renders the not-found UI and injects \`noindex\`, but the status stays 200. Without Cache Components, calling \`notFound()\` before any boundary still returns a real 404. With Cache Components the shell (and a 200) goes out first, so do the existence check in Proxy if you need a request-time 404 status.

**Ops.** Make sure nginx, the CDN and compression don't buffer the response (for nginx, set \`X-Accel-Buffering: no\`). Then verify that TTFB has dropped to shell time and that LCP now tracks the hero, not the recommendations.`,
  pitfalls: [
    'Adding Suspense but still awaiting all the data at the top of page.tsx, which leaves the boundary nothing to stream.',
    'Using one loading.js for the whole page, which hides the hero behind a skeleton and ties LCP to the slowest query.',
    'Using skeletons with different dimensions from the final content, which trades a TTFB win for CLS.',
    'Letting a recommendations error bubble up to error.js and replace the whole page, or expecting a 500 status after streaming has started.',
    'Relying on notFound() inside a streamed boundary for a 404 status. The response is already 200, and notFound() only adds noindex.',
  ],
  versionNotes:
    'Checked against Next.js 16.4 and React 19.3 docs on 2026-11-23. catchError (next/error) was introduced as unstable_catchError in 16.2 and became stable in 16.3. The error.js retry prop also became stable in 16.3. With Cache Components the static shell is sent first, so a request-time 404 status needs Proxy (16 renamed middleware to proxy). Without Cache Components, notFound() before the first boundary still yields a 404. Since React 19.2, React batches Suspense reveals during SSR, revealing at most once every 300 ms.',
  docSourceIds: ['next-loading', 'next-error-handling', 'next-fetching-data', 'react-suspense', 'patterns-streaming-ssr', 'next-ppr', 'webdev-lcp', 'webdev-cls'],
  mcqs: [
    {
      id: 'm1',
      question: 'page.tsx runs const a = await getA(); const b = await getB(); const c = await getC(); and then returns JSX with <Suspense> around the part that renders c. What happens to TTFB?',
      options: [
        { id: 'a', text: 'It drops to the time of getA, because c is inside Suspense', explanation: 'The boundary only helps when the await happens inside the suspending child. Here all three awaits run before any JSX exists.' },
        { id: 'b', text: 'It still waits for all three calls, because the awaits happen before the component returns', explanation: 'Correct. Move each await into the component that needs it, under its own boundary.' },
        { id: 'c', text: 'Next.js automatically parallelises sequential awaits in Server Components', explanation: 'No such transformation exists. Sequential awaits form a waterfall.' },
        { id: 'd', text: 'It waits only for getC, because the others are memoized', explanation: 'Memoization dedupes identical requests. It does not skip waiting on different ones.' },
      ],
      correctOptionId: 'b',
      explanation: 'Suspense can only show a fallback for work that suspends inside its subtree. Data awaited by the parent before rendering blocks everything.',
      sourceIds: ['next-fetching-data', 'react-suspense'],
    },
    {
      id: 'm2',
      question: 'app/p/[sku]/ contains layout.tsx, loading.tsx and page.tsx. What does the loading.tsx boundary cover?',
      options: [
        { id: 'a', text: 'The layout and the page, so it also shows while the layout fetches data', explanation: 'loading.js is nested inside the same-segment layout and does not wrap it.' },
        { id: 'b', text: 'page.tsx (and nested layouts and pages below it), but not the same-segment layout.tsx', explanation: 'Correct. Uncached data in that layout is not covered by its fallback.' },
        { id: 'c', text: 'Only Client Components in the page', explanation: 'It is a Suspense boundary around the page subtree, whether the components are Server or Client Components.' },
        { id: 'd', text: 'Nothing on direct loads. It only works for client-side navigations', explanation: 'It works on direct loads too. On navigations its fallback is also prefetched.' },
      ],
      correctOptionId: 'b',
      explanation: 'loading.js wraps not-found.js, page.js and nested layouts in a Suspense boundary. It does not wrap the layout.js, template.js or error.js of the same segment.',
      sourceIds: ['next-loading'],
    },
    {
      id: 'm3',
      question: 'Recommendations throws after the response has started streaming. What do the user and the HTTP client receive?',
      options: [
        { id: 'a', text: 'A 500 status and the route-level error page', explanation: 'Once streaming has begun the status code has already been sent and cannot change.' },
        { id: 'b', text: 'A 200 response, with the nearest error boundary replacing only that section while the rest of the page stays intact', explanation: 'Correct. The error is handled inside the streamed HTML.' },
        { id: 'c', text: 'The stream is aborted and the browser shows a network error', explanation: 'Next.js renders the nearest error boundary instead of dropping the connection.' },
        { id: 'd', text: 'A 503 status, with a retry from the server after 30 s', explanation: 'There is no automatic server retry. error.js exposes retry() for the user.' },
      ],
      correctOptionId: 'b',
      explanation: 'Streaming commits to 200 OK with the first chunk. Mid-stream errors are caught by the nearest error boundary, so place a component-level boundary around non-critical sections.',
      sourceIds: ['next-error-handling', 'next-loading'],
    },
  ],
  followUps: [
    { id: 'f1', level: 'mechanism', question: 'How does a late Suspense boundary reach the browser and replace its fallback without a client-side fetch?', expectedConcepts: ['more HTML chunks in the same response', 'inline script swaps the fallback for the content', 'RSC payload for the boundary', 'selective hydration per boundary'], sourceIds: ['patterns-streaming-ssr', 'react-render-pipeable'] },
    { id: 'f2', level: 'application', question: 'Recommendations must render in a client-side carousel. How do you stream the data into a Client Component?', expectedConcepts: ['start the fetch in a Server Component', 'pass the promise as a prop', 'read it with use() in the Client Component', 'Suspense around the consumer', 'serialisable data'], sourceIds: ['react-use', 'next-fetching-data'] },
    { id: 'f3', level: 'edge-cases', question: 'Streaming works locally, but in production everything appears at once. What do you check?', expectedConcepts: ['reverse-proxy buffering (X-Accel-Buffering)', 'CDN buffering', 'serverless response-streaming mode', 'compression flushing', 'browser buffering of tiny responses'], sourceIds: ['next-app-router'] },
    { id: 'f4', level: 'production', question: 'How would you set and enforce a latency budget for recommendations?', expectedConcepts: ['timeout with AbortSignal', 'short-lived cache per SKU', 'fallback or empty state on timeout', 'monitor p99 and error rate', 'defer to the client after idle if needed'], sourceIds: ['next-error-handling'] },
    { id: 'f5', level: 'architecture', question: 'Compare streaming with PPR against classic SSR plus client-side fetching for below-the-fold widgets.', expectedConcepts: ['one response, no extra round trip', 'connection held open while streaming', 'static shell served from cache', 'client JS and hydration cost', 'SEO of the streamed content'], sourceIds: ['webdev-rendering', 'next-ppr'] },
  ],
};

// ---------------------------------------------------------------------------
// 4. Server / Client Component boundary
// ---------------------------------------------------------------------------

const serverClientBoundary: DesignQuestion = {
  schemaVersion: 1,
  kind: 'design',
  execution: 'quiz',
  track: 'architecture',
  id: 'arch-server-client-boundary',
  slug: 'server-client-boundary',
  title: 'Refactor a Pages Router page into Server and Client Components',
  difficulty: 'medium',
  priority: 'P0',
  seniority: SENIORITY,
  topics: ['React Server Components', "'use client'", 'Server Functions', 'serialisation', 'server-only', 'bundle size', 'Pages to App Router migration'],
  estimatedMinutes: 25,
  conceptIds: ['react-server-components', 'nextjs-app-router', 'code-splitting', 'react-19-actions', 'react-context'],
  research: {
    provenance: 'DOCUMENTED_TECHNICAL_EXERCISE',
    frequencyConfidence: 'LOW_CONFIDENCE',
    verificationStatus: 'SOURCES_VERIFIED',
    lastVerified: LAST_VERIFIED,
    evidence: [
      { sourceId: 'next-server-client', url: 'https://nextjs.org/docs/app/getting-started/server-and-client-components', originalTitle: 'Server and Client Components', note: 'Boundary semantics, serialisable props, interleaving through children, context providers, third-party wrappers, server-only and environment poisoning.' },
      { sourceId: 'react-use-client', url: 'https://react.dev/reference/rsc/use-client', originalTitle: "'use client'", note: 'The boundary is defined on the module dependency tree, and the serialisable prop types.' },
      { sourceId: 'react-server-functions', url: 'https://react.dev/reference/rsc/server-functions', originalTitle: 'Server Functions' },
      { sourceId: 'next-app-router', url: 'https://nextjs.org/docs/app/guides/migrating/app-router-migration', originalTitle: 'How to migrate from Pages to the App Router', note: 'getServerSideProps/getStaticProps replaced by fetching in Server Components, and next/router replaced by next/navigation.' },
    ],
    researchNotes: `${NO_FREQUENCY_EVIDENCE} The React 19.3 change that lets Server Components render a client Context directly comes from the React 19.3 release post (https://react.dev/blog/2026/09/09/react-19-3), which is not yet in the source registry.`,
  },
  scenario: `A legacy \`pages/products/[id].tsx\` uses \`getServerSideProps\` to load the product, its reviews and the user's wishlist status. It does this through a shared \`lib/api.ts\` that uses a DB client and \`process.env.PAYMENTS_KEY\`, and some existing client components import the same file. The page renders one large component containing:

- an image gallery with zoom (local state),
- a size selector,
- an "Add to wishlist" button that POSTs to \`/api/wishlist\`,
- a static reviews list,
- a product description rendered from Markdown with a 90 KB Markdown library,
- a ThemeContext provider around everything.

Migrate the page to the App Router. Decide where \`'use client'\` goes, how data and Server Functions cross the boundary, and how to keep server-only code out of the browser.`,
  constraints: [
    'Next.js 16.4 and React 19.3. Keep the page SEO-friendly and minimise client JavaScript.',
    'The wishlist must work without a separate API route.',
    'lib/api.ts is currently imported by both server code and client components.',
  ],
  answerOutline: [
    'Default to Server Components. An async page.tsx (or a data-access module it calls) replaces getServerSideProps. params is a Promise.',
    "Find the interactive leaves (Gallery, SizeSelector, WishlistButton) and put 'use client' only at the top of those files. The boundary is the module graph, so everything those files import ships too.",
    'Keep the static parts on the server: Markdown rendered on the server (the parser never ships) and the reviews list.',
    'Props that cross the boundary must be serialisable. Pass minimal DTOs, never DB rows or secrets. Promises can cross and be read with use().',
    'Interleave by passing Server Components as children or props to Client Components (for example a client Tabs component with server-rendered panels).',
    "Write Server Functions in a 'use server' module. Import them into a Client Component or pass them as props. Authenticate and validate inside each one, because they are POST endpoints.",
    "Prevent environment poisoning: split lib/api.ts, and mark the server half with import 'server-only'. Only NEXT_PUBLIC_ env vars reach the client.",
    "Context: a 'use client' provider that wraps {children}, rendered as deep as practical. React 19.3 also lets a Server Component render a client Context directly.",
    "Wrap third-party client-only components in your own 'use client' file, and replace next/router with next/navigation hooks.",
  ],
  modelAnswer: `**Start from the server.** In the App Router, \`page.tsx\` is a Server Component by default and can be \`async\`. The data loading in \`getServerSideProps\` moves into the component tree, ideally behind a server-only data-access module. \`params\` is a \`Promise\`; since Next.js 16 it can only be read asynchronously.

**Draw the boundary at the leaves.** \`'use client'\` marks a boundary in the *module graph*. The file, everything it imports, and the components it renders directly all become client code. So put it only at the top of the interactive leaves (\`Gallery\`, \`SizeSelector\`, \`WishlistButton\`) and never on the page. Reviews and the Markdown description stay Server Components, so the 90 KB parser never reaches the browser. Only its HTML output does.

~~~tsx
// app/products/[id]/page.tsx (Server Component)
import { getProductDTO } from '@/data/products'     // starts with import 'server-only'
import { addToWishlist } from './actions'
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <Product params={params} />
    </Suspense>
  )
}
async function Product({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const p = await getProductDTO(id)                  // minimal, client-safe shape
  return (
    <>
      <Gallery images={p.images} />                  {/* 'use client' */}
      <SizeSelector sizes={p.sizes} />               {/* 'use client' */}
      <WishlistButton productId={id} action={addToWishlist} />
      <Markdown source={p.description} />            {/* stays on the server */}
      <Reviews productId={id} />
    </>
  )
}

// app/products/[id]/actions.ts
'use server'
export async function addToWishlist(productId: string) {
  const user = await requireUser()                    // auth inside the function
  const id = ProductId.parse(productId)               // validate untrusted input
  await wishlist.add(user.id, id)
  updateTag('wishlist:' + user.id)
}
~~~

**Crossing the boundary.** Props passed from a Server Component to a Client Component must be serialisable by React. Plain data, Dates, Promises, JSX and Server Functions are allowed; class instances and ordinary functions are not. Everything you pass ends up in the RSC payload, which the browser can read, so send small DTOs rather than DB rows. If a client leaf needs data that resolves later, pass the *promise* and read it with \`use()\` under Suspense. To nest server-rendered UI inside an interactive shell such as a client \`Tabs\` or \`Modal\`, pass Server Components as \`children\` or props. They render on the server and arrive as output, not as client code.

**Mutations without an API route.** A \`'use server'\` module exports Server Functions. Client Components can import them or receive them as props. Each one is reachable as a POST endpoint, so authenticate, authorise and validate inside every function. In \`WishlistButton\`, use \`useOptimistic\` inside a transition for instant feedback.

**Stop environment poisoning.** The real hazard is \`lib/api.ts\`, which mixes DB access and \`PAYMENTS_KEY\` with client imports. Split it into a server-only data module (\`import 'server-only'\` makes any client import a build error) and a client-safe module. Only \`NEXT_PUBLIC_\` variables are inlined into client bundles. Others become empty strings, which fails silently.

**Context and third parties.** Server Components can't use context. Create a \`'use client'\` provider that wraps \`{children}\` and render it as deep in the tree as practical. In React 19.3+, a Server Component can also render a Context imported from a \`'use client'\` module directly. Wrap client-only third-party widgets that lack the directive in your own \`'use client'\` file. Replace \`next/router\` with the \`next/navigation\` hooks in client leaves.`,
  pitfalls: [
    "Putting 'use client' on page.tsx or a top-level layout, which pulls the whole subtree and all its imports into the client bundle.",
    'Passing full database records or secrets as props. Every prop is serialised into the RSC payload, which the client can read.',
    "Importing a module that reads process.env secrets into a Client Component. Variables without the NEXT_PUBLIC_ prefix silently become empty. Add import 'server-only' to turn this into a build error.",
    'Assuming a Server Function is private because only your button calls it. It is an HTTP endpoint and needs its own auth and validation.',
    'Trying to pass event handlers or class instances from a Server Component to a Client Component.',
  ],
  versionNotes:
    "Checked against Next.js 16.4 and React 19.3 docs on 2026-11-23. params and searchParams became Promises in Next.js 15, which still allowed temporary synchronous access; Next.js 16 removed synchronous access. In React 19.3, Server Components can render a Context imported from a 'use client' module directly; before that, a client Provider wrapper component was needed. With Cache Components, awaiting params outside Suspense on a route without generateStaticParams triggers a blocking-route error, which is why the sketch reads params inside a Suspense boundary.",
  docSourceIds: ['next-server-client', 'react-use-client', 'react-server-components', 'react-server-functions', 'next-layouts-pages', 'next-fetching-data', 'patterns-rsc'],
  mcqs: [
    {
      id: 'm1',
      question: "Gallery.tsx starts with 'use client' and imports formatPrice from lib/price.ts and a heavy zoom library. What ends up in the client bundle?",
      options: [
        { id: 'a', text: 'Only the Gallery component itself', explanation: "The directive marks the module and all of its transitive imports as client code." },
        { id: 'b', text: 'Gallery, lib/price.ts and the zoom library', explanation: "Correct. Everything in Gallery's module graph is client code." },
        { id: 'c', text: 'Nothing until the user interacts with the gallery', explanation: "'use client' does not lazy-load. Use next/dynamic or React.lazy for that." },
        { id: 'd', text: 'Only the zoom library, because it uses browser APIs', explanation: 'Bundling follows imports, not API usage.' },
      ],
      correctOptionId: 'b',
      explanation: "'use client' declares a boundary in the module dependency tree. That file, its imports and the components it renders directly are client code. Keep client entry points small and leaf-level.",
      sourceIds: ['react-use-client', 'next-server-client'],
    },
    {
      id: 'm2',
      question: 'Which prop can NOT be passed from a Server Component to a Client Component?',
      options: [
        { id: 'a', text: 'A Promise that resolves to the reviews array', explanation: 'Promises are serialisable, and the client can read them with use().' },
        { id: 'b', text: "A function exported from a 'use server' module", explanation: 'Server Functions can be passed as props. The client receives a reference.' },
        { id: 'c', text: 'Server-rendered JSX passed as children', explanation: 'JSX is supported, which is how interleaving works.' },
        { id: 'd', text: 'An onClick arrow function defined inside the Server Component', explanation: 'Correct. Ordinary functions are not serialisable. Event handlers must be defined in Client Components.' },
      ],
      correctOptionId: 'd',
      explanation: 'Props crossing the boundary must be serialisable: primitives, plain objects and arrays, Dates, Maps and Sets, Promises, JSX, and Server Functions. Ordinary functions and class instances are not allowed.',
      sourceIds: ['react-use-client', 'next-server-client'],
    },
    {
      id: 'm3',
      question: 'lib/api.ts reads process.env.PAYMENTS_KEY and is imported by a Client Component. What happens in Next.js, and what is the right guard?',
      options: [
        { id: 'a', text: "The key leaks into the bundle. Rename it to NEXT_PUBLIC_PAYMENTS_KEY so it's explicit", explanation: 'The NEXT_PUBLIC_ prefix deliberately exposes a variable to the client. That is the opposite of what you want for a secret.' },
        { id: 'b', text: "The variable is replaced with an empty string on the client, so the code silently breaks. Add import 'server-only' to make it a build error", explanation: 'Correct. Unprefixed env vars are not inlined into client code, and server-only turns the mistake into a build-time error.' },
        { id: 'c', text: 'Next.js automatically moves the function to the server', explanation: "Only functions in 'use server' modules become Server Functions. Plain modules are bundled for the client." },
        { id: 'd', text: 'The build always fails, even without any extra package', explanation: 'Without server-only (or a similar check) the import compiles and fails at runtime.' },
      ],
      correctOptionId: 'b',
      explanation: "Only NEXT_PUBLIC_ variables reach the client. Mark server-only modules with import 'server-only' so that accidental client imports fail the build instead of failing silently.",
      sourceIds: ['next-server-client'],
    },
  ],
  followUps: [
    { id: 'f1', level: 'mechanism', question: 'What is in the RSC payload, and how is it used on the first load compared with a client navigation?', expectedConcepts: ['rendered Server Component output', 'placeholders and module references for Client Components', 'serialised props', 'HTML for the first paint, payload to reconcile, JS to hydrate', 'navigations use the payload only'], sourceIds: ['next-server-client'] },
    { id: 'f2', level: 'application', question: 'A client Tabs component must show server-rendered reviews in one tab. How do you compose it?', expectedConcepts: ['pass Server Components as children or slot props', 'rendered on the server ahead of time', 'not part of the client module graph'], sourceIds: ['next-server-client'] },
    { id: 'f3', level: 'edge-cases', question: 'A third-party carousel throws when used in a Server Component. Why, and how do you fix it?', expectedConcepts: ["it uses hooks without a 'use client' directive", "wrap it in your own 'use client' module", 'library authors should add the directive to client entry points'], sourceIds: ['next-server-client'] },
    { id: 'f4', level: 'production', question: 'How do you show that the migration reduced client JS and improved INP?', expectedConcepts: ['bundle analyzer per route', 'JS bytes per route before and after', 'field INP at p75', 'long tasks during hydration'], sourceIds: ['webdev-inp-metric'] },
    { id: 'f5', level: 'architecture', question: 'Pages, Server Components and Server Functions all touch user data. Where should authorisation live?', expectedConcepts: ['a server-only data access layer', 'return DTOs, not raw records', 'check inside every Server Function', 'a page-level check does not protect actions'], sourceIds: ['react-server-functions'] },
  ],
};

// ---------------------------------------------------------------------------
// 5. Next.js 16 caching strategy
// ---------------------------------------------------------------------------

const nextjsCachingStrategy: DesignQuestion = {
  schemaVersion: 1,
  kind: 'design',
  execution: 'quiz',
  track: 'architecture',
  id: 'arch-nextjs-caching-strategy',
  slug: 'nextjs-caching-strategy',
  title: 'Design caching for a news site on Next.js 16',
  difficulty: 'hard',
  priority: 'P0',
  seniority: SENIORITY,
  topics: ['Cache Components', "'use cache'", 'cacheLife', 'cacheTag', 'revalidateTag', 'updateTag', 'on-demand revalidation', 'request-time APIs', 'self-hosting'],
  estimatedMinutes: 30,
  conceptIds: ['nextjs-caching', 'rendering-strategies', 'nextjs-app-router', 'streaming-ssr'],
  research: {
    provenance: 'DOCUMENTED_TECHNICAL_EXERCISE',
    frequencyConfidence: 'LOW_CONFIDENCE',
    verificationStatus: 'SOURCES_VERIFIED',
    lastVerified: LAST_VERIFIED,
    evidence: [
      { sourceId: 'next-caching-revalidating', url: 'https://nextjs.org/docs/app/getting-started/revalidating', originalTitle: 'Revalidating', note: 'The registry page (/caching-and-revalidating) was split into Caching and Revalidating. This page has the cacheLife profiles table, revalidateTag(tag, "max"), updateTag and revalidatePath.' },
      { sourceId: 'next-ppr', url: 'https://nextjs.org/docs/app/getting-started/caching', originalTitle: 'Caching', note: 'Runtime APIs inside Suspense, passing runtime values into cached functions, where cached output is stored, ISR with Cache Components.' },
      { sourceId: 'next-use-cache', url: 'https://nextjs.org/docs/app/api-reference/directives/use-cache', originalTitle: 'use cache', note: 'Cache keys include the build ID, runtime APIs are banned in cached scopes, and runtime entries use in-memory LRU.' },
      { sourceId: 'next-caching-guide', url: 'https://nextjs.org/docs/app/guides/caching-without-cache-components', originalTitle: 'Caching and Revalidating (Previous Model)', note: 'The registry URL (/guides/caching) now redirects here. It documents fetch options, unstable_cache and route segment configs.' },
      { sourceId: 'next-app-router', url: 'https://nextjs.org/docs/app/guides/upgrading/version-16', originalTitle: 'How to upgrade to version 16', note: 'Sync request APIs removed, revalidateTag second argument required, cacheLife/cacheTag stable, experimental PPR flags removed.' },
      { sourceId: 'next-app-router', url: 'https://nextjs.org/docs/app/guides/self-hosting', originalTitle: 'How to self-host your Next.js application', note: 'In-memory cache is not shared across instances, and refreshTags in a custom cache handler coordinates tag invalidation.' },
    ],
    researchNotes: `${NO_FREQUENCY_EVIDENCE} Version history was cross-checked against the version 15 and version 16 upgrade guides and the Next.js 16.4 release post (Cache Components on by default in create-next-app, and planned as the default in Next.js 17).`,
  },
  scenario: `A news publisher runs on **Next.js 16.4 with Cache Components**:

- \`/\`: the front page, which editors re-arrange throughout the day.
- \`/[section]\`: about 40 sections.
- \`/article/[slug]\`: 300k archived articles and about 200 new ones a day. Breaking-news articles are edited every few minutes.
- A "Most read" widget, recomputed from analytics every minute.
- A per-user "Saved articles" list and a paywall meter, both based on the session cookie.
- A headless CMS that can call a webhook on publish, update and unpublish.

Design the caching. Cover what is prerendered and what is dynamic, how you use \`'use cache'\`, \`cacheLife\` and \`cacheTag\`, how revalidation happens after a CMS publish, and where request-time APIs fit. Then explain what would differ on Next.js 14 or 15, or on the previous caching model.`,
  constraints: [
    'A published correction must be visible to readers within about a minute, and immediately to the editor who made it inside the app.',
    'Self-hosted on 6 Node.js instances behind a CDN. There is no platform cache unless you configure one.',
    'Paywall state and saved articles are per user and must never come from a shared cache.',
  ],
  answerOutline: [
    'Classify the data. Shared and editor-driven (front, sections, article bodies) is event-invalidated. Shared and time-driven ("Most read") gets a short lifetime. Per-user (meter, saved) is read at request time.',
    "Cache shared reads with 'use cache' plus cacheLife and cacheTag ('article:<slug>', 'section:<name>', 'front'), using long lifetimes (for example 'max') because the CMS webhook drives freshness.",
    'Prerender the front page and sections. Articles: generateStaticParams returns recent and popular slugs (at least one). The rest get the App Shell and are upgraded on first visit.',
    "\"Most read\" uses cacheLife('minutes') (stale 5m, revalidate 1m, expire 1h), so it stays prerenderable and refreshes in the background.",
    "Webhook Route Handler: verify the signature, then call revalidateTag(tag, 'max'). Use { expire: 0 } only when stale must never be served. Editor actions inside the app are Server Actions that call updateTag for read-your-own-writes.",
    "Request-time APIs: read cookies() for the meter and saved list inside <Suspense>, never inside 'use cache'. Pass extracted values as arguments, or use 'use cache: private' when needed. The paywalled body must not be in the public shell.",
    "Multi-instance: the default in-memory cache and revalidateTag are per instance. Configure cacheHandlers ('use cache: remote') and implement refreshTags. Keep the encryption key and deploymentId stable, and remember a deploy starts with an empty cache.",
    'What changed: fetch was cached by default in 13–14 and uncached from 15. 15 made request APIs async. 16 stabilised Cache Components, cacheLife and cacheTag, added updateTag and refresh, required the second argument to revalidateTag, removed sync request APIs and the experimental PPR flags. Segment configs error under cacheComponents.',
  ],
  modelAnswer: `**1. Classify by who shares the data and what changes it.**

| Data | Shared? | Changes when | Strategy |
|---|---|---|---|
| Front page, sections, article body | yes | an editor publishes | \`use cache\` + \`cacheLife('max')\` + tags, invalidated by webhook |
| "Most read" | yes | every minute | \`use cache\` + \`cacheLife('minutes')\` |
| Meter, saved articles | **no** | per request | read \`cookies()\` inside \`<Suspense>\` |

**2. Cached reads, tagged by entity.**

~~~ts
// lib/content.ts
import { cacheLife, cacheTag } from 'next/cache'
export async function getArticle(slug: string) {
  'use cache'
  cacheLife('max')                         // freshness comes from the webhook, not a timer
  cacheTag('article:' + slug, 'articles')
  return cms.article(slug)
}
export async function getSection(name: string) {
  'use cache'
  cacheLife('max')
  cacheTag('section:' + name)
  return cms.section(name)
}
~~~

The front page and the sections are prerendered with this data in the static shell. For \`/article/[slug]\`, \`generateStaticParams\` returns recent and popular slugs. With Cache Components it must return at least one, and removing it opts the route out of ISR. Any other slug gets the App Shell immediately, is upgraded in the background, and is cached for the next reader. "Most read" uses the \`minutes\` profile, which is still long enough to be prerendered and is refreshed in the background.

**3. On-demand revalidation after a CMS publish.**

~~~ts
// app/api/cms-webhook/route.ts
import { revalidateTag } from 'next/cache'
export async function POST(req: Request) {
  if (!(await verifyCmsSignature(req))) return new Response(null, { status: 401 })
  const { slug, sections } = await req.json()
  revalidateTag('article:' + slug, 'max')          // stale-while-revalidate
  for (const s of sections) revalidateTag('section:' + s, 'max')
  revalidateTag('front', 'max')
  return Response.json({ ok: true })
}
~~~

\`'max'\` marks the entries stale. The next request serves the stale copy and triggers regeneration, so readers see the correction on the following visit, well inside a minute for busy pages. For a legal takedown, where stale content must never be served again, use \`revalidateTag(tag, { expire: 0 })\`. When an editor saves *inside the app*, a Server Action calls \`updateTag('article:' + slug)\`. That expires the entry immediately and re-renders the current route in the same response, which gives the editor read-your-own-writes. \`updateTag\` is only allowed in Server Actions, which is why the webhook uses \`revalidateTag\`.

**4. Request-time data.** The meter and the saved list read \`cookies()\` inside \`<Suspense>\` and stream in. Reading a cookie inside a \`'use cache'\` scope (even through a helper) is an error. Read it outside and pass the value in as an argument, or use \`'use cache: private'\` for prefetchable per-user results. The static shell is public HTML, so a paywalled article's full body must not be in it. Prerender the teaser, and stream the full body after checking entitlement.

**5. Six self-hosted instances.** By default, \`use cache\` results live in per-instance memory, and \`revalidateTag\` only invalidates the instance that received the webhook. Configure \`cacheHandlers\` (and \`'use cache: remote'\` for shared runtime entries), and implement \`refreshTags\` so that every instance learns about invalidations. Share the Server Actions encryption key and a stable \`deploymentId\` across instances. Cache keys include the build ID, so every deploy starts cold.

**6. What changed across versions.** In 13–14, \`fetch\` was cached by default (\`force-cache\`), GET Route Handlers were cached, and the client Router Cache reused page segments. In 15, all three became uncached by default, request APIs (\`cookies\`, \`headers\`, \`params\`, \`searchParams\`) became async with a temporary sync fallback, and \`use cache\` was experimental. In 16, \`cacheComponents\` became stable and makes PPR the default (the \`experimental.ppr\` and \`experimental_ppr\` flags were removed). \`cacheLife\` and \`cacheTag\` lost their \`unstable_\` prefix, \`updateTag\` and \`refresh\` were added, \`revalidateTag\` needs a profile argument, and sync request APIs were removed. With the flag on, \`dynamic\`, \`revalidate\` and \`fetchCache\` segment configs error. On the previous model you would instead use \`fetch(url, { next: { tags, revalidate } })\`, \`unstable_cache\` and \`export const revalidate\`.`,
  pitfalls: [
    "Calling updateTag from the CMS webhook Route Handler. It only works in Server Actions, so use revalidateTag(tag, 'max') there.",
    'Using the deprecated single-argument revalidateTag(tag). It behaves like expire: 0 (a blocking miss for the next reader) and is a TypeScript error in 16.',
    "Reading cookies() inside a 'use cache' function to personalise cached output.",
    'Assuming a webhook invalidates all instances when the default per-instance cache is in use.',
    'Putting the paywalled body into the static shell, where anyone can read it in the HTML.',
  ],
  versionNotes:
    "Checked against Next.js 16.4 and React 19.3 docs on 2026-11-23. Cache Components is opt-in through cacheComponents: true plus partialPrefetching: true. Since 16.4, create-next-app enables both, and the 16.4 release post says they become the default in Next.js 17. revalidateTag's second argument is required from 16; the single-argument form is deprecated and behaves like { expire: 0 }. updateTag and refresh are new in 16 and only work in Server Actions. fetch was cached by default in 13–14 and is uncached by default from 15. Without Cache Components ('Previous Model'), use fetch next.tags/next.revalidate, unstable_cache and the route segment revalidate config.",
  docSourceIds: ['next-caching-revalidating', 'next-ppr', 'next-use-cache', 'next-caching-guide', 'next-isr', 'next-fetching-data'],
  mcqs: [
    {
      id: 'm1',
      question: 'Inside the CMS webhook Route Handler, which call correctly invalidates an article in Next.js 16?',
      options: [
        { id: 'a', text: "updateTag('article:abc')", explanation: 'updateTag can only be called from Server Actions, not from Route Handlers.' },
        { id: 'b', text: "revalidateTag('article:abc', 'max')", explanation: 'Correct. It marks the entries stale with stale-while-revalidate semantics and works in Route Handlers.' },
        { id: 'c', text: "revalidateTag('article:abc')", explanation: 'The single-argument form is deprecated in 16. It behaves like { expire: 0 } and is a TypeScript error.' },
        { id: 'd', text: 'refresh()', explanation: 'refresh only works in Server Actions, and it does not invalidate tagged data.' },
      ],
      correctOptionId: 'b',
      explanation: "Use revalidateTag(tag, 'max') from webhooks and Route Handlers for background refresh. Inside Server Actions, use updateTag when the user must see their own change immediately.",
      sourceIds: ['next-caching-revalidating'],
    },
    {
      id: 'm2',
      question: "getArticle(slug) uses 'use cache' and calls a helper that reads cookies() to check the subscription. What happens?",
      options: [
        { id: 'a', text: 'It works, and the cookie becomes part of the cache key', explanation: 'Runtime APIs are not allowed in cached scopes. They are not turned into keys automatically.' },
        { id: 'b', text: "It errors. Cached scopes cannot access runtime APIs, even through helpers. Read the cookie outside and pass the value in, or use 'use cache: private'", explanation: 'Correct. The restriction follows the call stack.' },
        { id: 'c', text: 'The cookie is read once at build time and shared by everyone', explanation: 'No cookies exist at build time, and sharing them would be a data leak.' },
        { id: 'd', text: 'The whole route silently switches to dynamic rendering', explanation: 'That describes cookies() outside a cache on the previous model. Inside use cache it is an error.' },
      ],
      correctOptionId: 'b',
      explanation: "Arguments and captured values form the cache key. Request data must be extracted outside the cached function and passed in, or handled with 'use cache: private'.",
      sourceIds: ['next-use-cache', 'next-ppr'],
    },
    {
      id: 'm3',
      question: 'A Server Component calls fetch(url) with no cache options, on a project that does not use Cache Components. How did the default change between Next.js 14 and 15?',
      options: [
        { id: 'a', text: 'Uncached in 14, cached by default in 15', explanation: 'This is reversed.' },
        { id: 'b', text: 'Cached by default (force-cache) in 14, not cached by default from 15', explanation: "Correct. 15 made fetch, GET Route Handlers and client page segments uncached by default. Opt in with cache: 'force-cache'." },
        { id: 'c', text: 'Cached by default in both, and only 16 changed it', explanation: 'The change came in 15.' },
        { id: 'd', text: 'Neither version caches fetch, because only unstable_cache caches', explanation: 'fetch caching existed in both versions. Only the default changed.' },
      ],
      correctOptionId: 'b',
      explanation: "Next.js 15 changed fetch from cached-by-default to uncached-by-default. With Cache Components, caching moves to 'use cache' + cacheLife/cacheTag, and fetches inside a cached scope are cached with it.",
      sourceIds: ['next-caching-guide', 'next-fetching-data'],
    },
  ],
  followUps: [
    { id: 'f1', level: 'mechanism', question: "After revalidateTag('article:abc', 'max'), what do the next three readers see, and what triggers regeneration?", expectedConcepts: ['the entry is marked stale', 'the first request gets stale content and triggers a background regeneration', 'later requests get fresh content', 'revalidation is triggered by a request, not by the call', 'expire: 0 makes the next request block instead'], sourceIds: ['next-caching-revalidating'] },
    { id: 'f2', level: 'application', question: 'An editor fixes a typo from an in-app editing screen and must see it immediately. How?', expectedConcepts: ['a Server Action calls updateTag', 'the current route is re-rendered in the same action response', 'the client router cache is cleared', 'other readers get fresh data on their next request'], sourceIds: ['next-caching-revalidating'] },
    { id: 'f3', level: 'edge-cases', question: 'After a correction, some requests show the fix and others do not. What is going on with 6 instances?', expectedConcepts: ['in-memory cache per instance', 'revalidateTag only invalidates the local instance by default', 'cacheHandlers with shared storage', 'refreshTags coordination', 'a stable deploymentId and encryption key'], sourceIds: ['next-use-cache', 'next-app-router'] },
    { id: 'f4', level: 'production', question: 'How do you keep paywalled article bodies out of public HTML while still prerendering the page?', expectedConcepts: ['the static shell is public', 'prerender only the teaser', 'stream the entitled body behind Suspense after reading cookies()', 'never put per-user results in a shared cache', 'dynamic responses send Cache-Control: private'], sourceIds: ['next-ppr', 'next-use-cache'] },
    { id: 'f5', level: 'architecture', question: 'Plan the migration of a Next.js 15 app that uses export const revalidate = 60 and fetch next.tags to Cache Components.', expectedConcepts: ['enable cacheComponents and partialPrefetching', 'remove segment configs (they error)', "replace revalidate with 'use cache' + cacheLife", 'turn fetch tags into cacheTag', 'wrap runtime API reads in Suspense', 'adopt route by route with instant = false and the codemods'], sourceIds: ['next-caching-guide', 'next-use-cache'] },
  ],
};

// ---------------------------------------------------------------------------
// 6. Mutations with Server Functions
// ---------------------------------------------------------------------------

const appRouterDataMutations: DesignQuestion = {
  schemaVersion: 1,
  kind: 'design',
  execution: 'quiz',
  track: 'architecture',
  id: 'arch-app-router-data-mutations',
  slug: 'app-router-data-mutations',
  title: 'Implement add-to-cart and edit-profile mutations in the App Router',
  difficulty: 'hard',
  priority: 'P1',
  seniority: SENIORITY,
  topics: ['Server Functions', 'Server Actions', 'form actions', 'useActionState', 'useOptimistic', 'revalidation', 'progressive enhancement', 'security'],
  estimatedMinutes: 30,
  conceptIds: ['react-19-actions', 'react-19-apis', 'nextjs-caching', 'nextjs-app-router', 'async-ui-states'],
  research: {
    provenance: 'DOCUMENTED_TECHNICAL_EXERCISE',
    frequencyConfidence: 'LOW_CONFIDENCE',
    verificationStatus: 'SOURCES_VERIFIED',
    lastVerified: LAST_VERIFIED,
    evidence: [
      { sourceId: 'next-app-router', url: 'https://nextjs.org/docs/app/getting-started/mutating-data', originalTitle: 'Mutating Data', note: 'Creating and invoking Server Functions, pending states, refresh, revalidation, redirect, cookies. There is no dedicated registry entry, so it is filed under the App Router docs source.' },
      { sourceId: 'next-app-router', url: 'https://nextjs.org/docs/app/guides/server-actions', originalTitle: 'Server Actions and Mutations', note: 'Sequential dispatch, single-roundtrip responses, built-in security (Origin check, encrypted IDs, closure encryption, body size limit).' },
      { sourceId: 'next-app-router', url: 'https://nextjs.org/docs/app/guides/data-security', originalTitle: 'How to think about data security in Next.js', note: 'A page-level auth check does not cover Server Actions, validate client input, control return values.' },
      { sourceId: 'react-useactionstate', url: 'https://react.dev/reference/react/useActionState', originalTitle: 'useActionState' },
      { sourceId: 'react-useoptimistic', url: 'https://react.dev/reference/react/useOptimistic', originalTitle: 'useOptimistic' },
      { sourceId: 'react-form', url: 'https://react.dev/reference/react-dom/components/form', originalTitle: '<form>', note: 'Uncontrolled fields are reset after a successful action.' },
    ],
    researchNotes: `${NO_FREQUENCY_EVIDENCE} The revalidation semantics (updateTag, refresh, revalidateTag with a profile) come from the Revalidating page and the updateTag and refresh API references on nextjs.org.`,
  },
  scenario: `Implement two mutations on **Next.js 16.4 / React 19.3**:

1. **Add to cart** on product cards in a 48-card category grid. The header cart badge must update.
2. **Edit profile** at \`/account/profile\`, with display name, bio and avatar URL, and per-field validation errors.

Requirements: the profile form works before JavaScript loads, the cart badge updates optimistically, both mutations show pending states, input is validated and auth is checked on the server, data is revalidated so other pages reflect the change, and errors are handled correctly. The team used to do this with \`/api/*\` routes, \`fetch\` and \`router.refresh()\`.`,
  constraints: [
    'The cart is stored server-side, keyed by a session cookie. The badge is rendered by a Server Component in the root layout.',
    "Profile data is shown on /account/profile and on public /u/[handle] pages that are cached with 'use cache' + cacheTag('user:<id>').",
    'No new API routes.',
  ],
  answerOutline: [
    "Write the mutations as Server Functions in a 'use server' module. Invoke them through <form action>/formAction (automatic transition and progressive enhancement), or from event handlers inside startTransition. They are POST endpoints.",
    'Security inside every function: authenticate, authorise (derive the user id from the session, never from FormData), validate with a schema, and return minimal data. Know the built-ins: Origin/Host CSRF check, encrypted action IDs, closure encryption, 1 MB body limit.',
    'Profile: <form action={formAction}> with useActionState returning { errors, values }. Model expected errors as return values, not throws. isPending or useFormStatus drives the pending UI.',
    'React resets uncontrolled fields after a successful action, which includes one that returns validation errors. Re-seed defaultValue from the returned values.',
    "Revalidation: updateTag('user:<id>') for read-your-own-writes and the public cached page. Call it before redirect(), which throws.",
    'Cart: a client button that runs the action in startTransition, with useOptimistic holding the badge count (shared through a client provider). The server action calls refresh() so the layout badge re-renders in the same response.',
    'Errors: on a throw, the optimistic value falls back to the real value when the transition ends. Show a toast. Unexpected errors go to error boundaries.',
    'Concurrency: Server Actions are dispatched one at a time per client, the server stays authoritative for quantities, and requests are idempotent where possible.',
    'Never mutate during render (no GET ?add= side effects). Mention the multi-instance encryption key.',
  ],
  modelAnswer: `**Server Functions replace the API routes.** A \`'use server'\` module exports async functions that the client calls by reference. When one is passed to \`<form action>\` or \`formAction\`, React runs it in a transition and Next.js can return the updated UI and data in **one round trip**. Each action is a POST endpoint that anyone can call directly, so every function does its own auth and validation.

~~~ts
// app/actions/profile.ts
'use server'
import { updateTag } from 'next/cache'

export type ProfileState = { ok: boolean; errors: Record<string, string[]>; values?: Record<string, string> }

export async function updateProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const user = await requireUser()                          // re-check auth here, not just on the page
  const values = {
    displayName: String(formData.get('displayName') ?? ''),
    bio: String(formData.get('bio') ?? ''),
    avatarUrl: String(formData.get('avatarUrl') ?? ''),
  }
  const parsed = ProfileSchema.safeParse(values)            // e.g. Zod: lengths, https URL
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error), values }
  await db.user.update(user.id, parsed.data)                // id from the session, never from the form
  updateTag('user:' + user.id)                              // read-your-own-writes, incl. /u/[handle]
  return { ok: true, errors: {} }
}
~~~

~~~tsx
// app/account/profile/profile-form.tsx
'use client'
export function ProfileForm({ initial }: { initial: ProfileDTO }) {
  const [state, formAction, isPending] = useActionState(updateProfile, { ok: false, errors: {} })
  const v = state.values ?? initial
  return (
    <form action={formAction}>
      <input name="displayName" defaultValue={v.displayName} aria-invalid={!!state.errors.displayName} />
      {state.errors.displayName && <p role="alert">{state.errors.displayName[0]}</p>}
      {/* bio, avatarUrl ... */}
      <button disabled={isPending}>{isPending ? 'Saving…' : 'Save'}</button>
    </form>
  )
}
~~~

**Profile details.** Expected failures such as validation are *returned* state, not thrown errors. React resets uncontrolled fields after the action succeeds, and returning errors counts as success, so re-seed \`defaultValue\` from \`state.values\` or the user loses what they typed. Because the form uses a Server Function, it can be submitted before hydration: forms rendered by Server Components submit natively, and client-rendered forms queue the submission and prioritise hydration. \`updateTag\` expires the user's cached entries and re-renders the current route in the action response. If you also navigate away, call it *before* \`redirect()\`, because \`redirect\` throws.

**Add to cart with an optimistic badge.**

~~~tsx
'use client'
function AddToCart({ productId }: { productId: string }) {
  const { addOptimistic } = useCartBadge()       // client provider holding useOptimistic(count, (c, n) => c + n)
  const [isPending, startTransition] = useTransition()
  return (
    <button disabled={isPending} onClick={() => startTransition(async () => {
      addOptimistic(1)
      try { await addToCart(productId) } catch { toast('Could not add item') }
    })}>Add to cart</button>
  )
}
~~~

On the server, \`addToCart\` resolves the cart from the session cookie, validates \`productId\`, and lets the cart service compute quantity and price. It then calls \`refresh()\`, so the layout's uncached badge re-renders in the same response. If the cart were cached under a tag, it would call \`updateTag\` instead. When the transition ends, \`useOptimistic\` returns the server's real count. If the action failed, the optimistic +1 disappears on its own.

**Concurrency and safety.** Next.js dispatches Server Actions one at a time per client, so five rapid clicks run in order and the server count stays authoritative. Make the action idempotent if retries are possible. Return only what the UI needs. Never mutate during render (no \`?add=\` handled in a page). The built-ins (Origin/Host CSRF check, encrypted action IDs, encrypted closures, 1 MB body limit) don't replace your own checks. With several instances, set the same \`NEXT_SERVER_ACTIONS_ENCRYPTION_KEY\` everywhere.`,
  pitfalls: [
    'Relying on the page-level auth check. Actions are directly callable POST endpoints, so authenticate and authorise inside each one.',
    'Trusting a userId or price sent in FormData. Derive identity from the session and compute prices on the server.',
    "Calling revalidateTag(tag, 'max') and expecting the editor to see the change immediately. It is stale-while-revalidate and does not re-render in the action response. Use updateTag.",
    'Throwing for validation errors (which sends them to an error boundary) instead of returning them, or losing typed input when React resets uncontrolled fields.',
    'Calling the optimistic setter outside a transition or Action. React warns, and the optimistic value is not applied properly.',
  ],
  versionNotes:
    "Checked against Next.js 16.4 and React 19.3 docs on 2026-11-23. useActionState (React 19) returns [state, dispatchAction, isPending] and replaces the canary-era useFormState. In React 19.3 docs, useOptimistic's optional reducer has the signature (currentState, action). updateTag and refresh (next/cache) are new in Next.js 16 and only work in Server Actions. revalidateTag requires a cacheLife profile as its second argument from 16. Earlier versions used revalidateTag(tag) and router.refresh() on the client.",
  docSourceIds: ['react-server-functions', 'react-useactionstate', 'react-useoptimistic', 'react-form', 'react-usetransition', 'next-caching-revalidating', 'next-error-handling'],
  mcqs: [
    {
      id: 'm1',
      question: '/account/profile redirects anonymous users to /login. updateProfile, in actions.ts, has no auth check of its own. What is the risk?',
      options: [
        { id: 'a', text: 'None. The action can only be called from the page, which is already protected', explanation: 'Server Actions are reachable by direct POST requests, not only from your UI.' },
        { id: 'b', text: 'Anyone who obtains or replays the action reference can call it directly with arbitrary arguments, so it needs its own auth and validation', explanation: 'Correct. A page-level check does not extend to the Server Actions used on that page.' },
        { id: 'c', text: 'Next.js blocks all cross-site calls, so only CSRF matters', explanation: 'The Origin check stops cross-site form posts, not same-origin or scripted calls by an attacker who has a session or a reference.' },
        { id: 'd', text: 'Encrypted action IDs make the function impossible to call outside the app', explanation: 'Encryption and dead-code elimination reduce exposure, but they are not authorisation.' },
      ],
      correctOptionId: 'b',
      explanation: 'Treat every Server Function as a public endpoint. Verify the session, authorise access to the resource, and validate every input inside the function.',
      sourceIds: ['react-server-functions', 'next-app-router'],
    },
    {
      id: 'm2',
      question: "After a successful profile update, which call makes the user see fresh data immediately on /account/profile and on the cached /u/[handle] page (tagged 'user:42')?",
      options: [
        { id: 'a', text: "revalidateTag('user:42', 'max')", explanation: 'This is stale-while-revalidate. The next read gets stale data, and the action response does not include a re-render.' },
        { id: 'b', text: "updateTag('user:42')", explanation: 'Correct. It immediately expires the tagged entries and re-renders the current route in the action response.' },
        { id: 'c', text: 'refresh()', explanation: 'refresh reruns dynamic work, but it does not invalidate tagged cached data.' },
        { id: 'd', text: 'router.refresh() in the Client Component after the action resolves', explanation: 'This re-renders the route on the client, but it does not invalidate the server-side use cache entry.' },
      ],
      correctOptionId: 'b',
      explanation: 'Use updateTag in Server Actions for read-your-own-writes. Use revalidateTag(tag, profile) when a background refresh is acceptable, for example from webhooks.',
      sourceIds: ['next-caching-revalidating'],
    },
    {
      id: 'm3',
      question: 'The profile form uses uncontrolled inputs with defaultValue from the database. The action returns { errors } for an invalid bio. What happens to what the user typed?',
      options: [
        { id: 'a', text: 'It is kept, because the action failed', explanation: 'Returning errors is not a failure from React’s point of view. The action completed successfully.' },
        { id: 'b', text: 'React resets the uncontrolled fields to their defaultValue, so typed input is lost unless you return the values and re-seed defaultValue', explanation: 'Correct. Form actions reset uncontrolled fields after the action succeeds.' },
        { id: 'c', text: 'The browser reloads the page and keeps the values', explanation: 'After hydration, submitting the form does not reload the page.' },
        { id: 'd', text: 'The inputs become controlled automatically', explanation: 'React does not change the control mode of your inputs.' },
      ],
      correctOptionId: 'b',
      explanation: 'When a function is passed to <form action>, React resets uncontrolled fields once the action succeeds. Return the submitted values in state, or use controlled inputs, to keep them.',
      sourceIds: ['react-form', 'react-useactionstate'],
    },
  ],
  followUps: [
    { id: 'f1', level: 'mechanism', question: 'How does a Server Action update both the data and the UI in a single round trip?', expectedConcepts: ['POST to the action reference', 'updateTag, revalidatePath or refresh trigger a server re-render of the current route', 'the RSC payload comes back in the same response', "revalidateTag with 'max' does not re-render"], sourceIds: ['next-app-router', 'react-server-functions'] },
    { id: 'f2', level: 'application', question: 'A user clicks Add to cart on five cards quickly. What happens, and how do you keep the badge correct?', expectedConcepts: ['actions are dispatched sequentially per client', 'optimistic updates stack while transitions are pending', 'the server count is authoritative', 'idempotency keys', 'per-button pending state'], sourceIds: ['react-useoptimistic', 'next-app-router'] },
    { id: 'f3', level: 'edge-cases', question: 'The profile form is submitted before hydration. What works and what does not?', expectedConcepts: ['Server Component forms submit natively', 'Client Component forms queue the submission and prioritise hydration', 'the useActionState permalink option', 'no optimistic UI without JS'], sourceIds: ['react-useactionstate', 'react-form'] },
    { id: 'f4', level: 'production', question: "After a rolling deploy across instances, some users get 'Failed to find Server Action'. Why?", expectedConcepts: ['action IDs are encrypted per build', 'version skew between client and server', 'set a stable NEXT_SERVER_ACTIONS_ENCRYPTION_KEY', 'deploymentId and skew protection'], sourceIds: ['next-app-router'] },
    { id: 'f5', level: 'architecture', question: 'When would you still choose a Route Handler over a Server Function?', expectedConcepts: ['public or third-party APIs and webhooks', 'GET and HTTP caching semantics', 'parallel requests (actions run sequentially)', 'non-React clients such as mobile apps', 'streaming or custom responses'], sourceIds: ['next-app-router'] },
  ],
};

export const ARCH_QUESTIONS_NEXTJS_RENDERING: DesignQuestion[] = [
  renderingStrategyChoice,
  hydrationMismatchDebug,
  streamingSuspenseBoundaries,
  serverClientBoundary,
  nextjsCachingStrategy,
  appRouterDataMutations,
];
