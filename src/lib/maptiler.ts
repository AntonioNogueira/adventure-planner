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

/** The town or village at a point ("Silves, Portugal"), with its own position. */
export async function maptilerPlaceAt(at: Pt): Promise<{ name: string; at: Pt } | null> {
  const [f] = await geocode(`${at.lng.toFixed(5)},${at.lat.toFixed(5)}.json?limit=1&types=${SETTLEMENT_TYPES.join(',')}`);
  const name = f && named(f);
  return name && f.center ? { name, at: { lat: f.center[1], lng: f.center[0] } } : null;
}
