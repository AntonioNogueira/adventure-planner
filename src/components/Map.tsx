import React, { useEffect, useRef, useState } from 'react';
import { Waypoint, RouteInfo, InterestCategory, StopRef } from '../types';
import { Layers, Map as MapIcon, Globe, Mountain } from 'lucide-react';
import { createRoot, Root } from 'react-dom/client';
import { cn } from '../lib/utils';
import StopDetails, { StopKind } from './StopDetails';
import { geocodeAddress } from '../lib/geocode';
import { CATEGORIES, CategoryId, categoryId } from '../lib/places';

interface MapProps {
  onLoad: (
    map: google.maps.Map,
    directionsService: google.maps.DirectionsService,
    directionsRenderer: google.maps.DirectionsRenderer
  ) => void;
  waypoints?: Waypoint[];
  origin?: string;
  destination?: string;
  routeInfo?: RouteInfo | null;
  /** Editing callbacks, shared with the sidebar. */
  onMoveStop?: (ref: StopRef, position: google.maps.LatLngLiteral) => void;
  onRemoveItem?: (ref: StopRef, categoryIndex: number, itemIndex: number) => void;
  onAttachFile?: (ref: StopRef, file: File) => void;
  attachingKey?: string | null;
}

type MapType = 'roadmap' | 'satellite' | 'hybrid' | 'terrain';

const MAP_TYPES: { id: MapType; label: string; icon: typeof MapIcon }[] = [
  { id: 'roadmap', label: 'Map', icon: MapIcon },
  { id: 'satellite', label: 'Satellite', icon: Globe },
  { id: 'hybrid', label: 'Hybrid', icon: Layers },
  { id: 'terrain', label: 'Terrain', icon: Mountain },
];

const PIN_COLORS: Record<StopKind, string> = { start: '#2563eb', stop: '#059669', end: '#dc2626' };

const CATEGORY_IDS = Object.keys(CATEGORIES) as CategoryId[];

const refKey = (ref: StopRef) => ref.kind === 'stop' ? `stop-${ref.index}` : ref.kind;

const Map: React.FC<MapProps> = ({
  onLoad, waypoints = [], origin, destination, routeInfo, onMoveStop, onRemoveItem, onAttachFile, attachingKey,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const infoRootRef = useRef<Root | null>(null);
  const [mapType, setMapType] = useState<MapType>('roadmap');
  // Callbacks change every render; keep the latest in a ref so markers don't need rebuilding for them.
  const callbacksRef = useRef({ onMoveStop, onRemoveItem, onAttachFile });
  callbacksRef.current = { onMoveStop, onRemoveItem, onAttachFile };
  // The stop whose popup is open, so it can be re-rendered after edits instead of closing.
  const openStopRef = useRef<string | null>(null);
  // Only re-zoom when the set of places changes, and not right after the user dragged a pin.
  const lastBoundsKeyRef = useRef('');
  const skipFitRef = useRef(false);
  // Suggestion pins per category can be hidden from the legend; bookings are always shown.
  const [hiddenCategories, setHiddenCategories] = useState<CategoryId[]>([]);
  const [mapsError, setMapsError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!mapRef.current) return;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout>;

    const initMap = async () => {
      if (googleMapRef.current) return;
      if (!window.google?.maps?.importLibrary) {
        // Give the Maps script ~10s to load before showing a helpful error.
        if (++attempts > 100) {
          setMapsError('Google Maps failed to load. Check VITE_GOOGLE_MAPS_API_KEY in .env.local and that the Maps JavaScript API is enabled.');
          return;
        }
        timer = setTimeout(initMap, 100);
        return;
      }

      const { Map: GoogleMap, InfoWindow } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;
      const { DirectionsService, DirectionsRenderer } = await google.maps.importLibrary("routes") as google.maps.RoutesLibrary;
      const map = new GoogleMap(mapRef.current!, {
        center: { lat: 48.8566, lng: 2.3522 }, // Paris
        zoom: 5,
        mapTypeId: 'roadmap',
        // A map ID is required for Advanced Markers; styling is managed in Cloud Console for map IDs.
        mapId: 'DEMO_MAP_ID',
        disableDefaultUI: true,
        zoomControl: true,
        fullscreenControl: true,
        zoomControlOptions: {
          position: google.maps.ControlPosition.RIGHT_BOTTOM
        }
      });
      const directionsService = new DirectionsService();
      const directionsRenderer = new DirectionsRenderer({
        map,
        suppressMarkers: true,
        preserveViewport: true,
        polylineOptions: {
          strokeColor: '#059669',
          strokeWeight: 6,
          strokeOpacity: 0.85
        }
      });

      googleMapRef.current = map;
      infoWindowRef.current = new InfoWindow({ maxWidth: 400 });
      infoWindowRef.current.addListener('closeclick', () => { openStopRef.current = null; });
      onLoad(map, directionsService, directionsRenderer);
      setIsReady(true);
    };

    initMap();
    return () => clearTimeout(timer);
  }, [onLoad]);

  useEffect(() => {
    googleMapRef.current?.setMapTypeId(mapType);
  }, [mapType]);

  useEffect(() => {
    if (!isReady || !googleMapRef.current) return;
    let cancelled = false;

    const updateMarkers = async () => {
      try {
        const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;

        type Point = Partial<Waypoint> & { location: string; kind: StopKind; ref: StopRef; label: string; badge: string; interests: InterestCategory[] };
        const allPoints: Point[] = [
          ...(origin ? [{ location: origin, kind: 'start' as const, ref: { kind: 'start' as const }, label: 'Start', badge: 'S', interests: routeInfo?.originInterests || [] }] : []),
          ...waypoints.map((wp, i) => ({
            ...wp, kind: 'stop' as const, ref: { kind: 'stop' as const, index: i }, label: `Stop ${i + 1}`, badge: String(i + 1),
            interests: routeInfo?.waypoints[i]?.interests || wp.interests || [],
          })),
          ...(destination ? [{ location: destination, kind: 'end' as const, ref: { kind: 'end' as const }, label: 'Finish', badge: 'F', interests: routeInfo?.destinationInterests || [] }] : [])
        ];

        const locations = await Promise.all(allPoints.map(p =>
          p.position ? Promise.resolve(new google.maps.LatLng(p.position)) : geocodeAddress(p.location)));
        if (cancelled) return;

        markersRef.current.forEach(marker => { marker.map = null; });
        markersRef.current = [];
        const bounds = new google.maps.LatLngBounds();

        const openPopup = (point: Point, anchor: google.maps.marker.AdvancedMarkerElement) => {
          const key = refKey(point.ref);
          const content = document.createElement('div');
          infoRootRef.current?.unmount();
          infoRootRef.current = createRoot(content);
          infoRootRef.current.render(
            <div className="w-[360px] max-w-[78vw]">
              <StopDetails
                compact
                kind={point.kind}
                badge={point.badge}
                title={point.label}
                location={point.location}
                interests={point.interests}
                distanceFromPrev={point.distanceFromPrev}
                distanceToNext={point.distanceToNext}
                onRemoveItem={(c, i) => callbacksRef.current.onRemoveItem?.(point.ref, c, i)}
                onAttachFile={(file) => callbacksRef.current.onAttachFile?.(point.ref, file)}
                attaching={attachingKey === key}
              />
            </div>
          );
          infoWindowRef.current?.setContent(content);
          infoWindowRef.current?.open({ map: googleMapRef.current, anchor });
          openStopRef.current = key;
        };

        allPoints.forEach((point, idx) => {
          const position = locations[idx];
          if (!position) return;
          bounds.extend(position);

          const pin = new PinElement({
            background: PIN_COLORS[point.kind],
            borderColor: '#ffffff',
            glyphColor: '#ffffff',
            // glyphText replaces the deprecated glyph property (not yet in @types/google.maps).
            ...({ glyphText: point.badge } as google.maps.marker.PinElementOptions),
            scale: point.kind === 'stop' ? 0.9 : 1.1,
          });

          const marker = new AdvancedMarkerElement({
            position,
            map: googleMapRef.current,
            title: `${point.label}: ${point.location} (drag to move)`,
            content: pin,
            gmpClickable: true,
            gmpDraggable: Boolean(callbacksRef.current.onMoveStop),
          });

          marker.addEventListener('gmp-click', () => openPopup(point, marker));
          marker.addListener('dragend', () => {
            const pos = marker.position as google.maps.LatLng | google.maps.LatLngLiteral | null;
            if (!pos) return;
            const lat = typeof pos.lat === 'function' ? pos.lat() : pos.lat;
            const lng = typeof pos.lng === 'function' ? pos.lng() : pos.lng;
            skipFitRef.current = true;
            infoWindowRef.current?.close();
            openStopRef.current = null;
            callbacksRef.current.onMoveStop?.(point.ref, { lat, lng });
          });
          markersRef.current.push(marker);

          // Keep an open popup open (with fresh content) after edits.
          if (openStopRef.current === refKey(point.ref)) openPopup(point, marker);

          // A small pin for every suggestion and booking with a known position, iconed by category.
          // Bookings are violet; suggestions use their category colour.
          point.interests.forEach((cat, catIdx) => cat.items.forEach((item, itemIdx) => {
            const isBooking = item.source === 'reservation';
            const lat = isBooking ? item.reservation?.lat : item.lat;
            const lng = isBooking ? item.reservation?.lng : item.lng;
            const id = categoryId(item.category || cat.category);
            if (lat == null || lng == null || (!isBooking && hiddenCategories.includes(id))) return;
            const placePin = new PinElement({
              background: isBooking ? '#7c3aed' : CATEGORIES[id].color,
              borderColor: '#ffffff',
              glyphColor: '#ffffff',
              ...({ glyphText: CATEGORIES[id].glyph } as google.maps.marker.PinElementOptions),
              scale: isBooking ? 0.8 : 0.65,
            });
            const placeMarker = new AdvancedMarkerElement({
              position: { lat, lng },
              map: googleMapRef.current,
              title: `${isBooking ? 'Booked: ' : ''}${item.name} (${point.label})`,
              content: placePin,
              gmpClickable: true,
              zIndex: isBooking ? 2 : 1,
            });
            placeMarker.addEventListener('gmp-click', () => {
              const content = document.createElement('div');
              infoRootRef.current?.unmount();
              infoRootRef.current = createRoot(content);
              const link = isBooking && item.reservation?.address
                ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.reservation.address)}`
                : item.url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${item.name} ${point.location}`)}`;
              infoRootRef.current.render(
                <div className="w-[240px] max-w-[70vw] space-y-1 p-1 font-sans text-xs">
                  <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: isBooking ? '#6d28d9' : CATEGORIES[id].color }}>
                    {CATEGORIES[id].glyph} {isBooking ? 'Booked · ' : ''}{CATEGORIES[id].name}
                  </p>
                  <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                  {isBooking && item.reservation?.checkIn && <p className="text-slate-700">{[item.reservation.checkIn, item.reservation.checkOut].filter(Boolean).join(' → ')}</p>}
                  {isBooking && item.reservation?.confirmation && <p className="text-slate-700">Ref: <b>{item.reservation.confirmation}</b></p>}
                  {item.description && <p className="text-slate-500">{item.description}</p>}
                  <p className="text-slate-400">Near {point.label}: {point.location}</p>
                  <div className="flex gap-3 pt-1">
                    <a href={link} target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-700 hover:underline">Open in Google Maps</a>
                    <button
                      className="font-semibold text-red-600 hover:underline"
                      onClick={() => { infoWindowRef.current?.close(); callbacksRef.current.onRemoveItem?.(point.ref, catIdx, itemIdx); }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
              infoWindowRef.current?.setContent(content);
              infoWindowRef.current?.open({ map: googleMapRef.current, anchor: placeMarker });
              openStopRef.current = null;
            });
            markersRef.current.push(placeMarker);
          }));
        });

        const boundsKey = allPoints.map(p => p.location).join('|');
        if (!bounds.isEmpty() && googleMapRef.current && boundsKey !== lastBoundsKeyRef.current && !skipFitRef.current) {
          googleMapRef.current.fitBounds(bounds, 60);
        }
        lastBoundsKeyRef.current = boundsKey;
        skipFitRef.current = false;
      } catch (err) {
        console.error("Error updating markers:", err);
      }
    };

    updateMarkers();
    return () => { cancelled = true; };
  }, [isReady, waypoints, origin, destination, routeInfo, attachingKey, hiddenCategories]);

  return (
    <div className="relative h-full w-full">
      <div ref={mapRef} className="h-full w-full" />

      {mapsError && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 p-6 text-center">
          <p className="max-w-sm text-sm text-muted-foreground">{mapsError}</p>
        </div>
      )}

      {/* Category legend: show or hide suggestion pins */}
      <div className="absolute bottom-6 left-3 z-10 flex flex-wrap gap-1 md:left-6">
        {CATEGORY_IDS.map(id => {
          const hidden = hiddenCategories.includes(id);
          return (
            <button
              key={id}
              onClick={() => setHiddenCategories(prev => hidden ? prev.filter(c => c !== id) : [...prev, id])}
              aria-pressed={!hidden}
              title={`${hidden ? 'Show' : 'Hide'} ${CATEGORIES[id].name} on the map`}
              className={cn(
                "flex items-center gap-1 rounded-full border bg-white/90 px-2.5 py-1 text-[11px] font-semibold shadow-md backdrop-blur transition-opacity",
                hidden && "opacity-50 line-through"
              )}
              style={{ color: CATEGORIES[id].color, borderColor: CATEGORIES[id].color }}
            >
              <span>{CATEGORIES[id].glyph}</span>
              <span className="hidden sm:inline">{CATEGORIES[id].name}</span>
            </button>
          );
        })}
        <span className="flex items-center gap-1 rounded-full border border-violet-600 bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-violet-700 shadow-md">
          <span className="h-2 w-2 rounded-full bg-violet-600" />
          <span className="hidden sm:inline">Booked</span>
        </span>
      </div>

      {/* Map Type Controls */}
      <div className="absolute left-3 top-3 z-10 md:left-6 md:top-6">
        <div className="flex flex-row gap-1 overflow-hidden rounded-xl border border-white/20 bg-white/85 p-1 shadow-xl backdrop-blur-md md:flex-col">
          {MAP_TYPES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setMapType(id)}
              aria-pressed={mapType === id}
              title={label}
              className={cn(
                "flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-bold transition-all md:px-3",
                mapType === id
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20"
                  : "text-muted-foreground hover:bg-emerald-50 hover:text-emerald-600"
              )}
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Map;
