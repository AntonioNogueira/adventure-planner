// The open version's map: MapLibre GL with OpenFreeMap vector tiles (free, no key), plus
// OpenTopoMap and EOX Sentinel-2 imagery. Same features as the Google map in Map.tsx.
import React, { useEffect, useRef, useState } from 'react';
import maplibregl, { StyleSpecification } from 'maplibre-gl';
import type { FeatureCollection, LineString } from 'geojson';
import 'maplibre-gl/dist/maplibre-gl.css';
import { createRoot, Root } from 'react-dom/client';
import { Layers, Map as MapIcon, Globe, Mountain } from 'lucide-react';
import { Waypoint, RouteInfo, StopRef } from '../types';
import { cn } from '../lib/utils';
import SegmentDetails from './SegmentDetails';
import { geocodeAddress } from '../lib/geocode';
import { CATEGORIES, CategoryId, categoryId } from '../lib/places';
import { RoutedLeg } from '../lib/routing';
import { LatLng } from '../lib/geo';
import { useSettings, t as tr } from '../lib/settings';
import { rentalUrl, type Nights } from '../lib/affiliate';
import { buildPoints, MapPoint, PlacePopup, StopPopup, stopPinElement, refKey, positionMarker, setMarkerHeading, RIDE_COLORS } from './mapShared';
import { progressOn, splitAt } from '../lib/ride';

interface MapProps {
  onLoad: (map: unknown) => void;
  segments?: { path: LatLng[]; label: string; leg: RoutedLeg }[];
  travelMode?: string;
  waypoints?: Waypoint[];
  origin?: string;
  destination?: string;
  routeInfo?: RouteInfo | null;
  onMoveStop?: (ref: StopRef, position: LatLng) => void;
  onAddStop?: (position: LatLng) => void;
  onRemoveStop?: (index: number) => void;
  onFindPlaces?: (ref: StopRef) => void;
  onRemoveItem?: (ref: StopRef, categoryIndex: number, itemIndex: number) => void;
  onAttachFile?: (ref: StopRef, file: File) => void;
  attachingKey?: string | null;
  /** Nights at each stop (key 'start' | 'stop-N' | 'end'), for the booking links. */
  stays?: Map<string, Nights>;
  /** Ride mode: the day being ridden, the rider's position and whether the map follows it. */
  ride?: { dayIndex: number; position?: { lat: number; lng: number }; heading?: number; follow: boolean; detour?: { lat: number; lng: number }[] } | null;
}

// Topo (survey-map look: contours, hill shading, forests), Satellite, and Hybrid (satellite + roads and names).
type MapType = 'topo' | 'satellite' | 'hybrid';

const OSM = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const raster = (tiles: string[], attribution: string, maxzoom: number): StyleSpecification => ({
  version: 8,
  sources: { base: { type: 'raster', tiles, tileSize: 256, attribution, maxzoom } },
  layers: [{ id: 'base', type: 'raster', source: 'base' }],
});

const SATELLITE_TILES = ['https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2020_3857/default/g/{z}/{y}/{x}.jpg'];
const SATELLITE_CREDIT = '<a href="https://s2maps.eu">Sentinel-2 cloudless</a> by EOX (CC BY-NC-SA 4.0), contains Copernicus data';

const STYLES: Record<Exclude<MapType, 'hybrid'>, string | StyleSpecification> = {
  topo: raster(['https://tile.opentopomap.org/{z}/{x}/{y}.png'], `${OSM}, SRTM | Style © <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)`, 17),
  satellite: raster(SATELLITE_TILES, SATELLITE_CREDIT, 15),
};

/** Satellite with OpenFreeMap's roads, borders and place names on top (vector layers of its "liberty" style). */
let hybridStyle: Promise<StyleSpecification> | null = null;
function getHybridStyle(): Promise<StyleSpecification> {
  hybridStyle ??= fetch('https://tiles.openfreemap.org/styles/liberty')
    .then(r => r.json())
    .then((style: StyleSpecification) => ({
      ...style,
      sources: { ...style.sources, satellite: { type: 'raster', tiles: SATELLITE_TILES, tileSize: 256, attribution: SATELLITE_CREDIT, maxzoom: 15 } },
      layers: [
        { id: 'satellite', type: 'raster', source: 'satellite' },
        ...style.layers.filter(l => l.type === 'symbol'
          || ('source-layer' in l && ['transportation', 'boundary'].includes(String(l['source-layer'])) && l.type === 'line')),
      ],
    }) as StyleSpecification)
    .catch(err => { hybridStyle = null; throw err; });
  return hybridStyle;
}

const styleFor = async (type: MapType) => (type === 'hybrid' ? getHybridStyle() : STYLES[type]);

const MAP_TYPES: { id: MapType; label: string; icon: typeof MapIcon }[] = [
  { id: 'topo', label: 'Topo', icon: Mountain },
  { id: 'satellite', label: 'Satellite', icon: Globe },
  { id: 'hybrid', label: 'Hybrid', icon: Layers },
];

const CATEGORY_IDS = Object.keys(CATEGORIES) as CategoryId[];
const ROUTE_COLOR = '#a0462c';
const ACTIVE_COLOR = '#6e2a18';

interface RideLines { done: LatLng[]; ahead: LatLng[]; on: boolean }

/** Ride mode lines: the other days faded, the day's done part grey, the part ahead blue with a white edge. */
function drawRideLines(map: maplibregl.Map, lines: RideLines) {
  if (map.getLayer('route-line')) map.setPaintProperty('route-line', 'line-opacity', lines.on ? 0.35 : 1);
  if (map.getLayer('route-casing')) map.setPaintProperty('route-casing', 'line-opacity', lines.on ? 0.35 : 1);
  const feature = (part: string, path: LatLng[]) => ({ type: 'Feature' as const, properties: { part }, geometry: { type: 'LineString' as const, coordinates: path.map(p => [p.lng, p.lat]) } });
  const data: FeatureCollection<LineString> = { type: 'FeatureCollection', features: lines.on ? [
    ...(lines.done.length > 1 ? [feature('done', lines.done)] : []),
    ...(lines.ahead.length > 1 ? [feature('ahead', lines.ahead)] : []),
  ] : [] };
  const source = map.getSource('ride-lines') as maplibregl.GeoJSONSource | undefined;
  if (source) { source.setData(data); return; }
  map.addSource('ride-lines', { type: 'geojson', data });
  const layout = { 'line-cap': 'round' as const, 'line-join': 'round' as const };
  const before = map.getLayer('ride-detour') ? 'ride-detour' : undefined;
  map.addLayer({ id: 'ride-done', type: 'line', source: 'ride-lines', filter: ['==', ['get', 'part'], 'done'], layout, paint: { 'line-color': RIDE_COLORS.done, 'line-width': 7 } }, before);
  map.addLayer({ id: 'ride-ahead-casing', type: 'line', source: 'ride-lines', filter: ['==', ['get', 'part'], 'ahead'], layout, paint: { 'line-color': RIDE_COLORS.casing, 'line-width': 12 } }, before);
  map.addLayer({ id: 'ride-ahead', type: 'line', source: 'ride-lines', filter: ['==', ['get', 'part'], 'ahead'], layout, paint: { 'line-color': RIDE_COLORS.ahead, 'line-width': 7 } }, before);
}

/** A teardrop pin with a label, as a DOM element for MapLibre markers. */
function pinElement(color: string, text: string, size: number, title: string): HTMLElement {
  const el = document.createElement('div');
  el.title = title;
  el.style.cssText = `width:${size}px;height:${size}px;cursor:pointer;`;
  el.innerHTML = `
    <div style="width:${size}px;height:${size}px;background:${color};border:2px solid #fff;border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;">
      <span style="transform:rotate(45deg);color:#fff;font:600 ${Math.round(size * 0.45)}px/1 Inter,sans-serif;">${text}</span>
    </div>`;
  return el;
}

function drawRoute(map: maplibregl.Map, segments: { path: LatLng[] }[], active: number) {
  const data: FeatureCollection<LineString, { index: number }> = {
    type: 'FeatureCollection',
    features: segments.map((s, index) => ({
      type: 'Feature',
      properties: { index },
      geometry: { type: 'LineString', coordinates: s.path.map(p => [p.lng, p.lat]) },
    })),
  };
  const source = map.getSource('route') as maplibregl.GeoJSONSource | undefined;
  if (source) { source.setData(data); return; }
  const layout = { 'line-cap': 'round' as const, 'line-join': 'round' as const };
  map.addSource('route', { type: 'geojson', data });
  map.addLayer({ id: 'route-casing', type: 'line', source: 'route', layout, paint: { 'line-color': '#fffcf4', 'line-width': 9 } });
  map.addLayer({ id: 'route-line', type: 'line', source: 'route', layout, paint: { 'line-color': ROUTE_COLOR, 'line-width': 5 } });
  map.addLayer({ id: 'route-active', type: 'line', source: 'route', filter: ['==', ['get', 'index'], active], layout, paint: { 'line-color': ACTIVE_COLOR, 'line-width': 8 } });
}

const MapView: React.FC<MapProps> = ({
  onLoad, segments = [], travelMode = 'DRIVING', waypoints = [], origin, destination, routeInfo,
  onMoveStop, onAddStop, onRemoveStop, onFindPlaces, onRemoveItem, onAttachFile, attachingKey, stays, ride,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const popupRootRef = useRef<Root | null>(null);
  const openStopRef = useRef<string | null>(null);
  const lastBoundsKeyRef = useRef('');
  const skipFitRef = useRef(false);
  const activeSegmentRef = useRef(-1);
  const segmentsRef = useRef(segments);
  segmentsRef.current = segments;
  const callbacksRef = useRef({ onMoveStop, onAddStop, onRemoveStop, onFindPlaces, onRemoveItem, onAttachFile, travelMode });
  callbacksRef.current = { onMoveStop, onAddStop, onRemoveStop, onFindPlaces, onRemoveItem, onAttachFile, travelMode };
  const [mapType, setMapType] = useState<MapType>('topo');
  const [isReady, setIsReady] = useState(false);
  const [hiddenCategories, setHiddenCategories] = useState<CategoryId[]>([]);
  const { t, settings } = useSettings();

  // One popup, re-used for stops, places, segments and "add stop here".
  // `offset` is the height of the pin the popup belongs to: above the pin it is lifted by that much,
  // below it (near the top of the map) it starts at the pin's tip.
  const showPopup = (at: LatLng, node: React.ReactNode, pinHeight = 0) => {
    const h = pinHeight ? pinHeight + 4 : 12;
    const offset: maplibregl.Offset = {
      top: [0, pinHeight ? 4 : 12], 'top-left': [0, pinHeight ? 4 : 12], 'top-right': [0, pinHeight ? 4 : 12],
      bottom: [0, -h], 'bottom-left': [0, -h], 'bottom-right': [0, -h],
      left: [12, -h / 2], right: [-12, -h / 2], center: [0, 0],
    };
    const map = mapRef.current;
    if (!map) return;
    const content = document.createElement('div');
    popupRootRef.current?.unmount();
    popupRootRef.current = createRoot(content);
    popupRootRef.current.render(node);
    popupRef.current?.remove();
    popupRef.current = new maplibregl.Popup({ maxWidth: '400px', offset, focusAfterOpen: false })
      .setLngLat([at.lng, at.lat]).setDOMContent(content).addTo(map);
    // Keep the whole popup in view as its content loads and grows: clear of the view tabs at the top, the screen
    // edges at the sides and, on phones, the planner sheet at the bottom. Too tall to fit: its top stays in view.
    const popup = popupRef.current;
    const keepInView = () => {
      const el = popup.getElement();
      if (!el || popupRef.current !== popup) return;
      const box = el.getBoundingClientRect();
      const area = map.getContainer().getBoundingClientRect();
      const phone = window.innerWidth < 768;
      const sheetTop = phone ? document.querySelector('aside')?.getBoundingClientRect().top ?? area.bottom : area.bottom;
      const top = area.top + (phone ? 64 : 84), bottom = Math.min(area.bottom, sheetTop) - 8;
      const left = area.left + 8, right = area.right - 8;
      // A popup taller than the free space scrolls inside itself instead of hiding behind the sheet.
      const body = el.querySelector<HTMLElement>('.maplibregl-popup-content');
      if (body) {
        const room = Math.max(160, Math.floor(bottom - top));
        if (body.style.maxHeight !== `${room}px`) { body.style.maxHeight = `${room}px`; body.style.overflowY = 'auto'; }
      }
      const dx = box.left < left ? box.left - left : box.right > right ? Math.min(box.right - right, box.left - left) : 0;
      const dy = box.top < top ? box.top - top : box.bottom > bottom ? Math.min(box.bottom - bottom, box.top - top) : 0;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) map.panBy([dx, dy], { duration: 300 });
    };
    setTimeout(keepInView, 80);
    const grow = new ResizeObserver(() => keepInView());
    grow.observe(content);
    popup.on('close', () => grow.disconnect());
    popupRef.current.on('close', () => {
      openStopRef.current = null;
      setActiveSegment(-1);
    });
  };

  const setActiveSegment = (index: number) => {
    activeSegmentRef.current = index;
    const map = mapRef.current;
    if (map?.getLayer('route-active')) map.setFilter('route-active', ['==', ['get', 'index'], index]);
  };

  // Ride mode: highlight the day, show it whole when it changes, then follow the rider if asked.
  const rideMarkerRef = useRef<maplibregl.Marker | null>(null);
  const rideDayRef = useRef<number | null>(null);
  const rideLinesRef = useRef<RideLines>({ done: [], ahead: [], on: false });
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isReady) return;
    // In ride mode every day is faded; the day being ridden is drawn on top: ahead in blue, done in grey.
    const dayPath = ride ? segments[ride.dayIndex]?.path || [] : [];
    const progress = ride?.position && dayPath.length > 1 ? progressOn(dayPath, ride.position) : null;
    const parts = progress && progress.offRouteKm < 5 ? splitAt(dayPath, progress.alongKm) : { done: [], ahead: dayPath };
    rideLinesRef.current = { ...parts, on: Boolean(ride) };
    try { drawRideLines(map, rideLinesRef.current); } catch { /* style loading */ }
    if (!ride) {
      rideMarkerRef.current?.remove();
      rideMarkerRef.current = null;
      if (rideDayRef.current !== null) map.easeTo({ bearing: 0, padding: { top: 0, bottom: 0, left: 0, right: 0 }, duration: 400 });
      rideDayRef.current = null;
      return;
    }
    setActiveSegment(-1);
    const day = segments[ride.dayIndex];
    if (day && rideDayRef.current !== ride.dayIndex) {
      rideDayRef.current = ride.dayIndex;
      const bounds = new maplibregl.LngLatBounds();
      day.path.forEach(p => bounds.extend([p.lng, p.lat]));
      if (!ride.follow || !ride.position) {
        map.fitBounds(bounds, { bearing: 0, padding: window.innerWidth < 768 ? { top: 120, left: 30, right: 30, bottom: Math.round(window.innerHeight * 0.45) } : { top: 100, left: 80, right: 80, bottom: 320 }, duration: 600 });
      }
    }
    if (ride.position) {
      // The arrow turns with the map (so it points up when the map faces the direction of travel).
      if (!rideMarkerRef.current) rideMarkerRef.current = new maplibregl.Marker({ element: positionMarker(), rotationAlignment: 'map' }).setLngLat([ride.position.lng, ride.position.lat]).addTo(map);
      else rideMarkerRef.current.setLngLat([ride.position.lng, ride.position.lat]);
      rideMarkerRef.current.setRotation(ride.heading ?? 0);
      setMarkerHeading(rideMarkerRef.current.getElement(), ride.heading == null ? undefined : 0);
      // Following: the map faces the way you're going, with you low on the screen to show more of the road ahead.
      if (ride.follow) {
        map.easeTo({
          center: [ride.position.lng, ride.position.lat], zoom: Math.max(map.getZoom(), 15),
          bearing: ride.heading ?? map.getBearing(), padding: { top: Math.round(map.getContainer().clientHeight * 0.22), bottom: 0, left: 0, right: 0 },
          duration: 700,
        });
      }
    }
    // Not following: back to north up.
    if (!ride.follow && map.getBearing() !== 0) map.easeTo({ bearing: 0, padding: { top: 0, bottom: 0, left: 0, right: 0 }, duration: 500 });
  }, [ride?.dayIndex, ride?.position?.lat, ride?.position?.lng, ride?.heading, ride?.follow, Boolean(ride), segments, isReady]);

  // Ride mode: the way back to the route when off it (dashed blue).
  const detour = ride?.detour;
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isReady) return;
    const draw = () => {
      const data = { type: 'Feature' as const, properties: {}, geometry: { type: 'LineString' as const, coordinates: (detour || []).map(p => [p.lng, p.lat]) } };
      const source = map.getSource('ride-detour') as maplibregl.GeoJSONSource | undefined;
      if (source) source.setData(data);
      else {
        map.addSource('ride-detour', { type: 'geojson', data });
        map.addLayer({ id: 'ride-detour', type: 'line', source: 'ride-detour', layout: { 'line-cap': 'round' }, paint: { 'line-color': '#7c3aed', 'line-width': 5, 'line-dasharray': [1, 1.6] } });
      }
    };
    try { draw(); } catch { /* style loading */ }
    map.on('style.load', draw);
    return () => { map.off('style.load', draw); };
  }, [detour, isReady]);

  // Create the map once.
  useEffect(() => {
    if (!containerRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLES.topo,
      center: [2.35, 48.86],
      zoom: 4,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: true, visualizePitch: false }), 'top-right');
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-right');
    mapRef.current = map;

    // A new style (Map/Light/Topo/Satellite) starts without our layers: draw the route again.
    map.on('style.load', () => { drawRoute(map, segmentsRef.current, activeSegmentRef.current); drawRideLines(map, rideLinesRef.current); });
    map.on('load', () => { setIsReady(true); onLoad(map); });
    // Stop names show from regional zoom in; zoomed out, only the numbers.
    const toggleLabels = () => containerRef.current?.parentElement?.classList.toggle('stop-labels-hidden', map.getZoom() < 6);
    map.on('zoom', toggleLabels);
    toggleLabels();

    // Hovering a day line shows a pointer; clicking it opens its details; clicking elsewhere offers a new stop.
    map.on('mousemove', (e) => {
      const hit = map.getLayer('route-line') && map.queryRenderedFeatures(e.point, { layers: ['route-line'] }).length > 0;
      map.getCanvas().style.cursor = hit ? 'pointer' : '';
    });
    map.on('click', (e) => {
      const hit = map.getLayer('route-line') ? map.queryRenderedFeatures([[e.point.x - 4, e.point.y - 4], [e.point.x + 4, e.point.y + 4]], { layers: ['route-line'] }) : [];
      const at = { lat: e.lngLat.lat, lng: e.lngLat.lng };
      if (hit.length) {
        const index = hit[0].properties?.index as number;
        const segment = segmentsRef.current[index];
        if (!segment) return;
        showPopup(at, <SegmentDetails label={segment.label} leg={segment.leg} travelMode={callbacksRef.current.travelMode} />);
        setActiveSegment(index);
        openStopRef.current = null;
        return;
      }
      if (!callbacksRef.current.onAddStop) return;
      showPopup(at, (
        <button
          className="rounded-md bg-emerald-600 px-3 py-1.5 font-sans text-xs font-semibold text-white hover:bg-emerald-700"
          onClick={() => { popupRef.current?.remove(); callbacksRef.current.onAddStop?.(at); }}
        >
          + {tr('Add overnight stop here')}
        </button>
      ), 0);
      openStopRef.current = null;
    });
    // Development only: lets browser tests reach the map.
    if (import.meta.env.DEV) (window as any).__osmMap = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // Switching style replaces all layers; the route is re-added on 'style.load'.
  useEffect(() => {
    if (mapRef.current && isReady) styleFor(mapType).then(style => mapRef.current?.setStyle(style)).catch(err => console.warn('Map style unavailable', err));
  }, [mapType]);

  // Route: one feature per day, a white casing under the green line, and a darker highlight for the selected day.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isReady) return;
    // While a new style is still loading, 'style.load' will draw the route instead.
    try { drawRoute(map, segments, activeSegmentRef.current); } catch { /* style loading */ }
  }, [segments, isReady]);

  // Pins for stops, suggestions and bookings.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isReady) return;
    let cancelled = false;

    (async () => {
      const allPoints = buildPoints(origin, waypoints, destination, routeInfo);
      const locations = await Promise.all(allPoints.map(p => (p.position ? Promise.resolve(p.position) : geocodeAddress(p.location))));
      if (cancelled) return;
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      const bounds = new maplibregl.LngLatBounds();

      const openStop = (point: MapPoint, at: LatLng) => {
        const key = refKey(point.ref);
        showPopup(at, (
            <StopPopup
              nights={stays?.get(refKey(point.ref))}
              rentalLink={point.kind === 'start' && travelMode === 'DRIVING' ? rentalUrl(point.location, stays?.get('start')?.checkOut, stays?.get('end')?.checkIn) : null}
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
              attaching={attachingKey === key}
              onFindPlaces={() => callbacksRef.current.onFindPlaces?.(point.ref)}
              onRemoveStop={point.ref.kind === 'stop' && callbacksRef.current.onRemoveStop
                ? () => { popupRef.current?.remove(); callbacksRef.current.onRemoveStop?.(point.ref.index!); }
                : undefined}
            />
        ), pinHeight(point));
        openStopRef.current = key;
      };
      const pinElements = new Map<string, HTMLElement>();
      const pinHeight = (point: MapPoint) => pinElements.get(refKey(point.ref))?.offsetHeight || 38;

      allPoints.forEach((point, idx) => {
        const at = locations[idx];
        if (!at) return;
        bounds.extend([at.lng, at.lat]);
        const el = stopPinElement(point.kind, point.badge, point.location, `${point.label}: ${point.location} (${tr('drag to move')})`);
        el.style.zIndex = '10';
        pinElements.set(refKey(point.ref), el);
        el.addEventListener('click', (e) => { e.stopPropagation(); openStop(point, at); });
        const marker = new maplibregl.Marker({ element: el, anchor: 'bottom', draggable: Boolean(callbacksRef.current.onMoveStop) })
          .setLngLat([at.lng, at.lat]).addTo(map);
        marker.on('dragend', () => {
          const p = marker.getLngLat();
          skipFitRef.current = true;
          popupRef.current?.remove();
          callbacksRef.current.onMoveStop?.(point.ref, { lat: p.lat, lng: p.lng });
        });
        markersRef.current.push(marker);
        // Keep an open stop card open (with fresh content) after edits.
        if (openStopRef.current === refKey(point.ref)) openStop(point, at);

        point.interests.forEach((cat, catIdx) => cat.items.forEach((item, itemIdx) => {
          const isBooking = item.source === 'reservation';
          const lat = isBooking ? item.reservation?.lat : item.lat;
          const lng = isBooking ? item.reservation?.lng : item.lng;
          const id = categoryId(item.category || cat.category);
          if (lat == null || lng == null || (!isBooking && hiddenCategories.includes(id))) return;
          const placeEl = pinElement(isBooking ? '#6d3f63' : CATEGORIES[id].color, CATEGORIES[id].glyph, isBooking ? 24 : 20, `${isBooking ? `${tr('Booked:')} ` : ''}${item.name} (${point.label})`);
          placeEl.addEventListener('click', (e) => {
            e.stopPropagation();
            showPopup({ lat, lng }, (
              <PlacePopup
                item={item}
                categoryId={id}
                point={point}
                nights={stays?.get(refKey(point.ref))}
                onRemove={() => { popupRef.current?.remove(); callbacksRef.current.onRemoveItem?.(point.ref, catIdx, itemIdx); }}
              />
            ), placeEl.offsetHeight || (isBooking ? 30 : 25));
            openStopRef.current = null;
          });
          markersRef.current.push(new maplibregl.Marker({ element: placeEl, anchor: 'bottom' }).setLngLat([lng, lat]).addTo(map));
        }));
      });

      const boundsKey = allPoints.map(p => p.location).join('|');
      if (!bounds.isEmpty() && boundsKey !== lastBoundsKeyRef.current && !skipFitRef.current) {
        // On phones the planner sheet covers the lower half: keep the route in the visible top part.
        const phone = window.innerWidth < 768;
        map.fitBounds(bounds, { padding: phone ? { top: 170, left: 30, right: 30, bottom: Math.round(window.innerHeight * 0.55) } : { top: 110, left: 60, right: 60, bottom: 80 }, maxZoom: 13, duration: 600 });
      }
      lastBoundsKeyRef.current = boundsKey;
      skipFitRef.current = false;
    })();
    return () => { cancelled = true; };
  }, [isReady, waypoints, origin, destination, routeInfo, attachingKey, hiddenCategories, settings.language, settings.units, stays]);

  return (
    <div className={cn("relative h-full w-full", !ride && "vintage-map", !ride && mapType !== 'topo' && "vintage-imagery")}>
      <div ref={containerRef} className="h-full w-full" />

      {/* Category legend: show or hide suggestion pins */}
      <div className="absolute left-3 top-[7.25rem] z-10 flex flex-wrap gap-1 md:bottom-8 md:left-6 md:top-auto">
        {CATEGORY_IDS.map(id => {
          const hidden = hiddenCategories.includes(id);
          return (
            <button
              key={id}
              onClick={() => setHiddenCategories(prev => hidden ? prev.filter(c => c !== id) : [...prev, id])}
              aria-pressed={!hidden}
              title={hidden ? t('Show {name} on the map', { name: t(CATEGORIES[id].name) }) : t('Hide {name} on the map', { name: t(CATEGORIES[id].name) })}
              className={cn("flex items-center gap-1 rounded-sm border bg-white/90 px-2.5 py-1 text-[11px] font-semibold shadow-md backdrop-blur transition-opacity", hidden && "opacity-50 line-through")}
              style={{ color: CATEGORIES[id].color, borderColor: CATEGORIES[id].color }}
            >
              <span>{CATEGORIES[id].glyph}</span>
              <span className="hidden sm:inline">{t(CATEGORIES[id].name)}</span>
            </button>
          );
        })}
        <span className="flex items-center gap-1 rounded-sm border border-violet-600 bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-violet-700 shadow-md">
          <span className="h-2 w-2 rounded-full bg-violet-600" />
          <span className="hidden sm:inline">{t('Booked')}</span>
        </span>
      </div>

      {/* Map style controls */}
      <div className="absolute left-3 top-16 z-10 md:left-6 md:top-6">
        <div className="flex flex-row gap-1 overflow-hidden rounded-xl border border-white/20 bg-white/85 p-1 shadow-xl backdrop-blur-md md:flex-col">
          {MAP_TYPES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setMapType(id)}
              aria-pressed={mapType === id}
              title={t(label)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-bold transition-all md:px-3",
                mapType === id ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20" : "text-muted-foreground hover:bg-emerald-50 hover:text-emerald-600"
              )}
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{t(label)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MapView;
