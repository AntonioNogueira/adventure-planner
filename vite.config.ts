import fs from 'fs';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { planApi } from './server/plan-api';

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, '.', '');
  // Login options shown in the login dialog: email, google, facebook, apple (each enabled in Firebase).
  const authProviders = (env.AUTH_PROVIDERS || 'email,google').replace(/[^a-z,]/g, '');
  // Checkout links for paid plans (e.g. Stripe Payment Links or Paddle/Lemon Squeezy checkouts); empty = "coming soon".
  const checkout = Object.fromEntries((['explorer', 'trip_pass', 'pro'] as const)
    .map(id => [id, (env[`CHECKOUT_URL_${id.toUpperCase()}`] || '').trim()])
    .filter(([, url]) => /^https:\/\//.test(url)));
  // Affiliate IDs for the booking links in place popups (empty = links without commission).
  const ids = ([['booking', 'BOOKING_AID'], ['getyourguide', 'GETYOURGUIDE_PARTNER_ID']] as const)
    .map(([key, name]) => [key, (env[name] || '').replace(/[^\w-]/g, '')]);
  // Partner link templates (https only) with {q} {name} {town} {checkin} {checkout}.
  const templates = ([['hostels', 'AFFILIATE_HOSTELS_URL'], ['campsites', 'AFFILIATE_CAMPSITES_URL'], ['rentals', 'AFFILIATE_RENTALS_URL']] as const)
    .map(([key, name]) => [key, (env[name] || '').trim()])
    .map(([key, url]) => [key, /^https:\/\/[^\s"<>]+$/.test(url) ? url : '']);
  const affiliates = Object.fromEntries([...ids, ...templates].filter(([, v]) => v));
  // OpenStreetMap servers (https only): own or paid ones in production; empty = the free public servers.
  const https = (v?: string) => (v || '').split(',').map(s => s.trim()).filter(u => /^https:\/\/[^\s"<>]+$/.test(u));
  const services = Object.fromEntries(([
    ['overpass', https(env.OVERPASS_URL)], ['photon', https(env.PHOTON_URL)[0]], ['nominatim', https(env.NOMINATIM_URL)[0]], ['osrm', https(env.OSRM_URL)[0]],
    ['valhalla', https(env.VALHALLA_URL)[0]], ['brouter', https(env.BROUTER_URL)[0]],
  ] as const).filter(([, v]) => (Array.isArray(v) ? v.length : v)));
  const appConfig = JSON.stringify({ authProviders, checkout, affiliates, services }).replace(/</g, '\\u003c');
  const configScript = `<script>window.__APP_CONFIG__ = ${appConfig};</script>`;
  const servePage = (html: string) => html.replace('<!--APP_CONFIG-->', configScript);
  // Hosting services (Render, Cloud Run…) tell the app which port to use.
  const port = Number(process.env.PORT) || 3000;

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
        // The app's settings are inserted when the page is served, not baked into the build,
        // so one build works with whatever settings the server is started with.
        name: 'app-config',
        transformIndexHtml(html) {
          return command === 'build' ? html : servePage(html);
        },
        configurePreviewServer(server) {
          server.middlewares.use((req, res, next) => {
            const pathname = (req.url || '/').split('?')[0];
            if (pathname !== '/' && pathname !== '/index.html') return next();
            const file = path.resolve(server.config.root, server.config.build.outDir, 'index.html');
            res.setHeader('Content-Type', 'text/html');
            res.end(servePage(fs.readFileSync(file, 'utf8')));
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
      // The map chunk (MapLibre) is ~1 MB and loads after the first paint; don't warn about it.
      chunkSizeWarningLimit: 1200,
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
