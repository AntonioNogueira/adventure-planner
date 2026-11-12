// App settings injected by the server (vite.config.ts), and links out to other map sites.
// The app runs on OpenStreetMap services only; Google is used for login, the AI planner and the
// "open in Google Maps" links (plain links, so Google's map-content rules don't apply).

declare global {
  interface Window { __APP_CONFIG__?: {
    authProviders?: string;
    checkout?: Record<string, string>;
    affiliates?: { booking?: string; getyourguide?: string; hostels?: string; campsites?: string; rentals?: string };
    services?: { overpass?: string | string[]; photon?: string; nominatim?: string; osrm?: string; valhalla?: string; brouter?: string };
    /** MapTiler's browser key (restricted to the app's sites in MapTiler Cloud): a second place-name service. */
    maptilerKey?: string;
  } }
}

/** A link to a place on Google Maps (reviews, photos, opening hours). Search links take text only, so callers
 *  pass the name with its town; the position is accepted for callers' convenience but not needed. */
export function mapSearchUrl(query: string, _at?: { lat: number; lng: number }) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export const mapSiteName = 'Google Maps';

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
