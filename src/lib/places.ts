// Places to stay, eat, fix the bike and visit, and overnight towns with somewhere to sleep, from OpenStreetMap
// (Overpass, with Photon as the fallback: see overpass.ts). Reviews and prices are one tap away: "Check prices"
// (Booking.com) on places to stay, and "Open in Google Maps" on every place.
import { InterestCategory } from '../types';
import { geocodeAddress } from './geocode';
import { LatLng } from './geo';
import { osmSuggestions, osmOvernightTowns } from './overpass';

export type CategoryId = 'stay' | 'food' | 'shop' | 'water' | 'sights';

/** The place categories. `name` is how they're saved with a trip; what's shown can depend on the trip (shopLabel). */
export const CATEGORIES: Record<CategoryId, { name: string; glyph: string; color: string }> = {
  stay: { name: 'Stay', glyph: '🛏', color: '#3d4f7a' },
  food: { name: 'Food', glyph: '🍴', color: '#b5652a' },
  shop: { name: 'Shops & repairs', glyph: '🔧', color: '#5f5649' },
  water: { name: 'Utilities', glyph: '💧', color: '#2a7ab0' },
  sights: { name: 'Points of interest', glyph: '📷', color: '#2f6f6a' },
};

/** Map a category name (from a saved trip, the AI or a booking) to one of the five. Older names still match. */
export function categoryId(name: string): CategoryId {
  const n = name.toLowerCase();
  if (/accommodation|hotel|stay|sleep|camp|bivouac|hostel|lodg/.test(n)) return 'stay';
  if (/restaurant|cafe|café|food|eat|drink|supermarket|grocer|market|bakery|producer/.test(n)) return 'food';
  if (/utilit|water|toilet|fuel|shower|charging/.test(n)) return 'water';
  if (/shop|bike|moto|repair|gear|store|mechanic|sport/.test(n)) return 'shop';
  return 'sights';
}

// The traveller's mode and vehicle, for names that depend on them (set by the app when they change).
let travel: { mode: string; vehicle?: string } = { mode: 'DRIVING' };
export function setTravelContext(mode: string, vehicle?: string) { travel = { mode, vehicle }; }

/** What the shops category is called for this kind of trip. */
export function shopLabel(mode = travel.mode, vehicle = travel.vehicle): string {
  if (mode === 'BICYCLING') return 'Bike shops';
  if (mode === 'WALKING') return 'Sport shops';
  if (vehicle?.startsWith('motorcycle')) return 'Moto shops';
  if (vehicle === 'car' || vehicle === '4x4' || vehicle === 'campervan') return 'Mechanics';
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

/**
 * Where to sleep near each point on the route: the nearest place to stay (named after its town),
 * or the point itself if nothing is found.
 */
export function overnightTownsNear(points: LatLng[], lodging: LodgingPreference): Promise<({ name: string; position: LatLng } | null)[]> {
  return osmOvernightTowns(points, lodging);
}
