import type { BudgetSettings } from './lib/budget';

export interface RouteStep {
  instruction: string;
  distance: string;
  duration: string;
}

export interface Reservation {
  fileName: string;
  fileType: string;
  /** A booking or place added from a shared link: the page it came from. */
  url?: string;
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
  /** Suggestions ('places') are replaced when a stop moves; bookings ('reservation') and places you marked ('mine') stay. */
  source?: 'places' | 'reservation' | 'mine';
  reservation?: Reservation;
  /** The OpenStreetMap element it came from (osm:node/123). */
  placeId?: string;
  url?: string;
  lat?: number;
  lng?: number;
  /** Its category id ('stay', 'food', 'shop', 'water', 'sights'). */
  category?: string;
  /** Kind of place to stay, for budget estimates. */
  stayKind?: 'camping' | 'hostel' | 'guesthouse' | 'hotel';
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

/** A photo in a stop's story: its link once uploaded; before that, a photo waiting in this browser (see photos.ts). */
export interface StoryPhoto {
  url?: string;
  pendingId?: string;
  caption?: string;
}
/** The traveller's own words and photos about a stop, like a short blog post on the map. */
export interface Story {
  text: string;
  photos: StoryPhoto[];
}

export interface Waypoint {
  location: string;
  /** A night the planner picked itself (not one the traveller chose): re-planning may move it. */
  auto?: boolean;
  /** The traveller's text and photos about this stop. */
  story?: Story;
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

/** Bikes: road, gravel, mountain bike, e-MTB. Motorcycles: touring (tarmac), adventure (dirt roads), enduro (rough tracks). */
export type RideKind = '' | 'road' | 'gravel' | 'mtb' | 'emtb' | 'touring' | 'adventure' | 'enduro';
/** Who's travelling: sets the pace and the kind of places. */
export type Party = '' | 'solo' | 'couple' | 'family' | 'group';
/** What they like to stop for. */
export type Interest = 'nature' | 'history' | 'contemporary';
/** Budget style: the stay and food averages in the budget. */
export type BudgetStyle = '' | 'shoestring' | 'mid' | 'comfort';
/** General knowledge about a named vehicle (e.g. "Honda Africa Twin"): typical figures, not the owner's own. */
export interface VehicleInfo {
  litresPer100km?: number;
  tankLitres?: number;
  /** Typical km on a full tank. */
  rangeKm?: number;
  /** Known problems, limitations and tips for this kind of trip. */
  notes: string[];
}
/** A point the route is pulled through by dragging the line (not a stop): on day `leg`. */
export interface Via { leg: number; at: { lat: number; lng: number } }

/** The traveller's style, kept with the trip. */
export interface TripStyle {
  ride?: RideKind;
  party?: Party;
  interests?: Interest[];
  budgetStyle?: BudgetStyle;
  /** The most they want to pay per night (in their currency), if they said. */
  maxStayPrice?: number;
  vehicleModel?: string;
  vehicleInfo?: VehicleInfo;
}

/** What the AI understood from the chat; the app turns it into a real route. */
export interface TripIntent extends TripStyle {
  /** The planner's own words for this message: answers to questions, tips and warnings for the trip. */
  reply?: string;
  /** Lasting preferences this message stated ("sections of 40 km max"), for the traveller's profile. */
  preferences?: string[];
  /** Fields the AI filled from the traveller's profile rather than the message. */
  fromProfile?: string[];
  /** A start date the message gave ("next Monday"), as YYYY-MM-DD. */
  startDate?: string;
  origin: string;
  destination: string;
  travelMode: string;
  /** The AI read how they travel from the request itself (not a guess). */
  travelModeStated?: boolean;
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
  vehicle?: '' | 'motorcycle' | 'motorcycle_2up' | 'car' | 'suv' | '4x4' | 'campervan' | 'truck';
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
  originStory?: Story;
  destination: string;
  destinationInterests?: InterestCategory[];
  destinationStory?: Story;
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
  vehicle?: 'motorcycle' | 'motorcycle_2up' | 'car' | 'suv' | '4x4' | 'campervan' | 'truck';
  /** The traveller's style from the planner: kind of riding, who's going, interests, budget, named vehicle. */
  style?: TripStyle;
  /** Points the route was dragged through. */
  vias?: Via[];
  /** The traveller's budget averages (Budget tab). */
  budget?: BudgetSettings;
  /** Anyone with the link can view a shared trip. */
  shared?: boolean;
  userId?: string;
}
