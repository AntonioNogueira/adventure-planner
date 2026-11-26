// Geoapify Places (api.geoapify.com): places near stops from OpenStreetMap data on a paid, reliable service, used
// before the free public Overpass servers (which are often busy or refuse cloud traffic). Free tier: 3,000 credits a
// day. Needs GEOAPIFY_KEY in the server settings; the key is a browser key, restricted to the app's sites in the
// Geoapify dashboard. Answers are turned into Overpass-like elements (with the original OSM tags when Geoapify gives
// them), so the same ranking and item code applies.
import { report } from './serviceHealth';
import type { LatLng } from './geo';
import type { OsmElement } from './overpass';

export function geoapifyKey(): string | undefined {
  return typeof window !== 'undefined' ? window.__APP_CONFIG__?.geoapifyKey : undefined;
}

/** Geoapify category → the OSM tag it stands for, when an answer has no raw OSM tags (most specific first). */
const CATEGORY_TAGS: [string, string, string][] = [
  ['accommodation.hostel', 'tourism', 'hostel'], ['accommodation.guest_house', 'tourism', 'guest_house'],
  ['accommodation.motel', 'tourism', 'motel'], ['accommodation.hut', 'tourism', 'alpine_hut'],
  ['accommodation.chalet', 'tourism', 'chalet'], ['accommodation.apartment', 'tourism', 'apartment'],
  ['accommodation', 'tourism', 'hotel'],
  ['camping.caravan_site', 'tourism', 'caravan_site'], ['camping', 'tourism', 'camp_site'],
  ['catering.cafe', 'amenity', 'cafe'], ['catering', 'amenity', 'restaurant'],
  ['commercial.supermarket', 'shop', 'supermarket'], ['commercial.convenience', 'shop', 'convenience'],
  ['commercial.food_and_drink.bakery', 'shop', 'bakery'], ['commercial.food_and_drink.farm', 'shop', 'farm'],
  ['commercial.marketplace', 'amenity', 'marketplace'],
  ['commercial.outdoor_and_sport.bicycle', 'shop', 'bicycle'], ['commercial.outdoor_and_sport', 'shop', 'outdoor'],
  ['service.vehicle.repair.motorcycle', 'shop', 'motorcycle_repair'], ['service.vehicle.repair', 'shop', 'car_repair'],
  ['service.vehicle.fuel', 'amenity', 'fuel'], ['service.vehicle.charging_station', 'amenity', 'charging_station'],
  ['amenity.drinking_water', 'amenity', 'drinking_water'], ['waterway.water_point', 'amenity', 'water_point'],
  ['amenity.toilet', 'amenity', 'toilets'],
  ['tourism.attraction.viewpoint', 'tourism', 'viewpoint'], ['tourism.attraction.artwork', 'tourism', 'artwork'],
  ['tourism.attraction', 'tourism', 'attraction'],
  ['tourism.sights.castle', 'historic', 'castle'], ['tourism.sights.fort', 'historic', 'fort'],
  ['tourism.sights.ruines', 'historic', 'ruins'], ['tourism.sights.archaeological_site', 'historic', 'archaeological_site'],
  ['tourism.sights.city_gate', 'historic', 'city_gate'], ['tourism.sights.monastery', 'historic', 'monastery'],
  ['tourism.sights.memorial.monument', 'historic', 'monument'], ['tourism.sights', 'tourism', 'attraction'],
  ['entertainment.museum', 'tourism', 'museum'], ['entertainment.culture.gallery', 'tourism', 'gallery'],
  ['entertainment.culture.arts_centre', 'amenity', 'arts_centre'], ['entertainment.culture.theatre', 'amenity', 'theatre'],
  ['natural.mountain.peak', 'natural', 'peak'], ['natural.mountain.cave_entrance', 'natural', 'cave_entrance'],
  ['natural.water.hot_spring', 'natural', 'hot_spring'], ['beach', 'natural', 'beach'],
];

export interface GeoapifyFeature {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    name?: string; lat?: number; lon?: number; categories?: string[]; place_id?: string;
    street?: string; city?: string; town?: string; village?: string; website?: string;
    datasource?: { sourcename?: string; raw?: Record<string, unknown> };
  };
}

const OSM_TYPES: Record<string, OsmElement['type']> = { n: 'node', node: 'node', w: 'way', way: 'way', r: 'relation', relation: 'relation' };

/** A Geoapify place as an Overpass-like element: its raw OSM tags if given, else tags made from its categories. */
export function geoapifyElement(f: GeoapifyFeature, wanted: string[] = []): OsmElement | null {
  const p = f.properties || {};
  const lon = p.lon ?? f.geometry?.coordinates?.[0];
  const lat = p.lat ?? f.geometry?.coordinates?.[1];
  if (lat == null || lon == null) return null;
  const raw = p.datasource?.raw || {};
  const tags: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) if (typeof v === 'string' || typeof v === 'number') tags[k] = String(v);
  for (const k of ['osm_id', 'osm_type', 'lat', 'lon']) delete tags[k];
  // No OSM kind in the raw tags: take it from the category asked for (else any category it has).
  if (!tags.tourism && !tags.amenity && !tags.shop && !tags.historic && !tags.natural) {
    const cats = p.categories || [];
    const hit = CATEGORY_TAGS.find(([c]) => cats.some(x => x === c || x.startsWith(`${c}.`)) && (!wanted.length || wanted.some(w => w === c || w.startsWith(`${c}.`) || c.startsWith(`${w}.`))))
      || CATEGORY_TAGS.find(([c]) => cats.some(x => x === c || x.startsWith(`${c}.`)));
    if (hit) tags[hit[1]] = hit[2];
  }
  if (p.name && !tags.name) tags.name = p.name;
  if (p.street && !tags['addr:street']) tags['addr:street'] = p.street;
  const city = p.city || p.town || p.village;
  if (city && !tags['addr:city'] && !tags['addr:town'] && !tags['addr:village']) tags['addr:city'] = city;
  if (p.website && !tags.website) tags.website = p.website;
  const osmId = Number(raw.osm_id);
  return {
    type: OSM_TYPES[String(raw.osm_type || '').toLowerCase()] || 'node',
    // Geoapify's own id when there is no OSM one (only used to tell places apart).
    id: Number.isFinite(osmId) && osmId ? Math.abs(osmId) : hash(p.place_id || `${lat},${lon}`),
    lat: Number(lat), lon: Number(lon), tags,
  };
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// The free plan allows 5 requests a second: at most 4 at a time.
let running = 0;
const waiting: (() => void)[] = [];
async function slot<T>(fn: () => Promise<T>): Promise<T> {
  if (running >= 4) await new Promise<void>(r => waiting.push(r));
  running++;
  try { return await fn(); } finally { running--; waiting.shift()?.(); }
}

/** Places of the given Geoapify categories within `radiusM` of a point, nearest first. */
export async function geoapifyNear(center: LatLng, categories: string[], radiusM: number, limit = 20): Promise<OsmElement[]> {
  const key = geoapifyKey();
  if (!key) throw new Error('Geoapify not configured');
  if (!categories.length) return [];
  const url = `https://api.geoapify.com/v2/places?categories=${categories.join(',')}`
    + `&filter=circle:${center.lng.toFixed(5)},${center.lat.toFixed(5)},${Math.round(radiusM)}`
    + `&bias=proximity:${center.lng.toFixed(5)},${center.lat.toFixed(5)}&limit=${Math.min(limit, 100)}&lang=en&apiKey=${key}`;
  for (let attempt = 0; ; attempt++) {
    const started = Date.now();
    const res = await slot(() => fetch(url, { signal: AbortSignal.timeout(10000) })).catch(err => {
      report('geoapify', false, Date.now() - started, err instanceof Error ? `${err.name} ${err.message}` : String(err));
      throw err;
    });
    // Too many at once: wait a moment and try once more.
    if (res.status === 429 && attempt === 0) { await new Promise(r => setTimeout(r, 1200)); continue; }
    report('geoapify', res.ok, Date.now() - started, res.ok ? undefined : `HTTP ${res.status}`);
    if (!res.ok) throw new Error(`Geoapify ${res.status}`);
    const features: GeoapifyFeature[] = (await res.json()).features || [];
    return features.map(f => geoapifyElement(f, categories)).filter((e): e is OsmElement => e !== null);
  }
}
