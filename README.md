# Adventure Planner

Plan your next adventure with AI. Map it. Save it.

Describe a trip ("3-day bike trip from Porto to Lisbon along the coast") and the AI planner builds a day-by-day route with overnight stops. Each stop gets recommendations for places to stay, food, bike/moto shops and points of interest. The route is drawn on Google Maps, and you can sign in with Google to save expeditions to Firestore.

## Run locally

**Prerequisites:** Node.js 20+

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env.local` and fill in your keys:
   - `VITE_GOOGLE_MAPS_API_KEY`: needs the **Maps JavaScript**, **Directions** and **Geocoding** APIs enabled.
   - `GEMINI_API_KEY`: the free way to run the AI planner. Create a key at https://aistudio.google.com/apikey in a project **without billing** so it uses the free tier (default model `gemini-flash-lite-latest`, falling back to `gemini-flash-latest` when busy).
   - Optional: `ANTHROPIC_API_KEY` to use Claude instead (paid API, default model `claude-opus-5-5`; a Claude.ai subscription does not include API access) or `OPENAI_API_KEY`. Providers are tried in the order Claude, Gemini, OpenAI, skipping any without a key.
3. Start the dev server:
   ```bash
   npm run dev
   ```
   Open http://localhost:3000.

`npm start` builds the app and serves the production build (including the `/api/plan` endpoint) on port 3000.

## How it fits together

| Part | Where | Notes |
|---|---|---|
| UI | `src/` (React 19 + Tailwind 4) | Responsive: sidebar on desktop, map above the planner on phones |
| Map, routes, geocoding | `src/components/Map.tsx`, `src/App.tsx` | Google Maps JS API, loaded in `index.html` |
| AI planner | `server/plan-api.ts` → `POST /api/plan` | Gemini, Claude or OpenAI with structured JSON output; runs on the server so AI keys never reach the browser. A plan takes about 10–20 s |
| Sign-in and saved trips | `src/firebase.ts`, `firestore.rules` | Firebase Auth (Google) + Firestore `trips` collection |

## API keys and security

- `.env.local` is git-ignored. Never commit real keys.
- The Google Maps key is visible in the browser by design. In Google Cloud Console, restrict it by **HTTP referrer** (for example `http://localhost:3000/*` and your production domain) and to the Maps APIs only.
- The Firebase web config in `firebase-applet-config.json` is public by design. Firestore access is controlled by `firestore.rules`.
- Anthropic, Gemini and OpenAI keys are only read by the server (`server/plan-api.ts`).

## Deploying

The `/api/plan` endpoint runs inside the Vite dev/preview server. For a production host, either run `npm start` on a Node host (Cloud Run, Render, Fly.io…), or move `server/plan-api.ts` into a serverless function (Firebase Functions, Vercel, Netlify) and deploy the static `dist/` folder. Add your production domain to Firebase Auth's authorized domains.
