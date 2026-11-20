// Overland safety informer on the Inspiration map: a pin per country on the demanding overland routes, coloured by
// the stricter of the UK and US travel advice, with the latest change and links to the official pages; plus current
// disaster alerts (GDACS). Data from /api/safety (refreshed on the server every 12 hours), or the copy saved with
// the app. See server/safety.ts.
import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import { createRoot, Root } from 'react-dom/client';
import { AlertTriangle, ExternalLink, ShieldAlert, X } from 'lucide-react';
import { useSettings } from '../lib/settings';
import { cn } from '../lib/utils';
import type { SafetyCountry, SafetyData, SafetyEvent } from '../../server/safety';

export const LEVEL_COLORS = ['', '#16a34a', '#eab308', '#f97316', '#dc2626'] as const;
const LEVEL_WORDS = ['', 'Normal precautions', 'Increased caution', 'Reconsider travel / avoid parts', 'Do not travel'] as const;

let cached: Promise<SafetyData> | null = null;
export function loadSafety(): Promise<SafetyData> {
  cached ??= fetch('/api/safety')
    .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
    .catch(() => fetch('/safety/latest.json').then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status))))))
    .catch(err => { cached = null; throw err; });
  return cached;
}

const CountryCard: React.FC<{ c: SafetyCountry }> = ({ c }) => {
  const { t, locale } = useSettings();
  const date = (iso: string) => (iso ? new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }) : '');
  return (
    <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1 text-xs text-slate-700">
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: LEVEL_COLORS[c.level] }} />
        <p className="text-sm font-bold text-slate-900">{c.name}</p>
        <span className="ml-auto text-[10px] font-semibold uppercase text-slate-500">{t(c.region)}</span>
      </div>
      <p className="font-semibold" style={{ color: LEVEL_COLORS[c.level] }}>{t(LEVEL_WORDS[c.level])}</p>
      {c.fcdo && (
        <div className="rounded border border-slate-200 p-2">
          <p className="text-[10px] font-bold uppercase text-slate-500">{t('UK Foreign Office')} · {date(c.fcdo.updated)}</p>
          <p className="font-semibold">{t(c.fcdo.advice)}</p>
          {c.fcdo.latest && <p className="mt-1"><span className="font-semibold">{t('Latest update')}:</span> {c.fcdo.latest}</p>}
          {c.fcdo.summary && <p className="mt-1 text-slate-600">{c.fcdo.summary}</p>}
          <a href={c.fcdo.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 font-semibold text-emerald-800 hover:underline">{t('Read the full advice')}<ExternalLink size={11} /></a>
        </div>
      )}
      {c.us && (
        <div className="rounded border border-slate-200 p-2">
          <p className="text-[10px] font-bold uppercase text-slate-500">{t('US State Department')} · {date(c.us.updated)}</p>
          <p className="font-semibold">{t('Level {n}', { n: c.us.level })}: {c.us.label}</p>
          {c.us.summary && <p className="mt-1 text-slate-600">{c.us.summary}</p>}
          <a href={c.us.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 font-semibold text-emerald-800 hover:underline">{t('Read the full advisory')}<ExternalLink size={11} /></a>
        </div>
      )}
    </div>
  );
};

const EventCard: React.FC<{ e: SafetyEvent }> = ({ e }) => {
  const { t, locale } = useSettings();
  const date = (iso: string) => (iso ? new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }) : '');
  return (
    <div className="space-y-1 text-xs text-slate-700">
      <p className="flex items-center gap-1.5 text-sm font-bold text-slate-900"><AlertTriangle size={14} style={{ color: e.level === 'Red' ? '#dc2626' : '#f97316' }} />{t(e.kind)}</p>
      <p className="text-[10px] font-bold uppercase" style={{ color: e.level === 'Red' ? '#dc2626' : '#f97316' }}>{t(e.level === 'Red' ? 'Red alert' : 'Orange alert')} · GDACS</p>
      <p>{e.name}</p>
      <p className="text-slate-500">{date(e.from)} – {date(e.to)}</p>
      <a href={e.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-emerald-800 hover:underline">{t('GDACS report')}<ExternalLink size={11} /></a>
    </div>
  );
};

/** The toggle button, the legend and the pins. */
export const SafetyLayer: React.FC<{ map: maplibregl.Map | null; ready: boolean }> = ({ map, ready }) => {
  const { t, locale } = useSettings();
  const [on, setOn] = useState(false);
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
    for (const c of data.countries) {
      const el = document.createElement('button');
      el.type = 'button';
      el.title = `${c.name}: ${LEVEL_WORDS[c.level]}`;
      el.setAttribute('aria-label', el.title);
      el.className = 'flex items-center justify-center rounded-full border-2 border-white shadow-md';
      Object.assign(el.style, { width: '20px', height: '20px', borderRadius: '50%', cursor: 'pointer', background: LEVEL_COLORS[c.level], color: '#fff', fontSize: '11px', fontWeight: '800' });
      el.textContent = String(c.level);
      el.addEventListener('click', ev => { ev.stopPropagation(); open(c.at, <CountryCard c={c} />); });
      markers.current.push(new maplibregl.Marker({ element: el }).setLngLat([c.at[1], c.at[0]]).addTo(map));
    }
    for (const e of data.events) {
      const el = document.createElement('button');
      el.type = 'button';
      el.title = `${e.kind}: ${e.name}`;
      el.setAttribute('aria-label', el.title);
      Object.assign(el.style, { width: '0', height: '0', borderLeft: '9px solid transparent', borderRight: '9px solid transparent', borderBottom: `16px solid ${e.level === 'Red' ? '#b91c1c' : '#ea580c'}`, filter: 'drop-shadow(0 1px 1px rgba(0,0,0,.5))', background: 'transparent' });
      el.addEventListener('click', ev => { ev.stopPropagation(); open(e.at, <EventCard e={e} />); });
      markers.current.push(new maplibregl.Marker({ element: el }).setLngLat([e.at[1], e.at[0]]).addTo(map));
    }
    return () => { markers.current.forEach(m => m.remove()); markers.current = []; };
  }, [on, ready, map, data]);

  const updated = data ? new Date(data.updated).toLocaleString(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
  return (
    <>
      <button onClick={() => setOn(v => !v)} aria-pressed={on}
        className={cn('absolute right-2.5 top-[114px] z-10 inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10.5px] font-bold uppercase tracking-wide shadow',
          on ? 'border-red-700 bg-red-700 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-red-50')}>
        <ShieldAlert size={13} />{t('Overland safety')}
      </button>
      {on && (
        <div className="absolute right-2.5 top-[146px] z-10 w-[230px] rounded-md border border-slate-300 bg-white/95 p-2 text-[10.5px] text-slate-600 shadow">
          <div className="mb-1 flex items-center justify-between">
            <p className="font-bold uppercase text-slate-800">{t('Travel advice')}</p>
            <button onClick={() => setOn(false)} aria-label={t('Close')} className="text-slate-400 hover:text-slate-700"><X size={13} /></button>
          </div>
          {([4, 3, 2, 1] as const).map(l => (
            <p key={l} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: LEVEL_COLORS[l] }} />{t(LEVEL_WORDS[l])}</p>
          ))}
          <p className="mt-0.5 flex items-center gap-1.5"><span style={{ width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderBottom: '9px solid #ea580c' }} />{t('Disaster alert (GDACS)')}</p>
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
