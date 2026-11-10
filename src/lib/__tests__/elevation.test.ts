import { afterEach, describe, expect, it, vi } from 'vitest';
import { climbStats, splitByEffort, effortKm, elevationsAlong } from '../elevation';

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

describe('splitByEffort with ferries', () => {
  it('never ends a day at sea and does not count the crossing as riding', () => {
    // 300 km stretch: 100 km riding, 100 km ferry, 100 km riding, split into 2 days.
    const [split] = splitByEffort(300, null, 10, 2, [[100, 200]]);
    // Equal riding each day: the night falls at a port (departure ~100 km or arrival 200 km), never at sea.
    expect(split <= 100.5 || split >= 200).toBe(true);
    expect(Math.min(Math.abs(split - 100), Math.abs(split - 200))).toBeLessThan(1);
  });
  it('keeps days balanced on the riding parts', () => {
    const splits = splitByEffort(400, null, 10, 4, [[100, 200]]);
    // 300 km of riding in 4 days = 75 km each: 75, then 150 riding = 250 real, 225 riding = 325 real.
    expect(splits[0]).toBeCloseTo(75, 0);
    expect(splits[1]).toBeCloseTo(250, 0);
    expect(splits[2]).toBeCloseTo(325, 0);
  });
});

describe('elevation lookups', () => {
  const path = [{ lat: 38.7, lng: -9.4 }, { lat: 40.28, lng: -7.5 }];
  afterEach(() => vi.unstubAllGlobals());

  it('falls back to Open-Meteo when Valhalla fails', async () => {
    // 150 points: two Open-Meteo requests of at most 100.
    const fetchMock = vi.fn(async (url: string) => {
      if (String(url).includes('/height')) return new Response('busy', { status: 429 });
      const n = new URL(String(url)).searchParams.get('latitude')!.split(',').length;
      return new Response(JSON.stringify({ elevation: Array(n).fill(100) }));
    });
    vi.stubGlobal('fetch', fetchMock);
    const heights = await elevationsAlong(path, 150);
    expect(heights).toHaveLength(150);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("doesn't remember a failure, so the next look tries again", async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('down', { status: 503 })));
    expect(await elevationsAlong(path, 7)).toBeNull();
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ height: Array(7).fill(50) }))));
    expect(await elevationsAlong(path, 7)).toEqual(Array(7).fill(50));
  });
});
