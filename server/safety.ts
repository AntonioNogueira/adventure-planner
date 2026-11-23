import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { Type } from '@google/genai';
import type { Plugin, Connect } from 'vite';
import type { ServerResponse } from 'http';

// Overland safety informer: what is happening now, placed as precisely as the sources allow. Built on the server
// (GET /api/safety): incidents and natural hazards are refreshed every 3 hours, travel advice every 12 hours.
// scripts/safety/build.ts saves a copy with the app (public/safety/latest.json) for when the sources can't be reached.
//
// Pins (the number and places change with what is going on):
//   - advice areas: the places the UK Foreign Office advises against travelling to (a region, a border zone, a road),
//     read from its advice text by the AI and placed on the map; re-read only when that country's advice changes;
//   - countries: one pin at the country's centre when its advice is above "normal precautions" or changed in the last
//     two weeks and nothing more precise is known, with the UK and US advice (newest first);
//   - incidents: armed clashes, riots, bombings and mass violence reported in the news in the last 24 hours, from
//     GDELT's geocoded event files (machine-read news: links to the reports so they can be checked);
//   - hazards: orange and red alerts of GDACS (UN/EU): earthquakes, tsunamis, cyclones, floods, wildfires, volcanoes, droughts.
// All sources are public and need no key. ReliefWeb (UN OCHA) could be added with an approved appname.

export type Region = 'West Africa' | 'North Africa' | 'East & Southern Africa' | 'Middle East' | 'Central Asia' | 'South Asia'
  | 'Russia & Mongolia' | 'Central America' | 'South America';

interface Country { name: string; region?: Region; at: [number, number]; fcdo: string; us?: string[] }

/** Countries along the demanding overland routes (they get a region label and a hand-placed centre). `us`: names the US feed uses. */
export const OVERLAND: Country[] = [
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

/** Every country with UK travel advice (centres from Natural Earth or OpenStreetMap), the overland ones as above. */
function allCountries(): Country[] {
  let list: { name: string; slug: string; at: [number, number] }[] = [];
  try { list = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'server/safety-countries.json'), 'utf8')); } catch { /* overland only */ }
  const bySlug = new Map(OVERLAND.map(c => [c.fcdo, c]));
  const out: Country[] = list.map(c => bySlug.get(c.slug) || { name: c.name, at: c.at, fcdo: c.slug });
  for (const c of OVERLAND) if (!out.some(x => x.fcdo === c.fcdo)) out.push(c);
  // No UK advice for the UK itself: the US advisory only.
  out.push({ name: 'United Kingdom', at: [53.0, -1.8], fcdo: '', us: ['United Kingdom'] });
  return out;
}
const US_ALIASES: Record<string, string[]> = {
  'USA': [], 'Czechia': ['Czech Republic', 'Czechia'], 'Bahamas': ['The Bahamas', 'Bahamas'], 'China': ['Mainland China', 'China'],
  'Macao': ['Macau', 'Macao'], 'South Korea': ['South Korea', 'Republic of Korea'], 'North Korea': ['North Korea (Democratic People\'s Republic of Korea)', 'North Korea'],
  'Israel': ['Israel, the West Bank and Gaza', 'Israel'], 'Palestine': ['Israel, the West Bank and Gaza'], 'Cape Verde': ['Cabo Verde', 'Cape Verde'],
  'Timor-Leste': ['Timor-Leste', 'East Timor'], 'Federated States of Micronesia': ['Micronesia'], 'Eswatini': ['Eswatini', 'Swaziland'],
  'Myanmar (Burma)': ['Burma (Myanmar)', 'Burma'], 'Côte d\'Ivoire': ['Cote d\'Ivoire', 'Côte d\'Ivoire'],
};

export interface Report { source: 'UK' | 'US'; level: 1 | 2 | 3 | 4; headline: string; latest?: string; summary: string; updated: string; url: string }
export interface SafetyCountry { name: string; region?: Region; at: [number, number]; level: 1 | 2 | 3 | 4; reports: Report[]; recent: boolean; areas: number }
export interface SafetyArea { country: string; name: string; at: [number, number]; level: 3 | 4; note: string; updated: string; url: string }
export interface SafetyIncident { at: [number, number]; place: string; country: string; kind: string; events: number; sources: number; links: { title: string; url: string }[]; last: string }
export interface SafetyEvent { kind: string; name: string; level: 'Orange' | 'Red'; at: [number, number]; from: string; to: string; countries: string; url: string }
export interface SafetyData {
  updated: string; adviceUpdated: string;
  countries: SafetyCountry[]; areas: SafetyArea[]; incidents: SafetyIncident[]; events: SafetyEvent[];
  sources: { label: string; url: string }[];
  /** Country → the advice update its areas were last read from (so a country with none isn't read again). */
  checked?: Record<string, string>;
}

/** Reads the advice areas from a country's warnings text (AI); supplied by the server, which has the AI keys. */
export type AreaReader = (country: string, text: string) => Promise<{ name: string; place: string; level: 'all' | 'essential'; note: string }[]>;

const UA = 'AdventurePlanner/1.0 (overland safety informer)';
const get = async (url: string, timeout = 30000) => {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: '*/*' }, signal: AbortSignal.timeout(timeout) });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res;
};
const getText = async (url: string) => (await get(url)).text();
const getJson = async (url: string) => JSON.parse(await getText(url));
const strip = (html: string) => html
  .replace(/<\/h[1-6]>/gi, '. ').replace(/<(?:\/?(?:p|li|ul|ol|div|br|tr|td|h[1-6])\b)[^>]*>/gi, ' ').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&rsquo;/g, '\'')
  .replace(/&quot;/g, '"').replace(/\s+/g, ' ').replace(/\s+([.,;:])/g, '$1').replace(/\.\s*\./g, '.').trim();
const clip = (s: string, n: number) => (s.length > n ? s.slice(0, s.lastIndexOf(' ', n)) + '…' : s);
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '');
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const FCDO_LEVEL: Record<string, { level: 1 | 2 | 3 | 4; advice: string }> = {
  avoid_all_travel_to_whole_country: { level: 4, advice: 'Advises against all travel to the whole country' },
  avoid_all_but_essential_travel_to_whole_country: { level: 3, advice: 'Advises against all but essential travel to the whole country' },
  avoid_all_travel_to_parts: { level: 3, advice: 'Advises against all travel to parts of the country' },
  avoid_all_but_essential_travel_to_parts: { level: 2, advice: 'Advises against all but essential travel to parts of the country' },
};

interface UkAdvice { report: Report; warnings: string; partial: boolean }
async function fcdo(slug: string): Promise<UkAdvice> {
  const j = await getJson(`https://www.gov.uk/api/content/foreign-travel-advice/${slug}`);
  const alerts: string[] = j.details?.alert_status || [];
  const worst = alerts.map(a => FCDO_LEVEL[a]).filter(Boolean).sort((a, b) => b.level - a.level)[0] || { level: 1 as const, advice: 'No advice against travel' };
  const warn = (j.details?.parts || []).find((p: { slug: string }) => p.slug === 'warnings-and-insurance');
  const text = warn ? strip(warn.body).replace(/^Your travel insurance could be invalidated[^.]*\.\s*/i, '') : '';
  // Countries with no warnings have a standard "before you travel" text: show the latest change instead.
  const specific = /advises against/i.test(text);
  return {
    report: {
      source: 'UK', level: worst.level, headline: worst.advice, latest: strip(j.details?.change_description || ''),
      summary: specific ? clip(text, 420) : '', updated: j.public_updated_at, url: `https://www.gov.uk/foreign-travel-advice/${slug}`,
    },
    warnings: specific ? text.slice(0, 12000) : '',
    partial: alerts.some(a => a.endsWith('_parts')),
  };
}

async function usAdvisories(): Promise<Map<string, Report>> {
  const xml = await getText('https://travel.state.gov/_res/rss/TAsTWs.xml');
  const out = new Map<string, Report>();
  for (const item of xml.split('<item>').slice(1)) {
    const title = item.match(/<title>([^<]*)<\/title>/)?.[1] || '';
    const m = title.replace(/\s+Travel Advisory/i, '').match(/^(.*?)\s*-\s*Level\s*(\d)\s*:\s*(.*)$/);
    if (!m) continue;
    const link = item.match(/<link>([^<]*)<\/link>/)?.[1] || '';
    const date = item.match(/<pubDate>([^<]*)<\/pubDate>/)?.[1] || '';
    const desc = strip(item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)?.[1] || '');
    out.set(norm(m[1]), { source: 'US', level: Number(m[2]) as 1 | 2 | 3 | 4, headline: `Level ${m[2]}: ${m[3].trim()}`, summary: clip(desc, 420), updated: date ? new Date(date).toISOString() : '', url: link });
  }
  return out;
}

async function gdacs(): Promise<SafetyEvent[]> {
  const day = (d: Date) => d.toISOString().slice(0, 10);
  const now = new Date();
  const from = new Date(now.getTime() - 21 * 864e5);
  const j = await getJson(`https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?alertlevel=Orange;Red&fromdate=${day(from)}&todate=${day(now)}`);
  const KIND: Record<string, string> = { EQ: 'Earthquake', TC: 'Tropical cyclone', FL: 'Flood', VO: 'Volcano', DR: 'Drought', WF: 'Wildfire', TS: 'Tsunami' };
  return (j.features || []).map((f: { geometry: { coordinates: [number, number] }; properties: Record<string, any> }) => ({
    kind: KIND[f.properties.eventtype] || f.properties.eventtype,
    name: String(f.properties.name || '').replace(/\s+,/g, ',').replace(/,\s*,/g, ',').replace(/\s+/g, ' ').trim(),
    level: f.properties.alertlevel,
    at: [f.geometry.coordinates[1], f.geometry.coordinates[0]] as [number, number],
    from: f.properties.fromdate, to: f.properties.todate,
    countries: String(f.properties.country || ''),
    url: f.properties.url?.report || 'https://www.gdacs.org',
  }));
}

// ---- Incidents: GDELT 2.0 event files (every 15 minutes; each event coded and geolocated from the news) ----

/** The one file inside a zip (GDELT's are single-file archives). */
function unzipOne(buf: Buffer): string {
  const eocd = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  const cd = buf.readUInt32LE(eocd + 16);
  const method = buf.readUInt16LE(cd + 10), size = buf.readUInt32LE(cd + 20), local = buf.readUInt32LE(cd + 42);
  const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
  const data = buf.subarray(start, start + size);
  return (method === 8 ? zlib.inflateRawSync(data) : data).toString('utf8');
}

// CAMEO event codes kept (specific ones only: the generic "use force" codes are mostly noise):
// riots (145x), abductions (181), bombings (183x), assassinations (186), small arms / artillery / air strikes /
// ceasefire violations (193-196), mass violence (20x).
const kindOf = (code: string) => (code.startsWith('145') ? 'Riot / violent protest' : code === '181' ? 'Kidnapping'
  : code.startsWith('183') ? 'Bombing' : code === '186' ? 'Assassination'
  : ['193', '194', '195', '196'].includes(code.slice(0, 3)) ? 'Armed clashes' : code.startsWith('20') ? 'Mass violence' : '');
interface GdeltRow { at: [number, number]; place: string; country: string; kind: string; sources: number; url: string; added: string }
const gdeltFiles = new Map<string, GdeltRow[]>();

async function gdeltFile(stamp: string): Promise<GdeltRow[]> {
  const hit = gdeltFiles.get(stamp);
  if (hit) return hit;
  const res = await get(`https://data.gdeltproject.org/gdeltv2/${stamp}.export.CSV.zip`, 30000);
  const rows: GdeltRow[] = [];
  for (const line of unzipOne(Buffer.from(await res.arrayBuffer())).split('\n')) {
    const f = line.split('\t');
    if (f.length < 61) continue;
    const kind = kindOf(f[26]);
    const geoType = Number(f[51]);
    // A city or a region (not a whole country), and reported by more than one article.
    // The article's main event (IsRootEvent), placed at a city or a region (not a whole country), in several articles.
    if (!kind || f[25] !== '1' || geoType < 3 || Number(f[33]) < 2) continue;
    // Small-arms fighting only with an armed party (military, rebels, insurgents, separatists, armed groups): that
    // leaves out ordinary shootings. Artillery, air strikes, bombings and riots don't need one.
    const ARMED = /^(MIL|REB|INS|SEP|UAF)/;
    const armed = [f[5], f[12], f[13], f[14], f[15], f[22], f[23], f[24]].some(x => ARMED.test(x || '') || /(MIL|REB|INS|SEP|UAF)$/.test(x || ''));
    if (f[26].startsWith('193') && !armed) continue;
    const lat = Number(f[56]), lng = Number(f[57]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) continue;
    const parts = f[52].split(',').map(s => s.trim());
    rows.push({ at: [lat, lng], place: parts[0], country: parts[parts.length - 1], kind, sources: Number(f[32]) || 1, url: f[60].trim(), added: f[59] });
  }
  gdeltFiles.set(stamp, rows);
  return rows;
}

export async function incidents(hours = 24): Promise<SafetyIncident[]> {
  const last = (await getText('https://data.gdeltproject.org/gdeltv2/lastupdate.txt')).match(/(\d{14})\.export/)?.[1];
  if (!last) return [];
  const t0 = Date.UTC(+last.slice(0, 4), +last.slice(4, 6) - 1, +last.slice(6, 8), +last.slice(8, 10), +last.slice(10, 12));
  const stamps = Array.from({ length: hours * 4 }, (_, i) => new Date(t0 - i * 900e3).toISOString().replace(/\D/g, '').slice(0, 14));
  for (const s of [...gdeltFiles.keys()]) if (!stamps.includes(s)) gdeltFiles.delete(s);
  const rows = (await pool(stamps, 4, gdeltFile)).flatMap(r => r || []);
  // Grouped by place (about 50 km), counting distinct reports.
  const groups = new Map<string, { rows: GdeltRow[] }>();
  for (const r of rows) {
    const key = `${Math.round(r.at[0] * 2) / 2},${Math.round(r.at[1] * 2) / 2}`;
    const g = groups.get(key) || { rows: [] };
    g.rows.push(r);
    groups.set(key, g);
  }
  const out: SafetyIncident[] = [];
  for (const { rows: g } of groups.values()) {
    const urls = [...new Set(g.map(r => r.url).filter(u => /^https?:\/\//.test(u)))];
    if (urls.length < 3) continue; // one story repeated is not enough
    const kinds = new Map<string, number>();
    for (const r of g) kinds.set(r.kind, (kinds.get(r.kind) || 0) + 1);
    const kind = [...kinds.entries()].sort((a, b) => b[1] - a[1])[0][0];
    const places = new Map<string, number>();
    for (const r of g) places.set(r.place, (places.get(r.place) || 0) + 1);
    const place = [...places.entries()].sort((a, b) => b[1] - a[1])[0][0];
    const lat = g.reduce((n, r) => n + r.at[0], 0) / g.length, lng = g.reduce((n, r) => n + r.at[1], 0) / g.length;
    const title = (u: string) => { try { const x = new URL(u); const slug = x.pathname.split('/').filter(Boolean).pop() || ''; return `${x.hostname.replace(/^www\./, '')}: ${decodeURIComponent(slug).replace(/\.\w+$/, '').replace(/[-_]+/g, ' ').replace(/\b\d{5,}\b/g, '').trim().slice(0, 90)}`; } catch { return u; } };
    out.push({
      at: [Math.round(lat * 1e3) / 1e3, Math.round(lng * 1e3) / 1e3], place, country: g[0].country, kind,
      events: g.length, sources: urls.length, links: urls.slice(0, 6).map(u => ({ title: title(u), url: u })),
      last: g.map(r => r.added).sort().pop() || '',
    });
  }
  return out.sort((a, b) => b.sources - a.sources).slice(0, 150);
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

// ---- Advice areas: read once per change of a country's advice, then placed with OpenStreetMap ----
const geoCache = new Map<string, [number, number] | null>();
async function geocode(q: string): Promise<[number, number] | null> {
  if (geoCache.has(q)) return geoCache.get(q)!;
  let at: [number, number] | null = null;
  try {
    const r = await (await get(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=jsonv2&limit=1`, 20000)).json();
    if (r[0]) at = [Math.round(Number(r[0].lat) * 1e3) / 1e3, Math.round(Number(r[0].lon) * 1e3) / 1e3];
  } catch { /* not found */ }
  geoCache.set(q, at);
  await sleep(1100); // Nominatim: one request a second
  return at;
}

/** The AI shares its quota with the travellers' trip planning: at most this many advice texts are read per build
 *  (the rest wait for the next one), and a text already read is never read again. */
const MAX_AI_READS = 8;
interface AreaBudget { reads: number; checked: Record<string, string> }

async function adviceAreas(country: Country, uk: UkAdvice, read: AreaReader | undefined, previous: SafetyArea[], budget: AreaBudget): Promise<SafetyArea[]> {
  if (!uk.partial && uk.report.level < 4) return [];
  // Same advice as last time: keep the areas already placed (or none, if it was read and named no places).
  const kept = previous.filter(a => a.country === country.name && a.updated === uk.report.updated);
  if (kept.length || budget.checked[country.name] === uk.report.updated || !read || !uk.warnings || budget.reads >= MAX_AI_READS) return kept;
  budget.reads++;
  let found: Awaited<ReturnType<AreaReader>>;
  try { found = await read(country.name, uk.warnings); } catch { return kept; } // busy: try again next build
  budget.checked[country.name] = uk.report.updated;
  const out: SafetyArea[] = [];
  for (const a of found.slice(0, 14)) {
    const at = await geocode(a.place);
    if (!at) continue;
    // Well away from the country (a wrong match)? Leave it out.
    if (Math.hypot(at[0] - country.at[0], at[1] - country.at[1]) > 35) continue;
    out.push({ country: country.name, name: a.name.slice(0, 80), at, level: a.level === 'all' ? 4 : 3, note: a.note.slice(0, 200), updated: uk.report.updated, url: uk.report.url });
  }
  return out;
}

export interface BuildOptions { readAreas?: AreaReader; previous?: SafetyData | null; adviceToo?: boolean }

export async function buildSafety(opts: BuildOptions = {}): Promise<SafetyData> {
  const prev = opts.previous || null;
  const doAdvice = opts.adviceToo !== false || !prev;
  const [inc, events] = await Promise.all([
    incidents().catch(err => { console.warn('[safety] incidents', String(err)); return prev?.incidents || []; }),
    gdacs().catch(() => prev?.events || []),
  ]);
  if (!doAdvice && prev) return { ...prev, updated: new Date().toISOString(), incidents: inc, events };

  const countries = allCountries();
  const [us, uk] = await Promise.all([
    usAdvisories().catch(() => new Map<string, Report>()),
    pool(countries, 6, c => (c.fcdo ? fcdo(c.fcdo) : Promise.reject(new Error('no UK advice')))),
  ]);
  const areas: SafetyArea[] = [];
  const out: SafetyCountry[] = [];
  // Countries whose areas were read before keep that mark (from the areas already placed, for older saved data).
  const budget: AreaBudget = { reads: 0, checked: { ...Object.fromEntries((prev?.areas || []).map(a => [a.country, a.updated])), ...(prev?.checked || {}) } };
  const twoWeeks = Date.now() - 14 * 864e5;
  for (let i = 0; i < countries.length; i++) {
    const c = countries[i], u = uk[i];
    const usReport = [c.name, ...(c.us || []), ...(US_ALIASES[c.name] || [])].map(n => us.get(norm(n))).find(Boolean);
    const reports = [u?.report, usReport].filter((r): r is Report => Boolean(r)).sort((a, b) => Date.parse(b.updated || '0') - Date.parse(a.updated || '0'));
    if (!reports.length) continue;
    const mine = u ? await adviceAreas(c, u, opts.readAreas, prev?.areas || [], budget) : [];
    areas.push(...mine);
    const level = Math.max(...reports.map(r => r.level)) as 1 | 2 | 3 | 4;
    const recent = reports.some(r => Date.parse(r.updated || '0') > twoWeeks);
    out.push({ name: c.name, ...(c.region ? { region: c.region } : {}), at: c.at, level, reports, recent, areas: mine.length });
  }
  if (!out.length) throw new Error('no safety source answered');
  const now = new Date().toISOString();
  return {
    updated: now, adviceUpdated: now, countries: out, areas, incidents: inc, events, checked: budget.checked,
    sources: [
      { label: 'UK FCDO travel advice', url: 'https://www.gov.uk/foreign-travel-advice' },
      { label: 'US State Department travel advisories', url: 'https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories.html' },
      { label: 'GDELT news events', url: 'https://www.gdeltproject.org' },
      { label: 'GDACS (UN/EU disaster alerts)', url: 'https://www.gdacs.org' },
    ],
  };
}

/** GET /api/safety. Incidents and hazards are rebuilt in the background when older than 3 hours, travel advice when
 *  older than 12. Until the first build finishes, the copy saved with the app is served (and seeds the areas). */
export function safetyApi(readAreas?: AreaReader): Plugin {
  const FAST = 3 * 3600e3, SLOW = 12 * 3600e3;
  let data: SafetyData | null = null;
  let building: Promise<void> | null = null;
  let savedPath = '';
  const saved = (): SafetyData | null => { try { return JSON.parse(fs.readFileSync(savedPath, 'utf8')); } catch { return null; } };
  const refresh = () => {
    const base = data || saved();
    const adviceToo = !base || !base.adviceUpdated || Date.now() - Date.parse(base.adviceUpdated) > SLOW;
    building ??= buildSafety({ readAreas, previous: base, adviceToo }).then(d => { data = d; }).catch(err => console.warn('[safety]', String(err))).finally(() => { building = null; });
    return building;
  };
  const handler = (file: string): Connect.NextHandleFunction => async (req, res: ServerResponse, next) => {
    if ((req.url || '').split('?')[0] !== '/api/safety') return next();
    savedPath = file;
    const current = data || saved();
    if (!current || Date.now() - Date.parse(current.updated) > FAST) {
      const job = refresh();
      if (!current) await Promise.race([job, sleep(25000)]);
    }
    const body = data || current;
    if (!body) { res.statusCode = 503; res.end('{"error":"safety data unavailable"}'); return; }
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=900');
    res.end(JSON.stringify(body));
  };
  return {
    name: 'safety-api',
    configureServer(server) { server.middlewares.use(handler(path.resolve(server.config.root, 'public/safety/latest.json'))); },
    configurePreviewServer(server) { server.middlewares.use(handler(path.resolve(server.config.root, server.config.build.outDir, 'safety/latest.json'))); },
  };
}

// ---- The AI reading of advice areas (used by the server and the build script) ----
export function areasPrompt(country: string, text: string) {
  return `Below is the UK Foreign Office travel advice for ${country} (the "warnings" page). List the specific places it
advises against ALL travel or against all but ESSENTIAL travel to: regions, provinces, districts, cities, border zones,
roads. For each give:
- name: a short label (e.g. "Far North region", "Within 10 km of the border with Afghanistan", "Road from X to Y");
- place: a place OpenStreetMap can find, with the country, at the middle of that area (a region or province name; for a
  border zone the main border town or district; for a road the town at its middle), e.g. "Extreme-Nord, Cameroon";
- level: "all" (against all travel) or "essential" (against all but essential travel);
- note: why, in at most 15 words (e.g. "terrorism and kidnapping", "armed conflict").
At most 14 places. If the advice covers the whole country, return one item for the whole country. Return an empty list
if it names no specific places.

${text.slice(0, 12000)}`;
}
export const areasJsonSchema = {
  type: 'object',
  properties: { areas: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, place: { type: 'string' }, level: { type: 'string', enum: ['all', 'essential'] }, note: { type: 'string' } }, required: ['name', 'place', 'level', 'note'], additionalProperties: false } } },
  required: ['areas'],
  additionalProperties: false,
};
export const areasGeminiSchema = {
  type: Type.OBJECT,
  properties: { areas: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, place: { type: Type.STRING }, level: { type: Type.STRING, enum: ['all', 'essential'] }, note: { type: Type.STRING } }, required: ['name', 'place', 'level', 'note'] } } },
  required: ['areas'],
};
