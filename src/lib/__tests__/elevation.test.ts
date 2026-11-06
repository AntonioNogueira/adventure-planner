import { describe, expect, it } from 'vitest';
import { climbStats, splitByEffort, effortKm } from '../elevation';

describe('climbStats', () => {
  it('sums climbs and descents, ignoring small wobbles', () => {
    expect(climbStats([0, 100, 50, 150])).toEqual({ ascent: 200, descent: 50 });
    expect(climbStats([10, 12, 11, 13, 10])).toEqual({ ascent: 0, descent: 0 });
  });
});

describe('splitByEffort', () => {
  it('splits a flat stretch evenly', () => {
    expect(splitByEffort(120, [0, 0, 0, 0, 0], 10, 3)).toEqual([40, 80]);
  });

  it('ends the hilly day earlier', () => {
    // First half climbs 1000 m, second half is flat: the first day should be shorter than half.
    const elevations = [0, 250, 500, 750, 1000, 1000, 1000, 1000, 1000];
    const [split] = splitByEffort(100, elevations, 10, 2);
    expect(split).toBeLessThan(50);
  });

  it('falls back to distance without elevation', () => {
    expect(splitByEffort(90, null, 10, 3)).toEqual([30, 60]);
    expect(splitByEffort(90, [0, 500, 0], 0, 3)).toEqual([30, 60]);
    expect(splitByEffort(90, null, 10, 1)).toEqual([]);
  });
});

describe('effortKm', () => {
  it('adds flat-equivalent km for climbing', () => {
    expect(effortKm(60, [0, 1000], 10)).toBe(70);
    expect(effortKm(60, null, 10)).toBe(60);
  });
});
