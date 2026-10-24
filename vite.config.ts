import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { planApi } from './server/plan-api';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const mapsKey = env.GOOGLE_MAPS_API_KEY || env.VITE_GOOGLE_MAPS_API_KEY || '';
  if (!mapsKey) {
    console.warn('\n[adventure-planner] VITE_GOOGLE_MAPS_API_KEY is not set. Copy .env.example to .env.local and add your key.\n');
  }

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    preview: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      tailwindcss(),
      // AI keys stay on the server: the browser calls /api/plan instead of Gemini/OpenAI directly.
      planApi(env),
      {
        name: 'html-transform',
        transformIndexHtml(html) {
          return html.replace(/%VITE_GOOGLE_MAPS_API_KEY%/g, mapsKey);
        },
      },
    ],
    build: {
      target: 'esnext',
      rollupOptions: {
        output: {
          manualChunks: {
            firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
