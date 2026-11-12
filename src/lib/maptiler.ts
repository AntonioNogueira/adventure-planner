// MapTiler geocoding: a second place-name service (free tier ~100k requests/month), used when Photon fails and
// before Nominatim (which allows only about one request a second). Needs MAPTILER_KEY in the server settings;
// the key is a browser key, restricted to the app's sites in MapTiler Cloud.
import { report } from './serviceHealth';

type Pt = { lat: number; lng: number };
export interface MapTilerFeature {
  place_type?: string[];
  text?: string;
  place_name?: string;
  center?: [number, number];
  context?: { id?: string; text?: string }[];
}

const SETTLEMENT_TYPES = ['municipality', 'locality', 'place', 'municipal_district', 'neighbourhood'];

export function maptilerKey(): string | undefined {
  return typeof window !== 'undefined' ? window.__APP_CONFIG__?.maptilerKey : undefined;
}

async function geocode(path: string): Promise<MapTilerFeature[]> {
  const key = maptilerKey();
  if (!key) throw new Error('MapTiler not configured');
  const started = Date.now();
  try {
    const res = await fetch(`https://api.maptiler.com/geocoding/${path}${path.includes('?') ? '&' : '?'}key=${key}&language=en`, { signal: AbortSignal.timeout(8000) });
    report('maptiler', res.ok, Date.now() - started, res.ok ? undefined : `HTTP ${res.status}`);
    if (!res.ok) throw new Error(`MapTiler ${res.status}`);
    return (await res.json()).features || [];
  } catch (err) {
    if (!(err instanceof Error && err.message.startsWith('MapTiler '))) report('maptiler', false, Date.now() - started, err instanceof Error ? err.message : String(err));
    throw err;
  }
}

const country = (f: MapTilerFeature) => f.context?.find(c => c.id?.startsWith('country'))?.text;
const named = (f: MapTilerFeature) => {
  const c = country(f);
  return f.text ? (c && c !== f.text ? `${f.text}, ${c}` : f.text) : null;
};

/** The best match for an address or town: a settlement first. */
export function pickMapTiler(features: MapTilerFeature[]): Pt | null {
  const best = features.find(f => f.place_type?.some(t => SETTLEMENT_TYPES.includes(t))) || features[0];
  return best?.center ? { lat: best.center[1], lng: best.center[0] } : null;
}

export async function maptilerSearch(address: string): Promise<Pt | null> {
  return pickMapTiler(await geocode(`${encodeURIComponent(address)}.json?limit=5`));
}

const toRad = (d: number) => (d * Math.PI) / 180;
const km = (a: Pt, b: Pt) => 2 * 6371 * Math.asin(Math.sqrt(Math.sin(toRad(b.lat - a.lat) / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(toRad(b.lng - a.lng) / 2) ** 2));

/** The town or village at a point ("Melides, Portugal"), with its own centre. MapTiler's smallest "place" is often a
 *  hamlet of a few houses, so the village level comes first (municipal district / locality), then a hamlet within
 *  3 km, then the municipality. */
export async function maptilerPlaceAt(at: Pt): Promise<{ name: string; at: Pt } | null> {
  const point = `${at.lng.toFixed(5)},${at.lat.toFixed(5)}.json?limit=1&types=`;
  const tries: [string, number][] = [['municipal_district,locality', 8], ['place', 3], ['municipality', 25]];
  for (const [types, maxKm] of tries) {
    const [f] = await geocode(point + types);
    const name = f && named(f);
    if (name && f.center) {
      const centre = { lat: f.center[1], lng: f.center[0] };
      if (km(at, centre) > maxKm) continue;
      // A union of parishes ("Lagoa e Carvoeiro", "Longueira/Almograve"): the village at its centre is the seat.
      if (f.text && UNION.test(f.text)) {
        const [seat] = await geocode(`${centre.lng.toFixed(5)},${centre.lat.toFixed(5)}.json?limit=1&types=place,municipality`).catch(() => []);
        const seatName = seat?.center && km(centre, { lat: seat.center[1], lng: seat.center[0] }) <= 2 ? seat.text : f.text.split(UNION)[0].trim();
        const c = country(f);
        return { name: c ? `${seatName}, ${c}` : seatName!, at: centre };
      }
      return { name, at: centre };
    }
  }
  return null;
}

/** Names that join several parishes: "X e Y", "X/Y", "X y Y", "X et Y". */
const UNION = /\s+e\s+|\s*\/\s*|\s+y\s+|\s+et\s+/i;
