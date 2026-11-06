// Turns what the AI understood (start, finish, mode, days or daily distance, places to pass)
// into overnight stops, using the real route from Google Maps instead of AI guesses.
// Days are split by effort: distance plus climbing, so hilly days come out shorter.
import { TripIntent } from '../types';
import { overnightTownNear } from './places';
import { geocodeAddress } from './geocode';
import { computeTrip, RouteOptions, RoutedLeg } from './routing';
import { haversineKm, pathWithDistances, pointAt } from './geo';
import { EFFORT_KM_PER_1000M, effortKm, elevationsAlong, splitByEffort } from './elevation';

/** Typical comfortable day, used when the user gives neither days nor a daily distance. */
export const DEFAULT_DAILY_KM: Record<string, number> = { BICYCLING: 70, WALKING: 22, DRIVING: 300 };
// A day may run this much over the target before it's split into two.
const SPLIT_TOLERANCE = 1.15;
// A pass-through place the AI suggests is dropped if it makes that stretch this much longer (straight line).
const MAX_DETOUR = 1.3;
// Routing allows 25 waypoints per request.
const MAX_WAYPOINTS = 23;

export interface OvernightPlan {
  /** Overnight stops in order (not including start and finish); split stops carry an exact position. */
  waypoints: { name: string; position?: google.maps.LatLngLiteral }[];
  /** The daily (flat-equivalent) distance the split aimed for, in km. */
  targetKm: number | null;
}

/**
 * Drop pass-through places that lead away from the destination (the AI sometimes adds them).
 * Overnight places stay: the user asked to sleep there.
 */
async function withoutDetours(intent: TripIntent): Promise<TripIntent['route']> {
  const [startAt, endAt] = await Promise.all([geocodeAddress(intent.origin), geocodeAddress(intent.destination)]);
  if (!startAt || !endAt) return intent.route;
  const start = startAt.toJSON();
  const end = endAt.toJSON();
  const located = await Promise.all(intent.route.map(async r => ({ ...r, at: (await geocodeAddress(r.place))?.toJSON() })));
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

export async function planOvernightStops(original: TripIntent, options?: RouteOptions): Promise<OvernightPlan> {
  const intent = { ...original, route: await withoutDetours(original) };
  const overnightOnly = intent.route.filter(r => r.overnight).map(r => r.place);
  if (intent.travelMode === 'TRANSIT') return { waypoints: overnightOnly.map(name => ({ name })), targetKm: null };

  const request = (travelMode: string) => computeTrip({
    origin: intent.origin,
    destination: intent.destination,
    stops: intent.route.map(r => ({ location: r.place })),
    travelMode,
    options,
  });
  // Cycling/walking routes aren't available everywhere; driving distances are close enough to split days.
  const { legs } = await request(intent.travelMode).catch(() => request('DRIVING'));

  // Group legs into segments that end at an overnight place (or the finish).
  const segments: { legs: RoutedLeg[]; end: string | null }[] = [];
  let current: RoutedLeg[] = [];
  legs.forEach((leg, i) => {
    current.push(leg);
    const via = intent.route[i];
    if (!via || via.overnight) {
      segments.push({ legs: current, end: via ? via.place : null });
      current = [];
    }
  });

  const kmPer1000m = EFFORT_KM_PER_1000M[intent.travelMode] ?? 0;
  const profiles = await Promise.all(segments.map(segment =>
    kmPer1000m ? elevationsAlong(segment.legs.flatMap(l => l.path), 256) : Promise.resolve(null)));
  const segmentKm = segments.map(s => s.legs.reduce((sum, leg) => sum + leg.distanceMeters, 0) / 1000);
  const segmentEffort = segments.map((_, i) => effortKm(segmentKm[i], profiles[i], kmPer1000m));
  const totalEffort = segmentEffort.reduce((a, b) => a + b, 0);

  const target = intent.days > 0
    ? totalEffort / intent.days
    : intent.dailyKm || DEFAULT_DAILY_KM[intent.travelMode] || 300;

  const waypoints: OvernightPlan['waypoints'] = [];
  for (let s = 0; s < segments.length; s++) {
    const days = intent.days > 0
      ? Math.max(1, Math.round(segmentEffort[s] / target))
      : Math.max(1, Math.ceil(segmentEffort[s] / (target * SPLIT_TOLERANCE)));
    if (days > 1) {
      const points = pathWithDistances(segments[s].legs);
      const splits = splitByEffort(segmentKm[s], profiles[s], kmPer1000m, days);
      const towns = await Promise.all(splits.map(km =>
        overnightTownNear(new google.maps.LatLng(pointAt(points, km)), intent.lodging)));
      towns.forEach(town => {
        if (town && town.name !== waypoints[waypoints.length - 1]?.name && town.name !== intent.origin && town.name !== intent.destination) {
          waypoints.push(town);
        }
      });
    }
    if (segments[s].end) waypoints.push({ name: segments[s].end! });
  }
  return { waypoints: waypoints.slice(0, MAX_WAYPOINTS), targetKm: Math.round(target) };
}
