import type { Concept } from './schema';

/**
 * React 19 + performance concepts. Original explanations, checked on 2026-11-23
 * against the official documentation referenced by `docSourceIds` (see ./sources.ts)
 * for React 19.3 (react@19.3.1) and the current web.dev Core Web Vitals guidance.
 * Code fences use `~~~` so the markdown can live inside template literals.
 */
export const REACT19_PERF_CONCEPTS: Concept[] = [
  {
    id: 'react-19-actions',
    title: 'Actions, form actions and optimistic UI (React 19)',
    area: 'React',
    summary: 'React 19 lets Transitions run async functions ("Actions"): React tracks their pending state, routes errors to Error Boundaries, reverts optimistic state, and wires them into `<form action>`, `useActionState`, `useFormStatus` and `useOptimistic`.',
    definition: `An **Action** is a function that runs inside a Transition — passed to \`startTransition\`, or to an "action prop" such as \`<form action>\` / \`<button formAction>\`. **New in React 19:** the function may be \`async\`. (React 18 transitions were sync-only and \`<form action>\` took only URLs.) Built on it: \`useActionState\`, \`useOptimistic\` (\`react\`) and \`useFormStatus\` (\`react-dom\`). \`useActionState\` replaces Canary's \`ReactDOM.useFormState\`, now deprecated.`,
    whyItExists: `Every mutation used to need hand-written \`isPending\`/\`error\`/rollback state, \`preventDefault\` and form resets. Because React now knows when the async work starts and when its final update commits, it can own that lifecycle and keep the current UI interactive meanwhile.`,
    mechanism: `- **Async transitions**: \`isPending\` is true from the call until the final update commits. **Known limitation (still documented in 19.3):** a \`set\` after \`await\` must be wrapped in another \`startTransition\`.
- **\`<form action={fn}>\`**: React calls \`fn(formData)\` in a Transition. (always POST). After success it **resets uncontrolled fields** (use \`requestFormReset\` to reset manually; since 19.3 an automatic reset after a Server Action also fires \`onReset\`). If \`onSubmit\` calls \`preventDefault()\`, the action does not run.
- **\`useActionState(reducerAction, initialState, permalink?)\`** returns \`[state, dispatchAction, isPending]\`. \`reducerAction(previousState, payload)\` may be async and have side effects, and its return value becomes the next state. As a form action, the payload is the \`FormData\`, so it arrives as the **second** argument. Dispatches are **queued and run in order**; a throw cancels the queue and rethrows to the nearest Error Boundary. \`dispatchAction\` must be called inside a Transition or action prop.
- **\`useFormStatus()\`** returns \`{ pending, data, method, action }\` for the **parent** \`<form>\` only.
- **\`useOptimistic(value, reducer?)\`** returns \`[optimisticState, setOptimistic]\`. The setter must be called inside an Action. When the Transition ends it returns \`value\` again in the same commit (no separate "clear" render); on failure \`value\` never changed, so the optimistic entry just disappears.
- **Server Functions** passed as a form action work before hydration; \`permalink\` adds progressive enhancement to \`useActionState\`.`,
    example: `A comment box that shows the new comment immediately, disables the button while posting, shows validation errors inline and clears itself — with no \`useState\` for pending, error or input.`,
    codeWalkthrough: `~~~tsx
'use client';
import { useActionState, useOptimistic } from 'react';
import { useFormStatus } from 'react-dom';
import { addComment } from './actions'; // a Server Function, or any async function

type State = { comments: Comment[]; error: string | null }; // Comment = { id, text, sending? }

function PostButton() {
  const { pending } = useFormStatus(); // status of the *enclosing* <form>
  return <button disabled={pending}>{pending ? 'Posting…' : 'Post'}</button>;
}

export function Comments({ initial }: { initial: Comment[] }) {
  const [state, dispatch] = useActionState(
    async (prev: State, formData: FormData): Promise<State> => {
      const text = String(formData.get('text') ?? '').trim();
      if (!text) return { ...prev, error: 'Write something first' }; // expected error -> state
      const saved = await addComment(text); // unexpected failure throws -> Error Boundary
      return { comments: [...prev.comments, saved], error: null };
    },
    { comments: initial, error: null },
  );
  const [shown, addShown] = useOptimistic(state.comments, (list, text: string) => [
    ...list,
    { id: 'tmp-' + list.length, text, sending: true },
  ]);

  function formAction(formData: FormData) {
    addShown(String(formData.get('text'))); // allowed: we are inside the form's Action
    dispatch(formData);
  }

  return (
    <form action={formAction}>
      <ul>{shown.map((c) => <li key={c.id} aria-busy={c.sending}>{c.text}</li>)}</ul>
      <textarea name="text" />
      <PostButton />
      {state.error && <p role="alert">{state.error}</p>}
    </form>
  );
}
~~~

1. \`<form action>\` runs \`formAction\` in a Transition; the uncontrolled textarea is cleared after success.
2. The reducer gets \`prev\` then \`formData\`. User mistakes are returned as state; real failures throw to the Error Boundary.
3. The optimistic row renders at once and is replaced by the saved one when the Action commits — or vanishes if it throws.
4. \`PostButton\` is a separate child because \`useFormStatus\` cannot see a form rendered by its own component.`,
    misconceptions: [
      'Actions are a Server Components feature — any function run in a Transition is an Action; Server Functions are just one thing you can pass to an action prop.',
      '`useFormStatus` works in the component that renders the `<form>` — it only reports on a parent form, so it must be called from a child rendered inside it.',
      '`useActionState` runs submissions in parallel — they are queued, each waiting for the previous result; use `useState` + `useTransition` for parallel work.',
      'Automatic form reset clears everything — it resets uncontrolled fields only, and only when the Action succeeds.',
    ],
    failureCases: [
      '`dispatchAction` is called from a plain `onClick` without `startTransition`: React logs "called outside of a transition" and `isPending` stays false.',
      'Validation fails but the automatic reset wipes what the user typed — return the submitted values and use them as `defaultValue`.',
      'A Server Function trusts a hidden `productId` from the client and skips authorization; every argument is attacker-controlled.',
    ],
    productionImplications: `Design-system submit buttons can read \`useFormStatus\` instead of taking pending props. Return expected errors as state; reserve Error Boundaries for real failures. Pair \`useActionState\` with \`useOptimistic\` because queued Actions otherwise feel slow. Treat every Server Function as a public POST endpoint: validate, authorize, and make it idempotent.`,
    docSourceIds: ['react-useactionstate', 'react-useoptimistic', 'react-form'],
    interviewQuestions: [
      'What exactly is an "Action" in React 19, and what does React do differently when the function passed to `startTransition` is async?',
      'Walk through what happens, step by step, when a `<form action={fn}>` is submitted: transition, pending state, errors, reset.',
      'Why does `useActionState` run dispatches sequentially, and how would you keep a quantity stepper feeling instant?',
      'How does `useOptimistic` roll back when the request fails? Is there a separate "revert" render?',
      'How do Server Functions give you progressive enhancement, and what security responsibilities come with them?',
    ],
    related: ['async-ui-states', 'race-conditions', 'controlled-uncontrolled', 'react-server-components', 'react-19-apis'],
  },
  {
    id: 'react-19-apis',
    title: 'React 19 APIs: use(), ref as a prop, metadata, resources, removals',
    area: 'React',
    summary: 'React 19 adds `use()` for promises and context, makes `ref` a normal prop, adds ref cleanups and `<Context>` as a provider, hoists `<title>`/`<meta>`, manages stylesheets, scripts and preloads, removes long-deprecated APIs, and reports hydration mismatches with a single diff.',
    definition: `A set of React 19 changes you are expected to know beyond Actions:
- **\`use(resource)\`**: reads a Promise (suspends until it settles) or a context during render. It is not a Hook, so it can be called inside \`if\` blocks and loops.
- **\`ref\` as a prop** on function components, so \`forwardRef\` is no longer needed. The docs flag \`forwardRef\` for deprecation in a future release.
- **Ref callback cleanup**, **\`<Context value>\`** as the provider (\`<Context.Provider>\` is now the legacy form), native **document metadata**, **stylesheet/async-script** support, and **resource hints** (\`prefetchDNS\`, \`preconnect\`, \`preload\`, \`preloadModule\`, \`preinit\`, \`preinitModule\` from \`react-dom\`).
- **Added in 19.3**: \`use(browser())\` from \`react-dom\`, which opts a component out of server rendering.`,
    whyItExists: `Titles needed \`react-helmet\`, data needed effects, every design-system input needed \`forwardRef\`. React 19 builds these in and removes APIs deprecated since React 15–18 to make React smaller and faster.`,
    mechanism: `- **\`use(promise)\`**: the closest \`<Suspense>\` shows its fallback while the promise is pending, and a rejection goes to the nearest Error Boundary. The promise **must be cached**: one created during render is recreated on every retry and triggers "A component was suspended by an uncached promise". \`use\` cannot sit inside \`try/catch\`; \`use(context)\` is not supported in Server Components.
- **Refs**: a ref callback may return a cleanup, and React then skips the old "call with \`null\`" on detach — so TypeScript now rejects implicit returns like \`ref={n => (x = n)}\`. \`element.ref\` is deprecated for \`element.props.ref\`.
- **Metadata** (\`<title>\`, \`<meta>\`, \`<link>\`) is hoisted to \`<head>\` in client rendering, streaming SSR and RSC. **Stylesheets** with \`precedence\` are ordered, deduplicated and loaded before dependent content is revealed; \`<script async>\` is deduplicated.
- **Removed in 19**: \`propTypes\` (now silently ignored), \`defaultProps\` on function components (class components keep it), legacy context (\`contextTypes\`/\`getChildContext\`), string refs, \`createFactory\`, module-pattern factories, \`ReactDOM.render\`/\`hydrate\`/\`unmountComponentAtNode\`/\`findDOMNode\`, \`react-dom/test-utils\` (\`act\` moved to \`react\`), \`renderToNodeStream\`, and UMD builds.
- **Errors and hydration**: a mismatch logs **one** error with a server/client diff instead of several warnings; unexpected tags injected into \`<head>\`/\`<body>\` by extensions are skipped. Render errors are no longer re-thrown; root options \`onCaughtError\`/\`onUncaughtError\` join \`onRecoverableError\`.`,
    example: `A post page sets its own \`<title>\`, preloads its hero, reads context after an early return and streams comments from a promise its parent started.`,
    codeWalkthrough: `~~~tsx
import { createContext, use, Suspense, type ComponentProps } from 'react';
import { preconnect, preload } from 'react-dom';

const ThemeContext = createContext<'light' | 'dark'>('light');

function SearchInput({ ref, ...props }: ComponentProps<'input'>) {
  return <input ref={ref} type="search" {...props} />; // no forwardRef
}

function Comments({ promise }: { promise: Promise<CommentData[]> }) {
  const comments = use(promise); // suspends; rejection -> Error Boundary
  return <ul>{comments.map((c) => <li key={c.id}>{c.body}</li>)}</ul>;
}

function Post({ post, commentsPromise }: { post?: PostData; commentsPromise: Promise<CommentData[]> }) {
  if (!post) return null;
  const theme = use(ThemeContext); // fine after an early return; useContext is not
  preconnect('https://img.example.com');
  preload(post.heroUrl, { as: 'image', fetchPriority: 'high' });
  return (
    <ThemeContext value={post.theme ?? theme}>
      <title>{post.title}</title>
      <meta name="description" content={post.summary} />
      <article
        ref={(node) => {
          if (!node) return;
          const io = new IntersectionObserver(trackRead);
          io.observe(node);
          return () => io.disconnect(); // ref cleanup (React 19)
        }}
      >
        {post.body}
      </article>
      <SearchInput placeholder="Search posts" />
      <Suspense fallback={<p>Loading comments…</p>}>
        <Comments promise={commentsPromise} />
      </Suspense>
    </ThemeContext>
  );
}
~~~

1. \`ref\` arrives as an ordinary prop; no \`forwardRef\`.
2. \`commentsPromise\` comes from the parent, a loader or a Server Component, so it is stable across retries.
3. \`use(ThemeContext)\` after a conditional return is legal for \`use\`, illegal for \`useContext\`.
4. \`preload\`/\`preconnect\` are deduplicated hints React orders in \`<head>\` by priority; \`<title>\`/\`<meta>\` are hoisted.
5. The ref callback's returned function runs when the node detaches.`,
    misconceptions: [
      '`use` is a Hook with the usual rules — it can be called conditionally and in loops, though it must still be called during render of a component or Hook, and not inside `try/catch`.',
      '`use(fetch(url))` is the new way to fetch — a promise created in render is re-created on every attempt; it must come from a cache, framework or Server Component.',
      '`forwardRef` and `<Context.Provider>` were removed — both still work; new code should use the `ref` prop and `<Context>` directly, and the docs flag both for deprecation in a future release.',
    ],
    failureCases: [
      'After upgrading, a function component\'s `defaultProps` are silently ignored and props arrive as `undefined` (class components keep `defaultProps`); move them to destructuring defaults.',
      'Two components render a `<title>` at once; both land in `<head>` and browser/crawler behaviour is undefined.',
      'A browser-only widget reads `window` during SSR and mismatches on hydration; since 19.3, call `use(browser())` inside a `<Suspense>` instead of a `mounted` effect.',
    ],
    productionImplications: `Upgrade via 18.3 (it warns on deprecated APIs) and run \`npx codemod@latest react/19/migration-recipe\`. Audit dependencies for \`defaultProps\`, string refs and \`findDOMNode\`. Wire \`onCaughtError\`/\`onUncaughtError\` into error reporting. Centralise data promises in a cache or loader before adopting \`use\`.`,
    docSourceIds: ['react-19-release', 'react-use', 'react-hydrateroot'],
    interviewQuestions: [
      'How is `use()` different from a Hook, and why must the promise passed to it be cached?',
      'Migrate a `forwardRef` + `useImperativeHandle` input to React 19. What changes, and what about TypeScript ref callbacks?',
      'What happens when a deeply nested component renders `<title>` or `<link rel="stylesheet" precedence>`?',
      'Name APIs removed in React 19 that would break a legacy codebase, and how you would find and fix them.',
      'What changed about hydration error reporting and third-party DOM injections in React 19?',
    ],
    related: ['react-19-actions', 'react-context', 'hydration', 'react-server-components', 'react-effects'],
  },
  {
    id: 'react-server-components',
    title: 'React Server Components and the client boundary',
    area: 'React',
    summary: 'Server Components render ahead of time (at build or per request) in a server environment, can be async, and send only their output to the browser. `\'use client\'` marks a module-graph boundary, and only serializable values, Server Functions and JSX can cross it.',
    definition: `**Server Components** run in a separate environment, the "server" in RSC, either once at build time or per request. Their code and dependencies are **not** in the client bundle, and they can be \`async\`. There is **no directive for Server Components** (they are the default); \`'use client'\` marks client code and \`'use server'\` marks **Server Functions**. RSC are stable in React 19, but the bundler integration APIs are not semver within 19.x.`,
    whyItExists: `Client-only React fetches in effects after the JS loads (often as a waterfall) and ships every rendering dependency, even for static output. RSC move data access and heavy rendering next to the data and send only the result; interactivity stays in small client islands.`,
    mechanism: `- **\`'use client'\` works on the module graph**: put at the top of a file, it marks that module and **all of its transitive imports** as client code. Whether a component *usage* is server or client depends on who imports it, not on a per-component flag.
- **Composition**: a Server Component can pass **Server Components as \`children\`/props** into a Client Component; they render on the server first. A client module that *imports* a component makes it a client component.
- **Crossing the boundary**: primitives, arrays, \`Map\`/\`Set\`, \`Date\`, plain objects, **Promises**, **JSX** and **Server Functions**. Not other functions, classes or class instances.
- **Limits**: no state, effects, most Hooks or event handlers; no creating or reading context — but since **19.3** they can render a \`<Context>\` imported from a \`'use client'\` module directly (before, via a wrapper).
- **Server Functions** (\`'use server'\` at the top of an async function or module) become references. Calling one sends the serialized arguments over the network. Meant for mutations, not fetching; arguments are untrusted.`,
    example: `A product page queries the database and renders markdown with a library that never ships, hands a Server Function to a small client form, and streams reviews.`,
    codeWalkthrough: `~~~tsx
// ProductPage.tsx — Server Component (no directive)
import { Suspense } from 'react';
import { db } from './server/db';
import { renderMarkdown } from 'big-markdown-lib'; // stays on the server
import { AddToCart } from './AddToCart';
import { Reviews } from './Reviews';
import { addToCart } from './actions';

export default async function ProductPage({ id }: { id: string }) {
  const product = await db.products.get(id); // await during render
  const reviewsPromise = db.reviews.list(id); // started, not awaited
  return (
    <article>
      <h1>{product.name}</h1>
      <section>{renderMarkdown(product.description)}</section>
      <AddToCart productId={product.id} action={addToCart}>
        <StockBadge id={id} /> {/* Server Component passed as children */}
      </AddToCart>
      <Suspense fallback={<p>Loading reviews…</p>}>
        <Reviews promise={reviewsPromise} /> {/* client: use(promise) */}
      </Suspense>
    </article>
  );
}

// AddToCart.tsx
'use client';
import { useState, type ReactNode } from 'react';
export function AddToCart({ productId, action, children }: {
  productId: string; action: (fd: FormData) => Promise<void>; children: ReactNode;
}) {
  const [qty, setQty] = useState(1);
  return (
    <form action={action}>
      <input type="hidden" name="productId" value={productId} />
      <input name="qty" type="number" value={qty} onChange={(e) => setQty(+e.target.value)} />
      <button>Add</button>
      {children}
    </form>
  );
}

// actions.ts
'use server';
export async function addToCart(formData: FormData) {
  const user = await requireUser(); // arguments are client-controlled: authorize
  await db.carts.add(user.id, String(formData.get('productId')), Number(formData.get('qty')));
}
~~~

1. \`ProductPage\` is async and server-only; the DB client and markdown library are in no client chunk.
2. Only serializable values cross into \`AddToCart\`: a string, a Server Function reference and rendered JSX.
3. \`reviewsPromise\` crosses as a pending promise; \`Reviews\` suspends on it with \`use\` without blocking the page.
4. \`addToCart\` is only a reference on the client; as a form action it works before hydration.`,
    misconceptions: [
      '`\'use server\'` marks Server Components — it marks Server Functions; Server Components have no directive.',
      '`\'use client\'` means "render only in the browser" — Client Components are still pre-rendered to HTML during SSR; the directive means their code ships to and runs on the client.',
      'A child in the render tree inherits its parent\'s environment — the boundary is in the module graph; a Server Component passed as `children` to a Client Component stays a Server Component.',
      'RSC replace SSR — they are complementary: RSC decide what code ships, SSR turns the result into HTML for first paint.',
    ],
    failureCases: [
      'A client component imports a shared module that reads a secret or the DB client; it is pulled into the client graph and the build fails or the secret leaks. Guard such modules (Next.js documents the `server-only` package).',
      'A Server Component passes `onClick={() => …}` or a class instance to a client component; the render throws because it is not serializable.',
      '`\'use client\'` is added to the root layout "to fix a hook error", turning the whole tree into client code.',
    ],
    productionImplications: `Push \`'use client'\` down to interactive leaves and pass server content through \`children\`. Start independent queries in parallel and stream slow ones via Suspense. Treat RSC packages as security-critical — a critical unauthenticated RCE was disclosed on 2025-12-03 (fixed in 19.0.1/19.1.2/19.2.1) — and pin versions as your framework advises, since the bundler APIs are not semver within 19.x.`,
    docSourceIds: ['react-server-components', 'react-use-client', 'react-server-functions'],
    interviewQuestions: [
      'Explain why `\'use client\'` is a module-graph boundary rather than a component flag. Is a component without the directive always a Server Component?',
      'What values can be passed from a Server Component to a Client Component? How do you pass an event handler or a Server Component?',
      'Show how to stream low-priority data from a Server Component to a Client Component without blocking the page.',
      'What is the difference between a Server Component, a Server Function and a Server Action?',
      'What security and versioning concerns does adopting RSC introduce?',
    ],
    related: ['react-19-actions', 'rendering-strategies', 'streaming-ssr', 'hydration', 'nextjs-app-router'],
  },
  {
    id: 'react-performance',
    title: 'React rendering performance: measure, memoize, defer',
    area: 'Performance',
    summary: 'A component re-renders when its state changes, its parent re-renders, or a context it reads changes. Measure with the Profiler first, then cut work by restructuring state, memoizing (now automated by the stable React Compiler), deferring non-urgent updates, or virtualizing.',
    definition: `React re-renders a component when (1) its own state changes, (2) its **parent re-renders**, which by default re-renders every child whether or not props changed, or (3) a **context it reads** changes. A re-render is not a DOM update, but it costs CPU, which shows up as input lag (INP) on slow devices. Tools: **measure** (DevTools Profiler, \`<Profiler>\`, React Performance Tracks in Chrome DevTools since 19.2), **restructure**, **memoize** (manually or with React Compiler), **schedule** (\`useTransition\`, \`useDeferredValue\`) and **virtualize**.`,
    whyItExists: `Most apps are fast without tuning; memoizing everything adds code that one inline object can silently break. Real problems are specific — a keystroke re-rendering a 5,000-row table, a context mixing fast and slow values — and measuring tells you which you have.`,
    mechanism: `- **Measure**: \`<Profiler id onRender>\` reports \`actualDuration\` (this commit) and \`baseDuration\` (estimated cost with no memoization).; close values mean memoization is not working. It is off in production unless you use the profiling build.
- **\`memo\`** compares props with \`Object.is\` — useless if a prop is a fresh object/function each render; own state and context still re-render it. **\`useMemo\`/\`useCallback\`** pay off only for memoized children, effect dependencies or truly expensive calculations.
- **React Compiler** — stable since **v1.0 (October 7, 2025)**, still opt-in: a build-time Babel plugin (\`babel-plugin-react-compiler\`, first in the plugin list; Next.js \`reactCompiler: true\`, Vite \`reactCompilerPreset\`; React 17/18 via \`react-compiler-runtime\`) that auto-memoizes components and hooks. It skips code breaking the Rules of React (lint rules in \`eslint-plugin-react-hooks\`); \`"use no memo"\` opts out; DevTools shows a "Memo ✨" badge. Keep existing \`useMemo\`s — removing them can change output.
- **Responsiveness**: \`startTransition\` makes an update interruptible (never for text inputs). \`useDeferredValue(value, initialValue?)\` renders with the old value, then the new one in an interruptible background render — the slow child must be memoized for it to help.
- **Structure**: colocate state, pass static subtrees as \`children\`, use stable keys, split context by update frequency (state vs \`dispatch\`), virtualize long lists.`,
    example: `A filter over 20,000 rows lags; the Profiler shows \`Results\` at ~40ms per commit. Deferring the query and memoizing \`Results\` keeps typing smooth.`,
    codeWalkthrough: `~~~tsx
import { Profiler, memo, useDeferredValue, useState, type ProfilerOnRenderCallback } from 'react';

const Results = memo(function Results({ query }: { query: string }) {
  const rows = filterRows(ALL_ROWS, query); // ~40ms on a mid-range phone
  return <ul>{rows.map((r) => <Row key={r.id} row={r} />)}</ul>;
});

const onRender: ProfilerOnRenderCallback = (id, phase, actualDuration, baseDuration) => {
  if (actualDuration > 16) sendMetric({ id, phase, actualDuration, baseDuration });
};

export function SearchPage() {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const stale = query !== deferredQuery;
  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <Profiler id="results" onRender={onRender}>
        <div style={{ opacity: stale ? 0.6 : 1 }}>
          <Results query={deferredQuery} />
        </div>
      </Profiler>
    </>
  );
}
~~~

1. Typing updates \`query\` urgently while \`deferredQuery\` still holds the old value.
2. \`Results\` is memoized and its prop is unchanged, so the urgent render skips the expensive part.
3. React re-renders \`Results\` in the background; a new keystroke abandons that work.
4. \`stale\` dims the list instead of a spinner; \`onRender\` reports slow commits.
5. React Compiler would apply the \`memo\` automatically, but not the \`useDeferredValue\` — it memoizes, it does not reschedule.`,
    misconceptions: [
      'A component re-renders when its props change — it re-renders when its parent renders; `memo` is what makes props comparison matter.',
      '`useCallback` makes a function faster — it only keeps identity stable, which matters only for memoized children or effect dependencies.',
      'React Compiler is experimental — v1.0 is stable (October 2025); it is opt-in, and code that breaks the Rules of React is skipped rather than "fixed".',
      '`useDeferredValue` debounces — there is no fixed delay; the background render starts immediately and is simply interruptible.',
    ],
    failureCases: [
      'A `memo`\'d row receives an inline `style={{…}}` or `onSelect={() => select(id)}`, so every row re-renders on every parent update.',
      'One `AppContext` holds `{ user, theme, cursorPosition }`; the cursor updates 60 times a second and re-renders every consumer.',
      'A text input\'s state is set inside `startTransition`; Transitions cannot control text inputs, so typing breaks.',
    ],
    productionImplications: `Profile a production profiling build on a throttled mid-range device with real data sizes, and correlate with field INP. Fix structure before adding \`memo\`. Adopt React Compiler incrementally with its lint rules, keeping manual memoization as an escape hatch for effect dependencies. Virtualize lists past a few hundred complex rows.`,
    docSourceIds: ['react-memo', 'react-compiler', 'react-profiler'],
    interviewQuestions: [
      'List every reason a component can re-render. Which ones does `React.memo` prevent?',
      'How would you find and fix a slow keystroke in a large filtered table? What would you measure first?',
      'What does React Compiler do, what is its status, and how does it change your use of `useMemo`/`useCallback`?',
      'Compare `useTransition`, `useDeferredValue` and debouncing for a search-as-you-type UI.',
      'How do you structure context so a high-frequency value does not re-render the whole app?',
    ],
    related: ['referential-equality', 'react-context', 'react-reconciliation-keys', 'derived-state', 'core-web-vitals'],
  },
  {
    id: 'code-splitting',
    title: 'Code splitting, lazy loading and preloading',
    area: 'Performance',
    summary: 'Ship less JavaScript up front by splitting bundles at dynamic `import()` points, rendering split components with `lazy` + `<Suspense>`, and preloading chunks on intent so that splitting does not turn into a loading waterfall.',
    definition: `**Code splitting** turns one bundle into chunks that load on demand. The primitive is the dynamic \`import()\` expression: it returns a Promise for a module, and bundlers emit the imported module as its own chunk. In React, \`lazy(load)\` wraps such a loader in a component that **suspends** until the chunk arrives, and the nearest \`<Suspense>\` shows a fallback meanwhile. Split by **route** (each page is a chunk, the biggest and safest win) or by **component** (heavy, rarely used UI such as editors, charts, modals and admin panels).`,
    whyItExists: `JavaScript costs more than its download: each script is parsed, compiled and executed on the main thread. On a low-end phone a big bundle becomes long tasks that delay interactions during load (INP input delay). web.dev suggests about **100 KB per individual script** as a balance of compression, download and evaluation cost.`,
    mechanism: `- **\`lazy(load)\`** goes at **module top level**. React calls \`load\` on first render, caches the promise and result, and renders \`.default\` (map named exports yourself). A rejected load throws to the nearest Error Boundary.
- **Suspense**: already-visible content is replaced by the fallback when it suspends again, unless the update was a Transition. **React 19 change**: the fallback now commits immediately and suspended siblings are pre-warmed afterwards (React 18 rendered the siblings first).
- **Preload on intent**: call the same \`import()\` on \`pointerenter\`/\`focus\`; the module cache makes the later \`lazy\` render instant. \`preloadModule\`/\`preload\` from \`react-dom\` cover other assets.
- **Waterfalls**: render → fetch chunk → render → fetch data → nested lazy → fetch chunk. Start code and data in parallel from the handler or route loader.
- **Tree shaking** only removes unused exports of static, side-effect-free ES imports; CommonJS and catch-all barrel files defeat it. Verify with a bundle visualizer on the production build. Server Components add no client JS at all.`,
    example: `A 300 KB Markdown editor used by 5% of sessions becomes a lazy chunk preloaded when "Edit" is hovered or focused.`,
    codeWalkthrough: `~~~tsx
import { lazy, Suspense, useState, startTransition } from 'react';

const loadEditor = () => import('./MarkdownEditor'); // one loader, reused
const MarkdownEditor = lazy(loadEditor); // top level, never inside a component
const Chart = lazy(() => import('./charts').then((m) => ({ default: m.LineChart })));

export function Note({ note }: { note: Note }) {
  const [editing, setEditing] = useState(false);
  return (
    <section>
      <button
        onPointerEnter={loadEditor} // preload on intent
        onFocus={loadEditor}
        onClick={() => startTransition(() => setEditing(true))}
      >
        Edit
      </button>
      <ChunkErrorBoundary fallback={<p>Couldn't load the editor. <a href="">Reload</a></p>}>
        <Suspense fallback={<EditorSkeleton />}>
          {editing ? <MarkdownEditor initial={note.body} /> : <Preview body={note.body} />}
          {note.hasStats && <Chart series={note.stats} />}
        </Suspense>
      </ChunkErrorBoundary>
    </section>
  );
}
~~~

1. \`loadEditor\` is both the \`lazy\` loader and the preload trigger; by click time the chunk has often arrived.
2. \`startTransition\` keeps the preview visible instead of flashing the skeleton while the chunk is in flight.
3. \`Chart\` maps a named export to \`default\`, as \`lazy\` requires.
4. A failed chunk (offline, stale hash after a deploy) hits the Error Boundary, not a blank screen.
5. One Suspense boundary reveals both together; split boundaries to reveal independently.`,
    misconceptions: [
      'More chunks is always better — each chunk is a request plus evaluation; over-splitting the critical path creates waterfalls.',
      '`lazy` makes the component load in the background automatically — nothing loads until first render unless you preload it.',
      'Code splitting reduces total JavaScript — it reduces initial JavaScript; tree shaking, removing dependencies and moving rendering to Server Components reduce the total.',
    ],
    failureCases: [
      '`lazy()` declared inside a component creates a new type each render, so the subtree remounts and loses state.',
      'After a deploy, clients on old HTML request chunk hashes that no longer exist; without an Error Boundary the app white-screens.',
      'The LCP hero is lazy-loaded, so its image is not discovered until JS downloads, evaluates and renders.',
    ],
    productionImplications: `Split by route first, then heavy rarely-used components; never lazy-load above-the-fold content. Enforce bundle budgets in CI. Preload on intent and in route loaders, fetching data in parallel. Handle stale chunks in Error Boundaries (e.g. reload once). Judge the result by field INP/LCP, not bundle size alone.`,
    docSourceIds: ['react-lazy', 'react-suspense', 'webdev-inp'],
    interviewQuestions: [
      'How do `lazy`, dynamic `import()` and `<Suspense>` work together? What does `lazy` cache?',
      'Route-level vs component-level splitting: how do you decide what to split?',
      'How would you avoid a loading waterfall when a lazily loaded route also needs data?',
      'Why does JavaScript size hurt INP on low-end mobile even after it has downloaded?',
      'What breaks tree shaking, and how would you verify what ends up in the bundle?',
    ],
    related: ['react-performance', 'core-web-vitals', 'react-server-components', 'streaming-ssr', 'promises'],
  },
  {
    id: 'core-web-vitals',
    title: 'Core Web Vitals: LCP, INP, CLS',
    area: 'Performance',
    summary: 'Google\'s three field metrics for loading (LCP ≤ 2.5s), responsiveness (INP ≤ 200ms, which replaced FID on March 12, 2024) and visual stability (CLS ≤ 0.1). Each is judged at the 75th percentile of page loads, split by mobile and desktop.',
    definition: `**Core Web Vitals** are the stable subset of Web Vitals that apply to every page. A page passes when all three meet the "good" threshold at the **75th percentile**, segmented by mobile and desktop:

| Metric | Measures | Good | Poor |
| --- | --- | --- | --- |
| **LCP** Largest Contentful Paint | render time of the largest image, text block or video in the viewport | ≤ 2.5 s | > 4.0 s |
| **INP** Interaction to Next Paint | latency of the slowest click/tap/key interaction (outliers ignored) | ≤ 200 ms | > 500 ms |
| **CLS** Cumulative Layout Shift | largest burst of unexpected layout shifts | ≤ 0.1 | > 0.25 |

INP **replaced FID on March 12, 2024**: FID measured only the input delay of the *first* interaction; INP covers every interaction through to the next paint.`,
    whyItExists: `\`onload\` does not reflect what users feel. These three capture main content appearing, input getting a response, and nothing jumping under the cursor — measured on real devices and networks a developer laptop hides.`,
    mechanism: `- **Field vs lab**: field data (CrUX, or RUM via \`web-vitals\`) is the truth; lab tools debug and catch regressions. Lighthouse **cannot measure INP**; Total Blocking Time is its lab proxy.
- **LCP** stops updating at the first user interaction. Break it into four subparts: **TTFB** (~40%), **resource load delay** (<10%), **resource load duration** (~40%) and **element render delay** (<10%). Fixes: make the LCP image discoverable in the initial HTML (not JS-injected or \`data-src\`; preload CSS backgrounds); never lazy-load it; \`fetchpriority="high"\` on one or two images at most; same origin or preconnect; cut TTFB (CDN, caching); shrink render-blocking CSS; no sync \`<head>\` scripts.
- **INP** counts clicks, taps and key presses (not scroll or hover). An interaction's latency is **input delay + processing duration + presentation delay**. One highest value is ignored per 50 interactions. Fixes: break up **long tasks** (>50ms) by yielding (\`scheduler.yield()\` where supported, else \`setTimeout\`), do only the visual update before yielding, avoid layout thrashing, keep the DOM small, cut script evaluation.
- **CLS** takes the worst **session window**: shifts less than 1 s apart, at most 5 s long. Each shift scores **impact fraction × distance fraction**; shifts within 500 ms of discrete input are excluded. Fixes: \`width\`/\`height\` or \`aspect-ratio\` on media, reserved \`min-height\` for ads/embeds/banners, no inserting above existing content, metric-matched fallback fonts (\`size-adjust\`) or \`font-display: optional\`, \`transform\` animations.`,
    example: `Mobile p75 LCP is 4.1 s; the breakdown shows 1.6 s resource load delay because client JS renders the hero \`<img>\`. Server-rendering it with \`fetchpriority="high"\` and dimensions fixes LCP and a CLS shift.`,
    codeWalkthrough: `~~~tsx
// 1. Field measurement (RUM)
import { onCLS, onINP, onLCP } from 'web-vitals';

function send(metric: { name: string; value: number; id: string }) {
  const body = JSON.stringify(metric);
  (navigator.sendBeacon && navigator.sendBeacon('/analytics', body)) ||
    fetch('/analytics', { body, method: 'POST', keepalive: true });
}
onLCP(send);
onINP(send);
onCLS(send);

// 2. LCP + CLS: discoverable, prioritised, dimensioned hero
<img src="/hero.avif" width={1200} height={600} fetchPriority="high" alt="" />;

// 3. INP: paint feedback first, yield, then do the heavy work
async function onFilterClick(next: Filter) {
  setActive(next); // cheap visual update
  await yieldToMain(); // let the browser paint
  applyFilterAndRecalculate(next); // expensive work in a later task
}
const yieldToMain = (): Promise<void> =>
  (globalThis as any).scheduler?.yield ? (globalThis as any).scheduler.yield() : new Promise((r) => setTimeout(r, 0));
~~~

1. \`web-vitals\` measures like Google's tools; \`sendBeacon\` survives unload, when CLS and INP become final.
2. Server-rendered, the hero is found by the preload scanner; \`width\`/\`height\` reserve its box (no shift).
3. The handler applies the cheap update, yields so the next frame paints (ending the interaction for INP), then does the heavy work; \`scheduler.yield()\` continuations are prioritised.`,
    misconceptions: [
      'A good Lighthouse score means good Core Web Vitals — CWV are assessed on field data at p75; Lighthouse cannot even measure INP.',
      'INP is the average interaction latency — it is (near) the worst interaction of the visit, with one outlier ignored per 50 interactions, then p75 across visits.',
      'Lazy-loading every image helps LCP — lazy-loading the LCP image always delays it.',
      'CLS only matters during load — it covers the page\'s whole lifetime, including late banners and infinite scroll.',
    ],
    failureCases: [
      'A carousel marks four slides `fetchpriority="high"`; they compete and the real LCP image gains nothing.',
      'An A/B script hides the page until it picks a variant, adding element render delay to every view.',
      'A click handler synchronously re-filters 10,000 items: 300ms processing duration, INP "needs improvement" on mid-range Android.',
      'A cookie banner injected at the top after hydration pushes content down, failing CLS on every first visit.',
    ],
    productionImplications: `Collect RUM with attribution (LCP element, interaction target, subparts) segmented by device and route — regressions usually trace to one template or third-party script. Make the LCP resource discoverable from the server, yield in long handlers, reserve space for late content. Gate CI on lab budgets (LCP, TBT, CLS) but judge success on field p75.`,
    docSourceIds: ['webdev-vitals', 'webdev-inp-metric', 'webdev-optimize-lcp'],
    interviewQuestions: [
      'Define LCP, INP and CLS with their "good" thresholds. At what percentile are they assessed, and why?',
      'Why did INP replace FID? What does INP measure that FID missed?',
      'LCP is 4s on mobile. Walk through how you would break it down and what you would fix first.',
      'An interaction has a 400ms INP. Which three phases make up that latency, and how would you reduce each?',
      'Your lab scores are great but field CWV fail. What explains the gap, and how do you debug it?',
    ],
    related: ['code-splitting', 'react-performance', 'rendering-strategies', 'streaming-ssr', 'event-loop'],
  },
];
