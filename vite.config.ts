/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  worker: { format: 'es' },
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
