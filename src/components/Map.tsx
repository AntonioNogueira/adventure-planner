import React, { useEffect, useRef, useState } from 'react';
import { Waypoint, RouteInfo, InterestCategory, StopRef } from '../types';
import { Layers, Map as MapIcon, Globe, Mountain } from 'lucide-react';
import { createRoot, Root } from 'react-dom/client';
import { cn } from '../lib/utils';
import StopDetails, { StopKind } from './StopDetails';
import { geocodeAddress } from '../lib/geocode';

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

const RESERVATION_GLYPHS: [RegExp, string][] = [
  [/accommodation|hotel|stay|camp/i, '🛏'],
  [/restaurant|cafe|food/i, '🍴'],
  [/bike|moto|shop/i, '🔧'],
];

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

        const locations = await Promise.all(allPoints.map(p => geocodeAddress(p.location)));
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

          // Small violet pins for reservations that have an address.
          point.interests.forEach(cat => cat.items.forEach(item => {
            const r = item.reservation;
            if (item.source !== 'reservation' || r?.lat == null || r?.lng == null) return;
            const glyph = RESERVATION_GLYPHS.find(([re]) => re.test(cat.category))?.[1] || '★';
            const resPin = new PinElement({
              background: '#7c3aed',
              borderColor: '#ffffff',
              glyphColor: '#ffffff',
              ...({ glyphText: glyph } as google.maps.marker.PinElementOptions),
              scale: 0.75,
            });
            const resMarker = new AdvancedMarkerElement({
              position: { lat: r.lat, lng: r.lng },
              map: googleMapRef.current,
              title: `${item.name}${r.checkIn ? ` · ${r.checkIn}` : ''} (${point.label})`,
              content: resPin,
              gmpClickable: true,
              zIndex: 1,
            });
            resMarker.addEventListener('gmp-click', () => openPopup(point, resMarker));
            markersRef.current.push(resMarker);
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
  }, [isReady, waypoints, origin, destination, routeInfo, attachingKey]);

  return (
    <div className="relative h-full w-full">
      <div ref={mapRef} className="h-full w-full" />

      {mapsError && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 p-6 text-center">
          <p className="max-w-sm text-sm text-muted-foreground">{mapsError}</p>
        </div>
      )}

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
