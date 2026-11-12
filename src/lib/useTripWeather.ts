// Each day's weather for the trip: the forecast where the day is within the next 16 days, otherwise what those dates
// are typically like (the last six years at the day's end point). Without a start date, the trip is assumed to
// start today, so the traveller still sees what to expect at this time of year.
import { useEffect, useState } from 'react';
import { forecastFor, typicalWeather, TripDayWeather } from './weather';
import type { ScheduleDay } from './schedule';

type Pt = { lat: number; lng: number };
export interface TripWeather {
  days: (TripDayWeather | null)[];
  /** The dates the days fall on (assumed from today when there's no start date). */
  dates: string[];
  assumedStart: boolean;
  loading: boolean;
}

const addDays = (date: string, n: number) => { const d = new Date(`${date}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const today = () => new Date().toISOString().slice(0, 10);

export function useTripWeather(schedule: ScheduleDay[], dayEnds: (Pt | undefined)[], startDate: string): TripWeather {
  const [state, setState] = useState<TripWeather>({ days: [], dates: [], assumedStart: !startDate, loading: false });
  const key = JSON.stringify([startDate, schedule.map(d => d.kind), dayEnds.map(p => p && [p.lat.toFixed(2), p.lng.toFixed(2)])]);

  useEffect(() => {
    let live = true;
    const start = startDate || today();
    const dates = schedule.map((d, n) => d.date || addDays(start, n));
    if (!schedule.length) { setState({ days: [], dates, assumedStart: !startDate, loading: false }); return; }
    setState(s => ({ ...s, dates, assumedStart: !startDate, loading: true }));
    (async () => {
      const days: (TripDayWeather | null)[] = schedule.map(() => null);
      // The forecast for days in range (only with a real start date: an assumed one gives typical weather).
      if (startDate) {
        await Promise.all(schedule.map(async (_, i) => {
          const at = dayEnds[i];
          if (!at) return;
          const r = await forecastFor(at.lat, at.lng, dates[i]);
          if (r.status === 'ok') days[i] = { kind: 'forecast', weather: r.weather };
        }));
      }
      const rest = schedule.map((_, i) => i).filter(i => !days[i] && dayEnds[i] && dates[i] >= today());
      if (rest.length) {
        const typical = await typicalWeather(rest.map(i => ({ at: dayEnds[i]!, date: dates[i] })));
        rest.forEach((i, k) => { if (typical[k]) days[i] = { kind: 'typical', weather: typical[k]! }; });
      }
      if (live) setState({ days, dates, assumedStart: !startDate, loading: false });
    })();
    return () => { live = false; };
  }, [key]);

  return state;
}
