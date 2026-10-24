import React, { useState, useCallback, useRef, useEffect } from 'react';
import Map from './components/Map';
import Sidebar from './components/Sidebar';
import SavedRoutes from './components/SavedRoutes';
import { RouteInfo, Waypoint, InterestCategory, InterestItem, RouteLeg, StopRef, TripIntent } from './types';
import { planOvernightStops } from './lib/tripBuilder';
import { placeSuggestions, LodgingPreference } from './lib/places';
import type { PlanSummary } from './components/AIAgent';
import { geocodeAddress, townAt, distanceKm } from './lib/geocode';
import { storeAttachment, readAsBase64, fileMimeType } from './lib/attachments';
import { formatDistance, formatDuration } from './lib/utils';
import { Sparkles, MapPin } from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, errorInfo: string | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorInfo: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, errorInfo: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-4 text-center">
          <h1 className="mb-4 text-2xl font-bold text-destructive">Something went wrong</h1>
          <p className="mb-6 text-muted-foreground max-w-md">
            The application encountered an error. This might be due to missing permissions or a configuration issue.
          </p>
          <pre className="mb-6 max-h-48 w-full max-w-lg overflow-auto rounded bg-muted p-4 text-left text-xs">
            {this.state.errorInfo}
          </pre>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-primary px-6 py-2 text-primary-foreground hover:bg-primary/90"
          >
            Reload Application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const WelcomeDialog: React.FC<{ onStart: (prompt: string) => void }> = ({ onStart }) => {
  const [prompt, setPrompt] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  const handleStart = () => {
    onStart(prompt);
  };

  const [locationLabel, setLocationLabel] = useState<string | null>(null);

  // Turn the browser location into a city name and add it to the prompt as the starting point.
  const requestLocation = () => {
    if (!("geolocation" in navigator)) {
      setLocationLabel('Location is not available in this browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { Geocoder } = await google.maps.importLibrary("geocoding") as google.maps.GeocodingLibrary;
          const { results } = await new Geocoder().geocode({
            location: { lat: position.coords.latitude, lng: position.coords.longitude },
          });
          const place = results.find(r => r.types.includes('locality')) || results[0];
          const city = place?.formatted_address;
          if (city) {
            setLocationLabel(`Starting from ${city}`);
            setPrompt(prev => prev.includes(city) ? prev : `${prev.trim()}${prev.trim() ? ' ' : ''}Starting from ${city}.`);
          }
        } catch (err) {
          console.error("Reverse geocoding failed:", err);
          setLocationLabel('Could not look up your city. Please type your starting point.');
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error("Location error:", error);
        setLocationLabel('Location permission was denied. Please type your starting point.');
        setIsLocating(false);
      }
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="max-h-full w-full max-w-lg overflow-y-auto animate-in zoom-in-95 duration-300 rounded-2xl border border-emerald-200 bg-white p-6 shadow-2xl sm:p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400">
            <Sparkles size={32} />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-emerald-900">Welcome to Adventure Planner</h2>
          <p className="text-muted-foreground">Describe your next multi-day roadtrip or adventure. I'll help you plan it!</p>
        </div>

        <div className="space-y-6">
          <div className="relative">
            <textarea
              autoFocus
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Bikepacking from Cádiz to Silves, about 70 km per day, camping where possible..."
              className="min-h-[120px] w-full rounded-xl border border-emerald-100 bg-emerald-50/30 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-emerald-900 dark:bg-emerald-900/20"
            />
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={requestLocation}
              disabled={isLocating}
              className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 py-3 text-sm font-semibold text-emerald-700 transition-all hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
            >
              <MapPin size={18} />
              {isLocating ? 'Locating...' : 'Use My Location as Start'}
            </button>
            {locationLabel && <p className="text-center text-xs text-muted-foreground">{locationLabel}</p>}
            <button
              onClick={handleStart}
              className="rounded-xl bg-emerald-600 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 transition-all hover:bg-emerald-700 hover:scale-[1.02] active:scale-[0.98]"
            >
              {prompt.trim() ? 'Plan My Adventure' : 'Skip and Plan Manually'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [travelMode, setTravelMode] = useState<google.maps.TravelMode>(
    'DRIVING' as google.maps.TravelMode
  );
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [savedRoutes, setSavedRoutes] = useState<RouteInfo[]>([]);
  const [user, setUser] = useState<any>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [expeditionName, setExpeditionName] = useState('');
  const [showWelcome, setShowWelcome] = useState(true);
  const [initialPrompt, setInitialPrompt] = useState('');
  const [mapReady, setMapReady] = useState(false);
  const [lodging, setLodging] = useState<LodgingPreference>('any');
  // Which stop is reading a reservation file ('start', 'stop-2', 'end' or 'any').
  const [attachingKey, setAttachingKey] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    if (origin && destination && (!expeditionName || expeditionName.includes(' to '))) {
      setExpeditionName(`${origin} to ${destination} Expedition`);
    }
  }, [origin, destination]);

  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setSavedRoutes([]);
      return;
    }
    const path = 'trips';
    const q = query(collection(db, path), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const routes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RouteInfo));
      setSavedRoutes(routes);
    }, (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch {
        setToast({ message: 'Could not load saved expeditions.', type: 'error' });
      }
    });
    return () => unsubscribe();
  }, [user]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error('Login failed:', err);
      setToast({ message: 'Sign-in failed. Allow pop-ups for this site and try again.', type: 'error' });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const handleMapLoad = useCallback((
    map: google.maps.Map,
    directionsService: google.maps.DirectionsService,
    directionsRenderer: google.maps.DirectionsRenderer
  ) => {
    mapRef.current = map;
    directionsServiceRef.current = directionsService;
    directionsRendererRef.current = directionsRenderer;
    setMapReady(true);
  }, []);

  // The AI has understood the request; Google Maps does the rest: overnight stops along the real
  // route, the route itself, then Places suggestions for every stop.
  const handlePlanTrip = async (intent: TripIntent): Promise<PlanSummary | null> => {
    if (!directionsServiceRef.current) return null;
    const { waypoints: stops, targetKm } = await planOvernightStops(directionsServiceRef.current, intent);
    const mappedWaypoints: Waypoint[] = stops.map(stop => ({ location: stop.name, position: stop.position, stopover: true, interests: [] }));

    setOrigin(intent.origin);
    setDestination(intent.destination);
    setWaypoints(mappedWaypoints);
    setTravelMode(intent.travelMode as google.maps.TravelMode);
    setLodging(intent.lodging);
    setAiSummary(intent.summary || null);
    const newName = expeditionName && !expeditionName.includes(' to ') ? expeditionName : `${intent.origin} to ${intent.destination} Expedition`;
    setExpeditionName(newName);
    setRouteInfo({
      name: newName,
      origin: intent.origin,
      originInterests: [],
      destination: intent.destination,
      destinationInterests: [],
      waypoints: mappedWaypoints,
      travelMode: intent.travelMode,
      distance: '...',
      duration: '...',
      startAddress: intent.origin,
      endAddress: intent.destination,
      steps: [],
    });
    setHasChanges(true);

    const legs = await calculateRoute(intent.origin, intent.destination, mappedWaypoints, intent.travelMode, { origin: [], destination: [] });
    if (!legs) return null;
    loadSuggestions(
      [{ kind: 'start' }, ...stops.map((_, index) => ({ kind: 'stop' as const, index })), { kind: 'end' }],
      [intent.origin, ...stops.map(s => s.position || s.name), intent.destination],
      intent.travelMode,
      intent.lodging,
    );
    return {
      days: legs.length,
      stops: stops.map(s => s.name),
      targetKm,
      longestKm: Math.round(Math.max(...legs.map(l => (l.distanceMeters || 0) / 1000))),
    };
  };

  const calculateRoute = useCallback(async (
    overrideOrigin?: string,
    overrideDestination?: string,
    overrideWaypoints?: Waypoint[],
    overrideTravelMode?: string,
    overrideInterests?: { origin?: InterestCategory[], destination?: InterestCategory[] }
  ): Promise<RouteLeg[] | null> => {
    const currentOrigin = overrideOrigin || origin;
    const currentDestination = overrideDestination || destination;
    const currentWaypoints = overrideWaypoints || waypoints;
    const currentTravelMode = overrideTravelMode || travelMode;

    if (!currentOrigin || !currentDestination || !directionsServiceRef.current || !directionsRendererRef.current) {
      return null;
    }

    setIsLoading(true);
    setError(null);

    const request = (mode: string, exact = true) => directionsServiceRef.current!.route({
      origin: currentOrigin,
      destination: currentDestination,
      waypoints: currentWaypoints.filter(wp => wp.location.trim() !== '').map(wp => ({
        location: (exact && wp.position) || wp.location,
        stopover: wp.stopover
      })),
      travelMode: mode as google.maps.TravelMode,
    });

    try {
      let notice: string | undefined;
      let result: google.maps.DirectionsResult;
      try {
        result = await request(currentTravelMode as string).catch(err => {
          // An exact stop position can be unroutable for bikes/walkers (e.g. on a ferry line):
          // try the town names before giving up on this travel mode.
          if (!currentWaypoints.some(wp => wp.position)) throw err;
          return request(currentTravelMode as string, false);
        });
      } catch (err) {
        // Transit doesn't support stops and bike/walk routing isn't available everywhere:
        // fall back to driving so the trip still shows on the map.
        if (currentTravelMode === 'DRIVING') throw err;
        result = await request('DRIVING');
        const modeName = { WALKING: 'Walking', BICYCLING: 'Cycling', TRANSIT: 'Transit' }[currentTravelMode as string] || 'These';
        notice = `${modeName} directions aren't available for this route${currentTravelMode === 'TRANSIT' && currentWaypoints.length ? ' with stops' : ''}, so the driving route is shown instead.`;
      }

      directionsRendererRef.current!.setDirections(result);
      
      const legs = result.routes[0].legs;
      const totalDistance = legs.reduce((acc, leg) => acc + (leg.distance?.value || 0), 0);
      const totalDuration = legs.reduce((acc, leg) => acc + (leg.duration?.value || 0), 0);

      const updatedWaypoints = currentWaypoints.map((wp, index) => {
        const newWp = { ...wp };
        // Preserve interests from currentWaypoints (which might be from AI or previous state)
        if (index < legs.length) {
          newWp.distanceFromPrev = legs[index].distance?.text;
        }
        if (index + 1 < legs.length) {
          newWp.distanceToNext = legs[index + 1].distance?.text;
        }
        return newWp;
      });
      setWaypoints(updatedWaypoints);

      const routeLegs: RouteLeg[] = legs.map((leg, i) => ({
        from: i === 0 ? currentOrigin : currentWaypoints[i - 1]?.location || leg.start_address,
        to: i === legs.length - 1 ? currentDestination : currentWaypoints[i]?.location || leg.end_address,
        distance: leg.distance?.text || '',
        duration: formatDuration(leg.duration?.value || 0),
        distanceMeters: leg.distance?.value,
      }));

      setRouteInfo({
        name: expeditionName || `${currentOrigin} to ${currentDestination} Expedition`,
        origin: currentOrigin,
        originInterests: overrideInterests?.origin || routeInfo?.originInterests || [],
        destination: currentDestination,
        destinationInterests: overrideInterests?.destination || routeInfo?.destinationInterests || [],
        waypoints: updatedWaypoints,
        travelMode: currentTravelMode as string,
        distance: formatDistance(totalDistance),
        duration: formatDuration(totalDuration),
        legs: routeLegs,
        notice,
        startAddress: legs[0].start_address,
        endAddress: legs[legs.length - 1].end_address,
        steps: legs.flatMap(leg => leg.steps.map(step => ({
          instruction: step.instructions,
          distance: step.distance?.text || '',
          duration: step.duration?.text || '',
        }))),
      } as RouteInfo);
      return routeLegs;
    } catch (err: any) {
      console.error('Directions request failed:', err);
      let message = 'Could not calculate route. Please check your addresses and try again.';
      if (err.code === 'NOT_FOUND' || (err.message && err.message.includes('NOT_FOUND'))) {
        message = 'One or more locations could not be found. Please use more specific names (e.g., "San Francisco, CA").';
      } else if (err.code === 'ZERO_RESULTS' || (err.message && err.message.includes('ZERO_RESULTS'))) {
        message = 'No route found between these locations. Try a different travel mode or check the terrain.';
      }
      setError(message);
      setRouteInfo(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [origin, destination, waypoints, travelMode, expeditionName, routeInfo]);

  useEffect(() => {
    const hasInputs = origin && destination && mapReady;
    const isInitialLoad = hasInputs && (!routeInfo || routeInfo.distance === '...') && !isLoading && !error;

    if (isInitialLoad) {
      calculateRoute();
    }
  }, [origin, destination, mapReady, routeInfo, isLoading, error, calculateRoute]);

  // ---- Editing stops: suggestions, reservations and moved pins ----

  const stopLabel = (ref: StopRef) => ref.kind === 'start' ? 'Start' : ref.kind === 'end' ? 'Finish' : `Stop ${ref.index! + 1}`;

  const allStops = (): { ref: StopRef; location: string; position?: google.maps.LatLngLiteral }[] => [
    { ref: { kind: 'start' }, location: origin },
    ...waypoints.map((wp, index) => ({ ref: { kind: 'stop' as const, index }, location: wp.location, position: wp.position })),
    { ref: { kind: 'end' }, location: destination },
  ];

  const updateStopInterests = (ref: StopRef, update: (cats: InterestCategory[]) => InterestCategory[]) => {
    if (ref.kind === 'stop') {
      const apply = (list: Waypoint[]) => list.map((wp, i) => i === ref.index ? { ...wp, interests: update(wp.interests || []) } : wp);
      setWaypoints(apply);
      setRouteInfo(prev => prev && { ...prev, waypoints: apply(prev.waypoints) });
    } else {
      const key = ref.kind === 'start' ? 'originInterests' : 'destinationInterests';
      setRouteInfo(prev => prev && { ...prev, [key]: update(prev[key] || []) });
    }
    setHasChanges(true);
  };

  const handleRemoveItem = (ref: StopRef, categoryIndex: number, itemIndex: number) => {
    updateStopInterests(ref, cats => cats.map((cat, i) =>
      i === categoryIndex ? { ...cat, items: cat.items.filter((_, j) => j !== itemIndex) } : cat
    ));
  };

  // Read a booking file with the AI, then place it on the stop whose town is nearest to the booking's address.
  // `ref` is where the user attached it; it wins unless the address is clearly at another stop.
  const handleAttachFile = async (ref: StopRef | null, file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setToast({ message: 'That file is over 10 MB. Try a smaller PDF or the booking email.', type: 'error' });
      return;
    }
    const stops = allStops();
    setAttachingKey(ref ? (ref.kind === 'stop' ? `stop-${ref.index}` : ref.kind) : 'any');
    try {
      const response = await fetch('/api/extract-reservation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: fileMimeType(file),
          data: await readAsBase64(file),
          stops: stops.map(s => `${stopLabel(s.ref)}: ${s.location}`),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `Could not read the file (${response.status})`);
      const r = data.reservation;

      const position = await geocodeAddress(r.address || `${r.name} ${stops[r.stopIndex]?.location || ''}`);
      let target = ref || stops[r.stopIndex]?.ref || stops[0].ref;
      if (position) {
        const located = await Promise.all(stops.map(async s => ({
          ...s, at: s.position ? new google.maps.LatLng(s.position) : await geocodeAddress(s.location),
        })));
        const ranked = located
          .filter(s => s.at)
          .map(s => ({ ...s, km: distanceKm(position, s.at!) }))
          .sort((a, b) => a.km - b.km);
        const nearest = ranked[0];
        const chosen = ranked.find(s => s.ref.kind === target.kind && s.ref.index === target.index);
        if (nearest && (!ref || !chosen || (chosen.km > 50 && nearest.km < chosen.km))) {
          target = nearest.ref;
        }
      }

      const item: InterestItem = {
        name: r.name || file.name,
        description: r.notes || undefined,
        source: 'reservation',
        reservation: {
          fileName: file.name,
          fileType: fileMimeType(file),
          fileId: storeAttachment(file),
          address: r.address || undefined,
          checkIn: r.checkIn || undefined,
          checkOut: r.checkOut || undefined,
          confirmation: r.confirmation || undefined,
          notes: r.notes || undefined,
          lat: position?.lat(),
          lng: position?.lng(),
        },
      };
      updateStopInterests(target, cats => {
        const idx = cats.findIndex(c => c.category.toLowerCase() === String(r.category).toLowerCase());
        if (idx === -1) return [...cats, { category: r.category, items: [item] }];
        return cats.map((c, i) => i === idx ? { ...c, items: [item, ...c.items] } : c);
      });
      const moved = ref && (ref.kind !== target.kind || ref.index !== target.index);
      setToast({
        message: `Added "${item.name}" to ${stopLabel(target)} · ${r.category}${moved ? ' (matched by its address)' : ''}`,
        type: 'success',
      });
    } catch (err) {
      console.error('Reservation import failed:', err);
      setToast({ message: err instanceof Error ? err.message : 'Could not read that file.', type: 'error' });
    } finally {
      setAttachingKey(null);
    }
  };

  // A pin was dragged: name the place, recalculate the route and refresh suggestions.
  // Reservations stay attached to the stop; AI suggestions for the old place are replaced.
  const handleMoveStop = async (ref: StopRef, position: google.maps.LatLngLiteral) => {
    const town = await townAt(position);
    if (!town) {
      setToast({ message: 'Could not find a town there. Try dropping the pin closer to one.', type: 'error' });
      return;
    }
    const keepReservations = (cats: InterestCategory[] = []) => cats
      .map(c => ({ ...c, items: c.items.filter(i => i.source === 'reservation') }))
      .filter(c => c.items.length > 0);

    const newOrigin = ref.kind === 'start' ? town : origin;
    const newDestination = ref.kind === 'end' ? town : destination;
    const newWaypoints = waypoints.map((wp, i) =>
      // Stops keep the exact spot where the pin was dropped; start and finish snap to the town.
      ref.kind === 'stop' && i === ref.index ? { ...wp, location: town, position, interests: keepReservations(wp.interests) } : wp
    );
    const originInterests = ref.kind === 'start' ? keepReservations(routeInfo?.originInterests) : routeInfo?.originInterests || [];
    const destinationInterests = ref.kind === 'end' ? keepReservations(routeInfo?.destinationInterests) : routeInfo?.destinationInterests || [];

    setOrigin(newOrigin);
    setDestination(newDestination);
    setWaypoints(newWaypoints);
    setHasChanges(true);
    setToast({ message: `${stopLabel(ref)} moved to ${town}. Finding places nearby…`, type: 'success' });
    await calculateRoute(newOrigin, newDestination, newWaypoints, travelMode, { origin: originInterests, destination: destinationInterests });

    loadSuggestions([ref], [ref.kind === 'stop' ? position : town], travelMode, lodging);
  };

  // Suggestions replace older ones but never touch the user's reservations.
  const mergeSuggestions = (cats: InterestCategory[], fresh: InterestCategory[]) => {
    const merged = fresh.map(f => {
      const mine = cats.find(c => c.category.toLowerCase() === f.category.toLowerCase());
      return { category: f.category, items: [...(mine?.items.filter(i => i.source === 'reservation') || []), ...f.items] };
    });
    cats.forEach(c => {
      if (!merged.some(m => m.category.toLowerCase() === c.category.toLowerCase())) {
        const kept = c.items.filter(i => i.source === 'reservation');
        if (kept.length) merged.push({ category: c.category, items: kept });
      }
    });
    return merged;
  };

  // Fetch Google Places suggestions for several stops (in the background).
  const loadSuggestions = (refs: StopRef[], locations: (string | google.maps.LatLngLiteral)[], mode: string, lodgingPref: LodgingPreference) => {
    let failed = false;
    refs.forEach((ref, i) => {
      placeSuggestions(locations[i], mode, lodgingPref)
        .then(fresh => { if (fresh.length) updateStopInterests(ref, cats => mergeSuggestions(cats, fresh)); })
        .catch(err => {
          console.error('Place suggestions failed:', err);
          if (!failed) {
            failed = true;
            setToast({ message: 'Could not load place suggestions. Check that "Places API (New)" is enabled for your Maps key.', type: 'error' });
          }
        });
    });
  };

  // Manual planning: calculate, then fill in suggestions for stops that have none yet.
  const handleCalculate = async () => {
    const legs = await calculateRoute();
    if (!legs) return;
    const stops = allStops();
    const empty = stops.filter(({ ref }) => {
      const cats = ref.kind === 'start' ? routeInfo?.originInterests
        : ref.kind === 'end' ? routeInfo?.destinationInterests
        : waypoints[ref.index!]?.interests;
      return !cats?.some(c => c.items.some(i => i.source !== 'reservation'));
    });
    loadSuggestions(empty.map(s => s.ref), empty.map(s => s.position || s.location), travelMode, lodging);
  };

  const handleSave = async () => {
    if (!routeInfo || !user) return;
    const path = 'trips';
    try {
      // Firestore rejects undefined values; a JSON round trip drops them.
      await addDoc(collection(db, path), JSON.parse(JSON.stringify({
        ...routeInfo,
        name: expeditionName || `${origin} to ${destination}`,
        userId: user.uid,
        createdAt: Date.now()
      })));
      setHasChanges(false);
      setToast({ message: 'Expedition saved successfully!', type: 'success' });
    } catch (err) {
      setToast({ message: 'Failed to save expedition.', type: 'error' });
      try { handleFirestoreError(err, OperationType.CREATE, path); } catch { /* logged */ }
    }
  };

  const handleLoadRoute = (route: RouteInfo) => {
    setOrigin(route.origin);
    setDestination(route.destination);
    setWaypoints(route.waypoints);
    setTravelMode(route.travelMode as any);
    setExpeditionName(route.name || `${route.origin} to ${route.destination} Expedition`);
    setShowSaved(false);
    setHasChanges(false);
    setError(null);
    // Keep the saved recommendations; distance '...' makes the route recalculate on the map.
    setRouteInfo({ ...route, distance: '...', duration: '...' });
  };

  const handleDeleteRoute = async (id: string) => {
    const path = `trips/${id}`;
    try {
      await deleteDoc(doc(db, 'trips', id));
      setToast({ message: 'Expedition deleted.', type: 'success' });
    } catch (err) {
      setToast({ message: 'Failed to delete expedition.', type: 'error' });
      try { handleFirestoreError(err, OperationType.DELETE, path); } catch { /* logged */ }
    }
  };

  return (
    <ErrorBoundary>
      <div className="flex h-[100dvh] w-full flex-col-reverse overflow-hidden bg-background text-foreground md:flex-row">
        <Sidebar
          origin={origin}
          setOrigin={(val) => { setOrigin(val); setHasChanges(true); }}
          destination={destination}
          setDestination={(val) => { setDestination(val); setHasChanges(true); }}
          waypoints={waypoints}
          setWaypoints={(val) => { setWaypoints(val); setHasChanges(true); }}
          travelMode={travelMode as any}
          setTravelMode={(val) => { setTravelMode(val); setHasChanges(true); }}
          onCalculate={handleCalculate}
          onSave={handleSave}
          onShowSaved={() => setShowSaved(true)}
          onAISummary={setAiSummary}
          onPlanTrip={handlePlanTrip}
          routeInfo={routeInfo}
          aiSummary={aiSummary}
          error={error}
          isLoading={isLoading}
          user={user}
          onLogin={handleLogin}
          onLogout={handleLogout}
          hasChanges={hasChanges}
          expeditionName={expeditionName}
          setExpeditionName={(val) => { setExpeditionName(val); setHasChanges(true); }}
          initialPrompt={initialPrompt}
          onRemoveItem={handleRemoveItem}
          onAttachFile={handleAttachFile}
          attachingKey={attachingKey}
        />
        <main className="relative min-h-0 flex-1">
          <Map 
            onLoad={handleMapLoad} 
            waypoints={waypoints} 
            origin={origin} 
            destination={destination} 
            routeInfo={routeInfo}
            onMoveStop={handleMoveStop}
            onRemoveItem={handleRemoveItem}
            onAttachFile={handleAttachFile}
            attachingKey={attachingKey}
          />
        </main>

        {showSaved && (
          <SavedRoutes
            routes={savedRoutes}
            onClose={() => setShowSaved(false)}
            onLoad={handleLoadRoute}
            onDelete={handleDeleteRoute}
          />
        )}

        {showWelcome && (
          <WelcomeDialog 
            onStart={(prompt) => {
              setInitialPrompt(prompt);
              setShowWelcome(false);
            }} 
          />
        )}

        {toast && (
          <div className={`fixed bottom-4 right-4 z-[110] animate-in slide-in-from-bottom-5 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-lg ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
          }`}>
            {toast.message}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default App;
