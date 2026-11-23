import type { Concept } from './schema';

/**
 * Accessibility concepts, batch 2: live regions and four APG widget patterns.
 * Original explanations, checked against the WAI-ARIA Authoring Practices and MDN
 * pages referenced by `docSourceIds` (see ./sources.ts).
 * Code fences use `~~~` so the markdown can live inside template literals.
 */
export const A11Y_BATCH2_CONCEPTS: Concept[] = [
  {
    id: 'aria-live-regions',
    title: 'ARIA live regions',
    area: 'Accessibility',
    summary: 'Regions marked with `aria-live` (or roles like `status`, `alert`, `log`) make assistive technology announce content changes that happen away from the user\'s focus.',
    definition: `A **live region** is an element whose content changes are announced by screen readers without moving focus. It is declared with \`aria-live="polite" | "assertive" | "off"\` or with a role that implies a politeness level: \`role="status"\` (polite), \`role="log"\` (polite, new entries appended) and \`role="alert"\` (assertive).`,
    whyItExists: `Sighted users notice a "Saved" badge or a toast appearing. A screen reader user hears only what is at their reading position, so asynchronous changes (results arriving, an upload finishing, a validation failure) are silent unless the page marks them for announcement.`,
    mechanism: `- **Politeness**: \`polite\` waits until the screen reader is idle; \`assertive\` usually interrupts the current speech and should be reserved for time-critical messages. \`off\` is not "never": changes are announced only while focus is inside the element.
- **What is read**: by default only the changed nodes (\`aria-relevant\` defaults to \`additions text\`). \`aria-atomic="true"\` makes the whole region be re-read, so "Item 3 of 12" is spoken in full instead of just "3". \`status\` and \`alert\` are atomic by default in ARIA 1.2.
- **The region must already exist.** AT observes regions it has registered; inserting \`<div aria-live="polite">Saved</div>\` in one go is often not announced. Render an empty region in the initial markup, then change its text in a later task. \`role="alert"\` is the documented exception: most browser/AT pairs announce it even when injected with content.
- Announcements are plain text. MDN suggests a redundant \`aria-live="polite"\` on \`status\`/\`log\`, but warns that \`role="alert"\` plus \`aria-live="assertive"\` double-speaks in iOS VoiceOver.`,
    example: `A filtered list keeps one \`role="status"\` element mounted and sets "24 results" after each debounced query. A failed save goes to a separate \`role="alert"\`: the user must act before continuing, so interrupting is justified.`,
    codeWalkthrough: `~~~tsx
function useAnnouncer() {
  const [msg, setMsg] = useState('');
  const announce = useCallback((text: string) => {
    setMsg('');                              // clear so repeats are re-announced
    window.setTimeout(() => setMsg(text), 50);
  }, []);
  const region = (
    <div role="status" aria-live="polite" className="visually-hidden">{msg}</div>
  );
  return { announce, region };
}
// Mount {region} once near the app root, on first render.
~~~

1. The region is rendered on first paint and never unmounted, so AT has registered it before the first message.
2. Clearing then setting in a later task turns "Saved" followed by "Saved" into two real DOM changes; identical text written twice is otherwise ignored.
3. \`visually-hidden\` (clip, not \`display: none\`) keeps it in the accessibility tree; \`display: none\` or \`hidden\` regions are never read.`,
    misconceptions: [
      '`aria-live="off"` silences an element completely — changes are still announced while focus is inside it.',
      'Conditionally rendering `<div aria-live="polite">{msg}</div>` works — the region usually must exist, empty, before its content changes.',
      'Everything important should be assertive — assertive interrupts speech; overuse causes users to miss what they were reading.',
      'Live regions can carry interactive content such as an Undo button — announcements are plain text and the button is not reachable from the announcement.',
    ],
    failureCases: [
      'A toast component mounts a fresh live region per toast, so screen readers announce nothing.',
      'A typeahead announces "N results" on every keystroke, flooding the speech queue (announcement fatigue); debounce the count instead.',
      'A "Slide 4 of 8" counter without `aria-atomic="true"` is announced as just "4".',
      'Inline field errors use `role="alert"` and fire on every keystroke, interrupting the user while typing.',
    ],
    productionImplications: `Provide one app-level announcer (polite + assertive regions) instead of ad-hoc regions per component. Announce outcomes, not progress ticks; debounce counts; keep toasts long enough to read and never put the only copy of an action in them. For form errors, use \`role="alert"\` for the submit-time summary and \`aria-invalid\` + \`aria-describedby\` for per-field messages. Verify with a real screen reader: behaviour varies across browser/AT pairs.`,
    docSourceIds: ['mdn-live-regions'],
    interviewQuestions: [
      'What is the difference between `role="status"`, `role="alert"` and `role="log"`?',
      'Why might a newly rendered live region not be announced, and how do you fix it?',
      'What does `aria-atomic` change, and when do you need it?',
      'How would you design a toast system that is accessible without causing announcement fatigue?',
      'Why are form submission errors usually announced with `role="alert"` but field hints are not?',
    ],
    related: ['async-ui-states', 'debouncing', 'carousel-aria-pattern', 'combobox-aria', 'focus-management'],
  },
  {
    id: 'dialog-aria-pattern',
    title: 'Modal dialog pattern',
    area: 'Accessibility',
    summary: 'A modal dialog takes focus on open, keeps Tab inside, closes on Escape, makes the page behind it inert, and returns focus to whatever opened it.',
    definition: `A **modal dialog** is a window layered over the page that users must deal with before returning to it. In ARIA terms the container has \`role="dialog"\` (or \`alertdialog\` for urgent confirmations), \`aria-modal="true"\`, and a name via \`aria-labelledby\` (a visible title) or \`aria-label\`; \`aria-describedby\` may point to a short description. The native \`<dialog>\` opened with \`showModal()\` provides most of this.`,
    whyItExists: `A dimmed backdrop does nothing for keyboard or screen reader users: Tab walks into the page behind and the virtual cursor reads content that is visually obscured. The pattern makes "only this window is active" true for every input method.`,
    mechanism: `Keyboard (APG): **Tab**/**Shift+Tab** cycle through the dialog's tabbable elements, wrapping at the ends; **Escape** closes.

- **Initial focus**: usually the first focusable element. For long or structured content, focus a static element (title or first paragraph with \`tabindex="-1"\`) and omit \`aria-describedby\`. For irreversible actions, focus the least destructive button. With \`<dialog>\`, use \`autofocus\`; never put \`tabindex\` on the \`<dialog>\` itself (MDN).
- **Return focus** to the invoker on close; if it no longer exists, to the next logical element.
- **Inert background**: \`showModal()\` puts the dialog in the top layer, renders the rest of the document inert and exposes \`aria-modal="true"\`. Without it, set the \`inert\` attribute on the app root (a dialog rendered through a portal is outside it). A hand-written Tab trap alone is not enough: screen reader browse mode ignores focus traps.
- \`aria-modal="true"\` is a promise: only set it when the background is truly non-interactive and visually obscured.
- **Scroll lock** is not provided by \`showModal()\`; lock it yourself.
- **Nested dialogs**: a second \`showModal()\` stacks on top; Escape closes the topmost; focus returns into the first dialog.`,
    example: `"Delete project?" opens from a row's menu. Focus lands on Cancel (least destructive); Escape returns focus to the menu button. On confirm, the row and its button are gone, so focus moves to the list heading instead.`,
    codeWalkthrough: `~~~tsx
function Modal({ open, onClose, title, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const d = ref.current!;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} aria-labelledby={titleId} onClose={onClose}>
      <h2 id={titleId}>{title}</h2>
      {children}
      <button onClick={onClose}>Close</button>
    </dialog>
  );
}
// CSS: html:has(dialog:modal) { overflow: hidden; }
~~~

1. React state is the source of truth; the effect maps it onto the imperative \`showModal()\`/\`close()\` API.
2. Escape fires \`cancel\` then \`close\`; listening to \`close\` keeps state in sync however the dialog was dismissed.
3. \`aria-labelledby\` names the dialog from its visible title; \`useId\` keeps ids unique.
4. The visible Close button is the APG-recommended always-present way out.
5. The \`:has(dialog:modal)\` rule locks page scroll while any modal is open.`,
    misconceptions: [
      'A focus trap makes a dialog modal — screen reader virtual cursors bypass it; the background must be inert or hidden from AT.',
      '`aria-modal="true"` makes the background inert — it only tells AT to ignore it; you must still block interaction yourself.',
      'Initial focus must always be the first input — APG recommends different targets for long content and destructive confirmations.',
      '`showModal()` also prevents background scrolling — it does not; scroll lock is a separate concern.',
    ],
    failureCases: [
      'A div-based modal rendered inside `#root` cannot inert its siblings without inerting itself; render it through a portal or use `<dialog>`.',
      'The dialog closes but focus is left on `<body>` because the invoker was unmounted (e.g. a menu that closed first).',
      'Escape in a nested date picker closes both the picker and the outer dialog because the keydown bubbled.',
      '`aria-modal="true"` is set on a non-modal side panel, so screen reader users cannot reach the page that sighted users can still click.',
    ],
    productionImplications: `Prefer native \`<dialog>\` with \`showModal()\`; it handles top layer, inertness, Escape and \`::backdrop\`. Still own initial focus, focus return when the invoker is gone, scroll lock, and Escape handling for nested popovers (stop propagation in the inner one). Test with a screen reader in browse mode, not just the keyboard.`,
    docSourceIds: ['apg-dialog-modal', 'mdn-dialog', 'mdn-inert'],
    interviewQuestions: [
      'Walk through every keyboard and focus behaviour of a modal dialog from open to close.',
      'What does `showModal()` give you that `show()` or the `open` attribute does not?',
      'Why is a JavaScript Tab trap insufficient on its own, and how does `inert` help?',
      'Where should initial focus go in a destructive confirmation dialog, and why?',
      'How do you handle Escape and focus return with nested dialogs or popovers?',
    ],
    related: ['focus-management', 'keyboard-navigation', 'react-portals', 'event-propagation', 'react-effects'],
  },
  {
    id: 'tabs-aria-pattern',
    title: 'Tabs pattern',
    area: 'Accessibility',
    summary: 'A `tablist` of `tab` elements controls which `tabpanel` is shown; the tab list is one Tab stop navigated with arrow keys, with automatic or manual activation.',
    definition: `The **tabs** pattern is a set of layered panels where one is visible at a time. The container has \`role="tablist"\` (named with \`aria-label\` or \`aria-labelledby\`); each \`role="tab"\` has \`aria-controls\` pointing to its \`role="tabpanel"\` and \`aria-selected\` (\`true\` on the active tab, \`false\` on the rest); each panel has \`aria-labelledby\` pointing back to its tab.`,
    whyItExists: `Plain buttons that swap content convey no relationship ("tab 2 of 4, selected") and put every tab in the Tab order. The pattern conveys structure and selection and makes the list a single Tab stop.`,
    mechanism: `Keyboard (APG, horizontal list):

- **Tab** into the list focuses the *active* tab; Tab again leaves the list for the panel (or its first focusable content).
- **Left/Right** move focus to the previous/next tab and wrap at the ends. **Home/End** (optional) go to the first/last tab.
- **Space/Enter** activate the focused tab if activation is not automatic.
- With \`aria-orientation="vertical"\`, Up/Down replace Left/Right. A horizontal list must not swallow Up/Down so the page can still scroll.
Focus uses **roving tabindex** (one tab with \`tabIndex=0\`).

**Automatic vs manual activation**: APG recommends automatic (selection follows focus) when panels display without noticeable latency, which usually means preloaded content. If showing a panel triggers a network request or heavy render, use **manual**: arrows only move focus and Enter/Space select, otherwise each arrow press costs a load.

**Disabled tabs**: APG convention keeps them focusable with \`aria-disabled="true"\` so screen reader users can discover them; activation is ignored.

**Panel focusability**: if a panel has no focusable content at its start, give it \`tabIndex=0\` so Tab from the list lands on it.`,
    example: `An account settings page has Profile / Security / Billing. Billing fetches invoices on display, so the widget uses manual activation: Right Arrow moves focus to "Billing" without loading; Enter selects it and the request starts once.`,
    codeWalkthrough: `~~~tsx
function onKeyDown(e: React.KeyboardEvent, i: number) {
  const n = tabs.length;
  const to = { ArrowRight: (i + 1) % n, ArrowLeft: (i - 1 + n) % n,
               Home: 0, End: n - 1 }[e.key];
  if (to !== undefined) {
    e.preventDefault();
    setFocused(to); refs.current[to]?.focus();
    if (mode === 'automatic' && !tabs[to].disabled) setSelected(to);
  } else if ((e.key === 'Enter' || e.key === ' ') && !tabs[i].disabled) {
    e.preventDefault(); setSelected(i);
  }
}
// <button role="tab" id={tabId(i)} aria-controls={panelId(i)}
//   aria-selected={i === selected} aria-disabled={t.disabled || undefined}
//   tabIndex={i === focused ? 0 : -1} />
// <div role="tabpanel" id={panelId(i)} aria-labelledby={tabId(i)}
//   hidden={i !== selected} tabIndex={0} />
~~~

1. Navigation keys compute the next index with wrap-around; Up/Down are untouched so the page still scrolls.
2. Focus and selection are separate state, which is what makes manual activation possible.
3. Disabled tabs are reachable (\`aria-disabled\`, not \`disabled\`) but cannot be selected.
4. Inactive panels use \`hidden\`, removing them from the accessibility tree; the visible panel is a Tab stop.
5. On blur, reset \`focused\` to \`selected\`: Tab back into the list must land on the active tab.`,
    misconceptions: [
      'Every tab should be in the Tab order — the tab list is a single Tab stop; arrows move between tabs.',
      'Automatic activation is always better — it is only recommended when panels appear without noticeable latency.',
      'Disabled tabs should use the `disabled` attribute — APG keeps them focusable with `aria-disabled` for discoverability.',
      'Tabs are right for page navigation — links that change the URL are navigation, not a tabs widget.',
    ],
    failureCases: [
      'Automatic activation on tabs that each fetch data fires a request per arrow press and makes the list painful to traverse.',
      'Inactive panels are hidden with `opacity: 0`, so screen readers read every panel.',
      'The tab list handles ArrowDown in a horizontal list and calls `preventDefault`, blocking page scrolling.',
      'A text-only panel has no `tabIndex=0`, so keyboard users Tab from the tab list straight past the content.',
    ],
    productionImplications: `Decide activation mode per product from panel cost. Keep focus and selection in separate state, generate ids with \`useId\`, and choose whether inactive panels unmount (resets their state) or stay mounted with \`hidden\` (preserves form input). For closable tabs, follow APG's optional Delete key rules and clamp the focused index.`,
    docSourceIds: ['apg-tabs'],
    interviewQuestions: [
      'List the roles and ARIA attributes in a tabs widget and how they reference each other.',
      'Automatic vs manual activation: what is the difference and how do you choose?',
      'What happens when the user presses Tab while focus is on a tab?',
      'How should disabled tabs behave for keyboard and screen reader users?',
      'Would you unmount inactive panels or hide them? What are the trade-offs?',
    ],
    related: ['keyboard-navigation', 'focus-management', 'controlled-uncontrolled', 'react-reconciliation-keys', 'carousel-aria-pattern'],
  },
  {
    id: 'radio-group-aria',
    title: 'Radio group pattern',
    area: 'Accessibility',
    summary: 'A radio group is one Tab stop where arrow keys move focus and check at the same time; native `<input type="radio">` gives this for free, custom `role="radio"` widgets must replicate it.',
    definition: `A **radio group** is a set of checkable options where at most one is checked. Natively it is \`<input type="radio">\` elements sharing a \`name\`, usually inside \`<fieldset>\` with a \`<legend>\`. In ARIA, the container has \`role="radiogroup"\` and each option \`role="radio"\` with \`aria-checked="true|false"\`.`,
    whyItExists: `Custom cards, segmented controls and star ratings built from clickable divs lose the native keyboard model and the "1 of 5, checked" announcement. Knowing the pattern lets you keep native semantics or reproduce them exactly.`,
    mechanism: `Keyboard (APG, group not inside a toolbar):

- **Tab/Shift+Tab** move into and out of the group. Entering focuses the **checked** radio, or the **first** one if none is checked.
- **Right/Down** move focus to the next radio **and check it**, unchecking the previous one; at the last radio they wrap to the first. **Left/Up** do the reverse.
- **Space** checks the focused radio if it is not already checked.

So the roving tab stop follows the checked value. Because arrows check, the keyboard cannot return a group to "nothing selected"; that is expected.

Inside a **toolbar** the model changes: arrows only move focus (so users can travel through the toolbar), and Space (optionally Enter) checks.

Labelling: the group needs a name (\`aria-labelledby\`/\`aria-label\`; natively \`<legend>\`), each radio is named by content, \`aria-labelledby\` or \`aria-label\`, and help text uses \`aria-describedby\`.

APG notes that some browsers focus the *last* native radio when Shift+Tabbing into an unchecked group.`,
    example: `A five-star rating is five radios in a group labelled "Rating". Visually they are SVG stars; a screen reader hears "3 of 5 stars, radio button, checked", and Right Arrow checks 4.`,
    codeWalkthrough: `~~~tsx
function Rating({ value, onChange }: { value: number | null; onChange(v: number): void }) {
  const refs = useRef<(HTMLSpanElement | null)[]>([]);
  const stop = value ?? 1;
  const move = (to: number) => { onChange(to); refs.current[to - 1]?.focus(); };
  return (
    <div role="radiogroup" aria-labelledby="rating-label">
      {[1, 2, 3, 4, 5].map((v) => (
        <span key={v} ref={(el) => { refs.current[v - 1] = el; }}
          role="radio" aria-checked={value === v} aria-label={v + ' of 5 stars'}
          tabIndex={v === stop ? 0 : -1}
          onClick={() => move(v)}
          onKeyDown={(e) => {
            const fwd = e.key === 'ArrowRight' || e.key === 'ArrowDown';
            const back = e.key === 'ArrowLeft' || e.key === 'ArrowUp';
            const next = fwd ? v % 5 + 1 : back ? (v + 3) % 5 + 1 : 0;
            if (next) { e.preventDefault(); move(next); }
            else if (e.key === ' ') { e.preventDefault(); onChange(v); }
          }}>
          <StarIcon filled={value !== null && v <= value} aria-hidden="true" />
        </span>
      ))}
    </div>
  );
}
~~~

1. The tab stop is the checked radio, or the first when \`value\` is null, matching APG's entry rule.
2. Arrow keys call \`move\`, which both checks and focuses: in this pattern focus and selection move together.
3. The modulo arithmetic wraps 5 → 1 and 1 → 5.
4. Space checks without moving; \`preventDefault\` stops page scroll.
5. The star graphic is \`aria-hidden\`; the name comes from \`aria-label\`. Visually hidden native radios would need none of this key handling.`,
    misconceptions: [
      'Arrow keys only move focus in a radio group — outside toolbars they move focus and check together.',
      'Each radio should be a Tab stop — the group is one Tab stop, landing on the checked radio.',
      'A star rating needs a custom slider role — APG models it as a radio group with one radio per value.',
    ],
    failureCases: [
      'Custom radios all have `tabIndex=0`, so a 10-option group takes 10 Tab presses to cross.',
      'The tab stop stays on the first radio after the user checks the third, so Tab back into the group lands on the wrong option.',
      'Native radios are hidden with `display: none` for styling, which removes them from the accessibility tree and keyboard order; use a visually hidden technique instead.',
      'The group has no accessible name, so screen readers announce "3 of 5 stars, radio button" with no question context.',
    ],
    productionImplications: `Default to native radios in \`<fieldset>\`/\`<legend>\`, styled via a visually hidden input or \`appearance: none\`: form submission, validation and the keyboard model come free. Use \`role="radio"\` only when markup cannot be native, and test arrow-checking, wrap-around and the tab stop following the value.`,
    docSourceIds: ['apg-radio'],
    interviewQuestions: [
      'Describe the keyboard behaviour of a radio group and how it differs from tabs with manual activation.',
      'Which radio receives focus when tabbing into a group, with and without a checked value?',
      'How would you build an accessible star rating?',
      'How does the radio group keyboard model change inside a toolbar, and why?',
    ],
    related: ['keyboard-navigation', 'tabs-aria-pattern', 'controlled-uncontrolled', 'focus-management'],
  },
  {
    id: 'carousel-aria-pattern',
    title: 'Carousel pattern',
    area: 'Accessibility',
    summary: 'A carousel is a labelled region of slides with previous/next controls; if it auto-rotates it needs a stop/start button and must pause on focus and hover, with live announcements off while rotating.',
    definition: `A **carousel** (slide show, image rotator) shows a subset of slides at a time. In APG's basic variant the container is a \`region\` (or \`group\`) with \`aria-roledescription="carousel"\` and a label; each slide is a \`group\` with \`aria-roledescription="slide"\` and a name. Controls are native buttons: previous, next and, for auto-rotating carousels, a rotation control.`,
    whyItExists: `With auto-rotation, a screen reader user reading slide 1 can suddenly hear slide 2 with no idea the context changed. Slides moved off-screen with transforms are still read, and motion can trigger vestibular symptoms.`,
    mechanism: `**Structure (APG)**:

- Container: \`aria-roledescription="carousel"\` and \`aria-label\`/\`aria-labelledby\`, without the word "carousel" (the role description already says it).
- Slides: \`role="group"\` + \`aria-roledescription="slide"\`, named by a visible heading or \`aria-label\`; if no unique names exist, use "3 of 10" (an accepted exception because groups do not support \`aria-posinset\`/\`aria-setsize\`). Do not include "slide" in the label.
- Optional live region on the slide wrapper: \`aria-atomic="false"\`, \`aria-live="off"\` while rotating automatically, \`"polite"\` otherwise, so manual next/previous is announced but auto-rotation is not.

**Rotation control** (required when auto-rotating): the first element in the carousel's Tab sequence, labelled for the action it will perform ("Stop slide rotation" / "Start slide rotation"), with no \`aria-pressed\`. Rotation stops when keyboard focus enters the carousel and does not resume unless the user activates the control; it also stops while the mouse hovers. Next/previous/rotation buttons do not move focus.

**Picker variants**: *tabbed* uses a \`tablist\` ("Choose slide to display") of tabs named "Slide 3", with slides as \`tabpanel\`s. *Grouped* uses one button per slide (one Tab stop each); APG marks the current one \`aria-disabled="true"\`, where many libraries use \`aria-current\`.

**Non-current slides** must be truly hidden (\`hidden\`, \`display: none\` or \`inert\`), not just translated away.`,
    example: `A hero rotates every 6 seconds. A keyboard user Tabs in: focus lands on "Stop slide rotation" and rotation halts. Pressing Next shows "2 of 4", which the now-polite live region announces.`,
    codeWalkthrough: `~~~tsx
const reduce = useMediaQuery('(prefers-reduced-motion: reduce)');
const [playing, setPlaying] = useState(!reduce);
const [paused, setPaused] = useState(false);              // hover / focus
const rotating = playing && !paused;
useEffect(() => {
  if (!rotating) return;
  const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), 6000);
  return () => clearInterval(id);
}, [rotating, slides.length]);

<section aria-roledescription="carousel" aria-label="Featured products"
  onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
  onFocus={() => setPlaying(false)}>
  <button onClick={() => setPlaying((p) => !p)}>
    {playing ? 'Stop slide rotation' : 'Start slide rotation'}
  </button>
  <div aria-live={rotating ? 'off' : 'polite'} aria-atomic="false">
    {slides.map((s, i) => (
      <div key={s.id} role="group" aria-roledescription="slide"
        aria-label={(i + 1) + ' of ' + slides.length} hidden={i !== index}>
        <img src={s.src} alt={s.alt} loading={Math.abs(i - index) <= 1 ? 'eager' : 'lazy'} />
      </div>
    ))}
  </div>
</section>
~~~

1. Reduced motion disables auto-play by default.
2. Hover pauses temporarily; focus entering (React's \`onFocus\` bubbles) stops rotation until the user restarts it, as APG requires. Clicking Start focuses the button first, then the functional toggle restarts rotation.
3. \`aria-live\` is derived from \`rotating\`, so auto-advances stay silent.
4. Non-current slides use \`hidden\`, removing them from the accessibility tree.
5. MDN notes lazy images inside hidden content never load until shown, so the current and adjacent slides load eagerly to avoid blank frames.`,
    misconceptions: [
      'Pausing on hover is enough — APG also requires a visible stop/start button and stopping on keyboard focus.',
      'Off-screen slides are hidden because they are not visible — transformed-away slides are still read by screen readers.',
      'The live region should stay polite while auto-rotating — that would announce every slide change; APG sets it to off while rotating.',
      'Slide labels should read "Slide 3 of 10" — the role description already says "slide"; use "3 of 10" or a unique name.',
    ],
    failureCases: [
      'Rotation resumes on `blur` after the user tabbed through, re-introducing motion they stopped.',
      'The rotation control is placed after the slides, so keyboard users must Tab through rotating content to reach it.',
      'All slide images use `loading="lazy"` inside `hidden` slides, so each slide flashes empty when it first appears.',
      'Next/Previous move focus to the new slide, making repeated activation impossible from the keyboard.',
    ],
    productionImplications: `Question whether auto-rotation is needed; WCAG 2.2.2 requires a pause mechanism for auto-moving content lasting over five seconds. If kept, default to paused and drop transitions under \`prefers-reduced-motion\`, prefer the tabbed variant (one picker Tab stop), give images real \`alt\` (or \`alt=""\` if decorative) and explicit width/height.`,
    docSourceIds: ['apg-carousel', 'mdn-reduced-motion', 'mdn-img'],
    interviewQuestions: [
      'What controls and behaviours does an auto-rotating carousel need to be accessible?',
      'Why is the live region set to `off` while rotating and `polite` otherwise?',
      'Compare the basic, tabbed and grouped carousel variants.',
      'How should non-current slides be hidden, and how does that interact with image lazy loading?',
      'How do you respect `prefers-reduced-motion` in a carousel?',
    ],
    related: ['aria-live-regions', 'tabs-aria-pattern', 'focus-management', 'react-effects', 'derived-state'],
  },
];
