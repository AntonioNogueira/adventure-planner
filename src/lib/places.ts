// Places to stay, eat, fix the bike and visit, and overnight towns with somewhere to sleep, from OpenStreetMap
// (Overpass, with Photon as the fallback: see overpass.ts). Reviews and prices are one tap away: "Check prices"
// (Booking.com) on places to stay, and "Open in Google Maps" on every place.
import { InterestCategory } from '../types';
import { geocodeAddress } from './geocode';
import { LatLng } from './geo';
import { osmSuggestions, osmOvernightTowns } from './overpass';

export type CategoryId = 'stay' | 'food' | 'shop' | 'sights';

export const CATEGORIES: Record<CategoryId, { name: string; glyph: string; color: string }> = {
  stay: { name: 'Accommodations', glyph: '🛏', color: '#3d4f7a' },
  food: { name: 'Restaurants/Cafes', glyph: '🍴', color: '#b5652a' },
  shop: { name: 'Bike/Moto Shops', glyph: '🔧', color: '#5f5649' },
  sights: { name: 'Points of Interest', glyph: '📷', color: '#2f6f6a' },
};

/** Map an AI or user category name back to one of the four. */
export function categoryId(name: string): CategoryId {
  const n = name.toLowerCase();
  if (/accommodation|hotel|stay|camp|hostel|lodg/.test(n)) return 'stay';
  if (/restaurant|cafe|food|eat|drink/.test(n)) return 'food';
  if (/shop|bike|moto|repair|gear|store/.test(n)) return 'shop';
  return 'sights';
}

export type LodgingPreference = 'any' | 'camping' | 'hostel' | 'hotel';

/** Real places to stay, eat, fix the bike and visit near a stop: 4 categories × `count`. */
export async function placeSuggestions(
  location: string | LatLng, travelMode: string, lodging: LodgingPreference = 'any', count = 3,
): Promise<InterestCategory[]> {
  const center = typeof location === 'string' ? await geocodeAddress(location) : location;
  if (!center) return [];
  return osmSuggestions(center, travelMode, lodging, count);
}

/**
 * Where to sleep near each point on the route: the nearest place to stay (named after its town),
 * or the point itself if nothing is found.
 */
export function overnightTownsNear(points: LatLng[], lodging: LodgingPreference): Promise<({ name: string; position: LatLng } | null)[]> {
  return osmOvernightTowns(points, lodging);
}
