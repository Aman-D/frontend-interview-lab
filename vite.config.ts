/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  worker: { format: 'es' },
  // Pre-bundle everything the lazily loaded routes and workers import, so the dev server never has to
  // re-optimise dependencies (and reload) the first time the workspace opens. A re-optimisation while a
  // page is loading can leave the browser executing a stale chunk ("SyntaxError: Unexpected number").
  optimizeDeps: {
    entries: ['index.html', 'src/**/*.{ts,tsx}', '!src/content/problems/**', '!src/**/*.test.{ts,tsx}'],
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react-router-dom',
      'dexie',
      'dexie-react-hooks',
      'zod',
      'clsx',
      'lucide-react',
      'react-markdown',
      'remark-gfm',
      'react-resizable-panels',
      '@monaco-editor/react',
      'monaco-editor',
      'typescript',
    ],
  },
  build: { chunkSizeWarningLimit: 6000 },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    // Problem test files run inside the sandboxed browser runner (npm run verify:solutions), not in Vitest.
    exclude: ['src/content/problems/**', 'node_modules/**'],
  },
});
