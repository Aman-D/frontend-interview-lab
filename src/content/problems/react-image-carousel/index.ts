import type { CodingProblem } from '../../schema';
import starterCarousel from './starter/Carousel.tsx?raw';
import starterApp from './starter/App.tsx?raw';
import images from './starter/images.ts?raw';
import styles from './starter/styles.css?raw';
import solutionCarousel from './solution/Carousel.tsx?raw';
import helpers from './tests/helpers.ts?raw';
import publicTests from './tests/public.test.tsx?raw';
import hiddenTests from './tests/hidden.test.tsx?raw';

const shared = { '/App.tsx': starterApp, '/images.ts': images, '/styles.css': styles };

const problem: CodingProblem = {
  schemaVersion: 1,
  kind: 'coding',
  id: 'react-image-carousel',
  slug: 'image-carousel',
  title: 'Image Carousel',
  track: 'react',
  execution: 'react',
  difficulty: 'medium',
  priority: 'P0',
  seniority: ['Senior', 'SDE-2', 'SDE-3', 'MTS'],
  topics: ['carousel a11y', 'autoplay timers', 'prefers-reduced-motion', 'live regions', 'keyboard navigation', 'image loading'],
  estimatedMinutes: 60,
  conceptIds: ['react-effects', 'fake-timers', 'closures', 'focus-management', 'keyboard-navigation', 'event-propagation'],
  research: {
    provenance: 'PUBLISHED_PRACTICE_PROBLEM',
    frequencyConfidence: 'HIGH_CONFIDENCE',
    verificationStatus: 'SOURCES_VERIFIED',
    lastVerified: '2026-11-23',
    evidence: [
      { sourceId: 'fih-ui', url: 'https://www.frontendinterviewhandbook.com/coding/build-front-end-user-interfaces', originalTitle: 'Image Carousel', note: 'Listed among the "Components" UI coding questions.' },
      { sourceId: 'fih-sd-ui', url: 'https://www.frontendinterviewhandbook.com/front-end-system-design/ui-components', originalTitle: 'Image carousel', note: 'Listed as a UI component system-design example.' },
      { sourceId: 'alla-components', url: 'https://allahabadi.dev/frontend-system-design/components/', originalTitle: 'Design an Image Carousel', note: 'Question 02 in the component design list.' },
      { sourceId: 'fg-mc', url: 'https://www.frontendgeek.com/frontend-interview/machine-coding-interview', originalTitle: 'Image Carousel', note: 'Listed under "Component machine coding".' },
    ],
    researchNotes:
      'Four independent listings: two treat the carousel as a coding exercise and two as component system design. This problem is the 60-minute machine-coding core — navigation with wrap-around, slide picker, keyboard, autoplay with every APG pause condition, reduced motion, live-region announcements and lazy/eager image loading. Swipe gestures, sliding/infinite-loop animation, responsive multi-slide layouts and virtualisation of very large galleries are follow-ups. All statements, code and tests are original; the ARIA contract follows the W3C APG carousel pattern.',
  },
  spec: {
    summary: 'Build an accessible React image carousel with wrap-around navigation, a slide picker, keyboard support and an autoplay that pauses correctly and respects reduced motion.',
    description: `Implement \`<Carousel images label autoplayMs />\` in **Carousel.tsx**. \`images\` is an array of \`{ src, alt }\`.

**Navigation**

1. **Previous slide / Next slide** buttons move one slide and **wrap around** at both ends.
2. One **"Go to slide N"** button per image jumps to that slide; the current one has \`aria-current="true"\`.
3. When the carousel region (or anything inside it) has focus, **ArrowLeft / ArrowRight** change slides. The region itself is focusable (\`tabIndex={0}\`).

**Autoplay** (only when \`autoplayMs > 0\` and there are at least 2 images)

4. Advance every \`autoplayMs\` ms, wrapping from the last slide to the first. Choosing a slide manually restarts the countdown.
5. **Pause** while the pointer is over the carousel and while focus is inside it, and resume when both leave.
6. A rotation control, the **first** control in the carousel, is labelled **"Pause autoplay"** while autoplay is on and **"Start autoplay"** after the user has paused it.
7. If the user prefers reduced motion (\`matchMedia('(prefers-reduced-motion: reduce)')\`), autoplay is off and no rotation control is shown. React to the preference changing while the page is open.

**Accessibility contract** (WAI-ARIA APG carousel)

- Container: \`role="region"\`, \`aria-roledescription="carousel"\`, \`aria-label={label}\` (default "Image carousel").
- Each slide: \`role="group"\`, \`aria-roledescription="slide"\`, \`aria-label="N of TOTAL"\`. **Only the current slide is exposed**. Hide the others with \`hidden\` (or don't render them).
- A \`role="status"\` element contains **"Slide N of TOTAL"**. Its \`aria-live\` is \`"polite"\`, but \`"off"\` while slides are rotating on their own.

**Images & edge cases**

- The current slide and its two neighbours (with wrap-around) use \`loading="eager"\`. Every other image uses \`loading="lazy"\`.
- 0 images: render the region with the text **"No images to display"** and no controls. 1 image: show it with no controls.
- If \`images\` shrinks below the current index, show the last slide.

\`App.tsx\` and \`images.ts\` (inline SVG data URIs, so nothing loads from the network) are read-only. \`styles.css\` already contains classes you can use: \`carousel\`, \`carousel__slide\`, \`carousel__controls\`, \`carousel__dot\`, \`carousel__rotation\`, \`carousel__empty\` and \`visually-hidden\`.`,
    technologies: ['React 18', 'TypeScript', 'WAI-ARIA carousel pattern', 'matchMedia / prefers-reduced-motion', 'useSyncExternalStore'],
    learningObjectives: [
      'Derive "is it rotating?" from several independent pause conditions instead of juggling timers imperatively',
      'Own a timer in an effect whose cleanup makes stale closures and leaked intervals impossible',
      'Subscribe to a browser media query with useSyncExternalStore and test it with a stub',
      'Apply the APG carousel semantics: region/group roledescriptions, rotation control, live region on/off',
      'Use loading="lazy" vs eager deliberately to preload neighbours without loading the whole gallery',
    ],
    clarifications: [
      { question: 'Is autoplay required, and what should pause it?', why: 'Autoplay is where most of the complexity and most of the accessibility failures (WCAG 2.2.2 Pause, Stop, Hide) live.', defaultAssumption: 'Optional via `autoplayMs`. Hover and focus-within pause it temporarily, a visible rotation control stops/starts it, and reduced motion disables it.' },
      { question: 'Should the slide picker be a tab list or a set of buttons?', why: 'APG documents both a "basic" carousel (buttons) and a "tabbed" carousel (tablist + tabpanels). They differ in roles, keyboard model and which attribute marks the current slide.', defaultAssumption: 'Plain buttons ("Go to slide N") with `aria-current="true"` on the current one. Each button is a normal tab stop, with no arrow-key roving inside the picker. `aria-selected` only belongs to the tab variant.' },
      { question: 'Should navigation wrap around, and does "infinite" mean an animated loop?', why: 'An animated infinite loop means cloning the first and last slides, which is a lot of extra work.', defaultAssumption: 'Index arithmetic wraps; there is no sliding animation. A subtle fade is disabled under reduced motion.' },
      { question: 'How many images, and how large?', why: 'Decides whether all <img> elements can be in the DOM or the list must be virtualised.', defaultAssumption: 'Tens of images. All slides are in the DOM, but only the current slide and its neighbours load eagerly.' },
      { question: 'What happens when the images prop changes while the carousel is mounted?', why: 'The current index can point past the end of the new list.', defaultAssumption: 'Clamp to the last slide during render instead of resetting.' },
    ],
    scopeDecisions: [
      'No swipe/drag gestures and no sliding transition (follow-ups).',
      'One slide visible at a time. Responsive multi-slide layouts are out of scope.',
      'Slides are positional, so the array index is the React key and the slide label is "N of TOTAL".',
      'Focus-within pauses only while focus is inside. APG’s stricter rule (stay stopped until the user restarts) is discussed as a trade-off.',
    ],
    requirements: [
      { id: 'prev-next-wrap', category: 'functional', level: 'MUST', text: '"Previous slide" and "Next slide" buttons change the slide and wrap at both ends.' },
      { id: 'picker', category: 'functional', level: 'MUST', text: 'One "Go to slide N" button per image jumps to that slide; the current one has aria-current="true" and no other does.' },
      { id: 'arrow-keys', category: 'accessibility', level: 'MUST', text: 'The region is focusable; ArrowLeft/ArrowRight inside it change slides.' },
      { id: 'carousel-roles', category: 'accessibility', level: 'MUST', text: 'role="region" + aria-roledescription="carousel" + aria-label; slides are role="group" + aria-roledescription="slide" + aria-label "N of TOTAL".' },
      { id: 'only-current-exposed', category: 'accessibility', level: 'MUST', text: 'Only the current slide (and its image) is exposed to assistive technology; the others are hidden.' },
      { id: 'live-region', category: 'accessibility', level: 'MUST', text: 'A role="status" region reads "Slide N of TOTAL"; aria-live is "polite", and "off" while slides rotate automatically.' },
      { id: 'autoplay', category: 'functional', level: 'SHOULD', text: 'With autoplayMs > 0 and ≥ 2 images, slides advance every autoplayMs and wrap.' },
      { id: 'pause-conditions', category: 'accessibility', level: 'MUST', text: 'Autoplay pauses while hovered and while focus is inside, and resumes when both leave.' },
      { id: 'rotation-control', category: 'accessibility', level: 'MUST', text: 'When autoplay is possible, a first-in-order button labelled "Pause autoplay" / "Start autoplay" stops and restarts rotation.' },
      { id: 'reduced-motion', category: 'accessibility', level: 'MUST', text: 'prefers-reduced-motion: reduce disables autoplay (no rotation control), including when the preference changes at runtime.' },
      { id: 'timer-cleanup', category: 'technical', level: 'MUST', text: 'No timer outlives the component or a pause; manual navigation restarts the countdown.' },
      { id: 'lazy-eager', category: 'performance', level: 'SHOULD', text: 'Current slide and its wrap-around neighbours load eagerly; all other images use loading="lazy".' },
      { id: 'empty-single', category: 'edge-case', level: 'MUST', text: '0 images shows "No images to display" with no controls; 1 image shows no controls.' },
      { id: 'shrinking-images', category: 'edge-case', level: 'SHOULD', text: 'If images shrinks below the current index, the last slide is shown (no blank carousel).' },
      { id: 'swipe', category: 'functional', level: 'OPTIONAL', text: 'Pointer swipe (pointerdown/pointerup delta) changes slides on touch devices.' },
      { id: 'deterministic-tests', category: 'testing', level: 'SHOULD', text: 'Autoplay is tested with fake timers, and matchMedia is stubbed so results do not depend on the OS motion setting.' },
    ],
    constraints: ['React function components and hooks only.', 'No third-party libraries.', 'Do not change the component props or the accessible names listed above.', 'Tests must not depend on images loading.'],
    acceptanceCriteria: [
      'All public tests pass (roles, wrap-around, picker, arrow keys, live region, empty/single).',
      'All hidden tests pass (autoplay, rotation control, hover/focus pause, reduced motion incl. runtime change, countdown restart, lazy/eager, shrinking list, timer cleanup).',
      'Manual: with a screen reader, manual navigation is announced but autoplay is silent.',
    ],
    examples: [
      { title: 'Wrap-around', input: '3 images, current = 1; click "Previous slide"', output: 'Slide "3 of 3" is shown; status reads "Slide 3 of 3"' },
      { title: 'Hover pause', input: 'autoplayMs=1000; hover at 500 ms; wait 3 s; leave; wait 1 s', output: 'Slide stays 1 while hovered, becomes 2 one full interval after leaving' },
      { title: 'Eager neighbours', input: '5 images, current = 3', output: 'loading = [lazy, eager, eager, eager, lazy]', explanation: 'Slides 2 and 4 are one click away, so they are fetched in advance; 1 and 5 wait.' },
    ],
    manualTests: [
      'Hover the preview carousel: rotation stops; move away: it resumes after a full interval.',
      'Tab into the carousel: the first stop is "Pause autoplay", and rotation stops while focus is inside.',
      'Enable "Reduce motion" in OS settings (or DevTools → Rendering → Emulate CSS prefers-reduced-motion): autoplay and its button disappear without reloading.',
      'With VoiceOver/NVDA, press Next: "Slide 2 of 5" is announced; while autoplay runs, nothing is announced.',
      'In DevTools → Network (Img), only three images load initially.',
    ],
  },
  files: {
    entry: '/App.tsx',
    starter: { ...shared, '/Carousel.tsx': starterCarousel },
    solution: { ...shared, '/Carousel.tsx': solutionCarousel },
    readonly: ['/App.tsx', '/images.ts'],
    support: {},
  },
  tests: [
    { path: '/tests/helpers.ts', visibility: 'public', kind: 'runtime', source: helpers },
    { path: '/tests/public.test.tsx', visibility: 'public', kind: 'runtime', source: publicTests },
    { path: '/tests/hidden.test.tsx', visibility: 'hidden', kind: 'runtime', source: hiddenTests },
  ],
  hints: [
    'Start with state: just `index`. Previous/next are `(index ± 1 + n) % n`. Render all slides but put `hidden` on every slide except the current one. That gives you "only the current slide is exposed" for free.',
    'Model autoplay as derived state: `rotating = autoplayMs > 0 && n > 1 && !reducedMotion && !stopped && !hovered && !focusWithin`. Then a single effect keyed on `[rotating, index]` sets one `setTimeout` and clears it in the cleanup. No interval, no stale closure.',
    'Focus-within: React’s `onFocus`/`onBlur` bubble. In `onBlur`, keep the flag set if `e.currentTarget.contains(e.relatedTarget)`, because focus is only moving between controls.',
    'Reduced motion: `useSyncExternalStore(subscribe, () => matchMedia(q).matches)` where `subscribe` adds a `change` listener to the MediaQueryList. In tests, replace `window.matchMedia` with a stub and restore it in `afterEach`.',
  ],
  solution: {
    initialApproach:
      'Keep one piece of navigation state (`index`) and treat everything else as derived: which slide is visible, which images are eager, what the status says, and above all whether autoplay is currently rotating. One effect owns the only timer.',
    bruteForce:
      'A `setInterval` in a mount-only effect calling `setIndex(index + 1)` looks fine in a demo but captures the initial `index` forever (stale closure), never pauses, keeps ticking after manual navigation (so the next auto-advance can come 50 ms after a click), and needs separate imperative `clearInterval` calls for hover, focus and the pause button. Each new pause condition adds another place where the interval can leak.',
    optimizedApproach: `**State**: \`rawIndex\`, \`stopped\` (user intent), \`hovered\`, \`focusWithin\`, plus \`reducedMotion\` from an external store.

**Derived**:
- \`index = min(rawIndex, n − 1)\`, so a shrinking \`images\` prop is handled during render (no effect, no extra render).
- \`canAutoplay = autoplayMs > 0 && n > 1 && !reducedMotion\`, which decides whether the rotation control exists.
- \`rotating = canAutoplay && !stopped && !hovered && !focusWithin\`, which drives both the timer and \`aria-live\`.

**One timer**: \`useEffect(() => { if (!rotating) return; const id = setTimeout(next, autoplayMs); return () => clearTimeout(id); }, [rotating, index, count, autoplayMs])\`. Because \`index\` is a dependency, every slide change (automatic or manual) restarts the countdown, and every pause clears it. The closure always sees the current index, so there is no stale value.

**Reduced motion** is read with \`useSyncExternalStore\`. It is correct on the first render (no flash of autoplay), re-renders when the OS setting changes, and has a server snapshot of \`false\`.

**Accessibility**: APG basic-carousel semantics. The rotation control comes first in tab order and changes its label (not \`aria-pressed\`). Hidden slides use the \`hidden\` attribute. The status region is polite, and switched to \`off\` while rotating so a screen reader isn’t interrupted every few seconds.`,
    walkthrough: `1. **Empty**: if \`images.length === 0\`, return the labelled region with "No images to display". All hooks are called *before* this early return.
2. **Index**: \`wrap(i, n) = ((i % n) + n) % n\` handles −1 → n−1 and n → 0. \`goTo\`, \`prev\` and \`next\` compute from the *clamped* index.
3. **Pause flags**: \`onMouseEnter/Leave\` set \`hovered\`. \`onFocus\` sets \`focusWithin\`, and \`onBlur\` clears it only when \`relatedTarget\` is outside the region. React’s focus events bubble (they use focusin/focusout), so one pair on the region covers every control.
4. **Timer effect** as above. When the effect re-runs, the cleanup clears the old timeout first, so at most one timeout exists at any moment, and none after unmount.
5. **Keyboard**: \`onKeyDown\` on the region handles ArrowLeft/ArrowRight (with \`preventDefault\` to avoid scrolling). The region has \`tabIndex=0\` only when there is something to navigate.
6. **Slides**: map every image to a \`role="group"\` slide with \`aria-label="N of TOTAL"\` and \`hidden={i !== index}\`. \`hidden\` removes the slide from layout and from the accessibility tree.
7. **Images**: \`loading = near(i) ? "eager" : "lazy"\`, where \`near\` is the current index or its wrap-around neighbours. A hidden eager image still downloads, so the next click is instant. A hidden lazy one doesn’t download.
8. **Controls**: only when \`n > 1\`. Picker buttons carry \`aria-current="true"\` on the current slide. The status div renders "Slide N of TOTAL" with \`aria-live={rotating ? "off" : "polite"}\` and \`aria-atomic="true"\`.`,
    complexity:
      'Navigation is O(1). Each render maps n slides and n picker buttons, so O(n) DOM nodes. At most three images are fetched eagerly; the rest are fetched only if their slide is approached. At most one pending timeout exists at any time.',
    edgeCases: `- 0 images: message, no controls, no timer. All hooks still run before the early return.
- 1 image: no controls, no rotation control, no autoplay (\`n > 1\` guard), no tab stop on the region.
- 2 images: previous and next neighbour are the same slide; \`near()\` still works.
- \`images\` shrinks: the index is clamped during render. If it grows, the user stays on the same slide.
- Focus moving between controls inside the carousel: \`relatedTarget\` is inside, so it stays paused.
- Pause button clicked with a mouse: the button now has focus, so rotation stays paused (focus-within) until focus leaves. This is intended.
- Reduced-motion preference flips at runtime: the store re-renders, \`rotating\` becomes false, and the effect cleanup clears the timeout.
- \`autoplayMs\` changes: it is an effect dependency, so the countdown restarts with the new interval.
- \`matchMedia\` missing (very old browsers, SSR): treated as "no preference".`,
    alternatives: `- **APG tabbed carousel**: the picker is a \`tablist\` of \`tab\`s with \`aria-selected\`, and slides are \`tabpanel\`s. Arrow keys rove within the tablist. Use it when picker buttons should behave as a single tab stop. Don't mix \`aria-selected\` with plain buttons.
- **Stricter APG focus rule**: when focus enters, set \`stopped = true\` and only restart on an explicit "Start" press. This is safer for keyboard users who need time to read, but rotation doesn’t resume when they leave.
- **Render only the current slide** instead of hiding the others. Less DOM, but you lose eager preloading through hidden \`<img>\` (use \`new Image().src\` or \`<link rel="preload">\` instead) and any cross-fade between slides.
- **\`inert\` + \`aria-hidden\`** on off-screen slides when they must stay visible for a sliding animation. \`inert\` also blocks focus and clicks on links inside off-screen slides. In React 18 it must be set as \`inert=""\` because the prop isn't typed until React 19.
- **CSS scroll-snap** carousel: native swipe and momentum, very little JS. Syncing "current index" then needs an IntersectionObserver, and keyboard and announcement handling become harder.
- **\`setInterval\` + functional updates** (\`setIndex(i => i + 1)\`) avoids the stale closure but still doesn't restart the countdown after manual navigation.`,
    tradeoffs: `- **Transient vs sticky focus pause**: transient is convenient but resumes motion behind a keyboard user’s back once they tab out. Sticky (APG) is safer but needs a deliberate restart.
- **All slides in the DOM**: simple, preload-friendly and animatable. For hundreds of images, virtualise and render only a window of slides.
- **Live region off while rotating**: avoids a stream of interruptions for screen-reader users. The cost is that automatic changes are never announced, which is the intended APG behaviour.
- **Region as a tab stop**: makes arrow keys discoverable even before a button is focused, at the cost of one extra tab stop.`,
    commonMistakes: `- \`setInterval\` with a stale \`index\` closure, or an interval that is never cleared (it keeps running after unmount).
- Pausing on \`mouseenter\` but forgetting focus, so keyboard users can’t stop the motion. This also fails WCAG 2.2.2 if there is no visible pause control.
- Using \`onBlur\` without checking \`relatedTarget\`, so rotation restarts while tabbing between the carousel's own buttons.
- Leaving off-screen slides exposed: a screen reader reads all 20 images, or Tab reaches links in invisible slides.
- An always-on \`aria-live="polite"\` that announces every automatic change.
- Using \`aria-selected\` on plain buttons (it is only valid on tab/option/gridcell-type roles), or using \`aria-pressed\` for the rotation control instead of changing its label.
- Reading \`matchMedia\` once in an effect, which causes a flash of autoplay on first paint and ignores runtime changes.
- An empty \`images\` array giving \`NaN\` from \`% 0\`, or crashing on \`images[index].src\`.`,
    testingStrategy: `- **Fake timers** for autoplay: advance to just before the interval (999 ms), then to it, so off-by-one errors and countdown restarts show up deterministically.
- **Stub \`matchMedia\`** in \`beforeEach\` and restore it in \`afterEach\`. Otherwise the suite fails on a developer machine that has Reduce Motion turned on. The stub keeps its listeners, so a test can flip the preference and check that a running carousel stops.
- **Role queries** (\`region\`, \`group\` + roledescription, \`img\` by alt, \`button\` by name, \`status\`) check the accessibility contract directly. Hidden slides are excluded from role queries, which is exactly the "only current slide exposed" requirement.
- **Hover/focus** through \`mouseEnter/mouseLeave\` and \`focus/blur\` with an explicit \`relatedTarget\`, to cover moving focus inside the carousel vs leaving it.
- **Timer leak**: after \`unmount()\`, \`timers.pendingCount()\` must be 0.
- **Images**: assert the \`loading\` attributes, never load events. Image loading is not deterministic in tests.`,
    seniorFollowUps: `- Add swipe: pointer events with \`setPointerCapture\`, a distance/velocity threshold, \`touch-action: pan-y\` so vertical scrolling still works, and suppressing the click that follows a drag.
- Animate slides (translateX track) while keeping off-screen slides \`inert\`. Animate only \`transform\`/\`opacity\` to stay on the compositor, and turn the animation off under reduced motion.
- 500 images: virtualise slides and the picker (the picker becomes "3 / 500" plus a thumbnail strip with its own windowing). Use \`srcset/sizes\` for responsive images and \`fetchpriority="high"\` for the first slide (LCP).
- A hero carousel above the fold: how do you avoid CLS (aspect-ratio boxes) and a slow LCP image?
- A headless \`useCarousel\` hook returning prop getters, so a design system can reuse the logic with different markup.
- Analytics: how do you measure whether anyone sees slide 4? (Impressions via IntersectionObserver plus the visible index, not auto-advance counts.)`,
  },
  followUps: [
    { id: 'f1', level: 'definition', question: 'What does aria-roledescription do on the carousel and slide elements, and why must the element also have a real role?', expectedConcepts: ['custom role name announced instead of "region"/"group"', 'does not change semantics or keyboard behaviour', 'only valid on elements with a role', 'localise the string'], sourceIds: ['apg-carousel'] },
    { id: 'f2', level: 'mechanism', question: 'Walk through which timers exist when the user hovers at 500 ms into a 1000 ms interval, leaves at 2000 ms, and the component unmounts at 2500 ms.', expectedConcepts: ['effect keyed on rotating/index', 'cleanup clears the timeout on pause', 'new full interval after resume', 'cleanup on unmount', 'never more than one timer'], sourceIds: ['react-sync-effects', 'tl-fake-timers'] },
    { id: 'f3', level: 'application', question: 'Your carousel must also pause when the browser tab is hidden. How do you add that without another timer bug?', expectedConcepts: ['visibilitychange / document.hidden', 'another pause flag in the derived rotating boolean', 'subscribe in an effect or external store', 'no direct clearTimeout calls'], sourceIds: ['react-useeffect'] },
    { id: 'f4', level: 'edge-cases', question: 'A keyboard user tabs into the carousel, reads a slide, tabs out and later back in. What should autoplay do according to APG, and how does that differ from this implementation?', expectedConcepts: ['APG: stop on focus and do not restart unless the user asks', 'transient vs sticky pause', 'rotation control label reflects state', 'WCAG 2.2.2 pause/stop/hide'], sourceIds: ['apg-carousel'] },
    { id: 'f5', level: 'production', question: 'The carousel is the hero element of a landing page. Which image-loading attributes do you set on each slide, and how do they affect LCP and bandwidth?', expectedConcepts: ['first image eager + fetchpriority high', 'neighbours eager, others lazy', 'srcset/sizes', 'reserve space with aspect-ratio/width/height to avoid CLS', 'decoding async'], sourceIds: ['mdn-img'] },
    { id: 'f6', level: 'architecture', question: 'Design a reusable carousel for a design system that supports images, cards and video, plus 1-up and 3-up layouts. What is the API and where does accessibility live?', expectedConcepts: ['headless hook + prop getters', 'controlled/uncontrolled index', 'slidesPerView and group announcements', 'video pauses when its slide is hidden', 'ARIA baked into the hook'], sourceIds: ['apg-carousel', 'react-sharing-state'] },
  ],
  mcqs: [
    {
      id: 'm1',
      question: 'An auto-rotating carousel has a polite live region that says "Slide N of M". What should its aria-live value be while the carousel is rotating on its own?',
      options: [
        { id: 'a', text: '"assertive", so users always know the slide changed', explanation: 'Assertive would interrupt the user every few seconds, the opposite of what APG recommends.' },
        { id: 'b', text: '"off" while rotating, "polite" when the user is driving navigation', explanation: 'Correct: automatic changes stay silent and user-initiated changes are announced.' },
        { id: 'c', text: '"polite" all the time', explanation: 'Every automatic change would be queued and announced, which is noisy and distracting.' },
        { id: 'd', text: 'Remove the region and rely on aria-roledescription', explanation: 'aria-roledescription renames a role. It does not announce changes.' },
      ],
      correctOptionId: 'b',
      explanation: 'APG sets the slide container to aria-live="off" during automatic rotation and "polite" otherwise, so screen-reader users are not interrupted by changes they did not request.',
      sourceIds: ['apg-carousel', 'mdn-live-regions'],
    },
    {
      id: 'm2',
      code: `useEffect(() => {
  const id = setInterval(() => setIndex(index + 1), 3000);
  return () => clearInterval(id);
}, []);`,
      question: 'What goes wrong with this autoplay effect?',
      options: [
        { id: 'a', text: 'Nothing; the cleanup clears the interval', explanation: 'The cleanup only fixes unmount. The callback still captures the first render’s `index`.' },
        { id: 'b', text: 'The callback closes over the initial index, so it keeps setting the same value and stops advancing after the first tick', explanation: 'Correct: with [] deps the closure always sees index 0 and keeps setting 1.' },
        { id: 'c', text: 'setInterval cannot be used inside useEffect', explanation: 'It can. The problem is the stale closure, not the API.' },
        { id: 'd', text: 'React batches the updates, so the index jumps by several at once', explanation: 'Each tick is a separate task and React does not merge them into one jump.' },
      ],
      correctOptionId: 'b',
      explanation: 'An effect with empty dependencies captures the values of the first render. Use a functional update, or (better for carousels) an effect keyed on the index that schedules one timeout, which also restarts the countdown after manual navigation.',
      sourceIds: ['react-sync-effects', 'react-useeffect'],
    },
    {
      id: 'm3',
      question: 'Which approach correctly disables autoplay for users who ask the OS to reduce motion, including when they change the setting while the page is open?',
      options: [
        { id: 'a', text: 'A CSS @media (prefers-reduced-motion) rule that hides the carousel', explanation: 'CSS cannot stop a JavaScript timer, and hiding content is not the goal.' },
        { id: 'b', text: 'Read matchMedia(...).matches once on mount', explanation: 'This ignores runtime changes until the next reload.' },
        { id: 'c', text: 'Subscribe to the MediaQueryList "change" event (e.g. via useSyncExternalStore) and include the value in the "is rotating" condition', explanation: 'Correct: it is right on the first render and updates when the preference changes.' },
        { id: 'd', text: 'Check navigator.userAgent for accessibility tools', explanation: 'User-agent sniffing doesn’t reveal motion preferences and is unreliable.' },
      ],
      correctOptionId: 'c',
      explanation: 'prefers-reduced-motion is exposed to JavaScript through matchMedia. The returned MediaQueryList fires "change" events, so subscribing keeps the component in sync with the user’s setting.',
      sourceIds: ['mdn-reduced-motion'],
    },
  ],
};

export default problem;
