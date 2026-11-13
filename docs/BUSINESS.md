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
| Price | – | €0 | €2.99/month or €19/year | €4.99 once (3 months) | €24/month |
| Saved trips | – | 3 | unlimited | unlimited | unlimited |
| AI plans / day | 5 | 10 | 100 | 100 | 400 |
| Place searches / day | 10 | 20 | 300 | 300 | 1500 |
| Documents / day | 2 | 5 | 200 | 200 | 1000 |

- Market check: Komoot ~€60/year, Ride with GPS ~€8–10/month, Calimoto ~€50/year, Kurviger Tourer+ ~€30/year,
  Wanderlog ~€40–60/year. €30/month only works for businesses (guides, tour operators).
- "Unlimited" = fair use with soft caps (AI and place-server load).
- Decided (Nov 2026): one version on OpenStreetMap data for everyone; no Google Places (section 10).
- **Limits are switched off while testing (Nov 2026):** usage is counted, nothing is refused, the app shows ∞.
  At launch on the own domain: set `ENFORCE_LIMITS=true` on the server, then the table above applies.
  Visitors are counted per internet connection (one 5-day trip ≈ 6 place searches), so consider raising
  the visitor and free place searches (e.g. 40 / 80) with `PLAN_LIMITS` if the place servers allow it.

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

### Curated trips: travel stories on a map (idea, Nov 2026)

Guides, travel creators and experienced riders publish a trip as a story: each stop's balloon carries their own text
and photos (like a blog post pinned to the map), plus their links (videos, gear, bookings), the day lines and GPX.
Readers follow it in the app, copy it into their own trip, ride it in Ride mode, and book through the place links.

- **Why it fits:** the app is for dreaming and planning; stories are the "dream" part, and every copied trip brings a
  new user. Creators get a better format than a blog or an Instagram highlight: a trip people can actually ride.
- **What it needs:** a story editor per stop (text, a few photos, links), photo storage (Firebase Storage, resized on
  upload; ~€0.03/GB/month), public pages with a clean link and preview image for social media, "copy this trip",
  and simple moderation (report button, creator accounts).
- **Money:** creators on Pro (or a Creator plan, ~€8–10/month) for unlimited stories, a profile page and stats
  (views, copies, clicks); readers free. Affiliate bookings from story places can be shared with the creator
  (e.g. 30–50%), which gives creators a reason to promote the app. Later: paid premium stories (guide's full route
  pack), the platform keeping ~20–30%.
- **Order:** 1) photos and long text in stop and place balloons on your own trips; 2) public story view + copy;
  3) creator profiles, stats and revenue share.

### Ambassadors (beta testers, Nov 2026)

A small group (~15–30) who use the app on real trips and tell us what breaks, chosen to cover every kind of trip:
bikepacking (road, gravel, MTB), adventure and enduro motorcycling, 4x4 and overland trucks, vans and campervans,
hikers, and people working in the field (humanitarian and aid workers, NGO logistics, expedition support), who need
reliable routes, fuel range, water and services in remote places more than anyone.

- **Ask:** use it to plan and ride at least one trip a month; report problems and ideas (a short form in the app,
  a WhatsApp/Signal or Discord group); share a story or two when the curated trips arrive.
- **Give:** free Pro for life while active, early features, their name and link on the ambassadors page, a share of
  bookings from their stories, and a say in what's built next.
- **Find them:** bikepacking and overland forums and groups, Trans Euro Trail and Adventure Rider communities,
  local moto and cycling clubs, van-life groups, NGO logistics networks; one or two well-known riders or creators
  to start (they bring the rest).
- **Run it:** a sign-up page (who you are, how you travel, where), a short welcome guide, monthly 30-minute call,
  and a public changelog so they see their feedback land. In-app: an "Ambassador" badge and a feedback button.

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

## 11. Covering the running costs (10 Nov 2026)

**Now (testing):** everything runs on free services (public Overpass servers with fallbacks, Photon → Nominatim,
OSRM, Valhalla, BRouter, OpenTopoMap, EOX satellite). EOX imagery is non-commercial only: replace it before charging.

| Stage | Paid for | Per month |
|---|---|---|
| Testing | Nothing (domain optional) | €0–3 |
| Public beta (free for users) | Domain, always-on hosting (Render Starter ~$7; the free plan sleeps), a little AI | ~€10–15 |
| Launch (charging) | + MapTiler (topo + commercial satellite, ~€25), Stadia Maps (hosted Valhalla routing, ~€20), own Overpass (~€8–15) or Geoapify | ~€70–90 |

Other providers compared (Mapbox, CARTO, HERE, TomTom, Stadia, MapTiler, Geoapify, Thunderforest, Esri, Apple):
none routes off-road, so BRouter/Valhalla stay; MapTiler (map + satellite), Stadia (routing, names) and
Geoapify or own Overpass (places) are the best fits. Set through OVERPASS_URL, VALHALLA_URL, … (no code change
except a small adapter for Stadia's geocoding).

**How ~€80/month gets covered** (a mix, so no one source carries it):
1. **Booking commissions** (Booking.com ~4–6%, ≈ €4–8 per booking): **10–15 bookings a month cover it**, realistic at
   a few hundred active users. Needs `BOOKING_AID` (apply with the domain live).
2. **Paid plan** (prices now in `src/lib/plans.ts`): Free (3 saved trips, a few AI plans a day); **Explorer €2.99/month
   or €19/year**; **Trip Pass €4.99** (one trip, 3 months). After Paddle/Lemon Squeezy fees (~5% + €0.50), €19/year ≈
   €17.50 net: **~55 yearly subscribers cover it** without bookings (≈ 1,500–2,500 active users at 2–4% conversion).
   Still well under Komoot (~€60/year) and Calimoto (~€50/year). $5/year would not cover the cost per user.
3. **"Support the project"** (Ko-fi / Buy Me a Coffee) during the beta: free, often covers domain and hosting early.
- No display ads (very low at this size, clutter the map).
- Path: bookings cover hosting in the beta; the paid plan starts when moving to the paid map services.

### Name and domain checklist
1. Pick a distinctive name (e.g. *Mundi Trails*, *Mappamundi Trails*, *Rota Mundi*, *Itinera*); "Mappa Mundi" alone
   is a historical term, hard to protect.
2. Check it: trademarks at tmdn.org/tmview (EU) and INPI Portugal; domains at Cloudflare Registrar or Porkbun.
3. Buy **.com** (~€10/year) and **.app** (~€15/year) together (+ **.pt** for Portugal). Cloudflare Registrar sells at cost.
4. Email: Cloudflare Email Routing forwards `hello@<name>` to Gmail (free); Gmail can send as it.
5. Render → service → Settings → **Custom Domains** → add the domain; add the two DNS records it shows in Cloudflare
   (HTTPS is automatic, also on the free plan).
6. Firebase → Authentication → **Authorized domains**: add the new domain (or login fails there). Then rename the
   app (title, manifest, README) to the chosen name.
7. Trademark later, with traction: INPI Portugal ~€120–200 per class; EU (EUIPO) ~€850 for one class.

## 12. Inspire as a world database of adventures (Nov 2026)

Goal: tens of thousands of real journeys on the globe, filterable (motorcycle, bicycle, on foot, 4x4; era; words;
later region, length, season), each linking back to its original source.

### What each journey costs (estimate)

| Step | Per journey | 1,000 | 10,000 | 100,000 |
|---|---|---|---|---|
| AI reading (Gemini Flash-Lite; Flash ~4×) — blog post ~8k tokens, forum ride report 30–150k | $0.002–0.02 | $2–20 | $20–200 | $200–2,000 |
| Finding ~25 places (Photon) and routing ~25 legs (OSRM) | free on public servers, slowly (~1 req/s) | days, free | weeks, free, or €20–50 for a rented server for a weekend | own servers (one-off €50–150), or straight lines between stops |
| Storage (~50 KB per journey) | – | 50 MB, free | 0.5 GB, free (Firestore 1 GB free) | 5 GB: ~€1/month (Firestore) or free (Cloudflare R2, 10 GB) |
| Showing them on the globe | – | one index file | vector tiles (PMTiles) needed beyond ~2–3,000 | PMTiles on R2: free |
| Opening a journey | 1 read | free | free (50k reads/day) | ~€0.03 per 100k opens beyond that |
| Photos | Wikimedia place photos, linked: free | | | |

So: **10,000 journeys ≈ $20–250 one-off and ~€0/month; 100,000 ≈ $300–2,500 one-off and €1–30/month.** The AI is
the main cost; Gemini's Batch mode halves it. Prices change: check before a big run.

### Where journeys come from (in order of preference)

1. **Travellers add their own trip** ("Add my trip": a blog link or ride report): best quality, and their consent.
2. **Permission or partnership** with the big communities (Horizons Unlimited, ADVrider, bikepacking sites): a map
   that sends readers back to them is a good offer; ask before importing their content.
3. **Blogs with RSS feeds** (made for sharing), one post at a time, politely.
4. **Automatic discovery** only where the site allows it: respect robots.txt and each site's terms (many forums
   forbid scraping), one request every few seconds, a clear client name.

Always: store only the route, places, dates and a 1–2 sentence summary in our own words; no copied text or
photos; a link to the original on every journey and stop; a "remove my trip" link honoured quickly. The import
tool proposes; a person checks before anything is published.

### Backup task: seed Inspire from the 101 example trips (not started, Nov 2026)

The welcome box's examples (`src/lib/examples.ts`) are 101 well-known routes on every continent and in every way
of travelling. Each can become a "classic route" journey, like the Camino Francés, Tour Divide and TransAmerica
already on the map. Plan, one route at a time, without hurrying:

1. **The line:** take the route's OpenStreetMap route relation where one exists (most named trails and cycle
   routes have one: Caminos, EuroVelo, PCT, AT, GR20, TMB, West Highland Way, TransAm, Great Divide). That gives
   the real line without guessing. Where there isn't one (most moto and 4x4 trips), use the most common version:
   the official or guidebook stages, else the roads most trip reports take, routed with OSRM or BRouter. Mark it
   "approximate", as now.
2. **The stops:** the usual overnight towns or stages, about 10–30 per route.
3. **Each stop's text:** for each stop, look for the most recent public trip report that passes there (a blog, a
   bikepacking.com route guide, a Horizons Unlimited or ADVrider report where the rules allow). Write a 1–2
   sentence note in our own words, and link the report as the stop's source. If no recent report turns up, write a
   general note and link the route's official page or Wikipedia.
4. **Check, then publish:** build with `scripts/inspiration/build.mjs`, look at it on the globe, then publish.

Same rules as above: route, places, dates and a short summary in our own words; no copied text or photos; a link
to every source. Cost: almost nothing beyond time (the build tools are free; AI help is cents per route). With
100+ journeys the index file grows to ~1 MB, which is still fine; vector tiles are only needed past ~2–3,000.

## 13. The market: who else is out there, and where we fit (Nov 2026)

Prices are rough, from memory: check before quoting them.

| App | Best at | Business model | What it means for us |
|---|---|---|---|
| **Organic Maps** | Free offline navigation on OpenStreetMap, no ads, open source | Free, donations | Don't compete on offline navigation: hand routes over to it in one tap (GPX per day) |
| **Mapy.com** | Very accurate trails and back roads, offline | Free + premium | Same: export to it; maybe use its outdoor map tiles later (has a developer API) |
| **Rever** | Motorcycle route planning, ride recording, sharing, curated roads | Free + Pro (~$5–10/month) | Closest moto rival: we add the AI planner, overnight stops, stays and budget; we lack ride recording |
| **Wanderlog** | Complete itineraries, notes, bookings, shared editing in real time | Free + Pro (~$40–60/year) | Learn: shared editing for groups, bookings imported from email |
| **TripIt** | Forward booking emails → automatic timeline | Free + Pro (~$49/year) | We already read booking PDFs/emails/links: add a forwarding email address |
| **Hostelworld / Travello** | Meeting other travellers (noticeboards, meetups) | Bookings / free | Later: opt-in "riders on the same route this week" |
| **WiFi Map** | Wi-Fi hotspots, eSIM | eSIM sales | Affiliate eSIM offers per country in the trip budget |
| **Komoot** | Bike/hike planning and navigation, huge shared routes | Regions + premium (~€60/year) | The benchmark for planning; we're multi-day stages, stays and budget, and moto/4x4 too |
| **Calimoto / Kurviger / Scenic** | Curvy roads for motorcycles | Premium (~€30–60/year) | A "curvy roads" preference for moto trips |
| **Polarsteps** | Automatic travel tracking → diary → printed photo books | Free; earns from printed books | Strong idea: ride recording → stories (we have them) → a printed trip book |
| **iOverlander / Park4Night** | Camp spots, water, fuel, borders for overlanders | Free / premium | Overlander points matter: OSM has some; ask iOverlander about a partnership (their data has its own licence) |
| **Wikiloc / Bikepacking.com** | Shared trails / curated bikepacking routes | Premium / membership | Inspire is our version for multi-day journeys, linking back to sources |
| **Horizons Unlimited** | The overland community: HUBB forum, meetings, riders who host travellers | Donations, events, books | The audience we want: a partner, not a competitor (link back, map their travellers' stories) |

**Our niche:** nobody joins up the whole adventure for motorcycles, bicycles, hikers and 4x4s: *dream it* (Inspire
globe) → *plan it in a chat* (AI daily stages by effort and terrain, overnight towns, stays, budget, bookings in one
place) → *ride it* (Ride mode, voice, go to) → *share it* (stories). Each rival does one or two of these.

**Weak spots to cover:** offline navigation (people will use Organic Maps, OsmAnd, Garmin: make handing over
perfect), no community yet, free map servers that can be slow.

### Moves, best value first

1. **One-tap hand-over to navigation apps**: GPX per day exists; add "Open in Organic Maps / OsmAnd / Mapy / Garmin"
   (share sheet on phones). Low effort, removes the biggest objection.
2. **Forward your bookings** to a personal address (like TripIt): reuse the booking reader; inbound email via a free
   service (e.g. Cloudflare Email Routing). Medium effort.
3. **Ride recording → automatic trip story → printed book** (Polarsteps' business). Medium–high effort, new revenue.
4. **Overlander points**: wild camping, water, fuel range warnings, border crossings (OSM + partnerships). Medium.
5. **Shared trips for groups** (Wanderlog): edit together; good for moto groups and small tour operators (Pro).
6. **Inspire growth**: "Add my trip" + partnerships (section 12): the community engine.
7. **More affiliate income**: eSIM, travel insurance, ferries, bike/moto rental, alongside Booking.com.

**Pricing check:** Explorer at €19/year is below most rivals (€30–60/year). Once hand-over to navigation apps and ride
recording exist, €29–39/year is reasonable.

## 14. Prompt to map: where it can fail, and how to reinforce it (Nov 2026)

Measured on "cadiz to silves bikepacking, sections of 40 km max" (12 Nov 2026, Photon down, Gemini busy): 94 s.
AI 44 s · named places 7 s · first route 3 s · elevation 1 s · places to stay 10 s · villages 24 s · final route 5 s.
On a good day the same plan takes ~25–35 s. The app now times every plan (Settings → Check map services shows the
last plan's stages and which services answer).

| Weak point | What happens when it fails | Reinforcement (best first) | Cost |
|---|---|---|---|
| **AI (Gemini free tier)** | 503 "high demand" for minutes at peak times; plans fail or take 40 s+ | Turn on billing for the Gemini key (paid traffic is served first); add a second provider key as backup (ANTHROPIC_API_KEY or OPENAI_API_KEY, already supported) | ~$0.001 per plan on Flash-Lite; a few €/month |
| **Photon (place names)** | Public server hangs for hours; app now skips it and uses Nominatim (slower: 1 request/s) | A geocoder with a free tier as second source (MapTiler ~100k/month free, Geoapify ~3k/day free, LocationIQ ~5k/day free); later own Photon (€20–40/month server) | €0 to start |
| **Overpass (places near stops, stays for nights)** | Public servers busy; 10 s wait, then Photon/Nominatim with fewer details | Own Overpass (deploy/places-server, ~€10–20/month) or Geoapify Places (free tier) | €0–20/month |
| **Routing (OSRM, BRouter, Valhalla)** | Rarely down; fine in tests | Keep; own OSRM only at scale | – |

**Do first:** billing on the Gemini key (biggest delay today), then a MapTiler or Geoapify key as the place-name backup.

**Weather (Open-Meteo):** the forecast and the "typical for these dates" figures come from Open-Meteo, free for
non-commercial use and about 10,000 requests a day per device. Once the app earns money (paid plans, affiliate
income), switch to their commercial API plan (roughly €30/month at the start) or run their open-source server.
