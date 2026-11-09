// Ride mode: where you are on today's route, how far is left, and links to open the day in a navigation app.
// Pure functions, unit-tested.
import { LatLng, haversineKm } from './geo';
import type { RouteInfo, InterestCategory } from '../types';
import { CATEGORIES, categoryId } from './places';

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

/** A path cut at `alongKm`: the part already ridden and the part ahead (both include the cut point). */
export function splitAt(path: LatLng[], alongKm: number, cum = cumulativeKm(path)): { done: LatLng[]; ahead: LatLng[] } {
  if (path.length < 2 || alongKm <= 0) return { done: [], ahead: path };
  const total = cum[cum.length - 1];
  if (alongKm >= total) return { done: path, ahead: [] };
  let i = 1;
  while (i < cum.length - 1 && cum[i] < alongKm) i++;
  const span = cum[i] - cum[i - 1];
  const f = span ? (alongKm - cum[i - 1]) / span : 0;
  const cut = { lat: path[i - 1].lat + (path[i].lat - path[i - 1].lat) * f, lng: path[i - 1].lng + (path[i].lng - path[i - 1].lng) * f };
  return { done: [...path.slice(0, i), cut], ahead: [cut, ...path.slice(i)] };
}

/** Compass bearing from a to b, in degrees (0 = north, 90 = east). */
export function bearingDeg(a: LatLng, b: LatLng): number {
  const r = Math.PI / 180;
  const y = Math.sin((b.lng - a.lng) * r) * Math.cos(b.lat * r);
  const x = Math.cos(a.lat * r) * Math.sin(b.lat * r) - Math.sin(a.lat * r) * Math.cos(b.lat * r) * Math.cos((b.lng - a.lng) * r);
  return ((Math.atan2(y, x) / r) + 360) % 360;
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

export interface RideTarget { key: string; name: string; glyph: string; at: LatLng; booked?: boolean; stay?: boolean }
export interface RideTargetGroup { label: string; items: RideTarget[]; /** 0 = start, 1… = stops, last = finish. */ stop: number }

/**
 * Places on the trip you can "Go to" in ride mode, grouped by stop: the stop itself, then its booked and saved places
 * (bookings first). Stop positions come from the day routes (each day ends at the next stop).
 */
export function rideTargets(route: Pick<RouteInfo, 'origin' | 'destination' | 'waypoints' | 'originInterests' | 'destinationInterests'>, paths: LatLng[][]): RideTargetGroup[] {
  if (!paths.length || !paths[0].length) return [];
  const stops: { label: string; at?: LatLng; interests?: InterestCategory[] }[] = [
    { label: route.origin, at: paths[0][0], interests: route.originInterests },
    ...route.waypoints.map((w, i) => ({ label: w.location, at: w.position || paths[i]?.[paths[i].length - 1], interests: w.interests })),
    { label: route.destination, at: paths[paths.length - 1][paths[paths.length - 1].length - 1], interests: route.destinationInterests },
  ];
  return stops.map((stop, s) => {
    const items: RideTarget[] = [];
    if (stop.at) items.push({ key: `stop-${s}`, name: stop.label.split(',')[0], glyph: '📍', at: stop.at });
    const places = (stop.interests || []).flatMap((cat, c) => cat.items.map((item, k) => ({ cat, c, item, k })))
      .map(({ cat, c, item, k }) => {
        const r = item.reservation;
        const at = item.lat != null && item.lng != null ? { lat: item.lat, lng: item.lng }
          : r?.lat != null && r?.lng != null ? { lat: r.lat, lng: r.lng } : null;
        const id = categoryId(cat.category);
        return at && { key: `p-${s}-${c}-${k}`, name: item.name, glyph: item.source === 'reservation' ? '✅' : CATEGORIES[id].glyph, at, booked: item.source === 'reservation', stay: id === 'stay' };
      })
      .filter((x): x is RideTarget & { booked: boolean; stay: boolean } => Boolean(x))
      .sort((a, b) => Number(b.booked) - Number(a.booked));
    // The same place can be saved twice (or mapped twice in OpenStreetMap): list it once.
    const seen = new Set<string>();
    for (const x of places) {
      const id = x.name.trim().toLowerCase();
      if (!seen.has(id)) { seen.add(id); items.push(x); }
    }
    return { label: stop.label.split(',')[0], items, stop: s };
  }).filter(g => g.items.length);
}

/** Tonight's place to stay (where day `dayIndex` ends): a booking first, else a saved place to stay. */
export function tonightStay(groups: RideTargetGroup[], dayIndex: number): RideTarget | undefined {
  const tonight = groups.find(g => g.stop === dayIndex + 1);
  return tonight?.items.find(x => x.stay && x.booked) || tonight?.items.find(x => x.stay);
}

/** Places within `maxKm` of where you are, nearest first (each once), with their distance. */
export function nearYou(groups: RideTargetGroup[], position: LatLng, maxKm = 15, limit = 8): (RideTarget & { km: number })[] {
  return groups.flatMap(g => g.items)
    .map(x => ({ ...x, km: haversineKm(position, x.at) }))
    .filter(x => x.km <= maxKm)
    .sort((a, b) => a.km - b.km)
    .slice(0, limit);
}
