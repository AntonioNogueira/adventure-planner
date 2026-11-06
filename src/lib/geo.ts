// Small geometry helpers on plain {lat, lng} points (no Maps library needed, so they're unit-tested).

export interface LatLng { lat: number; lng: number }

/** Straight-line distance in km (haversine). */
export function haversineKm(a: LatLng, b: LatLng) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2
    + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

export interface PathPoint { at: LatLng; km: number }

/**
 * Points along consecutive route legs with their distance (km) from the start.
 * Each leg's straight-line pieces are scaled so the leg adds up to its real road distance.
 */
export function pathWithDistances(legs: { path: LatLng[]; distanceMeters: number }[]): PathPoint[] {
  const points: PathPoint[] = [];
  let km = 0;
  for (const leg of legs) {
    const path = leg.path;
    if (path.length < 2) { km += leg.distanceMeters / 1000; continue; }
    const pieces = path.slice(1).map((p, i) => haversineKm(path[i], p));
    const raw = pieces.reduce((a, b) => a + b, 0) || 1;
    const scale = leg.distanceMeters / 1000 / raw;
    if (points.length === 0) points.push({ at: path[0], km });
    pieces.forEach((piece, i) => { km += piece * scale; points.push({ at: path[i + 1], km }); });
  }
  return points;
}

/** The first point at or beyond `km` along the path. */
export function pointAt(points: PathPoint[], km: number): LatLng {
  return (points.find(p => p.km >= km) || points[points.length - 1]).at;
}

/** Where to insert a new point into a sequence so it adds the least straight-line distance (index of the gap). */
export function bestInsertIndex(points: LatLng[], point: LatLng): number {
  let best = 0;
  let bestExtra = Infinity;
  for (let i = 0; i < points.length - 1; i++) {
    const extra = haversineKm(points[i], point) + haversineKm(point, points[i + 1]) - haversineKm(points[i], points[i + 1]);
    if (extra < bestExtra) { bestExtra = extra; best = i; }
  }
  return best;
}

/** At most `max` points, evenly picked, always keeping the first and last. */
export function downsample<T>(points: T[], max: number): T[] {
  if (points.length <= max) return points;
  const step = (points.length - 1) / (max - 1);
  return Array.from({ length: max }, (_, i) => points[Math.round(i * step)]);
}
