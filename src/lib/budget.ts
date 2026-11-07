// Trip budget: a day-by-day estimate from average costs, with booked accommodation prices
// taking the place of the estimate for the nights they cover. Pure functions, unit-tested.
import { InterestCategory, RouteLeg } from '../types';
import { ScheduleDay } from './schedule';

export interface BudgetSettings {
  currency: string;
  stayPerNight: number;
  foodPerDay: number;
  /** Litres per 100 km; 0 for bike, hike and transit. */
  fuelPer100km: number;
  /** Price per litre. */
  fuelPrice: number;
  /** Tolls for the whole trip (an estimate the traveller enters). */
  tollsTotal: number;
  otherPerDay: number;
  /** Count a night at the finish (you sleep there before going home). */
  includeFinishNight: boolean;
  /** One-off costs: ferry tickets, insurance, gear… */
  extras: { label: string; amount: number }[];
}

export type Lodging = 'any' | 'camping' | 'hostel' | 'hotel';

interface Preset { stay: Record<Lodging, number>; food: number; fuelPerLitre: number; other: number }

/** Typical starting costs per currency (the traveller edits them). */
const PRESETS: Record<string, Preset> = {
  EUR: { stay: { camping: 20, hostel: 30, hotel: 75, any: 55 }, food: 30, fuelPerLitre: 1.75, other: 10 },
  GBP: { stay: { camping: 20, hostel: 30, hotel: 80, any: 60 }, food: 30, fuelPerLitre: 1.45, other: 10 },
  USD: { stay: { camping: 30, hostel: 40, hotel: 120, any: 90 }, food: 40, fuelPerLitre: 0.95, other: 15 },
  BRL: { stay: { camping: 60, hostel: 90, hotel: 250, any: 180 }, food: 90, fuelPerLitre: 6.2, other: 30 },
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
    fuelPer100km: motor ? 6 : 0,
    fuelPrice: motor ? p.fuelPerLitre : 0,
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
  /** 'estimate' | 'booked' (price from a reservation) | 'covered' (booking counted on an earlier night) | 'none' */
  stayKind: 'estimate' | 'booked' | 'covered' | 'none';
  stayNote?: string;
  food: number;
  fuel: number;
  other: number;
  total: number;
}

export interface Budget {
  rows: BudgetRow[];
  nights: number;
  totals: { stay: number; food: number; fuel: number; other: number; tolls: number; extras: number; bookings: number; all: number };
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

export function computeBudget(settings: BudgetSettings, schedule: ScheduleDay[], legs: RouteLeg[], stops: BudgetStop[]): Budget {
  const byKey = new Map(stops.map(s => [s.key, s]));
  const counted = new Set<string>();
  const otherCurrencies: Record<string, number> = {};
  const currency = settings.currency.toUpperCase();
  const lastRide = legs.length - 1;

  const nightCost = (key: string): Pick<BudgetRow, 'stay' | 'stayKind' | 'stayNote'> => {
    const { prices, names } = bookedStay(byKey.get(key));
    if (!names.length) return { stay: settings.stayPerNight, stayKind: 'estimate' };
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
      ...night, food: 0, fuel: 0, other: 0, total: night.stay,
    });
  }
  rows.push(...schedule.map((d, n) => {
    let label = '', km = 0, fuel = 0, nightKey: string | undefined;
    if (d.kind === 'ride') {
      const i = d.legIndex!;
      const leg = legs[i];
      label = leg ? `${leg.from} → ${leg.to}` : `Day ${n + 1}`;
      km = Math.max(0, (leg?.distanceMeters || 0) / 1000 - (leg?.ferryKm || 0));
      fuel = (km * settings.fuelPer100km / 100) * settings.fuelPrice;
      if (i < lastRide) nightKey = `stop-${i}`;
      else if (settings.includeFinishNight) nightKey = 'end';
    } else {
      label = `Rest day in ${byKey.get(`stop-${d.stopIndex}`)?.label || `stop ${d.stopIndex! + 1}`}`;
      nightKey = `stop-${d.stopIndex}`;
    }
    const night = nightKey ? nightCost(nightKey) : { stay: 0, stayKind: 'none' as const };
    const food = settings.foodPerDay;
    const other = settings.otherPerDay;
    return {
      day: n + 1, date: d.date, kind: d.kind, label, km: Math.round(km),
      nightAt: nightKey ? byKey.get(nightKey)?.label : undefined,
      ...night, food, fuel: round2(fuel), other,
      total: round2(night.stay + food + fuel + other),
    };
  }));

  const sum = (f: (r: BudgetRow) => number) => round2(rows.reduce((s, r) => s + f(r), 0));
  const extras = round2(settings.extras.reduce((s, e) => s + (e.amount || 0), 0));
  const bookings: Budget['bookings'] = [];
  for (const b of otherBookings(stops)) {
    if (b.currency === currency) bookings.push({ name: b.name, stop: b.stop, amount: b.amount });
    else otherCurrencies[b.currency] = round2((otherCurrencies[b.currency] || 0) + b.amount);
  }
  const totals = {
    stay: sum(r => r.stay), food: sum(r => r.food), fuel: sum(r => r.fuel), other: sum(r => r.other),
    tolls: round2(settings.tollsTotal || 0), extras, bookings: round2(bookings.reduce((s, b) => s + b.amount, 0)), all: 0,
  };
  totals.all = round2(totals.stay + totals.food + totals.fuel + totals.other + totals.tolls + totals.extras + totals.bookings);
  const days = rows.filter(r => r.kind !== 'before').length;
  return {
    rows,
    nights: rows.filter(r => r.stayKind !== 'none').length,
    totals,
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
  const lines = [['Day', 'Date', 'Route', 'km', 'Night at', `Stay (${currency})`, 'Stay note', `Food (${currency})`, `Fuel (${currency})`, `Other (${currency})`, `Total (${currency})`]];
  budget.rows.forEach(r => lines.push([r.kind === 'before' ? 'Before' : r.day, r.date, r.label, r.km, r.nightAt, r.stay, r.stayNote, r.food, r.fuel, r.other, r.total].map(String)));
  lines.push(['', '', 'Tolls', '', '', '', '', '', '', '', String(budget.totals.tolls)]);
  budget.bookings.forEach(b => lines.push(['', '', `Booked: ${b.name}`, '', b.stop, '', '', '', '', '', String(b.amount)]));
  lines.push(['', '', 'Extras', '', '', '', '', '', '', '', String(budget.totals.extras)]);
  lines.push(['', '', 'Total', '', '', '', '', '', '', '', String(budget.totals.all)]);
  return lines.map(l => l.map(esc).join(',')).join('\n');
}
