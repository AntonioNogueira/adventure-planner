import { afterEach, describe, expect, it, vi } from 'vitest';
import { summarizeSamples, typicalCode, typicalWeather, weatherFacts } from '../weather';

describe('typical weather', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('turns past days into averages, with wet days as the rain chance', () => {
    const days = Array.from({ length: 10 }, (_, i) => ({ tMax: 20 + (i % 3), tMin: 10, rain: i < 3 ? 5 : 0, wind: 20, sunny: 0.8 }));
    expect(summarizeSamples(days)).toEqual({ code: 80, tempMax: 21, tempMin: 10, rainChance: 30, windMax: 20 });
    expect(summarizeSamples(days.slice(0, 2))).toBeNull(); // too few samples to say
  });

  it('picks an icon from wet days and sunshine', () => {
    expect(typicalCode(60, 0.9, 18)).toBe(61); // rain
    expect(typicalCode(10, 0.8, 25)).toBe(0); // sunny
    expect(typicalCode(10, 0.5, 15)).toBe(2); // partly cloudy
    expect(typicalCode(40, 0.2, 0)).toBe(71); // snow
  });

  it('asks once per year for all places, and averages the same dates over the years', async () => {
    const answer = (url: string) => {
      const start = new URL(url).searchParams.get('start_date')!;
      const time = Array.from({ length: 9 }, (_, i) => { const d = new Date(`${start}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + i); return d.toISOString().slice(0, 10); });
      const place = (tMax: number) => ({ daily: { time, temperature_2m_max: time.map(() => tMax), temperature_2m_min: time.map(() => tMax - 10), precipitation_sum: time.map(() => 0), wind_speed_10m_max: time.map(() => 15), sunshine_duration: time.map(() => 40000), daylight_duration: time.map(() => 50000) } });
      return [place(24), place(30)];
    };
    const fetchMock = vi.fn(async (url: string) => new Response(JSON.stringify(answer(url))));
    vi.stubGlobal('fetch', fetchMock);
    const result = await typicalWeather([
      { at: { lat: 36.53, lng: -6.29 }, date: '2027-05-10' },
      { at: { lat: 37.19, lng: -8.44 }, date: '2027-05-12' },
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(6);
    expect(String(fetchMock.mock.calls[0][0])).toContain('latitude=36.530,37.190');
    expect(result.map(r => r?.tempMax)).toEqual([24, 30]);
    expect(result[0]).toMatchObject({ code: 0, rainChance: 0 });
  });
});

describe('weather facts for the brief', () => {
  it('finds the temperature range and the wet, windy, hot and cold days', () => {
    const w = (tempMax: number, tempMin: number, rainChance: number, windMax: number) => ({ kind: 'typical' as const, weather: { code: 0, tempMax, tempMin, rainChance, windMax } });
    const f = weatherFacts([w(24, 12, 10, 20), w(33, 18, 60, 45), null, w(15, 2, 35, 10)]);
    expect(f).toEqual({ min: 2, max: 33, wet: [2], showery: [4], windy: [2], hot: [2], cold: [4] });
    expect(weatherFacts([null])).toBeNull();
  });
});
