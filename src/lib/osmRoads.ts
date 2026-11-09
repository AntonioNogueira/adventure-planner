// Speed limits, road surface and road types along a route, from OpenStreetMap data,
// via the free Valhalla service run by FOSSGIS (fair use; self-host Valhalla for heavy traffic).
import { LatLng, haversineKm, downsample } from './geo';
import { SERVICES } from './services';

const VALHALLA = `${SERVICES.valhalla}/trace_attributes`;
// The public service rejects traces longer than ~200 km, so long days are sent in parts.
const MAX_PART_KM = 150;

export type SurfaceGroup = 'paved' | 'rough' | 'gravel' | 'dirt' | 'impassable';

export const SURFACES: Record<SurfaceGroup, { label: string; color: string }> = {
  paved: { label: 'Asphalt', color: '#7c7261' },
  rough: { label: 'Rough asphalt', color: '#b3a994' },
  gravel: { label: 'Gravel / compacted', color: '#c08a3e' },
  dirt: { label: 'Dirt / path', color: '#7a4a22' },
  impassable: { label: 'Impassable', color: '#5c1a14' },
};

const SURFACE_GROUP: Record<string, SurfaceGroup> = {
  paved_smooth: 'paved', paved: 'paved', paved_rough: 'rough',
  compacted: 'gravel', gravel: 'gravel', dirt: 'dirt', path: 'dirt', impassable: 'impassable',
};

export interface Edge { length?: number; speed_limit?: number; surface?: string; road_class?: string; toll?: boolean }

export interface RoadData {
  /** km by speed limit (km/h); 0 = no limit known in OSM. */
  speedLimits: { limit: number; km: number }[];
  surfaces: { group: SurfaceGroup; km: number }[];
  roadClasses: { roadClass: string; km: number }[];
  /** Surface in route order: each run covers fromKm–toKm from the segment's start. */
  surfaceRuns: SurfaceRun[];
  /** km on toll roads (OSM toll=yes). */
  tollKm: number;
  totalKm: number;
}

export interface SurfaceRun { group: SurfaceGroup; fromKm: number; toKm: number }

/** Consecutive edges with the same surface merged into runs, in route order. */
export function surfaceRuns(edges: Edge[]): SurfaceRun[] {
  const runs: SurfaceRun[] = [];
  let at = 0;
  for (const e of edges) {
    const km = e.length || 0;
    if (km <= 0) continue;
    const group = SURFACE_GROUP[e.surface || ''] || 'paved';
    const last = runs[runs.length - 1];
    if (last && last.group === group) last.toKm = at + km;
    else runs.push({ group, fromKm: at, toKm: at + km });
    at += km;
  }
  return runs;
}

const add = <K,>(map: Map<K, number>, key: K, km: number) => map.set(key, (map.get(key) || 0) + km);
const sorted = <K,>(map: Map<K, number>) => [...map.entries()].filter(([, km]) => km >= 0.05).sort((a, b) => b[1] - a[1]);
const round1 = (n: number) => Math.round(n * 10) / 10;

/** Totals by speed limit, surface and road type from Valhalla's matched edges. */
export function summariseEdges(edges: Edge[]): RoadData {
  const speeds = new Map<number, number>();
  const surfaces = new Map<SurfaceGroup, number>();
  const classes = new Map<string, number>();
  let total = 0;
  let toll = 0;
  for (const e of edges) {
    const km = e.length || 0;
    total += km;
    if (e.toll) toll += km;
    add(speeds, e.speed_limit && e.speed_limit < 200 ? e.speed_limit : 0, km);
    add(surfaces, SURFACE_GROUP[e.surface || ''] || 'paved', km);
    add(classes, e.road_class || 'other', km);
  }
  return {
    speedLimits: sorted(speeds).map(([limit, km]) => ({ limit, km: round1(km) })),
    surfaces: sorted(surfaces).map(([group, km]) => ({ group, km: round1(km) })),
    roadClasses: sorted(classes).map(([roadClass, km]) => ({ roadClass, km: round1(km) })),
    surfaceRuns: surfaceRuns(edges),
    tollKm: round1(toll),
    totalKm: round1(total),
  };
}

/** Split a path into consecutive parts of at most `maxKm` (sharing their end points). */
export function splitPath(path: LatLng[], maxKm: number): LatLng[][] {
  const parts: LatLng[][] = [];
  let current: LatLng[] = [path[0]];
  let km = 0;
  for (let i = 1; i < path.length; i++) {
    km += haversineKm(path[i - 1], path[i]);
    current.push(path[i]);
    if (km >= maxKm && i < path.length - 1) {
      parts.push(current);
      current = [path[i]];
      km = 0;
    }
  }
  if (current.length > 1) parts.push(current);
  return parts;
}

const COSTING: Record<string, string> = { DRIVING: 'auto', BICYCLING: 'bicycle', WALKING: 'pedestrian' };
const cache = new Map<string, Promise<RoadData | null>>();

/** Road data for one route segment, or null if the service can't match it. */
export function roadData(path: LatLng[], travelMode: string): Promise<RoadData | null> {
  if (path.length < 2) return Promise.resolve(null);
  const key = `${travelMode}|${path.length}|${path[0].lat},${path[0].lng}|${path[path.length - 1].lat},${path[path.length - 1].lng}`;
  if (!cache.has(key)) {
    const pending = fetchRoadData(path, travelMode);
    cache.set(key, pending);
    pending.then(r => { if (!r) cache.delete(key); });
  }
  return cache.get(key)!;
}

async function fetchRoadData(path: LatLng[], travelMode: string): Promise<RoadData | null> {
  try {
    const parts = splitPath(path, MAX_PART_KM);
    const edges: Edge[] = [];
    for (const part of parts) {
      const res = await fetch(VALHALLA, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shape: downsample(part, 1500).map(p => ({ lat: p.lat, lon: p.lng })),
          costing: COSTING[travelMode] || 'auto',
          shape_match: 'walk_or_snap',
          filters: { attributes: ['edge.length', 'edge.speed_limit', 'edge.surface', 'edge.road_class', 'edge.toll'], action: 'include' },
        }),
      });
      if (!res.ok) throw new Error(`Valhalla ${res.status}`);
      edges.push(...((await res.json()).edges || []));
    }
    return edges.length ? summariseEdges(edges) : null;
  } catch (err) {
    console.warn('OpenStreetMap road data unavailable:', err);
    return null;
  }
}

export const ROAD_CLASS_LABELS: Record<string, string> = {
  motorway: 'Motorway', trunk: 'Expressway', primary: 'Main road', secondary: 'Secondary road',
  tertiary: 'Minor road', unclassified: 'Country lane', residential: 'Residential', service_other: 'Service / track', other: 'Other',
};
