// A photo and short description of a stop, from Wikipedia (free; text and images CC BY-SA).
// The town's own article, looked up by name and checked to be near the stop; otherwise the nearest landmark
// with a picture (never a whole province, district or region). Fetched only when a stop's card opens, and cached.
import { LatLng, haversineKm } from './geo';

export interface PlaceHighlight {
  title: string;
  extract: string;
  image: string;
  url: string;
}

interface WikiPage {
  title: string;
  index?: number;
  extract?: string;
  fullurl?: string;
  thumbnail?: { source: string };
  coordinates?: { lat: number; lon: number }[];
  pageprops?: { disambiguation?: string };
  missing?: string;
}

/** Areas, not places to look at: a province's map point can sit next to a town and hide the town's own article. */
const AREA = /\b(province|district|region|county|municipality|parish|subregion|freguesia|concelho|distrito|regi[aã]o|prov[ií]ncia|munic[ií]pio)\b/i;

const cache = new Map<string, Promise<PlaceHighlight | null>>();

/** The town part of a stop name: "Tavira, Portugal" → "Tavira"; "Near Alcoutim, Portugal" → "Alcoutim". */
export function townName(location: string) {
  return location.split(',')[0].replace(/^(Near|Perto de)\s+/i, '').trim();
}

/** Prefer the town's own article (with a picture), else the nearest article with a picture and some text. */
export function pickHighlight(pages: WikiPage[], town: string, lang = 'en'): PlaceHighlight | null {
  const withImage = pages
    .filter(p => p.thumbnail?.source && p.extract?.trim())
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  const name = town.toLowerCase();
  const own = withImage.find(p => p.title.toLowerCase() === name || p.title.toLowerCase().startsWith(`${name},`));
  const page = own || withImage.find(p => !AREA.test(p.title));
  if (!page) return null;
  return {
    title: page.title,
    extract: page.extract!.trim(),
    image: page.thumbnail!.source,
    url: page.fullurl || `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}`,
  };
}

/** The highlight for a stop, from Wikipedia in the given language (falls back to English). */
export function placeHighlight(location: string, at: LatLng, lang: 'en' | 'pt' = 'en'): Promise<PlaceHighlight | null> {
  if (lang === 'en') return fetchHighlight(location, at, 'en');
  return fetchHighlight(location, at, lang).then(h => h || fetchHighlight(location, at, 'en'));
}

function fetchHighlight(location: string, at: LatLng, lang: string): Promise<PlaceHighlight | null> {
  const key = `${lang}:${location}:${at.lat.toFixed(3)},${at.lng.toFixed(3)}`;
  if (!cache.has(key)) {
    const town = townName(location);
    const country = location.split(',').slice(1).join(',').trim();
    const pending = (async () => {
      // 1. The town's own article by name ("Lisbon", or "Beja, Portugal" where the plain name is ambiguous).
      const titles = [town, country ? `${town}, ${country}` : ''].filter(Boolean).join('|');
      const named = await wikiQuery(lang, { titles, redirects: '1', exlimit: '2', ...PAGE_PROPS }).catch(() => []);
      const own = pickTownPage(named, at, 25, lang);
      if (own) return own;
      // 2. Articles near the stop: the town's if listed, else the nearest landmark with a picture.
      const near = await wikiQuery(lang, {
        generator: 'geosearch', ggscoord: `${at.lat}|${at.lng}`, ggsradius: '10000', ggslimit: '15', exlimit: '15', ...PAGE_PROPS,
      });
      return pickHighlight(near, town, lang);
    })().catch(err => { console.warn('No Wikipedia highlight:', err); cache.delete(key); return null; });
    cache.set(key, pending);
  }
  return cache.get(key)!;
}

/**
 * The town's own article among pages looked up by title: a real article (not a disambiguation page) with a picture,
 * whose coordinates are within `maxKm` of the stop, so "Beja" in Portugal never shows a Beja elsewhere.
 */
export function pickTownPage(pages: WikiPage[], at: LatLng, maxKm = 25, lang = 'en'): PlaceHighlight | null {
  const page = pages.find(p => p.missing === undefined && !(p.pageprops && 'disambiguation' in p.pageprops) && p.thumbnail?.source && p.extract?.trim()
    && p.coordinates?.[0] && haversineKm(at, { lat: p.coordinates[0].lat, lng: p.coordinates[0].lon }) <= maxKm);
  if (!page) return null;
  return {
    title: page.title,
    extract: page.extract!.trim(),
    image: page.thumbnail!.source,
    url: page.fullurl || `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}`,
  };
}

const PAGE_PROPS = {
  prop: 'pageimages|extracts|info|coordinates|pageprops', piprop: 'thumbnail', pithumbsize: '480',
  exintro: '1', explaintext: '1', exsentences: '2', inprop: 'url', ppprop: 'disambiguation',
};

async function wikiQuery(lang: string, params: Record<string, string>): Promise<WikiPage[]> {
  const res = await fetch(`https://${lang}.wikipedia.org/w/api.php?${new URLSearchParams({ action: 'query', format: 'json', origin: '*', ...params })}`);
  if (!res.ok) throw new Error(`Wikipedia ${res.status}`);
  return Object.values((await res.json()).query?.pages || {}) as WikiPage[];
}
