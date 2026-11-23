import type { OutputQuestion, Research } from '../schema';

/**
 * Track 5 — output prediction, server-side rendering (React 18.3, development build).
 * Every snippet and explanation is original. Every `expectedOutput` is verified by executing
 * `code` in `questions-ssr.test.ts` (Vitest + jsdom, with react-dom/server and react-dom/client).
 */

const LAST_VERIFIED = '2026-11-23';

type Ev = { sourceId: string; url: string; originalTitle: string; note?: string };

const doc = (sourceId: string, url: string, originalTitle: string): Ev => ({
  sourceId,
  url,
  originalTitle,
  note: 'No BFE.dev quiz found for this topic; behaviour documented by the official docs. Snippet is original.',
});

function research(evidence: Ev[], researchNotes: string): Research {
  return {
    provenance: 'DOCUMENTED_TECHNICAL_EXERCISE',
    frequencyConfidence: 'LOW_CONFIDENCE',
    verificationStatus: 'SOURCES_VERIFIED',
    lastVerified: LAST_VERIFIED,
    evidence,
    researchNotes,
  };
}

const SSR_PROMPT =
  'React 18.3 (development build, no StrictMode). `React`, `renderToString` (from react-dom/server), `hydrateRoot` (from react-dom/client), `act` (from react) and a jsdom `document` are already in scope — there are no imports. React\'s own development warnings go to console.error and are not part of the answer. What does console.log print, in order?';

const D = {
  pipeable: doc('react-render-pipeable', 'https://react.dev/reference/react-dom/server/renderToPipeableStream', 'renderToPipeableStream'),
  hydrate: doc('react-hydrateroot', 'https://react.dev/reference/react-dom/client/hydrateRoot', 'hydrateRoot'),
  suspense: doc('react-suspense', 'https://react.dev/reference/react/Suspense', '<Suspense>'),
  syncEffects: doc('react-sync-effects', 'https://react.dev/learn/synchronizing-with-effects', 'Synchronizing with Effects'),
  useEffect: doc('react-useeffect', 'https://react.dev/reference/react/useEffect', 'useEffect'),
  rendering: doc('webdev-rendering', 'https://web.dev/articles/rendering-on-the-web', 'Rendering on the Web'),
};

const base: Pick<
  OutputQuestion,
  'schemaVersion' | 'kind' | 'execution' | 'track' | 'priority' | 'seniority' | 'environment' | 'prompt'
> = {
  schemaVersion: 1,
  kind: 'output',
  execution: 'output',
  track: 'output',
  priority: 'P1',
  seniority: ['Senior', 'SDE-2', 'SDE-3', 'MTS'],
  environment: 'react-ssr',
  prompt: SSR_PROMPT,
};

export const OUTPUT_QUESTIONS_SSR: OutputQuestion[] = [
  {
    ...base,
    id: 'out-ssr-hooks-during-render-to-string',
    slug: 'ssr-hooks-during-render-to-string',
    title: 'Which hooks run inside renderToString?',
    difficulty: 'medium',
    topics: ['SSR', 'renderToString', 'useState initializer', 'useEffect', 'useMemo'],
    estimatedMinutes: 4,
    conceptIds: ['react-effects', 'hydration'],
    research: research(
      [D.useEffect, D.syncEffects, D.rendering],
      'react.dev states that Effects only run on the client and never during server rendering; the render body and hook initializers are ordinary render-phase code. Verified by execution.',
    ),
    code: `let initCalls = 0;
function Price({ amount }) {
  const [rate] = React.useState(() => {
    initCalls++;
    console.log('init rate');
    return 2;
  });
  const total = React.useMemo(() => amount * rate, [amount, rate]);
  const ref = React.useRef('ref');
  React.useEffect(() => {
    console.log('effect');
    ref.current = 'mutated';
  });
  console.log('render ' + total + ' ' + ref.current);
  return React.createElement('span', null, total);
}
const first = renderToString(React.createElement(Price, { amount: 21 }));
const second = renderToString(React.createElement(Price, { amount: 5 }));
console.log(first);
console.log(second);
console.log('init calls ' + initCalls);`,
    expectedOutput: ['init rate', 'render 42 ref', 'init rate', 'render 10 ref', '<span>42</span>', '<span>10</span>', 'init calls 2'],
    steps: [
      'renderToString runs the component function synchronously, exactly like a client render: the lazy useState initializer runs ("init rate"), useMemo computes 21 * 2, useRef returns its initial object.',
      'The render body logs "render 42 ref" — the ref still holds its initial value because nothing has mutated it.',
      'useEffect is registered but never executed on the server: there is no commit phase and no DOM, so "effect" is never printed and ref.current is never set to "mutated".',
      'The second renderToString is a completely independent render with fresh hook state, so the initializer runs again ("init rate", "render 10 ref"). Nothing persists between server renders except module-level variables like initCalls.',
      'Only after both renders do the logs of the returned strings appear: "<span>42</span>" and "<span>10</span>", then "init calls 2". The test harness also waits a few ticks afterwards — the effect still never fires.',
    ],
    misconceptions: [
      'useEffect does not run "later" on the server after the string is returned — it is simply skipped.',
      'Server hook state is not cached between requests; every renderToString starts from scratch, so lazy initializers run once per request.',
      'useMemo and useRef are not client-only: they are render-phase hooks and work normally during SSR.',
    ],
    followUp: {
      question: 'You need a value that only exists in the browser (e.g. a saved theme). How do you render it without a hydration mismatch?',
      answer:
        'Render the server-safe default first (useState(false)) and switch in an Effect (useEffect(() => setMounted(true), [])). The server HTML and the first client render then agree, hydration reports no recoverable errors, and the Effect triggers a second client render with the browser-only value. Verified: server HTML "<p>server</p>", DOM after hydration "<p>client</p>", 0 recoverable errors.',
    },
    docSourceIds: ['react-useeffect', 'react-sync-effects', 'webdev-rendering'],
  },
  {
    ...base,
    id: 'out-ssr-suspense-render-to-string',
    slug: 'ssr-suspense-render-to-string',
    title: 'Suspense inside renderToString',
    difficulty: 'hard',
    topics: ['SSR', 'Suspense', 'renderToString', 'renderToPipeableStream', 'streaming'],
    estimatedMinutes: 5,
    conceptIds: ['streaming-ssr', 'hydration'],
    research: research(
      [D.suspense, D.pipeable, doc('patterns-streaming-ssr', 'https://www.patterns.dev/react/streaming-ssr', 'Streaming Server-Side Rendering')],
      'react.dev documents that renderToString has limited Suspense support: a suspending boundary is emitted as its fallback and retried on the client, while renderToPipeableStream streams the resolved content later. Only the renderToString half is executed here.',
    ),
    code: `let attempts = 0;
const pending = new Promise(() => {});
function Profile() {
  attempts++;
  console.log('render Profile');
  throw pending;
}
function Page() {
  console.log('render Page');
  return React.createElement('div', null,
    React.createElement('h1', null, 'Hi'),
    React.createElement(React.Suspense, { fallback: React.createElement('p', null, 'Loading') },
      React.createElement(Profile)));
}
const html = renderToString(React.createElement(Page));
console.log('returned ' + typeof html);
console.log('has heading ' + html.includes('<h1>Hi</h1>'));
console.log('has fallback ' + html.includes('<p>Loading</p>'));
console.log('client-render marker ' + html.includes('<!--$!-->'));
console.log('attempts ' + attempts);`,
    expectedOutput: [
      'render Page',
      'render Profile',
      'returned string',
      'has heading true',
      'has fallback true',
      'client-render marker true',
      'attempts 1',
    ],
    steps: [
      'renderToString renders Page ("render Page") and then tries Profile inside the Suspense boundary ("render Profile"). Profile throws a promise that never resolves.',
      'renderToString is synchronous and cannot wait for that promise. Instead of throwing or hanging, it gives up on this one boundary and emits its fallback: the HTML contains <p>Loading</p> while <h1>Hi</h1> outside the boundary is rendered normally.',
      'The boundary is wrapped in the "<!--$!-->" comment marker, which tells hydrateRoot "the server did not finish this boundary — render it on the client". In development the markup also carries a <template> with an explanatory message.',
      'Profile is attempted exactly once ("attempts 1"); renderToString does not retry and never subscribes to the promise.',
      'renderToPipeableStream (not executed here) would behave differently: it would flush the shell with the fallback, keep the connection open, and when the promise resolves stream the real Profile HTML plus a small inline script that swaps it into place — no client re-render of the boundary needed.',
    ],
    misconceptions: [
      'renderToString does not throw when a child suspends inside a <Suspense> boundary — it returns HTML containing the fallback.',
      'renderToString does not await data: the thrown promise is ignored on the server, and the boundary is re-rendered from scratch on the client.',
      'The fallback on the server is not "the final UI": the  marker forces a client render of the boundary during hydration.',
    ],
    followUp: {
      question: 'What happens when this HTML is hydrated and Profile no longer suspends on the client?',
      answer:
        'hydrateRoot sees the "<!--$!-->" marker, discards the server fallback and client-renders the boundary, so the DOM becomes the real Profile content. onRecoverableError is called once with the server\'s reason ("The server did not finish this Suspense boundary…"). Verified: final HTML "<div><span>Ada</span></div>", 1 recoverable error.',
    },
    docSourceIds: ['react-suspense', 'react-render-pipeable', 'patterns-streaming-ssr'],
  },
  {
    ...base,
    id: 'out-ssr-useid-stable',
    slug: 'ssr-useid-stable',
    title: 'useId across server render and hydration',
    difficulty: 'hard',
    topics: ['SSR', 'useId', 'hydration', 'accessibility ids'],
    estimatedMinutes: 4,
    conceptIds: ['hydration'],
    research: research(
      [D.hydrate, D.rendering],
      'react.dev documents useId as the hydration-safe way to generate ids: they are derived from the component\'s position in the tree, so server and client agree. Exact id strings are an implementation detail of React 18.3. Verified by execution.',
    ),
    code: `const seen = [];
function Field({ label }) {
  const id = React.useId();
  seen.push(id);
  return React.createElement('label', { htmlFor: id }, label);
}
function Form() {
  return React.createElement('form', null,
    React.createElement(Field, { label: 'Email' }),
    React.createElement('div', null, React.createElement(Field, { label: 'Name' })));
}
const html = renderToString(React.createElement(Form));
console.log('server ' + seen.splice(0).join(' '));
const container = document.createElement('div');
container.innerHTML = html;
const serverLabel = container.querySelector('label');
let mismatches = 0;
act(() => {
  hydrateRoot(container, React.createElement(Form), { onRecoverableError: () => mismatches++ });
});
console.log('client ' + seen.join(' '));
console.log('mismatches ' + mismatches);
console.log('label node reused ' + (container.querySelector('label') === serverLabel));`,
    expectedOutput: ['server :R1: :R2:', 'client :R1: :R2:', 'mismatches 0', 'label node reused true'],
    steps: [
      'useId derives an id from the component\'s path in the tree (which child of which parent), not from a global counter or randomness. The server render records ":R1:" and ":R2:" (the exact format is a React 18 implementation detail — never hard-code it).',
      'The HTML is put into the container and hydrateRoot renders the same tree. Each Field occupies the same tree position as on the server, so it computes the same ids: "client :R1: :R2:".',
      'Because the for attributes and text match, hydration succeeds: onRecoverableError is never called ("mismatches 0").',
      'Successful hydration adopts the existing DOM instead of recreating it, so the first <label> is the very same node the server HTML produced ("label node reused true").',
    ],
    misconceptions: [
      'useId is not a global incrementing counter — rendering extra components elsewhere (e.g. in another request) does not shift the ids.',
      'Math.random() or Date.now() ids are not safe: the server and client produce different values, so the markup no longer matches what the client renders.',
    ],
    followUp: {
      question: 'What happens in React 18 if the id comes from Math.random() instead of useId?',
      answer:
        'Server and client compute different ids. For an attribute like for/id, React 18 only logs a dev warning ("Prop `htmlFor` did not match") — it does not patch attributes and does not call onRecoverableError — so the DOM silently keeps the server\'s id while React believes the client id is rendered. Verified: DOM unchanged after hydration, 0 recoverable errors, 1 console.error warning. Text mismatches are worse: they force a client re-render.',
    },
    docSourceIds: ['react-hydrateroot', 'webdev-rendering'],
  },
  {
    ...base,
    id: 'out-ssr-hydration-mismatch-boundary',
    slug: 'ssr-hydration-mismatch-boundary',
    title: 'Hydration text mismatch inside a Suspense boundary',
    difficulty: 'hard',
    topics: ['SSR', 'hydrateRoot', 'hydration mismatch', 'onRecoverableError', 'Suspense'],
    estimatedMinutes: 6,
    conceptIds: ['hydration', 'streaming-ssr'],
    research: research(
      [D.hydrate, D.suspense],
      'react.dev documents that a hydration mismatch is treated as a recoverable error: React client-renders up to the nearest Suspense boundary and reports through onRecoverableError. The recoverable-error count of 2 is what React 18.3 reports for this tree. Verified by execution.',
    ),
    code: `let side = 'server';
function Clock() {
  return React.createElement('time', null, side === 'server' ? '10:00' : '10:01');
}
function Page() {
  return React.createElement('main', null,
    React.createElement('h1', null, 'Dashboard'),
    React.createElement(React.Suspense, { fallback: null }, React.createElement(Clock)));
}
const container = document.createElement('div');
container.innerHTML = renderToString(React.createElement(Page));
const serverH1 = container.querySelector('h1');
const serverTime = container.querySelector('time');
side = 'client';
let recoverable = 0;
act(() => {
  hydrateRoot(container, React.createElement(Page), { onRecoverableError: () => recoverable++ });
});
console.log('recoverable errors: ' + recoverable);
console.log('time text: ' + container.querySelector('time').textContent);
console.log('h1 reused: ' + (container.querySelector('h1') === serverH1));
console.log('time reused: ' + (container.querySelector('time') === serverTime));`,
    expectedOutput: ['recoverable errors: 2', 'time text: 10:01', 'h1 reused: true', 'time reused: false'],
    steps: [
      'The server renders "10:00". Before hydrating, side flips to "client", so the client render of Clock produces "10:01" — a text mismatch.',
      'The <h1> sits outside the Suspense boundary and matches, so hydration adopts it: "h1 reused: true".',
      'When React hits the mismatched text inside the boundary, it abandons hydration for that boundary only: it deletes the server-rendered children and client-renders them fresh. The final text is the client value "10:01" and the <time> element is a brand-new node ("time reused: false").',
      'React 18.3 reports two recoverable errors for this: one for the text mismatch itself and one saying the boundary switched to client rendering. Each goes to onRecoverableError, hence "recoverable errors: 2". In development a "Text content did not match" warning also goes to console.error.',
      'Nothing is thrown to the caller and no error boundary fires — the page recovers, at the cost of re-creating that subtree (losing any server-rendered DOM state such as focus or scroll inside it).',
    ],
    misconceptions: [
      'React 18 does not patch a mismatched text node in place; it throws away the server DOM of the nearest Suspense boundary and client-renders it.',
      'A mismatch is not fatal: hydrateRoot recovers and reports through onRecoverableError rather than throwing.',
      'Without a Suspense boundary the blast radius is not "just that element" — it is the whole root.',
    ],
    followUp: {
      question: 'What changes if Clock is rendered directly inside <main>, with no Suspense boundary?',
      answer:
        'The nearest boundary is now the root, so React client-renders the entire tree: the final text is still "10:01", but the <h1> is also replaced ("h1 reused" becomes false). onRecoverableError is still called twice (the second message says the error happened outside a Suspense boundary, so the entire root switched to client rendering). Verified by execution.',
    },
    docSourceIds: ['react-hydrateroot', 'react-suspense'],
  },
  {
    ...base,
    id: 'out-ssr-effects-after-hydration',
    slug: 'ssr-effects-after-hydration',
    title: 'Render and effect order: renderToString, then hydrateRoot',
    difficulty: 'hard',
    topics: ['SSR', 'hydrateRoot', 'useLayoutEffect', 'useEffect', 'effect order'],
    estimatedMinutes: 5,
    conceptIds: ['react-effects', 'hydration'],
    research: research(
      [D.useEffect, D.syncEffects, D.hydrate],
      'react.dev documents that Effects do not run during server rendering, and that hydration runs them on the client like a mount (children before parents; layout effects before passive effects). React 18 warns about useLayoutEffect on the server. Verified by execution.',
    ),
    code: `function Child() {
  console.log('render Child');
  React.useLayoutEffect(() => { console.log('Child layout effect'); }, []);
  React.useEffect(() => { console.log('Child effect'); }, []);
  return React.createElement('i', null, 'x');
}
function Parent() {
  console.log('render Parent');
  React.useLayoutEffect(() => { console.log('Parent layout effect'); }, []);
  React.useEffect(() => { console.log('Parent effect'); }, []);
  return React.createElement('b', null, React.createElement(Child));
}
const container = document.createElement('div');
console.log('-- server');
container.innerHTML = renderToString(React.createElement(Parent));
console.log('-- hydrate');
act(() => {
  hydrateRoot(container, React.createElement(Parent));
});
console.log('-- after act');`,
    expectedOutput: [
      '-- server',
      'render Parent',
      'render Child',
      '-- hydrate',
      'render Parent',
      'render Child',
      'Child layout effect',
      'Parent layout effect',
      'Child effect',
      'Parent effect',
      '-- after act',
    ],
    steps: [
      'On the server only the render bodies run, top-down: "render Parent", "render Child". Neither useLayoutEffect nor useEffect fires. React 18 additionally logs a "useLayoutEffect does nothing on the server" warning to console.error for each of the two components — not part of the console.log output.',
      'hydrateRoot renders the tree again on the client, top-down ("render Parent", "render Child"), matching it against the existing DOM.',
      'At commit, layout effects run synchronously, children before parents: "Child layout effect", then "Parent layout effect".',
      'Passive effects (useEffect) run after that, also children first: "Child effect", "Parent effect". act() flushes them before it returns.',
      'Only then does "-- after act" print. Hydration is a mount from the components\' point of view: every mount effect runs exactly once.',
    ],
    misconceptions: [
      'Hydration does not skip effects because the HTML already exists — the client runs all mount effects.',
      'Effects do not run parent-first: within each phase React runs children before their parents.',
      'useLayoutEffect is not "run early on the server" — it is ignored there (and warned about in React 18).',
    ],
    followUp: {
      question: 'How do you avoid the React 18 server warning for a layout effect that measures the DOM?',
      answer:
        'Either move the logic to useEffect when it does not need to block paint, or choose the hook per environment (a "useIsomorphicLayoutEffect" that is useEffect on the server and useLayoutEffect in the browser), or render that component only on the client. useEffect produces no server warning — the hooks question in this set renders a useEffect component with zero console.error calls.',
    },
    docSourceIds: ['react-useeffect', 'react-sync-effects', 'react-hydrateroot'],
  },
];
