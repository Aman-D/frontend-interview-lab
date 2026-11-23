// Sample images as inline SVG data URIs, so the preview never touches the network.
import type { CarouselImage } from './Carousel';

function scene(sky: string, ground: string, sun: string, caption: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">` +
    `<rect width="640" height="360" fill="${sky}"/>` +
    `<circle cx="500" cy="96" r="44" fill="${sun}"/>` +
    `<path d="M0 260 L140 170 L260 240 L400 140 L640 270 L640 360 L0 360 Z" fill="${ground}"/>` +
    `<text x="32" y="330" font-family="system-ui, sans-serif" font-size="28" fill="#ffffff">${caption}</text>` +
    `</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export const sampleImages: CarouselImage[] = [
  { src: scene('#7dd3fc', '#166534', '#fde047', 'Morning hills'), alt: 'Green hills under a bright morning sun' },
  { src: scene('#fdba74', '#7c2d12', '#fef3c7', 'Desert dusk'), alt: 'Red desert ridges at dusk' },
  { src: scene('#1e3a8a', '#0f172a', '#e2e8f0', 'Moonlit peaks'), alt: 'Dark mountain peaks under a full moon' },
  { src: scene('#a7f3d0', '#065f46', '#fca5a5', 'Spring valley'), alt: 'A green valley with a pink sun in spring' },
  { src: scene('#e9d5ff', '#4c1d95', '#fbcfe8', 'Violet ridge'), alt: 'Purple ridgeline under a lavender sky' },
];
