import React from 'react';
import {
  MapPin,
  Navigation,
  Car,
  Bike,
  Footprints,
  Bus,
  Loader2,
  AlertCircle,
  Clock,
  Map as MapIcon,
  Plus,
  Trash2,
  Save,
  History,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Info,
  CalendarDays,
} from 'lucide-react';
import { RouteInfo, Waypoint, AIPlanParams, RouteLeg } from '../types';
import { cn } from '../lib/utils';
import AIAgent from './AIAgent';
import StopDetails from './StopDetails';

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
  onAIPlan: (params: AIPlanParams) => Promise<RouteLeg[] | null>;
  routeInfo: RouteInfo | null;
  aiSummary: string | null;
  error: string | null;
  isLoading: boolean;
  user: any;
  onLogin: () => void;
  onLogout: () => void;
  hasChanges: boolean;
  expeditionName: string;
  setExpeditionName: (val: string) => void;
  initialPrompt?: string;
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
  onAIPlan,
  routeInfo,
  aiSummary,
  error,
  isLoading,
  user,
  onLogin,
  onLogout,
  hasChanges,
  expeditionName,
  setExpeditionName,
  initialPrompt,
}) => {
  const travelModes = [
    { id: 'DRIVING', icon: Car, label: 'Moto/Car' },
    { id: 'WALKING', icon: Footprints, label: 'Hike' },
    { id: 'BICYCLING', icon: Bike, label: 'Bike' },
    { id: 'TRANSIT', icon: Bus, label: 'Transit' },
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
    const newWaypoints = waypoints.map((wp, i) => i === index ? { ...wp, location: value } : wp);
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
    <aside className="z-10 flex h-[55dvh] w-full shrink-0 flex-col overflow-y-auto border-t bg-card p-4 shadow-xl md:h-full md:w-[26rem] md:border-r md:border-t-0 md:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-emerald-600 p-2 text-white shadow-lg shadow-emerald-900/20">
            <Navigation size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-emerald-950">Adventure Planner</h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={onShowSaved}
            className="rounded-full p-2 hover:bg-accent text-muted-foreground"
            title="Saved Expeditions"
            aria-label="Saved Expeditions"
          >
            <History size={20} />
          </button>
        </div>
      </div>

      <div className="mb-6 rounded-xl border bg-muted/30 p-4">
        {user ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName} className="h-10 w-10 rounded-full border border-emerald-200" referrerPolicy="no-referrer" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold">
                  {user.displayName?.[0] || user.email?.[0] || 'U'}
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-sm font-bold truncate max-w-[120px]">{user.displayName || 'Explorer'}</span>
                <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">{user.email}</span>
              </div>
            </div>
            <button 
              onClick={onLogout}
              className="text-xs font-medium text-emerald-600 hover:underline"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-xs text-muted-foreground">Sign in to save your expeditions and access them anywhere.</p>
            <button 
              onClick={onLogin}
              className="w-full rounded-lg bg-emerald-600 py-2 text-sm font-bold text-white shadow-md hover:bg-emerald-700 transition-colors"
            >
              Sign In with Google
            </button>
          </div>
        )}
      </div>

      <div className="mb-6">
        <AIAgent onPlanRoute={onAIPlan} initialPrompt={initialPrompt} />
      </div>

      {aiSummary && (
        <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 text-xs text-emerald-900 /30">
          <div className="mb-1 flex items-center gap-1 font-bold uppercase tracking-wider">
            <Sparkles size={12} />
            Adventure Brief
          </div>
          <p className="italic leading-relaxed opacity-90">{aiSummary}</p>
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-emerald-700">
            Start
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-emerald-600/50" />
            <input
              type="text"
              placeholder="Enter origin"
              className="flex h-10 w-full rounded-md border border-emerald-100 bg-background px-9 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/20 "
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
            />
          </div>
        </div>

        {waypoints.length > 0 && (
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Stops
            </label>
            {waypoints.map((wp, index) => (
              <div key={index} className="relative flex items-center gap-2">
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moveWaypoint(index, 'up')}
                    disabled={index === 0}
                    className="text-muted-foreground hover:text-emerald-600 disabled:opacity-30"
                    title="Move Up"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    onClick={() => moveWaypoint(index, 'down')}
                    disabled={index === waypoints.length - 1}
                    className="text-muted-foreground hover:text-emerald-600 disabled:opacity-30"
                    title="Move Down"
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>
                <div className="relative flex-1">
                  <div className="absolute left-3 top-3 h-4 w-4 rounded-full border-2 border-emerald-600/30" />
                  <input
                    type="text"
                    placeholder={`Stop ${index + 1}`}
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
          Add Stop
        </button>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-emerald-700">
            End
          </label>
          <div className="relative">
            <Navigation className="absolute left-3 top-3 h-4 w-4 text-emerald-600/50" />
            <input
              type="text"
              placeholder="Enter destination"
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
                  "flex flex-col items-center justify-center rounded-md border p-2 transition-all hover:bg-emerald-50",
                  isActive ? "border-emerald-600 bg-emerald-600/10 text-emerald-600" : "border-muted text-muted-foreground"
                )}
                title={mode.label}
                aria-pressed={isActive}
              >
                <Icon size={18} />
                <span className="mt-1 text-[10px] font-medium leading-none">{mode.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex gap-2">
          {(!routeInfo || hasChanges) && (
            <button
              onClick={() => onCalculate()}
              disabled={isLoading || !origin || !destination}
              className="flex-1 inline-flex h-10 items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-md transition-all hover:bg-emerald-700 disabled:opacity-50 animate-in fade-in zoom-in-95"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Calculate Expedition'}
            </button>
          )}
        </div>

        {routeInfo && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
            <label className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Expedition Name
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Give your expedition a name"
                className="flex h-10 flex-1 rounded-md border border-emerald-100 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/20 "
                value={expeditionName}
                onChange={(e) => setExpeditionName(e.target.value)}
              />
              <button
                onClick={onSave}
                disabled={!user || !hasChanges}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-md px-4 text-xs font-bold text-white shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap",
                  hasChanges 
                    ? "bg-emerald-600 shadow-emerald-900/20 hover:bg-emerald-700" 
                    : "bg-muted-foreground/40 shadow-none"
                )}
              >
                <Save size={14} />
                {hasChanges ? 'Save' : 'Saved'}
              </button>
            </div>
            {!user && (
              <p className="text-[10px] text-muted-foreground">Sign in to save your adventure</p>
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
            <span>{routeInfo.notice}</span>
          </div>
        )}
      </div>

      {routeInfo && (
        <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-700">
                <MapIcon size={18} />
                <span className="text-sm font-semibold">{routeInfo.distance}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock size={18} />
                <span className="text-sm font-semibold">{routeInfo.duration}</span>
              </div>
            </div>

            {routeInfo.legs && routeInfo.legs.length > 0 ? (
              <ol className="space-y-2">
                {routeInfo.legs.map((leg, i) => (
                  <li key={i} className="flex items-start gap-3 text-xs">
                    <span className="mt-0.5 flex shrink-0 items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 font-bold text-emerald-800">
                      <CalendarDays size={11} />
                      Day {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium" title={`${leg.from} → ${leg.to}`}>{leg.from} → {leg.to}</p>
                      <p className="text-muted-foreground">{leg.distance} · {leg.duration}</p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>{routeInfo.startAddress}</p>
                <p>→ {routeInfo.endAddress}</p>
              </div>
            )}
          </div>

          {(routeInfo.originInterests?.length ||
            routeInfo.waypoints.some(wp => wp.interests?.length) ||
            routeInfo.destinationInterests?.length) ? (
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-700">Expedition Details</h3>
              {routeInfo.originInterests && routeInfo.originInterests.length > 0 && (
                <StopDetails kind="start" badge="S" title="Start" location={routeInfo.origin} interests={routeInfo.originInterests} />
              )}
              {routeInfo.waypoints.map((wp, i) => wp.interests && wp.interests.length > 0 && (
                <StopDetails
                  key={i}
                  kind="stop"
                  badge={String(i + 1)}
                  title={`Stop ${i + 1}`}
                  location={wp.location}
                  interests={wp.interests}
                  distanceFromPrev={wp.distanceFromPrev}
                  distanceToNext={wp.distanceToNext}
                />
              ))}
              {routeInfo.destinationInterests && routeInfo.destinationInterests.length > 0 && (
                <StopDetails kind="end" badge="F" title="Finish" location={routeInfo.destination} interests={routeInfo.destinationInterests} />
              )}
            </div>
          ) : null}
        </div>
      )}

    </aside>
  );
};

export default Sidebar;
