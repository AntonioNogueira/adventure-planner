import { offroadTrip, OFFROAD_MODES } from './offroad';
import { osmTrip } from './osrm';
import { LatLng } from './geo';

// One routing entry point for the app: OSRM / Valhalla on roads (osrm.ts), BRouter off-road (offroad.ts).
// The server's OSRM_URL, VALHALLA_URL and BROUTER_URL settings pick the servers (services.ts).

export interface RouteOptions {
  avoidHighways: boolean;
  avoidFerries: boolean;
  avoidTolls: boolean;
  /** Prefer unpaved tracks and trails, kept easy (bike, hike, moto): see offroad.ts. */
  offroad?: boolean;
}

export const NO_AVOIDANCES: RouteOptions = { avoidHighways: false, avoidFerries: false, avoidTolls: false, offroad: false };

export type RoutePlace = string | LatLng;

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
  path: LatLng[];
  steps: RoutedStep[];
}

export interface RoutedTrip {
  legs: RoutedLeg[];
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

/** Route a trip: off-road when asked (falling back to the normal route), else roads. */
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
  return osmTrip(req);
}

/** Total ferry distance in a trip, in km. */
export function ferryKm(trip: RoutedTrip): number {
  return Math.round(trip.legs.flatMap(l => l.steps).filter(s => s.ferry).reduce((sum, s) => sum + s.distanceMeters, 0) / 1000);
}
