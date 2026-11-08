import React, { useState, useCallback, useRef, useEffect, useMemo, lazy, Suspense } from 'react';
import GoogleMapView from './components/Map';
import { isOsm } from './lib/provider';
// The open version's map (MapLibre) is loaded only when used.
const OsmMapView = lazy(() => import('./components/MapOsm'));
const MapView: React.ComponentType<React.ComponentProps<typeof GoogleMapView>> = isOsm ? (OsmMapView as any) : GoogleMapView;
import Sidebar from './components/Sidebar';
import SavedRoutes from './components/SavedRoutes';
import { RouteInfo, Waypoint, InterestCategory, InterestItem, RouteLeg, StopRef, TripIntent } from './types';
import { planOvernightStops } from './lib/tripBuilder';
import { computeTrip, ferryKm, RoutedTrip, RouteOptions, NO_AVOIDANCES, RoutePlace } from './lib/routing';
import { elevationsAlong, climbStats } from './lib/elevation';
import { buildSchedule, staysByStop, bookingWarnings, bookingCosts } from './lib/schedule';
import { buildGpx, gpxFileName, downloadFile } from './lib/gpx';
import { downsample } from './lib/geo';
import { placeSuggestions, LodgingPreference } from './lib/places';
import type { PlanSummary } from './components/AIAgent';
import { geocodeAddress, townAt } from './lib/geocode';
import { bestInsertIndex, haversineKm } from './lib/geo';
import { mergeSuggestions, keepReservations } from './lib/suggestions';
import { storeAttachment, readAsBase64, fileMimeType, attachmentFile } from './lib/attachments';
import { formatDistance, formatDuration } from './lib/utils';
import { Sparkles, MapPin } from 'lucide-react';
import { db, auth, storage, handleFirestoreError, OperationType } from './firebase';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged, getRedirectResult, signOut } from 'firebase/auth';
import LoginDialog from './components/LoginDialog';
import BudgetView from './components/BudgetView';
import DocumentsView from './components/DocumentsView';
import ViewTabs, { AppView } from './components/ViewTabs';
import { BudgetSettings, defaultBudget } from './lib/budget';
import type { Vehicle } from './lib/fuel';
import { authErrorMessage } from './lib/authErrors';
import { useSettings, t as tr, getSettings, formatters } from './lib/settings';
import { authFetch, checkLimit, LimitError, refreshAccount, takePlaceSearches, onOpenPlans, openPlans, getAccount, PlansReason } from './lib/account';
import PlansDialog from './components/PlansDialog';

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
  const { t } = useSettings();
  const [prompt, setPrompt] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  const handleStart = () => {
    onStart(prompt);
  };

  const [locationLabel, setLocationLabel] = useState<string | null>(null);

  // Turn the browser location into a city name and add it to the prompt as the starting point.
  const requestLocation = () => {
    if (!("geolocation" in navigator)) {
      setLocationLabel(t('Location is not available in this browser.'));
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const city = await townAt({ lat: position.coords.latitude, lng: position.coords.longitude });
          if (city) {
            setLocationLabel(t('Starting from {city}', { city }));
            setPrompt(prev => prev.includes(city) ? prev : `${prev.trim()}${prev.trim() ? ' ' : ''}${t('Starting from {city}', { city })}.`);
          }
        } catch (err) {
          console.error("Reverse geocoding failed:", err);
          setLocationLabel(t('Could not look up your city. Please type your starting point.'));
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error("Location error:", error);
        setLocationLabel(t('Location permission was denied. Please type your starting point.'));
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
          <h2 className="mb-2 text-2xl font-bold text-emerald-900">{t('Welcome to Adventure Planner')}</h2>
          <p className="text-muted-foreground">{t("Describe your next multi-day roadtrip or adventure. I'll help you plan it!")}</p>
        </div>

        <div className="space-y-6">
          <div className="relative">
            <textarea
              autoFocus
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t('e.g., Bikepacking from Cádiz to Silves, about 70 km per day, camping where possible...')}
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
              {isLocating ? t('Locating...') : t('Use my location as start')}
            </button>
            {locationLabel && <p className="text-center text-xs text-muted-foreground">{locationLabel}</p>}
            <button
              onClick={handleStart}
              className="rounded-xl bg-emerald-600 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 transition-all hover:bg-emerald-700 hover:scale-[1.02] active:scale-[0.98]"
            >
              {prompt.trim() ? t('Plan my adventure') : t('Skip and plan manually')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// A trip's default name, the same in every language: "Tavira → Beja".
const autoName = (from: string, to: string) => `${from.split(',')[0].trim()} → ${to.split(',')[0].trim()}`;
// Names made by the app (including older "X to Y Expedition" ones) follow route changes; typed names stay.
const isAutoName = (name: string) => / → | to /.test(name);

// Trips with more stops than this load suggestions for intermediate stops on request.
const MAX_EAGER_STOPS = 10;

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
  const [showLogin, setShowLogin] = useState(false);
  const [lodging, setLodging] = useState<LodgingPreference>('any');
  // Units, currency and language (Settings button); re-renders the app when they change.
  const { settings: appSettings, ...fmt } = useSettings();
  // A new currency in Settings also applies to the trip's budget.
  const firstCurrency = useRef(true);
  useEffect(() => {
    if (firstCurrency.current) { firstCurrency.current = false; return; }
    setBudgetSettings(prev => prev && { ...prev, currency: appSettings.currency });
  }, [appSettings.currency]);
  // Top tabs: the map (Route), the Budget table or the Documents bucket.
  const [view, setView] = useState<AppView>('route');
  // The traveller's budget averages; null until edited (defaults follow the travel mode and lodging).
  const [budgetSettings, setBudgetSettings] = useState<BudgetSettings | null>(null);
  // The plans screen: undefined = closed; otherwise why it opened (a limit, or null from the menu).
  const [plansReason, setPlansReason] = useState<PlansReason | undefined>(undefined);
  useEffect(() => onOpenPlans(reason => setPlansReason(reason)), []);
  // The typed route (start, stops, end, mode) changed since the last calculation.
  const [routeStale, setRouteStale] = useState(false);
  // Moto/car trips: the vehicle, for fuel and toll estimates (from the request, a quick reply or the budget).
  const [vehicle, setVehicle] = useState<Vehicle | undefined>(undefined);
  const passThroughRef = useRef<{ stopsKey: string; via: { name: string; beforeStop: number }[] } | null>(null);
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
      setExpeditionName(autoName(origin, destination));
    }
  }, [origin, destination]);

  const mapRef = useRef<google.maps.Map | null>(null);
  // The last calculated route (paths per day), used for drawing, elevation and GPX export.
  const tripRef = useRef<RoutedTrip | null>(null);
  // What the AI understood for the current plan, to re-plan when route options change.
  const lastIntentRef = useRef<TripIntent | null>(null);
  const [trip, setTrip] = useState<RoutedTrip | null>(null);
  const [routeOptions, setRouteOptions] = useState<RouteOptions>(NO_AVOIDANCES);
  const [startDate, setStartDate] = useState('');
  // The saved trip being edited, whether it's someone else's shared trip, and its share link.
  const [currentTripId, setCurrentTripId] = useState<string | null>(null);
  const [viewingShared, setViewingShared] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      // The plan follows the account (Visitor when logged out).
      refreshAccount();
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
        setToast({ message: tr('Could not load saved expeditions.'), type: 'error' });
      }
    });
    return () => unsubscribe();
  }, [user]);

  // "Log in" opens the login dialog (email, Google, and any other enabled providers).
  const handleLogin = () => setShowLogin(true);

  // Finish a sign-in that fell back to a full-page redirect (when pop-ups were blocked).
  useEffect(() => {
    getRedirectResult(auth).catch(err => setToast({ message: authErrorMessage(err), type: 'error' }));
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  // The AI can answer before the map has loaded (a slow connection, or a prompt from the welcome
  // screen): planning waits for the map instead of giving up.
  const mapReadyRef = useRef(false);
  const mapWaiters = useRef<(() => void)[]>([]);
  const whenMapReady = () => mapReadyRef.current ? Promise.resolve(true) : new Promise<boolean>(resolve => {
    const timer = setTimeout(() => resolve(false), 45000);
    mapWaiters.current.push(() => { clearTimeout(timer); resolve(true); });
  });

  const handleMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    mapReadyRef.current = true;
    mapWaiters.current.splice(0).forEach(done => done());
    setMapReady(true);
  }, []);

  // The AI has understood the request; Google Maps does the rest: overnight stops along the real
  // route, the route itself, then Places suggestions for every stop.
  const handlePlanTrip = async (intent: TripIntent, baseOptions: RouteOptions = routeOptions): Promise<PlanSummary | null> => {
    if (!(await whenMapReady())) return null;
    lastIntentRef.current = intent;
    // The plan's own choice about ferries wins (from the request or the planner's ferry question).
    const options = {
      ...baseOptions,
      ...(intent.avoidFerries === undefined ? {} : { avoidFerries: intent.avoidFerries }),
      // Off-road follows the request (no off-road for public transport).
      ...(intent.offroad === undefined ? {} : { offroad: intent.offroad && intent.travelMode !== 'TRANSIT' }),
    };
    setRouteOptions(options);
    const { waypoints: stops, targetKm, passThrough } = await planOvernightStops(intent, options);
    const mappedWaypoints: Waypoint[] = stops.map(stop => ({ location: stop.name, position: stop.position, stopover: true, interests: [] }));
    // Named places to pass through (e.g. "via Monsaraz") shape the route while the stops stay as planned.
    passThroughRef.current = { stopsKey: mappedWaypoints.map(w => w.location).join('|'), via: passThrough };

    setOrigin(intent.origin);
    setDestination(intent.destination);
    setWaypoints(mappedWaypoints);
    setTravelMode(intent.travelMode as google.maps.TravelMode);
    setLodging(intent.lodging);
    setTravelMode(intent.travelMode as google.maps.TravelMode);
    setAiSummary(intent.summary || null);
    const newName = expeditionName && !isAutoName(expeditionName) ? expeditionName : autoName(intent.origin, intent.destination);
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

    const legs = await calculateRoute(intent.origin, intent.destination, mappedWaypoints, intent.travelMode, { origin: [], destination: [] }, options);
    if (!legs) return null;
    // Long trips: suggestions for the start and finish now, other stops on request ("Find places nearby"),
    // to keep Places searches (and their cost) down.
    const allRefs: StopRef[] = [{ kind: 'start' }, ...stops.map((_, index) => ({ kind: 'stop' as const, index })), { kind: 'end' }];
    const allLocations = [intent.origin, ...stops.map(s => s.position || s.name), intent.destination];
    const eager = stops.length <= MAX_EAGER_STOPS ? allRefs.map((_, i) => i) : [0, allRefs.length - 1];
    loadSuggestions(eager.map(i => allRefs[i]), eager.map(i => allLocations[i]), intent.travelMode, intent.lodging);
    const totalKm = legs.reduce((sum, l) => sum + (l.distanceMeters || 0), 0) / 1000;
    const ferryTotal = legs.reduce((sum, l) => sum + (l.ferryKm || 0), 0);
    const ferryLeg = legs.reduce<{ i: number; km: number } | null>((best, l, i) =>
      (l.ferryKm || 0) >= 10 && (!best || (l.ferryKm || 0) > best.km) ? { i, km: l.ferryKm! } : best, null);
    return {
      days: legs.length,
      stops: stops.map(s => s.name),
      targetKm,
      longestKm: Math.round(Math.max(...legs.map(l => (l.distanceMeters || 0) / 1000 - (l.ferryKm || 0)))),
      totalKm: Math.round(totalKm),
      averageKm: Math.round((totalKm - ferryTotal) / legs.length),
      ferryKm: ferryTotal,
      ferry: ferryLeg ? { day: ferryLeg.i + 1, from: legs[ferryLeg.i].from, to: legs[ferryLeg.i].to, km: ferryLeg.km } : undefined,
    };
  };

  const calculateRoute = useCallback(async (
    overrideOrigin?: string,
    overrideDestination?: string,
    overrideWaypoints?: Waypoint[],
    overrideTravelMode?: string,
    overrideInterests?: { origin?: InterestCategory[], destination?: InterestCategory[] },
    overrideOptions?: RouteOptions,
  ): Promise<RouteLeg[] | null> => {
    const currentOrigin = overrideOrigin || origin;
    const currentDestination = overrideDestination || destination;
    const currentWaypoints = overrideWaypoints || waypoints;
    const currentTravelMode = overrideTravelMode || travelMode;
    const options = overrideOptions || routeOptions;

    if (!currentOrigin || !currentDestination || !mapReadyRef.current) {
      return null;
    }

    setIsLoading(true);
    setError(null);

    const stops = currentWaypoints.filter(wp => wp.location.trim() !== '');
    // Pass-through places from the plan, threaded between the stops (only while the stops are unchanged).
    const pass = passThroughRef.current;
    const usePass = pass && pass.stopsKey === stops.map(w => w.location).join('|') ? pass.via : [];
    const routeStops = (exact: boolean) => {
      const out: { location: RoutePlace; via: boolean }[] = [];
      stops.forEach((wp, k) => {
        usePass.filter(p => p.beforeStop === k).forEach(p => out.push({ location: p.name, via: true }));
        out.push({ location: (exact && wp.position) || wp.location, via: !wp.stopover });
      });
      usePass.filter(p => p.beforeStop >= stops.length).forEach(p => out.push({ location: p.name, via: true }));
      return out;
    };
    const request = (mode: string, exact = true) => computeTrip({
      origin: currentOrigin,
      destination: currentDestination,
      stops: routeStops(exact),
      travelMode: mode,
      options,
    });

    try {
      let notice: string | undefined;
      let trip: RoutedTrip;
      try {
        trip = await request(currentTravelMode as string).catch(err => {
          // An exact stop position can be unroutable for bikes/walkers (e.g. on a ferry line):
          // try the town names before giving up on this travel mode.
          if (!stops.some(wp => wp.position)) throw err;
          return request(currentTravelMode as string, false);
        });
      } catch (err) {
        // Transit doesn't support stops and bike/walk routing isn't available everywhere:
        // fall back to driving so the trip still shows on the map.
        if (currentTravelMode === 'DRIVING') throw err;
        trip = await request('DRIVING');
        const modeName = tr({ WALKING: 'Walking', BICYCLING: 'Cycling', TRANSIT: 'Transit' }[currentTravelMode as string] || 'These');
        notice = currentTravelMode === 'TRANSIT' && stops.length
          ? tr("{mode} directions aren't available for this route with stops, so the driving route is shown instead.", { mode: modeName })
          : tr("{mode} directions aren't available for this route, so the driving route is shown instead.", { mode: modeName });
      }

      tripRef.current = trip;
      setTrip(trip);
      if (trip.offroadUnavailable) notice = `${notice ? notice + ' ' : ''}${tr("Off-road routing wasn't available for this route, so the normal route is shown.")}`;
      const ferry = ferryKm(trip);
      if (ferry >= 10) {
        const tip = currentTravelMode === 'DRIVING' || options.avoidFerries ? '' : ` ${tr('Turn on "Avoid ferries" to travel the whole way overland.')}`;
        notice = `${notice ? notice + ' ' : ''}${tr('This route includes about {d} by ferry (no riding, and no overnight stops at sea).', { d: formatters(getSettings()).dist(ferry, 0) })}${tip}`;
      }
      const legs = trip.legs;
      const totalDistance = legs.reduce((acc, leg) => acc + leg.distanceMeters, 0);
      const totalDuration = legs.reduce((acc, leg) => acc + leg.durationSeconds, 0);

      const updatedWaypoints = currentWaypoints.map((wp, index) => {
        const newWp = { ...wp };
        // Preserve interests from currentWaypoints (which might be from AI or previous state)
        if (index < legs.length) {
          newWp.distanceFromPrev = formatDistance(legs[index].distanceMeters);
        }
        if (index + 1 < legs.length) {
          newWp.distanceToNext = formatDistance(legs[index + 1].distanceMeters);
        }
        return newWp;
      });
      setWaypoints(updatedWaypoints);

      const routeLegs: RouteLeg[] = legs.map((leg, i) => ({
        from: i === 0 ? currentOrigin : currentWaypoints[i - 1]?.location || leg.startAddress || '',
        to: i === legs.length - 1 ? currentDestination : currentWaypoints[i]?.location || leg.endAddress || '',
        distance: formatDistance(leg.distanceMeters),
        duration: formatDuration(leg.durationSeconds),
        distanceMeters: leg.distanceMeters,
        durationSeconds: leg.durationSeconds,
        end: leg.path[leg.path.length - 1],
        ferryKm: Math.round(leg.steps.filter(st => st.ferry).reduce((sum, st) => sum + st.distanceMeters, 0) / 1000) || undefined,
      }));

      setRouteStale(false);
      setRouteInfo({
        name: expeditionName || autoName(currentOrigin, currentDestination),
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
        startAddress: legs[0].startAddress || currentOrigin,
        endAddress: legs[legs.length - 1].endAddress || currentDestination,
        steps: legs.flatMap(leg => leg.steps.map(step => ({
          instruction: step.instruction,
          distance: formatDistance(step.distanceMeters),
          duration: formatDuration(step.durationSeconds),
        }))),
      } as RouteInfo);

      // Climbing per day, filled in when the Elevation API answers.
      addElevation(trip);
      return routeLegs;
    } catch (err: any) {
      console.error('Route request failed:', err);
      let message = tr('Could not calculate route. Please check your addresses and try again.');
      if (err.code === 'NOT_FOUND' || (err.message && err.message.includes('NOT_FOUND'))) {
        message = tr('One or more locations could not be found. Please use more specific names (e.g., "San Francisco, CA").');
      } else if (err.code === 'ZERO_RESULTS' || (err.message && err.message.includes('ZERO_RESULTS'))) {
        message = tr('No route found between these locations. Try a different travel mode or check the terrain.');
      }
      setError(message);
      setRouteInfo(null);
      setTrip(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [origin, destination, waypoints, travelMode, expeditionName, routeInfo, routeOptions, mapReady]);

  // Elevation profile and climbing for each day of the current route.
  const addElevation = async (trip: RoutedTrip) => {
    const profiles = await Promise.all(trip.legs.map(leg => elevationsAlong(leg.path, 64)));
    if (tripRef.current !== trip || profiles.every(p => !p)) return;
    setRouteInfo(prev => prev && prev.legs && {
      ...prev,
      legs: prev.legs.map((leg, i) => {
        const profile = profiles[i];
        return profile ? { ...leg, ...climbStats(profile), profile: profile.map(e => Math.round(e)) } : leg;
      }),
    });
  };

  useEffect(() => {
    const hasInputs = origin && destination && mapReady;
    // Only for trips being opened or planned (distance '...'); typed routes wait for "Calculate",
    // so a half-typed destination or stops still being added don't start a route.
    const isInitialLoad = hasInputs && routeInfo?.distance === '...' && !isLoading && !error;

    if (isInitialLoad) {
      calculateRoute();
    }
  }, [origin, destination, mapReady, routeInfo, isLoading, error, calculateRoute]);

  // ---- Editing stops: suggestions, reservations and moved pins ----

  const stopLabel = (ref: StopRef) => ref.kind === 'start' ? tr('Start') : ref.kind === 'end' ? tr('Finish') : tr('Stop {n}', { n: ref.index! + 1 });

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
      setToast({ message: tr('That file is over 10 MB. Try a smaller PDF or the booking email.'), type: 'error' });
      return;
    }
    const stops = allStops();
    setAttachingKey(ref ? (ref.kind === 'stop' ? `stop-${ref.index}` : ref.kind) : 'any');
    try {
      const response = await authFetch('/api/extract-reservation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: fileMimeType(file),
          data: await readAsBase64(file),
          stops: stops.map(s => `${stopLabel(s.ref)}: ${s.location}`),
        }),
      });
      await checkLimit(response);
      refreshAccount();
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || tr('Could not read the file ({status})', { status: response.status }));
      const r = data.reservation;

      const position = await geocodeAddress(r.address || `${r.name} ${stops[r.stopIndex]?.location || ''}`);
      let target = ref || stops[r.stopIndex]?.ref || stops[0].ref;
      if (position) {
        const located = await Promise.all(stops.map(async s => ({
          ...s, at: s.position || await geocodeAddress(s.location),
        })));
        const ranked = located
          .filter(s => s.at)
          .map(s => ({ ...s, km: haversineKm(position, s.at!) }))
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
          checkInDate: /^\d{4}-\d{2}-\d{2}$/.test(r.checkInDate) ? r.checkInDate : undefined,
          checkOutDate: /^\d{4}-\d{2}-\d{2}$/.test(r.checkOutDate) ? r.checkOutDate : undefined,
          price: typeof r.price === 'number' && r.price > 0 ? r.price : undefined,
          currency: r.currency || undefined,
          confirmation: r.confirmation || undefined,
          notes: r.notes || undefined,
          lat: position?.lat,
          lng: position?.lng,
        },
      };
      updateStopInterests(target, cats => {
        const idx = cats.findIndex(c => c.category.toLowerCase() === String(r.category).toLowerCase());
        if (idx === -1) return [...cats, { category: r.category, items: [item] }];
        return cats.map((c, i) => i === idx ? { ...c, items: [item, ...c.items] } : c);
      });
      const moved = ref && (ref.kind !== target.kind || ref.index !== target.index);
      setToast({
        message: `${tr('Added "{name}" to {stop}', { name: item.name, stop: stopLabel(target) })} · ${tr(r.category)}${moved ? ` ${tr('(matched by its address)')}` : ''}`,
        type: 'success',
      });
    } catch (err) {
      if (err instanceof LimitError) {
        setToast({ message: tr("You've used today's document reads on your plan."), type: 'error' });
        openPlans('documents');
        return;
      }
      console.error('Reservation import failed:', err);
      setToast({ message: err instanceof Error ? err.message : tr('Could not read that file.'), type: 'error' });
    } finally {
      setAttachingKey(null);
    }
  };

  // A pin was dragged: name the place, recalculate the route and refresh suggestions.
  // Reservations stay attached to the stop; AI suggestions for the old place are replaced.
  const handleMoveStop = async (ref: StopRef, position: google.maps.LatLngLiteral) => {
    const town = await townAt(position);
    if (!town) {
      setToast({ message: tr('Could not find a town there. Try dropping the pin closer to one.'), type: 'error' });
      return;
    }
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

  // A click on the map: add an overnight stop where it adds the least distance, then re-route.
  const handleAddStop = async (position: google.maps.LatLngLiteral) => {
    const name = await townAt(position);
    if (!name) return;
    const points = await Promise.all(allStops().map(async s => s.position || await geocodeAddress(s.location)));
    if (points.some(p => !p)) return;
    const insertAt = bestInsertIndex(points as google.maps.LatLngLiteral[], position);
    const newWaypoints = [...waypoints];
    newWaypoints.splice(insertAt, 0, { location: name, position, stopover: true, interests: [] });
    setWaypoints(newWaypoints);
    setHasChanges(true);
    setToast({ message: tr('Added a stop at {name}. Finding places nearby…', { name }), type: 'success' });
    const legs = await calculateRoute(undefined, undefined, newWaypoints);
    if (legs) loadSuggestions([{ kind: 'stop', index: insertAt }], [position], travelMode, lodging);
  };

  const handleRemoveStop = async (index: number) => {
    const newWaypoints = waypoints.filter((_, i) => i !== index);
    setWaypoints(newWaypoints);
    setHasChanges(true);
    await calculateRoute(undefined, undefined, newWaypoints);
  };

  // Fetch Google Places suggestions for several stops (in the background).
  const loadSuggestions = async (refs: StopRef[], locations: (string | google.maps.LatLngLiteral)[], mode: string, lodgingPref: LodgingPreference) => {
    if (!refs.length) return;
    // Each stop's suggestions count as one place search (the costly part of a trip).
    if (!(await takePlaceSearches(refs.length))) {
      setToast({ message: tr("You've used today's place searches on your plan."), type: 'error' });
      openPlans('placeSearches');
      return;
    }
    let failed = false;
    refs.forEach((ref, i) => {
      placeSuggestions(locations[i], mode, lodgingPref)
        .then(fresh => { if (fresh.length) updateStopInterests(ref, cats => mergeSuggestions(cats, fresh)); })
        .catch(err => {
          console.error('Place suggestions failed:', err);
          if (!failed) {
            failed = true;
            setToast({
              message: isOsm
                ? tr('Could not load place suggestions from OpenStreetMap (Overpass may be busy). Try "Find places nearby" again in a minute.')
                : tr('Could not load place suggestions. Check that "Places API (New)" is enabled for your Maps key.'),
              type: 'error',
            });
          }
        });
    });
  };

  const handleFindPlaces = (ref: StopRef) => {
    const stop = allStops().find(s => s.ref.kind === ref.kind && s.ref.index === ref.index);
    if (stop) loadSuggestions([ref], [stop.position || stop.location], travelMode, lodging);
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
    const some = empty.length <= MAX_EAGER_STOPS + 2 ? empty : empty.filter(s => s.ref.kind !== 'stop');
    loadSuggestions(some.map(s => s.ref), some.map(s => s.position || s.location), travelMode, lodging);
  };

  // ---- Schedule: dates, rest days, booking checks, costs, GPX ----

  const schedule = useMemo(
    () => buildSchedule(routeInfo?.legs?.length || 0, (routeInfo?.waypoints || []).map(wp => wp.restDays || 0), startDate || undefined),
    [routeInfo, startDate],
  );

  const warnings = useMemo(() => {
    if (!routeInfo) return [];
    const stays = staysByStop(schedule, routeInfo.waypoints.length);
    return bookingWarnings([
      { key: 'start', label: routeInfo.origin, interests: routeInfo.originInterests || [] },
      ...routeInfo.waypoints.map((wp, i) => ({ key: `stop-${i}`, label: wp.location, interests: wp.interests || [] })),
      { key: 'end', label: routeInfo.destination, interests: routeInfo.destinationInterests || [] },
    ], stays);
  }, [routeInfo, schedule]);

  const costs = useMemo(() => routeInfo ? bookingCosts([
    routeInfo.originInterests || [], ...routeInfo.waypoints.map(wp => wp.interests || []), routeInfo.destinationInterests || [],
  ]) : {}, [routeInfo]);

  // Each day's path, for the budget's toll estimate.
  const legPaths = useMemo(() => (trip?.legs || []).map(leg => leg.path), [trip]);

  const documentCount = useMemo(() => routeInfo ? [
    routeInfo.originInterests || [], ...routeInfo.waypoints.map(wp => wp.interests || []), routeInfo.destinationInterests || [],
  ].flat().reduce((n, cat) => n + cat.items.filter(item => item.source === 'reservation').length, 0) : 0, [routeInfo]);

  // Map segments: one per riding day, labelled with the day number (rest days included).
  const segments = useMemo(() => (trip?.legs || []).map((leg, i) => {
    const dayNumber = schedule.findIndex(d => d.kind === 'ride' && d.legIndex === i) + 1;
    const info = routeInfo?.legs?.[i];
    return {
      path: leg.path,
      leg,
      label: `${tr('Day {n}', { n: dayNumber || i + 1 })}: ${info?.from.split(',')[0] || ''} → ${info?.to.split(',')[0] || ''} · ${fmt.dist(leg.distanceMeters / 1000)} · ${formatDuration(leg.durationSeconds)}`,
    };
  }), [trip, schedule, routeInfo?.legs, appSettings]);

  const handleRestDaysChange = (stopIndex: number, restDays: number) => {
    const apply = (list: Waypoint[]) => list.map((wp, i) => i === stopIndex ? { ...wp, restDays: Math.max(0, restDays) } : wp);
    setWaypoints(apply);
    setRouteInfo(prev => prev && { ...prev, waypoints: apply(prev.waypoints) });
    setHasChanges(true);
  };

  const handleStartDateChange = (date: string) => {
    setStartDate(date);
    setHasChanges(true);
  };

  const handleRouteOptionsChange = (options: RouteOptions) => {
    setRouteOptions(options);
    setHasChanges(true);
    if (!routeInfo) return;
    // An AI-planned trip without bookings is re-planned, so the overnight stops follow the new route
    // (e.g. overland instead of by ferry). Otherwise keep the stops and just re-route between them.
    const hasBookings = [routeInfo.originInterests || [], ...routeInfo.waypoints.map(w => w.interests || []), routeInfo.destinationInterests || []]
      .flat().some(c => c.items.some(i => i.source === 'reservation'));
    const intent = lastIntentRef.current;
    if (intent && !hasBookings && intent.origin === origin && intent.destination === destination) {
      handlePlanTrip({ ...intent, avoidFerries: options.avoidFerries, offroad: options.offroad }, options);
    } else {
      calculateRoute(undefined, undefined, undefined, undefined, undefined, options);
    }
  };

  // GPX: the whole trip (one track per day) or a single day, with stops and bookings as waypoints.
  const handleExportGpx = (legIndex: number | null) => {
    const trip = tripRef.current;
    if (!trip || !routeInfo) return;
    const name = expeditionName || autoName(origin, destination);
    const dayLabel = (i: number) => {
      const day = schedule.find(d => d.kind === 'ride' && d.legIndex === i);
      const n = schedule.indexOf(day!) + 1;
      return `${tr('Day {n}', { n })}: ${routeInfo.legs?.[i]?.from} → ${routeInfo.legs?.[i]?.to}`;
    };
    const legs = legIndex === null ? trip.legs.map((leg, i) => ({ leg, i })) : [{ leg: trip.legs[legIndex], i: legIndex }];
    const stopPoints = [
      { name: `${tr('Start')}: ${origin}`, at: trip.legs[0]?.path[0] },
      ...trip.legs.map((leg, i) => ({ name: i === trip.legs.length - 1 ? `${tr('Finish')}: ${destination}` : `${tr('Night {n}', { n: i + 1 })}: ${routeInfo.legs?.[i]?.to}`, at: leg.path[leg.path.length - 1] })),
    ].filter(p => p.at).map(p => ({ name: p.name, lat: p.at!.lat, lng: p.at!.lng }));
    const bookings = [routeInfo.originInterests || [], ...routeInfo.waypoints.map(wp => wp.interests || []), routeInfo.destinationInterests || []]
      .flat().flatMap(cat => cat.items)
      .filter(item => item.source === 'reservation' && item.reservation?.lat != null)
      .map(item => ({
        name: `${tr('Booked:')} ${item.name}`,
        lat: item.reservation!.lat!,
        lng: item.reservation!.lng!,
        description: [item.reservation?.checkIn, item.reservation?.confirmation && `Ref ${item.reservation.confirmation}`].filter(Boolean).join(' · '),
      }));
    const gpx = buildGpx(
      legIndex === null ? name : `${name} – ${dayLabel(legIndex)}`,
      // ~2,500 points per day keeps files small for GPS devices while following every turn closely.
      legs.map(({ leg, i }) => ({ name: dayLabel(i), points: downsample(leg.path, 2500) })),
      [...stopPoints, ...bookings],
    );
    downloadFile(gpxFileName(legIndex === null ? name : `${name} day ${legIndex + 1}`), gpx);
  };

  // Upload reservation files attached in this session to Firebase Storage; returns how many failed.
  const uploadAttachments = async (info: RouteInfo, uid: string): Promise<{ info: RouteInfo; failed: number }> => {
    let failed = 0;
    const upload = async (cats: InterestCategory[] = []) => Promise.all(cats.map(async cat => ({
      ...cat,
      items: await Promise.all(cat.items.map(async item => {
        const r = item.reservation;
        const file = attachmentFile(r?.fileId);
        if (!r || r.fileUrl || !file) return item;
        try {
          const safeName = file.name.replace(/[^A-Za-z0-9._-]+/g, '_');
          const stored = storageRef(storage, `users/${uid}/attachments/${r.fileId}-${safeName}`);
          await uploadBytes(stored, file, { contentType: r.fileType });
          return { ...item, reservation: { ...r, fileUrl: await getDownloadURL(stored) } };
        } catch (err) {
          console.error('File upload failed:', err);
          failed++;
          return item;
        }
      })),
    })));
    return {
      info: {
        ...info,
        originInterests: await upload(info.originInterests),
        destinationInterests: await upload(info.destinationInterests),
        waypoints: await Promise.all(info.waypoints.map(async wp => ({ ...wp, interests: await upload(wp.interests) }))),
      },
      failed,
    };
  };

  // Save: update the trip if it's yours, otherwise (new or someone's shared trip) save a new copy.
  const handleSave = async () => {
    if (!routeInfo || !user) return;
    // A new trip (not an update of one of yours) counts against the plan's saved trips.
    const isNew = !currentTripId || viewingShared;
    const maxTrips = getAccount().limits.savedTrips;
    if (isNew && maxTrips !== null && savedRoutes.length >= maxTrips) {
      setToast({ message: tr("You've saved as many trips as your plan allows."), type: 'error' });
      openPlans('savedTrips');
      return;
    }
    const path = 'trips';
    try {
      const { info, failed } = await uploadAttachments(routeInfo, user.uid);
      const { id: _id, ...rest } = info;
      const owned = currentTripId && !viewingShared;
      // Firestore rejects undefined values; a JSON round trip drops them.
      const data = JSON.parse(JSON.stringify({
        ...rest,
        name: expeditionName || autoName(origin, destination),
        userId: user.uid,
        startDate: startDate || undefined,
        avoid: routeOptions,
        lodging,
        budget: budgetSettings || undefined,
        vehicle,
        shared: owned ? routeInfo.shared : false,
        createdAt: owned && routeInfo.createdAt ? routeInfo.createdAt : Date.now(),
      }));
      let id = owned ? currentTripId : null;
      if (id) await setDoc(doc(db, path, id), data);
      else id = (await addDoc(collection(db, path), data)).id;
      setCurrentTripId(id);
      setViewingShared(false);
      setRouteInfo(prev => prev && { ...info, id: id!, shared: data.shared, createdAt: data.createdAt, userId: user.uid });
      setHasChanges(false);
      setToast(failed
        ? { message: tr("Saved, but {n} file(s) couldn't be uploaded (is Firebase Storage enabled?). Booking details were saved.", { n: failed }), type: 'error' }
        : { message: tr('Expedition saved successfully!'), type: 'success' });
    } catch (err) {
      setToast({ message: tr('Failed to save expedition.'), type: 'error' });
      try { handleFirestoreError(err, OperationType.CREATE, path); } catch { /* logged */ }
    }
  };

  // Share: make the saved trip viewable by link (read-only) and copy the link.
  const handleShare = async () => {
    if (!currentTripId || !user || viewingShared) return;
    try {
      await updateDoc(doc(db, 'trips', currentTripId), { shared: true });
      setRouteInfo(prev => prev && { ...prev, shared: true });
      const link = `${window.location.origin}${window.location.pathname}?trip=${currentTripId}`;
      await navigator.clipboard?.writeText(link).catch(() => undefined);
      setShareLink(link);
      setToast({ message: tr('Share link copied. Anyone with the link can view this trip.'), type: 'success' });
    } catch (err) {
      console.error('Sharing failed:', err);
      setToast({ message: tr('Could not share the trip. Check the Firestore rules (see README).'), type: 'error' });
    }
  };

  const handleStopSharing = async () => {
    if (!currentTripId) return;
    try {
      await updateDoc(doc(db, 'trips', currentTripId), { shared: false });
      setRouteInfo(prev => prev && { ...prev, shared: false });
      setShareLink(null);
      setToast({ message: tr('The link no longer opens this trip.'), type: 'success' });
    } catch (err) {
      console.error('Unsharing failed:', err);
    }
  };

  const handleLoadRoute = (route: RouteInfo, options: { shared?: boolean } = {}) => {
    setOrigin(route.origin);
    setDestination(route.destination);
    setWaypoints(route.waypoints);
    setTravelMode(route.travelMode as any);
    setExpeditionName(route.name || autoName(route.origin, route.destination));
    setStartDate(route.startDate || '');
    setRouteOptions(route.avoid || NO_AVOIDANCES);
    setLodging(route.lodging || 'any');
    setBudgetSettings(route.budget || null);
    setVehicle(route.vehicle);
    setCurrentTripId(route.id || null);
    setViewingShared(Boolean(options.shared));
    setShareLink(route.shared && route.id ? `${window.location.origin}${window.location.pathname}?trip=${route.id}` : null);
    setShowSaved(false);
    setShowWelcome(false);
    setHasChanges(false);
    setError(null);
    // Keep the saved recommendations; distance '...' makes the route recalculate on the map.
    setRouteInfo({ ...route, distance: '...', duration: '...' });
  };

  // Open a shared trip from a ?trip=<id> link.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('trip');
    if (!id) return;
    setShowWelcome(false);
    getDoc(doc(db, 'trips', id))
      .then(snap => {
        if (!snap.exists()) throw new Error('not found');
        const data = { id: snap.id, ...snap.data() } as RouteInfo;
        handleLoadRoute(data, { shared: data.userId !== auth.currentUser?.uid });
      })
      .catch(err => {
        console.error('Could not open shared trip:', err);
        setToast({ message: tr('This trip link is not shared (or no longer exists).'), type: 'error' });
      });
  }, []);

  const handleDeleteRoute = async (id: string) => {
    const path = `trips/${id}`;
    try {
      await deleteDoc(doc(db, 'trips', id));
      if (id === currentTripId) { setCurrentTripId(null); setShareLink(null); }
      setToast({ message: tr('Expedition deleted.'), type: 'success' });
    } catch (err) {
      setToast({ message: tr('Failed to delete expedition.'), type: 'error' });
      try { handleFirestoreError(err, OperationType.DELETE, path); } catch { /* logged */ }
    }
  };

  return (
    <ErrorBoundary>
      {/* Phones: full-screen map with the planner as a bottom sheet. Desktop: sidebar + map. */}
      <div className="relative h-[100dvh] w-full overflow-hidden bg-background text-foreground md:flex md:flex-row">
        <Sidebar
          origin={origin}
          setOrigin={(val) => { setOrigin(val); setHasChanges(true); setRouteStale(true); }}
          destination={destination}
          setDestination={(val) => { setDestination(val); setHasChanges(true); setRouteStale(true); }}
          waypoints={waypoints}
          setWaypoints={(val) => { setWaypoints(val); setHasChanges(true); setRouteStale(true); }}
          travelMode={travelMode as any}
          setTravelMode={(val) => { setTravelMode(val); setHasChanges(true); setRouteStale(true); }}
          needsCalculate={routeStale}
          view={view}
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
          schedule={schedule}
          startDate={startDate}
          onStartDateChange={handleStartDateChange}
          onVehicleChange={(v) => { setVehicle((v || undefined) as Vehicle | undefined); setHasChanges(true); }}
          onRestDaysChange={handleRestDaysChange}
          onExportGpx={handleExportGpx}
          warnings={warnings}
          costs={costs}
          routeOptions={routeOptions}
          onRouteOptionsChange={handleRouteOptionsChange}
          isSaved={Boolean(currentTripId)}
          viewingShared={viewingShared}
          shareLink={shareLink}
          onShare={handleShare}
          onStopSharing={handleStopSharing}
          onFindPlaces={handleFindPlaces}
        />
        <main className="absolute inset-0 md:relative md:inset-auto md:min-h-0 md:flex-1">
          <ViewTabs view={view} onChange={setView} documentCount={documentCount} />
          {view !== 'route' && (
            // Budget and Documents cover the map (which stays loaded underneath).
            <div className="absolute inset-0 z-[17] overflow-y-auto bg-slate-50 px-4 pb-[24dvh] pt-16 md:px-8 md:pb-8 md:pt-20">
              {view === 'budget' ? (
                <BudgetView
                  routeInfo={routeInfo}
                  schedule={schedule}
                  settings={budgetSettings || defaultBudget(travelMode as string, lodging, appSettings.currency)}
                  onChange={(settings) => { setBudgetSettings(settings); setHasChanges(true); }}
                  legPaths={legPaths}
                  offroad={routeOptions.offroad}
                  vehicle={vehicle}
                  onVehicleChange={(v) => { setVehicle(v); setHasChanges(true); }}
                />
              ) : (
                <DocumentsView routeInfo={routeInfo} onAttachFile={handleAttachFile} onRemoveItem={handleRemoveItem} attachingKey={attachingKey} />
              )}
            </div>
          )}
          <Suspense fallback={<div className="h-full w-full bg-slate-100" />}>
          <MapView
            onLoad={handleMapLoad} 
            segments={segments}
            travelMode={travelMode as string}
            waypoints={waypoints} 
            origin={origin} 
            destination={destination} 
            routeInfo={routeInfo}
            onMoveStop={handleMoveStop}
            onAddStop={routeInfo ? handleAddStop : undefined}
            onRemoveStop={handleRemoveStop}
            onFindPlaces={handleFindPlaces}
            onRemoveItem={handleRemoveItem}
            onAttachFile={handleAttachFile}
            attachingKey={attachingKey}
          />
          </Suspense>
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

        {plansReason !== undefined && (
          <PlansDialog
            reason={plansReason}
            savedTrips={savedRoutes.length}
            onClose={() => setPlansReason(undefined)}
            onLogin={handleLogin}
          />
        )}

        {showLogin && (
          <LoginDialog
            onClose={() => setShowLogin(false)}
            onSignedIn={() => {
              setShowLogin(false);
              setToast({ message: tr("You're logged in. Your expeditions can now be saved."), type: 'success' });
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
