// Routing for the open version: OSRM on routing.openstreetmap.de (car, bike, foot; long trips in one
// request) and Valhalla on valhalla1.openstreetmap.de for car routes that avoid highways, tolls or ferries.
// Both are free public services run by FOSSGIS (fair use).
import { LatLng, haversineKm } from './geo';
import { geocodeAddress } from './geocode';
import type { RoutedLeg, RoutedStep, RoutedTrip, TripRequest } from './routing';

const OSRM = 'https://routing.openstreetmap.de';
const VALHALLA = 'https://valhalla1.openstreetmap.de/route';
const PROFILE: Record<string, string> = { DRIVING: 'routed-car', BICYCLING: 'routed-bike', WALKING: 'routed-foot' };
// Long bike/foot routes are guided through points this far apart on the car route.
const GUIDE_SPACING_KM = 80;
// Above this straight-line distance, bike/foot trips follow the car route's corridor: OSRM's bike and
// foot profiles otherwise happily chain long ferries (e.g. Tanger-Med → Genoa) as the "fastest" way.
const GUIDED_ABOVE_KM = 150;

/**
 * OSRM marks some ferries as "pushing bike". A ferry is also recognisable by its shape: a long step drawn
 * with very few points (a straight line over water), which no road has.
 */
export function isFerryStep(step: { mode?: string; name?: string; distance: number; geometry?: { coordinates: unknown[] } }): boolean {
  if (step.mode === 'ferry' || step.mode === 'train') return true;
  const points = step.geometry?.coordinates.length || 0;
  if (step.distance > 20_000 && points > 0 && step.distance / points > 3_000) return true;
  return /ferry|ferri|traghetto|\(GNV\)|grimaldi|tirrenia|moby|bal[eé]aria|trasmed|naviera/i.test(step.name || '');
}

interface Loc { at: LatLng; via: boolean }

async function resolve(req: TripRequest): Promise<Loc[]> {
  const all = [{ location: req.origin, via: false }, ...req.stops.map(s => ({ location: s.location, via: Boolean(s.via) })), { location: req.destination, via: false }];
  return Promise.all(all.map(async ({ location, via }) => {
    const at = typeof location === 'string' ? await geocodeAddress(location) : location;
    if (!at) throw new Error(`NOT_FOUND: ${String(location)}`);
    return { at, via };
  }));
}

const describe = (step: any) => {
  const m = step.maneuver || {};
  const road = [step.name, step.ref].filter(Boolean).join(' ');
  if (isFerryStep(step)) return `Take the ferry${road ? ` ${road}` : ''}`;
  const verb = m.type === 'depart' ? 'Head' : m.type === 'arrive' ? 'Arrive' : m.modifier ? `Turn ${m.modifier}` : 'Continue';
  return road ? `${verb} onto ${road}` : verb;
};

async function osrm(profile: string, locs: Loc[]): Promise<RoutedTrip> {
  const coords = locs.map(l => `${l.at.lng.toFixed(6)},${l.at.lat.toFixed(6)}`).join(';');
  const breaks = locs.map((l, i) => (l.via ? -1 : i)).filter(i => i >= 0).join(';');
  const url = `${OSRM}/${profile}/route/v1/driving/${coords}?overview=false&steps=true&geometries=geojson&waypoints=${breaks}`;
  // The public server is busy at times: one retry before giving up on the whole plan.
  let res: Response | null = null;
  let data: any = {};
  for (const delay of [0, 1500]) {
    if (delay) await new Promise(r => setTimeout(r, delay));
    res = await fetch(url).catch(() => null);
    data = res ? await res.json().catch(() => ({})) : {};
    if (data.code === 'Ok' && data.routes?.length) break;
  }
  if (data.code !== 'Ok' || !data.routes?.length) throw new Error(data.code === 'NoRoute' ? 'ZERO_RESULTS' : `OSRM ${data.code || res?.status || 'unreachable'}`);
  return {
    engine: 'osm',
    legs: data.routes[0].legs.map((leg: any): RoutedLeg => ({
      distanceMeters: leg.distance,
      durationSeconds: leg.duration,
      path: leg.steps.flatMap((st: any) => st.geometry.coordinates.map(([lng, lat]: [number, number]) => ({ lat, lng }))),
      steps: leg.steps.map((st: any): RoutedStep => ({
        instruction: describe(st),
        distanceMeters: st.distance,
        durationSeconds: st.duration,
        ferry: isFerryStep(st),
      })),
    })),
  };
}

/** Valhalla's encoded polyline (precision 6) → points. */
export function decodePolyline6(encoded: string): LatLng[] {
  const points: LatLng[] = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    for (const axis of [0, 1]) {
      let result = 0, shift = 0, b: number;
      do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
      const delta = result & 1 ? ~(result >> 1) : result >> 1;
      if (axis === 0) lat += delta; else lng += delta;
    }
    points.push({ lat: lat / 1e6, lng: lng / 1e6 });
  }
  return points;
}

async function valhallaCar(locs: Loc[], req: TripRequest): Promise<RoutedTrip> {
  const res = await fetch(VALHALLA, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      locations: locs.map(l => ({ lat: l.at.lat, lon: l.at.lng, type: l.via ? 'through' : 'break' })),
      costing: 'auto',
      costing_options: { auto: {
        use_highways: req.options?.avoidHighways ? 0 : 0.5,
        use_tolls: req.options?.avoidTolls ? 0 : 0.5,
        use_ferry: req.options?.avoidFerries ? 0 : 0.5,
      } },
      units: 'kilometers',
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!data.trip) throw new Error(`Valhalla: ${data.error || res.status}`);
  return {
    engine: 'osm',
    legs: data.trip.legs.map((leg: any): RoutedLeg => ({
      distanceMeters: leg.summary.length * 1000,
      durationSeconds: leg.summary.time,
      path: decodePolyline6(leg.shape),
      steps: leg.maneuvers.map((m: any): RoutedStep => ({
        instruction: [m.instruction, ...(m.street_names || [])].join(' '),
        distanceMeters: m.length * 1000,
        durationSeconds: m.time,
        ferry: m.type === 28,
      })),
    })),
  };
}

/** Points every `spacingKm` along a path (not including its ends). */
function guidePoints(path: LatLng[], spacingKm: number): LatLng[] {
  const out: LatLng[] = [];
  let km = 0;
  for (let i = 1; i < path.length; i++) {
    km += haversineKm(path[i - 1], path[i]);
    if (km >= spacingKm && i < path.length - 1) { out.push(path[i]); km = 0; }
  }
  return out;
}

export async function osmTrip(req: TripRequest): Promise<RoutedTrip> {
  const profile = PROFILE[req.travelMode];
  if (!profile) throw new Error(`Unsupported travel mode ${req.travelMode}`);
  const locs = await resolve(req);
  const avoid = req.options || { avoidHighways: false, avoidTolls: false, avoidFerries: false };

  if (req.travelMode === 'DRIVING' && (avoid.avoidHighways || avoid.avoidTolls || avoid.avoidFerries)) {
    try {
      return await valhallaCar(locs, req);
    } catch (err) {
      // Valhalla's public service limits car routes to ~1500 km; fall back to the normal route.
      console.warn('Avoid options unavailable for this route; using the normal route.', err);
    }
  }

  const breaks0 = locs.filter(l => !l.via);
  const longestHop = Math.max(...breaks0.slice(1).map((l, i) => haversineKm(breaks0[i].at, l.at)));
  if (req.travelMode !== 'DRIVING' && (avoid.avoidFerries || longestHop > GUIDED_ABOVE_KM)) {
    // Follow the car route (which keeps to land unless a ferry is unavoidable) by adding guide points
    // along it between each pair of stops; OSRM still picks bike/foot-friendly roads between them.
    const car = await osrm(PROFILE.DRIVING, locs);
    // When the user asked to avoid ferries but even the car needs one (islands), route directly.
    if (!avoid.avoidFerries || !car.legs.some(l => l.steps.some(s => s.ferry))) {
      const breaks = locs.filter(l => !l.via);
      const guided: Loc[] = [];
      car.legs.forEach((leg, i) => {
        guided.push(breaks[i]);
        guidePoints(leg.path, GUIDE_SPACING_KM).forEach(at => guided.push({ at, via: true }));
      });
      guided.push(breaks[breaks.length - 1]);
      return osrm(profile, guided);
    }
  }
  return osrm(profile, locs);
}
