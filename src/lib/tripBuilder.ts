// Turns what the AI understood (start, finish, mode, days or daily distance, places to pass)
// into overnight stops, using the real route from Google Maps instead of AI guesses.
import { TripIntent } from '../types';
import { overnightTownNear } from './places';
import { geocodeAddress } from './geocode';

/** Typical comfortable day, used when the user gives neither days nor a daily distance. */
export const DEFAULT_DAILY_KM: Record<string, number> = { BICYCLING: 70, WALKING: 22, DRIVING: 300 };
// A day may run this much over the target before it's split into two.
const SPLIT_TOLERANCE = 1.15;
// A pass-through place the AI suggests is dropped if it makes that stretch this much longer (straight line).
const MAX_DETOUR = 1.3;
// Directions allows 25 waypoints per request.
const MAX_WAYPOINTS = 23;

interface PathPoint { at: google.maps.LatLng; km: number }

function haversineKm(a: google.maps.LatLng, b: google.maps.LatLng) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const h = Math.sin(rad(b.lat() - a.lat()) / 2) ** 2
    + Math.cos(rad(a.lat())) * Math.cos(rad(b.lat())) * Math.sin(rad(b.lng() - a.lng()) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

/** Points along some route legs, each with its distance (km) from the start of the first leg. */
function pathWithDistances(legs: google.maps.DirectionsLeg[]): PathPoint[] {
  const points: PathPoint[] = [];
  let km = 0;
  for (const leg of legs) {
    for (const step of leg.steps) {
      const path = step.path || [];
      if (path.length < 2) { km += (step.distance?.value || 0) / 1000; continue; }
      // Scale the straight-line pieces so the step adds up to its real road distance.
      const pieces = path.slice(1).map((p, i) => haversineKm(path[i], p));
      const raw = pieces.reduce((a, b) => a + b, 0) || 1;
      const scale = ((step.distance?.value || 0) / 1000) / raw;
      if (points.length === 0) points.push({ at: path[0], km });
      pieces.forEach((piece, i) => { km += piece * scale; points.push({ at: path[i + 1], km }); });
    }
  }
  return points;
}

function pointAt(points: PathPoint[], km: number) {
  return (points.find(p => p.km >= km) || points[points.length - 1]).at;
}

export interface OvernightPlan {
  /** Overnight stops in order (not including start and finish); split stops carry an exact position. */
  waypoints: { name: string; position?: google.maps.LatLngLiteral }[];
  /** The daily distance the split aimed for, in km. */
  targetKm: number | null;
}

/**
 * Drop pass-through places that lead away from the destination (the AI sometimes adds them).
 * Overnight places stay: the user asked to sleep there.
 */
async function withoutDetours(intent: TripIntent): Promise<TripIntent['route']> {
  const [start, end] = await Promise.all([geocodeAddress(intent.origin), geocodeAddress(intent.destination)]);
  if (!start || !end) return intent.route;
  const located = await Promise.all(intent.route.map(async r => ({ ...r, at: await geocodeAddress(r.place) })));
  const kept: typeof located = [];
  located.forEach((r, i) => {
    if (r.overnight) { kept.push(r); return; }
    if (!r.at) return;
    const prev = kept.length ? kept[kept.length - 1].at || start : start;
    const next = located.slice(i + 1).find(n => n.at)?.at || end;
    // Must fit both locally (between its neighbours) and on the whole trip (between start and finish).
    const direct = haversineKm(prev, next);
    const via = haversineKm(prev, r.at) + haversineKm(r.at, next);
    const trip = haversineKm(start, end);
    const tripVia = haversineKm(start, r.at) + haversineKm(r.at, end);
    if (direct > 0 && via / direct <= MAX_DETOUR && tripVia / trip <= MAX_DETOUR) kept.push(r);
    else console.info(`Skipping detour via ${r.place} (${Math.round(via)} km instead of ${Math.round(direct)} km)`);
  });
  return kept.map(({ place, overnight }) => ({ place, overnight }));
}

export async function planOvernightStops(service: google.maps.DirectionsService, original: TripIntent): Promise<OvernightPlan> {
  const intent = { ...original, route: await withoutDetours(original) };
  const overnightOnly = intent.route.filter(r => r.overnight).map(r => r.place);
  if (intent.travelMode === 'TRANSIT') return { waypoints: overnightOnly.map(name => ({ name })), targetKm: null };

  const request = (mode: string) => service.route({
    origin: intent.origin,
    destination: intent.destination,
    waypoints: intent.route.map(r => ({ location: r.place, stopover: true })),
    travelMode: mode as google.maps.TravelMode,
  });
  let result: google.maps.DirectionsResult;
  try {
    result = await request(intent.travelMode);
  } catch {
    // Cycling/walking routes aren't available everywhere; driving distances are close enough to split days.
    result = await request('DRIVING');
  }
  const legs = result.routes[0].legs;
  const totalKm = legs.reduce((sum, leg) => sum + (leg.distance?.value || 0), 0) / 1000;

  // Group legs into segments that end at an overnight place (or the finish).
  const segments: { legs: google.maps.DirectionsLeg[]; end: string | null }[] = [];
  let current: google.maps.DirectionsLeg[] = [];
  legs.forEach((leg, i) => {
    current.push(leg);
    const via = intent.route[i];
    if (!via || via.overnight) {
      segments.push({ legs: current, end: via ? via.place : null });
      current = [];
    }
  });

  const target = intent.days > 0
    ? totalKm / intent.days
    : intent.dailyKm || DEFAULT_DAILY_KM[intent.travelMode] || 300;

  const waypoints: OvernightPlan['waypoints'] = [];
  for (const segment of segments) {
    const segmentKm = segment.legs.reduce((sum, leg) => sum + (leg.distance?.value || 0), 0) / 1000;
    const days = intent.days > 0
      ? Math.max(1, Math.round(segmentKm / target))
      : Math.max(1, Math.ceil(segmentKm / (target * SPLIT_TOLERANCE)));
    if (days > 1) {
      const points = pathWithDistances(segment.legs);
      const towns = await Promise.all(
        Array.from({ length: days - 1 }, (_, k) => overnightTownNear(pointAt(points, (segmentKm * (k + 1)) / days), intent.lodging)),
      );
      towns.forEach(town => {
        if (town && town.name !== waypoints[waypoints.length - 1]?.name && town.name !== intent.origin && town.name !== intent.destination) {
          waypoints.push(town);
        }
      });
    }
    if (segment.end) waypoints.push({ name: segment.end });
  }
  return { waypoints: waypoints.slice(0, MAX_WAYPOINTS), targetKm: Math.round(target) };
}
