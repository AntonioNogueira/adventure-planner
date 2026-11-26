// A plan read straight from the words, without the AI: used when every AI provider is busy or out of quota, so a
// simple request ("lisbon to porto bikepacking", "Porto para Lisboa de bicicleta em 5 dias") still draws a trip.
// It understands start and finish, places to pass ("via X and Y"), how they travel, days or km a day, where they
// sleep and off-road; anything subtler waits for the AI ("ask me to refine it").
import fs from 'fs';
import path from 'path';

export interface QuickIntent {
  origin: string; destination: string; travelMode: 'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT'; travelModeStated: boolean;
  days: number; dailyKm: number; route: { place: string; overnight: boolean }[]; lodging: 'any' | 'camping' | 'hostel' | 'hotel';
  avoidFerries: boolean; offroad: boolean; vehicle: string; ride: string; party: string; interests: string[]; budgetStyle: string;
  maxStayPrice: number; vehicleModel: string; coastFrom: string; coastTo: string; summary: string; reply: string;
  preferences: string[]; fromProfile: string[]; startDate: string;
}

const MODES: [RegExp, QuickIntent['travelMode'], string][] = [
  [/\b(bikepacking|bike ?packing|bicycle|bike|cycling|cycle ?tour\w*|gravel|mtb|mountain ?bike|e-?bike|bicicleta|btt|ciclismo|v[ée]lo|pedalar)\b/i, 'BICYCLING', ''],
  [/\b(hik\w*|walk\w*|trek\w*|on foot|camino|pilgrim\w*|caminhada|a p[ée]|andar|senderismo|randonn[ée]e|thru-?hike)\b/i, 'WALKING', ''],
  [/\b(motorcycle|motorbike|moto|mota|motocicleta|adventure bike|enduro|bmw gs|africa twin|t[ée]n[ée]r[ée])\b/i, 'DRIVING', 'motorcycle'],
  [/\b(campervan|camper|motorhome|autocaravana|caravana)\b/i, 'DRIVING', 'campervan'],
  [/\b(4x4|four-?wheel|overland\w*|jeep|land cruiser|defender)\b/i, 'DRIVING', '4x4'],
  [/\b(car|drive|driving|road ?trip|carro|autom[óo]vel|coche|voiture)\b/i, 'DRIVING', 'car'],
  [/\b(train|bus|rail|comboio|autocarro|transportes?)\b/i, 'TRANSIT', ''],
];

/** Words that describe the trip, cut from the end of a place name ("porto bikepacking" → "porto"). */
const TAIL = /\s*(?:\b(?:by|on|in|with|for|over|during|via|through|along|following|near|around|across|ao longo|pela|pelo|perto|seguindo|de|em|por|com|en|par|à|a|camping|wild|bikepacking|bike ?packing|bicycle|bike|cycling|gravel|mtb|hiking|hike|walking|walk|trek\w*|motorcycle|motorbike|moto|mota|car|campervan|4x4|road ?trip|trip|adventure|tour|loop|weekend|week|days?|dias?|d[ií]as|jours?|semanas?|weeks?|km|bicicleta|caminhada|carro|viagem|journey|overland)\b.*|\d.*|[,.;!?(].*)$/i;

const cap = (s: string) => s.trim().replace(/\s+/g, ' ').replace(/(^|[\s-])(\p{L})/gu, (_, a, b) => a + b.toUpperCase());
const cleanPlace = (s: string) => cap(s.replace(TAIL, '').replace(/^(the|o|a|os|as|el|la)\s+/i, '').trim());

function numberWord(s: string): number {
  const words: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, um: 1, uma: 1, dois: 2, duas: 2, 'três': 3, tres: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9, dez: 10 };
  return Number(s) || words[s.toLowerCase()] || 0;
}

// Names that aren't one findable place: a route network, a whole coast, a country (too big to start or end a trip
// at). Without the AI, guessing those draws nonsense ("Eurovelo" near Gibraltar, "France" in North America), so the
// quick planner gives up and the traveller is asked to try again.
const ROUTE_NETWORK = /\b(eurovelo|euro ?velo|ev ?\d+)\b/i;
const GENERIC = new Set(['home', 'casa', 'coast', 'the coast', 'costa', 'a costa', 'cote', 'route', 'trail', 'camino', 'caminho', 'alps', 'the alps', 'pyrenees', 'the pyrenees', 'pirineus', 'mountains', 'the mountains', 'montanhas', 'desert', 'the desert', 'anywhere', 'somewhere', 'island', 'islands']);
let countryNames: Set<string> | null = null;
function isCountry(name: string): boolean {
  if (!countryNames) {
    countryNames = new Set();
    try {
      for (const c of JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'server/safety-countries.json'), 'utf8')) as { name: string }[]) countryNames.add(fold(c.name));
    } catch { /* no list: only the words above */ }
    ['portugal', 'espanha', 'spain', 'españa', 'franca', 'france', 'frança', 'italia', 'italy', 'germany', 'alemanha', 'morocco', 'marrocos', 'uk', 'usa', 'europe', 'europa', 'africa', 'asia'].forEach(n => countryNames!.add(fold(n)));
  }
  return countryNames.has(fold(name));
}
const fold = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
/** Just a country ("France", "Spain"), without a town. */
export function isBareCountry(name: unknown): boolean {
  return typeof name === 'string' && isCountry(name.split(',')[0]) && !name.includes(',');
}

/** A start or finish the map can find as one place (a town or city), not a region, route or country. */
export function placeLike(name: string): boolean {
  const n = name.trim();
  return n.length >= 2 && !ROUTE_NETWORK.test(n) && !GENERIC.has(fold(n)) && (n.includes(',') || !isCountry(n));
}

export function parseQuickIntent(request: string, current?: Partial<QuickIntent> | null, usualMode?: string): QuickIntent | null {
  const text = ` ${request.replace(/[→–—]/g, ' to ').replace(/\s+/g, ' ')} `;

  // Start and finish: "from A to B", "A to B", "de A a/para/até B", "A - B".
  const pair = text.match(/\b(?:from|de|desde|da|do)\s+(.+?)\s+(?:to|a|para|até|ate|hasta|à)\s+(.+)/i)
    || text.match(/^\s*(.+?)\s+(?:to|para|até|ate|hasta)\s+(.+)/i)
    || text.match(/^\s*([^\d-]+?)\s+-\s+(.+)/);
  let origin = pair ? cleanPlace(pair[1]) : '';
  let destination = pair ? cleanPlace(pair[2]) : '';
  // "a loop from Braga", "round trip from X": back to the start.
  const loop = text.match(/\b(?:loop|round[- ]trip|circuit|volta|circular)\b.*?\b(?:from|de|in|em|around|à volta de)\s+([^,.;]+)/i);
  if (!pair && loop) { origin = cleanPlace(loop[1]); destination = origin; }
  // A change to the trip on the map ("make it 5 days", "by bike instead") keeps its start and finish.
  if ((!origin || !destination) && current?.origin && current?.destination) { origin = current.origin; destination = current.destination; }
  if (!origin || !destination || origin.length > 60 || destination.length > 60) return null;
  // Not one findable place at either end (and not the trip already on the map): don't guess.
  if (!(current?.origin === origin && current?.destination === destination) && (!placeLike(origin) || !placeLike(destination))) return null;
  // Nor a request about a route network ("eurovelo along the coast to …"): which one, from where?
  if (!current?.origin && /\b(eurovelo|euro velo|ev ?\d+)\b/i.test(text)) return null;

  // Places to pass: "via X, Y and Z" / "passando por X e Y".
  const viaMatch = text.match(/\b(?:via|through|passing|passando por|por)\s+(.+?)(?:\s+(?:in|em|en|by|de|on|with|com)\s+\d|\s*[.;!?]|$)/i);
  const route = viaMatch
    ? viaMatch[1].split(/,|\band\b|\be\b|\by\b/i).map(cleanPlace).filter(p => p && p.length < 50 && p.toLowerCase() !== origin.toLowerCase() && p.toLowerCase() !== destination.toLowerCase()).slice(0, 12).map(place => ({ place, overnight: false }))
    : (current?.route as QuickIntent['route']) || [];

  // Not said how: the trip's mode, else how they usually travel (their profile), else driving.
  let travelMode: QuickIntent['travelMode'] = (current?.travelMode as QuickIntent['travelMode'])
    || (['BICYCLING', 'WALKING', 'DRIVING'].includes(usualMode || '') ? usualMode as QuickIntent['travelMode'] : 'DRIVING');
  let vehicle = (current?.vehicle as string) || '';
  let stated = false;
  for (const [re, mode, veh] of MODES) {
    if (re.test(text)) { travelMode = mode; vehicle = mode === 'DRIVING' ? veh : ''; stated = true; break; }
  }

  let days = current?.days || 0, dailyKm = current?.dailyKm || 0;
  const d = text.match(/\b(\d{1,3}|one|two|three|four|five|six|seven|eight|nine|ten|um|uma|dois|duas|tr[eê]s|quatro|cinco|seis|sete|oito|nove|dez)\s*(days?|dias?|d[ií]as|jours?|nights?|noites?)\b/i);
  const w = text.match(/\b(\d{1,2}|one|two|three|four|um|uma|dois|duas|tr[eê]s|quatro)\s*(weeks?|semanas?|semaines?)\b/i);
  if (d) days = numberWord(d[1]) + (/night|noite/i.test(d[2]) ? 1 : 0);
  else if (w) days = numberWord(w[1]) * 7;
  else if (/\b(a|one|uma) (week|semana)\b/i.test(text)) days = 7;
  else if (/\b(weekend|fim de semana|fim-de-semana)\b/i.test(text)) days = 2;
  const k = text.match(/\b(\d{2,4})\s*km\s*(?:a|per|\/|por|each)?\s*(?:day|dia|d[ií]a)\b/i);
  if (k) { dailyKm = Number(k[1]); if (!d && !w) days = 0; }
  if (days > 120) days = 0;

  let lodging: QuickIntent['lodging'] = (current?.lodging as QuickIntent['lodging']) || 'any';
  if (/\b(camp\w*|tent|tenda|campismo|bivouac|bivy|wild camp\w*)\b/i.test(text)) lodging = 'camping';
  else if (/\b(hostels?|albergues?|refugios?|refuges?)\b/i.test(text)) lodging = 'hostel';
  else if (/\b(hotels?|guest ?houses?|b&b|bed and breakfast|pousadas?|pensions?|pens[õo]es|airbnb|alojamento local)\b/i.test(text)) lodging = 'hotel';
  else if (/\bbikepacking\b/i.test(text)) lodging = 'camping';

  const offroad = /\b(off-?road|gravel|dirt|trails?|unpaved|terra batida|trilhos?|enduro|mtb|btt|bikepacking|overland)\b/i.test(text) || Boolean(current?.offroad);
  const avoidFerries = /\b(no ferr(y|ies)|without ferr(y|ies)|overland only|sem ferry|sem barco)\b/i.test(text) || Boolean(current?.avoidFerries);

  return {
    origin, destination, travelMode, travelModeStated: stated, days, dailyKm, route, lodging, avoidFerries, offroad,
    vehicle, ride: '', party: '', interests: [], budgetStyle: '', maxStayPrice: 0, vehicleModel: '', coastFrom: '', coastTo: '',
    summary: `${origin} → ${destination}`, reply: '', preferences: [], fromProfile: [], startDate: '',
  };
}

/** What the planner says when it used the quick reading (in the traveller's language when known). */
export function quickReply(language?: string): string {
  const lang = (language || 'en').slice(0, 2).toLowerCase();
  if (lang === 'pt') return 'A IA está muito ocupada neste momento, por isso li o pedido eu mesmo e desenhei a viagem. Dentro de um minuto posso afiná-la: diga-me o que mudar.';
  if (lang === 'es') return 'La IA está muy ocupada ahora mismo, así que leí la petición yo mismo y dibujé el viaje. En un minuto puedo afinarlo: dime qué cambiar.';
  if (lang === 'fr') return 'L’IA est très occupée en ce moment : j’ai lu la demande moi-même et tracé le voyage. Dans une minute je peux l’affiner : dites-moi quoi changer.';
  return 'The AI is very busy right now, so I read your request myself and drew the trip. In a minute I can fine-tune it: just tell me what to change.';
}
