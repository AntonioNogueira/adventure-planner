// The trip's weather as a sentence for the Adventure brief: temperature range, wet, windy, hot or cold days.
// Forecast where available, otherwise typical for the dates. (Each day's icon is in the itinerary.)
import { useSettings } from '../lib/settings';
import { weatherFacts } from '../lib/weather';
import type { TripWeather } from '../lib/useTripWeather';

const list = (days: number[]) => days.slice(0, 4).join(', ') + (days.length > 4 ? '…' : '');

/** The trip's weather in one or two plain sentences for the Adventure brief (forecast or typical for the dates). */
export function useWeatherSentence(weather: TripWeather): string {
  const { t, settings, locale, speed } = useSettings();
  const imperial = settings.units === 'imperial';
  const deg = (c: number) => (imperial ? `${Math.round(c * 9 / 5 + 32)}°F` : `${c}°C`);
  const facts = weatherFacts(weather.days);
  const known = weather.days.filter(Boolean);
  if (!facts || !known.length) return '';
  const forecast = known.filter(d => d!.kind === 'forecast').length;
  const month = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString(locale, { month: 'long', timeZone: 'UTC' });
  const months = [...new Set(weather.dates.map(month))].join(' – ');
  const basis = forecast === known.length ? t('Weather forecast')
    : weather.assumedStart ? t('Typical weather for {months} (add a start date for the forecast)', { months })
    : t('Typical weather for {months}', { months });
  const parts = [
    t('{min} to {max}', { min: deg(facts.min), max: deg(facts.max) }),
    facts.wet.length ? t('rain likely on day {days}', { days: list(facts.wet) })
      : facts.showery.length ? t('showers possible on day {days}', { days: list(facts.showery) }) : t('mostly dry'),
    facts.hot.length ? t('hot afternoons, so start early and carry extra water') : '',
    facts.cold.length ? t('cold nights, so pack warm layers') : '',
    facts.windy.length ? t('windy on day {days} (up to {w})', { days: list(facts.windy), w: speed(Math.max(...known.map(d => d!.weather.windMax))) }) : '',
  ].filter(Boolean);
  return `${basis}: ${parts.join(', ')}.`;
}
