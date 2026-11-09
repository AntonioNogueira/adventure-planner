// Places to stay, eat, fix the bike and visit, and overnight towns with somewhere to sleep.
// Google Places (New) with the Maps key (only "Pro" fields, no ratings, to stay on the cheaper SKU),
// or OpenStreetMap data via Overpass in the open version (see overpass.ts).
import { InterestCategory, InterestItem } from '../types';
import { geocodeAddress, placeAt } from './geocode';
import { isOsm } from './provider';
import { LatLng } from './geo';
import { osmSuggestions, osmOvernightTowns } from './overpass';
import { searchTown } from './affiliate';

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

const FIELDS = ['id', 'displayName', 'location', 'formattedAddress', 'googleMapsURI', 'primaryTypeDisplayName', 'primaryType'];
// Price level and range (for the budget) are only asked for places to stay and eat.
const PRICE_FIELDS = [...FIELDS, 'priceLevel', 'priceRange'];

const STAY_KINDS: Record<string, InterestItem['stayKind']> = {
  campground: 'camping', rv_park: 'camping', camping_cabin: 'camping',
  hostel: 'hostel',
  guest_house: 'guesthouse', bed_and_breakfast: 'guesthouse', inn: 'guesthouse', farmstay: 'guesthouse', cottage: 'guesthouse',
  hotel: 'hotel', motel: 'hotel', resort_hotel: 'hotel', extended_stay_hotel: 'hotel', lodging: 'hotel',
};
const PRICE_LEVELS: Record<string, number> = {
  INEXPENSIVE: 1, MODERATE: 2, EXPENSIVE: 3, VERY_EXPENSIVE: 4,
  PRICE_LEVEL_INEXPENSIVE: 1, PRICE_LEVEL_MODERATE: 2, PRICE_LEVEL_EXPENSIVE: 3, PRICE_LEVEL_VERY_EXPENSIVE: 4,
};

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
  const anyPlace = place as google.maps.places.Place & { priceRange?: { startPrice?: { units?: number; currencyCode?: string }; endPrice?: { units?: number } } };
  const level = PRICE_LEVELS[String(place.priceLevel || '')];
  const range = anyPlace.priceRange?.startPrice?.units != null
    ? { min: Number(anyPlace.priceRange.startPrice.units), max: Number(anyPlace.priceRange.endPrice?.units ?? anyPlace.priceRange.startPrice.units), currency: anyPlace.priceRange.startPrice.currencyCode || '' }
    : undefined;
  return {
    name: place.displayName,
    description: [type, address].filter(Boolean).join(' · '),
    source: 'places',
    placeId: place.id,
    url: place.googleMapsURI || undefined,
    lat: place.location.lat(),
    lng: place.location.lng(),
    category,
    ...(category === 'stay' ? { stayKind: STAY_KINDS[place.primaryType || ''] || 'hotel' } : {}),
    ...(level ? { priceLevel: level } : {}),
    ...(range ? { priceRange: range } : {}),
  };
}

const cache = new Map<string, InterestItem[]>();

async function searchCategory(
  category: CategoryId, center: LatLng, travelMode: string, lodging: LodgingPreference, count: number,
): Promise<InterestItem[]> {
  const key = [category, center.lat.toFixed(3), center.lng.toFixed(3), travelMode, lodging, count].join('|');
  if (cache.has(key)) return cache.get(key)!;
  const { Place, SearchNearbyRankPreference } = await placesLib();
  const radius = travelMode === 'DRIVING' ? 8000 : 4000;
  let places: google.maps.places.Place[] = [];
  try {
    if (category === 'shop') {
      ({ places } = await Place.searchByText({
        textQuery: shopQuery(travelMode),
        // For bikes, only real bicycle shops (otherwise nearby hotels and bars fill the list).
        ...(travelMode === 'BICYCLING' ? { includedType: 'bicycle_store', useStrictTypeFiltering: true } : {}),
        fields: FIELDS,
        // Text search can only be restricted to a box: roughly 2 × radius around the stop.
        locationRestriction: {
          north: center.lat + (radius * 2) / 111_000,
          south: center.lat - (radius * 2) / 111_000,
          east: center.lng + (radius * 2) / (111_000 * Math.cos((center.lat * Math.PI) / 180)),
          west: center.lng - (radius * 2) / (111_000 * Math.cos((center.lat * Math.PI) / 180)),
        },
        maxResultCount: count,
      }));
    } else {
      const includedTypes = category === 'stay' ? lodgingTypes(lodging)
        : category === 'food' ? ['restaurant', 'cafe']
        : ['tourist_attraction', 'museum', 'park'];
      ({ places } = await Place.searchNearby({
        // Match the main type for food and sights (a hotel with a restaurant isn't a restaurant suggestion).
        ...(category === 'stay' ? { includedTypes } : { includedPrimaryTypes: includedTypes }),
        fields: category === 'stay' || category === 'food' ? PRICE_FIELDS : FIELDS,
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
  const center = typeof location === 'string' ? await geocodeAddress(location) : location;
  if (!center) return [];
  if (isOsm) return osmSuggestions(center, travelMode, lodging, count);
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
 * Where to sleep near each point on the route: the nearest place to stay (named after its town),
 * or the point itself if nothing is found.
 */
export async function overnightTownsNear(points: LatLng[], lodging: LodgingPreference): Promise<({ name: string; position: LatLng } | null)[]> {
  if (isOsm) return osmOvernightTowns(points, lodging);
  return Promise.all(points.map(point => overnightTownNear(point, lodging)));
}

async function overnightTownNear(point: LatLng, lodging: LodgingPreference): Promise<{ name: string; position: LatLng } | null> {
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
      if (town && country && place.location) return { name: `${searchTown(town)}, ${country}`, position: place.location.toJSON() };
    }
  } catch (err) {
    console.warn('Overnight search fell back to reverse geocoding', err);
  }
  return placeAt(point);
}
