import React, { useEffect, useRef, useState } from 'react';
import { Waypoint, RouteInfo, InterestCategory } from '../types';
import { Layers, Map as MapIcon, Globe, Mountain } from 'lucide-react';
import { createRoot, Root } from 'react-dom/client';
import { cn } from '../lib/utils';
import StopDetails, { StopKind } from './StopDetails';

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
}

type MapType = 'roadmap' | 'satellite' | 'hybrid' | 'terrain';

const MAP_TYPES: { id: MapType; label: string; icon: typeof MapIcon }[] = [
  { id: 'roadmap', label: 'Map', icon: MapIcon },
  { id: 'satellite', label: 'Satellite', icon: Globe },
  { id: 'hybrid', label: 'Hybrid', icon: Layers },
  { id: 'terrain', label: 'Terrain', icon: Mountain },
];

const PIN_COLORS: Record<StopKind, string> = { start: '#2563eb', stop: '#059669', end: '#dc2626' };

// Geocode results are cached for the session so markers don't re-query Google on every render.
// (globalThis.Map because this component is itself named Map.)
const geocodeCache = new globalThis.Map<string, google.maps.LatLng | null>();

const Map: React.FC<MapProps> = ({ onLoad, waypoints = [], origin, destination, routeInfo }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const infoRootRef = useRef<Root | null>(null);
  const [mapType, setMapType] = useState<MapType>('roadmap');
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
      infoWindowRef.current = new InfoWindow({ maxWidth: 380 });
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
        const { Geocoder } = await google.maps.importLibrary("geocoding") as google.maps.GeocodingLibrary;
        const geocoder = new Geocoder();

        const allPoints: (Partial<Waypoint> & { location: string; kind: StopKind; label: string; badge: string })[] = [
          ...(origin ? [{ location: origin, kind: 'start' as const, label: 'Start', badge: 'S' }] : []),
          ...waypoints.map((wp, i) => ({ ...wp, kind: 'stop' as const, label: `Stop ${i + 1}`, badge: String(i + 1) })),
          ...(destination ? [{ location: destination, kind: 'end' as const, label: 'Finish', badge: 'F' }] : [])
        ];

        const placeholders = ['apt', 'home', 'my location', 'office', 'work'];
        const geocode = async (address: string) => {
          const key = address.trim().toLowerCase();
          if (key.length < 3 || placeholders.includes(key)) return null;
          if (geocodeCache.has(key)) return geocodeCache.get(key)!;
          try {
            const { results } = await geocoder.geocode({ address });
            const location = results?.[0]?.geometry.location ?? null;
            geocodeCache.set(key, location);
            return location;
          } catch (error: any) {
            if (error.code !== 'ZERO_RESULTS') console.error(`Geocoding failed for ${address}:`, error);
            geocodeCache.set(key, null);
            return null;
          }
        };

        const locations = await Promise.all(allPoints.map(p => geocode(p.location)));
        if (cancelled) return;

        markersRef.current.forEach(marker => { marker.map = null; });
        markersRef.current = [];
        const bounds = new google.maps.LatLngBounds();

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
            title: `${point.label}: ${point.location}`,
            content: pin,
            gmpClickable: true
          });

          marker.addEventListener('gmp-click', () => {
            const interests: InterestCategory[] =
              point.kind === 'start' ? routeInfo?.originInterests || [] :
              point.kind === 'end' ? routeInfo?.destinationInterests || [] :
              point.interests || [];

            const content = document.createElement('div');
            infoRootRef.current?.unmount();
            infoRootRef.current = createRoot(content);
            infoRootRef.current.render(
              <div className="w-[300px] max-w-full">
                <StopDetails
                  compact
                  kind={point.kind}
                  badge={point.badge}
                  title={point.label}
                  location={point.location}
                  interests={interests}
                  distanceFromPrev={point.distanceFromPrev}
                  distanceToNext={point.distanceToNext}
                />
              </div>
            );
            infoWindowRef.current?.setContent(content);
            infoWindowRef.current?.open({ map: googleMapRef.current, anchor: marker });
          });

          markersRef.current.push(marker);
        });

        if (!bounds.isEmpty() && googleMapRef.current) {
          googleMapRef.current.fitBounds(bounds, 60);
        }
      } catch (err) {
        console.error("Error updating markers:", err);
      }
    };

    updateMarkers();
    return () => { cancelled = true; };
  }, [isReady, waypoints, origin, destination, routeInfo]);

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
