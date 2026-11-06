import { describe, expect, it } from 'vitest';
import { summariseEdges, splitPath } from '../osmRoads';

describe('summariseEdges', () => {
  it('totals km by speed limit, surface group and road type', () => {
    const data = summariseEdges([
      { length: 49.4, speed_limit: 120, surface: 'paved_smooth', road_class: 'motorway' },
      { length: 15.1, speed_limit: 90, surface: 'paved', road_class: 'primary' },
      { length: 3, surface: 'gravel', road_class: 'unclassified' },
      { length: 2, surface: 'compacted', road_class: 'unclassified' },
      { length: 1.5, surface: 'dirt', road_class: 'service_other' },
    ]);
    expect(data.speedLimits).toEqual([{ limit: 120, km: 49.4 }, { limit: 90, km: 15.1 }, { limit: 0, km: 6.5 }]);
    expect(data.surfaces).toEqual([{ group: 'paved', km: 64.5 }, { group: 'gravel', km: 5 }, { group: 'dirt', km: 1.5 }]);
    expect(data.roadClasses[0]).toEqual({ roadClass: 'motorway', km: 49.4 });
    expect(data.totalKm).toBe(71);
  });
});

describe('splitPath', () => {
  it('cuts long paths into parts that share their end points', () => {
    // Points ~11 km apart along a meridian: 31 points ≈ 333 km.
    const path = Array.from({ length: 31 }, (_, i) => ({ lat: 40 + i * 0.1, lng: -3 }));
    const parts = splitPath(path, 150);
    expect(parts.length).toBe(3);
    expect(parts[0][parts[0].length - 1]).toEqual(parts[1][0]);
    expect(parts.flat().length).toBe(31 + parts.length - 1);
  });
  it('keeps short paths whole', () => {
    expect(splitPath([{ lat: 0, lng: 0 }, { lat: 0, lng: 0.1 }], 150)).toHaveLength(1);
  });
});
