// Per-segment details for the map's segment popup: terrain for bike/hike, roads for moto/car.
// Pure functions, unit-tested.
import { climbStats } from './elevation';

export interface TerrainStats {
  ascent: number;
  descent: number;
  highest: number;
  lowest: number;
  /** Steepest climb over about 1 km, in %. */
  steepestPct: number;
  /** km climbing steeper than 6%. */
  kmOver6: number;
}

/** Gradient (%) between consecutive evenly spaced samples along `totalKm`. */
export function gradients(elevations: number[], totalKm: number): number[] {
  const stepM = (totalKm * 1000) / Math.max(1, elevations.length - 1);
  return elevations.slice(1).map((e, i) => ((e - elevations[i]) / stepM) * 100);
}

export function terrainStats(elevations: number[], totalKm: number): TerrainStats {
  const { ascent, descent } = climbStats(elevations);
  const stepKm = totalKm / Math.max(1, elevations.length - 1);
  // Average over a ~1 km window so single noisy samples don't create 30% "walls".
  const window = Math.max(1, Math.round(1 / stepKm));
  let steepest = 0;
  for (let i = window; i < elevations.length; i++) {
    steepest = Math.max(steepest, ((elevations[i] - elevations[i - window]) / (window * stepKm * 1000)) * 100);
  }
  const kmOver6 = gradients(elevations, totalKm).filter(g => g > 6).length * stepKm;
  return {
    ascent,
    descent,
    highest: Math.round(Math.max(...elevations)),
    lowest: Math.round(Math.min(...elevations)),
    steepestPct: Math.round(steepest * 10) / 10,
    kmOver6: Math.round(kmOver6 * 10) / 10,
  };
}

/** Colour for a gradient: flat, moderate, steep, very steep. */
export function gradientColor(pct: number): string {
  if (pct > 10) return '#9b2c22';
  if (pct > 6) return '#c56a2c';
  if (pct > 3) return '#c9a227';
  return '#6f8f5a';
}

// Road numbers such as A-4, AP-7, N-340, E-15, SS1, D6098, M25, I-95.
const ROAD_REF = /\b(?:AP|[ADEIMNS]|SS|SP|SR|RN|RD|CV|GR|HU|MA|SE|CA|C|IC|IP|EN|ER)-?\d{1,4}[A-Za-z]?\b/;
// Motorways and similar fast roads.
const FAST_ROAD = /^(?:AP|A|M|E|I|IP|SS)-?\d|autopista|autov[ií]a|autoroute|autostrada|motorway|autoestrada/i;

export interface RoadShare { road: string; km: number }

const stripHtml = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

/** Main roads by distance, and the share on motorways, from the route's turn-by-turn steps. */
export function roadSummary(steps: { instruction: string; distanceMeters: number; ferry?: boolean }[]) {
  const byRoad = new Map<string, number>();
  let fastKm = 0;
  let totalKm = 0;
  let ferryKm = 0;
  for (const step of steps) {
    const km = step.distanceMeters / 1000;
    if (step.ferry) { ferryKm += km; continue; }
    totalKm += km;
    const text = stripHtml(step.instruction);
    const road = text.match(ROAD_REF)?.[0].toUpperCase().replace(/^([A-Z]+)(\d)/, '$1-$2') || 'Local roads';
    byRoad.set(road, (byRoad.get(road) || 0) + km);
    if (FAST_ROAD.test(road) || FAST_ROAD.test(text)) fastKm += km;
  }
  const roads: RoadShare[] = [...byRoad.entries()]
    .map(([road, km]) => ({ road, km: Math.round(km) }))
    .filter(r => r.km > 0)
    .sort((a, b) => b.km - a.km);
  return {
    roads: roads.slice(0, 5),
    motorwayPct: totalKm ? Math.round((fastKm / totalKm) * 100) : 0,
    ferryKm: Math.round(ferryKm),
  };
}

/** Average moving speed in km/h. */
export function averageSpeed(distanceMeters: number, durationSeconds: number) {
  return durationSeconds ? Math.round((distanceMeters / 1000) / (durationSeconds / 3600)) : 0;
}
