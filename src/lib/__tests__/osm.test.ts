import { describe, expect, it } from 'vitest';
import { classify, rankScore, toItem } from '../overpass';
import { decodePolyline6 } from '../osrm';
import { evenlySpaced, haversineKm } from '../geo';

describe('overpass helpers', () => {
  it('sorts OSM tags into the four categories', () => {
    expect(classify({ tourism: 'camp_site' })).toBe('stay');
    expect(classify({ amenity: 'cafe' })).toBe('food');
    expect(classify({ shop: 'bicycle' })).toBe('shop');
    expect(classify({ historic: 'castle' })).toBe('sights');
    expect(classify({ tourism: 'viewpoint' })).toBe('sights');
    expect(classify({ amenity: 'bench' })).toBeNull();
  });

  it('ranks well-documented places higher', () => {
    expect(rankScore({ wikidata: 'Q1', website: 'x' })).toBe(4);
    expect(rankScore({})).toBe(0);
  });

  it('turns an OSM element into a suggestion', () => {
    const item = toItem({
      type: 'way', id: 42, center: { lat: 37.1, lon: -7.6 },
      tags: { name: 'Camping Ria Formosa', tourism: 'camp_site', 'addr:city': 'Cabanas', website: 'https://example.test' },
    }, 'stay');
    expect(item).toMatchObject({
      name: 'Camping Ria Formosa', description: 'Campsite · Cabanas', url: 'https://example.test',
      lat: 37.1, lng: -7.6, placeId: 'osm:way/42', category: 'stay', source: 'places',
    });
    expect(toItem({ type: 'node', id: 1, lat: 1, lon: 1, tags: { tourism: 'hotel' } }, 'stay')).toBeNull();
  });
});

describe('decodePolyline6', () => {
  it('decodes Valhalla shapes', () => {
    // Encoded with precision 6: (38.5, -120.2), (40.7, -120.95), (43.252, -126.453).
    const points = decodePolyline6('_izlhA~rlgdF_{geC~ywl@_kwzCn`{nI');
    expect(points[0].lat).toBeCloseTo(38.5, 5);
    expect(points[0].lng).toBeCloseTo(-120.2, 5);
    expect(points[2].lat).toBeCloseTo(43.252, 5);
    expect(points[2].lng).toBeCloseTo(-126.453, 5);
  });
});

describe('evenlySpaced', () => {
  it('returns points at equal distances along a path', () => {
    const path = [{ lat: 0, lng: 0 }, { lat: 0, lng: 1 }, { lat: 0, lng: 3 }];
    const pts = evenlySpaced(path, 4);
    expect(pts).toHaveLength(4);
    expect(pts[0]).toEqual({ lat: 0, lng: 0 });
    expect(pts[3].lng).toBeCloseTo(3, 6);
    expect(haversineKm(pts[0], pts[1])).toBeCloseTo(haversineKm(pts[1], pts[2]), 3);
  });
});
