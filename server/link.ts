// Reading a shared link (a Booking.com or Airbnb share, a Google Maps place, a blog or social-media post) so the
// trip can be built from it: the page's title, share preview (Open Graph), structured data (schema.org JSON-LD,
// which Booking and many sites include with the address and coordinates), dates and coordinates in the link itself.
// Only public http(s) addresses are fetched (never the server's own network), with a short timeout and size cap.
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

export interface LinkInfo {
  url: string;
  finalUrl: string;
  site: string;
  title?: string;
  description?: string;
  /** Name, kind and address from structured data, when the page has it. */
  place?: { name?: string; kind?: string; address?: string };
  position?: { lat: number; lng: number };
  checkIn?: string;
  checkOut?: string;
  /** The start of the page's readable text. */
  text?: string;
  /** The page couldn't be read (blocked, login wall…): only what the link itself says is known. */
  unreadable?: boolean;
}

// ---- Safety: public addresses only ----

function privateIp(ip: string): boolean {
  if (isIP(ip) === 6) {
    const v = ip.toLowerCase();
    if (v === '::1' || v === '::' || v.startsWith('fc') || v.startsWith('fd') || v.startsWith('fe80')) return true;
    const mapped = v.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    return mapped ? privateIp(mapped[1]) : false;
  }
  const [a, b] = ip.split('.').map(Number);
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
}

/** An address that is obviously local (localhost, a private IP, not http/https): never opened, not even looked at. */
export function isLocalUrl(raw: string): boolean {
  let url: URL;
  try { url = new URL(raw); } catch { return true; }
  if (!/^https?:$/.test(url.protocol) || url.username || url.password) return true;
  const host = url.hostname.replace(/^\[|\]$/g, '');
  return /^(localhost|.*\.local|.*\.internal)$/i.test(host) || (isIP(host) > 0 && privateIp(host));
}

/** True for an http(s) URL whose host resolves only to public addresses. */
export async function isPublicUrl(raw: string): Promise<boolean> {
  let url: URL;
  try { url = new URL(raw); } catch { return false; }
  if (!/^https?:$/.test(url.protocol) || url.username || url.password) return false;
  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (/^(localhost|.*\.local|.*\.internal)$/i.test(host)) return false;
  if (isIP(host)) return !privateIp(host);
  try {
    const addresses = await lookup(host, { all: true });
    return addresses.length > 0 && addresses.every(a => !privateIp(a.address));
  } catch {
    return false;
  }
}

// ---- What the link itself says ----

const num = (s?: string | null) => (s != null && s !== '' && Number.isFinite(Number(s)) ? Number(s) : undefined);
const valid = (lat?: number, lng?: number) =>
  lat !== undefined && lng !== undefined && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0) ? { lat, lng } : undefined;

/** Coordinates in map links: Google Maps (!3d…!4d…, @lat,lng, q=lat,lng, ll=), Apple Maps, OpenStreetMap. */
export function coordsFromUrl(raw: string): { lat: number; lng: number } | undefined {
  const s = decodeURIComponent(raw);
  const pin = s.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);          // the place's own pin (better than the view)
  if (pin) return valid(num(pin[1]), num(pin[2]));
  let url: URL | null = null;
  try { url = new URL(raw); } catch { /* not a URL */ }
  for (const key of ['q', 'query', 'll', 'destination', 'daddr', 'center']) {
    const m = url?.searchParams.get(key)?.match(/^\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
    if (m) return valid(num(m[1]), num(m[2]));
  }
  const mlat = num(url?.searchParams.get('mlat')), mlon = num(url?.searchParams.get('mlon'));
  if (mlat !== undefined) return valid(mlat, mlon);
  const at = s.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (at) return valid(num(at[1]), num(at[2]));
  return undefined;
}

/** Check-in/out dates in booking links (Booking.com checkin/checkout, Airbnb check_in/check_out, others). */
export function datesFromUrl(raw: string): { checkIn?: string; checkOut?: string } {
  let url: URL;
  try { url = new URL(raw); } catch { return {}; }
  const p = url.searchParams;
  const date = (...keys: string[]) => keys.map(k => p.get(k)).find(v => v && /^\d{4}-\d{2}-\d{2}$/.test(v)) || undefined;
  return { checkIn: date('checkin', 'check_in', 'checkInDate', 'arrival', 'from'), checkOut: date('checkout', 'check_out', 'checkOutDate', 'departure', 'to') };
}

// ---- What the page says ----

const decode = (s: string) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).trim();

function meta(html: string, name: string): string | undefined {
  const re = new RegExp(`<meta[^>]+(?:property|name|itemprop)=["']${name.replace(/[:.]/g, '\\$&')}["'][^>]*>`, 'i');
  const tag = html.match(re)?.[0];
  const content = tag?.match(/content=["']([^"']*)["']/i)?.[1];
  return content ? decode(content) : undefined;
}

const PLACE_TYPES = /Hotel|Lodging|Hostel|Motel|Resort|Campground|BedAndBreakfast|Apartment|House|VacationRental|Restaurant|Cafe|FoodEstablishment|BarOrPub|TouristAttraction|LandmarksOrHistoricalBuildings|Museum|Park|Place|LocalBusiness|Store|Event/;

function jsonLdPlace(html: string): { name?: string; kind?: string; address?: string; position?: { lat: number; lng: number } } | undefined {
  const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
  const nodes: any[] = [];
  for (const block of blocks) {
    try {
      const data = JSON.parse(block.trim());
      const walk = (x: any) => { if (Array.isArray(x)) x.forEach(walk); else if (x && typeof x === 'object') { nodes.push(x); if (x['@graph']) walk(x['@graph']); } };
      walk(data);
    } catch { /* invalid JSON-LD: skip */ }
  }
  const node = nodes.find(n => PLACE_TYPES.test(String(n['@type'] || '')) && (n.name || n.address));
  if (!node) return undefined;
  const a = node.address || node.location?.address;
  const address = typeof a === 'string' ? a
    : a ? [a.streetAddress, a.postalCode, a.addressLocality, a.addressRegion, typeof a.addressCountry === 'string' ? a.addressCountry : a.addressCountry?.name].filter(Boolean).join(', ') : undefined;
  const g = node.geo || node.location?.geo;
  return {
    name: node.name ? decode(String(node.name)) : undefined,
    kind: String(node['@type']),
    address: address || undefined,
    position: g ? valid(num(String(g.latitude)), num(String(g.longitude))) : undefined,
  };
}

function readableText(html: string): string {
  return decode(html
    .replace(/<(script|style|noscript|svg|head)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')).slice(0, 3000);
}

/** Everything useful in a page, plus what the link itself says. */
export function parseLinkHtml(html: string, url: string, finalUrl = url): LinkInfo {
  const ld = jsonLdPlace(html);
  const lat = num(meta(html, 'place:location:latitude') || meta(html, 'og:latitude')) ?? num(meta(html, 'latitude'));
  const lng = num(meta(html, 'place:location:longitude') || meta(html, 'og:longitude')) ?? num(meta(html, 'longitude'));
  const dates = { ...datesFromUrl(url), ...Object.fromEntries(Object.entries(datesFromUrl(finalUrl)).filter(([, v]) => v)) };
  return {
    url, finalUrl,
    site: meta(html, 'og:site_name') || new URL(finalUrl).hostname.replace(/^www\./, ''),
    title: meta(html, 'og:title') || meta(html, 'twitter:title') || html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim().replace(/\s+/g, ' '),
    description: meta(html, 'og:description') || meta(html, 'description') || meta(html, 'twitter:description'),
    place: ld && { name: ld.name, kind: ld.kind, address: ld.address },
    position: ld?.position || valid(lat, lng) || coordsFromUrl(finalUrl) || coordsFromUrl(url),
    ...dates,
    text: readableText(html),
  };
}

// ---- Google Maps links: everything needed is in the address (the page itself is blocked or a cookie wall) ----

const GOOGLE_HOST = /(^|\.)google\.[a-z.]+$/i;

/** A full Google Maps address (not a short link): www.google.<tld>/maps/…, maps.google.<tld>/… */
export function isGoogleMapsUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    return GOOGLE_HOST.test(u.hostname) && (u.pathname.startsWith('/maps') || u.hostname.startsWith('maps.'));
  } catch { return false; }
}

/** Google's cookie page ("Before you continue") keeps the address it was going to in `continue`. */
export function pastConsent(raw: string): string | null {
  try {
    const u = new URL(raw);
    return /^consent\.google\./i.test(u.hostname) ? u.searchParams.get('continue') : null;
  } catch { return null; }
}

/** The place in a Google Maps address: its name (/maps/place/<name>/, or the search text) and position. */
export function googleMapsPlace(raw: string): { name?: string; position?: { lat: number; lng: number } } {
  let u: URL;
  try { u = new URL(raw); } catch { return {}; }
  const named = u.pathname.match(/\/maps\/(?:place|search)\/([^/@]+)/);
  let name = named ? decodeURIComponent(named[1].replace(/\+/g, ' ')).trim() : '';
  const q = u.searchParams.get('q') || u.searchParams.get('query') || '';
  if (!name && q && !/^\s*-?\d+\.\d+\s*,\s*-?\d+\.\d+\s*$/.test(q)) name = q.trim();
  return { name: name || undefined, position: coordsFromUrl(raw) };
}

/** Fetch a public link (following up to 4 redirects, each checked) and read it. Never throws. */
export async function readLink(url: string): Promise<LinkInfo> {
  const fromUrl = (u: string): LinkInfo => ({ url, finalUrl: u, site: (() => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return 'link'; } })(),
    position: coordsFromUrl(u) || coordsFromUrl(url), ...datesFromUrl(u), unreadable: true });
  let current = url;
  try {
    for (let hop = 0; hop < 5; hop++) {
      // Google's cookie page: go where it was going. A full Google Maps address: read it, don't open it.
      const resumed = pastConsent(current);
      if (resumed) { current = resumed; continue; }
      if (isGoogleMapsUrl(current)) {
        const place = googleMapsPlace(current);
        if (place.name || place.position) {
          return { url, finalUrl: current, site: 'Google Maps', title: place.name, position: place.position,
            text: place.name ? `A place on Google Maps: ${place.name}` : 'A point on Google Maps' };
        }
      }
      if (!(await isPublicUrl(current))) return fromUrl(current);
      const res = await fetch(current, {
        redirect: 'manual',
        signal: AbortSignal.timeout(8000),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml', 'Accept-Language': 'en,pt;q=0.8',
        },
      });
      const next = res.headers.get('location');
      if (res.status >= 300 && res.status < 400 && next) { current = new URL(next, current).toString(); continue; }
      if (!res.ok || !/html|text/.test(res.headers.get('content-type') || 'text/html')) return fromUrl(current);
      // Read at most ~1.5 MB.
      const reader = res.body?.getReader();
      let html = '', size = 0;
      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.length;
        html += new TextDecoder().decode(value, { stream: true });
        if (size > 1_500_000) { reader.cancel().catch(() => {}); break; }
      }
      const info = parseLinkHtml(html, url, current);
      return info.title || info.place || info.description ? info : { ...info, unreadable: true };
    }
  } catch {
    /* timeout, refused, TLS: fall through */
  }
  return fromUrl(current);
}

/** The link's information as text for the AI. */
export function linkAsText(info: LinkInfo): string {
  return [
    `Link: ${info.url}`, info.finalUrl !== info.url ? `Opens: ${info.finalUrl}` : '',
    `Site: ${info.site}`,
    info.title ? `Title: ${info.title}` : '', info.description ? `Description: ${info.description}` : '',
    info.place ? `Structured data: ${[info.place.kind, info.place.name, info.place.address].filter(Boolean).join(' | ')}` : '',
    info.position ? `Coordinates: ${info.position.lat}, ${info.position.lng}` : '',
    info.checkIn || info.checkOut ? `Dates in the link: ${info.checkIn || '?'} to ${info.checkOut || '?'}` : '',
    info.unreadable ? 'The page itself could not be read; use what the link says.' : '',
    info.text ? `Page text (start): ${info.text}` : '',
  ].filter(Boolean).join('\n');
}
