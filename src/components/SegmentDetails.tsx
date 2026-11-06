import React, { useEffect, useState } from 'react';
import { Mountain, Gauge, Route as RouteIcon, Loader2, Ship } from 'lucide-react';
import { RoutedLeg } from '../lib/routing';
import { elevationsAlong } from '../lib/elevation';
import { terrainStats, gradients, gradientColor, roadSummary, averageSpeed } from '../lib/terrain';

interface SegmentDetailsProps {
  label: string;
  leg: RoutedLeg;
  travelMode: string;
}

/** Elevation profile coloured by gradient, with distance and height axes. */
const ProfileChart: React.FC<{ elevations: number[]; totalKm: number }> = ({ elevations, totalKm }) => {
  const w = 320, h = 120, left = 34, bottom = 18, top = 6;
  const min = Math.min(...elevations);
  const max = Math.max(...elevations);
  const range = Math.max(max - min, 50);
  const x = (i: number) => left + (i / (elevations.length - 1)) * (w - left - 4);
  const y = (e: number) => top + (1 - (e - min) / range) * (h - top - bottom);
  const grades = gradients(elevations, totalKm);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => ({ f, km: Math.round(totalKm * f) }));
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label={`Elevation profile from ${Math.round(min)} to ${Math.round(max)} m`}>
      {grades.map((g, i) => (
        <polygon
          key={i}
          points={`${x(i)},${h - bottom} ${x(i)},${y(elevations[i])} ${x(i + 1)},${y(elevations[i + 1])} ${x(i + 1)},${h - bottom}`}
          fill={gradientColor(g)}
          opacity={0.85}
        />
      ))}
      <line x1={left} y1={h - bottom} x2={w - 4} y2={h - bottom} stroke="#94a3b8" strokeWidth="0.5" />
      <text x={left - 4} y={y(max) + 3} textAnchor="end" fontSize="9" fill="#475569">{Math.round(max)} m</text>
      <text x={left - 4} y={y(min)} textAnchor="end" fontSize="9" fill="#475569">{Math.round(min)} m</text>
      {ticks.map(t => (
        <text key={t.f} x={left + t.f * (w - left - 4)} y={h - 5} textAnchor={t.f === 0 ? 'start' : t.f === 1 ? 'end' : 'middle'} fontSize="9" fill="#475569">{t.km} km</text>
      ))}
    </svg>
  );
};

const Legend = () => (
  <div className="flex flex-wrap gap-2 text-[10px] text-slate-600">
    {[['#10b981', '0–3%'], ['#eab308', '3–6%'], ['#f97316', '6–10%'], ['#dc2626', '>10%']].map(([c, l]) => (
      <span key={l} className="flex items-center gap-1"><span className="h-2 w-3 rounded-sm" style={{ background: c }} />{l}</span>
    ))}
  </div>
);

const Terrain: React.FC<{ leg: RoutedLeg }> = ({ leg }) => {
  const [elevations, setElevations] = useState<number[] | null | undefined>(undefined);
  const km = leg.distanceMeters / 1000;
  useEffect(() => {
    let live = true;
    elevationsAlong(leg.path, 200).then(e => { if (live) setElevations(e); });
    return () => { live = false; };
  }, [leg]);

  if (elevations === undefined) return <p className="flex items-center gap-1.5 text-xs text-slate-500"><Loader2 size={12} className="animate-spin" />Loading terrain…</p>;
  if (!elevations) return <p className="text-xs text-slate-500">Elevation data isn't available for this segment.</p>;
  const stats = terrainStats(elevations, km);
  return (
    <div className="space-y-1.5">
      <ProfileChart elevations={elevations} totalKm={km} />
      <Legend />
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs text-slate-700">
        <span>↑ {stats.ascent} m · ↓ {stats.descent} m</span>
        <span>Highest {stats.highest} m</span>
        <span>Steepest km {stats.steepestPct}%</span>
        <span>{stats.kmOver6} km above 6%</span>
      </div>
    </div>
  );
};

const SegmentDetails: React.FC<SegmentDetailsProps> = ({ label, leg, travelMode }) => {
  const [showTerrain, setShowTerrain] = useState(false);
  const motor = travelMode === 'DRIVING';
  const roads = roadSummary(leg.steps);
  const speed = averageSpeed(leg.distanceMeters - roads.ferryKm * 1000, leg.durationSeconds);

  return (
    <div className="w-[340px] max-w-[80vw] space-y-2 p-1 font-sans">
      <p className="text-sm font-semibold text-slate-900">{label}</p>
      {roads.ferryKm > 0 && (
        <p className="flex items-center gap-1 text-xs text-sky-800"><Ship size={12} />Includes {roads.ferryKm} km by ferry</p>
      )}

      {motor ? (
        <>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs text-slate-700">
            <span className="flex items-center gap-1"><Gauge size={12} />Average {speed} km/h</span>
            <span className="flex items-center gap-1"><RouteIcon size={12} />{roads.motorwayPct}% motorway</span>
          </div>
          {roads.roads.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Main roads</p>
              <ul className="text-xs text-slate-700">
                {roads.roads.map(r => (
                  <li key={r.road} className="flex justify-between gap-2"><span>{r.road}</span><span className="text-slate-500">{r.km} km</span></li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-[10px] text-slate-400">Speed limits and road surface aren't available from Google Maps.</p>
          {showTerrain ? <Terrain leg={leg} /> : (
            <button onClick={() => setShowTerrain(true)} className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline">
              <Mountain size={12} /> Show terrain profile (off-road / mountain days)
            </button>
          )}
        </>
      ) : (
        <Terrain leg={leg} />
      )}
    </div>
  );
};

export default SegmentDetails;
