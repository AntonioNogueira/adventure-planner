// Turns what the AI understood (start, finish, mode, days or daily distance, places to pass)
// into overnight stops, using the real route instead of AI guesses.
// Days are split by effort: distance plus climbing, so hilly days come out shorter.
import { TripIntent } from '../types';
import { defaultDailyKm } from './pace';
import { stageDone } from './planTimer';
import { t } from './settings';
import { lodgingNear, settlementAt } from './overpass';
import { progressOn } from './ride';
import { geocodeAddress, namesakeNear } from './geocode';
import { computeTrip, RouteOptions, RoutedLeg } from './routing';
import { haversineKm, pathWithDistances, pointAt, LatLng, downsample } from './geo';
import { EFFORT_KM_PER_1000M, effortKm, elevationsAlong, splitByEffort, KmRange } from './elevation';

/** Typical comfortable day, used when the user gives neither days nor a daily distance. */
export { DEFAULT_DAILY_KM, defaultDailyKm } from './pace';
// With a guessed daily distance, a day may run this much over before it's split into two.
// A distance the user chose is treated as a maximum.
const SPLIT_TOLERANCE = 1.15;
// A pass-through place the AI suggests is dropped if it makes that stretch this much longer (straight line).
const MAX_DETOUR = 1.5; // named pass-through places may add up to 50% (e.g. Évora → Monsaraz → Mértola: 36%)
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

export interface NightCandidate { at: LatLng; /** km along the stretch */ along: number; /** km off the route */ off: number }

const SLOW = new Set(['BICYCLING', 'WALKING']);

/**
 * The place to sleep for each planned night of a stretch: near the planned end of the day (±20% of a day for bike
 * and hike, ±35% for moto/car), never less than 60% (50%) of a day after the previous night, and close to the route.
 * Null where nothing fits: the night stays at the planned point.
 */
export function pickNights(splits: number[], stretchKm: number, candidates: NightCandidate[], travelMode: string): (NightCandidate | null)[] {
  const days = splits.length + 1;
  const dayKm = stretchKm / days;
  const slow = SLOW.has(travelMode);
  const tol = (slow ? 0.2 : 0.35) * dayKm;
  const minGap = (slow ? 0.6 : 0.5) * dayKm;
  const maxOff = slow ? Math.min(5, 1 + 0.1 * dayKm) : 10;
  let prev = 0;
  return splits.map(target => {
    const lo = Math.max(prev + minGap, target - tol);
    const hi = Math.min(target + tol, stretchKm - minGap);
    const best = candidates
      .filter(c => c.along >= lo && c.along <= hi && c.off <= maxOff)
      // Distance from the planned end, plus the detour to reach it (there and back).
      .sort((a, b) => (Math.abs(a.along - target) + 2 * a.off) - (Math.abs(b.along - target) + 2 * b.off))[0] || null;
    prev = best ? best.along : target;
    return best;
  });
}

export interface OvernightPlan {
  /** Overnight stops in order (not including start and finish); split stops carry an exact position. */
  waypoints: { name: string; position?: LatLng }[];
  /** The daily (flat-equivalent) distance the split aimed for, in km. */
  targetKm: number | null;
  /** Places to pass through (not sleep at), each before the overnight stop with this index (= waypoints.length: before the finish). */
  passThrough: { name: string; beforeStop: number }[];
}

/**
 * Drop pass-through places that lead away from the destination (the AI sometimes adds them).
 * Overnight places stay: the user asked to sleep there.
 */
async function withoutDetours(intent: TripIntent): Promise<TripIntent['route']> {
  const [start, end] = await Promise.all([geocodeAddress(intent.origin), geocodeAddress(intent.destination)]);
  if (!start || !end) return intent.route;
  const found = await Promise.all(intent.route.map(async r => ({ ...r, at: await geocodeAddress(r.place) })));
  // A name without its country can find a far-off namesake ("Trient" is a Swiss village and Trento's German name):
  // when a place is far from the one before it, prefer a place of the same name close to it.
  for (let i = 0; i < found.length; i++) {
    const r = found[i];
    if (!r.at) continue;
    const prev = found.slice(0, i).reverse().find(x => x.at)?.at || start;
    const gap = haversineKm(prev, r.at);
    const lineRatio = (haversineKm(start, r.at) + haversineKm(r.at, end)) / Math.max(1, haversineKm(start, end));
    const suspect = (!r.place.includes(',') && gap > 60) || (haversineKm(start, end) >= 15 && lineRatio > 2.5);
    if (!suspect) continue;
    const near = await namesakeNear(r.place, prev, Math.min(gap / 2, 150)).catch(() => null);
    if (near) {
      console.info(`"${r.place}": using ${near.name}, near the route, instead of a namesake ${Math.round(gap)} km away`);
      found[i] = { ...r, place: near.name, at: near.at };
    }
  }
  const located = found
    // The origin or destination listed again (within 3 km) would only make an empty day.
    .filter(r => !r.at || (haversineKm(r.at, start) > 3 && haversineKm(r.at, end) > 3));
  const kept: typeof located = [];
  // A loop (back to where it started) has no start-to-finish line to measure detours against: its places are kept
  // unless they are clearly a far-off namesake.
  const loop = haversineKm(start, end) < 15;
  const LOOP_MAX_KM = 1000;
  located.forEach((r, i) => {
    // A night the traveller asked for stays, unless its location is clearly wrong (a far-off namesake).
    const plausible = !r.at || (loop
      ? haversineKm(start, r.at) <= LOOP_MAX_KM
      : (haversineKm(start, r.at) + haversineKm(r.at, end)) / Math.max(1, haversineKm(start, end)) <= 2.5);
    if (r.overnight && plausible) { kept.push(r); return; }
    if (!r.at) return;
    const prev = kept.length ? kept[kept.length - 1].at || start : start;
    const next = located.slice(i + 1).find(n => n.at)?.at || end;
    // Must fit both locally (between its neighbours) and on the whole trip (between start and finish).
    const direct = haversineKm(prev, next);
    const via = haversineKm(prev, r.at) + haversineKm(r.at, next);
    const trip = haversineKm(start, end);
    const tripVia = haversineKm(start, r.at) + haversineKm(r.at, end);
    if (loop ? plausible && (direct === 0 || via / direct <= MAX_DETOUR * 2) : direct > 0 && via / direct <= MAX_DETOUR && tripVia / trip <= MAX_DETOUR) kept.push(r);
    else console.info(`Skipping detour via ${r.place} (${Math.round(via)} km instead of ${Math.round(direct)} km)`);
  });
  return kept.map(({ place, overnight }) => ({ place, overnight }));
}

const SPUR_KM = 1.5;

/** How far a route goes back the way it came after a place: the length of the start of `out` that runs along the
 *  end of `into` (within about 120 m), in km. A place on the way gives ~0; one at the end of a dead end, its length. */
export function spurKm(into: LatLng[], out: LatLng[]): number {
  if (into.length < 2 || out.length < 2) return 0;
  const end = into[into.length - 1];
  // Only the last 40 km of the way in can be retraced.
  const tail: LatLng[] = [];
  for (let i = into.length - 1, km = 0; i >= 0 && km < 40; i--) {
    if (tail.length) km += haversineKm(tail[tail.length - 1], into[i]);
    tail.push(into[i]);
  }
  const kx = Math.cos((end.lat * Math.PI) / 180) * 111.32, ky = 110.57;
  const offKm = (q: LatLng) => {
    let best = Infinity;
    for (let i = 1; i < tail.length; i++) {
      const ax = tail[i - 1].lng * kx, ay = tail[i - 1].lat * ky, bx = tail[i].lng * kx, by = tail[i].lat * ky;
      const px = q.lng * kx, py = q.lat * ky, dx = bx - ax, dy = by - ay;
      const t = dx || dy ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy))) : 0;
      best = Math.min(best, Math.hypot(px - ax - t * dx, py - ay - t * dy));
    }
    return best;
  };
  let km = 0;
  for (let j = 1; j < out.length; j++) {
    if (offKm(out[j]) > 0.12) break;
    km += haversineKm(out[j - 1], out[j]);
    if (km > 40) break;
  }
  return km;
}

export async function planOvernightStops(original: TripIntent, options?: RouteOptions): Promise<OvernightPlan> {
  const intent = { ...original, route: await withoutDetours(original) };
  stageDone('Finding the places named in the request');
  const overnightOnly = intent.route.filter(r => r.overnight).map(r => r.place);
  if (intent.travelMode === 'TRANSIT') return { waypoints: overnightOnly.map(name => ({ name })), targetKm: null, passThrough: [] };

  const request = (travelMode: string) => computeTrip({
    origin: intent.origin,
    destination: intent.destination,
    stops: intent.route.map(r => ({ location: r.place })),
    travelMode,
    options,
  });
  // Cycling/walking routes aren't available everywhere; driving distances are close enough to split days.
  let { legs } = await request(intent.travelMode).catch(() => request('DRIVING'));
  stageDone('First route');
  // A place passed through at the end of a dead end (a mountain hut, a lake up a side valley) would draw a spike
  // there and back: such places are left out and the route is drawn again without them. Nights stay.
  const spurs = new Set(intent.route.map((r, i) => (!r.overnight && legs[i + 1] && spurKm(legs[i].path, legs[i + 1].path) > SPUR_KM ? i : -1)).filter(i => i >= 0));
  if (spurs.size) {
    intent.route.forEach((r, i) => spurs.has(i) && console.info(`Leaving out ${r.place}: a dead end off the route (there and back)`));
    intent.route = intent.route.filter((_, i) => !spurs.has(i));
    legs = (await request(intent.travelMode).catch(() => request('DRIVING')).catch(() => ({ legs }))).legs;
    stageDone('Route without dead ends');
  }

  // Group legs into segments that end at an overnight place (or the finish).
  const segments: { legs: RoutedLeg[]; end: string | null; vias: string[] }[] = [];
  let current: RoutedLeg[] = [];
  let vias: string[] = [];
  legs.forEach((leg, i) => {
    current.push(leg);
    const via = intent.route[i];
    if (!via || via.overnight) {
      segments.push({ legs: current, end: via ? via.place : null, vias });
      current = [];
      vias = [];
    } else vias.push(via.place);
  });

  const kmPer1000m = EFFORT_KM_PER_1000M[intent.travelMode] ?? 0;
  const profiles = await Promise.all(segments.map(segment =>
    kmPer1000m ? elevationsAlong(segment.legs.flatMap(l => l.path), 256) : Promise.resolve(null)));
  stageDone('Elevation');
  const segmentKm = segments.map(s => s.legs.reduce((sum, leg) => sum + leg.distanceMeters, 0) / 1000);
  const ferries = segments.map(s => ferryRanges(s.legs));
  const segmentEffort = segments.map((_, i) => effortKm(
    segmentKm[i], profiles[i], kmPer1000m, ferries[i].reduce((sum, [a, b]) => sum + b - a, 0)));
  const totalEffort = segmentEffort.reduce((a, b) => a + b, 0);

  const target = intent.days > 0
    ? totalEffort / intent.days
    : intent.dailyKm || defaultDailyKm(intent);

  // With a day count, share the days between the parts so they add up to exactly that many.
  // A daily distance is a maximum, so each part (between nights the traveller chose) is rounded up.
  const daysPerSegment = intent.days > 0
    ? shareDays(segmentEffort, intent.days)
    : segmentEffort.map(e => Math.max(1, Math.ceil(e / (target * (intent.dailyKm ? 1 : SPLIT_TOLERANCE)))));

  const waypoints: OvernightPlan['waypoints'] = [];
  const passThrough: OvernightPlan['passThrough'] = [];
  for (let s = 0; s < segments.length; s++) {
    const days = daysPerSegment[s];
    // Pass-through places sit at the end of each leg of the segment but the last.
    const viaKm = segments[s].legs.slice(0, -1).map((_, k) => segments[s].legs.slice(0, k + 1).reduce((sum, l) => sum + l.distanceMeters, 0) / 1000);
    let nextVia = 0;
    const addViasBefore = (km: number) => {
      while (nextVia < segments[s].vias.length && viaKm[nextVia] < km) {
        passThrough.push({ name: segments[s].vias[nextVia], beforeStop: waypoints.length });
        nextVia++;
      }
    };
    // A part with no drawn path (a routing service returned only a distance) can't be split into days.
    const points = days > 1 ? pathWithDistances(segments[s].legs) : [];
    if (days > 1 && points.length >= 2) {
      const splits = splitByEffort(segmentKm[s], profiles[s], kmPer1000m, days, ferries[s]);
      const spots = splits.map(km => pointAt(points, km));
      // Places to stay around each planned day end, measured along the route; then the best one per night.
      const dayKm = segmentKm[s] / days;
      const radius = SLOW.has(intent.travelMode) ? Math.min(12, Math.max(3, dayKm * 0.3)) : 15;
      const short = downsample(points, 1500);
      const path = short.map(p => p.at), cum = short.map(p => p.km);
      const candidates = (await lodgingNear(spots, intent.lodging, radius)).map(sp => {
        const pr = progressOn(path, sp.at, cum);
        return { at: sp.at, along: pr.alongKm, off: pr.offRouteKm };
      });
      stageDone('Places to stay along the route');
      const nights = pickNights(splits, segmentKm[s], candidates, intent.travelMode);
      // Each night is in a village or town (not the whole municipality), and its pin is on the village itself:
      // the places to stay around it are shown as suggestions.
      // A village off the route would add a detour there and back every night: it's used only when close (3 km on a
      // bike or on foot, 8 km with a motor); otherwise the night stays on the route, "near" the village.
      const maxOff = SLOW.has(intent.travelMode) ? 3 : 8;
      const towns = await Promise.all(nights.map(async (night, i) => {
        const spot = night?.at || spots[i];
        const place = await settlementAt(spot);
        if (!place) return null;
        const off = progressOn(path, place.at, cum).offRouteKm;
        return off <= maxOff ? { name: place.name, position: place.at } : { name: t('Near {place}', { place: place.name }), position: spot };
      }));
      stageDone('Villages for the nights');
      towns.forEach((found, i) => {
        addViasBefore(splits[i]);
        // No named place nearby (empty country): keep the night at the split point anyway.
        const town = found || { name: t('Night stop at km {km}', { km: Math.round(segmentKm.slice(0, s).reduce((a, b) => a + b, 0) + splits[i]) }), position: spots[i] };
        const prev = waypoints[waypoints.length - 1];
        // Only the same spot is a duplicate; in sparse areas two nights can share a region's name.
        const sameSpot = prev?.position && town.position ? haversineKm(prev.position, town.position) < 5 : prev?.name === town.name && !town.position;
        if (!sameSpot && town.name !== intent.origin && town.name !== intent.destination) waypoints.push(town);
      });
    }
    addViasBefore(Infinity);
    if (segments[s].end) waypoints.push({ name: segments[s].end! });
  }
  const kept = waypoints.slice(0, MAX_WAYPOINTS);
  return { waypoints: kept, targetKm: Math.round(target), passThrough: passThrough.filter(p => p.beforeStop <= kept.length) };
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
