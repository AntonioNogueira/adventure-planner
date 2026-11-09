// Service benchmark: Google vs OpenStreetMap services for the same trips.
// Geocoding, day routes (with surface share from Valhalla), and places near each overnight stop.
// Run: NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt GKEY=... node bench.mjs
import fs from 'fs';

const K = process.env.GKEY;
const OUT = new URL('./results.json', import.meta.url);
const moto = fs.readFileSync('../../src/lib/offroad.ts', 'utf8').match(/ADVENTURE_MOTO_PROFILE = `([\s\S]*?)`;/)[1];

// Truth points are town centres (for geocoding accuracy). Modes: DRIVING / BICYCLING / WALKING; offroad uses BRouter.
const TRIPS = [
  { id: 'car-lisbon-porto', label: 'Car · Lisbon → Porto (PT)', mode: 'DRIVING', offroad: false, places: [
    ['Lisbon, Portugal', 38.7223, -9.1393], ['Coimbra, Portugal', 40.2033, -8.4103], ['Porto, Portugal', 41.1496, -8.6110]] },
  { id: 'moto-granada-almeria', label: 'Motorcycle · Granada → Almería (ES)', mode: 'DRIVING', offroad: false, places: [
    ['Granada, Spain', 37.1773, -3.5986], ['Guadix, Spain', 37.2999, -3.1392], ['Almería, Spain', 36.8340, -2.4637]] },
  { id: 'car-florence-rome', label: 'Car · Florence → Rome (IT)', mode: 'DRIVING', offroad: false, places: [
    ['Florence, Italy', 43.7696, 11.2558], ['Siena, Italy', 43.3188, 11.3308], ['Orvieto, Italy', 42.7185, 12.1107], ['Rome, Italy', 41.9028, 12.4964]] },
  { id: 'car-sf-la', label: 'Car · San Francisco → Los Angeles (US)', mode: 'DRIVING', offroad: false, places: [
    ['San Francisco, USA', 37.7749, -122.4194], ['Monterey, USA', 36.6002, -121.8947], ['San Luis Obispo, USA', 35.2828, -120.6596], ['Los Angeles, USA', 34.0522, -118.2437]] },
  { id: 'bike-bruges-amsterdam', label: 'Bike · Bruges → Amsterdam (BE/NL)', mode: 'BICYCLING', offroad: false, places: [
    ['Bruges, Belgium', 51.2093, 3.2247], ['Middelburg, Netherlands', 51.4988, 3.6110], ['Rotterdam, Netherlands', 51.9244, 4.4777], ['Amsterdam, Netherlands', 52.3676, 4.9041]] },
  { id: 'gravel-evora-mertola', label: 'Bikepacking off-road · Évora → Mértola (PT)', mode: 'BICYCLING', offroad: true, places: [
    ['Évora, Portugal', 38.5714, -7.9135], ['Beja, Portugal', 38.0151, -7.8632], ['Mértola, Portugal', 37.6386, -7.6631]] },
  { id: 'hike-manteigas-covilha', label: 'Hike off-road · Manteigas → Covilhã (PT)', mode: 'WALKING', offroad: true, places: [
    ['Manteigas, Portugal', 40.4021, -7.5383], ['Penhas da Saúde, Portugal', 40.2900, -7.5450], ['Covilhã, Portugal', 40.2810, -7.5045]] },
  { id: 'advmoto-marrakech-merzouga', label: 'Adventure moto off-road · Marrakech → Merzouga (MA)', mode: 'DRIVING', offroad: true, places: [
    ['Marrakech, Morocco', 31.6295, -7.9811], ['Ouarzazate, Morocco', 30.9189, -6.8934], ['Tinghir, Morocco', 31.5147, -5.5328], ['Merzouga, Morocco', 31.0802, -4.0134]] },
];

const sleep = ms => new Promise(r => setTimeout(r, ms));
const hav = (a, b) => { const R = 6371, r = Math.PI / 180, dl = (b.lat - a.lat) * r, dg = (b.lng - a.lng) * r;
  const x = Math.sin(dl / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dg / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)); };
async function timed(fn) {
  const t = performance.now();
  try { const v = await fn(); return { ms: Math.round(performance.now() - t), ok: true, v }; }
  catch (e) { return { ms: Math.round(performance.now() - t), ok: false, err: String(e.message || e).slice(0, 160) }; }
}
async function getJson(url, init = {}) {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(60000) });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${text.slice(0, 120)}`);
  return JSON.parse(text);
}
function decodePolyline(str, precision = 5) {
  let i = 0, lat = 0, lng = 0; const out = []; const f = 10 ** precision;
  while (i < str.length) {
    for (const k of [0, 1]) {
      let b, shift = 0, result = 0;
      do { b = str.charCodeAt(i++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
      const d = result & 1 ? ~(result >> 1) : result >> 1;
      if (k === 0) lat += d; else lng += d;
    }
    out.push({ lat: lat / f, lng: lng / f });
  }
  return out;
}
const downsample = (pts, max) => pts.length <= max ? pts : pts.filter((_, i) => i % Math.ceil(pts.length / max) === 0 || i === pts.length - 1);

// ---- Geocoding ----
const geoGoogle = q => getJson(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q)}&key=${K}`)
  .then(d => { if (d.status !== 'OK') throw new Error(d.status); const l = d.results[0].geometry.location; return { lat: l.lat, lng: l.lng }; });
const geoPhoton = q => getJson(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=1`)
  .then(d => { const c = d.features?.[0]?.geometry?.coordinates; if (!c) throw new Error('no result'); return { lat: c[1], lng: c[0] }; });

// ---- Routing ----
const GMODE = { DRIVING: 'driving', BICYCLING: 'bicycling', WALKING: 'walking' };
async function routeGoogle(a, b, mode) {
  const d = await getJson(`https://maps.googleapis.com/maps/api/directions/json?origin=${a.lat},${a.lng}&destination=${b.lat},${b.lng}&mode=${GMODE[mode]}&key=${K}`);
  if (d.status !== 'OK') throw new Error(d.status);
  const leg = d.routes[0].legs[0];
  return { km: leg.distance.value / 1000, min: leg.duration.value / 60, path: decodePolyline(d.routes[0].overview_polyline.points) };
}
const OSRM = { DRIVING: 'routed-car', BICYCLING: 'routed-bike', WALKING: 'routed-foot' };
async function routeOsrm(a, b, mode) {
  const d = await getJson(`https://routing.openstreetmap.de/${OSRM[mode]}/route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=polyline`);
  const r = d.routes[0];
  return { km: r.distance / 1000, min: r.duration / 60, path: decodePolyline(r.geometry) };
}
let motoId = null;
async function routeBrouter(a, b, mode) {
  let profile, params = '';
  if (mode === 'WALKING') { profile = 'hiking-mountain'; params = '&profile:SAC_scale_limit=2&profile:SAC_scale_preferred=1&profile:hiking_routes_preference=0.6'; }
  else if (mode === 'BICYCLING') { profile = 'gravel'; params = '&profile:prefer_unpaved_paths=1&profile:avoid_steep_inclines=1&profile:avoid_noise=1'; }
  else {
    if (!motoId) motoId = (await getJson('https://brouter.de/brouter/profile', { method: 'POST', body: moto })).profileid;
    profile = motoId;
  }
  const d = await getJson(`https://brouter.de/brouter?lonlats=${a.lng},${a.lat}|${b.lng},${b.lat}&profile=${profile}&alternativeidx=0&format=geojson${params}`);
  const f = d.features[0];
  const km = Number(f.properties['track-length']) / 1000;
  const speed = { BICYCLING: 14, DRIVING: 32, WALKING: 4 }[mode];
  return { km, min: (km / speed) * 60, path: f.geometry.coordinates.map(c => ({ lat: c[1], lng: c[0] })) };
}
const PAVED = new Set(['paved_smooth', 'paved', 'paved_rough']);
async function surface(path, mode) {
  // Valhalla rejects traces over ~200 km: split.
  const parts = []; let cur = [path[0]], km = 0;
  for (let i = 1; i < path.length; i++) { km += hav(path[i - 1], path[i]); cur.push(path[i]); if (km > 150) { parts.push(cur); cur = [path[i]]; km = 0; } }
  if (cur.length > 1) parts.push(cur);
  let paved = 0, unpaved = 0;
  for (const part of parts) {
    const d = await getJson('https://valhalla1.openstreetmap.de/trace_attributes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
      shape: downsample(part, 1500).map(p => ({ lat: p.lat, lon: p.lng })), costing: mode === 'WALKING' ? 'pedestrian' : mode === 'BICYCLING' ? 'bicycle' : 'auto',
      shape_match: 'walk_or_snap', filters: { attributes: ['edge.length', 'edge.surface'], action: 'include' } }) });
    for (const e of d.edges || []) { if (PAVED.has(e.surface || 'paved')) paved += e.length || 0; else unpaved += e.length || 0; }
    await sleep(300);
  }
  return paved + unpaved ? unpaved / (paved + unpaved) : null;
}

// ---- Places near a stop ----
const GTYPES = { stay: ['lodging', 'campground'], food: ['restaurant', 'cafe'], sights: ['tourist_attraction', 'museum', 'park'] };
const SHOPQ = { DRIVING: 'motorcycle repair shop', BICYCLING: 'bicycle shop', WALKING: 'outdoor gear shop' };
const GFIELDS = 'places.id,places.displayName,places.rating,places.userRatingCount,places.priceLevel,places.websiteUri,places.nationalPhoneNumber,places.regularOpeningHours,places.photos';
async function placesGoogle(c, cat, mode) {
  const r = mode === 'DRIVING' ? 8000 : 4000;
  const headers = { 'Content-Type': 'application/json', 'X-Goog-Api-Key': K, 'X-Goog-FieldMask': GFIELDS };
  let d;
  if (cat === 'shop') {
    const dl = (r * 2) / 111000, dg = dl / Math.cos(c.lat * Math.PI / 180);
    d = await getJson('https://places.googleapis.com/v1/places:searchText', { method: 'POST', headers, body: JSON.stringify({ textQuery: SHOPQ[mode], maxResultCount: 20,
      locationRestriction: { rectangle: { low: { latitude: c.lat - dl, longitude: c.lng - dg }, high: { latitude: c.lat + dl, longitude: c.lng + dg } } } }) });
  } else {
    d = await getJson('https://places.googleapis.com/v1/places:searchNearby', { method: 'POST', headers, body: JSON.stringify({
      [cat === 'stay' ? 'includedTypes' : 'includedPrimaryTypes']: GTYPES[cat], maxResultCount: 20, rankPreference: 'POPULARITY',
      locationRestriction: { circle: { center: { latitude: c.lat, longitude: c.lng }, radius: r } } }) });
  }
  const p = d.places || [];
  const share = f => p.length ? p.filter(f).length / p.length : 0;
  return { n: p.length, names: p.slice(0, 5).map(x => x.displayName?.text), rating: share(x => x.rating), price: share(x => x.priceLevel), web: share(x => x.websiteUri),
    phone: share(x => x.nationalPhoneNumber), hours: share(x => x.regularOpeningHours), photo: share(x => x.photos?.length) };
}
const PTAGS = {
  stay: ['tourism:hotel', 'tourism:guest_house', 'tourism:hostel', 'tourism:motel', 'tourism:camp_site', 'tourism:caravan_site', 'tourism:apartment', 'tourism:chalet', 'tourism:alpine_hut'],
  food: ['amenity:restaurant', 'amenity:cafe'],
  sights: ['tourism:attraction', 'tourism:viewpoint', 'tourism:museum', 'historic:castle', 'historic:monument', 'historic:fort', 'historic:ruins'],
  shop: { DRIVING: ['shop:motorcycle', 'shop:car_repair'], BICYCLING: ['shop:bicycle'], WALKING: ['shop:outdoor', 'shop:sports'] },
};
async function placesOsm(c, cat, mode) {
  const r = (mode === 'DRIVING' ? 8 : 4) * (cat === 'shop' ? 4 : cat === 'sights' ? 2 : 1);
  const tags = cat === 'shop' ? PTAGS.shop[mode] : PTAGS[cat];
  const d = await getJson(`https://photon.komoot.io/reverse?lat=${c.lat}&lon=${c.lng}&radius=${Math.min(r, 30)}&limit=50&${tags.map(t => `osm_tag=${t}`).join('&')}`);
  const f = (d.features || []).filter(x => x.properties.name);
  return { n: f.length, names: f.slice(0, 5).map(x => x.properties.name) };
}

// ---- Run ----
const results = [];
for (const trip of TRIPS) {
  console.log('==', trip.label);
  const t = { ...trip, geocode: [], legs: [], places: [] };
  const pts = [];
  for (const [q, lat, lng] of trip.places) {
    const truth = { lat, lng };
    const g = await timed(() => geoGoogle(q)); await sleep(200);
    const o = await timed(() => geoPhoton(q)); await sleep(400);
    t.geocode.push({ q, google: { ms: g.ms, ok: g.ok, offKm: g.ok ? +hav(truth, g.v).toFixed(1) : null }, osm: { ms: o.ms, ok: o.ok, offKm: o.ok ? +hav(truth, o.v).toFixed(1) : null } });
    pts.push(truth);
  }
  for (let i = 1; i < pts.length; i++) {
    const g = await timed(() => routeGoogle(pts[i - 1], pts[i], trip.mode)); await sleep(200);
    const o = await timed(() => trip.offroad ? routeBrouter(pts[i - 1], pts[i], trip.mode) : routeOsrm(pts[i - 1], pts[i], trip.mode)); await sleep(500);
    const leg = { from: trip.places[i - 1][0], to: trip.places[i][0],
      google: { ms: g.ms, ok: g.ok, err: g.err, km: g.ok ? +g.v.km.toFixed(1) : null, min: g.ok ? Math.round(g.v.min) : null },
      osm: { ms: o.ms, ok: o.ok, err: o.err, km: o.ok ? +o.v.km.toFixed(1) : null, min: o.ok ? Math.round(o.v.min) : null, engine: trip.offroad ? 'BRouter' : 'OSRM' } };
    if (g.ok) leg.google.unpaved = await surface(g.v.path, trip.mode).catch(() => null);
    if (o.ok) leg.osm.unpaved = await surface(o.v.path, trip.mode).catch(() => null);
    t.legs.push(leg);
    console.log('  leg', leg.from, '→', leg.to, JSON.stringify({ g: leg.google, o: leg.osm }));
  }
  for (let i = 1; i < pts.length; i++) {   // overnight stops + destination
    const stop = { at: trip.places[i][0] };
    for (const cat of ['stay', 'food', 'shop', 'sights']) {
      const g = await timed(() => placesGoogle(pts[i], cat, trip.mode)); await sleep(200);
      const o = await timed(() => placesOsm(pts[i], cat, trip.mode)); await sleep(400);
      stop[cat] = { google: { ms: g.ms, ok: g.ok, err: g.err, ...(g.v || {}) }, osm: { ms: o.ms, ok: o.ok, err: o.err, ...(o.v || {}) } };
    }
    t.places.push(stop);
    console.log('  places', stop.at, ['stay', 'food', 'shop', 'sights'].map(c => `${c} G${stop[c].google.n ?? 'x'}/O${stop[c].osm.n ?? 'x'}`).join(' '));
  }
  results.push(t);
  fs.writeFileSync(OUT, JSON.stringify(results, null, 1));
}
console.log('done');
