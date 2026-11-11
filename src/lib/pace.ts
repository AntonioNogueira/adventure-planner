// How far a comfortable day goes when the traveller didn't say: by travel mode and kind of riding, shorter with
// children. Used by the trip builder (where nights go) and the planner's distance question (the choices it offers).
import type { TripIntent } from '../types';

export const DEFAULT_DAILY_KM: Record<string, number> = { BICYCLING: 70, WALKING: 22, DRIVING: 300 };
/** A road bike goes further than a mountain bike, a tourer further than an enduro. */
export const RIDE_DAILY_KM: Record<string, number> = { road: 100, gravel: 75, mtb: 50, emtb: 65, touring: 350, adventure: 280, enduro: 170 };
/** Kinds of riding that leave the tarmac (routed off-road, kept easy). */
export const OFFROAD_RIDES = new Set(['gravel', 'mtb', 'emtb', 'adventure', 'enduro']);

export function defaultDailyKm(intent: Pick<TripIntent, 'travelMode' | 'ride' | 'party'>): number {
  const base = (intent.ride && RIDE_DAILY_KM[intent.ride]) || DEFAULT_DAILY_KM[intent.travelMode] || 300;
  return Math.round(intent.party === 'family' ? base * 0.7 : base);
}
