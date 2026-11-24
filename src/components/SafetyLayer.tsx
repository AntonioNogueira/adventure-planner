// Overland safety informer on the Inspiration map: what is happening now, placed as precisely as the sources allow.
// Advice areas (where the UK advises against travel), country advice (UK and US, newest first), incidents reported
// in the news in the last 24 hours (GDELT) and natural hazards (GDACS). Data from /api/safety (incidents and hazards
// refreshed every 3 hours, advice every 12), or the copy saved with the app. See server/safety.ts.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import { createRoot, Root } from 'react-dom/client';
import { AlertTriangle, ExternalLink, Flame, MapPin, ShieldAlert, X } from 'lucide-react';
import { useSettings } from '../lib/settings';
import { cn } from '../lib/utils';
import type { SafetyArea, SafetyCountry, SafetyData, SafetyEvent, SafetyIncident } from '../../server/safety';

export const LEVEL_COLORS = ['', '#16a34a', '#eab308', '#f97316', '#dc2626'] as const;
const LEVEL_WORDS = ['', 'Normal precautions', 'Increased caution', 'Reconsider travel / avoid parts', 'Do not travel'] as const;
const INCIDENT = '#7c3aed', HAZARD = '#7c2d12', RECENT = '#111827';

// The data, shared by the map layer and the list: fetched once, and fetched again a few times when the copy the
// server had was old (it rebuilds in the background after waking up, and the fresh data replaces the old here).
let current: SafetyData | null = null;
let failed = false;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();
const STALE = 6 * 3600e3;
const notify = () => listeners.forEach(l => l());
async function fetchSafety(fresh = false): Promise<SafetyData> {
  const r = await fetch(`/api/safety${fresh ? `?t=${Date.now()}` : ''}`).catch(() => null);
  if (r?.ok) return r.json();
  const s = await fetch('/safety/latest.json');
  if (!s.ok) throw new Error(String(s.status));
  return s.json();
}
function ensureSafety() {
  if (current || loading) return;
  loading = fetchSafety().then(d => {
    current = d; failed = false; notify();
    let tries = 0;
    const recheck = () => {
      if (!current || Date.now() - Date.parse(current.updated) < STALE || tries++ >= 6) return;
      setTimeout(() => fetchSafety(true).then(n => { if (Date.parse(n.updated) > Date.parse(current!.updated)) { current = n; notify(); } }).catch(() => undefined).finally(recheck), 45000);
    };
    recheck();
  }).catch(() => { failed = true; notify(); }).finally(() => { loading = null; });
}
export function loadSafety(): Promise<SafetyData> {
  ensureSafety();
  return current ? Promise.resolve(current) : (loading || Promise.resolve()).then(() => current || Promise.reject(new Error('unavailable')));
}
export function useSafetyData(on: boolean) {
  const [, tick] = useState(0);
  useEffect(() => {
    const l = () => tick(n => n + 1);
    listeners.add(l);
    if (on) ensureSafety();
    return () => { listeners.delete(l); };
  }, [on]);
  return { data: current, error: failed };
}
/** Opens a pin's card from outside the map (the list in the panel). */
export const openSafetyItem = (kind: string, i: number) => window.dispatchEvent(new CustomEvent('safety-open', { detail: { kind, i } }));

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
  const { data, error } = useSafetyData(on);
  const markers = useRef<maplibregl.Marker[]>([]);
  const popup = useRef<{ p: maplibregl.Popup; root: Root } | null>(null);

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
    const openItem = (kind: string, i: number) => {
      if (kind === 'country') open(data.countries[i].at, <CountryCard c={data.countries[i]} />);
      else if (kind === 'area') { const a = data.areas[i]; open(a.at, <AreaCard a={a} c={data.countries.find(c => c.name === a.country)} />); }
      else if (kind === 'incident') open(data.incidents[i].at, <IncidentCard e={data.incidents[i]} />);
      else open(data.events[i].at, <EventCard e={data.events[i]} />);
    };
    const onClick = (ev: maplibregl.MapLayerMouseEvent) => {
      const f = ev.features?.[0];
      if (!f) return;
      const { kind, i } = f.properties as { kind: string; i: number };
      openItem(kind, i);
    };
    const fromList = (ev: Event) => { const { kind, i } = (ev as CustomEvent).detail; openItem(kind, i); };
    window.addEventListener('safety-open', fromList);
    const enter = () => { map.getCanvas().style.cursor = 'pointer'; };
    const leave = () => { map.getCanvas().style.cursor = ''; };
    map.on('click', 'safety-dot', onClick);
    map.on('mouseenter', 'safety-dot', enter);
    map.on('mouseleave', 'safety-dot', leave);
    return () => {
      window.removeEventListener('safety-open', fromList);
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

/** The left panel while the safety layer is on: what is shown on the map, newest first, only what is in view. */
export const SafetyPanel: React.FC<{ map: maplibregl.Map | null; onClose: () => void }> = ({ map, onClose }) => {
  const { t, locale } = useSettings();
  const { data, error } = useSafetyData(true);
  const [view, setView] = useState<{ bounds: maplibregl.LngLatBounds | null; zoom: number }>({ bounds: null, zoom: 0 });
  useEffect(() => {
    if (!map) return;
    const update = () => setView({ bounds: map.getBounds(), zoom: map.getZoom() });
    update();
    map.on('moveend', update);
    return () => { map.off('moveend', update); };
  }, [map]);

  const items = useMemo(() => {
    if (!data) return [];
    const when = (s: string) => {
      const iso = /^\d{14}$/.test(s) ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T${s.slice(8, 10)}:${s.slice(10, 12)}:00Z` : s;
      const n = Date.parse(iso || '');
      return Number.isFinite(n) ? n : 0;
    };
    type Item = { kind: string; i: number; at: [number, number]; date: number; color: string; label: string; title: string; place: string; text: string };
    const list: Item[] = [
      ...data.events.map((e, i) => ({ kind: 'event', i, at: e.at, date: when(e.to || e.from), color: HAZARD, label: t(e.kind), title: e.name, place: '', text: t(e.level === 'Red' ? 'Red alert' : 'Orange alert') })),
      ...data.incidents.map((e, i) => ({ kind: 'incident', i, at: e.at, date: when(e.last), color: INCIDENT, label: t(e.kind), title: `${e.place}, ${e.country}`, place: '', text: t('{n} news reports in the last 24 hours.', { n: e.sources }) })),
      ...data.areas.map((a, i) => ({ kind: 'area', i, at: a.at, date: when(a.updated), color: LEVEL_COLORS[a.level], label: t('Area to avoid (from the UK advice)'), title: a.name, place: a.country, text: a.note })),
      ...data.countries.map((c, i) => ({ c, i })).filter(({ c }) => (c.level >= 2 || c.recent) && !c.areas).map(({ c, i }) => ({
        kind: 'country', i, at: c.at, date: when(c.reports[0]?.updated || ''), color: LEVEL_COLORS[c.level], label: t(LEVEL_WORDS[c.level]),
        title: c.name, place: '', text: c.reports.find(r => r.latest)?.latest || c.reports[0]?.headline || '',
      })),
    ];
    // Everything when the whole globe is in view; otherwise only what the map shows.
    const inView = (at: [number, number]) => !view.bounds || view.zoom < 2.2 || view.bounds.contains([at[1], at[0]]);
    return list.filter(x => inView(x.at)).sort((a, b) => b.date - a.date);
  }, [data, view, t]);

  const fmt = (n: number) => (n ? new Date(n).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }) : '');
  const go = (x: { kind: string; i: number; at: [number, number] }) => {
    if (map) map.easeTo({ center: [x.at[1], x.at[0]], zoom: Math.max(map.getZoom(), 4.5), duration: 800 });
    setTimeout(() => openSafetyItem(x.kind, x.i), 850);
  };
  return (
    <div className="space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-red-800"><ShieldAlert size={16} />{t('Overland safety')}</h2>
          <p className="mt-0.5 text-xs text-slate-600">{t('What is happening now in the area on the map, newest first. Move or zoom the map to see other places.')}</p>
          {data && <p className="text-[11px] text-slate-400">{t('{n} reports in view', { n: items.length })} · {t('Updated {when}', { when: new Date(data.updated).toLocaleString(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) })}</p>}
        </div>
        <button onClick={onClose} aria-label={t('Close')} className="rounded p-1 text-slate-500 hover:bg-slate-100"><X size={15} /></button>
      </div>
      {!data && !error && <p className="text-xs text-slate-500">{t('Loading…')}</p>}
      {error && <p className="text-xs text-red-700">{t('Couldn\'t load the safety data.')}</p>}
      {data && items.length === 0 && <p className="text-xs text-slate-500">{t('Nothing reported in this area right now.')}</p>}
      {items.slice(0, 200).map(x => (
        <button key={`${x.kind}-${x.i}`} onClick={() => go(x)}
          className="block w-full rounded-lg border border-slate-200 bg-white p-2.5 text-left shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: x.color }} />
            <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: x.color }}>{x.label}</span>
            <span className="ml-auto shrink-0 text-[10px] text-slate-400">{fmt(x.date)}</span>
          </div>
          <p className="mt-1 text-sm font-semibold leading-snug text-slate-900">{x.title}{x.place && <span className="font-normal text-slate-500"> · {x.place}</span>}</p>
          {x.text && <p className="mt-0.5 line-clamp-2 text-xs text-slate-600">{x.text}</p>}
        </button>
      ))}
      <p className="text-[10px] text-slate-400">{t('A summary only: always read the official advice before you travel.')}</p>
    </div>
  );
};
