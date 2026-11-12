// Which map and place services are answering right now, as seen from this browser. Each service reports its
// successes and failures; one that keeps failing is treated as down for a couple of minutes, so callers go straight
// to their backup instead of waiting on timeouts, and the planner can say which service is the problem.

export type ServiceId = 'photon' | 'nominatim' | 'overpass' | 'osrm' | 'valhalla' | 'brouter' | 'ai';

/** What each service does, for messages ("Photon (place names)"). */
export const SERVICE_ROLES: Record<ServiceId, string> = {
  photon: 'place names',
  nominatim: 'place names, backup',
  overpass: 'places near stops',
  osrm: 'road routes',
  valhalla: 'routes, elevation and voice',
  brouter: 'off-road routes',
  ai: 'AI planner',
};
export const SERVICE_NAMES: Record<ServiceId, string> = {
  photon: 'Photon', nominatim: 'Nominatim', overpass: 'Overpass', osrm: 'OSRM', valhalla: 'Valhalla', brouter: 'BRouter', ai: 'AI (Gemini)',
};

const DOWN_MS = 2 * 60_000;
interface State { fails: number; downUntil: number; lastMs?: number; lastError?: string; at?: number }
const state = new Map<ServiceId, State>();
const listeners = new Set<() => void>();

/** A call to a service finished: `ok` false for a timeout, refusal or server error (not for "nothing found"). */
export function report(service: ServiceId, ok: boolean, ms?: number, error?: string) {
  const s = state.get(service) || { fails: 0, downUntil: 0 };
  if (ok) { s.fails = 0; s.downUntil = 0; s.lastError = undefined; }
  else {
    s.fails++;
    s.lastError = error;
    // A timeout is costly: one is enough to skip the service for a while. Quick errors get a second chance.
    if (s.fails >= 2 || /timed? ?out|abort/i.test(error || '')) s.downUntil = Date.now() + DOWN_MS;
  }
  s.lastMs = ms;
  s.at = Date.now();
  state.set(service, s);
  listeners.forEach(l => l());
}

/** Skip this service for now (it just failed): use the backup straight away. */
export function isDown(service: ServiceId): boolean {
  return (state.get(service)?.downUntil || 0) > Date.now();
}

/** Services that failed recently, for messages. */
export function downServices(): ServiceId[] {
  return [...state.entries()].filter(([, s]) => s.downUntil > Date.now()).map(([id]) => id);
}

export function onHealthChange(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; }

/** For tests. */
export function resetHealth() { state.clear(); }

/** fetch() that reports to the health tracker: a timeout, network error, 429 or 5xx counts against the service;
 *  any other answer (including "no route here") means it's up. */
export async function trackedFetch(service: ServiceId, url: string, init?: RequestInit): Promise<Response> {
  const started = Date.now();
  try {
    const res = await fetch(url, init);
    const bad = res.status === 429 || res.status >= 500;
    report(service, !bad, Date.now() - started, bad ? `HTTP ${res.status}` : undefined);
    return res;
  } catch (err) {
    report(service, false, Date.now() - started, err instanceof Error ? `${err.name} ${err.message}` : String(err));
    throw err;
  }
}
