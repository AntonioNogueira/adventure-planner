import { describe, expect, it } from 'vitest';
import { haversineKm, pathWithDistances, pointAt, downsample, bestInsertIndex } from '../geo';

const cadiz = { lat: 36.5271, lng: -6.2886 };
const huelva = { lat: 37.2614, lng: -6.9447 };
const silves = { lat: 37.1891, lng: -8.4386 };

describe('haversineKm', () => {
  it('measures straight-line distance', () => {
    expect(haversineKm(cadiz, huelva)).toBeGreaterThan(95);
    expect(haversineKm(cadiz, huelva)).toBeLessThan(105);
    expect(haversineKm(cadiz, cadiz)).toBe(0);
  });
});

describe('pathWithDistances / pointAt', () => {
  it('scales each leg to its real road distance', () => {
    const legs = [
      { path: [cadiz, huelva], distanceMeters: 150_000 },
      { path: [huelva, silves], distanceMeters: 160_000 },
    ];
    const points = pathWithDistances(legs);
    expect(points[0]).toEqual({ at: cadiz, km: 0 });
    expect(points[1].km).toBeCloseTo(150, 5);
    expect(points[2].km).toBeCloseTo(310, 5);
    expect(pointAt(points, 100)).toEqual(huelva);
    expect(pointAt(points, 999)).toEqual(silves);
  });
});

describe('downsample', () => {
  it('keeps first and last and at most max points', () => {
    const pts = Array.from({ length: 1000 }, (_, i) => i);
    const out = downsample(pts, 10);
    expect(out).toHaveLength(10);
    expect(out[0]).toBe(0);
    expect(out[9]).toBe(999);
    expect(downsample([1, 2, 3], 10)).toEqual([1, 2, 3]);
  });
});

describe('bestInsertIndex', () => {
  it('puts a new stop in the gap where it adds the least distance', () => {
    // Huelva lies between Cádiz and Silves, so it goes into gap 0 of [Cádiz, Silves].
    expect(bestInsertIndex([cadiz, silves], huelva)).toBe(0);
    // With Huelva already there, a point near Silves goes into the second gap.
    expect(bestInsertIndex([cadiz, huelva, silves], { lat: 37.2, lng: -8.0 })).toBe(1);
  });
});
