// The traveller's profile: how they like to travel, learned from their plans and corrections, per travel style
// (a gravel rider who also goes bikepacking on a mountain bike, rides an adventure motorcycle and sometimes takes the
// family in a campervan has a set of habits for each). It's sent to the AI as defaults for the next trip, so the
// planner asks less and fits them better. Kept in this browser and, when logged in, on their account.
// The traveller can see each style, correct its values, and forget one or all of them (Settings).
import type { TripIntent, VehicleInfo, Interest } from '../types';

export type TravelMode = 'BICYCLING' | 'WALKING' | 'DRIVING';

export interface ModeHabits {
  ride?: string;
  dailyKm?: number;
  lodging?: string;
  party?: string;
  interests?: Interest[];
  budgetStyle?: string;
  maxStayPrice?: number;
  vehicle?: string;
  vehicleModel?: string;
  vehicleInfo?: VehicleInfo;
  offroad?: boolean;
  /** How many plans these habits come from. */
  trips: number;
}

/** One travel style's habits (e.g. "bike-gravel", "moto-adventure", "camper+family"). */
export interface StyleHabits extends ModeHabits {
  mode: TravelMode;
  updatedAt: number;
}

export interface TravellerProfile {
  styles: Record<string, StyleHabits>;
  /** The style they used last (a default when a request doesn't say how they travel). */
  lastStyle?: string;
  /** Lasting preferences in their words, newest first ("sections of 40 km max", "no main roads"). */
  notes: string[];
  updatedAt: number;
}

/** The first version (one set of habits per travel mode), read once and turned into styles. */
interface LegacyProfile { modes?: Partial<Record<TravelMode, ModeHabits>>; lastMode?: string }

const KEY = 'adventure-planner.profile';
const MAX_NOTES = 10;
const MAX_STYLES = 12;
export const emptyProfile = (): TravellerProfile => ({ styles: {}, notes: [], updatedAt: 0 });

const BIKE_RIDES = ['road', 'gravel', 'mtb', 'emtb', 'touring'];
const MOTO_RIDES = ['adventure', 'enduro', 'touring', 'road'];

/** The travel style of a trip: how they travel, on what, and whether it's a family trip (a different pace). */
export function styleKey(intent: Pick<TripIntent, 'travelMode'> & Partial<Pick<TripIntent, 'ride' | 'vehicle' | 'days' | 'party'>>): string | null {
  let key: string;
  if (intent.travelMode === 'BICYCLING') key = BIKE_RIDES.includes(intent.ride || '') ? `bike-${intent.ride}` : 'bike';
  else if (intent.travelMode === 'WALKING') key = intent.days && intent.days <= 2 ? 'walk-day' : 'walk-trek';
  else if (intent.travelMode === 'DRIVING') {
    const v = intent.vehicle || '';
    key = v.startsWith('motorcycle') || (!v && MOTO_RIDES.includes(intent.ride || ''))
      ? `moto-${MOTO_RIDES.includes(intent.ride || '') ? intent.ride : 'adventure'}`
      : v === 'car' || v === 'suv' ? 'car' : v === '4x4' || v === 'truck' ? '4x4' : v === 'campervan' ? 'camper' : 'drive';
  } else return null;
  return intent.party === 'family' ? `${key}+family` : key;
}

/** The travel mode a style belongs to. */
export const styleMode = (key: string): TravelMode => (key.startsWith('bike') ? 'BICYCLING' : key.startsWith('walk') ? 'WALKING' : 'DRIVING');

/** A profile in the current shape (an old one's per-mode habits become styles). */
export function normalize(raw: unknown): TravellerProfile {
  const p = (raw && typeof raw === 'object' ? raw : {}) as Partial<TravellerProfile> & LegacyProfile;
  const styles: Record<string, StyleHabits> = { ...(p.styles || {}) };
  let lastStyle = p.lastStyle;
  for (const [mode, h] of Object.entries(p.modes || {}) as [TravelMode, ModeHabits | undefined][]) {
    if (!h) continue;
    const key = styleKey({ travelMode: mode, ride: h.ride as TripIntent['ride'], vehicle: h.vehicle as TripIntent['vehicle'], party: h.party as TripIntent['party'] });
    if (key && !styles[key]) styles[key] = { ...h, mode, updatedAt: p.updatedAt || 0 };
    if (!lastStyle && p.lastMode === mode && key) lastStyle = key;
  }
  return { styles, lastStyle, notes: Array.isArray(p.notes) ? p.notes : [], updatedAt: p.updatedAt || 0 };
}

let current: TravellerProfile = load();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());

function load(): TravellerProfile {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
    return raw ? normalize(JSON.parse(raw)) : emptyProfile();
  } catch { return emptyProfile(); }
}

function store(p: TravellerProfile) {
  current = p;
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* private mode: kept for this visit */ }
  emit();
}

export function getProfile(): TravellerProfile { return current; }
export function onProfileChange(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; }
export function hasProfile(p = current): boolean { return Object.keys(p.styles).length > 0 || p.notes.length > 0; }

/** The styles, most recently used first. */
export function stylesByRecent(p = current): [string, StyleHabits][] {
  return Object.entries(p.styles).sort((a, b) => (b[1].updatedAt || 0) - (a[1].updatedAt || 0));
}

/** The habits to start a trip from: that exact style, else the latest of that travel mode (manual planning). */
export function habitsFor(travelMode: string, intent: Partial<Pick<TripIntent, 'ride' | 'vehicle' | 'days' | 'party'>> = {}, p = current): StyleHabits | undefined {
  const key = styleKey({ travelMode, ...intent });
  return (key && p.styles[key]) || stylesByRecent(p).find(([, h]) => h.mode === travelMode)?.[1];
}

/** What a finished plan teaches: the choices it settled (stated or answered), never the app's guesses. */
export function learnFromPlan(p: TravellerProfile, intent: TripIntent, notes: string[] = [], newTrip = true): TravellerProfile {
  const key = styleKey(intent);
  if (!key) return p;
  const before = p.styles[key] || { trips: 0, mode: styleMode(key), updatedAt: 0 };
  const now = Date.now();
  const habits: StyleHabits = {
    ...before,
    mode: styleMode(key),
    trips: before.trips + (newTrip ? 1 : 0),
    updatedAt: now,
    ...(intent.ride ? { ride: intent.ride } : {}),
    ...(intent.dailyKm ? { dailyKm: intent.dailyKm } : {}),
    ...(intent.lodging && intent.lodging !== 'any' ? { lodging: intent.lodging } : {}),
    ...(intent.party ? { party: intent.party } : {}),
    ...(intent.interests?.length ? { interests: intent.interests } : {}),
    ...(intent.budgetStyle ? { budgetStyle: intent.budgetStyle } : {}),
    ...(intent.maxStayPrice ? { maxStayPrice: intent.maxStayPrice } : {}),
    ...(intent.vehicle ? { vehicle: intent.vehicle } : {}),
    ...(intent.vehicleModel ? { vehicleModel: intent.vehicleModel, vehicleInfo: intent.vehicleInfo } : {}),
    ...(intent.offroad !== undefined ? { offroad: intent.offroad } : {}),
  };
  // Keep the profile small: the least recently used styles go first.
  const styles = Object.fromEntries([[key, habits] as [string, StyleHabits], ...stylesByRecent(p).filter(([k]) => k !== key)].slice(0, MAX_STYLES));
  const fresh = notes.map(n => n.trim()).filter(n => n && n.length <= 120);
  const kept = p.notes.filter(n => !fresh.some(f => f.toLowerCase() === n.toLowerCase()));
  return { styles, lastStyle: key, notes: [...fresh, ...kept].slice(0, MAX_NOTES), updatedAt: now };
}

export function rememberPlan(intent: TripIntent, notes: string[] = [], newTrip = true) { store(learnFromPlan(current, intent, notes, newTrip)); }

/** The traveller corrects a style's value (e.g. 70 km a day instead of 50); undefined clears it. */
export function editStyle(key: string, change: Partial<Pick<ModeHabits, 'dailyKm' | 'lodging' | 'party' | 'budgetStyle' | 'ride' | 'vehicleModel'>>) {
  const h = current.styles[key];
  if (!h) return;
  const next: StyleHabits = { ...h, ...change };
  for (const [k, v] of Object.entries(change)) if (v === undefined || v === '' || v === 0) delete (next as unknown as Record<string, unknown>)[k];
  store({ ...current, styles: { ...current.styles, [key]: next }, updatedAt: Date.now() });
}

/** Forget one style. */
export function forgetStyle(key: string) {
  const { [key]: _gone, ...styles } = current.styles;
  store({ ...current, styles, lastStyle: current.lastStyle === key ? stylesByRecent({ ...current, styles })[0]?.[0] : current.lastStyle, updatedAt: Date.now() });
}

/** Forget one of their own preferences ("no main roads"). */
export function forgetNote(note: string) {
  store({ ...current, notes: current.notes.filter(n => n !== note), updatedAt: Date.now() });
}

export function forgetProfile() { store({ ...emptyProfile(), updatedAt: Date.now() }); }

/** The newer of two copies (this browser's and the account's), so either can be ahead. */
export function newer(a: TravellerProfile | null | undefined, b: TravellerProfile | null | undefined): TravellerProfile {
  if (!a) return b || emptyProfile();
  if (!b) return a;
  return (b.updatedAt || 0) > (a.updatedAt || 0) ? b : a;
}

/** Take the account's copy if it's newer (after logging in). */
export function adoptProfile(raw: unknown) {
  if (!raw) return;
  const chosen = newer(current, normalize(raw));
  if (chosen !== current) store(chosen);
}

/** What the AI gets: compact, without counters. Null when there's nothing yet. */
export function profileForAI(p = current): Record<string, unknown> | null {
  if (!hasProfile(p)) return null;
  const styles = Object.fromEntries(stylesByRecent(p).map(([key, h]) => {
    const { trips: _t, vehicleInfo: _v, updatedAt: _u, mode, ...rest } = h;
    return [key, { travelMode: mode, ...rest }];
  }));
  return { usualStyle: p.lastStyle, habitsByStyle: styles, preferences: p.notes };
}
