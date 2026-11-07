// The planner's side of the chat: a short summary of the plan, then one question at a time
// (with quick-reply buttons) about whatever the request didn't settle. Unit-tested.
// Text follows the app's language and distances its units (Settings).
import { getSettings, formatters, t } from './settings';
import { TripIntent } from '../types';

export interface PlanSummary {
  days: number;
  stops: string[];
  targetKm: number | null;
  longestKm: number;
  totalKm: number;
  /** Riding km per day on average (ferries excluded). */
  averageKm: number;
  ferryKm: number;
  /** The day with the longest ferry, if any. */
  ferry?: { day: number; from: string; to: string; km: number };
}

export type Topic = 'mode' | 'ferry' | 'distance' | 'lodging' | 'date';

export interface Choice {
  label: string;
  value: string;
}

export interface Question {
  topic: Topic;
  text: string;
  choices: Choice[];
  /** Show a date picker as well as the buttons. */
  dateInput?: boolean;
}

const MODE_WORDS = /\b(bike|bikes|biking|bikepack\w*|cycl\w*|bicycle|gravel|mtb|hike|hiking|trek\w*|walk\w*|camino|moto\w*|motorcycle|motorbike|car|drive|driving|road ?trip|bicicleta|bici|btt|ciclismo|pedalar|caminhada|caminhar|a p[ée]|andar|trilho|trilha|mota|carro|conduzir|dirigir|viagem de carro)\b/i;

/** Did the user say how they travel? If not, the AI guessed and we ask. */
export function mentionsTravelMode(text: string): boolean {
  return MODE_WORDS.test(text);
}

const MODE_NAMES: Record<string, string> = { BICYCLING: 'by bike', WALKING: 'on foot', DRIVING: 'by moto/car', TRANSIT: 'by public transport' };
const DISTANCE_CHOICES: Record<string, number[]> = { BICYCLING: [50, 70, 90], WALKING: [15, 20, 25], DRIVING: [200, 300, 400] };
const DISTANCE_CHOICES_MI: Record<string, number[]> = { BICYCLING: [30, 45, 55], WALKING: [10, 12, 15], DRIVING: [125, 185, 250] };

const fmt = () => formatters(getSettings());
/** A whole distance in the chosen unit: "70 km" / "43 mi". */
const n = (km: number) => fmt().dist(km, 0);

/** One or two short lines: where, how long, how far, ferry if any. */
export function summaryText(intent: TripIntent, plan: PlanSummary): string {
  const lines = [
    `${intent.origin.split(',')[0]} → ${intent.destination.split(',')[0]} ${MODE_NAMES[intent.travelMode] ? t(MODE_NAMES[intent.travelMode]) : ''}: `
    + `${plan.days === 1 ? t('1 day') : t('{n} days', { n: plan.days })} · ${n(plan.totalKm - plan.ferryKm)} · ${t('about {d}/day', { d: n(plan.averageKm) })}.`,
  ];
  if (plan.ferry) lines.push(t('Includes a ferry crossing of {d} on day {day} ({from} → {to}).', { d: n(plan.ferry.km), day: plan.ferry.day, from: plan.ferry.from.split(',')[0], to: plan.ferry.to.split(',')[0] }));
  return lines.join('\n');
}

export interface ConversationState {
  asked: Set<Topic>;
  modeMentioned: boolean;
  hasStartDate: boolean;
}

/** The next thing worth asking, or null when the plan is well defined. */
export function nextQuestion(intent: TripIntent, plan: PlanSummary, state: ConversationState): Question | null {
  const open = (topic: Topic) => !state.asked.has(topic);

  if (open('mode') && !state.modeMentioned) {
    return {
      topic: 'mode',
      text: t('How are you travelling?'),
      choices: [{ label: t('Bike'), value: 'BICYCLING' }, { label: t('Hike'), value: 'WALKING' }, { label: t('Moto / car'), value: 'DRIVING' }],
    };
  }
  if (open('ferry') && plan.ferry && !intent.avoidFerries && intent.travelMode !== 'DRIVING') {
    return {
      topic: 'ferry',
      text: intent.travelMode === 'WALKING' ? t('Take the ferry, or walk the whole way overland? Overland is longer but avoids the crossing.') : t('Take the ferry, or ride the whole way overland? Overland is longer but avoids the crossing.'),
      choices: [{ label: t('Take the ferry'), value: 'ferry' }, { label: t('Go overland'), value: 'overland' }],
    };
  }
  if (open('distance') && !intent.dailyKm && !intent.days && DISTANCE_CHOICES[intent.travelMode]) {
    const imperial = getSettings().units === 'imperial';
    return {
      topic: 'distance',
      text: intent.travelMode === 'WALKING'
        ? t('I planned about {d} a day. How far do you like to walk each day?', { d: n(plan.averageKm) })
        : t('I planned about {d} a day. How far do you like to ride each day?', { d: n(plan.averageKm) }),
      choices: imperial
        ? DISTANCE_CHOICES_MI[intent.travelMode].map(mi => ({ label: `${mi} mi`, value: String(Math.round(mi * 1.609344)) }))
        : DISTANCE_CHOICES[intent.travelMode].map(km => ({ label: `${km} km`, value: String(km) })),
    };
  }
  if (open('lodging') && intent.lodging === 'any' && intent.travelMode !== 'TRANSIT') {
    return {
      topic: 'lodging',
      text: t('Where do you like to sleep? I\'ll put each night near that kind of place.'),
      choices: [
        { label: t('Camping'), value: 'camping' },
        { label: t('Hostels'), value: 'hostel' },
        { label: t('Hotels'), value: 'hotel' },
        { label: t('Anything'), value: 'any' },
      ],
    };
  }
  if (open('date') && !state.hasStartDate) {
    return {
      topic: 'date',
      text: t('When do you start? I\'ll add dates and the weather forecast to each day.'),
      choices: [{ label: t('Not sure yet'), value: '' }],
      dateInput: true,
    };
  }
  return null;
}

/** The trip intent after answering a question (the date is handled separately, without re-planning). */
export function applyAnswer(intent: TripIntent, topic: Topic, value: string): TripIntent {
  switch (topic) {
    // The AI's brief described the guessed mode, so drop it.
    case 'mode': return { ...intent, travelMode: value, summary: value === intent.travelMode ? intent.summary : '' };
    case 'ferry': return { ...intent, avoidFerries: value === 'overland' };
    case 'distance': return { ...intent, dailyKm: Number(value), days: 0 };
    case 'lodging': return { ...intent, lodging: value as TripIntent['lodging'] };
    default: return intent;
  }
}

const MENTIONS = {
  distance: /\d+\s*(km|kilomet|quil[oó]met|mi\b|miles|milhas)|\bdays?\b|per day|a day|daily|shorter|longer|faster|slower|\bdias?\b|por dia|mais curt|mais long|mais r[aá]pid|mais devagar/i,
  lodging: /camp|hostel|hotel|guest ?house|b&b|airbnb|bivouac|wild|sleep|accommodation|campismo|acampar|albergue|pousada|alojamento|dormir|hospedagem/i,
  ferry: /ferr(y|ies)|boat|overland|crossing|by sea|by land|barco|balsa|travessia|por terra|por mar/i,
};

/**
 * Keep the choices already settled (travel mode, daily distance, lodging, overland) when the AI's new
 * reading of a typed change forgets them, unless the message itself is about that choice.
 */
export function mergeIntent(previous: TripIntent | null, next: TripIntent, message: string): TripIntent {
  if (!previous) return next;
  const merged = { ...next };
  if (!mentionsTravelMode(message)) merged.travelMode = previous.travelMode;
  // Distance and day count change only when the message talks about them (the AI sometimes copies
  // the day count from the planner's own summary, which would override a chosen daily distance).
  if (!MENTIONS.distance.test(message)) {
    merged.dailyKm = previous.dailyKm;
    merged.days = previous.days;
  }
  if (!MENTIONS.lodging.test(message) && next.lodging === 'any') merged.lodging = previous.lodging;
  if (!MENTIONS.ferry.test(message) && previous.avoidFerries && !next.avoidFerries) merged.avoidFerries = true;
  return merged;
}
