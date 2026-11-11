import React, { useState, useCallback, useRef, useEffect, useMemo, lazy, Suspense } from 'react';
// The map (MapLibre, OpenStreetMap) is loaded after the first paint.
const MapView = lazy(() => import('./components/Map'));
// Screens opened on demand are loaded when first shown (a smaller first download).
const SavedRoutes = lazy(() => import('./components/SavedRoutes'));
const LoginDialog = lazy(() => import('./components/LoginDialog'));
const BudgetView = lazy(() => import('./components/BudgetView'));
const DocumentsView = lazy(() => import('./components/DocumentsView'));
const RideMode = lazy(() => import('./components/RideMode'));
const InspirationView = lazy(() => import('./components/InspirationView'));
const PlansDialog = lazy(() => import('./components/PlansDialog'));
import Sidebar from './components/Sidebar';
import { RouteInfo, Waypoint, InterestCategory, InterestItem, RouteLeg, StopRef, TripIntent } from './types';
import { planOvernightStops } from './lib/tripBuilder';
import { computeTrip, ferryKm, RoutedTrip, RouteOptions, NO_AVOIDANCES, RoutePlace } from './lib/routing';
import { elevationsAlong, climbStats } from './lib/elevation';
import { buildSchedule, staysByStop, bookingWarnings, bookingCosts } from './lib/schedule';
import { buildGpx, gpxFileName, downloadFile } from './lib/gpx';
import { downsample } from './lib/geo';
import { placeTarget, type RideTarget } from './lib/ride';
import type { TripStyle, Via, Story, StoryPhoto } from './types';
import { pendingPhoto } from './lib/photos';
import { progressOn } from './lib/ride';
import { setTravelContext, placeSuggestions, LodgingPreference, CATEGORIES, CategoryId, categoryLabel } from './lib/places';
import type { PlanSummary } from './components/AIAgent';
import { geocodeAddress, townAt } from './lib/geocode';
import { bestInsertIndex, haversineKm, LatLng } from './lib/geo';
import { mergeSuggestions, keepReservations, isOwn } from './lib/suggestions';
import { storeAttachment, readAsBase64, fileMimeType, attachmentFile } from './lib/attachments';
import { formatDistance, formatDuration } from './lib/utils';
import { Sparkles, MapPin, Compass } from 'lucide-react';
import { db, auth, storage, handleFirestoreError, OperationType } from './firebase';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged, getRedirectResult, signOut } from 'firebase/auth';
import ViewTabs, { AppView } from './components/ViewTabs';
import { BudgetSettings, defaultBudget } from './lib/budget';
import type { Vehicle } from './lib/fuel';
import { authErrorMessage } from './lib/authErrors';
import { useSettings, t as tr, getSettings, formatters } from './lib/settings';
import { authFetch, checkLimit, LimitError, refreshAccount, takePlaceSearches, onOpenPlans, openPlans, getAccount, PlansReason } from './lib/account';
import ConsentBanner from './components/ConsentBanner';
import { onConsentChange } from './lib/affiliate';

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

const WelcomeDialog: React.FC<{ onStart: (prompt: string) => void; onInspire: () => void }> = ({ onStart, onInspire }) => {
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
            <button onClick={onInspire}
              className="flex items-center justify-center gap-2 text-sm font-semibold text-emerald-700 hover:underline">
              <Compass size={16} />{t('Or get inspired by famous journeys')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// A trip's default name, the same in every language: "Tavira → Beja".
const autoName = (from: string, to: string) => `${from.split(',')[0].trim()} → ${to.split(',')[0].trim()}`;
// Names made by the app follow route changes; typed names stay.
const isAutoName = (name: string) => / → /.test(name);

// Trips with more stops than this load suggestions for intermediate stops on request.
const MAX_EAGER_STOPS = 10;

const App: React.FC = () => {
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [travelMode, setTravelMode] = useState<string>('DRIVING');
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
  // A planner request from the Inspiration map ("plan this stretch").
  const [plannerRequest, setPlannerRequest] = useState<{ text: string; n: number } | null>(null);
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
  // Ride mode: the day being ridden, the live position and whether the map follows it.
  const [rideDay, setRideDay] = useState(0);
  const [ridePos, setRidePos] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [rideFollow, setRideFollow] = useState(true);
  const [rideHeading, setRideHeading] = useState<number | undefined>(undefined);
  const [rideDetour, setRideDetour] = useState<{ lat: number; lng: number }[] | undefined>(undefined);
  // Ride mode: a place picked with "Go to" in its map popup.
  const [gotoRequest, setGotoRequest] = useState<{ target: RideTarget; n: number } | null>(null);
  // The traveller's budget averages; null until edited (defaults follow the travel mode and lodging).
  const [budgetSettings, setBudgetSettings] = useState<BudgetSettings | null>(null);
  // The plans screen: undefined = closed; otherwise why it opened (a limit, or null from the menu).
  const [plansReason, setPlansReason] = useState<PlansReason | undefined>(undefined);
  useEffect(() => onOpenPlans(reason => setPlansReason(reason)), []);
  // Booking links change with the privacy choice (partner ids only after it's accepted).
  const [, setConsentVersion] = useState(0);
  useEffect(() => onConsentChange(() => setConsentVersion(v => v + 1)), []);
  // The typed route (start, stops, end, mode) changed since the last calculation.
  const [routeStale, setRouteStale] = useState(false);
  // Moto/car trips: the vehicle, for fuel and toll estimates (from the request, a quick reply or the budget).
  const [vehicle, setVehicle] = useState<Vehicle | undefined>(undefined);
  // The traveller's style from the planner (kind of riding, who's going, interests, budget, named vehicle).
  const [tripStyle, setTripStyle] = useState<TripStyle>({});
  // Points the route is dragged through (not stops); the ref lets a route calculation use them right away.
  const [vias, setVias] = useState<Via[]>([]);
  const viasRef = useRef<Via[]>([]);
  const updateVias = (next: Via[]) => { viasRef.current = next; setVias(next); };
  // Category names that depend on the trip ("Bike shops", "Mechanics"…).
  setTravelContext(travelMode, vehicle, tripStyle.interests);
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

  const mapRef = useRef<unknown>(null);
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

  const handleMapLoad = useCallback((map: unknown) => {
    mapRef.current = map;
    mapReadyRef.current = true;
    mapWaiters.current.splice(0).forEach(done => done());
    setMapReady(true);
  }, []);

  // The AI has understood the request; the map services do the rest: overnight stops along the real
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
    updateVias([]);
    // Named places to pass through (e.g. "via Monsaraz") shape the route while the stops stay as planned.
    passThroughRef.current = { stopsKey: mappedWaypoints.map(w => w.location).join('|'), via: passThrough };

    setOrigin(intent.origin);
    setDestination(intent.destination);
    setWaypoints(mappedWaypoints);
    setTravelMode(intent.travelMode);
    setLodging(intent.lodging);
    setTravelMode(intent.travelMode);
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
    // Dragged-through points of day k go before the stop that ends it (they're kept in order along the day).
    const dragged = viasRef.current;
    const routeStops = (exact: boolean) => {
      const out: { location: RoutePlace; via: boolean }[] = [];
      stops.forEach((wp, k) => {
        usePass.filter(p => p.beforeStop === k).forEach(p => out.push({ location: p.name, via: true }));
        dragged.filter(v => v.leg === k).forEach(v => out.push({ location: v.at, via: true }));
        out.push({ location: (exact && wp.position) || wp.location, via: !wp.stopover });
      });
      usePass.filter(p => p.beforeStop >= stops.length).forEach(p => out.push({ location: p.name, via: true }));
      dragged.filter(v => v.leg >= stops.length).forEach(v => out.push({ location: v.at, via: true }));
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
        // Stories stay with the start and finish while the route changes (only when they're the same places).
        originStory: routeInfo?.origin === currentOrigin ? routeInfo?.originStory : undefined,
        destinationStory: routeInfo?.destination === currentDestination ? routeInfo?.destinationStory : undefined,
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

  const allStops = (): { ref: StopRef; location: string; position?: LatLng }[] => [
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

  // A stop's story (the traveller's text and photos); undefined removes it.
  const handleStoryChange = (ref: StopRef, story: Story | undefined) => {
    if (ref.kind === 'stop') {
      const apply = (list: Waypoint[]) => list.map((wp, i) => (i === ref.index ? { ...wp, story } : wp));
      setWaypoints(apply);
      setRouteInfo(prev => prev && { ...prev, waypoints: apply(prev.waypoints) });
    } else {
      const key = ref.kind === 'start' ? 'originStory' : 'destinationStory';
      setRouteInfo(prev => prev && { ...prev, [key]: story });
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
  // A file (PDF, email, image) or a link (Booking/Airbnb share, Google Maps place, a post) becomes a booking or saved
  // place on the matching stop; a link far from every stop becomes a new stop on the route.
  const handleAttachFile = (ref: StopRef | null, input: File | string) =>
    typeof input === 'string' ? handleAttachLink(ref, input) : handleAttachDocument(ref, input);

  /** The stop a booking belongs to: the one it was attached to, unless its address is clearly nearer another. */
  const placeOnStop = async (ref: StopRef | null, stopIndex: number, position: LatLng | null) => {
    const stops = allStops();
    let target = ref || stops[stopIndex]?.ref || stops[0].ref;
    let nearestKm = Infinity;
    if (position) {
      const located = await Promise.all(stops.map(async s => ({ ...s, at: s.position || await geocodeAddress(s.location) })));
      const ranked = located
        .filter(s => s.at)
        .map(s => ({ ...s, km: haversineKm(position, s.at!) }))
        .sort((a, b) => a.km - b.km);
      const nearest = ranked[0];
      nearestKm = nearest?.km ?? Infinity;
      const chosen = ranked.find(s => s.ref.kind === target.kind && s.ref.index === target.index);
      if (nearest && (!ref || !chosen || (chosen.km > 50 && nearest.km < chosen.km))) target = nearest.ref;
    }
    return { target, nearestKm };
  };

  const addToStop = (target: StopRef, category: string, item: InterestItem) => updateStopInterests(target, cats => {
    const idx = cats.findIndex(c => c.category.toLowerCase() === String(category).toLowerCase());
    if (idx === -1) return [...cats, { category, items: [item] }];
    return cats.map((c, i) => i === idx ? { ...c, items: [item, ...c.items] } : c);
  });

  const reservationOf = (r: any, base: Pick<NonNullable<InterestItem['reservation']>, 'fileName' | 'fileType' | 'fileId' | 'url'>, position: LatLng | null): InterestItem => ({
    name: r.name || base.fileName,
    description: r.notes || undefined,
    source: 'reservation',
    reservation: {
      ...base,
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
  });

  const attachFailed = (err: unknown, fallback: string) => {
    if (err instanceof LimitError) {
      setToast({ message: tr("You've used today's document reads on your plan."), type: 'error' });
      openPlans('documents');
      return;
    }
    console.error('Reservation import failed:', err);
    setToast({ message: err instanceof Error ? err.message : fallback, type: 'error' });
  };

  // A place the traveller marks on the map (a camp spot, a water point…): filed on the nearest stop, kept for good.
  const handleMarkPlace = async (at: LatLng, category: CategoryId, name: string) => {
    const { target } = await placeOnStop(null, 0, at);
    const item: InterestItem = { name, lat: at.lat, lng: at.lng, source: 'mine', category, description: tr('Marked by you') };
    addToStop(target, CATEGORIES[category].name, item);
    setHasChanges(true);
    setToast({ message: tr('Marked "{name}" at {stop} · {category}', { name, stop: stopLabel(target), category: tr(categoryLabel(category)) }), type: 'success' });
  };

  const handleAttachDocument = async (ref: StopRef | null, file: File) => {
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
      const { target } = await placeOnStop(ref, r.stopIndex, position);
      const item = reservationOf(r, { fileName: file.name, fileType: fileMimeType(file), fileId: storeAttachment(file) }, position);
      addToStop(target, r.category, item);
      const moved = ref && (ref.kind !== target.kind || ref.index !== target.index);
      setToast({
        message: `${tr('Added "{name}" to {stop}', { name: item.name, stop: stopLabel(target) })} · ${tr(r.category)}${moved ? ` ${tr('(matched by its address)')}` : ''}`,
        type: 'success',
      });
    } catch (err) {
      attachFailed(err, tr('Could not read that file.'));
    } finally {
      setAttachingKey(null);
    }
  };

  const handleAttachLink = async (ref: StopRef | null, url: string) => {
    const stops = allStops();
    setAttachingKey(ref ? (ref.kind === 'stop' ? `stop-${ref.index}` : ref.kind) : 'any');
    try {
      const response = await authFetch('/api/extract-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, stops: stops.map(s => `${stopLabel(s.ref)}: ${s.location}`) }),
      });
      await checkLimit(response);
      refreshAccount();
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || tr('Could not read that link ({status})', { status: response.status }));
      const r = data.reservation;
      const link = data.link || {};
      if (!r.address && link.address) r.address = link.address;
      const position: LatLng | null = link.position || await geocodeAddress(r.address || `${r.name} ${stops[r.stopIndex]?.location || ''}`);
      const item = reservationOf(r, { fileName: link.site || new URL(url).hostname, fileType: 'text/uri-list', url: link.finalUrl || url }, position);
      const { target, nearestKm } = await placeOnStop(ref, r.stopIndex, position);
      // Far from every stop (and not attached to a chosen stop): build the trip from it, as a new stop.
      if (position && !ref && nearestKm > 40 && routeInfo) {
        await handleAddStop(position, [{ category: r.category, items: [item] }]);
        return;
      }
      addToStop(target, r.category, item);
      setToast({ message: `${tr('Added "{name}" to {stop}', { name: item.name, stop: stopLabel(target) })} · ${tr(r.category)}`, type: 'success' });
    } catch (err) {
      attachFailed(err, tr('Could not read that link.'));
    } finally {
      setAttachingKey(null);
    }
  };

  const handleMoveStop = async (ref: StopRef, position: LatLng) => {
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
  const handleAddStop = async (position: LatLng, interests: InterestCategory[] = []) => {
    const name = await townAt(position);
    if (!name) return;
    const points = await Promise.all(allStops().map(async s => s.position || await geocodeAddress(s.location)));
    if (points.some(p => !p)) return;
    const insertAt = bestInsertIndex(points as LatLng[], position);
    const newWaypoints = [...waypoints];
    newWaypoints.splice(insertAt, 0, { location: name, position, stopover: true, interests });
    // The new stop splits day `insertAt`: its dragged-through points go to the part they're on.
    const along = (p: LatLng) => (legPaths[insertAt]?.length > 1 ? progressOn(legPaths[insertAt], p).alongKm : 0);
    updateVias(viasRef.current.map(v => ({ ...v, leg: v.leg > insertAt || (v.leg === insertAt && along(v.at) > along(position)) ? v.leg + 1 : v.leg })));
    setWaypoints(newWaypoints);
    setHasChanges(true);
    setToast({ message: tr('Added a stop at {name}. Finding places nearby…', { name }), type: 'success' });
    const legs = await calculateRoute(undefined, undefined, newWaypoints);
    if (legs) loadSuggestions([{ kind: 'stop', index: insertAt }], [position], travelMode, lodging);
  };

  // Dragging a day line: the route passes through where it was dropped (in order along that day).
  const sortVias = (list: Via[]) => {
    const along = (v: Via) => (legPaths[v.leg]?.length > 1 ? progressOn(legPaths[v.leg], v.at).alongKm : 0);
    return [...list].sort((a, b) => a.leg - b.leg || along(a) - along(b));
  };
  const reshape = async (next: Via[]) => {
    updateVias(next);
    setHasChanges(true);
    await calculateRoute();
  };
  const handleShapeRoute = (leg: number, at: LatLng) => reshape(sortVias([...viasRef.current, { leg, at }]));
  const handleMoveVia = (index: number, at: LatLng) => reshape(sortVias(viasRef.current.map((v, i) => (i === index ? { ...v, at } : v))));
  const handleRemoveVia = (index: number) => reshape(viasRef.current.filter((_, i) => i !== index));

  const handleRemoveStop = async (index: number) => {
    const newWaypoints = waypoints.filter((_, i) => i !== index);
    // Days `index` and `index + 1` become one.
    updateVias(viasRef.current.map(v => (v.leg > index ? { ...v, leg: v.leg - 1 } : v)));
    setWaypoints(newWaypoints);
    setHasChanges(true);
    await calculateRoute(undefined, undefined, newWaypoints);
  };

  // Fetch place suggestions for several stops (in the background).
  const loadSuggestions = async (refs: StopRef[], locations: (string | LatLng)[], mode: string, lodgingPref: LodgingPreference) => {
    if (!refs.length) return;
    // Each stop's suggestions count as one place search (the costly part of a trip).
    if (!(await takePlaceSearches(refs.length))) {
      setToast({ message: tr("You've used today's place searches on your plan."), type: 'error' });
      openPlans('placeSearches');
      return;
    }
    let failed = false;
    refs.forEach((ref, i) => {
      placeSuggestions(locations[i], mode, lodgingPref, 3, vehicle || '')
        .then(fresh => { if (fresh.length) updateStopInterests(ref, cats => mergeSuggestions(cats, fresh)); })
        .catch(err => {
          console.error('Place suggestions failed:', err);
          if (!failed) {
            failed = true;
            setToast({
              message: tr('Could not load place suggestions from OpenStreetMap (the place servers may be busy). Try "Find places nearby" again in a minute.'),
              type: 'error',
            });
          }
        });
    });
  };

  // New interests: the points of interest near each stop are looked up again (the traveller's own places stay).
  const handleStyleChange = (style: TripStyle) => {
    const before = (tripStyle.interests || []).join(',');
    setTripStyle(style);
    setHasChanges(true);
    if ((style.interests || []).join(',') === before) return;
    setTravelContext(travelMode, vehicle, style.interests);
    const loaded = allStops().filter(({ ref }) => {
      const cats = ref.kind === 'start' ? routeInfo?.originInterests : ref.kind === 'end' ? routeInfo?.destinationInterests : waypoints[ref.index!]?.interests;
      return cats?.some(c => c.items.some(i => !isOwn(i)));
    });
    if (loaded.length) loadSuggestions(loaded.map(s => s.ref), loaded.map(s => s.position || s.location), travelMode, lodging);
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
      return !cats?.some(c => c.items.some(i => !isOwn(i)));
    });
    const some = empty.length <= MAX_EAGER_STOPS + 2 ? empty : empty.filter(s => s.ref.kind !== 'stop');
    loadSuggestions(some.map(s => s.ref), some.map(s => s.position || s.location), travelMode, lodging);
  };

  // ---- Schedule: dates, rest days, booking checks, costs, GPX ----

  const schedule = useMemo(
    () => buildSchedule(routeInfo?.legs?.length || 0, (routeInfo?.waypoints || []).map(wp => wp.restDays || 0), startDate || undefined),
    [routeInfo, startDate],
  );

  // Nights at each stop (when the trip has a start date): booking checks and the booking links' dates.
  const stays = useMemo(() => staysByStop(schedule, routeInfo?.waypoints.length || 0), [schedule, routeInfo?.waypoints.length]);

  const warnings = useMemo(() => {
    if (!routeInfo) return [];
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

  // Opening Ride starts on today's day of the trip (when it has dates), else where it was.
  const openView = (next: AppView) => {
    if (next === 'ride' && view !== 'ride') {
      const today = new Date().toISOString().slice(0, 10);
      const day = schedule.find(d => d.kind === 'ride' && d.date && d.date >= today);
      if (day?.legIndex != null) setRideDay(day.legIndex);
    }
    setView(next);
  };

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
    // Story photos waiting in this browser: uploaded now (same folder as booking files), then kept by their link.
    const uploadStory = async (story?: Story): Promise<Story | undefined> => story && {
      ...story,
      photos: (await Promise.all(story.photos.map(async (photo): Promise<StoryPhoto | null> => {
        if (photo.url) return photo;
        const blob = pendingPhoto(photo.pendingId);
        if (!blob) return null; // from an earlier visit, never saved: gone
        try {
          const stored = storageRef(storage, `users/${uid}/attachments/${photo.pendingId}.jpg`);
          await uploadBytes(stored, blob, { contentType: 'image/jpeg' });
          return { url: await getDownloadURL(stored), ...(photo.caption ? { caption: photo.caption } : {}) };
        } catch (err) {
          console.error('Photo upload failed:', err);
          failed++;
          return photo;
        }
      }))).filter((p): p is StoryPhoto => p !== null),
    };
    return {
      info: {
        ...info,
        originInterests: await upload(info.originInterests),
        destinationInterests: await upload(info.destinationInterests),
        originStory: await uploadStory(info.originStory),
        destinationStory: await uploadStory(info.destinationStory),
        waypoints: await Promise.all(info.waypoints.map(async wp => ({ ...wp, interests: await upload(wp.interests), story: await uploadStory(wp.story) }))),
      },
      failed,
    };
  };

  // Save: update the trip if it's yours, otherwise (new or someone's shared trip) save a new copy.
  const handleSave = async () => {
    if (!routeInfo || !user) return;
    // A new trip (not an update of one of yours) counts against the plan's saved trips.
    const isNew = !currentTripId || viewingShared;
    const maxTrips = getAccount().enforced ? getAccount().limits.savedTrips : null;
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
        style: tripStyle,
        vias,
        shared: owned ? routeInfo.shared : false,
        createdAt: owned && routeInfo.createdAt ? routeInfo.createdAt : Date.now(),
      }));
      let id = owned ? currentTripId : null;
      if (id) await setDoc(doc(db, path, id), data);
      else id = (await addDoc(collection(db, path), data)).id;
      setCurrentTripId(id);
      setViewingShared(false);
      setRouteInfo(prev => prev && { ...info, id: id!, shared: data.shared, createdAt: data.createdAt, userId: user.uid });
      // Uploaded photos are now links: the stops keep those (so a later save doesn't upload them again).
      setWaypoints(prev => prev.map((wp, i) => (info.waypoints[i] ? { ...wp, story: info.waypoints[i].story } : wp)));
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
    setTripStyle(route.style || {});
    updateVias(route.vias || []);
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
          plannerRequest={plannerRequest}
          onRemoveItem={handleRemoveItem}
          onAttachFile={handleAttachFile}
          stays={stays}
          attachingKey={attachingKey}
          schedule={schedule}
          startDate={startDate}
          onStartDateChange={handleStartDateChange}
          onVehicleChange={(v) => { setVehicle((v || undefined) as Vehicle | undefined); setHasChanges(true); }}
          onStyleChange={handleStyleChange}
          onStoryChange={handleStoryChange}
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
          <ViewTabs view={view} onChange={openView} documentCount={documentCount} />
          {view === 'ride' && (
            <Suspense fallback={null}><RideMode
              routeInfo={routeInfo}
              paths={legPaths}
              schedule={schedule}
              travelMode={travelMode as string}
              offroad={routeOptions.offroad}
              dayIndex={Math.min(rideDay, Math.max(0, legPaths.length - 1))}
              onDayChange={setRideDay}
              position={ridePos}
              onPosition={(p, h) => { setRidePos(p); setRideHeading(h); }}
              follow={rideFollow}
              onFollowChange={setRideFollow}
              onDetour={setRideDetour}
              onExportGpx={handleExportGpx}
              onClose={() => setView('route')}
              gotoRequest={gotoRequest}
            /></Suspense>
          )}
          {view === 'inspire' && (
            <Suspense fallback={null}><InspirationView onPlan={(text) => {
              setView('route');
              setPlannerRequest(r => ({ text, n: (r?.n || 0) + 1 }));
            }} /></Suspense>
          )}
          {(view === 'budget' || view === 'documents') && (
            // Budget and Documents cover the map (which stays loaded underneath).
            <div className="absolute inset-0 z-[17] overflow-y-auto bg-slate-50 px-4 pb-[24dvh] pt-16 md:px-8 md:pb-8 md:pt-20">
              {view === 'budget' ? (
                <Suspense fallback={null}><BudgetView
                  routeInfo={routeInfo}
                  schedule={schedule}
                  settings={budgetSettings || defaultBudget(travelMode as string, lodging, appSettings.currency, tripStyle.budgetStyle)}
                  onChange={(settings) => { setBudgetSettings(settings); setHasChanges(true); }}
                  legPaths={legPaths}
                  offroad={routeOptions.offroad}
                  vehicle={vehicle}
                  onVehicleChange={(v) => { setVehicle(v); setHasChanges(true); }}
                  litresPer100km={tripStyle.vehicleInfo?.litresPer100km}
                /></Suspense>
              ) : (
                <Suspense fallback={null}><DocumentsView routeInfo={routeInfo} onAttachFile={handleAttachFile} onRemoveItem={handleRemoveItem} attachingKey={attachingKey} /></Suspense>
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
            vias={vias}
            onStoryChange={view !== 'ride' ? handleStoryChange : undefined}
            onShapeRoute={routeInfo && view !== 'ride' ? handleShapeRoute : undefined}
            onMoveVia={handleMoveVia}
            onRemoveVia={handleRemoveVia}
            onMarkPlace={routeInfo ? handleMarkPlace : undefined}
            onRemoveStop={handleRemoveStop}
            onFindPlaces={handleFindPlaces}
            onRemoveItem={handleRemoveItem}
            onAttachFile={handleAttachFile}
            attachingKey={attachingKey}
            stays={stays}
            onGoto={view === 'ride' ? (item, id, at) => setGotoRequest(r => ({ target: placeTarget(item, CATEGORIES[id].glyph, at, id === 'stay'), n: (r?.n || 0) + 1 })) : undefined}
            ride={view === 'ride' ? { dayIndex: Math.min(rideDay, Math.max(0, legPaths.length - 1)), position: ridePos, heading: rideHeading, follow: rideFollow, detour: rideDetour } : null}
          />
          </Suspense>
        </main>

        {showSaved && (
          <Suspense fallback={null}><SavedRoutes
            routes={savedRoutes}
            onClose={() => setShowSaved(false)}
            onLoad={handleLoadRoute}
            onDelete={handleDeleteRoute}
          /></Suspense>
        )}

        {showWelcome && (
          <WelcomeDialog 
            onStart={(prompt) => {
              setInitialPrompt(prompt);
              setShowWelcome(false);
            }}
            onInspire={() => { setShowWelcome(false); setView('inspire'); }}
          />
        )}

        <ConsentBanner />

        {plansReason !== undefined && (
          <Suspense fallback={null}><PlansDialog
            reason={plansReason}
            savedTrips={savedRoutes.length}
            onClose={() => setPlansReason(undefined)}
            onLogin={handleLogin}
          /></Suspense>
        )}

        {showLogin && (
          <Suspense fallback={null}><LoginDialog
            onClose={() => setShowLogin(false)}
            onSignedIn={() => {
              setShowLogin(false);
              setToast({ message: tr("You're logged in. Your expeditions can now be saved."), type: 'success' });
            }}
          /></Suspense>
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
