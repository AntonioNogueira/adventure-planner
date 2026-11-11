import React, { useEffect, useState } from 'react';
import { CalendarDays, Map as MapIcon, Mountain, Download, BedDouble, Plus, X, AlertTriangle, Wallet, Share2 } from 'lucide-react';
import { canSendFiles } from '../lib/gpx';
import { RouteInfo } from '../types';
import { ScheduleDay, BookingWarning, formatDate } from '../lib/schedule';
import { forecastFor, describeWeather, WeatherResult } from '../lib/weather';
import { cn } from '../lib/utils';
import { useSettings } from '../lib/settings';

interface ItineraryProps {
  routeInfo: RouteInfo;
  schedule: ScheduleDay[];
  startDate: string;
  onStartDateChange: (date: string) => void;
  onRestDaysChange: (stopIndex: number, restDays: number) => void;
  onExportGpx: (legIndex: number | null) => void;
  warnings: BookingWarning[];
  costs: Record<string, number>;
}

/** Elevation profile as a tiny SVG area chart. */
const Sparkline: React.FC<{ values: number[] }> = ({ values }) => {
  const { t, elev } = useSettings();
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 20);
  const w = 120;
  const h = 24;
  const pts = values.map((v, i) => `${((i / (values.length - 1)) * w).toFixed(1)},${(h - ((v - min) / range) * (h - 2) - 1).toFixed(1)}`);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-6 w-28 shrink-0" aria-label={t('Elevation {range}', { range: `${elev(min)}–${elev(max)}` })}>
      <title>{t('Elevation {range}', { range: `${elev(min)}–${elev(max)}` })}</title>
      <polygon points={`0,${h} ${pts.join(' ')} ${w},${h}`} fill="#c9cda7" />
      <polyline points={pts.join(' ')} fill="none" stroke="#3f5d45" strokeWidth="1.5" />
    </svg>
  );
};

const WeatherChip: React.FC<{ at?: { lat: number; lng: number }; date?: string }> = ({ at, date }) => {
  const { t, speed, settings } = useSettings();
  const [result, setResult] = useState<WeatherResult | null>(null);
  useEffect(() => {
    let live = true;
    setResult(null);
    if (at && date) forecastFor(at.lat, at.lng, date).then(r => { if (live) setResult(r); });
    return () => { live = false; };
  }, [at?.lat, at?.lng, date]);

  if (!at || !date || !result) return null;
  if (result.status === 'too-far') {
    return <span className="text-[11px] text-muted-foreground" title={t('Forecasts reach 16 days ahead')}>{t('Forecast from {date}', { date: formatDate(result.availableFrom) })}</span>;
  }
  if (result.status !== 'ok') return null;
  const { weather } = result;
  const { emoji, label } = describeWeather(weather.code);
  return (
    <span className="inline-flex items-center gap-1 rounded bg-sky-50 px-1.5 py-0.5 text-[11px] text-sky-900" title={t(label)}>
      <span>{emoji}</span>
      {settings.units === 'imperial' ? `${Math.round(weather.tempMax * 9 / 5 + 32)}°/${Math.round(weather.tempMin * 9 / 5 + 32)}°F` : `${weather.tempMax}°/${weather.tempMin}°`}
      {weather.rainChance != null && <span>· 💧{weather.rainChance}%</span>}
      <span>· 💨{speed(weather.windMax)}</span>
    </span>
  );
};

const Itinerary: React.FC<ItineraryProps> = ({
  routeInfo, schedule, startDate, onStartDateChange, onRestDaysChange, onExportGpx, warnings, costs,
}) => {
  const { t, dist, elev, localizeText } = useSettings();
  const legs = routeInfo.legs || [];
  const totalAscent = legs.reduce((sum, leg) => sum + (leg.ascent || 0), 0);
  const hasElevation = legs.some(leg => leg.ascent != null);
  const costEntries = Object.entries(costs);
  const stopName = (i: number) => routeInfo.waypoints[i]?.location || t('Stop {n}', { n: i + 1 });
  const totalKm = legs.reduce((sum, leg) => sum + (leg.distanceMeters || 0), 0) / 1000;

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-semibold">
        <span className="flex items-center gap-1.5 text-emerald-700"><MapIcon size={16} />{totalKm ? dist(totalKm, 0) : localizeText(routeInfo.distance)}</span>
        {hasElevation && <span className="flex items-center gap-1.5 text-muted-foreground"><Mountain size={16} />↑ {elev(totalAscent)}</span>}
        <button
          onClick={() => onExportGpx(null)}
          className="ml-auto inline-flex items-center gap-1 rounded-md border border-emerald-200 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
          title={canSendFiles() ? t('Send the whole trip (one track per day) to Organic Maps, OsmAnd, Garmin, Komoot…') : t('Download the whole trip as GPX (one track per day) for Garmin, Wahoo, Komoot…')}
        >
          {canSendFiles() ? <><Share2 size={12} /> {t('Send to app')}</> : <><Download size={12} /> GPX</>}
        </button>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        <label htmlFor="start-date" className="font-semibold text-emerald-800">{t('Start date')}</label>
        <input
          id="start-date"
          type="date"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          className="h-8 rounded-md border border-emerald-100 bg-background px-2 text-xs"
        />
        {!startDate && <span className="text-muted-foreground">{t('Add one for dates, weather and booking checks.')}</span>}
      </div>

      {costEntries.length > 0 && (
        <p className="mb-3 flex items-center gap-1.5 text-xs text-violet-800">
          <Wallet size={13} /> {t('Booked so far:')} <b>{costEntries.map(([cur, total]) => `${total.toFixed(2)} ${cur}`).join(' + ')}</b>
        </p>
      )}

      {warnings.length > 0 && (
        <ul className="mb-3 space-y-1">
          {warnings.map((w, i) => (
            <li key={i} className="flex items-start gap-1.5 rounded-md bg-amber-50 p-2 text-xs text-amber-900">
              <AlertTriangle size={13} className="mt-0.5 shrink-0" />{w.message}
            </li>
          ))}
        </ul>
      )}

      <ol className="space-y-2">
        {schedule.map((day, n) => {
          if (day.kind === 'rest') {
            const stopIndex = day.stopIndex!;
            return (
              <li key={`rest-${n}`} className="flex items-start gap-3 rounded-md bg-emerald-50/60 p-1.5 text-xs">
                <span className="mt-0.5 flex shrink-0 flex-col items-center rounded bg-white px-1.5 py-0.5 font-bold text-emerald-800">
                  <span className="flex items-center gap-1"><BedDouble size={11} />{t('Day {n}', { n: n + 1 })}</span>
                  <span className="text-[10px] font-medium">{t('Rest')}</span>
                </span>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="font-medium">{t('Rest day in {place}', { place: stopName(stopIndex) })}{day.date && <span className="font-normal text-muted-foreground"> · {formatDate(day.date)}</span>}</p>
                  <WeatherChip at={legs[stopIndex]?.end} date={day.date} />
                </div>
                <button
                  onClick={() => onRestDaysChange(stopIndex, (routeInfo.waypoints[stopIndex]?.restDays || 1) - 1)}
                  className="rounded p-0.5 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                  title={t('Remove this rest day')}
                  aria-label={t('Remove rest day')}
                >
                  <X size={13} />
                </button>
              </li>
            );
          }
          const i = day.legIndex!;
          const leg = legs[i];
          if (!leg) return null;
          const endsAtStop = i < legs.length - 1;
          return (
            <li key={`ride-${i}`} className="group flex items-start gap-3 text-xs">
              <span className="mt-0.5 flex shrink-0 flex-col items-center rounded bg-emerald-100 px-1.5 py-0.5 font-bold text-emerald-800">
                <span className="flex items-center gap-1"><CalendarDays size={11} />{t('Day {n}', { n: n + 1 })}</span>
                {day.date && <span className="text-[10px] font-medium">{formatDate(day.date)}</span>}
              </span>
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="truncate font-medium" title={`${leg.from} → ${leg.to}`}>{leg.from} → {leg.to}</p>
                <p className="text-muted-foreground">
                  {leg.ferryKm
                    ? <>{t('{riding} riding + ⛴ {ferry} ferry', { riding: dist((leg.distanceMeters || 0) / 1000 - leg.ferryKm, 0), ferry: dist(leg.ferryKm, 0) })}</>
                    : leg.distanceMeters ? dist(leg.distanceMeters / 1000) : localizeText(leg.distance)} · {leg.duration}
                  {leg.ascent != null && <> · ↑ {elev(leg.ascent)} ↓ {elev(leg.descent || 0)}</>}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {leg.profile && <Sparkline values={leg.profile} />}
                  <WeatherChip at={leg.end} date={day.date} />
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <button
                  onClick={() => onExportGpx(i)}
                  className="rounded p-1 text-muted-foreground hover:bg-emerald-50 hover:text-emerald-700"
                  title={t('Download day {n} as GPX', { n: n + 1 })}
                  aria-label={t('Download day {n} as GPX', { n: n + 1 })}
                >
                  <Download size={13} />
                </button>
                {endsAtStop && (
                  <button
                    onClick={() => onRestDaysChange(i, (routeInfo.waypoints[i]?.restDays || 0) + 1)}
                    className={cn('inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-medium text-emerald-700 hover:bg-emerald-50', 'md:opacity-0 md:group-hover:opacity-100')}
                    title={t('Add a rest day in {place}', { place: leg.to })}
                  >
                    <Plus size={10} /> {t('rest day')}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

export default Itinerary;
