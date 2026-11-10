// Addresses of the OpenStreetMap services the app uses. The server's settings choose them (see .env.example),
// so the app can move from the free public servers (fair use only) to its own or paid ones without code changes.

export interface Services {
  /** Overpass servers for places, tried in order (a busy or refusing one is skipped). */
  overpass: string[];
  /** Photon: place names ↔ coordinates, and the places fallback when no Overpass server answers. */
  photon: string;
  /** Nominatim: the backup for place names when Photon fails (about one request a second). */
  nominatim: string;
  /** OSRM base URL with routed-car / routed-bike / routed-foot profiles. */
  osrm: string;
  /** Valhalla base URL (route, trace_route, trace_attributes, height). */
  valhalla: string;
  /** BRouter base URL (off-road routes). */
  brouter: string;
  /** Open-Meteo-style elevation API: the backup when Valhalla's height service fails. */
  elevation: string;
}

export const PUBLIC_SERVICES: Services = {
  overpass: ['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'],
  photon: 'https://photon.komoot.io',
  nominatim: 'https://nominatim.openstreetmap.org',
  osrm: 'https://routing.openstreetmap.de',
  valhalla: 'https://valhalla1.openstreetmap.de',
  brouter: 'https://brouter.de/brouter',
  elevation: 'https://api.open-meteo.com/v1/elevation',
};

const trim = (url: string) => url.replace(/\/+$/, '');

/** Services from the server's settings (window.__APP_CONFIG__.services), defaulting to the public ones. */
export function resolveServices(config?: Partial<Record<keyof Services, string | string[]>>): Services {
  const one = (key: Exclude<keyof Services, 'overpass'>) => {
    const v = config?.[key];
    return trim((Array.isArray(v) ? v[0] : v) || PUBLIC_SERVICES[key]);
  };
  const overpass = config?.overpass;
  const list = (Array.isArray(overpass) ? overpass : (overpass || '').split(',')).map(s => s.trim()).filter(Boolean).map(trim);
  return {
    overpass: list.length ? list : PUBLIC_SERVICES.overpass,
    photon: one('photon'), nominatim: one('nominatim'), osrm: one('osrm'), valhalla: one('valhalla'), brouter: one('brouter'), elevation: one('elevation'),
  };
}

export const SERVICES: Services = resolveServices(typeof window !== 'undefined' ? window.__APP_CONFIG__?.services : undefined);
