// Place categories and suggestions near a stop, from OpenStreetMap (Overpass, with Photon as the fallback: see
// overpass.ts). Reviews and prices are one tap away: "Check prices" (Booking.com) and "Open in Google Maps".
import { InterestCategory, Interest } from '../types';
import { geocodeAddress } from './geocode';
import { LatLng } from './geo';
import { osmSuggestions } from './overpass';

export type CategoryId = 'stay' | 'food' | 'shop' | 'water' | 'sights';

/** The place categories. `name` is how they're saved with a trip; what's shown can depend on the trip (shopLabel). */
export const CATEGORIES: Record<CategoryId, { name: string; glyph: string; color: string }> = {
  stay: { name: 'Stay', glyph: '🛏', color: '#3d4f7a' },
  food: { name: 'Food', glyph: '🍴', color: '#b5652a' },
  shop: { name: 'Shops & repairs', glyph: '🔧', color: '#5f5649' },
  water: { name: 'Utilities', glyph: '💧', color: '#2a7ab0' },
  sights: { name: 'Points of interest', glyph: '📷', color: '#2f6f6a' },
};

/** The category of a saved name ("Stay") or id ("stay"); anything else counts as a point of interest. */
export function categoryId(name: string): CategoryId {
  const n = name.trim().toLowerCase();
  return (Object.keys(CATEGORIES) as CategoryId[]).find(id => id === n || CATEGORIES[id].name.toLowerCase() === n) ?? 'sights';
}

// The traveller's mode, vehicle and interests, for names and places that depend on them (set by the app).
let travel: { mode: string; vehicle?: string; interests?: Interest[] } = { mode: 'DRIVING' };
export function setTravelContext(mode: string, vehicle?: string, interests?: Interest[]) { travel = { mode, vehicle, interests }; }
/** What the traveller likes to stop for (empty: a bit of everything). */
export function travelInterests(): Interest[] { return travel.interests || []; }

/** What the shops category is called for this kind of trip. */
export function shopLabel(mode = travel.mode, vehicle = travel.vehicle): string {
  if (mode === 'BICYCLING') return 'Bike shops';
  if (mode === 'WALKING') return 'Sport shops';
  if (vehicle?.startsWith('motorcycle')) return 'Moto shops';
  if (vehicle && ['car', 'suv', '4x4', 'campervan', 'truck'].includes(vehicle)) return 'Mechanics';
  return 'Moto & car repairs';
}

/** The name shown for a category (in English: translate with t()). */
export function categoryLabel(id: CategoryId): string {
  return id === 'shop' ? shopLabel() : CATEGORIES[id].name;
}

export type LodgingPreference = 'any' | 'camping' | 'hostel' | 'hotel';

/** Real places near a stop: to stay, food (to eat or buy), shops & repairs, utilities (water, toilets, fuel), sights. */
export async function placeSuggestions(
  location: string | LatLng, travelMode: string, lodging: LodgingPreference = 'any', count = 3, vehicle = '',
): Promise<InterestCategory[]> {
  const center = typeof location === 'string' ? await geocodeAddress(location) : location;
  if (!center) return [];
  return osmSuggestions(center, travelMode, lodging, count, vehicle);
}
