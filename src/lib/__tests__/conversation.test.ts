import { beforeAll, describe, expect, it } from 'vitest';
import { updateSettings } from '../settings';

// The planner's text follows Settings; these tests read it in English with km.
beforeAll(() => updateSettings({ units: 'metric', currency: 'EUR', language: 'en' }));
import { applyAnswer, mentionsTravelMode, nextQuestion, summaryText, mergeIntent, PlanSummary, ConversationState } from '../conversation';
import { TripIntent } from '../../types';

const intent: TripIntent = {
  origin: 'Cádiz, Spain', destination: 'Naples, Italy', travelMode: 'BICYCLING',
  days: 0, dailyKm: 0, route: [], lodging: 'any', avoidFerries: false, summary: '',
};
const ferryPlan: PlanSummary = {
  days: 19, stops: [], targetKm: 70, longestKm: 82, totalKm: 2300, averageKm: 76, ferryKm: 849,
  ferry: { day: 15, from: 'Sant Salvador, Spain', to: 'Civitavecchia, Italy', km: 849 },
};
const state = (over: Partial<ConversationState> = {}): ConversationState =>
  ({ asked: new Set(), modeMentioned: true, hasStartDate: false, ...over });

describe('summaryText', () => {
  it('is short and mentions the ferry', () => {
    const text = summaryText(intent, ferryPlan);
    expect(text).toBe('Cádiz → Naples by bike: 19 days · 1,451 km · about 76 km/day.\nIncludes a ferry crossing of 849 km on day 15 (Sant Salvador → Civitavecchia).');
  });
});

describe('nextQuestion', () => {
  it('asks the travel mode first when the user did not say it', () => {
    expect(nextQuestion(intent, ferryPlan, state({ modeMentioned: false }))?.topic).toBe('mode');
  });

  it('then asks ferry, distance, lodging and date, skipping what is answered', () => {
    const asked = new Set<any>();
    const topics: string[] = [];
    for (let q = nextQuestion(intent, ferryPlan, state({ asked })); q; q = nextQuestion(intent, ferryPlan, state({ asked }))) {
      topics.push(q.topic);
      asked.add(q.topic);
    }
    expect(topics).toEqual(['ferry', 'distance', 'lodging', 'date']);
  });

  it('does not ask what the request already said', () => {
    const settled = { ...intent, dailyKm: 60, lodging: 'camping' as const, avoidFerries: true };
    expect(nextQuestion(settled, ferryPlan, state({ hasStartDate: true }))).toBeNull();
  });

  it('offers distances that fit the travel mode', () => {
    const q = nextQuestion({ ...intent, travelMode: 'WALKING' }, { ...ferryPlan, ferry: undefined }, state());
    expect(q?.topic).toBe('distance');
    expect(q?.choices.map(c => c.value)).toEqual(['15', '20', '25']);
  });
});

describe('applyAnswer', () => {
  it('turns answers into a new plan request', () => {
    expect(applyAnswer(intent, 'ferry', 'overland').avoidFerries).toBe(true);
    expect(applyAnswer(intent, 'distance', '90')).toMatchObject({ dailyKm: 90, days: 0 });
    expect(applyAnswer(intent, 'lodging', 'camping').lodging).toBe('camping');
    expect(applyAnswer(intent, 'mode', 'WALKING').travelMode).toBe('WALKING');
  });
});

describe('mentionsTravelMode', () => {
  it('spots how the user travels', () => {
    expect(mentionsTravelMode('bikepacking trip from cadiz to naples')).toBe(true);
    expect(mentionsTravelMode('hiking the camino')).toBe(true);
    expect(mentionsTravelMode('moto trip in the Pyrenees')).toBe(true);
    expect(mentionsTravelMode('from cadiz to naples')).toBe(false);
  });
});

describe('mergeIntent', () => {
  const settled: TripIntent = { ...intent, dailyKm: 50, lodging: 'camping', avoidFerries: true };
  it('keeps settled choices the AI forgot', () => {
    const forgot: TripIntent = { ...intent, travelMode: 'DRIVING', route: [{ place: 'Málaga, Spain', overnight: false }] };
    const merged = mergeIntent(settled, forgot, 'keep this plan but go along the coast');
    expect(merged).toMatchObject({ travelMode: 'BICYCLING', dailyKm: 50, lodging: 'camping', avoidFerries: true });
    expect(merged.route).toEqual(forgot.route);
  });
  it('ignores a day count the AI copied from the summary', () => {
    const copied: TripIntent = { ...intent, days: 59, dailyKm: 50 };
    expect(mergeIntent(settled, copied, 'keep this plan but go along the coast')).toMatchObject({ days: 0, dailyKm: 50 });
  });
  it('lets the message change a choice', () => {
    expect(mergeIntent(settled, { ...intent, dailyKm: 80 }, 'make it 80 km a day').dailyKm).toBe(80);
    expect(mergeIntent(settled, { ...intent, lodging: 'hotel' }, 'hotels please').lodging).toBe('hotel');
    expect(mergeIntent(settled, { ...intent, avoidFerries: false }, 'take the ferry after all').avoidFerries).toBe(false);
    expect(mergeIntent(settled, { ...intent, travelMode: 'WALKING' }, 'actually I want to hike').travelMode).toBe('WALKING');
  });
});
