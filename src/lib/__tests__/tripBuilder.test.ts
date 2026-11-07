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
