// Ride mode: where you are on today's route, how far is left, and links to open the day in a navigation app.
// Pure functions, unit-tested.
import { LatLng, haversineKm } from './geo';

export interface Progress {
  /** km from the day's start to the closest point of the route. */
  alongKm: number;
  /** km left to the end of the day. */
  remainingKm: number;
  /** How far you are from the route, in km. */
  offRouteKm: number;
  /** Share of the day done, 0–1. */
  fraction: number;
}

/** Cumulative km at each point of a path. */
export function cumulativeKm(path: LatLng[]): number[] {
  const out = [0];
  for (let i = 1; i < path.length; i++) out.push(out[i - 1] + haversineKm(path[i - 1], path[i]));
  return out;
}

/** Closest point of a segment a→b to p, as a 0–1 position along it (flat approximation, fine at route scale). */
function project(p: LatLng, a: LatLng, b: LatLng): number {
  const k = Math.cos((p.lat * Math.PI) / 180);
  const ax = a.lng * k, ay = a.lat, bx = b.lng * k, by = b.lat, px = p.lng * k, py = p.lat;
  const dx = bx - ax, dy = by - ay;
  const len = dx * dx + dy * dy;
  return len ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len)) : 0;
}

/** Where a position is along a path. */
export function progressOn(path: LatLng[], position: LatLng, cum = cumulativeKm(path)): Progress {
  const total = cum[cum.length - 1] || 0;
  if (path.length < 2) return { alongKm: 0, remainingKm: total, offRouteKm: path[0] ? haversineKm(path[0], position) : 0, fraction: 0 };
  let best = { d: Infinity, along: 0 };
  for (let i = 1; i < path.length; i++) {
    const t = project(position, path[i - 1], path[i]);
    const at = { lat: path[i - 1].lat + (path[i].lat - path[i - 1].lat) * t, lng: path[i - 1].lng + (path[i].lng - path[i - 1].lng) * t };
    const d = haversineKm(at, position);
    if (d < best.d) best = { d, along: cum[i - 1] + (cum[i] - cum[i - 1]) * t };
  }
  return {
    alongKm: best.along,
    remainingKm: Math.max(0, total - best.along),
    offRouteKm: best.d,
    fraction: total ? best.along / total : 0,
  };
}

/** Up to `count` points spread along a path (not its ends), to keep a navigation app on our route. */
export function viaPoints(path: LatLng[], count: number): LatLng[] {
  if (path.length < 3 || count <= 0) return [];
  const cum = cumulativeKm(path);
  const total = cum[cum.length - 1];
  const out: LatLng[] = [];
  let i = 0;
  for (let k = 1; k <= count; k++) {
    const target = (total * k) / (count + 1);
    while (i < cum.length - 1 && cum[i] < target) i++;
    out.push(path[i]);
  }
  return out;
}

const ll = (p: LatLng) => `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`;
const GOOGLE_MODE: Record<string, string> = { DRIVING: 'driving', BICYCLING: 'bicycling', WALKING: 'walking', TRANSIT: 'transit' };

/** Google Maps directions for the rest of the day (from `from`, or the day's start), shaped by a few via points. */
export function googleMapsUrl(path: LatLng[], travelMode: string, from?: LatLng): string {
  const end = path[path.length - 1];
  const params = new URLSearchParams({ api: '1', destination: ll(end), travelmode: GOOGLE_MODE[travelMode] || 'driving' });
  if (from) params.set('origin', ll(from)); else params.set('origin', ll(path[0]));
  // Google Maps links take up to 9 waypoints; 8 keeps it on our route without slowing it down.
  const rest = from ? path.slice(Math.max(0, nearestIndex(path, from))) : path;
  const vias = viaPoints(rest, 8);
  if (vias.length) params.set('waypoints', vias.map(ll).join('|'));
  return `https://www.google.com/maps/dir/?${params}`;
}

/** Waze to the day's end (Waze links take a destination only). */
export function wazeUrl(path: LatLng[]): string {
  return `https://waze.com/ul?ll=${ll(path[path.length - 1])}&navigate=yes`;
}

function nearestIndex(path: LatLng[], p: LatLng): number {
  let best = 0, d = Infinity;
  path.forEach((q, i) => { const x = haversineKm(p, q); if (x < d) { d = x; best = i; } });
  return best;
}

/** Arrival time at the current pace (km/h), as a Date; null if not moving. */
export function arrivalAt(remainingKm: number, kmh: number, now = new Date()): Date | null {
  if (!kmh || kmh < 2) return null;
  return new Date(now.getTime() + (remainingKm / kmh) * 3600_000);
}
