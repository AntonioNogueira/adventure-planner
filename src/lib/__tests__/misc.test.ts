import { describe, expect, it, vi, afterEach } from 'vitest';
import { buildGpx, gpxFileName } from '../gpx';
import { mergeSuggestions, keepReservations } from '../suggestions';
import { formatDistance, formatDuration } from '../utils';
import { describeWeather, forecastFor } from '../weather';
import { categoryId } from '../places';
import { decodeTextFile, describeIntent } from '../../../server/plan-api';
import { InterestCategory } from '../../types';

describe('gpx', () => {
  it('writes tracks and waypoints and escapes names', () => {
    const gpx = buildGpx('Cádiz & Silves', [{ name: 'Day 1', points: [{ lat: 1, lng: 2 }, { lat: 1.5, lng: 2.5 }] }], [{ name: 'Night <1>', lat: 1.5, lng: 2.5 }]);
    expect(gpx).toContain('<name>Cádiz &amp; Silves</name>');
    expect(gpx).toContain('<name>Night &lt;1&gt;</name>');
    expect(gpx.match(/<trkpt /g)).toHaveLength(2);
    expect(gpx).toContain('lat="1.500000" lon="2.500000"');
  });
  it('makes safe file names', () => {
    expect(gpxFileName('Cádiz, Spain to Silves day 2')).toBe('Cadiz-Spain-to-Silves-day-2.gpx');
    expect(gpxFileName('???')).toBe('route.gpx');
  });
});

describe('suggestions', () => {
  const booking = { name: 'My hotel', source: 'reservation' as const };
  const old: InterestCategory[] = [
    { category: 'Stay', items: [booking, { name: 'Old suggestion', source: 'places' }] },
    { category: 'Points of interest', items: [{ name: 'Boat trip', source: 'reservation' }] },
  ];
  it('replaces suggestions but keeps bookings first', () => {
    const merged = mergeSuggestions(old, [{ category: 'Stay', items: [{ name: 'New suggestion', source: 'places' }] }]);
    expect(merged[0].items.map(i => i.name)).toEqual(['My hotel', 'New suggestion']);
    expect(merged.find(c => c.category === 'Points of interest')?.items[0].name).toBe('Boat trip');
  });
  it('keepReservations drops empty categories', () => {
    expect(keepReservations([{ category: 'Food', items: [{ name: 'x', source: 'places' }] }])).toEqual([]);
  });
});

describe('formatting', () => {
  it('formats distances and durations', () => {
    expect(formatDistance(850)).toBe('850 m');
    expect(formatDistance(62_400)).toBe('62.4 km');
    expect(formatDistance(310_000)).toBe('310 km');
    expect(formatDuration(45 * 60)).toBe('45 min');
    expect(formatDuration(3 * 3600 + 5 * 60)).toBe('3 h 5 min');
    expect(formatDuration(26 * 3600)).toBe('1 d 2 h');
  });
});

describe('weather', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('describes weather codes', () => {
    expect(describeWeather(0).label).toBe('Clear');
    expect(describeWeather(63).label).toBe('Rain');
    expect(describeWeather(95).label).toBe('Thunderstorm');
  });
  it('skips past dates and dates beyond the 16-day forecast without calling the API', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    expect((await forecastFor(1, 1, '2000-01-01')).status).toBe('past');
    const far = await forecastFor(1, 1, '2999-01-01');
    expect(far.status).toBe('too-far');
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('reads a forecast', async () => {
    const today = new Date().toISOString().slice(0, 10);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ daily: { time: [today], weather_code: [61], temperature_2m_max: [19.4], temperature_2m_min: [11.2], precipitation_probability_max: [60], wind_speed_10m_max: [24.1] } }),
    }));
    expect(await forecastFor(37.19, -8.44, today)).toEqual({
      status: 'ok', weather: { code: 61, tempMax: 19, tempMin: 11, rainChance: 60, windMax: 24 },
    });
  });
});

describe('categories', () => {
  it('maps names to the four categories', () => {
    expect(categoryId('Stay')).toBe('stay');
    expect(categoryId('Food')).toBe('food');
    expect(categoryId('Shops & repairs')).toBe('shop');
    expect(categoryId('Points of interest')).toBe('sights');
  });
});

describe('server helpers', () => {
  it('turns an email into text without attachments or markup', () => {
    const eml = ['Subject: Booking', '', '<p>Hotel <b>Sol</b></p>', ...Array(4).fill('A'.repeat(76))].join('\n');
    const text = decodeTextFile(Buffer.from(eml).toString('base64'));
    expect(text).toContain('Hotel Sol');
    expect(text).toContain('[binary data removed]');
    expect(text).not.toContain('<b>');
  });
  it('summarises what the AI understood', () => {
    expect(describeIntent({
      origin: 'Cádiz', destination: 'Silves', travelMode: 'BICYCLING', days: 0, dailyKm: 60,
      route: [{ place: 'Huelva', overnight: true }], lodging: 'any',
    })).toBe('Cádiz → Huelva (night) → Silves · BICYCLING · 60 km/day · lodging any');
  });
});
