import type { BudgetSettings } from './lib/budget';

export interface RouteStep {
  instruction: string;
  distance: string;
  duration: string;
}

export interface Reservation {
  fileName: string;
  fileType: string;
  /** Key into the in-browser attachment store (this session). */
  fileId?: string;
  /** Firebase Storage link, once the trip has been saved. */
  fileUrl?: string;
  address?: string;
  checkIn?: string;
  checkOut?: string;
  /** Dates as YYYY-MM-DD, for checking against the trip schedule. */
  checkInDate?: string;
  checkOutDate?: string;
  price?: number;
  currency?: string;
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
  /** Kind of place to stay, for budget estimates. */
  stayKind?: 'camping' | 'hostel' | 'guesthouse' | 'hotel';
  /** Google price level 1 (inexpensive) to 4 (very expensive), for food estimates. */
  priceLevel?: number;
  /** A typical price range from Google, when known. */
  priceRange?: { min: number; max: number; currency: string };
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
  /** Extra nights at this stop. */
  restDays?: number;
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
  durationSeconds?: number;
  /** Part of the day spent on a ferry, in km. */
  ferryKm?: number;
  /** Where the day ends (for weather); filled from the route. */
  end?: { lat: number; lng: number };
  /** Climbing in metres and ~60 evenly spaced elevations for the profile; filled after the route. */
  ascent?: number;
  descent?: number;
  profile?: number[];
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
  /** The user asked for no ferries ("overland", "no boats"). */
  avoidFerries?: boolean;
  /** The traveller wants unpaved roads and trails (kept easy). */
  offroad?: boolean;
  /** Moto/car trips: what they drive or ride (for fuel and tolls); '' if not said. */
  vehicle?: '' | 'motorcycle' | 'motorcycle_2up' | 'car' | '4x4' | 'campervan';
  /** A stretch the user wants along the coast (the server fills the coastal towns into `route`). */
  coastFrom?: string;
  coastTo?: string;
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
  /** First riding day, YYYY-MM-DD. */
  startDate?: string;
  avoid?: { avoidHighways: boolean; avoidFerries: boolean; avoidTolls: boolean; offroad?: boolean };
  lodging?: 'any' | 'camping' | 'hostel' | 'hotel';
  /** Moto/car trips: the vehicle (fuel and toll estimates). */
  vehicle?: 'motorcycle' | 'motorcycle_2up' | 'car' | '4x4' | 'campervan';
  /** The traveller's budget averages (Budget tab). */
  budget?: BudgetSettings;
  /** Anyone with the link can view a shared trip. */
  shared?: boolean;
  userId?: string;
}
