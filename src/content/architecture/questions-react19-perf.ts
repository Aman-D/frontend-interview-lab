import type { DesignQuestion } from '../schema';

/**
 * Architecture & performance knowledge questions (React 19.3, Core Web Vitals, code splitting).
 * Scenario-style: graded MCQs + a self-assessed free-text answer compared against `answerOutline`.
 * Every framework fact was checked against the linked react.dev / web.dev / nextjs.org pages on 2026-11-23.
 */

const VERIFIED = '2026-11-23';

const NO_FREQUENCY_EVIDENCE =
  'No interview-report evidence was collected for this exact question, so frequency is LOW_CONFIDENCE and no company is claimed to ask it. The scenario is an original exercise built on the official documentation listed as evidence; every API name, behaviour and threshold in the answer was checked against those pages on 2026-11-23.';

export const ARCH_QUESTIONS_REACT19_PERF: DesignQuestion[] = [
  // ---------------------------------------------------------------------------------------------
  // 1. React 19 form Actions
  // ---------------------------------------------------------------------------------------------
  {
    schemaVersion: 1,
    kind: 'design',
    execution: 'quiz',
    track: 'architecture',
    id: 'arch-react19-form-actions',
    slug: 'react19-form-actions',
    title: 'Migrate a classic form to React 19 Actions',
    difficulty: 'medium',
    priority: 'P0',
    seniority: ['Senior', 'SDE-2', 'SDE-3', 'MTS'],
    topics: ['React 19 Actions', 'useActionState', 'useFormStatus', 'useOptimistic', '<form action>', 'progressive enhancement'],
    estimatedMinutes: 25,
    conceptIds: ['react-19-actions', 'react-19-apis', 'async-ui-states', 'controlled-uncontrolled', 'react-server-components'],
    research: {
      provenance: 'DOCUMENTED_TECHNICAL_EXERCISE',
      frequencyConfidence: 'LOW_CONFIDENCE',
      verificationStatus: 'SOURCES_VERIFIED',
      lastVerified: VERIFIED,
      evidence: [
        { sourceId: 'react-19-release', url: 'https://react.dev/blog/2024/12/05/react-19', originalTitle: 'React v19', note: 'Introduces Actions, useActionState, useOptimistic, <form> Actions, useFormStatus and requestFormReset.' },
        { sourceId: 'react-useactionstate', url: 'https://react.dev/reference/react/useActionState', originalTitle: 'useActionState', note: 'Signature (reducerAction, initialState, permalink?), sequential queueing, error handling, "My Action cannot read form data".' },
        { sourceId: 'react-useoptimistic', url: 'https://react.dev/reference/react/useOptimistic', originalTitle: 'useOptimistic', note: '"Optimistically adding to a list" with a reducer; setter must be called inside an Action.' },
        { sourceId: 'react-form', url: 'https://react.dev/reference/react-dom/components/form', originalTitle: '<form>', note: 'Function action runs in a Transition, POST, automatic reset of uncontrolled fields, progressive-enhancement requirements.' },
      ],
      researchNotes: `${NO_FREQUENCY_EVIDENCE} The useFormStatus reference page (react.dev/reference/react-dom/hooks/useFormStatus) was also read to confirm that it must be called from a component rendered inside the <form>, and that its pending flag also covers a Transition started from onSubmit.`,
    },
    scenario: `You own a "Add comment" form written in the React 17/18 style:

~~~tsx
const [text, setText] = useState('');
const [isSubmitting, setIsSubmitting] = useState(false);
const [error, setError] = useState<string | null>(null);

async function handleSubmit(e: FormEvent) {
  e.preventDefault();
  setIsSubmitting(true);
  setError(null);
  try {
    const saved = await api.saveComment(text);
    setComments((c) => [...c, saved]);
    setText('');
  } catch (err) {
    setError((err as Error).message);
  } finally {
    setIsSubmitting(false);
  }
}
~~~

The team is on React 19.3 and wants to adopt **Actions**. The comment should appear in the list **immediately** (greyed out until the server confirms), the Submit button lives in a shared design-system component, and product asks whether the form can work **before JavaScript has loaded**.

Walk me through the migration: which APIs you use and why, what behaviour changes (and could break existing tests or UX), and what progressive enhancement actually requires.`,
    constraints: [
      'React 19.3 client app; a framework with Server Functions is available for one follow-up but not assumed for the main answer.',
      'The Submit button is a shared design-system component and must not receive pending state through props.',
      'Validation errors must keep what the user typed; unexpected errors must not silently disappear.',
    ],
    answerOutline: [
      'Replace onSubmit + preventDefault with `<form action={fn}>`: React calls the function with FormData, runs it in a Transition, and the submission is always POST.',
      'Use `useActionState(reducerAction, initialState)` → `[state, dispatchAction, isPending]`; the reducerAction receives `(previousState, formData)` — FormData is the second argument.',
      'Return known (validation/API) errors as state; thrown errors go to the nearest Error Boundary and cancel queued actions.',
      'Move the pending UI into the design-system button with `useFormStatus()` from react-dom — it must be called in a component rendered inside the <form>, not in the component that renders the form.',
      'Add the optimistic comment with `useOptimistic(comments, reducer)` and call its setter inside the Action; the optimistic item disappears automatically when the Action ends and converges with the real list in the same render.',
      'Inputs become uncontrolled (`name` + `defaultValue`); React resets uncontrolled fields after a successful action (including when it returns a validation error), so preserve values by feeding the submitted FormData back into defaultValue.',
      'State updates after an `await` inside your own Action code still need their own `startTransition` (documented current limitation); dispatches are queued and run sequentially.',
      'Progressive enhancement needs a Server Function as the action, `useActionState` to show its result, and the form rendered by a Client Component; `permalink` covers submissions before the bundle loads.',
    ],
    modelAnswer: `**1. Move submission to an Action.** Passing a function to \`<form action>\` makes React call it with a \`FormData\`, run it inside a Transition, expose pending state to children via \`useFormStatus\`, propagate thrown errors to the nearest Error Boundary, and reset uncontrolled fields when it succeeds. The method becomes POST regardless of the \`method\` prop, and \`e.preventDefault()\` disappears.

**2. Own the result with \`useActionState\`.** It returns \`[state, dispatchAction, isPending]\`. The reducer action receives the **previous state first and the FormData second** — the classic migration bug is reading \`formData.get\` on the first argument. Known failures (validation, "comment too long") are *returned* as state; unexpected exceptions are *thrown* so an Error Boundary shows them — and React cancels any queued dispatches when that happens.

**3. Optimistic row with \`useOptimistic\`.** Pass the canonical list plus a pure reducer that appends a \`pending: true\` item. Call the setter inside the Action. While the Action is pending React renders the optimistic list; when it finishes, React renders whatever the real \`comments\` value is — the confirmed row on success, or the original list on failure — with no manual rollback.

**4. Pending UI in the design system.** \`useFormStatus()\` reads the status of the **parent** form, so the shared \`<SubmitButton>\` calls it internally. Calling it in the component that renders the \`<form>\` always reports \`pending: false\`.

~~~tsx
import { useActionState, useOptimistic, startTransition } from 'react';
import { useFormStatus } from 'react-dom';

type FormState = { error: string | null; submitted: FormData | null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending}>{pending ? 'Posting…' : 'Post'}</button>;
}

export function AddComment({ comments, onSaved }: Props) {
  const [optimistic, addOptimistic] = useOptimistic(
    comments,
    (current: Comment[], text: string) => [...current, { id: 'tmp-' + current.length, text, pending: true }],
  );
  const [state, dispatchAction] = useActionState(
    async (_prev: FormState, formData: FormData): Promise<FormState> => {
      const text = String(formData.get('text') ?? '').trim();
      if (!text) return { error: 'Comment is required', submitted: formData };
      const res = await api.saveComment(text);
      if (!res.ok) return { error: res.message, submitted: formData };
      startTransition(() => onSaved(res.comment)); // update after await → wrap again
      return { error: null, submitted: null };
    },
    { error: null, submitted: null },
  );

  async function formAction(formData: FormData) {
    addOptimistic(String(formData.get('text') ?? ''));
    return dispatchAction(formData);
  }

  return (
    <>
      <ul>{optimistic.map((c) => <li key={c.id} aria-busy={c.pending}>{c.text}</li>)}</ul>
      <form action={formAction}>
        <textarea name="text" defaultValue={String(state.submitted?.get('text') ?? '')} />
        <SubmitButton />
        {state.error && <p role="alert">{state.error}</p>}
      </form>
    </>
  );
}
~~~

**What changes or breaks.** Inputs become uncontrolled, and React resets them after *every* successful action — returning a validation error counts as success — so the submitted FormData is fed back into \`defaultValue\`. Tests that typed into a controlled input and asserted \`value\` synchronously need updating. Multiple submissions are **queued and run in order**, because each call needs the previous state; that is safe for a comment form but can feel slow for rapid-fire actions (the docs suggest \`useOptimistic\` or cancelling queued work with an AbortController). Errors that used to be caught into local state now need either an explicit return or an Error Boundary.

**Progressive enhancement.** A client-side function has nothing to run before hydration. To show results before JavaScript loads, the action must be a **Server Function**, the result must be read with \`useActionState\`, and the form must be rendered by a Client Component. The optional \`permalink\` argument tells the browser which URL to navigate to if the form is submitted before the bundle loads; the same form must render there.`,
    pitfalls: [
      'Reading FormData from the first argument of the useActionState reducer action — it is the previous state; FormData is the second argument.',
      'Calling useFormStatus in the same component that renders the <form>: pending is never true there.',
      'Calling dispatchAction from a plain click handler without startTransition or an action prop — React logs "An async function with useActionState was called outside of a transition" and isPending does not update.',
      'Forgetting that a successful action (including one that returns a validation error) resets uncontrolled fields, wiping what the user typed.',
      'Throwing for expected validation errors: it shows the Error Boundary and cancels every queued dispatch.',
    ],
    versionNotes:
      'Checked against React 19.3 docs on 2026-11-23. useActionState signature is (reducerAction, initialState, permalink?) returning [state, dispatchAction, isPending]; the 19.3 changelog only renames "form state" to "action state" in its error messages and fires onReset when React auto-resets a form after a Server Action. The docs still list "set state after await needs an extra startTransition" as a current limitation. useFormStatus pending also covers a Transition started from onSubmit.',
    docSourceIds: ['react-19-release', 'react-useactionstate', 'react-useoptimistic', 'react-form', 'react-server-functions', 'react-usetransition'],
    mcqs: [
      {
        id: 'm1',
        question: 'A design-system `<SubmitButton>` needs to know whether its form is submitting. Where must `useFormStatus()` be called for `pending` to become true?',
        options: [
          { id: 'a', text: 'In the component that renders the <form>, next to the action function', explanation: 'useFormStatus does not track a form rendered in the same component; pending stays false there.' },
          { id: 'b', text: 'In a component rendered inside the <form>, such as the button itself', explanation: 'Correct — it reads the status of the parent <form>, much like a context consumer.' },
          { id: 'c', text: 'Anywhere in the tree, because it reports the last form submitted on the page', explanation: 'It only reports the status of a parent <form>; with no parent form, data and action are null and pending is false.' },
          { id: 'd', text: 'Only inside a Server Component', explanation: 'useFormStatus is a react-dom Hook used in client components.' },
        ],
        correctOptionId: 'b',
        explanation: 'useFormStatus returns status information only for a parent <form>; it must be called from a component rendered inside that form.',
        sourceIds: ['react-19-release', 'react-form'],
      },
      {
        id: 'm2',
        question: 'After migrating, this reducer action throws "formData.get is not a function". Why?',
        code: `const [state, formAction] = useActionState(async (formData) => {
  const text = formData.get('text');
  // ...
}, { error: null });`,
        options: [
          { id: 'a', text: 'Actions receive a SubmitEvent, not FormData', explanation: 'A function passed to <form action> receives FormData; there is no event object.' },
          { id: 'b', text: 'useActionState passes the previous state as the first argument; FormData is the second', explanation: 'Correct — the first parameter here is { error: null }, which has no get method.' },
          { id: 'c', text: 'FormData is only available when the action is a Server Function', explanation: 'Client-side function actions receive FormData too.' },
          { id: 'd', text: 'The form must use method="post" for FormData to be passed', explanation: 'With a function action the submission is POST regardless of the method prop.' },
        ],
        correctOptionId: 'b',
        explanation: 'The reducer action signature is (previousState, actionPayload); when used as a form action the payload is the submitted FormData.',
        sourceIds: ['react-useactionstate'],
      },
      {
        id: 'm3',
        question: 'A form action validates input and **returns** `{ error: "Too short" }` without throwing. What happens to the uncontrolled `<input name="title">` the user typed into?',
        options: [
          { id: 'a', text: 'It keeps the typed value, because the action reported an error', explanation: 'Returning is not failing: React treats the action as completed without throwing.' },
          { id: 'b', text: 'React resets it to its defaultValue (empty if none), unless you feed the submitted value back into defaultValue', explanation: 'Correct — a function action that completes without throwing resets uncontrolled fields; returning a validation error also triggers the reset.' },
          { id: 'c', text: 'The nearest Error Boundary renders its fallback', explanation: 'Only a thrown error reaches the Error Boundary.' },
          { id: 'd', text: 'The browser reloads the page', explanation: 'React handles function actions without a navigation.' },
        ],
        correctOptionId: 'b',
        explanation: 'React resets uncontrolled fields after a function action completes without throwing. To preserve values, return the submitted FormData and use it as the next defaultValue (or handle submission in onSubmit with preventDefault).',
        sourceIds: ['react-form', 'react-useactionstate'],
      },
    ],
    followUps: [
      { id: 'f1', level: 'mechanism', question: 'Why must dispatchAction run inside a Transition, and what happens to isPending if you call it from a plain onClick?', expectedConcepts: ['Actions run in Transitions', 'startTransition or an action prop', 'development error "called outside of a transition"', 'isPending does not update'], sourceIds: ['react-useactionstate', 'react-usetransition'] },
      { id: 'f2', level: 'application', question: 'The user double-clicks Post. What does useActionState do with the second submission, and how would you cancel stale work?', expectedConcepts: ['dispatches are queued and run sequentially', 'each call receives the previous result', 'AbortController to cancel queued actions', 'useOptimistic for immediate feedback'], sourceIds: ['react-useactionstate'] },
      { id: 'f3', level: 'edge-cases', question: 'The save fails after the optimistic comment is shown. Walk through exactly what the user sees and what code you need to write.', expectedConcepts: ['Transition ends', 'useOptimistic falls back to the real value', 'no manual rollback', 'return or catch the error to show a message'], sourceIds: ['react-useoptimistic'] },
      { id: 'f4', level: 'production', question: 'How do you split errors between returned state and Error Boundaries, and what does a thrown error do to queued actions?', expectedConcepts: ['known errors returned as state', 'unknown errors thrown', 'nearest Error Boundary', 'queued actions cancelled'], sourceIds: ['react-useactionstate', 'react-form'] },
      { id: 'f5', level: 'architecture', question: 'Product wants the form to work before JavaScript loads. What has to be true of the action, the component and the hook, and what is permalink for?', expectedConcepts: ['Server Function with use server', 'useActionState returns the result before hydration', 'form rendered by a Client Component', 'permalink for pre-hydration navigation', 'serializable state'], sourceIds: ['react-form', 'react-server-functions', 'react-useactionstate'] },
    ],
  },

  // ---------------------------------------------------------------------------------------------
  // 2. use() + Suspense + Error Boundaries
  // ---------------------------------------------------------------------------------------------
  {
    schemaVersion: 1,
    kind: 'design',
    execution: 'quiz',
    track: 'architecture',
    id: 'arch-react19-use-and-suspense',
    slug: 'react19-use-and-suspense',
    title: 'Data loading with use(), Suspense and Error Boundaries',
    difficulty: 'hard',
    priority: 'P1',
    seniority: ['Senior', 'SDE-2', 'SDE-3', 'MTS'],
    topics: ['use()', 'Suspense', 'Error Boundaries', 'promise caching', 'request waterfalls', 'Transitions'],
    estimatedMinutes: 25,
    conceptIds: ['react-19-apis', 'promises', 'async-ui-states', 'race-conditions', 'react-server-components', 'streaming-ssr'],
    research: {
      provenance: 'DOCUMENTED_TECHNICAL_EXERCISE',
      frequencyConfidence: 'LOW_CONFIDENCE',
      verificationStatus: 'SOURCES_VERIFIED',
      lastVerified: VERIFIED,
      evidence: [
        { sourceId: 'react-use', url: 'https://react.dev/reference/react/use', originalTitle: 'use', note: '"Promises passed to use must be cached", "Why are Promises recreated on every render?", caching, re-fetching, preloading on hover, uncached-promise warning.' },
        { sourceId: 'react-suspense', url: 'https://react.dev/reference/react/Suspense', originalTitle: '<Suspense>', note: 'What activates a boundary, no state preserved before first mount, 300 ms reveal throttle, Transitions keep revealed content.' },
        { sourceId: 'react-usetransition', url: 'https://react.dev/reference/react/useTransition', originalTitle: 'useTransition', note: 'Transitions keep already revealed content visible while the next render suspends.' },
      ],
      researchNotes: NO_FREQUENCY_EVIDENCE,
    },
    scenario: `A profile page shows a header (user) and a list of posts. A teammate rewrote it with React 19's \`use\`:

~~~tsx
function ProfilePage({ userId }) {
  const user = use(fetch('/api/users/' + userId).then((r) => r.json()));
  return (
    <>
      <Header user={user} />
      <Suspense fallback={<PostsSkeleton />}>
        <Posts userId={userId} />
      </Suspense>
    </>
  );
}

function Posts({ userId }) {
  const posts = use(fetch('/api/users/' + userId + '/posts').then((r) => r.json()));
  return <PostList posts={posts} />;
}
~~~

In the browser the page flickers between skeletons and never settles, and when it did work in a prototype the posts always appeared one full round-trip after the header. Explain what is wrong, where the promises should be created and cached, how you would get parallel loading, and how errors and refreshes should work.`,
    constraints: [
      'Client-rendered React 19.3 app without a Suspense-enabled data framework (you may describe what a framework or Server Components would change).',
      'The header and posts are independent requests.',
      'A failed request must show a retryable error, and "Refresh" must not blank the page.',
    ],
    answerOutline: [
      'use(promise) suspends until the promise settles; the nearest Suspense shows its fallback and a rejection goes to the nearest Error Boundary.',
      'Creating the promise in render is a bug: React keeps no state for a render that suspended before mounting and retries from scratch, so a new promise is created on every attempt (the docs warn "A component was suspended by an uncached promise").',
      'Promises must be cached so the same instance is reused — a module/route cache keyed by URL, a Suspense-enabled framework, or a promise passed from a Server Component; adding `.then()` to a cached promise creates a new uncached one.',
      'Ideally create promises before rendering (event handler, route loader, Server Component) and pass them down.',
      'Waterfall: a child that only starts its fetch after the parent resolves serialises requests; start both requests up front and pass the promises down.',
      'Place Suspense boundaries by design (what reveals together); React throttles reveals (at most once every 300 ms) and boundaries ready inside that window reveal together.',
      'use cannot be wrapped in try/catch; put an Error Boundary around the suspending subtree and reset it when retrying (rejected promises stay cached until invalidated).',
      'Refresh/navigation: put the new promise in state inside startTransition so already revealed content stays visible instead of falling back.',
    ],
    modelAnswer: `**Why it never settles.** \`use(promise)\` suspends the component until the promise settles. Here the promise is created *during render*. A render that suspends before the component has mounted keeps no state, and React retries it from scratch — which calls \`fetch\` again, producing a brand-new pending promise, which suspends again. The docs call this out directly ("Promises passed to use must be cached") and React warns "A component was suspended by an uncached promise". Note that even \`cachedPromise.then(r => r.json())\` is uncached, because \`.then\` returns a new promise every time.

**Where promises should live.** In descending order of preference: created by a Server Component and passed as a prop (the client calls \`use\` on it, and the resolved value must be serializable); created by a router loader or event handler *before* rendering; or read from a cache keyed by the resource. Frameworks and Suspense-enabled data libraries own that cache for you; a module-level \`Map\` is the minimal hand-written version.

**Why it was a waterfall.** \`Posts\` only starts fetching when it renders, and it cannot render until \`ProfilePage\` has stopped suspending on the user. Total time ≈ user latency + posts latency. Start both requests before anything suspends and hand the promises down:

~~~tsx
// data.ts – minimal cache; a framework/data library normally owns this
const cache = new Map<string, Promise<unknown>>();
export function fetchJSON<T>(url: string): Promise<T> {
  if (!cache.has(url)) {
    cache.set(url, fetch(url).then((r) => {
      if (!r.ok) throw new Error(r.status + ' ' + url);
      return r.json();
    }));
  }
  return cache.get(url) as Promise<T>;
}
export function invalidate(url: string) { cache.delete(url); }

// ProfilePage.tsx
function ProfilePage({ userId }: { userId: string }) {
  const userPromise = fetchJSON<User>('/api/users/' + userId);          // both start now →
  const postsPromise = fetchJSON<Post[]>('/api/users/' + userId + '/posts'); // parallel
  return (
    <ErrorBoundary fallbackRender={({ resetErrorBoundary }) => <Retry onRetry={resetErrorBoundary} />}>
      <Suspense fallback={<HeaderSkeleton />}>
        <Header userPromise={userPromise} />
      </Suspense>
      <Suspense fallback={<PostsSkeleton />}>
        <Posts postsPromise={postsPromise} />
      </Suspense>
    </ErrorBoundary>
  );
}
function Posts({ postsPromise }: { postsPromise: Promise<Post[]> }) {
  const posts = use(postsPromise);
  return <PostList posts={posts} />;
}
~~~

**Boundary design.** Separate boundaries let the header and posts reveal independently; one boundary makes them appear together. React reveals suspended content at most once every 300 ms, so boundaries that become ready close together reveal as a group rather than popping in one by one.

**Errors.** \`use\` cannot be called inside \`try/catch\`; a rejected promise propagates to the nearest Error Boundary. Because the rejected promise stays in the cache, "Retry" must invalidate the entry, create a new promise, and reset the boundary (for example with react-error-boundary's \`resetKeys\` tied to the promise).

**Refresh without blanking.** Store the promise in state and replace it inside \`startTransition\`: while the new promise is pending, React keeps showing the already revealed content (use \`isPending\` to dim it) instead of switching back to the fallback. Hovering a link can call \`fetchJSON\` early so the promise may already be resolved when \`use\` reads it.`,
    pitfalls: [
      'Calling fetch or an async function directly inside use(...) in render — a new promise every attempt.',
      'Chaining .then() on a cached promise inside render, which silently creates an uncached promise.',
      'Starting a child fetch only after the parent suspends and resolves (render-time waterfall).',
      'Wrapping use() in try/catch instead of using an Error Boundary.',
      'Retrying without invalidating the rejected promise in the cache, so the boundary immediately shows the error again.',
    ],
    versionNotes:
      'Checked against React 19.3 docs on 2026-11-23. The use reference now documents a client-side promise cache, re-fetching with startTransition, preloading on hover and the "suspended by an uncached promise" warning; 19.3 also adds use(browser()) for browser-only components and a warning when use is used incorrectly in a conditional. The 300 ms reveal throttle is stated in the <Suspense> caveats.',
    docSourceIds: ['react-use', 'react-suspense', 'react-usetransition', 'react-server-components', 'react-lazy'],
    mcqs: [
      {
        id: 'm1',
        question: 'A Client Component calls `use(fetch(url).then(r => r.json()))` inside a `<Suspense>`. What do you observe?',
        options: [
          { id: 'a', text: 'It works: React deduplicates identical fetch calls automatically in the browser', explanation: 'The browser has no automatic render-time dedupe; each render creates a new promise.' },
          { id: 'b', text: 'The fallback keeps showing (or re-appears on every re-render) because a new promise is created each time React retries', explanation: 'Correct — renders that suspend before mounting keep no state, so the retry creates another pending promise.' },
          { id: 'c', text: 'React throws a hydration error', explanation: 'This is not a hydration problem; it happens in purely client-rendered trees too.' },
          { id: 'd', text: 'The data loads once and is cached by use() itself', explanation: 'use does not cache promises; it requires you to pass a cached one.' },
        ],
        correctOptionId: 'b',
        explanation: 'Promises passed to use must be cached so the same instance is reused across renders; uncached promises make React show the fallback repeatedly and log an "uncached promise" warning.',
        sourceIds: ['react-use', 'react-suspense'],
      },
      {
        id: 'm2',
        question: 'Parent suspends on `user` (400 ms). Only after it renders does its child create and `use` the `posts` promise (300 ms). Both are cached. Roughly when do posts appear on first load?',
        options: [
          { id: 'a', text: '~300 ms', explanation: 'That would require the posts request to start immediately, which it does not.' },
          { id: 'b', text: '~400 ms', explanation: 'That is the parallel case, where both requests start up front.' },
          { id: 'c', text: '~700 ms', explanation: 'Correct — the posts request cannot start until the parent stops suspending: a render-time waterfall.' },
          { id: 'd', text: 'Never, because nested use() calls deadlock', explanation: 'Nested suspension is fine; it is just sequential.' },
        ],
        correctOptionId: 'c',
        explanation: 'Fetching lazily in render delays requests and creates waterfalls. Create both promises before rendering (or at the top of the route) and pass them down to load in parallel.',
        sourceIds: ['react-use'],
      },
      {
        id: 'm3',
        question: 'How should a component display an error when the promise it passes to `use` rejects?',
        options: [
          { id: 'a', text: 'Wrap use(promise) in try/catch and render an error message in the catch block', explanation: 'use cannot be called inside try/catch.' },
          { id: 'b', text: 'Wrap the component in an Error Boundary; the rejection propagates to the nearest one', explanation: 'Correct — or resolve the promise to a value that encodes the error (e.g. with .catch where the promise is created).' },
          { id: 'c', text: 'Check promise.status === "rejected" before calling use', explanation: 'The docs say never to bypass use by reading promise status/value directly.' },
          { id: 'd', text: 'Suspense fallbacks also render for rejected promises', explanation: 'Suspense handles pending; errors go to Error Boundaries.' },
        ],
        correctOptionId: 'b',
        explanation: 'A rejected promise read with use is thrown to the nearest Error Boundary. use cannot be wrapped in try/catch.',
        sourceIds: ['react-use'],
      },
    ],
    followUps: [
      { id: 'f1', level: 'mechanism', question: 'Explain exactly why a promise created in render is recreated, referring to what React keeps (and does not keep) for a render that suspended before mounting.', expectedConcepts: ['no state preserved before first mount', 'retry from scratch', 'new promise identity', 'uncached promise warning'], sourceIds: ['react-suspense', 'react-use'] },
      { id: 'f2', level: 'application', question: 'Implement "Refresh" so the current posts stay visible (dimmed) while new ones load. Which APIs and why?', expectedConcepts: ['invalidate cache entry', 'store promise in state', 'startTransition', 'isPending to dim', 'Suspense does not re-show fallback for Transitions'], sourceIds: ['react-use', 'react-usetransition', 'react-suspense'] },
      { id: 'f3', level: 'edge-cases', question: 'Your cache stores a rejected promise. What happens on Retry, and how do you design invalidation and boundary reset?', expectedConcepts: ['rejected promise stays cached', 'delete then refetch', 'reset Error Boundary (resetKeys)', 'avoid infinite retry loops'], sourceIds: ['react-use'] },
      { id: 'f4', level: 'production', question: 'Where would you put the promise cache in a real app, and what are its memory and staleness risks?', expectedConcepts: ['framework/data library cache', 'keying by resource', 'eviction/TTL', 'per-user data', 'preloading on hover'], sourceIds: ['react-use', 'react-suspense'] },
      { id: 'f5', level: 'architecture', question: 'How does this change with Server Components and streaming SSR — who creates the promise and what must be true of its value?', expectedConcepts: ['Server Component creates promise without awaiting', 'pass promise as prop to Client Component', 'resolved value serializable', 'Suspense boundaries stream'], sourceIds: ['react-use', 'react-server-components'] },
    ],
  },

  // ---------------------------------------------------------------------------------------------
  // 3. Re-render diagnosis
  // ---------------------------------------------------------------------------------------------
  {
    schemaVersion: 1,
    kind: 'design',
    execution: 'quiz',
    track: 'architecture',
    id: 'arch-react-rerender-diagnosis',
    slug: 'react-rerender-diagnosis',
    title: 'Diagnose a dashboard that lags while typing',
    difficulty: 'medium',
    priority: 'P0',
    seniority: ['Senior', 'SDE-2', 'SDE-3', 'MTS'],
    topics: ['React Profiler', 'state colocation', 'memo / useMemo / useCallback', 'useDeferredValue', 'useTransition', 'virtualization', 'INP'],
    estimatedMinutes: 25,
    conceptIds: ['react-performance', 'referential-equality', 'derived-state', 'core-web-vitals', 'react-context'],
    research: {
      provenance: 'DOCUMENTED_TECHNICAL_EXERCISE',
      frequencyConfidence: 'LOW_CONFIDENCE',
      verificationStatus: 'SOURCES_VERIFIED',
      lastVerified: VERIFIED,
      evidence: [
        { sourceId: 'react-profiler', url: 'https://react.dev/reference/react/Profiler', originalTitle: '<Profiler>', note: 'onRender(id, phase, actualDuration, baseDuration, startTime, commitTime); disabled in production builds by default.' },
        { sourceId: 'react-usedeferredvalue', url: 'https://react.dev/reference/react/useDeferredValue', originalTitle: 'useDeferredValue', note: '"Deferring re-rendering for a part of the UI" — requires the slow child to be memoized; no fixed delay; interruptible.' },
        { sourceId: 'react-memo', url: 'https://react.dev/reference/react/memo', originalTitle: 'memo', note: 'Object.is prop comparison; "Do I still need React.memo if I use React Compiler?".' },
        { sourceId: 'webdev-virtualize', url: 'https://web.dev/articles/virtualize-long-lists-react-window', originalTitle: 'Virtualize large lists with react-window' },
        { sourceId: 'webdev-inp', url: 'https://web.dev/articles/optimize-inp', originalTitle: 'Optimize Interaction to Next Paint' },
      ],
      researchNotes: `${NO_FREQUENCY_EVIDENCE} The React Performance tracks page (react.dev/reference/dev-tools/react-performance-tracks) was also read to confirm the Scheduler/Components tracks and the react-dom/profiling build.`,
    },
    scenario: `An analytics dashboard renders KPI cards, three charts and an orders table with ~5,000 rows. All state lives in \`<Dashboard>\`, including the \`filter\` string bound to a search box above the table. Users report that typing in the filter "stutters" — characters appear in bursts — and field data shows poor INP on this page.

~~~tsx
function Dashboard() {
  const [filter, setFilter] = useState('');
  const [range, setRange] = useState(last30Days());
  const data = useDashboardData(range);
  const options = { currency: 'USD', compact: true };          // new object every render
  return (
    <>
      <Kpis data={data} options={options} />
      <Charts data={data} onSelect={(id) => openOrder(id)} />
      <input value={filter} onChange={(e) => setFilter(e.target.value)} />
      <OrdersTable rows={data.orders.filter((o) => matches(o, filter))} />
    </>
  );
}
~~~

How do you **prove** where the time goes, and what would you change, in what order? When does React Compiler make the manual fixes unnecessary?`,
    constraints: [
      'React 19.3; React Compiler is not enabled yet (discuss what changes if it is).',
      'The input must stay a controlled input.',
      'Measure before and after every change; no speculative memoization.',
    ],
    answerOutline: [
      'Reproduce and measure first: React DevTools Profiler (which components rendered and why), the <Profiler> onRender callback (actualDuration vs baseDuration) and the browser Performance panel/React Performance tracks; remember profiling is off in production builds unless you use the profiling build.',
      'Connect it to INP: a keystroke handler that triggers a long render increases processing duration and presentation delay.',
      'Root cause: the filter state lives at the top, so every keystroke re-renders KPIs, charts and 5,000 rows; inline objects/functions defeat memo.',
      'Colocate state: move filter + input + table into their own component so KPIs and charts are not in the update at all.',
      'Make the table cheap: derive filtered rows with useMemo keyed on (rows, filter), memo the table/rows, keep stable props (hoist constants, useCallback where it feeds a memoized child).',
      'Keep typing urgent: useDeferredValue(filter) for the table (with a memoized child) or startTransition around a separate non-input state; text input state itself cannot be a Transition.',
      'Virtualize the 5,000-row table so only visible rows are in the DOM — reduces render and presentation cost.',
      'React Compiler automatically memoizes components and values (equivalent of memo/useMemo/useCallback) for code that follows the Rules of React — but it does not colocate state, virtualize, or defer work.',
      'Verify with the same profile and with field INP after release.',
    ],
    modelAnswer: `**1. Measure, do not guess.** Record the interaction in the React DevTools Profiler with "why did this render" enabled; you will see the whole \`Dashboard\` subtree committing on every keystroke. Wrap suspect regions in \`<Profiler id="orders" onRender={...}>\` to log \`actualDuration\` against \`baseDuration\`: if \`actualDuration\` stays close to \`baseDuration\` on updates, memoization is not working. The browser Performance panel (with React Performance tracks in development or the \`react-dom/profiling\` build) shows the long task per keystroke. Profiling is disabled in normal production builds, so use a profiling build for realistic numbers. Tie it to INP: the keystroke's processing duration and presentation delay are dominated by this render.

**2. Remove work from the update (biggest win, no memo needed).** \`filter\` is only used by the table, so move it down:

~~~tsx
function Dashboard() {
  const [range, setRange] = useState(last30Days);
  const data = useDashboardData(range);
  return (
    <>
      <Kpis data={data} options={KPI_OPTIONS} />   {/* hoisted constant */}
      <Charts data={data} onSelect={openOrder} />  {/* stable module function */}
      <FilterableOrders orders={data.orders} />
    </>
  );
}

function FilterableOrders({ orders }: { orders: Order[] }) {
  const [filter, setFilter] = useState('');
  const deferredFilter = useDeferredValue(filter);
  const isStale = filter !== deferredFilter;
  return (
    <>
      <input value={filter} onChange={(e) => setFilter(e.target.value)} />
      <div style={{ opacity: isStale ? 0.6 : 1 }}>
        <OrdersTable orders={orders} filter={deferredFilter} />
      </div>
    </>
  );
}

const OrdersTable = memo(function OrdersTable({ orders, filter }: TableProps) {
  const rows = useMemo(() => orders.filter((o) => matches(o, filter)), [orders, filter]);
  return <VirtualRows rows={rows} rowHeight={36} />; // windowed: only visible rows mount
});
~~~

Typing now re-renders only \`FilterableOrders\`; KPIs and charts are no longer part of the update.

**3. Keep the keystroke urgent.** The input must stay controlled, and Transition updates cannot control a text input. \`useDeferredValue\` solves this: React first re-renders with the old \`deferredFilter\` (the memoized table skips because its props are unchanged), paints the character, then renders the table with the new value in the background. That background render is interruptible and has no fixed delay — unlike debouncing — so fast devices update almost immediately. Without \`memo\` (or the compiler) on the table, the urgent render would still re-render it and the optimisation is lost. \`useTransition\` is the right tool when you own a *separate* state update (for example, applying a filter preset from a button).

**4. Shrink the DOM.** 5,000 table rows make both rendering and the browser's style/layout/paint expensive. Windowing (react-window or similar) keeps only visible rows mounted; this helps presentation delay, which memoization cannot.

**5. Fix referential instability where it matters.** The inline \`options\` object and \`onSelect\` arrow are new every render, so \`memo\` on \`Kpis\`/\`Charts\` would never hit. Hoist constants; use \`useCallback\`/\`useMemo\` only where the value feeds a memoized child or an Effect dependency.

**Where React Compiler fits.** The compiler automatically applies the equivalent of \`memo\`, \`useMemo\` and \`useCallback\` to components and hooks that follow the Rules of React, including cases manual memoization gets wrong (an inline arrow wrapping a memoized callback). With it enabled, steps 5 and most of step 2's \`memo\`/\`useMemo\` become unnecessary. It does **not** move state to the right component, virtualize lists, or decide what is urgent vs deferred — those remain design decisions. Finally, re-record the same profile and watch field INP after release.`,
    pitfalls: [
      'Wrapping setFilter for the controlled input in startTransition — Transition updates cannot control text inputs.',
      'Using useDeferredValue without memoizing the slow child (or the compiler), so the urgent render still re-renders it.',
      'Sprinkling useMemo/useCallback everywhere before colocating state; the update is still too wide.',
      'Profiling a development build and trusting absolute numbers, or expecting <Profiler> to report in a normal production build.',
      'Debouncing the input value as the "fix": it delays feedback and still produces a long, non-interruptible render when it fires.',
    ],
    versionNotes:
      'Checked against React 19.3 docs on 2026-11-23. useDeferredValue(value, initialValue?) has no fixed delay and is interruptible; React 19.3 fixed a bug where useDeferredValue could get stuck on an old value and now renders independent Transitions separately instead of entangling them. React Performance tracks need a development or profiling build (react-dom/profiling).',
    docSourceIds: ['react-profiler', 'react-usedeferredvalue', 'react-usetransition', 'react-memo', 'react-compiler', 'webdev-virtualize', 'webdev-inp'],
    mcqs: [
      {
        id: 'm1',
        question: 'To keep typing smooth, a teammate writes `onChange={e => startTransition(() => setFilter(e.target.value))}` for the controlled input. What is the problem?',
        options: [
          { id: 'a', text: 'Nothing — Transitions are the recommended way to update controlled inputs', explanation: 'The useTransition docs explicitly say Transition updates cannot be used to control text inputs.' },
          { id: 'b', text: 'Transition updates cannot control text inputs; keep the input update urgent and defer the expensive part (e.g. useDeferredValue)', explanation: 'Correct — the input value must update synchronously; defer the list that reads it instead.' },
          { id: 'c', text: 'startTransition only works inside useEffect', explanation: 'startTransition is meant for event handlers and Actions.' },
          { id: 'd', text: 'Transitions require a Suspense boundary', explanation: 'Transitions work without Suspense; they integrate with it when something suspends.' },
        ],
        correctOptionId: 'b',
        explanation: 'Use urgent state for the input and either useDeferredValue on the value passed to the slow subtree, or a separate state set inside a Transition.',
        sourceIds: ['react-usetransition', 'react-usedeferredvalue'],
      },
      {
        id: 'm2',
        question: 'A `<Profiler>` around the table logs `actualDuration ≈ baseDuration` on every keystroke. What does that tell you?',
        options: [
          { id: 'a', text: 'Memoization is working well', explanation: 'Working memoization makes actualDuration drop well below baseDuration on updates.' },
          { id: 'b', text: 'The subtree is re-rendering almost entirely on each update — memoization is not skipping work', explanation: 'Correct — baseDuration estimates re-rendering the whole subtree without optimizations.' },
          { id: 'c', text: 'The browser is slow to paint, so React is not the problem', explanation: 'Both values measure React rendering time, not paint.' },
          { id: 'd', text: 'The Profiler is broken in development builds', explanation: 'Profiler works in development; it is production builds where it is disabled by default.' },
        ],
        correctOptionId: 'b',
        explanation: 'baseDuration estimates the worst-case cost without memoization; compare actualDuration to it to see whether memoization is effective.',
        sourceIds: ['react-profiler'],
      },
      {
        id: 'm3',
        question: 'You add `const deferred = useDeferredValue(filter)` and pass `deferred` to `<OrdersTable>`, but typing is still janky. Without React Compiler, what is the most likely missing piece?',
        options: [
          { id: 'a', text: 'useDeferredValue needs an explicit delay argument such as 300 ms', explanation: 'There is no delay argument; the optional second parameter is initialValue.' },
          { id: 'b', text: 'OrdersTable is not wrapped in memo, so the urgent render with the old value still re-renders it', explanation: 'Correct — the docs state this optimization requires the slow component to be memoized.' },
          { id: 'c', text: 'useDeferredValue only works with Server Components', explanation: 'It is a client-side Hook.' },
          { id: 'd', text: 'The input must be uncontrolled', explanation: 'useDeferredValue is designed for controlled inputs feeding slow UI.' },
        ],
        correctOptionId: 'b',
        explanation: 'During the urgent re-render the deferred value is still old; only a memoized child can skip that render. React Compiler applies the equivalent of memo automatically.',
        sourceIds: ['react-usedeferredvalue', 'react-memo'],
      },
    ],
    followUps: [
      { id: 'f1', level: 'mechanism', question: 'Explain the two renders useDeferredValue causes and why the background one is interruptible. How is that different from debouncing?', expectedConcepts: ['urgent render with old value', 'background render with new value', 'interrupted by new keystrokes', 'no fixed delay', 'debounce still blocks when it fires'], sourceIds: ['react-usedeferredvalue'] },
      { id: 'f2', level: 'application', question: 'The table also has per-row action buttons with inline onClick handlers. How do you keep rows memoized without the compiler?', expectedConcepts: ['memo row component', 'pass id + stable callback', 'useCallback with correct deps', 'Object.is prop comparison'], sourceIds: ['react-memo'] },
      { id: 'f3', level: 'edge-cases', question: 'Filtering is fast, but each keystroke still takes 150 ms in the Performance panel after React commits. What is left, and how do you fix it?', expectedConcepts: ['style/layout/paint cost', 'large DOM', 'virtualization', 'content-visibility', 'presentation delay'], sourceIds: ['webdev-inp', 'webdev-virtualize'] },
      { id: 'f4', level: 'production', question: 'How would you confirm the fix in the field and stop regressions?', expectedConcepts: ['field INP at p75', 'attribution of slow interactions', 'profiling build in staging', 'performance budget in CI'], sourceIds: ['webdev-inp', 'react-profiler'] },
      { id: 'f5', level: 'architecture', question: 'With React Compiler enabled, which of your fixes are still needed and which become redundant?', expectedConcepts: ['automatic memo/useMemo/useCallback', 'still need colocation', 'still need virtualization', 'still choose urgent vs deferred', 'Rules of React prerequisite'], sourceIds: ['react-compiler', 'react-memo'] },
    ],
  },

  // ---------------------------------------------------------------------------------------------
  // 4. React Compiler adoption
  // ---------------------------------------------------------------------------------------------
  {
    schemaVersion: 1,
    kind: 'design',
    execution: 'quiz',
    track: 'architecture',
    id: 'arch-react-compiler-adoption',
    slug: 'react-compiler-adoption',
    title: 'Roll out React Compiler in an existing codebase',
    difficulty: 'medium',
    priority: 'P1',
    seniority: ['Senior', 'SDE-2', 'SDE-3', 'MTS'],
    topics: ['React Compiler', 'Rules of React', 'automatic memoization', 'incremental adoption', 'eslint-plugin-react-hooks', 'gating'],
    estimatedMinutes: 20,
    conceptIds: ['react-performance', 'referential-equality', 'immutable-updates', 'react-effects'],
    research: {
      provenance: 'DOCUMENTED_TECHNICAL_EXERCISE',
      frequencyConfidence: 'LOW_CONFIDENCE',
      verificationStatus: 'SOURCES_VERIFIED',
      lastVerified: VERIFIED,
      evidence: [
        { sourceId: 'react-compiler', url: 'https://react.dev/learn/react-compiler', originalTitle: 'React Compiler', note: 'Section index for Introduction, Installation, Incremental Adoption, Debugging and Troubleshooting, Configuration and Directives.' },
        { sourceId: 'react-memo', url: 'https://react.dev/reference/react/memo', originalTitle: 'memo', note: '"Do I still need React.memo if I use React Compiler?"' },
      ],
      researchNotes: `${NO_FREQUENCY_EVIDENCE} Beyond the registered index page, these react.dev sub-pages were read: learn/react-compiler/introduction, /installation, /incremental-adoption, /debugging, reference/react-compiler/compilationMode, /target, /directives, reference/rules, and the "React Compiler v1.0" blog post (2025-10-07). They are not separate registry entries, so they are cited through the react-compiler source.`,
    },
    scenario: `Your org has a 400-component React 19.3 app built with Vite. It has years of hand-written \`useMemo\`/\`useCallback\`/\`memo\`, some legacy code that mutates objects, and a few effects that "only work" because a dependency is memoized. Leadership wants React Compiler turned on "because it makes everything faster".

Explain what the compiler actually does and assumes, how you would roll it out safely and incrementally, how you would verify it helped, and what you would do with the existing manual memoization.`,
    constraints: [
      'React 19.3 + Vite with @vitejs/plugin-react; one package still supports React 18 consumers.',
      'No big-bang rewrite; production stability matters more than speed of rollout.',
      'You must be able to show measured impact to leadership.',
    ],
    answerOutline: [
      'What it is: a stable (1.0+) build-time tool, primarily a Babel plugin (babel-plugin-react-compiler), that automatically memoizes components and hooks — the equivalent of memo/useMemo/useCallback, including after early returns.',
      'What it assumes: the Rules of React — pure, idempotent components; props/state/hook arguments/JSX values treated as immutable; hooks called at top level; components not called as functions. It skips code it detects as unsafe.',
      'Lint first: eslint-plugin-react-hooks (recommended / recommended-latest presets) surfaces compiler-detected violations; a reported component is simply not optimized — fix at your own pace.',
      'Incremental rollout: directory-scoped Babel overrides, compilationMode: "annotation" with "use memo" opt-ins, and/or runtime gating with a feature-flag function for A/B tests; "use no memo" as a temporary, documented escape hatch.',
      'Config details: compiler must run first in the Babel pipeline; target defaults to "19"; React 17/18 targets need react-compiler-runtime as a runtime dependency.',
      'Main runtime risk: code relying on memoization for correctness (effects keyed on referential equality) can over/under-fire when memoization changes.',
      'Existing manual memoization: keep it or remove only with careful testing (removing it can change compilation output); useMemo/useCallback remain escape hatches, e.g. for effect dependencies.',
      'Verify: "Memo ✨" badge in React DevTools, compiled output imports react/compiler-runtime, Profiler/interaction timings and field INP compared via gating A/B; pin the compiler version if test coverage is weak.',
    ],
    modelAnswer: `**What it does.** React Compiler is a build-time optimizer — currently mainly the \`babel-plugin-react-compiler\` Babel plugin — that analyses data flow and mutability in components and hooks and inserts fine-grained memoization. It is the automatic equivalent of \`memo\` + \`useMemo\` + \`useCallback\` across the tree, and it can memoize in places manual hooks cannot (after an early return, or an inline arrow that wraps a memoized callback). It mainly improves **update** performance: skipping cascading re-renders and repeated expensive calculations. It is not a bundle-size, network or LCP optimisation, and it only memoizes components and hooks — not arbitrary helpers, and not across components.

**What it assumes.** The Rules of React: components and hooks are pure and idempotent; props, state, hook arguments/returns and values passed to JSX are treated as immutable; side effects run outside render; hooks are called unconditionally at the top level; component functions are only used through JSX. When the compiler detects a likely violation it skips that function rather than risking a behaviour change; bugs appear when a violation is *not* statically detectable.

**Rollout plan.**
1. **Lint first.** Upgrade \`eslint-plugin-react-hooks\` and enable the recommended preset; its compiler-powered rules (purity, refs, set-state-in-render, immutability…) list what would be skipped. This needs no compiler install and often finds real bugs.
2. **Install and scope.** Add the plugin (it must run first in the Babel pipeline). On Vite, recent @vitejs/plugin-react exposes \`reactCompilerPreset\`; older versions use the inline \`babel.plugins\` option. Start narrow, using any combination of: Babel \`overrides\` per directory; \`compilationMode: 'annotation'\` so only functions with \`"use memo"\` compile; or \`gating\`, which wraps compiled output in a runtime feature-flag check.

~~~js
// babel.config.js – directory rollout with a runtime kill switch
module.exports = {
  overrides: [
    {
      test: './src/features/checkout/**/*.{js,jsx,ts,tsx}',
      plugins: [
        ['babel-plugin-react-compiler', {
          gating: { source: './compilerFlags', importSpecifierName: 'isCompilerEnabled' },
        }],
      ],
    },
  ],
};
~~~

3. **Shared package on React 18.** Set \`target: '18'\` and add \`react-compiler-runtime\` as a real dependency (not a devDependency); React 19 needs no extra runtime.
4. **Expand** directory by directory; use \`"use no memo"\` only as a temporary, commented escape hatch with a tracking issue.

**Main risk: memoization-for-correctness.** Effects that depend on an object staying referentially equal, or reference-equality caches, may over- or under-fire when memoization changes. Debug by adding \`"use no memo"\` to the component: if the bug disappears, look for a Rules of React violation; if it persists with *all* memoization removed, the component was already broken.

**Existing \`useMemo\`/\`useCallback\`/\`memo\`.** For existing code, the docs recommend leaving it in place or removing it only with careful testing, because removal can change compiled output. In new code, rely on the compiler and keep \`useMemo\`/\`useCallback\` as an escape hatch, e.g. for a value used as an Effect dependency.

**Verify the gain.** Confirm compilation with the "Memo ✨" badge in React DevTools or \`react/compiler-runtime\` imports in the build output. Measure with the same interaction profiles (Profiler \`actualDuration\`, Performance panel) and, using \`gating\`, A/B field INP between cohorts. If end-to-end coverage is weak, pin the compiler to an exact version and upgrade deliberately, since future versions may memoize differently.`,
    pitfalls: [
      'Selling the compiler as a fix for load performance (LCP, bundle size) — it targets re-render/update cost.',
      'Enabling it everywhere at once on a codebase with known Rules of React violations and no end-to-end tests.',
      'Bulk-deleting existing useMemo/useCallback/memo on day one; removal can change compiled output and effect timing.',
      'Leaving "use no memo" directives undocumented and permanent.',
      'Installing react-compiler-runtime as a devDependency (or forgetting it) when targeting React 17/18.',
    ],
    versionNotes:
      'Checked against React 19.3 docs on 2026-11-23. React Compiler is stable (v1.0 announced 2025-10-07) and documented as "now stable and tested extensively in production"; it is still optional. compilationMode values: infer (default), annotation, syntax, all; target defaults to "19". Vite setup changed in @vitejs/plugin-react 6 (reactCompilerPreset with @rolldown/plugin-babel) — re-check the installation page for your plugin version.',
    docSourceIds: ['react-compiler', 'react-memo', 'react-profiler', 'react-useeffect'],
    mcqs: [
      {
        id: 'm1',
        question: 'Which pattern most directly violates an assumption React Compiler relies on?',
        options: [
          { id: 'a', text: 'Calling a custom Hook after an early return check is moved above it', explanation: 'Calling hooks unconditionally at the top level is exactly what the rules require.' },
          { id: 'b', text: 'Pushing into a props array during render: `props.items.push(extra)`', explanation: 'Correct — props are immutable snapshots; mutating them breaks purity and the compiler’s memoization assumptions.' },
          { id: 'c', text: 'Passing an inline arrow function as an onClick prop', explanation: 'Inline functions are fine; the compiler memoizes them where useful.' },
          { id: 'd', text: 'Reading context with use() inside an if statement', explanation: 'use can be called conditionally; the compiler handles it.' },
        ],
        correctOptionId: 'b',
        explanation: 'The compiler assumes the Rules of React: components are pure and props, state and values passed to hooks/JSX are not mutated.',
        sourceIds: ['react-compiler'],
      },
      {
        id: 'm2',
        question: 'With `compilationMode: \'annotation\'`, which functions are compiled?',
        options: [
          { id: 'a', text: 'Every top-level function in the project', explanation: 'That is the "all" mode, which the docs do not recommend.' },
          { id: 'b', text: 'Only functions that contain the "use memo" directive', explanation: 'Correct — annotation mode is the explicit opt-in mode useful for incremental adoption.' },
          { id: 'c', text: 'PascalCase functions that return JSX or call hooks', explanation: 'That is the default "infer" heuristic.' },
          { id: 'd', text: 'Only components using Flow component syntax', explanation: 'That is the "syntax" mode.' },
        ],
        correctOptionId: 'b',
        explanation: 'compilationMode supports infer (default), annotation, syntax and all; annotation compiles only "use memo" functions, and "use no memo" is always skipped regardless of mode.',
        sourceIds: ['react-compiler'],
      },
      {
        id: 'm3',
        question: 'What does the React team recommend for the existing `useMemo`/`useCallback` calls in code you are compiling?',
        options: [
          { id: 'a', text: 'Delete them all immediately; the compiler errors if they are present', explanation: 'The compiler accepts manual memoization; it is not an error.' },
          { id: 'b', text: 'Leave them in place, or remove them only with careful testing, since removal can change compilation output', explanation: 'Correct — and keep useMemo/useCallback as escape hatches where precise control matters, such as Effect dependencies.' },
          { id: 'c', text: 'Convert them all to "use no memo" directives', explanation: '"use no memo" opts a function out of compilation entirely.' },
          { id: 'd', text: 'Replace them with React.memo', explanation: 'memo is for components; the compiler already applies its equivalent.' },
        ],
        correctOptionId: 'b',
        explanation: 'For new code, rely on the compiler and use useMemo/useCallback where precise control is needed; for existing code, leave memoization or test carefully before removing it.',
        sourceIds: ['react-compiler', 'react-memo'],
      },
    ],
    followUps: [
      { id: 'f1', level: 'mechanism', question: 'What does compiled output look like, and how can you confirm a given component was optimized?', expectedConcepts: ['memo cache from react/compiler-runtime', 'cache slots checked per render', 'Memo ✨ badge in DevTools', 'skipped components lack the badge'], sourceIds: ['react-compiler'] },
      { id: 'f2', level: 'application', question: 'An Effect starts firing on every render only in compiled code. How do you debug it?', expectedConcepts: ['use no memo to isolate', 'memoization-for-correctness', 'referential equality in deps', 'remove all memoization to test', 'fix the Rules violation'], sourceIds: ['react-compiler', 'react-useeffect'] },
      { id: 'f3', level: 'edge-cases', question: 'A shared library must keep supporting React 18 apps. What changes in the compiler setup?', expectedConcepts: ['target "18"', 'react-compiler-runtime as dependency', 'not a devDependency', 'compiling libraries before publishing'], sourceIds: ['react-compiler'] },
      { id: 'f4', level: 'production', question: 'How would you design an A/B test that proves the compiler’s impact to leadership?', expectedConcepts: ['gating option with feature flag', 'cohorts', 'field INP / interaction timings', 'Profiler measurements', 'guardrail metrics and errors'], sourceIds: ['react-compiler', 'react-profiler'] },
      { id: 'f5', level: 'architecture', question: 'How do you keep the codebase compiler-friendly long-term, including compiler upgrades?', expectedConcepts: ['eslint-plugin-react-hooks recommended preset in CI', 'Strict Mode', 'end-to-end tests', 'pin exact compiler version', 'track and remove use no memo'], sourceIds: ['react-compiler'] },
    ],
  },

  // ---------------------------------------------------------------------------------------------
  // 5. Core Web Vitals plan
  // ---------------------------------------------------------------------------------------------
  {
    schemaVersion: 1,
    kind: 'design',
    execution: 'quiz',
    track: 'architecture',
    id: 'arch-core-web-vitals-plan',
    slug: 'core-web-vitals-plan',
    title: 'Fix poor LCP, INP and CLS on a product page',
    difficulty: 'medium',
    priority: 'P0',
    seniority: ['Senior', 'SDE-2', 'SDE-3', 'MTS'],
    topics: ['Core Web Vitals', 'LCP', 'INP', 'CLS', 'field vs lab data', 'CrUX', 'web-vitals library'],
    estimatedMinutes: 30,
    conceptIds: ['core-web-vitals', 'rendering-strategies', 'hydration', 'code-splitting', 'react-performance'],
    research: {
      provenance: 'DOCUMENTED_TECHNICAL_EXERCISE',
      frequencyConfidence: 'LOW_CONFIDENCE',
      verificationStatus: 'SOURCES_VERIFIED',
      lastVerified: VERIFIED,
      evidence: [
        { sourceId: 'webdev-vitals', url: 'https://web.dev/articles/vitals', originalTitle: 'Web Vitals', note: 'Thresholds, 75th percentile segmented by mobile/desktop, field and lab tools, TBT as lab proxy for INP, web-vitals library.' },
        { sourceId: 'webdev-lcp', url: 'https://web.dev/articles/lcp', originalTitle: 'Largest Contentful Paint (LCP)' },
        { sourceId: 'webdev-optimize-lcp', url: 'https://web.dev/articles/optimize-lcp', originalTitle: 'Optimize Largest Contentful Paint', note: 'Four LCP subparts and their target proportions; never lazy-load the LCP image; fetchpriority.' },
        { sourceId: 'webdev-inp-metric', url: 'https://web.dev/articles/inp', originalTitle: 'Interaction to Next Paint (INP)', note: 'Good ≤ 200 ms, poor > 500 ms; clicks, taps and key presses only.' },
        { sourceId: 'webdev-inp', url: 'https://web.dev/articles/optimize-inp', originalTitle: 'Optimize Interaction to Next Paint' },
        { sourceId: 'webdev-cls', url: 'https://web.dev/articles/cls', originalTitle: 'Cumulative Layout Shift (CLS)', note: 'Good ≤ 0.1, poor > 0.25; session windows; 500 ms hadRecentInput exclusion.' },
      ],
      researchNotes: NO_FREQUENCY_EVIDENCE,
    },
    scenario: `A React e-commerce product page (client-rendered shell, hero image carousel, reviews widget, third-party chat, cookie banner) fails Core Web Vitals in **field data** (CrUX/Search Console): LCP, INP and CLS are all in the "poor" or "needs improvement" bucket on mobile, while Lighthouse on a developer laptop looks fine.

You have one quarter. Build a prioritized plan: how you measure each metric (and why lab and field disagree), the thresholds you are aiming for, the likely root causes on a page like this, and the concrete fixes per metric.`,
    constraints: [
      'Mobile traffic is ~70% of visits; numbers must be judged on field data.',
      'Marketing requires the carousel, chat widget and cookie banner to stay.',
      'Changes ship behind flags and must be attributable to a metric movement.',
    ],
    answerOutline: [
      'Targets at the 75th percentile, segmented mobile vs desktop: LCP ≤ 2.5 s, INP ≤ 200 ms (poor > 500 ms), CLS ≤ 0.1 (poor > 0.25); a page passes only if all three meet the target.',
      'Field first (CrUX via PageSpeed Insights/Search Console + your own RUM with the web-vitals library onLCP/onINP/onCLS, with attribution); lab (Lighthouse, DevTools) for debugging — Lighthouse cannot measure INP, use TBT as a proxy.',
      'Explain the lab/field gap: real devices, networks, interactions, TTFB/redirects and bfcache restores.',
      'LCP: break it into TTFB, resource load delay, resource load duration and element render delay; make the hero image discoverable in HTML (SSR/SSG or preload), fetchpriority="high", never loading="lazy" on it, reduce render-blocking CSS/JS, image CDN/compression, caching.',
      'INP: find the slow interactions in RUM; reduce input delay (less JS during load, defer third parties), shorten processing (yield, defer non-visual work, React Transitions), cut presentation delay (smaller DOM, content-visibility, avoid layout thrashing).',
      'CLS: give images/carousel/ads explicit dimensions or aspect-ratio, reserve space for the cookie banner and reviews, prefer overlays or transforms over inserting content above existing content, handle web-font swaps.',
      'Prioritise by impact × confidence: biggest field gap and cheapest fixes first (e.g. hero discovery + dimensions), ship behind flags, compare p75 per cohort over time.',
      'Guardrails: performance budgets in CI (bundle size, TBT, Lighthouse CI) plus RUM alerts.',
    ],
    modelAnswer: `**Targets and pass criteria.** Per web.dev: LCP ≤ 2.5 s, INP ≤ 200 ms (poor above 500 ms), CLS ≤ 0.1 (poor above 0.25), each measured at the **75th percentile of page loads, segmented by mobile and desktop**. A page passes only if all three meet the target, so mobile p75 is the number to move.

**Measurement.** CrUX (surfaced in PageSpeed Insights and Search Console) tells you *whether* you pass; it lacks per-pageview detail, so add RUM with the \`web-vitals\` library and send attribution data:

~~~ts
import { onCLS, onINP, onLCP, type Metric } from 'web-vitals';

function send(metric: Metric) {
  const body = JSON.stringify(metric);
  (navigator.sendBeacon && navigator.sendBeacon('/rum', body)) ||
    fetch('/rum', { body, method: 'POST', keepalive: true });
}
onLCP(send); onINP(send); onCLS(send);
~~~

Lab tools (Lighthouse, DevTools Performance panel) reproduce and debug. Lighthouse cannot measure INP because nothing interacts; use Total Blocking Time as the lab proxy. Field and lab disagree because real users have slower phones and networks, redirects and TTFB, real interaction patterns, and back/forward-cache restores.

**LCP (likely the hero image).** Split field LCP into its four subparts: TTFB, resource load delay, resource load duration and element render delay. On a well-optimized page most time is TTFB plus the resource download, and the two "delay" parts are near zero. A client-rendered carousel usually has a large *load delay* because the image URL only exists after JS runs. Fixes, in order: render the hero \`<img>\` in server HTML (SSR/SSG) or \`<link rel="preload" as="image" fetchpriority="high">\` it; put \`fetchpriority="high"\` on the first slide only and never \`loading="lazy"\` it; trim render-blocking CSS/JS; serve right-sized AVIF/WebP from an image CDN with long cache lifetimes; cache HTML at the edge to cut TTFB. Shrinking the image alone may just move time into render delay — optimise all subparts.

**INP.** RUM attribution shows *which* interactions are slow (often "Add to cart", variant pickers, or taps during load). INP covers the input delay, processing duration and presentation delay of clicks, taps and key presses (not scroll or hover). Reduce input delay by shipping and evaluating less JS during load: code-split below-the-fold widgets and load chat and reviews after the main content, or on interaction. Shorten processing by doing only the visual update in the handler and yielding before analytics or other non-critical work, and in React by marking non-urgent updates as Transitions or deferred values. Cut presentation delay with a smaller DOM (virtualize long review lists), \`content-visibility\` for off-screen sections, and no layout thrashing.

**CLS.** Typical sources here are the carousel and review images without dimensions, the cookie banner pushing content down, late-injected reviews/chat, and web-font swaps. Give media \`width\`/\`height\` or \`aspect-ratio\`; reserve space with skeletons sized like the final content; render the banner as an overlay rather than inserting it above content; animate with \`transform\` rather than \`top\`/\`height\`. Shifts within 500 ms of user input are excluded, and CLS is the worst session window (gaps under 1 s, at most 5 s), not the sum over the whole visit.

**Prioritised plan.** (1) Weeks 1–2: RUM + attribution, baseline dashboards per template and device. (2) Quick wins with high confidence: hero discoverability and fetchpriority, media dimensions, banner as overlay. (3) INP: defer third parties and split widgets, fix the top three slow interactions. (4) Structural: SSR/streaming for the shell, edge caching. Ship each change behind a flag, compare p75 between cohorts, and add budgets (bundle size, TBT/Lighthouse CI) so you don't regress.`,
    pitfalls: [
      'Declaring victory from a single Lighthouse run on a fast laptop instead of mobile field p75.',
      'Trying to measure INP in Lighthouse; it cannot — use TBT as a lab proxy and RUM for the real metric.',
      'Lazy-loading the hero/LCP image, or setting fetchpriority="high" on many images.',
      'Compressing the LCP image and expecting LCP to drop when the bottleneck is resource load delay or render delay.',
      'Inserting a cookie banner or late content above existing content without reserved space.',
    ],
    versionNotes:
      'Checked against web.dev Web Vitals, LCP, Optimize LCP, INP, Optimize INP and CLS articles on 2026-11-23 (INP replaced FID as the responsiveness Core Web Vital). Thresholds: LCP 2.5 s; INP 200 ms good / 500 ms poor; CLS 0.1 good / 0.25 poor; all at p75 split by mobile/desktop. React-specific advice is checked against React 19.3 docs.',
    docSourceIds: ['webdev-vitals', 'webdev-lcp', 'webdev-optimize-lcp', 'webdev-inp-metric', 'webdev-inp', 'webdev-cls', 'mdn-img'],
    mcqs: [
      {
        id: 'm1',
        question: 'Which statement correctly describes how web.dev says to assess Core Web Vitals for a page?',
        options: [
          { id: 'a', text: 'Median (p50) of lab runs; LCP ≤ 4 s, INP ≤ 300 ms, CLS ≤ 0.25', explanation: 'Wrong percentile, wrong data source and wrong "good" thresholds.' },
          { id: 'b', text: '75th percentile of page loads, segmented by mobile and desktop; LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1, all three required to pass', explanation: 'Correct — the 75th percentile across real page loads, split by device class.' },
          { id: 'c', text: '95th percentile across all devices combined; only LCP must pass', explanation: 'A page passes only if all three Core Web Vitals meet their targets at p75.' },
          { id: 'd', text: 'Any single Lighthouse score above 90', explanation: 'Lighthouse is a lab tool and cannot measure INP.' },
        ],
        correctOptionId: 'b',
        explanation: 'web.dev recommends the 75th percentile of page loads segmented across mobile and desktop, and a page passes when all three Core Web Vitals meet their targets.',
        sourceIds: ['webdev-vitals', 'webdev-inp-metric', 'webdev-cls'],
      },
      {
        id: 'm2',
        question: 'Your CI runs Lighthouse. How do you track responsiveness there?',
        options: [
          { id: 'a', text: 'Read INP from the Lighthouse report', explanation: 'Lighthouse loads the page without a user, so there are no interactions to measure INP.' },
          { id: 'b', text: 'Use Total Blocking Time as a lab proxy, and rely on field RUM for INP itself', explanation: 'Correct — web.dev lists TBT as the lab-measurable proxy for INP.' },
          { id: 'c', text: 'Use First Input Delay, which Lighthouse measures', explanation: 'FID is the retired predecessor of INP and is not a lab metric either.' },
          { id: 'd', text: 'Use CLS, since layout shifts cause slow interactions', explanation: 'CLS measures visual stability, not responsiveness.' },
        ],
        correctOptionId: 'b',
        explanation: 'INP needs real user input; in the lab use TBT to catch regressions and confirm with field data.',
        sourceIds: ['webdev-vitals'],
      },
      {
        id: 'm3',
        question: 'Field LCP is 4.1 s. You halve the hero image’s bytes, but LCP barely moves. The breakdown shows most of the time is in *resource load delay*. What is the most likely fix?',
        options: [
          { id: 'a', text: 'Compress the image further', explanation: 'That only shortens resource load duration; the time shifts to another subpart.' },
          { id: 'b', text: 'Make the image discoverable in the initial HTML (server-render the <img> or preload it) with fetchpriority="high"', explanation: 'Correct — load delay is the gap before the browser even starts fetching the LCP resource.' },
          { id: 'c', text: 'Add loading="lazy" to the hero image', explanation: 'web.dev warns never to lazy-load the LCP image; it adds load delay.' },
          { id: 'd', text: 'Reserve space for the image to avoid CLS', explanation: 'Good for CLS, but it does not start the download earlier.' },
        ],
        correctOptionId: 'b',
        explanation: 'LCP = TTFB + resource load delay + resource load duration + element render delay; optimise the subpart that is actually large, and make sure the LCP resource is found by the preload scanner.',
        sourceIds: ['webdev-optimize-lcp'],
      },
    ],
    followUps: [
      { id: 'f1', level: 'mechanism', question: 'Break an interaction’s latency into INP’s three phases and name one fix for each.', expectedConcepts: ['input delay', 'processing duration', 'presentation delay', 'yield to main thread', 'smaller DOM / content-visibility'], sourceIds: ['webdev-inp-metric', 'webdev-inp'] },
      { id: 'f2', level: 'application', question: 'The hero is a CSS background image set by a React carousel after mount. How do you fix its LCP?', expectedConcepts: ['preload scanner cannot see it', 'render <img> in HTML', 'link rel=preload with fetchpriority', 'SSR/SSG'], sourceIds: ['webdev-optimize-lcp'] },
      { id: 'f3', level: 'edge-cases', question: 'CLS is high but nothing moves in your Lighthouse run. What could explain it?', expectedConcepts: ['shifts after load / during scroll', 'session windows', 'real user interactions and ads', 'bfcache reset', 'fonts and late content'], sourceIds: ['webdev-cls'] },
      { id: 'f4', level: 'production', question: 'Design the RUM pipeline: what do you collect, how do you aggregate it, and how do you attribute regressions to releases?', expectedConcepts: ['web-vitals library with attribution', 'sendBeacon', 'p75 per template and device', 'release tags / feature flags', 'alerts'], sourceIds: ['webdev-vitals'] },
      { id: 'f5', level: 'architecture', question: 'Would moving the page to SSR or streaming SSR help each metric? What new risks does it introduce?', expectedConcepts: ['LCP resource in HTML', 'TTFB cost', 'hydration cost and INP during load', 'layout shift when hydrated content differs'], sourceIds: ['webdev-optimize-lcp', 'webdev-inp'] },
    ],
  },

  // ---------------------------------------------------------------------------------------------
  // 6. Code-splitting strategy
  // ---------------------------------------------------------------------------------------------
  {
    schemaVersion: 1,
    kind: 'design',
    execution: 'quiz',
    track: 'architecture',
    id: 'arch-code-splitting-strategy',
    slug: 'code-splitting-strategy',
    title: 'Cut a 1.2 MB JavaScript bundle with code splitting',
    difficulty: 'medium',
    priority: 'P1',
    seniority: ['Senior', 'SDE-2', 'SDE-3', 'MTS'],
    topics: ['code splitting', 'React.lazy', 'dynamic import()', 'Suspense', 'preloading on intent', 'waterfalls', 'bundle analysis'],
    estimatedMinutes: 25,
    conceptIds: ['code-splitting', 'react-performance', 'core-web-vitals', 'nextjs-app-router', 'react-19-apis'],
    research: {
      provenance: 'DOCUMENTED_TECHNICAL_EXERCISE',
      frequencyConfidence: 'LOW_CONFIDENCE',
      verificationStatus: 'SOURCES_VERIFIED',
      lastVerified: VERIFIED,
      evidence: [
        { sourceId: 'react-lazy', url: 'https://react.dev/reference/react/lazy', originalTitle: 'lazy', note: 'Declare lazy outside components; default export; promise and result are cached; state reset pitfall.' },
        { sourceId: 'react-suspense', url: 'https://react.dev/reference/react/Suspense', originalTitle: '<Suspense>', note: 'lazy activates Suspense; Transitions prevent already revealed content from hiding.' },
        { sourceId: 'react-usetransition', url: 'https://react.dev/reference/react/useTransition', originalTitle: 'useTransition' },
        { sourceId: 'next-linking', url: 'https://nextjs.org/docs/app/getting-started/linking-and-navigating', originalTitle: 'Linking and Navigating', note: '<Link> prefetches routes when they enter the viewport or are hovered.' },
      ],
      researchNotes: `${NO_FREQUENCY_EVIDENCE} The Next.js lazy-loading guide (nextjs.org/docs/app/guides/lazy-loading) was also read to confirm that Server Components are code-split automatically and next/dynamic composes React.lazy() with Suspense; it is not a registered source, so it is not cited by id.`,
    },
    scenario: `A React SPA (Vite, React Router, React 19.3) ships **1.2 MB of JavaScript** in a single entry chunk. It contains the marketing home page, a logged-in dashboard with charts, an admin area used by 2% of users, a rich-text editor opened from a modal, and a date library imported everywhere. Mobile users wait several seconds before the page responds to taps.

Design a code-splitting strategy: what you split and at which level, how you avoid making navigation feel slower (loading spinners, waterfalls), how you preload on user intent, and how you measure whether it worked.`,
    constraints: [
      'Client-rendered SPA today; a later Next.js App Router migration is possible (discuss how it changes things).',
      'Navigations between main sections must not flash a blank page.',
      'Clarify whether 1.2 MB is compressed or uncompressed before setting a budget.',
    ],
    answerOutline: [
      'Measure first: bundle analyzer / source-map explorer to see what is in the chunk, DevTools Coverage for unused bytes, and link to field metrics (INP/TBT during load, LCP); clarify compressed vs uncompressed size.',
      'Route-level splitting first: each top-level route (home, dashboard, admin) via dynamic import() / React.lazy, so users download only what their route needs.',
      'Component-level splitting for heavy, conditional UI: editor modal, charts below the fold, admin tools — lazy-load on demand.',
      'React.lazy rules: declare at module top level (never inside a component, or state resets), module must have a default export, wrap in Suspense; load rejections go to an Error Boundary.',
      'Preload on intent: call the same import() on hover/focus/viewport (the module promise is cached by the bundler and lazy caches its result); routers/frameworks do this for links (Next.js <Link> prefetches on viewport/hover).',
      'Avoid waterfalls: start code and data in parallel (route loader or preload both on intent) instead of lazy component → render → fetch; avoid nested lazy chains; place Suspense boundaries deliberately.',
      'Avoid flashing fallbacks on navigation: perform navigations inside startTransition so React keeps the current page visible while the next chunk loads.',
      'Fix shared-weight: replace or tree-shake heavy libraries (date library), split vendor chunks for caching; set budgets in CI and verify with field data.',
    ],
    modelAnswer: `**Measure before cutting.** Run a bundle analyzer on the production build and DevTools Coverage on key pages; ask whether "1.2 MB" is minified-uncompressed or over the wire, because budgets differ. A typical finding: the editor, charting and admin code plus a heavy date library make up most of the bytes, and most of it is unused on first load. Tie the problem to user metrics: long script evaluation during load inflates input delay (INP) and TBT, and blocks client-rendered LCP.

**1. Route-level splits (largest win, lowest risk).** Each top-level section becomes its own chunk:

~~~tsx
import { lazy, Suspense, startTransition } from 'react';

// Declared at module scope: lazy caches the promise and the resolved module.
const loadDashboard = () => import('./routes/Dashboard');
const Dashboard = lazy(loadDashboard);
const Admin = lazy(() => import('./routes/Admin'));

function NavLink({ to, preload, children }: NavLinkProps) {
  const navigate = useNavigate();
  return (
    <a
      href={to}
      onMouseEnter={preload}          // intent: start downloading early
      onFocus={preload}
      onClick={(e) => {
        e.preventDefault();
        startTransition(() => navigate(to)); // keep the current page while the chunk loads
      }}
    >
      {children}
    </a>
  );
}

<NavLink to="/dashboard" preload={loadDashboard}>Dashboard</NavLink>;
<Suspense fallback={<PageSkeleton />}><Routes>{/* … */}</Routes></Suspense>;
~~~

**2. Component-level splits for heavy, conditional UI.** The rich-text editor loads when the modal opens (and is preloaded when the "Edit" button is hovered or focused); below-the-fold charts load near the viewport; admin-only tools never ship to the other 98% of users. Don't split tiny components — every chunk costs a request and a Suspense state.

**\`lazy\` rules that bite.** Declare lazy components at module top level; declaring them inside a component creates a new component type on each render and resets state. The module must default-export the component. A failed chunk load rejects, so wrap lazy areas in an Error Boundary with a retry (deploys that delete old chunks are a classic cause).

**3. Preload on intent.** Calling the same \`import()\` early is enough: the bundler's module loader caches the promise, and \`lazy\` caches its result, so by the time the user clicks, the chunk may already be there. Routers and frameworks do this for links; in Next.js, \`<Link>\` prefetches routes when they enter the viewport or are hovered.

**4. Avoid waterfalls.** The common regression is *code then data*: the lazy route downloads, renders, and only then starts its fetch. Start both together — in a route loader, or by kicking off the data request in the same intent handler that preloads the chunk — and read the data with a cached promise. Avoid nested lazy chains (a lazy page that renders a lazy panel that renders a lazy chart), which serialise downloads.

**5. Don't flash fallbacks.** Without a Transition, navigating to a not-yet-loaded route replaces the visible page with the Suspense fallback. Starting the navigation inside \`startTransition\` lets React keep the old page on screen (show a top progress bar via \`isPending\`) until the new chunk is ready. React also throttles reveals so nested boundaries that resolve close together appear together.

**6. Shared weight.** Replace or tree-shake the date library, check for duplicate dependency versions, and let stable vendor code live in its own long-cached chunk.

**Verify.** Compare entry-chunk size and Coverage before and after, add a bundle-size budget to CI, track TBT in Lighthouse CI, and confirm with field LCP/INP. With the Next.js App Router, Server Components are code-split automatically and their code never ships to the client; lazy loading still applies to Client Components (next/dynamic combines \`lazy\` and Suspense).`,
    pitfalls: [
      'Declaring lazy() inside a component body, which remounts the subtree and resets its state on every render.',
      'Creating a code-then-data waterfall: the lazy route downloads, renders, then starts fetching.',
      'Navigating to a lazy route outside a Transition, so the current page is replaced by a spinner.',
      'Over-splitting into many tiny chunks, adding requests and loading states without saving meaningful bytes.',
      'No Error Boundary around lazy areas, so a failed chunk load after a deploy crashes the app.',
    ],
    versionNotes:
      'Checked against React 19.3 docs (lazy, Suspense, useTransition) and the Next.js App Router docs on 2026-11-23. React 19.3 adds fetchPriority support for module resources in react-dom and renders independent Transitions separately; neither changes the lazy/Suspense patterns above. Next.js <Link> prefetches on viewport/hover; Server Components are automatically code-split.',
    docSourceIds: ['react-lazy', 'react-suspense', 'react-usetransition', 'react-use', 'next-linking', 'webdev-inp', 'webdev-optimize-lcp'],
    mcqs: [
      {
        id: 'm1',
        question: 'A teammate writes this. Users report that the editor loses its content whenever the parent re-renders. Why?',
        code: `function EditorModal({ open }) {
  const Editor = lazy(() => import('./Editor'));
  return open ? <Suspense fallback={<Spinner />}><Editor /></Suspense> : null;
}`,
        options: [
          { id: 'a', text: 'lazy() must be declared outside components; inside, each render creates a new component type, so React remounts it and resets state', explanation: 'Correct — the lazy docs explicitly warn against declaring lazy components inside other components.' },
          { id: 'b', text: 'Suspense always resets state when the fallback shows', explanation: 'The problem is the changing component identity, not Suspense itself.' },
          { id: 'c', text: 'Dynamic import() is re-downloaded on every render', explanation: 'The module loader caches modules; the issue is the new lazy wrapper identity.' },
          { id: 'd', text: 'The Editor module needs a named export', explanation: 'lazy requires a default export; that is not what causes the reset.' },
        ],
        correctOptionId: 'a',
        explanation: 'Declare lazy components at module top level so the component type stays stable across renders.',
        sourceIds: ['react-lazy'],
      },
      {
        id: 'm2',
        question: 'Which approach starts downloading the Dashboard chunk when the user hovers the link, so the click feels instant?',
        options: [
          { id: 'a', text: 'Render <Dashboard /> hidden with display:none on hover', explanation: 'That mounts the whole route invisibly — wasteful and side-effectful.' },
          { id: 'b', text: 'Call the same `() => import("./routes/Dashboard")` function used by lazy() in onMouseEnter/onFocus', explanation: 'Correct — the module promise is cached, and lazy will reuse the loaded module when it renders.' },
          { id: 'c', text: 'Wrap the link in <Suspense>', explanation: 'Suspense shows fallbacks; it does not prefetch anything.' },
          { id: 'd', text: 'Add loading="eager" to the link', explanation: 'loading is an attribute for images/iframes, not code chunks.' },
        ],
        correctOptionId: 'b',
        explanation: 'Preload on intent by invoking the dynamic import early; frameworks such as Next.js do this automatically for <Link> on viewport/hover.',
        sourceIds: ['react-lazy', 'next-linking'],
      },
      {
        id: 'm3',
        question: 'Clicking "Admin" replaces the whole current page with the route-level Suspense fallback while the chunk loads. What is the idiomatic React fix?',
        options: [
          { id: 'a', text: 'Remove the Suspense boundary', explanation: 'Then a suspending lazy component has no boundary to show; the nearest parent boundary (or none) takes over.' },
          { id: 'b', text: 'Perform the navigation state update inside startTransition so React keeps showing the already revealed page', explanation: 'Correct — Suspense does not re-show a fallback for content hidden by a Transition update; use isPending for a progress indicator.' },
          { id: 'c', text: 'Set a 0 ms timeout on the Suspense boundary', explanation: 'Suspense has no timeout prop for this.' },
          { id: 'd', text: 'Call flushSync around the navigation', explanation: 'flushSync forces a synchronous update, which makes the fallback appear immediately.' },
        ],
        correctOptionId: 'b',
        explanation: 'If a Transition causes content to suspend again, React keeps the previous UI on screen instead of falling back.',
        sourceIds: ['react-suspense', 'react-usetransition'],
      },
    ],
    followUps: [
      { id: 'f1', level: 'mechanism', question: 'What exactly does lazy() cache, and when does React call the load function?', expectedConcepts: ['load called on first render attempt', 'promise and resolved value cached', 'default export required', 'rejection thrown to Error Boundary'], sourceIds: ['react-lazy'] },
      { id: 'f2', level: 'application', question: 'The dashboard route needs both its chunk and a /api/summary call. Design loading so neither waits on the other.', expectedConcepts: ['start code and data in parallel', 'route loader or intent handler', 'cached promise read with use', 'avoid code-then-data waterfall'], sourceIds: ['react-use', 'react-lazy'] },
      { id: 'f3', level: 'edge-cases', question: 'After a deploy, some users get "Failed to fetch dynamically imported module". How do you handle it?', expectedConcepts: ['old chunks removed', 'Error Boundary with retry', 'reload to pick up new manifest', 'keep previous assets available for a while'], sourceIds: ['react-lazy'] },
      { id: 'f4', level: 'production', question: 'How do you prove the split helped, and stop the bundle growing back?', expectedConcepts: ['bundle analyzer diff', 'coverage', 'TBT in Lighthouse CI', 'field INP and LCP', 'size budgets in CI'], sourceIds: ['webdev-inp', 'webdev-optimize-lcp'] },
      { id: 'f5', level: 'architecture', question: 'How does a move to the Next.js App Router change your splitting strategy?', expectedConcepts: ['Server Components not shipped to client', 'automatic route splitting', 'next/dynamic for Client Components', 'Link prefetch on viewport/hover', 'loading.js boundaries'], sourceIds: ['next-linking'] },
    ],
  },
];
