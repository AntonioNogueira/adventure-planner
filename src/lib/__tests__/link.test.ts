import { describe, expect, it } from 'vitest';
import { coordsFromUrl, datesFromUrl, parseLinkHtml, isPublicUrl, isLocalUrl, linkAsText, googleMapsPlace, isGoogleMapsUrl, pastConsent, readLink } from '../../../server/link';
import { afterEach, vi } from 'vitest';

// Address lookups don't run in tests: every host name resolves to a public address.
vi.mock('node:dns/promises', () => ({ lookup: async () => [{ address: '142.250.180.14', family: 4 }] }));

describe('reading shared links', () => {
  it('finds coordinates in map links', () => {
    expect(coordsFromUrl('https://www.google.com/maps/place/Covilh%C3%A3/@40.28,-7.50,13z/data=!3m1!4b1!4m6!3m5!1s0x0:0x0!8m2!3d40.2810!4d-7.5045')).toEqual({ lat: 40.281, lng: -7.5045 });
    expect(coordsFromUrl('https://www.google.com/maps/@38.7223,-9.1393,15z')).toEqual({ lat: 38.7223, lng: -9.1393 });
    expect(coordsFromUrl('https://maps.google.com/?q=37.1272,-7.65')).toEqual({ lat: 37.1272, lng: -7.65 });
    expect(coordsFromUrl('https://www.openstreetmap.org/?mlat=38.57&mlon=-7.91#map=17/38.57/-7.91')).toEqual({ lat: 38.57, lng: -7.91 });
    expect(coordsFromUrl('https://www.booking.com/hotel/pt/casa.html')).toBeUndefined();
  });
  it('finds booking dates in the link', () => {
    expect(datesFromUrl('https://www.booking.com/hotel/pt/casa.html?checkin=2026-06-12&checkout=2026-06-14&group_adults=2'))
      .toEqual({ checkIn: '2026-06-12', checkOut: '2026-06-14' });
    expect(datesFromUrl('https://www.airbnb.com/rooms/123?check_in=2026-07-01&check_out=2026-07-03')).toEqual({ checkIn: '2026-07-01', checkOut: '2026-07-03' });
  });
  it('reads a page: share preview, structured data with address and position', () => {
    const html = `<html><head><title>Casa dos Teles – Booking.com</title>
      <meta property="og:site_name" content="Booking.com"><meta property="og:title" content="Casa dos Teles, Évora">
      <meta property="og:description" content="Guest house in the old town &amp; free bikes">
      <script type="application/ld+json">{"@context":"https://schema.org","@type":"Hotel","name":"Casa dos Teles",
        "address":{"@type":"PostalAddress","streetAddress":"Rua X 5","postalCode":"7000","addressLocality":"Évora","addressCountry":"PT"},
        "geo":{"latitude":38.571,"longitude":-7.909}}</script></head><body><p>Lovely stay</p></body></html>`;
    const info = parseLinkHtml(html, 'https://www.booking.com/hotel/pt/casa-dos-teles.html?checkin=2026-06-12&checkout=2026-06-13');
    expect(info).toMatchObject({ site: 'Booking.com', title: 'Casa dos Teles, Évora', description: 'Guest house in the old town & free bikes',
      place: { name: 'Casa dos Teles', kind: 'Hotel', address: 'Rua X 5, 7000, Évora, PT' }, position: { lat: 38.571, lng: -7.909 },
      checkIn: '2026-06-12', checkOut: '2026-06-13' });
    expect(info.text).toContain('Lovely stay');
    expect(linkAsText(info)).toContain('Structured data: Hotel | Casa dos Teles | Rua X 5, 7000, Évora, PT');
  });
  it('never opens addresses on the server\'s own network', async () => {
    expect(await isPublicUrl('http://localhost:3000/api/me')).toBe(false);
    expect(await isPublicUrl('http://127.0.0.1/')).toBe(false);
    expect(await isPublicUrl('http://192.168.1.1/')).toBe(false);
    expect(await isPublicUrl('http://169.254.169.254/latest/meta-data')).toBe(false);
    expect(await isPublicUrl('file:///etc/passwd')).toBe(false);
    expect(await isPublicUrl('https://8.8.8.8/')).toBe(true);
    expect(isLocalUrl('http://10.0.0.5/admin')).toBe(true);
    expect(isLocalUrl('http://localhost:3000')).toBe(true);
    expect(isLocalUrl('https://www.booking.com/hotel/pt/x.html')).toBe(false);
  });
});

describe('Google Maps links', () => {
  afterEach(() => vi.unstubAllGlobals());
  const long = 'https://www.google.com/maps/place/Hotel+Ba%C3%ADa/@38.6964,-9.4227,17z/data=!3m1!4b1!4m9!3m8!1s0xd1ec5:0x1!5m2!4m1!1i2!8m2!3d38.6963!4d-9.4205!16s%2Fg%2F1';
  it('reads the place name and its pin from the address', () => {
    expect(isGoogleMapsUrl(long)).toBe(true);
    expect(isGoogleMapsUrl('https://maps.app.goo.gl/AbC123')).toBe(false);
    expect(googleMapsPlace(long)).toEqual({ name: 'Hotel Baía', position: { lat: 38.6963, lng: -9.4205 } });
    expect(googleMapsPlace('https://www.google.com/maps/search/?api=1&query=Tasca+do+Chico+Lisboa')).toEqual({ name: 'Tasca do Chico Lisboa', position: undefined });
    expect(googleMapsPlace('https://maps.google.com/?q=37.1272,-7.65')).toEqual({ name: undefined, position: { lat: 37.1272, lng: -7.65 } });
  });
  it('gets past Google\'s cookie page', () => {
    expect(pastConsent(`https://consent.google.com/m?continue=${encodeURIComponent(long)}&gl=PT`)).toBe(long);
    expect(pastConsent(long)).toBeNull();
  });
  it('follows a short share link to the full address without opening Google\'s page', async () => {
    const opened: string[] = [];
    vi.stubGlobal('fetch', async (u: string) => {
      opened.push(u);
      if (u.startsWith('https://maps.app.goo.gl/')) return new Response(null, { status: 302, headers: { location: `https://consent.google.com/m?continue=${encodeURIComponent(long)}` } });
      throw new Error(`should not open ${u}`);
    });
    const info = await readLink('https://maps.app.goo.gl/AbC123');
    expect(info).toMatchObject({ site: 'Google Maps', title: 'Hotel Baía', position: { lat: 38.6963, lng: -9.4205 } });
    expect(opened).toEqual(['https://maps.app.goo.gl/AbC123']);
  });
});
