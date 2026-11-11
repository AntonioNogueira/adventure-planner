// The import tool's second half, in the browser: a journey read by the AI (ordered places) becomes a map journey.
// Places are found with the app's geocoder, road legs routed with OSRM, other legs drawn as great-circle lines,
// and each stop gets the free-licence lead photo of its town's Wikipedia article (Wikimedia Commons only).
import { geocodeAddress } from './geocode';
import { SERVICES } from './services';
import type { Journey, JourneyLeg, JourneyPhoto, JourneyStop, LegKind } from './inspiration';
import { ON_ROAD } from './inspiration';

export interface JourneyDraft {
  title: string; who: string; when: string; vehicle: string; kind: string; summary: string;
  sources: { label: string; url: string }[];
  stops: { name: string; place: string; date: string; by: LegKind; text: string }[];
}

type Pt = [number, number];
const toRad = (d: number) => (d * Math.PI) / 180;
export function kmBetween(a: Pt, b: Pt): number {
  const h = Math.sin(toRad(b[0] - a[0]) / 2) ** 2 + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(toRad(b[1] - a[1]) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** A great-circle line (long flights and sea crossings curve as on a globe). */
export function arc(a: Pt, b: Pt, n = 24): Pt[] {
  const [la1, lo1, la2, lo2] = [a[0], a[1], b[0], b[1]].map(toRad);
  const d = 2 * Math.asin(Math.sqrt(Math.sin((la2 - la1) / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin((lo2 - lo1) / 2) ** 2));
  if (d < 1e-6) return [a, b];
  return Array.from({ length: n + 1 }, (_, i) => {
    const f = i / n, A = Math.sin((1 - f) * d) / Math.sin(d), B = Math.sin(f * d) / Math.sin(d);
    const x = A * Math.cos(la1) * Math.cos(lo1) + B * Math.cos(la2) * Math.cos(lo2);
    const y = A * Math.cos(la1) * Math.sin(lo1) + B * Math.cos(la2) * Math.sin(lo2);
    const z = A * Math.sin(la1) + B * Math.sin(la2);
    return [(Math.atan2(z, Math.hypot(x, y)) * 180) / Math.PI, (Math.atan2(y, x) * 180) / Math.PI] as Pt;
  });
}

/** Douglas–Peucker in degrees (0.01° ≈ 1 km of detail). */
export function simplify(points: Pt[], tol = 0.01): Pt[] {
  if (points.length < 3) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack: [number, number][] = [[0, points.length - 1]];
  while (stack.length) {
    const [s, e] = stack.pop()!;
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
const round = (line: Pt[]) => line.map(([lat, lng]) => [Math.round(lat * 1e4) / 1e4, Math.round(lng * 1e4) / 1e4] as Pt);

async function roadLine(a: Pt, b: Pt): Promise<{ km: number; line: Pt[] } | null> {
  try {
    const res = await fetch(`${SERVICES.osrm}/routed-car/route/v1/driving/${a[1]},${a[0]};${b[1]},${b[0]}?overview=full&geometries=geojson`, { signal: AbortSignal.timeout(30000) });
    const r = res.ok ? (await res.json()).routes?.[0] : null;
    return r ? { km: r.distance / 1000, line: r.geometry.coordinates.map(([lng, lat]: number[]) => [lat, lng] as Pt) } : null;
  } catch { return null; }
}

/** The lead photo of a place's Wikipedia article, only when it's on Wikimedia Commons (free licences only). */
export async function placePhoto(place: string): Promise<JourneyPhoto | undefined> {
  try {
    const title = place.split(',')[0].trim().replace(/ /g, '_');
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return undefined;
    const data = await res.json();
    const src: string = data?.thumbnail?.source || '';
    const m = src.match(/\/wikipedia\/commons\/thumb\/[0-9a-f]\/[0-9a-f]{2}\/([^/]+)\//);
    // Drawings (SVG: road signs, maps, flags, logos) don't illustrate a place.
    if (!m || data.type === 'disambiguation' || /\.svg$/i.test(decodeURIComponent(m[1]))) return undefined;
    return { url: src.replace(/\/\d+px-/, '/500px-').replace(/\?.*$/, '').replace('://thumb.wikimedia.org/', '://upload.wikimedia.org/'), page: data.title, source: `https://commons.wikimedia.org/wiki/File:${m[1]}`, credit: 'Wikimedia Commons', license: 'free licence' };
  } catch { return undefined; }
}

export const slug = (text: string) => text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'journey';

/** Places found, legs routed, photos picked; stops that can't be found are left out (and listed). */
export async function buildJourney(draft: JourneyDraft, onProgress: (step: string) => void, color = '#0f766e'):
  Promise<{ journey: Journey; skipped: string[] }> {
  const stops: JourneyStop[] = [];
  const skipped: string[] = [];
  for (const [i, s] of draft.stops.entries()) {
    onProgress(`places ${i + 1}/${draft.stops.length}`);
    const at = await geocodeAddress(s.place).catch(() => null);
    if (!at) { skipped.push(s.place); continue; }
    stops.push({ name: s.name, place: s.place, at: [Math.round(at.lat * 1e4) / 1e4, Math.round(at.lng * 1e4) / 1e4], text: s.text, ...(s.date ? { date: s.date } : {}), ...(i > 0 && s.by !== 'ride' ? { by: s.by } : {}) });
  }
  if (stops.length < 2) throw new Error('Fewer than two places could be found on the map.');
  const legs: JourneyLeg[] = [];
  for (let i = 1; i < stops.length; i++) {
    onProgress(`routes ${i}/${stops.length - 1}`);
    const a = stops[i - 1].at, b = stops[i].at, by = stops[i].by || 'ride';
    const straight = kmBetween(a, b);
    let line = arc(a, b, Math.max(2, Math.min(48, Math.round(straight / 100)))), km = straight, exact = false;
    if (ON_ROAD.has(by)) {
      const r = await roadLine(a, b);
      if (r && r.km < straight * 3) { line = r.line; km = r.km; exact = true; }
    }
    legs.push({ by, km: Math.round(km), line: round(simplify(line, exact ? 0.01 : 0.05)) });
  }
  for (const [i, s] of stops.entries()) {
    onProgress(`photos ${i + 1}/${stops.length}`);
    const photo = await placePhoto(s.place || s.name);
    if (photo) s.photo = photo;
  }
  const all = legs.flatMap(l => l.line);
  const lats = all.map(p => p[0]), lngs = all.map(p => p[1]);
  return {
    skipped,
    journey: {
      id: `${slug(draft.title)}-${Date.now().toString(36)}`,
      title: draft.title, who: draft.who, when: draft.when, vehicle: draft.vehicle, kind: draft.kind, color,
      summary: draft.summary, sources: draft.sources.filter(s => s.label),
      approximate: 'Read from the source by AI and checked by hand; the roads between places are approximate.',
      km: Math.round(legs.reduce((n, l) => n + l.km, 0)),
      bbox: [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)],
      stops, legs, imported: true,
    },
  };
}
