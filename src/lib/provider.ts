// Which map stack the app uses, chosen by the server's MAP_PROVIDER setting:
//   'google' – Google Maps, Directions/Routes, Places, Geocoding, Elevation (needs a Maps key)
//   'osm'    – "Adventure Planner Open": MapLibre + OpenFreeMap, OSRM, Valhalla, Photon, Overpass (no keys)
export type MapProvider = 'google' | 'osm';

declare global {
  interface Window { __APP_CONFIG__?: { mapProvider?: string; authProviders?: string; checkout?: Record<string, string>; affiliates?: { booking?: string; getyourguide?: string } } }
}

export const MAP_PROVIDER: MapProvider =
  typeof window !== 'undefined' && window.__APP_CONFIG__?.mapProvider === 'osm' ? 'osm' : 'google';

export const isOsm = MAP_PROVIDER === 'osm';

/** A link to look a place up on the provider's own map site. */
export function mapSearchUrl(query: string, at?: { lat: number; lng: number }) {
  if (isOsm) {
    return at
      ? `https://www.openstreetmap.org/?mlat=${at.lat.toFixed(5)}&mlon=${at.lng.toFixed(5)}#map=17/${at.lat.toFixed(5)}/${at.lng.toFixed(5)}`
      : `https://www.openstreetmap.org/search?query=${encodeURIComponent(query)}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export const mapSiteName = isOsm ? 'OpenStreetMap' : 'Google Maps';

export type AuthProvider = 'email' | 'google' | 'facebook' | 'apple';

/**
 * Login options to offer, from the server's AUTH_PROVIDERS setting (default "email,google").
 * Facebook and Apple also need setting up in Firebase → Authentication → Sign-in method.
 */
export const AUTH_PROVIDERS: AuthProvider[] = (
  (typeof window !== 'undefined' && window.__APP_CONFIG__?.authProviders) || 'email,google'
).split(',').map(s => s.trim()).filter((s): s is AuthProvider => ['email', 'google', 'facebook', 'apple'].includes(s));

/** Checkout links for paid plans, from the server's CHECKOUT_URL_* settings (missing = not on sale yet). */
export const CHECKOUT_URLS: Record<string, string> = (typeof window !== 'undefined' && window.__APP_CONFIG__?.checkout) || {};
