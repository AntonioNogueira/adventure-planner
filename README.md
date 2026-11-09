# Adventure Planner

Plan your next adventure with AI. Map it. Save it.

Describe a trip ("Cádiz to Silves, bikepacking, about 60 km per day") and the planner builds a day-by-day route on Google Maps:

- **Overnight stops** from the real route, split by effort (distance plus climbing), each at a town with somewhere to sleep
- **Real places** to stay, eat, fix the bike and visit at every stop (Google Places), each with its own map pin
- **Itinerary** with dates, rest days, climbing and elevation profile per day, and a weather forecast per day
- **GPX export** of the whole trip or a single day for Garmin, Wahoo, Komoot…
- **Bookings**: attach a confirmation PDF, email or screenshot; it's read, filed under the right stop, priced, and checked against your dates
- **Editing**: drag stops, click the map to add one, avoid highways/ferries/tolls, remove suggestions
- **Save and share**: sign in with Google to save trips (with their booking files) and share a read-only link

## Two versions: Google or OpenStreetMap ("Adventure Planner Open")

One codebase, two map stacks, chosen with `MAP_PROVIDER` in `.env.local` (or on the host):

| | `MAP_PROVIDER=google` (default) | `MAP_PROVIDER=osm` – Adventure Planner Open |
|---|---|---|
| Map | Google Maps | [MapLibre](https://maplibre.org) + [OpenFreeMap](https://openfreemap.org) (Map / Light), [OpenTopoMap](https://opentopomap.org), [EOX Sentinel-2](https://s2maps.eu) satellite (non-commercial) |
| Routing | Routes API / Directions | [OSRM](https://routing.openstreetmap.de) (car, bike, foot); [Valhalla](https://valhalla1.openstreetmap.de) for car routes avoiding highways/tolls/ferries |
| Elevation | Elevation API | Valhalla `/height` |
| Place search | Geocoding API | [Photon](https://photon.komoot.io) |
| Suggestions | Places API (New) | [Overpass](https://overpass-api.de) (OpenStreetMap data) |
| Keys | Google Maps key | none (Gemini key still needed for the AI) |

The OSM services are free public servers with fair-use limits: fine for personal use and testing; for many users, self-host them (all have Docker images) or use an OSM-based provider. Everything else (AI planner, itinerary, bookings, GPX, weather, saving and sharing) is the same in both.

## Run locally

**Prerequisites:** Node.js 20+

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env.local` and fill in your keys (set `MAP_PROVIDER=osm` for the open version, which needs no Maps key):
   - `VITE_GOOGLE_MAPS_API_KEY`: needs the **Maps JavaScript**, **Directions**, **Geocoding**, **Elevation** and **Places API (New)** APIs enabled (and allowed in the key's API restrictions). Optionally enable the **Routes API** too: the app uses it when available and falls back to Directions otherwise.
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
| AI planner | `server/plan-api.ts` → `POST /api/plan` | The AI (Gemini, Claude or OpenAI) only reads the request: start, finish, mode, days or daily distance, places to pass, lodging type. Runs on the server so AI keys never reach the browser |
| Overnight stops | `src/lib/tripBuilder.ts` | Google Maps calculates the real route and splits it into days at the daily distance; each night is placed at the nearest accommodation (Places). Detours suggested by the AI are dropped |
| Suggestions | `src/lib/places.ts` | Google Places: 3 places to stay, eat, fix the bike and visit near every stop, each with its own map pin (🛏 🍴 🔧 📷) that can be hidden from the legend |
| Editing stops | `src/components/StopDetails.tsx`, `src/App.tsx` | Drag pins to move a stop (snaps to the nearest town, recalculates the route and refreshes suggestions); remove suggestions; attach booking PDFs, `.eml` emails or screenshots, which the AI reads and files under the matching stop (`POST /api/extract-reservation`) |
| Routing | `src/lib/routing.ts` | Routes API when enabled, Directions service otherwise; avoid highways/ferries/tolls |
| Elevation and effort | `src/lib/elevation.ts` | Climbing per day and profile; days are split by distance + climbing (10 km per 1000 m by bike) |
| Itinerary | `src/components/Itinerary.tsx`, `src/lib/schedule.ts`, `src/lib/weather.ts` | Dates, rest days, Open-Meteo forecast per day, booking costs and date checks |
| Segment details | `src/components/SegmentDetails.tsx`, `src/lib/terrain.ts`, `src/lib/osmRoads.ts` | Click a day on the map: gradient-coloured terrain profile (bike/hike), main roads and average speed (moto/car), and speed limits, surface and road types from OpenStreetMap via the public [Valhalla](https://valhalla1.openstreetmap.de) service (fair use) |
| GPX | `src/lib/gpx.ts` | Whole trip (one track per day) or one day, with stops and bookings as waypoints |
| Sign-in, saved and shared trips | `src/firebase.ts`, `firestore.rules`, `storage.rules` | Firebase Auth (Google), Firestore `trips` (shared trips open with `?trip=<id>`), Storage for booking files |

## Monitoring AI usage

Every AI call prints a line in the terminal running `npm run dev`, plus a running total:

```
[ai] understood: Cádiz, Spain → Huelva, Spain → Silves, Portugal · BICYCLING · 60 km/day · lodging any
[ai] plan · gemini-flash-lite-latest · 6.7s · ok, tokens 373 in / 176 out
[ai] session total: 1 calls (0 failed), 373 in / 176 out tokens
```

`FAILED 503 (busy, will retry)` means Google's servers were busy (not your quota); `429` means the free-tier limit was hit. Daily usage and limits are in [AI Studio](https://aistudio.google.com) → Usage, and in Google Cloud Console → APIs & Services → Generative Language API → Metrics.

## API keys and security

- `.env.local` is git-ignored. Never commit real keys.
- The Google Maps key is visible in the browser by design. In Google Cloud Console, restrict it by **HTTP referrer** (for example `http://localhost:3000/*` and your production domain) and to the Maps APIs only.
- The Firebase web config in `firebase-applet-config.json` is public by design. Firestore access is controlled by `firestore.rules`.
- Anthropic, Gemini and OpenAI keys are only read by the server (`server/plan-api.ts`).
- Booking files are uploaded to Firebase Storage (`users/<uid>/attachments`) when a signed-in user saves a trip.

## Firebase setup (saving, sharing, booking files)

The app uses the Firebase project in `firebase-applet-config.json`. In the [Firebase console](https://console.firebase.google.com):

1. **Firestore → Rules**: paste `firestore.rules` and publish (allows share links).
2. **Storage → Get started**, then **Rules**: paste `storage.rules` and publish. Storage may ask you to switch the project to the pay-as-you-go Blaze plan; a personal project normally stays within its free allowance. Without Storage, trips still save their booking details, just not the files.
3. **Authentication → Settings → Authorized domains**: add `localhost` (for running on your PC) and the domain you deploy to (e.g. `adventure-planner.onrender.com`).
4. **Authentication → Sign-in method**: enable **Email/Password** and **Google**. Facebook and Apple are optional (they need a Facebook developer app / an Apple Developer account); list the ones you enable in `AUTH_PROVIDERS` (default `email,google`).

## Deploying

The app runs as one Node service: `npm run build`, then `npx vite preview` serves the page and the `/api` endpoints on `$PORT`. Keys are read at start-up, so the same build works anywhere.

**Render (free tier, simplest):**
1. On [render.com](https://render.com), sign in with GitHub → **New → Blueprint** → choose this repository (it uses `render.yaml`).
2. Enter `VITE_GOOGLE_MAPS_API_KEY` and `GEMINI_API_KEY` when asked, then deploy.
3. Free services sleep after inactivity; the first visit after a while takes ~30 s to wake up.

**Google Cloud Run (Docker):**
```bash
gcloud run deploy adventure-planner --source . --region europe-west1 --allow-unauthenticated \
  --set-env-vars VITE_GOOGLE_MAPS_API_KEY=...,GEMINI_API_KEY=...
```

**After deploying:**
- Add the new domain to Firebase **Authorized domains** (above).
- In Google Cloud Console → Credentials, restrict the Maps key to **HTTP referrers** `http://localhost:3000/*` and `https://<your-domain>/*`.
- AI requests are limited to `AI_REQUESTS_PER_HOUR` (default 60) per visitor so a public link can't use up your Gemini quota.

## Booking links (affiliate)

Places to stay get **Check prices** (Booking.com, searching for that place and town, with the nights at that stop
when the trip has a start date); points of interest get **Tickets & tours** (GetYourGuide). Set `BOOKING_AID` and
`GETYOURGUIDE_PARTNER_ID` once the affiliate accounts are approved; without them the links work without commission.
The popups show a one-line disclosure. Links are built in `src/lib/affiliate.ts`.

## Plans and limits (prototype)

Plans and their daily limits are in `src/lib/plans.ts`:

| | Visitor (logged out) | Free | Explorer €4.99/month · €39/year | Trip Pass €7.99 (3 months) | Pro €24/month |
|---|---|---|---|---|---|
| Saved trips | – | 3 | unlimited | unlimited | unlimited |
| AI plans / day | 5 | 10 | 100 | 100 | 400 |
| Place searches / day | 10 | 20 | 300 | 300 | 1500 |
| Documents read / day | 2 | 5 | 200 | 200 | 1000 |

- The server checks the caller's Firebase login token and counts AI plans, place searches and document reads per day
  (in memory, so counts reset when the server restarts). Over a limit, the app shows the **Plans** screen.
- A user's plan is the `plan` field (`free`, `explorer`, `trip_pass`, `pro`) on their `users/{uid}` document in Firestore,
  with an optional `planUntil` timestamp (Trip Pass). Set it by hand in the Firebase console for now; the security rules
  stop users from changing it themselves (publish the updated `firestore.rules`).
- For testing without Firestore: `PLAN_OVERRIDES=you@example.com=explorer`. Change limits with `PLAN_LIMITS` (JSON).
- **Upgrade** buttons open `CHECKOUT_URL_EXPLORER` / `_TRIP_PASS` / `_PRO` (e.g. Stripe Payment Links, which get the
  buyer's email and Firebase uid as `client_reference_id`). Turning a payment into a plan automatically needs a small
  webhook with Firebase Admin credentials: the next step once a payment account exists.
- Saved-trip limits are checked in the app; place searches are counted before suggestions load. For hard limits on
  Google Places costs, the Places calls would move behind the server too.
