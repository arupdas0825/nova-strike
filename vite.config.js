import { defineConfig } from 'vite';

export default defineConfig({
  base: '/nova-strike/',
  build: {
    minify: 'esbuild',
    sourcemap: false,
    outDir: 'dist'
  },
  esbuild: {
    drop: ['console', 'debugger']
  },
  server: {
    port: 5173,
    open: true
  }
});
