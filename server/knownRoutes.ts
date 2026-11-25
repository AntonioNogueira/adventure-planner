// Routes the Mappa Mundi already knows (public/inspiration): when a request names one ("Ecopista do Dão by bicycle",
// "the EN2 on a motorbike", "Camino Francés"), the planner is given its real line instead of guessing (the AI once
// sent "Ecopista do Dão" from Viseu to Aveiro: a different railway).
import fs from 'fs';
import path from 'path';

export interface KnownRoute { id: string; title: string; km: number; places: string[] }

/** Other names people use for some routes. */
const ALIASES: Record<string, string[]> = {
  'estrada-nacional-2': ['en2', 'en 2', 'n2', 'estrada nacional 2', 'nacional 2'],
  'camino-frances': ['camino frances', 'french way', 'caminho frances', 'camino de santiago frances'],
  'camino-portugues-coastal': ['camino portugues da costa', 'caminho portugues da costa', 'coastal camino', 'portuguese coastal way'],
  'route-66': ['route 66', 'historic route 66'],
  'carretera-austral': ['carretera austral', 'ruta 7 chile'],
  'transamazonica': ['transamazonica', 'br 230', 'br-230', 'trans amazonian highway'],
  'pamir-highway': ['pamir highway', 'm41'],
  'karakoram-highway': ['karakoram highway', 'kkh'],
  'north-coast-500': ['nc500', 'north coast 500'],
  'tour-du-mont-blanc': ['tmb', 'tour du mont blanc'],
  'ruta-40-argentina': ['ruta 40', 'route 40 argentina'],
  'ecopista-do-dao': ['ecopista do dao', 'ecopista dao'],
  'fishermens-trail': ['fishermens trail', 'fishermen s trail', 'trilho dos pescadores', 'rota vicentina'],
  'great-ocean-road': ['great ocean road'],
  'transfagarasan-transalpina': ['transfagarasan', 'transalpina'],
  'wild-atlantic-way-bike': ['wild atlantic way'],
  'loire-a-velo': ['loire a velo', 'loire by bike'],
  'danube-cycle-path': ['danube cycle path', 'danube cycleway', 'eurovelo 6'],
  'velodyssee-bordeaux-hendaye': ['velodyssee', 'eurovelo 1 france'],
  'viarhona': ['viarhona', 'via rhona', 'eurovelo 17'],
  'canal-des-deux-mers': ['canal des deux mers', 'canal des 2 mers'],
  'route-des-grandes-alpes': ['route des grandes alpes'],
};

const norm = (s: string) => ` ${s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()} `;

let names: { id: string; title: string; key: string }[] | null = null;
function loadNames() {
  if (names) return names;
  names = [];
  for (const dir of ['dist/inspiration', 'public/inspiration']) {
    try {
      const index = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), dir, 'index.json'), 'utf8')) as { id: string; title: string }[];
      for (const j of index) {
        if (j.id.startsWith('dakar-')) continue;
        // The route's own name: the title before any ":" or "(" (e.g. "Ecopista do Dão", "Route 66"), and its id.
        const main = j.title.split(/[:(]/)[0];
        const keys = new Set([norm(main), norm(j.id.replace(/-/g, ' ')), ...(ALIASES[j.id] || []).map(norm)]);
        for (const key of keys) if (key.trim().length >= 6 || ALIASES[j.id]?.map(norm).includes(key)) names.push({ id: j.id, title: j.title, key });
      }
      break;
    } catch { /* try the next folder */ }
  }
  return names;
}

/** The known route a request names (the longest name found in it), with its places in order. */
export function findKnownRoute(request: string): KnownRoute | null {
  const text = norm(request);
  const hit = loadNames().filter(n => text.includes(n.key)).sort((a, b) => b.key.length - a.key.length)[0];
  if (!hit) return null;
  for (const dir of ['dist/inspiration', 'public/inspiration']) {
    try {
      const j = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), dir, `${hit.id}.json`), 'utf8'));
      const places = (j.stops || []).map((s: { place?: string; q?: string; name: string }) => s.place || s.q || s.name).filter(Boolean);
      if (places.length >= 2) return { id: hit.id, title: j.title, km: Math.round(j.km || 0), places };
    } catch { /* next */ }
  }
  return null;
}

/** What the AI is told about it. */
export function knownRouteHint(r: KnownRoute): string {
  return `\n\nKNOWN ROUTE: the traveller named "${r.title}" (about ${r.km} km). Its real line, in order: ${r.places.join(' → ')}.
Use it: origin "${r.places[0]}", destination "${r.places[r.places.length - 1]}", and the places between as route places
(overnight false), unless the traveller clearly asks for only part of it, the other direction, or different places.`;
}

const town = (p: string) => norm(String(p || '').split(',')[0]).trim();

/** Puts the known line back when the AI's answer left it (start, finish and places not on the route), and gives the
 *  places their full names (with the country) so the map finds the right ones. */
export function applyKnownRoute(intent: { origin: string; destination: string; route?: { place: string; overnight: boolean }[] }, r: KnownRoute) {
  const byTown = new Map(r.places.map(p => [town(p), p]));
  const [a, b] = [town(intent.origin), town(intent.destination)];
  const nights = new Set((intent.route || []).filter(x => x.overnight).map(x => town(x.place)));
  if (byTown.has(a) && byTown.has(b)) {
    // It used the route (all of it, part of it, or the other way): full names, and the places between if it gave none.
    intent.origin = byTown.get(a)!;
    intent.destination = byTown.get(b)!;
    if (!(intent.route || []).length) {
      const [i, j] = [r.places.findIndex(p => town(p) === a), r.places.findIndex(p => town(p) === b)];
      const between = i < j ? r.places.slice(i + 1, j) : r.places.slice(j + 1, i).reverse();
      intent.route = between.map(place => ({ place, overnight: false }));
    } else intent.route = intent.route!.map(x => ({ ...x, place: byTown.get(town(x.place)) || x.place }));
    return false;
  }
  intent.origin = r.places[0];
  intent.destination = r.places[r.places.length - 1];
  intent.route = r.places.slice(1, -1).map(place => ({ place, overnight: nights.has(town(place)) }));
  return true;
}
