import type { DesignQuestion } from '../schema';

/**
 * React internals scenarios: memoization, stale closures, the render/commit pipeline,
 * request race conditions and state placement. Graded MCQs + a self-assessed answer.
 * Every React fact was checked against the linked react.dev pages (React 19.3 docs) on 2026-11-26.
 */

const VERIFIED = '2026-11-26';

const NO_FREQUENCY_EVIDENCE =
  'No public interview-report evidence was collected for this exact question, so frequency is LOW_CONFIDENCE and no company is claimed to ask it. The scenario is an original exercise built on the official documentation listed as evidence; every API name and behaviour in the answer was checked against those pages on 2026-11-26.';

export const ARCH_QUESTIONS_REACT_INTERNALS: DesignQuestion[] = [
  // ---------------------------------------------------------------------------------------------
  // 1. Memoization: why a memoized child still re-renders
  // ---------------------------------------------------------------------------------------------
  {
    schemaVersion: 1,
    kind: 'design',
    execution: 'quiz',
    track: 'architecture',
    id: 'arch-memo-child-still-rerenders',
    slug: 'memo-child-still-rerenders',
    title: 'Why does a memoized JobCard still re-render?',
    difficulty: 'medium',
    priority: 'P0',
    seniority: ['Senior', 'SDE-2', 'SDE-3'],
    topics: ['React.memo', 'useMemo', 'useCallback', 'referential equality', 'Object.is', 'when memoization hurts'],
    estimatedMinutes: 20,
    conceptIds: ['memoization', 'referential-equality', 'react-performance', 'react-context'],
    research: {
      provenance: 'DOCUMENTED_TECHNICAL_EXERCISE',
      frequencyConfidence: 'LOW_CONFIDENCE',
      verificationStatus: 'SOURCES_VERIFIED',
      lastVerified: VERIFIED,
      evidence: [
        { sourceId: 'react-memo', url: 'https://react.dev/reference/react/memo', originalTitle: 'memo', note: 'Shallow Object.is prop comparison; own state and context still re-render a memoized component.' },
        { sourceId: 'react-usecallback', url: 'https://react.dev/reference/react/useCallback', originalTitle: 'useCallback', note: '"useCallback does not prevent creating the function"; valuable for memo children and Hook dependencies.' },
        { sourceId: 'react-usememo', url: 'https://react.dev/reference/react/useMemo', originalTitle: 'useMemo', note: 'Object.is dependency comparison; "useMemo won\'t make the first render faster".' },
      ],
      researchNotes: `${NO_FREQUENCY_EVIDENCE} Memoization was also named in a referral contact's recollection of a senior frontend loop (October 2026); that account is unpublished and is not used as evidence.`,
    },
    scenario: `A job listing page renders 200 cards. Someone wrapped the card in \`memo\`, but the React Profiler shows every card re-rendering whenever the user types in the search box:

~~~tsx
const JobCard = memo(function JobCard({ job, onSave, style, children }: Props) {
  const { savedIds } = useContext(SavedJobsContext);
  return (
    <article style={style}>
      <h3>{job.title}</h3>
      <button onClick={() => onSave(job.id)}>{savedIds.has(job.id) ? 'Saved' : 'Save'}</button>
      {children}
    </article>
  );
});

function JobList({ jobs, query }: { jobs: Job[]; query: string }) {
  const [saved, setSaved] = useState(new Set<string>());
  const visible = jobs.filter((j) => j.title.toLowerCase().includes(query.toLowerCase()));
  return visible.map((job) => (
    <JobCard key={job.id} job={job} style={{ padding: 12 }} onSave={(id) => setSaved((s) => new Set(s).add(id))}>
      <Tags tags={job.tags} />
    </JobCard>
  ));
}
~~~

Explain every reason \`memo\` is not working, fix it, and tell me when you would *not* bother with \`memo\`, \`useMemo\` or \`useCallback\` at all.`,
    constraints: [
      'React 19.3 without React Compiler enabled (one follow-up asks about the compiler).',
      'Each JobCard render costs ~1 ms on a mid-range Android phone.',
      'The save button must keep working and show the saved state immediately.',
    ],
    answerOutline: [
      '`memo` skips a re-render only if every prop is equal by `Object.is` to its previous value; it does not stop re-renders from the component\'s own state or a context it reads.',
      '`style={{ padding: 12 }}` creates a new object every render → hoist it to a module constant or move it to CSS.',
      'The inline `onSave` arrow is a new function every render → `useCallback` with a functional `setSaved` update so the dependency list is empty.',
      '`children` (`<Tags />`) is a new React element every render → render Tags inside JobCard from `job.tags`, or memoize the element.',
      'Context: any change to the SavedJobsContext value re-renders every consumer, memoized or not → pass a boolean `isSaved` prop, or split the context.',
      '`useCallback` caches the function reference; it does not stop the function from being created. `useMemo` caches a computed value; neither makes the first render faster.',
      'Memoization costs comparisons and memory; skip it when the component is cheap, props change on every render anyway, or React Compiler is on.',
      'Verify with the Profiler ("why did this render?") before and after, ideally with CPU throttling.',
    ],
    modelAnswer: `**Why memo fails here.** \`memo(JobCard)\` makes React compare each new prop with the previous one using \`Object.is\`. If any prop differs, the card re-renders. Four props break that on every keystroke:

1. **\`style={{ padding: 12 }}\`** is a new object each render, so \`Object.is(prev, next)\` is false even though it looks identical.
2. **\`onSave={(id) => …}\`** is a new function each render.
3. **\`children\`** is a new \`<Tags />\` element object each render. JSX children are props too.
4. **Context.** \`memo\` only covers props. A component that reads a context re-renders when that context's value changes, and here the value probably changes whenever any job is saved.

The \`job\` prop is fine as long as \`jobs\` comes from a stable source, because \`filter\` keeps the original object references.

**Fix.**

~~~tsx
const CARD_STYLE = { padding: 12 };

const JobCard = memo(function JobCard({ job, isSaved, onSave }: { job: Job; isSaved: boolean; onSave: (id: string) => void }) {
  return (
    <article style={CARD_STYLE}>
      <h3>{job.title}</h3>
      <button onClick={() => onSave(job.id)}>{isSaved ? 'Saved' : 'Save'}</button>
      <Tags tags={job.tags} />
    </article>
  );
});

function JobList({ jobs, query }: { jobs: Job[]; query: string }) {
  const [saved, setSaved] = useState(() => new Set<string>());
  const onSave = useCallback((id: string) => setSaved((s) => new Set(s).add(id)), []);
  const visible = useMemo(() => jobs.filter((j) => matches(j, query)), [jobs, query]);
  return visible.map((job) => <JobCard key={job.id} job={job} isSaved={saved.has(job.id)} onSave={onSave} />);
}
~~~

The functional update means \`onSave\` does not need \`saved\` in its dependencies, so its reference never changes. Passing a boolean \`isSaved\` means saving one job re-renders exactly one card. Now typing re-renders only cards that appear or disappear.

**What each tool does.** \`memo\` skips re-rendering a component when its props are equal. \`useMemo\` caches a computed value between renders and compares dependencies with \`Object.is\`. \`useCallback\` caches a function reference. It does **not** stop the function from being created; the docs say so directly. Both hooks help only when something depends on the stable reference: a \`memo\` child, or another Hook's dependency list. Otherwise they are pure overhead.

**When not to memoize.** Skip it when the component is cheap, when a prop changes on every render anyway (memo then adds a comparison for nothing), when values are primitive, or when React Compiler is enabled and memoizes automatically. Memoization never makes the first render faster. Measure with the Profiler and CPU throttling first, then keep only the memoization that changes the numbers.`,
    pitfalls: [
      'Wrapping a child in memo but still passing an inline object, array, function or JSX children, so the comparison always fails.',
      'Assuming memo stops re-renders caused by context or the component\'s own state.',
      'Adding useCallback to every handler, including ones passed to plain DOM elements, which adds cost and no benefit.',
      'Using a stale closure in useCallback (`[]` deps while reading `saved`) instead of a functional update.',
      'Memoizing without measuring, then never checking that the Profiler numbers changed.',
    ],
    versionNotes:
      'Checked against the React 19.3 docs for memo, useMemo and useCallback on 2026-11-26. The useCallback page states it "does not prevent creating the function" and that React Compiler reduces the need for manual useCallback/useMemo.',
    docSourceIds: ['react-memo', 'react-usecallback', 'react-usememo', 'react-profiler'],
    mcqs: [
      {
        id: 'm1',
        question: 'A component wrapped in `memo` receives `items={data.filter(Boolean)}` from its parent. The parent re-renders but `data` is unchanged. What happens?',
        options: [
          { id: 'a', text: 'The child skips rendering because the filtered contents are equal', explanation: 'memo does not compare contents; it compares references with Object.is.' },
          { id: 'b', text: 'The child re-renders because filter returns a new array every time', explanation: 'Correct — wrap the filter in useMemo([data]) if the child is expensive.' },
          { id: 'c', text: 'React throws because props must be primitives', explanation: 'Any value can be a prop.' },
          { id: 'd', text: 'The child renders only in StrictMode', explanation: 'StrictMode does not change memo comparison.' },
        ],
        correctOptionId: 'b',
        explanation: 'memo compares each prop with Object.is. A new array is never equal to the previous one, even with identical contents.',
        sourceIds: ['react-memo', 'mdn-object-is'],
      },
      {
        id: 'm2',
        question: 'Which statement about `useCallback(fn, deps)` is true?',
        options: [
          { id: 'a', text: 'It stops the inline function from being created on each render', explanation: 'The function expression is still evaluated every render; React just returns the cached one.' },
          { id: 'b', text: 'It returns the same function reference while deps are unchanged, which helps memo children and Hook dependencies', explanation: 'Correct.' },
          { id: 'c', text: 'It makes the function run faster', explanation: 'It caches a reference, not a result.' },
          { id: 'd', text: 'It is required for every event handler passed to a <button>', explanation: 'DOM elements do not benefit from stable handler references.' },
        ],
        correctOptionId: 'b',
        explanation: 'useCallback caches a function reference between renders. The docs note it does not prevent creating the function and is only useful when something depends on reference stability.',
        sourceIds: ['react-usecallback'],
      },
      {
        id: 'm3',
        question: 'A memoized `<Avatar>` reads `useContext(ThemeContext)`. Its props are unchanged but the theme value changes. What happens?',
        options: [
          { id: 'a', text: 'It does not re-render, because memo blocks all updates when props are equal', explanation: 'memo only covers props.' },
          { id: 'b', text: 'It re-renders, because a context change re-renders every component that reads it', explanation: 'Correct.' },
          { id: 'c', text: 'It re-renders only if the parent also re-renders', explanation: 'Context updates reach consumers directly, even if the parent does not re-render.' },
          { id: 'd', text: 'It unmounts and remounts', explanation: 'A re-render keeps state; nothing remounts.' },
        ],
        correctOptionId: 'b',
        explanation: 'A memoized component still re-renders when its own state or a context it reads changes. Split contexts or pass narrower props to limit this.',
        sourceIds: ['react-memo', 'react-context'],
      },
    ],
    followUps: [
      { id: 'f1', level: 'mechanism', question: 'What is referential equality, and how does Object.is differ from ===?', expectedConcepts: ['same reference for objects', 'Object.is(NaN, NaN) is true', 'Object.is(+0, -0) is false'], sourceIds: ['mdn-object-is'] },
      { id: 'f2', level: 'application', question: 'Conceptually implement useMemo with useRef. What would your version get wrong compared with React\'s?', expectedConcepts: ['store deps and value in a ref', 'compare deps with Object.is', 'React may throw away the cache', 'concurrent rendering may discard renders'], sourceIds: ['react-usememo', 'react-refs'] },
      { id: 'f3', level: 'edge-cases', question: 'When can memoization make performance worse?', expectedConcepts: ['cheap component', 'props change every render', 'comparison cost', 'memory retention'], sourceIds: ['react-usememo', 'react-memo'] },
      { id: 'f4', level: 'production', question: 'How would you debug unnecessary re-renders in a large app?', expectedConcepts: ['React DevTools Profiler', 'highlight updates', 'why did this render', 'CPU throttling', '<Profiler> onRender in production builds'], sourceIds: ['react-profiler'] },
      { id: 'f5', level: 'architecture', question: 'Your team enables React Compiler. What happens to existing memo/useMemo/useCallback, and what would you still do by hand?', expectedConcepts: ['compiler memoizes automatically', 'keep existing memoization', 'still restructure state and context', 'Rules of React'], sourceIds: ['react-compiler', 'react-usecallback'] },
    ],
  },

  // ---------------------------------------------------------------------------------------------
  // 2. Stale closures in hooks
  // ---------------------------------------------------------------------------------------------
  {
    schemaVersion: 1,
    kind: 'design',
    execution: 'quiz',
    track: 'architecture',
    id: 'arch-stale-closures-hooks',
    slug: 'stale-closures-hooks',
    title: 'Fix stale closures in a polling and keyboard-shortcut hook',
    difficulty: 'medium',
    priority: 'P0',
    seniority: ['Senior', 'SDE-2', 'SDE-3'],
    topics: ['closures', 'stale closure', 'useEffect dependencies', 'functional updates', 'useRef', 'useEffectEvent'],
    estimatedMinutes: 20,
    conceptIds: ['closures', 'react-effects', 'react-state-batching'],
    research: {
      provenance: 'DOCUMENTED_TECHNICAL_EXERCISE',
      frequencyConfidence: 'LOW_CONFIDENCE',
      verificationStatus: 'SOURCES_VERIFIED',
      lastVerified: VERIFIED,
      evidence: [
        { sourceId: 'react-separating-events', url: 'https://react.dev/learn/separating-events-from-effects', originalTitle: 'Separating Events from Effects', note: 'A listener attached with [] keeps the function from the first render; "We recommend never suppressing the linter."' },
        { sourceId: 'react-useeffectevent', url: 'https://react.dev/reference/react/useEffectEvent', originalTitle: 'useEffectEvent', note: 'Effect Events read the latest props/state; only call them from Effects; never list them in deps.' },
        { sourceId: 'react-queueing', url: 'https://react.dev/learn/queueing-a-series-of-state-updates', originalTitle: 'Queueing a Series of State Updates', note: 'Updater functions receive the pending state.' },
        { sourceId: 'mdn-closures', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures', originalTitle: 'Closures' },
      ],
      researchNotes: `${NO_FREQUENCY_EVIDENCE} Closures were also named in a referral contact's recollection of a senior frontend loop (October 2026); that account is unpublished and is not used as evidence.`,
    },
    scenario: `A recruiter dashboard has a hook that polls for new applications and a keyboard shortcut that saves the current note. Both misbehave:

~~~tsx
function useApplicationsPoll(jobId: string) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const id = setInterval(async () => {
      const fresh = await api.newApplications(jobId);
      setCount(count + fresh); // count never goes above the first result
    }, 10_000);
    return () => clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return count;
}

function NoteEditor({ note, onSave }: Props) {
  const [draft, setDraft] = useState(note.text);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); onSave(draft); } // saves the original text
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return <textarea value={draft} onChange={(e) => setDraft(e.target.value)} />;
}
~~~

Explain what a stale closure is, why each bug happens, and fix both. Then tell me how you would prevent this class of bug across the team.`,
    constraints: [
      'React 19.3; eslint-plugin-react-hooks is installed.',
      'Switching jobId must restart polling for the new job.',
      'The keydown listener should not be removed and re-added on every keystroke if you can avoid it.',
    ],
    answerOutline: [
      'A closure captures the variables of the render that created it; every render has its own props/state values.',
      'With `[]` deps the effect runs once, so the interval callback and keydown handler see first-render values forever.',
      'Poll fix: use a functional update `setCount((c) => c + fresh)` and put `jobId` in deps so switching jobs restarts the interval.',
      'Shortcut fix: read the latest draft/onSave without re-subscribing, using useEffectEvent (call it only from the Effect, never list it in deps) or a ref updated in an effect.',
      'Never silence exhaustive-deps; the docs say that if you never suppress the linter you will not see stale values.',
      'Also handle the async race: ignore results that arrive after cleanup or after jobId changed.',
      'Team prevention: lint as error, code-review checklist for timers/listeners/subscriptions, custom hooks (useInterval, useEventListener) that encapsulate the pattern.',
    ],
    modelAnswer: `**What a stale closure is.** Every render is a function call with its own \`props\` and \`state\` constants. Any function created during that render (an event handler, an interval callback, an effect) closes over *those* values. If the function keeps running after later renders, it still sees the old values. That is a stale closure. It is ordinary JavaScript lexical scoping, not a React bug.

**Bug 1: the poll.** The effect has \`[]\` deps, so it runs once. The interval callback was created in the first render, where \`count\` is \`0\`, so every tick computes \`0 + fresh\`. The suppressed lint warning was hiding exactly this. It also ignores \`jobId\` changes, so switching jobs keeps polling the old job.

~~~tsx
function useApplicationsPoll(jobId: string) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setCount(0);
    const id = setInterval(async () => {
      const fresh = await api.newApplications(jobId);
      if (!cancelled) setCount((c) => c + fresh); // updater reads the latest pending state
    }, 10_000);
    return () => { cancelled = true; clearInterval(id); };
  }, [jobId]);
  return count;
}
~~~

The **functional update** removes the need to read \`count\` at all, so the effect depends only on \`jobId\`. The \`cancelled\` flag drops a response that arrives after cleanup, which is the async version of the same problem.

**Bug 2: the shortcut.** The keydown handler is created once and keeps the first \`draft\` and \`onSave\`. Adding \`[draft, onSave]\` to deps is correct but re-subscribes on every keystroke. Saving is an *event*, not something the effect should re-synchronise on, which is the case \`useEffectEvent\` exists for:

~~~tsx
const onSaveShortcut = useEffectEvent(() => onSave(draft)); // always sees the latest draft/onSave
useEffect(() => {
  const onKey = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); onSaveShortcut(); }
  };
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
}, []); // Effect Events are not dependencies
~~~

Rules from the docs: call Effect Events only from inside Effects, don't pass them to other components, and don't use them just to dodge dependencies. Without it, the older pattern is a \`latestRef\` updated in an effect and read inside the listener.

**Preventing it team-wide.** Make \`react-hooks/exhaustive-deps\` an error and treat \`eslint-disable\` for it as a review blocker. Wrap timers and global listeners in small custom hooks (\`useInterval\`, \`useEventListener\`) that handle latest-value reading and cleanup once. Prefer updater functions whenever new state depends on old state. In code review, ask of every long-lived callback: "which render's values does this see?"`,
    pitfalls: [
      'Suppressing exhaustive-deps instead of fixing the dependency.',
      'Adding state to deps of an interval effect, which restarts the timer on every update and can drift or never fire.',
      'Listing an Effect Event in the dependency array or passing it as a prop.',
      'Forgetting the async case: a response for the old jobId lands after the switch.',
    ],
    versionNotes:
      'Checked against react.dev on 2026-11-26: "Separating Events from Effects" and the useEffectEvent reference (no experimental banner on the page). If your project is on an older React without useEffectEvent, use a ref updated in an effect.',
    docSourceIds: ['react-separating-events', 'react-useeffectevent', 'react-queueing', 'mdn-closures'],
    mcqs: [
      {
        id: 'm1',
        question: 'What does this log after clicking the button three times quickly, assuming the timeout fires after all clicks?',
        code: `function Counter() {
  const [n, setN] = useState(0);
  return <button onClick={() => { setN(n + 1); setTimeout(() => console.log(n), 1000); }}>+</button>;
}`,
        options: [
          { id: 'a', text: '3, 3, 3', explanation: 'Each timeout closes over the n of the render in which its click happened.' },
          { id: 'b', text: '0, 1, 2', explanation: 'Correct — each click happens in a new render, and its closure keeps that render\'s n.' },
          { id: 'c', text: '1, 2, 3', explanation: 'setN does not change the n constant in the current closure.' },
          { id: 'd', text: '0, 0, 0', explanation: 'That would be true only if no re-render happened between clicks.' },
        ],
        correctOptionId: 'b',
        explanation: 'State is a snapshot per render. Each handler, and each timeout it schedules, reads the value from the render that created it.',
        sourceIds: ['mdn-closures', 'react-queueing'],
      },
      {
        id: 'm2',
        question: 'Inside an interval created by an effect with `[]` deps, which update is correct?',
        options: [
          { id: 'a', text: 'setCount(count + 1)', explanation: 'count is the first-render value forever.' },
          { id: 'b', text: 'setCount((c) => c + 1)', explanation: 'Correct — the updater receives the latest pending state.' },
          { id: 'c', text: 'count++', explanation: 'Mutating a state constant does nothing and is a bug.' },
          { id: 'd', text: 'setCount(useRef(count).current + 1)', explanation: 'Hooks cannot be called inside callbacks.' },
        ],
        correctOptionId: 'b',
        explanation: 'Updater functions avoid reading state from the closure, which removes the dependency and the stale value.',
        sourceIds: ['react-queueing'],
      },
      {
        id: 'm3',
        question: 'Which use of `useEffectEvent` follows the documented rules?',
        options: [
          { id: 'a', text: 'Calling it during render to compute a label', explanation: 'Effect Events must not be called during rendering.' },
          { id: 'b', text: 'Calling it from inside a useEffect listener to read the latest props without re-subscribing', explanation: 'Correct.' },
          { id: 'c', text: 'Passing it as onClick to a child component', explanation: 'Do not pass Effect Events to other components.' },
          { id: 'd', text: 'Listing it in the effect\'s dependency array', explanation: 'Effect Events are not reactive and must be omitted from dependencies.' },
        ],
        correctOptionId: 'b',
        explanation: 'Effect Events can only be called from inside Effects (or other Effect Events) and are omitted from dependency arrays.',
        sourceIds: ['react-useeffectevent'],
      },
    ],
    followUps: [
      { id: 'f1', level: 'definition', question: 'Define closure, lexical scope and the scope chain.', expectedConcepts: ['function plus its lexical environment', 'scope decided where code is written', 'lookup walks outward to global'], sourceIds: ['mdn-closures'] },
      { id: 'f2', level: 'mechanism', question: 'Why does `for (var i = 0; i < 3; i++) setTimeout(() => console.log(i))` log 3, 3, 3 but `let` logs 0, 1, 2?', expectedConcepts: ['var is function-scoped, one binding', 'let creates a binding per iteration'], sourceIds: ['mdn-let', 'mdn-closures'] },
      { id: 'f3', level: 'application', question: 'Write a useInterval(callback, delay) hook that always calls the latest callback.', expectedConcepts: ['ref or useEffectEvent for latest callback', 'delay in deps', 'clearInterval cleanup', 'null delay pauses'], sourceIds: ['react-useeffectevent', 'react-refs'] },
      { id: 'f4', level: 'production', question: 'How can a closure cause a memory leak in a React app?', expectedConcepts: ['listener never removed keeps closure alive', 'closure retains large objects / DOM', 'cleanup in effects'], sourceIds: ['chrome-memory-problems'] },
    ],
  },

  // ---------------------------------------------------------------------------------------------
  // 3. Render → commit pipeline
  // ---------------------------------------------------------------------------------------------
  {
    schemaVersion: 1,
    kind: 'design',
    execution: 'quiz',
    track: 'architecture',
    id: 'arch-render-commit-pipeline',
    slug: 'render-commit-pipeline',
    title: 'From setState to pixels: render, reconcile, commit',
    difficulty: 'hard',
    priority: 'P0',
    seniority: ['Senior', 'SDE-3', 'MTS'],
    topics: ['reconciliation', 'Fiber', 'render vs commit', 'automatic batching', 'state bailout', 'useLayoutEffect vs useEffect'],
    estimatedMinutes: 25,
    conceptIds: ['react-reconciliation-keys', 'react-state-batching', 'react-effects', 'react-performance'],
    research: {
      provenance: 'DOCUMENTED_TECHNICAL_EXERCISE',
      frequencyConfidence: 'LOW_CONFIDENCE',
      verificationStatus: 'SOURCES_VERIFIED',
      lastVerified: VERIFIED,
      evidence: [
        { sourceId: 'react-queueing', url: 'https://react.dev/learn/queueing-a-series-of-state-updates', originalTitle: 'Queueing a Series of State Updates', note: 'Batching: React waits until all code in the event handler has run.' },
        { sourceId: 'react-preserving-state', url: 'https://react.dev/learn/preserving-and-resetting-state', originalTitle: 'Preserving and Resetting State', note: 'Same component at the same position keeps state; type or key change resets it.' },
        { sourceId: 'react-uselayouteffect', url: 'https://react.dev/reference/react/useLayoutEffect', originalTitle: 'useLayoutEffect', note: 'Runs after commit and before repaint; blocks paint; can hurt performance.' },
        { sourceId: 'react-usetransition', url: 'https://react.dev/reference/react/useTransition', originalTitle: 'useTransition', note: 'Transition renders are interruptible.' },
      ],
      researchNotes: `${NO_FREQUENCY_EVIDENCE} Fiber internals (work loop, lanes) are implementation details not specified in the public docs; the answer keeps them at the level an interviewer can verify and labels them as internals.`,
    },
    scenario: `A candidate profile has a "Show notes" button. Clicking it calls three state setters and opens a tooltip-style panel that must be positioned next to the button:

~~~tsx
function handleClick() {
  setOpen(true);
  setActiveTab('notes');
  setLastViewed(Date.now());
}

function NotesPanel({ anchor }: { anchor: HTMLElement }) {
  const ref = useRef<HTMLDivElement>(null);
  const [top, setTop] = useState(0);
  useEffect(() => {
    setTop(anchor.getBoundingClientRect().bottom - ref.current!.offsetHeight);
  }, [anchor]);
  return <div ref={ref} style={{ position: 'fixed', top }}>…</div>;
}
~~~

Users report the panel "jumps" for a frame when it opens. Walk me through exactly what React does from the click to pixels on screen — batching, the render phase, reconciliation, the commit phase and effects — and use that to explain and fix the jump. Where does Fiber fit in?`,
    constraints: [
      'React 19.3 client rendering (no SSR for this panel).',
      'Answer at the level of documented behaviour; label anything that is an internal implementation detail.',
    ],
    answerOutline: [
      'Trigger: the three setters are batched; React processes them after the event handler finishes, giving one re-render.',
      'Render phase: React calls components to compute the next UI; rendering must be pure and, for transitions, can be interrupted and restarted.',
      'Reconciliation: React compares the new element tree with the previous one; same type at the same position (and same key) keeps state and updates; a different type or key unmounts and remounts.',
      'Commit phase: React applies the minimal DOM changes, attaches refs, then runs layout effects synchronously before the browser paints.',
      'Passive effects (useEffect) usually run after paint, so a measurement in useEffect causes one painted frame with the wrong position → the jump.',
      'Fix: measure in useLayoutEffect (blocks paint, so keep it small) or use CSS anchoring / the Popover API to avoid measuring at all.',
      'Bailouts: setting state to an Object.is-equal value lets React skip children, though it may still call the component once before bailing out.',
      'Fiber: React\'s internal unit-of-work data structure that lets rendering be split, prioritised and resumed; it is what makes concurrent features possible.',
    ],
    modelAnswer: `**1. Trigger and batching.** Calling a setter does not re-render immediately. It queues an update. React waits until all code in the event handler has run, then processes the queue, so three setters produce **one** render. Since React 18 this batching also applies to updates inside promises, timeouts and native handlers.

**2. Render phase.** React calls your components, starting from the one whose state changed, to work out what the UI should be. Rendering must be **pure**: no DOM writes, no subscriptions, no mutation of outside variables. For urgent updates like this click, React renders synchronously. For updates inside \`startTransition\`, rendering can be **interrupted** and restarted when something more urgent arrives. That is why render-phase code may run more than once (StrictMode double-invokes it in development to surface impurity).

**3. Reconciliation.** React diffs the new element tree against the previous one. If an element has the **same type at the same position, with the same key**, React keeps its state and DOM node and updates only the changed props. A different type or key means unmount the old subtree and mount a new one. That is why stable \`key\`s matter in lists, and why changing a key is a deliberate way to reset state.

**4. Commit phase.** React applies the computed DOM mutations in one go, attaches refs, and runs **layout effects** (\`useLayoutEffect\`) synchronously. Only then can the browser paint. **Passive effects** (\`useEffect\`) are run after that, usually after paint.

**Why the panel jumps.** The first commit inserts the panel with \`top: 0\`. The browser paints it. Then \`useEffect\` measures and sets \`top\`, which triggers a second render and commit, and the panel moves. The user sees one frame in the wrong place.

**Fix.** Measure in \`useLayoutEffect\`. It runs after the DOM is updated but before the browser repaints, and the state update it schedules is processed before paint too, so the user only ever sees the final position:

~~~tsx
useLayoutEffect(() => {
  setTop(anchor.getBoundingClientRect().bottom - ref.current!.offsetHeight);
}, [anchor]);
~~~

The docs warn that \`useLayoutEffect\` blocks painting and "can hurt performance", so keep it to the measurement. It also does not run during server rendering. Better still, avoid measuring at all with CSS positioning or the Popover API.

**Bailouts.** If a setter is called with a value that is \`Object.is\`-equal to the current state, React can skip re-rendering the children. It may still call the component itself once before deciding to bail out, which is why "I set the same state and my component ran again" is expected.

**Where Fiber fits.** Fiber is React's internal representation of the component tree: one unit of work per component, with links to its parent, child and sibling, plus pending updates and priority. Because work is split into units, React can pause after any unit, handle a higher-priority update, and resume. That is the mechanism behind interruptible transitions and \`useDeferredValue\`. These are internals, though. In an interview, explain the documented contract (pure render, atomic commit, effect timing) first, and Fiber as how React delivers it.`,
    pitfalls: [
      'Saying each setState causes an immediate re-render; updates are batched.',
      'Doing DOM reads or writes during render.',
      'Measuring layout in useEffect for something visible on first paint, causing a flash.',
      'Using useLayoutEffect everywhere, which blocks paint and hurts INP.',
      'Describing Fiber internals as public API or guaranteed behaviour.',
    ],
    versionNotes:
      'Checked against react.dev on 2026-11-26 (React 19.3 docs): Queueing a Series of State Updates, Preserving and Resetting State, useLayoutEffect ("fires before the browser repaints", "can hurt performance", does not run on the server) and useTransition. Fiber is described as an internal implementation detail.',
    docSourceIds: ['react-queueing', 'react-preserving-state', 'react-uselayouteffect', 'react-usetransition'],
    mcqs: [
      {
        id: 'm1',
        question: 'An event handler calls `setA(1); setB(2); setC(3);`. How many re-renders does React 18+ perform?',
        options: [
          { id: 'a', text: 'Three, one per setter', explanation: 'Updates are batched.' },
          { id: 'b', text: 'One, after the handler finishes', explanation: 'Correct — React batches updates from the same event.' },
          { id: 'c', text: 'Zero until the next animation frame', explanation: 'React does not wait for rAF.' },
          { id: 'd', text: 'One per component that reads the state', explanation: 'It is one render pass covering all affected components.' },
        ],
        correctOptionId: 'b',
        explanation: 'React waits until all code in the event handler has run before processing state updates.',
        sourceIds: ['react-queueing'],
      },
      {
        id: 'm2',
        question: 'When does `useLayoutEffect` run?',
        options: [
          { id: 'a', text: 'During rendering, before the DOM is updated', explanation: 'Effects never run during rendering.' },
          { id: 'b', text: 'After React commits DOM changes and before the browser repaints', explanation: 'Correct.' },
          { id: 'c', text: 'After the browser paints, like useEffect', explanation: 'That is useEffect\'s usual timing.' },
          { id: 'd', text: 'On the server during SSR', explanation: 'Effects only run on the client.' },
        ],
        correctOptionId: 'b',
        explanation: 'useLayoutEffect fires after commit and blocks the browser from repainting until it (and the updates it schedules) finish.',
        sourceIds: ['react-uselayouteffect'],
      },
      {
        id: 'm3',
        question: 'A list renders `<Row key={index} />` and the user deletes the first row, which had an expanded state. What happens?',
        options: [
          { id: 'a', text: 'The second row becomes expanded, because state follows the index position', explanation: 'Correct — with index keys the remaining rows shift into the deleted row\'s key and state.' },
          { id: 'b', text: 'React detects the deletion and moves state correctly', explanation: 'React only knows keys; index keys hide the identity change.' },
          { id: 'c', text: 'All rows remount', explanation: 'Keys 0..n-2 still exist, so those rows are updated, not remounted.' },
          { id: 'd', text: 'React throws a duplicate key error', explanation: 'Index keys are unique, just unstable.' },
        ],
        correctOptionId: 'a',
        explanation: 'Reconciliation matches elements by type, position and key. Use stable ids as keys so state stays with the item.',
        sourceIds: ['react-preserving-state', 'react-rendering-lists'],
      },
    ],
    followUps: [
      { id: 'f1', level: 'definition', question: 'What is the difference between rendering and committing?', expectedConcepts: ['render computes UI, pure, may be interrupted', 'commit applies DOM changes, synchronous, not interruptible'], sourceIds: ['react-queueing'] },
      { id: 'f2', level: 'mechanism', question: 'Why does setting the same state sometimes still invoke the component once?', expectedConcepts: ['Object.is bailout', 'React may render the component before deciding to bail out', 'children are skipped'], sourceIds: ['react-queueing'] },
      { id: 'f3', level: 'application', question: 'Explain useTransition and useDeferredValue in terms of the render phase.', expectedConcepts: ['low-priority interruptible render', 'old UI stays visible', 'deferred value lags', 'memoize the slow child'], sourceIds: ['react-usetransition', 'react-usedeferredvalue'] },
      { id: 'f4', level: 'edge-cases', question: 'useLayoutEffect in an SSR app logs a warning or does nothing on the server. What are your options?', expectedConcepts: ['effects do not run on server', 'useEffect if not visible on first paint', 'render client-only', 'CSS positioning'], sourceIds: ['react-uselayouteffect'] },
      { id: 'f5', level: 'architecture', question: 'How does Fiber make concurrent rendering possible?', expectedConcepts: ['work split into units per component', 'pause and resume', 'priorities', 'double buffering of current and work-in-progress tree (internal)'], sourceIds: ['react-usetransition'] },
    ],
  },

  // ---------------------------------------------------------------------------------------------
  // 4. Search race conditions (React → Angular)
  // ---------------------------------------------------------------------------------------------
  {
    schemaVersion: 1,
    kind: 'design',
    execution: 'quiz',
    track: 'architecture',
    id: 'arch-search-race-conditions',
    slug: 'search-race-conditions',
    title: 'Stop stale search results from overwriting newer ones',
    difficulty: 'medium',
    priority: 'P0',
    seniority: ['Senior', 'SDE-2', 'SDE-3'],
    topics: ['race conditions', 'AbortController', 'useEffect cleanup', 'debounce', 'request deduplication', 'TanStack Query'],
    estimatedMinutes: 20,
    conceptIds: ['race-conditions', 'abort-controller', 'react-effects', 'debouncing'],
    research: {
      provenance: 'DOCUMENTED_TECHNICAL_EXERCISE',
      frequencyConfidence: 'LOW_CONFIDENCE',
      verificationStatus: 'SOURCES_VERIFIED',
      lastVerified: VERIFIED,
      evidence: [
        { sourceId: 'react-useeffect', url: 'https://react.dev/reference/react/useEffect', originalTitle: 'useEffect', note: '"Fetching data with Effects" uses an ignore flag in cleanup to avoid race conditions.' },
        { sourceId: 'mdn-abortcontroller', url: 'https://developer.mozilla.org/en-US/docs/Web/API/AbortController', originalTitle: 'AbortController' },
        { sourceId: 'mdn-debounce', url: 'https://developer.mozilla.org/en-US/docs/Glossary/Debounce', originalTitle: 'Debounce' },
      ],
      researchNotes: `${NO_FREQUENCY_EVIDENCE} The "React then Angular" wording comes from a prep plan the learner wrote with an AI assistant; it is used as the scenario, not as evidence of being asked.`,
    },
    scenario: `On the job search page a user types "React", then quickly changes it to "Angular". The React request is slow and its response arrives **after** the Angular response, so the page shows React jobs under an "Angular" search box.

~~~tsx
function JobSearch() {
  const [query, setQuery] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  useEffect(() => {
    if (!query) return;
    fetch('/api/jobs?q=' + encodeURIComponent(query)).then((r) => r.json()).then(setJobs);
  }, [query]);
  return (<><input value={query} onChange={(e) => setQuery(e.target.value)} /><JobResults jobs={jobs} /></>);
}
~~~

Explain why this happens and give at least three ways to fix it. Which would you ship, and what else does a production search box need?`,
    constraints: [
      'React 19.3 client component; the search API supports GET with a `q` parameter.',
      'Typing must stay responsive; the API is rate-limited per user.',
      'The query should survive refresh and be shareable.',
    ],
    answerOutline: [
      'Network latency is not ordered: responses can arrive in any order, and the last response to arrive wins setJobs.',
      'Fix 1 — ignore flag: cleanup sets `ignore = true` so a response for an old query is dropped (the pattern in the useEffect docs).',
      'Fix 2 — AbortController: cleanup aborts the previous fetch, saving bandwidth; handle AbortError separately from real errors.',
      'Fix 3 — request id / latest-query check: store an incrementing id in a ref and only apply the response if it matches.',
      'Fix 4 — a query cache (TanStack Query) keyed by the query string: each key has its own result, and the UI reads the current key.',
      'Debounce reduces requests but does not fix ordering on its own.',
      'Production extras: URL search params as state, loading/empty/error states, keep previous results while loading, dedupe identical requests, accessible live region for result counts.',
    ],
    modelAnswer: `**Why it happens.** Each keystroke that changes \`query\` starts a request, but nothing ties a response to the query that started it. HTTP gives no ordering guarantee between requests. If "React" is slow and "Angular" is fast, the React \`setJobs\` runs last and wins. Debouncing makes this rarer by sending fewer requests. It does not fix it, because two requests can still overlap.

**Fix 1: ignore stale responses in cleanup.** This is the pattern in the \`useEffect\` docs. When \`query\` changes, React runs the previous effect's cleanup first:

~~~tsx
useEffect(() => {
  if (!query) return;
  let ignore = false;
  fetch('/api/jobs?q=' + encodeURIComponent(query))
    .then((r) => r.json())
    .then((data) => { if (!ignore) setJobs(data); });
  return () => { ignore = true; };
}, [query]);
~~~

**Fix 2: abort the old request.** Same shape, but cleanup calls \`controller.abort()\`, which also frees the connection and server work. The aborted fetch rejects with an \`AbortError\`, which must not be shown as a failure:

~~~tsx
useEffect(() => {
  if (!query) return;
  const controller = new AbortController();
  fetch('/api/jobs?q=' + encodeURIComponent(query), { signal: controller.signal })
    .then((r) => r.json())
    .then(setJobs)
    .catch((e) => { if (e.name !== 'AbortError') setError(e); });
  return () => controller.abort();
}, [query]);
~~~

**Fix 3: sequence numbers.** Outside effects, for example in an event handler or a store, keep \`latestId = ++counter\` in a ref and apply a response only if its id is still the latest.

**Fix 4: key results by query.** A query cache such as TanStack Query stores a result per key (\`['jobs', query]\`). The component always reads the current key, so a late "React" response fills the "React" entry and never shows up under "Angular". You also get deduplication, caching and the request \`signal\` for free.

**What I would ship.** I would use a query library keyed by the query, with \`signal\` passed to fetch, a 250–300 ms debounce on the input, and the query in the URL (\`?q=angular\`) so refresh and sharing work. Previous results stay visible with a subtle pending indicator rather than a blank list (\`useDeferredValue\` or the library's placeholder data). Empty and error states are explicit. Result counts go to a polite live region. If I cannot add a library, Fix 2 inside a small \`useJobSearch\` hook is a correct, dependency-free answer.

**Test it** by resolving mocked responses out of order and asserting that only the latest query's results render.`,
    pitfalls: [
      'Believing debounce alone solves out-of-order responses.',
      'Showing an error toast for AbortError.',
      'Clearing results to empty on every keystroke, which makes the list flicker.',
      'Not encoding the query string (encodeURIComponent).',
      'Keeping the query only in component state, so refresh and back navigation lose it.',
    ],
    versionNotes:
      'Checked against react.dev useEffect ("Fetching data with Effects" ignore-flag pattern), MDN AbortController and MDN Debounce on 2026-11-26. TanStack Query is mentioned as an option; its API is not version-pinned here.',
    docSourceIds: ['react-useeffect', 'mdn-abortcontroller', 'mdn-debounce', 'react-usedeferredvalue'],
    mcqs: [
      {
        id: 'm1',
        question: 'The search input is debounced by 300 ms. Can stale results still overwrite newer ones?',
        options: [
          { id: 'a', text: 'No — debouncing guarantees one request at a time', explanation: 'A slow request can still be in flight when the next debounced request starts.' },
          { id: 'b', text: 'Yes — two requests can still overlap and finish out of order', explanation: 'Correct — you still need ignore/abort/keyed results.' },
          { id: 'c', text: 'Only on HTTP/1.1', explanation: 'Ordering is never guaranteed on any protocol version.' },
          { id: 'd', text: 'Only in React StrictMode', explanation: 'This is a network timing issue, not a StrictMode one.' },
        ],
        correctOptionId: 'b',
        explanation: 'Debounce reduces the number of requests; it does not order responses.',
        sourceIds: ['mdn-debounce'],
      },
      {
        id: 'm2',
        question: 'Why does the ignore-flag pattern work?',
        options: [
          { id: 'a', text: 'React cancels the fetch when the flag is set', explanation: 'The flag cancels nothing; the request still completes.' },
          { id: 'b', text: 'React runs the previous effect\'s cleanup before the next effect, so the old closure\'s flag is true when its response arrives', explanation: 'Correct.' },
          { id: 'c', text: 'setState ignores calls from old renders automatically', explanation: 'React would apply the stale setJobs without the flag.' },
          { id: 'd', text: 'The flag is shared by all renders', explanation: 'Each effect run has its own flag in its own closure.' },
        ],
        correctOptionId: 'b',
        explanation: 'Each effect run captures its own `ignore` variable; cleanup flips it before the next run starts.',
        sourceIds: ['react-useeffect'],
      },
      {
        id: 'm3',
        question: 'An effect aborts its fetch in cleanup. In development the console shows a rejected fetch on every mount. What is going on?',
        options: [
          { id: 'a', text: 'The API is failing', explanation: 'The rejection is an AbortError caused by cleanup.' },
          { id: 'b', text: 'StrictMode mounts, cleans up and remounts the effect in development, so the first request is aborted', explanation: 'Correct — handle AbortError silently.' },
          { id: 'c', text: 'AbortController is not supported in development builds', explanation: 'It is a browser API, unaffected by React builds.' },
          { id: 'd', text: 'The effect is missing its dependency array', explanation: 'That would cause many requests, not this pattern.' },
        ],
        correctOptionId: 'b',
        explanation: 'StrictMode runs an extra setup + cleanup cycle in development to surface missing cleanups. Aborting is correct; just ignore AbortError.',
        sourceIds: ['react-useeffect', 'mdn-abortcontroller'],
      },
    ],
    followUps: [
      { id: 'f1', level: 'mechanism', question: 'Compare the ignore flag and AbortController. When would you use each?', expectedConcepts: ['ignore drops result, request continues', 'abort cancels network work', 'non-fetch promises cannot be aborted'], sourceIds: ['mdn-abortcontroller', 'react-useeffect'] },
      { id: 'f2', level: 'application', question: 'Implement debounce + abort in a reusable useSearch hook.', expectedConcepts: ['debounced value', 'AbortController per request', 'cleanup', 'loading and error state'], sourceIds: ['mdn-debounce', 'mdn-abortcontroller'] },
      { id: 'f3', level: 'production', question: 'How do you keep search filters across refresh and back/forward navigation?', expectedConcepts: ['URL search params as source of truth', 'replace vs push history', 'parse and validate params'], sourceIds: ['react-useeffect'] },
      { id: 'f4', level: 'architecture', question: 'Why might you move search state into a server-state library instead of useEffect?', expectedConcepts: ['caching per key', 'dedupe', 'stale-while-revalidate', 'retries', 'less hand-written effect code'], sourceIds: ['react-no-effect'] },
    ],
  },

  // ---------------------------------------------------------------------------------------------
  // 5. State placement and context re-renders
  // ---------------------------------------------------------------------------------------------
  {
    schemaVersion: 1,
    kind: 'design',
    execution: 'quiz',
    track: 'architecture',
    id: 'arch-state-placement-context',
    slug: 'state-placement-context',
    title: 'Where should state live? Context re-renders on a recruiter dashboard',
    difficulty: 'hard',
    priority: 'P1',
    seniority: ['Senior', 'SDE-3', 'MTS'],
    topics: ['React Context', 'state colocation', 'URL state', 'server state', 'useSyncExternalStore', 'useTransition'],
    estimatedMinutes: 25,
    conceptIds: ['react-context', 'derived-state', 'react-performance', 'controlled-uncontrolled'],
    research: {
      provenance: 'DOCUMENTED_TECHNICAL_EXERCISE',
      frequencyConfidence: 'LOW_CONFIDENCE',
      verificationStatus: 'SOURCES_VERIFIED',
      lastVerified: VERIFIED,
      evidence: [
        { sourceId: 'react-context', url: 'https://react.dev/learn/passing-data-deeply-with-context', originalTitle: 'Passing Data Deeply with Context' },
        { sourceId: 'react-usesyncexternalstore', url: 'https://react.dev/reference/react/useSyncExternalStore', originalTitle: 'useSyncExternalStore' },
        { sourceId: 'react-sharing-state', url: 'https://react.dev/learn/sharing-state-between-components', originalTitle: 'Sharing State Between Components' },
        { sourceId: 'react-usetransition', url: 'https://react.dev/reference/react/useTransition', originalTitle: 'useTransition' },
      ],
      researchNotes: NO_FREQUENCY_EVIDENCE,
    },
    scenario: `A recruiter dashboard keeps everything in one context:

~~~tsx
const DashboardContext = createContext(null!);
function DashboardProvider({ children }) {
  const [filters, setFilters] = useState(defaultFilters);   // stage, location, skills
  const [candidates, setCandidates] = useState<Candidate[]>([]); // fetched list, 2,000 rows
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draftNote, setDraftNote] = useState('');           // the note textarea
  const [user] = useState(currentUser);
  return (
    <DashboardContext.Provider value={{ filters, setFilters, candidates, setCandidates, selectedId, setSelectedId, draftNote, setDraftNote, user }}>
      {children}
    </DashboardContext.Provider>
  );
}
~~~

Typing in the note textarea lags badly, and filters are lost on refresh. Explain how context triggers re-renders, then redesign where each piece of state lives.`,
    constraints: [
      'React 19.3; a server-state library is allowed.',
      'Filters must survive refresh and be shareable with a teammate by URL.',
      'Moving a candidate between stages should feel instant.',
    ],
    answerOutline: [
      'Every consumer of a context re-renders when the provider value changes by Object.is; a new object literal each render changes it every time.',
      'Here every keystroke in draftNote re-renders every consumer, including the 2,000-row table.',
      'Classify state: URL state (filters, selected candidate), server state (candidates), local UI state (draft note), app-wide rarely-changing state (user).',
      'Filters → URL search params (source of truth), parsed and validated; selection → route or param.',
      'Candidates → server-state cache keyed by filters, with optimistic updates for stage moves.',
      'Draft note → local state in the editor (colocation).',
      'Keep context for rarely changing values (user, permissions, theme); split contexts and memoize provider values; separate state and dispatch.',
      'For high-frequency shared stores, use a store with selectors via useSyncExternalStore; use useTransition for expensive filter re-renders.',
    ],
    modelAnswer: `**How context re-renders.** When a provider's \`value\` changes (compared with \`Object.is\`), React re-renders **every** component that reads that context, no matter how deep it sits, and \`memo\` does not stop it. This provider builds a new object literal on every render, so any state change, including each keystroke in \`draftNote\`, re-renders every consumer. That includes the table of 2,000 candidates. That is the lag.

**Classify the state before moving it.**

| State | Kind | Where it should live |
|---|---|---|
| filters | Navigation state: shareable, survives refresh | URL search params |
| selectedId | Navigation state | Route segment or \`?candidate=\` param |
| candidates | Server state: cached, can go stale, shared | Server-state cache keyed by filters |
| draftNote | Local UI state | \`useState\` inside the note editor |
| user | App-wide, rarely changes | Context |

**Filters in the URL.** The URL becomes the source of truth. The filter panel writes params (replace, not push, while typing), the table reads them, and refresh, back/forward and sharing all work. Parse and validate params, because they are user input.

**Candidates as server state.** A query keyed by \`['candidates', filters]\` handles caching, dedupe, loading/error states and refetching. Moving a candidate between stages uses an **optimistic update**: update the cached list immediately, send the mutation, roll back and show an error on failure, and invalidate on success. Do not copy server data into context. That creates a second source of truth that goes stale.

**Colocate the draft.** \`draftNote\` moves into the note editor. Typing now re-renders one component.

**What stays in context.** Only values that are needed widely and change rarely: \`user\`, permissions, feature flags, theme. Memoize the provider value (\`useMemo\`) so it changes only when its contents do. Split contexts by update frequency, and put \`dispatch\` in its own context, because dispatch functions are stable and their consumers should never re-render.

**When context is still not enough.** If many components need different slices of frequently changing shared state, such as a live board with presence, use an external store with **selectors** read via \`useSyncExternalStore\`, so a component re-renders only when its slice changes. Libraries like Zustand do this.

**Keeping filtering responsive.** If re-filtering a large list is expensive, wrap the filter update in \`startTransition\` (or read a \`useDeferredValue\` of the filters) so input stays responsive while the table renders in the background. Virtualize the table so only visible rows render.

**Summary.** The bug is not "context is slow". One value mixed five kinds of state with very different update frequencies and lifetimes.`,
    pitfalls: [
      'Passing a new object literal as the provider value on every render.',
      'Copying server data into context or Redux and hand-syncing it.',
      'Expecting memo to block context-triggered re-renders.',
      'Storing filters only in memory, so refresh and sharing lose them.',
      'Using context for high-frequency values like text input or mouse position.',
    ],
    versionNotes:
      'Checked against react.dev on 2026-11-26: Passing Data Deeply with Context, Sharing State Between Components, useSyncExternalStore and useTransition (React 19.3 docs).',
    docSourceIds: ['react-context', 'react-usesyncexternalstore', 'react-sharing-state', 'react-usetransition'],
    mcqs: [
      {
        id: 'm1',
        question: 'A provider renders `<Ctx.Provider value={{ user, setUser }}>`. Its parent re-renders for an unrelated reason. What happens to consumers?',
        options: [
          { id: 'a', text: 'Nothing, because user did not change', explanation: 'The value object is new, so Object.is fails.' },
          { id: 'b', text: 'Every consumer re-renders because the value object is new', explanation: 'Correct — memoize it with useMemo([user]).' },
          { id: 'c', text: 'Only consumers wrapped in memo re-render', explanation: 'memo does not affect context updates.' },
          { id: 'd', text: 'React warns and skips the update', explanation: 'No warning; it re-renders.' },
        ],
        correctOptionId: 'b',
        explanation: 'Context compares the provider value with Object.is. A new object literal each render notifies all consumers.',
        sourceIds: ['react-context', 'mdn-object-is'],
      },
      {
        id: 'm2',
        question: 'Which state belongs in the URL?',
        options: [
          { id: 'a', text: 'The text of an unsent note', explanation: 'Local, private, high-frequency — component state.' },
          { id: 'b', text: 'Search filters and the selected candidate on a dashboard', explanation: 'Correct — they should survive refresh and be shareable.' },
          { id: 'c', text: 'The authenticated user object', explanation: 'Sensitive and app-wide — never in the URL.' },
          { id: 'd', text: 'The fetched candidate list', explanation: 'Server state — a cache keyed by the filters.' },
        ],
        correctOptionId: 'b',
        explanation: 'Put state in the URL when it identifies what the user is looking at and should survive refresh, back/forward and sharing.',
        sourceIds: ['react-sharing-state'],
      },
      {
        id: 'm3',
        question: 'Why do selector-based stores built on `useSyncExternalStore` avoid the context re-render problem?',
        options: [
          { id: 'a', text: 'They run components in a Web Worker', explanation: 'Rendering stays on the main thread.' },
          { id: 'b', text: 'Each component subscribes to the store and re-renders only when its selected snapshot changes', explanation: 'Correct.' },
          { id: 'c', text: 'They disable React reconciliation', explanation: 'Reconciliation still happens.' },
          { id: 'd', text: 'They batch all updates into one per second', explanation: 'No such throttling.' },
        ],
        correctOptionId: 'b',
        explanation: 'useSyncExternalStore compares the snapshot each subscriber reads; components whose slice is unchanged do not re-render.',
        sourceIds: ['react-usesyncexternalstore'],
      },
    ],
    followUps: [
      { id: 'f1', level: 'mechanism', question: 'Why split state and dispatch into two contexts?', expectedConcepts: ['dispatch is stable', 'action-only consumers never re-render', 'value changes only notify readers'], sourceIds: ['react-context'] },
      { id: 'f2', level: 'application', question: 'Implement an optimistic stage move with rollback.', expectedConcepts: ['update cache first', 'snapshot previous', 'rollback on error', 'invalidate on settle', 'useOptimistic in React 19'], sourceIds: ['react-useoptimistic'] },
      { id: 'f3', level: 'edge-cases', question: 'Two recruiters move the same candidate at the same time. What should the UI do?', expectedConcepts: ['version or updatedAt check', '409 conflict', 'refetch and show latest', 'real-time updates via WebSocket/SSE'], sourceIds: ['react-useoptimistic'] },
      { id: 'f4', level: 'architecture', question: 'When would you introduce Redux/Zustand instead of context plus a query library?', expectedConcepts: ['complex client-only state', 'many writers', 'devtools/time travel', 'selector subscriptions'], sourceIds: ['react-usesyncexternalstore'] },
    ],
  },
];
