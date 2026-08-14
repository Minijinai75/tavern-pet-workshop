import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    emptyOutDir: true,
    minify: false,
    sourcemap: true,
    lib: {
      entry: 'resident-loader/src/index.ts',
      name: 'ResidentLoader',
      formats: ['es'],
      fileName: () => 'index.js',
    },
    rollupOptions: {
      output: {
        assetFileNames: 'style.css',
      },
    },
    outDir: 'resident-loader/dist',
  },
});
