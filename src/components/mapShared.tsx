// Pieces shared by the Google map (Map.tsx) and the OpenStreetMap map (MapOsm.tsx).
import React from 'react';
import { InterestCategory, InterestItem, RouteInfo, StopKind, StopRef, Waypoint } from '../types';
import { CATEGORIES, CategoryId } from '../lib/places';
import { mapSearchUrl, mapSiteName } from '../lib/provider';

export type MapPoint = Partial<Waypoint> & {
  location: string; kind: StopKind; ref: StopRef; label: string; badge: string; interests: InterestCategory[];
};

/** Start, overnight stops and finish, each with its suggestions and bookings. */
export function buildPoints(origin: string | undefined, waypoints: Waypoint[], destination: string | undefined, routeInfo?: RouteInfo | null): MapPoint[] {
  return [
    ...(origin ? [{ location: origin, kind: 'start' as const, ref: { kind: 'start' as const }, label: 'Start', badge: 'S', interests: routeInfo?.originInterests || [] }] : []),
    ...waypoints.map((wp, i) => ({
      ...wp, kind: 'stop' as const, ref: { kind: 'stop' as const, index: i }, label: `Stop ${i + 1}`, badge: String(i + 1),
      interests: routeInfo?.waypoints[i]?.interests || wp.interests || [],
    })),
    ...(destination ? [{ location: destination, kind: 'end' as const, ref: { kind: 'end' as const }, label: 'Finish', badge: 'F', interests: routeInfo?.destinationInterests || [] }] : []),
  ];
}

export const PIN_COLORS: Record<StopKind, string> = { start: '#2563eb', stop: '#059669', end: '#dc2626' };

export const refKey = (ref: StopRef) => ref.kind === 'stop' ? `stop-${ref.index}` : ref.kind;

interface PlacePopupProps {
  item: InterestItem;
  categoryId: CategoryId;
  point: MapPoint;
  onRemove: () => void;
}

/** The card for a suggestion or booking pin. */
export const PlacePopup: React.FC<PlacePopupProps> = ({ item, categoryId, point, onRemove }) => {
  const isBooking = item.source === 'reservation';
  const cat = CATEGORIES[categoryId];
  const r = item.reservation;
  const at = isBooking ? (r?.lat != null && r?.lng != null ? { lat: r.lat, lng: r.lng } : undefined)
    : item.lat != null && item.lng != null ? { lat: item.lat, lng: item.lng } : undefined;
  const link = isBooking && r?.address ? mapSearchUrl(r.address, at) : item.url || mapSearchUrl(`${item.name} ${point.location}`, at);
  const linkLabel = !isBooking && item.url && !/openstreetmap\.org|google\.com\/maps|maps\.google/.test(item.url) ? 'Website' : `Open in ${mapSiteName}`;
  return (
    <div className="w-[240px] max-w-[70vw] space-y-1 p-1 font-sans text-xs">
      <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: isBooking ? '#6d28d9' : cat.color }}>
        {cat.glyph} {isBooking ? 'Booked · ' : ''}{cat.name}
      </p>
      <p className="text-sm font-semibold text-slate-900">{item.name}</p>
      {isBooking && r?.checkIn && <p className="text-slate-700">{[r.checkIn, r.checkOut].filter(Boolean).join(' → ')}</p>}
      {isBooking && r?.confirmation && <p className="text-slate-700">Ref: <b>{r.confirmation}</b></p>}
      {item.description && <p className="text-slate-500">{item.description}</p>}
      <p className="text-slate-400">Near {point.label}: {point.location}</p>
      <div className="flex gap-3 pt-1">
        <a href={link} target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-700 hover:underline">{linkLabel}</a>
        {at && !isBooking && item.url && linkLabel === 'Website' && (
          <a href={mapSearchUrl(item.name, at)} target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-700 hover:underline">Map</a>
        )}
        <button className="font-semibold text-red-600 hover:underline" onClick={onRemove}>Remove</button>
      </div>
    </div>
  );
};
