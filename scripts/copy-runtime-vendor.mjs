// Copies the UMD builds used inside the sandboxed runner iframe into public/runner/vendor.
// They are served locally so the coding environment works offline (no CDN, no remote bundler).
import { copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'public/runner/vendor');
mkdirSync(out, { recursive: true });
const files = [
  ['node_modules/react/umd/react.development.js', 'react.development.js'],
  ['node_modules/react-dom/umd/react-dom.development.js', 'react-dom.development.js'],
  ['node_modules/@testing-library/dom/dist/@testing-library/dom.umd.js', 'testing-library-dom.umd.js'],
];
for (const [from, to] of files) {
  const src = join(root, from);
  if (!existsSync(src)) { console.warn(`[copy-runtime-vendor] missing ${from} — run npm install`); continue; }
  copyFileSync(src, join(out, to));
}
console.log('[copy-runtime-vendor] runner vendor files ready');
