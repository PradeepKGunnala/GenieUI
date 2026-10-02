import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src/legacy", import.meta.url)) } },
  plugins: [react()],
  server: { host: '127.0.0.1', port: 3000, strictPort: true, proxy: { '/api': { target: process.env.GENIE_BACKEND_URL || 'http://127.0.0.1:8080', changeOrigin: true } } },
  clearScreen: false,
});
