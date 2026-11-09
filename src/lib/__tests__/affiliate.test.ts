import { describe, expect, it } from 'vitest';
import { bookingUrl, toursUrl, offerFor, searchTown, stayUrl, rentalUrl, fillTemplate } from '../affiliate';

describe('booking links', () => {
  it('searches Booking.com for the place and its nights, with the affiliate id when set', () => {
    const url = new URL(bookingUrl('Camping Ria Formosa', 'Tavira', { checkIn: '2026-05-14', checkOut: '2026-05-15' }, { booking: '123456' }));
    expect(url.hostname).toBe('www.booking.com');
    expect(url.searchParams.get('ss')).toBe('Camping Ria Formosa, Tavira');
    expect(url.searchParams.get('checkin')).toBe('2026-05-14');
    expect(url.searchParams.get('checkout')).toBe('2026-05-15');
    expect(url.searchParams.get('aid')).toBe('123456');
  });
  it('works without dates or an affiliate id', () => {
    const url = new URL(bookingUrl('Hotel X', 'Beja', undefined, {}));
    expect(url.searchParams.has('aid')).toBe(false);
    expect(url.searchParams.has('checkin')).toBe(false);
  });
  it('searches GetYourGuide for sights', () => {
    const url = new URL(toursUrl('Castelo de Mértola', 'Mértola', { getyourguide: 'ABC' }));
    expect(url.searchParams.get('q')).toBe('Castelo de Mértola Mértola');
    expect(url.searchParams.get('partner_id')).toBe('ABC');
  });
  it('offers links for stays and sights, not for bookings already made or shops', () => {
    expect(offerFor('stay')).toBe('stay');
    expect(offerFor('Stay')).toBe('stay');
    expect(offerFor('sights')).toBe('tours');
    expect(offerFor('Points of interest')).toBe('tours');
    expect(offerFor('stay', 'reservation')).toBeNull();
    expect(offerFor('shop')).toBeNull();
    expect(offerFor('Food')).toBeNull();
  });
});

describe('searchTown', () => {
  it('shortens administrative names to the town', () => {
    expect(searchTown('União das freguesias de Ferreira do Alentejo e Canhestros')).toBe('Ferreira do Alentejo');
    expect(searchTown('Tavira')).toBe('Tavira');
    expect(searchTown('Freguesia de Alcoutim')).toBe('Alcoutim');
  });
});

describe('partners', () => {
  const nights = { checkIn: '2026-06-12', checkOut: '2026-06-13' };
  it('filters Booking.com by the kind of place without a partner template', () => {
    expect(new URL(stayUrl({ name: 'Camping X', stayKind: 'camping' }, 'Tavira', nights, {})).searchParams.get('nflt')).toBe('ht_id=214');
    expect(new URL(stayUrl({ name: 'Hostel Y', stayKind: 'hostel' }, 'Porto', nights, {})).searchParams.get('nflt')).toBe('ht_id=203');
  });
  it('uses the hostel or campsite partner template when set up', () => {
    const cfg = { hostels: 'https://hostels.example/search?q={q}&from={checkin}&to={checkout}&aff=1' };
    expect(stayUrl({ name: 'Hostel Y', stayKind: 'hostel' }, 'Porto', nights, cfg)).toBe('https://hostels.example/search?q=Hostel%20Y%20Porto&from=2026-06-12&to=2026-06-13&aff=1');
    expect(new URL(stayUrl({ name: 'Hotel Z', stayKind: 'hotel' }, 'Porto', nights, cfg)).hostname).toBe('www.booking.com');
  });
  it('offers rentals only with a rental partner', () => {
    expect(rentalUrl('Lisboa', '2026-06-12', '2026-06-15', {})).toBeNull();
    expect(rentalUrl('Lisboa', '2026-06-12', '2026-06-15', { rentals: 'https://rent.example/?l={town}&p={checkin}&d={checkout}' }))
      .toBe('https://rent.example/?l=Lisboa&p=2026-06-12&d=2026-06-15');
  });
  it('fills templates safely', () => {
    expect(fillTemplate('https://x.example/?q={q}', { q: 'a&b "c"' })).toBe('https://x.example/?q=a%26b%20%22c%22');
  });
});
