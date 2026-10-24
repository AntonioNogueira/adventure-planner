export interface RouteStep {
  instruction: string;
  distance: string;
  duration: string;
}

export interface InterestItem {
  name: string;
  description?: string;
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
