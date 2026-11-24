// A journey from the Inspiration map as a short video: title card, the route drawing itself stop by stop on the
// globe with a card at each main stop, and an end card. Rendered frame by frame (window.renderAt(seconds)) so the
// recording is smooth whatever the machine: scripts/media/make-video.mjs captures the frames and makes the MP4.
//   http://localhost:5179/scripts/media/route-video.html?id=long-way-round&format=vertical
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import mapWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { GLOBE_STYLE } from '../../src/lib/mapStyle';

maplibregl.setWorkerUrl(mapWorkerUrl);

type Pt = [number, number];
interface Stop { name: string; at: Pt; date?: string; text: string; photo?: { url: string; credit?: string; license?: string } }
interface Leg { by: string; km: number; line: Pt[] }
interface Journey { id: string; title: string; who: string; when: string; vehicle: string; color: string; km: number; stops: Stop[]; legs: Leg[]; bbox?: [number, number, number, number] }

const params = new URLSearchParams(location.search);
const id = params.get('id') || 'long-way-round';
const wide = params.get('format') === 'horizontal';
const pt = params.get('lang') === 'pt';
const cta = params.get('cta') || (pt ? 'Segue cada paragem e planeia a tua: link na bio' : 'Follow every stop and plan your own: link in bio');
/** Overrides the end card's figures when the map shows only part of the journey. */
const statsOverride = params.get('stats');
if (wide) document.body.classList.add('wide');

const ROAD = new Set(['ride', 'walk', 'truck', 'bus']);
const rad = (d: number) => (d * Math.PI) / 180;
const km = (a: Pt, b: Pt) => {
  const h = Math.sin(rad(b[0] - a[0]) / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(rad(b[1] - a[1]) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
};
const $ = (sel: string) => document.querySelector(sel) as HTMLElement;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const ease = (x: number) => (x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2);

async function main() {
  const j: Journey = await (await fetch(`/inspiration/${id}.json`)).json();
  document.documentElement.style.setProperty('--c', j.color);

  // The whole line as points with their distance from the start (continuous longitudes, so it crosses 180° cleanly).
  const pts: { p: Pt; d: number; leg: number }[] = [];
  const legEnd: number[] = [];
  let total = 0;
  j.legs.forEach((l, li) => {
    for (const raw of l.line) {
      let p: Pt = [raw[0], raw[1]];
      const prev = pts[pts.length - 1];
      if (prev) {
        while (p[1] - prev.p[1] > 180) p = [p[0], p[1] - 360];
        while (prev.p[1] - p[1] > 180) p = [p[0], p[1] + 360];
        total += km(prev.p, p);
      }
      pts.push({ p, d: total, leg: li });
    }
    legEnd.push(total);
  });
  const at = (d: number): Pt => {
    if (d <= 0) return pts[0].p;
    if (d >= total) return pts[pts.length - 1].p;
    let lo = 0, hi = pts.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (pts[m].d < d) lo = m; else hi = m; }
    const a = pts[lo], b = pts[hi], f = b.d > a.d ? (d - a.d) / (b.d - a.d) : 0;
    return [a.p[0] + (b.p[0] - a.p[0]) * f, a.p[1] + (b.p[1] - a.p[1]) * f];
  };

  // Main stops (at most 10, always the first and the last), at the distance where their leg ends.
  const stopD = j.stops.map((_, i) => (i === 0 ? 0 : legEnd[i - 1] ?? total));
  const n = j.stops.length, maxStops = 10;
  const main: number[] = n <= maxStops ? j.stops.map((_, i) => i) : Array.from({ length: maxStops }, (_, k) => Math.round((k * (n - 1)) / (maxStops - 1)));

  // Timeline: intro, then moves between main stops (by distance; sea and unknown jumps fast) with a pause at each, then the end.
  const INTRO = 3, PAUSE = 1.9, END = 4.5, MOVE = clamp(8 + main.length * 1.1, 12, 20);
  const weight = (d0: number, d1: number) => {
    let w = 0;
    j.legs.forEach((l, li) => {
      const a = li === 0 ? 0 : legEnd[li - 1], b = legEnd[li];
      const o = Math.max(0, Math.min(b, d1) - Math.max(a, d0));
      w += !ROAD.has(l.by) && l.km > 2500 ? o * 0.15 : o;
    });
    return w;
  };
  const moves = main.slice(1).map((s, k) => ({ d0: stopD[main[k]], d1: stopD[s] }));
  const wsum = moves.reduce((n2, m) => n2 + weight(m.d0, m.d1), 0) || 1;
  type Seg = { t0: number; t1: number; kind: 'intro' | 'pause' | 'move' | 'end'; stop?: number; d0?: number; d1?: number };
  const segs: Seg[] = [];
  let t = 0;
  segs.push({ t0: t, t1: (t += INTRO), kind: 'intro' });
  segs.push({ t0: t, t1: (t += PAUSE), kind: 'pause', stop: main[0] });
  moves.forEach((m, k) => {
    segs.push({ t0: t, t1: (t += Math.max(0.8, (MOVE * weight(m.d0, m.d1)) / wsum)), kind: 'move', d0: m.d0, d1: m.d1 });
    segs.push({ t0: t, t1: (t += PAUSE), kind: 'pause', stop: main[k + 1] });
  });
  segs.push({ t0: t, t1: (t += END), kind: 'end' });
  const duration = t;

  // Zoom for following the route: about a third of the journey's span in view.
  const lats = pts.map(x => x.p[0]), lngs = pts.map(x => x.p[1]);
  const span = Math.max(Math.max(...lngs) - Math.min(...lngs), (Math.max(...lats) - Math.min(...lats)) * 1.4, 1);
  const followZoom = clamp(Math.log2(360 / span) + (wide ? 1.4 : 0.9), 2.2, 7.5);

  const map = new maplibregl.Map({ container: 'map', style: GLOBE_STYLE, center: [at(0)[1], at(0)[0]], zoom: followZoom - 0.8, attributionControl: false, interactive: false, fadeDuration: 0, canvasContextAttributes: { preserveDrawingBuffer: true } });
  await new Promise<void>(r => map.on('load', () => r()));
  map.setProjection({ type: 'globe' });
  map.addSource('done', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
  map.addSource('stops', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
  map.addSource('head', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
  map.addLayer({ id: 'done-casing', type: 'line', source: 'done', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#ffffff', 'line-width': 7, 'line-opacity': 0.85 } });
  map.addLayer({ id: 'done', type: 'line', source: 'done', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': j.color, 'line-width': 4 } });
  map.addLayer({ id: 'stops', type: 'circle', source: 'stops', paint: { 'circle-radius': 9, 'circle-color': j.color, 'circle-stroke-color': '#fff', 'circle-stroke-width': 2.5, 'circle-pitch-alignment': 'viewport' } });
  map.addLayer({ id: 'stop-n', type: 'symbol', source: 'stops', layout: { 'text-field': ['get', 'n'], 'text-font': ['Noto Sans Bold'], 'text-size': 11, 'text-allow-overlap': true }, paint: { 'text-color': '#fff' } });
  map.addLayer({ id: 'head', type: 'circle', source: 'head', paint: { 'circle-radius': 8, 'circle-color': '#fff', 'circle-stroke-color': j.color, 'circle-stroke-width': 4, 'circle-pitch-alignment': 'viewport' } });

  // Photos loaded before recording.
  await Promise.all(main.map(i => j.stops[i].photo?.url).filter(Boolean).map(u => new Promise<void>(r => { const im = new Image(); im.onload = im.onerror = () => r(); im.src = u!; })));

  const endCam = map.cameraForBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]], { padding: wide ? 120 : 80 }) || { center: map.getCenter(), zoom: 2 };

  $('#title .kicker').textContent = pt ? 'Viagens famosas, no mapa' : 'Famous journeys, mapped';
  $('#title h1').textContent = j.title;
  $('#title .who').textContent = [j.who, j.when].filter(Boolean).join(' · ');
  $('#title .veh').textContent = j.vehicle;
  $('#end h1').textContent = j.title;
  $('#end .stats').textContent = statsOverride || `${Math.round(j.km).toLocaleString('en')} km · ${j.stops.length} stops${j.when ? ` · ${j.when}` : ''}`;
  $('#end .cta').textContent = cta;
  $('#end .brand').textContent = 'Munditrails';

  const camAt = (d: number): Pt => {
    // A little behind the head and smoothed, so the camera doesn't jerk at corners.
    const w = Math.max(total * 0.015, 5);
    let la = 0, lo = 0;
    for (let k = 0; k < 7; k++) { const p = at(d - (w * k) / 6); la += p[0]; lo += p[1]; }
    return [la / 7, lo / 7];
  };
  const lineUpTo = (d: number) => {
    const feats: GeoJSON.Feature[] = [];
    let cur: Pt[] = [], curLeg = -1;
    const flush = () => { if (cur.length > 1) feats.push({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: cur.map(p => [p[1], p[0]]) } }); };
    for (const x of pts) {
      if (x.d > d) break;
      const l = j.legs[x.leg];
      const hidden = !ROAD.has(l.by) && l.km > 2500;
      if (x.leg !== curLeg) { flush(); cur = hidden ? [] : (cur.length ? [cur[cur.length - 1]] : []); curLeg = x.leg; }
      if (!hidden) cur.push(x.p);
    }
    const l = j.legs[pts.find(x => x.d >= d)?.leg ?? j.legs.length - 1];
    if (l && !(!ROAD.has(l.by) && l.km > 2500)) cur.push(at(d));
    flush();
    return { type: 'FeatureCollection' as const, features: feats };
  };
  const show = (sel: string, on: boolean) => $(sel).classList.toggle('hidden', !on);
  const stopCard = (i: number) => {
    const s = j.stops[i];
    const img = $('#stop img') as HTMLImageElement;
    if (s.photo?.url) { img.src = s.photo.url; img.style.display = ''; } else img.style.display = 'none';
    $('#stop .n').textContent = String(i + 1);
    $('#stop h2').textContent = s.name;
    $('#stop .date').textContent = s.date || '';
    $('#stop .text').textContent = s.text.length > 150 ? s.text.slice(0, s.text.lastIndexOf(' ', 150)) + '…' : s.text;
    $('#stop .credit').textContent = s.photo?.credit ? `Photo: ${s.photo.credit}${s.photo.license ? ` · ${s.photo.license}` : ''} · Wikimedia Commons` : '';
  };
  const idle = () => new Promise<void>(r => {
    const done = () => requestAnimationFrame(() => requestAnimationFrame(() => r()));
    map.triggerRepaint();
    const timer = setTimeout(done, 4000);
    map.once('idle', () => { clearTimeout(timer); done(); });
  });

  (window as any).videoDuration = duration;
  (window as any).renderAt = async (time: number) => {
    const seg = segs.find(s => time < s.t1) || segs[segs.length - 1];
    const f = clamp((time - seg.t0) / (seg.t1 - seg.t0), 0, 1);
    let d = 0;
    if (seg.kind === 'move') d = seg.d0! + (seg.d1! - seg.d0!) * ease(f);
    else if (seg.kind === 'pause') d = stopD[seg.stop!];
    else if (seg.kind === 'end') d = total;
    const reached = main.filter(i => stopD[i] <= d + 1e-6);
    (map.getSource('done') as maplibregl.GeoJSONSource).setData(lineUpTo(d));
    (map.getSource('stops') as maplibregl.GeoJSONSource).setData({ type: 'FeatureCollection', features: reached.map(i => ({ type: 'Feature', properties: { n: String(i + 1) }, geometry: { type: 'Point', coordinates: [j.stops[i].at[1], j.stops[i].at[0]] } })) });
    const head = at(d);
    (map.getSource('head') as maplibregl.GeoJSONSource).setData({ type: 'FeatureCollection', features: seg.kind === 'end' || seg.kind === 'intro' ? [] : [{ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [head[1], head[0]] } }] });
    if (seg.kind === 'intro') {
      const c = at(0);
      map.jumpTo({ center: [c[1], c[0]], zoom: followZoom - 0.8 + 0.8 * ease(f) });
    } else if (seg.kind === 'end') {
      const c = camAt(total), e = ease(clamp(f / 0.45, 0, 1));
      const ec = maplibregl.LngLat.convert(endCam.center as maplibregl.LngLatLike);
      let elng = ec.lng; while (elng - c[1] > 180) elng -= 360; while (c[1] - elng > 180) elng += 360;
      map.jumpTo({ center: [c[1] + (elng - c[1]) * e, c[0] + (ec.lat - c[0]) * e], zoom: followZoom + ((endCam.zoom ?? 2) - followZoom) * e });
    } else {
      const c = camAt(d);
      map.jumpTo({ center: [c[1], c[0]], zoom: followZoom });
    }
    show('#title', seg.kind === 'intro');
    show('#end', seg.kind === 'end' && f > 0.4);
    show('#stop', seg.kind === 'pause');
    if (seg.kind === 'pause') stopCard(seg.stop!);
    show('#counter', seg.kind === 'move' || seg.kind === 'pause');
    $('#counter').textContent = `${Math.round((d * (j.km || total)) / (total || 1)).toLocaleString('en')} km`;
    await idle();
  };
  (window as any).videoReady = true;
}
main().catch(err => { (window as any).videoError = String(err); console.error(err); });
