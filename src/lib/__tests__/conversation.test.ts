import { describe, expect, it } from 'vitest';
import { applyAnswer, mentionsTravelMode, nextQuestion, summaryText, PlanSummary, ConversationState } from '../conversation';
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
