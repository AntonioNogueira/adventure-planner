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

/** A readable name for a position: "Tavira, Portugal", or "Near <area>, <country>" in the countryside. */
export async function townAt(position: google.maps.LatLngLiteral): Promise<string | null> {
  try {
    const { results } = await (await geocoder()).geocode({ location: position });
    if (!results.length) return null;
    const part = (type: string) => results
      .flatMap(r => r.address_components)
      .find(c => c.types.includes(type))?.long_name;
    const country = part('country');
    const town = part('locality') || part('postal_town');
    if (town) return country ? `${town}, ${country}` : town;
    // Countryside: label it by the parish/municipality. The stop keeps its exact position for routing.
    const area = part('administrative_area_level_3') || part('administrative_area_level_2') || part('route');
    return area ? `Near ${area}${country ? `, ${country}` : ''}` : results[0].formatted_address;
  } catch (error) {
    console.error('Reverse geocoding failed:', error);
    return null;
  }
}

/** A name plus a nearby routable spot (the nearest address, so never in a river or the sea). */
export async function placeAt(position: google.maps.LatLngLiteral): Promise<{ name: string; position: google.maps.LatLngLiteral } | null> {
  try {
    const { results } = await (await geocoder()).geocode({ location: position });
    const onLand = results.find(r => r.types.includes('street_address') || r.types.includes('route') || r.types.includes('premise'));
    const name = await townAt(position);
    if (!name) return null;
    return { name, position: (onLand || results[0])?.geometry.location.toJSON() || position };
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
