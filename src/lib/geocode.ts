// Shared, cached geocoding so markers, reservations and moved stops don't re-query Google.
const cache = new Map<string, google.maps.LatLng | null>();
const PLACEHOLDERS = ['apt', 'home', 'my location', 'office', 'work'];

async function geocoder() {
  const { Geocoder } = await google.maps.importLibrary("geocoding") as google.maps.GeocodingLibrary;
  return new Geocoder();
}

export async function geocodeAddress(address: string): Promise<google.maps.LatLng | null> {
  const key = address.trim().toLowerCase();
  if (key.length < 3 || PLACEHOLDERS.includes(key)) return null;
  if (cache.has(key)) return cache.get(key)!;
  try {
    const { results } = await (await geocoder()).geocode({ address });
    const location = results?.[0]?.geometry.location ?? null;
    cache.set(key, location);
    return location;
  } catch (error: any) {
    if (error?.code !== 'ZERO_RESULTS') console.error(`Geocoding failed for ${address}:`, error);
    cache.set(key, null);
    return null;
  }
}

/** Name of the town at a position, e.g. "Tavira, Portugal". Moved stops snap to the town so the route, marker and suggestions agree. */
export async function townAt(position: google.maps.LatLngLiteral): Promise<string | null> {
  try {
    const { results } = await (await geocoder()).geocode({ location: position });
    const town = results.find(r => r.types.includes('locality'))
      || results.find(r => r.types.includes('postal_town') || r.types.includes('administrative_area_level_3'))
      || results[0];
    if (!town) return null;
    const part = (type: string) => town.address_components.find(c => c.types.includes(type))?.long_name;
    const name = part('locality') || part('postal_town') || part('administrative_area_level_3');
    const country = part('country');
    return name && country ? `${name}, ${country}` : town.formatted_address;
  } catch (error) {
    console.error('Reverse geocoding failed:', error);
    return null;
  }
}

/** Straight-line distance in km (haversine). */
export function distanceKm(a: google.maps.LatLng, b: google.maps.LatLng) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat() - a.lat());
  const dLng = rad(b.lng() - a.lng());
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat())) * Math.cos(rad(b.lat())) * Math.sin(dLng / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}
