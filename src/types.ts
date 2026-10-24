export interface RouteStep {
  instruction: string;
  distance: string;
  duration: string;
}

export interface Reservation {
  fileName: string;
  fileType: string;
  /** Key into the in-browser attachment store (files are kept for the session only). */
  fileId?: string;
  address?: string;
  checkIn?: string;
  checkOut?: string;
  confirmation?: string;
  notes?: string;
  lat?: number;
  lng?: number;
}

export interface InterestItem {
  name: string;
  description?: string;
  /** 'ai' suggestions are replaced when a stop moves; 'reservation' items are always kept. */
  source?: 'ai' | 'reservation';
  reservation?: Reservation;
}

export type StopKind = 'start' | 'stop' | 'end';

/** Identifies the start, one of the stops (by index) or the finish. */
export interface StopRef {
  kind: StopKind;
  index?: number;
}

export interface InterestCategory {
  category: string;
  items: InterestItem[];
}

export interface Waypoint {
  location: string;
  stopover: boolean;
  interests?: InterestCategory[];
  distanceFromPrev?: string;
  distanceToNext?: string;
}

export interface RouteLeg {
  from: string;
  to: string;
  distance: string;
  duration: string;
  distanceMeters?: number;
}

/** A plan returned by the AI planner, before the route is calculated. */
export interface AIPlanParams {
  origin: string;
  originInterests?: InterestCategory[];
  destination: string;
  destinationInterests?: InterestCategory[];
  waypoints: { location: string; interests: InterestCategory[] }[];
  travelMode: string;
  summary?: string;
}

export interface RouteInfo {
  id?: string;
  name?: string;
  origin: string;
  originInterests?: InterestCategory[];
  destination: string;
  destinationInterests?: InterestCategory[];
  waypoints: Waypoint[];
  travelMode: string;
  distance: string;
  duration: string;
  startAddress: string;
  endAddress: string;
  steps: RouteStep[];
  legs?: RouteLeg[];
  notice?: string;
  createdAt?: number;
}
