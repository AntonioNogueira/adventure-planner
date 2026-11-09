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
- "Unlimited" = fair use with soft caps (AI and place-server load).
- Decided (Nov 2026): one version on OpenStreetMap data for everyone; no Google Places (section 10).

## 3. Costs to watch

- *(Before Nov 2026, Google version)* **Google Places** was the main cost: ~€0.03 per search; a trip with 5 stops × 4 categories ≈ 20 searches ≈ €0.30–0.60.
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

## 6. When does it pay? (rough model, per monthly active user)

| | Free user on OpenStreetMap data | Free user on Google Places |
|---|---|---|
| Cost / month | ~€0.01–0.03 (AI, routes, hosting share) | ~€0.30–0.60 per trip planned (Places searches) |
| Affiliate revenue / month | ~€0.03–0.10 (10–20% click a booking link, 2–5% of those book, ~€8 commission) | same |
| Subscriptions (2–4% of actives × ~€4 net) | ~€0.08–0.16 | same |

- Fixed costs to start: hosting €7–25, domain ~€2, email €0–7, later own map/route servers €30–80 → ~€50–100/month.
- **Break-even ≈ 1,000 monthly active users** if free users run on OpenStreetMap data (or capped Google searches);
  ~10–20k actives for €2–3k/month. Unlimited Google Places for free users loses money: keep the daily caps.

## 7. Name, trademark, domain, email

- Candidates near "Mappa Mundi" (medieval world map): Mappamundi, Mapamundi (PT/ES spelling), Mappa Trail,
  Mundi Trails, Itinera / Itinerarium (Roman road itineraries), Portolano (medieval sea charts), Rota Mundi, Rumo.
  Avoid Cartamundi (a large playing-card company).
- "Mappa Mundi" alone is a historical/descriptive term: hard to register and to defend. A distinctive combination
  (e.g. "Mappamundi Trails", "Mundi Trails") is stronger.
- Trademark: not mandatory, but check conflicts first (EUIPO TMview, WIPO Global Brand Database, INPI Portugal).
  Costs: INPI Portugal ≈ €120–200 per class; EU trademark (EUIPO) €850 for 1 class, +€50 the 2nd, +€150 each further.
  Classes: 9 (apps/software), 39 (travel arrangement), 42 (online software/SaaS).
- Domains: .com (first choice), .app (HTTPS-only, ~€15/year, good for an app), .travel (~€100/year), .pt, .eu.
  Check availability at a registrar (Cloudflare Registrar sells at cost; Namecheap, Porkbun, PTisp for .pt).
  Buy the .com and the .app (and the .pt if you're in Portugal) of the chosen name together.
- Email on the domain: Cloudflare Email Routing (free forwarding to a Gmail, send-as from Gmail) to start;
  Zoho Mail (free plan for a few users) or Google Workspace (~€7/user/month) when you need real mailboxes.

## 8. Earning legally in Portugal: self-employed first, company later

General orientation, not legal/tax advice: thresholds and rates change; confirm with a certified accountant
(contabilista certificado) or the Finanças.

- **Prototype, no income:** nothing to register yet.
- **When applying to affiliate programmes or charging:** open activity as *trabalhador independente* on the Portal das
  Finanças (free, minutes; choose an activity code such as web portals/software). Invoice from the first euro
  (faturas / recibos verdes).
  - VAT: exemption possible below a yearly turnover threshold (≈ €15,000; check the current value).
    Affiliate commissions from foreign companies (Booking.com NL, GetYourGuide DE) are B2B services: declare them;
    EU reverse-charge rules apply.
  - Subscriptions to consumers across the EU: use a merchant of record (Paddle, Lemon Squeezy) so they handle VAT in
    each country and you invoice them only.
  - Social security: usually exempt the first 12 months, then a share of income. Income tax: category B in the annual
    IRS return, usually the simplified regime.
  - Affiliate programmes ask for NIF, address, IBAN, sometimes a VAT number: having activity open helps approval.
- **Unipessoal Lda later** (~€360 via Empresa na Hora; accountant mandatory, ~€100–200/month): separates personal
  assets, can lower tax at higher profit. Typical switch around €30–40k/year profit, or with partners/investors.
- One consultation with an accountant when opening activity is usually enough to set the activity code and VAT.

## 9. Other ideas

- Partnerships: campsites / hostels (affiliate booking links), bike and moto rental, local guides.
- Pro features: several riders per trip, shared editing, branded PDF itineraries, GPX packs for groups.
- Curated off-road routes (e.g. Trans Euro Trail-style tracks) as a premium layer.

## 10. Google vs OpenStreetMap, measured (9 Nov 2026)

8 trips in 6 countries, every service called directly (`scripts/bench`). Report: "Map Stack Comparison" artifact.

| | Google | OpenStreetMap |
|---|---|---|
| Typical answer: place names / road route / places | 0.18 s / 0.23 s / 0.28 s | 0.16 s / 0.57 s / 0.19 s |
| Off-road day route | 0.18 s (roads only) | 0.74 s typical, 3.1 s slowest (BRouter) |
| Road routes | same distance within ~5% | same |
| Off-road: unpaved share | 11% | 68% |
| Places per stop | max 20, ~98% with rating, photos; hours 50–98% | 27–45 names, no ratings/photos |
| Reliability | 0 failures | free public servers refused 11 of 80 place searches (busy); all fine on retry |

- The slowness seen in the OpenStreetMap version comes from the free public servers (Overpass most of all, which
  refused this cloud server outright), not from the data or the routing. Own or paid servers fix it.
- Google fees ≈ $0.70 per planned trip (4 stops × 4 place searches at $32–35 per 1,000 + maps, routes, geocoding);
  revenue ≈ €0.18 per monthly user. All-Google loses money at every size; a hybrid (Google map, Google Places for
  stays only, ≈ $0.24/trip) too. All-OpenStreetMap breaks even at ≈ 400 monthly users (€40–260/month servers).
- Google's place data may only be shown on a Google map, so a single OpenStreetMap version can't use it.
  Ratings later: a place-data service allowed on any map (e.g. Foursquare) for paid plans only.
- Decision suggested: one OpenStreetMap version on own/paid servers; Booking.com "Check prices" for reviews and commission.
- **Done (Nov 2026):** the Google map version was removed. The app runs on OpenStreetMap only, with server addresses
  in settings (`OVERPASS_URL`, `PHOTON_URL`, `OSRM_URL`, `VALHALLA_URL`, `BROUTER_URL`) and `deploy/places-server` to
  run an own Overpass (~€8–15/month for one country, €40–60 for Europe). Next: rent the server and set `OVERPASS_URL`.
