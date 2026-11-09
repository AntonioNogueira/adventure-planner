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
