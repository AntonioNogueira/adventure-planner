import fs from 'fs';
import path from 'path';
import type { Plugin, Connect } from 'vite';
import type { ServerResponse } from 'http';

// Overland safety informer: travel advice and disaster alerts for the countries on the demanding overland routes,
// from open official sources. Built on the server and refreshed every 12 hours (so at least daily); the browser
// calls GET /api/safety. scripts/safety/build.ts writes the same data to public/safety/latest.json, which the app
// falls back to when the server can't reach the sources.
//
// Sources (all public, no key):
//   - UK FCDO travel advice (GOV.UK Content API): advice level per country and its latest change, with date.
//   - US State Department travel advisories (RSS): level 1–4 per country, with date.
//   - GDACS, the UN/EU Global Disaster Alert and Coordination System: orange and red alerts of the last 30 days.
// ReliefWeb (UN OCHA) reports can be added once an approved appname is set (RELIEFWEB_APPNAME).

export type Region = 'West Africa' | 'North Africa' | 'East & Southern Africa' | 'Middle East' | 'Central Asia' | 'South Asia'
  | 'Russia & Mongolia' | 'Central America' | 'South America';

interface Country { name: string; region: Region; at: [number, number]; fcdo: string; us?: string[] }

/** Countries along the demanding overland routes; `at` is a rough centre for the pin. `us`: names the US feed uses. */
export const COUNTRIES: Country[] = [
  // West Africa
  { name: 'Morocco', region: 'North Africa', at: [31.8, -7.1], fcdo: 'morocco' },
  { name: 'Western Sahara', region: 'West Africa', at: [24.2, -13.0], fcdo: 'western-sahara', us: ['Western Sahara', 'Morocco'] },
  { name: 'Mauritania', region: 'West Africa', at: [20.3, -10.3], fcdo: 'mauritania' },
  { name: 'Senegal', region: 'West Africa', at: [14.5, -14.5], fcdo: 'senegal' },
  { name: 'The Gambia', region: 'West Africa', at: [13.45, -15.4], fcdo: 'the-gambia', us: ['The Gambia', 'Gambia'] },
  { name: 'Guinea-Bissau', region: 'West Africa', at: [11.9, -15.2], fcdo: 'guinea-bissau' },
  { name: 'Guinea', region: 'West Africa', at: [10.4, -10.9], fcdo: 'guinea' },
  { name: 'Sierra Leone', region: 'West Africa', at: [8.6, -11.8], fcdo: 'sierra-leone' },
  { name: 'Liberia', region: 'West Africa', at: [6.5, -9.4], fcdo: 'liberia' },
  { name: 'Côte d\'Ivoire', region: 'West Africa', at: [7.6, -5.5], fcdo: 'cote-d-ivoire', us: ['Cote d\'Ivoire', 'Côte d\'Ivoire', 'Cote d Ivoire'] },
  { name: 'Mali', region: 'West Africa', at: [17.5, -3.9], fcdo: 'mali' },
  { name: 'Burkina Faso', region: 'West Africa', at: [12.3, -1.6], fcdo: 'burkina-faso' },
  { name: 'Ghana', region: 'West Africa', at: [7.9, -1.0], fcdo: 'ghana' },
  { name: 'Togo', region: 'West Africa', at: [8.6, 0.9], fcdo: 'togo' },
  { name: 'Benin', region: 'West Africa', at: [9.3, 2.3], fcdo: 'benin' },
  { name: 'Niger', region: 'West Africa', at: [17.6, 8.1], fcdo: 'niger' },
  { name: 'Nigeria', region: 'West Africa', at: [9.1, 8.7], fcdo: 'nigeria' },
  { name: 'Cameroon', region: 'West Africa', at: [5.7, 12.4], fcdo: 'cameroon' },
  { name: 'Chad', region: 'West Africa', at: [15.4, 18.7], fcdo: 'chad' },
  // North Africa
  { name: 'Algeria', region: 'North Africa', at: [28.0, 2.6], fcdo: 'algeria' },
  { name: 'Tunisia', region: 'North Africa', at: [34.0, 9.5], fcdo: 'tunisia' },
  { name: 'Libya', region: 'North Africa', at: [27.0, 17.2], fcdo: 'libya' },
  { name: 'Egypt', region: 'North Africa', at: [26.8, 30.8], fcdo: 'egypt' },
  { name: 'Sudan', region: 'North Africa', at: [15.6, 30.2], fcdo: 'sudan' },
  // East & Southern Africa
  { name: 'South Sudan', region: 'East & Southern Africa', at: [7.3, 30.0], fcdo: 'south-sudan' },
  { name: 'Ethiopia', region: 'East & Southern Africa', at: [9.1, 39.5], fcdo: 'ethiopia' },
  { name: 'Eritrea', region: 'East & Southern Africa', at: [15.3, 39.0], fcdo: 'eritrea' },
  { name: 'Djibouti', region: 'East & Southern Africa', at: [11.8, 42.6], fcdo: 'djibouti' },
  { name: 'Somalia', region: 'East & Southern Africa', at: [5.2, 46.2], fcdo: 'somalia' },
  { name: 'Kenya', region: 'East & Southern Africa', at: [0.4, 37.9], fcdo: 'kenya' },
  { name: 'Uganda', region: 'East & Southern Africa', at: [1.4, 32.3], fcdo: 'uganda' },
  { name: 'Rwanda', region: 'East & Southern Africa', at: [-1.95, 29.9], fcdo: 'rwanda' },
  { name: 'Burundi', region: 'East & Southern Africa', at: [-3.4, 29.9], fcdo: 'burundi' },
  { name: 'Tanzania', region: 'East & Southern Africa', at: [-6.4, 34.9], fcdo: 'tanzania' },
  { name: 'DR Congo', region: 'East & Southern Africa', at: [-2.9, 23.7], fcdo: 'democratic-republic-of-the-congo', us: ['Democratic Republic of the Congo'] },
  { name: 'Congo', region: 'East & Southern Africa', at: [-0.7, 15.3], fcdo: 'congo', us: ['Republic of Congo', 'Republic of the Congo'] },
  { name: 'Gabon', region: 'East & Southern Africa', at: [-0.8, 11.6], fcdo: 'gabon' },
  { name: 'Angola', region: 'East & Southern Africa', at: [-11.2, 17.9], fcdo: 'angola' },
  { name: 'Zambia', region: 'East & Southern Africa', at: [-13.1, 27.8], fcdo: 'zambia' },
  { name: 'Malawi', region: 'East & Southern Africa', at: [-13.3, 34.3], fcdo: 'malawi' },
  { name: 'Mozambique', region: 'East & Southern Africa', at: [-18.7, 35.5], fcdo: 'mozambique' },
  { name: 'Zimbabwe', region: 'East & Southern Africa', at: [-19.0, 29.2], fcdo: 'zimbabwe' },
  { name: 'Botswana', region: 'East & Southern Africa', at: [-22.3, 24.7], fcdo: 'botswana' },
  { name: 'Namibia', region: 'East & Southern Africa', at: [-22.6, 17.1], fcdo: 'namibia' },
  { name: 'South Africa', region: 'East & Southern Africa', at: [-30.6, 24.0], fcdo: 'south-africa' },
  { name: 'Lesotho', region: 'East & Southern Africa', at: [-29.6, 28.2], fcdo: 'lesotho' },
  // Middle East
  { name: 'Turkey', region: 'Middle East', at: [39.0, 35.2], fcdo: 'turkey', us: ['Türkiye', 'Turkey'] },
  { name: 'Georgia', region: 'Middle East', at: [42.3, 43.4], fcdo: 'georgia' },
  { name: 'Armenia', region: 'Middle East', at: [40.1, 45.0], fcdo: 'armenia' },
  { name: 'Azerbaijan', region: 'Middle East', at: [40.1, 47.6], fcdo: 'azerbaijan' },
  { name: 'Iran', region: 'Middle East', at: [32.4, 53.7], fcdo: 'iran' },
  { name: 'Iraq', region: 'Middle East', at: [33.2, 43.7], fcdo: 'iraq' },
  { name: 'Syria', region: 'Middle East', at: [34.8, 38.9], fcdo: 'syria' },
  { name: 'Lebanon', region: 'Middle East', at: [33.9, 35.9], fcdo: 'lebanon' },
  { name: 'Jordan', region: 'Middle East', at: [30.6, 36.2], fcdo: 'jordan' },
  { name: 'Israel', region: 'Middle East', at: [31.4, 34.9], fcdo: 'israel', us: ['Israel'] },
  { name: 'Saudi Arabia', region: 'Middle East', at: [23.9, 45.1], fcdo: 'saudi-arabia' },
  { name: 'Oman', region: 'Middle East', at: [21.5, 55.9], fcdo: 'oman' },
  { name: 'Yemen', region: 'Middle East', at: [15.6, 48.5], fcdo: 'yemen' },
  // Central Asia
  { name: 'Turkmenistan', region: 'Central Asia', at: [38.97, 59.6], fcdo: 'turkmenistan' },
  { name: 'Uzbekistan', region: 'Central Asia', at: [41.4, 64.6], fcdo: 'uzbekistan' },
  { name: 'Kazakhstan', region: 'Central Asia', at: [48.0, 66.9], fcdo: 'kazakhstan' },
  { name: 'Kyrgyzstan', region: 'Central Asia', at: [41.2, 74.8], fcdo: 'kyrgyzstan', us: ['The Kyrgyz Republic', 'Kyrgyz Republic', 'Kyrgyzstan'] },
  { name: 'Tajikistan', region: 'Central Asia', at: [38.9, 71.3], fcdo: 'tajikistan' },
  { name: 'Afghanistan', region: 'Central Asia', at: [33.9, 67.7], fcdo: 'afghanistan' },
  { name: 'China', region: 'Central Asia', at: [39.5, 76.0], fcdo: 'china', us: ['China', 'Mainland China'] },
  // South Asia
  { name: 'Pakistan', region: 'South Asia', at: [30.4, 69.3], fcdo: 'pakistan' },
  { name: 'India', region: 'South Asia', at: [22.0, 79.0], fcdo: 'india' },
  { name: 'Nepal', region: 'South Asia', at: [28.4, 84.1], fcdo: 'nepal' },
  { name: 'Bangladesh', region: 'South Asia', at: [23.7, 90.4], fcdo: 'bangladesh' },
  { name: 'Myanmar', region: 'South Asia', at: [21.9, 95.9], fcdo: 'myanmar', us: ['Burma (Myanmar)', 'Burma', 'Myanmar'] },
  // Russia & Mongolia
  { name: 'Russia', region: 'Russia & Mongolia', at: [56.0, 60.0], fcdo: 'russia' },
  { name: 'Mongolia', region: 'Russia & Mongolia', at: [46.9, 103.8], fcdo: 'mongolia' },
  // Central America
  { name: 'Mexico', region: 'Central America', at: [23.6, -102.5], fcdo: 'mexico' },
  { name: 'Guatemala', region: 'Central America', at: [15.8, -90.2], fcdo: 'guatemala' },
  { name: 'Belize', region: 'Central America', at: [17.2, -88.5], fcdo: 'belize' },
  { name: 'Honduras', region: 'Central America', at: [15.2, -86.2], fcdo: 'honduras' },
  { name: 'El Salvador', region: 'Central America', at: [13.8, -88.9], fcdo: 'el-salvador' },
  { name: 'Nicaragua', region: 'Central America', at: [12.9, -85.2], fcdo: 'nicaragua' },
  { name: 'Costa Rica', region: 'Central America', at: [9.7, -83.8], fcdo: 'costa-rica' },
  { name: 'Panama', region: 'Central America', at: [8.5, -80.8], fcdo: 'panama' },
  // South America
  { name: 'Colombia', region: 'South America', at: [4.6, -74.3], fcdo: 'colombia' },
  { name: 'Venezuela', region: 'South America', at: [6.4, -66.6], fcdo: 'venezuela' },
  { name: 'Ecuador', region: 'South America', at: [-1.8, -78.2], fcdo: 'ecuador' },
  { name: 'Peru', region: 'South America', at: [-9.2, -75.0], fcdo: 'peru' },
  { name: 'Bolivia', region: 'South America', at: [-16.3, -63.6], fcdo: 'bolivia' },
  { name: 'Brazil', region: 'South America', at: [-10.8, -52.9], fcdo: 'brazil' },
  { name: 'Paraguay', region: 'South America', at: [-23.4, -58.4], fcdo: 'paraguay' },
  { name: 'Chile', region: 'South America', at: [-30.0, -71.0], fcdo: 'chile' },
  { name: 'Argentina', region: 'South America', at: [-34.0, -64.0], fcdo: 'argentina' },
  { name: 'Guyana', region: 'South America', at: [4.9, -58.9], fcdo: 'guyana' },
];

export interface SafetyCountry {
  name: string;
  region: Region;
  at: [number, number];
  /** 1 normal precautions … 4 do not travel / avoid all travel: the stricter of the UK and US advice. */
  level: 1 | 2 | 3 | 4;
  fcdo?: { level: 1 | 2 | 3 | 4; advice: string; latest: string; updated: string; summary: string; url: string };
  us?: { level: 1 | 2 | 3 | 4; label: string; updated: string; summary: string; url: string };
}
export interface SafetyEvent { kind: string; name: string; level: 'Orange' | 'Red'; at: [number, number]; from: string; to: string; countries: string; url: string }
export interface SafetyData { updated: string; countries: SafetyCountry[]; events: SafetyEvent[]; sources: { label: string; url: string }[] }

const UA = 'AdventurePlanner/1.0 (overland safety informer)';
const getText = async (url: string) => {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: '*/*' }, signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
};
const getJson = async (url: string) => JSON.parse(await getText(url));
const strip = (html: string) => html
  .replace(/<\/h[1-6]>/gi, '. ').replace(/<(?:\/?(?:p|li|ul|ol|div|br|tr|td|h[1-6])\b)[^>]*>/gi, ' ').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&rsquo;/g, '\'')
  .replace(/&quot;/g, '"').replace(/\s+/g, ' ').replace(/\s+([.,;:])/g, '$1').replace(/\.\s*\./g, '.').trim();
const clip = (s: string, n: number) => (s.length > n ? s.slice(0, s.lastIndexOf(' ', n)) + '…' : s);
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '');

const FCDO_LEVEL: Record<string, { level: 1 | 2 | 3 | 4; advice: string }> = {
  avoid_all_travel_to_whole_country: { level: 4, advice: 'Advises against all travel to the whole country' },
  avoid_all_but_essential_travel_to_whole_country: { level: 3, advice: 'Advises against all but essential travel to the whole country' },
  avoid_all_travel_to_parts: { level: 3, advice: 'Advises against all travel to parts of the country' },
  avoid_all_but_essential_travel_to_parts: { level: 2, advice: 'Advises against all but essential travel to parts of the country' },
};

async function fcdo(country: Country): Promise<SafetyCountry['fcdo']> {
  const j = await getJson(`https://www.gov.uk/api/content/foreign-travel-advice/${country.fcdo}`);
  const alerts: string[] = j.details?.alert_status || [];
  const worst = alerts.map(a => FCDO_LEVEL[a]).filter(Boolean).sort((a, b) => b.level - a.level)[0] || { level: 1 as const, advice: 'No advice against travel' };
  // The warnings page, without the standard sentence about insurance.
  const warn = (j.details?.parts || []).find((p: { slug: string }) => p.slug === 'warnings-and-insurance');
  const text = warn ? strip(warn.body).replace(/^Your travel insurance could be invalidated[^.]*\.\s*/i, '') : '';
  return {
    level: worst.level,
    advice: worst.advice,
    latest: strip(j.details?.change_description || ''),
    updated: j.public_updated_at,
    summary: clip(text, 420),
    url: `https://www.gov.uk/foreign-travel-advice/${country.fcdo}`,
  };
}

async function usAdvisories(): Promise<Map<string, NonNullable<SafetyCountry['us']>>> {
  const xml = await getText('https://travel.state.gov/_res/rss/TAsTWs.xml');
  const out = new Map<string, NonNullable<SafetyCountry['us']>>();
  for (const item of xml.split('<item>').slice(1)) {
    const title = item.match(/<title>([^<]*)<\/title>/)?.[1] || '';
    const m = title.replace(/\s+Travel Advisory/i, '').match(/^(.*?)\s*-\s*Level\s*(\d)\s*:\s*(.*)$/);
    if (!m) continue;
    const link = item.match(/<link>([^<]*)<\/link>/)?.[1] || '';
    const date = item.match(/<pubDate>([^<]*)<\/pubDate>/)?.[1] || '';
    const desc = strip(item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)?.[1] || '');
    out.set(norm(m[1]), { level: Number(m[2]) as 1 | 2 | 3 | 4, label: m[3].trim(), updated: date ? new Date(date).toISOString() : '', summary: clip(desc, 420), url: link });
  }
  return out;
}

async function gdacs(): Promise<SafetyEvent[]> {
  const day = (d: Date) => d.toISOString().slice(0, 10);
  const now = new Date();
  const from = new Date(now.getTime() - 30 * 864e5);
  const j = await getJson(`https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?alertlevel=Orange;Red&fromdate=${day(from)}&todate=${day(now)}`);
  const KIND: Record<string, string> = { EQ: 'Earthquake', TC: 'Tropical cyclone', FL: 'Flood', VO: 'Volcano', DR: 'Drought', WF: 'Wildfire', TS: 'Tsunami' };
  return (j.features || []).map((f: { geometry: { coordinates: [number, number] }; properties: Record<string, any> }) => ({
    kind: KIND[f.properties.eventtype] || f.properties.eventtype,
    name: String(f.properties.name || '').replace(/\s+,/g, ',').replace(/,\s*,/g, ',').replace(/\s+/g, ' ').trim(),
    level: f.properties.alertlevel,
    at: [f.geometry.coordinates[1], f.geometry.coordinates[0]] as [number, number],
    from: f.properties.fromdate,
    to: f.properties.todate,
    countries: String(f.properties.country || ''),
    url: f.properties.url?.report || 'https://www.gdacs.org',
  }));
}

/** Runs `fn` over `items`, a few at a time (polite to the sources). */
async function pool<T, R>(items: T[], n: number, fn: (t: T) => Promise<R>): Promise<(R | null)[]> {
  const out: (R | null)[] = new Array(items.length).fill(null);
  let next = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (next < items.length) {
      const i = next++;
      try { out[i] = await fn(items[i]); } catch { out[i] = null; }
    }
  }));
  return out;
}

export async function buildSafety(): Promise<SafetyData> {
  const [us, events, uk] = await Promise.all([
    usAdvisories().catch(() => new Map<string, NonNullable<SafetyCountry['us']>>()),
    gdacs().catch(() => [] as SafetyEvent[]),
    pool(COUNTRIES, 6, fcdo),
  ]);
  const countries: SafetyCountry[] = COUNTRIES.map((c, i) => {
    const f = uk[i] || undefined;
    const u = [c.name, ...(c.us || [])].map(n => us.get(norm(n))).find(Boolean);
    const level = Math.max(f?.level || 1, u?.level || 1) as 1 | 2 | 3 | 4;
    return { name: c.name, region: c.region, at: c.at, level, ...(f ? { fcdo: f } : {}), ...(u ? { us: u } : {}) };
  }).filter(c => c.fcdo || c.us);
  if (!countries.length) throw new Error('no safety source answered');
  return {
    updated: new Date().toISOString(),
    countries,
    events,
    sources: [
      { label: 'UK FCDO travel advice', url: 'https://www.gov.uk/foreign-travel-advice' },
      { label: 'US State Department travel advisories', url: 'https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories.html' },
      { label: 'GDACS (UN/EU disaster alerts)', url: 'https://www.gdacs.org' },
    ],
  };
}

/** GET /api/safety: the data, rebuilt in the background when older than 12 hours. Until the first build finishes,
 *  the copy saved in the build (public/safety/latest.json) is served. */
export function safetyApi(): Plugin {
  const MAX_AGE = 12 * 3600e3;
  let data: SafetyData | null = null;
  let building: Promise<void> | null = null;
  const refresh = () => {
    building ??= buildSafety().then(d => { data = d; }).catch(err => console.warn('[safety]', String(err))).finally(() => { building = null; });
    return building;
  };
  const handler = (root: string, saved: string): Connect.NextHandleFunction => async (req, res: ServerResponse, next) => {
    if ((req.url || '').split('?')[0] !== '/api/safety') return next();
    const stale = !data || Date.now() - Date.parse(data.updated) > MAX_AGE;
    if (stale) {
      const job = refresh();
      // The first call waits a little for fresh data; later ones get the current copy at once.
      if (!data) await Promise.race([job, new Promise(r => setTimeout(r, 20000))]);
    }
    let body = data ? JSON.stringify(data) : '';
    if (!body) { try { body = fs.readFileSync(path.resolve(root, saved), 'utf8'); } catch { /* none */ } }
    if (!body) { res.statusCode = 503; res.end('{"error":"safety data unavailable"}'); return; }
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=1800');
    res.end(body);
  };
  return {
    name: 'safety-api',
    configureServer(server) { server.middlewares.use(handler(server.config.root, 'public/safety/latest.json')); },
    configurePreviewServer(server) { server.middlewares.use(handler(server.config.root, path.join(server.config.build.outDir, 'safety/latest.json'))); },
  };
}
