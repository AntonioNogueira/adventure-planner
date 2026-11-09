// Pieces shared by the Google map (Map.tsx) and the OpenStreetMap map (MapOsm.tsx).
import { useSettings, t as tr } from '../lib/settings';
import { stayUrl, toursUrl, offerFor, Nights } from '../lib/affiliate';
import React, { useEffect, useState } from 'react';
import StopDetails from './StopDetails';
import { placeHighlight, PlaceHighlight, townName } from '../lib/wiki';
import { LatLng } from '../lib/geo';
import { InterestCategory, InterestItem, RouteInfo, StopKind, StopRef, Waypoint } from '../types';
import { CATEGORIES, CategoryId } from '../lib/places';
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
}

/** The card for a suggestion or booking pin. */
export const PlacePopup: React.FC<PlacePopupProps> = ({ item, categoryId, point, onRemove, nights }) => {
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
        {cat.glyph} {isBooking ? `${t('Booked')} · ` : ''}{t(cat.name)}
      </p>
      <p className="text-sm font-semibold text-slate-900">{item.name}</p>
      {isBooking && r?.checkIn && <p className="text-slate-700">{[r.checkIn, r.checkOut].filter(Boolean).join(' → ')}</p>}
      {isBooking && r?.confirmation && <p className="text-slate-700">{t('Ref:')} <b>{r.confirmation}</b></p>}
      {item.description && <p className="text-slate-500">{item.description}</p>}
      <p className="text-slate-400">{t('Near {stop}: {place}', { stop: point.label, place: point.location })}</p>
      <div className="flex gap-3 pt-1">
        <a href={link} target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-700 hover:underline">{linkLabel}</a>
        {at && !isBooking && item.url && linkLabel === t('Website') && (
          <a href={mapSearchUrl(item.name, at)} target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-700 hover:underline">{t('Map')}</a>
        )}
        <button className="font-semibold text-red-600 hover:underline" onClick={onRemove}>{t('Remove')}</button>
      </div>
      {offer && (
        <div className="space-y-0.5 border-t pt-1.5">
          <a href={offer === 'stay' ? stayUrl(item, townName(point.location), nights) : toursUrl(item.name, townName(point.location))}
            target="_blank" rel="noopener noreferrer sponsored"
            className="block rounded-sm bg-violet-600 px-2 py-1.5 text-center font-semibold text-white hover:bg-violet-700">
            {offer === 'stay' ? t('Check prices') : t('Tickets & tours')}
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
    <div className="w-[360px] max-w-[78vw] font-sans">
      {highlight === undefined && <div className="mb-2 h-32 w-full animate-pulse rounded-lg bg-slate-100" />}
      {highlight && (
        <a href={highlight.url} target="_blank" rel="noopener noreferrer" className="group mb-2 block overflow-hidden rounded-lg">
          <div className="relative">
            <img src={highlight.image} alt={highlight.title} className="h-36 w-full object-cover transition-transform group-hover:scale-105" />
            <span className="absolute bottom-1 left-2 rounded bg-black/55 px-1.5 py-0.5 text-[11px] font-semibold text-white">{highlight.title}</span>
          </div>
          <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-slate-600">{highlight.extract}</p>
          <p className="text-[10px] text-slate-400">Wikipedia (CC BY-SA) · {t('read more')}</p>
        </a>
      )}
      <StopDetails {...details} />
    </div>
  );
};
