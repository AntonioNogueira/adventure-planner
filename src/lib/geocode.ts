// Place names ↔ coordinates, cached. Google Geocoding, or Photon (OpenStreetMap, free) in the open version.
import { isOsm } from './provider';
import { LatLng } from './geo';

const cache = new Map<string, Promise<LatLng | null>>();
const PLACEHOLDERS = ['apt', 'home', 'my location', 'office', 'work'];
const PHOTON = 'https://photon.komoot.io';

async function googleGeocoder() {
  const { Geocoder } = await google.maps.importLibrary("geocoding") as google.maps.GeocodingLibrary;
  return new Geocoder();
}

interface PhotonFeature {
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

async function photon(path: string): Promise<PhotonFeature[]> {
  return slot(async () => {
    let lastError: unknown;
    for (const delay of [0, 600, 1800]) {
      if (delay) await new Promise(r => setTimeout(r, delay));
      try {
        // English names, to match the AI's place names ("Spain", not "España").
        const res = await fetch(`${PHOTON}${path}${path.includes('?') ? '&' : '?'}lang=en`);
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
    if (isOsm) {
      const features = await photon(`/api/?q=${encodeURIComponent(address)}&limit=5`);
      // Prefer a town or city over a street that happens to share the name.
      const best = features.find(f => f.properties.osm_key === 'place' && SETTLEMENT.has(f.properties.osm_value || ''))
        || features.find(f => f.properties.type === 'city')
        || features[0];
      return best ? { lat: best.geometry.coordinates[1], lng: best.geometry.coordinates[0] } : null;
    }
    const { results } = await (await googleGeocoder()).geocode({ address });
    return results?.[0]?.geometry.location.toJSON() ?? null;
  } catch (error: any) {
    if (error?.code === 'ZERO_RESULTS') return null;
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
    if (isOsm) {
      const [f] = await photon(`/reverse?lat=${position.lat}&lon=${position.lng}&limit=1`);
      if (!f) return null;
      const p = f.properties;
      const town = p.osm_key === 'place' && SETTLEMENT.has(p.osm_value || '') ? p.name : p.city || p.locality || p.district;
      if (town) return p.country ? `${town}, ${p.country}` : town;
      const area = p.county || p.state;
      return area ? `Near ${area}${p.country ? `, ${p.country}` : ''}` : p.name || null;
    }
    const { results } = await (await googleGeocoder()).geocode({ location: position });
    if (!results.length) return null;
    const part = (type: string) => results
      .flatMap(r => r.address_components)
      .find(c => c.types.includes(type))?.long_name;
    const country = part('country');
    const town = part('locality') || part('postal_town');
    if (town) return country ? `${town}, ${country}` : town;
    // Countryside: label it by the parish/municipality. The stop keeps its exact position for routing.
    const area = part('administrative_area_level_3') || part('administrative_area_level_2') || part('route');
    return area ? `Near ${area}${country ? `, ${country}` : ''}` : results[0].formatted_address;
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
    if (isOsm) {
      // The nearest street is a routable spot.
      const [street] = await photon(`/reverse?lat=${position.lat}&lon=${position.lng}&limit=1&layer=street`).catch(() => []);
      const at = street ? { lat: street.geometry.coordinates[1], lng: street.geometry.coordinates[0] } : position;
      return { name, position: at };
    }
    const { results } = await (await googleGeocoder()).geocode({ location: position });
    const onLand = results.find(r => r.types.includes('street_address') || r.types.includes('route') || r.types.includes('premise'));
    return { name, position: (onLand || results[0])?.geometry.location.toJSON() || position };
  } catch (error) {
    console.error('Reverse geocoding failed:', error);
    return null;
  }
}
