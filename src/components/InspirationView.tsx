// The Inspiration map, open to everyone: famous journeys drawn on a world map. Pick one to follow it stop by stop
// (photo, story, how they travelled), then plan any stretch of it as your own trip.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import mapWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { createRoot, Root } from 'react-dom/client';
import { ArrowLeft, Bike, Compass, ExternalLink, Loader2, MapPinned, Sparkles, Trash2, Upload } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { checkAdmin, loadPublished, summarize, unpublishJourney } from '../lib/inspirationStore';
import ImportJourney from './ImportJourney';
import { TOPO_STYLE } from '../lib/mapStyle';
import { useSettings } from '../lib/settings';
import { Journey, JourneyStop, JourneySummary, LEG_WORDS, ON_ROAD, loadJourney, loadJourneys, sectionPrompt } from '../lib/inspiration';
import { cn } from '../lib/utils';

maplibregl.setWorkerUrl(mapWorkerUrl);

interface Props {
  /** "Plan this stretch": hands a request to the AI planner. */
  onPlan: (prompt: string) => void;
}

type Line = [number, number][];
const feature = (line: Line, properties: Record<string, unknown>) => ({
  type: 'Feature' as const, properties, geometry: { type: 'LineString' as const, coordinates: line.map(([lat, lng]) => [lng, lat]) },
});
const collection = (features: ReturnType<typeof feature>[]) => ({ type: 'FeatureCollection' as const, features });

/** A stop's balloon: photo with credit, where and when, the story, and "plan this stretch". */
const StopCard: React.FC<{ journey: Journey; index: number; onPlan: (prompt: string) => void }> = ({ journey, index, onPlan }) => {
  const { t } = useSettings();
  const stop = journey.stops[index];
  const next = journey.stops[index + 1];
  const nextByRoad = next && ON_ROAD.has(next.by || 'ride');
  return (
    <div className="w-[300px] max-w-[78vw] space-y-1.5 font-sans">
      {stop.photo && (
        <figure>
          <img src={stop.photo.url} alt={stop.name} loading="lazy" className="h-36 w-full rounded-md object-cover" />
          <figcaption className="mt-0.5 truncate text-[9px] text-slate-400">
            {t('Photo')}: {stop.photo.credit || 'Wikimedia Commons'}{stop.photo.license ? `, ${stop.photo.license}` : ''}
            {stop.photo.source && <> · <a href={stop.photo.source} target="_blank" rel="noopener noreferrer" className="underline">{t('source')}</a></>}
          </figcaption>
        </figure>
      )}
      <p className="text-[10.5px] font-bold uppercase tracking-wide" style={{ color: journey.color }}>
        {journey.title} · {index + 1}/{journey.stops.length}
      </p>
      <p className="text-sm font-semibold leading-tight text-slate-900">{stop.name}</p>
      {(stop.date || (stop.by && LEG_WORDS[stop.by])) && (
        <p className="text-[11px] text-slate-500">{[stop.date, stop.by && LEG_WORDS[stop.by] && t(`Arrived ${LEG_WORDS[stop.by]}`)].filter(Boolean).join(' · ')}</p>
      )}
      <p className="text-xs leading-relaxed text-slate-700">{stop.text}</p>
      {nextByRoad && (
        <button onClick={() => onPlan(sectionPrompt(journey, stop, next))}
          className="flex w-full items-center justify-center gap-1.5 rounded-md bg-emerald-700 px-2 py-1.5 text-xs font-bold text-white hover:bg-emerald-800">
          <MapPinned size={13} />{t('Plan {from} → {to} as my trip', { from: stop.name, to: next.name })}
        </button>
      )}
    </div>
  );
};

const InspirationView: React.FC<Props> = ({ onPlan }) => {
  const { t, dist } = useSettings();
  const [list, setList] = useState<JourneySummary[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [journey, setJourney] = useState<Journey | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  // Journeys published with the import tool, and whether this user may import (admins only).
  const [published, setPublished] = useState<Journey[]>([]);
  const [uid, setUid] = useState<string | null>(null);
  const [admin, setAdmin] = useState(false);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<Journey | null>(null);
  const shown = preview || journey;
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);
  const popup = useRef<{ popup: maplibregl.Popup; root: Root } | null>(null);
  const journeyRef = useRef<Journey | null>(null);
  const spinRef = useRef<() => void>(() => {});
  journeyRef.current = shown;
  const narrow = () => (container.current?.clientWidth || 1000) < 768;
  // The panel covers part of the map: keep the journey clear of it.
  const padding = () => (narrow()
    ? { top: 70, left: 30, right: 30, bottom: Math.round((container.current?.clientHeight || 800) * 0.5) }
    : { top: 90, left: 410, right: 60, bottom: 50 });

  useEffect(() => {
    loadJourneys().then(setList).catch(() => setFailed(true));
    loadPublished().then(setPublished);
    return onAuthStateChanged(auth, user => {
      setUid(user?.uid || null);
      if (user) checkAdmin(user.uid).then(setAdmin); else setAdmin(false);
    });
  }, []);
  // Famous journeys first, then those imported (newest first).
  const every = useMemo(() => [...(list || []), ...published.map(summarize)], [list, published]);
  // Filters: how they travelled, when, and words (title, people, vehicle, story).
  const [kind, setKind] = useState('');
  const [era, setEra] = useState('');
  const [words, setWords] = useState('');
  const all = useMemo(() => every.filter(j => {
    const year = Number(j.when.match(/\d{4}/)?.[0] || 0);
    if (kind && j.kind !== kind) return false;
    if (era === 'old' && !(year && year < 1990)) return false;
    if (era === 'new' && !(year >= 1990)) return false;
    const q = words.trim().toLowerCase();
    return !q || [j.title, j.who, j.vehicle, j.summary].join(' ').toLowerCase().includes(q);
  }), [every, kind, era, words]);

  const select = async (id: string) => {
    const mine = published.find(j => j.id === id);
    if (mine) { setJourney(mine); return; }
    setLoading(id);
    try { setJourney(await loadJourney(id)); } catch { setFailed(true); } finally { setLoading(null); }
  };
  const selectRef = useRef(select);
  selectRef.current = select;

  // The map, once.
  useEffect(() => {
    if (!container.current) return;
    const map = new maplibregl.Map({ container: container.current, style: TOPO_STYLE, center: [10, 25], zoom: narrow() ? 0.9 : 1.9, attributionControl: { compact: true } });
    // The globe sits beside the panel (desktop) or above the sheet (phones).
    map.setPadding(narrow() ? { top: 60, bottom: Math.round((container.current.clientHeight || 800) * 0.45), left: 0, right: 0 } : { left: 380, top: 40, right: 0, bottom: 0 });
    // A globe: the journeys wrap round the world as they did. It turns slowly until the visitor touches it.
    map.on('style.load', () => map.setProjection({ type: 'globe' }));
    let spinning = true;
    const stop = () => { spinning = false; };
    ['mousedown', 'touchstart', 'wheel', 'dragstart'].forEach(ev => map.on(ev as 'mousedown', stop));
    const spin = () => {
      if (!spinning || !mapRef.current) return;
      if (map.getZoom() < 3 && !map.isMoving()) map.easeTo({ center: [map.getCenter().lng + 6, map.getCenter().lat], duration: 1000, easing: t => t });
    };
    map.on('moveend', spin);
    spinRef.current = stop;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    mapRef.current = map;
    map.on('load', () => {
      map.addSource('overview', { type: 'geojson', data: collection([]) });
      map.addSource('journey', { type: 'geojson', data: collection([]) });
      map.addLayer({ id: 'overview-casing', type: 'line', source: 'overview', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#fffcf4', 'line-width': 6, 'line-opacity': ['case', ['get', 'dim'], 0.15, 0.9] } });
      map.addLayer({ id: 'overview-line', type: 'line', source: 'overview', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': ['get', 'color'], 'line-width': 3.5, 'line-opacity': ['case', ['get', 'dim'], 0.25, 0.95] } });
      map.addLayer({ id: 'journey-casing', type: 'line', source: 'journey', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#fffcf4', 'line-width': 8, 'line-opacity': 0.9 } });
      map.addLayer({ id: 'journey-road', type: 'line', source: 'journey', filter: ['get', 'road'], layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': ['get', 'color'], 'line-width': 4.5 } });
      map.addLayer({ id: 'journey-other', type: 'line', source: 'journey', filter: ['!', ['get', 'road']], layout: { 'line-join': 'round' }, paint: { 'line-color': ['get', 'color'], 'line-width': 3, 'line-dasharray': [1.5, 1.5] } });
      const pick = (e: maplibregl.MapLayerMouseEvent) => { const id = e.features?.[0]?.properties?.id; if (id) selectRef.current(String(id)); };
      map.on('click', 'overview-line', pick);
      map.on('mouseenter', 'overview-line', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'overview-line', () => { map.getCanvas().style.cursor = ''; });
      setReady(true);
      spin();
    });
    return () => { popup.current?.root.unmount(); map.remove(); mapRef.current = null; };
  }, []);

  // All journeys (the chosen one bright, the others faint).
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    // While a journey is open only its detailed line shows: the rough overview lines (its own and the others',
    // several of which follow the same roads) would run beside it as shortcuts. They come back when it's closed.
    (map.getSource('overview') as maplibregl.GeoJSONSource).setData(collection(
      shown ? [] : all.map(j => feature(j.overview, { id: j.id, color: j.color, dim: false })),
    ));
  }, [ready, all, shown]);

  const openStop = (index: number, fly = true) => {
    const map = mapRef.current, j = journeyRef.current;
    if (!map || !j) return;
    const stop = j.stops[index];
    popup.current?.popup.remove();
    const el = document.createElement('div');
    const root = createRoot(el);
    root.render(<StopCard journey={j} index={index} onPlan={onPlan} />);
    const p = new maplibregl.Popup({ offset: 14, maxWidth: '320px', focusAfterOpen: false }).setLngLat([stop.at[1], stop.at[0]]).setDOMContent(el).addTo(map);
    p.on('close', () => setTimeout(() => root.unmount()));
    popup.current = { popup: p, root };
    if (fly) map.easeTo({ center: [stop.at[1], stop.at[0]], zoom: Math.max(map.getZoom(), 5), padding: padding(), duration: 700 });
  };

  // The chosen journey (or the one being imported): its legs (road solid, the rest dashed) and numbered stops.
  const journey_ = shown;
  useEffect(() => {
    const journey = journey_;
    const map = mapRef.current;
    if (!ready || !map) return;
    markers.current.forEach(m => m.remove());
    markers.current = [];
    popup.current?.popup.remove();
    (map.getSource('journey') as maplibregl.GeoJSONSource).setData(collection(
      journey ? journey.legs.map(l => feature(l.line, { color: journey.color, road: ON_ROAD.has(l.by) })) : [],
    ));
    if (!journey) return;
    spinRef.current();
    journey.stops.forEach((stop, i) => {
      const el = document.createElement('button');
      el.type = 'button';
      el.title = stop.name;
      el.textContent = String(i + 1);
      el.style.cssText = `width:20px;height:20px;border-radius:50%;background:#fffcf4;border:2px solid ${journey.color};color:${journey.color};`
        + 'font:700 9px/16px Inter,sans-serif;text-align:center;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,.35);padding:0;';
      el.addEventListener('click', (e) => { e.stopPropagation(); openStop(i, false); });
      markers.current.push(new maplibregl.Marker({ element: el }).setLngLat([stop.at[1], stop.at[0]]).addTo(map));
    });
    map.fitBounds([[journey.bbox[0], journey.bbox[1]], [journey.bbox[2], journey.bbox[3]]], { padding: padding(), duration: 900, maxZoom: 7 });
  }, [ready, journey_?.id, journey_?.legs]);

  const remove = async (j: Journey) => {
    if (!window.confirm(t('Remove "{title}" from the Inspiration map for everyone?', { title: j.title }))) return;
    await unpublishJourney(j.id);
    setPublished(list => list.filter(x => x.id !== j.id));
    setJourney(null);
  };

  const totalKm = useMemo(() => all.reduce((n, j) => n + j.km, 0), [all]);

  return (
    <div className="absolute inset-0 z-[17] bg-[radial-gradient(ellipse_at_center,#1e3a4f_0%,#0b1622_70%)]">
      <div ref={container} className="h-full w-full" />
      <aside className="absolute inset-x-0 bottom-0 max-h-[50dvh] overflow-y-auto rounded-t-xl border-t bg-[#fffcf4] p-3 shadow-2xl md:inset-x-auto md:bottom-0 md:left-0 md:top-0 md:max-h-none md:w-[380px] md:rounded-none md:border-0 md:border-r">
        {importing && uid ? (
          <ImportJourney uid={uid} preview={preview} onPreview={setPreview} onClose={() => setImporting(false)}
            onPublished={(j) => { setPublished(list => [j, ...list]); setPreview(null); setImporting(false); setJourney(j); }} />
        ) : !journey ? (
          <div className="space-y-3">
            <div>
              <h2 className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-emerald-800"><Compass size={16} />{t('Inspiration')}</h2>
              <p className="mt-0.5 text-xs text-slate-600">{t('Famous journeys to dream about. Pick one to follow it stop by stop, then plan any stretch of it as your own trip.')}</p>
              {list && <p className="mt-1 text-[10.5px] text-slate-400">{t('{n} journeys · {d} of adventure', { n: all.length, d: dist(totalKm, 0) })}</p>}
            </div>
            <div className="space-y-1.5">
              <input value={words} onChange={(e) => setWords(e.target.value)} placeholder={t('Search: a place, a rider, a bike…')} aria-label={t('Search journeys')}
                className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs focus:border-emerald-400 focus:outline-none" />
              <div className="flex flex-wrap gap-1">
                {([['', 'All'], ['moto', 'Motorcycle'], ['bike', 'Bicycle'], ['walk', 'On foot'], ['4x4', '4x4 & overland']] as const).map(([id, label]) => (
                  <button key={id || 'all'} onClick={() => setKind(id)} aria-pressed={kind === id}
                    className={cn('rounded-full border px-2 py-0.5 text-[10.5px] font-semibold', kind === id ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-emerald-50')}>{t(label)}</button>
                ))}
                <span className="mx-0.5 w-px bg-slate-200" />
                {([['', 'Any time'], ['old', 'Before 1990'], ['new', 'Since 1990']] as const).map(([id, label]) => (
                  <button key={id || 'any'} onClick={() => setEra(id)} aria-pressed={era === id}
                    className={cn('rounded-full border px-2 py-0.5 text-[10.5px] font-semibold', era === id ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-emerald-50')}>{t(label)}</button>
                ))}
              </div>
              {list && all.length === 0 && <p className="text-xs text-slate-500">{t('No journey matches these filters yet.')}</p>}
            </div>
            {admin && (
              <button onClick={() => { setJourney(null); setImporting(true); }}
                className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-emerald-400 px-2 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-50">
                <Upload size={13} />{t('Import a journey (only you see this)')}
              </button>
            )}
            {failed && <p className="text-xs text-red-600">{t("Couldn't load the journeys. Check your connection and try again.")}</p>}
            {!list && !failed && <p className="flex items-center gap-1.5 text-xs text-slate-500"><Loader2 size={13} className="animate-spin" />{t('Loading journeys…')}</p>}
            {list && all.map(j => (
              <button key={j.id} onClick={() => select(j.id)} disabled={loading === j.id}
                className="group block w-full overflow-hidden rounded-lg border border-slate-200 bg-white text-left shadow-sm transition-shadow hover:shadow-md">
                {j.cover && <img src={j.cover.url} alt="" loading="lazy" className="h-24 w-full object-cover" />}
                <div className="border-l-4 p-2.5" style={{ borderColor: j.color }}>
                  <p className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
                    {j.title}{loading === j.id && <Loader2 size={13} className="animate-spin text-slate-400" />}
                  </p>
                  <p className="text-[11px] text-slate-600">{j.who} · {j.when}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500"><Bike size={11} />{j.vehicle} · {dist(j.km, 0)} · {t('{n} stops', { n: j.stopCount })}</p>
                </div>
              </button>
            ))}
            <p className="flex items-start gap-1 text-[10px] text-slate-400"><Sparkles size={11} className="mt-px shrink-0" />{t('Routes are reconstructed from public accounts; photos are freely licensed from Wikimedia Commons.')}</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {/* Stays in view while the stops scroll: the way back and which journey this is. */}
            <div className="sticky -top-3 z-10 -mx-3 -mt-3 space-y-1.5 border-b border-slate-200 bg-[#fffcf4] px-3 pb-2 pt-3">
              <button onClick={() => { setJourney(null); mapRef.current?.easeTo({ zoom: narrow() ? 0.9 : 1.9, duration: 900 }); }} className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline"><ArrowLeft size={13} />{t('All journeys')}</button>
              <div className="border-l-4 pl-2" style={{ borderColor: journey.color }}>
                <h2 className="text-base font-bold leading-tight text-slate-900">{journey.title}</h2>
                <p className="text-[11px] text-slate-600">{journey.who} · {journey.when}</p>
                <p className="text-[11px] text-slate-500">{journey.vehicle} · {dist(journey.km, 0)} · {t('{n} stops', { n: journey.stops.length })}</p>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-slate-700">{journey.summary}</p>
            {journey.approximate && <p className="text-[10.5px] italic text-slate-500">{journey.approximate}</p>}
            {admin && journey.imported && (
              <button onClick={() => remove(journey)} className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-red-600 hover:underline"><Trash2 size={11} />{t('Remove from the map')}</button>
            )}
            <p className="flex flex-wrap gap-x-3 text-[10.5px]">
              {journey.sources.filter(s => !s.url).map(s => <span key={s.label} className="text-slate-500">{s.label}</span>)}
              {journey.sources.filter(s => s.url).map(s => (
                <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 font-semibold text-emerald-700 hover:underline">{s.label}<ExternalLink size={10} /></a>
              ))}
            </p>
            <ol className="space-y-1">
              {journey.stops.map((stop, i) => (
                <li key={i}>
                  <button onClick={() => openStop(i)} className="flex w-full items-start gap-2 rounded-md p-1 text-left hover:bg-emerald-50">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 bg-white text-[9px] font-bold" style={{ borderColor: journey.color, color: journey.color }}>{i + 1}</span>
                    {stop.photo && <img src={stop.photo.url} alt="" loading="lazy" className="h-10 w-10 shrink-0 rounded object-cover" />}
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold text-slate-800">{stop.name}</span>
                      <span className={cn('block text-[10.5px] text-slate-500', 'line-clamp-2')}>
                        {[stop.date, stop.by && LEG_WORDS[stop.by] && t(`Arrived ${LEG_WORDS[stop.by]}`)].filter(Boolean).join(' · ')}{(stop.date || (stop.by && LEG_WORDS[stop.by])) ? ' · ' : ''}{stop.text}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        )}
      </aside>
    </div>
  );
};

export default InspirationView;
