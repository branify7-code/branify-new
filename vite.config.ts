import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          // Split heavy vendors into cacheable chunks (three.js and motion
          // dominate the main bundle otherwise).
          manualChunks: {
            'vendor-three': ['three'],
            'vendor-motion': ['framer-motion'],
            'vendor-supabase': ['@supabase/supabase-js'],
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      // AI endpoints: Vercel serves /api/ai/* as serverless functions in
      // production; in dev they are proxied to the local AI API
      // (scripts/local-api.ts, port 3033 — start with `npm run api`).
      proxy: {
        '/api/ai': {
          target: 'http://127.0.0.1:3033',
          changeOrigin: false,
        },
      },
    },
  };
});
