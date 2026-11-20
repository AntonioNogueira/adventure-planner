// Journeys for the Inspiration map: famous trips (built into public/inspiration by scripts/inspiration/build.mjs)
// and, later, journeys published with the import tool. Loaded on demand.

/** 'unknown': the sources don't say how they got there (an ocean crossing, a gap in the record): drawn dashed. */
export type LegKind = 'ride' | 'walk' | 'truck' | 'bus' | 'train' | 'ferry' | 'boat' | 'flight' | 'unknown';
export interface JourneyPhoto { url: string; page?: string; source?: string; credit?: string; license?: string; /** 'book': a book cover (shown whole, not cropped). */ kind?: 'book' }
export interface JourneyStop {
  name: string;
  /** What to look up to plan a trip from here (a geocodable place). */
  place?: string;
  at: [number, number];
  date?: string;
  text: string;
  /** How they got here from the previous stop (default: rode). */
  by?: LegKind;
  photo?: JourneyPhoto;
  /** A recent trip report or guide that passes here (classic routes). */
  source?: { label: string; url: string };
  /** The video episode filmed here (travellers' channels). */
  video?: { label: string; url: string };
}
export interface JourneyLeg { by: LegKind; km: number; line: [number, number][] }
export interface JourneySummary {
  id: string;
  title: string;
  who: string;
  when: string;
  vehicle: string;
  kind: string;
  color: string;
  summary: string;
  sources: { label: string; url: string }[];
  approximate?: string;
  /** Books, films, free texts, shops and channels about this journey. */
  media?: import('./affiliate').MediaItem[];
  km: number;
  bbox: [number, number, number, number];
  stopCount: number;
  cover?: JourneyPhoto | null;
  /** A light version of the line, for the overview of all journeys: one piece per stretch over land (ocean
   *  crossings and long legs of unknown route are left out). */
  overview: [number, number][][];
}
export interface Journey extends Omit<JourneySummary, 'stopCount' | 'cover' | 'overview'> {
  /** Published with the import tool (stored in Firestore), not built into the app. */
  imported?: boolean;
  stops: JourneyStop[];
  legs: JourneyLeg[];
}

/** Legs on roads are drawn solid; boats, trains and flights dashed. */
export const ON_ROAD = new Set<LegKind>(['ride', 'walk', 'truck', 'bus']);

/** Legs not drawn on the map: ocean crossings and long legs of unknown route (a straight line across the globe says
 *  nothing and makes round-the-world trips look jumpy). */
export const isJumpLeg = (l: { by: string; km: number }) => !ON_ROAD.has(l.by as LegKind) && l.km > 2500;

/** The overview as pieces; older data saved it as one line. */
function overviewParts(o: unknown): [number, number][][] {
  if (!Array.isArray(o) || !o.length) return [];
  return typeof (o as unknown[][])[0]?.[0] === 'number' ? [o as [number, number][]] : (o as [number, number][][]);
}

/** The pieces of a journey's line over land, from its legs (consecutive drawn legs joined). */
export function landPieces(legs: { by: string; km: number; line: [number, number][] }[]): [number, number][][] {
  const parts: [number, number][][] = [];
  let cur: [number, number][] = [];
  for (const l of legs) {
    if (isJumpLeg(l)) { if (cur.length > 1) parts.push(cur); cur = []; continue; }
    cur = cur.concat(l.line);
  }
  if (cur.length > 1) parts.push(cur);
  // A journey that is all crossing (a row across an ocean) is drawn as it is.
  if (!parts.length) parts.push(legs.flatMap(l => l.line));
  return parts;
}

/** How a leg was travelled, in words ("by ferry"); riding needs no note. */
export const LEG_WORDS: Record<LegKind, string> = {
  ride: '', walk: 'on foot', truck: 'by truck', bus: 'by bus', train: 'by train', ferry: 'by ferry', boat: 'by boat', flight: 'by plane', unknown: '',
};

/** Longitudes made continuous (no jump of more than 180°), so a line across the Pacific crosses it instead of
 *  streaking round the whole world; the map draws longitudes beyond ±180 on the next copy of the world. */
export function unwrapLine(line: [number, number][], start?: number): [number, number][] {
  let prev = start;
  return line.map(([lat, lng]) => {
    let x = lng;
    if (prev !== undefined) { while (x - prev > 180) x -= 360; while (x - prev < -180) x += 360; }
    prev = x;
    return [lat, x];
  });
}

/** A journey with continuous longitudes along its legs, its stops on the same copy of the world, and its bounds. */
export function unwrapJourney(j: Journey): Journey {
  let prev: number | undefined = j.stops[0]?.at[1];
  const legs = j.legs.map(l => { const line = unwrapLine(l.line, prev); prev = line[line.length - 1]?.[1] ?? prev; return { ...l, line }; });
  const shift = (lng: number, near: number) => { let x = lng; while (x - near > 180) x -= 360; while (x - near < -180) x += 360; return x; };
  const stops = j.stops.map((s, i) => {
    const ref = i === 0 ? s.at[1] : legs[i - 1]?.line[legs[i - 1].line.length - 1]?.[1] ?? s.at[1];
    return { ...s, at: [s.at[0], shift(s.at[1], ref)] as [number, number] };
  });
  const all = legs.flatMap(l => l.line);
  const lats = all.map(p => p[0]), lngs = all.map(p => p[1]);
  return all.length ? { ...j, legs, stops, bbox: [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)] } : j;
}

let index: Promise<JourneySummary[]> | null = null;
const journeys = new Map<string, Promise<Journey>>();

export function loadJourneys(): Promise<JourneySummary[]> {
  index ??= fetch('/inspiration/index.json').then(r => {
    if (!r.ok) throw new Error(`Journeys ${r.status}`);
    return r.json();
  }).then((list: JourneySummary[]) => list.map(j => ({ ...j, overview: overviewParts(j.overview as unknown).map(p => unwrapLine(p)) }))).catch(err => { index = null; throw err; });
  return index;
}

export function loadJourney(id: string): Promise<Journey> {
  if (!journeys.has(id)) {
    journeys.set(id, fetch(`/inspiration/${encodeURIComponent(id)}.json`).then(r => {
      if (!r.ok) throw new Error(`Journey ${r.status}`);
      return r.json();
    }).then(unwrapJourney).catch(err => { journeys.delete(id); throw err; }));
  }
  return journeys.get(id)!;
}

/** The planner request for riding one stretch of a journey yourself. */
export function sectionPrompt(journey: Pick<Journey, 'title' | 'kind'>, from: JourneyStop, to: JourneyStop): string {
  const how = journey.kind === 'moto' ? 'by adventure motorcycle' : journey.kind === 'bike' ? 'by bike' : journey.kind === 'walk' ? 'on foot' : journey.kind === 'car' ? 'by car' : journey.kind === 'rally' ? 'by adventure motorcycle or 4x4' : 'by 4x4';
  return `${from.place || from.name} to ${to.place || to.name} ${how}, following ${journey.title}`;
}
