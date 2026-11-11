import React, { useEffect, useRef, useState } from 'react';
import {
  MapPin,
  Navigation,
  Car,
  Bike,
  Footprints,
  Bus,
  Loader2,
  AlertCircle,
  Plus,
  Trash2,
  Save,
  History,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Info,
  Paperclip,
  Share2,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { RouteInfo, Waypoint, StopRef, TripIntent, TripStyle } from '../types';
import type { PlanSummary } from './AIAgent';
import { ACCEPTED_FILES } from '../lib/attachments';
import { cn } from '../lib/utils';
import AIAgent from './AIAgent';
import StopDetails from './StopDetails';
import Itinerary from './Itinerary';
import { ScheduleDay, BookingWarning } from '../lib/schedule';
import { RouteOptions } from '../lib/routing';
import { useSettings } from '../lib/settings';
import { useAccount, openPlans } from '../lib/account';
import { rentalUrl } from '../lib/affiliate';
import { PLANS } from '../lib/plans';
import LinkAdder from './LinkAdder';

// Phone bottom-sheet heights (desktop always uses the full-height sidebar).
type SheetHeight = 'peek' | 'half' | 'full';
const SHEET_HEIGHTS: Record<SheetHeight, string> = { peek: 'h-[22dvh]', half: 'h-[55dvh]', full: 'h-[92dvh]' };
const SHEET_NEXT: Record<SheetHeight, SheetHeight> = { peek: 'half', half: 'full', full: 'peek' };

interface SidebarProps {
  origin: string;
  setOrigin: (val: string) => void;
  destination: string;
  setDestination: (val: string) => void;
  waypoints: Waypoint[];
  setWaypoints: (waypoints: Waypoint[]) => void;
  travelMode: string;
  setTravelMode: (mode: any) => void;
  onCalculate: () => void;
  onSave: () => void;
  onShowSaved: () => void;
  onAISummary: (summary: string) => void;
  onPlanTrip: (intent: TripIntent) => Promise<PlanSummary | null>;
  routeInfo: RouteInfo | null;
  aiSummary: string | null;
  error: string | null;
  isLoading: boolean;
  user: any;
  onLogin: () => void;
  onLogout: () => void;
  hasChanges: boolean;
  /** The typed route changed since it was last calculated. */
  needsCalculate: boolean;
  onRemoveItem: (ref: StopRef, categoryIndex: number, itemIndex: number) => void;
  onAttachFile: (ref: StopRef | null, file: File | string) => void;
  attachingKey: string | null;
  schedule: ScheduleDay[];
  startDate: string;
  onStartDateChange: (date: string) => void;
  onVehicleChange?: (vehicle: string) => void;
  onStyleChange?: (style: TripStyle) => void;
  onRestDaysChange: (stopIndex: number, restDays: number) => void;
  onExportGpx: (legIndex: number | null) => void;
  warnings: BookingWarning[];
  costs: Record<string, number>;
  routeOptions: RouteOptions;
  onRouteOptionsChange: (options: RouteOptions) => void;
  isSaved: boolean;
  viewingShared: boolean;
  shareLink: string | null;
  onShare: () => void;
  onStopSharing: () => void;
  onFindPlaces: (ref: StopRef) => void;
  expeditionName: string;
  setExpeditionName: (val: string) => void;
  initialPrompt?: string;
  /** Nights at each stop, for the booking links' dates. */
  stays?: Map<string, { checkIn: string; checkOut: string }>;
  /** The top tab; on phones the sheet drops to its smallest height for Budget and Documents. */
  view?: 'route' | 'budget' | 'documents' | 'ride';
}

const Sidebar: React.FC<SidebarProps> = ({
  origin,
  setOrigin,
  destination,
  setDestination,
  waypoints,
  setWaypoints,
  travelMode,
  setTravelMode,
  onCalculate,
  onSave,
  onShowSaved,
  onAISummary,
  onPlanTrip,
  routeInfo,
  aiSummary,
  error,
  isLoading,
  user,
  onLogin,
  onLogout,
  hasChanges,
  needsCalculate,
  expeditionName,
  setExpeditionName,
  initialPrompt,
  view = 'route',
  stays,
  onRemoveItem,
  onAttachFile,
  attachingKey,
  schedule,
  startDate,
  onStartDateChange,
  onVehicleChange,
  onStyleChange,
  onRestDaysChange,
  onExportGpx,
  warnings,
  costs,
  routeOptions,
  onRouteOptionsChange,
  isSaved,
  viewingShared,
  shareLink,
  onShare,
  onStopSharing,
  onFindPlaces,
}) => {
  const { t, localizeText } = useSettings();
  const account = useAccount();
  const reservationInput = useRef<HTMLInputElement>(null);
  const [sheet, setSheet] = useState<SheetHeight>('half');
  const [accountOpen, setAccountOpen] = useState(false);
  const [briefOpen, setBriefOpen] = useState(false);
  // The manual route form is open until there's a route, then folds into a one-line summary.
  const [formOpen, setFormOpen] = useState(!routeInfo);
  const [stopsOpen, setStopsOpen] = useState(false);
  const hasRoute = Boolean(routeInfo);
  useEffect(() => { setFormOpen(!hasRoute); }, [hasRoute]);
  useEffect(() => { if (view !== 'route') setSheet('peek'); }, [view]);
  const warningsFor = (key: string) => Object.fromEntries(
    warnings.filter(w => w.key === key).map(w => [`${w.categoryIndex}-${w.itemIndex}`, w.message]));
  const travelModes = [
    { id: 'DRIVING', icon: Car, label: t('Moto/Car') },
    { id: 'WALKING', icon: Footprints, label: t('Hike') },
    { id: 'BICYCLING', icon: Bike, label: t('Bike') },
    { id: 'TRANSIT', icon: Bus, label: t('Transit') },
  ];

  const addWaypoint = () => {
    setWaypoints([...waypoints, { location: '', stopover: true }]);
  };

  const removeWaypoint = (index: number) => {
    const newWaypoints = [...waypoints];
    newWaypoints.splice(index, 1);
    setWaypoints(newWaypoints);
  };

  const updateWaypoint = (index: number, value: string) => {
    // A typed name replaces any exact position from route splitting or dragging.
    const newWaypoints = waypoints.map((wp, i) => i === index ? { ...wp, location: value, position: undefined } : wp);
    setWaypoints(newWaypoints);
  };

  const moveWaypoint = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === waypoints.length - 1) return;

    const newWaypoints = [...waypoints];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newWaypoints[index], newWaypoints[targetIndex]] = [newWaypoints[targetIndex], newWaypoints[index]];
    setWaypoints(newWaypoints);
  };

  return (
    <aside className={cn(
      "absolute inset-x-0 bottom-0 z-20 flex w-full shrink-0 flex-col overflow-y-auto rounded-t-2xl border-t bg-card px-4 pb-4 shadow-[0_-8px_24px_rgba(0,0,0,0.12)] transition-[height] duration-300",
      "md:static md:h-full md:w-[26rem] md:rounded-none md:border-r md:border-t-0 md:p-6 md:shadow-xl md:transition-none",
      SHEET_HEIGHTS[sheet],
    )}>
      {/* Phone handle: tap to switch between peek, half and full height. */}
      <button
        onClick={() => setSheet(SHEET_NEXT[sheet])}
        className="sticky top-0 z-10 -mx-4 mb-2 flex flex-col items-center gap-1 bg-card pb-1 pt-2 md:hidden"
        aria-label={sheet === 'full' ? t('Show more map') : t('Show more of the planner')}
      >
        <span className="h-1.5 w-10 rounded-full bg-muted-foreground/30" />
        <span className="text-[10px] text-muted-foreground">{sheet === 'full' ? t('Tap to show the map') : t('Tap to expand')}</span>
      </button>
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="rounded-lg bg-emerald-600 p-1.5 text-white shadow-lg shadow-emerald-900/20">
            <Navigation size={20} />
          </div>
          <h1 className="truncate text-sm font-semibold uppercase text-emerald-950">Adventure Planner</h1>
        </div>
        <div className="relative flex shrink-0 items-center gap-1">
          <button
            onClick={onShowSaved}
            className="rounded-full p-2 text-muted-foreground hover:bg-accent"
            title={t('Saved expeditions')}
            aria-label={t('Saved expeditions')}
          >
            <History size={18} />
          </button>
          {user ? (
            <>
              <button
                onClick={() => setAccountOpen(o => !o)}
                className="rounded-full ring-emerald-300 hover:ring-2"
                title={user.email || t('Account')}
                aria-label={t('Account')}
                aria-expanded={accountOpen}
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="h-8 w-8 rounded-full border border-emerald-200" referrerPolicy="no-referrer" />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                    {(user.displayName?.[0] || user.email?.[0] || 'U').toUpperCase()}
                  </span>
                )}
              </button>
              {accountOpen && (
                <div className="absolute right-0 top-10 z-30 w-56 rounded-lg border bg-white p-3 text-xs shadow-xl">
                  <p className="truncate font-bold">{user.displayName || t('Explorer')}</p>
                  <p className="mb-2 truncate text-muted-foreground">{user.email}</p>
                  <div className="mb-2 flex items-center justify-between gap-2 rounded-sm bg-emerald-50 px-2 py-1.5">
                    <span>
                      <span className="font-bold uppercase text-emerald-800">{t(PLANS[account.plan].name)}</span>
                      {account.enforced && <span className="block text-[10px] text-muted-foreground">{t('{used} of {limit} AI plans today', { used: account.usage.aiPlans, limit: account.limits.aiPlans })}</span>}
                    </span>
                    <button onClick={() => { setAccountOpen(false); openPlans(); }} className="shrink-0 font-semibold text-emerald-700 hover:underline">{t('Plans')}</button>
                  </div>
                  <button onClick={() => { setAccountOpen(false); onLogout(); }} className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:underline">
                    <LogOut size={12} /> {t('Sign out')}
                  </button>
                </div>
              )}
            </>
          ) : (
            <button
              onClick={onLogin}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-md transition-colors hover:bg-emerald-700"
              title={t('Log in to save your expeditions, keep bookings and share trips')}
            >
              {t('Log in')}
            </button>
          )}
        </div>
      </div>

      {viewingShared && (
        <div className="mb-4 rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs text-sky-900">
          {t("You're viewing a shared trip. Changes stay on your screen.")} {user ? t('Save keeps your own copy.') : t('Log in to save your own copy.')}
        </div>
      )}

      <div className="mb-4">
        <AIAgent onPlanTrip={onPlanTrip} initialPrompt={initialPrompt} startDate={startDate} onStartDateChange={onStartDateChange} onVehicleChange={onVehicleChange} onStyleChange={onStyleChange} />
      </div>

      {aiSummary && (
        <button
          onClick={() => setBriefOpen(o => !o)}
          className="mb-4 w-full rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 text-left text-xs text-emerald-900"
          title={briefOpen ? t('Show less') : t('Show all')}
        >
          <div className="mb-1 flex items-center gap-1 font-bold uppercase tracking-wider">
            <Sparkles size={12} />
            {t('Adventure brief')}
          </div>
          <p className={cn("italic leading-relaxed opacity-90", !briefOpen && "line-clamp-2")}>{aiSummary}</p>
        </button>
      )}

      <div className="space-y-3">
        {hasRoute && (
          <button
            onClick={() => setFormOpen(o => !o)}
            aria-expanded={formOpen}
            className="flex w-full items-center gap-2 rounded-lg border border-emerald-100 bg-white px-3 py-2 text-left text-xs hover:bg-emerald-50"
          >
            {formOpen ? <ChevronDown size={14} className="shrink-0 text-emerald-700" /> : <ChevronRight size={14} className="shrink-0 text-emerald-700" />}
            <span className="font-bold uppercase tracking-wider text-emerald-700">{t('Route')}</span>
            <span className="min-w-0 flex-1 truncate text-muted-foreground">
              {origin.split(',')[0]} → {destination.split(',')[0]} · {waypoints.length === 1 ? t('1 stop') : t('{n} stops', { n: waypoints.length })} · {travelModes.find(m => m.id === travelMode)?.label}
            </span>
            <span className="shrink-0 font-semibold text-emerald-700">{formOpen ? t('Hide') : t('Edit')}</span>
          </button>
        )}
        {(formOpen || !hasRoute) && (
        <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-emerald-700">
            {t('Start')}
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-emerald-600/50" />
            <input
              type="text"
              placeholder={t('Enter origin')}
              className="flex h-10 w-full rounded-md border border-emerald-100 bg-background px-9 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/20 "
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
            />
          </div>
        </div>

        {waypoints.length > 0 && (
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              {t('Stops')}
            </label>
            {waypoints.map((wp, index) => (
              <div key={index} className="relative flex items-center gap-2">
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moveWaypoint(index, 'up')}
                    disabled={index === 0}
                    className="text-muted-foreground hover:text-emerald-600 disabled:opacity-30"
                    title={t('Move up')}
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    onClick={() => moveWaypoint(index, 'down')}
                    disabled={index === waypoints.length - 1}
                    className="text-muted-foreground hover:text-emerald-600 disabled:opacity-30"
                    title={t('Move down')}
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>
                <div className="relative flex-1">
                  <div className="absolute left-3 top-3 h-4 w-4 rounded-full border-2 border-emerald-600/30" />
                  <input
                    type="text"
                    placeholder={t('Stop {n}', { n: index + 1 })}
                    className="flex h-10 w-full rounded-md border border-emerald-100 bg-background px-9 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/20 "
                    value={wp.location}
                    onChange={(e) => updateWaypoint(index, e.target.value)}
                  />
                </div>
                <button
                  onClick={() => removeWaypoint(index)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={addWaypoint}
          className="flex items-center gap-2 text-xs font-medium text-emerald-600 hover:underline"
        >
          <Plus size={14} />
          {t('Add stop')}
        </button>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-emerald-700">
            {t('End')}
          </label>
          <div className="relative">
            <Navigation className="absolute left-3 top-3 h-4 w-4 text-emerald-600/50" />
            <input
              type="text"
              placeholder={t('Enter destination')}
              className="flex h-10 w-full rounded-md border border-emerald-100 bg-background px-9 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/20 "
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {travelModes.map((mode) => {
            const Icon = mode.icon;
            const isActive = travelMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setTravelMode(mode.id as any)}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-md border px-1 py-1.5 transition-all hover:bg-emerald-50",
                  isActive ? "border-emerald-600 bg-emerald-600/10 text-emerald-600" : "border-muted text-muted-foreground"
                )}
                title={mode.label}
                aria-pressed={isActive}
              >
                <Icon size={15} />
                <span className="text-[10px] font-medium leading-none">{mode.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-1.5" role="group" aria-label={t('Route options')}>
          {([
            ['avoidHighways', 'Avoid highways'],
            ['avoidFerries', 'Avoid ferries'],
            ['avoidTolls', 'Avoid tolls'],
            ...(travelMode !== 'TRANSIT' ? [['offroad', 'Off-road (easy)']] as const : []),
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => onRouteOptionsChange({ ...routeOptions, [key]: !routeOptions[key] })}
              aria-pressed={routeOptions[key]}
              className={cn(
                "rounded-sm border px-2.5 py-1 font-mono text-[10px] font-medium uppercase transition-colors",
                routeOptions[key] ? "border-emerald-600 bg-emerald-600 text-white" : "border-emerald-100 text-muted-foreground hover:bg-emerald-50"
              )}
            >
              {t(label)}
            </button>
          ))}
        </div>
        </div>
        )}

        <div className="flex gap-2">
          {(!routeInfo || needsCalculate) && (
            <button
              onClick={() => onCalculate()}
              disabled={isLoading || !origin || !destination}
              className="flex-1 inline-flex h-10 items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-md transition-all hover:bg-emerald-700 disabled:opacity-50 animate-in fade-in zoom-in-95"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('Calculate expedition')}
            </button>
          )}
        </div>

        {routeInfo && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={t('Give your expedition a name')}
                aria-label={t('Expedition name')}
                className="flex h-10 min-w-0 flex-1 rounded-md border border-emerald-100 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/20 "
                value={expeditionName}
                onChange={(e) => setExpeditionName(e.target.value)}
              />
              <button
                onClick={onSave}
                disabled={!user || (!hasChanges && !viewingShared)}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-md px-4 text-xs font-bold text-white shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap",
                  hasChanges || viewingShared
                    ? "bg-emerald-600 shadow-emerald-900/20 hover:bg-emerald-700" 
                    : "bg-muted-foreground/40 shadow-none"
                )}
              >
                <Save size={14} />
                {viewingShared ? t('Save copy') : hasChanges ? t('Save') : t('Saved')}
              </button>
            </div>
            {!user && (
              <p className="text-[10px] text-muted-foreground">
                <button onClick={onLogin} className="font-semibold text-emerald-700 hover:underline">{t('Log in')}</button> {t('to save your adventure')}
              </p>
            )}
            {user && isSaved && !viewingShared && (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <button
                  onClick={onShare}
                  className="inline-flex items-center gap-1 rounded-md border border-emerald-200 px-2 py-1 font-semibold text-emerald-700 hover:bg-emerald-50"
                  title={t('Anyone with the link can view this trip (read-only)')}
                >
                  <Share2 size={12} /> {shareLink ? t('Copy share link') : t('Share')}
                </button>
                {shareLink && (
                  <>
                    <input readOnly value={shareLink} onFocus={(e) => e.target.select()} className="min-w-0 flex-1 rounded border border-emerald-100 px-1.5 py-1 text-[11px] text-muted-foreground" aria-label={t('Share link')} />
                    <button onClick={onStopSharing} className="text-[11px] text-red-600 hover:underline">{t('Stop sharing')}</button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {routeInfo?.notice && (
          <div className="flex items-center gap-2 rounded-md bg-amber-50 p-3 text-xs text-amber-800">
            <Info size={14} className="shrink-0" />
            <span>{t(routeInfo.notice)}</span>
          </div>
        )}
      </div>

      {routeInfo && (
        <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Itinerary
            routeInfo={routeInfo}
            schedule={schedule}
            startDate={startDate}
            onStartDateChange={onStartDateChange}
            onRestDaysChange={onRestDaysChange}
            onExportGpx={onExportGpx}
            warnings={warnings}
            costs={costs}
          />

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => setStopsOpen(o => !o)}
                aria-expanded={stopsOpen}
                className="flex min-w-0 items-center gap-1.5 text-left"
              >
                {stopsOpen ? <ChevronDown size={14} className="shrink-0 text-emerald-700" /> : <ChevronRight size={14} className="shrink-0 text-emerald-700" />}
                <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-700">{t('Stops & places')}</h3>
                <span className="text-[11px] text-muted-foreground">({routeInfo.waypoints.length + 2})</span>
              </button>
              <input
                ref={reservationInput}
                type="file"
                accept={ACCEPTED_FILES}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onAttachFile(null, file);
                  e.target.value = '';
                }}
              />
              <button
                onClick={() => reservationInput.current?.click()}
                disabled={attachingKey !== null}
                title={t("Attach a booking PDF, email or screenshot; it's placed on the matching stop automatically")}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-violet-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-violet-700 disabled:opacity-60"
              >
                {attachingKey === 'any' ? <Loader2 size={12} className="animate-spin" /> : <Paperclip size={12} />}
                {attachingKey === 'any' ? t('Reading…') : t('Add reservation')}
              </button>
            </div>
            <LinkAdder busy={attachingKey === 'any'} onAdd={(url) => onAttachFile(null, url)} />
            {stopsOpen && (<>
            <p className="text-[11px] text-muted-foreground">{t('Drag pins on the map to move a stop, or drag the route line to make it pass somewhere. Remove suggestions with ×, or attach bookings to keep them with the trip.')}</p>
            <StopDetails
              kind="start" badge="S" title={t('Start')} location={routeInfo.origin} interests={routeInfo.originInterests || []}
              onRemoveItem={(c, i) => onRemoveItem({ kind: 'start' }, c, i)}
              warnings={warningsFor('start')}
              onFindPlaces={() => onFindPlaces({ kind: 'start' })}
              nights={stays?.get('start')}
              rentalLink={travelMode === 'DRIVING' ? rentalUrl(routeInfo.origin, stays?.get('start')?.checkOut, stays?.get('end')?.checkIn) : null}
              onAttachFile={(file) => onAttachFile({ kind: 'start' }, file)}
              attaching={attachingKey === 'start'}
            />
            {routeInfo.waypoints.map((wp, i) => (
              <StopDetails
                key={i}
                kind="stop"
                badge={String(i + 1)}
                title={t('Stop {n}', { n: i + 1 })}
                location={wp.location}
                interests={wp.interests || []}
                distanceFromPrev={wp.distanceFromPrev && localizeText(wp.distanceFromPrev)}
                distanceToNext={wp.distanceToNext && localizeText(wp.distanceToNext)}
                onRemoveItem={(c, j) => onRemoveItem({ kind: 'stop', index: i }, c, j)}
                warnings={warningsFor(`stop-${i}`)}
                onFindPlaces={() => onFindPlaces({ kind: 'stop', index: i })}
                nights={stays?.get(`stop-${i}`)}
                onAttachFile={(file) => onAttachFile({ kind: 'stop', index: i }, file)}
                attaching={attachingKey === `stop-${i}`}
              />
            ))}
            <StopDetails
              kind="end" badge="F" title={t('Finish')} location={routeInfo.destination} interests={routeInfo.destinationInterests || []}
              onRemoveItem={(c, i) => onRemoveItem({ kind: 'end' }, c, i)}
              warnings={warningsFor('end')}
              onFindPlaces={() => onFindPlaces({ kind: 'end' })}
              nights={stays?.get('end')}
              onAttachFile={(file) => onAttachFile({ kind: 'end' }, file)}
              attaching={attachingKey === 'end'}
            />
            </>)}
          </div>
        </div>
      )}

    </aside>
  );
};

export default Sidebar;
