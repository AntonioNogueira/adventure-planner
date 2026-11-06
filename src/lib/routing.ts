// One routing entry point for the app. It tries Google's Routes API (the successor of the
// Directions service) and falls back to the Directions service when the Routes API isn't
// enabled for the key, so the app keeps working either way.

export interface RouteOptions {
  avoidHighways: boolean;
  avoidFerries: boolean;
  avoidTolls: boolean;
}

export const NO_AVOIDANCES: RouteOptions = { avoidHighways: false, avoidFerries: false, avoidTolls: false };

export type RoutePlace = string | google.maps.LatLngLiteral;

export interface RoutedStep {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
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
  engine: 'routes' | 'directions';
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
    routeModifiers: req.options,
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
      })),
    })),
  };
}

export async function computeTrip(req: TripRequest): Promise<RoutedTrip> {
  if (routesApiUsable) {
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

/** Every point of the trip in order, for drawing and export. */
export function tripPath(trip: RoutedTrip): google.maps.LatLngLiteral[] {
  return trip.legs.flatMap(leg => leg.path);
}
