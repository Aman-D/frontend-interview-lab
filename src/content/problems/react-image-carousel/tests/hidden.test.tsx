import Carousel from '../Carousel';
import { currentSlide, makeImages, restoreMatchMedia, stubMatchMedia } from './helpers';

const region = () => screen.getByRole('region', { name: 'Gallery' });
const slideLabel = () => currentSlide().getAttribute('aria-label');

describe('Carousel — hidden', () => {
  beforeEach(() => {
    timers.useFake();
    // Pin the media query so results do not depend on the machine's OS motion setting.
    stubMatchMedia(false);
  });
  afterEach(() => restoreMatchMedia());

  it('autoplay advances every autoplayMs, wraps, and silences the live region while rotating', () => {
    render(<Carousel images={makeImages(3)} label="Gallery" autoplayMs={1000} />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'off');
    timers.advance(999);
    expect(slideLabel()).toBe('1 of 3');
    timers.advance(1);
    expect(slideLabel()).toBe('2 of 3');
    // advance one interval at a time: each next timeout is scheduled after React commits the previous change
    timers.advance(1000);
    expect(slideLabel()).toBe('3 of 3');
    timers.advance(1000);
    expect(slideLabel()).toBe('1 of 3');
  });

  it('the rotation control pauses and restarts autoplay (its label reflects the action)', () => {
    render(<Carousel images={makeImages(3)} label="Gallery" autoplayMs={1000} />);
    fireEvent.click(screen.getByRole('button', { name: 'Pause autoplay' }));
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    timers.advance(5000);
    expect(slideLabel()).toBe('1 of 3');
    fireEvent.click(screen.getByRole('button', { name: 'Start autoplay' }));
    expect(screen.getByRole('button', { name: 'Pause autoplay' })).toBeInTheDocument();
    timers.advance(1000);
    expect(slideLabel()).toBe('2 of 3');
  });

  it('pauses while hovered and resumes when the pointer leaves', () => {
    render(<Carousel images={makeImages(3)} label="Gallery" autoplayMs={1000} />);
    timers.advance(500);
    fireEvent.mouseEnter(region());
    timers.advance(3000);
    expect(slideLabel()).toBe('1 of 3');
    fireEvent.mouseLeave(region());
    timers.advance(1000);
    expect(slideLabel()).toBe('2 of 3');
  });

  it('pauses while focus is inside the carousel and resumes after focus leaves', () => {
    render(<Carousel images={makeImages(3)} label="Gallery" autoplayMs={1000} />);
    const next = screen.getByRole('button', { name: 'Next slide' });
    fireEvent.focus(next);
    timers.advance(3000);
    expect(slideLabel()).toBe('1 of 3');
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    // moving focus between controls inside the carousel keeps it paused
    fireEvent.blur(next, { relatedTarget: screen.getByRole('button', { name: 'Previous slide' }) });
    timers.advance(3000);
    expect(slideLabel()).toBe('1 of 3');
    fireEvent.blur(next, { relatedTarget: null });
    timers.advance(1000);
    expect(slideLabel()).toBe('2 of 3');
  });

  it('prefers-reduced-motion disables autoplay and its rotation control', () => {
    restoreMatchMedia();
    stubMatchMedia(true);
    render(<Carousel images={makeImages(3)} label="Gallery" autoplayMs={1000} />);
    timers.advance(5000);
    expect(slideLabel()).toBe('1 of 3');
    expect(screen.queryByRole('button', { name: /autoplay/i })).toBeNull();
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    // manual navigation still works
    fireEvent.click(screen.getByRole('button', { name: 'Next slide' }));
    expect(slideLabel()).toBe('2 of 3');
  });

  it('stops rotating when the reduced-motion preference turns on at runtime', () => {
    restoreMatchMedia();
    const media = stubMatchMedia(false);
    render(<Carousel images={makeImages(3)} label="Gallery" autoplayMs={1000} />);
    timers.advance(1000);
    expect(slideLabel()).toBe('2 of 3');
    media.setReducedMotion(true);
    timers.advance(5000);
    expect(slideLabel()).toBe('2 of 3');
  });

  it('manual navigation restarts the autoplay countdown', () => {
    render(<Carousel images={makeImages(4)} label="Gallery" autoplayMs={1000} />);
    timers.advance(600);
    // click without leaving focus/hover state behind (fireEvent.click does not focus)
    fireEvent.click(screen.getByRole('button', { name: 'Go to slide 3' }));
    expect(slideLabel()).toBe('3 of 4');
    timers.advance(600);
    expect(slideLabel()).toBe('3 of 4');
    timers.advance(400);
    expect(slideLabel()).toBe('4 of 4');
  });

  it('loads the current slide and its neighbours eagerly and the rest lazily', () => {
    const { container } = render(<Carousel images={makeImages(5)} label="Gallery" />);
    const loading = () => Array.from(container.querySelectorAll('img')).map((img) => img.getAttribute('loading'));
    expect(loading()).toEqual(['eager', 'eager', 'lazy', 'lazy', 'eager']);
    fireEvent.click(screen.getByRole('button', { name: 'Go to slide 3' }));
    expect(loading()).toEqual(['lazy', 'eager', 'eager', 'eager', 'lazy']);
  });

  it('clamps the current slide when the images list shrinks, and cleans up its timer on unmount', () => {
    const view = render(<Carousel images={makeImages(4)} label="Gallery" autoplayMs={1000} />);
    fireEvent.click(screen.getByRole('button', { name: 'Go to slide 4' }));
    view.rerender(<Carousel images={makeImages(2)} label="Gallery" autoplayMs={1000} />);
    expect(slideLabel()).toBe('2 of 2');
    expect(screen.getByRole('img', { name: 'Photo 2' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Slide 2 of 2');
    view.unmount();
    expect(timers.pendingCount()).toBe(0);
  });
});
