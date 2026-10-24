// Google Places (New) lookups, run in the browser with the Maps key:
// overnight towns that have somewhere to sleep, and real suggestions for each stop.
// Only "Pro" fields are requested (no ratings) to stay within the cheaper Places SKU.
import { InterestCategory, InterestItem } from '../types';
import { geocodeAddress, placeAt } from './geocode';

export type CategoryId = 'stay' | 'food' | 'shop' | 'sights';

export const CATEGORIES: Record<CategoryId, { name: string; glyph: string; color: string }> = {
  stay: { name: 'Accommodations', glyph: '🛏', color: '#4f46e5' },
  food: { name: 'Restaurants/Cafes', glyph: '🍴', color: '#ea580c' },
  shop: { name: 'Bike/Moto Shops', glyph: '🔧', color: '#475569' },
  sights: { name: 'Points of Interest', glyph: '📷', color: '#0d9488' },
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

const FIELDS = ['id', 'displayName', 'location', 'formattedAddress', 'googleMapsURI', 'primaryTypeDisplayName'];

async function placesLib() {
  return await google.maps.importLibrary('places') as google.maps.PlacesLibrary;
}

const lodgingTypes = (pref: LodgingPreference) =>
  pref === 'camping' ? ['campground', 'rv_park']
  : pref === 'hostel' ? ['hostel']
  : ['lodging', 'campground'];

const shopQuery = (travelMode: string) =>
  travelMode === 'DRIVING' ? 'motorcycle repair shop'
  : travelMode === 'WALKING' ? 'outdoor gear shop'
  : 'bicycle shop';

function toItem(place: google.maps.places.Place, category: CategoryId): InterestItem | null {
  if (!place.displayName || !place.location) return null;
  const type = place.primaryTypeDisplayName;
  const address = place.formattedAddress?.split(',').slice(0, 2).join(',');
  return {
    name: place.displayName,
    description: [type, address].filter(Boolean).join(' · '),
    source: 'places',
    placeId: place.id,
    url: place.googleMapsURI || undefined,
    lat: place.location.lat(),
    lng: place.location.lng(),
    category,
  };
}

const cache = new Map<string, InterestItem[]>();

async function searchCategory(
  category: CategoryId, center: google.maps.LatLng, travelMode: string, lodging: LodgingPreference, count: number,
): Promise<InterestItem[]> {
  const key = [category, center.toUrlValue(3), travelMode, lodging, count].join('|');
  if (cache.has(key)) return cache.get(key)!;
  const { Place, SearchNearbyRankPreference } = await placesLib();
  const radius = travelMode === 'DRIVING' ? 8000 : 4000;
  let places: google.maps.places.Place[] = [];
  try {
    if (category === 'shop') {
      ({ places } = await Place.searchByText({
        textQuery: shopQuery(travelMode),
        fields: FIELDS,
        locationBias: { center, radius: radius * 2 },
        maxResultCount: count,
      }));
    } else {
      const includedTypes = category === 'stay' ? lodgingTypes(lodging)
        : category === 'food' ? ['restaurant', 'cafe']
        : ['tourist_attraction', 'museum', 'park'];
      ({ places } = await Place.searchNearby({
        includedTypes,
        fields: FIELDS,
        locationRestriction: { center, radius },
        maxResultCount: count,
        rankPreference: SearchNearbyRankPreference.POPULARITY,
      }));
    }
  } catch (err) {
    console.error(`Places search failed (${category})`, err);
    throw err;
  }
  const items = places.map(p => toItem(p, category)).filter((i): i is InterestItem => i !== null);
  cache.set(key, items);
  return items;
}

/** Real places to stay, eat, fix the bike and visit near a stop: 4 categories × `count`. */
export async function placeSuggestions(
  location: string | google.maps.LatLngLiteral, travelMode: string, lodging: LodgingPreference = 'any', count = 3,
): Promise<InterestCategory[]> {
  const center = typeof location === 'string' ? await geocodeAddress(location) : new google.maps.LatLng(location);
  if (!center) return [];
  const ids: CategoryId[] = ['stay', 'food', 'shop', 'sights'];
  const results = await Promise.allSettled(ids.map(id => searchCategory(id, center, travelMode, lodging, count)));
  if (results.every(r => r.status === 'rejected')) {
    throw (results[0] as PromiseRejectedResult).reason;
  }
  return ids.map((id, i) => ({
    category: CATEGORIES[id].name,
    items: results[i].status === 'fulfilled' ? results[i].value : [],
  }));
}

/**
 * Where to sleep near a point on the route: the nearest place to stay (named after its town),
 * or the point itself if Places finds nothing.
 */
export async function overnightTownNear(
  point: google.maps.LatLng, lodging: LodgingPreference,
): Promise<{ name: string; position: google.maps.LatLngLiteral } | null> {
  try {
    const { Place, SearchNearbyRankPreference } = await placesLib();
    const { places } = await Place.searchNearby({
      includedTypes: lodgingTypes(lodging),
      fields: ['location', 'addressComponents'],
      locationRestriction: { center: point, radius: 15000 },
      maxResultCount: 5,
      rankPreference: SearchNearbyRankPreference.DISTANCE,
    });
    for (const place of places) {
      const part = (type: string) => place.addressComponents?.find(c => c.types.includes(type))?.longText;
      const town = part('locality') || part('postal_town') || part('administrative_area_level_3');
      const country = part('country');
      if (town && country && place.location) return { name: `${town}, ${country}`, position: place.location.toJSON() };
    }
  } catch (err) {
    console.warn('Overnight search fell back to reverse geocoding', err);
  }
  return placeAt(point.toJSON());
}
