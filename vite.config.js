import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const root = path.dirname(fileURLToPath(import.meta.url));

// Plain Vite build for static hosting (Netlify). The "@" alias is set here
// explicitly instead of relying on the Base44 builder plugin.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(root, 'src') },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 2000,
  },
  server: { port: 5173 },
});
