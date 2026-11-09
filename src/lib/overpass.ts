// OpenStreetMap places. Overpass first (full details: website, stars, opening hours), trying each server in
// OVERPASS_URL in turn; if none answers, Photon (names, kinds and positions only), so places never go missing.
// The free public servers are fair use and often busy or refuse cloud traffic: production sets its own.
import { InterestCategory, InterestItem } from '../types';
import { LatLng, haversineKm } from './geo';
import { townAt, placeAt, photon, PhotonFeature } from './geocode';
import { SERVICES } from './services';
import { CATEGORIES, type CategoryId, type LodgingPreference } from './places';

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

/** Shops & repairs by kind of trip: bike shops, sport/outdoor shops, moto shops, or mechanics for cars and vans. */
export function shopTags(travelMode: string, vehicle = ''): string[] {
  if (travelMode === 'BICYCLING') return ['bicycle', 'sports'];
  if (travelMode === 'WALKING') return ['outdoor', 'sports'];
  if (vehicle.startsWith('motorcycle')) return ['motorcycle', 'motorcycle_repair'];
  if (['car', '4x4', 'campervan'].includes(vehicle)) return ['car_repair', 'tyres', 'car_parts'];
  return ['motorcycle', 'motorcycle_repair', 'car_repair'];
}
const GROCERY = ['supermarket', 'convenience', 'greengrocer', 'bakery', 'farm', 'deli', 'butcher', 'cheese'];
/** Utilities by kind of trip: water, toilets and showers on foot and by bike; also fuel and charging with a motor. */
export function utilityTags(travelMode: string): string[] {
  const base = ['drinking_water', 'water_point', 'toilets', 'shower'];
  return travelMode === 'DRIVING' ? ['fuel', 'charging_station', 'water_point', 'toilets', 'sanitary_dump_station'] : base;
}

const TYPE_LABELS: Record<string, string> = {
  hotel: 'Hotel', hostel: 'Hostel', guest_house: 'Guest house', motel: 'Motel', camp_site: 'Campsite',
  caravan_site: 'Caravan site', alpine_hut: 'Mountain hut', chalet: 'Chalet', apartment: 'Apartment',
  restaurant: 'Restaurant', cafe: 'Café', bicycle: 'Bike shop', motorcycle: 'Motorcycle shop',
  motorcycle_repair: 'Motorcycle repair', outdoor: 'Outdoor shop', sports: 'Sports shop',
  car_repair: 'Mechanic', tyres: 'Tyres', car_parts: 'Car parts',
  supermarket: 'Supermarket', convenience: 'Grocery', greengrocer: 'Greengrocer', bakery: 'Bakery', farm: 'Farm shop',
  deli: 'Deli', butcher: 'Butcher', cheese: 'Cheese shop', marketplace: 'Market',
  drinking_water: 'Drinking water', water_point: 'Water point', toilets: 'Toilets', shower: 'Showers',
  fuel: 'Fuel station', charging_station: 'Charging point', sanitary_dump_station: 'Motorhome service point',
  attraction: 'Attraction', viewpoint: 'Viewpoint', museum: 'Museum', castle: 'Castle', monument: 'Monument',
  fort: 'Fort', ruins: 'Ruins',
};

const position = (e: OsmElement): LatLng | null =>
  e.lat != null && e.lon != null ? { lat: e.lat, lng: e.lon } : e.center ? { lat: e.center.lat, lng: e.center.lon } : null;

/** Which category an OSM element belongs to. */
export function classify(tags: Record<string, string>): CategoryId | null {
  if (/^(hotel|hostel|guest_house|motel|camp_site|caravan_site|alpine_hut|chalet|apartment)$/.test(tags.tourism || '')) return 'stay';
  if (/^(restaurant|cafe|marketplace)$/.test(tags.amenity || '') || GROCERY.includes(tags.shop || '')) return 'food';
  if (/^(drinking_water|water_point|toilets|shower|fuel|charging_station|sanitary_dump_station)$/.test(tags.amenity || '')) return 'water';
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
  const kind = tags.tourism || tags.amenity || tags.shop || tags.historic || '';
  // Water points and toilets rarely have a name: call them by what they are.
  const name = tags.name || (category === 'water' ? TYPE_LABELS[kind] : undefined);
  if (!name || !at) return null;
  const where = [tags['addr:street'], tags['addr:city'] || tags['addr:town'] || tags['addr:village']].filter(Boolean).join(', ');
  return {
    name,
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

// Read when used (not when this file loads): places.ts and this file import each other.
const NAMES = new Proxy({} as Record<CategoryId, string>, { get: (_, id: string) => CATEGORIES[id as CategoryId]?.name });

const cache = new Map<string, Promise<InterestCategory[]>>();

/** 4 categories × `count` named OSM places near a stop, in one Overpass request. */
export function osmSuggestions(center: LatLng, travelMode: string, lodging: LodgingPreference, count: number, vehicle = ''): Promise<InterestCategory[]> {
  const key = [center.lat.toFixed(3), center.lng.toFixed(3), travelMode, lodging, count, vehicle].join('|');
  if (!cache.has(key)) {
    const pending = fetchSuggestions(center, travelMode, lodging, count, vehicle);
    cache.set(key, pending);
    pending.catch(() => cache.delete(key));
  }
  return cache.get(key)!;
}

async function fetchSuggestions(center: LatLng, travelMode: string, lodging: LodgingPreference, count: number, vehicle = '') {
  const r = travelMode === 'DRIVING' ? 8000 : 4000;
  const around = (radius: number) => `(around:${radius},${center.lat},${center.lng})`;
  const any = (list: string[]) => `"^(${list.join('|')})$"`;
  const query = `[out:json][timeout:25];(
    nwr["tourism"~"${LODGING[lodging]}"]["name"]${around(r)};
    nwr["amenity"~"^(restaurant|cafe|marketplace)$"]["name"]${around(r)};
    nwr["shop"~${any(GROCERY)}]["name"]${around(r)};
    nwr["shop"~${any(shopTags(travelMode, vehicle))}]["name"]${around(r * 4)};
    nwr["amenity"~${any(utilityTags(travelMode))}]${around(Math.round(r * 0.75))};
    nwr["tourism"~"^(attraction|viewpoint|museum)$"]["name"]${around(r * 2)};
    nwr["historic"~"^(castle|monument|fort|ruins)$"]["name"]${around(r * 2)};
  );out center tags 400;`;
  let elements: OsmElement[];
  try {
    elements = await overpass(query);
  } catch (err) {
    console.warn('No Overpass server answered; places from Photon instead.', err);
    return photonSuggestions(center, travelMode, lodging, count, vehicle);
  }
  const byCategory: Record<CategoryId, { e: OsmElement; score: number; km: number }[]> = { stay: [], food: [], shop: [], water: [], sights: [] };
  for (const e of elements) {
    const category = e.tags && classify(e.tags);
    const at = position(e);
    if (!category || !at) continue;
    byCategory[category].push({ e, score: rankScore(e.tags!), km: haversineKm(center, at) });
  }
  const ranked = (list: { e: OsmElement; score: number; km: number }[], category: CategoryId, n: number) => list
    .sort((a, b) => b.score - a.score || a.km - b.km)
    .map(({ e }) => toItem(e, category))
    .filter((i): i is InterestItem => i !== null)
    .slice(0, n);
  return (['stay', 'food', 'shop', 'water', 'sights'] as CategoryId[]).map(category => {
    if (category === 'water') {
      // The nearest water and toilets matter more than famous ones.
      return { category: NAMES.water, items: ranked(byCategory.water.map(x => ({ ...x, score: 0 })), 'water', count) };
    }
    if (category === 'food') {
      // Somewhere to eat and somewhere to buy food (a supermarket, bakery or farm shop) when there is one.
      const shops = byCategory.food.filter(x => GROCERY.includes(x.e.tags!.shop || '') || x.e.tags!.amenity === 'marketplace');
      const eat = byCategory.food.filter(x => !shops.includes(x));
      const buy = ranked(shops, 'food', 1);
      return { category: NAMES.food, items: [...ranked(eat, 'food', count - buy.length), ...buy] };
    }
    return { category: NAMES[category], items: ranked(byCategory[category], category, count) };
  });
}

// ---- Fallback: the same categories from Photon (names, kinds, positions; no website or stars) ----

const PHOTON_TAGS: Record<CategoryId, string[]> = {
  stay: [],  // from LODGING, below
  food: ['amenity:restaurant', 'amenity:cafe', 'shop:supermarket', 'shop:bakery', 'shop:farm'],
  shop: [],  // by travel mode, below
  water: [], // by travel mode, below
  sights: ['tourism:attraction', 'tourism:viewpoint', 'tourism:museum', 'historic:castle', 'historic:monument', 'historic:fort', 'historic:ruins'],
};
const PHOTON_LODGING: Record<LodgingPreference, string[]> = {
  any: ['hotel', 'hostel', 'guest_house', 'motel', 'camp_site', 'alpine_hut', 'chalet', 'apartment'].map(v => `tourism:${v}`),
  camping: ['tourism:camp_site', 'tourism:caravan_site'],
  hostel: ['tourism:hostel'],
  hotel: ['tourism:hotel', 'tourism:guest_house', 'tourism:motel'],
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

async function photonSuggestions(center: LatLng, travelMode: string, lodging: LodgingPreference, count: number, vehicle = ''): Promise<InterestCategory[]> {
  const km = travelMode === 'DRIVING' ? 8 : 4;
  const plan: [CategoryId, string[], number][] = [
    ['stay', PHOTON_LODGING[lodging], km], ['food', PHOTON_TAGS.food, km],
    ['shop', shopTags(travelMode, vehicle).map(v => `shop:${v}`), km * 4],
    ['water', utilityTags(travelMode).map(v => `amenity:${v}`), km * 0.75],
    ['sights', PHOTON_TAGS.sights, km * 2],
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
