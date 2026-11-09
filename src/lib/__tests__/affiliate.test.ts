import { describe, expect, it } from 'vitest';
import { bookingUrl, toursUrl, offerFor, searchTown } from '../affiliate';

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
    expect(offerFor('Accommodations')).toBe('stay');
    expect(offerFor('sights')).toBe('tours');
    expect(offerFor('Points of Interest')).toBe('tours');
    expect(offerFor('stay', 'reservation')).toBeNull();
    expect(offerFor('shop')).toBeNull();
    expect(offerFor('Restaurants/Cafes')).toBeNull();
  });
});

describe('searchTown', () => {
  it('shortens administrative names to the town', () => {
    expect(searchTown('União das freguesias de Ferreira do Alentejo e Canhestros')).toBe('Ferreira do Alentejo');
    expect(searchTown('Tavira')).toBe('Tavira');
    expect(searchTown('Freguesia de Alcoutim')).toBe('Alcoutim');
  });
});
