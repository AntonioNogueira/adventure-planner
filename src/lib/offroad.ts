// Off-road routing for beginners, used by both versions (Google and OpenStreetMap):
//   bike  → BRouter "gravel": gravel and dirt tracks, not technical singletrack
//   moto  → BRouter with our "easy adventure" profile (below): good dirt tracks and quiet roads,
//           never footpaths, cycleways, closed ways or very rough tracks (grade 4-5, sand, mud)
//   hike  → Valhalla pedestrian, trails up to difficulty T2 (sac_scale mountain_hiking), preferring tracks
// Google's directions have no off-road option at all, so these OpenStreetMap engines are used even on the
// Google map. Each day is routed separately (short requests). brouter.de and valhalla1.openstreetmap.de are
// free public services (fair use); a busy product should run its own BRouter/Valhalla.
import { LatLng, haversineKm } from './geo';
import { geocodeAddress } from './geocode';
import { decodePolyline6 } from './osrm';
import type { RoutedLeg, RoutedStep, RoutedTrip, TripRequest } from './routing';

const BROUTER = 'https://brouter.de/brouter';
const VALHALLA = 'https://valhalla1.openstreetmap.de/route';

export const OFFROAD_MODES = new Set(['BICYCLING', 'WALKING', 'DRIVING']);

/** Longest single day the public engines are asked for (straight line); longer ones use the normal route. */
const MAX_LEG_KM = 220;

/** Average moving speeds off-road, for the day's time (the engines' own estimates assume other vehicles). */
const SPEED_KMH: Record<string, number> = { BICYCLING: 14, DRIVING: 32 };

export const ADVENTURE_MOTO_PROFILE = `# Adventure motorcycle, beginner: good dirt/gravel tracks and quiet roads first;
# never footpaths, cycleways, bridleways, closed or very rough ways.
---context:global
assign validForCars = true
assign turnInstructionMode = 1
assign pass1coefficient = 1.5

---context:way
assign motoraccess
       switch motorcar=
              switch motor_vehicle=
                     switch access=
                            switch highway=motorway|motorway_link|trunk|trunk_link|primary|primary_link|secondary|secondary_link|tertiary|tertiary_link|unclassified|residential|living_street|service|track|road 1
                            0
                            access=yes|permissive|designated|destination
                     motor_vehicle=yes|permissive|designated|destination
              motorcar=yes|permissive|designated|destination

assign rough = or tracktype=grade4|grade5 or smoothness=very_bad|horrible|very_horrible|impassable surface=sand|mud
assign unpaved = or highway=track surface=gravel|fine_gravel|compacted|dirt|ground|unpaved|earth|pebblestone

assign costfactor
  switch route=ferry 3
  switch not motoraccess 10000
  switch rough 10000
  switch highway=motorway|motorway_link 8
  switch highway=trunk|trunk_link 4
  switch highway=primary|primary_link 2.5
  switch highway=secondary|secondary_link 1.8
  switch highway=tertiary|tertiary_link ( switch unpaved 1.0 1.4 )
  switch highway=track ( switch tracktype=grade1|grade2 1.0 1.15 )
  switch highway=unclassified|road ( switch unpaved 1.0 1.2 )
  switch highway=residential|living_street 1.6
  switch highway=service ( switch unpaved 1.2 2.0 )
  10000

assign turncost = 30
assign initialcost = switch route=ferry 10000 0

---context:node
assign initialcost = 0
`;

// Custom BRouter profiles are uploaded once and expire after a while on the server: upload again on error.
let motoProfile: Promise<string> | null = null;
function adventureProfileId(fresh = false): Promise<string> {
  if (!motoProfile || fresh) {
    motoProfile = fetch(`${BROUTER}/profile`, { method: 'POST', body: ADVENTURE_MOTO_PROFILE, signal: AbortSignal.timeout(20000) })
      .then(r => r.json())
      .then(d => { if (!d.profileid) throw new Error(d.error || 'profile upload failed'); return d.profileid as string; });
    motoProfile.catch(() => { motoProfile = null; });
  }
  return motoProfile;
}

const UNPAVED = /surface=(gravel|fine_gravel|compacted|dirt|ground|unpaved|earth|pebblestone|sand|grass)/;

/** One day through BRouter: path, distance, a time from typical off-road speeds, and ferry/unpaved steps. */
async function brouterLeg(points: LatLng[], profile: string, travelMode: string): Promise<RoutedLeg> {
  const lonlats = points.map(p => `${p.lng.toFixed(6)},${p.lat.toFixed(6)}`).join('|');
  const res = await fetch(`${BROUTER}?lonlats=${lonlats}&profile=${profile}&alternativeidx=0&format=geojson`, { signal: AbortSignal.timeout(45000) });
  const text = await res.text();
  let data: any;
  try { data = JSON.parse(text); } catch { throw new Error(`BRouter: ${text.slice(0, 120)}`); }
  const feature = data.features?.[0];
  if (!feature) throw new Error('BRouter: no route');
  const coords: number[][] = feature.geometry.coordinates;
  const km = Number(feature.properties['track-length']) / 1000;
  // Steps from runs of the same way type, so ferries are known and roads can be summarised.
  const messages: string[][] = feature.properties.messages || [];
  const head = messages[0] || [];
  const iD = head.indexOf('Distance'), iT = head.indexOf('WayTags');
  const steps: RoutedStep[] = [];
  for (const m of messages.slice(1)) {
    const tags = m[iT] || '';
    const ferry = /route=ferry/.test(tags);
    const kind = ferry ? 'Ferry' : UNPAVED.test(tags) || /highway=track/.test(tags) ? 'Unpaved track' : 'Road';
    const meters = Number(m[iD]) || 0;
    const last = steps[steps.length - 1];
    if (last && last.instruction === kind) { last.distanceMeters += meters; }
    else steps.push({ instruction: kind, distanceMeters: meters, durationSeconds: 0, ferry });
  }
  const speed = SPEED_KMH[travelMode] || 14;
  steps.forEach(s => { s.durationSeconds = Math.round(s.distanceMeters / 1000 / speed * 3600); });
  return {
    distanceMeters: km * 1000,
    durationSeconds: Math.round(km / speed * 3600),
    path: coords.map(([lng, lat]) => ({ lat, lng })),
    steps,
  };
}

/** One hiking day through Valhalla: trails up to T2, preferring tracks and footpaths. */
async function hikeLeg(points: LatLng[]): Promise<RoutedLeg> {
  const res = await fetch(VALHALLA, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(45000),
    body: JSON.stringify({
      locations: points.map((p, i) => ({ lat: p.lat, lon: p.lng, type: i === 0 || i === points.length - 1 ? 'break' : 'through' })),
      costing: 'pedestrian',
      costing_options: { pedestrian: { use_tracks: 1, max_hiking_difficulty: 2, walkway_factor: 0.6, use_hills: 0.5 } },
      units: 'kilometers',
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!data.trip) throw new Error(`Valhalla: ${data.error || res.status}`);
  const leg = data.trip.legs[0];
  return {
    distanceMeters: leg.summary.length * 1000,
    durationSeconds: leg.summary.time,
    path: decodePolyline6(leg.shape),
    steps: leg.maneuvers.map((m: any): RoutedStep => ({
      instruction: [m.instruction, ...(m.street_names || [])].join(' '),
      distanceMeters: m.length * 1000,
      durationSeconds: m.time,
      ferry: m.type === 28,
    })),
  };
}

/** Days as point lists: each from one stop to the next, with any pass-through points between. */
export function legPoints(points: { at: LatLng; via: boolean }[]): LatLng[][] {
  const legs: LatLng[][] = [];
  let current: LatLng[] = [points[0].at];
  for (let i = 1; i < points.length; i++) {
    current.push(points[i].at);
    if (!points[i].via || i === points.length - 1) { legs.push(current); current = [points[i].at]; }
  }
  return legs;
}

/** The whole trip off-road, one day at a time (two at once). Throws if a day can't be routed off-road. */
export async function offroadTrip(req: TripRequest): Promise<RoutedTrip> {
  const all = [{ location: req.origin, via: false }, ...req.stops.map(s => ({ location: s.location, via: Boolean(s.via) })), { location: req.destination, via: false }];
  const located = await Promise.all(all.map(async ({ location, via }) => {
    const at = typeof location === 'string' ? await geocodeAddress(location) : location;
    if (!at) throw new Error(`NOT_FOUND: ${String(location)}`);
    return { at, via };
  }));
  const days = legPoints(located);
  if (days.some(d => haversineKm(d[0], d[d.length - 1]) > MAX_LEG_KM)) throw new Error('Too long for one off-road request');

  const routeDay = async (points: LatLng[]): Promise<RoutedLeg> => {
    if (req.travelMode === 'WALKING') return hikeLeg(points);
    if (req.travelMode === 'BICYCLING') return brouterLeg(points, 'gravel', req.travelMode);
    try {
      return await brouterLeg(points, await adventureProfileId(), req.travelMode);
    } catch {
      return brouterLeg(points, await adventureProfileId(true), req.travelMode);
    }
  };
  const legs: RoutedLeg[] = new Array(days.length);
  let next = 0;
  await Promise.all([0, 1].map(async () => {
    while (next < days.length) { const i = next++; legs[i] = await routeDay(days[i]); }
  }));
  return { legs, engine: 'osm' };
}
