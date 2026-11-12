import { beforeAll, describe, expect, it } from 'vitest';
import { updateSettings } from '../settings';
import { emptyProfile, learnFromPlan, newer, profileForAI } from '../profile';
import { profileLine } from '../conversation';
import { buildPrompt } from '../../../server/plan-api';
import type { TripIntent } from '../../types';

const trip = (over: Partial<TripIntent> = {}): TripIntent => ({
  origin: 'Silves, Portugal', destination: 'Tavira, Portugal', travelMode: 'BICYCLING', days: 0, dailyKm: 0,
  route: [], lodging: 'any', summary: '', ...over,
});

describe('traveller profile', () => {
  beforeAll(() => updateSettings({ units: 'metric', currency: 'EUR', language: 'en' }));
  it('learns what a plan settled, per way of travelling, never the defaults', () => {
    let p = learnFromPlan(emptyProfile(), trip({ ride: 'gravel', dailyKm: 50, lodging: 'hostel', party: 'couple' }), ['sections of 40 km max']);
    expect(p.modes.BICYCLING).toMatchObject({ ride: 'gravel', dailyKm: 50, lodging: 'hostel', party: 'couple', trips: 1 });
    expect(p.lastMode).toBe('BICYCLING');
    // A later trip with "any" lodging and no daily distance keeps what was learned.
    p = learnFromPlan(p, trip({ origin: 'Lisbon, Portugal', interests: ['history'] }), ['no main roads']);
    expect(p.modes.BICYCLING).toMatchObject({ dailyKm: 50, lodging: 'hostel', interests: ['history'], trips: 2 });
    expect(p.notes).toEqual(['no main roads', 'sections of 40 km max']);
    // Changing the same trip doesn't count as another trip; a motorcycle trip has its own habits.
    p = learnFromPlan(p, trip({ dailyKm: 60 }), [], false);
    expect(p.modes.BICYCLING?.trips).toBe(2);
    p = learnFromPlan(p, trip({ travelMode: 'DRIVING', vehicle: 'motorcycle', ride: 'adventure' }));
    expect(p.modes.DRIVING).toMatchObject({ vehicle: 'motorcycle', ride: 'adventure', trips: 1 });
    expect(p.modes.BICYCLING?.ride).toBe('gravel');
  });

  it('keeps the newer copy (this browser or the account)', () => {
    const a = { ...emptyProfile(), updatedAt: 10 }, b = { ...emptyProfile(), updatedAt: 20 };
    expect(newer(a, b)).toBe(b);
    expect(newer(a, null)).toBe(a);
  });

  it('gives the AI the habits without counters, and nothing when empty', () => {
    expect(profileForAI(emptyProfile())).toBeNull();
    const p = learnFromPlan(emptyProfile(), trip({ ride: 'gravel', dailyKm: 50 }), ['wild camping when possible']);
    expect(profileForAI(p)).toEqual({ usualTravelMode: 'BICYCLING', habitsByTravelMode: { BICYCLING: { ride: 'gravel', dailyKm: 50 } }, preferences: ['wild camping when possible'] });
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
