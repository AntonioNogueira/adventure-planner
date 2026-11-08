import { describe, expect, it } from 'vitest';
import { budgetCsv, computeBudget, defaultBudget, BudgetStop, stayFromPlaces, foodFromPlaces } from '../budget';
import { buildSchedule } from '../schedule';
import { RouteLeg } from '../../types';

const legs: RouteLeg[] = [
  { from: 'Tavira', to: 'Alcoutim', distance: '', duration: '', distanceMeters: 100_000 },
  { from: 'Alcoutim', to: 'Mértola', distance: '', duration: '', distanceMeters: 50_000 },
  { from: 'Mértola', to: 'Beja', distance: '', duration: '', distanceMeters: 60_000, ferryKm: 10 },
];
const stops: BudgetStop[] = [
  { key: 'start', label: 'Tavira', interests: [] },
  { key: 'stop-0', label: 'Alcoutim', interests: [{ category: 'Accommodations', items: [
    { name: 'Hotel Rio', source: 'reservation', reservation: { fileName: 'b.pdf', fileType: 'application/pdf', price: 160, currency: 'eur' } },
  ] }] },
  { key: 'stop-1', label: 'Mértola', interests: [{ category: 'Accommodations', items: [
    { name: 'Casa US', source: 'reservation', reservation: { fileName: 'c.pdf', fileType: 'application/pdf', price: 90, currency: 'USD' } },
  ] }] },
  { key: 'end', label: 'Beja', interests: [] },
];

describe('defaultBudget', () => {
  it('starts from the travel mode and lodging', () => {
    expect(defaultBudget('DRIVING', 'camping')).toMatchObject({ stayPerNight: 20, fuelPer100km: 6 });
    expect(defaultBudget('BICYCLING', 'hotel')).toMatchObject({ stayPerNight: 75, fuelPer100km: 0, fuelPrice: 0 });
  });
  it('starts from local prices in the chosen currency', () => {
    expect(defaultBudget('DRIVING', 'hotel', 'BRL')).toMatchObject({ currency: 'BRL', stayPerNight: 250, fuelPrice: 6.2 });
    expect(defaultBudget('DRIVING', 'any', 'USD')).toMatchObject({ currency: 'USD', stayPerNight: 90 });
    expect(defaultBudget('BICYCLING', 'any', 'SEK')).toMatchObject({ currency: 'SEK', stayPerNight: 630, foodPerDay: 350 });
  });
});

describe('computeBudget', () => {
  // 2 nights in Alcoutim (rest day), 1 in Mértola, none at the finish.
  const schedule = buildSchedule(3, [1, 0], '2026-05-01');
  const settings = { ...defaultBudget('DRIVING'), tollsTotal: 12, extras: [{ label: 'Ferry', amount: 8 }] };
  const budget = computeBudget(settings, schedule, legs, stops);

  it('uses a booking for the stay it covers, once', () => {
    expect(budget.rows.map(r => [r.kind, r.stayKind, r.stay])).toEqual([
      ['ride', 'booked', 160],
      ['rest', 'covered', 0],
      ['ride', 'booked', 0],   // booked in USD: kept apart
      ['ride', 'none', 0],
    ]);
    expect(budget.otherCurrencies).toEqual({ USD: 90 });
    expect(budget.nights).toBe(3);
  });

  it('counts fuel on riding km only (ferries excluded)', () => {
    expect(budget.rows[0].fuel).toBe(10.5);   // 100 km × 6 L/100 km × 1.75
    expect(budget.rows[1].fuel).toBe(0);      // rest day
    expect(budget.rows[3].km).toBe(50);
  });

  it('adds food and other every day, plus tolls and extras', () => {
    expect(budget.totals.food).toBe(120);
    expect(budget.totals.other).toBe(40);
    expect(budget.totals.all).toBe(round(160 + 120 + 40 + budget.totals.fuel + 12 + 8));
    expect(budget.perDay).toBe(round(budget.totals.all / 4));
  });

  it('estimates nights without a booking, and the finish night when asked', () => {
    const b = computeBudget({ ...settings, includeFinishNight: true }, schedule, legs, [stops[0], { ...stops[1], interests: [] }, stops[2], stops[3]]);
    expect(b.rows[0]).toMatchObject({ stayKind: 'estimate', stay: 55 });
    expect(b.rows[3]).toMatchObject({ stayKind: 'estimate', stay: 55, nightAt: 'Beja' });
  });

  it('adds a booked night at the start and other priced bookings', () => {
    const start: BudgetStop = { key: 'start', label: 'Tavira', interests: [
      { category: 'Accommodations', items: [{ name: 'Camping', source: 'reservation', reservation: { fileName: 'a.pdf', fileType: 'application/pdf', price: 18.5, currency: 'EUR' } }] },
      { category: 'Points of interest', items: [{ name: 'Boat tour', source: 'reservation', reservation: { fileName: 't.pdf', fileType: 'application/pdf', price: 25, currency: 'EUR' } }] },
    ] };
    const b = computeBudget(settings, schedule, legs, [start, ...stops.slice(1)]);
    expect(b.rows[0]).toMatchObject({ kind: 'before', date: '2026-04-30', stayKind: 'booked', stay: 18.5, total: 18.5 });
    expect(b.rows).toHaveLength(5);
    expect(b.bookings).toEqual([{ name: 'Boat tour', stop: 'Tavira', amount: 25 }]);
    expect(b.totals.all).toBe(round(budget.totals.all + 18.5 + 25));
    expect(b.perDay).toBe(round(b.totals.all / 4));
  });

  it('exports CSV', () => {
    const csv = budgetCsv(budget, 'EUR').split('\n');
    expect(csv[0]).toContain('Stay (EUR)');
    expect(csv[1]).toContain('Tavira → Alcoutim');
    expect(csv[csv.length - 1]).toContain(String(budget.totals.all));
  });
});

function round(n: number) { return Math.round(n * 100) / 100; }

describe('local prices and tolls', () => {
  const sched = buildSchedule(2, [0], undefined);
  const twoLegs: RouteLeg[] = [legs[0], legs[1]];
  const placesStop: BudgetStop = { key: 'stop-0', label: 'Alcoutim', interests: [
    { category: 'Accommodations', items: [
      { name: 'Camping A', source: 'places', category: 'stay', stayKind: 'camping' },
      { name: 'Hostel B', source: 'places', category: 'stay', stayKind: 'hostel' },
    ] },
    { category: 'Restaurants/Cafes', items: [
      { name: 'Tasca', source: 'places', category: 'food', priceLevel: 1 },
      { name: 'Fancy', source: 'places', category: 'food', priceLevel: 3 },
    ] },
  ] };

  it('prices a night from the places to stay at the stop', () => {
    expect(stayFromPlaces(placesStop, 'EUR')).toEqual({ amount: 25, count: 2 });   // camping 20, hostel 30
    expect(stayFromPlaces({ ...placesStop, interests: [] }, 'EUR')).toBeNull();
    const priced: BudgetStop = { ...placesStop, interests: [{ category: 'Accommodations', items: [
      { name: 'Hotel', source: 'places', stayKind: 'hotel', priceRange: { min: 60, max: 100, currency: 'EUR' } }] }] };
    expect(stayFromPlaces(priced, 'EUR')?.amount).toBe(80);
  });

  it('scales food by the restaurants\' price level', () => {
    expect(foodFromPlaces(placesStop, 30)).toBe(33);   // (0.7 + 1.5) / 2 × 30
    expect(foodFromPlaces({ ...placesStop, interests: [] }, 30)).toBeNull();
  });

  it('uses them per day, and estimates tolls from toll km', () => {
    const b = computeBudget({ ...defaultBudget('DRIVING'), tollPerKm: 0.1 }, sched, twoLegs,
      [stops[0], placesStop, stops[3]], [40, 0]);
    expect(b.rows[0]).toMatchObject({ stayKind: 'places', stay: 25, food: 33, foodFromPlaces: true, tollKm: 40, tolls: 4 });
    expect(b.rows[1]).toMatchObject({ stayKind: 'none', tolls: 0, foodFromPlaces: false });
    expect(b.totals.tolls).toBe(4);
    expect(budgetCsv(b, 'EUR').split('\n')[1]).toContain('average of 2 places');
  });
});
