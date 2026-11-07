import { describe, expect, it } from 'vitest';
import { terrainStats, gradients, gradientColor, roadSummary, averageSpeed } from '../terrain';

describe('terrainStats', () => {
  it('finds climbing, extremes and the steepest kilometre', () => {
    // 10 km in 0.5 km samples: flat 2 km, then +80 m per 0.5 km for 2 km (16%), then flat.
    const elevations = [0, 0, 0, 0, 0, 80, 160, 240, 320, 320, 320, 320, 320, 320, 320, 320, 320, 320, 320, 320, 320];
    const stats = terrainStats(elevations, 10);
    expect(stats).toMatchObject({ ascent: 320, descent: 0, highest: 320, lowest: 0 });
    expect(stats.steepestPct).toBeCloseTo(16, 0);
    expect(stats.kmOver6).toBe(2);
  });
});

describe('gradients / colours', () => {
  it('computes percent grade between samples', () => {
    expect(gradients([0, 10, 10], 0.2)).toEqual([10, 0]);
  });
  it('colours flat to very steep', () => {
    expect(gradientColor(1)).toBe('#6f8f5a');
    expect(gradientColor(5)).toBe('#c9a227');
    expect(gradientColor(8)).toBe('#c56a2c');
    expect(gradientColor(12)).toBe('#9b2c22');
  });
});

describe('roadSummary', () => {
  it('ranks roads by distance and measures the motorway share', () => {
    const summary = roadSummary([
      { instruction: 'Head north on <b>Calle Real</b>', distanceMeters: 2000 },
      { instruction: 'Take <b>AP-7</b> toward Valencia', distanceMeters: 60000 },
      { instruction: 'Exit onto <b>N-340</b>', distanceMeters: 30000 },
      { instruction: 'Continue on n340', distanceMeters: 8000 },
      { instruction: 'Take the ferry', distanceMeters: 50000, ferry: true },
    ]);
    expect(summary.roads[0]).toEqual({ road: 'AP-7', km: 60 });
    expect(summary.roads.find(r => r.road === 'N-340')?.km).toBe(30);
    expect(summary.motorwayPct).toBe(60);
    expect(summary.ferryKm).toBe(50);
  });
});

describe('averageSpeed', () => {
  it('is km per hour', () => {
    expect(averageSpeed(150000, 7200)).toBe(75);
    expect(averageSpeed(1000, 0)).toBe(0);
  });
});
