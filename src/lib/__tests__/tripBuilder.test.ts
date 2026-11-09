import { describe, expect, it } from 'vitest';
import { shareDays } from '../tripBuilder';

describe('shareDays', () => {
  it('adds up to the days asked for, by effort', () => {
    // Marrakech → High Atlas (200) → Merzouga (350) in 4 days: rounding each part gave only 3.
    expect(shareDays([200, 350], 4)).toEqual([1, 3]);
    expect(shareDays([200, 350], 4).reduce((a, b) => a + b)).toBe(4);
    expect(shareDays([100, 100, 100], 7).reduce((a, b) => a + b)).toBe(7);
  });
  it('gives every part at least one day', () => {
    expect(shareDays([10, 500], 2)).toEqual([1, 1]);
    expect(shareDays([10, 20, 500], 2)).toEqual([1, 1, 1]);
  });
});

import { pickNights } from '../tripBuilder';
describe('choosing nights along the route', () => {
  const at = { lat: 0, lng: 0 };
  // 300 km in 8 days (37.5 km a day): planned ends at 37.5, 75, 112.5…
  const splits = [1, 2, 3, 4, 5, 6, 7].map(k => k * 37.5);
  const towns = [38, 73, 77, 118, 150, 186, 226, 262].map(along => ({ at, along, off: 0.5 }));   // 73 and 77: the same town
  it('takes the place to stay nearest each planned day end, never the same town twice', () => {
    const nights = pickNights(splits, 300, towns, 'BICYCLING').map(n => n?.along);
    expect(nights).toEqual([38, 73, 118, 150, 186, 226, 262]);   // 73 or 77 (equally near 75), never both
    const gaps = nights.map((n, i) => n! - (i ? nights[i - 1]! : 0));
    expect(Math.min(...gaps)).toBeGreaterThanOrEqual(0.6 * 37.5);
    expect(Math.max(...gaps)).toBeLessThanOrEqual(1.4 * 37.5);
  });
  it('keeps the planned point when no place to stay is close enough', () => {
    const nights = pickNights([40, 80], 120, [{ at, along: 41, off: 0.2 }, { at, along: 100, off: 0.3 }], 'WALKING');
    expect(nights[0]?.along).toBe(41);
    expect(nights[1]).toBeNull();   // 100 is 20 km past the planned end of a 40 km day
  });
  it('ignores places far off the route for bike and hike, allows more for moto/car', () => {
    const far = [{ at, along: 40, off: 12 }];
    expect(pickNights([40], 80, far, 'BICYCLING')[0]).toBeNull();
    expect(pickNights([150], 300, [{ at, along: 150, off: 8 }], 'DRIVING')[0]?.along).toBe(150);
  });
});
