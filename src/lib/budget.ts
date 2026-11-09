// Trip budget: a day-by-day estimate from average costs, with booked accommodation prices
// taking the place of the estimate for the nights they cover. Pure functions, unit-tested.
import { InterestCategory, InterestItem, RouteLeg } from '../types';
import { ScheduleDay } from './schedule';
import { estimatedFuelPrice, estimatedTollRate, estimatedConsumption, kmByCountry, Vehicle, TOLL_FACTOR } from './fuel';

export interface BudgetSettings {
  currency: string;
  stayPerNight: number;
  foodPerDay: number;
  /** Litres per 100 km (unset = estimated from the trip); 0 for bike, hike and transit. */
  fuelPer100km?: number;
  /** Price per litre (unset = estimated from the countries on the route). */
  fuelPrice?: number;
  /** Older saved budgets: a toll total the traveller entered (added as is). */
  tollsTotal: number;
  /** Toll per km driven on toll roads (unset = typical rate of the countries on the route; toll km from OpenStreetMap). */
  tollPerKm?: number;
  otherPerDay: number;
  /** Count a night at the finish (you sleep there before going home). */
  includeFinishNight: boolean;
  /** One-off costs: ferry tickets, insurance, gear… */
  extras: { label: string; amount: number }[];
  /** Amounts typed into the table, by day number ("0" = the night before day 1); they replace the estimates. */
  dayEdits?: Record<string, { stay?: number; food?: number; other?: number }>;
  /** Fuel or toll total typed into the table, replacing the estimate. */
  fuelOverride?: number;
  tollOverride?: number;
}

export type DayField = 'stay' | 'food' | 'other';

export type Lodging = 'any' | 'camping' | 'hostel' | 'hotel';

interface Preset { stay: Record<Lodging, number>; food: number; fuelPerLitre: number; other: number; tollPerKm: number }

/** Typical starting costs per currency (the traveller edits them). */
const PRESETS: Record<string, Preset> = {
  EUR: { stay: { camping: 20, hostel: 30, hotel: 75, any: 55 }, food: 30, fuelPerLitre: 1.75, other: 10, tollPerKm: 0.07 },
  GBP: { stay: { camping: 20, hostel: 30, hotel: 80, any: 60 }, food: 30, fuelPerLitre: 1.45, other: 10, tollPerKm: 0.05 },
  USD: { stay: { camping: 30, hostel: 40, hotel: 120, any: 90 }, food: 40, fuelPerLitre: 0.95, other: 15, tollPerKm: 0.05 },
  BRL: { stay: { camping: 60, hostel: 90, hotel: 250, any: 180 }, food: 90, fuelPerLitre: 6.2, other: 30, tollPerKm: 0.15 },
};
/** Other currencies: the euro figures at a rough exchange rate, rounded. */
const PER_EURO: Record<string, number> = { CHF: 1, SEK: 11.5, NOK: 11.7, DKK: 7.5, PLN: 4.3, CZK: 25, CAD: 1.5, AUD: 1.65, JPY: 160 };

function preset(currency: string): Preset {
  if (PRESETS[currency]) return PRESETS[currency];
  const rate = PER_EURO[currency] ?? 1;
  const e = PRESETS.EUR;
  const r = (n: number) => (rate >= 10 ? Math.round(n * rate / 10) * 10 : Math.round(n * rate));
  return {
    stay: { camping: r(e.stay.camping), hostel: r(e.stay.hostel), hotel: r(e.stay.hotel), any: r(e.stay.any) },
    food: r(e.food), fuelPerLitre: Math.round(e.fuelPerLitre * rate * 100) / 100, other: r(e.other),
    tollPerKm: Math.round(e.tollPerKm * rate * 100) / 100,
  };
}

/** Sensible starting averages for the travel mode, lodging choice and currency (the traveller edits them). */
export function defaultBudget(travelMode: string, lodging: Lodging = 'any', currency = 'EUR'): BudgetSettings {
  const motor = travelMode === 'DRIVING';
  const p = preset(currency);
  return {
    currency,
    stayPerNight: p.stay[lodging] ?? p.stay.any,
    foodPerDay: p.food,
    // Fuel, consumption and tolls are estimated from the route until the traveller types their own.
    ...(motor ? {} : { fuelPer100km: 0, fuelPrice: 0, tollPerKm: 0 }),
    tollsTotal: 0,
    otherPerDay: travelMode === 'TRANSIT' ? p.other * 2 : p.other,
    includeFinishNight: false,
    extras: [],
  };
}

export interface BudgetStop {
  /** 'start' | 'stop-0' … | 'end' */
  key: string;
  label: string;
  interests: InterestCategory[];
}

export interface BudgetRow {
  day: number;
  date?: string;
  /** 'before': the night before day 1 at the start, shown when it's booked. */
  kind: 'ride' | 'rest' | 'before';
  label: string;
  km: number;
  /** Where the night is spent, if any. */
  nightAt?: string;
  stay: number;
  /** 'places' (from the places to stay at that stop) | 'estimate' (your average) | 'booked' (a reservation's price)
   *  | 'covered' (booking counted on an earlier night) | 'none' */
  stayKind: 'places' | 'estimate' | 'booked' | 'covered' | 'none';
  stayNote?: string;
  food: number;
  /** Food priced from the restaurants at the stop (their price level). */
  foodFromPlaces?: boolean;
  other: number;
  total: number;
  /** Cells the traveller typed (the rest are estimates). */
  edited?: DayField[];
}

export interface Budget {
  rows: BudgetRow[];
  nights: number;
  totals: { stay: number; food: number; fuel: number; other: number; tolls: number; extras: number; bookings: number; all: number };
  /** Fuel for the whole trip: riding km × consumption × price (each estimated unless typed). */
  fuel: { km: number; per100km: number; price: number; estimatedPrice: boolean; estimatedConsumption: boolean; countries: string[] };
  /** Tolls for the whole trip: km on toll roads × rate per km. */
  tolls: { km: number; rate: number; estimatedRate: boolean; known: boolean };
  /** The fuel or toll total was typed into the table. */
  fuelEdited?: boolean;
  tollEdited?: boolean;
  /** Other priced bookings (tickets, tours…), in the budget currency. */
  bookings: { name: string; stop: string; amount: number }[];
  /** Booked prices in another currency, not included in the totals. */
  otherCurrencies: Record<string, number>;
  perDay: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const addDay = (date: string, days: number) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};
const isStay = (cat: InterestCategory, category?: string) =>
  category === 'stay' || /accommodation|hotel|stay|camp|lodg|hostel/i.test(cat.category);

/** Priced bookings that aren't accommodation (ferry or train tickets, tours…). */
export function otherBookings(stops: BudgetStop[]) {
  const out: { name: string; stop: string; amount: number; currency: string }[] = [];
  stops.forEach(stop => stop.interests.forEach(cat => cat.items.forEach(item => {
    const r = item.reservation;
    if (item.source !== 'reservation' || !r?.price || r.price <= 0 || isStay(cat, item.category)) return;
    out.push({ name: item.name, stop: stop.label, amount: r.price, currency: (r.currency || '').toUpperCase() || '?' });
  })));
  return out;
}

const KIND_PRICE: Record<NonNullable<InterestItem['stayKind']>, Lodging> = { camping: 'camping', hostel: 'hostel', guesthouse: 'any', hotel: 'hotel' };
const LEVEL_FACTOR = [1, 0.7, 1, 1.5, 2.2];

/** A night's price from the places to stay suggested at a stop (their kind, or a price range), or null. */
export function stayFromPlaces(stop: BudgetStop | undefined, currency: string): { amount: number; count: number } | null {
  const p = preset(currency);
  const prices: number[] = [];
  stop?.interests.forEach(cat => cat.items.forEach(item => {
    if (item.source === 'reservation' || !isStay(cat, item.category)) return;
    if (item.priceRange && item.priceRange.currency.toUpperCase() === currency) prices.push((item.priceRange.min + item.priceRange.max) / 2);
    else if (item.stayKind) prices.push(p.stay[KIND_PRICE[item.stayKind]]);
  }));
  return prices.length ? { amount: round2(prices.reduce((a, b) => a + b, 0) / prices.length), count: prices.length } : null;
}

/** A day's food from the restaurants' price level at a stop (scaling your average), or null. */
export function foodFromPlaces(stop: BudgetStop | undefined, foodPerDay: number): number | null {
  const levels: number[] = [];
  stop?.interests.forEach(cat => cat.items.forEach(item => {
    if (item.source !== 'reservation' && item.priceLevel && (item.category === 'food' || /restaurant|cafe|food/i.test(cat.category))) levels.push(item.priceLevel);
  }));
  if (!levels.length) return null;
  const factor = levels.reduce((sum, l) => sum + LEVEL_FACTOR[Math.max(1, Math.min(4, Math.round(l)))], 0) / levels.length;
  return round2(foodPerDay * factor);
}

/** Booked accommodation at a stop: total price per currency and the names. */
export function bookedStay(stop: BudgetStop | undefined) {
  const prices: Record<string, number> = {};
  const names: string[] = [];
  stop?.interests.forEach(cat => cat.items.forEach(item => {
    const r = item.reservation;
    if (item.source !== 'reservation' || !r?.price || r.price <= 0 || !isStay(cat, item.category)) return;
    const cur = (r.currency || '').toUpperCase() || '?';
    prices[cur] = (prices[cur] || 0) + r.price;
    names.push(item.name);
  }));
  return { prices, names };
}

export function computeBudget(
  settings: BudgetSettings, schedule: ScheduleDay[], legs: RouteLeg[], stops: BudgetStop[],
  tollKm: number[] | null = null, opts: { offroad?: boolean; motor?: boolean; vehicle?: Vehicle } = {},
): Budget {
  const byKey = new Map(stops.map(s => [s.key, s]));
  const counted = new Set<string>();
  const otherCurrencies: Record<string, number> = {};
  const currency = settings.currency.toUpperCase();
  const lastRide = legs.length - 1;

  const nightCost = (key: string): Pick<BudgetRow, 'stay' | 'stayKind' | 'stayNote'> => {
    const { prices, names } = bookedStay(byKey.get(key));
    if (!names.length) {
      const fromPlaces = stayFromPlaces(byKey.get(key), currency);
      return fromPlaces
        ? { stay: fromPlaces.amount, stayKind: 'places', stayNote: `${fromPlaces.count}` }
        : { stay: settings.stayPerNight, stayKind: 'estimate' };
    }
    if (counted.has(key)) return { stay: 0, stayKind: 'covered', stayNote: `Included in ${names.join(', ')}` };
    counted.add(key);
    let stay = 0;
    const foreign: string[] = [];
    for (const [cur, amount] of Object.entries(prices)) {
      if (cur === currency) stay += amount;
      else { otherCurrencies[cur] = round2((otherCurrencies[cur] || 0) + amount); foreign.push(`${amount} ${cur}`); }
    }
    return { stay: round2(stay), stayKind: 'booked', stayNote: `${names.join(', ')}${foreign.length ? ` (+ ${foreign.join(', ')})` : ''}` };
  };

  const rows: BudgetRow[] = [];
  // A booked night at the start (arriving the evening before day 1).
  if (bookedStay(byKey.get('start')).names.length) {
    const night = nightCost('start');
    rows.push({
      day: 0, date: schedule[0]?.date ? addDay(schedule[0].date, -1) : undefined, kind: 'before',
      label: `Night before departure in ${byKey.get('start')!.label}`, km: 0, nightAt: byKey.get('start')!.label,
      ...night, food: 0, other: 0, total: night.stay,
    });
  }
  rows.push(...schedule.map((d, n) => {
    let label = '', km = 0, nightKey: string | undefined, foodKey: string | undefined;
    if (d.kind === 'ride') {
      const i = d.legIndex!;
      // Dinner where the day ends.
      foodKey = i < lastRide ? `stop-${i}` : 'end';
      const leg = legs[i];
      label = leg ? `${leg.from} → ${leg.to}` : `Day ${n + 1}`;
      km = Math.max(0, (leg?.distanceMeters || 0) / 1000 - (leg?.ferryKm || 0));
      if (i < lastRide) nightKey = `stop-${i}`;
      else if (settings.includeFinishNight) nightKey = 'end';
    } else {
      label = `Rest day in ${byKey.get(`stop-${d.stopIndex}`)?.label || `stop ${d.stopIndex! + 1}`}`;
      nightKey = `stop-${d.stopIndex}`;
      foodKey = nightKey;
    }
    const night = nightKey ? nightCost(nightKey) : { stay: 0, stayKind: 'none' as const };
    const placesFood = foodKey ? foodFromPlaces(byKey.get(foodKey), settings.foodPerDay) : null;
    const food = placesFood ?? settings.foodPerDay;
    const other = settings.otherPerDay;
    return {
      day: n + 1, date: d.date, kind: d.kind, label, km: Math.round(km),
      nightAt: nightKey ? byKey.get(nightKey)?.label : undefined,
      ...night, food, foodFromPlaces: placesFood !== null, other,
      total: round2(night.stay + food + other),
    };
  }));

  // Typed amounts win over the estimates.
  for (const r of rows) {
    const edit = settings.dayEdits?.[String(r.day)];
    if (!edit) continue;
    const edited = (['stay', 'food', 'other'] as DayField[]).filter(f => typeof edit[f] === 'number');
    for (const f of edited) r[f] = round2(edit[f]!);
    if (edited.length) { r.edited = edited; r.total = round2(r.stay + r.food + r.other); }
  }
  const sum = (f: (r: BudgetRow) => number) => round2(rows.reduce((s, r) => s + f(r), 0));
  const extras = round2(settings.extras.reduce((s, e) => s + (e.amount || 0), 0));
  const bookings: Budget['bookings'] = [];
  for (const b of otherBookings(stops)) {
    if (b.currency === currency) bookings.push({ name: b.name, stop: b.stop, amount: b.amount });
    else otherCurrencies[b.currency] = round2((otherCurrencies[b.currency] || 0) + b.amount);
  }
  // Fuel and tolls for the whole trip (not per day): total riding km, estimates where nothing was typed.
  const motor = opts.motor ?? true;
  const ridingKm = legs.reduce((a, l) => a + Math.max(0, (l.distanceMeters || 0) / 1000 - (l.ferryKm || 0)), 0);
  const autoPrice = estimatedFuelPrice(legs, currency);
  const per100km = settings.fuelPer100km ?? (motor ? estimatedConsumption(opts.offroad, opts.vehicle) : 0);
  const price = settings.fuelPrice ?? (motor ? autoPrice ?? preset(currency).fuelPerLitre : 0);
  const fuelCost = round2(ridingKm * per100km / 100 * price);
  const tolledKm = (tollKm || []).reduce((a, b) => a + b, 0);
  const rate = settings.tollPerKm ?? (motor ? Math.round(estimatedTollRate(legs, currency) * TOLL_FACTOR[opts.vehicle || 'motorcycle'] * 1000) / 1000 : 0);
  const tollCost = round2(tolledKm * rate + (settings.tollsTotal || 0));
  const totals = {
    stay: sum(r => r.stay), food: sum(r => r.food), fuel: settings.fuelOverride ?? fuelCost, other: sum(r => r.other),
    tolls: settings.tollOverride ?? tollCost, extras, bookings: round2(bookings.reduce((s, b) => s + b.amount, 0)), all: 0,
  };
  totals.all = round2(totals.stay + totals.food + totals.fuel + totals.other + totals.tolls + totals.extras + totals.bookings);
  const days = rows.filter(r => r.kind !== 'before').length;
  return {
    rows,
    nights: rows.filter(r => r.stayKind !== 'none').length,
    totals,
    fuel: {
      km: Math.round(ridingKm), per100km, price,
      estimatedPrice: settings.fuelPrice === undefined, estimatedConsumption: settings.fuelPer100km === undefined,
      countries: kmByCountry(legs).filter(c => c.country !== '?').map(c => c.country),
    },
    tolls: { km: Math.round(tolledKm), rate, estimatedRate: settings.tollPerKm === undefined, known: tollKm !== null },
    fuelEdited: settings.fuelOverride !== undefined,
    tollEdited: settings.tollOverride !== undefined,
    bookings,
    otherCurrencies,
    perDay: days ? round2(totals.all / days) : 0,
  };
}

/** The table as CSV, for a spreadsheet. */
export function budgetCsv(budget: Budget, currency: string): string {
  const esc = (v: string | number | undefined) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [['Day', 'Date', 'Route', 'km', 'Night at', `Stay (${currency})`, 'Stay source', `Food (${currency})`, `Other (${currency})`, `Total (${currency})`]];
  const source = (r: BudgetRow) => r.stayKind === 'places' ? `average of ${r.stayNote} places` : r.stayKind === 'estimate' ? 'your average' : r.stayNote || r.stayKind;
  budget.rows.forEach(r => lines.push([r.kind === 'before' ? 'Before' : r.day, r.date, r.label, r.km, r.nightAt, r.stay, source(r), r.food, r.other, r.total].map(v => String(v ?? ''))));
  const line = (label: string, detail: string, value: number) => ['', '', label, '', '', '', detail, '', '', String(value)];
  if (budget.totals.fuel) lines.push(line('Fuel', `${budget.fuel.km} km x ${budget.fuel.per100km} L/100km x ${budget.fuel.price}/L`, budget.totals.fuel));
  if (budget.totals.tolls) lines.push(line('Tolls', `${budget.tolls.km} km on toll roads x ${budget.tolls.rate}/km`, budget.totals.tolls));
  budget.bookings.forEach(b => lines.push(line(`Booked: ${b.name} (${b.stop})`, '', b.amount)));
  lines.push(line('Extras', '', budget.totals.extras));
  lines.push(line('Total', '', budget.totals.all));
  return lines.map(l => l.map(esc).join(',')).join('\n');
}
