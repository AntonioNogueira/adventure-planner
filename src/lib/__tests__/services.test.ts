import { describe, expect, it } from 'vitest';
import { resolveServices, PUBLIC_SERVICES } from '../services';
import { photonElement, classify, toItem } from '../overpass';

describe('service addresses', () => {
  it('uses the free public servers when nothing is set', () => {
    expect(resolveServices()).toEqual(PUBLIC_SERVICES);
    expect(resolveServices({ overpass: '' }).overpass).toEqual(PUBLIC_SERVICES.overpass);
  });
  it('takes own servers from the settings, in order, without trailing slashes', () => {
    const s = resolveServices({ overpass: 'https://osm.example.com/api/interpreter/, https://backup.example.com/api/interpreter', photon: 'https://photon.example.com/' });
    expect(s.overpass).toEqual(['https://osm.example.com/api/interpreter', 'https://backup.example.com/api/interpreter']);
    expect(s.photon).toBe('https://photon.example.com');
    expect(s.brouter).toBe(PUBLIC_SERVICES.brouter);
    expect(resolveServices({ overpass: ['https://a.example.com'] }).overpass).toEqual(['https://a.example.com']);
  });
});

describe('places from Photon (fallback)', () => {
  const hotel = { geometry: { coordinates: [-7.91, 38.57] as [number, number] },
    properties: { osm_type: 'W', osm_id: '42', osm_key: 'tourism', osm_value: 'guest_house', name: 'Casa dos Teles', street: 'Rua X', city: 'Évora' } };
  it('reads a Photon place like an Overpass one', () => {
    const e = photonElement(hotel)!;
    expect(e).toMatchObject({ type: 'way', id: 42, lat: 38.57, lon: -7.91 });
    expect(classify(e.tags!)).toBe('stay');
    const item = toItem(e, 'stay')!;
    expect(item).toMatchObject({ name: 'Casa dos Teles', stayKind: 'guesthouse', placeId: 'osm:way/42' });
    expect(item.description).toContain('Évora');
  });
  it('skips places without a name', () => {
    expect(photonElement({ ...hotel, properties: { ...hotel.properties, name: undefined } })).toBeNull();
  });
});

import { pickNominatim, nominatimTown } from '../geocode';
import { updateSettings } from '../settings';

describe('Nominatim (backup place names)', () => {
  it('prefers the town over a station or street of the same name', () => {
    expect(pickNominatim([
      { lat: '40.27', lon: '-7.50', category: 'railway', type: 'station' },
      { lat: '40.2810', lon: '-7.5045', category: 'place', type: 'city' },
    ])).toEqual({ lat: 40.281, lng: -7.5045 });
    expect(pickNominatim([])).toBeNull();
  });
  it('names a position by its town, or the area in the countryside', () => {
    updateSettings({ language: 'en' });
    expect(nominatimTown({ lat: '0', lon: '0', address: { town: 'Covilhã', country: 'Portugal' } })).toBe('Covilhã, Portugal');
    expect(nominatimTown({ lat: '0', lon: '0', address: { county: 'Covilhã', country: 'Portugal' } })).toBe('Near Covilhã, Portugal');
    expect(nominatimTown(null)).toBeNull();
  });
});

import { pickPhoton, townPoint } from '../geocode';

describe('town lookups (Photon)', () => {
  const f = (name: string, key: string, value: string, type: string, lng: number, lat: number) =>
    ({ geometry: { coordinates: [lng, lat] as [number, number] }, properties: { name, osm_key: key, osm_value: value, type } });
  // What Photon answers for "Silves, Portugal": the municipality first (its middle is in the hills), then the station.
  const silves = [
    f('Silves', 'boundary', 'administrative', 'city', -8.3487, 37.2640),
    f('Silves', 'railway', 'stop', 'house', -8.4405, 37.1757),
    f('Silves', 'boundary', 'administrative', 'city', -8.4366, 37.2242),
  ];
  const places = [
    f('Silves', 'place', 'city', 'district', -8.4396, 37.1894),
    f('Vale de Silves', 'place', 'hamlet', 'district', -8.1384, 37.1583),
    f('São Silvestre', 'place', 'village', 'district', -8.5264, 40.2301),
  ];
  it("doesn't use a municipality's middle as the town", () => {
    const { point, area } = pickPhoton(silves);
    expect(point).toBeNull();
    expect(townPoint(places, 'Silves, Portugal', area!)).toEqual({ lat: 37.1894, lng: -8.4396 });
  });
  it('takes a town straight away when Photon has one', () => {
    expect(pickPhoton([silves[1], places[0]]).point).toEqual({ lat: 37.1894, lng: -8.4396 });
  });
  it('ignores a same-name place far away', () => {
    expect(townPoint([f('Silves', 'place', 'town', 'city', -47.8, -3.1)], 'Silves, Portugal', silves[0])).toBeNull();
  });
});
