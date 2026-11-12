// The trip's weather at a glance, under the Adventure brief: an icon and high per day, then a few plain lines
// (temperature range, wet, windy, hot or cold days). Forecast where available, otherwise typical for the dates.
import React from 'react';
import { CloudSun, Loader2 } from 'lucide-react';
import { useSettings } from '../lib/settings';
import { describeWeather, weatherFacts } from '../lib/weather';
import type { TripWeather } from '../lib/useTripWeather';

const list = (days: number[]) => days.slice(0, 4).join(', ') + (days.length > 4 ? '…' : '');

const WeatherBrief: React.FC<{ weather: TripWeather }> = ({ weather }) => {
  const { t, settings, locale, speed } = useSettings();
  const imperial = settings.units === 'imperial';
  const deg = (c: number) => (imperial ? `${Math.round(c * 9 / 5 + 32)}°F` : `${c}°C`);
  const short = (c: number) => `${imperial ? Math.round(c * 9 / 5 + 32) : c}°`;
  const facts = weatherFacts(weather.days);
  const known = weather.days.filter(Boolean);
  if (!known.length) {
    return weather.loading
      ? <p className="mb-4 flex items-center gap-1.5 text-xs text-sky-800"><Loader2 size={12} className="animate-spin" />{t('Looking up the weather for your days…')}</p>
      : null;
  }
  const forecast = known.filter(d => d!.kind === 'forecast').length;
  const month = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString(locale, { month: 'long', timeZone: 'UTC' });
  const months = [...new Set(weather.dates.map(month))].join(' – ');
  const basis = forecast === known.length ? t('Forecast')
    : forecast > 0 ? t('Forecast for the first days, then typical for {months}', { months })
    : weather.assumedStart ? t('Typical for {months} if you left today (add a start date for the forecast)', { months })
    : t('Typical for {months} (the last 6 years)', { months });

  const lines = facts ? [
    t('{min} to {max}.', { min: deg(facts.min), max: deg(facts.max) }),
    facts.wet.length ? t('Rain likely on day {days}.', { days: list(facts.wet) })
      : facts.showery.length ? t('Showers possible on day {days}.', { days: list(facts.showery) }) : t('Mostly dry.'),
    facts.hot.length ? t('Hot afternoons (up to {t}): start early, carry extra water.', { t: deg(facts.max) }) : '',
    facts.cold.length ? t('Cold nights (down to {t}): pack warm layers.', { t: deg(facts.min) }) : '',
    facts.windy.length ? t('Windy on day {days} (up to {w}).', { days: list(facts.windy), w: speed(Math.max(...known.map(d => d!.weather.windMax))) }) : '',
  ].filter(Boolean) : [];

  return (
    <div className="mb-4 rounded-lg border border-sky-200 bg-sky-50/60 p-3 text-xs text-sky-950">
      <div className="mb-1.5 flex items-center gap-1 font-bold uppercase tracking-wider text-sky-900"><CloudSun size={13} />{t('Weather')}</div>
      <p className="mb-2 text-[10.5px] text-sky-800">{basis}</p>
      <div className="mb-2 flex flex-wrap gap-1">
        {weather.days.map((d, i) => {
          if (!d) return <span key={i} className="rounded-md border border-dashed border-sky-200 px-1.5 py-0.5 text-[10px] text-sky-300">{t('Day {n}', { n: i + 1 })}</span>;
          const { emoji, label } = describeWeather(d.weather.code);
          return (
            <span key={i} title={`${t('Day {n}', { n: i + 1 })}: ${t(label)}, ${short(d.weather.tempMax)}/${short(d.weather.tempMin)}${d.weather.rainChance != null ? `, ${t('rain {p}%', { p: d.weather.rainChance })}` : ''}${d.kind === 'typical' ? ` (${t('typical')})` : ''}`}
              className={`flex flex-col items-center rounded-md px-1.5 py-0.5 leading-tight ${d.kind === 'forecast' ? 'bg-white shadow-sm' : 'border border-dashed border-sky-300 bg-white/60'}`}>
              <span className="text-[9px] font-semibold text-sky-700">{i + 1}</span>
              <span className="text-base leading-none">{emoji}</span>
              <span className="text-[10px] font-semibold tabular-nums">{short(d.weather.tempMax)}</span>
            </span>
          );
        })}
      </div>
      <p className="leading-relaxed">{lines.join(' ')}</p>
    </div>
  );
};

export default WeatherBrief;
