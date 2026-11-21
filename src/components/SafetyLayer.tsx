// Overland safety informer on the Inspiration map: what is happening now, placed as precisely as the sources allow.
// Advice areas (where the UK advises against travel), country advice (UK and US, newest first), incidents reported
// in the news in the last 24 hours (GDELT) and natural hazards (GDACS). Data from /api/safety (incidents and hazards
// refreshed every 3 hours, advice every 12), or the copy saved with the app. See server/safety.ts.
import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import { createRoot, Root } from 'react-dom/client';
import { AlertTriangle, ExternalLink, Flame, MapPin, ShieldAlert, X } from 'lucide-react';
import { useSettings } from '../lib/settings';
import { cn } from '../lib/utils';
import type { SafetyArea, SafetyCountry, SafetyData, SafetyEvent, SafetyIncident } from '../../server/safety';

export const LEVEL_COLORS = ['', '#16a34a', '#eab308', '#f97316', '#dc2626'] as const;
const LEVEL_WORDS = ['', 'Normal precautions', 'Increased caution', 'Reconsider travel / avoid parts', 'Do not travel'] as const;
const INCIDENT = '#7c3aed', HAZARD = '#7c2d12', RECENT = '#111827';

let cached: Promise<SafetyData> | null = null;
export function loadSafety(): Promise<SafetyData> {
  cached ??= fetch('/api/safety')
    .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
    .catch(() => fetch('/safety/latest.json').then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status))))))
    .catch(err => { cached = null; throw err; });
  return cached;
}

function useDate() {
  const { locale } = useSettings();
  return (iso: string) => {
    const d = iso ? new Date(/^\d{14}$/.test(iso) ? `${iso.slice(0, 4)}-${iso.slice(4, 6)}-${iso.slice(6, 8)}T${iso.slice(8, 10)}:${iso.slice(10, 12)}:00Z` : iso) : null;
    return d && !isNaN(+d) ? d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  };
}
const Link: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-emerald-800 hover:underline">{children}<ExternalLink size={11} /></a>
);

const CountryCard: React.FC<{ c: SafetyCountry }> = ({ c }) => {
  const { t } = useSettings();
  const date = useDate();
  return (
    <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1 text-xs text-slate-700">
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: LEVEL_COLORS[c.level] }} />
        <p className="text-sm font-bold text-slate-900">{c.name}</p>
        {c.region && <span className="ml-auto text-[10px] font-semibold uppercase text-slate-500">{t(c.region)}</span>}
      </div>
      <p className="font-semibold" style={{ color: LEVEL_COLORS[c.level] }}>{t(LEVEL_WORDS[c.level])}</p>
      {c.areas > 0 && <p className="text-[11px] text-slate-500">{t('{n} specific areas are marked on the map.', { n: c.areas })}</p>}
      {/* Newest report first. */}
      {c.reports.map((r, i) => (
        <div key={i} className="rounded border border-slate-200 p-2">
          <p className="text-[10px] font-bold uppercase text-slate-500">{t(r.source === 'UK' ? 'UK Foreign Office' : 'US State Department')} · {date(r.updated)}</p>
          <p className="font-semibold">{r.source === 'UK' ? t(r.headline) : r.headline}</p>
          {r.latest && <p className="mt-1"><span className="font-semibold">{t('Latest update')}:</span> {r.latest}</p>}
          {r.summary && <p className="mt-1 text-slate-600">{r.summary}</p>}
          <p className="mt-1"><Link href={r.url}>{t(r.source === 'UK' ? 'Read the full advice' : 'Read the full advisory')}</Link></p>
        </div>
      ))}
    </div>
  );
};

const AreaCard: React.FC<{ a: SafetyArea; c?: SafetyCountry }> = ({ a, c }) => {
  const { t } = useSettings();
  const date = useDate();
  return (
    <div className="max-h-[320px] space-y-1.5 overflow-y-auto pr-1 text-xs text-slate-700">
      <p className="flex items-center gap-1.5 text-sm font-bold text-slate-900"><MapPin size={14} style={{ color: LEVEL_COLORS[a.level] }} />{a.name}</p>
      <p className="text-[10px] font-bold uppercase text-slate-500">{a.country} · {t('UK Foreign Office')} · {date(a.updated)}</p>
      <p className="font-semibold" style={{ color: LEVEL_COLORS[a.level] }}>{t(a.level === 4 ? 'Advises against all travel here' : 'Advises against all but essential travel here')}</p>
      {a.note && <p>{a.note}</p>}
      <p className="text-[10.5px] text-slate-500">{t('Placed from the advice text: the area is approximate.')}</p>
      <p><Link href={a.url}>{t('Read the full advice')}</Link></p>
      {c && <details className="pt-1"><summary className="cursor-pointer text-[11px] font-semibold text-slate-600">{t('Advice for the whole of {country}', { country: c.name })}</summary><div className="mt-1"><CountryCard c={c} /></div></details>}
    </div>
  );
};

const IncidentCard: React.FC<{ e: SafetyIncident }> = ({ e }) => {
  const { t } = useSettings();
  const date = useDate();
  return (
    <div className="max-h-[320px] space-y-1.5 overflow-y-auto pr-1 text-xs text-slate-700">
      <p className="flex items-center gap-1.5 text-sm font-bold text-slate-900"><Flame size={14} style={{ color: INCIDENT }} />{t(e.kind)}</p>
      <p className="text-[10px] font-bold uppercase" style={{ color: INCIDENT }}>{e.place}, {e.country} · {date(e.last)}</p>
      <p>{t('{n} news reports in the last 24 hours.', { n: e.sources })}</p>
      <ul className="space-y-0.5">{e.links.map(l => <li key={l.url}><a href={l.url} target="_blank" rel="noopener noreferrer" className="text-emerald-800 hover:underline">{l.title}</a></li>)}</ul>
      <p className="text-[10.5px] text-slate-500">{t('Read automatically from news reports (GDELT): it can be wrong; check the reports.')}</p>
    </div>
  );
};

const EventCard: React.FC<{ e: SafetyEvent }> = ({ e }) => {
  const { t } = useSettings();
  const date = useDate();
  return (
    <div className="space-y-1 text-xs text-slate-700">
      <p className="flex items-center gap-1.5 text-sm font-bold text-slate-900"><AlertTriangle size={14} style={{ color: e.level === 'Red' ? '#dc2626' : '#f97316' }} />{t(e.kind)}</p>
      <p className="text-[10px] font-bold uppercase" style={{ color: e.level === 'Red' ? '#dc2626' : '#f97316' }}>{t(e.level === 'Red' ? 'Red alert' : 'Orange alert')} · GDACS</p>
      <p>{e.name}</p>
      <p className="text-slate-500">{date(e.from)} – {date(e.to)}</p>
      <Link href={e.url}>{t('GDACS report')}</Link>
    </div>
  );
};

/** The toggle button, the legend and the pins. */
/** The button that turns the layer on and off (placed by the map view, next to "Add your journey"). */
export const SafetyButton: React.FC<{ on: boolean; onToggle: () => void }> = ({ on, onToggle }) => {
  const { t } = useSettings();
  return (
    <button onClick={onToggle} aria-pressed={on}
      className={cn('flex w-full items-center justify-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-bold uppercase tracking-wide shadow',
        on ? 'border-red-700 bg-red-700 text-white' : 'border-red-700 bg-white text-red-800 hover:bg-red-50')}>
      <ShieldAlert size={13} />{t('Overland safety')}
    </button>
  );
};

/** The legend and the pins, while `on`. */
export const SafetyLayer: React.FC<{ map: maplibregl.Map | null; ready: boolean; on: boolean; setOn: (on: boolean) => void }> = ({ map, ready, on, setOn }) => {
  const { t, locale } = useSettings();
  const [data, setData] = useState<SafetyData | null>(null);
  const [error, setError] = useState(false);
  const markers = useRef<maplibregl.Marker[]>([]);
  const popup = useRef<{ p: maplibregl.Popup; root: Root } | null>(null);

  useEffect(() => {
    if (!on || data) return;
    loadSafety().then(setData).catch(() => setError(true));
  }, [on, data]);

  useEffect(() => {
    markers.current.forEach(m => m.remove());
    markers.current = [];
    popup.current?.p.remove();
    // The journeys' heatmap would hide the pins: off while they show.
    if (ready && map?.getLayer('heat')) map.setLayoutProperty('heat', 'visibility', on ? 'none' : 'visible');
    if (!on || !ready || !map || !data) return;
    const open = (at: [number, number], node: React.ReactNode) => {
      popup.current?.p.remove();
      const el = document.createElement('div');
      const root = createRoot(el);
      root.render(node);
      const p = new maplibregl.Popup({ offset: 12, maxWidth: '320px', focusAfterOpen: false }).setLngLat([at[1], at[0]]).setDOMContent(el).addTo(map);
      p.on('close', () => setTimeout(() => root.unmount()));
      popup.current = { p, root };
    };
    // Drawn as map layers (not HTML markers) so the globe hides the pins on its far side.
    const point = (at: [number, number], props: Record<string, unknown>) => ({ type: 'Feature' as const, properties: props, geometry: { type: 'Point' as const, coordinates: [at[1], at[0]] } });
    // Countries only when there is something to say and nothing more precise; the most important pins on top.
    const r = [0, 6, 8, 9, 10];
    const fc = {
      type: 'FeatureCollection' as const,
      features: [
        ...data.countries.map((c, i) => ({ c, i })).filter(({ c }) => (c.level >= 2 || c.recent) && !c.areas)
          .map(({ c, i }) => point(c.at, { kind: 'country', i, z: c.level, label: String(c.level), color: LEVEL_COLORS[c.level], r: r[c.level], stroke: c.recent ? RECENT : '#ffffff', sw: c.recent ? 3 : 2 })),
        ...data.areas.map((a, i) => point(a.at, { kind: 'area', i, z: a.level + 0.5, label: '', color: LEVEL_COLORS[a.level], r: 7, stroke: '#ffffff', sw: 2.5 })),
        ...data.incidents.map((e, i) => point(e.at, { kind: 'incident', i, z: 5, label: String(e.sources), color: INCIDENT, r: Math.min(12, 6 + Math.sqrt(e.sources)), stroke: '#ffffff', sw: 2 })),
        ...data.events.map((e, i) => point(e.at, { kind: 'event', i, z: 6, label: '!', color: HAZARD, r: e.level === 'Red' ? 10 : 8, stroke: e.level === 'Red' ? '#fecaca' : '#ffffff', sw: 2 })),
      ],
    };
    if (map.getSource('safety')) (map.getSource('safety') as maplibregl.GeoJSONSource).setData(fc);
    else {
      map.addSource('safety', { type: 'geojson', data: fc });
      map.addLayer({ id: 'safety-dot', type: 'circle', source: 'safety', layout: { 'circle-sort-key': ['get', 'z'] }, paint: {
        'circle-radius': ['get', 'r'], 'circle-color': ['get', 'color'], 'circle-stroke-color': ['get', 'stroke'], 'circle-stroke-width': ['get', 'sw'], 'circle-pitch-alignment': 'viewport' } });
      map.addLayer({ id: 'safety-label', type: 'symbol', source: 'safety', layout: {
        'text-field': ['get', 'label'], 'text-font': ['Noto Sans Bold'], 'text-size': 11, 'text-allow-overlap': true, 'text-ignore-placement': true },
        paint: { 'text-color': '#ffffff' } });
    }
    for (const id of ['safety-dot', 'safety-label']) map.setLayoutProperty(id, 'visibility', 'visible');
    const onClick = (ev: maplibregl.MapLayerMouseEvent) => {
      const f = ev.features?.[0];
      if (!f) return;
      const { kind, i } = f.properties as { kind: string; i: number };
      if (kind === 'country') open(data.countries[i].at, <CountryCard c={data.countries[i]} />);
      else if (kind === 'area') { const a = data.areas[i]; open(a.at, <AreaCard a={a} c={data.countries.find(c => c.name === a.country)} />); }
      else if (kind === 'incident') open(data.incidents[i].at, <IncidentCard e={data.incidents[i]} />);
      else open(data.events[i].at, <EventCard e={data.events[i]} />);
    };
    const enter = () => { map.getCanvas().style.cursor = 'pointer'; };
    const leave = () => { map.getCanvas().style.cursor = ''; };
    map.on('click', 'safety-dot', onClick);
    map.on('mouseenter', 'safety-dot', enter);
    map.on('mouseleave', 'safety-dot', leave);
    return () => {
      map.off('click', 'safety-dot', onClick);
      map.off('mouseenter', 'safety-dot', enter);
      map.off('mouseleave', 'safety-dot', leave);
      for (const id of ['safety-dot', 'safety-label']) if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', 'none');
    };
  }, [on, ready, map, data]);

  const updated = data ? new Date(data.updated).toLocaleString(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
  return (
    <>
      {on && (
        <div className="absolute bottom-[calc(50dvh+8px)] right-2.5 z-10 w-[230px] md:bottom-10 rounded-md border border-slate-300 bg-white/95 p-2 text-[10.5px] text-slate-600 shadow">
          <div className="mb-1 flex items-center justify-between">
            <p className="font-bold uppercase text-slate-800">{t('Overland safety')}</p>
            <button onClick={() => setOn(false)} aria-label={t('Close')} className="text-slate-400 hover:text-slate-700"><X size={13} /></button>
          </div>
          {([4, 3, 2, 1] as const).map(l => (
            <p key={l} className="flex items-center gap-1.5"><span className="flex h-3 w-3 items-center justify-center rounded-full text-[8px] font-extrabold text-white" style={{ background: LEVEL_COLORS[l] }}>{l}</span>{t(LEVEL_WORDS[l])}</p>
          ))}
          <p className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full border-2" style={{ background: LEVEL_COLORS[3], borderColor: RECENT }} />{t('Dark ring: advice changed in the last 2 weeks')}</p>
          <p className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full border-2 border-white shadow" style={{ background: LEVEL_COLORS[4] }} />{t('Area to avoid (from the UK advice)')}</p>
          <p className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full" style={{ background: INCIDENT }} />{t('Incidents in the news, last 24 h')}{data ? ` (${data.incidents.length})` : ''}</p>
          <p className="flex items-center gap-1.5"><span className="flex h-3 w-3 items-center justify-center rounded-full text-[8px] font-extrabold text-white" style={{ background: HAZARD }}>!</span>{t('Natural hazard (GDACS)')}{data ? ` (${data.events.length})` : ''}</p>
          {!data && !error && <p className="mt-1 text-slate-400">{t('Loading…')}</p>}
          {error && <p className="mt-1 text-red-700">{t('Couldn\'t load the safety data.')}</p>}
          {data && (
            <p className="mt-1 text-slate-400">
              {t('Updated {when}', { when: updated })} · {data.sources.map((s, i) => <React.Fragment key={s.url}>{i > 0 && ', '}<a href={s.url} target="_blank" rel="noopener noreferrer" className="underline">{s.label}</a></React.Fragment>)}
            </p>
          )}
          <p className="mt-1 text-slate-400">{t('A summary only: always read the official advice before you travel.')}</p>
        </div>
      )}
    </>
  );
};
