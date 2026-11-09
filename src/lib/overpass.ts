// OpenStreetMap places. Overpass first (full details: website, stars, opening hours), trying each server in
// OVERPASS_URL in turn; if none answers, Photon (names, kinds and positions only), so places never go missing.
// The free public servers are fair use and often busy or refuse cloud traffic: production sets its own.
import { InterestCategory, InterestItem } from '../types';
import { LatLng, haversineKm } from './geo';
import { townAt, placeAt, photon, PhotonFeature } from './geocode';
import { SERVICES } from './services';
import type { CategoryId, LodgingPreference } from './places';

export interface OsmElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

// Overpass allows only a couple of parallel requests per visitor, so queue them.
let queue: Promise<unknown> = Promise.resolve();

// The server that answered last is tried first next time. When none answers, Overpass is skipped for a while
// (callers use Photon), so a visitor doesn't wait on dead servers for every stop.
let preferred = 0;
let skipUntil = 0;
const SKIP_MS = 2 * 60_000;

async function runQuery(query: string, budgetMs = 31000, servers = SERVICES.overpass): Promise<OsmElement[]> {
  const deadline = Date.now() + budgetMs;
  if (Date.now() < skipUntil) throw new Error('Overpass servers unavailable (skipping for now)');
  let lastError: unknown = new Error('No Overpass server configured');
  for (let k = 0; k < servers.length; k++) {
    const left = deadline - Date.now();
    if (left < 1500) break;
    const i = (preferred + k) % servers.length;
    try {
      const res = await fetch(servers[i], {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
        // A stalled server must not hold up planning: move on to the next one.
        signal: AbortSignal.timeout(Math.min(left, k === servers.length - 1 ? 15000 : 8000)),
      });
      if (res.ok) {
        const elements = (await res.json()).elements || [];
        preferred = i;
        return elements;
      }
      lastError = new Error(`Overpass ${res.status} (${new URL(servers[i]).host})`);
    } catch (err) {
      lastError = err; // refused, unreachable or too slow: next server
    }
  }
  skipUntil = Date.now() + SKIP_MS;
  throw lastError;
}

/** An Overpass query (queued); `budgetMs` caps the total wait across servers before the caller falls back. */
export function overpass(query: string, budgetMs?: number): Promise<OsmElement[]> {
  const next = queue.then(() => runQuery(query, budgetMs));
  queue = next.catch(() => undefined);
  return next;
}

const LODGING: Record<LodgingPreference, string> = {
  any: '^(hotel|hostel|guest_house|motel|camp_site|alpine_hut|chalet|apartment)$',
  camping: '^(camp_site|caravan_site)$',
  hostel: '^(hostel)$',
  hotel: '^(hotel|guest_house|motel)$',
};

const SHOP: Record<string, string> = {
  BICYCLING: '["shop"="bicycle"]',
  DRIVING: '["shop"~"^(motorcycle|motorcycle_repair)$"]',
  WALKING: '["shop"~"^(outdoor|sports)$"]',
};

const TYPE_LABELS: Record<string, string> = {
  hotel: 'Hotel', hostel: 'Hostel', guest_house: 'Guest house', motel: 'Motel', camp_site: 'Campsite',
  caravan_site: 'Caravan site', alpine_hut: 'Mountain hut', chalet: 'Chalet', apartment: 'Apartment',
  restaurant: 'Restaurant', cafe: 'Café', bicycle: 'Bike shop', motorcycle: 'Motorcycle shop',
  motorcycle_repair: 'Motorcycle repair', outdoor: 'Outdoor shop', sports: 'Sports shop',
  attraction: 'Attraction', viewpoint: 'Viewpoint', museum: 'Museum', castle: 'Castle', monument: 'Monument',
  fort: 'Fort', ruins: 'Ruins',
};

const position = (e: OsmElement): LatLng | null =>
  e.lat != null && e.lon != null ? { lat: e.lat, lng: e.lon } : e.center ? { lat: e.center.lat, lng: e.center.lon } : null;

/** Which of the four categories an OSM element belongs to. */
export function classify(tags: Record<string, string>): CategoryId | null {
  if (/^(hotel|hostel|guest_house|motel|camp_site|caravan_site|alpine_hut|chalet|apartment)$/.test(tags.tourism || '')) return 'stay';
  if (/^(restaurant|cafe)$/.test(tags.amenity || '')) return 'food';
  if (tags.shop) return 'shop';
  if (tags.tourism || tags.historic) return 'sights';
  return null;
}

/** Well-documented places first (Wikidata, Wikipedia, website), then nearest. */
export function rankScore(tags: Record<string, string>) {
  return (tags.wikidata ? 3 : 0) + (tags.wikipedia ? 2 : 0) + (tags.website || tags['contact:website'] ? 1 : 0) + (tags.stars ? 1 : 0);
}

export function toItem(e: OsmElement, category: CategoryId): InterestItem | null {
  const tags = e.tags || {};
  const at = position(e);
  if (!tags.name || !at) return null;
  const kind = tags.tourism || tags.amenity || tags.shop || tags.historic || '';
  const where = [tags['addr:street'], tags['addr:city'] || tags['addr:town'] || tags['addr:village']].filter(Boolean).join(', ');
  return {
    name: tags.name,
    description: [TYPE_LABELS[kind] || kind.replace(/_/g, ' '), where].filter(Boolean).join(' · '),
    source: 'places',
    placeId: `osm:${e.type}/${e.id}`,
    // Its own website when OpenStreetMap has one; otherwise the popup links to Google Maps (reviews, photos).
    url: tags.website || tags['contact:website'] || undefined,
    lat: at.lat,
    lng: at.lng,
    category,
    ...(category === 'stay' ? { stayKind: OSM_STAY_KINDS[tags.tourism || ''] || 'hotel' } : {}),
  };
}

const OSM_STAY_KINDS: Record<string, InterestItem['stayKind']> = {
  camp_site: 'camping', caravan_site: 'camping', alpine_hut: 'hostel', wilderness_hut: 'camping',
  hostel: 'hostel', guest_house: 'guesthouse', apartment: 'guesthouse', chalet: 'guesthouse',
  hotel: 'hotel', motel: 'hotel',
};

const NAMES: Record<CategoryId, string> = {
  stay: 'Accommodations', food: 'Restaurants/Cafes', shop: 'Bike/Moto Shops', sights: 'Points of Interest',
};

const cache = new Map<string, Promise<InterestCategory[]>>();

/** 4 categories × `count` named OSM places near a stop, in one Overpass request. */
export function osmSuggestions(center: LatLng, travelMode: string, lodging: LodgingPreference, count: number): Promise<InterestCategory[]> {
  const key = [center.lat.toFixed(3), center.lng.toFixed(3), travelMode, lodging, count].join('|');
  if (!cache.has(key)) {
    const pending = fetchSuggestions(center, travelMode, lodging, count);
    cache.set(key, pending);
    pending.catch(() => cache.delete(key));
  }
  return cache.get(key)!;
}

async function fetchSuggestions(center: LatLng, travelMode: string, lodging: LodgingPreference, count: number) {
  const r = travelMode === 'DRIVING' ? 8000 : 4000;
  const around = (radius: number) => `(around:${radius},${center.lat},${center.lng})`;
  const query = `[out:json][timeout:25];(
    nwr["tourism"~"${LODGING[lodging]}"]["name"]${around(r)};
    nwr["amenity"~"^(restaurant|cafe)$"]["name"]${around(r)};
    nwr${SHOP[travelMode] || SHOP.BICYCLING}["name"]${around(r * 4)};
    nwr["tourism"~"^(attraction|viewpoint|museum)$"]["name"]${around(r * 2)};
    nwr["historic"~"^(castle|monument|fort|ruins)$"]["name"]${around(r * 2)};
  );out center tags 400;`;
  let elements: OsmElement[];
  try {
    elements = await overpass(query);
  } catch (err) {
    console.warn('No Overpass server answered; places from Photon instead.', err);
    return photonSuggestions(center, travelMode, lodging, count);
  }
  const byCategory: Record<CategoryId, { e: OsmElement; score: number; km: number }[]> = { stay: [], food: [], shop: [], sights: [] };
  for (const e of elements) {
    const category = e.tags && classify(e.tags);
    const at = position(e);
    if (!category || !at) continue;
    byCategory[category].push({ e, score: rankScore(e.tags!), km: haversineKm(center, at) });
  }
  return (Object.keys(byCategory) as CategoryId[]).map(category => ({
    category: NAMES[category],
    items: byCategory[category]
      .sort((a, b) => b.score - a.score || a.km - b.km)
      .map(({ e }) => toItem(e, category))
      .filter((i): i is InterestItem => i !== null)
      .slice(0, count),
  }));
}

/** For each point, the nearest place to stay within 15 km (one request for all points), named after its town. */
export async function osmOvernightTowns(points: LatLng[], lodging: LodgingPreference): Promise<({ name: string; position: LatLng } | null)[]> {
  if (!points.length) return [];
  let elements: OsmElement[] = [];
  try {
    const clauses = points.map(p => `nwr["tourism"~"${LODGING[lodging]}"](around:15000,${p.lat.toFixed(5)},${p.lng.toFixed(5)});`).join('\n');
    // Planning waits for this: at most 10 s on Overpass, then Photon.
    elements = await overpass(`[out:json][timeout:25];(${clauses});out center tags;`, 10000);
  } catch (err) {
    console.warn('No Overpass server answered; overnight places from Photon instead.', err);
    elements = await photonOvernight(points, lodging);
  }
  const located = elements.map(e => ({ e, at: position(e) })).filter((x): x is { e: OsmElement; at: LatLng } => x.at !== null);
  return Promise.all(points.map(async point => {
    const nearest = located
      .map(x => ({ ...x, km: haversineKm(point, x.at) }))
      .filter(x => x.km <= 15)
      .sort((a, b) => a.km - b.km)[0];
    if (!nearest) return placeAt(point);
    const name = await townAt(nearest.at);
    return name ? { name, position: nearest.at } : placeAt(point);
  }));
}

// ---- Fallback: the same categories from Photon (names, kinds, positions; no website or stars) ----

const PHOTON_TAGS: Record<CategoryId, string[]> = {
  stay: [],  // from LODGING, below
  food: ['amenity:restaurant', 'amenity:cafe'],
  shop: [],  // by travel mode, below
  sights: ['tourism:attraction', 'tourism:viewpoint', 'tourism:museum', 'historic:castle', 'historic:monument', 'historic:fort', 'historic:ruins'],
};
const PHOTON_LODGING: Record<LodgingPreference, string[]> = {
  any: ['hotel', 'hostel', 'guest_house', 'motel', 'camp_site', 'alpine_hut', 'chalet', 'apartment'].map(v => `tourism:${v}`),
  camping: ['tourism:camp_site', 'tourism:caravan_site'],
  hostel: ['tourism:hostel'],
  hotel: ['tourism:hotel', 'tourism:guest_house', 'tourism:motel'],
};
const PHOTON_SHOP: Record<string, string[]> = {
  BICYCLING: ['shop:bicycle'], DRIVING: ['shop:motorcycle', 'shop:motorcycle_repair'], WALKING: ['shop:outdoor', 'shop:sports'],
};
const OSM_TYPE: Record<string, OsmElement['type']> = { N: 'node', W: 'way', R: 'relation' };

/** A Photon feature as an Overpass-like element, so the same ranking and item code applies. */
export function photonElement(f: PhotonFeature): OsmElement | null {
  const p = f.properties;
  if (!p.osm_key || !p.osm_value || !p.name) return null;
  return {
    type: OSM_TYPE[p.osm_type || 'N'] || 'node',
    id: Number(p.osm_id) || 0,
    lat: f.geometry.coordinates[1],
    lon: f.geometry.coordinates[0],
    tags: {
      name: p.name, [p.osm_key]: p.osm_value,
      ...(p.street ? { 'addr:street': p.street } : {}),
      ...(p.city ? { 'addr:city': p.city } : {}),
    },
  };
}

async function photonNear(center: LatLng, radiusKm: number, tags: string[], limit: number): Promise<OsmElement[]> {
  const q = tags.map(t => `osm_tag=${encodeURIComponent(t)}`).join('&');
  const features = await photon(`/reverse?lat=${center.lat}&lon=${center.lng}&radius=${Math.min(radiusKm, 30)}&limit=${limit}&${q}`);
  return features.map(photonElement).filter((e): e is OsmElement => e !== null);
}

async function photonSuggestions(center: LatLng, travelMode: string, lodging: LodgingPreference, count: number): Promise<InterestCategory[]> {
  const km = travelMode === 'DRIVING' ? 8 : 4;
  const plan: [CategoryId, string[], number][] = [
    ['stay', PHOTON_LODGING[lodging], km], ['food', PHOTON_TAGS.food, km],
    ['shop', PHOTON_SHOP[travelMode] || PHOTON_SHOP.BICYCLING, km * 4], ['sights', PHOTON_TAGS.sights, km * 2],
  ];
  const found = await Promise.allSettled(plan.map(([, tags, r]) => photonNear(center, r, tags, Math.max(count * 4, 12))));
  if (found.every(r => r.status === 'rejected')) throw (found[0] as PromiseRejectedResult).reason;
  return plan.map(([category], i) => ({
    category: NAMES[category],
    items: (found[i].status === 'fulfilled' ? found[i].value : [])
      .map(e => ({ e, km: haversineKm(center, position(e)!) }))
      .sort((a, b) => a.km - b.km)
      .map(({ e }) => toItem(e, category))
      .filter((x): x is InterestItem => x !== null)
      .slice(0, count),
  }));
}

/** The nearest place to stay within 15 km of each point, from Photon. */
async function photonOvernight(points: LatLng[], lodging: LodgingPreference): Promise<OsmElement[]> {
  const found = await Promise.allSettled(points.map(p => photonNear(p, 15, PHOTON_LODGING[lodging], 3)));
  return found.flatMap(r => (r.status === 'fulfilled' ? r.value : []));
}

// ---- Places to stay near a route (for choosing nights) ----

export interface LodgingSpot { at: LatLng; name?: string }

/** Every place to stay within `radiusKm` of each point (one Overpass request, else Photon), for picking nights. */
export async function lodgingNear(points: LatLng[], lodging: LodgingPreference, radiusKm: number): Promise<LodgingSpot[]> {
  if (!points.length) return [];
  const r = Math.round(radiusKm * 1000);
  let elements: OsmElement[] = [];
  try {
    const clauses = points.map(p => `nwr["tourism"~"${LODGING[lodging]}"](around:${r},${p.lat.toFixed(5)},${p.lng.toFixed(5)});`).join('\n');
    // Planning waits for this: at most 10 s on Overpass, then Photon.
    elements = await overpass(`[out:json][timeout:25];(${clauses});out center tags;`, 10000);
  } catch (err) {
    console.warn('No Overpass server answered; places to stay from Photon instead.', err);
    const found = await Promise.allSettled(points.map(p => photonNear(p, radiusKm, PHOTON_LODGING[lodging], 20)));
    elements = found.flatMap(f => (f.status === 'fulfilled' ? f.value : []));
  }
  const spots: { at: LatLng | null; name?: string }[] = elements.map(e => ({ at: position(e), name: e.tags?.name }));
  return spots.filter((x): x is LodgingSpot => x.at !== null);
}

/** The village or town a spot belongs to ("Grândola, Portugal"), not its whole municipality: a town or village within
 *  7 km first, a hamlet within 3 km if there's none; falls back to townAt. */
export async function settlementAt(at: LatLng): Promise<string | null> {
  const nearest = async (kinds: string[], km: number) => {
    const tags = kinds.map(k => `osm_tag=${encodeURIComponent(`place:${k}`)}`).join('&');
    const [f] = await photon(`/reverse?lat=${at.lat}&lon=${at.lng}&radius=${km}&limit=1&${tags}`);
    return f?.properties.name ? (f.properties.country ? `${f.properties.name}, ${f.properties.country}` : f.properties.name) : null;
  };
  try {
    return (await nearest(['city', 'town', 'village'], 7)) || (await nearest(['hamlet'], 3)) || townAt(at);
  } catch {
    return townAt(at);
  }
}
