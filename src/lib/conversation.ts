// The planner's side of the chat: a short summary of the plan, then one question at a time
// (with quick-reply buttons) about whatever the request didn't settle. Unit-tested.
// Text follows the app's language and distances its units (Settings).
import { getSettings, formatters, t } from './settings';
import { TripIntent, TripStyle, Interest } from '../types';
import { defaultDailyKm, OFFROAD_RIDES } from './pace';

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

/** Ferries at least this long get a question (take it or go overland); shorter ones are simply taken. */
export const LONG_FERRY_KM = 20;

export type Topic = 'mode' | 'vehicle' | 'ride' | 'party' | 'distance' | 'lodging' | 'ferry' | 'interests' | 'budget' | 'date';

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

const MODE_WORDS = /\b(bik\w*|byk\w*|bi[cks]+\w*cl\w*|by[cks]+\w*cl\w*|velo|v[ée]lo|fahrrad|cycl\w*|gravel|mtb|hike|hiking|trek\w*|walk\w*|camino|moto\w*|motorcycle|motorbike|car|drive|driving|road ?trip|bicicleta|bici|btt|cicl\w*|pedal\w*|caminh\w*|a p[ée]|andar|trilh\w*|mota|motociclet\w*|carro|conduzir|dirigir|viagem de carro)\b/i;

/** Did the user say how they travel? If not, the AI guessed and we ask. */
export function mentionsTravelMode(text: string): boolean {
  return MODE_WORDS.test(text);
}

const MODE_NAMES: Record<string, string> = { BICYCLING: 'by bike', WALKING: 'on foot', DRIVING: 'by moto/car', TRANSIT: 'by public transport' };
const VEHICLE_NAMES: Record<string, string> = {
  motorcycle: 'by motorcycle', motorcycle_2up: 'by motorcycle, two-up', car: 'by car', suv: 'by SUV', '4x4': 'by 4x4',
  campervan: 'by campervan', truck: 'by expedition truck',
};
const RIDE_NAMES: Record<string, string> = {
  road: 'by road bike', gravel: 'by gravel bike', mtb: 'by mountain bike', emtb: 'by e-MTB',
  touring: 'by touring motorcycle', adventure: 'by adventure motorcycle', enduro: 'by enduro motorcycle',
};
const DISTANCE_CHOICES: Record<string, number[]> = { BICYCLING: [50, 70, 90], WALKING: [15, 20, 25], DRIVING: [200, 300, 400] };
const RIDE_DISTANCES: Record<string, number[]> = {
  road: [80, 100, 130], gravel: [60, 80, 100], mtb: [35, 50, 70], emtb: [50, 65, 85],
  touring: [250, 350, 450], adventure: [200, 280, 350], enduro: [120, 170, 220],
};

/** Three daily distances to offer (km): by mode and kind of riding, shorter with children, rounded to a nice number. */
export function distanceChoices(intent: Pick<TripIntent, 'travelMode' | 'ride' | 'party'>): number[] {
  const list = (intent.ride && RIDE_DISTANCES[intent.ride]) || DISTANCE_CHOICES[intent.travelMode];
  if (!list) return [];
  const step = list[0] >= 150 ? 10 : 5;
  return list.map(km => (intent.party === 'family' ? Math.round(km * 0.7 / step) * step : km));
}

const fmt = () => formatters(getSettings());
/** A whole distance in the chosen unit: "70 km" / "43 mi". */
const n = (km: number) => fmt().dist(km, 0);

const modeName = (intent: TripIntent) => {
  if (intent.vehicleModel && intent.travelMode !== 'TRANSIT') return t('by {name}', { name: intent.vehicleModel });
  const name = (intent.ride && RIDE_NAMES[intent.ride])
    || (intent.travelMode === 'DRIVING' && intent.vehicle && VEHICLE_NAMES[intent.vehicle]) || MODE_NAMES[intent.travelMode];
  return name ? t(name) : '';
};

/** The style part of an intent, kept with the trip. */
export function styleOf(intent: TripIntent): TripStyle {
  const { ride, party, interests, budgetStyle, vehicleModel, vehicleInfo } = intent;
  return { ride, party, interests, budgetStyle, vehicleModel, vehicleInfo };
}

/** A short note on a named vehicle: typical consumption and range, and what's worth knowing for the trip. */
export function vehicleNote(intent: TripIntent): string {
  const info = intent.vehicleInfo;
  if (!intent.vehicleModel || !info) return '';
  const figures = [
    info.litresPer100km ? t('about {l} l/100 km', { l: info.litresPer100km.toLocaleString(fmt().locale, { maximumFractionDigits: 1 }) }) : '',
    info.rangeKm ? t('{d} on a full tank', { d: n(info.rangeKm) }) : '',
  ].filter(Boolean).join(', ');
  const lines = [t('About the {name}: {figures}', { name: intent.vehicleModel, figures: figures || t('typical figures unknown') })
    + (figures ? ` (${t('typical figures, check yours')}).` : '.')];
  for (const note of info.notes || []) lines.push(`• ${note}`);
  return lines.join('\n');
}

/** One or two short lines: where, how long, how far, ferry if any. */
export function summaryText(intent: TripIntent, plan: PlanSummary): string {
  const lines = [
    `${intent.origin.split(',')[0]} → ${intent.destination.split(',')[0]} ${modeName(intent)}: `
    + `${plan.days === 1 ? t('1 day') : t('{n} days', { n: plan.days })} · ${n(plan.totalKm - plan.ferryKm)} · ${t('about {d}/day', { d: n(plan.averageKm) })}`
    + `${intent.offroad && intent.travelMode !== 'TRANSIT' ? ` · ${t('off-road (easy)')}` : ''}.`,
  ];
  if (plan.ferry) lines.push(t('Includes a ferry crossing of {d} on day {day} ({from} → {to}).', { d: n(plan.ferry.km), day: plan.ferry.day, from: plan.ferry.from.split(',')[0], to: plan.ferry.to.split(',')[0] }));
  return lines.join('\n');
}

export interface ConversationState {
  asked: Set<Topic>;
  /** The user said how they travel (or the AI read it, e.g. from a misspelling): don't ask. */
  modeMentioned: boolean;
  hasStartDate: boolean;
}

/** The next thing worth asking, or null when the plan is well defined. */
export function nextQuestion(intent: TripIntent, plan: PlanSummary, state: ConversationState): Question | null {
  const open = (topic: Topic) => !state.asked.has(topic);

  if (open('mode') && !state.modeMentioned) {
    // A guess, so confirm it rather than ask from scratch.
    return {
      topic: 'mode',
      text: modeName(intent) ? t('I planned it {mode}. Is that how you\'re travelling?', { mode: modeName(intent) }) : t('How are you travelling?'),
      choices: [{ label: t('Bike'), value: 'BICYCLING' }, { label: t('Hike'), value: 'WALKING' }, { label: t('Moto / car'), value: 'DRIVING' }],
    };
  }
  // Moto/car trips: what they drive (route style, fuel and tolls).
  if (open('vehicle') && intent.travelMode === 'DRIVING' && !intent.vehicle) {
    return {
      topic: 'vehicle',
      text: t('What are you travelling in? It sets the fuel and toll estimates, and for a motorcycle the kind of roads.'),
      choices: [
        { label: t('Motorcycle'), value: 'motorcycle' },
        { label: t('Motorcycle, two-up'), value: 'motorcycle_2up' },
        { label: t('Car'), value: 'car' },
        { label: t('SUV'), value: 'suv' },
        { label: t('4x4'), value: '4x4' },
        { label: t('Campervan or van'), value: 'campervan' },
        { label: t('Expedition truck'), value: 'truck' },
      ],
    };
  }
  // The kind of bike or motorcycle riding: road or off-road, and how far a day goes.
  if (open('ride') && !intent.ride) {
    if (intent.travelMode === 'BICYCLING') {
      return {
        topic: 'ride',
        text: t('What kind of bike? A road bike (fast, tarmac only), gravel (dirt roads and easy tracks), a mountain bike (rough trails, shorter days) or an e-MTB (trails with a boost)?'),
        choices: [
          { label: t('Road bike'), value: 'road' }, { label: t('Gravel'), value: 'gravel' },
          { label: t('Mountain bike'), value: 'mtb' }, { label: t('e-MTB'), value: 'emtb' },
        ],
      };
    }
    if (intent.travelMode === 'DRIVING' && intent.vehicle?.startsWith('motorcycle')) {
      return {
        topic: 'ride',
        text: t('What kind of riding? Touring (tarmac, longer days), adventure (good dirt roads on a bike like an Africa Twin, GS or Ténéré) or enduro (rough tracks on a light bike)?'),
        choices: [{ label: t('Touring'), value: 'touring' }, { label: t('Adventure'), value: 'adventure' }, { label: t('Enduro'), value: 'enduro' }],
      };
    }
  }
  if (open('party') && !intent.party && intent.travelMode !== 'TRANSIT') {
    return {
      topic: 'party',
      text: t("Who's going? I'll pace the days and pick places to suit."),
      choices: [
        { label: t('Just me'), value: 'solo' }, { label: t('A couple'), value: 'couple' },
        { label: t('Family with kids'), value: 'family' }, { label: t('A group'), value: 'group' },
      ],
    };
  }
  const distances = distanceChoices(intent);
  if (open('distance') && !intent.dailyKm && !intent.days && distances.length) {
    const imperial = getSettings().units === 'imperial';
    return {
      topic: 'distance',
      text: intent.travelMode === 'WALKING'
        ? t('I planned about {d} a day. How far do you like to walk each day?', { d: n(plan.averageKm) })
        : intent.travelMode === 'DRIVING' && intent.vehicle && !intent.vehicle.startsWith('motorcycle')
          ? t('I planned about {d} a day. How far do you like to drive each day?', { d: n(plan.averageKm) })
          : t('I planned about {d} a day. How far do you like to ride each day?', { d: n(plan.averageKm) }),
      choices: imperial
        ? distances.map(km => Math.max(5, Math.round(km / 1.609344 / 5) * 5)).map(mi => ({ label: `${mi} mi`, value: String(Math.round(mi * 1.609344)) }))
        : distances.map(km => ({ label: `${km} km`, value: String(km) })),
    };
  }
  if (open('lodging') && intent.lodging === 'any' && intent.travelMode !== 'TRANSIT') {
    return {
      topic: 'lodging',
      text: t("Where do you like to sleep: campsites, hostels, or hotels and guesthouses? I'll put each night near that kind of place."),
      choices: [
        { label: t('Camping'), value: 'camping' },
        { label: t('Hostels'), value: 'hostel' },
        { label: t('Hotels'), value: 'hotel' },
        { label: t('Anything'), value: 'any' },
      ],
    };
  }
  // Only a long crossing (a sea or lake ferry) is worth a question. A short river ferry is usually the only way
  // across by bike or on foot (the big bridges are motorways), so it's taken and just mentioned in the summary.
  if (open('ferry') && plan.ferry && plan.ferry.km >= LONG_FERRY_KM && !intent.avoidFerries && intent.travelMode !== 'DRIVING') {
    return {
      topic: 'ferry',
      text: intent.travelMode === 'WALKING' ? t('Take the ferry, or walk the whole way overland? Overland is longer but avoids the crossing.') : t('Take the ferry, or ride the whole way overland? Overland is longer but avoids the crossing.'),
      choices: [{ label: t('Take the ferry'), value: 'ferry' }, { label: t('Go overland'), value: 'overland' }],
    };
  }
  if (open('interests') && !intent.interests?.length) {
    return {
      topic: 'interests',
      text: t('What do you like to stop for? Nature (viewpoints, waterfalls, beaches), history (castles, ruins, old towns) or contemporary (museums, art, architecture)?'),
      choices: [
        { label: t('Nature'), value: 'nature' }, { label: t('History'), value: 'history' },
        { label: t('Contemporary'), value: 'contemporary' }, { label: t('A bit of everything'), value: 'all' },
      ],
    };
  }
  if (open('budget') && !intent.budgetStyle) {
    return {
      topic: 'budget',
      text: t("And the budget? Shoestring (camping, cooking your own), mid-range, or comfort (hotels, restaurants). I'll use it for the budget estimate."),
      choices: [{ label: t('Shoestring'), value: 'shoestring' }, { label: t('Mid-range'), value: 'mid' }, { label: t('Comfort'), value: 'comfort' }],
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
    // The AI's brief described the guessed mode, so drop it; a bike or moto kind no longer fits another mode.
    case 'mode': return value === intent.travelMode ? intent : { ...intent, travelMode: value, summary: '', ride: '', vehicleModel: '', vehicleInfo: undefined };
    case 'vehicle': return { ...intent, vehicle: value as TripIntent['vehicle'], ride: value.startsWith('motorcycle') ? intent.ride : '' };
    // A kind of riding decides road or off-road.
    case 'ride': return { ...intent, ride: value as TripIntent['ride'], offroad: OFFROAD_RIDES.has(value) };
    case 'party': return { ...intent, party: value as TripIntent['party'] };
    case 'ferry': return { ...intent, avoidFerries: value === 'overland' };
    case 'distance': return { ...intent, dailyKm: Number(value), days: 0 };
    case 'lodging': return { ...intent, lodging: value as TripIntent['lodging'] };
    case 'interests': return { ...intent, interests: value === 'all' ? ['nature', 'history', 'contemporary'] : [value as Interest] };
    case 'budget': return { ...intent, budgetStyle: value as TripIntent['budgetStyle'] };
    default: return intent;
  }
}

/** Does this answer change the route (so the trip is planned again), or only the estimates and places? */
export function changesRoute(before: TripIntent, after: TripIntent, topic: Topic): boolean {
  if (['mode', 'distance', 'lodging', 'ferry'].includes(topic)) return true;
  if (topic !== 'ride' && topic !== 'party') return false;
  if (Boolean(before.offroad) !== Boolean(after.offroad)) return true;
  // The day length changes only when the traveller didn't choose it.
  return !after.dailyKm && !after.days && defaultDailyKm(before) !== defaultDailyKm(after);
}

const MENTIONS = {
  distance: /\d+\s*(km|kilomet|quil[oó]met|mi\b|miles|milhas)|\bdays?\b|per day|a day|daily|shorter|longer|faster|slower|\bdias?\b|por dia|mais curt|mais long|mais r[aá]pid|mais devagar/i,
  lodging: /camp|hostel|hotel|guest ?house|b&b|airbnb|bivouac|wild|sleep|accommodation|campismo|acampar|albergue|pousada|alojamento|dormir|hospedagem/i,
  ferry: /ferr(y|ies)|boat|overland|crossing|by sea|by land|barco|balsa|travessia|por terra|por mar/i,
  vehicle: /moto|motorbike|motorcycle|mota|scooter|pillion|passenger|garupa|pendura|two.?up|2.?up|\bcar\b|carro|4x4|4wd|suv|jeep|land.?cruiser|defender|camper|van|motorhome|autocaravana|caravana|overland/i,
  offroad: /off.?road|gravel|dirt|unpaved|track|trail|paved|asphalt|tarmac|adventure|adv\b|dual.?sport|bikepack|mtb|mountain bike|terra|gravilha|cascalho|estrad[aã]o|trilh|asfalto|alcatr[aã]o|todo.?o.?terreno|aventura/i,
};

/**
 * Keep the choices already settled (travel mode, daily distance, lodging, overland) when the AI's new
 * reading of a typed change forgets them, unless the message itself is about that choice.
 */
export function mergeIntent(previous: TripIntent | null, next: TripIntent, message: string): TripIntent {
  if (!previous) return next;
  const merged = { ...next };
  if (!mentionsTravelMode(message) && !next.travelModeStated) merged.travelMode = previous.travelMode;
  // Distance and day count change only when the message talks about them (the AI sometimes copies
  // the day count from the planner's own summary, which would override a chosen daily distance).
  if (!MENTIONS.distance.test(message)) {
    merged.dailyKm = previous.dailyKm;
    merged.days = previous.days;
  }
  if (!MENTIONS.lodging.test(message) && next.lodging === 'any') merged.lodging = previous.lodging;
  if (!MENTIONS.ferry.test(message) && previous.avoidFerries && !next.avoidFerries) merged.avoidFerries = true;
  if (!MENTIONS.offroad.test(message) && previous.offroad !== undefined) merged.offroad = previous.offroad;
  if (!next.vehicle || !MENTIONS.vehicle.test(message)) merged.vehicle = next.vehicle && MENTIONS.vehicle.test(message) ? next.vehicle : previous.vehicle || next.vehicle;
  // Style answers stay unless the message changes them (a bike kind doesn't carry over to a moto trip).
  const sameMode = merged.travelMode === previous.travelMode;
  merged.ride = next.ride || (sameMode ? previous.ride : '');
  merged.party = next.party || previous.party;
  merged.interests = next.interests?.length ? next.interests : previous.interests;
  merged.budgetStyle = next.budgetStyle || previous.budgetStyle;
  if (!next.vehicleModel && sameMode) { merged.vehicleModel = previous.vehicleModel; merged.vehicleInfo = previous.vehicleInfo; }
  return merged;
}
