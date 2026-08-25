import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    emptyOutDir: false,
    outDir: 'dist',
    lib: {
      entry: resolve(import.meta.dirname, 'src/content/index.ts'),
      formats: ['iife'],
      name: 'MusicDiscoveryOverlayContent',
      fileName: () => 'content.js',
    },
    target: 'chrome149',
    minify: true,
  },
});
