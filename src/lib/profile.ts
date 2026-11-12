// The traveller's profile: how they like to travel, learned from their plans and corrections, per way of travelling
// (a bikepacker who also rides a motorcycle has two sets of habits). It's sent to the AI as defaults for the next
// trip, so the planner asks less and fits them better. Kept in this browser and, when logged in, on their account.
// The traveller can see it and forget it (Settings).
import type { TripIntent, VehicleInfo, Interest } from '../types';

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

export interface TravellerProfile {
  modes: Partial<Record<'BICYCLING' | 'WALKING' | 'DRIVING', ModeHabits>>;
  /** The way they travelled last (a default when a request doesn't say). */
  lastMode?: string;
  /** Lasting preferences in their words, newest first ("sections of 40 km max", "no main roads"). */
  notes: string[];
  updatedAt: number;
}

const KEY = 'adventure-planner.profile';
const MAX_NOTES = 10;
export const emptyProfile = (): TravellerProfile => ({ modes: {}, notes: [], updatedAt: 0 });

let current: TravellerProfile = load();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());

function load(): TravellerProfile {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
    return raw ? { ...emptyProfile(), ...JSON.parse(raw) } : emptyProfile();
  } catch { return emptyProfile(); }
}

function store(p: TravellerProfile) {
  current = p;
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* private mode: kept for this visit */ }
  emit();
}

export function getProfile(): TravellerProfile { return current; }
export function onProfileChange(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; }
export function hasProfile(p = current): boolean { return Object.keys(p.modes).length > 0 || p.notes.length > 0; }

/** What a finished plan teaches: the choices it settled (stated or answered), never the app's guesses. */
export function learnFromPlan(p: TravellerProfile, intent: TripIntent, notes: string[] = [], newTrip = true): TravellerProfile {
  const mode = intent.travelMode as keyof TravellerProfile['modes'];
  if (!['BICYCLING', 'WALKING', 'DRIVING'].includes(mode)) return p;
  const before = p.modes[mode] || { trips: 0 };
  const habits: ModeHabits = {
    ...before,
    trips: before.trips + (newTrip ? 1 : 0),
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
  const fresh = notes.map(n => n.trim()).filter(n => n && n.length <= 120);
  const kept = p.notes.filter(n => !fresh.some(f => f.toLowerCase() === n.toLowerCase()));
  return { modes: { ...p.modes, [mode]: habits }, lastMode: mode, notes: [...fresh, ...kept].slice(0, MAX_NOTES), updatedAt: Date.now() };
}

export function rememberPlan(intent: TripIntent, notes: string[] = [], newTrip = true) { store(learnFromPlan(current, intent, notes, newTrip)); }

export function forgetProfile() { store({ ...emptyProfile(), updatedAt: Date.now() }); }

/** The newer of two copies (this browser's and the account's), so either can be ahead. */
export function newer(a: TravellerProfile | null | undefined, b: TravellerProfile | null | undefined): TravellerProfile {
  if (!a) return b || emptyProfile();
  if (!b) return a;
  return (b.updatedAt || 0) > (a.updatedAt || 0) ? b : a;
}

/** Take the account's copy if it's newer (after logging in). */
export function adoptProfile(p: TravellerProfile | null | undefined) {
  const chosen = newer(current, p);
  if (chosen !== current) store({ ...emptyProfile(), ...chosen });
}

/** What the AI gets: compact, without counters. Null when there's nothing yet. */
export function profileForAI(p = current): Record<string, unknown> | null {
  if (!hasProfile(p)) return null;
  const modes = Object.fromEntries(Object.entries(p.modes).map(([m, h]) => {
    const { trips: _t, vehicleInfo: _v, ...rest } = h!;
    return [m, rest];
  }));
  return { usualTravelMode: p.lastMode, habitsByTravelMode: modes, preferences: p.notes };
}
