import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://ero-72v4.onrender.com',
        changeOrigin: true,
        secure: false,
      },
      '/x402': {
        target: 'https://ero-72v4.onrender.com',
        changeOrigin: true,
        secure: false,
      },
      '/ws': {
        target: 'wss://ero-72v4.onrender.com',
        ws: true,
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
