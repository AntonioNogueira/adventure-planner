// Place names ↔ coordinates, cached, from Photon (OpenStreetMap). The server's PHOTON_URL setting picks the server.
import { SERVICES } from './services';
import { t } from './settings';
import { searchTown } from './affiliate';
import { LatLng } from './geo';

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
        const res = await fetch(`${SERVICES.photon}${path}${path.includes('?') ? '&' : '?'}lang=en`);
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

async function lookup(address: string): Promise<LatLng | null> {
  try {
    const features = await photon(`/api/?q=${encodeURIComponent(address)}&limit=5`);
    // Prefer a town or city over a street that happens to share the name.
    const best = features.find(f => f.properties.osm_key === 'place' && SETTLEMENT.has(f.properties.osm_value || ''))
      || features.find(f => f.properties.type === 'city')
      || features[0];
    return best ? { lat: best.geometry.coordinates[1], lng: best.geometry.coordinates[0] } : null;
  } catch (error: any) {
    console.error(`Geocoding failed for ${address}:`, error);
    throw new LookupFailed(String(error));
  }
}

export function geocodeAddress(address: string): Promise<LatLng | null> {
  const key = address.trim().toLowerCase();
  if (key.length < 3 || PLACEHOLDERS.includes(key)) return Promise.resolve(null);
  if (!cache.has(key)) {
    // Remember answers (including "not found"), but not service failures, so they can be retried.
    const pending = lookup(address).catch(() => { cache.delete(key); return null; });
    cache.set(key, pending);
  }
  return cache.get(key)!;
}

/** A readable name for a position: "Tavira, Portugal", or "Near <area>, <country>" in the countryside. */
export async function townAt(position: LatLng): Promise<string | null> {
  try {
    const [f] = await photon(`/reverse?lat=${position.lat}&lon=${position.lng}&limit=1`);
    if (!f) return null;
    const p = f.properties;
    const raw = p.osm_key === 'place' && SETTLEMENT.has(p.osm_value || '') ? p.name : p.city || p.locality || p.district;
    // Administrative names ("União das freguesias de X e Y") are shortened to the town.
    const town = raw && searchTown(raw);
    if (town) return p.country ? `${town}, ${p.country}` : town;
    const area = p.county || p.state;
    return area ? `${t('Near {place}', { place: area })}${p.country ? `, ${p.country}` : ''}` : p.name || null;
  } catch (error) {
    console.error('Reverse geocoding failed:', error);
    return null;
  }
}

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
