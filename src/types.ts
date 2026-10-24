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
  /** Suggestions ('places' from Google Places, older plans 'ai') are replaced when a stop moves; reservations are kept. */
  source?: 'ai' | 'places' | 'reservation';
  reservation?: Reservation;
  /** Google Places data, so suggestions get their own pin and a direct Maps link. */
  placeId?: string;
  url?: string;
  lat?: number;
  lng?: number;
  /** 'stay' | 'food' | 'shop' | 'sights', for the map icon. */
  category?: string;
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
  /** Exact spot (from route splitting or a dragged pin); used for routing instead of geocoding the name. */
  position?: { lat: number; lng: number };
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

/** What the AI understood from the chat; the app turns it into a route with Google Maps. */
export interface TripIntent {
  origin: string;
  destination: string;
  travelMode: string;
  /** 0 when the user didn't say. */
  days: number;
  dailyKm: number;
  /** Places in travel order the route must pass; `overnight` ones become stops. */
  route: { place: string; overnight: boolean }[];
  lodging: 'any' | 'camping' | 'hostel' | 'hotel';
  summary: string;
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
