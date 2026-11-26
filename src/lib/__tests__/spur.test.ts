import { describe, it, expect } from 'vitest';
import { spurKm } from '../tripBuilder';

const line = (a: [number, number], b: [number, number], n = 50) => Array.from({ length: n + 1 }, (_, i) => ({ lat: a[0] + (b[0] - a[0]) * i / n, lng: a[1] + (b[1] - a[1]) * i / n }));

describe('spurKm', () => {
  it('is about zero for a place on the way', () => {
    expect(spurKm(line([46, 7], [46.1, 7]), line([46.1, 7], [46.2, 7.1]))).toBeLessThan(0.3);
  });
  it('is the length of a dead end ridden there and back', () => {
    // Main road east, then 5 km up a side valley to the place, back down and on east.
    const into = [...line([46, 7], [46, 7.1]), ...line([46, 7.1], [46.045, 7.1]).slice(1)];
    const out = [...line([46.045, 7.1], [46, 7.1]), ...line([46, 7.1], [46, 7.2]).slice(1)];
    expect(spurKm(into, out)).toBeGreaterThan(4.5);
  });
});
