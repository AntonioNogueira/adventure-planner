import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  X, ChevronLeft, ChevronRight, Crosshair, Download, Navigation, AlertTriangle, Sun, Volume2, VolumeX,
  CornerUpLeft, CornerUpRight, ArrowUp, ArrowUpLeft, ArrowUpRight, RotateCw, Undo2, Flag, Ship,
} from 'lucide-react';
import { RouteInfo } from '../types';
import { ScheduleDay } from '../lib/schedule';
import { LatLng } from '../lib/geo';
import { cumulativeKm, progressOn, googleMapsUrl, wazeUrl, arrivalAt } from '../lib/ride';
import { useSettings } from '../lib/settings';
import { Turn, TurnKind, dayTurns, rejoinTurns, nextAnnouncement, nextTurn, speak, canSpeak } from '../lib/voice';
import { cn } from '../lib/utils';
import InstallHint from './InstallHint';

interface RideModeProps {
  routeInfo: RouteInfo | null;
  /** One per riding day (leg): its path. */
  paths: LatLng[][];
  schedule: ScheduleDay[];
  travelMode: string;
  /** Off-road routing on (turn instructions are matched to tracks). */
  offroad?: boolean;
  dayIndex: number;
  onDayChange: (index: number) => void;
  position?: LatLng;
  onPosition: (p: LatLng | undefined) => void;
  follow: boolean;
  onFollowChange: (follow: boolean) => void;
  /** The way back to the route while off it (drawn on the map). */
  onDetour?: (path: LatLng[] | undefined) => void;
  onExportGpx: (legIndex: number) => void;
  onClose: () => void;
}

type GpsState = 'waiting' | 'ok' | 'denied' | 'unavailable';

const VOICE_KEY = 'adventure-planner.voice';
const readVoice = () => { try { return localStorage.getItem(VOICE_KEY) === '1'; } catch { return false; } };

const TURN_ICON: Record<TurnKind, typeof ArrowUp> = {
  left: CornerUpLeft, right: CornerUpRight, 'sharp-left': CornerUpLeft, 'sharp-right': CornerUpRight,
  'slight-left': ArrowUpLeft, 'slight-right': ArrowUpRight, 'keep-left': ArrowUpLeft, 'keep-right': ArrowUpRight,
  straight: ArrowUp, uturn: Undo2, roundabout: RotateCw, arrive: Flag, ferry: Ship,
};

/** The day being ridden: progress, arrival, off-route warning and links to a navigation app. */
const RideMode: React.FC<RideModeProps> = ({
  routeInfo, paths, schedule, travelMode, offroad, dayIndex, onDayChange, position, onPosition, follow, onFollowChange, onDetour, onExportGpx, onClose,
}) => {
  const { t, dist, speed: fmtSpeed, date, locale, settings } = useSettings();
  const [gps, setGps] = useState<GpsState>('waiting');
  const [kmh, setKmh] = useState(0);
  const [awake, setAwake] = useState(false);
  const last = useRef<{ p: LatLng; t: number } | null>(null);
  // Voice turn-by-turn: on/off (remembered), the day's turns, what's been said, and a detour back to the route.
  const [voice, setVoice] = useState(readVoice);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [detour, setDetour] = useState<{ path: LatLng[]; cum: number[]; turns: Turn[] } | null>(null);
  const said = useRef(new Set<string>());
  const lastRejoin = useRef(0);
  const wasOff = useRef(false);

  // Live position (foreground; phones keep it going while the screen is on).
  useEffect(() => {
    if (!('geolocation' in navigator)) { setGps('unavailable'); return; }
    const id = navigator.geolocation.watchPosition(
      pos => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setGps('ok');
        // Speed from the GPS if it gives one, else from the last fix; smoothed.
        let v = pos.coords.speed != null && pos.coords.speed >= 0 ? pos.coords.speed * 3.6 : NaN;
        const prev = last.current;
        if (Number.isNaN(v) && prev) {
          const hours = (pos.timestamp - prev.t) / 3_600_000;
          const km = Math.hypot((p.lat - prev.p.lat) * 111, (p.lng - prev.p.lng) * 111 * Math.cos(p.lat * Math.PI / 180));
          v = hours > 0 ? km / hours : 0;
        }
        // A jump (first fix after a tunnel, a GPS glitch) isn't a speed: ignore anything no vehicle does.
        if (!Number.isNaN(v) && v <= 250) setKmh(k => Math.round(k ? k * 0.6 + v * 0.4 : v));
        last.current = { p, t: pos.timestamp };
        onPosition(p);
      },
      err => setGps(err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable'),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    );
    return () => { navigator.geolocation.clearWatch(id); onPosition(undefined); };
  }, []);

  // Keep the screen on while riding (where the browser allows it).
  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null;
    const request = async () => {
      try {
        lock = await (navigator as any).wakeLock?.request('screen');
        setAwake(Boolean(lock));
      } catch { setAwake(false); }
    };
    const onVisible = () => { if (document.visibilityState === 'visible') request(); };
    request();
    document.addEventListener('visibilitychange', onVisible);
    return () => { document.removeEventListener('visibilitychange', onVisible); lock?.release().catch(() => {}); };
  }, []);

  const path = useMemo(() => paths[dayIndex] || [], [paths, dayIndex]);
  const cum = useMemo(() => cumulativeKm(path), [path]);
  const totalKm = cum[cum.length - 1] || 0;
  const progress = position && path.length > 1 ? progressOn(path, position, cum) : null;
  const leg = routeInfo?.legs?.[dayIndex];
  const dayNumber = schedule.findIndex(d => d.kind === 'ride' && d.legIndex === dayIndex) + 1;
  const dayDate = schedule.find(d => d.kind === 'ride' && d.legIndex === dayIndex)?.date;
  // A few hundred metres off: a warning. Far away (another day, not started yet): just say how far.
  const far = Boolean(progress && progress.offRouteKm > 5);
  const offRoute = progress && progress.offRouteKm > 0.25 && !far;
  const remaining = progress && !far ? progress.remainingKm : totalKm;
  const plannedKmh = leg?.durationSeconds ? (leg.distanceMeters || 0) / 1000 / (leg.durationSeconds / 3600) : 0;
  const eta = arrivalAt(remaining, kmh >= 5 ? kmh : plannedKmh);
  const to = (leg?.to || routeInfo?.destination || '').split(',')[0];

  // The day's turns (in the user's language); re-fetched when the day, language or units change.
  useEffect(() => {
    let live = true;
    setTurns([]); setDetour(null); said.current = new Set(); wasOff.current = false;
    if (path.length > 1) {
      dayTurns(path, { travelMode, offroad, language: settings.language, units: settings.units, destination: to })
        .then(list => { if (live) setTurns(list); });
    }
    return () => { live = false; };
  }, [path, travelMode, offroad, settings.language, settings.units]);

  useEffect(() => { onDetour?.(detour?.path); }, [detour]);
  useEffect(() => () => onDetour?.(undefined), []);

  const say = (text: string) => { if (voice) speak(text, settings.language); };

  // Detour progress (when off the route and a way back was found).
  const detourProgress = detour && position ? progressOn(detour.path, position, detour.cum) : null;
  const upcoming = detour && detourProgress ? nextTurn(detour.turns, detourProgress.alongKm) : progress && !far ? nextTurn(turns, progress.alongKm) : undefined;
  const upcomingKm = upcoming ? upcoming.km - (detour && detourProgress ? detourProgress.alongKm : progress?.alongKm || 0) : 0;

  // What to say at each GPS fix.
  useEffect(() => {
    if (!progress || far) return;
    // Back on the route: drop the detour.
    if (progress.offRouteKm < 0.08) {
      if (detour) setDetour(null);
      wasOff.current = false;
    }
    // Left the way back too: drop it and look again.
    if (detour && detourProgress && detourProgress.offRouteKm > 0.25) { setDetour(null); return; }
    if (offRoute && !detour) {
      if (!wasOff.current) { wasOff.current = true; say(t("You're off the route. Finding the way back.")); }
      // Ask for a way back to the route a little ahead, at most every 30 s.
      if (Date.now() - lastRejoin.current > 30_000) {
        lastRejoin.current = Date.now();
        const target = Math.min(totalKm, progress.alongKm + 0.5);
        const i = Math.max(0, cum.findIndex(k => k >= target));
        rejoinTurns(position!, path[i] || path[path.length - 1], { travelMode, offroad, language: settings.language, units: settings.units })
          .then(r => { if (r && r.path.length > 1) setDetour({ ...r, cum: cumulativeKm(r.path) }); });
      }
      return;
    }
    const list = detour && detourProgress ? detour.turns : turns;
    const along = detour && detourProgress ? detourProgress.alongKm : progress.alongKm;
    const next = nextAnnouncement(list, along, kmh, said.current, settings.units, locale);
    if (next) { said.current.add(next.key); say(next.text); }
  }, [position?.lat, position?.lng]);

  const toggleVoice = () => {
    const on = !voice;
    setVoice(on);
    try { localStorage.setItem(VOICE_KEY, on ? '1' : '0'); } catch { /* private mode */ }
    // Speaking from the tap also unlocks speech on iPhone.
    if (on) speak(t('Voice guidance on.'), settings.language);
    else if (canSpeak()) window.speechSynthesis.cancel();
  };

  if (!routeInfo || !paths.length) {
    return (
      <div className="absolute inset-x-3 bottom-3 z-[25] rounded-xl border bg-card p-4 text-center text-sm shadow-2xl md:left-auto md:right-6 md:w-96">
        {t('Plan a route first, then ride it here.')}
        <button onClick={onClose} className="ml-2 font-semibold text-emerald-700 hover:underline">{t('Close')}</button>
      </div>
    );
  }

  return (
    <div role="region" aria-label={t('Ride')}
      className="absolute inset-x-2 bottom-2 z-[25] space-y-2 rounded-xl border bg-card p-3 shadow-2xl md:bottom-6 md:left-auto md:right-6 md:w-[26rem]">
      <div className="flex items-center gap-1">
        <button onClick={() => onDayChange(Math.max(0, dayIndex - 1))} disabled={dayIndex === 0} aria-label={t('Previous day')}
          className="rounded p-1 hover:bg-slate-100 disabled:opacity-30"><ChevronLeft size={18} /></button>
        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-sm font-bold text-emerald-950">
            {t('Day {n}', { n: dayNumber || dayIndex + 1 })}{dayDate && <span className="font-normal text-muted-foreground"> · {date(dayDate)}</span>}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">{leg ? `${leg.from.split(',')[0]} → ${to}` : ''}</p>
        </div>
        <button onClick={() => onDayChange(Math.min(paths.length - 1, dayIndex + 1))} disabled={dayIndex >= paths.length - 1} aria-label={t('Next day')}
          className="rounded p-1 hover:bg-slate-100 disabled:opacity-30"><ChevronRight size={18} /></button>
        <button onClick={onClose} aria-label={t('Close')} className="rounded p-1 hover:bg-slate-100"><X size={18} /></button>
      </div>

      {upcoming && gps === 'ok' && (() => {
        const Icon = TURN_ICON[upcoming.kind];
        return (
          <div className="flex items-center gap-3 rounded-md bg-emerald-900 px-3 py-2 text-white" aria-live="polite">
            <Icon size={30} strokeWidth={2.5} className="shrink-0" aria-hidden />
            <div className="min-w-0">
              <p className="tabular-nums text-xl font-bold leading-tight">{dist(Math.max(0, upcomingKm), upcomingKm < 1 ? 2 : 1)}</p>
              <p className="line-clamp-2 text-xs text-emerald-50">{upcoming.text}</p>
            </div>
          </div>
        );
      })()}

      {/* The numbers that matter on the road, large. */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-md bg-emerald-50 px-2 py-1.5">
          <p className="whitespace-nowrap tabular-nums text-lg font-bold text-emerald-950 sm:text-xl">{dist(remaining, remaining < 10 ? 1 : 0)}</p>
          <p className="truncate text-[10px] uppercase text-emerald-800">{t('to {place}', { place: to })}</p>
        </div>
        <div className="rounded-md bg-emerald-50 px-2 py-1.5">
          <p className="whitespace-nowrap tabular-nums text-lg font-bold text-emerald-950 sm:text-xl">{eta ? eta.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) : '—'}</p>
          <p className="text-[10px] uppercase text-emerald-800">{t('arrival')}</p>
        </div>
        <div className="rounded-md bg-emerald-50 px-2 py-1.5">
          <p className="whitespace-nowrap tabular-nums text-lg font-bold text-emerald-950 sm:text-xl">{gps === 'ok' ? fmtSpeed(kmh) : '—'}</p>
          <p className="text-[10px] uppercase text-emerald-800">{t('speed')}</p>
        </div>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200" aria-hidden>
        <div className="h-full bg-emerald-600 transition-all" style={{ width: `${far ? 0 : Math.round((progress?.fraction || 0) * 100)}%` }} />
      </div>

      {offRoute && (
        <p role="alert" className="flex items-center gap-1.5 rounded-md bg-amber-100 px-2 py-1.5 text-xs font-semibold text-amber-900">
          <AlertTriangle size={14} /> {t("You're {d} off the route", { d: dist(progress!.offRouteKm, 1) })}
        </p>
      )}
      {far && (
        <p className="text-[11px] text-muted-foreground">{t("You're {d} from this day's route.", { d: dist(progress!.offRouteKm, 0) })}</p>
      )}
      {gps !== 'ok' && (
        <p className="text-[11px] text-muted-foreground">
          {gps === 'waiting' ? t('Waiting for GPS…') : gps === 'denied' ? t('Location is blocked: allow it in the browser settings to see your position.') : t('Location is not available on this device.')}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        <a href={googleMapsUrl(path, travelMode, progress && !offRoute && !far ? position : undefined)} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700">
          <Navigation size={13} /> <span><span className="hidden min-[430px]:inline">Google </span>Maps</span>
        </a>
        <a href={wazeUrl(path)} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-md border border-emerald-200 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-50">
          Waze
        </a>
        <button onClick={() => onExportGpx(dayIndex)} title={t('For OsmAnd, Garmin, Kurviger, Calimoto…')}
          className="inline-flex items-center gap-1 rounded-md border border-emerald-200 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-50">
          <Download size={13} /> GPX
        </button>
        {canSpeak() && (
          <button onClick={toggleVoice} aria-pressed={voice} title={t('Spoken turn-by-turn directions')}
            className={cn('inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-semibold',
              voice ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-emerald-200 text-emerald-800 hover:bg-emerald-50')}>
            {voice ? <Volume2 size={13} /> : <VolumeX size={13} />} {t('Voice')}
          </button>
        )}
        <button onClick={() => onFollowChange(!follow)} aria-pressed={follow} aria-label={t('Follow me')} title={t('Follow me')}
          className={cn('ml-auto inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-semibold',
            follow ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 text-slate-700 hover:bg-slate-50')}>
          <Crosshair size={13} /> <span className="hidden min-[430px]:inline">{t('Follow me')}</span>
        </button>
      </div>
      <InstallHint dismissible />
      {awake && <p className="flex items-center gap-1 text-[10px] text-muted-foreground"><Sun size={11} /> {t('Screen stays on while riding')}</p>}
    </div>
  );
};

export default RideMode;
