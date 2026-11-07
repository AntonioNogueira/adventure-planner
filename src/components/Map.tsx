import React, { useEffect, useRef, useState } from 'react';
import { Waypoint, RouteInfo, StopRef } from '../types';
import { Layers, Map as MapIcon, Globe, Mountain } from 'lucide-react';
import { createRoot, Root } from 'react-dom/client';
import { cn } from '../lib/utils';
import { geocodeAddress } from '../lib/geocode';
import { CATEGORIES, CategoryId, categoryId } from '../lib/places';
import { RoutedLeg } from '../lib/routing';
import SegmentDetails from './SegmentDetails';
import { buildPoints, MapPoint, PlacePopup, StopPopup, stopPinElement, refKey } from './mapShared';

interface MapProps {
  onLoad: (map: google.maps.Map) => void;
  /** The route, one clickable segment per day; clicking opens its terrain/road details. */
  segments?: { path: google.maps.LatLngLiteral[]; label: string; leg: RoutedLeg }[];
  travelMode?: string;
  waypoints?: Waypoint[];
  origin?: string;
  destination?: string;
  routeInfo?: RouteInfo | null;
  /** Editing callbacks, shared with the sidebar. */
  onMoveStop?: (ref: StopRef, position: google.maps.LatLngLiteral) => void;
  /** Click on the map → "Add overnight stop here". */
  onAddStop?: (position: google.maps.LatLngLiteral) => void;
  onRemoveStop?: (index: number) => void;
  onFindPlaces?: (ref: StopRef) => void;
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


const CATEGORY_IDS = Object.keys(CATEGORIES) as CategoryId[];


const Map: React.FC<MapProps> = ({
  onLoad, segments = [], travelMode = 'DRIVING', waypoints = [], origin, destination, routeInfo, onMoveStop, onAddStop, onRemoveStop, onFindPlaces, onRemoveItem, onAttachFile, attachingKey,
}) => {
  const segmentLinesRef = useRef<google.maps.Polyline[]>([]);
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const infoRootRef = useRef<Root | null>(null);
  const [mapType, setMapType] = useState<MapType>('roadmap');
  // Callbacks change every render; keep the latest in a ref so markers don't need rebuilding for them.
  const callbacksRef = useRef({ onMoveStop, onAddStop, onRemoveStop, onFindPlaces, onRemoveItem, onAttachFile });
  callbacksRef.current = { onMoveStop, onAddStop, onRemoveStop, onFindPlaces, onRemoveItem, onAttachFile };
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
          // Right-centre stays visible above the phone's bottom sheet.
          position: google.maps.ControlPosition.RIGHT_CENTER
        }
      });
      googleMapRef.current = map;
      // Stop names show from regional zoom in; zoomed out, only the numbers.
      const toggleLabels = () => mapRef.current?.classList.toggle('stop-labels-hidden', (map.getZoom() || 0) < 7);
      map.addListener('zoom_changed', toggleLabels);
      toggleLabels();
      infoWindowRef.current = new InfoWindow({ maxWidth: 400 });

      // Clicking empty map offers to add an overnight stop there (once a route exists).
      map.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (!e.latLng || !callbacksRef.current.onAddStop) return;
        const position = e.latLng.toJSON();
        const content = document.createElement('div');
        infoRootRef.current?.unmount();
        infoRootRef.current = createRoot(content);
        infoRootRef.current.render(
          <button
            className="rounded-md bg-emerald-600 px-3 py-1.5 font-sans text-xs font-semibold text-white hover:bg-emerald-700"
            onClick={() => { infoWindowRef.current?.close(); callbacksRef.current.onAddStop?.(position); }}
          >
            + Add overnight stop here
          </button>
        );
        infoWindowRef.current?.setOptions({ pixelOffset: new google.maps.Size(0, 0) });
        infoWindowRef.current?.setContent(content);
        infoWindowRef.current?.setPosition(position);
        infoWindowRef.current?.open({ map });
        openStopRef.current = null;
      });
      infoWindowRef.current.addListener('closeclick', () => {
        openStopRef.current = null;
        // Un-highlight the selected day.
        segmentLinesRef.current.forEach(line => line.setOptions({ strokeColor: '#059669', strokeWeight: 6, strokeOpacity: 0.85 }));
      });
      onLoad(map);
      setIsReady(true);
    };

    initMap();
    return () => clearTimeout(timer);
  }, [onLoad]);

  useEffect(() => {
    googleMapRef.current?.setMapTypeId(mapType);
  }, [mapType]);

  // One line per day. Clicking a line highlights it and opens its details.
  useEffect(() => {
    const map = googleMapRef.current;
    if (!isReady || !map) return;
    segmentLinesRef.current.forEach(line => line.setMap(null));
    const style = (active: boolean) => ({ strokeColor: active ? '#065f46' : '#059669', strokeWeight: active ? 9 : 6, strokeOpacity: active ? 1 : 0.85 });
    segmentLinesRef.current = segments.map((segment, i) => {
      const line = new google.maps.Polyline({ map, path: segment.path, clickable: true, zIndex: 1, ...style(false) });
      line.addListener('click', (e: google.maps.PolyMouseEvent) => {
        segmentLinesRef.current.forEach((other, j) => other.setOptions(style(j === i)));
        const content = document.createElement('div');
        infoRootRef.current?.unmount();
        infoRootRef.current = createRoot(content);
        infoRootRef.current.render(<SegmentDetails label={segment.label} leg={segment.leg} travelMode={travelMode} />);
        infoWindowRef.current?.setOptions({ pixelOffset: new google.maps.Size(0, 0) });
        infoWindowRef.current?.setContent(content);
        infoWindowRef.current?.setPosition(e.latLng || segment.path[Math.floor(segment.path.length / 2)]);
        infoWindowRef.current?.open({ map });
        openStopRef.current = null;
      });
      line.addListener('mouseover', () => line.setOptions({ strokeWeight: 9 }));
      line.addListener('mouseout', () => line.setOptions({ strokeWeight: line.get('strokeColor') === '#065f46' ? 9 : 6 }));
      return line;
    });
    // Development only: lets browser tests click a day line (they're drawn on a canvas).
    if (import.meta.env.DEV) (window as any).__segmentLines = segmentLinesRef.current;
  }, [segments, isReady, travelMode]);

  useEffect(() => {
    if (!isReady || !googleMapRef.current) return;
    let cancelled = false;

    // Opens the popup just above a pin. Uses the stop's position and the pin's height rather than
    // anchoring to the marker: a marker that was just re-created has no measured height yet, so an
    // anchored popup would open too low and the pin would cover its tail.
    const openAbove = (content: HTMLElement, position: google.maps.LatLngLiteral, pin: HTMLElement, fallbackHeight: number) => {
      const iw = infoWindowRef.current;
      if (!iw) return;
      const height = pin.offsetHeight || fallbackHeight;
      iw.setOptions({ pixelOffset: new google.maps.Size(0, -height - 2) });
      iw.setContent(content);
      iw.setPosition(position);
      iw.open({ map: googleMapRef.current });
    };

    const updateMarkers = async () => {
      try {
        const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;

        type Point = MapPoint;
        const allPoints = buildPoints(origin, waypoints, destination, routeInfo);

        const locations = await Promise.all(allPoints.map(p =>
          p.position ? Promise.resolve(p.position) : geocodeAddress(p.location)));
        if (cancelled) return;

        markersRef.current.forEach(marker => { marker.map = null; });
        markersRef.current = [];
        const bounds = new google.maps.LatLngBounds();

        const openPopup = (point: Point, anchor: google.maps.marker.AdvancedMarkerElement, at: google.maps.LatLngLiteral) => {
          const key = refKey(point.ref);
          const content = document.createElement('div');
          infoRootRef.current?.unmount();
          infoRootRef.current = createRoot(content);
          infoRootRef.current.render(
              <StopPopup
                at={at}
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
                onFindPlaces={() => callbacksRef.current.onFindPlaces?.(point.ref)}
                onRemoveStop={point.ref.kind === 'stop' && callbacksRef.current.onRemoveStop
                  ? () => { infoWindowRef.current?.close(); openStopRef.current = null; callbacksRef.current.onRemoveStop?.(point.ref.index!); }
                  : undefined}
                attaching={attachingKey === key}
              />
          );
          openAbove(content, at, anchor.content as HTMLElement, 38);
          openStopRef.current = key;
        };

        allPoints.forEach((point, idx) => {
          const position = locations[idx];
          if (!position) return;
          bounds.extend(position);

          const pin = stopPinElement(point.kind, point.badge, point.location, `${point.label}: ${point.location} (drag to move)`);

          const marker = new AdvancedMarkerElement({
            position,
            map: googleMapRef.current,
            title: `${point.label}: ${point.location} (drag to move)`,
            content: pin,
            gmpClickable: true,
            gmpDraggable: Boolean(callbacksRef.current.onMoveStop),
            // Above suggestion and booking pins, which often sit in the same town.
            zIndex: 10,
          });

          marker.addEventListener('gmp-click', () => openPopup(point, marker, position));
          marker.addListener('dragstart', () => { infoWindowRef.current?.close(); openStopRef.current = null; });
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
          if (openStopRef.current === refKey(point.ref)) openPopup(point, marker, position);

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
              infoRootRef.current.render(
                <PlacePopup
                  item={item}
                  categoryId={id}
                  point={point}
                  onRemove={() => { infoWindowRef.current?.close(); callbacksRef.current.onRemoveItem?.(point.ref, catIdx, itemIdx); }}
                />
              );
              openAbove(content, { lat, lng }, placePin.element ?? (placePin as unknown as HTMLElement), isBooking ? 32 : 26);
              openStopRef.current = null;
            });
            markersRef.current.push(placeMarker);
          }));
        });

        const boundsKey = allPoints.map(p => p.location).join('|');
        if (!bounds.isEmpty() && googleMapRef.current && boundsKey !== lastBoundsKeyRef.current && !skipFitRef.current) {
          // On phones the planner sheet covers the lower half: keep the route in the visible top part.
          const phone = window.innerWidth < 768;
          googleMapRef.current.fitBounds(bounds, phone
            ? { top: 110, left: 30, right: 30, bottom: Math.round(window.innerHeight * 0.55) }
            : 60);
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
      <div className="absolute left-3 top-[7.25rem] z-10 flex flex-wrap gap-1 md:bottom-6 md:left-6 md:top-auto">
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
      <div className="absolute left-3 top-16 z-10 md:left-6 md:top-6">
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
