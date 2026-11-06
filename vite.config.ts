import fs from 'fs';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { planApi } from './server/plan-api';

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, '.', '');
  const mapsKey = env.GOOGLE_MAPS_API_KEY || env.VITE_GOOGLE_MAPS_API_KEY || '';
  // Hosting services (Render, Cloud Run…) tell the app which port to use.
  const port = Number(process.env.PORT) || 3000;
  if (!mapsKey) {
    console.warn('\n[adventure-planner] VITE_GOOGLE_MAPS_API_KEY is not set. Copy .env.example to .env.local and add your key.\n');
  }

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    preview: {
      port,
      host: '0.0.0.0',
      // Allow the hosting service's domain (e.g. adventure-planner.onrender.com).
      allowedHosts: true,
    },
    plugins: [
      react(),
      tailwindcss(),
      // AI keys stay on the server: the browser calls /api/plan instead of Gemini/OpenAI directly.
      planApi(env),
      {
        // The Maps key is inserted when the page is served, not baked into the build,
        // so one build works with whatever key the server is started with.
        name: 'maps-key',
        transformIndexHtml(html) {
          return command === 'build' ? html : html.replace(/__MAPS_API_KEY__/g, mapsKey);
        },
        configurePreviewServer(server) {
          server.middlewares.use((req, res, next) => {
            const pathname = (req.url || '/').split('?')[0];
            if (pathname !== '/' && pathname !== '/index.html') return next();
            const file = path.resolve(server.config.root, server.config.build.outDir, 'index.html');
            res.setHeader('Content-Type', 'text/html');
            res.end(fs.readFileSync(file, 'utf8').replace(/__MAPS_API_KEY__/g, mapsKey));
          });
        },
      },
    ],
    // Pre-bundle Firebase together so its modules share one app instance in development.
    optimizeDeps: {
      include: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
    },
    build: {
      target: 'esnext',
      rollupOptions: {
        output: {
          manualChunks: {
            firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
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
