// Booking links next to the map links in place popups: "Check prices" (Booking.com, with the nights at that
// stop when the trip has dates) and "Tickets & tours" (GetYourGuide). With an affiliate ID from the server
// settings (BOOKING_AID, GETYOURGUIDE_PARTNER_ID) bookings earn a commission; without one the links still work.

export interface AffiliateIds { booking?: string; getyourguide?: string }

const configured = (): AffiliateIds =>
  (typeof window !== 'undefined' && window.__APP_CONFIG__?.affiliates) || {};

export interface Nights { checkIn: string; checkOut: string }

/** A short town name for searches: administrative names like "União das freguesias de X e Y" become "X". */
export function searchTown(town: string): string {
  const t = town.replace(/^(uni[aã]o das freguesias de|freguesia de|uni[oó]n de|comune di|commune de|municipio de|município de)\s+/i, '');
  return t === town ? town : t.split(/\s+e\s+|,/)[0].trim();
}

/** Booking.com search for a place to stay near a town, for the given nights. */
export function bookingUrl(name: string, town: string, nights?: Nights, ids: AffiliateIds = configured()): string {
  const params = new URLSearchParams({ ss: [name, searchTown(town)].filter(Boolean).join(', ') });
  if (nights) { params.set('checkin', nights.checkIn); params.set('checkout', nights.checkOut); }
  if (ids.booking) { params.set('aid', ids.booking); params.set('label', 'adventure-planner'); }
  return `https://www.booking.com/searchresults.html?${params}`;
}

/** GetYourGuide search for tickets and tours at a sight. */
export function toursUrl(name: string, town: string, ids: AffiliateIds = configured()): string {
  const params = new URLSearchParams({ q: [name, searchTown(town)].filter(Boolean).join(' ') });
  if (ids.getyourguide) { params.set('partner_id', ids.getyourguide); params.set('cmp', 'adventure-planner'); }
  return `https://www.getyourguide.com/s/?${params}`;
}

/** Which booking link a suggestion gets, if any (bookings already made and shops get none). */
export function offerFor(category: string | undefined, source?: string): 'stay' | 'tours' | null {
  if (source === 'reservation') return null;
  const c = (category || '').toLowerCase();
  if (c === 'stay' || /accommodation|hotel|hostel|camp|lodg/.test(c)) return 'stay';
  if (c === 'sights' || /point|interest|sight|museum|attraction/.test(c)) return 'tours';
  return null;
}
