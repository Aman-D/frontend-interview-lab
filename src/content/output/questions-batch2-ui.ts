import type { OutputQuestion, Research } from '../schema';

/**
 * Track 5 — output prediction, batch 2: DOM events/observers (jsdom) and React 18 rendering (react-jsdom).
 * Every snippet is original. Every `expectedOutput` is verified by executing `code` in
 * `questions-batch2-ui.test.ts` (jsdom 25 for DOM snippets, React 18.3.1 + createRoot for React snippets).
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
  const hasBfe = evidence.some((e) => e.sourceId === 'bfe-quiz');
  return {
    provenance: 'DOCUMENTED_TECHNICAL_EXERCISE',
    frequencyConfidence: hasBfe ? 'MEDIUM_CONFIDENCE' : 'LOW_CONFIDENCE',
    verificationStatus: 'SOURCES_VERIFIED',
    lastVerified: LAST_VERIFIED,
    evidence,
    researchNotes,
  };
}

const DOM_PROMPT = 'Browser DOM (document.body starts empty). What is printed, in order?';
const REACT_PROMPT =
  'React 18 (createRoot, no StrictMode). `React`, `createRoot`, `act` and `document` are already in scope. What is printed, in order?';
const REACT_FLUSHSYNC_PROMPT =
  'React 18 (createRoot, no StrictMode). `React`, `createRoot`, `act`, `document` and `flushSync` (from react-dom) are already in scope. What is printed, in order?';

const MDN_BUBBLING = doc('mdn-event-bubbling', 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Event_bubbling', 'Event bubbling');
const MDN_STOP = doc('mdn-stoppropagation', 'https://developer.mozilla.org/en-US/docs/Web/API/Event/stopPropagation', 'Event: stopPropagation() method');
const MDN_ADD = doc('mdn-addeventlistener', 'https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener', 'EventTarget: addEventListener() method');
const MDN_MICROTASK = doc('mdn-microtask', 'https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide', 'Using microtasks in JavaScript with queueMicrotask()');
const MDN_EVENT_LOOP = doc('mdn-event-loop', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Event_loop', 'The event loop');
const R_SYNC_EFFECTS = doc('react-sync-effects', 'https://react.dev/learn/synchronizing-with-effects', 'Synchronizing with Effects');
const R_USEEFFECT = doc('react-useeffect', 'https://react.dev/reference/react/useEffect', 'useEffect');
const R_QUEUEING = doc('react-queueing', 'https://react.dev/learn/queueing-a-series-of-state-updates', 'Queueing a Series of State Updates');
const R_PRESERVING = doc('react-preserving-state', 'https://react.dev/learn/preserving-and-resetting-state', 'Preserving and Resetting State');
const R_NO_EFFECT = doc('react-no-effect', 'https://react.dev/learn/you-might-not-need-an-effect', 'You Might Not Need an Effect');
const R_CONTEXT = doc('react-context', 'https://react.dev/learn/passing-data-deeply-with-context', 'Passing Data Deeply with Context');

const base = { schemaVersion: 1, kind: 'output', execution: 'output', track: 'output' } as const;

export const OUTPUT_QUESTIONS_BATCH2_UI: OutputQuestion[] = [
  // ───────────────────────────── DOM (jsdom) ─────────────────────────────
  {
    ...base,
    id: 'out-dom-stop-immediate-propagation',
    slug: 'dom-stop-immediate-propagation',
    title: 'stopPropagation vs. stopImmediatePropagation',
    difficulty: 'medium',
    priority: 'P0',
    seniority: ['Senior', 'SDE-2', 'SDE-3'],
    topics: ['DOM events', 'stopPropagation', 'stopImmediatePropagation', 'listener order'],
    estimatedMinutes: 3,
    conceptIds: ['event-propagation'],
    research: research(
      [MDN_STOP, MDN_ADD],
      'No BFE.dev quiz covers DOM propagation control. MDN documents that stopPropagation() lets the remaining listeners on the current target run while stopImmediatePropagation() does not. Verified in jsdom 25; jsdom follows the DOM spec dispatch algorithm here, so browsers print the same.',
    ),
    environment: 'jsdom',
    prompt: DOM_PROMPT,
    code: `const card = document.createElement('div');
const btn = document.createElement('button');
card.appendChild(btn);
document.body.appendChild(card);
let mode = 'stop';
card.addEventListener('click', () => console.log('card capture'), true);
card.addEventListener('click', () => console.log('card bubble'));
btn.addEventListener('click', () => console.log('A'));
btn.addEventListener('click', (e) => {
  console.log('B ' + mode);
  if (mode === 'stop') e.stopPropagation();
  else e.stopImmediatePropagation();
});
btn.addEventListener('click', () => console.log('C'));
btn.click();
console.log('--');
mode = 'immediate';
btn.click();`,
    expectedOutput: ['card capture', 'A', 'B stop', 'C', '--', 'card capture', 'A', 'B immediate'],
    steps: [
      'Each click starts with the capture phase, so the capturing listener on the card runs first: "card capture". Stopping propagation later cannot undo listeners that already ran.',
      'At the target, the button\'s listeners run in registration order: "A", then "B stop".',
      'stopPropagation() sets the "stop propagation" flag, which is checked between targets, not between listeners: the remaining listener on the same element still runs → "C".',
      'Propagation then stops before the bubble phase reaches the card, so "card bubble" never prints.',
      'click() is synchronous, so "--" appears after the whole first dispatch.',
      'Second click: "card capture", "A", "B immediate". stopImmediatePropagation() also sets the "stop immediate propagation" flag, so C is skipped as well as every ancestor\'s bubble listener.',
    ],
    misconceptions: [
      'stopPropagation() does not skip the other listeners on the same element — only stopImmediatePropagation() does.',
      'Stopping propagation in a target listener does not "un-run" capturing ancestor listeners; they already executed.',
      'Neither method cancels the default action; that is preventDefault().',
    ],
    followUp: {
      question: 'Why can a stopImmediatePropagation() call in one library break another library\'s listener on the same element?',
      answer:
        'Listeners on one target run in registration order. If library X registers first and calls stopImmediatePropagation(), every later listener on that element (and all ancestors) is skipped, so library Y silently stops working. The outcome depends on load order, which is why stopping propagation should be a last resort; a capture-phase listener on an ancestor is the usual way to run "before everyone else".',
    },
    docSourceIds: ['mdn-stoppropagation', 'mdn-addeventlistener'],
  },
  {
    ...base,
    id: 'out-dom-once-and-removal-during-dispatch',
    slug: 'dom-once-and-removal-during-dispatch',
    title: '{ once: true } and changing listeners mid-dispatch',
    difficulty: 'hard',
    priority: 'P1',
    seniority: ['SDE-2', 'SDE-3', 'MTS'],
    topics: ['DOM events', 'addEventListener', 'once', 'removeEventListener', 'dispatch algorithm'],
    estimatedMinutes: 5,
    conceptIds: ['event-propagation'],
    research: research(
      [MDN_ADD],
      'No BFE.dev quiz covers listener mutation during dispatch. MDN (addEventListener) documents `once`, de-duplication of identical listeners, and that a listener added during dispatch is not triggered by that dispatch. The DOM spec\'s "removed" flag explains why a listener removed mid-dispatch is skipped. Verified in jsdom 25, which implements the spec algorithm; browsers agree.',
    ),
    environment: 'jsdom',
    prompt: DOM_PROMPT,
    code: `const btn = document.createElement('button');
const a = () => console.log('a (once)');
const b = () => {
  console.log('b removes c');
  btn.removeEventListener('click', c);
};
const c = () => console.log('c');
const d = () => {
  console.log('d adds e');
  btn.addEventListener('click', e);
};
const e = () => console.log('e');
btn.addEventListener('click', a, { once: true });
btn.addEventListener('click', b);
btn.addEventListener('click', c);
btn.addEventListener('click', d);
btn.click();
console.log('--');
btn.click();`,
    expectedOutput: ['a (once)', 'b removes c', 'd adds e', '--', 'b removes c', 'd adds e', 'e'],
    steps: [
      'Events dispatch on detached elements too; the button just has no ancestors.',
      'At the start of the dispatch the browser takes a snapshot (clone) of the listener list: [a, b, c, d].',
      'a runs and, because of { once: true }, is removed before its callback is invoked: "a (once)".',
      'b removes c. c is still in the snapshot, but removing a listener marks it as removed, and removed listeners are skipped — so "c" never prints.',
      'd adds e. e is not in the snapshot, so it does not run during this dispatch: "d adds e" and then the dispatch ends.',
      'Second click: the list is now [b, d, e]. b tries to remove c again (no-op), d tries to add e again (ignored — identical type/callback/capture is de-duplicated), and e runs: "b removes c", "d adds e", "e".',
    ],
    misconceptions: [
      'A listener removed during dispatch still runs because the list was copied — no: the copy holds the same listener records, which are flagged as removed and skipped.',
      'A listener added during dispatch runs at the end of the current dispatch — no: it first runs on the next dispatch.',
      'Calling addEventListener twice with the same function adds two listeners — no, identical (type, callback, capture) registrations are ignored.',
    ],
    followUp: {
      question: 'Does `{ once: true }` behave differently from calling removeEventListener inside the callback?',
      answer:
        'Observably almost the same, but `once` removes the listener before the callback runs, so even if the callback throws or re-dispatches the same event type synchronously, it will not run again. It also avoids needing a named function reference. An AbortController `signal` option is the modern way to remove many listeners at once.',
    },
    docSourceIds: ['mdn-addeventlistener'],
  },
  {
    ...base,
    id: 'out-dom-target-vs-current-target',
    slug: 'dom-target-vs-current-target',
    title: 'target vs. currentTarget in a delegated handler',
    difficulty: 'medium',
    priority: 'P0',
    seniority: ['Senior', 'SDE-2', 'SDE-3'],
    topics: ['DOM events', 'event delegation', 'event.target', 'event.currentTarget', 'closest'],
    estimatedMinutes: 4,
    conceptIds: ['event-delegation', 'event-propagation'],
    research: research(
      [MDN_BUBBLING],
      'No BFE.dev quiz covers delegation. MDN "Event bubbling" covers event delegation and the difference between target and currentTarget. Verified in jsdom 25 (currentTarget is reset to null after dispatch, as the DOM spec requires and browsers do).',
    ),
    environment: 'jsdom',
    prompt: DOM_PROMPT,
    code: `document.body.innerHTML =
  '<ul id="menu"><li data-id="1"><b>One</b></li><li data-id="2">Two</li></ul>';
const menu = document.getElementById('menu');
let saved;
menu.addEventListener('click', (e) => {
  saved = e;
  const item = e.target.closest('li');
  console.log(e.target.tagName + ' | ' + e.currentTarget.id + ' | ' + (item ? item.dataset.id : 'none'));
});
menu.querySelector('b').click();
menu.querySelector('[data-id="2"]').click();
menu.click();
console.log('after: ' + (saved.currentTarget === null) + ' ' + saved.target.tagName);`,
    expectedOutput: ['B | menu | 1', 'LI | menu | 2', 'UL | menu | none', 'after: true UL'],
    steps: [
      'There is a single listener on the <ul>; clicks on descendants reach it by bubbling.',
      'Clicking <b>: e.target is the innermost element that was clicked (B), e.currentTarget is the element whose listener is running (the ul, id "menu"). closest("li") walks up from B to the first <li> → data-id 1.',
      'Clicking the second <li>: target is that LI; closest() includes the element itself, so it returns the same LI → 2.',
      'Clicking the <ul> itself: target is UL, and closest("li") finds no <li> ancestor → null → "none". A delegated handler must handle "clicked on the container, not an item".',
      'After dispatch finishes, the event object\'s currentTarget is reset to null, but target still points at the UL: "after: true UL".',
    ],
    misconceptions: [
      'e.target is not the element the listener was attached to — that is e.currentTarget.',
      'Checking e.target.tagName === "LI" breaks as soon as an item contains markup; use closest() (and check the result is inside the container).',
      'Reading e.currentTarget later (e.g. in a setTimeout or after an await) does not give the element — it is null once dispatch is over.',
    ],
    followUp: {
      question: 'Why should a delegated handler also check `menu.contains(item)`?',
      answer:
        'closest() walks all the way up the document. If the delegating container is itself nested inside an <li> (e.g. a menu inside a list item), a click on the container\'s own padding would match the outer <li>. Checking that the match is a descendant of e.currentTarget keeps the handler scoped to its own items.',
    },
    docSourceIds: ['mdn-event-bubbling'],
  },
  {
    ...base,
    id: 'out-dom-mutation-observer-timing',
    slug: 'dom-mutation-observer-timing',
    title: 'When does a MutationObserver callback run?',
    difficulty: 'hard',
    priority: 'P1',
    seniority: ['SDE-2', 'SDE-3', 'MTS'],
    topics: ['MutationObserver', 'microtasks', 'event loop', 'setTimeout'],
    estimatedMinutes: 5,
    conceptIds: ['event-loop', 'promises'],
    research: research(
      [MDN_MICROTASK, MDN_EVENT_LOOP],
      'No BFE.dev quiz covers MutationObserver timing. MDN\'s microtask guide lists mutation observer callbacks among the work delivered through the microtask queue; the DOM spec queues one "mutation observer microtask" at the first mutation. Verified in jsdom 25. jsdom differs from browsers when an unobserved node is mutated earlier in the same task (jsdom/spec queue the microtask on any mutation; browsers only when an observer gets a record) — a first draft that appended the box to the body before queueing "promise 1" printed the observer first in jsdom. The final snippet avoids that case; its output was cross-checked in headless Chrome and matches jsdom (the first draft printed "promise 1" first in Chrome).',
    ),
    environment: 'jsdom',
    prompt:
      'Browser DOM. What is printed, in order? (The mutations happen inside their own setTimeout task so that no unrelated DOM mutation earlier in the same task affects microtask order — see the last step.)',
    code: `const box = document.createElement('div');
const mo = new MutationObserver((records) => {
  console.log('observer ' + records.map((r) => r.type).join(','));
});
mo.observe(box, { childList: true, attributes: true });
setTimeout(() => {
  setTimeout(() => console.log('timeout'), 0);
  Promise.resolve().then(() => console.log('promise 1'));
  box.setAttribute('data-step', '1');
  box.appendChild(document.createElement('span'));
  Promise.resolve().then(() => console.log('promise 2'));
  box.setAttribute('data-step', '2');
  console.log('task done');
}, 0);
console.log('script done');`,
    expectedOutput: ['script done', 'task done', 'promise 1', 'observer attributes,childList,attributes', 'promise 2', 'timeout'],
    steps: [
      'The script only sets things up and prints "script done"; the interesting code runs in its own task (the outer setTimeout), starting with an empty microtask queue.',
      'Inside that task, mutations are recorded synchronously, but the observer callback never runs synchronously: "task done" prints before any callback.',
      '"promise 1" is queued first. The first mutation (setAttribute) then queues a single "notify mutation observers" microtask behind it. Later mutations in the same task only append records; they do not queue another callback.',
      '"promise 2" is queued after the observer microtask.',
      'When the task ends, microtasks run FIFO: "promise 1", then the observer with all three records batched in order ("attributes,childList,attributes"), then "promise 2".',
      'The inner timer is a new task, so it runs only after the microtask queue is empty: "timeout".',
      'Environment note: the DOM spec (and jsdom, which follows it literally) queues the observer microtask at the first mutation of any node, even one nobody observes, while Blink/Gecko only queue it once a record is delivered to an observer. The snippet makes the observed box the first thing mutated in its task, so browsers and jsdom agree.',
    ],
    misconceptions: [
      'MutationObserver is not synchronous like the old Mutation Events — it batches records and delivers them in a microtask.',
      'It is not a macrotask like setTimeout; it runs before any timer or rendering.',
      'The observer does not run once per mutation; one callback receives every record collected since the microtask was queued.',
    ],
    followUp: {
      question: 'How can you read pending records synchronously, e.g. right before disconnecting?',
      answer:
        'mo.takeRecords() returns the queued MutationRecords and empties the queue, so the callback will not receive them. Call it before mo.disconnect() if you must not lose the last batch.',
    },
    docSourceIds: ['mdn-microtask', 'mdn-event-loop'],
  },
  {
    ...base,
    id: 'out-dom-dispatch-event-sync',
    slug: 'dom-dispatch-event-sync',
    title: 'dispatchEvent is synchronous; non-bubbling custom events',
    difficulty: 'medium',
    priority: 'P1',
    seniority: ['Senior', 'SDE-2', 'SDE-3'],
    topics: ['DOM events', 'CustomEvent', 'dispatchEvent', 'bubbles', 'preventDefault'],
    estimatedMinutes: 4,
    conceptIds: ['event-propagation'],
    research: research(
      [MDN_BUBBLING, MDN_ADD],
      'No BFE.dev quiz covers custom event dispatch. MDN documents bubbling, the capture option and that dispatchEvent() invokes listeners synchronously; the DOM spec states that the capture phase runs even when bubbles is false. Verified in jsdom 25; browsers agree.',
    ),
    environment: 'jsdom',
    prompt: DOM_PROMPT,
    code: `const panel = document.createElement('section');
const field = document.createElement('input');
panel.appendChild(field);
document.body.appendChild(panel);
panel.addEventListener('validate', (e) => console.log('panel capture ' + e.detail), true);
panel.addEventListener('validate', (e) => console.log('panel bubble ' + e.detail));
field.addEventListener('validate', (e) => {
  console.log('field ' + e.detail);
  e.preventDefault();
});
console.log('before');
const okA = field.dispatchEvent(new CustomEvent('validate', { detail: 'A' }));
console.log('after A ' + okA);
const okB = field.dispatchEvent(
  new CustomEvent('validate', { detail: 'B', bubbles: true, cancelable: true }),
);
console.log('after B ' + okB);`,
    expectedOutput: ['before', 'panel capture A', 'field A', 'after A true', 'panel capture B', 'field B', 'panel bubble B', 'after B false'],
    steps: [
      'dispatchEvent() runs every listener before it returns — there is no queueing — so "before" and "after …" bracket the listener output.',
      'Event A uses the CustomEvent defaults: bubbles false, cancelable false.',
      'Even a non-bubbling event has a capture phase: the capturing listener on the panel runs ("panel capture A"), then the target listener ("field A"). Only the bubble phase is skipped, so "panel bubble A" never prints.',
      'preventDefault() on a non-cancelable event is ignored, so dispatchEvent returns true: "after A true".',
      'Event B bubbles and is cancelable: capture, target, then "panel bubble B".',
      'This time preventDefault() takes effect, and dispatchEvent returns false (= "a listener cancelled it"): "after B false".',
    ],
    misconceptions: [
      'bubbles: false does not mean only the target hears the event — ancestors with capture listeners still do.',
      'dispatchEvent() is not asynchronous like postMessage; code after it runs after all the listeners.',
      'The return value is not "was it handled" — it is false only if the event was cancelable and a listener called preventDefault().',
    ],
    followUp: {
      question: 'If a listener throws during dispatchEvent(), does the exception propagate to the caller?',
      answer:
        'No. The error is reported (window "error" event / console) and dispatch continues with the next listener; dispatchEvent() still returns normally. This differs from calling the handler function directly, where the exception would propagate.',
    },
    docSourceIds: ['mdn-event-bubbling', 'mdn-addeventlistener'],
  },

  // ───────────────────────────── React (react-jsdom) ─────────────────────────────
  {
    ...base,
    id: 'out-react-layout-vs-passive-effects',
    slug: 'react-layout-vs-passive-effects',
    title: 'useLayoutEffect vs. useEffect across parent and child',
    difficulty: 'hard',
    priority: 'P1',
    seniority: ['SDE-2', 'SDE-3', 'MTS'],
    topics: ['React', 'useLayoutEffect', 'useEffect', 'commit phase', 'cleanup order'],
    estimatedMinutes: 6,
    conceptIds: ['react-effects'],
    research: research(
      [R_USEEFFECT, R_SYNC_EFFECTS],
      'No BFE.dev React output quiz found. react.dev\'s useEffect reference contrasts it with useLayoutEffect (which fires before the browser paints) and documents cleanup-before-setup. The exact interleaving across parent/child was verified by executing React 18.3.1 in jsdom.',
    ),
    environment: 'react-jsdom',
    prompt: REACT_PROMPT,
    code: `function useLogged(name) {
  React.useLayoutEffect(() => {
    console.log(name + ' layout');
    return () => console.log(name + ' layout cleanup');
  });
  React.useEffect(() => {
    console.log(name + ' effect');
    return () => console.log(name + ' effect cleanup');
  });
}
function Child() {
  useLogged('child');
  console.log('render child');
  return null;
}
function Parent() {
  useLogged('parent');
  console.log('render parent');
  return React.createElement(Child);
}
const root = createRoot(document.createElement('div'));
act(() => root.render(React.createElement(Parent)));
console.log('--');
act(() => root.render(React.createElement(Parent)));`,
    expectedOutput: [
      'render parent',
      'render child',
      'child layout',
      'parent layout',
      'child effect',
      'parent effect',
      '--',
      'render parent',
      'render child',
      'child layout cleanup',
      'parent layout cleanup',
      'child layout',
      'parent layout',
      'child effect cleanup',
      'parent effect cleanup',
      'child effect',
      'parent effect',
    ],
    steps: [
      'Render phase is top-down: "render parent", "render child". Calling a hook only registers the effect.',
      'Commit: React mutates the DOM, then runs layout effects synchronously in the same commit, children before parents: "child layout", "parent layout".',
      'Passive effects (useEffect) run after the commit — in a browser usually after paint; act() flushes them before returning — again child first: "child effect", "parent effect".',
      'On the update (no dependency arrays, so every effect re-runs) both components render again.',
      'During the mutation part of the commit, the old layout cleanups run (child, then parent); then the new layout effects run (child, then parent).',
      'Afterwards, the passive phase runs all old useEffect cleanups first (child, parent) and only then all new useEffect setups (child, parent).',
    ],
    misconceptions: [
      'useLayoutEffect is not "a useEffect that runs earlier in the same queue" — it runs synchronously inside the commit, before any passive effect of the whole tree.',
      'Parent effects do not fire before child effects; for both kinds, children fire first.',
      'Cleanups are not interleaved with setups per component; all cleanups of a kind run before any new setup of that kind.',
    ],
    followUp: {
      question: 'When is useLayoutEffect the right tool, and what does it cost?',
      answer:
        'When you must measure or mutate the DOM before the user sees the frame (tooltip positioning, scroll restoration) to avoid a visible flicker. It blocks painting until it finishes, and any setState inside it re-renders synchronously, so heavy work there directly delays the frame. It also does nothing during server rendering.',
    },
    docSourceIds: ['react-useeffect', 'react-sync-effects'],
  },
  {
    ...base,
    id: 'out-react-lazy-initial-state',
    slug: 'react-lazy-initial-state',
    title: 'Lazy vs. eager useState initial value',
    difficulty: 'easy',
    priority: 'P1',
    seniority: ['Senior', 'SDE-2'],
    topics: ['React', 'useState', 'lazy initializer', 'render cost'],
    estimatedMinutes: 3,
    conceptIds: ['react-state-batching', 'closures'],
    research: research(
      [R_PRESERVING, R_QUEUEING],
      'No BFE.dev React output quiz found, and the useState reference page is not in the source registry; react.dev\'s state pages describe state being kept per component instance between renders, which is why the initial value is only used on mount. Verified with React 18.3.1.',
    ),
    environment: 'react-jsdom',
    prompt: REACT_PROMPT,
    code: `function readDraft(label) {
  console.log('read ' + label);
  return 'saved';
}
function Editor() {
  const [eager] = React.useState(readDraft('eager'));
  const [lazy] = React.useState(() => readDraft('lazy'));
  const [rev, setRev] = React.useState(0);
  console.log('render ' + rev + ' ' + eager + ' ' + lazy);
  return React.createElement('button', { onClick: () => setRev((r) => r + 1) });
}
const container = document.createElement('div');
const root = createRoot(container);
act(() => root.render(React.createElement(Editor)));
act(() => container.querySelector('button').click());
act(() => container.querySelector('button').click());`,
    expectedOutput: [
      'read eager',
      'read lazy',
      'render 0 saved saved',
      'read eager',
      'render 1 saved saved',
      'read eager',
      'render 2 saved saved',
    ],
    steps: [
      'Mount: both initializers are needed. The argument expression readDraft("eager") is evaluated, then React calls the lazy initializer → "read eager", "read lazy", "render 0 saved saved".',
      'Each click re-renders Editor. Function arguments are always evaluated before useState is called, so readDraft("eager") runs again on every render — React simply ignores the result.',
      'The lazy form passes a function; React only calls it when the state is first created, so "read lazy" never prints again.',
      'Both state values stay "saved": after mount, useState returns the stored state regardless of the argument.',
    ],
    misconceptions: [
      'React does not "skip" the eager expression on re-renders — JavaScript evaluates it before React sees it; only its value is discarded.',
      'Changing the initial value argument later does not update the state.',
      'useState(readDraft()) and useState(readDraft) are not the same: the second passes the function as a lazy initializer.',
    ],
    followUp: {
      question: 'Under <StrictMode> in development, how many times does "read lazy" print on mount?',
      answer:
        'Twice. StrictMode double-invokes component bodies and initializer functions during development to surface impure code, so initializers must be pure (no side effects like logging, analytics or subscriptions). Production calls it once.',
    },
    docSourceIds: ['react-preserving-state', 'react-queueing'],
  },
  {
    ...base,
    id: 'out-react-ref-no-rerender',
    slug: 'react-ref-no-rerender',
    title: 'Mutating a ref does not re-render',
    difficulty: 'easy',
    priority: 'P0',
    seniority: ['Senior', 'SDE-2', 'SDE-3'],
    topics: ['React', 'useRef', 'rendering', 'stale UI'],
    estimatedMinutes: 3,
    conceptIds: ['react-state-batching', 'derived-state'],
    research: research(
      [R_NO_EFFECT, R_PRESERVING],
      'No BFE.dev React output quiz found, and the useRef reference page is not in the source registry; react.dev pages in the registry describe that only state updates schedule renders. Verified with React 18.3.1.',
    ),
    environment: 'react-jsdom',
    prompt: REACT_PROMPT,
    code: `function Tally() {
  const clicks = React.useRef(0);
  const [, forceRender] = React.useState(0);
  console.log('render ref=' + clicks.current);
  const bump = () => {
    clicks.current += 1;
    console.log('ref now ' + clicks.current);
  };
  return React.createElement('div', null,
    React.createElement('button', { id: 'bump', onClick: bump }),
    React.createElement('button', { id: 'show', onClick: () => forceRender((n) => n + 1) }),
    React.createElement('output', null, clicks.current));
}
const el = document.createElement('div');
const root = createRoot(el);
act(() => root.render(React.createElement(Tally)));
for (let i = 0; i < 3; i++) act(() => el.querySelector('#bump').click());
console.log('screen ' + el.querySelector('output').textContent);
act(() => el.querySelector('#show').click());
console.log('screen ' + el.querySelector('output').textContent);`,
    expectedOutput: ['render ref=0', 'ref now 1', 'ref now 2', 'ref now 3', 'screen 0', 'render ref=3', 'screen 3'],
    steps: [
      'Mount renders once with clicks.current = 0.',
      'Each bump mutates clicks.current. A ref is a plain mutable object that React does not track, so no render is scheduled: only "ref now 1/2/3" print.',
      'The DOM still shows the value from the last render: "screen 0". The screen and the ref are now out of sync.',
      'A state update (forceRender) triggers a render; the render reads the current ref value → "render ref=3".',
      'The new render output is committed, so the DOM finally shows 3.',
    ],
    misconceptions: [
      'Changing ref.current does not cause a re-render, even with act() around it.',
      'The ref value is not reset on re-render; it persists for the component\'s lifetime like state does.',
      'Reading a ref during render to drive UI is fragile — the UI only reflects it when something else happens to re-render.',
    ],
    followUp: {
      question: 'When is a ref the right choice over state?',
      answer:
        'For values that must persist across renders but should not affect the output: timer ids, the latest callback for a stable event handler, previous values used inside effects, DOM nodes, and "is mounted / in-flight request" flags. If the value appears in the JSX, it belongs in state.',
    },
    docSourceIds: ['react-no-effect', 'react-preserving-state'],
  },
  {
    ...base,
    id: 'out-react-flushsync-vs-batching',
    slug: 'react-flushsync-vs-batching',
    title: 'flushSync vs. automatic batching in a timeout',
    difficulty: 'hard',
    priority: 'P1',
    seniority: ['SDE-2', 'SDE-3', 'MTS'],
    topics: ['React', 'flushSync', 'automatic batching', 'setTimeout', 'createRoot'],
    estimatedMinutes: 5,
    conceptIds: ['react-state-batching', 'event-loop'],
    research: research(
      [R_QUEUEING, MDN_EVENT_LOOP],
      'No BFE.dev React output quiz found; react.dev "Queueing a Series of State Updates" documents batching. flushSync has no reference page in the source registry. The snippet runs inside act() so the test is deterministic; the observable order (flushSync commits before it returns, other updates are batched into one later render) matches React 18.3.1 with createRoot outside tests. Verified by executing React 18.3.1 in jsdom.',
    ),
    environment: 'react-jsdom',
    prompt: REACT_FLUSHSYNC_PROMPT + ' (The timeout body is wrapped in act() only so the test environment flushes React work; the batching behaviour is the same as in an app.)',
    code: `let setA, setB;
function Pair() {
  const [a, _setA] = React.useState(0);
  const [b, _setB] = React.useState(0);
  setA = _setA;
  setB = _setB;
  console.log('render a=' + a + ' b=' + b);
  return React.createElement('p', null, a + ',' + b);
}
const el = document.createElement('div');
const root = createRoot(el);
act(() => root.render(React.createElement(Pair)));
setTimeout(() => {
  act(() => {
    flushSync(() => setA(1));
    console.log('after flushSync: ' + el.textContent);
    setA(2);
    setB(2);
    console.log('after batched: ' + el.textContent);
  });
  console.log('after act: ' + el.textContent);
}, 0);`,
    expectedOutput: [
      'render a=0 b=0',
      'render a=1 b=0',
      'after flushSync: 1,0',
      'after batched: 1,0',
      'render a=2 b=2',
      'after act: 2,2',
    ],
    steps: [
      'Mount: "render a=0 b=0".',
      'With createRoot, updates inside a setTimeout are batched automatically (React 18 automatic batching), just like in event handlers.',
      'flushSync(fn) runs fn and then synchronously renders and commits the resulting update before returning: "render a=1 b=0", and the DOM already reads "1,0".',
      'setA(2) and setB(2) are queued, not rendered — the DOM still shows "1,0" right after them.',
      'When the batch is flushed (here at the end of act(); in an app on the scheduler\'s next tick), both updates are applied in one render: "render a=2 b=2".',
      'Only after that is the DOM "2,2".',
    ],
    misconceptions: [
      'In React 18 with createRoot, updates in timeouts/promises are no longer rendered one-by-one; they are batched like handler updates (legacy ReactDOM.render did not batch them).',
      'flushSync does not make every later setState synchronous — it only flushes the updates made inside its callback (plus anything already pending).',
      'Reading the DOM right after setState does not show the new value; you need flushSync (or a layout effect) for that.',
    ],
    followUp: {
      question: 'Give a legitimate use of flushSync and its cost.',
      answer:
        'Integrating with code that reads the DOM immediately after an update: e.g. adding a list item and then scrolling it into view in the same handler, or updating state before window.print(). It forces a synchronous render and commit (including layout effects), defeats batching and blocks the main thread, so it should be rare.',
    },
    docSourceIds: ['react-queueing'],
  },
  {
    ...base,
    id: 'out-react-memo-unstable-props',
    slug: 'react-memo-unstable-props',
    title: 'React.memo with inline objects and functions',
    difficulty: 'medium',
    priority: 'P0',
    seniority: ['Senior', 'SDE-2', 'SDE-3'],
    topics: ['React', 'React.memo', 'useMemo', 'useCallback', 'referential equality'],
    estimatedMinutes: 4,
    conceptIds: ['referential-equality', 'react-reconciliation-keys'],
    research: research(
      [R_NO_EFFECT, R_PRESERVING],
      'No BFE.dev React output quiz found, and the memo/useMemo/useCallback reference pages are not in the source registry; "You Might Not Need an Effect" covers useMemo for expensive values. memo compares props with Object.is per prop. Verified with React 18.3.1.',
    ),
    environment: 'react-jsdom',
    prompt: REACT_PROMPT,
    code: `const Chip = React.memo(function Chip({ name }) {
  console.log('render ' + name);
  return null;
});
function Toolbar() {
  const [n, setN] = React.useState(0);
  const style = { color: 'red' };
  const stableStyle = React.useMemo(() => ({ color: 'red' }), []);
  const stableClick = React.useCallback(() => {}, []);
  console.log('toolbar ' + n);
  return React.createElement('div', null,
    React.createElement('button', { onClick: () => setN(n + 1) }),
    React.createElement(Chip, { name: 'inline', style, onPick: () => {} }),
    React.createElement(Chip, { name: 'stable', style: stableStyle, onPick: stableClick }),
    React.createElement(Chip, { name: 'mixed', style: stableStyle, onPick: () => {} }),
    React.createElement(Chip, { name: 'primitive', size: 2 }));
}
const el = document.createElement('div');
const root = createRoot(el);
act(() => root.render(React.createElement(Toolbar)));
act(() => el.querySelector('button').click());`,
    expectedOutput: ['toolbar 0', 'render inline', 'render stable', 'render mixed', 'render primitive', 'toolbar 1', 'render inline', 'render mixed'],
    steps: [
      'Mount renders the toolbar and all four chips.',
      'The click updates Toolbar\'s state, so Toolbar re-renders and creates new elements for every child.',
      'React.memo compares each prop of the new and old props with Object.is (shallow comparison).',
      '"inline": both style and onPick are fresh objects/functions created during this render → not equal → re-render.',
      '"stable": useMemo and useCallback (empty deps) return the same references as last render, and name is the same string → skipped.',
      '"mixed": style is stable but onPick is a new arrow function; one changed prop is enough → re-render.',
      '"primitive": strings and numbers compare by value → skipped.',
    ],
    misconceptions: [
      'React.memo does not deep-compare props; { color: "red" } !== { color: "red" }.',
      'Memoising one prop is not enough — every non-primitive prop must be referentially stable for memo to help.',
      'useCallback does not make the child skip rendering by itself; it only helps when the child is memoised (or the function is an effect dependency).',
    ],
    followUp: {
      question: 'Would memo help if Chip also received `children` built with JSX in Toolbar?',
      answer:
        'No. JSX children are new element objects on every render, so the children prop always changes and memo always re-renders. You would have to memoise the children element itself, or restructure so the stable content is created higher up and passed through.',
    },
    docSourceIds: ['react-no-effect'],
  },
  {
    ...base,
    id: 'out-react-context-bypasses-memo',
    slug: 'react-context-bypasses-memo',
    title: 'Context updates reach memoised consumers',
    difficulty: 'medium',
    priority: 'P1',
    seniority: ['Senior', 'SDE-2', 'SDE-3', 'MTS'],
    topics: ['React', 'useContext', 'React.memo', 'Provider value', 'rendering'],
    estimatedMinutes: 4,
    conceptIds: ['react-context', 'referential-equality'],
    research: research(
      [R_CONTEXT],
      'No BFE.dev React output quiz found. react.dev "Passing Data Deeply with Context" documents that components read the closest provider value and re-render when it changes. That memo does not block a context change was verified by executing React 18.3.1 in jsdom.',
    ),
    environment: 'react-jsdom',
    prompt: REACT_PROMPT,
    code: `const Theme = React.createContext('light');
const Label = React.memo(function Label() {
  const theme = React.useContext(Theme);
  console.log('Label ' + theme);
  return null;
});
const Logo = React.memo(function Logo() {
  console.log('Logo');
  return null;
});
function App() {
  const [theme, setTheme] = React.useState('light');
  const [n, setN] = React.useState(0);
  console.log('App ' + theme + ' ' + n);
  return React.createElement(Theme.Provider, { value: theme },
    React.createElement('button', { id: 'count', onClick: () => setN(n + 1) }),
    React.createElement('button', { id: 'theme', onClick: () => setTheme('dark') }),
    React.createElement(Label), React.createElement(Logo));
}
const el = document.createElement('div');
const root = createRoot(el);
act(() => root.render(React.createElement(App)));
act(() => el.querySelector('#count').click());
act(() => el.querySelector('#theme').click());`,
    expectedOutput: ['App light 0', 'Label light', 'Logo', 'App light 1', 'App dark 1', 'Label dark'],
    steps: [
      'Mount renders App, Label (reading "light") and Logo.',
      'Clicking #count re-renders App. Label and Logo receive no props, so memo\'s shallow comparison says "same props" and both skip. The provider value is still "light" (Object.is equal), so no consumer is notified: just "App light 1".',
      'Clicking #theme re-renders App with value "dark". Logo still skips (same props, and it does not read the context).',
      'Label also has the same props, but it subscribes to Theme. When a provider\'s value changes, React walks the tree and schedules every consumer of that context, bypassing memo → "Label dark".',
    ],
    misconceptions: [
      'React.memo is a props comparison only; it never blocks updates from context the component reads (or from its own state).',
      'Wrapping consumers in memo does not prevent context-driven re-renders; you must split the context or stabilise its value.',
      'A provider re-rendering does not by itself re-render consumers — only a change of the value (by Object.is) does.',
    ],
    followUp: {
      question: 'Why is `<Ctx.Provider value={{ user, setUser }}>` a common performance bug, and how do you fix it?',
      answer:
        'The object literal is a new reference on every render of the provider\'s owner, so every consumer re-renders whenever the owner renders, even if user did not change. Memoise the value with useMemo([user]), or split state and setter into separate contexts so components that only dispatch do not re-render.',
    },
    docSourceIds: ['react-context'],
  },
  {
    ...base,
    id: 'out-react-same-state-bailout',
    slug: 'react-same-state-bailout',
    title: 'Setting state to the same value',
    difficulty: 'hard',
    priority: 'P1',
    seniority: ['SDE-2', 'SDE-3', 'MTS'],
    topics: ['React', 'useState', 'Object.is', 'bail-out', 'render count'],
    estimatedMinutes: 5,
    conceptIds: ['react-state-batching', 'referential-equality'],
    research: research(
      [R_QUEUEING],
      'No BFE.dev React output quiz found, and the useState reference (which notes that React may still call the component once before bailing out) is not in the source registry. The exact render counts below were verified by executing React 18.3.1 in jsdom.',
    ),
    environment: 'react-jsdom',
    prompt: REACT_PROMPT,
    code: `function Panel() {
  const [open, setOpen] = React.useState(false);
  const [filter, setFilter] = React.useState({ q: '' });
  console.log('render ' + open + ' ' + filter.q);
  return React.createElement('div', null,
    React.createElement('button', { id: 'close', onClick: () => setOpen(false) }),
    React.createElement('button', { id: 'open', onClick: () => setOpen(true) }),
    React.createElement('button', { id: 'reset', onClick: () => setFilter({ q: '' }) }));
}
const el = document.createElement('div');
const root = createRoot(el);
const click = (id) => {
  console.log('click ' + id);
  act(() => el.querySelector('#' + id).click());
};
act(() => root.render(React.createElement(Panel)));
click('close');
click('reset');
click('open');
click('open');
click('open');`,
    expectedOutput: [
      'render false ',
      'click close',
      'click reset',
      'render false ',
      'click open',
      'render true ',
      'click open',
      'render true ',
      'click open',
    ],
    steps: [
      'Mount: "render false " (filter.q is an empty string).',
      'click close: setOpen(false) while open is already false. Object.is(false, false) is true and the component has no pending work, so React bails out eagerly without rendering.',
      'click reset: setFilter({ q: "" }) passes a new object. Object.is compares references, not contents, so it is a change → "render false ".',
      'click open: false → true is a real change → "render true ".',
      'click open again: the value is the same, but React\'s eager bail-out only applies when neither the current fiber nor its alternate has pending work. Right after an update that is not yet true, so React renders the component once more ("render true "), sees the state is unchanged, and bails out of committing and of rendering children.',
      'click open a third time: now both fibers are clean, so the eager bail-out kicks in and nothing renders.',
    ],
    misconceptions: [
      'Setting the same primitive value is not always zero renders — React may call the component one extra time before bailing out. Never rely on render counts for correctness.',
      'Setting an object with identical contents is not a no-op; Object.is sees a new reference.',
      'The extra render is not a commit: children are not re-rendered and effects do not run.',
    ],
    followUp: {
      question: 'How would you make `reset` a true no-op when the filter is already empty?',
      answer:
        'Return the previous state from an updater when nothing changes: setFilter(prev => (prev.q === "" ? prev : { q: "" })). Returning the same reference lets Object.is detect "no change". Alternatively store the primitive q instead of a wrapper object.',
    },
    docSourceIds: ['react-queueing'],
  },
];
