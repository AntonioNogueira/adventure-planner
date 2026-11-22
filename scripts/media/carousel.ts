// Instagram carousels (1080×1350, 4:5) built from the Inspiration journeys: vector mini-maps on Natural Earth land,
// facts and a call to action. scripts/media/make-carousel.mjs screenshots each slide.
//   http://localhost:5179/scripts/media/carousel.html?deck=africa&slide=0
type Pt = [number, number];
interface Leg { by: string; km: number; line: Pt[] }
interface Stop { name: string; at: Pt; date?: string; text: string; photo?: { url: string; credit?: string; license?: string } }
interface Journey { id: string; title: string; who: string; when: string; vehicle: string; color: string; km: number; stops: Stop[]; legs: Leg[] }

type Slide =
  | { type: 'cover'; kicker: string; title: string; lede: string; ids: string[]; dark?: boolean; photoFrom?: string }
  | { type: 'route'; n: number; id: string; why: string }
  | { type: 'map'; kicker: string; title: string; id: string; facts: [string, string][] }
  | { type: 'stops'; kicker: string; title: string; id: string; items: [string, string][] }
  | { type: 'photo'; id: string; stop: string; kicker: string; title: string; text: string }
  | { type: 'text'; kicker: string; title: string; text: string }
  | { type: 'cta'; title: string; lede: string; button: string; note: string };

const DECKS: Record<string, { brand: string; swipe: string; slides: Slide[] }> = {
  africa: {
    brand: 'Adventure Planner', swipe: 'Swipe →',
    slides: [
      { type: 'cover', kicker: 'Overland classics', title: '7 classic overland routes in Africa', lede: 'From the Sahara to the Cape: the routes overlanders dream about. Save this for your next trip.', ids: ['lisbon-dakar', 'west-africa-overland', 'morocco-atlas-sahara', 'skeleton-coast-kaokoland', 'botswana-overland', 'sani-pass-lesotho', 'congo-nile-trail'] },
      { type: 'route', n: 1, id: 'lisbon-dakar', why: 'The old rally road: the Atlas, the Western Sahara coast and the Mauritanian desert, all the way to Senegal.' },
      { type: 'route', n: 2, id: 'west-africa-overland', why: 'The great coast run to Accra. Check the security advice: the inland Sahel route is off-limits today.' },
      { type: 'route', n: 3, id: 'morocco-atlas-sahara', why: 'High Atlas passes, kasbahs and the dunes of Merzouga in one loop.' },
      { type: 'route', n: 4, id: 'skeleton-coast-kaokoland', why: 'Shipwrecks, desert elephants and the notorious Van Zyl’s Pass. Two vehicles, lots of water.' },
      { type: 'route', n: 5, id: 'botswana-overland', why: 'From the Okavango Delta to Chobe: wild camps with elephants walking past the tent.' },
      { type: 'route', n: 6, id: 'sani-pass-lesotho', why: 'Switchbacks up to the “highest pub in Africa”, then across the roof of Lesotho.' },
      { type: 'route', n: 7, id: 'congo-nile-trail', why: 'Along the shore of Lake Kivu by bike, through Rwanda’s tea and coffee hills.' },
      { type: 'cta', title: 'Follow every stop, then plan your own', lede: 'All 7 routes are on the Adventure Planner map, with their stops, photos and stories. Planning your own trip takes one sentence.', button: 'Link in bio', note: 'Always check the official travel advice before you go: our map shows it too.' },
    ],
  },
  'ate-la-abaixo': {
    brand: 'Adventure Planner', swipe: 'Desliza →',
    slides: [
      { type: 'cover', kicker: 'Viagens famosas, no mapa', title: '3 amigos, 1 jipe, 21 países', lede: 'Em 2010 largaram os empregos e foram de Lisboa a Joanesburgo de jipe… para ver o Mundial.', ids: ['ate-la-abaixo-2010'], dark: true },
      { type: 'map', kicker: 'Até Lá Abaixo · 2010', title: 'Lisboa → Joanesburgo', id: 'ate-la-abaixo-2010', facts: [['≈ 30 000 km', 'distância'], ['≈ 150 dias', 'na estrada'], ['21', 'países']] },
      { type: 'stops', kicker: 'O percurso', title: 'Paragem a paragem', id: 'ate-la-abaixo-2010', items: [
        ['Lisboa', 'A partida: três amigos, um jipe e o sul pela frente.'],
        ['Tânger', 'O ferry no Estreito e a entrada em África.'],
        ['Gâmbia', 'Pela costa da África Ocidental.'],
        ['Angola', 'Depois da África Ocidental e Central.'],
        ['Zâmbia', 'A travessia do continente para leste.'],
        ['Zimbabué', 'Um gangue de miúdos de rua fura-lhes um pneu e tenta roubar o equipamento.'],
        ['Joanesburgo', 'O Mundial, em junho de 2010.'],
      ] },
      { type: 'photo', id: 'ate-la-abaixo-2010', stop: 'Angola', kicker: 'O outro lado do futebol', title: 'Uma língua comum, de Marrocos a Joanesburgo', text: 'Uma viagem pelo futebol em África, e também sobre o medo e a superação.' },
      { type: 'text', kicker: 'Para ler e ver', title: 'O livro e o documentário', text: '“Até Lá Abaixo”, de Tiago Carrasco (Oficina do Livro, 2011), com fotografias de João Henriques, e o documentário “Até Lá Abaixo: O Outro Lado do Futebol em África”, de João Fontes.' },
      { type: 'cta', title: 'Segue cada paragem e planeia a tua', lede: 'A viagem está no mapa do Adventure Planner, com as paragens e a história. Planear a tua demora uma frase.', button: 'Link na bio', note: 'Percurso aproximado, a partir de fontes públicas.' },
    ],
  },
};

const params = new URLSearchParams(location.search);
const deck = DECKS[params.get('deck') || 'africa'];
const index = Number(params.get('slide') || 0);
const ROAD = new Set(['ride', 'walk', 'truck', 'bus']);
const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

/** The sharpest Wikimedia thumbnail that exists (wider ones fail when the original is smaller). */
async function bestImage(url: string): Promise<string> {
  for (const w of [1280, 1080, 960, 800, 640]) {
    const u = url.replace(/\/\d+px-/, `/${w}px-`);
    const ok = await new Promise<boolean>(r => { const im = new Image(); im.onload = () => r(im.naturalWidth > 0); im.onerror = () => r(false); im.src = u; });
    if (ok) return u;
  }
  return url;
}

async function journey(id: string): Promise<Journey> { return (await fetch(`/inspiration/${id}.json`)).json(); }

/** Pieces of a journey's line over land (no long sea or unknown legs), continuous across 180°. */
function pieces(j: Journey): Pt[][] {
  const out: Pt[][] = [];
  let cur: Pt[] = [];
  for (const l of j.legs) {
    if (!ROAD.has(l.by) && l.km > 2500) { if (cur.length > 1) out.push(cur); cur = []; continue; }
    for (const p of l.line) {
      const prev = cur[cur.length - 1];
      let q: Pt = [p[0], p[1]];
      if (prev) { while (q[1] - prev[1] > 180) q = [q[0], q[1] - 360]; while (prev[1] - q[1] > 180) q = [q[0], q[1] + 360]; }
      cur.push(q);
    }
  }
  if (cur.length > 1) out.push(cur);
  return out;
}

/** An SVG mini-map of some journeys on land outlines, framed to the box's shape. */
function miniMap(land: string, js: { j: Journey; numbered?: boolean; labels?: boolean }[], w: number, h: number, minSpan = 8): string {
  const all = js.flatMap(x => pieces(x.j).flat());
  const lats = all.map(p => p[0]), lngs = all.map(p => p[1]);
  let x0 = Math.min(...lngs), x1 = Math.max(...lngs), y0 = -Math.max(...lats), y1 = -Math.min(...lats);
  let vw = x1 - x0, vh = y1 - y0;
  const pad = Math.max(vw, vh) * 0.12 + 0.6;
  vw += 2 * pad; vh += 2 * pad;
  vh = Math.max(vh, minSpan, vw * (h / w)); vw = Math.max(vw, vh * (w / h));
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  x0 = cx - vw / 2; y0 = cy - vh / 2;
  const path = (p: Pt[]) => p.map(([la, lo], i) => `${i ? 'L' : 'M'}${lo.toFixed(3)} ${(-la).toFixed(3)}`).join('');
  const r = vh * 0.018;
  const lines = js.map(({ j }) => pieces(j).map(p => `<path d="${path(p)}" fill="none" stroke="#fff" stroke-width="7" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/><path d="${path(p)}" fill="none" stroke="${j.color}" stroke-width="3.6" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>`).join('')).join('');
  const dots = js.map(({ j, numbered }) => (numbered ? j.stops : [j.stops[0], j.stops[j.stops.length - 1]]).map((s, i, arr) =>
    `<circle cx="${s.at[1]}" cy="${-s.at[0]}" r="${r}" fill="${numbered || i === arr.length - 1 ? j.color : '#fff'}" stroke="${numbered || i === arr.length - 1 ? '#fff' : j.color}" stroke-width="2" vector-effect="non-scaling-stroke"/>`
    + (numbered ? `<text x="${s.at[1]}" y="${-s.at[0]}" font-size="${r * 1.2}" fill="#fff" text-anchor="middle" dominant-baseline="central" font-weight="700" font-family="Liberation Sans, sans-serif">${i + 1}</text>` : '')).join('')).join('');
  const fs = vh * 0.045;
  const labels = js.filter(x => x.labels).map(({ j }) => { const a = j.stops[0], b = j.stops[j.stops.length - 1]; return Math.hypot(a.at[0] - b.at[0], a.at[1] - b.at[1]) < vh * 0.06 ? [a] : [a, b]; }).map(sts => sts.map(st =>
    `<text x="${st.at[1] + r * 1.6}" y="${-st.at[0]}" font-size="${fs}" font-weight="700" font-family="Liberation Sans, sans-serif" fill="#1e293b" stroke="#fffcf4" stroke-width="${fs * 0.28}" paint-order="stroke" dominant-baseline="central">${esc(st.name)}</text>`).join('')).join('');
  return `<svg class="map" width="${w}" height="${h}" viewBox="${x0} ${y0} ${vw} ${vh}" preserveAspectRatio="xMidYMid slice">
    <rect x="${x0}" y="${y0}" width="${vw}" height="${vh}" fill="#d7e8ef"/>
    <path d="${land}" fill="#f4efe2" stroke="#c8bb9c" stroke-width="0.8" vector-effect="non-scaling-stroke"/>${lines}${dots}${labels}</svg>`;
}

/** A small locator map (the continent around a short route) for the corner of a route map. */
function locator(land: string, j: Journey): string {
  const all = pieces(j).flat();
  const lats = all.map(p => p[0]), lngs = all.map(p => p[1]);
  const span = Math.max(Math.max(...lngs) - Math.min(...lngs), Math.max(...lats) - Math.min(...lats));
  if (span > 9) return '';
  const cx = (Math.max(...lngs) + Math.min(...lngs)) / 2, cy = -(Math.max(...lats) + Math.min(...lats)) / 2;
  const vw = 70, vh = 52;
  return `<svg width="120" height="90" viewBox="${cx - vw / 2} ${cy - vh / 2} ${vw} ${vh}" style="position:absolute;right:10px;top:10px;border-radius:8px;border:2px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,.2)">
    <rect x="${cx - vw / 2}" y="${cy - vh / 2}" width="${vw}" height="${vh}" fill="#d7e8ef"/><path d="${land}" fill="#f4efe2" stroke="#c8bb9c" stroke-width="0.6" vector-effect="non-scaling-stroke"/>
    <circle cx="${cx}" cy="${cy}" r="2.2" fill="${j.color}" stroke="#fff" stroke-width="1.5" vector-effect="non-scaling-stroke"/></svg>`;
}

const foot = (dark = false) => `<div class="foot"><span>${deck.brand}</span><span>${index + 1} / ${deck.slides.length}</span></div>${index < deck.slides.length - 1 ? `<div class="swipe">${deck.swipe}</div>` : ''}`;
const shortWhen = (s: string) => s.replace(/^Best /, '').replace(/\s*\(.*\)$/, '');
const [timeOf, vehicleOf] = [(v: string) => (v.split(',').slice(1).join(',').trim() || '—'), (v: string) => v.split(',')[0].trim()];

async function render() {
  const land: string = (await (await fetch('/inspiration/land.json')).json()).d;
  const s = deck.slides[index];
  const root = document.getElementById('root')!;
  let html = '';
  if (s.type === 'cover') {
    const js = await Promise.all(s.ids.map(journey));
    html = `<div class="slide${s.dark ? ' dark' : ''}" style="${s.dark ? 'background:#0b1622;color:#fff' : ''}"><div class="pad">
      <div class="kicker" style="${s.dark ? 'color:#6ee7b7' : ''}">${esc(s.kicker)}</div><h1>${esc(s.title)}</h1><p class="lede" style="${s.dark ? 'color:#cbd5e1' : ''}">${esc(s.lede)}</p></div>
      <div style="position:absolute;left:34px;right:34px;bottom:74px">${miniMap(land, js.map(j => ({ j })), 472, s.dark ? 330 : 360)}</div>${foot(s.dark)}</div>`;
  } else if (s.type === 'route') {
    const j = await journey(s.id);
    html = `<div class="slide"><div class="pad">
      <div style="display:flex;align-items:center;gap:12px"><span class="num" style="background:${j.color}">${s.n}</span><div class="kicker">${esc(vehicleOf(j.vehicle))}</div></div>
      <h2>${esc(j.title)}</h2><div style="position:relative">${miniMap(land, [{ j, labels: true }], 472, 300, 3)}${locator(land, j)}</div>
      <div class="facts"><div class="fact"><span>Distance</span><b>${Math.round(j.km).toLocaleString('en')} km</b></div><div class="fact"><span>Time</span><b>${esc(timeOf(j.vehicle))}</b></div><div class="fact"><span>Best</span><b style="font-size:12.5px">${esc(shortWhen(j.when))}</b></div></div>
      <p class="why">${esc(s.why)}</p></div>${foot()}</div>`;
  } else if (s.type === 'map') {
    const j = await journey(s.id);
    html = `<div class="slide"><div class="pad"><div class="kicker">${esc(s.kicker)}</div><h2>${esc(s.title)}</h2>${miniMap(land, [{ j, numbered: true }], 472, 400)}
      <div class="facts">${s.facts.map(([b, l]) => `<div class="fact"><b>${esc(b)}</b><span>${esc(l)}</span></div>`).join('')}</div></div>${foot()}</div>`;
  } else if (s.type === 'stops') {
    const j = await journey(s.id);
    html = `<div class="slide"><div class="pad"><div class="kicker">${esc(s.kicker)}</div><h2>${esc(s.title)}</h2>
      <ul class="stops">${s.items.map(([n, t], i) => `<li><span class="dot" style="background:${j.color}">${i + 1}</span><span><b>${esc(n)}</b> · ${esc(t)}</span></li>`).join('')}</ul></div>${foot()}</div>`;
  } else if (s.type === 'photo') {
    const j = await journey(s.id);
    const st = j.stops.find(x => x.name === s.stop) || j.stops.find(x => x.photo)!;
    const img = st.photo?.url ? await bestImage(st.photo.url) : '';
    html = `<div class="slide dark">${img ? `<img class="photo" src="${img}" alt="">` : ''}<div class="shade"></div>
      <div class="over"><div class="kicker">${esc(s.kicker)}</div><h2 style="font-size:32px">${esc(s.title)}</h2><p class="lede" style="color:#e2e8f0">${esc(s.text)}</p></div>
      ${st.photo?.credit ? `<div class="credit">Foto: ${esc(st.photo.credit)} · ${esc(st.photo.license || '')} · Wikimedia Commons</div>` : ''}${foot(true)}</div>`;
  } else if (s.type === 'text') {
    html = `<div class="slide"><div class="pad" style="padding-top:120px"><div class="kicker">${esc(s.kicker)}</div><h1>${esc(s.title)}</h1><p class="lede">${esc(s.text)}</p></div>${foot()}</div>`;
  } else if (s.type === 'cta') {
    html = `<div class="slide" style="background:#0b1622;color:#fff"><div class="pad" style="padding-top:150px"><div class="kicker" style="color:#6ee7b7">${esc(deck.brand)}</div>
      <h1>${esc(s.title)}</h1><p class="lede" style="color:#cbd5e1">${esc(s.lede)}</p><div class="cta">${esc(s.button)}</div>
      <p style="margin-top:22px;font-size:12px;color:#94a3b8">${esc(s.note)}</p></div>${foot(true)}</div>`;
  }
  root.innerHTML = html;
  await Promise.all([...root.querySelectorAll('img')].map(im => (im as HTMLImageElement).complete ? null : new Promise(r => { im.addEventListener('load', r); im.addEventListener('error', r); })));
  await new Promise(r => setTimeout(r, 300));
  (window as any).slideCount = deck.slides.length;
  (window as any).slideReady = true;
}
render().catch(err => { (window as any).slideError = String(err); console.error(err); });
