// Place names ↔ coordinates, cached, from Photon (OpenStreetMap), with Nominatim as the backup when Photon is
// busy or unreachable (free public servers drop requests now and then). PHOTON_URL / NOMINATIM_URL pick the servers.
import { SERVICES } from './services';
import { t } from './settings';
import { searchTown } from './affiliate';
import { LatLng, haversineKm } from './geo';

const cache = new Map<string, Promise<LatLng | null>>();
const PLACEHOLDERS = ['apt', 'home', 'my location', 'office', 'work'];

export interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: Record<string, string | undefined>;
}

// Photon is a free shared service: at most two requests at a time, retried on hiccups.
let active = 0;
const waiting: (() => void)[] = [];
async function slot<T>(run: () => Promise<T>): Promise<T> {
  if (active >= 2) await new Promise<void>(resolve => waiting.push(resolve));
  active++;
  try { return await run(); } finally { active--; waiting.shift()?.(); }
}

export async function photon(path: string): Promise<PhotonFeature[]> {
  return slot(async () => {
    let lastError: unknown;
    for (const delay of [0, 600, 1800]) {
      if (delay) await new Promise(r => setTimeout(r, delay));
      try {
        // English names, to match the AI's place names ("Spain", not "España").
        const res = await fetch(`${SERVICES.photon}${path}${path.includes('?') ? '&' : '?'}lang=en`, { signal: AbortSignal.timeout(8000) });
        if (res.ok) return (await res.json()).features || [];
        lastError = new Error(`Photon ${res.status}`);
        if (res.status !== 429 && res.status < 500) break;
      } catch (err) {
        lastError = err; // network hiccup: retry
      }
    }
    throw lastError;
  });
}

const SETTLEMENT = new Set(['city', 'town', 'village', 'hamlet', 'municipality', 'suburb', 'locality', 'island']);

class LookupFailed extends Error {}

// ---- Nominatim (backup): one request at a time, at most about one a second (its usage policy) ----

export interface NominatimPlace {
  lat: string; lon: string; category?: string; type?: string; addresstype?: string; name?: string;
  address?: Record<string, string | undefined>;
}

let nominatimQueue: Promise<unknown> = Promise.resolve();
let lastNominatim = 0;
export function nominatim<T>(path: string): Promise<T> {
  const run = async () => {
    const wait = lastNominatim + 1100 - Date.now();
    if (wait > 0) await new Promise(r => setTimeout(r, wait));
    lastNominatim = Date.now();
    const res = await fetch(`${SERVICES.nominatim}${path}${path.includes('?') ? '&' : '?'}format=jsonv2&accept-language=en`, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`Nominatim ${res.status}`);
    return res.json() as Promise<T>;
  };
  const next = nominatimQueue.then(run, run);
  nominatimQueue = next.catch(() => undefined);
  return next;
}

const NOMINATIM_SETTLEMENT = new Set(['city', 'town', 'village', 'hamlet', 'municipality', 'suburb', 'locality', 'administrative']);

/** The best Nominatim result for a town search: a settlement first. */
export function pickNominatim(results: NominatimPlace[]): LatLng | null {
  const best = results.find(r => r.category === 'place' && NOMINATIM_SETTLEMENT.has(r.type || ''))
    || results.find(r => NOMINATIM_SETTLEMENT.has(r.addresstype || ''))
    || results[0];
  return best ? { lat: Number(best.lat), lng: Number(best.lon) } : null;
}

const fold = (x: string) => x.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
const at = (f: PhotonFeature): LatLng => ({ lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0] });
const isSettlement = (f: PhotonFeature) => f.properties.osm_key === 'place' && SETTLEMENT.has(f.properties.osm_value || '');

/** The best Photon result for an address: a town or city over a street that shares the name. Null when the best is
 *  only an administrative area (a municipality's middle can be in the hills, far from the town): see townPoint. */
export function pickPhoton(features: PhotonFeature[]): { point: LatLng | null; area?: PhotonFeature } {
  const settlement = features.find(isSettlement);
  if (settlement) return { point: at(settlement) };
  const best = features.find(f => f.properties.type === 'city') || features[0];
  if (!best) return { point: null };
  return best.properties.osm_key === 'boundary' ? { point: null, area: best } : { point: at(best) };
}

/** The town itself (its place point) named like `address`, near an administrative area found for it. */
export function townPoint(places: PhotonFeature[], address: string, area: PhotonFeature): LatLng | null {
  const name = fold(address.split(',')[0]);
  const near = (f: PhotonFeature) => haversineKm(at(f), at(area)) < 40;
  const town = places.find(f => isSettlement(f) && fold(f.properties.name || '') === name && near(f))
    || places.find(f => isSettlement(f) && fold(f.properties.name || '') === fold(area.properties.name || '') && near(f));
  return town ? at(town) : null;
}

async function lookup(address: string): Promise<LatLng | null> {
  let photonError: unknown = null;
  try {
    const features = await photon(`/api/?q=${encodeURIComponent(address)}&limit=5`);
    const { point, area } = pickPhoton(features);
    if (point) return point;
    if (area) {
      // Only a municipality came back: ask for places only, to get the town's own point.
      const places = await photon(`/api/?q=${encodeURIComponent(address)}&limit=5&osm_tag=place`).catch(() => []);
      return townPoint(places, address, area) || at(area);
    }
  } catch (error) {
    photonError = error;
  }
  // Photon failed or found nothing: ask Nominatim.
  try {
    return pickNominatim(await nominatim<NominatimPlace[]>(`/search?q=${encodeURIComponent(address)}&limit=5`));
  } catch (error) {
    console.error(`Geocoding failed for ${address}:`, photonError || error, error);
    throw new LookupFailed(String(error));
  }
}

/** "Covilhã, Portugal" from a Nominatim reverse lookup (town, or "Near <area>" in the countryside). */
export function nominatimTown(r: NominatimPlace | null): string | null {
  const a = r?.address;
  if (!a) return null;
  const raw = a.city || a.town || a.village || a.hamlet || a.municipality;
  const town = raw && searchTown(raw);
  if (town) return a.country ? `${town}, ${a.country}` : town;
  const area = a.county || a.state_district || a.state;
  return area ? `${t('Near {place}', { place: area })}${a.country ? `, ${a.country}` : ''}` : null;
}

export function geocodeAddress(address: string): Promise<LatLng | null> {
  const key = address.trim().toLowerCase();
  if (key.length < 3 || PLACEHOLDERS.includes(key)) return Promise.resolve(null);
  if (!cache.has(key)) {
    // Remember answers (including "not found"), but not service failures: those are retried once after a pause
    // (busy free servers usually answer the second time), then forgotten so a later attempt asks again.
    const pending = lookup(address)
      .catch(() => new Promise<LatLng | null>(resolve => setTimeout(() => lookup(address).then(resolve, () => resolve(null)), 1500)))
      .then(at => { if (!at) cache.delete(key); return at; });
    cache.set(key, pending);
  }
  return cache.get(key)!;
}

/** A readable name for a position: "Tavira, Portugal", or "Near <area>, <country>" in the countryside. */
export async function townAt(position: LatLng): Promise<string | null> {
  try {
    const [f] = await photon(`/reverse?lat=${position.lat}&lon=${position.lng}&limit=1`).catch(async err => {
      // Photon unavailable: Nominatim names the place instead.
      const name = nominatimTown(await nominatim<NominatimPlace>(`/reverse?lat=${position.lat}&lon=${position.lng}&zoom=14`).catch(() => null));
      if (name) throw new NamedBy(name);
      throw err;
    });
    if (!f) return null;
    const p = f.properties;
    const raw = p.osm_key === 'place' && SETTLEMENT.has(p.osm_value || '') ? p.name : p.city || p.locality || p.district;
    // Administrative names ("União das freguesias de X e Y") are shortened to the town.
    const town = raw && searchTown(raw);
    if (town) return p.country ? `${town}, ${p.country}` : town;
    const area = p.county || p.state;
    return area ? `${t('Near {place}', { place: area })}${p.country ? `, ${p.country}` : ''}` : p.name || null;
  } catch (error) {
    if (error instanceof NamedBy) return error.name;
    console.error('Reverse geocoding failed:', error);
    return null;
  }
}

/** Carries a name found by the backup service out of the Photon branch. */
class NamedBy extends Error { constructor(public name: string) { super(name); } }

/** A name plus a nearby routable spot (the nearest address, so never in a river or the sea). */
export async function placeAt(position: LatLng): Promise<{ name: string; position: LatLng } | null> {
  try {
    const name = await townAt(position);
    if (!name) return null;
    // The nearest street is a routable spot.
    const [street] = await photon(`/reverse?lat=${position.lat}&lon=${position.lng}&limit=1&layer=street`).catch(() => []);
    const at = street ? { lat: street.geometry.coordinates[1], lng: street.geometry.coordinates[0] } : position;
    return { name, position: at };
  } catch (error) {
    console.error('Reverse geocoding failed:', error);
    return null;
  }
}
