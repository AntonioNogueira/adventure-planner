# Adventure Planner – business notes (for later)

Ideas and decisions saved for when the project moves from prototype to product. Nothing here is built yet
except where it says so.

## 1. Project accounts (do this first, before payments or real users)

Use accounts that belong to the project, not personal ones, so the project can be handed over, shared with a
partner or sold, and so personal email stays separate.

| What | Suggestion | Notes |
|---|---|---|
| Email | A project mailbox, e.g. `hello@<domain>` (Google Workspace ~€7/month) or a free Gmail for now | Use it to own every account below. Turn on 2-step verification. |
| Domain | e.g. `adventureplanner.app` (~€15–20/year) | Also gives the app a proper address instead of `onrender.com`. |
| Google Cloud / Firebase | Add the project email as **Owner** of project `gen-lang-client-0295109398` (IAM), later remove the personal account; or create a new project and move | Billing account in the project's name; budget alerts at €1/€10/€50. New Maps key restricted to the app's domains. |
| Gemini / AI keys | New keys created by the project account | Keep keys only in Render settings and `.env.local`, never in git. |
| GitHub | A GitHub **organization** (free) owned by the project email; transfer `adventure-planner` to it | Keeps history; Render reconnects to the new owner. |
| Render (hosting) | A Render account or team with the project email | Connect the Blueprint (`render.yaml`); every push to `main` deploys. |
| Payments | Paddle or Lemon Squeezy (they handle EU VAT as merchant of record) or Stripe (+ Stripe Tax) | Needs business/tax details (NIF, address, IBAN). Pix for Brazil via Stripe or Mercado Pago. |
| Map/route services for production | MapTiler or Thunderforest (topo tiles), own BRouter/Valhalla or GraphHopper | The free public servers (OpenTopoMap, brouter.de, valhalla1.openstreetmap.de, Overpass) are fair-use only. |

## 2. Plans and prices (prototype built: `src/lib/plans.ts`)

| | Visitor | Free | Explorer | Trip Pass | Pro |
|---|---|---|---|---|---|
| Price | – | €0 | €4.99/month or €39/year | €7.99 once (3 months) | €24/month |
| Saved trips | – | 3 | unlimited | unlimited | unlimited |
| AI plans / day | 5 | 10 | 100 | 100 | 400 |
| Place searches / day | 10 | 20 | 300 | 300 | 1500 |
| Documents / day | 2 | 5 | 200 | 200 | 1000 |

- Market check: Komoot ~€60/year, Ride with GPS ~€8–10/month, Calimoto ~€50/year, Kurviger Tourer+ ~€30/year,
  Wanderlog ~€40–60/year. €30/month only works for businesses (guides, tour operators).
- "Unlimited" = fair use with soft caps, to protect against Google Places costs.
- Free could run on OpenStreetMap data (the Open version) and paid plans add Google Places.

## 3. Costs to watch

- **Google Places** is the main cost: ~€0.03 per search; a trip with 5 stops × 4 categories ≈ 20 searches ≈ €0.30–0.60.
  Asking for price level/range (used by the budget) moves food and stay searches to the "Enterprise" SKU (~10% more).
- Routes / geocoding / elevation: ~€0.005 per request after the monthly free allowance.
- Gemini Flash-Lite (paid tier): a fraction of a cent per plan.
- OpenStreetMap services for real traffic: paid tiles (€20–80/month) or self-hosting (a small server ~€20–40/month).

## 4. To build when payments start

1. Payment provider account + products for Explorer (monthly/yearly), Trip Pass and Pro.
2. Checkout links in Render settings (`CHECKOUT_URL_EXPLORER`, …) – the Upgrade buttons already use them.
3. A webhook (small server function with Firebase Admin credentials) that sets `users/{uid}.plan` and `planUntil`.
4. Usage counts stored in Firestore (today they're in memory and reset on restart).
5. Places calls through the server, so limits can't be bypassed.
6. Terms of service, privacy policy (GDPR), cookie notice, VAT invoices.

## 5. Affiliate links (monetise the place popups, all plans)

Affiliate links fit better than ads: the popups already have a named place, its town and the trip's nights.

| Type | Programmes | Typical earnings | Where in the app |
|---|---|---|---|
| Accommodation | Booking.com Affiliate Partner Program, Expedia Group (Hotels.com), Agoda; Hostelworld (hostels); Pitchup, ACSI (campsites) | ~4–6% of the booking (≈ €3 on a €70 night) | "Check prices" on places to stay and booked stops, with the schedule's dates |
| Aggregators | Travelpayouts (many brands, one account), Stay22 (auto-affiliates accommodation links) | same commissions, less setup | quickest start |
| Activities | GetYourGuide, Viator | ~8% | points of interest ("Tickets & tours") |
| Rentals / gear | DiscoverCars, Rentalcars; motorcycle rental networks; outdoor / moto gear shops | varies | shops category, trip start |
| Display ads | Google AdSense | very low at small traffic | not recommended (clutter; Google Maps Platform rules limit ads on/over the map) |

- Needs: a public site with content for approval (own domain helps), a disclosure line ("we may earn a commission"),
  and cookie consent (GDPR) for tracking.
- Conversion is typically 2–5% of clicks: meaningful only with volume.
- Build plan: links generated from place name + town + nights, affiliate IDs in server settings (BOOKING_AID,
  GETYOURGUIDE_PARTNER_ID, …); without IDs the links still work, just without commission.

## 6. Other ideas

- Partnerships: campsites / hostels (affiliate booking links), bike and moto rental, local guides.
- Pro features: several riders per trip, shared editing, branded PDF itineraries, GPX packs for groups.
- Curated off-road routes (e.g. Trans Euro Trail-style tracks) as a premium layer.
