// Elevation along routes (Valhalla's height service, VALHALLA_URL; Open-Meteo, ELEVATION_URL, as the backup) and climbing statistics.
import { LatLng, downsample, evenlySpaced } from './geo';
import { trackedFetch } from './serviceHealth';
import { SERVICES } from './services';

/** Flat-equivalent km added per 1000 m of climbing, per travel mode (hiking follows Naismith's rule). */
export const EFFORT_KM_PER_1000M: Record<string, number> = { BICYCLING: 10, WALKING: 8, DRIVING: 0, TRANSIT: 0 };

// Ups and downs smaller than this are treated as noise.
const NOISE_M = 3;

/** Total climbing and descending in metres, ignoring small wobbles. */
export function climbStats(elevations: number[]): { ascent: number; descent: number } {
  let ascent = 0;
  let descent = 0;
  let anchor = elevations[0];
  for (const e of elevations.slice(1)) {
    if (e - anchor > NOISE_M) { ascent += e - anchor; anchor = e; }
    else if (anchor - e > NOISE_M) { descent += anchor - e; anchor = e; }
  }
  return { ascent: Math.round(ascent), descent: Math.round(descent) };
}

/** Distance ranges (km from the start of a stretch) with no riding, e.g. ferry crossings. */
export type KmRange = [number, number];

const inRanges = (km: number, ranges: KmRange[]) => ranges.find(([a, b]) => km > a && km < b);

/**
 * Where to end each day along a stretch of `totalKm`, splitting by effort (distance plus climbing)
 * rather than by distance alone. `elevations` are evenly spaced samples along the stretch.
 * Ferry ranges count as no effort, and a day never ends at sea: it ends at the arrival port.
 */
export function splitByEffort(
  totalKm: number, elevations: number[] | null, kmPer1000m: number, days: number, ferries: KmRange[] = [],
): number[] {
  if (days <= 1) return [];
  const flat = !elevations || elevations.length < 2 || kmPer1000m === 0;
  if (flat && ferries.length === 0) {
    return Array.from({ length: days - 1 }, (_, k) => (totalKm * (k + 1)) / days);
  }
  const samples = elevations && elevations.length >= 2 ? elevations : new Array(257).fill(0);
  const n = samples.length;
  const step = totalKm / (n - 1);
  const effort: number[] = [0];
  for (let i = 1; i < n; i++) {
    const riding = !inRanges((i - 0.5) * step, ferries);
    const climb = riding && !flat ? Math.max(0, samples[i] - samples[i - 1]) : 0;
    effort.push(effort[i - 1] + (riding ? step : 0) + (climb * kmPer1000m) / 1000);
  }
  const total = effort[n - 1];
  return Array.from({ length: days - 1 }, (_, k) => {
    const goal = (total * (k + 1)) / days;
    const i = Math.max(1, effort.findIndex(e => e >= goal));
    // Interpolate between the two samples around the goal.
    const frac = (goal - effort[i - 1]) / ((effort[i] - effort[i - 1]) || 1);
    const km = step * (i - 1 + frac);
    return inRanges(km, ferries)?.[1] ?? km;
  });
}

/** Flat-equivalent km for a stretch, used to decide how many days it needs. */
export function effortKm(totalKm: number, elevations: number[] | null, kmPer1000m: number, ferryKm = 0) {
  return totalKm - ferryKm + (elevations ? climbStats(elevations).ascent * kmPer1000m / 1000 : 0);
}

const cache = new Map<string, Promise<number[] | null>>();

// Heights at the given points from Valhalla's height service (VALHALLA_URL).
async function valhallaHeights(points: LatLng[]): Promise<number[]> {
  const res = await trackedFetch('valhalla', `${SERVICES.valhalla}/height`, {
    signal: AbortSignal.timeout(12000),
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ shape: points.map(p => ({ lat: p.lat, lon: p.lng })), range: false }),
  });
  if (!res.ok) throw new Error(`Valhalla height ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data.height) || data.height.length !== points.length) throw new Error(data.error || 'no heights');
  return data.height;
}

// The backup: Open-Meteo's elevation API (free, 100 points per request).
async function openMeteoHeights(points: LatLng[]): Promise<number[]> {
  const out: number[] = [];
  for (let i = 0; i < points.length; i += 100) {
    const part = points.slice(i, i + 100);
    const lat = part.map(p => p.lat.toFixed(5)).join(',');
    const lng = part.map(p => p.lng.toFixed(5)).join(',');
    const res = await fetch(`${SERVICES.elevation}?latitude=${lat}&longitude=${lng}`, { signal: AbortSignal.timeout(12000) });
    if (!res.ok) throw new Error(`Open-Meteo elevation ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.elevation) || data.elevation.length !== part.length) throw new Error(data.reason || 'no heights');
    out.push(...data.elevation);
  }
  return out;
}

// At most two lookups at a time, so a whole trip's profiles don't hit the free servers in one burst.
let running = 0;
const waiting: (() => void)[] = [];
async function limited<T>(run: () => Promise<T>): Promise<T> {
  if (running >= 2) await new Promise<void>(go => waiting.push(go));
  running++;
  try { return await run(); } finally { running--; waiting.shift()?.(); }
}

async function lookup(points: LatLng[]): Promise<number[] | null> {
  for (const source of [valhallaHeights, openMeteoHeights]) {
    try {
      const heights = await limited(() => source(points));
      return heights.map(h => Math.max(0, h ?? 0));
    } catch (err) {
      console.warn(`Elevation from ${source === valhallaHeights ? 'Valhalla' : 'Open-Meteo'} failed.`, err);
    }
  }
  console.warn('No elevation service answered; planning by distance only.');
  return null;
}

/** `samples` evenly spaced elevations (m) along a path, or null if no elevation service answers.
 *  Valhalla first, Open-Meteo if it fails; a failure isn't remembered, so the next look tries again. */
export function elevationsAlong(path: LatLng[], samples: number): Promise<number[] | null> {
  if (path.length < 2) return Promise.resolve(null);
  const short = downsample(path, 200);
  const key = `${samples}|${short.length}|${short[0].lat},${short[0].lng}|${short[short.length - 1].lat},${short[short.length - 1].lng}`;
  if (!cache.has(key)) {
    const pending = lookup(evenlySpaced(path, samples));
    cache.set(key, pending);
    pending.then(h => { if (!h) cache.delete(key); });
  }
  return cache.get(key)!;
}
