import { beforeAll, describe, expect, it } from 'vitest';
import { updateSettings } from '../settings';
import { emptyProfile, learnFromPlan, newer, normalize, profileForAI, styleKey } from '../profile';
import { profileLine } from '../conversation';
import { buildPrompt } from '../../../server/plan-api';
import type { TripIntent } from '../../types';

const trip = (over: Partial<TripIntent> = {}): TripIntent => ({
  origin: 'Silves, Portugal', destination: 'Tavira, Portugal', travelMode: 'BICYCLING', days: 0, dailyKm: 0,
  route: [], lodging: 'any', summary: '', ...over,
});

describe('traveller profile', () => {
  beforeAll(() => updateSettings({ units: 'metric', currency: 'EUR', language: 'en' }));
  it('learns what a plan settled, per travel style, never the defaults', () => {
    let p = learnFromPlan(emptyProfile(), trip({ ride: 'gravel', dailyKm: 50, lodging: 'hostel', party: 'couple' }), ['sections of 40 km max']);
    expect(p.styles['bike-gravel']).toMatchObject({ mode: 'BICYCLING', ride: 'gravel', dailyKm: 50, lodging: 'hostel', party: 'couple', trips: 1 });
    expect(p.lastStyle).toBe('bike-gravel');
    // A later gravel trip with "any" lodging and no daily distance keeps what was learned.
    p = learnFromPlan(p, trip({ origin: 'Lisbon, Portugal', ride: 'gravel', interests: ['history'] }), ['no main roads']);
    expect(p.styles['bike-gravel']).toMatchObject({ dailyKm: 50, lodging: 'hostel', interests: ['history'], trips: 2 });
    expect(p.notes).toEqual(['no main roads', 'sections of 40 km max']);
    // Changing the same trip doesn't count as another trip.
    p = learnFromPlan(p, trip({ ride: 'gravel', dailyKm: 60 }), [], false);
    expect(p.styles['bike-gravel'].trips).toBe(2);
    // A mountain-bike trip, a motorcycle trip and a family campervan trip each have their own habits.
    p = learnFromPlan(p, trip({ ride: 'mtb', dailyKm: 35, lodging: 'camping' }));
    p = learnFromPlan(p, trip({ travelMode: 'DRIVING', vehicle: 'motorcycle', ride: 'adventure', dailyKm: 300 }));
    p = learnFromPlan(p, trip({ travelMode: 'DRIVING', vehicle: 'campervan', party: 'family', dailyKm: 150 }));
    expect(p.styles['bike-mtb']).toMatchObject({ dailyKm: 35, lodging: 'camping', trips: 1 });
    expect(p.styles['moto-adventure']).toMatchObject({ vehicle: 'motorcycle', dailyKm: 300 });
    expect(p.styles['camper+family']).toMatchObject({ dailyKm: 150 });
    expect(p.styles['bike-gravel'].dailyKm).toBe(60);
    expect(p.lastStyle).toBe('camper+family');
  });

  it('turns an old per-mode profile into styles', () => {
    const old = { modes: { BICYCLING: { ride: 'mtb', dailyKm: 50, lodging: 'camping', party: 'couple', trips: 6 }, DRIVING: { vehicle: 'motorcycle', trips: 2 } }, lastMode: 'BICYCLING', notes: ['no main roads'], updatedAt: 5 };
    const p = normalize(old);
    expect(p.styles['bike-mtb']).toMatchObject({ mode: 'BICYCLING', dailyKm: 50, trips: 6 });
    expect(p.styles['moto-adventure']).toMatchObject({ mode: 'DRIVING', trips: 2 });
    expect(p.lastStyle).toBe('bike-mtb');
    expect(p.notes).toEqual(['no main roads']);
  });

  it('names the style of a trip', () => {
    expect(styleKey({ travelMode: 'BICYCLING', ride: 'emtb' })).toBe('bike-emtb');
    expect(styleKey({ travelMode: 'WALKING', days: 1 })).toBe('walk-day');
    expect(styleKey({ travelMode: 'WALKING', days: 8 })).toBe('walk-trek');
    expect(styleKey({ travelMode: 'DRIVING', vehicle: 'motorcycle_2up', ride: 'enduro' })).toBe('moto-enduro');
    expect(styleKey({ travelMode: 'DRIVING', vehicle: '4x4', party: 'family' })).toBe('4x4+family');
    expect(styleKey({ travelMode: 'DRIVING', vehicle: 'suv' })).toBe('car');
  });

  it('keeps the newer copy (this browser or the account)', () => {
    const a = { ...emptyProfile(), updatedAt: 10 }, b = { ...emptyProfile(), updatedAt: 20 };
    expect(newer(a, b)).toBe(b);
    expect(newer(a, null)).toBe(a);
  });

  it('gives the AI the habits without counters, and nothing when empty', () => {
    expect(profileForAI(emptyProfile())).toBeNull();
    const p = learnFromPlan(emptyProfile(), trip({ ride: 'gravel', dailyKm: 50 }), ['wild camping when possible']);
    expect(profileForAI(p)).toEqual({ usualStyle: 'bike-gravel', habitsByStyle: { 'bike-gravel': { travelMode: 'BICYCLING', ride: 'gravel', dailyKm: 50 } }, preferences: ['wild camping when possible'] });
  });

  it('tells the traveller what came from their past trips', () => {
    expect(profileLine(trip({ ride: 'gravel', dailyKm: 50, lodging: 'hostel', fromProfile: ['ride', 'dailyKm', 'lodging'] })))
      .toBe('Based on your past trips: gravel bike, 50 km a day, hostels. Tell me if this one is different.');
    expect(profileLine(trip({ dailyKm: 50 }))).toBe('');
  });

  it('puts the profile in the AI prompt for a new trip only', () => {
    const profile = { usualTravelMode: 'BICYCLING', habitsByTravelMode: { BICYCLING: { dailyKm: 50 } }, preferences: [] };
    expect(buildPrompt('lisbon to evora', [], undefined, 'en', profile)).toContain('learned from this traveller');
    expect(buildPrompt('make it shorter', [], trip(), 'en', profile)).not.toContain('learned from this traveller');
  });
});
