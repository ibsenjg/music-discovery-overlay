import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  publicDir: 'public',
  build: {
    emptyOutDir: true,
    outDir: 'dist',
    rolldownOptions: {
      input: {
        frame: resolve(import.meta.dirname, 'frame/index.html'),
        background: resolve(import.meta.dirname, 'src/background.ts'),
      },
      output: {
        entryFileNames: (chunk) =>
          chunk.name === 'background'
            ? 'background.js'
            : 'assets/[name]-[hash].js',
      },
    },
    target: 'chrome149',
  },
});
