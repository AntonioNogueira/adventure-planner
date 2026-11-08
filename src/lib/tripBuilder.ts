// Turns what the AI understood (start, finish, mode, days or daily distance, places to pass)
// into overnight stops, using the real route from Google Maps instead of AI guesses.
// Days are split by effort: distance plus climbing, so hilly days come out shorter.
import { TripIntent } from '../types';
import { t } from './settings';
import { overnightTownsNear } from './places';
import { geocodeAddress } from './geocode';
import { computeTrip, RouteOptions, RoutedLeg } from './routing';
import { haversineKm, pathWithDistances, pointAt } from './geo';
import { EFFORT_KM_PER_1000M, effortKm, elevationsAlong, splitByEffort, KmRange } from './elevation';

/** Typical comfortable day, used when the user gives neither days nor a daily distance. */
export const DEFAULT_DAILY_KM: Record<string, number> = { BICYCLING: 70, WALKING: 22, DRIVING: 300 };
// With a guessed daily distance, a day may run this much over before it's split into two.
// A distance the user chose is treated as a maximum.
const SPLIT_TOLERANCE = 1.15;
// A pass-through place the AI suggests is dropped if it makes that stretch this much longer (straight line).
const MAX_DETOUR = 1.3;
// Long trips are routed in chunks; this caps a runaway plan (e.g. a tiny daily distance).
const MAX_WAYPOINTS = 90;

/** Ferry crossings in a stretch, as km ranges from its start. */
function ferryRanges(legs: RoutedLeg[]): KmRange[] {
  const ranges: KmRange[] = [];
  let km = 0;
  for (const leg of legs) {
    const stepsKm = leg.steps.reduce((sum, st) => sum + st.distanceMeters, 0) / 1000;
    // Steps may not add up exactly to the leg; scale them to the leg's distance.
    const scale = stepsKm > 0 ? leg.distanceMeters / 1000 / stepsKm : 1;
    for (const st of leg.steps) {
      const length = (st.distanceMeters / 1000) * scale;
      if (st.ferry) ranges.push([km, km + length]);
      km += length;
    }
  }
  return ranges;
}

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
  const ferries = segments.map(s => ferryRanges(s.legs));
  const segmentEffort = segments.map((_, i) => effortKm(
    segmentKm[i], profiles[i], kmPer1000m, ferries[i].reduce((sum, [a, b]) => sum + b - a, 0)));
  const totalEffort = segmentEffort.reduce((a, b) => a + b, 0);

  // Days are split on the normal route; off-road routes run ~15% longer and slower, so aim a little shorter.
  const offroadFactor = options?.offroad ? 0.85 : 1;
  const target = intent.days > 0
    ? totalEffort / intent.days
    : (intent.dailyKm || DEFAULT_DAILY_KM[intent.travelMode] || 300) * offroadFactor;

  // With a day count, share the days between the parts so they add up to exactly that many.
  // A daily distance is a maximum, so each part (between nights the traveller chose) is rounded up.
  const daysPerSegment = intent.days > 0
    ? shareDays(segmentEffort, intent.days)
    : segmentEffort.map(e => Math.max(1, Math.ceil(e / (target * (intent.dailyKm ? 1 : SPLIT_TOLERANCE)))));

  const waypoints: OvernightPlan['waypoints'] = [];
  for (let s = 0; s < segments.length; s++) {
    const days = daysPerSegment[s];
    if (days > 1) {
      const points = pathWithDistances(segments[s].legs);
      const splits = splitByEffort(segmentKm[s], profiles[s], kmPer1000m, days, ferries[s]);
      const spots = splits.map(km => pointAt(points, km));
      const towns = await overnightTownsNear(spots, intent.lodging);
      towns.forEach((found, i) => {
        // No named place nearby (empty country): keep the night at the split point anyway.
        const town = found || { name: t('Night stop at km {km}', { km: Math.round(segmentKm.slice(0, s).reduce((a, b) => a + b, 0) + splits[i]) }), position: spots[i] };
        const prev = waypoints[waypoints.length - 1];
        // Only the same spot is a duplicate; in sparse areas two nights can share a region's name.
        const sameSpot = prev?.position && town.position ? haversineKm(prev.position, town.position) < 5 : prev?.name === town.name && !town.position;
        if (!sameSpot && town.name !== intent.origin && town.name !== intent.destination) waypoints.push(town);
      });
    }
    if (segments[s].end) waypoints.push({ name: segments[s].end! });
  }
  return { waypoints: waypoints.slice(0, MAX_WAYPOINTS), targetKm: Math.round(target) };
}

/** Split a whole number of days between parts by their effort (at least one each), largest remainders first. */
export function shareDays(efforts: number[], days: number): number[] {
  const total = efforts.reduce((a, b) => a + b, 0) || 1;
  const want = Math.max(days, efforts.length);
  const exact = efforts.map(e => (e / total) * want);
  const out = exact.map(x => Math.max(1, Math.floor(x)));
  let left = want - out.reduce((a, b) => a + b, 0);
  const order = exact.map((x, i) => ({ i, frac: x - Math.floor(x) })).sort((a, b) => b.frac - a.frac);
  for (let k = 0; left > 0; k++, left--) out[order[k % order.length].i]++;
  for (let k = order.length - 1; left < 0 && k >= 0; k--) {
    const i = order[k].i;
    if (out[i] > 1) { out[i]--; left++; }
  }
  return out;
}
