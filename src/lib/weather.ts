// Daily forecasts from Open-Meteo (free, no key; forecasts reach 16 days ahead).

export interface DayWeather {
  code: number;
  tempMax: number;
  tempMin: number;
  rainChance: number | null;
  windMax: number;
}

export type WeatherResult =
  | { status: 'ok'; weather: DayWeather }
  | { status: 'too-far'; availableFrom: string }
  | { status: 'past' | 'unavailable' };

const FORECAST_DAYS = 16;

/** Short label and emoji for a WMO weather code. */
export function describeWeather(code: number): { emoji: string; label: string } {
  if (code === 0) return { emoji: '☀️', label: 'Clear' };
  if (code <= 2) return { emoji: '🌤', label: 'Partly cloudy' };
  if (code === 3) return { emoji: '☁️', label: 'Cloudy' };
  if (code <= 48) return { emoji: '🌫', label: 'Fog' };
  if (code <= 57) return { emoji: '🌦', label: 'Drizzle' };
  if (code <= 67) return { emoji: '🌧', label: 'Rain' };
  if (code <= 77) return { emoji: '🌨', label: 'Snow' };
  if (code <= 82) return { emoji: '🌦', label: 'Showers' };
  if (code <= 86) return { emoji: '🌨', label: 'Snow showers' };
  return { emoji: '⛈', label: 'Thunderstorm' };
}

const cache = new Map<string, Promise<WeatherResult>>();

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function forecastFor(lat: number, lng: number, date: string): Promise<WeatherResult> {
  const key = `${lat.toFixed(2)},${lng.toFixed(2)},${date}`;
  if (!cache.has(key)) {
    const pending = fetchForecast(lat, lng, date);
    cache.set(key, pending);
    // Don't remember failures (e.g. a rate limit), so a later render can try again.
    pending.then(r => { if (r.status === 'unavailable') cache.delete(key); });
  }
  return cache.get(key)!;
}

async function fetchForecast(lat: number, lng: number, date: string): Promise<WeatherResult> {
  const now = today();
  if (date < now) return { status: 'past' };
  const last = new Date(`${now}T00:00:00Z`);
  last.setUTCDate(last.getUTCDate() + FORECAST_DAYS - 1);
  const lastDay = last.toISOString().slice(0, 10);
  if (date > lastDay) {
    const from = new Date(`${date}T00:00:00Z`);
    from.setUTCDate(from.getUTCDate() - (FORECAST_DAYS - 1));
    return { status: 'too-far', availableFrom: from.toISOString().slice(0, 10) };
  }
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}`
      + '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max'
      + `&timezone=auto&start_date=${date}&end_date=${date}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return { status: 'unavailable' };
    const data = await res.json();
    const d = data.daily;
    if (!d?.time?.length) return { status: 'unavailable' };
    return {
      status: 'ok',
      weather: {
        code: d.weather_code[0],
        tempMax: Math.round(d.temperature_2m_max[0]),
        tempMin: Math.round(d.temperature_2m_min[0]),
        rainChance: d.precipitation_probability_max?.[0] ?? null,
        windMax: Math.round(d.wind_speed_10m_max[0]),
      },
    };
  } catch {
    return { status: 'unavailable' };
  }
}

// ---- Typical weather (what the same dates were like in recent years), for days beyond the forecast ----

const ARCHIVE = 'https://archive-api.open-meteo.com/v1/archive';
const YEARS = 6;
const WINDOW = 3; // days either side of the date

type Pt = { lat: number; lng: number };
const iso = (d: Date) => d.toISOString().slice(0, 10);
const shiftDays = (date: string, days: number) => { const d = new Date(`${date}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + days); return iso(d); };
const shiftYears = (date: string, years: number) => { const d = new Date(`${date}T00:00:00Z`); d.setUTCFullYear(d.getUTCFullYear() - years); return iso(d); };
const dayDiff = (a: string, b: string) => Math.round((Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / 86_400_000);

interface ArchiveDaily { time: string[]; temperature_2m_max: number[]; temperature_2m_min: number[]; precipitation_sum: number[]; wind_speed_10m_max: number[]; sunshine_duration?: number[]; daylight_duration?: number[] }

/** A weather code standing for typical conditions: rain or showers if wet days are common, else sun or cloud. */
export function typicalCode(rainChance: number, sunny: number, tempMax: number): number {
  if (rainChance >= 25 && tempMax < 2) return 71;
  if (rainChance >= 50) return 61;
  if (rainChance >= 25) return 80;
  if (sunny >= 0.7) return 0;
  if (sunny >= 0.45) return 2;
  return 3;
}

/** Averages of the samples around one date: temperatures, wind, the share of wet days (≥1 mm) as a rain chance. */
export function summarizeSamples(s: { tMax: number; tMin: number; rain: number; wind: number; sunny?: number }[]): DayWeather | null {
  const ok = s.filter(x => Number.isFinite(x.tMax) && Number.isFinite(x.tMin));
  if (ok.length < 3) return null;
  const avg = (f: (x: typeof ok[0]) => number) => ok.reduce((n, x) => n + f(x), 0) / ok.length;
  const rainChance = Math.round((100 * ok.filter(x => x.rain >= 1).length) / ok.length);
  const sunnyList = ok.filter(x => x.sunny != null && Number.isFinite(x.sunny));
  const sunny = sunnyList.length ? sunnyList.reduce((n, x) => n + x.sunny!, 0) / sunnyList.length : 0.5;
  const tempMax = Math.round(avg(x => x.tMax));
  return { code: typicalCode(rainChance, sunny, tempMax), tempMax, tempMin: Math.round(avg(x => x.tMin)), rainChance, windMax: Math.round(avg(x => x.wind)) };
}

const typicalCache = new Map<string, Promise<(DayWeather | null)[]>>();

/** For each (place, date): the typical weather of those dates over the last six years. One request per year. */
export function typicalWeather(days: { at: Pt; date: string }[]): Promise<(DayWeather | null)[]> {
  const key = days.map(d => `${d.at.lat.toFixed(2)},${d.at.lng.toFixed(2)},${d.date.slice(5)}`).join('|');
  if (!typicalCache.has(key)) {
    const pending = fetchTypical(days);
    typicalCache.set(key, pending);
    pending.then(r => { if (r.every(x => !x)) typicalCache.delete(key); }, () => typicalCache.delete(key));
  }
  return typicalCache.get(key)!;
}

async function fetchTypical(days: { at: Pt; date: string }[]): Promise<(DayWeather | null)[]> {
  if (!days.length) return [];
  // One request per year for all the places (Open-Meteo answers several at once).
  const places = [...new Map(days.map(d => [`${d.at.lat.toFixed(2)},${d.at.lng.toFixed(2)}`, d.at])).entries()];
  const index = new Map(places.map(([k], i) => [k, i]));
  const dates = days.map(d => d.date).sort();
  const first = shiftDays(dates[0], -WINDOW), last = shiftDays(dates[dates.length - 1], WINDOW);
  const thisYear = new Date().getUTCFullYear();
  const samples: { tMax: number; tMin: number; rain: number; wind: number; sunny?: number }[][] = days.map(() => []);
  await Promise.all(Array.from({ length: YEARS }, async (_, k) => {
    // Whole years back, so the archive (a few days behind) always has the dates.
    const back = Math.max(1, thisYear - Number(first.slice(0, 4))) + k;
    const url = `${ARCHIVE}?latitude=${places.map(([, p]) => p.lat.toFixed(3)).join(',')}&longitude=${places.map(([, p]) => p.lng.toFixed(3)).join(',')}`
      + `&start_date=${shiftYears(first, back)}&end_date=${shiftYears(last, back)}`
      + '&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,sunshine_duration,daylight_duration&timezone=auto';
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) return;
      const data = await res.json();
      const list: { daily?: ArchiveDaily }[] = Array.isArray(data) ? data : [data];
      days.forEach((d, i) => {
        const daily = list[index.get(`${d.at.lat.toFixed(2)},${d.at.lng.toFixed(2)}`)!]?.daily;
        if (!daily) return;
        const target = shiftYears(d.date, back);
        daily.time.forEach((t, j) => {
          if (Math.abs(dayDiff(t, target)) > WINDOW) return;
          const sun = daily.sunshine_duration?.[j], light = daily.daylight_duration?.[j];
          samples[i].push({
            tMax: daily.temperature_2m_max[j], tMin: daily.temperature_2m_min[j], rain: daily.precipitation_sum[j] ?? 0,
            wind: daily.wind_speed_10m_max[j] ?? 0, sunny: sun != null && light ? sun / light : undefined,
          });
        });
      });
    } catch { /* one year missing is fine */ }
  }));
  return samples.map(summarizeSamples);
}

// ---- A short summary for the trip ----

export interface TripDayWeather { kind: 'forecast' | 'typical'; weather: DayWeather }

/** Facts for the brief: temperature range, wet, windy, hot and cold days (day numbers from 1). */
export function weatherFacts(days: (TripDayWeather | null)[]) {
  const known = days.map((d, i) => d && { ...d.weather, day: i + 1 }).filter((d): d is DayWeather & { day: number } => Boolean(d));
  if (!known.length) return null;
  return {
    min: Math.min(...known.map(d => d.tempMin)),
    max: Math.max(...known.map(d => d.tempMax)),
    wet: known.filter(d => (d.rainChance ?? 0) >= 50).map(d => d.day),
    showery: known.filter(d => (d.rainChance ?? 0) >= 30 && (d.rainChance ?? 0) < 50).map(d => d.day),
    windy: known.filter(d => d.windMax >= 40).map(d => d.day),
    hot: known.filter(d => d.tempMax >= 32).map(d => d.day),
    cold: known.filter(d => d.tempMin <= 3).map(d => d.day),
  };
}
