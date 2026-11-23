import Carousel from './Carousel';
import { sampleImages } from './images';
import './styles.css';

export default function App() {
  return (
    <main className="app">
      <h1>Image carousel</h1>
      <p className="hint">Autoplay every 3 s. Hover or focus the carousel to pause it; use the arrow keys when it is focused.</p>
      <Carousel images={sampleImages} label="Landscapes" autoplayMs={3000} />

      <h2>Single image (no controls)</h2>
      <Carousel images={sampleImages.slice(0, 1)} label="Single landscape" />

      <h2>No images</h2>
      <Carousel images={[]} label="Empty gallery" />
    </main>
  );
}
