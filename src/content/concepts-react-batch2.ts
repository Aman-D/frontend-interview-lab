import type { Concept } from './schema';

/**
 * React concepts, batch 2. Original explanations, checked against the official
 * documentation referenced by `docSourceIds` (see ./sources.ts).
 * Code fences use `~~~` so the markdown can live inside template literals.
 */
export const REACT_BATCH2_CONCEPTS: Concept[] = [
  {
    id: 'controlled-uncontrolled',
    title: 'Controlled vs uncontrolled components',
    area: 'React',
    summary: 'A controlled component gets its current value from props and reports changes through a callback; an uncontrolled one owns the value in internal state (or the DOM) and only takes an initial value.',
    definition: `A component is **controlled** when its parent fully specifies the value through props (\`value\` + \`onChange\`, \`open\` + \`onOpenChange\`). It is **uncontrolled** when it keeps that value in its own state and the parent can only seed it (\`defaultValue\`). For native inputs React enforces this; for custom components the terms describe a design, and most components mix both.`,
    whyItExists: `Uncontrolled components are cheap to use (no wiring) but cannot be coordinated: a parent cannot reset them, sync two of them, or validate before a change lands. **Lifting state up** to the closest common parent and passing it down as props makes the child controlled so siblings can share one source of truth.`,
    mechanism: `- **Native inputs**: with a string \`value\`, React forces the DOM value back to the prop after every change event; if \`onChange\` does not update the state, typing appears to do nothing. \`value\` without \`onChange\` (and without \`readOnly\`) produces a console error.
- **Mode is decided by presence**: \`value={undefined}\` (or \`null\`) means "uncontrolled". Going from \`undefined\` to a string later triggers "A component is changing an uncontrolled input to be controlled". Initialise state to \`''\` or pass \`value ?? ''\`. Checkboxes use \`checked\`/\`defaultChecked\` and must always receive a boolean.
- **Custom components supporting both** pick the mode with \`props.value !== undefined\`, never truthiness, because \`0\`, \`''\` and \`false\` are legitimate controlled values. Fix the mode on first render and warn if it flips.
- **Resetting** an uncontrolled component: change its \`key\`, which makes React unmount it and mount a fresh instance with fresh state.`,
    example: `A \`<Rating>\` used in a settings form is controlled (the form owns the score and validates it); the same component on a product card is uncontrolled with \`defaultValue={3}\`.`,
    codeWalkthrough: `~~~tsx
type Props = { value?: number; defaultValue?: number; onChange?: (v: number) => void };

function Stepper({ value, defaultValue = 0, onChange }: Props) {
  const [isControlled] = useState(value !== undefined);
  const [internal, setInternal] = useState(defaultValue);
  if (isControlled !== (value !== undefined) && import.meta.env.DEV) {
    console.error('Stepper switched between controlled and uncontrolled');
  }
  const current = isControlled ? (value as number) : internal;
  function set(next: number) {
    if (!isControlled) setInternal(next);
    onChange?.(next);
  }
  return <button onClick={() => set(current + 1)}>{current}</button>;
}

<Stepper value={0} onChange={setCount} />;  // controlled, even though 0 is falsy
<Stepper key={formId} defaultValue={5} />;   // uncontrolled; new key = reset
~~~

1. The mode is captured once with \`value !== undefined\`; \`value={0}\` stays controlled. A \`value ? … : …\` check would silently treat it as uncontrolled.
2. In controlled mode the internal state is ignored and \`onChange\` is the only way the value moves — the parent may reject or transform it.
3. In uncontrolled mode the component updates itself and still notifies the parent.
4. Changing \`key\` discards the uncontrolled instance's state; there is no imperative "reset" needed.`,
    misconceptions: [
      '"Controlled" is a React API flag — for custom components it only describes who owns the value; React itself only enforces it for native form elements.',
      'Passing `value` alone makes an input editable — without `onChange` it is read-only and React logs an error.',
      '`value={null}` is an empty controlled input — React treats `null`/`undefined` as uncontrolled; use `\'\'`.',
    ],
    failureCases: [
      'State fetched from an API starts as `undefined`, so the input mounts uncontrolled and flips to controlled when data arrives (React warning; typed text may be overwritten).',
      'A component checks `if (props.value)` to detect controlled mode, so `value={0}` or `checked={false}` falls back to internal state and ignores the parent.',
      'A parent tries to "reset" an uncontrolled child by changing `defaultValue`, which is only read on mount; nothing happens.',
    ],
    productionImplications: `Pick one owner per piece of state. Design-system components should accept both \`value\` and \`defaultValue\`, decide mode with \`!== undefined\`, warn on mode switches, and keep \`onChange\` firing in both modes. Normalise server data (\`?? ''\`) before it reaches inputs, and prefer \`key\`-based resets over imperative handles.`,
    docSourceIds: ['react-sharing-state', 'react-preserving-state'],
    interviewQuestions: [
      'Design a `<Toggle>` that works both controlled and uncontrolled. How do you decide which mode you are in?',
      'Why does React warn when an input switches from uncontrolled to controlled, and how do you fix it at the source?',
      'Two sibling inputs must stay in sync. Walk through lifting state up.',
      'How would you reset a complex uncontrolled form to its initial values without an imperative API?',
    ],
    related: ['derived-state', 'react-reconciliation-keys', 'react-state-batching', 'react-context'],
  },
  {
    id: 'derived-state',
    title: 'Derived state (you might not need an effect)',
    area: 'React',
    summary: 'Anything that can be computed from props and existing state should be computed during render, not copied into state and kept in sync with an effect.',
    definition: `**Derived state** is a value fully determined by other props/state — a filtered list, a total, a "can submit" flag, the current page's rows. The rule: store the minimal source of truth, compute the rest during render. If the computation is expensive, cache it with \`useMemo\`; do not mirror it into \`useState\` and patch it from \`useEffect\`.`,
    whyItExists: `Copying derived data into state creates two sources of truth. Effects run after commit, so the sync lags one render: React renders and commits with the stale value, then the effect sets state and triggers a second render — an extra pass over the subtree, a stale frame, and cascades when effects chain.`,
    mechanism: `- **Compute inline**: \`const visible = rows.filter(…).sort(…)\` runs on every render — usually cheap enough.
- **\`useMemo\` for expensive work only**: it skips recomputation when dependencies are \`Object.is\`-equal. It does not make the first render faster, and the calculation must be pure. Measure first (the docs suggest ~1ms+ as a threshold).
- **Resetting all state on an identity change**: give the component a \`key\` (\`<Profile key={userId} />\`).
- **Adjusting part of state on a prop change**: store the previous prop and compare during render. Setting your own state during render makes React discard the JSX and retry immediately, before children render or the DOM updates. The guard prevents a loop; only the same component's state may be set.
- **Best of all**: store an id or index and derive the object, so nothing needs adjusting.`,
    example: `A paginated table keeps \`query\`, \`sort\` and \`page\` in state. Rows are derived. If filtering shrinks the result to 2 pages while \`page\` is 5, clamp during render instead of "fixing" \`page\` in an effect.`,
    codeWalkthrough: `~~~tsx
function ResultsTable({ rows }: { rows: Row[] }) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const PAGE = 20;

  // Derived — no state, no effect.
  const filtered = useMemo(
    () => rows.filter((r) => r.name.toLowerCase().includes(query.toLowerCase())),
    [rows, query],
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE));
  const safePage = Math.min(page, pageCount - 1); // clamp during render
  const visible = filtered.slice(safePage * PAGE, (safePage + 1) * PAGE);

  // Avoid: useEffect(() => setVisible(...), [rows, query, page]);
  return (/* input calls setQuery(v) and setPage(0); pager uses safePage */ null);
}
~~~

1. \`filtered\`, \`pageCount\`, \`visible\` are pure functions of \`rows\`, \`query\` and \`page\`; they can never be out of sync.
2. \`useMemo\` is justified only if \`rows\` is large; with 50 rows, inline is fine.
3. \`safePage\` clamps without writing state; nothing reads \`page\` unclamped. Resetting to page 0 on a new query happens in the input's event handler, not an effect.
4. The effect version would commit a render with the old \`visible\`, then render again — two passes and a frame where the table and the filter disagree.`,
    misconceptions: [
      'Every derived value needs `useMemo` — memoisation has its own cost and only helps for genuinely expensive, pure computations with stable dependencies.',
      'Syncing in `useEffect` is merely "slightly slower" — it renders and commits with stale data first, and chained effects cascade into multiple renders.',
      'Setting state during render is always forbidden — adjusting the same component\'s state behind a guard is a documented pattern, though `key` or pure derivation is preferred.',
    ],
    failureCases: [
      'A `fullName` state synced from `firstName`/`lastName` in an effect shows the old name for one commit and breaks if another code path sets `fullName` directly.',
      'An effect resets `selection` when `items` changes; children render with a selection that is no longer in the list and crash on `selection.id`.',
      'A page index is stored and never clamped, so deleting the last row on the last page shows an empty table.',
    ],
    productionImplications: `In review, treat \`useEffect(() => setX(f(a, b)), [a, b])\` as a smell. Keep state minimal (ids, not copies of objects), derive during render, put user-triggered resets in event handlers, and use \`key\` to reset whole subtrees. Measure before memoising; the React Compiler can remove most manual \`useMemo\`.`,
    docSourceIds: ['react-no-effect', 'react-useeffect'],
    interviewQuestions: [
      'A teammate filters a list in a `useEffect` and stores the result in state. What is wrong, concretely, in terms of renders and commits?',
      'When is `useMemo` worth it, and what does it not do?',
      'How do you reset a component\'s state when a `userId` prop changes? Give two approaches and their trade-offs.',
      'After filtering, the current page index is out of range. Where and how do you fix it?',
    ],
    related: ['react-effects', 'controlled-uncontrolled', 'react-state-batching', 'referential-equality', 'react-reconciliation-keys'],
  },
  {
    id: 'react-context',
    title: 'Context: providers, consumers & re-renders',
    area: 'React',
    summary: 'Context lets a provider expose a value to any descendant without prop drilling; every consumer re-renders when the provided value changes by `Object.is`.',
    definition: `\`createContext(defaultValue)\` creates a context object. A provider (\`<Ctx.Provider value={…}>\`, or \`<Ctx value={…}>\` in React 19) makes a value available to its subtree; \`useContext(Ctx)\` returns the value of the **closest provider above** the calling component, or \`defaultValue\` if there is none. It transports a value; it does not store state.`,
    whyItExists: `Theme, locale, the current user or a compound component's shared state are needed at many depths. Threading them through every layer ("prop drilling") couples components that do not care about the data; context skips the intermediate components.`,
    mechanism: `- **Lookup** walks up the tree from the consumer; a provider in the same component as the \`useContext\` call does not count. Nested providers override outer ones for their subtree.
- **Propagation**: when a provider renders with a value that is not \`Object.is\`-equal to the previous one, React re-renders **every** component that reads that context below it. \`React.memo\` on an intermediate component does not block this; consumers are updated directly.
- **Identity matters**: \`value={{ user, login }}\` creates a new object each render of the provider, so all consumers re-render even if \`user\` did not change. Wrap with \`useMemo\`/\`useCallback\`.
- **No selectors**: a consumer cannot subscribe to one field. Split contexts instead — e.g. a state context and a dispatch/actions context, since \`dispatch\` from \`useReducer\` is stable and components that only dispatch then never re-render on state changes.
- **Default value** is used only with no provider above, not when the provider passes \`undefined\`.`,
    example: `A \`<Tabs>\` compound component provides \`{ activeId, setActiveId }\`; each \`<Tab>\` reads it. Outside \`<Tabs>\`, a \`<Tab>\` should fail loudly rather than silently render with a default.`,
    codeWalkthrough: `~~~tsx
type Cart = { items: Item[] };
type Action = { type: 'add'; item: Item } | { type: 'remove'; id: string };

const CartState = createContext<Cart | null>(null);
const CartDispatch = createContext<Dispatch<Action> | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });
  return (
    <CartDispatch.Provider value={dispatch}>
      <CartState.Provider value={state}>{children}</CartState.Provider>
    </CartDispatch.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartState);
  if (ctx === null) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
~~~

1. \`null\` as the default makes "no provider" detectable; the custom hook throws a message that names the fix instead of failing later on \`undefined.items\`.
2. \`state\` comes from \`useReducer\`, so its identity only changes when the reducer returns a new object — no inline object literal.
3. \`dispatch\` is stable, so an "Add to cart" button that only reads \`CartDispatch\` never re-renders when items change.
4. Every \`useCart()\` consumer still re-renders on any cart change; if that is too broad, split further or use an external store with selectors.`,
    misconceptions: [
      'Context is a state manager — it holds no state; it broadcasts a value. The state lives in a `useState`/`useReducer` (or external store) above it.',
      '`React.memo` stops context updates — memo only compares props; context consumers re-render regardless.',
      'Only the consumers that use the changed field re-render — every consumer of that context re-renders on any value identity change.',
    ],
    failureCases: [
      'A provider value is an inline object, so typing in an unrelated input at the top of the app re-renders every consumer.',
      'A single "app context" bundles user, theme, cart and modals; any change re-renders the whole app.',
      'A consumer rendered outside the provider silently gets the default value (e.g. a no-op `setTheme`), so clicks do nothing and nothing errors.',
    ],
    productionImplications: `Use context for low-frequency, widely-needed values and compound components. Memoise provider values, split by update frequency (state vs actions), ship a custom hook that throws outside the provider, and reach for a store with selector subscriptions (\`useSyncExternalStore\`-based) when high-frequency data has many readers.`,
    docSourceIds: ['react-context'],
    interviewQuestions: [
      'What exactly re-renders when a context provider\'s value changes? Does `React.memo` help?',
      'How would you structure context so components that only dispatch actions do not re-render on state changes?',
      'Why is a `null` default plus a throwing custom hook better than a "realistic" default value?',
      'When would you choose prop drilling or composition (`children`) over context?',
      'Is context a replacement for Redux/Zustand? Where does it stop scaling?',
    ],
    related: ['referential-equality', 'controlled-uncontrolled', 'react-portals', 'react-state-batching'],
  },
  {
    id: 'react-portals',
    title: 'Portals (createPortal)',
    area: 'React',
    summary: '`createPortal` renders children into a different DOM node while keeping them in the same place in the React tree, so context and React event bubbling follow the component hierarchy, not the DOM.',
    definition: `\`createPortal(children, domNode, key?)\` returns a React node; React mounts \`children\` inside \`domNode\` (which must already exist) instead of inside the parent's DOM element. Only the **physical DOM placement** changes; for state, context and synthetic event propagation the content is still a child of the component that rendered it.`,
    whyItExists: `Modals, popovers, tooltips and toasts must visually escape their container. An ancestor with \`overflow: hidden\` clips them, and an ancestor that creates a **stacking context** (\`transform\`, \`opacity < 1\`, \`position\` + \`z-index\`, \`filter\`) caps their \`z-index\` no matter how high you set it. Rendering into \`document.body\` sidesteps both while keeping logic co-located.`,
    mechanism: `- **React events bubble through the React tree**: a click inside a portal triggers \`onClick\` on React ancestors even though the DOM nodes are not nested. Stop propagation inside the portal or move it up the tree if unwanted.
- **Native DOM listeners see the DOM tree**: a \`document\` "click outside" handler that checks \`containerRef.current.contains(event.target)\` treats clicks inside the portal as outside.
- **Context flows** from providers above the portal's owner.
- **Changing \`domNode\`** between renders recreates the portal content (state is lost).
- **Accessibility**: DOM order no longer matches reading/tab order. Move focus in on open, contain it, restore it to the trigger on close, and make the background \`inert\`. A native \`<dialog>\` opened with \`showModal()\` gets the top layer and background inertness for free.
- **SSR**: \`document\` does not exist on the server and the server renderer does not render portals, so render them only after mount on the client.`,
    example: `A dropdown inside a card with \`overflow: hidden\` gets clipped. Portalling it to \`document.body\` and positioning it from the trigger's \`getBoundingClientRect()\` fixes clipping; it still reads the card's theme context.`,
    codeWalkthrough: `~~~tsx
let lockCount = 0;
let previousOverflow = '';

function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    if (lockCount === 0) {
      previousOverflow = document.body.style.overflow; // may be 'auto', not ''
      document.body.style.overflow = 'hidden';
    }
    lockCount++;
    return () => {
      lockCount--;
      if (lockCount === 0) document.body.style.overflow = previousOverflow;
    };
  }, [active]);
}

function Modal({ open, children }: { open: boolean; children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useScrollLock(open);
  if (!open || !mounted) return null;
  return createPortal(<div role="dialog" aria-modal="true">{children}</div>, document.body);
}
~~~

1. \`mounted\` keeps the portal out of the server render and the first hydration pass, so markup matches.
2. The first lock saves whatever \`overflow\` was there before; the last unlock restores **that**, not \`''\`, which would wipe a page that intentionally set \`overflow\`.
3. The counter handles stacked modals: closing the inner one must not unlock scrolling while the outer one is still open. A per-instance "save and restore" would also restore in the wrong order if modals close out of order.
4. A click inside the dialog still bubbles to any \`onClick\` on \`Modal\`'s React ancestors.`,
    misconceptions: [
      'Events inside a portal bubble along the DOM — React synthetic events follow the React tree; only native listeners follow the DOM.',
      'A portal loses context from its parent — context, state and error boundaries work as if the content were rendered in place.',
      'Portals make a modal accessible — they only move DOM nodes; focus management, labelling and background inertness are still your job.',
    ],
    failureCases: [
      'A "click outside to close" handler using `ref.contains(event.target)` closes the menu when the user clicks an item rendered in a portal.',
      'Scroll lock restores `overflow` to `\'\'` on close, breaking a layout that set `overflow: auto` on the body; or closing a nested modal re-enables scrolling under the parent modal.',
      'Calling `createPortal(…, document.body)` during server rendering throws (`document` is not defined) or causes a hydration mismatch.',
    ],
    productionImplications: `Use a single layer root (\`#overlay-root\`) so stacking order is predictable, centralise scroll locking with a ref-count, and test "click outside" logic against portal content (check the React tree via a portal-aware ref list, or use the dialog's own backdrop). Prefer native \`<dialog>\` with \`showModal()\` where it fits; otherwise apply \`inert\` to the app root while the modal is open (React 18 does not treat \`inert\` as a boolean prop — set it with \`el.setAttribute('inert', '')\` from a ref or pass \`inert=""\`; React 19 accepts \`inert={true}\`).`,
    docSourceIds: ['react-create-portal', 'mdn-inert', 'react-context'],
    interviewQuestions: [
      'Why would a modal with `z-index: 9999` still render behind other content, and how does a portal help?',
      'A click inside a portalled menu triggers the parent card\'s `onClick`. Why, and how do you handle it?',
      'Implement body scroll locking that is correct for nested modals.',
      'What do you need to add, beyond a portal, to make a modal dialog accessible?',
      'How do portals interact with server-side rendering and hydration?',
    ],
    related: ['focus-management', 'event-propagation', 'react-context', 'react-effects'],
  },
];
