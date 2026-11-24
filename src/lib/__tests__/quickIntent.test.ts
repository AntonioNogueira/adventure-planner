import { describe, expect, it } from 'vitest';
import { parseQuickIntent } from '../../../server/quickIntent';

describe('quick plan without the AI', () => {
  it('reads "lisbon to porto bikepacking"', () => {
    const q = parseQuickIntent('lisbon to porto bikepacking')!;
    expect(q.origin).toBe('Lisbon');
    expect(q.destination).toBe('Porto');
    expect(q.travelMode).toBe('BICYCLING');
    expect(q.lodging).toBe('camping');
    expect(q.offroad).toBe(true);
  });

  it('reads days, mode, lodging and places to pass', () => {
    const q = parseQuickIntent('From Porto to Lisbon along the coast by gravel bike in 5 days, camping, via Aveiro, Figueira da Foz and Nazaré')!;
    expect([q.origin, q.destination, q.days, q.travelMode, q.lodging]).toEqual(['Porto', 'Lisbon', 5, 'BICYCLING', 'camping']);
    expect(q.route.map(r => r.place)).toEqual(['Aveiro', 'Figueira Da Foz', 'Nazaré']);
  });

  it('reads Portuguese', () => {
    const q = parseQuickIntent('De Chaves a Faro de mota em quatro dias, alojamento em pensões')!;
    expect([q.origin, q.destination, q.days, q.travelMode, q.vehicle, q.lodging]).toEqual(['Chaves', 'Faro', 4, 'DRIVING', 'motorcycle', 'hotel']);
  });

  it('reads weeks, km a day and loops', () => {
    expect(parseQuickIntent('Ruta 40 from Ushuaia to Salta on a motorcycle, 3 weeks')!.days).toBe(21);
    const k = parseQuickIntent('Lyon to Marseille by bike, 80 km a day')!;
    expect([k.dailyKm, k.days]).toEqual([80, 0]);
    const loop = parseQuickIntent('a 3 day bikepacking loop from Braga')!;
    expect([loop.origin, loop.destination, loop.days]).toEqual(['Braga', 'Braga', 3]);
  });

  it('applies a change to the trip on the map', () => {
    const q = parseQuickIntent('make it 6 days and hotels', { origin: 'Porto', destination: 'Lisbon', travelMode: 'BICYCLING', days: 5, lodging: 'camping' })!;
    expect([q.origin, q.destination, q.days, q.lodging, q.travelMode]).toEqual(['Porto', 'Lisbon', 6, 'hotel', 'BICYCLING']);
  });

  it('gives up when there is no trip to read', () => {
    expect(parseQuickIntent('what is the best season?')).toBeNull();
  });
});
