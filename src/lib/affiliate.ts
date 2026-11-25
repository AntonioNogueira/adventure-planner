// Booking links next to the map links in place popups: "Check prices" for places to stay, "Tickets & tours"
// for sights, and "Rent a vehicle" at the start of moto/car trips.
//   - Affiliate ids and partner link templates come from the server settings (see .env.example):
//     BOOKING_AID, GETYOURGUIDE_PARTNER_ID, AFFILIATE_HOSTELS_URL, AFFILIATE_CAMPSITES_URL, AFFILIATE_RENTALS_URL.
//   - Templates use {q} (place and town), {name}, {town}, {checkin}, {checkout} (YYYY-MM-DD).
//   - Tracking ids are only added after the visitor accepts them (consent banner); otherwise the links still
//     work, without ids. Without templates, hostels and campsites use Booking.com filtered by property type.
import { categoryId } from './places';

export interface AffiliateConfig {
  booking?: string;
  getyourguide?: string;
  hostels?: string;
  campsites?: string;
  rentals?: string;
  amazon?: string;
  bookshop?: string;
  amazonDomain?: string;
}

const configured = (): AffiliateConfig =>
  (typeof window !== 'undefined' && window.__APP_CONFIG__?.affiliates) || {};

// ---- Consent (remembered on this device) ----

const CONSENT_KEY = 'adventure-planner.consent';
export type Consent = 'accepted' | 'essential' | null;

export function getConsent(): Consent {
  try { return (localStorage.getItem(CONSENT_KEY) as Consent) || null; } catch { return null; }
}

const consentListeners = new Set<() => void>();
export function setConsent(value: Exclude<Consent, null>) {
  try { localStorage.setItem(CONSENT_KEY, value); } catch { /* not remembered; still applied for this visit */ }
  sessionConsent = value;
  consentListeners.forEach(l => l());
}
let sessionConsent: Consent = null;
export function onConsentChange(l: () => void) { consentListeners.add(l); return () => { consentListeners.delete(l); }; }
const tracking = () => (getConsent() || sessionConsent) === 'accepted';

/** The configured partners, minus tracking ids and templates unless the visitor accepted them. */
const partners = (cfg: AffiliateConfig = configured(), consent = tracking()): AffiliateConfig => (consent ? cfg : {});

export interface Nights { checkIn: string; checkOut: string }

/** A short town name for searches: administrative names like "União das freguesias de X e Y" become "X". */
export function searchTown(town: string): string {
  const t = town.replace(/^(uni[aã]o das freguesias de|freguesia de|uni[oó]n de|comune di|commune de|municipio de|município de)\s+/i, '');
  return t === town ? town : t.split(/\s+e\s+|,/)[0].trim();
}

/** Fill a partner's link template. */
export function fillTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => encodeURIComponent(values[k] ?? ''));
}

// Booking.com property types (nflt filter): hostels, campsites, guesthouses, hotels.
const BOOKING_TYPE: Record<string, number> = { hostel: 203, camping: 214, guesthouse: 216, hotel: 204 };

/** Booking.com search for a place to stay near a town, for the given nights (optionally one property type). */
export function bookingUrl(name: string, town: string, nights?: Nights, ids: AffiliateConfig = partners(), kind?: string): string {
  const params = new URLSearchParams({ ss: [name, searchTown(town)].filter(Boolean).join(', ') });
  if (nights) { params.set('checkin', nights.checkIn); params.set('checkout', nights.checkOut); }
  if (kind && BOOKING_TYPE[kind]) params.set('nflt', `ht_id=${BOOKING_TYPE[kind]}`);
  if (ids.booking) { params.set('aid', ids.booking); params.set('label', 'munditrails'); }
  return `https://www.booking.com/searchresults.html?${params}`;
}

/** "Check prices" for a place to stay: the hostel or campsite partner when set up, else Booking.com. */
export function stayUrl(item: { name: string; stayKind?: string }, town: string, nights?: Nights, cfg: AffiliateConfig = partners()): string {
  const template = item.stayKind === 'hostel' ? cfg.hostels : item.stayKind === 'camping' ? cfg.campsites : undefined;
  const short = searchTown(town);
  if (template) {
    return fillTemplate(template, {
      q: [item.name, short].filter(Boolean).join(' '), name: item.name, town: short,
      checkin: nights?.checkIn || '', checkout: nights?.checkOut || '',
    });
  }
  return bookingUrl(item.name, town, nights, cfg, item.stayKind);
}

/** GetYourGuide search for tickets and tours at a sight. */
export function toursUrl(name: string, town: string, ids: AffiliateConfig = partners()): string {
  const params = new URLSearchParams({ q: [name, searchTown(town)].filter(Boolean).join(' ') });
  if (ids.getyourguide) { params.set('partner_id', ids.getyourguide); params.set('cmp', 'munditrails'); }
  return `https://www.getyourguide.com/s/?${params}`;
}

/** Vehicle rental near the trip's start, only when a rental partner is set up (and accepted). */
export function rentalUrl(town: string, pickup?: string, dropoff?: string, cfg: AffiliateConfig = partners()): string | null {
  if (!cfg.rentals) return null;
  const short = searchTown(town);
  return fillTemplate(cfg.rentals, { q: short, town: short, name: short, checkin: pickup || '', checkout: dropoff || '' });
}

/** Which booking link a suggestion gets, if any (bookings already made, places you marked and shops get none). */
export function offerFor(category: string | undefined, source?: string): 'stay' | 'tours' | null {
  if (source === 'reservation' || source === 'mine') return null;
  const id = categoryId(category || '');
  return id === 'stay' ? 'stay' : id === 'sights' && category ? 'tours' : null;
}

// ---- Books, films and products on Inspiration journeys ----

export interface MediaItem { kind: 'book' | 'film' | 'series' | 'free' | 'shop' | 'channel'; title: string; by?: string; isbn?: string; url?: string; note?: string }
export interface MediaLink { label: string; url: string; paid: boolean }

/** Where to get a book, film or product: Amazon and Bookshop.org for books (with the affiliate ids when set up
 *  and accepted), JustWatch for films, and the item's own link for free texts, shops and channels. */
export function mediaLinks(m: MediaItem, country = 'pt', ids: AffiliateConfig = partners()): MediaLink[] {
  const q = [m.title, m.by].filter(Boolean).join(' ');
  if (m.kind === 'book') {
    const domain = configured().amazonDomain || 'amazon.es';
    const amazon = new URLSearchParams({ k: q, i: 'stripbooks' });
    if (ids.amazon) amazon.set('tag', ids.amazon);
    const bookshop = m.isbn
      ? (ids.bookshop ? `https://bookshop.org/a/${ids.bookshop}/${m.isbn}` : `https://bookshop.org/book/${m.isbn}`)
      : `https://bookshop.org/search?${new URLSearchParams({ keywords: q })}`;
    return [
      ...(m.url ? [{ label: 'Publisher', url: m.url, paid: false }] : []),
      { label: 'Amazon', url: `https://www.${domain}/s?${amazon}`, paid: Boolean(ids.amazon) },
      { label: 'Bookshop.org', url: bookshop, paid: Boolean(ids.bookshop && m.isbn) },
    ];
  }
  if (m.kind === 'film' || m.kind === 'series') {
    return [{ label: 'Where to watch', url: `https://www.justwatch.com/${country}/search?${new URLSearchParams({ q: m.title })}`, paid: false }];
  }
  return m.url ? [{ label: m.kind === 'free' ? 'Read free' : m.kind === 'channel' ? 'Watch' : 'Shop', url: m.url, paid: false }] : [];
}
