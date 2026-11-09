import fs from 'fs';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { planApi } from './server/plan-api';

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, '.', '');
  const mapsKey = env.GOOGLE_MAPS_API_KEY || env.VITE_GOOGLE_MAPS_API_KEY || '';
  // 'google' (default) or 'osm' for Adventure Planner Open (OpenStreetMap services, no Maps key).
  const mapProvider = env.MAP_PROVIDER === 'osm' ? 'osm' : 'google';
  // Login options shown in the login dialog: email, google, facebook, apple (each enabled in Firebase).
  const authProviders = (env.AUTH_PROVIDERS || 'email,google').replace(/[^a-z,]/g, '');
  // Tells the page which map stack to use; the Google Maps script is only loaded for 'google'.
  // Checkout links for paid plans (e.g. Stripe Payment Links or Paddle/Lemon Squeezy checkouts); empty = "coming soon".
  const checkout = Object.fromEntries((['explorer', 'trip_pass', 'pro'] as const)
    .map(id => [id, (env[`CHECKOUT_URL_${id.toUpperCase()}`] || '').trim()])
    .filter(([, url]) => /^https:\/\//.test(url)));
  // Affiliate IDs for the booking links in place popups (empty = links without commission).
  const affiliates = Object.fromEntries(([['booking', 'BOOKING_AID'], ['getyourguide', 'GETYOURGUIDE_PARTNER_ID']] as const)
    .map(([key, name]) => [key, (env[name] || '').replace(/[^\w-]/g, '')])
    .filter(([, id]) => id));
  const appConfig = JSON.stringify({ mapProvider, authProviders, checkout, affiliates }).replace(/</g, '\\u003c');
  const providerScripts = `<script>window.__APP_CONFIG__ = ${appConfig};</script>`
    + (mapProvider === 'google'
      ? `\n    <script src="https://maps.googleapis.com/maps/api/js?libraries=places,geometry&key=${mapsKey}&v=weekly&loading=async" async></script>`
      : '');
  const servePage = (html: string) => html.replace('<!--MAP_PROVIDER_SCRIPTS-->', providerScripts);
  // Hosting services (Render, Cloud Run…) tell the app which port to use.
  const port = Number(process.env.PORT) || 3000;
  if (!mapsKey && mapProvider === 'google') {
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
        // The map provider (and Google Maps key) is inserted when the page is served, not baked
        // into the build, so one build works with whatever settings the server is started with.
        name: 'maps-key',
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
