import Carousel from '../Carousel';
import { currentSlide, makeImages } from './helpers';

const region = () => screen.getByRole('region', { name: 'Gallery' });

describe('Carousel — public', () => {
  it('renders a labelled carousel region that exposes only the current slide', () => {
    render(<Carousel images={makeImages(3)} label="Gallery" />);
    expect(region()).toHaveAttribute('aria-roledescription', 'carousel');
    const slide = currentSlide();
    expect(slide).toHaveAttribute('aria-label', '1 of 3');
    expect(within(slide).getByRole('img', { name: 'Photo 1' })).toBeInTheDocument();
    // the other images exist (for preloading) but are not exposed to assistive technology
    expect(screen.getAllByRole('img')).toHaveLength(1);
    expect(screen.queryByRole('img', { name: 'Photo 2' })).toBeNull();
  });

  it('Next and Previous move between slides and wrap around at both ends', () => {
    render(<Carousel images={makeImages(3)} label="Gallery" />);
    fireEvent.click(screen.getByRole('button', { name: 'Previous slide' }));
    expect(currentSlide()).toHaveAttribute('aria-label', '3 of 3');
    fireEvent.click(screen.getByRole('button', { name: 'Next slide' }));
    expect(currentSlide()).toHaveAttribute('aria-label', '1 of 3');
    fireEvent.click(screen.getByRole('button', { name: 'Next slide' }));
    expect(screen.getByRole('img', { name: 'Photo 2' })).toBeInTheDocument();
  });

  it('dot buttons jump to a slide and mark the current one with aria-current', () => {
    render(<Carousel images={makeImages(4)} label="Gallery" />);
    expect(screen.getByRole('button', { name: 'Go to slide 1' })).toHaveAttribute('aria-current', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Go to slide 3' }));
    expect(currentSlide()).toHaveAttribute('aria-label', '3 of 4');
    expect(screen.getByRole('button', { name: 'Go to slide 3' })).toHaveAttribute('aria-current', 'true');
    for (const n of [1, 2, 4]) {
      const dot = screen.getByRole('button', { name: `Go to slide ${n}` });
      expect(dot.getAttribute('aria-current') === null || dot.getAttribute('aria-current') === 'false').toBe(true);
    }
  });

  it('ArrowRight / ArrowLeft on the focused region change slides', () => {
    render(<Carousel images={makeImages(3)} label="Gallery" />);
    const r = region();
    expect(r.tabIndex).toBe(0);
    fireEvent.keyDown(r, { key: 'ArrowRight' });
    expect(currentSlide()).toHaveAttribute('aria-label', '2 of 3');
    fireEvent.keyDown(r, { key: 'ArrowLeft' });
    fireEvent.keyDown(r, { key: 'ArrowLeft' });
    expect(currentSlide()).toHaveAttribute('aria-label', '3 of 3');
  });

  it('announces "Slide X of N" in a polite live region', () => {
    render(<Carousel images={makeImages(3)} label="Gallery" />);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Slide 1 of 3');
    expect(status).toHaveAttribute('aria-live', 'polite');
    fireEvent.click(screen.getByRole('button', { name: 'Next slide' }));
    expect(screen.getByRole('status')).toHaveTextContent('Slide 2 of 3');
  });

  it('handles a single image (no controls) and no images (message, no controls)', () => {
    const view = render(<Carousel images={makeImages(1)} label="Gallery" />);
    expect(screen.getByRole('img', { name: 'Photo 1' })).toBeInTheDocument();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    view.unmount();
    render(<Carousel images={[]} label="Gallery" />);
    expect(screen.getByText(/No images to display/)).toBeInTheDocument();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.queryAllByRole('img')).toHaveLength(0);
  });
});
