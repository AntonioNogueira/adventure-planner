import { describe, expect, it } from 'vitest';
import { arc, kmBetween, simplify, slug } from '../journeyBuild';
import { sectionPrompt, ON_ROAD } from '../inspiration';
import { cleanJourney, cleanStyle } from '../../../server/plan-api';

describe('journey lines', () => {
  it('measures great-circle distances', () => {
    expect(Math.round(kmBetween([59.56, 150.8], [61.22, -149.9]))).toBeGreaterThan(3000); // Magadan → Anchorage
    expect(Math.round(kmBetween([38.72, -9.14], [38.72, -9.14]))).toBe(0);
  });
  it('draws a flight as a curve that starts and ends at the airports', () => {
    const line = arc([59.56, 150.8], [61.22, -149.9], 10);
    expect(line).toHaveLength(11);
    expect(line[0][0]).toBeCloseTo(59.56, 3);
    expect(line[10][1]).toBeCloseTo(-149.9, 3);
    // Across the Bering Sea it bows north of both ends.
    expect(Math.max(...line.map(p => p[0]))).toBeGreaterThan(62);
  });
  it('simplifies a straight run to its ends but keeps corners', () => {
    const straight = Array.from({ length: 50 }, (_, i) => [0, i * 0.01] as [number, number]);
    expect(simplify(straight)).toHaveLength(2);
    const corner = [...straight, [0.5, 0.49] as [number, number]];
    expect(simplify(corner).length).toBe(3);
  });
  it('makes a readable id', () => {
    expect(slug('Jupiter\'s Travels: Around the World')).toBe('jupiter-s-travels-around-the-world');
  });
  it('plans a stretch of a journey with its vehicle', () => {
    const from = { name: 'Road of Bones', place: 'Susuman, Russia', at: [0, 0] as [number, number], text: '' };
    const to = { name: 'Magadan', place: 'Magadan, Russia', at: [0, 0] as [number, number], text: '' };
    expect(sectionPrompt({ title: 'Long Way Round', kind: 'moto' }, from, to)).toBe('Susuman, Russia to Magadan, Russia by adventure motorcycle, following Long Way Round');
    expect(ON_ROAD.has('flight')).toBe(false);
  });
});

describe('importing a journey (server)', () => {
  it('keeps only stops with a name and a place, and sensible values', () => {
    const j = cleanJourney({
      title: 'A ride', kind: 'spaceship', summary: 'x', sourceLabel: '',
      stops: [{ name: 'Start', place: 'Lisbon, Portugal', by: 'flight', text: 'go' }, { name: '', place: 'Nowhere' }, { name: 'Porto', place: 'Porto, Portugal', by: 'teleport', text: 'end' }],
    }, 'https://example.com/story');
    expect(j.kind).toBe('other');
    expect(j.stops.map(s => s.name)).toEqual(['Start', 'Porto']);
    expect(j.stops[0].by).toBe('ride'); // the first stop is the start
    expect(j.stops[1].by).toBe('ride'); // unknown ways of travelling become riding
    expect(j.sources[0]).toEqual({ label: 'example.com', url: 'https://example.com/story' });
  });
});

describe('trip style (server)', () => {
  it('drops a bike kind on a moto trip and "none" answers, and checks vehicle figures', () => {
    const intent = cleanStyle({ travelMode: 'DRIVING', vehicle: 'motorcycle', ride: 'gravel', party: 'none', budgetStyle: 'comfort',
      interests: ['nature', 'nature', 'shopping'], vehicleModel: ' KTM 500 EXC ', vehicleInfo: { litresPer100km: 5.5, tankLitres: 0, rangeKm: 150, notes: ['Small tank', ''] } });
    expect(intent).toMatchObject({ ride: '', party: '', budgetStyle: 'comfort', interests: ['nature'], vehicleModel: 'KTM 500 EXC' });
    expect(intent.vehicleInfo).toEqual({ litresPer100km: 5.5, tankLitres: undefined, rangeKm: 150, notes: ['Small tank'] });
    expect(cleanStyle({ travelMode: 'BICYCLING', ride: 'mtb', vehicleInfo: { notes: [] } })).toMatchObject({ ride: 'mtb' });
  });
});
