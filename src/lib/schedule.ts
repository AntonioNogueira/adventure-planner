// Day-by-day schedule (riding days, rest days, dates), booking date checks and costs.
// Pure functions, unit-tested.
import { InterestCategory, StopRef } from '../types';

export interface ScheduleDay {
  kind: 'ride' | 'rest';
  /** YYYY-MM-DD when the trip has a start date. */
  date?: string;
  /** Riding days: index into the route legs. */
  legIndex?: number;
  /** Rest days: index of the stop (waypoint) you stay at. */
  stopIndex?: number;
}

/** Add days to a YYYY-MM-DD date (UTC, so no time-zone shifts). */
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Riding days in order, with rest days after the stops that have them. */
export function buildSchedule(legCount: number, restDays: number[], startDate?: string): ScheduleDay[] {
  const days: ScheduleDay[] = [];
  let offset = 0;
  const dateAt = () => (startDate ? addDays(startDate, offset) : undefined);
  for (let i = 0; i < legCount; i++) {
    days.push({ kind: 'ride', legIndex: i, date: dateAt() });
    offset++;
    if (i < legCount - 1) {
      for (let r = 0; r < (restDays[i] || 0); r++) {
        days.push({ kind: 'rest', stopIndex: i, date: dateAt() });
        offset++;
      }
    }
  }
  return days;
}

/**
 * The nights spent at a stop: arrival date and the morning you leave (YYYY-MM-DD).
 * The start's night is the one before the first day; the finish's is the arrival night.
 */
export function staysByStop(schedule: ScheduleDay[], waypointCount: number) {
  const stays = new Map<string, { checkIn: string; checkOut: string }>();
  const rides = schedule.filter(d => d.kind === 'ride');
  if (!rides.length || !rides[0].date) return stays;
  stays.set('start', { checkIn: addDays(rides[0].date, -1), checkOut: rides[0].date });
  for (let k = 0; k < waypointCount; k++) {
    const arrive = rides[k]?.date;
    const leave = rides[k + 1]?.date;
    if (arrive && leave) stays.set(`stop-${k}`, { checkIn: arrive, checkOut: leave });
  }
  const last = rides[rides.length - 1].date!;
  stays.set('end', { checkIn: last, checkOut: addDays(last, 1) });
  return stays;
}

export const refKey = (ref: StopRef) => ref.kind === 'stop' ? `stop-${ref.index}` : ref.kind;

export interface BookingWarning {
  key: string;          // stop key
  categoryIndex: number;
  itemIndex: number;
  message: string;
}

const pretty = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });

/** Accommodation bookings whose dates don't match the nights the schedule spends at that stop. */
export function bookingWarnings(
  stops: { key: string; label: string; interests: InterestCategory[] }[],
  stays: Map<string, { checkIn: string; checkOut: string }>,
): BookingWarning[] {
  const warnings: BookingWarning[] = [];
  for (const stop of stops) {
    const stay = stays.get(stop.key);
    if (!stay) continue;
    stop.interests.forEach((cat, categoryIndex) => {
      if (!/accommodation|hotel|stay|camp|lodg/i.test(cat.category)) return;
      cat.items.forEach((item, itemIndex) => {
        const checkIn = item.reservation?.checkInDate;
        if (!checkIn) return;
        if (checkIn < stay.checkIn || checkIn >= stay.checkOut) {
          warnings.push({
            key: stop.key, categoryIndex, itemIndex,
            message: `${item.name} is booked from ${pretty(checkIn)}, but the plan has you at ${stop.label} on ${pretty(stay.checkIn)}.`,
          });
        }
      });
    });
  }
  return warnings;
}

/** Total booked cost per currency, e.g. { EUR: 82.5 }. */
export function bookingCosts(allInterests: InterestCategory[][]): Record<string, number> {
  const totals: Record<string, number> = {};
  allInterests.flat().forEach(cat => cat.items.forEach(item => {
    const r = item.reservation;
    if (item.source === 'reservation' && r?.price && r.price > 0) {
      const currency = (r.currency || '').toUpperCase() || '?';
      totals[currency] = Math.round(((totals[currency] || 0) + r.price) * 100) / 100;
    }
  }));
  return totals;
}

export function formatDate(date?: string) {
  return date ? pretty(date) : '';
}
