import React, { useState, useCallback, useRef, useEffect } from 'react';
import Map from './components/Map';
import Sidebar from './components/Sidebar';
import SavedRoutes from './components/SavedRoutes';
import { RouteInfo, Waypoint, InterestCategory, AIPlanParams, RouteLeg } from './types';
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
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
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

  // Returns the calculated legs so the AI planner can check real daily distances.
  const handleAIPlan = (params: AIPlanParams): Promise<RouteLeg[] | null> => {
    setOrigin(params.origin);
    setDestination(params.destination);
    
    const mappedWaypoints: Waypoint[] = params.waypoints.map(w => {
      return { 
        location: w.location, 
        stopover: true,
        interests: w.interests
      };
    });
    
    setWaypoints(mappedWaypoints);
    setTravelMode(params.travelMode as any);
    if (params.summary) {
      setAiSummary(params.summary);
    }
    
    const newName = expeditionName || `${params.origin} to ${params.destination} Expedition`;
    if (!expeditionName || expeditionName.includes(' to ')) {
      setExpeditionName(newName);
    }
    
    // Create preliminary route info with AI recommendations
    const initialRouteInfo: RouteInfo = {
      name: newName,
      origin: params.origin,
      originInterests: params.originInterests,
      destination: params.destination,
      destinationInterests: params.destinationInterests,
      waypoints: mappedWaypoints,
      travelMode: params.travelMode,
      distance: '...',
      duration: '...',
      startAddress: params.origin,
      endAddress: params.destination,
      steps: []
    };
    
    setRouteInfo(initialRouteInfo);
    setHasChanges(true);

    // Trigger calculation immediately
    return calculateRoute(
      params.origin, 
      params.destination, 
      mappedWaypoints, 
      params.travelMode,
      { origin: params.originInterests, destination: params.destinationInterests }
    );
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

    const request = (mode: string) => directionsServiceRef.current!.route({
      origin: currentOrigin,
      destination: currentDestination,
      waypoints: currentWaypoints.filter(wp => wp.location.trim() !== '').map(wp => ({
        location: wp.location,
        stopover: wp.stopover
      })),
      travelMode: mode as google.maps.TravelMode,
    });

    try {
      let notice: string | undefined;
      let result: google.maps.DirectionsResult;
      try {
        result = await request(currentTravelMode as string);
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

  const handleSave = async () => {
    if (!routeInfo || !user) return;
    const path = 'trips';
    try {
      await addDoc(collection(db, path), {
        ...routeInfo,
        name: expeditionName || `${origin} to ${destination}`,
        userId: user.uid,
        createdAt: Date.now()
      });
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
          onCalculate={calculateRoute}
          onSave={handleSave}
          onShowSaved={() => setShowSaved(true)}
          onAISummary={setAiSummary}
          onAIPlan={handleAIPlan}
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
        />
        <main className="relative min-h-0 flex-1">
          <Map 
            onLoad={handleMapLoad} 
            waypoints={waypoints} 
            origin={origin} 
            destination={destination} 
            routeInfo={routeInfo}
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
