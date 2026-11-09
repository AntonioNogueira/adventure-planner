// Voice turn-by-turn for ride mode.
// Turns come from Valhalla (VALHALLA_URL; by default the FOSSGIS public server): `trace_route` matches the day's path (whatever made it: Google,
// OSRM, BRouter) to OpenStreetMap roads and returns the manoeuvres with spoken sentences in the user's language.
// If that fails (no connection, unmatched track), turns are worked out from the path's own bends.
// The browser's speech synthesis reads them out (works on iPhone and Android while the app is open).
import { LatLng, haversineKm, downsample } from './geo';
import { splitPath } from './osmRoads';
import { decodePolyline6 } from './osrm';
import { cumulativeKm } from './ride';
import { Language, Units, t } from './settings';
import { SERVICES } from './services';

export type TurnKind = 'left' | 'right' | 'slight-left' | 'slight-right' | 'sharp-left' | 'sharp-right'
  | 'straight' | 'uturn' | 'roundabout' | 'arrive' | 'ferry' | 'keep-left' | 'keep-right';

export interface Turn {
  /** km from the start of the path. */
  km: number;
  at: LatLng;
  kind: TurnKind;
  /** Written instruction, e.g. "Turn right onto N2." */
  text: string;
  /** Short spoken form for the early warning, e.g. "Turn right onto N2." */
  alert: string;
  /** Spoken just before the turn. */
  now: string;
  /** Not announced (continue / name changes / leaving a roundabout): shown only. */
  quiet?: boolean;
}

const TRACE = `${SERVICES.valhalla}/trace_route`;
const ROUTE = `${SERVICES.valhalla}/route`;
const MAX_PART_KM = 150;

const VALHALLA_LANG: Record<Language, string> = { en: 'en-GB', 'pt-PT': 'pt-PT', 'pt-BR': 'pt-BR' };

/** Valhalla manoeuvre types → our kinds (null = the start, not a turn). */
export function kindOf(type: number): TurnKind | null {
  switch (type) {
    case 1: case 2: case 3: return null;
    case 4: case 5: case 6: return 'arrive';
    case 9: return 'slight-right';
    case 10: case 18: case 20: return 'right';
    case 11: return 'sharp-right';
    case 12: case 13: return 'uturn';
    case 14: return 'sharp-left';
    case 15: case 19: case 21: return 'left';
    case 16: return 'slight-left';
    case 23: case 37: return 'keep-right';
    case 24: case 38: return 'keep-left';
    case 26: case 27: return 'roundabout';
    case 28: case 29: return 'ferry';
    default: return 'straight';
  }
}

/** Manoeuvres that only confirm the road (continue, name changes, roundabout exit): no voice. */
const QUIET = new Set([7, 8, 22, 25, 27]);

interface Maneuver {
  type: number; length: number; begin_shape_index: number; instruction: string;
  verbal_transition_alert_instruction?: string; verbal_pre_transition_instruction?: string;
}

/** Valhalla joins sentences as "… Depois Vire à esquerda": lower-case after the joining word, single spaces. */
export function tidy(text: string): string {
  return text.replace(/\s+/g, ' ').replace(/\b(Depois|Então|Then) (\p{Lu})/gu, (_, w, c) => `${w} ${c.toLocaleLowerCase()}`).trim();
}

/** Turn list from Valhalla's manoeuvres, placed along our path starting at `offsetKm`. */
export function turnsFromManeuvers(maneuvers: Maneuver[], shape: LatLng[], offsetKm: number): Turn[] {
  const out: Turn[] = [];
  let km = offsetKm;
  for (const m of maneuvers) {
    const kind = kindOf(m.type);
    if (kind) {
      out.push({
        km, kind,
        at: shape[Math.min(m.begin_shape_index, shape.length - 1)] || shape[shape.length - 1],
        text: tidy(m.instruction),
        alert: tidy(m.verbal_transition_alert_instruction || m.verbal_pre_transition_instruction || m.instruction),
        now: tidy(m.verbal_pre_transition_instruction || m.instruction),
        quiet: QUIET.has(m.type) || undefined,
      });
    }
    km += m.length || 0;
  }
  return out;
}

function costing(travelMode: string, offroad?: boolean): string {
  if (travelMode === 'WALKING') return 'pedestrian';
  if (travelMode === 'BICYCLING') return 'bicycle';
  // Off-road days follow tracks a car profile won't match; the bicycle profile does (its turn words are the same).
  return offroad ? 'bicycle' : 'auto';
}

const cache = new Map<string, Promise<Turn[]>>();

/** The day's turns, with spoken text in the user's language. Never rejects: falls back to the path's bends. */
export function dayTurns(path: LatLng[], opts: { travelMode: string; offroad?: boolean; language: Language; units: Units; destination?: string }): Promise<Turn[]> {
  if (path.length < 2) return Promise.resolve([]);
  const key = [opts.travelMode, opts.offroad, opts.language, opts.units, path.length, path[0].lat, path[0].lng, path[path.length - 1].lat].join('|');
  if (!cache.has(key)) {
    const pending = fetchTurns(path, opts).catch(err => {
      console.warn('Turn instructions unavailable, using the route shape:', err);
      cache.delete(key);
      return bendTurns(path, opts.destination);
    });
    cache.set(key, pending);
  }
  return cache.get(key)!;
}

async function fetchTurns(path: LatLng[], opts: { travelMode: string; offroad?: boolean; language: Language; units: Units }): Promise<Turn[]> {
  const cum = cumulativeKm(path);
  const parts = splitPath(path, MAX_PART_KM);
  const turns: Turn[] = [];
  let startIndex = 0;
  for (let p = 0; p < parts.length; p++) {
    const part = parts[p];
    const res = await fetch(TRACE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shape: downsample(part, 1500).map(q => ({ lat: q.lat, lon: q.lng })),
        costing: costing(opts.travelMode, opts.offroad),
        shape_match: 'map_snap',
        directions_options: { language: VALHALLA_LANG[opts.language], units: opts.units === 'imperial' ? 'miles' : 'kilometers' },
      }),
    });
    if (!res.ok) throw new Error(`Valhalla ${res.status}`);
    const legs: { maneuvers: Maneuver[]; shape: string }[] = (await res.json()).trip?.legs || [];
    const toKm = opts.units === 'imperial' ? 1.609344 : 1;
    for (const leg of legs) {
      const shape = decodePolyline6(leg.shape);
      const maneuvers = leg.maneuvers.map(m => ({ ...m, length: (m.length || 0) * toKm }));
      let found = turnsFromManeuvers(maneuvers, shape, cum[startIndex]);
      // Parts join end to start: only the last part keeps its "you have arrived".
      if (p < parts.length - 1) found = found.filter(x => x.kind !== 'arrive');
      turns.push(...found);
    }
    startIndex += part.length - 1;
  }
  if (!turns.length) throw new Error('no manoeuvres');
  return turns;
}

/** From where you are back to the route (off-route), with spoken text. Null if the service can't help. */
export async function rejoinTurns(from: LatLng, to: LatLng, opts: { travelMode: string; offroad?: boolean; language: Language; units: Units }): Promise<{ path: LatLng[]; turns: Turn[] } | null> {
  try {
    const res = await fetch(ROUTE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        locations: [{ lat: from.lat, lon: from.lng }, { lat: to.lat, lon: to.lng }],
        costing: costing(opts.travelMode, opts.offroad),
        directions_options: { language: VALHALLA_LANG[opts.language], units: 'kilometers' },
      }),
    });
    if (!res.ok) return null;
    const leg = (await res.json()).trip?.legs?.[0];
    if (!leg) return null;
    const path = decodePolyline6(leg.shape);
    // The end of a rejoin is the route, not the day's destination.
    const turns = turnsFromManeuvers(leg.maneuvers, path, 0).filter(x => x.kind !== 'arrive');
    return { path, turns };
  } catch {
    return null;
  }
}

// ---- Fallback: turns from the path's bends ----

const bearing = (a: LatLng, b: LatLng) => {
  const toRad = Math.PI / 180;
  const y = Math.sin((b.lng - a.lng) * toRad) * Math.cos(b.lat * toRad);
  const x = Math.cos(a.lat * toRad) * Math.sin(b.lat * toRad) - Math.sin(a.lat * toRad) * Math.cos(b.lat * toRad) * Math.cos((b.lng - a.lng) * toRad);
  return (Math.atan2(y, x) * 180) / Math.PI;
};
const turnAngle = (before: number, after: number) => ((after - before + 540) % 360) - 180;

const BEND_TEXT: Record<string, () => string> = {
  'slight-left': () => t('Bear left'), 'slight-right': () => t('Bear right'),
  left: () => t('Turn left'), right: () => t('Turn right'),
  'sharp-left': () => t('Sharp left'), 'sharp-right': () => t('Sharp right'), uturn: () => t('Make a U-turn'),
};

function bendKind(angle: number): TurnKind {
  const a = Math.abs(angle);
  const side = angle < 0 ? 'left' : 'right';
  if (a > 160) return 'uturn';
  if (a > 115) return `sharp-${side}` as TurnKind;
  if (a > 55) return side;
  return `slight-${side}` as TurnKind;
}

/** Turns where the path bends by more than ~35° over ~50 m (bends closer than 80 m merged). */
export function bendTurns(path: LatLng[], destination?: string): Turn[] {
  const cum = cumulativeKm(path);
  const total = cum[cum.length - 1] || 0;
  const LOOK = 0.05;
  const found: { i: number; angle: number }[] = [];
  let back = 0, ahead = 0;
  for (let i = 1; i < path.length - 1; i++) {
    while (back < i && cum[i] - cum[back + 1] >= LOOK) back++;
    if (ahead < i) ahead = i;
    while (ahead < path.length - 1 && cum[ahead] - cum[i] < LOOK) ahead++;
    if (cum[i] - cum[back] < LOOK * 0.6 || cum[ahead] - cum[i] < LOOK * 0.6) continue;
    const angle = turnAngle(bearing(path[back], path[i]), bearing(path[i], path[ahead]));
    if (Math.abs(angle) < 35) continue;
    const last = found[found.length - 1];
    if (last && cum[i] - cum[last.i] < 0.08) { if (Math.abs(angle) > Math.abs(last.angle)) found[found.length - 1] = { i, angle }; }
    else found.push({ i, angle });
  }
  const turns: Turn[] = found.map(({ i, angle }) => {
    const kind = bendKind(angle);
    const text = BEND_TEXT[kind]();
    return { km: cum[i], at: path[i], kind, text, alert: text, now: text };
  });
  const arrive = destination ? t('You have arrived at {place}', { place: destination }) : t('You have arrived');
  turns.push({ km: total, at: path[path.length - 1], kind: 'arrive', text: arrive, alert: arrive, now: arrive });
  return turns;
}

// ---- What to say, and when ----

/** Spoken distance: "500 metres", "1.5 kilometres", "600 feet", "2 miles". */
export function spokenDistance(km: number, units: Units, locale: string): string {
  const num = (n: number, d = 0) => n.toLocaleString(locale, { maximumFractionDigits: d });
  if (units === 'imperial') {
    const mi = km / 1.609344;
    if (mi < 0.2) return t('{n} feet', { n: num(Math.max(100, Math.round((mi * 5280) / 100) * 100)) });
    return mi < 0.95 ? t('{n} miles', { n: num(mi, 1) }) : mi < 1.05 ? t('1 mile') : t('{n} miles', { n: num(mi, mi < 10 ? 1 : 0) });
  }
  if (km < 0.95) return t('{n} metres', { n: num(Math.max(50, Math.round((km * 1000) / (km < 0.3 ? 50 : 100)) * (km < 0.3 ? 50 : 100))) });
  return km < 1.05 ? t('1 kilometre') : t('{n} kilometres', { n: num(km, km < 10 ? 1 : 0) });
}

/** How early to warn at this speed: far (km) and near (km). */
export function warnDistances(kmh: number): { far: number; near: number } {
  if (kmh > 90) return { far: 2, near: 0.3 };
  if (kmh > 50) return { far: 1, near: 0.2 };
  if (kmh > 25) return { far: 0.5, near: 0.1 };
  return { far: 0.25, near: 0.05 };
}

export interface Announcement { key: string; text: string }

const lowerFirst = (s: string) => s.charAt(0).toLocaleLowerCase() + s.slice(1);

/**
 * The next thing to say, if any: an early warning ("In 500 metres, turn right onto N2") then the turn itself.
 * `said` holds keys already spoken, so each is said once.
 */
export function nextAnnouncement(turns: Turn[], alongKm: number, kmh: number, said: Set<string>, units: Units, locale: string): Announcement | null {
  const next = turns.find(x => !x.quiet && x.km > alongKm - 0.01);
  if (!next) return null;
  const d = next.km - alongKm;
  const { far, near } = warnDistances(kmh);
  const id = `${next.km.toFixed(3)}`;
  if (d <= near && !said.has(`${id}:now`)) return { key: `${id}:now`, text: next.now };
  // The early warning only if there's still time for it (and not for the arrival, said once at the end).
  if (d <= far && d > near * 1.5 && next.kind !== 'arrive' && !said.has(`${id}:far`) && !said.has(`${id}:now`)) {
    return { key: `${id}:far`, text: `${t('In {d},', { d: spokenDistance(d, units, locale) })} ${lowerFirst(next.alert)}` };
  }
  return null;
}

/** The next announced turn ahead (for the panel). */
export function nextTurn(turns: Turn[], alongKm: number): Turn | undefined {
  return turns.find(x => !x.quiet && x.km > alongKm - 0.01);
}

// ---- Speaking ----

const VOICE_LANG: Record<Language, string[]> = { en: ['en-GB', 'en-US', 'en'], 'pt-PT': ['pt-PT', 'pt'], 'pt-BR': ['pt-BR', 'pt'] };

export function canSpeak(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

function pickVoice(language: Language): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  for (const tag of VOICE_LANG[language]) {
    const v = voices.find(x => x.lang.replace('_', '-').toLowerCase().startsWith(tag.toLowerCase()));
    if (v) return v;
  }
  return undefined;
}

/** Say it now (cuts off anything still being said). */
export function speak(text: string, language: Language) {
  if (!canSpeak() || !text) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = VOICE_LANG[language][0];
  const voice = pickVoice(language);
  if (voice) u.voice = voice;
  u.rate = 1;
  synth.speak(u);
}
