import { useState } from 'react';

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

/*
 * Contract the tests rely on (see the problem description for details):
 * - region: role="region", aria-roledescription="carousel", aria-label={label}, focusable (tabIndex 0)
 * - slides: role="group", aria-roledescription="slide", aria-label="N of TOTAL"; only the current slide is exposed
 * - buttons: "Previous slide", "Next slide", "Go to slide N" (current one has aria-current="true")
 * - rotation control (only while autoplay is possible): "Pause autoplay" / "Start autoplay"
 * - role="status" live region with "Slide N of TOTAL"; aria-live="off" while rotating, "polite" otherwise
 * - 0 images: the text "No images to display" and no buttons; 1 image: no controls
 */
export default function Carousel({ images, label = 'Image carousel' }: CarouselProps) {
  const [index] = useState(0);

  // TODO:
  // - previous / next with wrap-around, dot buttons, ArrowLeft / ArrowRight on the region
  // - autoplay that pauses on hover, focus-within and via a Pause / Start button
  // - prefers-reduced-motion (matchMedia) disables autoplay
  // - live region, slide semantics, lazy / eager image loading, empty + single-image cases
  const image = images[index];
  return (
    <section className="carousel" aria-label={label}>
      {image && <img src={image.src} alt={image.alt} />}
      <div className="carousel__controls">
        <button type="button">Previous</button>
        <button type="button">Next</button>
      </div>
    </section>
  );
}
