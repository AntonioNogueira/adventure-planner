// Map pieces: place and stop popups, stop pins, and the rider's position marker.
import { useSettings, t as tr } from '../lib/settings';
import { stayUrl, toursUrl, offerFor, Nights } from '../lib/affiliate';
import React, { useEffect, useState } from 'react';
import StopDetails from './StopDetails';
import { placeHighlight, PlaceHighlight, townName } from '../lib/wiki';
import { LatLng } from '../lib/geo';
import { InterestCategory, InterestItem, RouteInfo, StopKind, StopRef, Waypoint } from '../types';
import { CATEGORIES, CategoryId, categoryLabel } from '../lib/places';
import { mapSearchUrl, mapSiteName } from '../lib/provider';

export type MapPoint = Partial<Waypoint> & {
  location: string; kind: StopKind; ref: StopRef; label: string; badge: string; interests: InterestCategory[];
};

/** Start, overnight stops and finish, each with its suggestions and bookings. */
export function buildPoints(origin: string | undefined, waypoints: Waypoint[], destination: string | undefined, routeInfo?: RouteInfo | null): MapPoint[] {
  return [
    ...(origin ? [{ location: origin, kind: 'start' as const, ref: { kind: 'start' as const }, label: tr('Start'), badge: 'S', interests: routeInfo?.originInterests || [] }] : []),
    ...waypoints.map((wp, i) => ({
      ...wp, kind: 'stop' as const, ref: { kind: 'stop' as const, index: i }, label: tr('Stop {n}', { n: i + 1 }), badge: String(i + 1),
      interests: routeInfo?.waypoints[i]?.interests || wp.interests || [],
    })),
    ...(destination ? [{ location: destination, kind: 'end' as const, ref: { kind: 'end' as const }, label: tr('Finish'), badge: 'F', interests: routeInfo?.destinationInterests || [] }] : []),
  ];
}

export const PIN_COLORS: Record<StopKind, string> = { start: '#2f4a6d', stop: '#3f5d45', end: '#7a1f1a' };

export const refKey = (ref: StopRef) => ref.kind === 'stop' ? `stop-${ref.index}` : ref.kind;

interface PlacePopupProps {
  item: InterestItem;
  categoryId: CategoryId;
  point: MapPoint;
  onRemove: () => void;
  /** Nights at the stop: dates for "Check prices". */
  nights?: Nights;
  /** Ride mode: navigate to this place now. */
  onGoto?: (at: { lat: number; lng: number }) => void;
}

/** The card for a suggestion or booking pin. */
export const PlacePopup: React.FC<PlacePopupProps> = ({ item, categoryId, point, onRemove, nights, onGoto }) => {
  const { t, date } = useSettings();
  const isBooking = item.source === 'reservation';
  const offer = offerFor(item.category || categoryId, item.source);
  const cat = CATEGORIES[categoryId];
  const r = item.reservation;
  const at = isBooking ? (r?.lat != null && r?.lng != null ? { lat: r.lat, lng: r.lng } : undefined)
    : item.lat != null && item.lng != null ? { lat: item.lat, lng: item.lng } : undefined;
  const link = isBooking && r?.address ? mapSearchUrl(r.address, at) : item.url || mapSearchUrl(`${item.name} ${point.location}`, at);
  const linkLabel = !isBooking && item.url && !/openstreetmap\.org|google\.com\/maps|maps\.google/.test(item.url) ? t('Website') : t('Open in {site}', { site: mapSiteName });
  return (
    <div className="w-[240px] max-w-[70vw] space-y-1 p-1 font-sans text-xs">
      <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: isBooking ? '#6d28d9' : cat.color }}>
        {cat.glyph} {isBooking ? `${t('Booked')} · ` : ''}{t(categoryLabel(categoryId))}
      </p>
      <p className="text-sm font-semibold text-slate-900">{item.name}</p>
      {isBooking && r?.checkIn && <p className="text-slate-700">{[r.checkIn, r.checkOut].filter(Boolean).join(' → ')}</p>}
      {isBooking && r?.confirmation && <p className="text-slate-700">{t('Ref:')} <b>{r.confirmation}</b></p>}
      {item.description && <p className="text-slate-500">{item.description}</p>}
      <p className="text-slate-400">{t('Near {stop}: {place}', { stop: point.label, place: point.location })}</p>
      {onGoto && at && (
        <button onClick={() => onGoto(at)}
          className="mt-1 flex w-full items-center justify-center gap-1 rounded-sm bg-blue-600 px-2 py-1.5 font-bold text-white hover:bg-blue-700">
          ➜ {t('Go to')}
        </button>
      )}
      <div className="flex gap-3 pt-1">
        <a href={link} target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-700 hover:underline">{linkLabel}</a>
        {at && !isBooking && item.url && linkLabel === t('Website') && (
          <a href={mapSearchUrl(`${item.name} ${point.location}`, at)} target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-700 hover:underline">{mapSiteName}</a>
        )}
        <button className="font-semibold text-red-600 hover:underline" onClick={onRemove}>{t('Remove')}</button>
      </div>
      {offer && (
        <div className="space-y-0.5 border-t pt-1.5">
          <a href={offer === 'stay' ? stayUrl(item, townName(point.location), nights) : toursUrl(item.name, townName(point.location))}
            target="_blank" rel="noopener noreferrer sponsored"
            className="block rounded-sm bg-violet-600 px-2 py-1.5 text-center font-semibold text-white hover:bg-violet-700">
            {offer === 'stay' ? t('Check prices & reviews') : t('Tickets & tours')}
            {offer === 'stay' && nights && <span className="font-normal"> · {date(nights.checkIn)} → {date(nights.checkOut)}</span>}
          </a>
          <p className="text-[9px] text-slate-400">{t('We may earn a commission when you book through these links.')}</p>
        </div>
      )}
    </div>
  );
};

/**
 * A stop pin with its number and town name ("③ Tavira"), like a Google Maps label. The name hides when
 * the map is zoomed far out (see .stop-labels-hidden in index.css) so long trips stay readable.
 */
export function stopPinElement(kind: StopKind, badge: string, location: string, title: string): HTMLElement {
  const color = PIN_COLORS[kind];
  const el = document.createElement('div');
  el.title = title;
  el.className = 'stop-pin';
  // A squared map tag: number box + place name, with a pointer to the spot.
  el.innerHTML = `
    <div style="display:flex;align-items:center;gap:6px;background:#fffcf4;border:1.5px solid ${color};border-radius:2px;
      padding:2px 8px 2px 2px;box-shadow:2px 2px 0 rgba(42,38,32,.25);font:600 11px/1 'IBM Plex Mono',ui-monospace,monospace;
      letter-spacing:.02em;color:#2a2620;white-space:nowrap;cursor:pointer;">
      <span style="display:flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:1px;
        background:${color};color:#fffcf4;font-size:11px;">${badge}</span>
      <span class="stop-pin-label"></span>
    </div>
    <div style="width:0;height:0;margin:0 auto;border-left:5px solid transparent;border-right:5px solid transparent;
      border-top:7px solid ${color};"></div>`;
  // Set as text, not HTML, since the name comes from geocoding results.
  el.querySelector('.stop-pin-label')!.textContent = townName(location);
  return el;
}

interface StopPopupProps extends React.ComponentProps<typeof StopDetails> {
  at: LatLng;
}

/** A stop's card: a Wikipedia photo and description of the place on top, then its details. */
export const StopPopup: React.FC<StopPopupProps> = ({ at, ...details }) => {
  const { t, settings } = useSettings();
  const [highlight, setHighlight] = useState<PlaceHighlight | null | undefined>(undefined);
  useEffect(() => {
    let live = true;
    placeHighlight(details.location, at, settings.language.startsWith('pt') ? 'pt' : 'en').then(h => { if (live) setHighlight(h); });
    return () => { live = false; };
  }, [details.location, at.lat, at.lng, settings.language]);

  return (
    <div className="w-[340px] max-w-[78vw] font-sans">
      {/* A small photo and two lines about the place (Wikipedia): enough to recognise it, without a big image. */}
      {highlight === undefined && <div className="mb-1.5 h-14 w-full animate-pulse rounded-md bg-slate-100" />}
      {highlight && (
        <a href={highlight.url} target="_blank" rel="noopener noreferrer" className="group mb-1.5 flex gap-2 rounded-md hover:bg-slate-50">
          <img src={highlight.image} alt={highlight.title} loading="lazy" className="h-14 w-14 shrink-0 rounded-md object-cover" />
          <span className="min-w-0">
            <span className="block truncate text-xs font-semibold text-slate-800">{highlight.title}</span>
            <span className="line-clamp-2 text-[10.5px] leading-snug text-slate-600">{highlight.extract}</span>
            <span className="block text-[9px] text-slate-400">Wikipedia (CC BY-SA) · {t('read more')}</span>
          </span>
        </a>
      )}
      <StopDetails {...details} />
    </div>
  );
};

// ---- Ride mode on the map ----

/** Navigation colours: the part still to ride, its white edge, and the part already ridden. */
export const RIDE_COLORS = { ahead: '#1a5fd0', casing: '#ffffff', done: '#8e8a82' };

/** The rider: a blue disc with a white ring; with a heading, an arrow pointing the way you're going. */
export function positionMarker(): HTMLElement {
  const el = document.createElement('div');
  el.title = tr('You are here');
  el.style.cssText = 'width:30px;height:30px;';
  el.innerHTML = `<svg viewBox="0 0 30 30" width="30" height="30" style="display:block;transition:transform .4s;filter:drop-shadow(0 1px 3px rgba(0,0,0,.45))">
    <circle cx="15" cy="15" r="11" fill="${RIDE_COLORS.ahead}" stroke="#fff" stroke-width="3"/>
    <path class="arrow" d="M15 7.5 L20.5 20 L15 17 L9.5 20 Z" fill="#fff" style="display:none"/>
    <circle class="dot" cx="15" cy="15" r="3.2" fill="#fff"/>
  </svg>`;
  return el;
}

/** Point the rider's arrow (degrees from north), or show a plain dot when the heading isn't known. */
export function setMarkerHeading(el: HTMLElement, heading?: number) {
  const svg = el.querySelector('svg') as SVGElement | null;
  const arrow = el.querySelector('.arrow') as SVGElement | null;
  const dot = el.querySelector('.dot') as SVGElement | null;
  if (!svg || !arrow || !dot) return;
  const known = heading != null && !Number.isNaN(heading);
  arrow.style.display = known ? '' : 'none';
  dot.style.display = known ? 'none' : '';
  svg.style.transform = known ? `rotate(${heading}deg)` : '';
}

/** Suggested names when marking a place, by category. */
const MARK_NAMES: Record<CategoryId, string> = { stay: 'Camp spot', food: 'Local producer', shop: 'Repair stop', water: 'Water point', sights: 'Viewpoint' };

/** Clicking the map: add an overnight stop there, or mark your own place (a camp spot, a water point…) in a category. */
export const MapClickMenu: React.FC<{ onAddStop?: () => void; onMark?: (category: CategoryId, name: string) => void }> = ({ onAddStop, onMark }) => {
  const { t } = useSettings();
  const [marking, setMarking] = useState(false);
  const [category, setCategory] = useState<CategoryId>('stay');
  const [name, setName] = useState('');
  const ids = Object.keys(CATEGORIES) as CategoryId[];
  if (!marking) {
    return (
      <div className="flex w-[220px] flex-col gap-1.5 font-sans">
        {onAddStop && (
          <button onClick={onAddStop} className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">+ {t('Add overnight stop here')}</button>
        )}
        {onMark && (
          <button onClick={() => setMarking(true)} className="rounded-md border border-emerald-600 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-50">📍 {t('Mark a place here')}</button>
        )}
      </div>
    );
  }
  const save = () => onMark?.(category, name.trim() || t(MARK_NAMES[category]));
  return (
    <form className="flex w-[230px] flex-col gap-1.5 font-sans text-xs" onSubmit={(e) => { e.preventDefault(); save(); }}>
      <p className="font-bold text-slate-800">{t('Mark a place here')}</p>
      <div className="grid grid-cols-5 gap-1" role="radiogroup" aria-label={t('Category')}>
        {ids.map(id => (
          <button key={id} type="button" role="radio" aria-checked={category === id} title={t(categoryLabel(id))} onClick={() => setCategory(id)}
            className="rounded-sm border py-1 text-base" style={category === id ? { borderColor: CATEGORIES[id].color, background: `${CATEGORIES[id].color}22` } : { borderColor: '#e5e0d4' }}>
            {CATEGORIES[id].glyph}
          </button>
        ))}
      </div>
      <p className="text-[11px] font-semibold" style={{ color: CATEGORIES[category].color }}>{t(categoryLabel(category))}</p>
      <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder={t(MARK_NAMES[category])} aria-label={t('Place name')}
        className="h-8 rounded-md border border-emerald-200 bg-white px-2 focus:border-emerald-500 focus:outline-none" />
      <div className="flex gap-1.5">
        <button type="submit" className="flex-1 rounded-md bg-emerald-600 px-3 py-1.5 font-semibold text-white hover:bg-emerald-700">{t('Save')}</button>
        <button type="button" onClick={() => setMarking(false)} className="rounded-md border px-2 py-1.5">{t('Back')}</button>
      </div>
    </form>
  );
};
