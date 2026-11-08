import { isOsm } from './provider';
import { offroadTrip, OFFROAD_MODES } from './offroad';
import { osmTrip } from './osrm';

// One routing entry point for the app. It tries Google's Routes API (the successor of the
// Directions service) and falls back to the Directions service when the Routes API isn't
// enabled for the key, so the app keeps working either way.

export interface RouteOptions {
  avoidHighways: boolean;
  avoidFerries: boolean;
  avoidTolls: boolean;
  /** Prefer unpaved tracks and trails, kept easy (bike, hike, moto): see offroad.ts. */
  offroad?: boolean;
}

export const NO_AVOIDANCES: RouteOptions = { avoidHighways: false, avoidFerries: false, avoidTolls: false, offroad: false };

/** Only the avoid options, as Google's services expect them. */
const avoidOnly = (o?: RouteOptions) => o && { avoidHighways: o.avoidHighways, avoidFerries: o.avoidFerries, avoidTolls: o.avoidTolls };

export type RoutePlace = string | google.maps.LatLngLiteral;

export interface RoutedStep {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
  /** A ferry crossing (no riding, and no place to stop for the night). */
  ferry?: boolean;
}

export interface RoutedLeg {
  distanceMeters: number;
  durationSeconds: number;
  startAddress?: string;
  endAddress?: string;
  path: google.maps.LatLngLiteral[];
  steps: RoutedStep[];
}

export interface RoutedTrip {
  legs: RoutedLeg[];
  engine: 'routes' | 'directions' | 'osm';
  /** Off-road was asked for but this route is the normal one. */
  offroadUnavailable?: boolean;
}

export interface TripRequest {
  origin: RoutePlace;
  destination: RoutePlace;
  /** In order; `via` points shape the route without starting a new leg. */
  stops: { location: RoutePlace; via?: boolean }[];
  travelMode: string;
  options?: RouteOptions;
}

// Once the Routes API answers "not enabled", stop trying it for this page load.
let routesApiUsable = true;

// Both services accept at most 25 intermediate points per request; longer trips are routed in chunks.
const MAX_INTERMEDIATES = 23;

const isFerry = (maneuver?: string | null, instruction?: string | null) =>
  /ferry/i.test(maneuver || '') || /\bferr(y|i|ies)\b|\bbalsa\b/i.test(instruction || '');

const toLiteral = (p: { lat: number | (() => number); lng: number | (() => number) }): google.maps.LatLngLiteral => ({
  lat: typeof p.lat === 'function' ? p.lat() : p.lat,
  lng: typeof p.lng === 'function' ? p.lng() : p.lng,
});

async function viaRoutesApi(req: TripRequest): Promise<RoutedTrip> {
  const { Route } = await google.maps.importLibrary('routes') as google.maps.RoutesLibrary;
  const { routes } = await Route.computeRoutes({
    origin: req.origin,
    destination: req.destination,
    intermediates: req.stops.map(s => ({ location: s.location, via: Boolean(s.via) })),
    travelMode: req.travelMode as google.maps.TravelModeString,
    routeModifiers: avoidOnly(req.options),
    fields: ['legs'],
  });
  const legs = routes?.[0]?.legs;
  if (!legs?.length || legs.some(leg => !leg.path?.length)) throw new Error('Routes API returned no usable route');
  return {
    engine: 'routes',
    legs: legs.map(leg => ({
      distanceMeters: leg.distanceMeters,
      durationSeconds: Math.round((leg.durationMillis || 0) / 1000),
      path: leg.path.map(toLiteral),
      steps: (leg.steps || []).map(step => ({
        instruction: step.instructions || '',
        distanceMeters: step.distanceMeters,
        durationSeconds: Math.round((step.staticDurationMillis || 0) / 1000),
        ferry: isFerry(step.maneuver, step.instructions),
      })),
    })),
  };
}

async function viaDirections(req: TripRequest): Promise<RoutedTrip> {
  const { DirectionsService } = await google.maps.importLibrary('routes') as google.maps.RoutesLibrary;
  const result = await new DirectionsService().route({
    origin: req.origin,
    destination: req.destination,
    waypoints: req.stops.map(s => ({ location: s.location, stopover: !s.via })),
    travelMode: req.travelMode as google.maps.TravelMode,
    avoidHighways: req.options?.avoidHighways,
    avoidFerries: req.options?.avoidFerries,
    avoidTolls: req.options?.avoidTolls,
  });
  return {
    engine: 'directions',
    legs: result.routes[0].legs.map(leg => ({
      distanceMeters: leg.distance?.value || 0,
      durationSeconds: leg.duration?.value || 0,
      startAddress: leg.start_address,
      endAddress: leg.end_address,
      path: leg.steps.flatMap(step => (step.path || []).map(toLiteral)),
      steps: leg.steps.map(step => ({
        instruction: step.instructions,
        distanceMeters: step.distance?.value || 0,
        durationSeconds: step.duration?.value || 0,
        ferry: isFerry(step.maneuver, step.instructions),
      })),
    })),
  };
}

async function computeOnce(req: TripRequest): Promise<RoutedTrip> {
  if (isOsm) return osmTrip(req);
  // The Routes API only avoids highways/ferries/tolls for driving; the Directions service does it for every mode.
  const needsDirections = req.travelMode !== 'DRIVING' && req.options && Object.values(avoidOnly(req.options)!).some(Boolean);
  if (routesApiUsable && !needsDirections) {
    try {
      return await viaRoutesApi(req);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (/not been used|disabled|PERMISSION_DENIED|not authorized|is not enabled/i.test(message)) {
        routesApiUsable = false;
        console.info('Routes API is not enabled for this key; using the Directions service.');
      }
      // Other failures (no route found, unsupported mode) are retried with the Directions service.
    }
  }
  return viaDirections(req);
}

/** Route a trip of any length: more than 23 stops are routed in consecutive chunks (Google only). */
export async function computeTrip(req: TripRequest): Promise<RoutedTrip> {
  if (req.options?.offroad && OFFROAD_MODES.has(req.travelMode)) {
    try {
      return await offroadTrip(req);
    } catch (err) {
      // Very long days (before the trip is split into days) or a busy engine: the normal route.
      console.warn('Off-road route unavailable; using the normal route.', err);
      const trip = await computeTrip({ ...req, options: { ...req.options, offroad: false } });
      return { ...trip, offroadUnavailable: true };
    }
  }
  if (isOsm || req.stops.length <= MAX_INTERMEDIATES) return computeOnce(req);
  const points = [req.origin, ...req.stops.map(s => s.location), req.destination];
  const legs: RoutedLeg[] = [];
  let engine: RoutedTrip['engine'] = 'routes';
  let a = 0;
  while (a < points.length - 1) {
    let b = Math.min(a + MAX_INTERMEDIATES + 1, points.length - 1);
    // A chunk must end at a real stop (not a pass-through point), so legs line up with stops.
    while (b > a + 1 && b < points.length - 1 && req.stops[b - 1].via) b--;
    const part = await computeOnce({ ...req, origin: points[a], destination: points[b], stops: req.stops.slice(a, b - 1) });
    legs.push(...part.legs);
    if (part.engine === 'directions') engine = 'directions';
    a = b;
  }
  return { legs, engine };
}

/** Total ferry distance in a trip, in km. */
export function ferryKm(trip: RoutedTrip): number {
  return Math.round(trip.legs.flatMap(l => l.steps).filter(s => s.ferry).reduce((sum, s) => sum + s.distanceMeters, 0) / 1000);
}

/** Every point of the trip in order, for drawing and export. */
export function tripPath(trip: RoutedTrip): google.maps.LatLngLiteral[] {
  return trip.legs.flatMap(leg => leg.path);
}
