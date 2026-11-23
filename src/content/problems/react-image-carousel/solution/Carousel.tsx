import { useEffect, useId, useState, useSyncExternalStore, type FocusEvent, type KeyboardEvent } from 'react';

export interface CarouselImage {
  src: string;
  alt: string;
}

export interface CarouselProps {
  images: CarouselImage[];
  /** Accessible name of the carousel region. Default: "Image carousel". */
  label?: string;
  /** Auto-advance interval in ms. 0 / undefined = no autoplay. */
  autoplayMs?: number;
}

/* ------------------------------------------------------------------ */
/* prefers-reduced-motion as an external store                         */
/* ------------------------------------------------------------------ */
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function getReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false; // SSR / old browsers
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function subscribeReducedMotion(onChange: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {};
  const mql = window.matchMedia(REDUCED_MOTION_QUERY);
  // Safari < 14 only has the deprecated addListener/removeListener.
  if (typeof mql.addEventListener === 'function') {
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }
  mql.addListener(onChange);
  return () => mql.removeListener(onChange);
}

function usePrefersReducedMotion(): boolean {
  // useSyncExternalStore re-reads the snapshot whenever the media query fires "change",
  // and never tears between the value used for rendering and the value used by effects.
  return useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => false);
}

/* ------------------------------------------------------------------ */

const wrap = (i: number, n: number) => ((i % n) + n) % n;

export default function Carousel({ images, label = 'Image carousel', autoplayMs = 0 }: CarouselProps) {
  const count = images.length;
  const [rawIndex, setRawIndex] = useState(0);
  // Derive a valid index instead of syncing it in an effect: if `images` shrinks, we clamp during render.
  const index = count === 0 ? 0 : Math.min(rawIndex, count - 1);

  const [stopped, setStopped] = useState(false); // explicit user choice via the rotation control
  const [hovered, setHovered] = useState(false); // transient pause
  const [focusWithin, setFocusWithin] = useState(false); // transient pause
  const reducedMotion = usePrefersReducedMotion();
  const slidesId = useId();

  const canAutoplay = autoplayMs > 0 && count > 1 && !reducedMotion;
  const rotating = canAutoplay && !stopped && !hovered && !focusWithin;

  // One timeout per (index, rotating) pair. Depending on `index` means manual navigation
  // restarts the countdown, so a slide the user just chose is shown for a full interval.
  useEffect(() => {
    if (!rotating) return;
    const id = setTimeout(() => setRawIndex(wrap(index + 1, count)), autoplayMs);
    return () => clearTimeout(id);
  }, [rotating, index, count, autoplayMs]);

  const goTo = (i: number) => setRawIndex(wrap(i, count));
  const prev = () => goTo(index - 1);
  const next = () => goTo(index + 1);

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (count < 2) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      next();
    }
  };

  // React's onFocus/onBlur bubble (focusin/focusout). Only clear the flag when focus leaves the region entirely.
  const onBlur = (e: FocusEvent<HTMLElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocusWithin(false);
  };

  if (count === 0) {
    return (
      <section className="carousel" role="region" aria-roledescription="carousel" aria-label={label}>
        <p className="carousel__empty">No images to display</p>
      </section>
    );
  }

  const hasControls = count > 1;
  const near = (i: number) => i === index || i === wrap(index + 1, count) || i === wrap(index - 1, count);

  return (
    <section
      className="carousel"
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      tabIndex={hasControls ? 0 : undefined}
      onKeyDown={onKeyDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocusWithin(true)}
      onBlur={onBlur}
    >
      {canAutoplay && (
        // APG: the rotation control comes first in tab order, and its label (not aria-pressed) reflects the action.
        <button type="button" className="carousel__rotation" aria-controls={slidesId} onClick={() => setStopped((s) => !s)}>
          {stopped ? 'Start autoplay' : 'Pause autoplay'}
        </button>
      )}

      <div id={slidesId} className="carousel__slides">
        {images.map((img, i) => (
          // Slides are positional ("3 of 5"), so the index is the identity here.
          <div
            key={i}
            className="carousel__slide"
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${count}`}
            hidden={i !== index}
          >
            <img src={img.src} alt={img.alt} loading={near(i) ? 'eager' : 'lazy'} decoding="async" draggable={false} />
          </div>
        ))}
      </div>

      {hasControls && (
        <>
          <div className="carousel__controls">
            <button type="button" aria-label="Previous slide" aria-controls={slidesId} onClick={prev}>
              <span aria-hidden="true">‹</span>
            </button>
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                className="carousel__dot"
                aria-label={`Go to slide ${i + 1}`}
                aria-controls={slidesId}
                aria-current={i === index ? 'true' : undefined}
                onClick={() => goTo(i)}
              />
            ))}
            <button type="button" aria-label="Next slide" aria-controls={slidesId} onClick={next}>
              <span aria-hidden="true">›</span>
            </button>
          </div>
          {/* Announce manual changes politely; silence it while slides change on their own (APG). */}
          <div className="visually-hidden" role="status" aria-live={rotating ? 'off' : 'polite'} aria-atomic="true">
            {`Slide ${index + 1} of ${count}`}
          </div>
        </>
      )}
    </section>
  );
}
