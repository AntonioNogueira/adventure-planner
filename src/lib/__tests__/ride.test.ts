import { describe, expect, it } from 'vitest';
import { splitAt, bearingDeg, progressOn, viaPoints, googleMapsUrl, wazeUrl, arrivalAt, cumulativeKm } from '../ride';

// A straight north–south path: 0.1° of latitude ≈ 11.1 km per step, 4 steps ≈ 44.5 km.
const path = [0, 1, 2, 3, 4].map(i => ({ lat: 38 + i * 0.1, lng: -8 }));

describe('progressOn', () => {
  it('measures distance done, left and off the route', () => {
    const p = progressOn(path, { lat: 38.2, lng: -8 });
    expect(p.alongKm).toBeCloseTo(22.2, 0);
    expect(p.remainingKm).toBeCloseTo(22.2, 0);
    expect(p.offRouteKm).toBeLessThan(0.01);
    expect(p.fraction).toBeCloseTo(0.5, 1);
  });
  it('sees when you are off the route', () => {
    const p = progressOn(path, { lat: 38.25, lng: -7.98 });   // ~1.75 km east
    expect(p.offRouteKm).toBeGreaterThan(1.5);
    expect(p.alongKm).toBeCloseTo(27.8, 0);
  });
  it('clamps before the start and after the end', () => {
    expect(progressOn(path, { lat: 37.9, lng: -8 }).alongKm).toBe(0);
    expect(progressOn(path, { lat: 38.6, lng: -8 }).remainingKm).toBe(0);
  });
});

describe('navigation links', () => {
  it('spreads via points along the route', () => {
    const long = Array.from({ length: 101 }, (_, i) => ({ lat: 38 + i * 0.01, lng: -8 }));
    const vias = viaPoints(long, 3);
    vias.map(v => (v.lat - 38) * 100).forEach((at, k) => expect(Math.abs(at - 25 * (k + 1))).toBeLessThanOrEqual(1));
    expect(cumulativeKm(long).length).toBe(101);
  });
  it('builds Google Maps and Waze links for the day', () => {
    const g = new URL(googleMapsUrl(path, 'BICYCLING'));
    expect(g.searchParams.get('travelmode')).toBe('bicycling');
    expect(g.searchParams.get('destination')).toBe('38.400000,-8.000000');
    expect(g.searchParams.get('waypoints')?.split('|').length).toBeGreaterThan(0);
    const fromHere = new URL(googleMapsUrl(path, 'DRIVING', { lat: 38.3, lng: -8 }));
    expect(fromHere.searchParams.get('origin')).toBe('38.300000,-8.000000');
    expect(wazeUrl(path)).toBe('https://waze.com/ul?ll=38.400000,-8.000000&navigate=yes');
  });
  it('estimates arrival at the current pace', () => {
    const now = new Date('2026-06-12T10:00:00Z');
    expect(arrivalAt(30, 60, now)?.toISOString()).toBe('2026-06-12T10:30:00.000Z');
    expect(arrivalAt(30, 0, now)).toBeNull();
  });
});

describe('route done and ahead', () => {
  it('cuts the day where you are', () => {
    const { done, ahead } = splitAt(path, 16.7);
    expect(done.length).toBe(3);
    expect(done[2].lat).toBeCloseTo(38.15, 2);
    expect(ahead[0]).toEqual(done[2]);
    expect(ahead[ahead.length - 1]).toEqual(path[4]);
    expect(splitAt(path, 0).done).toEqual([]);
    expect(splitAt(path, 999).ahead).toEqual([]);
  });
  it('knows which way you are heading', () => {
    expect(bearingDeg({ lat: 38, lng: -8 }, { lat: 38.1, lng: -8 })).toBeCloseTo(0, 0);
    expect(bearingDeg({ lat: 38, lng: -8 }, { lat: 38, lng: -7.9 })).toBeCloseTo(90, 0);
  });
});

import { rideTargets, tonightStay, nearYou } from '../ride';
describe('Go to: places on the trip', () => {
  it('lists each stop, then its bookings first and saved places, with positions', () => {
    const paths = [[{ lat: 38.7, lng: -9.4 }, { lat: 39.0, lng: -9.0 }], [{ lat: 39.0, lng: -9.0 }, { lat: 40.28, lng: -7.5 }]];
    const groups = rideTargets({
      origin: 'Cascais, Portugal', destination: 'Covilhã, Portugal',
      waypoints: [{ location: 'Óbidos, Portugal', stopover: true, interests: [{ category: 'Restaurants/Cafes', items: [{ name: 'Tasca', lat: 39.36, lng: -9.15 }, { name: 'No position' }] },
        { category: 'Accommodations', items: [{ name: 'Casa B', source: 'reservation', reservation: { fileName: 'b.pdf', fileType: 'application/pdf', lat: 39.36, lng: -9.16 } }] }] }],
    }, paths);
    expect(groups.map(g => g.label)).toEqual(['Cascais', 'Óbidos', 'Covilhã']);
    expect(groups[1].items.map(x => `${x.glyph} ${x.name}`)).toEqual(['📍 Óbidos', '✅ Casa B', '🍴 Tasca']);
    expect(groups[1].items[0].at).toEqual({ lat: 39.0, lng: -9.0 });
    expect(groups[2].items[0].at).toEqual({ lat: 40.28, lng: -7.5 });
    // Day 1 ends in Óbidos: tonight's stay is the booking there.
    expect(tonightStay(groups, 0)?.name).toBe('Casa B');
    expect(tonightStay(groups, 1)).toBeUndefined();
    // Riding in Óbidos: its places nearest first; the stop point (40 km away) and Covilhã are left out.
    expect(nearYou(groups, { lat: 39.36, lng: -9.155 }).map(x => x.name)).toEqual(['Tasca', 'Casa B']);
  });
});
