import type { Concept } from './schema';

/**
 * Next.js / React rendering concepts. Original explanations, checked on 2026-11-23 against
 * the official documentation referenced by `docSourceIds` (see ./sources.ts) for
 * Next.js 16.4.6 and React 19.3.1. Version-specific behaviour is labelled inline.
 * Code fences use `~~~` so the markdown can live inside template literals.
 */
export const NEXTJS_RENDERING_CONCEPTS: Concept[] = [
  {
    id: 'rendering-strategies',
    title: 'Rendering strategies (CSR, SSR, SSG, ISR, streaming, PPR, islands)',
    area: 'Performance',
    summary: 'A rendering strategy decides where (build, server, browser) and when (build time, request time, background) HTML is produced; each trades TTFB, LCP, INP and server cost differently, and modern frameworks choose per route or per component.',
    definition: `web.dev's "Rendering on the Web" vocabulary:

- **CSR**: the browser gets a near-empty document and builds the DOM with JavaScript.
- **SSR**: the server renders HTML per request.
- **Static rendering (SSG)**: HTML is produced at build time. This differs from web.dev's **prerendering**, which snapshots a client app at build time and stays inert until its JS runs.
- **Streaming SSR**: HTML is sent in chunks as it becomes ready.

Framework terms: **ISR** (static output regenerated in the background), **Partial Prerendering** (a static shell plus request-time "holes" streamed in the same response) and **islands** (static HTML with independently hydrated widgets).`,
    whyItExists: `No single strategy wins. CSR keeps the server cheap but makes LCP wait for JS and data. SSR gives fresh, personalised HTML, but TTFB includes the slowest query and every request costs compute. Static output is fastest and cheapest, but can be stale and needs the URLs up front. The newer strategies remove the either/or: prerender what does not depend on the request, stream the rest, and ship JS only for interactive parts.`,
    mechanism: `| Strategy | TTFB | FCP / LCP | INP risk | Server cost |
|---|---|---|---|---|
| CSR | fast | late (JS + data first) | big bundle | ~none |
| Blocking SSR | slowest dependency | right after TTFB | full hydration | per request |
| SSG / ISR | CDN | fast (ISR may be stale) | hydration | ~none / low |
| Streaming SSR | shell-fast | early; LCP fast if in shell | split hydration | per request |
| PPR | CDN | static-fast shell | split hydration | holes only |
| Islands / RSC | — | — | JS only for widgets | — |

**Next.js 16.4.** With **Cache Components** (\`cacheComponents: true\`; on by default in new \`create-next-app\` projects since 16.4, planned as the default in Next.js 17), every route gets a prerendered **static shell**. That is PPR, and it no longer has its own experimental flag. Synchronous work and \`'use cache'\` output go into the shell; uncached data and request-time APIs stream behind \`<Suspense>\`. In the **previous model** (flag off), a route is either fully static (optionally ISR via \`export const revalidate\`) or fully dynamic once it touches \`cookies()\`, \`headers()\` or \`searchParams\`. In both models, Server Components never hydrate: client JS covers only the \`'use client'\` islands.`,
    example: `A product page: header and details are the same for everyone (static shell, revalidated hourly); the cart badge depends on a cookie (streamed per request). Under blocking SSR the cart lookup delays the whole page. Under PPR it delays only its own box.`,
    codeWalkthrough: `~~~tsx
// Next.js 16.4 with cacheComponents + partialPrefetching enabled
import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { cacheLife, cacheTag } from 'next/cache';

export async function generateStaticParams() {
  return (await getTopSellerIds()).map((id) => ({ id })); // known at build
}

export default function ProductPage({ params }: PageProps<'/p/[id]'>) {
  return (
    <>
      <SiteHeader />
      <Suspense fallback={<ProductSkeleton />}>
        {params.then(({ id }) => <ProductInfo id={id} />)}
      </Suspense>
      <Suspense fallback={<CartSkeleton />}>
        <CartBadge />
      </Suspense>
    </>
  );
}

async function ProductInfo({ id }: { id: string }) {
  'use cache';
  cacheLife('hours');
  cacheTag('product-' + id);
  return <ProductDetails product={await db.product.find(id)} />;
}

async function CartBadge() {
  const cartId = (await cookies()).get('cart')?.value;
  return <Badge count={cartId ? await countItems(cartId) : 0} />;
}
~~~

1. \`SiteHeader\` is synchronous, so it is prerendered into the static shell and served from the CDN.
2. \`params\` is passed down as a promise, not awaited at the top. Ids from \`generateStaticParams\` are fully prerendered. Other ids get the App Shell with the skeleton, and Next.js caches the concrete page in the background (ISR in the new model).
3. \`ProductInfo\` is cached for the \`hours\` profile and tagged, so a CMS webhook can revalidate it.
4. \`CartBadge\` reads a cookie, so it streams per request in its own boundary without making the route dynamic.`,
    misconceptions: [
      'SSR is always faster than CSR — SSR improves FCP but can worsen TTFB (waiting for data) and INP (hydration); a static or cached shell usually beats both.',
      'Static means "no data" — it means the HTML was produced before the request, at build time or by revalidation.',
      'In Next.js 16, reading `cookies()` makes the whole page dynamic — that is the previous model; with Cache Components only the enclosing `<Suspense>` subtree renders at request time.',
    ],
    failureCases: [
      'A blocking SSR page calls a 900 ms recommendations API before flushing, so every visitor\'s TTFB and LCP include the least important widget.',
      'A fully client-rendered marketing page shows crawlers and slow phones a blank screen until a 400 KB bundle parses; LCP fails at p75.',
      'With Cache Components, a layout awaits `params` or `cookies()` at the top, so it and everything below drop out of the static shell and every navigation waits for the server.',
    ],
    productionImplications: `Decide per route, or per component: does this depend on the request, and how stale may it be? Prerender or cache everything shared, stream the personalised parts, and keep the LCP element in the shell. Track TTFB and LCP at p75 per route type, and watch server CPU, because per-request rendering costs show up as compute. In Next.js 16.4, \`export const ensureStatic\` fails the build if dynamic content sneaks into a route that must stay static.`,
    docSourceIds: ['webdev-rendering', 'next-ppr', 'next-isr'],
    interviewQuestions: [
      'Compare CSR, SSR, SSG and streaming SSR on TTFB, LCP and INP. Where does each one hurt?',
      'You have a product page with shared details and a personalised cart. Design its rendering in Next.js 16 and explain what lands in the static shell.',
      'What problem does Partial Prerendering solve that ISR does not?',
      'How do Server Components change the hydration cost of an SSR page compared with a classic SSR + full hydration setup?',
      'When would you still choose a pure CSR SPA in 2026?',
    ],
    related: ['hydration', 'streaming-ssr', 'nextjs-caching', 'core-web-vitals', 'react-server-components'],
  },
  {
    id: 'hydration',
    title: 'Hydration, mismatches and selective hydration',
    area: 'React',
    summary: 'Hydration makes server-rendered HTML interactive by rendering the same tree on the client and attaching to the existing DOM; it requires identical output, and Suspense lets React hydrate in independent, prioritised chunks.',
    definition: `\`hydrateRoot(domNode, reactNode, options?)\` (from \`react-dom/client\`) "attaches" React to HTML that \`react-dom/server\` produced. React renders the component tree in the browser, but instead of creating DOM nodes it adopts the existing ones and attaches event handlers. The contract: **the first client render must produce the same output as the server render**. The React docs treat any difference as a bug.`,
    whyItExists: `Server HTML paints early but is only a snapshot. Until hydration finishes, buttons do nothing. web.dev describes pages that "can appear to be loaded and interactive" but cannot respond to input (the *uncanny valley*). Matching output lets React reuse the DOM instead of rebuilding it.`,
    mechanism: `**Common mismatch causes:**

- \`Date.now()\`, \`new Date().toLocaleString()\` or \`Intl\` formatting (server and browser have different time zones and locales).
- \`Math.random()\` or hand-rolled id counters.
- \`typeof window !== 'undefined'\` branches and browser-only APIs (\`localStorage\`, \`matchMedia\`) during render.
- Different data on the server and the client.
- Invalid HTML nesting (\`<div>\` inside \`<p>\`, \`<a>\` inside \`<a>\`): the browser's parser repairs it, so the DOM no longer matches the tree.
- Extra whitespace inside the root.

**What React does:** in development it reports the mismatch (one error with a diff since React 19). Attribute differences are not guaranteed to be patched. When elements do not match, React discards the server HTML, client-renders from the nearest \`<Suspense>\` boundary (or the root) and calls \`onRecoverableError\`. Since React 19, unexpected tags injected into \`<head>\`/\`<body>\` by extensions or third-party scripts are skipped.

**Fixes:**

- Render deterministically (pass the server's timestamp as a prop).
- Use \`useId\` for ids (same \`identifierPrefix\` on both sides).
- For intentionally client-only output, use a **two-pass render**: an \`isClient\` flag set in an effect.
- \`suppressHydrationWarning\` silences one element's text or attribute difference, one level deep, without patching it.

**Selective hydration (React 18+):** each \`<Suspense>\` boundary hydrates independently, and the one the user interacts with jumps the queue. **Progressive hydration** defers low-priority regions (\`lazy\`, on visibility). **Partial hydration / islands** ship no JS for static parts. Server Components do exactly that: only \`'use client'\` subtrees hydrate.`,
    example: `"Placed 3 minutes ago" computed with \`Date.now()\` during render differs between the server (12:00:00) and hydration (12:00:04). Render the server-supplied date first, then switch to relative time after mount.`,
    codeWalkthrough: `~~~tsx
'use client';
import { useEffect, useId, useState } from 'react';

export function PlacedAt({ iso }: { iso: string }) {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);
  return (
    <time dateTime={iso}>
      {isClient ? relativeTime(iso) : iso.slice(0, 10)}
    </time>
  );
}

export function NoteField() {
  const hintId = useId(); // not Math.random(): must match on both sides
  return (
    <>
      <textarea aria-describedby={hintId} />
      <p id={hintId}>Visible to the courier.</p>
    </>
  );
}

// Escape hatch for a single unavoidable text difference:
// <span suppressHydrationWarning>{new Date().getFullYear()}</span>
~~~

1. The first client render uses \`isClient = false\`, like the server, so markup matches and hydration succeeds.
2. The effect then triggers a second render with local relative time: one extra render, not a mismatch.
3. \`useId\` is derived from the component's tree position, so it matches on both sides. A random id would break \`aria-describedby\` and mismatch.
4. \`suppressHydrationWarning\` only hides the warning; the server text stays until the next client render.`,
    misconceptions: [
      '`suppressHydrationWarning` fixes the mismatch — it only silences the warning, one level deep; React does not patch the text.',
      'Hydration re-creates the DOM — it adopts existing nodes; only a mismatch forces client rendering of that boundary or root.',
      '`typeof window` checks are SSR-safe — inside render they guarantee different server/client output; move browser reads into effects or a two-pass render.',
    ],
    failureCases: [
      'A theme toggle reads `localStorage` during render ("light" on the server, "dark" on the client); React client-renders the root, losing the SSR benefit and flashing.',
      'CMS rich text produces `<p><div>…</div></p>`; the parser splits the paragraph and hydration falls back to client rendering on every view.',
      'One boundary around the whole app means a heavy analytics widget delays hydration of "Add to cart", so early clicks feel dead (poor INP).',
    ],
    productionImplications: `Treat hydration errors as bugs: send \`onRecoverableError\` (and \`onCaughtError\`/\`onUncaughtError\`) to monitoring so client-render fallbacks are visible. Format dates with an explicit time zone, wrap independent regions in \`<Suspense>\` so hydration splits into small tasks, and ship less to hydrate: \`'use client'\` at the leaves, code-split below-the-fold widgets.`,
    docSourceIds: ['react-hydrateroot', 'react-suspense', 'patterns-progressive-hydration'],
    interviewQuestions: [
      'What does `hydrateRoot` actually do differently from `createRoot().render()`?',
      'List four causes of hydration mismatches and the correct fix for each.',
      'What is selective hydration, and how does React decide what to hydrate first?',
      'When is `suppressHydrationWarning` acceptable, and what does it not do?',
      'How do Server Components relate to partial hydration and islands?',
    ],
    related: ['streaming-ssr', 'rendering-strategies', 'react-server-components', 'react-effects', 'core-web-vitals'],
  },
  {
    id: 'streaming-ssr',
    title: 'Streaming SSR and Suspense',
    area: 'React',
    summary: 'Streaming SSR sends a shell of HTML immediately and streams each Suspense boundary\'s content as it resolves, so slow data no longer blocks the first byte; the price is that status codes and headers are fixed once streaming starts.',
    definition: `React's streaming server APIs render to a stream instead of a string:

- \`renderToPipeableStream(node, options)\` is for Node.js streams and returns \`{ pipe, abort }\`.
- \`renderToReadableStream(node, options)\` is for Web Streams runtimes. It returns a promise of a \`ReadableStream\` that resolves when the shell is ready and rejects if the shell fails.

The **shell** is everything outside any \`<Suspense>\` boundary, plus those boundaries' fallbacks. Each boundary is a separately streamed unit. (\`renderToNodeStream\` was removed in React 19.)`,
    whyItExists: `\`renderToString\` is synchronous and all-or-nothing: one slow widget delays TTFB, FCP and LCP for the whole page, and hydration cannot start early. Streaming lets the browser paint the shell and fetch CSS and JS while the server is still working.`,
    mechanism: `- **Flushing:** call \`pipe(res)\` in \`onShellReady\`, after setting the status. Each resolved boundary streams as hidden HTML plus an inline \`<script>\` that swaps out the fallback, even before the bundle loads.
- **Crawlers and SSG:** \`onAllReady\` (or \`await stream.allReady\`) sends complete HTML, with no progressive loading.
- **Shell errors:** \`onShellError\` fires before any byte is sent, so a 500 and a fallback document are still possible.
- **Errors inside a boundary:** React emits the fallback, gives up on the server and retries on the client. \`onError\` and \`onRecoverableError\` fire. Track a \`didError\` flag for the status code.
- **\`abort()\`:** stops the server render after a timeout; unfinished boundaries render on the client.

**Next.js (App Router):**

- \`loading.js\` wraps the segment's \`page.js\` (plus nested layouts and \`not-found.js\`) in \`<Suspense>\`, but **not** that segment's own \`layout.js\`, \`template.js\` or \`error.js\`.
- Streamed responses start with **200**. A later \`notFound()\` or \`redirect()\` is streamed; a 404 adds \`<meta name="robots" content="noindex">\`. For a real 404/401/403, check before streaming, for example in \`proxy.ts\` (Next.js 16's replacement for \`middleware.ts\`).
- **HTML-limited bots** (detected by user agent, configurable with \`htmlLimitedBots\`) get \`generateMetadata\` resolved before streaming. With Cache Components they skip the prerendered shell.`,
    example: `A dashboard with header and nav in the shell, and revenue (200 ms), orders (1 s) and recommendations (3 s) in separate boundaries. Users see the frame instantly and each card as it resolves. Bots get the complete document.`,
    codeWalkthrough: `~~~tsx
import { renderToPipeableStream } from 'react-dom/server';

app.get('*', (req, res) => {
  const isBot = /bot|crawler|spider/i.test(req.headers['user-agent'] ?? '');
  let didError = false;

  const { pipe, abort } = renderToPipeableStream(<App url={req.url} />, {
    bootstrapScripts: ['/client.js'],
    [isBot ? 'onAllReady' : 'onShellReady']() {
      res.statusCode = didError ? 500 : 200;
      res.setHeader('Content-Type', 'text/html');
      pipe(res);
    },
    onShellError() {
      res.statusCode = 500;
      res.send('<!doctype html><p>Something went wrong</p>');
    },
    onError(error) {
      didError = true;
      console.error(error);
    },
  });

  setTimeout(() => abort(), 10_000);
});
~~~

1. Browsers get the response at \`onShellReady\`, so TTFB ignores what sits inside \`<Suspense>\`. Bots wait for \`onAllReady\`.
2. The status is fixed at flush time; \`didError\` only matters for responses not yet flushed.
3. \`onShellError\` is the last chance for a real 500, since no bytes have been written.
4. \`abort()\` caps server time; pending boundaries finish on the client after \`hydrateRoot\`.`,
    misconceptions: [
      'Streaming hurts SEO — the content is still server HTML, and HTML-limited bots can get complete documents (`onAllReady`, Next.js `htmlLimitedBots`).',
      'You can return a 404 after rendering starts — headers are already sent; Next.js streams `noindex` instead, so real statuses need a pre-stream check.',
      '`loading.js` covers the layout in the same folder — it wraps the page and below; uncached data in that layout needs its own `<Suspense>`.',
    ],
    failureCases: [
      'A reverse proxy or compression middleware buffers the response, so users get one delayed chunk and no streaming benefit.',
      'A product page calls `notFound()` inside a streamed boundary and returns HTTP 200 with 404 UI, which crawlers may report as a soft 404.',
      'The LCP hero image sits inside a slow boundary: FCP improves but LCP still waits for the slowest query.',
    ],
    productionImplications: `Put the LCP element, navigation and anything that decides the status code in the shell; push slow, non-critical data behind boundaries. When self-hosting, check every buffering layer (CDN, proxy, compression). Run auth and existence checks before streaming when status codes matter, and log \`onError\`/\`onRecoverableError\`, because errors recovered on the client are otherwise invisible.`,
    docSourceIds: ['react-render-pipeable', 'next-loading', 'patterns-streaming-ssr'],
    interviewQuestions: [
      'Explain `onShellReady` vs `onAllReady` vs `onShellError`. When do you use each?',
      'What happens when a component inside a `<Suspense>` boundary throws during streaming SSR?',
      'Why can a streamed Next.js page that calls `notFound()` respond with 200, and how do you return a real 404?',
      'How does `loading.js` map to Suspense, and what does it not wrap?',
      'What infrastructure can silently defeat streaming?',
    ],
    related: ['hydration', 'rendering-strategies', 'nextjs-app-router', 'react-server-components', 'core-web-vitals'],
  },
  {
    id: 'nextjs-app-router',
    title: 'Next.js App Router fundamentals',
    area: 'React',
    summary: 'The App Router maps folders under `app/` to URL segments and special files (page, layout, loading, error, not-found…) to a nested React tree of Server Components by default, with `\'use client\'` islands, persistent layouts, prefetching `<Link>`s and Server Functions for mutations.',
    definition: `In \`app/\`, **folders define route segments** and **special files define UI**:

- \`page\`: makes the segment publicly routable.
- \`layout\`: wraps its children and persists across navigation.
- \`template\`: like a layout, but remounts on every navigation.
- \`loading\`: a Suspense fallback for the segment.
- \`error\`: an error boundary; must be a Client Component.
- \`not-found\`: UI for \`notFound()\`.
- \`route\`: an HTTP handler.

Folder naming:

- \`[slug]\`, \`[...slug]\`, \`[[...slug]]\`: dynamic segments.
- \`(group)\`: organises routes or layouts without adding a URL segment.
- \`_private\`: not routable.
- \`@slot\`: a parallel route, rendered as a named prop of the layout (with \`default.js\` as the fallback).
- \`(.)x\`, \`(..)x\`: intercepting routes, for example to show a photo in a modal on soft navigation.`,
    whyItExists: `It makes nested layouts, streaming, error isolation and code splitting structural rather than hand-wired, and Server Components keep data access and component code off the client.`,
    mechanism: `- **Server by default.** Layouts and pages are Server Components rendered to an RSC payload. \`'use client'\` marks a **module-graph boundary**: that file, its imports and the components it renders join the client bundle. Server Components passed as \`children\` stay on the server. Props crossing the boundary must be serialisable.
- **Partial rendering.** On \`<Link>\` navigation, shared layouts stay mounted with their state; only changed segments render. With Cache Components (v16+), the previous page is hidden with React \`<Activity>\` instead of unmounted.
- **Prefetching** happens on viewport entry or hover. Previous model: static routes are prefetched fully, dynamic routes only up to \`loading.js\`. With Partial Prefetching (on by default in new 16.4 apps), the App Shell is prefetched, and \`prefetch={true}\` adds URL-dependent cached content.
- **Async request APIs.** \`params\` and \`searchParams\` are **Promises** since v15 (sync access still worked there); **v16 removed sync access**, as for \`cookies()\`, \`headers()\` and \`draftMode()\`. Global \`PageProps<'/route'>\` and \`LayoutProps\` type them.
- **Mutations.** \`'use server'\` Server Functions are invoked via \`POST\` ("Server Actions" when used as a form \`action\` or in a transition). Anyone can POST to them, so authorise inside each.
- **Errors and metadata.** \`error.js\` receives \`error\` and \`retry\` (stable since 16.3). \`metadata\` or \`generateMetadata\` builds the \`<head>\`.`,
    example: `\`app/(shop)/products/[id]/page.tsx\` serves \`/products/42\`. The \`(shop)\` layout's cart drawer survives navigation between products. \`@modal/(.)products/[id]\` turns in-app clicks into a quick-view modal; a hard refresh renders the full page.`,
    codeWalkthrough: `~~~tsx
// app/(shop)/products/[id]/page.tsx  — Server Component
import { notFound } from 'next/navigation';
import { AddToCart } from './add-to-cart';
import { addToCart } from './actions';

export async function generateMetadata({ params }: PageProps<'/products/[id]'>) {
  const { id } = await params;
  return { title: (await getProduct(id))?.name ?? 'Product' };
}

export default async function Page({ params }: PageProps<'/products/[id]'>) {
  const { id } = await params;          // v16: params is a Promise
  const product = await getProduct(id); // runs on the server only
  if (!product) notFound();
  return <AddToCart productId={product.id} action={addToCart} />;
}

// ./actions.ts
'use server';
export async function addToCart(productId: string) {
  const user = await requireUser();     // authorise every call
  await db.cart.add(user.id, productId);
}

// ./add-to-cart.tsx
'use client';
export function AddToCart({ productId, action }: Props) {
  const [pending, start] = useTransition();
  return <button disabled={pending} onClick={() => start(() => action(productId))}>Add</button>;
}
~~~

1. Both functions await \`params\`; synchronous \`params.id\` no longer works in v16.
2. \`getProduct\` and the DB client never reach the browser; only \`AddToCart\` and its imports do.
3. Server Function references are serialisable, so the action can be a prop. Calling it sends a POST.
4. \`requireUser()\` lives inside the action because hiding a button does not protect a public endpoint.`,
    misconceptions: [
      '`\'use client\'` means "browser only" — Client Components are still prerendered to HTML; the directive marks the bundling and hydration boundary.',
      'Everything under a Client Component is client code — only what it imports; Server Components passed as `children` stay on the server.',
      'Layouts re-render on every navigation — shared layouts are preserved; use `template.js` to force a remount.',
    ],
    failureCases: [
      'A root layout gets `\'use client\'` for one hook, pulling the whole tree into the client bundle and losing server-only data access below it.',
      'A Server Action relies on a hidden button for authorisation, so a direct POST modifies other users\' data.',
      'An app upgraded from 14 to 16 still reads `params.id` synchronously, which breaks now that sync access is removed (the v15 codemod would have fixed it).',
    ],
    productionImplications: `Keep \`'use client'\` at the leaves and pass server content through \`children\`. Treat every Server Function as a public API: validate, authenticate, authorise. Use route groups for per-section layouts, \`loading.js\` or granular \`<Suspense>\` for instant navigations, and the typed \`PageProps\`/\`LayoutProps\` helpers. In v16, rename \`middleware.ts\` to \`proxy.ts\`.`,
    docSourceIds: ['next-layouts-pages', 'next-server-client', 'next-linking'],
    interviewQuestions: [
      'Walk through which special files render, in what nesting order, for one segment in the App Router.',
      'What exactly does `\'use client\'` mark, and how do you keep a Server Component inside a Client Component?',
      'How does navigation preserve layout state, and what changes with Cache Components\' use of `<Activity>`?',
      'Why are `params` and `searchParams` async, and what broke between v15 and v16?',
      'How would you secure a Server Action?',
    ],
    related: ['react-server-components', 'react-19-actions', 'nextjs-caching', 'streaming-ssr', 'code-splitting'],
  },
  {
    id: 'nextjs-caching',
    title: 'Next.js caching model (Cache Components, Next.js 16)',
    area: 'Performance',
    summary: 'With Cache Components (Next.js 16), work runs at request time unless you opt in with `\'use cache\'` + `cacheLife`/`cacheTag`; cached and synchronous output forms the static shell and request-time data streams behind Suspense. Defaults changed sharply from 14 to 15 to 16.',
    definition: `As of **Next.js 16.4**, two models coexist:

- **Cache Components** (\`cacheComponents: true\` together with \`partialPrefetching: true\`). On by default in new \`create-next-app\` projects since 16.4, recommended for every app, and planned as the default in Next.js 17. Caching is **opt-in**: \`'use cache'\` at the top of a file, function or component caches its return value.
- **The "previous model"** (flag off). Caching uses \`fetch\` options, \`unstable_cache\` and route segment config.`,
    whyItExists: `Implicit caching in 13/14 (\`fetch\` cached by default) surprised teams with stale data, and v15 flipped the defaults to uncached. Cache Components (stable in 16.0) replace the heuristics with explicit annotations and make Partial Prerendering the normal rendering mode.`,
    mechanism: `- **Cache keys** include the build ID, the function's identity, its serialisable arguments and captured closure values, so entries never outlive a deployment.
- **\`cacheLife\`** sets \`stale\` / \`revalidate\` / \`expire\`: \`default\` is 5 min / 15 min / never, \`hours\` 5 min / 1 h / 1 day, \`max\` 5 min / 30 days / 1 year. \`stale\` is the client router window (min 30 s), \`revalidate\` is server stale-while-revalidate, and after \`expire\` requests block for fresh data.
- **The shell.** Synchronous work and \`'use cache'\` output are prerendered. Short-lived caches (\`seconds\`, \`revalidate: 0\`, \`expire\` < 5 min) become dynamic holes. Uncached async work must sit in \`<Suspense>\` or dev and build flag a blocking route. \`Math.random()\`/\`Date.now()\` need \`connection()\` or \`'use cache'\`.
- **Request-time APIs** (\`cookies()\`, \`headers()\`, \`searchParams\`, unknown \`params\`) make only **their Suspense subtree** dynamic. They are forbidden inside \`'use cache'\`: pass values in as arguments, or use \`'use cache: private'\`. The default store is per-instance memory; \`'use cache: remote'\` uses a shared handler.
- **On-demand invalidation:**
  - \`revalidateTag(tag, 'max')\`: stale-while-revalidate; Server Functions and Route Handlers. The single-argument form is deprecated.
  - \`updateTag(tag)\`: Server Actions only. Expires immediately for read-your-own-writes, re-renders the current route and clears the client router cache.
  - \`revalidatePath(path)\`.
  - \`refresh()\`: re-runs uncached data only.
- **ISR (new model):** \`generateStaticParams\` paths are prerendered; other URLs get the App Shell, then are upgraded and cached in the background. Previous model: \`export const revalidate = n\`.

**What changed:**

| | 14 | 15 | 16 (Cache Components) |
|---|---|---|---|
| \`fetch\` default | \`force-cache\` | not cached | uncached unless inside \`'use cache'\` |
| \`GET\` Route Handlers | cached | not cached | follow the page prerender model |
| Router cache, dynamic pages | 30 s | 0 s (\`staleTimes.dynamic\`) | \`cacheLife.stale\` |
| Request APIs | sync | async (sync still works) | async only |
| PPR | experimental | \`experimental_ppr\` | built into \`cacheComponents\`; flags removed |`,
    example: `A blog: the shared post list is cached and tagged, and a CMS webhook revalidates it. The author's "new post" action uses \`updateTag\` to see the post at once. The "signed in as" chip reads cookies and streams.`,
    codeWalkthrough: `~~~tsx
import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { cacheLife, cacheTag, updateTag, revalidateTag } from 'next/cache';

async function getPosts() {
  'use cache';
  cacheLife('max');
  cacheTag('posts');
  return db.post.findMany();
}

export default async function Blog() {
  const posts = await getPosts();             // in the static shell
  return (
    <>
      <PostList posts={posts} />
      <Suspense fallback={<ChipSkeleton />}>
        <SignedInAs />                        {/* streams per request */}
      </Suspense>
    </>
  );
}

async function SignedInAs() {
  const name = (await cookies()).get('name')?.value;
  return <span>{name ?? 'Guest'}</span>;
}

// app/blog/actions.ts
'use server';
export async function createPost(form: FormData) {
  await db.post.create(parse(form));
  updateTag('posts');                         // author sees it now
}

// app/api/cms-hook/route.ts
export async function POST() {
  revalidateTag('posts', 'max');              // readers: SWR refresh
  return Response.json({ ok: true });
}
~~~

1. \`getPosts\` is long-lived and tagged, so the list is prerendered into the shell; no cookies are read inside it.
2. \`SignedInAs\` reads a request-time API, so only its boundary renders per request (the previous model would make the whole route dynamic).
3. \`updateTag\` gives read-your-own-writes in a Server Action; it throws in a Route Handler.
4. \`revalidateTag(…, 'max')\` marks the tag stale: the next visitor gets the stale list and triggers regeneration.`,
    misconceptions: [
      '`fetch` is cached by default — that was Next.js 13/14; since 15 it is not, and with Cache Components caching is whatever you wrap in `\'use cache\'`.',
      '`revalidateTag` purges immediately — with `\'max\'` it marks entries stale (stale-while-revalidate); use `updateTag` or `{ expire: 0 }` for immediate expiry.',
      'Reading `cookies()` anywhere makes the route dynamic — true only in the previous model; with Cache Components it scopes to the enclosing `<Suspense>`.',
      '`\'use cache\'` entries survive deploys and are shared across instances — keys include the build ID and the default store is per-instance memory; `\'use cache: remote\'` is the shared option.',
    ],
    failureCases: [
      'A cached function calls a helper that reads `headers()` and fails with `next-request-in-use-cache`: the restriction follows the call stack.',
      'After upgrading from 14 to 15+, origin traffic doubles because `fetch` calls everyone assumed were cached now run on every request.',
      'A webhook Route Handler calls `updateTag` (throws), or single-argument `revalidateTag` (deprecated, acts like `{ expire: 0 }`, so traffic hits blocking misses).',
    ],
    productionImplications: `For each piece of data, decide who shares it, how stale it may be and what invalidates it, and encode that as \`cacheLife\` plus \`cacheTag\`. Prefer tags over \`revalidatePath\`, use \`'use cache: remote'\` only for high-hit-rate keys, and expect a cold cache after each deploy. Migrating a 15.x app is a per-route refactor: move segment config (\`dynamic\`, \`revalidate\`) to \`'use cache'\`/\`cacheLife\`, delete \`runtime\` exports (Cache Components needs Node.js), and push request-time reads into Suspense.`,
    docSourceIds: ['next-use-cache', 'next-caching-revalidating', 'next-caching-guide'],
    interviewQuestions: [
      'What is cached by default in Next.js 16 with Cache Components, and how is that different from 14 and 15?',
      'Explain `stale`, `revalidate` and `expire` in `cacheLife`. Which one affects the client router?',
      '`updateTag` vs `revalidateTag(tag, \'max\')` vs `revalidatePath` vs `refresh()`: when do you use each?',
      'Why can\'t you call `cookies()` inside `\'use cache\'`, and what are the alternatives?',
      'Design caching for a product catalogue with a CMS webhook and a per-user cart.',
    ],
    related: ['rendering-strategies', 'nextjs-app-router', 'streaming-ssr', 'react-19-actions', 'core-web-vitals'],
  },
];
