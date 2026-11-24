// The Inspiration map, open to everyone: famous journeys drawn on a world map. Pick one to follow it stop by stop
// (photo, story, how they travelled), then plan any stretch of it as your own trip.
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import mapWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { createRoot, Root } from 'react-dom/client';
import { ArrowLeft, Bike, ClipboardCheck, Plus, BookOpen, Compass, ExternalLink, Loader2, MapPinned, PlayCircle, Sparkles, Trash2, Upload } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { checkAdmin, loadPendingSubmissions, loadPublished, loadSubmission, summarize, unpublishJourney, type Submission } from '../lib/inspirationStore';
import AddJourneyChat from './AddJourneyChat';
import ReviewJourney from './ReviewJourney';
import ImportJourney from './ImportJourney';
import { SafetyButton, SafetyLayer, SafetyPanel } from './SafetyLayer';
import { GLOBE_STYLE, closeSatellite } from '../lib/mapStyle';
import { maptilerKey } from '../lib/maptiler';
import { mediaLinks } from '../lib/affiliate';
import { useSettings } from '../lib/settings';
import { Journey, JourneyStop, JourneySummary, LEG_WORDS, ON_ROAD, isJumpLeg, loadJourney, loadJourneys, sectionPrompt } from '../lib/inspiration';
import { cn } from '../lib/utils';

maplibregl.setWorkerUrl(mapWorkerUrl);

interface Props {
  /** "Plan this stretch": hands a request to the AI planner. */
  onPlan: (prompt: string) => void;
  /** Opens the login dialog. */
  onLogin?: () => void;
}

/** The buttons at the map's top left: one size. */
const MAP_BUTTON = 'flex w-full items-center justify-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-bold uppercase tracking-wide shadow';

type Line = [number, number][];
/** Journeys drawn in straight lines between a few known places (their real path was much longer). */
const STRAIGHT = new Set(['capelo-ivens', 'livingstone-zambezi']);
const feature = (line: Line, properties: Record<string, unknown>) => ({
  type: 'Feature' as const, properties, geometry: { type: 'LineString' as const, coordinates: line.map(([lat, lng]) => [lng, lat]) },
});
const collection = (features: ReturnType<typeof feature>[]) => ({ type: 'FeatureCollection' as const, features });

/** Ocean crossings and legs of unknown route on round-the-world trips are not drawn: a long straight line across
 *  the globe says nothing and makes the map look jumpy. The trip shows as its pieces on each continent. */
const isJump = isJumpLeg;
/** The light overview line cut where it jumps more than ~20° in one step (those are the crossings above). */
function splitJumps(line: Line, maxDeg = 20): Line[] {
  const parts: Line[] = [];
  let cur: Line = [];
  for (const p of line) {
    const prev = cur[cur.length - 1];
    if (prev && Math.hypot(p[0] - prev[0], p[1] - prev[1]) > maxDeg) { if (cur.length > 1) parts.push(cur); cur = []; }
    cur.push(p);
  }
  if (cur.length > 1) parts.push(cur);
  return parts;
}

/** Only the first Dakar (1979) shows by default; the other editions stay under the Rally filter or a search. */
const archived = (j: { id: string }) => j.id.startsWith('dakar-') && j.id !== 'dakar-1979';

/** Points every ~1° along the journeys' overview lines, for the heatmap seen from far away. */
function heatPoints(lines: Line[]) {
  const pts: { type: 'Feature'; properties: Record<string, never>; geometry: { type: 'Point'; coordinates: [number, number] } }[] = [];
  for (const line of lines) {
    for (let i = 1; i < line.length; i++) {
      const [a, b] = [line[i - 1], line[i]];
      const steps = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1])));
      for (let k = 0; k < steps; k++) {
        const f = k / steps;
        pts.push({ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [a[1] + (b[1] - a[1]) * f, a[0] + (b[0] - a[0]) * f] } });
      }
    }
  }
  return { type: 'FeatureCollection' as const, features: pts };
}

/** Land outlines for the route sketches (Natural Earth 110m, public domain), loaded once. */
let landPath: Promise<string> | null = null;
function useLand() {
  const [d, setD] = useState('');
  useEffect(() => {
    landPath ??= fetch('/inspiration/land.json').then(r => r.json()).then(j => String(j.d || '')).catch(() => '');
    let alive = true;
    landPath.then(v => { if (alive) setD(v); });
    return () => { alive = false; };
  }, []);
  return d;
}

/** A small map of a journey's line (on land outlines), for cards with no photo. `aspect`: width / height of the box. */
const RouteSketch: React.FC<{ line: Line[]; color: string; aspect: number; className?: string; /** Share of the width covered on the left (a book cover): the line is centred in the rest. */ left?: number }> = ({ line, color, aspect, className, left = 0 }) => {
  const land = useLand();
  const parts = line.flatMap(l => splitJumps(l)).filter(p => p.length > 1);
  if (!parts.length) return null;
  const pts = parts.flat();
  const lats = pts.map(p => p[0]), lngs = pts.map(p => p[1]);
  const [lx0, lx1, ly0, ly1] = [Math.min(...lngs), Math.max(...lngs), -Math.max(...lats), -Math.min(...lats)];
  // Some room around the line, at least 6° tall, in the box's shape.
  let w = Math.max(lx1 - lx0, 0.5), h = Math.max(ly1 - ly0, 0.5);
  const pad = Math.max(w, h) * 0.12 + 0.5;
  w += 2 * pad; h += 2 * pad;
  w = w / (1 - left);
  h = Math.max(h, 6, w / aspect); w = Math.max(w, h * aspect);
  const x0 = (lx0 + lx1) / 2 - w * (1 + left) / 2, y0 = (ly0 + ly1) / 2 - h / 2;
  const path = (p: Line) => p.map(([lat, lng], i) => `${i ? 'L' : 'M'}${lng.toFixed(2)} ${(-lat).toFixed(2)}`).join('');
  const [start, end] = [parts[0][0], parts[parts.length - 1][parts[parts.length - 1].length - 1]];
  return (
    <svg viewBox={`${x0.toFixed(2)} ${y0.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)}`} className={className} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect x={x0} y={y0} width={w} height={h} fill="#d7e8ef" />
      {land && <path d={land} fill="#f4efe2" stroke="#c8bb9c" strokeWidth={0.6} vectorEffect="non-scaling-stroke" />}
      {parts.map((p, i) => <path key={`c${i}`} d={path(p)} fill="none" stroke="#fff" strokeWidth={4.5} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />)}
      {parts.map((p, i) => <path key={i} d={path(p)} fill="none" stroke={color} strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />)}
      <circle cx={start[1]} cy={-start[0]} r={h * 0.035} fill="#fff" stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" />
      <circle cx={end[1]} cy={-end[0]} r={h * 0.035} fill={color} stroke="#fff" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
    </svg>
  );
};

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
      {stop.source && (
        <a href={stop.source.url} target="_blank" rel="noopener noreferrer" className="block truncate text-[10.5px] font-semibold text-emerald-800 underline">
          {t('Read more')}: {stop.source.label} ↗
        </a>
      )}
      {stop.video && (
        <a href={stop.video.url} target="_blank" rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-1.5 rounded-md bg-red-600 px-2 py-1.5 text-xs font-bold text-white hover:bg-red-700">
          <PlayCircle size={13} />{t('Watch episode')}: <span className="truncate font-semibold">{stop.video.label}</span>
        </a>
      )}
      {nextByRoad && (
        <button onClick={() => onPlan(sectionPrompt(journey, stop, next))}
          className="flex w-full items-center justify-center gap-1.5 rounded-md bg-emerald-700 px-2 py-1.5 text-xs font-bold text-white hover:bg-emerald-800">
          <MapPinned size={13} />{t('Plan {from} → {to} as my trip', { from: stop.name, to: next.name })}
        </button>
      )}
    </div>
  );
};

const InspirationView: React.FC<Props> = ({ onPlan, onLogin }) => {
  const { t, dist, locale } = useSettings();
  const [list, setList] = useState<JourneySummary[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [journey, setJourney] = useState<Journey | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  // Close-up basemap: topographic (default) or satellite; remembered on this device.
  const [basemap, setBasemap] = useState<'topo' | 'satellite'>(() => {
    try { return localStorage.getItem('adventure-planner.inspire-basemap') === 'satellite' ? 'satellite' : 'topo'; } catch { return 'topo'; }
  });
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
  // While adding a journey the chat box covers the lower part of the map: fit the journey above it.
  const addingRef = useRef(false);
  const padding = () => {
    const h = container.current?.clientHeight || 800;
    return narrow()
      ? { top: 70, left: 30, right: 30, bottom: Math.round(h * (addingRef.current ? 0.66 : 0.5)) }
      : { top: 90, left: 410, right: 60, bottom: addingRef.current ? Math.round(Math.min(h * 0.62, 520)) : 50 };
  };

  useEffect(() => {
    loadJourneys().then(setList).catch(() => setFailed(true));
    loadPublished().then(setPublished);
    return onAuthStateChanged(auth, user => {
      setUid(user?.uid || null);
      if (user) checkAdmin(user.uid).then(setAdmin); else setAdmin(false);
    });
  }, []);
  // "Add your journey" (the chat), and for admins the journeys sent for review.
  const [adding, setAdding] = useState(false);
  // The overland safety layer (its button sits with "Add your journey").
  const [safety, setSafety] = useState(false);
  addingRef.current = adding;
  const [reviewing, setReviewing] = useState<Submission | null>(null);
  const [queue, setQueue] = useState<Submission[]>([]);
  useEffect(() => {
    if (!admin) { setQueue([]); return; }
    loadPendingSubmissions().then(setQueue);
    // The link in the review email: ?review=<id>.
    const id = new URLSearchParams(window.location.search).get('review');
    if (id) loadSubmission(id).then(sub => { if (sub) { setReviewing(sub); setPreview(sub.journey); } }).catch(() => undefined);
  }, [admin]);
  const review = (sub: Submission | null) => {
    setReviewing(sub);
    setPreview(sub ? sub.journey : null);
    if (!sub) {
      const url = new URL(window.location.href);
      if (url.searchParams.has('review')) { url.searchParams.delete('review'); window.history.replaceState(null, '', url); }
    }
  };
  // Back to the list where it was scrolled to.
  const asideRef = useRef<HTMLElement>(null);
  const listScroll = useRef<number | null>(null);
  // Famous journeys first, then those imported (newest first).
  const every = useMemo(() => [...(list || []), ...published.map(summarize)], [list, published]);
  // Filters: how they travelled, when, and words (title, people, vehicle, story).
  const [kind, setKind] = useState('');
  const [era, setEra] = useState('');
  const [words, setWords] = useState('');
  const all = useMemo(() => every.filter(j => {
    const year = Number(j.when.match(/\d{4}/)?.[0] || 0);
    if (kind && j.kind !== kind) return false;
    if (kind !== 'rally' && !words.trim() && archived(j)) return false;
    if (era === 'old' && !(year && year < 1990)) return false;
    if (era === 'new' && !(year >= 1990)) return false;
    const q = words.trim().toLowerCase();
    return !q || [j.title, j.who, j.vehicle, j.summary].join(' ').toLowerCase().includes(q);
  }), [every, kind, era, words]);

  const select = async (id: string) => {
    if (!journey && asideRef.current) listScroll.current = asideRef.current.scrollTop;
    const mine = published.find(j => j.id === id);
    if (mine) { setJourney(mine); return; }
    setLoading(id);
    try { setJourney(await loadJourney(id)); } catch { setFailed(true); } finally { setLoading(null); }
  };
  useLayoutEffect(() => {
    if (!journey && !reviewing && listScroll.current != null && asideRef.current) {
      asideRef.current.scrollTop = listScroll.current;
      listScroll.current = null;
    }
  }, [journey, reviewing, list]);
  const backToAll = () => {
    setJourney(null);
    // Step back a little (one or two zoom levels), not all the way out to the whole globe.
    const map = mapRef.current;
    if (map) map.easeTo({ zoom: Math.max(narrow() ? 0.9 : 1.9, map.getZoom() - 1.5), duration: 700 });
  };
  const selectRef = useRef(select);
  selectRef.current = select;

  // The map, once.
  useEffect(() => {
    if (!container.current) return;
    const map = new maplibregl.Map({ container: container.current, style: GLOBE_STYLE, center: [10, 25], zoom: narrow() ? 0.9 : 1.9, attributionControl: { compact: true } });
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
      map.addSource('satClose', closeSatellite(maptilerKey()));
      map.addLayer({ id: 'satClose', type: 'raster', source: 'satClose', minzoom: 4, layout: { visibility: 'none' },
        paint: { 'raster-opacity': ['interpolate', ['linear'], ['zoom'], 4.5, 0, 6.5, 1] } });
      map.addSource('heat', { type: 'geojson', data: heatPoints([]) });
      // From far away: a glow where the journeys are; zoom in and it gives way to the individual (thin) lines.
      map.addLayer({ id: 'heat', type: 'heatmap', source: 'heat', maxzoom: 5, paint: {
        'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 5, 2, 10, 4, 20],
        'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 0.5, 4, 1.2],
        'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 2.4, 0.85, 3.8, 0],
        'heatmap-color': ['interpolate', ['linear'], ['heatmap-density'], 0, 'rgba(0,0,0,0)', 0.15, 'rgba(253,224,71,0.45)', 0.4, 'rgba(251,146,60,0.75)', 0.7, '#f97316', 1, '#dc2626'],
      } });
      const fade = (low: number, high: number) => ['interpolate', ['linear'], ['zoom'], 1.8, low, 3.4, high] as unknown as number;
      map.addLayer({ id: 'overview-casing', type: 'line', source: 'overview', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#fffcf4', 'line-width': ['interpolate', ['linear'], ['zoom'], 1, 1.5, 6, 3.5], 'line-opacity': fade(0.05, 0.55) } });
      map.addLayer({ id: 'overview-line', type: 'line', source: 'overview', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': ['get', 'color'], 'line-width': ['interpolate', ['linear'], ['zoom'], 1, 0.8, 6, 2], 'line-opacity': fade(0.2, 0.95) } });
      map.addLayer({ id: 'journey-casing', type: 'line', source: 'journey', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#fffcf4', 'line-width': ['interpolate', ['linear'], ['zoom'], 2, 3, 8, 5.5], 'line-opacity': 0.85 } });
      map.addLayer({ id: 'journey-road', type: 'line', source: 'journey', filter: ['get', 'road'], layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': ['get', 'color'], 'line-width': ['interpolate', ['linear'], ['zoom'], 2, 1.6, 8, 3.2] } });
      map.addLayer({ id: 'journey-other', type: 'line', source: 'journey', filter: ['!', ['get', 'road']], layout: { 'line-join': 'round' }, paint: { 'line-color': ['get', 'color'], 'line-width': ['interpolate', ['linear'], ['zoom'], 2, 1.4, 8, 2.6], 'line-dasharray': [1.5, 1.5] } });
      const pick = (e: maplibregl.MapLayerMouseEvent) => { const id = e.features?.[0]?.properties?.id; if (id) selectRef.current(String(id)); };
      map.on('click', 'overview-line', pick);
      map.on('mouseenter', 'overview-line', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'overview-line', () => { map.getCanvas().style.cursor = ''; });
      setReady(true);
      spin();
    });
    return () => { popup.current?.root.unmount(); map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    map.setLayoutProperty('satClose', 'visibility', basemap === 'satellite' ? 'visible' : 'none');
    map.setLayoutProperty('base', 'visibility', basemap === 'satellite' ? 'none' : 'visible');
    try { localStorage.setItem('adventure-planner.inspire-basemap', basemap); } catch { /* not remembered */ }
  }, [ready, basemap]);

  // All journeys (the chosen one bright, the others faint).
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    // While a journey is open only its detailed line shows: the rough overview lines (its own and the others',
    // several of which follow the same roads) would run beside it as shortcuts. They come back when it's closed.
    (map.getSource('overview') as maplibregl.GeoJSONSource).setData(collection(
      shown || adding ? [] : all.flatMap(j => j.overview.flatMap(o => splitJumps(o)).map(part => feature(part, { id: j.id, color: j.color, dim: false }))),
    ));
    (map.getSource('heat') as maplibregl.GeoJSONSource).setData(heatPoints(shown || adding ? [] : all.filter(j => !j.crossing).flatMap(j => j.overview.flatMap(o => splitJumps(o)))));
  }, [ready, all, shown, adding]);

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
      journey ? (journey.legs.some(l => !isJump(l)) ? journey.legs.filter(l => !isJump(l)) : journey.legs).map(l => feature(l.line, { color: journey.color, road: ON_ROAD.has(l.by) })) : [],
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
    map.fitBounds([[journey.bbox[0], journey.bbox[1]], [journey.bbox[2], journey.bbox[3]]], { padding: padding(), duration: 900, maxZoom: 11 });
  }, [ready, journey_?.id, journey_?.legs]);

  const remove = async (j: Journey) => {
    if (!window.confirm(t('Remove "{title}" from the Inspiration map for everyone?', { title: j.title }))) return;
    await unpublishJourney(j.id);
    setPublished(list => list.filter(x => x.id !== j.id));
    setJourney(null);
  };

  // Rallies (bivouac to bivouac) and old explorations with only a few known places are drawn in straight lines: say so, so it isn't read as the race distance.
  const kmLabel = (j: { id: string; km: number }) => (j.id.startsWith('dakar-') || STRAIGHT.has(j.id) ? t('{d} straight line', { d: dist(j.km, 0) }) : dist(j.km, 0));
  const totalKm = useMemo(() => all.reduce((n, j) => n + j.km, 0), [all]);

  return (
    <div className="absolute inset-0 z-[17] bg-[radial-gradient(ellipse_at_center,#1e3a4f_0%,#0b1622_70%)]">
      <div ref={container} className="h-full w-full" />
      <div className="absolute bottom-[calc(50dvh+8px)] left-2 z-10 flex overflow-hidden md:bottom-3 md:left-[388px] rounded-md border border-slate-300 bg-white text-[10.5px] font-semibold shadow" role="group" aria-label={t('Map style when zoomed in')}>
        {(['topo', 'satellite'] as const).map(b => (
          <button key={b} onClick={() => setBasemap(b)} aria-pressed={basemap === b}
            className={cn('px-2 py-1', basemap === b ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:bg-emerald-50')}>{t(b === 'topo' ? 'Topo' : 'Satellite')}</button>
        ))}
      </div>
      <SafetyLayer map={ready ? mapRef.current : null} ready={ready} on={safety} setOn={setSafety} />
      {/* Top left of the map: the way back to all journeys, and "Add your journey". */}
      {!importing && !reviewing && (
        <div className="absolute left-2 top-[72px] z-10 flex w-[176px] flex-col gap-1 md:left-[388px] xl:top-2.5">
          <SafetyButton on={safety} onToggle={() => setSafety(v => !v)} />
          {!adding && (
            <button onClick={() => { setJourney(null); setAdding(true); }} className={cn(MAP_BUTTON, 'border-emerald-700 bg-emerald-700 text-white hover:bg-emerald-800')}><Plus size={13} />{t('Add your journey')}</button>
          )}
          {journey && (
            <button onClick={backToAll} className={cn(MAP_BUTTON, 'border-emerald-700 bg-white text-emerald-800 hover:bg-emerald-50')}><ArrowLeft size={13} />{t('All journeys')}</button>
          )}
        </div>
      )}
      {adding && <AddJourneyChat preview={preview} onPreview={setPreview} onClose={() => setAdding(false)} onLogin={() => onLogin?.()} />}
      <aside ref={asideRef} className="absolute inset-x-0 bottom-0 max-h-[50dvh] overflow-y-auto rounded-t-xl border-t bg-[#fffcf4] p-3 shadow-2xl md:inset-x-auto md:bottom-0 md:left-0 md:top-0 md:max-h-none md:w-[380px] md:rounded-none md:border-0 md:border-r">
        {reviewing && uid ? (
          <ReviewJourney submission={reviewing} uid={uid} onBack={() => review(null)}
            onPublished={(j) => { setPublished(list => [j, ...list]); setQueue(q => q.filter(x => x.id !== reviewing.id)); }} />
        ) : adding ? (
          <div className="space-y-2">
            <h2 className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-emerald-800"><Plus size={16} />{t('Add your journey')}</h2>
            <p className="text-xs leading-relaxed text-slate-600">{t('Tell the assistant below about your journey. Only your journey shows on the map while you work on it; check it there after each answer.')}</p>
            {preview && (
              <div className="space-y-1.5 rounded-md border border-slate-200 bg-white p-2">
                <div className="border-l-4 pl-2" style={{ borderColor: preview.color }}>
                  <p className="text-sm font-bold text-slate-900">{preview.title}</p>
                  <p className="text-[11px] text-slate-600">{[preview.who, preview.when, preview.vehicle].filter(Boolean).join(' · ')}</p>
                </div>
                <p className="text-[11px] text-slate-700">{preview.summary}</p>
                <ol className="space-y-0.5">{preview.stops.map((s, i) => <li key={i} className="text-[11px] text-slate-700"><b>{i + 1}. {s.name}</b>{s.date ? ` · ${s.date}` : ''}</li>)}</ol>
              </div>
            )}
          </div>
        ) : importing && uid ? (
          <ImportJourney uid={uid} preview={preview} onPreview={setPreview} onClose={() => setImporting(false)}
            onPublished={(j) => { setPublished(list => [j, ...list]); setPreview(null); setImporting(false); setJourney(j); }} />
        ) : safety && !journey ? (
          <SafetyPanel map={ready ? mapRef.current : null} onClose={() => setSafety(false)} />
        ) : !journey ? (
          <div className="space-y-3">
            <div>
              <h2 className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-emerald-800"><Compass size={16} />Mappa Mundi</h2>
              <p className="mt-0.5 text-xs text-slate-600">{t('Famous journeys to dream about. Pick one to follow it stop by stop, then plan any stretch of it as your own trip.')}</p>
              {list && <p className="mt-1 text-[10.5px] text-slate-400">{t('{n} journeys · {d} of adventure', { n: all.length, d: dist(totalKm, 0) })}</p>}
            </div>
            <div className="space-y-1.5">
              <input value={words} onChange={(e) => setWords(e.target.value)} placeholder={t('Search: a place, a rider, a bike…')} aria-label={t('Search journeys')}
                className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs focus:border-emerald-400 focus:outline-none" />
              <div className="flex flex-wrap gap-1">
                {([['', 'All'], ['moto', 'Motorcycle'], ['bike', 'Bicycle'], ['walk', 'On foot'], ['4x4', '4x4 & overland'], ['car', 'Road trip'], ['rally', 'Rally']] as const).map(([id, label]) => (
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
              {list && kind !== 'rally' && !words.trim() && every.some(archived) && (
                <button onClick={() => setKind('rally')} className="text-[10.5px] font-semibold text-emerald-700 hover:underline">
                  {t('+{n} more Dakar Rally editions under Rally', { n: every.filter(archived).length })}
                </button>
              )}
            </div>
            {admin && queue.length > 0 && (
              <div className="space-y-1 rounded-md border border-amber-300 bg-amber-50 p-2">
                <p className="flex items-center gap-1 text-[11px] font-bold uppercase text-amber-900"><ClipboardCheck size={13} />{t('Journeys to review ({n})', { n: queue.length })}</p>
                {queue.map(q => (
                  <button key={q.id} onClick={() => review(q)} className="block w-full truncate text-left text-xs text-amber-900 hover:underline">{q.title} · {q.email || ''}</button>
                ))}
              </div>
            )}
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
                {j.cover?.kind === 'book'
                  ? <div className="relative h-24 w-full">
                      <RouteSketch line={j.overview} color={j.color} aspect={3.6} left={0.24} className="absolute inset-0 h-full w-full" />
                      <img src={j.cover.url} alt="" title={j.cover.credit} loading="lazy" className="absolute left-3 top-2 h-20 w-auto rounded-sm border border-white object-contain shadow-md" />
                    </div>
                  : j.cover ? <img src={j.cover.url} alt="" loading="lazy" className="h-24 w-full object-cover" />
                  : <RouteSketch line={j.overview} color={j.color} aspect={3.6} className="block h-24 w-full" />}
                <div className="border-l-4 p-2.5" style={{ borderColor: j.color }}>
                  <p className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
                    {j.title}{loading === j.id && <Loader2 size={13} className="animate-spin text-slate-400" />}
                  </p>
                  <p className="text-[11px] text-slate-600">{j.who} · {j.when}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500"><Bike size={11} />{j.vehicle} · {kmLabel(j)} · {t('{n} stops', { n: j.stopCount })}</p>
                </div>
              </button>
            ))}
            <p className="flex items-start gap-1 text-[10px] text-slate-400"><Sparkles size={11} className="mt-px shrink-0" />{t('Routes are reconstructed from public accounts; photos are freely licensed from Wikimedia Commons, book covers come from Open Library.')}</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {/* Stays in view while the stops scroll: the way back and which journey this is. */}
            <div className="sticky -top-3 z-10 -mx-3 -mt-3 space-y-1.5 border-b border-slate-200 bg-[#fffcf4] px-3 pb-2 pt-3">
              <div className="border-l-4 pl-2" style={{ borderColor: journey.color }}>
                <h2 className="text-base font-bold leading-tight text-slate-900">{journey.title}</h2>
                <p className="text-[11px] text-slate-600">{journey.who} · {journey.when}</p>
                <p className="text-[11px] text-slate-500">{journey.vehicle} · {kmLabel(journey)} · {t('{n} stops', { n: journey.stops.length })}</p>
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
            {journey.media && journey.media.length > 0 && (
              <div className="rounded-md border border-slate-200 bg-white p-2">
                <p className="mb-1 flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wide text-slate-600"><BookOpen size={11} />{t('Books, films & more')}</p>
                <ul className="space-y-1">
                  {journey.media.map(m => (
                    <li key={m.kind + m.title} className="text-[11px] leading-snug">
                      <span className="font-semibold text-slate-800">{m.title}</span>{m.by && <span className="text-slate-500"> · {m.by}</span>}
                      {m.note && <span className="block text-[10px] text-slate-500">{m.note}</span>}
                      <span className="mt-0.5 flex flex-wrap gap-x-2">
                        {mediaLinks(m, locale.startsWith('pt') ? 'pt' : 'us').map(l => (
                          <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer sponsored" className="inline-flex items-center gap-0.5 font-semibold text-emerald-700 hover:underline">{t(l.label)}<ExternalLink size={9} /></a>
                        ))}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-1 text-[9.5px] text-slate-400">{t('Some links may earn us a small commission, at no extra cost to you.')}</p>
              </div>
            )}
            <ol className="space-y-1">
              {journey.stops.map((stop, i) => (
                <li key={i}>
                  <button onClick={() => openStop(i)} className="flex w-full items-start gap-2 rounded-md p-1 text-left hover:bg-emerald-50">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 bg-white text-[9px] font-bold" style={{ borderColor: journey.color, color: journey.color }}>{i + 1}</span>
                    {stop.photo && <img src={stop.photo.url} alt="" loading="lazy" className="h-10 w-10 shrink-0 rounded object-cover" />}
                    <span className="min-w-0">
                      <span className="flex items-center gap-1 text-xs font-semibold text-slate-800">{stop.name}{stop.video && <PlayCircle size={11} className="text-red-600" aria-label={t('Has an episode')} />}</span>
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
