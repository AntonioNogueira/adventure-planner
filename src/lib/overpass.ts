// OpenStreetMap places via the public Overpass API (free, fair use: requests are queued one at a time).
import { InterestCategory, InterestItem } from '../types';
import { LatLng, haversineKm } from './geo';
import { townAt, placeAt } from './geocode';
import type { CategoryId, LodgingPreference } from './places';

const OVERPASS = 'https://overpass-api.de/api/interpreter';

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

async function runQuery(query: string): Promise<OsmElement[]> {
  for (const delay of [0, 2500]) {
    if (delay) await new Promise(r => setTimeout(r, delay));
    const res = await fetch(OVERPASS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
      // A stalled request must not hold up planning (callers fall back without Overpass).
      signal: AbortSignal.timeout(30000),
    });
    if (res.ok) return (await res.json()).elements || [];
    if (res.status !== 429 && res.status !== 504) throw new Error(`Overpass ${res.status}`);
  }
  throw new Error('Overpass is busy; try again in a minute');
}

export function overpass(query: string): Promise<OsmElement[]> {
  const next = queue.then(() => runQuery(query));
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
    url: tags.website || tags['contact:website'] || `https://www.openstreetmap.org/${e.type}/${e.id}`,
    lat: at.lat,
    lng: at.lng,
    category,
  };
}

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
  const elements = await overpass(query);
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
    elements = await overpass(`[out:json][timeout:60];(${clauses});out center tags;`);
  } catch (err) {
    console.warn('Overnight search fell back to reverse geocoding', err);
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
