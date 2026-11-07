// A photo and short description of a stop, from Wikipedia (free; text and images CC BY-SA).
// Searches articles near the stop: the town's own article if it has a picture, otherwise the nearest
// landmark with one. Fetched only when a stop's card opens, and cached.
import { LatLng } from './geo';

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
}

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
  const page = own || withImage[0];
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
  const key = `${lang}:${at.lat.toFixed(3)},${at.lng.toFixed(3)}`;
  if (!cache.has(key)) {
    const params = new URLSearchParams({
      action: 'query', format: 'json', origin: '*',
      generator: 'geosearch', ggscoord: `${at.lat}|${at.lng}`, ggsradius: '10000', ggslimit: '15',
      prop: 'pageimages|extracts|info', piprop: 'thumbnail', pithumbsize: '480',
      exintro: '1', explaintext: '1', exsentences: '2', exlimit: '15', inprop: 'url',
    });
    const pending = fetch(`https://${lang}.wikipedia.org/w/api.php?${params}`)
      .then(res => (res.ok ? res.json() : Promise.reject(new Error(`Wikipedia ${res.status}`))))
      .then(data => pickHighlight(Object.values(data.query?.pages || {}) as WikiPage[], townName(location), lang))
      .catch(err => { console.warn('No Wikipedia highlight:', err); cache.delete(key); return null; });
    cache.set(key, pending);
  }
  return cache.get(key)!;
}
