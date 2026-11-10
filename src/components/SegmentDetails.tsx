import React, { useEffect, useState } from 'react';
import { Mountain, Gauge, Route as RouteIcon, Loader2, Ship } from 'lucide-react';
import { RoutedLeg } from '../lib/routing';
import { elevationsAlong } from '../lib/elevation';
import { terrainStats, gradients, gradientColor, roadSummary, averageSpeed } from '../lib/terrain';
import { roadData, RoadData, SURFACES, ROAD_CLASS_LABELS, SurfaceRun } from '../lib/osmRoads';
import { useSettings } from '../lib/settings';
import { cn } from '../lib/utils';

interface SegmentDetailsProps {
  label: string;
  leg: RoutedLeg;
  travelMode: string;
  /** Shown in the map's banner (full width) instead of a popup. */
  wide?: boolean;
}

// Shared horizontal geometry, so the surface strip lines up with the elevation profile.
const CHART_W = 320, CHART_LEFT = 34, CHART_RIGHT = 4;
const chartX = (fraction: number) => CHART_LEFT + fraction * (CHART_W - CHART_LEFT - CHART_RIGHT);

/** Road data for a segment, shared by the profile and the road details (requests are cached). */
function useRoadData(leg: RoutedLeg, travelMode: string) {
  const [data, setData] = useState<RoadData | null | undefined>(undefined);
  useEffect(() => {
    let live = true;
    roadData(leg.path, travelMode).then(d => { if (live) setData(d); });
    return () => { live = false; };
  }, [leg, travelMode]);
  return data;
}

/** The surface along the segment, start to finish, drawn on the profile's distance scale. */
const SurfaceStrip: React.FC<{ runs: SurfaceRun[]; totalKm: number; axis?: boolean }> = ({ runs, totalKm, axis }) => {
  const { t, toDist, distUnit } = useSettings();
  const end = runs.length ? runs[runs.length - 1].toKm : 0;
  if (!end) return null;
  const h = axis ? 26 : 12;
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  return (
    <svg viewBox={`0 0 ${CHART_W} ${h}`} className="w-full" role="img" aria-label={t('Road surface along the segment')}>
      <text x={CHART_LEFT - 4} y={9} textAnchor="end" fontSize="8" fill="#475569">{t('Surface')}</text>
      {runs.map((r, i) => (
        <rect key={i} x={chartX(r.fromKm / end)} y={2} width={Math.max(chartX(r.toKm / end) - chartX(r.fromKm / end), 0.6)} height={9}
          fill={SURFACES[r.group].color}>
          <title>{`${t(SURFACES[r.group].label)}: ${distUnit} ${Math.round(toDist(r.fromKm / end * totalKm))}–${Math.round(toDist(r.toKm / end * totalKm))}`}</title>
        </rect>
      ))}
      {axis && ticks.map(f => (
        <text key={f} x={chartX(f)} y={h - 4} textAnchor={f === 0 ? 'start' : f === 1 ? 'end' : 'middle'} fontSize="9" fill="#475569">{Math.round(toDist(totalKm * f))} {distUnit}</text>
      ))}
    </svg>
  );
};

/** Elevation profile coloured by gradient, with distance and height axes. */
// `axis: false` leaves the km labels to the surface strip drawn right below.
const ProfileChart: React.FC<{ elevations: number[]; totalKm: number; axis?: boolean }> = ({ elevations, totalKm, axis = true }) => {
  const { t, toDist, distUnit, elev } = useSettings();
  const w = CHART_W, left = CHART_LEFT, bottom = axis ? 18 : 2, top = 6, h = 102 + bottom;
  const min = Math.min(...elevations);
  const max = Math.max(...elevations);
  const range = Math.max(max - min, 50);
  const x = (i: number) => chartX(i / (elevations.length - 1));
  const y = (e: number) => top + (1 - (e - min) / range) * (h - top - bottom);
  const grades = gradients(elevations, totalKm);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => ({ f, km: Math.round(toDist(totalKm * f)) }));
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label={t('Elevation profile from {min} to {max}', { min: elev(min), max: elev(max) })}>
      {grades.map((g, i) => (
        <polygon
          key={i}
          points={`${x(i)},${h - bottom} ${x(i)},${y(elevations[i])} ${x(i + 1)},${y(elevations[i + 1])} ${x(i + 1)},${h - bottom}`}
          fill={gradientColor(g)}
          opacity={0.85}
        />
      ))}
      <line x1={left} y1={h - bottom} x2={w - 4} y2={h - bottom} stroke="#94a3b8" strokeWidth="0.5" />
      <text x={left - 4} y={y(max) + 3} textAnchor="end" fontSize="9" fill="#475569">{elev(max)}</text>
      <text x={left - 4} y={y(min)} textAnchor="end" fontSize="9" fill="#475569">{elev(min)}</text>
      {axis && ticks.map(t => (
        <text key={t.f} x={left + t.f * (w - left - 4)} y={h - 5} textAnchor={t.f === 0 ? 'start' : t.f === 1 ? 'end' : 'middle'} fontSize="9" fill="#475569">{t.km} {distUnit}</text>
      ))}
    </svg>
  );
};

const Legend = () => (
  <div className="flex flex-wrap gap-2 text-[10px] text-slate-600">
    {[['#6f8f5a', '0–3%'], ['#c9a227', '3–6%'], ['#c56a2c', '6–10%'], ['#9b2c22', '>10%']].map(([c, l]) => (
      <span key={l} className="flex items-center gap-1"><span className="h-2 w-3 rounded-sm" style={{ background: c }} />{l}</span>
    ))}
  </div>
);

const Terrain: React.FC<{ leg: RoutedLeg; travelMode: string }> = ({ leg, travelMode }) => {
  const { t, elev, dist } = useSettings();
  const road = useRoadData(leg, travelMode);
  const [elevations, setElevations] = useState<number[] | null | undefined>(undefined);
  const km = leg.distanceMeters / 1000;
  useEffect(() => {
    let live = true;
    elevationsAlong(leg.path, 200).then(e => { if (live) setElevations(e); });
    return () => { live = false; };
  }, [leg]);

  if (elevations === undefined) return <p className="flex items-center gap-1.5 text-xs text-slate-500"><Loader2 size={12} className="animate-spin" />{t('Loading terrain…')}</p>;
  if (!elevations) return (
    <div className="space-y-1">
      <p className="text-xs text-slate-500">{t("Elevation data isn't available for this segment.")}</p>
      {road && <SurfaceStrip runs={road.surfaceRuns} totalKm={km} axis />}
    </div>
  );
  const stats = terrainStats(elevations, km);
  return (
    <div className="space-y-1.5">
      <div>
        <ProfileChart elevations={elevations} totalKm={km} axis={!road?.surfaceRuns.length} />
        {road && <SurfaceStrip runs={road.surfaceRuns} totalKm={km} axis />}
      </div>
      <Legend />
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs text-slate-700">
        <span>↑ {elev(stats.ascent)} · ↓ {elev(stats.descent)}</span>
        <span>{t('Highest {h}', { h: elev(stats.highest) })}</span>
        <span>{t('Steepest km {pct}%', { pct: stats.steepestPct })}</span>
        <span>{t('{d} above 6%', { d: dist(stats.kmOver6) })}</span>
      </div>
    </div>
  );
};

/** A horizontal bar split into coloured parts, with a legend in km. */
const StackedBar: React.FC<{ parts: { label: string; km: number; color: string }[] }> = ({ parts }) => {
  const { dist } = useSettings();
  const total = parts.reduce((s, p) => s + p.km, 0) || 1;
  return (
    <div className="space-y-1">
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        {parts.map(p => <div key={p.label} style={{ width: `${(p.km / total) * 100}%`, background: p.color }} title={`${p.label}: ${dist(p.km)}`} />)}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-600">
        {parts.map(p => (
          <span key={p.label} className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: p.color }} />{p.label} {dist(p.km)}</span>
        ))}
      </div>
    </div>
  );
};

const SPEED_COLORS = ['#1e3a8a', '#2563eb', '#60a5fa', '#93c5fd', '#bfdbfe'];

/** Speed limits (moto/car), surface and road types along the segment, from OpenStreetMap. */
// `surfaceInProfile`: the strip is already under the terrain profile, so only the totals are listed here.
const OsmRoads: React.FC<{ leg: RoutedLeg; travelMode: string; surfaceInProfile?: boolean }> = ({ leg, travelMode, surfaceInProfile }) => {
  const data = useRoadData(leg, travelMode);
  const { t, dist, speed } = useSettings();

  if (data === undefined) return <p className="flex items-center gap-1.5 text-xs text-slate-500"><Loader2 size={12} className="animate-spin" />{t('Loading road data from OpenStreetMap…')}</p>;
  if (!data) return <p className="text-[11px] text-slate-400">{t("OpenStreetMap road data isn't available for this segment right now.")}</p>;

  const limits = data.speedLimits.filter(s => s.limit > 0).slice(0, 5);
  const unknown = data.speedLimits.find(s => s.limit === 0)?.km || 0;
  return (
    <div className="space-y-2">
      {travelMode === 'DRIVING' && limits.length > 0 && (
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{t('Speed limits')}</p>
          <StackedBar parts={limits.map((s, i) => ({ label: speed(s.limit), km: s.km, color: SPEED_COLORS[i] }))} />
          {unknown > 0.5 && <p className="text-[10px] text-slate-400">{t('{d} without a mapped limit.', { d: dist(unknown) })}</p>}
        </div>
      )}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{t('Surface')}</p>
        {!surfaceInProfile && <SurfaceStrip runs={data.surfaceRuns} totalKm={leg.distanceMeters / 1000} axis />}
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-600">
          {data.surfaces.map(s => (
            <span key={s.group} className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" style={{ background: SURFACES[s.group].color }} />{t(SURFACES[s.group].label)} {dist(s.km)}
            </span>
          ))}
        </div>
      </div>
      <p className="text-[11px] text-slate-600">
        <span className="font-semibold">{t('Roads:')} </span>
        {data.roadClasses.slice(0, 3).map(r => `${t(ROAD_CLASS_LABELS[r.roadClass] || r.roadClass)} ${dist(r.km)}`).join(' · ')}
      </p>
      <p className="text-[10px] text-slate-400">{t('Road data © OpenStreetMap contributors')}</p>
    </div>
  );
};

const SegmentDetails: React.FC<SegmentDetailsProps> = ({ label, leg, travelMode, wide }) => {
  const [showTerrain, setShowTerrain] = useState(false);
  const { t, dist, speed: fmtSpeed } = useSettings();
  const motor = travelMode === 'DRIVING';
  const roads = roadSummary(leg.steps);
  const speed = averageSpeed(leg.distanceMeters - roads.ferryKm * 1000, leg.durationSeconds);

  return (
    <div className={cn('space-y-2 font-sans', wide ? 'w-full pr-6' : 'w-[340px] max-w-[80vw] p-1')}>
      <p className="text-sm font-semibold text-slate-900">{label}</p>
      {roads.ferryKm > 0 && (
        <p className="flex items-center gap-1 text-xs text-sky-800"><Ship size={12} />{t('Includes {d} by ferry', { d: dist(roads.ferryKm) })}</p>
      )}

      <div className={wide ? 'grid gap-x-5 gap-y-2 md:grid-cols-2' : 'space-y-2'}>
      {motor ? (
        <>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs text-slate-700">
            <span className="flex items-center gap-1"><Gauge size={12} />{t('Average {s}', { s: fmtSpeed(speed) })}</span>
            <span className="flex items-center gap-1"><RouteIcon size={12} />{t('{pct}% motorway', { pct: roads.motorwayPct })}</span>
          </div>
          {roads.roads.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{t('Main roads')}</p>
              <ul className="text-xs text-slate-700">
                {roads.roads.map(r => (
                  <li key={r.road} className="flex justify-between gap-2"><span>{t(r.road)}</span><span className="text-slate-500">{dist(r.km)}</span></li>
                ))}
              </ul>
            </div>
          )}
          <OsmRoads leg={leg} travelMode={travelMode} surfaceInProfile={showTerrain} />
          {showTerrain ? <Terrain leg={leg} travelMode={travelMode} /> : (
            <button onClick={() => setShowTerrain(true)} className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline">
              <Mountain size={12} /> {t('Show terrain profile (off-road / mountain days)')}
            </button>
          )}
        </>
      ) : (
        <>
          <Terrain leg={leg} travelMode={travelMode} />
          <OsmRoads leg={leg} travelMode={travelMode} surfaceInProfile />
        </>
      )}
      </div>
    </div>
  );
};

export default SegmentDetails;
