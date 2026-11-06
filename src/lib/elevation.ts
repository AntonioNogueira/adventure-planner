// Elevation along routes (Google Elevation API, same Maps key) and climbing statistics.
import { LatLng, downsample } from './geo';

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

/**
 * Where to end each day along a stretch of `totalKm`, splitting by effort (distance plus climbing)
 * rather than by distance alone. `elevations` are evenly spaced samples along the stretch.
 */
export function splitByEffort(totalKm: number, elevations: number[] | null, kmPer1000m: number, days: number): number[] {
  if (days <= 1) return [];
  if (!elevations || elevations.length < 2 || kmPer1000m === 0) {
    return Array.from({ length: days - 1 }, (_, k) => (totalKm * (k + 1)) / days);
  }
  const n = elevations.length;
  const effort: number[] = [0];
  for (let i = 1; i < n; i++) {
    const climb = Math.max(0, elevations[i] - elevations[i - 1]);
    effort.push(effort[i - 1] + totalKm / (n - 1) + (climb * kmPer1000m) / 1000);
  }
  const total = effort[n - 1];
  return Array.from({ length: days - 1 }, (_, k) => {
    const goal = (total * (k + 1)) / days;
    const i = Math.max(1, effort.findIndex(e => e >= goal));
    // Interpolate between the two samples around the goal.
    const frac = (goal - effort[i - 1]) / ((effort[i] - effort[i - 1]) || 1);
    return (totalKm * (i - 1 + frac)) / (n - 1);
  });
}

/** Flat-equivalent km for a stretch, used to decide how many days it needs. */
export function effortKm(totalKm: number, elevations: number[] | null, kmPer1000m: number) {
  return totalKm + (elevations ? climbStats(elevations).ascent * kmPer1000m / 1000 : 0);
}

const cache = new Map<string, number[] | null>();

/** `samples` evenly spaced elevations (m) along a path, or null if the Elevation API fails. */
export async function elevationsAlong(path: LatLng[], samples: number): Promise<number[] | null> {
  if (path.length < 2) return null;
  const short = downsample(path, 200);
  const key = `${samples}|${short.length}|${short[0].lat},${short[0].lng}|${short[short.length - 1].lat},${short[short.length - 1].lng}`;
  if (cache.has(key)) return cache.get(key)!;
  try {
    const { ElevationService } = await google.maps.importLibrary('elevation') as google.maps.ElevationLibrary;
    const { results } = await new ElevationService().getElevationAlongPath({ path: short, samples });
    const elevations = results.map(r => r.elevation);
    cache.set(key, elevations);
    return elevations;
  } catch (err) {
    console.warn('Elevation lookup failed; planning by distance only.', err);
    cache.set(key, null);
    return null;
  }
}
