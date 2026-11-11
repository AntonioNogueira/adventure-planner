// Builds the Inspiration map's journeys (public/inspiration/*.json) from journeys.mjs:
//  - finds each stop (Photon), unless it gives `at`
//  - routes the legs on roads (OSRM car) for ride/truck/bus; ferry, boat, train and flight legs are straight lines
//  - simplifies the lines (about 1 km detail) to keep the files small
//  - picks a free-licence photo for each stop from its Wikipedia article (pageimages, pilicense=free), with credit
// Run: NODE_USE_ENV_PROXY=1 node scripts/inspiration/build.mjs [journey-id ...]
// Polite to the free services: one request at a time, with pauses, and a client name for Wikipedia.
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { JOURNEYS } from './journeys.mjs';

const OUT = new URL('../../public/inspiration/', import.meta.url);
const CACHE = process.env.INSPIRATION_CACHE || new URL('./.cache.json', import.meta.url).pathname;
const UA = 'AdventurePlannerInspiration/1.0 (journey map builder)';
const ROAD = new Set(['ride', 'truck', 'bus']);

const cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, 'utf8')) : {};
const saveCache = () => writeFileSync(CACHE, JSON.stringify(cache));
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function get(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(60000) });
      if (res.ok) return res.json();
      if (res.status === 400 || res.status === 404) return null;
    } catch { /* retry */ }
    await sleep(3000 * (i + 1));
  }
  return null;
}

async function locate(q) {
  const key = `geo|${q}`;
  if (!cache[key]) {
    const data = await get(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=1&lang=en`);
    const f = data?.features?.[0];
    if (!f) throw new Error(`Not found: ${q}`);
    cache[key] = [f.geometry.coordinates[1], f.geometry.coordinates[0]];
    saveCache();
    await sleep(1100);
  }
  return cache[key];
}

const toRad = d => (d * Math.PI) / 180;
function km(a, b) {
  const dLat = toRad(b[0] - a[0]), dLng = toRad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** A great-circle line between two points (so long flights and sea crossings curve as on a globe). */
function arc(a, b, n = 24) {
  const [la1, lo1, la2, lo2] = [a[0], a[1], b[0], b[1]].map(toRad);
  const d = 2 * Math.asin(Math.sqrt(Math.sin((la2 - la1) / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin((lo2 - lo1) / 2) ** 2));
  if (d < 1e-6) return [a, b];
  const out = [];
  for (let i = 0; i <= n; i++) {
    const f = i / n;
    const A = Math.sin((1 - f) * d) / Math.sin(d), B = Math.sin(f * d) / Math.sin(d);
    const x = A * Math.cos(la1) * Math.cos(lo1) + B * Math.cos(la2) * Math.cos(lo2);
    const y = A * Math.cos(la1) * Math.sin(lo1) + B * Math.cos(la2) * Math.sin(lo2);
    const z = A * Math.sin(la1) + B * Math.sin(la2);
    out.push([(Math.atan2(z, Math.hypot(x, y)) * 180) / Math.PI, (Math.atan2(y, x) * 180) / Math.PI]);
  }
  return out;
}

async function road(a, b) {
  const key = `osrm|${a}|${b}`;
  if (!cache[key]) {
    const data = await get(`https://routing.openstreetmap.de/routed-car/route/v1/driving/${a[1]},${a[0]};${b[1]},${b[0]}?overview=full&geometries=geojson`);
    const r = data?.routes?.[0];
    cache[key] = r ? { km: r.distance / 1000, line: r.geometry.coordinates.map(([lng, lat]) => [lat, lng]) } : null;
    saveCache();
    await sleep(1500);
  }
  return cache[key];
}

/** Douglas–Peucker in degrees (~0.01° ≈ 1 km). */
function simplify(points, tol = 0.01) {
  if (points.length < 3) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [s, e] = stack.pop();
    const [ax, ay] = points[s], [bx, by] = points[e];
    const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1e-12;
    let max = 0, at = -1;
    for (let i = s + 1; i < e; i++) {
      const d = Math.abs(dy * points[i][0] - dx * points[i][1] + bx * ay - by * ax) / len;
      if (d > max) { max = d; at = i; }
    }
    if (max > tol && at > 0) { keep[at] = 1; stack.push([s, at], [at, e]); }
  }
  return points.filter((_, i) => keep[i]);
}
const round = line => line.map(([lat, lng]) => [Math.round(lat * 1e4) / 1e4, Math.round(lng * 1e4) / 1e4]);

const strip = html => String(html || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

/** The lead photo of a Wikipedia article, only if it's on Wikimedia Commons (which takes free licences only; non-free
 *  images live on Wikipedia itself), with a link to its file page (author and licence). The author's name is added
 *  when Wikipedia's API answers (it rate-limits shared connections). */
async function photos(titles) {
  for (const t of [...new Set(titles)]) {
    if (`wiki|${t}` in cache) continue;
    const data = await get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(t.replace(/ /g, '_'))}`);
    await sleep(700);
    const src = data?.thumbnail?.source || '';
    const m = src.match(/\/wikipedia\/commons\/thumb\/[0-9a-f]\/[0-9a-f]{2}\/([^/]+)\//);
    // Drawings (SVG: road signs, maps, flags, logos) don't illustrate a place.
    cache[`wiki|${t}`] = m && !/\.svg$/i.test(decodeURIComponent(m[1])) ? {
      url: src.replace(/\/\d+px-/, '/500px-').replace(/\?.*$/, '').replace('://thumb.wikimedia.org/', '://upload.wikimedia.org/'),
      file: decodeURIComponent(m[1]),
      page: data.title,
      source: `https://commons.wikimedia.org/wiki/File:${m[1]}`,
      credit: 'Wikimedia Commons',
      license: 'free licence',
    } : null;
    saveCache();
  }
  // Authors and licences, 40 files per request, if the API lets us.
  const need = [...new Set(titles)].map(t => cache[`wiki|${t}`]).filter(e => e && e.credit === 'Wikimedia Commons' && !e.tried);
  for (let i = 0; i < need.length; i += 40) {
    const batch = need.slice(i, i + 40);
    const info = await get(`https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=imageinfo&iiprop=extmetadata&titles=${encodeURIComponent(batch.map(e => `File:${e.file}`).join('|'))}`, 2);
    await sleep(3000);
    const byName = new Map((info?.query?.pages || []).map(p => [p.title.replace(/^File:/, '').replace(/ /g, '_'), p]));
    for (const e of batch) {
      const meta = byName.get(e.file.replace(/ /g, '_'))?.imageinfo?.[0]?.extmetadata;
      if (meta) {
        e.credit = strip(meta.Artist?.value).slice(0, 120) || 'Wikimedia Commons';
        e.license = strip(meta.LicenseShortName?.value) || 'free licence';
      }
      e.tried = Boolean(info);
    }
    saveCache();
  }
  const out = {};
  for (const t of titles) {
    const e = cache[`wiki|${t}`];
    // Standard thumbnail size on Wikimedia's long-standing image host (also for links saved by older runs).
    const url = e?.url.replace('://thumb.wikimedia.org/', '://upload.wikimedia.org/').replace(/\/\d+px-/, '/500px-');
    out[t] = e ? { url, page: e.page, source: e.source, credit: e.credit, license: e.license } : null;
  }
  return out;
}

async function build(journey) {
  console.log(`\n${journey.title}`);
  const stops = [];
  for (const s of journey.stops) stops.push({ ...s, at: s.at || await locate(s.q) });
  const pics = await photos(stops.map(s => s.wiki).filter(Boolean));
  const legs = [];
  let total = 0;
  for (let i = 1; i < stops.length; i++) {
    const a = stops[i - 1].at, b = stops[i].at, by = stops[i].by || 'ride';
    const straight = km(a, b);
    let line = arc(a, b, Math.max(2, Math.min(48, Math.round(straight / 100)))), dist = straight, exact = false;
    if (ROAD.has(by)) {
      const r = await road(a, b);
      // Short hops can wind a lot through mountains (Torres del Paine → El Calafate); long legs shouldn't.
      if (r && r.km < straight * (straight < 300 ? 6 : 3)) { line = r.line; dist = r.km; exact = true; }
      else console.log(`  no road ${stops[i - 1].name} → ${stops[i].name} (${Math.round(straight)} km straight)`);
    }
    total += dist;
    legs.push({ by, km: Math.round(dist), line: round(simplify(line, exact ? 0.01 : 0.05)) });
    console.log(`  ${stops[i - 1].name} → ${stops[i].name}: ${by} ${Math.round(dist)} km`);
  }
  const all = legs.flatMap(l => l.line);
  const lats = all.map(p => p[0]), lngs = all.map(p => p[1]);
  const { stops: _drop, ...meta } = journey;
  const full = {
    ...meta,
    km: Math.round(total),
    bbox: [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)],
    stops: stops.map(s => ({
      name: s.name, place: s.q || s.name, at: [Math.round(s.at[0] * 1e4) / 1e4, Math.round(s.at[1] * 1e4) / 1e4],
      ...(s.date ? { date: s.date } : {}), text: s.text, ...(s.by ? { by: s.by } : {}),
      ...(pics[s.wiki] ? { photo: pics[s.wiki] } : {}),
    })),
    legs,
  };
  writeFileSync(new URL(`${journey.id}.json`, OUT), JSON.stringify(full));
  const missing = full.stops.filter(s => !s.photo).map(s => s.name);
  console.log(`  ${full.km} km, ${full.stops.length} stops, ${legs.reduce((n, l) => n + l.line.length, 0)} points; no photo: ${missing.join(', ') || 'none'}`);
  return full;
}

mkdirSync(OUT, { recursive: true });
const only = process.argv.slice(2);
for (const j of JOURNEYS) if (!only.length || only.includes(j.id)) await build(j);
// The list the map loads first: what each journey is, with a light line for the overview.
const index = JOURNEYS.filter(j => existsSync(new URL(`${j.id}.json`, OUT))).map(j => {
  const full = JSON.parse(readFileSync(new URL(`${j.id}.json`, OUT), 'utf8'));
  const overview = round(simplify(full.legs.flatMap(l => l.line), 0.3));
  const { stops, legs, ...meta } = full;
  return { ...meta, stopCount: stops.length, cover: stops.find(s => s.photo)?.photo || null, overview };
});
writeFileSync(new URL('index.json', OUT), JSON.stringify(index));
console.log('\nindex.json written');
